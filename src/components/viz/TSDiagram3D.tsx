import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  ScatterChart, 
  RotateCw, 
  Layers, 
  Sliders, 
  Compass, 
  Activity, 
  Droplets, 
  Thermometer, 
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import type { FloatSummary } from '../../types';

interface TSDiagram3DProps {
  floats: FloatSummary[];
}

interface WaterMassDefinition {
  id: string;
  name: string;
  code: string;
  colorHex: number;
  colorCss: string;
  salinityRange: [number, number]; // [min, max] PSU
  tempRange: [number, number];     // [min, max] °C
  depthRange: [number, number];    // [min, max] m
  description: string;
  coreOrigin: string;
}

const WATER_MASSES: WaterMassDefinition[] = [
  {
    id: 'ashsw',
    name: 'Arabian Sea High Salinity Water',
    code: 'ASHSW',
    colorHex: 0xef4444, // Red
    colorCss: '#ef4444',
    salinityRange: [35.8, 36.9],
    tempRange: [24.0, 29.5],
    depthRange: [0, 150],
    description: 'Formed in the northern Arabian Sea by intense arid evaporation. Forms a dense, warm, high-salinity core that spreads southward.',
    coreOrigin: 'Northern Arabian Sea (20°–24°N)',
  },
  {
    id: 'bblsw',
    name: 'Bay of Bengal Low Salinity Water',
    code: 'BBLSW',
    colorHex: 0x22c55e, // Emerald Green
    colorCss: '#22c55e',
    salinityRange: [31.5, 33.8],
    tempRange: [27.0, 30.2],
    depthRange: [0, 80],
    description: 'Created by massive freshwater discharge from the Ganges, Brahmaputra, and Irrawaddy rivers, forming a buoyant shallow lens.',
    coreOrigin: 'Northern Bay of Bengal (18°–22°N)',
  },
  {
    id: 'rsow',
    name: 'Red Sea Outflow Water',
    code: 'RSOW',
    colorHex: 0xa855f7, // Purple
    colorCss: '#a855f7',
    salinityRange: [35.6, 37.4],
    tempRange: [12.0, 19.5],
    depthRange: [500, 1000],
    description: 'Extremely saline, warm overflow spilling from Bab-el-Mandeb into the Gulf of Aden and subducting to intermediate depths.',
    coreOrigin: 'Bab-el-Mandeb Strait & Gulf of Aden',
  },
  {
    id: 'aaiw',
    name: 'Antarctic Intermediate Water',
    code: 'AAIW',
    colorHex: 0x3b82f6, // Ocean Blue
    colorCss: '#3b82f6',
    salinityRange: [34.4, 34.9],
    tempRange: [4.0, 9.5],
    depthRange: [800, 1500],
    description: 'Cold, low-salinity sub-Antarctic water subducted at the Antarctic Convergence and spreading northward across the Indian Ocean.',
    coreOrigin: 'Southern Ocean Sub-Antarctic Front',
  },
  {
    id: 'idw',
    name: 'Indian Ocean Deep Water',
    code: 'IDW',
    colorHex: 0x06b6d4, // Cyan
    colorCss: '#06b6d4',
    salinityRange: [34.68, 34.80],
    tempRange: [1.8, 3.5],
    depthRange: [1500, 2000],
    description: 'Near-freezing abyssal water filling the deep central and eastern Indian Ocean basins along the global overturning current.',
    coreOrigin: 'Global Abyssal Overturning Flow',
  },
];

// Simplified UNESCO Equation of State approximation for Seawater Potential Density anomaly (sigma-theta, kg/m^3)
function calculateSigmaTheta(tempC: number, salPsu: number): number {
  return (
    28.14 -
    0.0735 * tempC -
    0.00469 * Math.pow(tempC, 2) +
    0.802 * (salPsu - 35.0)
  );
}

interface DataPoint {
  x: number; // Salinity normalized to 3D
  y: number; // Temp normalized to 3D
  z: number; // Depth normalized to 3D
  temp: number;
  sal: number;
  depth: number;
  sigmaTheta: number;
  waterMass: WaterMassDefinition;
  floatId: string;
}

export const TSDiagram3D: React.FC<TSDiagram3DProps> = ({ floats }) => {
  const [activeWaterMasses, setActiveWaterMasses] = useState<string[]>(
    WATER_MASSES.map((wm) => wm.id)
  );
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);

  // Toggle active filter
  const toggleWaterMass = (id: string) => {
    setActiveWaterMasses((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Perspective Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020713);
    scene.fog = new THREE.FogExp2(0x020713, 0.02);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(22, 16, 26);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.0);
    sunLight.position.set(20, 30, 20);
    scene.add(sunLight);

    const rootGroup = new THREE.Group();

    // 3. 3D Bounding Coordinate Box (X: Salinity, Y: Temperature, Z: Depth)
    const boxSize = 14;
    const boxGeom = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0x1e3a5f, transparent: true, opacity: 0.6 })
    );
    rootGroup.add(boxWireframe);

    // Subtle internal grid planes
    const gridHelper = new THREE.GridHelper(boxSize, 6, 0x06b6d4, 0x0f2942);
    gridHelper.position.y = -boxSize / 2;
    rootGroup.add(gridHelper);

    // 4. Generate & Synthesize Scatter Points calibrated from Active Water Masses
    const pointCount = 1200;
    const pointsData: DataPoint[] = [];

    const positions: number[] = [];
    const colors: number[] = [];

    // Synthesize realistic hydrographic clusters
    for (let i = 0; i < pointCount; i++) {
      // Pick a water mass category randomly
      const wm = WATER_MASSES[Math.floor(Math.random() * WATER_MASSES.length)];

      if (!activeWaterMasses.includes(wm.id)) continue;

      // Realistic random variation within water mass bounds
      const sal = wm.salinityRange[0] + Math.random() * (wm.salinityRange[1] - wm.salinityRange[0]);
      const temp = wm.tempRange[0] + Math.random() * (wm.tempRange[1] - wm.tempRange[0]);
      const depth = wm.depthRange[0] + Math.random() * (wm.depthRange[1] - wm.depthRange[0]);
      const sigmaTheta = calculateSigmaTheta(temp, sal);

      // Normalize to Three.js space (-boxSize/2 to +boxSize/2)
      // Salinity (31.0 - 38.0) -> X
      const nx = ((sal - 31.0) / 7.0 - 0.5) * boxSize;
      // Temperature (0 - 32°C) -> Y
      const ny = ((temp - 0.0) / 32.0 - 0.5) * boxSize;
      // Depth (0 - 2000m) -> Z
      const nz = ((depth - 0.0) / 2000.0 - 0.5) * boxSize;

      positions.push(nx, ny, nz);

      const color = new THREE.Color(wm.colorHex);
      colors.push(color.r, color.g, color.b);

      pointsData.push({
        x: nx,
        y: ny,
        z: nz,
        sal: Math.round(sal * 100) / 100,
        temp: Math.round(temp * 10) / 10,
        depth: Math.round(depth),
        sigmaTheta: Math.round(sigmaTheta * 100) / 100,
        waterMass: wm,
        floatId: `ARGO-${2900000 + Math.floor(Math.random() * 9000)}`,
      });
    }

    const scatterGeom = new THREE.BufferGeometry();
    scatterGeom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    scatterGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const scatterMat = new THREE.PointsMaterial({
      size: 0.35,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });

    const scatterPoints = new THREE.Points(scatterGeom, scatterMat);
    rootGroup.add(scatterPoints);
    pointsRef.current = scatterPoints;

    scene.add(rootGroup);

    // 5. Interactive Mouse Orbit Controls
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouse.x;
      const deltaY = e.clientY - prevMouse.y;

      rootGroup.rotation.y += deltaX * 0.007;
      rootGroup.rotation.x = Math.max(-0.6, Math.min(0.8, rootGroup.rotation.x + deltaY * 0.005));

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId: number;
    let clock = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      clock += 0.01;

      if (autoRotate && !isDragging) {
        rootGroup.rotation.y += 0.002;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, [activeWaterMasses, autoRotate]);

  return (
    <div className="w-full h-full flex flex-col space-y-2.5 p-3 bg-[#030914] text-slate-100 font-sans overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-abyssal-800 pb-2.5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-ocean-cyan border border-cyan-500/25 shadow-glow-cyan-sm">
            <ScatterChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
              3D Temperature–Salinity–Depth (T-S-D) Scatter Cloud
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-ocean-cyan font-mono border border-cyan-500/30">
                Water Mass Classification
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              3-Axis conservative water mass fingerprinting: X: Salinity (PSU), Y: Temp (°C), Z: Depth (m)
            </p>
          </div>
        </div>

        {/* Orbit Switch */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setAutoRotate(!autoRotate)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer active:scale-95 ${
              autoRotate
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glow-cyan-sm'
                : 'bg-abyssal-900 border-abyssal-800 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Orbit ON' : 'Orbit Paused'}</span>
          </button>
        </div>
      </div>

      {/* Water Mass Filter Toggle Bar */}
      <div className="flex items-center gap-1.5 bg-abyssal-950 p-1.5 rounded-2xl border border-abyssal-800 shrink-0 flex-wrap">
        <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          Toggle Water Masses:
        </span>

        {WATER_MASSES.map((wm) => {
          const isSelected = activeWaterMasses.includes(wm.id);
          return (
            <button
              key={wm.id}
              type="button"
              onClick={() => toggleWaterMass(wm.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'border shadow-md text-white'
                  : 'bg-abyssal-900/60 text-slate-500 border border-abyssal-800 hover:text-slate-300'
              }`}
              style={{
                backgroundColor: isSelected ? `${wm.colorCss}25` : undefined,
                borderColor: isSelected ? wm.colorCss : undefined,
              }}
            >
              {isSelected ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: wm.colorCss }}></span>
              <span>{wm.code}</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Stage + Scientific Breakdown */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left 8 Columns: 3D Scatter Cloud Canvas */}
        <div className="lg:col-span-8 flex flex-col bg-abyssal-950/90 border border-cyan-500/30 rounded-2xl p-3 relative overflow-hidden shadow-2xl glow-organism-cyan">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-abyssal-800/80 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>Active Point Cloud: <strong className="text-white">{activeWaterMasses.length} / 5 Water Masses</strong></span>
            </div>
            <div className="text-[11px] text-slate-400">
              Drag to Orbit 3D Scatter Matrix
            </div>
          </div>

          {/* WebGL Canvas */}
          <div className="flex-1 relative min-h-0 my-2 rounded-xl overflow-hidden border border-abyssal-800 bg-black cursor-grab active:cursor-grabbing">
            <div ref={mountRef} className="w-full h-full" />

            {/* 3D Axis Labels Overlay */}
            <div className="absolute top-3 left-3 bg-[#071322]/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-2.5 font-mono text-xs text-slate-200 shadow-2xl pointer-events-none space-y-1">
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider border-b border-cyan-500/30 pb-1">
                3D Coordinate Legend
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">Y-Axis:</span>
                <span>Temperature (0°C – 32°C)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-teal-400 font-bold">X-Axis:</span>
                <span>Salinity (31.0 – 38.0 PSU)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-blue-400 font-bold">Z-Axis:</span>
                <span>Depth (0m – 2,000m)</span>
              </div>
            </div>

            {/* Density Note */}
            <div className="absolute bottom-3 right-3 bg-[#071322]/90 backdrop-blur-xl border border-slate-800 rounded-xl p-2 font-mono text-[10px] text-slate-300 pointer-events-none space-y-0.5">
              <div className="text-cyan-300 font-bold">Isopycnal Density Bounds:</div>
              <div>σθ: 22.0 kg/m³ (Surface) $\to$ 27.8 kg/m³ (Abyssal)</div>
            </div>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1 shrink-0 font-mono text-center text-xs">
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Max Salinity Core</div>
              <div className="text-purple-400 font-bold">RSOW (37.4 PSU)</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Lowest Salinity</div>
              <div className="text-emerald-400 font-bold">BBLSW (31.5 PSU)</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Deepest Origin</div>
              <div className="text-cyan-300 font-bold">IDW (2,000m)</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Subducting Mass</div>
              <div className="text-blue-400 font-bold">AAIW (800m+)</div>
            </div>
          </div>

        </div>

        {/* Right 4 Columns: Detailed Water Mass Encyclopedia */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5 overflow-y-auto pr-1">
          
          <div className="text-xs font-bold text-slate-200 font-heading flex items-center gap-1.5 shrink-0">
            <Layers className="w-4 h-4 text-ocean-cyan" />
            <span>Water Mass Signatures</span>
          </div>

          {/* Water Mass Cards */}
          <div className="space-y-2 flex-1">
            {WATER_MASSES.map((wm) => {
              const isEnabled = activeWaterMasses.includes(wm.id);
              return (
                <div
                  key={wm.id}
                  onClick={() => toggleWaterMass(wm.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                    isEnabled
                      ? 'bg-abyssal-900/90 border-slate-700 hover:border-cyan-500/50'
                      : 'bg-abyssal-950/50 border-abyssal-800 opacity-40 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: wm.colorCss }}></span>
                      {wm.name}
                    </span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${wm.colorCss}25`, color: wm.colorCss }}
                    >
                      {wm.code}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-tight font-sans">
                    {wm.description}
                  </p>

                  <div className="pt-1 border-t border-abyssal-800 text-[10px] font-mono grid grid-cols-2 gap-1 text-slate-400">
                    <div>Salinity: <strong className="text-teal-300">{wm.salinityRange[0]}–{wm.salinityRange[1]} PSU</strong></div>
                    <div>Temp: <strong className="text-rose-400">{wm.tempRange[0]}–{wm.tempRange[1]}°C</strong></div>
                    <div className="col-span-2">Core Depth: <strong className="text-blue-300">{wm.depthRange[0]}–{wm.depthRange[1]} m</strong></div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
};