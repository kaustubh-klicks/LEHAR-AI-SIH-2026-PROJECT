import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  Layers, 
  RotateCw, 
  Compass,
  Fish,
  Sliders,
  MapPin,
  Globe,
  Info,
  X
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
  salinityVal: number;
  surfaceTemp: string;
  tempVal: number;
  mldDepth: number;
  omzIntensity: string;
  doMin: number;
  hydroSummary: string;
}

interface ThermalPreset {
  id: string;
  name: string;
  tempRange: string;
  minDepth: number;
  maxDepth: number;
  avgOxygen: string;
  phytoAbundance: string;
  lightPenetration: string;
  speciesBySector: Record<string, { name: string; type: string; depthHabit: string }[]>;
  description: string;
  color: string;
  hexColor: number;
}

interface GlossaryModal {
  title: string;
  subtitle: string;
  desc: string;
  benefit: string;
}

const INDIAN_OCEAN_SECTORS: SectorProfile[] = [
  {
    id: 'arabian_sea',
    name: 'Arabian Sea (West Coast)',
    badge: 'High Salinity • Severe OMZ',
    coords: '15.5°N, 68.2°E',
    surfaceSalinity: '36.8 PSU (High Evaporation)',
    salinityVal: 36.8,
    surfaceTemp: '28.8°C',
    tempVal: 28.8,
    mldDepth: 85,
    omzIntensity: '< 12 µmol/kg (Dead Zone at 300–900m)',
    doMin: 4.8,
    hydroSummary: 'Intense Southwest Monsoon upwelling along the western coast driving massive primary production and a deep sub-surface hypoxic envelope.',
  },
  {
    id: 'bay_of_bengal',
    name: 'Bay of Bengal (East Coast)',
    badge: 'Low Salinity • Barrier Layer',
    coords: '13.2°N, 86.5°E',
    surfaceSalinity: '32.4 PSU (River Runoff)',
    salinityVal: 32.4,
    surfaceTemp: '29.6°C',
    tempVal: 29.6,
    mldDepth: 55,
    omzIntensity: '35 µmol/kg (Moderate Mesopelagic OMZ)',
    doMin: 22.0,
    hydroSummary: 'Ganga-Brahmaputra river discharge creates a low-salinity freshwater cap, preventing vertical mixing and preserving heat.',
  },
  {
    id: 'lakshadweep_sea',
    name: 'Lakshadweep & Malabar Shelf',
    badge: 'Coral Atolls • Tuna Frontier',
    coords: '10.5°N, 72.8°E',
    surfaceSalinity: '35.4 PSU',
    salinityVal: 35.4,
    surfaceTemp: '29.2°C',
    tempVal: 29.2,
    mldDepth: 70,
    omzIntensity: '55 µmol/kg',
    doMin: 35.0,
    hydroSummary: 'Productive continental shelf break with active coral lagoon ecosystems and primary skipjack tuna feeding grounds.',
  },
  {
    id: 'andaman_sea',
    name: 'Andaman & Nicobar Basin',
    badge: 'Deep Trench • High Biodiversity',
    coords: '11.8°N, 93.1°E',
    surfaceSalinity: '33.2 PSU',
    salinityVal: 33.2,
    surfaceTemp: '29.4°C',
    tempVal: 29.4,
    mldDepth: 65,
    omzIntensity: '48 µmol/kg',
    doMin: 45.0,
    hydroSummary: 'Deep volcanic trenches with strong tidal internal waves and rich benthic coral-shelf ecosystems.',
  },
  {
    id: 'equatorial_basin',
    name: 'Equatorial Indian Ocean',
    badge: 'Wyrtki Jet • IOD Hub',
    coords: '0.0°N, 78.0°E',
    surfaceSalinity: '34.8 PSU',
    salinityVal: 34.8,
    surfaceTemp: '28.4°C',
    tempVal: 28.4,
    mldDepth: 120,
    omzIntensity: '85 µmol/kg (Well-Ventilated)',
    doMin: 78.0,
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
    phytoAbundance: '0.85 mg/m³ (Peak Plume)',
    lightPenetration: '100% – Full Sunlit Euphotic',
    description: 'The epipelagic photic blanket driven by monsoonal solar heating and surface wind mixing. Primary breeding and feeding ground.',
    color: '#ff3366',
    hexColor: 0xff3366,
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
    phytoAbundance: '0.15 mg/m³ (Subsurface)',
    lightPenetration: '10% – Twilight Stratum',
    description: 'Zone of sharpest thermal decline. Active hunting corridor for deep-diving pelagic gamefish.',
    color: '#ffbb00',
    hexColor: 0xffbb00,
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
    phytoAbundance: '0.00 mg/m³ (Aphotic)',
    lightPenetration: '0.1% – Twilight Zone',
    description: 'Mid-water hypoxic zone. Sustains massive biomass of lanternfish undergoing nocturnal vertical migration.',
    color: '#d946ef',
    hexColor: 0xd946ef,
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
    phytoAbundance: '0.00 mg/m³ (Marine Snow)',
    lightPenetration: '0% – Pitch Black',
    description: 'Cold, high-pressure abyssal deep layer sustained by sinking organic marine snow and deep Antarctic currents.',
    color: '#00d4ff',
    hexColor: 0x00d4ff,
    speciesBySector: {
      arabian_sea: [
        { name: "Sloane's Viperfish (Chauliodus sloani)", type: 'Abyssal Predator', depthHabit: '1000–1800m' },
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

const GLOSSARY: Record<string, GlossaryModal> = {
  slicer: {
    title: 'Indian Ocean Subsurface Water Column & Habitat Slicer',
    subtitle: 'Interactive 3D Multi-Basin Profiling (0–2,000m)',
    desc: 'Combines physical CTD depth measurements (temperature, salinity) with BGC sensors (oxygen dead zones) to show the exact layers where marine species live and where hypoxic zones restrict net deployments.',
    benefit: 'Enables fishing boats to drop nets at the exact depth where fish school, while avoiding fuel-wasting empty casts in dead zones.'
  },
  hud: {
    title: 'Probe Hydrographic Cast Readings',
    subtitle: 'Live In-Situ CTD + BGC Telemetry',
    desc: 'Displays cast depth, thermal envelope, salinity, dissolved oxygen, and surface chlorophyll-a from autonomous ARGO floats.',
    benefit: 'Provides grounded data for PFZ forecasting and net calibration.'
  },
  omz: {
    title: 'Oxygen Minimum Zone (OMZ) / Dead Zone',
    subtitle: 'Mid-Water Oxygen Depletion (300–900m)',
    desc: 'A thick sub-surface layer where bacteria consume dissolved oxygen during organic decay. Oxygen drops below 20 µmol/kg, creating an uninhabitable zone for commercial fish.',
    benefit: 'Trawler nets dropped into this zone catch zero commercial fish. Visualizing it prevents wasted gear, time, and diesel.'
  }
};

export const HydrographicTransect: React.FC<HydrographicTransectProps> = ({ floats = [] }) => {
  const [selectedSector, setSelectedSector] = useState<SectorProfile>(INDIAN_OCEAN_SECTORS[0]);
  const [selectedPreset, setSelectedPreset] = useState<ThermalPreset>(THERMAL_PRESETS[0]);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<GlossaryModal | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Live float telemetry binding
  const liveFloat = floats.length > 0 ? floats[0] : null;
  const displayTemp = liveFloat?.surface_temp ? `${liveFloat.surface_temp.toFixed(1)}°C` : selectedSector.surfaceTemp;
  const displaySalinity = liveFloat?.surface_salinity ? `${liveFloat.surface_salinity.toFixed(1)} PSU` : selectedSector.surfaceSalinity;

  const currentSpecies = selectedPreset.speciesBySector[selectedSector.id] || selectedPreset.speciesBySector.arabian_sea;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(17, 11, 23);
    camera.lookAt(0, -5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0); // Full transparency to show background gradient
    container.appendChild(renderer.domElement);

    // High intensity ambient & directional lights
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 2.2);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0x00f2ff, 4.0);
    sunLight.position.set(15, 30, 20);
    scene.add(sunLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 2.0);
    fillLight.position.set(-15, -10, 10);
    scene.add(fillLight);

    const cyanPoint = new THREE.PointLight(0x00f2ff, 5, 80);
    cyanPoint.position.set(0, 10, 14);
    scene.add(cyanPoint);

    const rootGroup = new THREE.Group();

    const colHeight = 14;
    const colWidth = 12;
    const colDepth = 12;

    // Glowing Outer Water Column Cage Box
    const boxGeom = new THREE.BoxGeometry(colWidth, colHeight, colDepth);
    const boxWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    boxWireframe.position.set(0, -colHeight / 2, 0);
    rootGroup.add(boxWireframe);

    // Semitransparent Inner Volume Block
    const innerVolGeom = new THREE.BoxGeometry(colWidth * 0.99, colHeight * 0.99, colDepth * 0.99);
    const innerVolMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide
    });
    const innerVol = new THREE.Mesh(innerVolGeom, innerVolMat);
    innerVol.position.set(0, -colHeight / 2, 0);
    rootGroup.add(innerVol);

    // Depth Reference Horizontal Grids
    for (let d = 1; d <= 3; d++) {
      const gPlane = new THREE.GridHelper(colWidth, 6, 0x38bdf8, 0x0284c7);
      (gPlane.material as THREE.Material).transparent = true;
      (gPlane.material as THREE.Material).opacity = 0.35;
      gPlane.position.set(0, -(d / 4) * colHeight, 0);
      rootGroup.add(gPlane);
    }

    // Dynamic Highlight Slab for Selected Horizon
    const normTop = selectedPreset.minDepth / 2000;
    const normBottom = selectedPreset.maxDepth / 2000;
    const slabHeight = Math.max(0.7, (normBottom - normTop) * colHeight);
    const slabCenterY = -(normTop * colHeight + slabHeight / 2);

    const slabGeom = new THREE.BoxGeometry(colWidth * 0.99, slabHeight, colDepth * 0.99);
    const slabMat = new THREE.MeshStandardMaterial({
      color: selectedPreset.hexColor,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.2,
      emissive: selectedPreset.hexColor,
      emissiveIntensity: 0.65,
      side: THREE.DoubleSide
    });
    const slabMesh = new THREE.Mesh(slabGeom, slabMat);
    slabMesh.position.set(0, slabCenterY, 0);
    rootGroup.add(slabMesh);

    // Bright White Glowing Edge Outline
    const slabWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(slabGeom),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1.0 })
    );
    slabMesh.add(slabWire);

    // Volumetric OMZ Hypoxic Particles (Glowing Violet)
    const omzParticleCount = 800;
    const omzPGeom = new THREE.BufferGeometry();
    const omzPPositions = new Float32Array(omzParticleCount * 3);

    for (let i = 0; i < omzParticleCount * 3; i += 3) {
      omzPPositions[i] = (Math.random() - 0.5) * (colWidth * 0.94);
      omzPPositions[i + 1] = -(colHeight * 0.2) - Math.random() * (colHeight * 0.55);
      omzPPositions[i + 2] = (Math.random() - 0.5) * (colDepth * 0.94);
    }
    omzPGeom.setAttribute('position', new THREE.BufferAttribute(omzPPositions, 3));
    const omzPMat = new THREE.PointsMaterial({ 
      color: 0xf0abfc, 
      size: 0.38, 
      transparent: true, 
      opacity: 0.95 
    });
    rootGroup.add(new THREE.Points(omzPGeom, omzPMat));

    // Luminous Neon-Cyan CTD Cast Curve
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4, 0, -4),
      new THREE.Vector3(-3, -(colHeight * 0.38), -2),
      new THREE.Vector3(0, -(colHeight * 0.65), 1),
      new THREE.Vector3(3, -colHeight, 0),
      new THREE.Vector3(4, 0, -3),
    ]);
    const tubeGeom = new THREE.TubeGeometry(curve, 100, 0.22, 12, false);
    const tubeMat = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff, 
      emissive: 0x00ffff,
      emissiveIntensity: 0.95,
      roughness: 0.05
    });
    rootGroup.add(new THREE.Mesh(tubeGeom, tubeMat));

    // Photic Surface Plankton Particles (Neon Mint)
    const particleCount = 260;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * colWidth;
      particlePositions[i + 1] = -Math.random() * (colHeight * 0.15);
      particlePositions[i + 2] = (Math.random() - 0.5) * colDepth;
    }
    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({ 
      color: 0x34d399, 
      size: 0.28, 
      transparent: true, 
      opacity: 0.95 
    });
    rootGroup.add(new THREE.Points(particleGeom, particleMat));

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

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (autoRotate && !isDragging) {
        rootGroup.rotation.y += 0.0025;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animFrameId.current || 0);
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (container.contains(dom)) container.removeChild(dom);
      renderer.dispose();
    };
  }, [selectedPreset, selectedSector, autoRotate]);

  return (
    <div className="w-full h-full flex flex-col space-y-2.5 p-3 bg-[#020713] text-slate-100 font-sans overflow-hidden">
      
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-abyssal-800 pb-2.5 shrink-0 flex-wrap gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-ocean-cyan border border-cyan-500/25 shadow-glow-cyan-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white font-heading flex items-center gap-2">
                Indian Ocean Subsurface Water Column & Habitat Slicer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-ocean-cyan font-mono border border-cyan-500/30">
                  0–2,000m Multi-Basin GIS
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setActiveModal(GLOSSARY.slicer)}
                className="p-1 rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition text-xs flex items-center gap-1 font-mono cursor-pointer"
              >
                <Info className="w-3.5 h-3.5" />
                <span>What is this?</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Calibrated across Arabian Sea, Bay of Bengal, Lakshadweep, Andaman, and Equatorial Basins
            </p>
          </div>
        </div>

        {/* Orbit Control */}
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

      {/* Basin Selector Bar */}
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
                ? 'bg-gradient-to-r from-ocean-cyan to-teal-400 text-abyssal-950 shadow-md font-extrabold'
                : 'bg-abyssal-900 text-slate-400 border border-abyssal-800 hover:text-white hover:bg-abyssal-850'
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>{sector.name}</span>
          </button>
        ))}
      </div>

      {/* Horizon Selector */}
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
              backgroundColor: selectedPreset.id === preset.id ? `${preset.color}35` : undefined,
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
        
        {/* Left 8 Columns: 3D Scene with Rich Glowing Background */}
        <div className="lg:col-span-8 flex flex-col bg-[#071933] border border-cyan-500/50 rounded-2xl p-3 relative overflow-hidden shadow-2xl shadow-cyan-950/50">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>{selectedSector.name} ({selectedSector.coords})</span>
              <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                {selectedPreset.minDepth}m – {selectedPreset.maxDepth}m
              </span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Drag to Orbit 3D Box
            </div>
          </div>

          {/* WebGL Canvas Container with Ambient Radial Navy/Teal Gradient */}
          <div className="flex-1 relative min-h-0 my-2 rounded-xl overflow-hidden border border-cyan-400/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10335e] via-[#09203d] to-[#041021] cursor-grab active:cursor-grabbing shadow-2xl">
            <div ref={mountRef} className="w-full h-full" />

            {/* In-Scene Depth HUD */}
            <div 
              onClick={() => setActiveModal(GLOSSARY.hud)}
              className="absolute top-3 left-3 bg-[#0a2347]/95 backdrop-blur-xl border border-cyan-400 rounded-xl p-2.5 font-mono text-xs text-slate-200 shadow-2xl space-y-1.5 min-w-[220px] cursor-pointer hover:border-cyan-300 transition"
            >
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-between border-b border-cyan-500/30 pb-1">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-ocean-cyan" />
                  {selectedSector.name}
                </span>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <div>Probe Cast Depth: <strong className="text-white text-sm">971 m</strong></div>
              <div>Thermal Envelope: <strong className="text-rose-400">{selectedPreset.tempRange}</strong></div>
              <div>Surface Salinity: <strong className="text-teal-300">{displaySalinity}</strong></div>
              <div>Dissolved Oxygen: <strong className="text-purple-300">{selectedPreset.avgOxygen}</strong></div>
              <div>Phytoplankton (Chl-a): <strong className="text-emerald-400">{selectedPreset.phytoAbundance}</strong></div>
            </div>

            {/* High-Contrast Glowing Depth Milestones */}
            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between py-2 text-[10px] font-mono text-right pointer-events-none z-10 font-bold">
              <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">0m (Surface Photic)</span>
              <span className="text-yellow-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.9)]">300m (Thermocline)</span>
              <span className="text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]">1,000m (OMZ Hypoxia)</span>
              <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]">2,000m (Abyssal Floor)</span>
            </div>
          </div>

          {/* Basin Hydrodynamic Strip */}
          <div className="grid grid-cols-4 gap-2 pt-1 shrink-0 font-mono text-center text-xs">
            <div className="p-2 rounded-xl bg-[#092244] border border-cyan-500/30">
              <div className="text-[10px] text-slate-400">Surface Temp</div>
              <div className="text-rose-400 font-bold">{displayTemp}</div>
            </div>
            <div className="p-2 rounded-xl bg-[#092244] border border-cyan-500/30">
              <div className="text-[10px] text-slate-400">Mixed Layer (MLD)</div>
              <div className="text-cyan-300 font-bold">{selectedSector.mldDepth} m</div>
            </div>
            <div className="p-2 rounded-xl bg-[#092244] border border-cyan-500/30">
              <div className="text-[10px] text-slate-400">Salinity Profile</div>
              <div className="text-teal-300 font-bold text-[11px] truncate">{displaySalinity}</div>
            </div>
            <div 
              onClick={() => setActiveModal(GLOSSARY.omz)}
              className="p-2 rounded-xl bg-[#092244] border border-purple-500/40 hover:border-purple-300 cursor-pointer transition"
            >
              <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <span>OMZ Profile</span>
                <Info className="w-2.5 h-2.5 text-slate-400" />
              </div>
              <div className="text-purple-300 font-bold text-[11px] truncate">{selectedSector.omzIntensity}</div>
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
              <p>{activeModal.desc}</p>
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 space-y-1 font-mono">
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Operational Significance:</span>
                <p className="text-slate-200 text-[11px]">{activeModal.benefit}</p>
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