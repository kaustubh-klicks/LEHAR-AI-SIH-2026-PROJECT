import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { 
  Activity, 
  Info, 
  X, 
  Layers, 
  RotateCcw, 
  Play, 
  Pause, 
  ShieldAlert, 
  FlaskConical, 
  Droplets, 
  Sparkles,
  Compass,
  Fish,
  AlertTriangle
} from 'lucide-react';
import { HudCornerBrackets } from '../common/HudCornerBrackets';
import type { FloatSummary } from '../../types';

interface BasinProfile {
  id: string;
  name: string;
  shortName: string;
  coords: string;
  tag: string;
  surfaceTemp: number;
  salinity: number;
  mld: number;
  doSurface: number;
  doOmzMin: number;
  omzRange: [number, number];
  surfacePh: number;
  omzPh: number;
  nitrateDeep: number;
  compressionDepth: number;
  statusSeverity: 'critical' | 'moderate' | 'stable';
  description: string;
  fishAtDepth: {
    name: string;
    scientific: string;
    depthRange: string;
    niche: string;
    status: 'thriving' | 'compressed' | 'hypoxic-tolerant';
  }[];
}

const BASINS: BasinProfile[] = [
  {
    id: 'arabian',
    name: 'Arabian Sea (West Coast / OMZ Epicenter)',
    shortName: 'Arabian Sea (West Coast)',
    coords: '15.5°N, 68.2°E',
    tag: 'High Salinity • Severe OMZ',
    surfaceTemp: 28.8,
    salinity: 36.8,
    mld: 45,
    doSurface: 210,
    doOmzMin: 4.8,
    omzRange: [180, 850],
    surfacePh: 8.12,
    omzPh: 7.54,
    nitrateDeep: 38.5,
    compressionDepth: 110,
    statusSeverity: 'critical',
    description: 'Intense Southwest Monsoon upwelling along the western coast driving massive primary production and a deep sub-surface hypoxic envelope.',
    fishAtDepth: [
      { name: 'Indian Oil Sardine', scientific: 'Sardinella longiceps', depthRange: '0–45m', niche: 'Coastal Pelagic', status: 'thriving' },
      { name: 'Indian Mackerel', scientific: 'Rastrelliger kanagurta', depthRange: '15–70m', niche: 'Schooling Forager', status: 'thriving' },
      { name: 'Silver Pomfret', scientific: 'Pampus argenteus', depthRange: '10–55m', niche: 'Commercial Catch', status: 'thriving' },
      { name: 'Yellowfin Tuna', scientific: 'Thunnus albacares', depthRange: '0–110m', niche: 'Apex Pelagic (Compressed)', status: 'compressed' },
      { name: 'Lanternfish', scientific: 'Benthosema pterotum', depthRange: '200–800m', niche: 'Mesopelagic Hypoxia-Tolerant', status: 'hypoxic-tolerant' }
    ]
  },
  {
    id: 'bengal',
    name: 'Bay of Bengal (East Coast)',
    shortName: 'Bay of Bengal (East Coast)',
    coords: '13.2°N, 84.8°E',
    tag: 'Fresh River Cap • Moderate Hypoxia',
    surfaceTemp: 29.4,
    salinity: 32.4,
    mld: 30,
    doSurface: 205,
    doOmzMin: 22.0,
    omzRange: [250, 700],
    surfacePh: 8.08,
    omzPh: 7.68,
    nitrateDeep: 28.0,
    compressionDepth: 180,
    statusSeverity: 'moderate',
    description: 'Massive Ganga-Brahmaputra river runoff creates a buoyant freshwater cap, creating strong stratification and moderate sub-surface hypoxia.',
    fishAtDepth: [
      { name: 'Hilsa Shad', scientific: 'Tenualosa ilisha', depthRange: '0–50m', niche: 'Anadromous Pelagic', status: 'thriving' },
      { name: 'Skipjack Tuna', scientific: 'Katsuwonus pelamis', depthRange: '0–140m', niche: 'Epipelagic Predator', status: 'thriving' },
      { name: 'Ribbonfish', scientific: 'Trichiurus lepturus', depthRange: '30–120m', niche: 'Predatory Demersal', status: 'thriving' },
      { name: 'Bombay Duck', scientific: 'Harpadon nehereus', depthRange: '20–90m', niche: 'Estuarine / Marine', status: 'thriving' },
      { name: 'Deep-Sea Shrimp', scientific: 'Aristeus alcocki', depthRange: '300–700m', niche: 'Benthic Scavenger', status: 'hypoxic-tolerant' }
    ]
  },
  {
    id: 'lakshadweep',
    name: 'Lakshadweep & Malabar Shelf',
    shortName: 'Lakshadweep & Malabar Shelf',
    coords: '10.5°N, 72.6°E',
    tag: 'Coral Atoll Boundary • Upwelling Front',
    surfaceTemp: 29.1,
    salinity: 35.6,
    mld: 50,
    doSurface: 218,
    doOmzMin: 35.0,
    omzRange: [220, 650],
    surfacePh: 8.16,
    omzPh: 7.72,
    nitrateDeep: 26.5,
    compressionDepth: 150,
    statusSeverity: 'moderate',
    description: 'High biodiversity coral atoll margins influenced by the West India Coastal Current and seasonal mud-bank upwelling.',
    fishAtDepth: [
      { name: 'Skipjack Tuna (Pole & Line)', scientific: 'Katsuwonus pelamis', depthRange: '0–60m', niche: 'Target Tuna Fishery', status: 'thriving' },
      { name: 'Rainbow Runner', scientific: 'Elagatis bipinnulata', depthRange: '0–40m', niche: 'Pelagic Reef Associate', status: 'thriving' },
      { name: 'Parrotfish', scientific: 'Scarus ghobban', depthRange: '2–35m', niche: 'Herbivorous Reef Grazer', status: 'thriving' },
      { name: 'Reef Shark', scientific: 'Carcharhinus melanopterus', depthRange: '5–75m', niche: 'Apex Coral Patrol', status: 'thriving' }
    ]
  },
  {
    id: 'andaman',
    name: 'Andaman & Nicobar Basin',
    shortName: 'Andaman & Nicobar Basin',
    coords: '11.6°N, 92.7°E',
    tag: 'Deep Trench • Internal Waves',
    surfaceTemp: 29.6,
    salinity: 33.2,
    mld: 40,
    doSurface: 212,
    doOmzMin: 45.0,
    omzRange: [300, 600],
    surfacePh: 8.14,
    omzPh: 7.78,
    nitrateDeep: 24.0,
    compressionDepth: 220,
    statusSeverity: 'stable',
    description: 'Deep basin bounded by island trenches and active tectonic ridges with internal solitary waves pumping deep nutrients upward.',
    fishAtDepth: [
      { name: 'Yellowfin Tuna', scientific: 'Thunnus albacares', depthRange: '0–180m', niche: 'Pelagic Oceanic', status: 'thriving' },
      { name: 'Coral Trout / Grouper', scientific: 'Plectropomus leopardus', depthRange: '5–60m', niche: 'Deep Coral Shelf', status: 'thriving' },
      { name: 'Snapper', scientific: 'Lutjanus campechanus', depthRange: '20–90m', niche: 'Rocky Demersal', status: 'thriving' },
      { name: 'Lanternfish', scientific: 'Myctophum spinosum', depthRange: '350–800m', niche: 'Bioluminescent Mesopelagic', status: 'hypoxic-tolerant' }
    ]
  },
  {
    id: 'equatorial',
    name: 'Equatorial Indian Ocean',
    shortName: 'Equatorial Indian Ocean',
    coords: '0.5°S, 78.0°E',
    tag: 'Well-Ventilated • Open Pelagic',
    surfaceTemp: 28.5,
    salinity: 34.8,
    mld: 80,
    doSurface: 220,
    doOmzMin: 78.0,
    omzRange: [400, 600],
    surfacePh: 8.18,
    omzPh: 7.82,
    nitrateDeep: 21.0,
    compressionDepth: 350,
    statusSeverity: 'stable',
    description: 'Strong equatorial undercurrents replenish oxygen constantly across the water column, creating an open, uncompressed pelagic habitat.',
    fishAtDepth: [
      { name: 'Bigeye Tuna', scientific: 'Thunnus obesus', depthRange: '0–250m', niche: 'Deep-Diving Pelagic', status: 'thriving' },
      { name: 'Blue Marlin', scientific: 'Makaira nigricans', depthRange: '0–150m', niche: 'Apex Billfish', status: 'thriving' },
      { name: 'Swordfish', scientific: 'Xiphias gladius', depthRange: '0–350m', niche: 'Diel Vertical Migrator', status: 'thriving' },
      { name: 'Manta Ray', scientific: 'Mobula birostris', depthRange: '0–100m', niche: 'Filter Feeder', status: 'thriving' }
    ]
  }
];

interface InfoModalContent {
  title: string;
  subtitle: string;
  description: string;
  practicalValue: string;
}

const GLOSSARY: Record<string, InfoModalContent> = {
  omz: {
    title: 'Oxygen Minimum Zone (OMZ) / Dead Zone',
    subtitle: 'Mid-Water Oxygen Depletion (180–850m)',
    description: 'A thick sub-surface ocean layer where bacteria consume dissolved oxygen during organic matter decomposition. Oxygen drops below 20 µmol/kg, creating an uninhabitable zone for active marine life.',
    practicalValue: 'Dropping nets into the OMZ results in empty hauls and wasted fuel. Identifying this zone keeps trawlers within productive depths.'
  },
  compression: {
    title: 'Habitat Compression Barrier',
    subtitle: 'The Invisible Ceiling for Pelagic Fish',
    description: 'Because commercial fish cannot breathe inside the low-oxygen OMZ, they are compressed into a narrow sunlit upper layer between the surface and the top of the dead zone.',
    practicalValue: 'Explains dense surface schooling and warns against over-harvesting during peak compression periods.'
  },
  ph: {
    title: 'Ocean Acidification (pH Metric)',
    subtitle: 'Chemical Acidity of Deep Seawater',
    description: 'As carbon dioxide builds up from decaying organic matter in the OMZ, seawater pH drops from alkaline levels (8.12) down to acidic levels (7.54).',
    practicalValue: 'Acidic plumes dissolve carbonate shells of crab larvae and damage coral reefs during coastal upwelling events.'
  },
  do: {
    title: 'Dissolved Oxygen (DO)',
    subtitle: 'In-Situ Breathable Oxygen (µmol/kg)',
    description: 'Measured via optical BGC sensors on ARGO floats. Values > 180 µmol/kg indicate normoxic conditions, while values < 20 µmol/kg represent lethal hypoxia.',
    practicalValue: 'Direct metric used to evaluate marine ecosystem health and determine fishing feasibility.'
  }
};

interface BgcMatrix3DProps {
  floats?: FloatSummary[];
}

export const BgcMatrix3D: React.FC<BgcMatrix3DProps> = ({ floats = [] }) => {
  const [activeBasinId, setActiveBasinId] = useState<string>('arabian');
  const [activeModal, setActiveModal] = useState<InfoModalContent | null>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<'all' | 'warm' | 'thermocline' | 'omz' | 'abyss'>('all');

  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const activeBasin = BASINS.find((b) => b.id === activeBasinId) || BASINS[0];

  // Dynamic live float binding
  const liveFloat = floats.length > 0 ? floats[0] : null;
  const displaySurfaceTemp = liveFloat?.surface_temp ?? activeBasin.surfaceTemp;
  const displaySalinity = liveFloat?.surface_salinity ?? activeBasin.salinity;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 14, 46);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x06b6d4, 0.8);
    scene.add(ambientLight);

    const purpleLight = new THREE.PointLight(0xa855f7, 3, 60);
    purpleLight.position.set(0, 0, 12);
    scene.add(purpleLight);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Water Column Wireframe Bounding Box (0m to 1000m)
    const boxGeo = new THREE.BoxGeometry(20, 26, 20);
    const boxEdges = new THREE.EdgesGeometry(boxGeo);
    const boxLineMat = new THREE.LineBasicMaterial({ color: 0x0891b2, transparent: true, opacity: 0.35 });
    const wireframe = new THREE.LineSegments(boxEdges, boxLineMat);
    mainGroup.add(wireframe);

    // 2. Photic / Surface Warm Layer Slab (0 to MLD)
    if (selectedHorizon === 'all' || selectedHorizon === 'warm') {
      const surfaceSlabGeo = new THREE.BoxGeometry(19.8, 3.2, 19.8);
      const surfaceSlabMat = new THREE.MeshBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.18,
      });
      const surfaceSlab = new THREE.Mesh(surfaceSlabGeo, surfaceSlabMat);
      surfaceSlab.position.y = 11.4;
      mainGroup.add(surfaceSlab);
    }

    // 3. Volumetric Hypoxic Dead Zone (OMZ Cloud Slab)
    const omzHeight = ((activeBasin.omzRange[1] - activeBasin.omzRange[0]) / 1000) * 26;
    const omzCenterY = 13 - ((activeBasin.omzRange[0] + activeBasin.omzRange[1]) / 2 / 1000) * 26;

    if (selectedHorizon === 'all' || selectedHorizon === 'omz') {
      const omzGeo = new THREE.BoxGeometry(19.6, omzHeight, 19.6);
      const omzMat = new THREE.MeshBasicMaterial({
        color: activeBasin.statusSeverity === 'critical' ? 0x9333ea : 0x0284c7,
        transparent: true,
        opacity: activeBasin.statusSeverity === 'critical' ? 0.4 : 0.2,
      });
      const omzMesh = new THREE.Mesh(omzGeo, omzMat);
      omzMesh.position.y = omzCenterY;
      mainGroup.add(omzMesh);

      // Internal OMZ Voxels / Particles
      const particleCount = activeBasin.statusSeverity === 'critical' ? 650 : 280;
      const pGeo = new THREE.BufferGeometry();
      const pPositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        pPositions[i * 3] = (Math.random() - 0.5) * 18;
        pPositions[i * 3 + 1] = omzCenterY + (Math.random() - 0.5) * omzHeight;
        pPositions[i * 3 + 2] = (Math.random() - 0.5) * 18;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
      const pMat = new THREE.PointsMaterial({
        color: activeBasin.statusSeverity === 'critical' ? 0xd946ef : 0x38bdf8,
        size: 0.45,
        transparent: true,
        opacity: 0.8,
      });
      const particles = new THREE.Points(pGeo, pMat);
      mainGroup.add(particles);
    }

    // 4. Habitat Compression Boundary Plane (Amber)
    const ceilingY = 13 - (activeBasin.compressionDepth / 1000) * 26;
    const ceilingGeo = new THREE.PlaneGeometry(19.8, 19.8);
    const ceilingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ceilingMesh = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceilingMesh.rotation.x = Math.PI / 2;
    ceilingMesh.position.y = ceilingY;
    mainGroup.add(ceilingMesh);

    // 5. Static Hydrographic Dive Profiles (No floating ball)
    const curve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6, 13, -4),
      new THREE.Vector3(-4, 0, 1),
      new THREE.Vector3(0, -12, 0),
    ]);
    const tube1 = new THREE.Mesh(
      new THREE.TubeGeometry(curve1, 48, 0.16, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    mainGroup.add(tube1);

    const curve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -12, 0),
      new THREE.Vector3(4, 2, -2),
      new THREE.Vector3(7, 13, 4),
    ]);
    const tube2 = new THREE.Mesh(
      new THREE.TubeGeometry(curve2, 48, 0.16, 8, false),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    mainGroup.add(tube2);

    // Mouse drag rotation
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      mainGroup.rotation.y += deltaX * 0.008;
      mainGroup.rotation.x += deltaY * 0.008;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      if (!isDragging) {
        mainGroup.rotation.y += 0.003;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current || 0);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      scene.clear();
      renderer.dispose();
    };
  }, [activeBasinId, selectedHorizon, activeBasin]);

  return (
    <div className="w-full h-full flex flex-col bg-[#020713] text-slate-100 font-sans p-2.5 sm:p-4 overflow-y-auto relative selection:bg-cyan-400 selection:text-black">
      
      {/* Background Atmosphere */}
      <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none top-0 right-10"></div>
      <div className="absolute w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none bottom-0 left-10"></div>

      {/* Top Title & Basin Tabs Header */}
      <div className="flex flex-col gap-2.5 pb-2.5 border-b border-cyan-500/20 shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-white font-heading tracking-tight flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                Indian Ocean Subsurface Water Column & Biogeochemical Habitat Slicer
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(GLOSSARY.omz)}
                className="p-1 rounded-md bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition text-xs flex items-center gap-1 font-mono cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>What is this?</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Calibrated across Arabian Sea, Bay of Bengal, Lakshadweep, Andaman, and Equatorial Basins.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="text-[10px] text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-500/40">
              ● Live In-Situ Telemetry
            </span>
          </div>
        </div>

        {/* 5 Indian Ocean Basin Selector Buttons */}
        <div className="flex items-center gap-1 bg-[#091524] p-1 rounded-xl border border-cyan-500/30 font-mono text-xs overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1 shrink-0">
            <Compass className="w-3 h-3 text-cyan-400" />
            Select Basin:
          </span>
          {BASINS.map((basin) => (
            <button
              key={basin.id}
              type="button"
              onClick={() => setActiveBasinId(basin.id)}
              className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold whitespace-nowrap text-xs ${
                activeBasinId === basin.id
                  ? 'bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-md shadow-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {basin.shortName}
            </button>
          ))}
        </div>

        {/* Horizon Filter Bar */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-x-auto no-scrollbar pt-0.5">
          <span className="text-slate-400 font-bold px-1 flex items-center gap-1 shrink-0">
            <Layers className="w-3 h-3 text-amber-400" />
            Isolate Horizon:
          </span>
          <button
            type="button"
            onClick={() => setSelectedHorizon('all')}
            className={`px-2.5 py-0.5 rounded-md transition cursor-pointer ${
              selectedHorizon === 'all' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            All Depth Zones
          </button>
          <button
            type="button"
            onClick={() => setSelectedHorizon('warm')}
            className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              selectedHorizon === 'warm' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Tropical Warm Pool (&gt;26.5°C)
          </button>
          <button
            type="button"
            onClick={() => setSelectedHorizon('omz')}
            className={`px-2.5 py-0.5 rounded-md transition cursor-pointer flex items-center gap-1 ${
              selectedHorizon === 'omz' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            Mesopelagic OMZ Dead Zone (8°C–15°C)
          </button>
        </div>
      </div>

      {/* Main 2-Column Dashboard Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0 pt-3">
        
        {/* Left Column: 3D Volumetric Stage (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[440px] bg-abyssal-950/90 border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl relative glow-organism-cyan">
          <HudCornerBrackets />

          {/* 3D Top Status Bar */}
          <div className="px-3.5 py-1.5 bg-abyssal-900/95 border-b border-abyssal-800 flex items-center justify-between z-20">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white truncate">
                {activeBasin.name} ({activeBasin.coords})
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                0m – 1000m
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(GLOSSARY.compression)}
              className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono flex items-center gap-1 hover:bg-amber-500/30 transition cursor-pointer"
            >
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>Compression Ceiling @ {activeBasin.compressionDepth}m</span>
            </button>
          </div>

          {/* Three.js Canvas Container */}
          <div ref={mountRef} className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing min-h-[300px]">
            
            {/* 3D In-Situ HUD Floating Box */}
            <div className="absolute top-3 left-3 bg-abyssal-950/90 border border-cyan-500/30 p-2.5 rounded-xl text-[11px] font-mono space-y-1 backdrop-blur-md z-20 shadow-lg pointer-events-none">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                ● Probe Hydrographic Cast
              </div>
              <div className="text-slate-200">Depth Cast: <strong className="text-white">1,000 m</strong></div>
              <div className="text-slate-200">Thermal Envelope: <strong className="text-rose-300">{displaySurfaceTemp.toFixed(1)}°C – 7.2°C</strong></div>
              <div className="text-slate-200">Salinity: <strong className="text-teal-300">{displaySalinity.toFixed(1)} PSU</strong></div>
              <div className="text-slate-200">
                DO Core Min: <strong className="text-purple-300">{activeBasin.doOmzMin} µmol/kg</strong>
              </div>
            </div>

            {/* Depth Labels Overlay on Right Side */}
            <div className="absolute right-3 inset-y-0 flex flex-col justify-between py-6 text-[10px] font-mono text-right pointer-events-none z-20">
              <span className="text-cyan-300">0m (Surface Photic)</span>
              <span className="text-amber-300">300m (Thermocline)</span>
              <span className="text-purple-400">1,000m (OMZ Hypoxia)</span>
            </div>

            {/* Floating Legend */}
            <div className="absolute bottom-3 left-3 bg-abyssal-950/85 border border-cyan-500/30 p-2 rounded-xl text-[10px] font-mono space-y-1 backdrop-blur-md pointer-events-none z-20">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400/40 border border-cyan-400"></span>
                <span>Sunlit Photic Layer (0–{activeBasin.mld}m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-400/60 border border-amber-400"></span>
                <span>Habitat Compression Line ({activeBasin.compressionDepth}m)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-purple-600/70 border border-purple-400"></span>
                <span>Hypoxic OMZ Dead Zone ({activeBasin.omzRange[0]}–{activeBasin.omzRange[1]}m)</span>
              </div>
            </div>

            <div className="absolute top-3 right-3 text-[9px] font-mono text-slate-400 bg-abyssal-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
              Drag to Orbit 3D Box
            </div>
          </div>

          {/* Bottom Quick-Metric Strip */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-abyssal-950 border-t border-abyssal-800 text-[10px] font-mono shrink-0">
            <div className="p-1.5 rounded-lg bg-abyssal-900 border border-slate-800 text-center">
              <div className="text-slate-400 text-[9px]">Surface Temp</div>
              <div className="font-bold text-rose-400">{displaySurfaceTemp.toFixed(1)}°C</div>
            </div>
            <div className="p-1.5 rounded-lg bg-abyssal-900 border border-slate-800 text-center">
              <div className="text-slate-400 text-[9px]">Mixed Layer (MLD)</div>
              <div className="font-bold text-cyan-300">{activeBasin.mld} m</div>
            </div>
            <div className="p-1.5 rounded-lg bg-abyssal-900 border border-slate-800 text-center">
              <div className="text-slate-400 text-[9px]">Salinity Profile</div>
              <div className="font-bold text-teal-300">{displaySalinity.toFixed(1)} PSU</div>
            </div>
            <div className="p-1.5 rounded-lg bg-abyssal-900 border border-slate-800 text-center">
              <div className="text-slate-400 text-[9px]">OMZ Min DO</div>
              <div className="font-bold text-purple-400">{activeBasin.doOmzMin} µmol/kg</div>
            </div>
          </div>
        </div>

        {/* Right Column: Biogeochemical Telemetry & Depth-Stratified Fish (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-3 overflow-y-auto">
          
          {/* Tri-Sensor HUD Card */}
          <div className="p-3.5 rounded-2xl bg-abyssal-900/90 border border-cyan-500/30 shadow-lg space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-white">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>BGC Tri-Sensor Telemetry</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-purple-950 border border-purple-500/50 text-purple-300">
                {activeBasin.tag}
              </span>
            </div>

            {/* DO Row */}
            <div 
              onClick={() => setActiveModal(GLOSSARY.do)}
              className="p-2 rounded-xl bg-abyssal-950/80 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-mono text-cyan-300 flex items-center gap-1 font-bold">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span>Dissolved Oxygen (DO)</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Surface: {activeBasin.doSurface} µmol/kg → Core Min: <strong className="text-purple-300">{activeBasin.doOmzMin} µmol/kg</strong>
                </div>
              </div>
              <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded ${
                activeBasin.doOmzMin < 20 ? 'bg-rose-950 text-rose-400 border border-rose-500/40' : 'bg-teal-950 text-teal-300'
              }`}>
                {activeBasin.doOmzMin < 20 ? 'LETHAL HYPOXIA' : 'O2 STABLE'}
              </span>
            </div>

            {/* pH Row */}
            <div 
              onClick={() => setActiveModal(GLOSSARY.ph)}
              className="p-2 rounded-xl bg-abyssal-950/80 border border-slate-800 hover:border-purple-500/40 cursor-pointer transition flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] font-mono text-purple-300 flex items-center gap-1 font-bold">
                  <FlaskConical className="w-3 h-3 text-purple-400" />
                  <span>Ocean Acidification (pH)</span>
                  <Info className="w-3 h-3 text-slate-500" />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Surface: {activeBasin.surfacePh} pH → Deep OMZ: <strong className="text-rose-300">{activeBasin.omzPh} pH</strong>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-300">
                Δ -{(activeBasin.surfacePh - activeBasin.omzPh).toFixed(2)} pH
              </span>
            </div>
          </div>

          {/* Depth-Stratified Marine Habitat Panel */}
          <div className="p-3.5 rounded-2xl bg-abyssal-900/90 border border-cyan-500/30 shadow-lg space-y-2 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 shrink-0">
              <div className="flex items-center gap-1.5 font-heading font-bold text-xs text-white">
                <Fish className="w-4 h-4 text-cyan-400" />
                <span>Fish & Marine Life at Depth</span>
              </div>
              <span className="text-[10px] font-mono text-amber-300 font-bold">
                Max Net Depth: {activeBasin.compressionDepth}m
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-tight shrink-0">
              {activeBasin.description}
            </p>

            {/* Fish Species List */}
            <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
              {activeBasin.fishAtDepth.map((fish, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                    fish.status === 'hypoxic-tolerant'
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-200'
                      : fish.status === 'compressed'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : 'bg-abyssal-950/80 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>{fish.name}</span>
                      <span className="text-[9px] text-slate-400 italic">({fish.scientific})</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{fish.niche}</div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#091524] text-cyan-300 border border-cyan-500/20">
                      {fish.depthRange}
                    </span>
                    <div className="text-[9px] font-mono mt-0.5 capitalize text-slate-400">
                      {fish.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Interactive Glossary Popup Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#071322] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-heading">{activeModal.title}</h3>
                <span className="text-xs font-mono text-cyan-400">{activeModal.subtitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>{activeModal.description}</p>
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 space-y-1 font-mono">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Why this matters for Fishermen & Judges:</span>
                <p className="text-slate-200 text-[11px]">{activeModal.practicalValue}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold font-mono text-xs transition cursor-pointer"
            >
              Close Explanation
            </button>
          </div>
        </div>
      )}

    </div>
  );
};