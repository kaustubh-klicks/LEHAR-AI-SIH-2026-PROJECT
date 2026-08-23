import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Waves, 
  Thermometer, 
  Activity, 
  Sparkles, 
  Play, 
  Pause, 
  RotateCw, 
  Compass,
  Fish,
  Sliders,
  MapPin,
  Globe,
  Droplets
} from 'lucide-react';
import type { FloatSummary } from '../../types';

interface HydrographicTransectProps {
  floats: FloatSummary[];
}

interface SectorProfile {
  id: string;
  name: string;
  badge: string;
  coords: string;
  surfaceSalinity: string;
  surfaceTemp: string;
  mldDepth: number;
  omzIntensity: string;
  hydroSummary: string;
}

interface ThermalPreset {
  id: string;
  name: string;
  tempRange: string;
  minDepth: number;
  maxDepth: number;
  avgOxygen: string;
  oxygenState: string;
  phytoAbundance: string;
  lightPenetration: string;
  speciesBySector: Record<string, { name: string; type: string; depthHabit: string }[]>;
  description: string;
  color: string;
  hexColor: number;
}

const INDIAN_OCEAN_SECTORS: SectorProfile[] = [
  {
    id: 'arabian_sea',
    name: 'Arabian Sea (West Coast)',
    badge: 'High Salinity • Severe OMZ',
    coords: '15.5°N, 68.2°E',
    surfaceSalinity: '36.8 PSU (High Evaporation)',
    surfaceTemp: '28.8°C',
    mldDepth: 85,
    omzIntensity: '< 12 µmol/kg (Dead Zone at 300–900m)',
    hydroSummary: 'Intense Southwest Monsoon upwelling along the western coast driving massive primary production and a deep sub-surface hypoxic envelope.',
  },
  {
    id: 'bay_of_bengal',
    name: 'Bay of Bengal (East Coast)',
    badge: 'Low Salinity • Barrier Layer',
    coords: '13.2°N, 86.5°E',
    surfaceSalinity: '32.4 PSU (River Runoff)',
    surfaceTemp: '29.6°C',
    mldDepth: 55,
    omzIntensity: '35 µmol/kg (Moderate Mesopelagic OMZ)',
    hydroSummary: 'Ganga-Brahmaputra river discharge creates a low-salinity freshwater cap, preventing vertical mixing and preserving heat.',
  },
  {
    id: 'lakshadweep_sea',
    name: 'Lakshadweep & Malabar Shelf',
    badge: 'Coral Atolls • Tuna Frontier',
    coords: '10.5°N, 72.8°E',
    surfaceSalinity: '35.4 PSU',
    surfaceTemp: '29.2°C',
    mldDepth: 70,
    omzIntensity: '55 µmol/kg',
    hydroSummary: 'Productive continental shelf break with active coral lagoon ecosystems and primary skipjack tuna feeding grounds.',
  },
  {
    id: 'andaman_sea',
    name: 'Andaman & Nicobar Basin',
    badge: 'Deep Trench • High Biodiversity',
    coords: '11.8°N, 93.1°E',
    surfaceSalinity: '33.2 PSU',
    surfaceTemp: '29.4°C',
    mldDepth: 65,
    omzIntensity: '48 µmol/kg',
    hydroSummary: 'Deep volcanic trenches with strong tidal internal waves and rich benthic coral-shelf ecosystems.',
  },
  {
    id: 'equatorial_basin',
    name: 'Equatorial Indian Ocean',
    badge: 'Wyrtki Jet • IOD Hub',
    coords: '0.0°N, 78.0°E',
    surfaceSalinity: '34.8 PSU',
    surfaceTemp: '28.4°C',
    mldDepth: 120,
    omzIntensity: '85 µmol/kg (Well-Ventilated)',
    hydroSummary: 'Regulated by the Wyrtki Jet and Indian Ocean Dipole (IOD) oscillations, acting as an open pelagic highway.',
  },
];

const THERMAL_PRESETS: ThermalPreset[] = [
  {
    id: 'surface_warm',
    name: 'Tropical Warm Pool (> 26.5°C)',
    tempRange: '26.5°C – 30.0°C',
    minDepth: 0,
    maxDepth: 100,
    avgOxygen: '210 µmol/kg',
    oxygenState: 'Hyper-Oxygenated Photic Zone',
    phytoAbundance: '0.85 mg/m³ (Peak Plume)',
    lightPenetration: '100% – Full Sunlit Euphotic',
    description: 'The epipelagic photic blanket driven by monsoonal solar heating and surface wind mixing. Primary breeding and feeding ground.',
    color: '#ef4444',
    hexColor: 0xef4444,
    speciesBySector: {
      arabian_sea: [
        { name: 'Indian Oil Sardine (Sardinella longiceps)', type: 'Coastal Pelagic', depthHabit: '0–45m' },
        { name: 'Indian Mackerel (Rastrelliger kanagurta)', type: 'Schooling Forager', depthHabit: '15–70m' },
        { name: 'Silver Pomfret', type: 'Commercial Catch', depthHabit: '10–55m' },
        { name: 'Ribbonfish', type: 'Predatory Pelagic', depthHabit: '30–100m' },
      ],
      bay_of_bengal: [
        { name: 'Hilsa Shad (Tenualosa ilisha)', type: 'Anadromous Forager', depthHabit: '0–50m' },
        { name: 'Bombay Duck (Harpadon nehereus)', type: 'Estuarine Coastal', depthHabit: '10–60m' },
        { name: 'Tiger Prawns (Penaeus monodon)', type: 'Coastal Planktonic', depthHabit: '0–35m' },
        { name: 'Anchovies', type: 'Phytoplankton Feeder', depthHabit: '0–40m' },
      ],
      lakshadweep_sea: [
        { name: 'Skipjack Tuna (Katsuwonus pelamis)', type: 'Surface Feeder', depthHabit: '0–80m' },
        { name: 'Bluefin Trevally', type: 'Reef Pelagic', depthHabit: '5–60m' },
        { name: 'Needlefish', type: 'Surface Hunter', depthHabit: '0–20m' },
      ],
      andaman_sea: [
        { name: 'Spanish Mackerel (Seerfish)', type: 'Coastal Predator', depthHabit: '10–75m' },
        { name: 'Coral Trout & Groupers', type: 'Reef Benthic', depthHabit: '15–90m' },
        { name: 'Flying Fish', type: 'Epipelagic', depthHabit: '0–15m' },
      ],
      equatorial_basin: [
        { name: 'Mahi Mahi (Dorad)', type: 'Oceanic Pelagic', depthHabit: '0–80m' },
        { name: 'Sailfish', type: 'Apex Billfish', depthHabit: '10–90m' },
        { name: 'Oceanic Whitetip Shark', type: 'Apex Predator', depthHabit: '0–100m' },
      ],
    },
  },
  {
    id: 'upper_thermocline',
    name: 'Upper Thermocline (18°C – 25°C)',
    tempRange: '18.0°C – 25.0°C',
    minDepth: 100,
    maxDepth: 300,
    avgOxygen: '95 µmol/kg',
    oxygenState: 'Moderate Oxygen Gradient',
    phytoAbundance: '0.15 mg/m³ (Subsurface)',
    lightPenetration: '10% – Twilight Stratum',
    description: 'Zone of sharpest thermal decline. Active hunting corridor for deep-diving pelagic gamefish.',
    color: '#facc15',
    hexColor: 0xfacc15,
    speciesBySector: {
      arabian_sea: [
        { name: 'Yellowfin Tuna (Thunnus albacares)', type: 'Apex Migrator', depthHabit: '100–250m' },
        { name: 'Skipjack Tuna', type: 'Thermocline Feeder', depthHabit: '80–200m' },
        { name: 'Swordfish (Xiphias gladius)', type: 'Deep Billfish', depthHabit: '120–300m' },
      ],
      bay_of_bengal: [
        { name: 'Bigeye Tuna (Thunnus obesus)', type: 'Deep Predator', depthHabit: '110–280m' },
        { name: 'Barracuda', type: 'Mesopelagic Hunter', depthHabit: '90–220m' },
        { name: 'Oceanic Squid', type: 'Cephalopod', depthHabit: '100–300m' },
      ],
      lakshadweep_sea: [
        { name: 'Yellowfin Tuna', type: 'Commercial Pelagic', depthHabit: '100–240m' },
        { name: 'Wahoo (Acanthocybium solandri)', type: 'Speed Predator', depthHabit: '80–180m' },
        { name: 'Manta Rays', type: 'Thermocline Filterer', depthHabit: '50–220m' },
      ],
      andaman_sea: [
        { name: 'Dogtooth Tuna', type: 'Drop-off Hunter', depthHabit: '100–260m' },
        { name: 'Giant Trevally (GT)', type: 'Deep Shelf Hunter', depthHabit: '80–200m' },
        { name: 'Reef Sharks', type: 'Subsurface Hunter', depthHabit: '90–250m' },
      ],
      equatorial_basin: [
        { name: 'Bigeye Tuna', type: 'Trans-Oceanic', depthHabit: '120–300m' },
        { name: 'Blue Marlin', type: 'Apex Billfish', depthHabit: '100–280m' },
        { name: 'Silky Shark', type: 'Pelagic Predator', depthHabit: '100–250m' },
      ],
    },
  },
  {
    id: 'mesopelagic_omz',
    name: 'Mesopelagic OMZ (8°C – 15°C)',
    tempRange: '8.0°C – 15.0°C',
    minDepth: 300,
    maxDepth: 1000,
    avgOxygen: '< 18 µmol/kg',
    oxygenState: 'Severe Hypoxia (Arabian OMZ)',
    phytoAbundance: '0.00 mg/m³ (Aphotic)',
    lightPenetration: '0.1% – Twilight Zone',
    description: 'Mid-water hypoxic zone. Sustains massive biomass of lanternfish undergoing nocturnal vertical migration.',
    color: '#c084fc',
    hexColor: 0xc084fc,
    speciesBySector: {
      arabian_sea: [
        { name: 'Lanternfish (Benthosema pterotum)', type: 'Bioluminescent Biomass', depthHabit: '400–850m' },
        { name: 'Purpleback Flying Squid (Sthenoteuthis)', type: 'Hypoxia Tolerant', depthHabit: '350–700m' },
        { name: 'Deep-Sea Hatchetfish', type: 'Photophore Specialist', depthHabit: '450–900m' },
      ],
      bay_of_bengal: [
        { name: 'Myctophid Lanternfish', type: 'Diel Migrator', depthHabit: '350–800m' },
        { name: 'Bristlemouths (Cyclothone)', type: 'Abundant Mesopelagic', depthHabit: '400–950m' },
        { name: 'Glass Squid', type: 'Transparent Cephalopod', depthHabit: '500–900m' },
      ],
      lakshadweep_sea: [
        { name: 'Deep Snappers (Etelis coruscans)', type: 'Seamount Benthic', depthHabit: '300–600m' },
        { name: 'Lanternfish Clusters', type: 'Forage Base', depthHabit: '400–850m' },
      ],
      andaman_sea: [
        { name: 'Andaman Deep-Sea Lobster', type: 'Trench Benthic', depthHabit: '350–750m' },
        { name: 'Bioluminescent Jellyfish', type: 'Cnidarian', depthHabit: '400–900m' },
      ],
      equatorial_basin: [
        { name: 'Vampire Squid (Vampyroteuthis)', type: 'Detritivore Cephalopod', depthHabit: '600–1000m' },
        { name: 'Gulper Eel Juveniles', type: 'Mesopelagic', depthHabit: '500–950m' },
      ],
    },
  },
  {
    id: 'bathypelagic_abyss',
    name: 'Bathypelagic Abyss (< 5°C)',
    tempRange: '2.4°C – 5.0°C',
    minDepth: 1000,
    maxDepth: 2000,
    avgOxygen: '48 µmol/kg',
    oxygenState: 'Deep Ocean Global Conveyor',
    phytoAbundance: '0.00 mg/m³ (Marine Snow)',
    lightPenetration: '0% – Pitch Black',
    description: 'Cold, high-pressure abyssal deep layer sustained by sinking organic marine snow and deep Antarctic currents.',
    color: '#3b82f6',
    hexColor: 0x3b82f6,
    speciesBySector: {
      arabian_sea: [
        { name: 'Sloane\'s Viperfish (Chauliodus sloani)', type: 'Abyssal Predator', depthHabit: '1000–1800m' },
        { name: 'Deep-Sea Dragonfish', type: 'Barbel Hunter', depthHabit: '1200–1900m' },
        { name: 'Giant Benthic Isopods', type: 'Scavenger', depthHabit: '1400–2000m' },
      ],
      bay_of_bengal: [
        { name: 'Deep-Sea Gulper Eel (Eurypharynx pelecanoides)', type: 'Abyssal Scavenger', depthHabit: '1200–2000m' },
        { name: 'Grenadier / Rattail Fish', type: 'Benthic Forager', depthHabit: '1100–1950m' },
      ],
      lakshadweep_sea: [
        { name: 'Abyssal Sea Cucumbers', type: 'Holothurian Detritivore', depthHabit: '1200–2000m' },
        { name: 'Tripod Fish (Bathypterois)', type: 'Stilt Benthic', depthHabit: '1300–2000m' },
      ],
      andaman_sea: [
        { name: 'Andaman Trench Snailfish', type: 'Hadal/Abyssal', depthHabit: '1400–2000m' },
        { name: 'Chimaera (Ghost Shark)', type: 'Deep Chondrichthyes', depthHabit: '1100–1850m' },
      ],
      equatorial_basin: [
        { name: 'Fangtooth (Anoplogaster cornuta)', type: 'Apex Abyssal', depthHabit: '1000–2000m' },
        { name: 'Giant Amphipods', type: 'Crustacean Detritivore', depthHabit: '1500–2000m' },
      ],
    },
  },
];

export const HydrographicTransect: React.FC<HydrographicTransectProps> = ({ floats }) => {
  const [selectedSector, setSelectedSector] = useState<SectorProfile>(INDIAN_OCEAN_SECTORS[0]);
  const [selectedPreset, setSelectedPreset] = useState<ThermalPreset>(THERMAL_PRESETS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [probeDepthM, setProbeDepthM] = useState<number>(65);

  const mountRef = useRef<HTMLDivElement | null>(null);

  // Active species list for current sector + current thermal range
  const currentSpecies = selectedPreset.speciesBySector[selectedSector.id] || selectedPreset.speciesBySector.arabian_sea;

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020713);
    scene.fog = new THREE.FogExp2(0x020713, 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(18, 10, 24);
    camera.lookAt(0, -5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
    sunLight.position.set(10, 25, 15);
    scene.add(sunLight);

    const deepBlueLight = new THREE.PointLight(0x0284c7, 3.5, 50);
    deepBlueLight.position.set(-10, -10, -10);
    scene.add(deepBlueLight);

    const rootGroup = new THREE.Group();

    const colHeight = 14;
    const colWidth = 12;
    const colDepth = 12;

    // Outer Enclosure Cage
    const boxGeom = new THREE.BoxGeometry(colWidth, colHeight, colDepth);
    const boxWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.25 })
    );
    boxWireframe.position.set(0, -colHeight / 2, 0);
    rootGroup.add(boxWireframe);

    // Dynamic Highlight Slab for Selected Thermal Envelope
    const normTop = selectedPreset.minDepth / 2000;
    const normBottom = selectedPreset.maxDepth / 2000;
    const slabHeight = Math.max(0.4, (normBottom - normTop) * colHeight);
    const slabCenterY = -(normTop * colHeight + slabHeight / 2);

    const slabGeom = new THREE.BoxGeometry(colWidth * 0.98, slabHeight, colDepth * 0.98);
    const slabMat = new THREE.MeshStandardMaterial({
      color: selectedPreset.hexColor,
      transparent: true,
      opacity: 0.35,
      roughness: 0.2,
      metalness: 0.1,
    });
    const slabMesh = new THREE.Mesh(slabGeom, slabMat);
    slabMesh.position.set(0, slabCenterY, 0);
    rootGroup.add(slabMesh);

    const slabWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(slabGeom),
      new THREE.LineBasicMaterial({ color: selectedPreset.hexColor, transparent: true, opacity: 0.9 })
    );
    slabMesh.add(slabWire);

    // Float 10-Day Trajectory Ribbon
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, -4),
      new THREE.Vector3(-3, -(colHeight * 0.5), -2),
      new THREE.Vector3(0, -(colHeight * 0.5), 1),
      new THREE.Vector3(2, -(colHeight * 0.5), 2),
      new THREE.Vector3(3, -colHeight, 0),
      new THREE.Vector3(4, 0, -3),
    ]);

    const tubeGeom = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
    const tubeMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.8 });
    const tubeMesh = new THREE.Mesh(tubeGeom, tubeMat);
    rootGroup.add(tubeMesh);

    // ARGO Float Model
    const floatModel = new THREE.Group();
    const bodyGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    floatModel.add(body);

    const headGeom = new THREE.SphereGeometry(0.2, 16, 16);
    const headMat = new THREE.MeshBasicMaterial({ color: 0x22d3ee });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.y = 0.45;
    floatModel.add(head);

    rootGroup.add(floatModel);

    // Plankton Particles
    const particleCount = 180;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * colWidth;
      particlePositions[i + 1] = -Math.random() * (colHeight * 0.2);
      particlePositions[i + 2] = (Math.random() - 0.5) * colDepth;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x4ade80, size: 0.14, transparent: true, opacity: 0.7 });
    const particleSystem = new THREE.Points(particleGeom, particleMat);
    rootGroup.add(particleSystem);

    scene.add(rootGroup);

    // Mouse Drag Orbit Controls
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
      rootGroup.rotation.x = Math.max(-0.4, Math.min(0.7, rootGroup.rotation.x + deltaY * 0.005));

      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    let animId: number;
    let progress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      if (isPlaying) {
        progress = (progress + 0.002) % 1;
        const pos = curve.getPoint(progress);
        floatModel.position.copy(pos);

        const realDepthM = Math.round(Math.abs(pos.y / colHeight) * 2000);
        setProbeDepthM(realDepthM);
      }

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
  }, [selectedPreset, selectedSector, isPlaying, autoRotate]);

  return (
    <div className="w-full h-full flex flex-col space-y-2.5 p-3 bg-[#030914] text-slate-100 font-sans overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-abyssal-800 pb-2.5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-ocean-cyan border border-cyan-500/25 shadow-glow-cyan-sm">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
              Indian Ocean Subsurface Water Column & Habitat Slicer
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-ocean-cyan font-mono border border-cyan-500/30">
                0–2,000m Multi-Basin GIS
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Calibrated across Arabian Sea, Bay of Bengal, Lakshadweep, Andaman, and Equatorial Basins
            </p>
          </div>
        </div>

        {/* Play/Pause & Orbit Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-semibold transition cursor-pointer active:scale-95 ${
              isPlaying
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-glow-cyan-sm'
                : 'bg-abyssal-900 border-abyssal-800 text-slate-400 hover:text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Float In Motion' : 'Paused'}</span>
          </button>

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

      {/* Indian Ocean Sector Selector Bar */}
      <div className="flex items-center gap-1.5 bg-abyssal-950 p-1.5 rounded-2xl border border-cyan-500/30 shrink-0 flex-wrap">
        <span className="text-[11px] font-mono text-cyan-400 px-2 flex items-center gap-1 font-bold">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Select Basin:
        </span>

        {INDIAN_OCEAN_SECTORS.map((sector) => (
          <button
            key={sector.id}
            type="button"
            onClick={() => setSelectedSector(sector)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              selectedSector.id === sector.id
                ? 'bg-gradient-to-r from-ocean-cyan to-teal-400 text-abyssal-950 shadow-md'
                : 'bg-abyssal-900 text-slate-400 border border-abyssal-800 hover:text-white hover:bg-abyssal-850'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>{sector.name}</span>
          </button>
        ))}
      </div>

      {/* Thermal & Depth Layer Selector */}
      <div className="flex items-center gap-2 bg-abyssal-950 p-1.5 rounded-2xl border border-abyssal-800 shrink-0 flex-wrap">
        <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          Isolate Horizon:
        </span>

        {THERMAL_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setSelectedPreset(preset)}
            className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
              selectedPreset.id === preset.id
                ? 'shadow-md border'
                : 'bg-abyssal-900 text-slate-400 border border-abyssal-800 hover:text-white hover:bg-abyssal-850'
            }`}
            style={{
              backgroundColor: selectedPreset.id === preset.id ? `${preset.color}25` : undefined,
              borderColor: selectedPreset.id === preset.id ? preset.color : undefined,
              color: selectedPreset.id === preset.id ? '#ffffff' : undefined,
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }}></span>
            <span>{preset.name}</span>
          </button>
        ))}
      </div>

      {/* Main 3D Stage + Filtered Sector Telemetry */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left 8 Columns: 3D Scene */}
        <div className="lg:col-span-8 flex flex-col bg-abyssal-950/90 border border-cyan-500/30 rounded-2xl p-3 relative overflow-hidden shadow-2xl glow-organism-cyan">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-abyssal-800/80 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>{selectedSector.name} ({selectedSector.coords})</span>
              <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                {selectedPreset.minDepth}m – {selectedPreset.maxDepth}m
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Drag to Orbit 3D Box
            </div>
          </div>

          {/* WebGL Canvas */}
          <div className="flex-1 relative min-h-0 my-2 rounded-xl overflow-hidden border border-abyssal-800 bg-black cursor-grab active:cursor-grabbing">
            <div ref={mountRef} className="w-full h-full" />

            {/* In-Scene Depth HUD */}
            <div className="absolute top-3 left-3 bg-[#071322]/95 backdrop-blur-xl border border-cyan-500/40 rounded-xl p-2.5 font-mono text-xs text-slate-200 shadow-2xl pointer-events-none space-y-1.5 min-w-[220px]">
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-cyan-500/30 pb-1">
                <Compass className="w-3.5 h-3.5 text-ocean-cyan" />
                {selectedSector.name}
              </div>
              <div>Probe Cast Depth: <strong className="text-white text-sm">{probeDepthM} m</strong></div>
              <div>Thermal Envelope: <strong className="text-rose-400">{selectedPreset.tempRange}</strong></div>
              <div>Surface Salinity: <strong className="text-teal-300">{selectedSector.surfaceSalinity}</strong></div>
              <div>Dissolved Oxygen: <strong className="text-purple-300">{selectedPreset.avgOxygen}</strong></div>
              <div>Phytoplankton (Chl-a): <strong className="text-emerald-400">{selectedPreset.phytoAbundance}</strong></div>
            </div>

            {/* Depth Markers */}
            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between py-2 text-[10px] font-mono text-right text-slate-300 pointer-events-none z-10">
              <span className="text-rose-400 font-bold">0m (Surface Photic)</span>
              <span className="text-yellow-300 font-bold">300m (Thermocline)</span>
              <span className="text-purple-300 font-bold">1,000m (OMZ Hypoxia)</span>
              <span className="text-blue-400 font-bold">2,000m (Abyssal Floor)</span>
            </div>
          </div>

          {/* Basin Hydrodynamic Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1 shrink-0 font-mono text-center text-xs">
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Surface Temp</div>
              <div className="text-rose-400 font-bold">{selectedSector.surfaceTemp}</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Mixed Layer (MLD)</div>
              <div className="text-cyan-300 font-bold">{selectedSector.mldDepth} m</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">Salinity Profile</div>
              <div className="text-teal-300 font-bold text-[11px] truncate">{selectedSector.surfaceSalinity}</div>
            </div>
            <div className="p-2 rounded-xl bg-abyssal-900/80 border border-abyssal-800">
              <div className="text-[10px] text-slate-400">OMZ Profile</div>
              <div className="text-purple-400 font-bold text-[11px] truncate">{selectedSector.omzIntensity}</div>
            </div>
          </div>

        </div>

        {/* Right 4 Columns: Dynamic Species & Basin Profile */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5 overflow-y-auto pr-1">
          
          {/* Active Basin Summary */}
          <div className="p-3.5 rounded-2xl bg-abyssal-950/90 border border-cyan-500/30 space-y-2 shadow-xl shrink-0">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-ocean-cyan" />
                <span>{selectedSector.name}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {selectedSector.badge}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {selectedSector.hydroSummary}
            </p>
          </div>

          <div className="text-xs font-bold text-slate-200 font-heading flex items-center gap-1.5 pt-1 shrink-0">
            <Fish className="w-4 h-4 text-amber-400" />
            <span>Fishes in {selectedSector.name} ({selectedPreset.tempRange})</span>
          </div>

          {/* Sector-Specific Species Cards */}
          <div className="space-y-2 flex-1">
            {currentSpecies.map((fish, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-abyssal-900/90 border border-abyssal-800 hover:border-cyan-500/40 transition space-y-1"
              >
                <div className="flex items-center justify-between font-mono">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    🐟 {fish.name}
                  </span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                    {fish.depthHabit}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-sans">
                  Niche: <strong className="text-slate-200">{fish.type}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Chemical Horizon Card */}
          <div className="p-3 rounded-xl bg-abyssal-900/60 border border-abyssal-800 text-[11px] font-mono space-y-1 text-slate-400 shrink-0">
            <div>• Dissolved Oxygen: <strong className="text-purple-300">{selectedPreset.avgOxygen}</strong></div>
            <div>• Phytoplankton (Chl-a): <strong className="text-emerald-400">{selectedPreset.phytoAbundance}</strong></div>
            <div>• Solar Penetration: <strong className="text-yellow-300">{selectedPreset.lightPenetration}</strong></div>
          </div>

        </div>

      </div>

    </div>
  );
};