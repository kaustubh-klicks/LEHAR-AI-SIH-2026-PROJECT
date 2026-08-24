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

interface HorizonConfig {
  tempRange: string;
  minDepth: number;
  maxDepth: number;
  avgOxygen: string;
  oxygenVal: number;
  phytoAbundance: string;
  lightPenetration: string;
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
  horizons: {
    surface_warm: HorizonConfig;
    upper_thermocline: HorizonConfig;
    mesopelagic_omz: HorizonConfig;
    bathypelagic_abyss: HorizonConfig;
  };
}

interface ThermalPresetMeta {
  id: 'surface_warm' | 'upper_thermocline' | 'mesopelagic_omz' | 'bathypelagic_abyss';
  name: string;
  description: string;
  color: string;
  hexColor: number;
  speciesBySector: Record<string, { name: string; type: string; depthHabit: string }[]>;
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
    omzIntensity: '< 12 µmol/kg (Dead Zone at 180–850m)',
    doMin: 4.8,
    hydroSummary: 'Intense Southwest Monsoon upwelling along the western coast driving massive primary production and a deep sub-surface hypoxic envelope.',
    horizons: {
      surface_warm: {
        tempRange: '26.5°C – 30.0°C',
        minDepth: 0,
        maxDepth: 85,
        avgOxygen: '210 µmol/kg',
        oxygenVal: 210,
        phytoAbundance: '0.85 mg/m³ (Peak Plume)',
        lightPenetration: '100% – Full Sunlit Euphotic',
      },
      upper_thermocline: {
        tempRange: '18.0°C – 25.0°C',
        minDepth: 85,
        maxDepth: 250,
        avgOxygen: '75 µmol/kg',
        oxygenVal: 75,
        phytoAbundance: '0.12 mg/m³ (Subsurface)',
        lightPenetration: '12% – Twilight Stratum',
      },
      mesopelagic_omz: {
        tempRange: '8.0°C – 15.0°C',
        minDepth: 180,
        maxDepth: 850,
        avgOxygen: '4.8 µmol/kg (Lethal Hypoxia)',
        oxygenVal: 4.8,
        phytoAbundance: '0.00 mg/m³ (Aphotic)',
        lightPenetration: '0.0% – Dark Zone',
      },
      bathypelagic_abyss: {
        tempRange: '2.4°C – 5.0°C',
        minDepth: 850,
        maxDepth: 2000,
        avgOxygen: '42 µmol/kg',
        oxygenVal: 42,
        phytoAbundance: '0.00 mg/m³ (Marine Snow)',
        lightPenetration: '0% – Pitch Black',
      },
    },
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
    mldDepth: 45,
    omzIntensity: '35 µmol/kg (Moderate Mesopelagic OMZ)',
    doMin: 22.0,
    hydroSummary: 'Ganga-Brahmaputra river discharge creates a low-salinity freshwater cap, preventing vertical mixing and preserving heat.',
    horizons: {
      surface_warm: {
        tempRange: '27.5°C – 30.5°C',
        minDepth: 0,
        maxDepth: 45,
        avgOxygen: '205 µmol/kg',
        oxygenVal: 205,
        phytoAbundance: '0.72 mg/m³ (Riverine Plume)',
        lightPenetration: '100% – Full Sunlit Euphotic',
      },
      upper_thermocline: {
        tempRange: '19.0°C – 26.0°C',
        minDepth: 45,
        maxDepth: 220,
        avgOxygen: '98 µmol/kg',
        oxygenVal: 98,
        phytoAbundance: '0.18 mg/m³ (Barrier Layer)',
        lightPenetration: '15% – Twilight Stratum',
      },
      mesopelagic_omz: {
        tempRange: '9.0°C – 16.0°C',
        minDepth: 250,
        maxDepth: 700,
        avgOxygen: '22.0 µmol/kg (Moderate OMZ)',
        oxygenVal: 22.0,
        phytoAbundance: '0.00 mg/m³ (Aphotic)',
        lightPenetration: '0.1% – Twilight Zone',
      },
      bathypelagic_abyss: {
        tempRange: '2.8°C – 5.5°C',
        minDepth: 700,
        maxDepth: 2000,
        avgOxygen: '50 µmol/kg',
        oxygenVal: 50,
        phytoAbundance: '0.00 mg/m³ (Marine Snow)',
        lightPenetration: '0% – Pitch Black',
      },
    },
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
    mldDepth: 65,
    omzIntensity: '55 µmol/kg',
    doMin: 35.0,
    hydroSummary: 'Productive continental shelf break with active coral lagoon ecosystems and primary skipjack tuna feeding grounds.',
    horizons: {
      surface_warm: {
        tempRange: '27.0°C – 30.0°C',
        minDepth: 0,
        maxDepth: 65,
        avgOxygen: '218 µmol/kg',
        oxygenVal: 218,
        phytoAbundance: '0.92 mg/m³ (Atoll Bloom)',
        lightPenetration: '100% – Coral Photic',
      },
      upper_thermocline: {
        tempRange: '18.5°C – 25.5°C',
        minDepth: 65,
        maxDepth: 220,
        avgOxygen: '110 µmol/kg',
        oxygenVal: 110,
        phytoAbundance: '0.16 mg/m³ (Upwelling Shelf)',
        lightPenetration: '18% – Twilight Stratum',
      },
      mesopelagic_omz: {
        tempRange: '8.5°C – 15.5°C',
        minDepth: 220,
        maxDepth: 650,
        avgOxygen: '35.0 µmol/kg (Sub-Hypoxic)',
        oxygenVal: 35.0,
        phytoAbundance: '0.00 mg/m³ (Aphotic)',
        lightPenetration: '0.1% – Twilight Zone',
      },
      bathypelagic_abyss: {
        tempRange: '2.5°C – 5.0°C',
        minDepth: 650,
        maxDepth: 2000,
        avgOxygen: '48 µmol/kg',
        oxygenVal: 48,
        phytoAbundance: '0.00 mg/m³ (Marine Snow)',
        lightPenetration: '0% – Pitch Black',
      },
    },
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
    mldDepth: 55,
    omzIntensity: '48 µmol/kg',
    doMin: 45.0,
    hydroSummary: 'Deep volcanic trenches with strong tidal internal waves and rich benthic coral-shelf ecosystems.',
    horizons: {
      surface_warm: {
        tempRange: '27.2°C – 30.2°C',
        minDepth: 0,
        maxDepth: 55,
        avgOxygen: '212 µmol/kg',
        oxygenVal: 212,
        phytoAbundance: '0.68 mg/m³ (Island Shelf)',
        lightPenetration: '100% – Full Sunlit Euphotic',
      },
      upper_thermocline: {
        tempRange: '18.0°C – 25.0°C',
        minDepth: 55,
        maxDepth: 280,
        avgOxygen: '125 µmol/kg (Internal Wave Pumping)',
        oxygenVal: 125,
        phytoAbundance: '0.22 mg/m³ (Subsurface)',
        lightPenetration: '14% – Twilight Stratum',
      },
      mesopelagic_omz: {
        tempRange: '8.0°C – 15.0°C',
        minDepth: 300,
        maxDepth: 600,
        avgOxygen: '45.0 µmol/kg (Trench Buffer)',
        oxygenVal: 45.0,
        phytoAbundance: '0.00 mg/m³ (Aphotic)',
        lightPenetration: '0.1% – Twilight Zone',
      },
      bathypelagic_abyss: {
        tempRange: '2.2°C – 4.8°C',
        minDepth: 600,
        maxDepth: 2000,
        avgOxygen: '54 µmol/kg',
        oxygenVal: 54,
        phytoAbundance: '0.00 mg/m³ (Hadal Ridge Snow)',
        lightPenetration: '0% – Pitch Black',
      },
    },
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
    horizons: {
      surface_warm: {
        tempRange: '26.0°C – 29.5°C',
        minDepth: 0,
        maxDepth: 120,
        avgOxygen: '220 µmol/kg (High Dynamic Mixing)',
        oxygenVal: 220,
        phytoAbundance: '0.55 mg/m³ (Pelagic Dispersed)',
        lightPenetration: '100% – Full Sunlit Euphotic',
      },
      upper_thermocline: {
        tempRange: '17.5°C – 24.5°C',
        minDepth: 120,
        maxDepth: 350,
        avgOxygen: '145 µmol/kg (Undercurrent Vent)',
        oxygenVal: 145,
        phytoAbundance: '0.08 mg/m³ (Deep Euphotic)',
        lightPenetration: '8% – Twilight Stratum',
      },
      mesopelagic_omz: {
        tempRange: '7.5°C – 14.5°C',
        minDepth: 400,
        maxDepth: 600,
        avgOxygen: '78.0 µmol/kg (Unrestricted Breathing)',
        oxygenVal: 78.0,
        phytoAbundance: '0.00 mg/m³ (Aphotic)',
        lightPenetration: '0.05% – Twilight Zone',
      },
      bathypelagic_abyss: {
        tempRange: '1.8°C – 4.2°C',
        minDepth: 600,
        maxDepth: 2000,
        avgOxygen: '68 µmol/kg (Antarctic Flow)',
        oxygenVal: 68,
        phytoAbundance: '0.00 mg/m³ (Marine Snow)',
        lightPenetration: '0% – Pitch Black',
      },
    },
  },
];

const PRESETS_META: ThermalPresetMeta[] = [
  {
    id: 'surface_warm',
    name: 'Tropical Warm Pool',
    description: 'The epipelagic photic blanket driven by monsoonal solar heating and surface wind mixing. Primary breeding and feeding ground.',
    color: '#ff3366',
    hexColor: 0xff3366,
    speciesBySector: {
      arabian_sea: [
        { name: 'Indian Oil Sardine (Sardinella longiceps)', type: 'Coastal Pelagic', depthHabit: '0–45m' },
        { name: 'Indian Mackerel (Rastrelliger kanagurta)', type: 'Schooling Forager', depthHabit: '15–70m' },
        { name: 'Silver Pomfret', type: 'Commercial Catch', depthHabit: '10–55m' },
        { name: 'Ribbonfish', type: 'Predatory Pelagic', depthHabit: '30–85m' },
      ],
      bay_of_bengal: [
        { name: 'Hilsa Shad (Tenualosa ilisha)', type: 'Anadromous Forager', depthHabit: '0–40m' },
        { name: 'Bombay Duck (Harpadon nehereus)', type: 'Estuarine Coastal', depthHabit: '10–45m' },
        { name: 'Tiger Prawns (Penaeus monodon)', type: 'Coastal Planktonic', depthHabit: '0–35m' },
        { name: 'Anchovies', type: 'Phytoplankton Feeder', depthHabit: '0–40m' },
      ],
      lakshadweep_sea: [
        { name: 'Skipjack Tuna (Katsuwonus pelamis)', type: 'Surface Feeder', depthHabit: '0–60m' },
        { name: 'Bluefin Trevally', type: 'Reef Pelagic', depthHabit: '5–55m' },
        { name: 'Needlefish', type: 'Surface Hunter', depthHabit: '0–20m' },
      ],
      andaman_sea: [
        { name: 'Spanish Mackerel (Seerfish)', type: 'Coastal Predator', depthHabit: '10–50m' },
        { name: 'Coral Trout & Groupers', type: 'Reef Benthic', depthHabit: '15–55m' },
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
    name: 'Upper Thermocline',
    description: 'Zone of sharpest thermal decline. Active hunting corridor for deep-diving pelagic gamefish.',
    color: '#ffbb00',
    hexColor: 0xffbb00,
    speciesBySector: {
      arabian_sea: [
        { name: 'Yellowfin Tuna (Thunnus albacares)', type: 'Apex Migrator', depthHabit: '85–240m' },
        { name: 'Skipjack Tuna', type: 'Thermocline Feeder', depthHabit: '85–200m' },
        { name: 'Swordfish (Xiphias gladius)', type: 'Deep Billfish', depthHabit: '120–250m' },
      ],
      bay_of_bengal: [
        { name: 'Bigeye Tuna (Thunnus obesus)', type: 'Deep Predator', depthHabit: '50–220m' },
        { name: 'Barracuda', type: 'Mesopelagic Hunter', depthHabit: '60–200m' },
        { name: 'Oceanic Squid', type: 'Cephalopod', depthHabit: '50–220m' },
      ],
      lakshadweep_sea: [
        { name: 'Yellowfin Tuna', type: 'Commercial Pelagic', depthHabit: '70–220m' },
        { name: 'Wahoo (Acanthocybium solandri)', type: 'Speed Predator', depthHabit: '70–180m' },
        { name: 'Manta Rays', type: 'Thermocline Filterer', depthHabit: '65–200m' },
      ],
      andaman_sea: [
        { name: 'Dogtooth Tuna', type: 'Drop-off Hunter', depthHabit: '60–260m' },
        { name: 'Giant Trevally (GT)', type: 'Deep Shelf Hunter', depthHabit: '60–200m' },
        { name: 'Reef Sharks', type: 'Subsurface Hunter', depthHabit: '60–250m' },
      ],
      equatorial_basin: [
        { name: 'Bigeye Tuna', type: 'Trans-Oceanic', depthHabit: '120–350m' },
        { name: 'Blue Marlin', type: 'Apex Billfish', depthHabit: '120–300m' },
        { name: 'Silky Shark', type: 'Pelagic Predator', depthHabit: '120–280m' },
      ],
    },
  },
  {
    id: 'mesopelagic_omz',
    name: 'Mesopelagic OMZ',
    description: 'Mid-water hypoxic zone. Sustains massive biomass of lanternfish undergoing nocturnal vertical migration.',
    color: '#d946ef',
    hexColor: 0xd946ef,
    speciesBySector: {
      arabian_sea: [
        { name: 'Lanternfish (Benthosema pterotum)', type: 'Bioluminescent Biomass', depthHabit: '200–800m' },
        { name: 'Purpleback Flying Squid (Sthenoteuthis)', type: 'Hypoxia Tolerant', depthHabit: '200–700m' },
        { name: 'Deep-Sea Hatchetfish', type: 'Photophore Specialist', depthHabit: '300–850m' },
      ],
      bay_of_bengal: [
        { name: 'Myctophid Lanternfish', type: 'Diel Migrator', depthHabit: '260–700m' },
        { name: 'Bristlemouths (Cyclothone)', type: 'Abundant Mesopelagic', depthHabit: '300–700m' },
        { name: 'Glass Squid', type: 'Transparent Cephalopod', depthHabit: '350–700m' },
      ],
      lakshadweep_sea: [
        { name: 'Deep Snappers (Etelis coruscans)', type: 'Seamount Benthic', depthHabit: '240–650m' },
        { name: 'Lanternfish Clusters', type: 'Forage Base', depthHabit: '250–650m' },
      ],
      andaman_sea: [
        { name: 'Andaman Deep-Sea Lobster', type: 'Trench Benthic', depthHabit: '300–600m' },
        { name: 'Bioluminescent Jellyfish', type: 'Cnidarian', depthHabit: '300–600m' },
      ],
      equatorial_basin: [
        { name: 'Vampire Squid (Vampyroteuthis)', type: 'Detritivore Cephalopod', depthHabit: '400–600m' },
        { name: 'Gulper Eel Juveniles', type: 'Mesopelagic', depthHabit: '400–600m' },
      ],
    },
  },
  {
    id: 'bathypelagic_abyss',
    name: 'Bathypelagic Abyss',
    description: 'Cold, high-pressure abyssal deep layer sustained by sinking organic marine snow and deep Antarctic currents.',
    color: '#00d4ff',
    hexColor: 0x00d4ff,
    speciesBySector: {
      arabian_sea: [
        { name: "Sloane's Viperfish (Chauliodus sloani)", type: 'Abyssal Predator', depthHabit: '900–1800m' },
        { name: 'Deep-Sea Dragonfish', type: 'Barbel Hunter', depthHabit: '1000–1900m' },
        { name: 'Giant Benthic Isopods', type: 'Scavenger', depthHabit: '1100–2000m' },
      ],
      bay_of_bengal: [
        { name: 'Deep-Sea Gulper Eel (Eurypharynx pelecanoides)', type: 'Abyssal Scavenger', depthHabit: '750–2000m' },
        { name: 'Grenadier / Rattail Fish', type: 'Benthic Forager', depthHabit: '800–1950m' },
      ],
      lakshadweep_sea: [
        { name: 'Abyssal Sea Cucumbers', type: 'Holothurian Detritivore', depthHabit: '700–2000m' },
        { name: 'Tripod Fish (Bathypterois)', type: 'Stilt Benthic', depthHabit: '800–2000m' },
      ],
      andaman_sea: [
        { name: 'Andaman Trench Snailfish', type: 'Hadal/Abyssal', depthHabit: '650–2000m' },
        { name: 'Chimaera (Ghost Shark)', type: 'Deep Chondrichthyes', depthHabit: '700–1850m' },
      ],
      equatorial_basin: [
        { name: 'Fangtooth (Anoplogaster cornuta)', type: 'Apex Abyssal', depthHabit: '650–2000m' },
        { name: 'Giant Amphipods', type: 'Crustacean Detritivore', depthHabit: '700–2000m' },
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
    title: 'Water Column Telemetry Guide',
    subtitle: 'In-Situ Horizon Parameter Breakdown',
    desc: 'This card displays physical and biogeochemical ocean parameters measured for the currently isolated depth layer:',
    benefit: `• Thermal Envelope: The temperature boundaries (°C) confining this specific depth layer.
• Surface Salinity (PSU): Practical Salinity Units representing salt concentration (evaporation vs freshwater input).
• Dissolved Oxygen (µmol/kg): Breathable oxygen for marine life (>180 indicates rich waters, <20 indicates hypoxic dead zones).
• Phytoplankton (Chl-a): Microscopic plant density (mg/m³) serving as the fundamental food source for pelagic fish.`
  },
  omz: {
    title: 'Oxygen Minimum Zone (OMZ) / Dead Zone',
    subtitle: 'Mid-Water Oxygen Depletion (180–850m)',
    desc: 'A thick sub-surface layer where bacteria consume dissolved oxygen during organic decay. Oxygen drops below 20 µmol/kg, creating an uninhabitable zone for commercial fish.',
    benefit: 'Trawler nets dropped into this zone catch zero commercial fish. Visualizing it prevents wasted gear, time, and diesel.'
  }
};

export const HydrographicTransect: React.FC<HydrographicTransectProps> = ({ floats = [] }) => {
  const [selectedSector, setSelectedSector] = useState<SectorProfile>(INDIAN_OCEAN_SECTORS[0]);
  const [selectedPresetId, setSelectedPresetId] = useState<ThermalPresetMeta['id']>('surface_warm');
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<GlossaryModal | null>(null);

  const mountRef = useRef<HTMLDivElement | null>(null);
  const animFrameId = useRef<number | null>(null);

  const liveFloat = floats.length > 0 ? floats[0] : null;
  const displaySalinity = liveFloat?.surface_salinity ? `${liveFloat.surface_salinity.toFixed(1)} PSU` : selectedSector.surfaceSalinity;

  const currentPresetMeta = PRESETS_META.find(p => p.id === selectedPresetId) || PRESETS_META[0];
  const currentHorizonConfig = selectedSector.horizons[selectedPresetId];
  const currentSpecies = currentPresetMeta.speciesBySector[selectedSector.id] || currentPresetMeta.speciesBySector.arabian_sea;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(17, 11, 23);
    camera.lookAt(0, -5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, logarithmicDepthBuffer: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

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

    const boxGeom = new THREE.BoxGeometry(colWidth, colHeight, colDepth);
    const boxWireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(boxGeom),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    boxWireframe.position.set(0, -colHeight / 2, 0);
    rootGroup.add(boxWireframe);

    const innerVolGeom = new THREE.BoxGeometry(colWidth * 0.98, colHeight * 0.98, colDepth * 0.98);
    const innerVolMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const innerVol = new THREE.Mesh(innerVolGeom, innerVolMat);
    innerVol.position.set(0, -colHeight / 2, 0);
    rootGroup.add(innerVol);

    for (let d = 1; d <= 3; d++) {
      const gPlane = new THREE.GridHelper(colWidth * 0.98, 6, 0x38bdf8, 0x0284c7);
      (gPlane.material as THREE.Material).transparent = true;
      (gPlane.material as THREE.Material).opacity = 0.35;
      (gPlane.material as THREE.Material).depthWrite = false;
      gPlane.position.set(0, -(d / 4) * colHeight, 0);
      rootGroup.add(gPlane);
    }

    // Dynamic depth positioning calibrated per sector
    const normTop = currentHorizonConfig.minDepth / 2000;
    const normBottom = currentHorizonConfig.maxDepth / 2000;
    const slabHeight = Math.max(0.7, (normBottom - normTop) * colHeight);
    const slabCenterY = -(normTop * colHeight + slabHeight / 2);

    const slabGeom = new THREE.BoxGeometry(colWidth * 0.97, slabHeight, colDepth * 0.97);
    const slabMat = new THREE.MeshStandardMaterial({
      color: currentPresetMeta.hexColor,
      transparent: true,
      opacity: 0.72,
      roughness: 0.1,
      metalness: 0.2,
      emissive: currentPresetMeta.hexColor,
      emissiveIntensity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slabMesh = new THREE.Mesh(slabGeom, slabMat);
    slabMesh.position.set(0, slabCenterY, 0);
    rootGroup.add(slabMesh);

    const slabWire = new THREE.LineSegments(
      new THREE.EdgesGeometry(slabGeom),
      new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false })
    );
    slabMesh.add(slabWire);

    // Dynamic Dissolved Oxygen particle spawning calibrated to each sea's real layers
    const hConfigs = selectedSector.horizons;
    const layerConfigs = [
      { minD: hConfigs.surface_warm.minDepth, maxD: hConfigs.surface_warm.maxDepth, count: Math.round((hConfigs.surface_warm.oxygenVal / 220) * 450) },
      { minD: hConfigs.upper_thermocline.minDepth, maxD: hConfigs.upper_thermocline.maxDepth, count: Math.round((hConfigs.upper_thermocline.oxygenVal / 220) * 450) },
      { minD: hConfigs.mesopelagic_omz.minDepth, maxD: hConfigs.mesopelagic_omz.maxDepth, count: Math.max(15, Math.round((hConfigs.mesopelagic_omz.oxygenVal / 220) * 450)) },
      { minD: hConfigs.bathypelagic_abyss.minDepth, maxD: hConfigs.bathypelagic_abyss.maxDepth, count: Math.round((hConfigs.bathypelagic_abyss.oxygenVal / 220) * 450) },
    ];

    const oxyPositions: number[] = [];

    layerConfigs.forEach((cfg) => {
      const topY = -(cfg.minD / 2000) * colHeight;
      const bottomY = -(cfg.maxD / 2000) * colHeight;
      const layerH = Math.abs(bottomY - topY);

      for (let i = 0; i < cfg.count; i++) {
        const px = (Math.random() - 0.5) * (colWidth * 0.92);
        const py = topY - Math.random() * layerH;
        const pz = (Math.random() - 0.5) * (colDepth * 0.92);
        oxyPositions.push(px, py, pz);
      }
    });

    const oxyGeom = new THREE.BufferGeometry();
    oxyGeom.setAttribute('position', new THREE.Float32BufferAttribute(oxyPositions, 3));
    const oxyMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.35,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    rootGroup.add(new THREE.Points(oxyGeom, oxyMat));

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

    scene.add(rootGroup);

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
  }, [selectedPresetId, selectedSector, autoRotate, currentHorizonConfig, currentPresetMeta]);

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

      {/* Dynamic Horizon Selector Bar */}
      <div className="flex items-center gap-2 bg-abyssal-950 p-1.5 rounded-2xl border border-abyssal-800 shrink-0 flex-wrap">
        <span className="text-[11px] font-mono text-slate-400 px-2 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          Isolate Horizon:
        </span>

        {PRESETS_META.map((preset) => {
          const horizon = selectedSector.horizons[preset.id];
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => setSelectedPresetId(preset.id)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'shadow-md border'
                  : 'bg-abyssal-900 text-slate-400 border border-abyssal-800 hover:text-white hover:bg-abyssal-850'
              }`}
              style={{
                backgroundColor: isSelected ? `${preset.color}35` : undefined,
                borderColor: isSelected ? preset.color : undefined,
                color: isSelected ? '#ffffff' : undefined,
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }}></span>
              <span>{preset.name} ({horizon.minDepth}m – {horizon.maxDepth}m)</span>
            </button>
          );
        })}
      </div>

      {/* Main 3D Stage + Filtered Sector Telemetry */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left 8 Columns: 3D Scene */}
        <div className="lg:col-span-8 flex flex-col bg-[#071933] border border-cyan-500/50 rounded-2xl p-3 relative overflow-hidden shadow-2xl shadow-cyan-950/50">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-2 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>{selectedSector.name} ({selectedSector.coords})</span>
              <span className="text-[10px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50">
                {currentHorizonConfig.minDepth}m – {currentHorizonConfig.maxDepth}m
              </span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Drag to Orbit 3D Box
            </div>
          </div>

          {/* WebGL Canvas Container */}
          <div className="flex-1 relative min-h-0 mt-2 rounded-xl overflow-hidden border border-cyan-400/40 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#10335e] via-[#09203d] to-[#041021] cursor-grab active:cursor-grabbing shadow-2xl">
            <div ref={mountRef} className="w-full h-full" />

            {/* In-Scene Depth HUD */}
            <div 
              className="absolute top-3 left-3 bg-[#0a2347]/95 backdrop-blur-xl border border-cyan-400 rounded-xl p-2.5 font-mono text-xs text-slate-200 shadow-2xl space-y-1.5 min-w-[220px] transition"
            >
              <div className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider flex items-center justify-between border-b border-cyan-500/30 pb-1">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-ocean-cyan" />
                  {selectedSector.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveModal(GLOSSARY.hud);
                  }}
                  className="p-0.5 rounded text-cyan-300 hover:text-white hover:bg-cyan-500/20 transition cursor-pointer"
                  title="Click to understand these numbers"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>Thermal Envelope: <strong className="text-rose-400">{currentHorizonConfig.tempRange}</strong></div>
              <div>Surface Salinity: <strong className="text-teal-300">{displaySalinity}</strong></div>
              <div>Dissolved Oxygen: <strong className="text-purple-300">{currentHorizonConfig.avgOxygen}</strong></div>
              <div>Phytoplankton (Chl-a): <strong className="text-emerald-400">{currentHorizonConfig.phytoAbundance}</strong></div>
            </div>

            {/* High-Contrast Glowing Depth Milestones */}
            <div className="absolute right-3 top-3 bottom-3 flex flex-col justify-between py-2 text-[10px] font-mono text-right pointer-events-none z-10 font-bold">
              <span className="text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.9)]">0m (Surface Photic)</span>
              <span className="text-yellow-300 drop-shadow-[0_0_8px_rgba(234,179,8,0.9)]">{selectedSector.horizons.upper_thermocline.minDepth}m (Thermocline)</span>
              <span className="text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]">{selectedSector.horizons.mesopelagic_omz.minDepth}m (OMZ Hypoxia)</span>
              <span className="text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]">2,000m (Abyssal Floor)</span>
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
            <span>Fishes in {selectedSector.name} ({currentHorizonConfig.tempRange})</span>
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
                <span className="text-[10px] font-bold text-cyan-300 uppercase">Parameter Breakdown:</span>
                <p className="text-slate-200 text-[11px] whitespace-pre-line leading-relaxed">{activeModal.benefit}</p>
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