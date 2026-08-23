import React, { useState } from 'react';
import { 
  Layers, 
  MapPin, 
  Globe, 
  Info, 
  X, 
  Flame, 
  Radio, 
  Snowflake, 
  Anchor, 
  Droplets,
  Compass,
  Fish,
  Sun,
  Moon,
  AlertCircle,
  Shield,
  HelpCircle,
  Activity
} from 'lucide-react';
import type { FloatSummary } from '../../types';

interface TSDiagram3DProps {
  floats?: FloatSummary[];
}

interface StructuredUseCase {
  title: string;
  problem: string;
  howItHelps: string;
  whoUsesIt: string;
}

interface PelagicZone {
  id: string;
  name: string;
  scientificName: string;
  code: string;
  depthRange: string;
  minDepth: number;
  maxDepth: number;
  yStart: number;
  yEnd: number;
  color: string;
  ambientFill: string;
  temp: string;
  salinity: string;
  oxygen: string;
  sigmaTheta: string;
  lightLevel: string;
  operationalImpact: string;
  impactIcon: React.ReactNode;
  description: string;
  speciesOrFeature: string;
  useCase: StructuredUseCase;
}

interface BasinProfile {
  id: string;
  name: string;
  badge: string;
  coords: string;
  summary: string;
  surfaceSummary: string;
  zones: PelagicZone[];
}

const BASIN_PROFILES: BasinProfile[] = [
  {
    id: 'arabian_sea',
    name: 'Arabian Sea (West Coast)',
    badge: 'High Salinity • Severe OMZ',
    coords: '15.5°N, 68.2°E',
    summary: 'Arid desert winds drive intense solar evaporation creating dense, saline surface water (ASHSW), while deep microbial decay creates a massive sub-surface oxygen dead zone.',
    surfaceSummary: '36.8 PSU Salinity • 28.8°C SST',
    zones: [
      {
        id: 'surface_warm',
        name: 'Tropical Warm Pool (> 26.5°C)',
        scientificName: 'Epipelagic Photic Blanket',
        code: 'ASHSW',
        depthRange: '0m – 100m (Photic Surface)',
        minDepth: 0,
        maxDepth: 100,
        yStart: 40,
        yEnd: 95,
        color: '#f43f5e',
        ambientFill: 'rgba(244, 63, 94, 0.28)',
        temp: '26.5°C – 30.0°C',
        salinity: '36.5 – 36.9 PSU',
        oxygen: '210 µmol/kg (Saturated)',
        sigmaTheta: '22.5 – 23.2 kg/m³',
        lightLevel: '100% – Full Sunlight',
        operationalImpact: 'Primary Commercial Fishery Ceiling',
        impactIcon: <Anchor className="w-4 h-4 text-rose-400" />,
        description: 'Warm, highly evaporated saline layer. High photosynthetic activity fueling primary pelagic schools along India’s western shelf.',
        speciesOrFeature: 'Indian Oil Sardine, Indian Mackerel, Silver Pomfret',
        useCase: {
          title: 'Finding Pelagic Fish & Preventing Empty Nets',
          problem: 'Fishermen waste fuel searching blindly for sardine and mackerel schools without knowing where thermal boundaries concentrate baitfish.',
          howItHelps: 'High surface salinity and warm temperatures trap nutrients above the thermocline. By mapping this boundary, scientists pinpoint exact schooling fronts along the coast.',
          whoUsesIt: 'INCOIS & CMFRI to broadcast daily Potential Fishing Zone (PFZ) advisories directly to coastal fishermen.'
        }
      },
      {
        id: 'upper_thermocline',
        name: 'Upper Thermocline (18°C – 25°C)',
        scientificName: 'Neritic / Bathyal Shelf Break',
        code: 'THERMO',
        depthRange: '100m – 300m (Rapid Cooling)',
        minDepth: 100,
        maxDepth: 300,
        yStart: 95,
        yEnd: 155,
        color: '#eab308',
        ambientFill: 'rgba(234, 179, 8, 0.25)',
        temp: '18.0°C – 25.0°C',
        salinity: '35.8 – 36.2 PSU',
        oxygen: '95 µmol/kg (Moderate)',
        sigmaTheta: '24.5 – 25.8 kg/m³',
        lightLevel: '10% – Twilight Stratum',
        operationalImpact: 'Pelagic Longline Tuna Hunting Horizon',
        impactIcon: <Compass className="w-4 h-4 text-amber-400" />,
        description: 'Zone of sharpest thermal decline. Active hunting corridor for deep-diving pelagic gamefish tracking food along the shelf break.',
        speciesOrFeature: 'Yellowfin Tuna, Skipjack Tuna, Swordfish',
        useCase: {
          title: 'Commercial Tuna Longline Hook Depth Calibration',
          problem: 'Commercial tuna vessels drop longlines too deep into sub-thermocline layers, wasting expensive gear and missing migrating schools.',
          howItHelps: 'Tracks the exact 20°C isotherm depth where Yellowfin tuna actively hunt before retreating upward to breathe.',
          whoUsesIt: 'Deep-sea commercial tuna longliners and MPEDA (Marine Products Export Development Authority).'
        }
      },
      {
        id: 'mesopelagic_omz',
        name: 'Mesopelagic OMZ (8°C – 15°C)',
        scientificName: 'Bathyal Mesopelagic Dead Zone',
        code: 'RSOW / OMZ',
        depthRange: '300m – 1,000m (Hypoxic Core)',
        minDepth: 300,
        maxDepth: 1000,
        yStart: 155,
        yEnd: 235,
        color: '#a855f7',
        ambientFill: 'rgba(168, 85, 247, 0.26)',
        temp: '8.0°C – 15.0°C',
        salinity: '35.5 – 37.2 PSU (Red Sea Core)',
        oxygen: '< 18 µmol/kg (Dead Zone)',
        sigmaTheta: '26.5 – 27.2 kg/m³',
        lightLevel: '0.1% – Twilight Zone',
        operationalImpact: 'Dead Zone Fishery Exclusion & Sonar Ducts',
        impactIcon: <Radio className="w-4 h-4 text-purple-400" />,
        description: 'Red Sea spillover combined with zero-oxygen conditions. Commercial fish suffocate here; density steps create naval sonar shadow zones.',
        speciesOrFeature: 'Lanternfish (Myctophids), Flying Squid, Hatchetfish',
        useCase: {
          title: 'Submarine Stealth & Sonar Shadow Zones',
          problem: 'Sonar soundwaves do not travel straight underwater; when they hit a sharp temperature and salinity boundary, they bend and create blind spots.',
          howItHelps: 'The transition between salty Red Sea water (RSOW) and cold deep water creates an underwater acoustic shadow zone where submarines hide from enemy active sonar.',
          whoUsesIt: 'Indian Navy for anti-submarine warfare (ASW) tactics, bathythermograph routing, and acoustic shadow navigation.'
        }
      },
      {
        id: 'bathypelagic_abyss',
        name: 'Bathypelagic Abyss (< 5°C)',
        scientificName: 'Abyssal Floor & Benthic Trench',
        code: 'IDW',
        depthRange: '1,000m – 2,000m+ (Abyssal Floor)',
        minDepth: 1000,
        maxDepth: 2000,
        yStart: 235,
        yEnd: 300,
        color: '#06b6d4',
        ambientFill: 'rgba(6, 182, 212, 0.22)',
        temp: '2.4°C – 5.0°C',
        salinity: '34.7 – 34.8 PSU',
        oxygen: '48 µmol/kg (Antarctic Flow)',
        sigmaTheta: '27.7 – 27.9 kg/m³',
        lightLevel: '0% – Pitch Black',
        operationalImpact: 'Planetary Heat & Carbon Sink (> 1,000m)',
        impactIcon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        description: 'Near-freezing deep abyssal current carrying dense sub-polar waters northward along the ocean bed.',
        speciesOrFeature: 'Sloane’s Viperfish, Deep-Sea Dragonfish, Giant Isopods',
        useCase: {
          title: 'Global Climate Conveyor & Ocean Heat Sink',
          problem: 'Climate scientists cannot predict multi-decadal monsoon stability without knowing how much anthropogenic heat the deep abyss absorbs.',
          howItHelps: 'Tracks cold Antarctic subduction feeding the deep Indian Ocean floor, quantifying global thermohaline overturning rates.',
          whoUsesIt: 'Ministry of Earth Sciences (MoES) and IPCC global climate modelers.'
        }
      }
    ]
  },
  {
    id: 'bay_of_bengal',
    name: 'Bay of Bengal (East Coast)',
    badge: 'Low Salinity • Barrier Layer',
    coords: '13.2°N, 86.5°E',
    summary: 'Massive freshwater discharge from the Ganges, Brahmaputra, and Irrawaddy rivers creates a lightweight freshwater cap (BBLSW) that blocks vertical mixing and superheats cyclones.',
    surfaceSummary: '32.4 PSU Salinity • 29.6°C SST',
    zones: [
      {
        id: 'surface_warm',
        name: 'Tropical Warm Pool (> 26.5°C)',
        scientificName: 'Buoyant Freshwater Plume',
        code: 'BBLSW',
        depthRange: '0m – 80m (Freshwater Cap)',
        minDepth: 0,
        maxDepth: 80,
        yStart: 40,
        yEnd: 95,
        color: '#22c55e',
        ambientFill: 'rgba(34, 197, 94, 0.28)',
        temp: '27.0°C – 30.2°C',
        salinity: '31.5 – 33.8 PSU (Very Fresh)',
        oxygen: '205 µmol/kg (High)',
        sigmaTheta: '19.8 – 21.5 kg/m³',
        lightLevel: '100% – Full Sunlight',
        operationalImpact: 'Fuels Rapid Cyclone Intensification (Thermal Cap)',
        impactIcon: <Flame className="w-4 h-4 text-emerald-400" />,
        description: 'Low-salinity freshwater lid forms a barrier layer that prevents cold water from mixing upward, superheating sea surface temperatures.',
        speciesOrFeature: 'Hilsa Shad, Estuarine Tiger Prawns, Anchovies',
        useCase: {
          title: 'Predicting Supercyclone Rapid Intensification',
          problem: 'Why do cyclones blow up into destructive Supercyclones overnight in the Bay of Bengal while remaining calmer in the Arabian Sea?',
          howItHelps: 'River discharge sits as a thin, buoyant freshwater lid (BBLSW). Because freshwater is light, it refuses to mix with cold water below, acting like a blanket that traps solar heat above 30°C to fuel supercyclones.',
          whoUsesIt: 'IMD (India Meteorological Department) to issue 48-hour rapid cyclone intensification warnings.'
        }
      },
      {
        id: 'upper_thermocline',
        name: 'Upper Thermocline (18°C – 25°C)',
        scientificName: 'Saline Barrier Layer Interface',
        code: 'BARRIER',
        depthRange: '80m – 300m (Sub-Surface Trap)',
        minDepth: 80,
        maxDepth: 300,
        yStart: 95,
        yEnd: 155,
        color: '#eab308',
        ambientFill: 'rgba(234, 179, 8, 0.25)',
        temp: '18.0°C – 25.0°C',
        salinity: '34.2 – 35.0 PSU',
        oxygen: '85 µmol/kg',
        sigmaTheta: '23.5 – 25.0 kg/m³',
        lightLevel: '10% – Twilight Stratum',
        operationalImpact: 'Subsurface Heat Reservoir',
        impactIcon: <Compass className="w-4 h-4 text-amber-400" />,
        description: 'Thick layer separating fresh surface water from deep ocean, storing thermal energy without losing it to the atmosphere.',
        speciesOrFeature: 'Bigeye Tuna, Barracuda, Oceanic Squid',
        useCase: {
          title: 'Ocean Heat Content (OHC) Monsoon Forecasting',
          problem: 'Surface satellite temperatures fluctuate quickly with rain, giving false estimates of actual monsoon strength.',
          howItHelps: 'Calculates the subsurface Barrier Layer Thickness (BLT) where stored heat determines whether the Indian Summer Monsoon will be normal or deficit.',
          whoUsesIt: 'INCOIS & NCMRWF (National Centre for Medium Range Weather Forecasting).'
        }
      },
      {
        id: 'mesopelagic_omz',
        name: 'Mesopelagic OMZ (8°C – 15°C)',
        scientificName: 'Moderate Mesopelagic OMZ',
        code: 'MESO-OMZ',
        depthRange: '300m – 1,000m',
        minDepth: 300,
        maxDepth: 1000,
        yStart: 155,
        yEnd: 235,
        color: '#a855f7',
        ambientFill: 'rgba(168, 85, 247, 0.26)',
        temp: '8.0°C – 15.0°C',
        salinity: '34.8 – 35.2 PSU',
        oxygen: '35 µmol/kg (Moderate OMZ)',
        sigmaTheta: '26.2 – 27.0 kg/m³',
        lightLevel: '0.1% – Twilight Zone',
        operationalImpact: 'Mid-Water Foraging Floor',
        impactIcon: <Droplets className="w-4 h-4 text-purple-400" />,
        description: 'Moderate oxygen depletion zone supporting nocturnal diel vertical migration of deep forage species.',
        speciesOrFeature: 'Myctophid Lanternfish, Bristlemouths, Glass Squid',
        useCase: {
          title: 'Predicting Fish Invasions & Dead-Zone Traps',
          problem: 'Commercial fishermen drop expensive trawl nets into zones where all fish have suffocated and died.',
          howItHelps: 'Tracks when low-oxygen OMZ water masses upwell toward the shelf, suffocating pelagic fish and compressing them into a thin, easily fishable coastal band.',
          whoUsesIt: 'INCOIS & Coastal Fishery Cooperatives to guide trawlers toward alive biomass bands.'
        }
      },
      {
        id: 'bathypelagic_abyss',
        name: 'Bathypelagic Abyss (< 5°C)',
        scientificName: 'Deep Basin Abyssal Layer',
        code: 'IDW',
        depthRange: '1,000m – 2,000m+',
        minDepth: 1000,
        maxDepth: 2000,
        yStart: 235,
        yEnd: 300,
        color: '#06b6d4',
        ambientFill: 'rgba(6, 182, 212, 0.22)',
        temp: '2.4°C – 5.0°C',
        salinity: '34.7 – 34.8 PSU',
        oxygen: '55 µmol/kg',
        sigmaTheta: '27.7 – 27.9 kg/m³',
        lightLevel: '0% – Pitch Black',
        operationalImpact: 'Deep Overturning Bottom Conveyor',
        impactIcon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        description: 'Dense, cold basin floor waters regulating the multi-decadal carbon budget of the northern Indian Ocean.',
        speciesOrFeature: 'Deep-Sea Gulper Eel, Grenadier Rattails',
        useCase: {
          title: 'Subsea Cable & Benthic Infrastructure Protection',
          problem: 'Deep ocean communication cables break due to unmonitored turbidity currents and seabed thermal density shifts.',
          howItHelps: 'Monitors deep abyssal water currents and cold saline flows that induce stress on international subsea internet fiber cables.',
          whoUsesIt: 'Subsea telecom cable maintenance teams and Naval Hydrographic Department.'
        }
      }
    ]
  },
  {
    id: 'lakshadweep_sea',
    name: 'Lakshadweep & Malabar Shelf',
    badge: 'Coral Atolls • Tuna Frontier',
    coords: '10.5°N, 72.8°E',
    summary: 'Productive continental shelf break with active coral lagoon ecosystems and primary skipjack tuna feeding grounds.',
    surfaceSummary: '35.4 PSU Salinity • 29.2°C SST',
    zones: [
      {
        id: 'surface_warm',
        name: 'Tropical Warm Pool (> 26.5°C)',
        scientificName: 'Lagoon & Epipelagic Photic',
        code: 'LAK-SURF',
        depthRange: '0m – 100m',
        minDepth: 0,
        maxDepth: 100,
        yStart: 40,
        yEnd: 95,
        color: '#f43f5e',
        ambientFill: 'rgba(244, 63, 94, 0.28)',
        temp: '27.5°C – 29.5°C',
        salinity: '35.4 – 35.8 PSU',
        oxygen: '210 µmol/kg',
        sigmaTheta: '22.8 – 23.4 kg/m³',
        lightLevel: '100% – Full Sunlight',
        operationalImpact: 'Skipjack Tuna Surface Pole-and-Line',
        impactIcon: <Anchor className="w-4 h-4 text-rose-400" />,
        description: 'Clean, warm coral waters providing the forage base for sustainable pole-and-line tuna fisheries.',
        speciesOrFeature: 'Skipjack Tuna, Bluefin Trevally, Needlefish',
        useCase: {
          title: 'Sustainable Pole-and-Line Tuna Advisory',
          problem: 'Island fishermen lack real-time data on baitfish schools near coral reefs, leading to lost fishing trips.',
          howItHelps: 'Identifies warm lagoon boundary fronts where live baitfish (sprats) aggregate for skipjack tuna operations.',
          whoUsesIt: 'Lakshadweep Fisheries Department and local island fishing cooperatives.'
        }
      },
      {
        id: 'upper_thermocline',
        name: 'Upper Thermocline (18°C – 25°C)',
        scientificName: 'Atoll Drop-Off Stratum',
        code: 'THERMO',
        depthRange: '100m – 300m',
        minDepth: 100,
        maxDepth: 300,
        yStart: 95,
        yEnd: 155,
        color: '#eab308',
        ambientFill: 'rgba(234, 179, 8, 0.25)',
        temp: '18.0°C – 24.5°C',
        salinity: '35.2 – 35.6 PSU',
        oxygen: '90 µmol/kg',
        sigmaTheta: '24.8 – 26.0 kg/m³',
        lightLevel: '10% – Twilight Stratum',
        operationalImpact: 'Pelagic Commercial Frontier',
        impactIcon: <Compass className="w-4 h-4 text-amber-400" />,
        description: 'Drop-off current boundary where pelagic speed predators hunt along reef slopes.',
        speciesOrFeature: 'Yellowfin Tuna, Wahoo, Manta Rays',
        useCase: {
          title: 'Seamount & Reef Drop-Off Predatory Tracking',
          problem: 'Ocean currents around atolls create unpredictable vertical mixing that disperses high-value yellowfin tuna.',
          howItHelps: 'Detects the thermocline drop-off where upwelling currents force deep nutrients against the atoll wall.',
          whoUsesIt: 'CMFRI marine researchers and commercial offshore fleets.'
        }
      },
      {
        id: 'mesopelagic_omz',
        name: 'Mesopelagic OMZ (8°C – 15°C)',
        scientificName: 'Seamount Mesopelagic',
        code: 'OMZ-55',
        depthRange: '300m – 1,000m',
        minDepth: 300,
        maxDepth: 1000,
        yStart: 155,
        yEnd: 235,
        color: '#a855f7',
        ambientFill: 'rgba(168, 85, 247, 0.26)',
        temp: '8.5°C – 15.0°C',
        salinity: '35.0 – 35.4 PSU',
        oxygen: '55 µmol/kg',
        sigmaTheta: '26.5 – 27.1 kg/m³',
        lightLevel: '0.1% – Twilight Zone',
        operationalImpact: 'Deep Seamount Snapper Ground',
        impactIcon: <Radio className="w-4 h-4 text-purple-400" />,
        description: 'Moderate oxygen levels around seamounts supporting high-value deep snappers.',
        speciesOrFeature: 'Deep Snappers (Etelis coruscans), Lanternfish',
        useCase: {
          title: 'Deep Seamount Snapper Ground Discovery',
          problem: 'Traditional deep-sea trawling destroys coral reefs when targeting deep snappers.',
          howItHelps: 'Maps intermediate oxygenated pockets (> 50 µmol/kg) on seamounts for targeted precision droplining.',
          whoUsesIt: 'Deep-sea commercial fishermen and MPEDA sustainable fisheries teams.'
        }
      },
      {
        id: 'bathypelagic_abyss',
        name: 'Bathypelagic Abyss (< 5°C)',
        scientificName: 'Arabian Basin Abyss',
        code: 'IDW',
        depthRange: '1,000m – 2,000m+',
        minDepth: 1000,
        maxDepth: 2000,
        yStart: 235,
        yEnd: 300,
        color: '#06b6d4',
        ambientFill: 'rgba(6, 182, 212, 0.22)',
        temp: '2.5°C – 4.8°C',
        salinity: '34.7 – 34.8 PSU',
        oxygen: '50 µmol/kg',
        sigmaTheta: '27.7 – 27.9 kg/m³',
        lightLevel: '0% – Pitch Black',
        operationalImpact: 'Abyssal Benthic Boundary',
        impactIcon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        description: 'Cold, stable seafloor layer with specialized detritivores.',
        speciesOrFeature: 'Abyssal Sea Cucumbers, Tripod Fish',
        useCase: {
          title: 'Benthic Baseline for Deep Ocean Mission (Samudrayaan)',
          problem: 'Submersible vehicles (MATSYA 6000) need exact abyssal density and current vectors to prevent power drain at depth.',
          howItHelps: 'Provides in-situ density and temperature baselines for deep human submersibles.',
          whoUsesIt: 'National Institute of Ocean Technology (NIOT) & MoES Deep Ocean Mission.'
        }
      }
    ]
  },
  {
    id: 'andaman_sea',
    name: 'Andaman & Nicobar Basin',
    badge: 'Deep Trench • High Biodiversity',
    coords: '11.8°N, 93.1°E',
    summary: 'Deep volcanic trenches with strong tidal internal waves and rich benthic coral-shelf ecosystems.',
    surfaceSummary: '33.2 PSU Salinity • 29.4°C SST',
    zones: [
      {
        id: 'surface_warm',
        name: 'Tropical Warm Pool (> 26.5°C)',
        scientificName: 'Island Shelf Photic Zone',
        code: 'AND-SURF',
        depthRange: '0m – 100m',
        minDepth: 0,
        maxDepth: 100,
        yStart: 40,
        yEnd: 95,
        color: '#f43f5e',
        ambientFill: 'rgba(244, 63, 94, 0.28)',
        temp: '28.0°C – 30.0°C',
        salinity: '33.0 – 33.6 PSU',
        oxygen: '210 µmol/kg',
        sigmaTheta: '21.5 – 22.8 kg/m³',
        lightLevel: '100% – Full Sunlight',
        operationalImpact: 'Reef Pelagic & Artisanal Fishery',
        impactIcon: <Anchor className="w-4 h-4 text-rose-400" />,
        description: 'Rich archipelagic waters with intense primary productivity along island passes.',
        speciesOrFeature: 'Spanish Mackerel (Seerfish), Coral Trout, Flying Fish',
        useCase: {
          title: 'Coral Bleaching Early Warning System',
          problem: 'Marine heatwaves cause irreversible mass coral mortality across the Andaman reef system.',
          howItHelps: 'Calculates Degree Heating Weeks (DHW) in the top 100m to predict coral bleaching 3 to 4 weeks before visual onset.',
          whoUsesIt: 'Zoological Survey of India (ZSI) and Department of Environment & Forests.'
        }
      },
      {
        id: 'upper_thermocline',
        name: 'Upper Thermocline (18°C – 25°C)',
        scientificName: 'Trench Slope Stratum',
        code: 'THERMO',
        depthRange: '100m – 300m',
        minDepth: 100,
        maxDepth: 300,
        yStart: 95,
        yEnd: 155,
        color: '#eab308',
        ambientFill: 'rgba(234, 179, 8, 0.25)',
        temp: '18.0°C – 24.0°C',
        salinity: '34.4 – 34.9 PSU',
        oxygen: '85 µmol/kg',
        sigmaTheta: '24.5 – 25.8 kg/m³',
        lightLevel: '10% – Twilight Stratum',
        operationalImpact: 'Drop-off GT & Dogtooth Tuna Zone',
        impactIcon: <Compass className="w-4 h-4 text-amber-400" />,
        description: 'Steep volcanic walls where internal solitary waves pump nutrients to hunting predators.',
        speciesOrFeature: 'Dogtooth Tuna, Giant Trevally (GT), Reef Sharks',
        useCase: {
          title: 'Internal Solitary Wave Detection for Naval Submarines',
          problem: 'Massive underwater internal waves (> 100m amplitude) in the Andaman Sea can violently pull submarines downward.',
          howItHelps: 'Monitors sharp thermocline density jumps that generate underwater internal solitary waves across the Malacca Strait approaches.',
          whoUsesIt: 'Indian Navy Eastern Naval Command and maritime safety authorities.'
        }
      },
      {
        id: 'mesopelagic_omz',
        name: 'Mesopelagic OMZ (8°C – 15°C)',
        scientificName: 'Deep Trench Mesopelagic',
        code: 'OMZ-48',
        depthRange: '300m – 1,000m',
        minDepth: 300,
        maxDepth: 1000,
        yStart: 155,
        yEnd: 235,
        color: '#a855f7',
        ambientFill: 'rgba(168, 85, 247, 0.26)',
        temp: '8.5°C – 14.5°C',
        salinity: '34.7 – 35.0 PSU',
        oxygen: '48 µmol/kg',
        sigmaTheta: '26.4 – 27.0 kg/m³',
        lightLevel: '0.1% – Twilight Zone',
        operationalImpact: 'Deep-Sea Crustacean Frontier',
        impactIcon: <Radio className="w-4 h-4 text-purple-400" />,
        description: 'Intermediate depths harboring specialized benthic trench crustaceans.',
        speciesOrFeature: 'Andaman Deep-Sea Lobster, Bioluminescent Jellyfish',
        useCase: {
          title: 'Deep-Sea Crustacean Stock Mapping',
          problem: 'Commercial trawlers overfish shallow waters while untapped deep lobster stocks remain unmapped.',
          howItHelps: 'Identifies 300–800m oxygen-stable trench slopes where deep-sea lobsters (Puerulus sewelli) thrive.',
          whoUsesIt: 'Fishery Survey of India (FSI) to expand export fisheries sustainably.'
        }
      },
      {
        id: 'bathypelagic_abyss',
        name: 'Bathypelagic Abyss (< 5°C)',
        scientificName: 'Andaman Trench Hadal/Abyss',
        code: 'IDW',
        depthRange: '1,000m – 2,000m+',
        minDepth: 1000,
        maxDepth: 2000,
        yStart: 235,
        yEnd: 300,
        color: '#06b6d4',
        ambientFill: 'rgba(6, 182, 212, 0.22)',
        temp: '2.0°C – 4.2°C',
        salinity: '34.7 – 34.8 PSU',
        oxygen: '50 µmol/kg',
        sigmaTheta: '27.7 – 27.9 kg/m³',
        lightLevel: '0% – Pitch Black',
        operationalImpact: 'Volcanic Trench Thermal Sump',
        impactIcon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        description: 'Enclosed trench waters isolated by submarine sills.',
        speciesOrFeature: 'Andaman Trench Snailfish, Chimaera (Ghost Shark)',
        useCase: {
          title: 'Submarine Volcano & Tsunami Sensor Calibration',
          problem: 'Underwater seismic faults along the Sunda Trench require deep pressure calibration to prevent false tsunami alarms.',
          howItHelps: 'Provides temperature and hydrostatic density profiles to calibrate bottom pressure recorders (BPR) on tsunami buoys.',
          whoUsesIt: 'Indian Tsunami Early Warning Centre (ITEWC) at INCOIS.'
        }
      }
    ]
  },
  {
    id: 'equatorial_basin',
    name: 'Equatorial Indian Ocean',
    badge: 'Wyrtki Jet • IOD Hub',
    coords: '0.0°N, 78.0°E',
    summary: 'Regulated by the Wyrtki Jet and Indian Ocean Dipole (IOD) oscillations, acting as an open pelagic highway with high cross-basin ventilation.',
    surfaceSummary: '34.8 PSU Salinity • 28.4°C SST',
    zones: [
      {
        id: 'surface_warm',
        name: 'Tropical Warm Pool (> 26.5°C)',
        scientificName: 'Equatorial Surface Water (ESW)',
        code: 'ESW',
        depthRange: '0m – 100m',
        minDepth: 0,
        maxDepth: 100,
        yStart: 40,
        yEnd: 95,
        color: '#38bdf8',
        ambientFill: 'rgba(56, 189, 248, 0.28)',
        temp: '27.5°C – 29.2°C',
        salinity: '34.5 – 35.0 PSU',
        oxygen: '215 µmol/kg (Fully Saturated)',
        sigmaTheta: '22.0 – 23.2 kg/m³',
        lightLevel: '100% – Full Sunlight',
        operationalImpact: 'Trans-Oceanic Pelagic Migration Highway',
        impactIcon: <Anchor className="w-4 h-4 text-sky-400" />,
        description: 'Fast-flowing equatorial currents transport gamefish across the basin between Sumatra and the African coast.',
        speciesOrFeature: 'Mahi Mahi, Blue Marlin, Sailfish',
        useCase: {
          title: 'Indian Ocean Dipole (IOD) & Global Drought Forecasting',
          problem: 'Positive/Negative IOD events cause unexpected agricultural droughts in India and floods in East Africa.',
          howItHelps: 'Tracks the eastward shift of the equatorial warm pool via Wyrtki jets to forecast IOD transitions 2 to 3 months ahead.',
          whoUsesIt: 'Ministry of Agriculture & IMD for long-range seasonal crop planning.'
        }
      },
      {
        id: 'upper_thermocline',
        name: 'Upper Thermocline (18°C – 25°C)',
        scientificName: 'Equatorial Thermocline Jet',
        code: 'THERMO',
        depthRange: '100m – 300m',
        minDepth: 100,
        maxDepth: 300,
        yStart: 95,
        yEnd: 155,
        color: '#eab308',
        ambientFill: 'rgba(234, 179, 8, 0.25)',
        temp: '18.0°C – 25.0°C',
        salinity: '35.0 – 35.3 PSU',
        oxygen: '110 µmol/kg (Ventilated)',
        sigmaTheta: '24.8 – 26.2 kg/m³',
        lightLevel: '10% – Twilight Stratum',
        operationalImpact: 'Industrial Tuna Longline Ground',
        impactIcon: <Compass className="w-4 h-4 text-amber-400" />,
        description: 'Dynamic internal wave mixing keeps oxygen high enough for tuna to hunt deep without suffocating.',
        speciesOrFeature: 'Bigeye Tuna, Blue Marlin, Silky Shark',
        useCase: {
          title: 'High-Seas Tuna Longline Fleet Routing',
          problem: 'International tuna fleets spend millions in diesel searching the open equatorial ocean without clear boundaries.',
          howItHelps: 'Pinpoints equatorial current divergence zones where cold, nutrient-rich thermocline water upwells toward the surface.',
          whoUsesIt: 'Indian Ocean Tuna Commission (IOTC) and industrial fishing fleets.'
        }
      },
      {
        id: 'mesopelagic_omz',
        name: 'Mesopelagic OMZ (8°C – 15°C)',
        scientificName: 'Antarctic Intermediate Inflow',
        code: 'AAIW',
        depthRange: '300m – 1,000m',
        minDepth: 300,
        maxDepth: 1000,
        yStart: 155,
        yEnd: 235,
        color: '#3b82f6',
        ambientFill: 'rgba(59, 130, 246, 0.26)',
        temp: '6.0°C – 14.0°C',
        salinity: '34.5 – 34.9 PSU',
        oxygen: '85 µmol/kg (Well-Ventilated)',
        sigmaTheta: '26.8 – 27.4 kg/m³',
        lightLevel: '0.1% – Twilight Zone',
        operationalImpact: 'Primary Oxygen Conveyor from Antarctica',
        impactIcon: <Droplets className="w-4 h-4 text-blue-400" />,
        description: 'Cold sub-Antarctic water subducts northward, preventing the formation of severe dead zones in the open equatorial basin.',
        speciesOrFeature: 'Vampire Squid, Bathypelagic Jellyfish',
        useCase: {
          title: 'Southern Ocean Subduction & Basin Oxygenation Tracking',
          problem: 'Without deep ventilation currents from Antarctica, the entire northern Indian Ocean would turn into a lifeless dead zone.',
          howItHelps: 'Measures the inflow velocity of cold, low-salinity Antarctic Intermediate Water (AAIW) recharging oxygen levels.',
          whoUsesIt: 'Global ocean biogeochemists and ocean acidification research consortiums.'
        }
      },
      {
        id: 'bathypelagic_abyss',
        name: 'Bathypelagic Abyss (< 5°C)',
        scientificName: 'Equatorial Trench Abyss',
        code: 'IDW',
        depthRange: '1,000m – 2,000m+',
        minDepth: 1000,
        maxDepth: 2000,
        yStart: 235,
        yEnd: 300,
        color: '#06b6d4',
        ambientFill: 'rgba(6, 182, 212, 0.22)',
        temp: '1.8°C – 3.2°C',
        salinity: '34.7 – 34.8 PSU',
        oxygen: '60 µmol/kg',
        sigmaTheta: '27.8 – 27.9 kg/m³',
        lightLevel: '0% – Pitch Black',
        operationalImpact: 'Deep Overturning Sump',
        impactIcon: <Snowflake className="w-4 h-4 text-cyan-400" />,
        description: 'Frigid ocean trench conveyor regulating multi-decadal global climate storage.',
        speciesOrFeature: 'Fangtooth Fish, Chimaeras, Giant Amphipods',
        useCase: {
          title: 'Polymetallic Nodule Deep-Sea Mining Environmental Baselines',
          problem: 'Mining manganese nodules in the Central Indian Basin requires strict environmental clearance to prevent benthic collapse.',
          howItHelps: 'Establishes baseline turbidity, bottom currents, and thermal signatures before mining robot operations begin.',
          whoUsesIt: 'International Seabed Authority (ISA) & Ministry of Earth Sciences.'
        }
      }
    ]
  }
];

export const TSDiagram3D: React.FC<TSDiagram3DProps> = () => {
  const [selectedBasinId, setSelectedBasinId] = useState<string>('arabian_sea');
  const [selectedZoneIndex, setSelectedZoneIndex] = useState<number>(0);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  const activeBasin = BASIN_PROFILES.find((b) => b.id === selectedBasinId) || BASIN_PROFILES[0];
  const activeZone = activeBasin.zones[selectedZoneIndex] || activeBasin.zones[0];

  return (
    <div className="w-full h-full flex flex-col space-y-2.5 p-3 bg-[#020713] text-slate-100 font-sans overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-abyssal-800 pb-2 shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-ocean-cyan border border-cyan-500/25 shadow-glow-cyan-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-bold text-white font-heading">
              Indian Ocean Continental Shelf & Pelagic Depth Profile
            </h2>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="p-1 rounded-md bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition text-xs flex items-center gap-1 font-mono cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>What is this?</span>
            </button>
          </div>
        </div>
      </div>

      {/* Basin Selector Bar */}
      <div className="flex items-center gap-1.5 bg-abyssal-950 p-1.5 rounded-2xl border border-cyan-500/30 shrink-0 flex-wrap">
        <span className="text-[11px] font-mono text-cyan-400 px-2 flex items-center gap-1 font-bold">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          Select Basin:
        </span>

        {BASIN_PROFILES.map((basin) => {
          const isSelected = selectedBasinId === basin.id;
          return (
            <button
              key={basin.id}
              type="button"
              onClick={() => {
                setSelectedBasinId(basin.id);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                isSelected
                  ? 'bg-gradient-to-r from-ocean-cyan to-teal-400 text-abyssal-950 shadow-md font-extrabold'
                  : 'bg-abyssal-900 text-slate-400 border border-abyssal-800 hover:text-white hover:bg-abyssal-850'
              }`}
            >
              <MapPin className="w-3 h-3" />
              <span>{basin.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Interface: Left Bathymetric SVG | Right Operational Telemetry */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* Left 7 Columns: Continental Shelf & Pelagic SVG Profile */}
        <div className="lg:col-span-7 flex flex-col bg-[#071933] border border-cyan-500/50 rounded-2xl p-3 relative overflow-hidden shadow-2xl">
          
          <div className="flex items-center justify-between text-xs font-mono text-slate-300 pb-1.5 border-b border-cyan-500/20 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span>{activeBasin.name} Bathymetric Profile</span>
              <span className="text-[10px] text-slate-400 font-normal">({activeBasin.coords})</span>
            </div>
            <div className="text-[11px] text-cyan-300 font-mono">
              Click any pelagic layer to slice
            </div>
          </div>

          {/* Interactive SVG Bathymetric Diagram Container */}
          <div className="flex-1 relative min-h-0 my-1.5 rounded-xl overflow-hidden border border-cyan-400/40 bg-[#020914] flex flex-col justify-between">
            
            <svg 
              className="w-full h-full" 
              viewBox="0 0 600 320" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sunlightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#0369a1" stopOpacity="0.05" />
                </linearGradient>

                <linearGradient id="seabedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="50%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>

                <filter id="layerGlow" x="-10%" y="-10%" width="120%" height="120%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* 1. Pelagic Water Column Layers (Clickable Slices) */}
              {activeBasin.zones.map((zone, idx) => {
                const isSelected = selectedZoneIndex === idx;
                const height = zone.yEnd - zone.yStart;

                return (
                  <g 
                    key={zone.id} 
                    className="cursor-pointer transition-all duration-200"
                    onClick={() => setSelectedZoneIndex(idx)}
                  >
                    {/* Layer Background Fill */}
                    <rect
                      x="0"
                      y={zone.yStart}
                      width="600"
                      height={height}
                      fill={zone.ambientFill}
                      stroke={isSelected ? zone.color : 'rgba(56, 189, 248, 0.15)'}
                      strokeWidth={isSelected ? 2 : 0.8}
                      filter={isSelected ? 'url(#layerGlow)' : undefined}
                    />

                    {/* Active Layer Selected Ribbon Accent */}
                    {isSelected && (
                      <rect
                        x="594"
                        y={zone.yStart}
                        width="6"
                        height={height}
                        fill={zone.color}
                      />
                    )}

                    {/* Layer Scientific Label */}
                    <text
                      x="570"
                      y={zone.yStart + 18}
                      textAnchor="end"
                      fill={isSelected ? '#ffffff' : zone.color}
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {zone.name}
                    </text>
                    <text
                      x="570"
                      y={zone.yStart + 32}
                      textAnchor="end"
                      fill="rgba(226, 232, 240, 0.7)"
                      fontSize="9.5"
                      fontFamily="sans-serif"
                    >
                      {zone.depthRange} • {zone.temp.split('–')[0]} • {zone.oxygen.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* 2. Topographic Continental Shelf, Slope & Abyssal Floor Polygon */}
              <path
                d="M 0,40 
                   L 70,45 
                   Q 120,55 170,110 
                   Q 210,180 260,260 
                   Q 300,300 450,305 
                   L 520,310 
                   L 600,312 
                   L 600,320 
                   L 0,320 Z"
                fill="url(#seabedGradient)"
                stroke="#64748b"
                strokeWidth="2.5"
              />

              {/* 3. Surface Water Wave Interface */}
              <path
                d="M 0,40 Q 75,35 150,40 T 300,40 T 450,40 T 600,40 L 600,42 L 0,42 Z"
                fill="#38bdf8"
                opacity="0.9"
              />
              <rect x="0" y="40" width="600" height="25" fill="url(#sunlightGradient)" pointerEvents="none" />

              {/* 4. Annotations on Seabed & Column */}
              <text x="25" y="32" fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="monospace">Coast / Littoral</text>
              <line x1="15" y1="40" x2="15" y2="48" stroke="#38bdf8" strokeWidth="1.5" />

              <text x="85" y="80" fill="#94a3b8" fontSize="10" fontWeight="bold" fontFamily="monospace">Continental Shelf (Neritic)</text>
              <text x="175" y="195" fill="#cbd5e1" fontSize="10" fontWeight="bold" fontFamily="monospace" transform="rotate(45, 175, 195)">
                Bathyal Slope ➔
              </text>
              <text x="320" y="316" fill="#64748b" fontSize="9" fontFamily="monospace">Benthic Abyssal Floor</text>

              {/* Depth Reference Lines */}
              <line x1="0" y1="95" x2="600" y2="95" stroke="rgba(244, 63, 94, 0.4)" strokeDasharray="4,4" strokeWidth="1" />
              <text x="8" y="91" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">100m Photic Boundary</text>

              <line x1="0" y1="155" x2="600" y2="155" stroke="rgba(234, 179, 8, 0.4)" strokeDasharray="4,4" strokeWidth="1" />
              <text x="8" y="151" fill="#eab308" fontSize="9" fontWeight="bold" fontFamily="monospace">300m Thermocline Base</text>

              <line x1="0" y1="235" x2="600" y2="235" stroke="rgba(168, 85, 247, 0.4)" strokeDasharray="4,4" strokeWidth="1" />
              <text x="8" y="231" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">1,000m OMZ Hypoxia Limit</text>

              <line x1="0" y1="300" x2="600" y2="300" stroke="rgba(6, 182, 212, 0.4)" strokeDasharray="4,4" strokeWidth="1" />
              <text x="8" y="296" fill="#22d3ee" fontSize="9" fontWeight="bold" fontFamily="monospace">2,000m Abyssal Plain</text>
            </svg>

          </div>

          {/* Bottom Depth Quick-Legend */}
          <div className="pt-1.5 border-t border-cyan-500/20 text-[11px] font-mono text-slate-300 flex items-center justify-between shrink-0">
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> 0–100m Warm Pool
            </span>
            <span className="text-yellow-400 font-bold">100–300m Thermocline</span>
            <span className="text-purple-400 font-bold">300–1,000m OMZ Hypoxia</span>
            <span className="text-cyan-400 font-bold flex items-center gap-1">
              <Moon className="w-3.5 h-3.5" /> 1,000m+ Abyss
            </span>
          </div>

        </div>

        {/* Right 5 Columns: In-Situ Chemical Telemetry + Operational Impact */}
        <div className="lg:col-span-5 flex flex-col space-y-2.5 overflow-y-auto pr-1">
          
          {/* Active Layer Significance Card */}
          <div 
            className="p-3.5 rounded-2xl border space-y-2.5 shadow-xl shrink-0"
            style={{ 
              backgroundColor: '#0a2347', 
              borderColor: activeZone.color 
            }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                {activeZone.impactIcon}
                <span>Real-World Operational Significance</span>
              </div>
              <span 
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                style={{ backgroundColor: `${activeZone.color}30`, color: activeZone.color }}
              >
                {activeZone.code}
              </span>
            </div>

            <div className="text-xs font-extrabold text-white leading-snug">
              {activeZone.operationalImpact}
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {activeZone.description}
            </p>

            <div className="p-2 rounded-xl bg-black/40 border border-slate-800 font-mono text-[11px] flex items-center gap-1.5">
              <Fish className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-cyan-300 font-bold">Target Biomass: </span>
                <span className="text-slate-200">{activeZone.speciesOrFeature}</span>
              </div>
            </div>
          </div>

          {/* In-Situ Stratum Sensor Metrics Grid */}
          <div className="p-3.5 rounded-2xl bg-abyssal-950/90 border border-cyan-500/30 space-y-2 shadow-xl shrink-0">
            <div className="text-xs font-bold text-white font-heading flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-ocean-cyan" />
                {activeZone.name} Telemetry
              </span>
              <span className="text-[10px] font-mono text-cyan-300">{activeZone.depthRange}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
              <div className="p-2 rounded-lg bg-abyssal-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Thermal Envelope:</span>
                <strong className="text-rose-400">{activeZone.temp}</strong>
              </div>
              <div className="p-2 rounded-lg bg-abyssal-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Salinity Signature:</span>
                <strong className="text-teal-300">{activeZone.salinity}</strong>
              </div>
              <div className="p-2 rounded-lg bg-abyssal-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Dissolved Oxygen (DO):</span>
                <strong className="text-purple-300">{activeZone.oxygen}</strong>
              </div>
              <div className="p-2 rounded-lg bg-abyssal-900 border border-slate-800">
                <span className="text-slate-500 block text-[10px]">Solar Penetration:</span>
                <strong className="text-amber-400">{activeZone.lightLevel}</strong>
              </div>
            </div>
          </div>

          {/* Unified Structured Real-World Application Panel */}
          <div className="p-3.5 rounded-2xl bg-abyssal-950/90 border border-cyan-500/30 space-y-3 shadow-xl flex-1 flex flex-col">
            <div className="flex items-center justify-between shrink-0 border-b border-abyssal-800 pb-2">
              <div className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>{activeZone.useCase.title}</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                {activeZone.code}
              </span>
            </div>

            {/* Single clean box containing all points with dividers */}
            <div className="bg-[#030d1d] p-3.5 rounded-xl border border-abyssal-800 space-y-3 text-xs flex-1">
              
              {/* Point 1: The Problem */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <AlertCircle className="w-3.5 h-3.5" />
                  The Problem:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-4.5">
                  {activeZone.useCase.problem}
                </p>
              </div>

              {/* Point 2: How this layer analysis helps */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <HelpCircle className="w-3.5 h-3.5" />
                  How This Layer Analysis Helps:
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed pl-4.5">
                  {activeZone.useCase.howItHelps}
                </p>
              </div>

              {/* Point 3: Who uses it */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1 font-mono">
                  <Shield className="w-3.5 h-3.5" />
                  Who Uses It:
                </div>
                <p className="text-slate-200 text-[11px] font-medium leading-relaxed pl-4.5">
                  {activeZone.useCase.whoUsesIt}
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Interactive Glossary Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#071322] border-2 border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-black text-white font-heading">
                  Ocean Bathymetry & Pelagic Zonation
                </h3>
                <span className="text-xs font-mono text-cyan-400">
                  Continental Margin to Abyssal Floor Hydrodynamics
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                This diagram illustrates the classical bathymetric transition from the shallow coastal <strong>Continental Shelf (Neritic Zone)</strong>, down the steep <strong>Continental Slope (Bathyal Zone)</strong>, into the deep ocean plain.
              </p>
              
              <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/30 space-y-1.5 font-mono">
                <div className="text-[11px] font-bold text-cyan-300 uppercase">3 Key Rules to Explain to Judges:</div>
                <div>• <strong className="text-rose-400">Warm Pool (0–100m):</strong> The sunlit zone where primary commercial fishing takes place.</div>
                <div>• <strong className="text-amber-400">Thermocline (100–300m):</strong> Temperature drop zone where large predatory tuna hunt.</div>
                <div>• <strong className="text-purple-400">Mesopelagic OMZ (300–1,000m):</strong> The Oxygen Minimum Zone (OMZ) dead zone where nets catch zero fish.</div>
                <div>• <strong className="text-cyan-400">Bathypelagic Abyss (1,000m+):</strong> Frigid abyssal floor driving global thermohaline ocean circulation.</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelpModal(false)}
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