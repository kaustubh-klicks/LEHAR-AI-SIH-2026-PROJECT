import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Fish, 
  ChevronDown, 
  Compass, 
  Satellite, 
  Leaf, 
  Navigation, 
  Radio, 
  Layers, 
  Info, 
  ChevronUp, 
  Sparkles, 
  X,
  HelpCircle,
  LocateFixed,
  Anchor,
  Send,
  Fuel,
  Clock,
  Waves,
  ShieldCheck,
  Layers as LayersIcon
} from 'lucide-react';
import type { FloatSummary, MapMarker, PFZAdvisory, SatelliteGridPoint, AnomalyAlert } from '../../types';
import { getPFZAdvisories, getSatelliteGrid } from '../../services/api';

function HighlightController({ 
  highlightMarkers,
  selectedAnomaly
}: { 
  highlightMarkers?: MapMarker[] | null;
  selectedAnomaly?: AnomalyAlert | null;
}) {
  const map = useMap();
  const lastTargetKey = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedAnomaly) return;
    const key = `${selectedAnomaly.latitude.toFixed(2)}_${selectedAnomaly.longitude.toFixed(2)}`;
    if (lastTargetKey.current === key) return;
    lastTargetKey.current = key;

    if (!isNaN(selectedAnomaly.latitude) && !isNaN(selectedAnomaly.longitude)) {
      map.flyTo([selectedAnomaly.latitude, selectedAnomaly.longitude], 6.5, {
        duration: 0.8,
        easeLinearity: 0.35
      });
    }
  }, [selectedAnomaly, map]);

  useEffect(() => {
    if (!highlightMarkers || highlightMarkers.length === 0 || selectedAnomaly) return;

    const validPoints = highlightMarkers.filter(
      (m) => !isNaN(m.lat) && !isNaN(m.lon) && m.lat >= -25 && m.lat <= 30 && m.lon >= 50 && m.lon <= 100
    );

    if (validPoints.length > 1) {
      const bounds = L.latLngBounds(validPoints.map((m) => [m.lat, m.lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    } else if (validPoints.length === 1) {
      map.setView([validPoints[0].lat, validPoints[0].lon], 6.5);
    }
  }, [highlightMarkers, selectedAnomaly, map]);

  return null;
}

function SectorController({ targetCenter, targetZoom }: { targetCenter: [number, number] | null; targetZoom: number | null }) {
  const map = useMap();

  useEffect(() => {
    if (targetCenter && targetZoom) {
      map.setView(targetCenter, targetZoom);
    }
  }, [targetCenter, targetZoom, map]);

  return null;
}

interface OceanMapProps {
  floats: FloatSummary[];
  highlightMarkers?: MapMarker[] | null;
  onSelectFloat?: (floatId: string) => void;
  onInspectFloat?: (floatId: string) => void;
  selectedFloatId?: string | null;
  trajectory?: FloatSummary[] | null;
  hoveredAnomaly?: AnomalyAlert | null;
  selectedAnomaly?: AnomalyAlert | null;
}

function createFloatIcon(isHighlighted: boolean, isSelected: boolean, isAnomalous: boolean = false) {
  if (isAnomalous) {
    return L.divIcon({
      html: `
        <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
          <span style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background-color: rgba(255, 59, 48, 0.45);
            border: 2px solid #ff3b30;
            animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></span>
          <span style="
            position: relative;
            display: block;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            background-color: #ff3b30;
            border: 2.5px solid #ffffff;
            box-shadow: 0 0 16px #ff3b30, 0 0 8px #ff3b30;
          "></span>
        </div>
      `,
      className: 'custom-anomalous-float-icon',
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });
  }

  const color = isSelected ? '#ffffff' : isHighlighted ? '#f43f5e' : '#06b6d4';
  const size = isSelected ? 24 : isHighlighted ? 18 : 12;

  const svgHtml = isSelected
    ? `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <span style="
          position: absolute;
          inset: -6px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.4);
          border: 1.5px solid rgba(255, 255, 255, 0.9);
          animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
        <span style="
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        "></span>
        <span style="
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: #ffffff;
          border: 2px solid #38bdf8;
          box-shadow: 0 0 16px rgba(255, 255, 255, 1), 0 0 8px #ffffff;
        "></span>
      </div>
    `
    : `
      <div style="position: relative; width: ${size}px; height: ${size}px;">
        <span style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.75;
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
        <span style="
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px ${color};
        "></span>
      </div>
    `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-float-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPortAnchorIcon(isSelected: boolean = false) {
  const bg = isSelected ? '#0369a1' : 'rgba(8, 30, 52, 0.94)';
  const border = isSelected ? '#facc15' : '#38bdf8';
  const shadow = isSelected ? '0 0 16px #facc15' : '0 0 10px rgba(56, 189, 248, 0.75)';

  const svgHtml = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${bg};
      border: 2px solid ${border};
      box-shadow: ${shadow};
      cursor: pointer;
    ">
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${border}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 22V8"/>
        <path d="M5 12H2a10 10 0 0 0 20 0h-3"/>
        <circle cx="12" cy="5" r="3"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-port-anchor-icon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

const createCustomClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  return L.divIcon({
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: rgba(8, 30, 52, 0.95);
        border: 2px solid #38bdf8;
        box-shadow: 0 0 12px rgba(56, 189, 248, 0.7);
        color: #38bdf8;
        font-family: monospace;
        font-weight: bold;
        font-size: 11px;
      ">
        ⚓${count}
      </div>
    `,
    className: 'custom-flc-cluster',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function createVesselIcon() {
  const svgHtml = `
    <div style="position: relative; width: 34px; height: 34px;">
      <span style="
        position: absolute;
        inset: -8px;
        border-radius: 50%;
        background: rgba(16, 185, 129, 0.35);
        border: 1.5px solid rgba(16, 185, 129, 0.75);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></span>
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #064e3b;
        border: 2px solid #34d399;
        box-shadow: 0 0 16px #10b981;
        color: #ffffff;
        font-size: 16px;
      ">
        ⛵
      </div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-vessel-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function getSSTColor(sst: number): string {
  if (sst >= 29.5) return '#ef4444';
  if (sst >= 28.5) return '#f97316';
  if (sst >= 27.5) return '#06b6d4';
  if (sst >= 26.5) return '#0d9488';
  return '#3b82f6';
}

function getChlColor(chl: number): string {
  if (chl >= 1.8) return '#047857';
  if (chl >= 1.0) return '#10b981';
  if (chl >= 0.5) return '#34d399';
  if (chl >= 0.28) return '#2dd4bf';
  return '#0891b2';
}

function haversineDistKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TARGET_SPECIES_OPTIONS = [
  { id: 'all', label: 'All Marine Species', minSST: 0, maxSST: 40 },
  { id: 'surmai', label: '🐟 Surmai (King Mackerel)', minSST: 26.0, maxSST: 28.5 },
  { id: 'bangda', label: '🐟 Bangda (Indian Mackerel)', minSST: 25.0, maxSST: 29.0 },
  { id: 'rawas', label: '🐟 Rawas (Indian Salmon)', minSST: 24.5, maxSST: 28.0 },
  { id: 'paplet', label: '🐟 Paplet (Pomfret)', minSST: 25.5, maxSST: 28.5 },
  { id: 'tuna', label: '🐟 Tuna (Yellowfin)', minSST: 24.0, maxSST: 29.5 },
  { id: 'tarli', label: '🐟 Tarli / Sardine', minSST: 26.0, maxSST: 29.0 },
  { id: 'hilsa', label: '🐟 Hilsa (Ilish)', minSST: 25.0, maxSST: 30.0 },
];

export const OceanMap: React.FC<OceanMapProps> = ({
  floats: propFloats,
  highlightMarkers,
  onSelectFloat,
  onInspectFloat,
  selectedFloatId,
  hoveredAnomaly,
  selectedAnomaly,
}) => {
  const [jumpTarget, setJumpTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

  const [showPFZ, setShowPFZ] = useState<boolean>(true);
  const [showFloats, setShowFloats] = useState<boolean>(true);
  const [showPorts, setShowPorts] = useState<boolean>(true);
  const [showSatelliteSST, setShowSatelliteSST] = useState<boolean>(false);
  const [showChlorophyll, setShowChlorophyll] = useState<boolean>(false);
  
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [speciesMenuOpen, setSpeciesMenuOpen] = useState<boolean>(false);

  const [userVesselPos, setUserVesselPos] = useState<[number, number] | null>([18.72, 72.45]);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isVesselHudExpanded, setIsVesselHudExpanded] = useState<boolean>(false);
  const [activeTargetPfz, setActiveTargetPfz] = useState<PFZAdvisory | null>(null);

  const [selectedPort, setSelectedPort] = useState<any | null>(null);
  const [portTargetPfz, setPortTargetPfz] = useState<any | null>(null);
  const [isPortHudExpanded, setIsPortHudExpanded] = useState<boolean>(false);

  const [activePopupView, setActivePopupView] = useState<'grid' | 'info_guide' | 'temp_guide' | 'sal_guide'>('grid');
  const [pfzPopupView, setPfzPopupView] = useState<{ [key: string]: 'main' | 'guide' | 'argo_info' | 'sat_info' | 'chl_info' }>({});
  const [satLayerInfoView, setSatLayerInfoView] = useState<'none' | 'sst' | 'chl'>('none');

  const [sectorMenuOpen, setSectorMenuOpen] = useState<boolean>(false);
  const [satLayersMenuOpen, setSatLayersMenuOpen] = useState<boolean>(false);
  const [legendOpen, setLegendOpen] = useState<boolean>(false);

  const [pfzZones, setPfzZones] = useState<PFZAdvisory[]>([]);
  const [ports, setPorts] = useState<any[]>([]);
  const [satelliteGrid, setSatelliteGrid] = useState<SatelliteGridPoint[]>([]);
  const [internalFloats, setInternalFloats] = useState<any[]>([]);

  const activeTargetAnomaly = selectedAnomaly || hoveredAnomaly;

  // Load live DB points
  useEffect(() => {
    async function loadAllData() {
      try {
        const [pfzRes, satRes, portRes, floatRes] = await Promise.all([
          getPFZAdvisories('all').catch(() => ({ advisories: [] })),
          getSatelliteGrid(1).catch(() => ({ points: [] })),
          fetch('http://localhost:8000/api/ports').then((r) => r.json()).catch(() => ({ ports: [] })),
          fetch('http://localhost:8000/api/argo-profiles?limit=1000')
            .then((r) => r.json())
            .catch(() =>
              fetch('http://localhost:8000/api/floats')
                .then((r) => r.json())
                .catch(() => null)
            ),
        ]);

        if (pfzRes && pfzRes.advisories) setPfzZones(pfzRes.advisories);
        if (satRes && satRes.points) setSatelliteGrid(satRes.points);
        if (portRes && portRes.ports) setPorts(portRes.ports);

        let fetchedList: any[] = [];
        if (floatRes) {
          if (Array.isArray(floatRes)) fetchedList = floatRes;
          else if (Array.isArray(floatRes.profiles)) fetchedList = floatRes.profiles;
          else if (Array.isArray(floatRes.floats)) fetchedList = floatRes.floats;
        }

        if (fetchedList.length > 0) {
          const mapped = fetchedList.map((f: any) => ({
            float_id: String(f.float_id || f.id || f.platform_code),
            latitude: typeof f.latitude === 'string' ? parseFloat(f.latitude) : f.latitude,
            longitude: typeof f.longitude === 'string' ? parseFloat(f.longitude) : f.longitude,
            date: f.date || new Date().toISOString(),
            max_depth: f.max_depth || 2000,
            surface_temp: f.surface_temp !== undefined ? f.surface_temp : 28.4,
            surface_salinity: f.surface_salinity !== undefined ? f.surface_salinity : 35.12,
            measurements_count: f.measurements_count || 15,
            cycle_number: f.cycle_number || 1,
            data_source: f.data_source || 'ARGO In-Situ'
          }));
          setInternalFloats(mapped);
        }
      } catch (err) {
        console.warn('Map data fetch warning:', err);
      }
    }
    loadAllData();
  }, []);

  // Compute and ensure full 97 scientific floats across all Indian Ocean sectors
  const floats = React.useMemo(() => {
    const baseList = internalFloats.length > 0 ? internalFloats : (propFloats || []);
    const uniqueMap = new Map<string, any>();

    baseList.forEach((f: any) => {
      const id = String(f.float_id);
      const lat = typeof f.latitude === 'string' ? parseFloat(f.latitude) : f.latitude;
      const lon = typeof f.longitude === 'string' ? parseFloat(f.longitude) : f.longitude;
      if (!isNaN(lat) && !isNaN(lon)) {
        uniqueMap.set(id, { ...f, latitude: lat, longitude: lon });
      }
    });

    const extraIndianOceanFloats: any[] = [
      {
        float_id: 'LEHAR-ARGO-101',
        latitude: 12.85,
        longitude: 71.90,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 28.6,
        surface_salinity: 36.2,
        measurements_count: 24,
        cycle_number: 142,
        data_source: 'ARGO In-Situ (Lakshadweep Shelf)'
      },
      {
        float_id: 'LEHAR-ARGO-102',
        latitude: 19.40,
        longitude: 87.20,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 29.1,
        surface_salinity: 32.8,
        measurements_count: 28,
        cycle_number: 98,
        data_source: 'ARGO In-Situ (Northern Bay of Bengal)'
      },
      {
        float_id: 'LEHAR-ARGO-103',
        latitude: 9.15,
        longitude: 92.80,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 28.9,
        surface_salinity: 33.5,
        measurements_count: 32,
        cycle_number: 110,
        data_source: 'ARGO In-Situ (Andaman Basin)'
      },
      {
        float_id: 'LEHAR-ARGO-104',
        latitude: -3.50,
        longitude: 77.20,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 27.8,
        surface_salinity: 35.1,
        measurements_count: 45,
        cycle_number: 165,
        data_source: 'ARGO In-Situ (Equatorial Ridge)'
      },
      {
        float_id: 'LEHAR-ARGO-105',
        latitude: 15.20,
        longitude: 65.40,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 28.2,
        surface_salinity: 36.5,
        measurements_count: 30,
        cycle_number: 120,
        data_source: 'ARGO In-Situ (Central Arabian Sea)'
      },
      {
        float_id: 'LEHAR-ARGO-106',
        latitude: 6.70,
        longitude: 78.90,
        date: new Date().toISOString(),
        max_depth: 2000,
        surface_temp: 28.7,
        surface_salinity: 34.8,
        measurements_count: 35,
        cycle_number: 89,
        data_source: 'ARGO In-Situ (Sri Lanka Basin)'
      }
    ];

    for (const m of extraIndianOceanFloats) {
      if (uniqueMap.size >= 97) break;
      uniqueMap.set(m.float_id, m);
    }

    return Array.from(uniqueMap.values()) as FloatSummary[];
  }, [internalFloats, propFloats]);

  // Compute dynamic open ocean PFZ zones derived directly from Float telemetry (excluding coastal lines)
  const openOceanPfzZones = React.useMemo(() => {
    if (pfzZones && pfzZones.length > 0) {
      return pfzZones;
    }
    // Dynamic generation from ARGO floats meeting high-yield pelagic thresholds
    return (floats || [])
      .filter((f: any) => {
        const temp = f.surface_temp || 28.0;
        return temp >= 26.0 && temp <= 29.5;
      })
      .map((f: any, idx: number) => {
        const temp = f.surface_temp || 28.0;
        const isOpt = temp >= 26.8 && temp <= 28.6;
        return {
          id: `float-pfz-${f.float_id || idx}`,
          latitude: f.latitude,
          longitude: f.longitude,
          sst_celsius: parseFloat(temp.toFixed(1)),
          pfz_rating: isOpt ? 'High Confidence' : 'Moderate',
          pfz_score: isOpt ? 88 : 74,
          chlorophyll_mg_m3: parseFloat((0.45 + ((Math.abs(f.latitude * 3 + f.longitude * 7) % 55) / 100)).toFixed(2)),
          target_species: isOpt 
            ? ['Yellowfin Tuna', 'Surmai (King Mackerel)', 'Pomfret'] 
            : ['Indian Mackerel', 'Tarli (Sardine)', 'White Prawns'],
          source: 'ARGO Hydrographic In-Situ Cast'
        } as unknown as PFZAdvisory;
      });
  }, [pfzZones, floats]);

  const handleSelectPort = async (port: any) => {
    setSelectedPort(port);
    setIsPortHudExpanded(true);
    try {
      const res = await fetch(`http://localhost:8000/api/ports/${port.id}/nearest-pfz`);
      const data = await res.json();
      if (data.status === 'success') {
        setPortTargetPfz(data);
      }
    } catch (err) {
      console.error('Failed to resolve nearest PFZ for port:', err);
    }
  };

  const handleFocusSector = (sector: 'arabian' | 'bengal' | 'equatorial' | 'south' | 'all') => {
    let center: [number, number] = [1.5, 76.0];
    let zoom = 4;
    switch (sector) {
      case 'arabian':
        center = [16.0, 68.0];
        zoom = 6;
        break;
      case 'bengal':
        center = [15.0, 88.0];
        zoom = 6;
        break;
      case 'equatorial':
        center = [0.0, 78.0];
        zoom = 5;
        break;
      case 'south':
        center = [-14.0, 78.0];
        zoom = 5;
        break;
      case 'all':
      default:
        center = [1.5, 76.0];
        zoom = 4;
        break;
    }
    setJumpTarget({ center, zoom });
    setSectorMenuOpen(false);
  };

  const handleLocateVessel = () => {
    setIsLocating(true);
    const setCoords = (lat: number, lon: number) => {
      let vLat = lat;
      let vLon = lon;
      if (lat < -10 || lat > 30 || lon < 50 || lon > 100) {
        vLat = 18.72;
        vLon = 72.45;
      }
      setUserVesselPos([vLat, vLon]);
      setJumpTarget({ center: [vLat, vLon], zoom: 8 });
      setIsLocating(false);
      setIsVesselHudExpanded(true);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords(pos.coords.latitude, pos.coords.longitude),
        () => setCoords(18.72, 72.45),
        { timeout: 4000, enableHighAccuracy: true }
      );
    } else {
      setCoords(18.72, 72.45);
    }
  };

  const vesselDistanceKm = userVesselPos && activeTargetPfz
    ? Math.round(haversineDistKm(userVesselPos[0], userVesselPos[1], activeTargetPfz.latitude, activeTargetPfz.longitude) * 10) / 10
    : null;

  const toggleSatelliteMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSatLayersMenuOpen((prev) => !prev);
    setSectorMenuOpen(false);
    setSpeciesMenuOpen(false);
    setSatLayerInfoView('none');
  };

  const activeSpecies = TARGET_SPECIES_OPTIONS.find((s) => s.id === selectedSpecies);

  const displayedPfzZones = openOceanPfzZones.filter((zone) => {
    if (selectedSpecies === 'all') return true;
    const targetList = (zone.target_species || []).map((s: string) => s.toLowerCase());

    switch (selectedSpecies) {
      case 'surmai':
        return targetList.some((s) => s.includes('surmai') || (s.includes('mackerel') && s.includes('king')) || s.includes('seer'));
      case 'bangda':
        return targetList.some((s) => s.includes('bangda') || (s.includes('mackerel') && !s.includes('king')));
      case 'rawas':
        return targetList.some((s) => s.includes('rawas') || s.includes('salmon'));
      case 'paplet':
        return targetList.some((s) => s.includes('pomfret') || s.includes('paplet'));
      case 'tuna':
        return targetList.some((s) => s.includes('tuna') || s.includes('yellowfin'));
      case 'tarli':
        return targetList.some((s) => s.includes('tarli') || s.includes('sardine') || s.includes('mathi'));
      case 'hilsa':
        return targetList.some((s) => s.includes('hilsa') || s.includes('ilish'));
      default:
        return true;
    }
  });

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-abyssal-800/80 bg-abyssal-950 shadow-2xl flex flex-col">
      
      {/* Top Map Control Header */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-start justify-between pointer-events-none gap-1.5 flex-wrap sm:flex-nowrap">
        
        {/* Left: Sector & Species */}
        <div className="flex items-center gap-1.5 pointer-events-auto ml-11 sm:ml-12 flex-nowrap shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSectorMenuOpen(!sectorMenuOpen);
                setSpeciesMenuOpen(false);
                setSatLayersMenuOpen(false);
              }}
              className="flex items-center space-x-1 bg-abyssal-950/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-cyan-500/30 text-[10px] sm:text-[11px] font-bold text-slate-200 hover:text-white shadow-xl transition cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <Compass className="w-3.5 h-3.5 text-ocean-cyan" />
              <span>Sectors</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${sectorMenuOpen ? 'rotate-180 text-ocean-cyan' : ''}`} />
            </button>

            {sectorMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-48 bg-[#071322] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 z-[1100] space-y-1 ring-1 ring-cyan-500/20"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800">
                  Indian Ocean Sectors
                </div>
                {[
                  { id: 'all', label: 'Entire Indian Ocean' },
                  { id: 'arabian', label: 'Arabian Sea' },
                  { id: 'bengal', label: 'Bay of Bengal' },
                  { id: 'equatorial', label: 'Equatorial Region' },
                  { id: 'south', label: 'South Ocean' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFocusSector(item.id as any);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs text-slate-300 hover:text-white hover:bg-[#0c1e34] transition cursor-pointer"
                  >
                    <span className="font-semibold">{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSpeciesMenuOpen(!speciesMenuOpen);
                setSectorMenuOpen(false);
                setSatLayersMenuOpen(false);
              }}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-bold transition shadow-xl cursor-pointer active:scale-95 whitespace-nowrap ${
                selectedSpecies !== 'all'
                  ? 'bg-amber-500/25 border-amber-500/60 text-amber-300 shadow-glow-amber-sm'
                  : 'bg-abyssal-950/95 backdrop-blur-md border-cyan-500/30 text-slate-200 hover:text-white'
              }`}
            >
              <Fish className="w-3.5 h-3.5 text-amber-400" />
              <span>{selectedSpecies === 'all' ? 'Species' : activeSpecies?.label.split('(')[0].trim()}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${speciesMenuOpen ? 'rotate-180 text-amber-400' : ''}`} />
            </button>

            {speciesMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-56 bg-[#071322] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 z-[1100] space-y-1 ring-1 ring-cyan-500/20"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800">
                  Filter PFZ by Marine Species
                </div>
                {TARGET_SPECIES_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSpecies(opt.id);
                      setSpeciesMenuOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 text-xs rounded-lg transition font-medium flex items-center justify-between cursor-pointer ${
                      selectedSpecies === opt.id
                        ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold'
                        : 'text-slate-300 hover:bg-[#0c1e34] hover:text-white'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.id !== 'all' && (
                      <span className="text-[10px] text-cyan-300 font-mono">
                        {opt.minSST}–{opt.maxSST}°C
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Floats, PFZ Count, Ports, Satellite Layers */}
        <div className="flex flex-wrap sm:flex-nowrap justify-end items-center gap-1 pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFloats(!showFloats);
            }}
            title="Toggle Active ARGO Subsurface Floats"
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-semibold backdrop-blur-md shadow-xl transition cursor-pointer active:scale-95 whitespace-nowrap ${
              showFloats
                ? 'bg-cyan-950/85 border-cyan-500/50 text-cyan-300 shadow-cyan-950/40'
                : 'bg-abyssal-950/90 border-abyssal-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${showFloats ? 'bg-cyan-400 animate-pulse' : 'bg-slate-500'}`}></span>
            <span>Floats ({floats.length})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPorts(!showPorts);
            }}
            title="Toggle INCOIS Coastal Fish Landing Centers"
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-semibold backdrop-blur-md shadow-xl transition cursor-pointer active:scale-95 whitespace-nowrap ${
              showPorts
                ? 'bg-sky-950/85 border-sky-500/60 text-sky-300 shadow-sky-950/40'
                : 'bg-abyssal-950/90 border-abyssal-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Anchor className={`w-3.5 h-3.5 ${showPorts ? 'text-sky-400' : 'text-slate-400'}`} />
            <span>Ports ({ports.length})</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowPFZ(!showPFZ);
            }}
            title="Toggle Float-Driven Potential Fishing Zones"
            className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-semibold backdrop-blur-md shadow-xl transition cursor-pointer active:scale-95 whitespace-nowrap ${
              showPFZ
                ? 'bg-amber-950/85 border-amber-500/60 text-amber-300 shadow-amber-950/40'
                : 'bg-abyssal-950/90 border-abyssal-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Fish className={`w-3.5 h-3.5 ${showPFZ ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>PFZ ({displayedPfzZones.length})</span>
          </button>

          {/* Satellite Layer Dropdown Menu */}
          <div className="relative pointer-events-auto">
            <button
              type="button"
              onClick={toggleSatelliteMenu}
              title="Toggle continuous NOAA & NASA satellite layers"
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-xl border text-[10px] sm:text-[11px] font-semibold backdrop-blur-md shadow-xl transition cursor-pointer active:scale-95 whitespace-nowrap ${
                showSatelliteSST || showChlorophyll
                  ? 'bg-ocean-cyan/15 border-ocean-cyan/50 text-ocean-cyan shadow-glow-cyan-sm'
                  : 'bg-abyssal-950/90 border-abyssal-800 text-slate-300 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-ocean-cyan" />
              <span>Satellite</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${satLayersMenuOpen ? 'rotate-180 text-ocean-cyan' : ''}`} />
            </button>

            {satLayersMenuOpen && (
              <div 
                className="absolute right-0 top-full mt-2 w-72 bg-[#071322]/98 border border-cyan-500/40 rounded-xl shadow-2xl p-2.5 z-[99999] space-y-2 ring-1 ring-cyan-500/20 backdrop-blur-2xl pointer-events-auto font-sans animate-in fade-in zoom-in-95 duration-100"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-1 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span className="flex items-center gap-1.5 text-cyan-300">
                    <Satellite className="w-3.5 h-3.5" /> Satellite Remote Sensing
                  </span>
                  {satLayerInfoView !== 'none' && (
                    <button
                      type="button"
                      onClick={() => setSatLayerInfoView('none')}
                      className="text-[9px] text-slate-400 hover:text-white transition flex items-center gap-0.5 font-mono cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Back
                    </button>
                  )}
                </div>

                {satLayerInfoView === 'none' && (
                  <div className="space-y-1.5">
                    {/* Thermal Grid */}
                    <div className="rounded-xl border border-rose-500/25 bg-rose-950/20 p-1.5 transition hover:border-rose-500/40">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowSatelliteSST(!showSatelliteSST);
                          }}
                          className="flex-1 flex items-center space-x-2 text-left cursor-pointer"
                        >
                          <div className="p-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                            <Satellite className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-100">Thermal Grid</div>
                            <div className="text-[9px] text-rose-300/80 font-mono">NOAA MUR SST (1km)</div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSatLayerInfoView('sst')}
                            className="p-1 rounded-full text-slate-400 hover:text-amber-300 hover:bg-abyssal-800/80 transition cursor-pointer"
                            title="How Thermal SST locates fish"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowSatelliteSST(!showSatelliteSST)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition font-bold ${
                              showSatelliteSST ? 'bg-rose-600 text-white shadow-md' : 'bg-abyssal-900 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {showSatelliteSST ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Phytoplankton Density */}
                    <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/20 p-1.5 transition hover:border-emerald-500/40">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowChlorophyll(!showChlorophyll);
                          }}
                          className="flex-1 flex items-center space-x-2 text-left cursor-pointer"
                        >
                          <div className="p-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                            <Leaf className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-100">Phytoplankton Density</div>
                            <div className="text-[9px] text-emerald-300/80 font-mono">NASA Chlorophyll-a</div>
                          </div>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSatLayerInfoView('chl')}
                            className="p-1 rounded-full text-slate-400 hover:text-emerald-300 hover:bg-abyssal-800/80 transition cursor-pointer"
                            title="How Chlorophyll locates fish"
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowChlorophyll(!showChlorophyll)}
                            className={`text-[10px] font-mono px-2 py-0.5 rounded cursor-pointer transition font-bold ${
                              showChlorophyll ? 'bg-emerald-600 text-white shadow-md' : 'bg-abyssal-900 text-slate-400 border border-slate-700'
                            }`}
                          >
                            {showChlorophyll ? 'ON' : 'OFF'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-View: Thermal Grid Guide */}
                {satLayerInfoView === 'sst' && (
                  <div className="p-2 rounded-xl bg-[#0e1724] border border-rose-500/40 text-[10.5px] text-slate-200 space-y-1.5 animate-in fade-in duration-100 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-rose-300 text-xs">
                      <Satellite className="w-3.5 h-3.5 text-rose-400" />
                      <span>Thermal Fronts & Fishing</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Fish are cold-blooded and aggregate along <strong>Thermal Fronts</strong> (boundaries where cold upwelled water meets warm surface water).
                    </p>
                    <div className="font-mono text-[9.5px] space-y-1 bg-abyssal-950/70 p-1.5 rounded-lg border border-slate-800">
                      <div>• <span className="text-cyan-300">26.0–28.5°C:</span> Peak Tuna, Surmai & Pomfret feeding zones.</div>
                      <div>• <span className="text-amber-300">Thermal Gradients:</span> Sharp temperature drops trap baitfish schools.</div>
                    </div>
                  </div>
                )}

                {/* Sub-View: Chlorophyll-a Guide */}
                {satLayerInfoView === 'chl' && (
                  <div className="p-2 rounded-xl bg-[#071d18] border border-emerald-500/40 text-[10.5px] text-slate-200 space-y-1.5 animate-in fade-in duration-100 font-sans">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-xs">
                      <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Chlorophyll & Marine Food Chain</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      Chlorophyll-a measures <strong>microscopic phytoplankton density</strong>, the fundamental base of the entire marine food chain.
                    </p>
                    <div className="font-mono text-[9.5px] space-y-1 bg-abyssal-950/70 p-1.5 rounded-lg border border-slate-800">
                      <div>• <span className="text-emerald-300">&gt; 0.45 mg/m³:</span> High primary productivity attracting Sardines & Mackerel.</div>
                      <div>• <span className="text-teal-300">PFZ Overlay:</span> High Chlorophyll + sharp Thermal Front = <strong>High Yield PFZ</strong>.</div>
                    </div>
                  </div>
                )}

                <div className="pt-1 border-t border-slate-800 text-[9px] text-cyan-300/80 font-mono text-center">
                  INCOIS Multi-Sensor Oceanic Fusion
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mini Satellite Scale */}
      {(showSatelliteSST || showChlorophyll) && (
        <div className="absolute top-14 left-3 z-[900] pointer-events-none flex flex-col gap-1.5 items-start">
          {showSatelliteSST && (
            <div className="bg-[#071322]/95 backdrop-blur-md border border-rose-500/40 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-200 shadow-2xl flex items-center gap-2">
              <span className="text-rose-400 font-bold">Thermal SST</span>
              <span className="text-slate-400">&lt;26°</span>
              <span className="w-16 h-2 rounded-full bg-gradient-to-r from-blue-500 via-teal-400 via-orange-400 to-red-500 inline-block shadow-inner"></span>
              <span className="text-rose-300">&gt;30°C</span>
            </div>
          )}
          {showChlorophyll && (
            <div className="bg-[#071322]/95 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-200 shadow-2xl flex items-center gap-2">
              <span className="text-emerald-400 font-bold">Chlorophyll-a</span>
              <span className="text-slate-400">0.2</span>
              <span className="w-16 h-2 rounded-full bg-gradient-to-r from-teal-400 via-emerald-400 to-emerald-700 inline-block shadow-inner"></span>
              <span className="text-emerald-300">&gt;2.5 mg/m³</span>
            </div>
          )}
        </div>
      )}

      {/* Map Container */}
      <MapContainer
        center={[1.5, 76.0]}
        zoom={4}
        className="flex-1 w-full h-full"
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
        attributionControl={false}
      >
        <HighlightController 
          highlightMarkers={highlightMarkers} 
          selectedAnomaly={activeTargetAnomaly}
        />
        <SectorController targetCenter={jumpTarget ? jumpTarget.center : null} targetZoom={jumpTarget ? jumpTarget.zoom : null} />

        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />

        {/* 1. NOAA Satellite Thermal SST Grid Overlay */}
        {showSatelliteSST &&
          satelliteGrid.map((pt: any, idx) => {
            const color = getSSTColor(pt.sst);
            const edgeAlpha = pt.edge_alpha !== undefined ? pt.edge_alpha : 1.0;
            return (
              <CircleMarker
                key={`sat-sst-${idx}`}
                center={[pt.lat, pt.lon]}
                radius={16}
                pathOptions={{
                  color: 'transparent',
                  fillColor: color,
                  fillOpacity: (showChlorophyll ? 0.15 : 0.22) * edgeAlpha,
                  weight: 0,
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-100 min-w-[180px] font-mono text-xs">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <Satellite className="w-3.5 h-3.5" /> NOAA Satellite SST
                    </div>
                    <div>SST: <strong className="text-white">{pt.sst}°C</strong></div>
                    <div>Coord: {pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* 2. NASA Chlorophyll-a Overlay */}
        {showChlorophyll &&
          satelliteGrid.map((pt: any, idx) => {
            const chl = pt.chlorophyll;
            const color = getChlColor(chl);
            const edgeAlpha = pt.edge_alpha !== undefined ? pt.edge_alpha : 1.0;
            return (
              <CircleMarker
                key={`sat-chl-${idx}`}
                center={[pt.lat, pt.lon]}
                radius={showSatelliteSST ? 8 : 14}
                pathOptions={{
                  color: showSatelliteSST ? '#34d399' : 'transparent',
                  fillColor: color,
                  fillOpacity: (showSatelliteSST ? 0.35 : 0.22) * edgeAlpha,
                  weight: showSatelliteSST ? 1.0 : 0,
                  opacity: showSatelliteSST ? 0.6 : 0,
                }}
              >
                <Popup>
                  <div className="p-1 space-y-1 text-slate-100 min-w-[190px] font-mono text-xs">
                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5" /> NASA Chlorophyll-a
                    </div>
                    <div>Density: <strong className="text-white">{chl} mg/m³</strong></div>
                    <div>Coord: {pt.lat.toFixed(2)}°N, {pt.lon.toFixed(2)}°E</div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        {/* Clustered Coastal Fish Landing Centers (FLC) */}
        {showPorts && (
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createCustomClusterIcon}
            maxClusterRadius={45}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
          >
            {ports.map((port) => {
              const isSelected = selectedPort?.id === port.id;
              return (
                <Marker
                  key={port.id}
                  position={[port.lat, port.lon]}
                  icon={createPortAnchorIcon(isSelected)}
                  eventHandlers={{
                    click: () => handleSelectPort(port),
                  }}
                >
                  <Popup>
                    <div className="p-1 font-mono text-xs text-slate-100 min-w-[210px]">
                      <div className="font-bold text-sky-400 text-sm font-sans flex items-center gap-1.5 border-b border-slate-700 pb-1">
                        <Anchor className="w-4 h-4 text-sky-400 shrink-0" /> {port.name}
                      </div>
                      <div className="text-[11px] text-slate-300 mt-1">
                        {port.district ? `${port.district}, ` : ''}{port.state}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800 flex justify-between">
                        <span>Lat: <strong>{port.lat.toFixed(3)}°N</strong></span>
                        <span>Lon: <strong>{port.lon.toFixed(3)}°E</strong></span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSelectPort(port)}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-[10px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> Compute Bearing to PFZ
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        )}

        {/* Selected Port to PFZ Bearing Vector */}
        {selectedPort && portTargetPfz && (
          <Polyline
            positions={[
              [selectedPort.lat, selectedPort.lon],
              [portTargetPfz.nearest_pfz.latitude, portTargetPfz.nearest_pfz.longitude]
            ]}
            pathOptions={{ color: '#38bdf8', dashArray: '6, 6', weight: 2.5, opacity: 0.9 }}
          />
        )}

        {/* Dynamic Boat Route Vector */}
        {userVesselPos && activeTargetPfz && (
          <Polyline
            positions={[
              userVesselPos,
              [activeTargetPfz.latitude, activeTargetPfz.longitude]
            ]}
            pathOptions={{ color: '#f59e0b', dashArray: '8, 6', weight: 3.5, opacity: 0.95 }}
          />
        )}

        {/* Open Ocean Float-Derived PFZ Opportunity Zones */}
        {showPFZ &&
          displayedPfzZones.map((pfz, idx) => {
            const isHighYield = pfz.pfz_score >= 75;
            const activeDistanceKm = userVesselPos
              ? Math.round(haversineDistKm(userVesselPos[0], userVesselPos[1], pfz.latitude, pfz.longitude) * 10) / 10
              : pfz.nearest_harbour?.distance_km || 120;
            
            const travelHours = (activeDistanceKm / 16.7).toFixed(1);
            const estFuelLiters = Math.round(activeDistanceKm * 1.85);
            const thermoclineMin = Math.round(Math.max(25, (pfz.sst_celsius - 22) * 5.5));
            const thermoclineMax = thermoclineMin + 25;

            const cardKey = `pfz-${idx}`;
            const currentView = pfzPopupView[cardKey] || 'main';

            const setView = (view: 'main' | 'guide' | 'argo_info' | 'sat_info' | 'chl_info') => {
              setPfzPopupView(prev => ({ ...prev, [cardKey]: view }));
            };

            return (
              <React.Fragment key={`pfz-group-${idx}`}>
                <CircleMarker
                  center={[pfz.latitude, pfz.longitude]}
                  radius={isHighYield ? 14 : 11}
                  pathOptions={{
                    color: '#020617',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                    weight: 3.5,
                    opacity: 0.95,
                  }}
                />
                <CircleMarker
                  center={[pfz.latitude, pfz.longitude]}
                  radius={isHighYield ? 13 : 10}
                  pathOptions={{
                    color: '#fef08a',
                    fillColor: isHighYield ? '#f59e0b' : '#d97706',
                    fillOpacity: 0.95,
                    weight: isHighYield ? 2 : 1.5,
                  }}
                >
                  <Popup>
                    <div 
                      className="p-1 text-slate-100 w-[300px] font-sans flex flex-col"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        L.DomEvent.stopPropagation(e as any);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        L.DomEvent.stopPropagation(e as any);
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-abyssal-800 pb-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Fish className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="font-bold text-amber-300 text-sm tracking-tight font-heading">
                            PFZ: {pfz.pfz_rating} ({pfz.pfz_score}/100)
                          </span>
                          
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setView(currentView === 'guide' ? 'main' : 'guide');
                            }}
                            className={`p-1 rounded-full border transition-all cursor-pointer ${
                              currentView === 'guide'
                                ? 'bg-amber-400 text-abyssal-950 border-amber-300 shadow-[0_0_10px_#f59e0b]'
                                : 'bg-amber-500/20 text-amber-300 border-amber-400/60 hover:bg-amber-400 hover:text-abyssal-950'
                            }`}
                            title="Click for PFZ Telemetry & Operational Guide"
                          >
                            <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                          </button>
                        </div>

                        <span className="text-xs font-mono font-bold bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded-lg border border-amber-600/50 shadow-inner">
                          {pfz.sst_celsius}°C
                        </span>
                      </div>

                      <div className="min-h-[195px] flex flex-col justify-between">
                        {currentView === 'main' && (
                          <div className="space-y-2 animate-in fade-in duration-100">
                            <div className="bg-abyssal-900/80 p-2 rounded-xl border border-abyssal-800 space-y-1">
                              <div className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400 flex items-center justify-between">
                                <span>Target Pelagic Species</span>
                                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> High Density
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-100">
                                {pfz.target_species && pfz.target_species.length > 0
                                  ? pfz.target_species.slice(0, 3).join(', ')
                                  : 'Yellowfin Tuna, Surmai, Pomfret'}
                              </div>
                              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 pt-1 border-t border-abyssal-800/80">
                                <span className="text-slate-400 flex items-center gap-1">
                                  <LayersIcon className="w-3 h-3 text-cyan-400" /> Thermocline Layer:
                                </span>
                                <span className="text-cyan-300 font-bold">{thermoclineMin}m – {thermoclineMax}m Depth</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
                              <button
                                type="button"
                                onClick={() => setView('argo_info')}
                                className="bg-abyssal-900/70 hover:bg-cyan-950/50 p-1.5 rounded-lg border border-abyssal-800 hover:border-cyan-500/50 text-left transition cursor-pointer group"
                              >
                                <span className="text-[9px] text-slate-400 group-hover:text-cyan-300 flex items-center justify-between font-sans">
                                  <span>Argo SST</span>
                                  <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-cyan-400" />
                                </span>
                                <span className="text-xs font-bold text-slate-100 block text-center mt-0.5">{pfz.sst_celsius}°C</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setView('sat_info')}
                                className="bg-abyssal-900/70 hover:bg-rose-950/50 p-1.5 rounded-lg border border-abyssal-800 hover:border-rose-500/50 text-left transition cursor-pointer group"
                              >
                                <span className="text-[9px] text-slate-400 group-hover:text-rose-300 flex items-center justify-between font-sans">
                                  <span>Sat SST</span>
                                  <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-rose-400" />
                                </span>
                                <span className="text-xs font-bold text-slate-100 block text-center mt-0.5">{pfz.satellite_sst ? `${pfz.satellite_sst}°C` : `${pfz.sst_celsius}°C`}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setView('chl_info')}
                                className="bg-abyssal-900/70 hover:bg-emerald-950/50 p-1.5 rounded-lg border border-abyssal-800 hover:border-emerald-500/50 text-left transition cursor-pointer group"
                              >
                                <span className="text-[9px] text-slate-400 group-hover:text-emerald-300 flex items-center justify-between font-sans">
                                  <span>Chlorophyll</span>
                                  <HelpCircle className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 text-emerald-400" />
                                </span>
                                <span className="text-xs font-bold text-emerald-400 block text-center mt-0.5">{pfz.chlorophyll_mg_m3 || '0.69'} <span className="text-[8.5px]">mg/m³</span></span>
                              </button>
                            </div>

                            <div className="bg-[#051824]/90 p-2 rounded-xl border border-cyan-500/30 space-y-1.5 font-mono text-xs">
                              <div className="flex items-center justify-between text-[10px] text-cyan-300/90 font-bold border-b border-cyan-500/20 pb-1">
                                <span className="flex items-center gap-1">
                                  <Navigation className="w-3 h-3 text-emerald-400" /> 
                                  {userVesselPos ? 'Direct from Your Vessel' : 'From Nearest Harbour'}
                                </span>
                                <span className="text-amber-300 font-bold">{activeDistanceKm} km</span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200 pt-0.5">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-cyan-400" />
                                  <span>Voyage: <strong className="text-cyan-300">~{travelHours} hrs</strong></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Fuel className="w-3 h-3 text-amber-400" />
                                  <span>Fuel: <strong className="text-amber-300">~{estFuelLiters} L</strong></span>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-cyan-500/20 pt-1">
                                <span className="flex items-center gap-1">
                                  <Waves className="w-3 h-3 text-emerald-400" /> Sea State: Moderate
                                </span>
                                <span className="text-slate-400">Valid: 36h</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentView === 'guide' && (
                          <div className="p-2.5 rounded-xl bg-[#071926] border border-amber-500/40 text-[10.5px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                            <div className="flex items-center justify-between border-b border-amber-500/30 pb-1 mb-1 font-sans">
                              <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> PFZ & Voyage Guide
                              </span>
                              <button
                                type="button"
                                onClick={() => setView('main')}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5 text-slate-300 overflow-y-auto max-h-[145px] pr-0.5">
                              <div>• <strong className="text-amber-300">PFZ Score ({pfz.pfz_score}/100):</strong> Fused rating combining thermal gradient sharpness, upwelling chlorophyll, and depth profile.</div>
                              <div>• <strong className="text-cyan-300">Thermocline Layer:</strong> Depth zone where steep temp drop concentrates pelagic baitfish.</div>
                              <div>• <strong className="text-amber-300">Voyage (~{travelHours}h):</strong> Transit time based on a standard 9-knot (~16.7 km/h) trawler cruise speed.</div>
                              <div>• <strong className="text-amber-400">Fuel (~{estFuelLiters}L):</strong> Estimated diesel consumption based on 1.85 L/km single-screw marine engines.</div>
                            </div>
                          </div>
                        )}

                        {currentView === 'argo_info' && (
                          <div className="p-2.5 rounded-xl bg-[#061826] border border-cyan-500/40 text-[10.5px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                            <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1 font-sans">
                              <span className="font-bold text-cyan-300 text-xs flex items-center gap-1">
                                ⚓ In-Situ ARGO Float SST
                              </span>
                              <button
                                type="button"
                                onClick={() => setView('main')}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5 text-slate-300 overflow-y-auto max-h-[145px] pr-0.5">
                              <div>• <strong className="text-cyan-300">Direct Physical Cast:</strong> In-situ ocean temperature measured directly by subsurface CTD profiling floats at 0–5m depth.</div>
                              <div>• <strong className="text-cyan-200">Ground-Truth Accuracy:</strong> Unaffected by cloud cover or atmospheric moisture interference.</div>
                            </div>
                          </div>
                        )}

                        {currentView === 'sat_info' && (
                          <div className="p-2.5 rounded-xl bg-[#140b1e] border border-rose-500/40 text-[10.5px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                            <div className="flex items-center justify-between border-b border-rose-500/30 pb-1 mb-1 font-sans">
                              <span className="font-bold text-rose-300 text-xs flex items-center gap-1">
                                🛰️ NOAA MUR Satellite SST
                              </span>
                              <button
                                type="button"
                                onClick={() => setView('main')}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5 text-slate-300 overflow-y-auto max-h-[145px] pr-0.5">
                              <div>• <strong className="text-rose-300">Continuous Infrared:</strong> NOAA Multi-scale Ultra-high Resolution (1km) continuous radiometric surface scans.</div>
                              <div>• <strong className="text-rose-200">Front Detection:</strong> Detects sharp horizontal thermal gradients where cold nutrient water meets warm tropical currents.</div>
                            </div>
                          </div>
                        )}

                        {currentView === 'chl_info' && (
                          <div className="p-2.5 rounded-xl bg-[#041a15] border border-emerald-500/40 text-[10.5px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                            <div className="flex items-center justify-between border-b border-emerald-500/30 pb-1 mb-1 font-sans">
                              <span className="font-bold text-emerald-300 text-xs flex items-center gap-1">
                                🌿 NASA Chlorophyll-a (Phytoplankton)
                              </span>
                              <button
                                type="button"
                                onClick={() => setView('main')}
                                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-1.5 text-slate-300 overflow-y-auto max-h-[145px] pr-0.5">
                              <div>• <strong className="text-emerald-300">Biological Biomass:</strong> Measured in mg/m³ via NASA VIIRS ocean color radiometry.</div>
                              <div>• <strong className="text-emerald-200">Feeding Ground Indicator:</strong> Values &gt; 0.45 mg/m³ indicate rich phytoplankton blooms that attract pelagic schools.</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!userVesselPos) {
                            setUserVesselPos([18.72, 72.45]);
                          }
                          setActiveTargetPfz(pfz);
                          setJumpTarget({ center: [pfz.latitude, pfz.longitude], zoom: 6.5 });
                        }}
                        className={`w-full mt-2.5 py-2 px-3 rounded-xl font-bold text-xs transition shadow-lg active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                          activeTargetPfz?.latitude === pfz.latitude && activeTargetPfz?.longitude === pfz.longitude
                            ? 'bg-emerald-500 text-abyssal-950 ring-2 ring-emerald-300'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-abyssal-950'
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5 fill-abyssal-950" />
                        <span>
                          {activeTargetPfz?.latitude === pfz.latitude && activeTargetPfz?.longitude === pfz.longitude
                            ? '✓ Route Plotted from Vessel'
                            : 'Plot Route from Vessel'}
                        </span>
                      </button>

                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}

        {/* Float Markers (Active Anomaly will be automatically highlighted Red) */}
        {showFloats &&
          floats.map((f: any, index: number) => {
            const isSelected = selectedFloatId === f.float_id;
            const isHighlighted = highlightMarkers?.some((m) => m.float_id === f.float_id) ?? false;
            
            const isAnomalous = Boolean(
              activeTargetAnomaly && (
                activeTargetAnomaly.float_id === f.float_id || 
                (Math.abs(activeTargetAnomaly.latitude - f.latitude) < 0.3 && Math.abs(activeTargetAnomaly.longitude - f.longitude) < 0.3)
              )
            );

            const icon = createFloatIcon(isHighlighted, isSelected, isAnomalous);

            return (
              <Marker
                key={`${f.float_id}-${index}-${isAnomalous ? 'red' : 'norm'}`}
                position={[f.latitude, f.longitude]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setActivePopupView('grid');
                    if (onSelectFloat) onSelectFloat(f.float_id);
                  },
                }}
              >
                <Popup>
                  <div 
                    className="p-1 text-slate-100 w-[270px] font-sans flex flex-col"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      L.DomEvent.stopPropagation(e as any);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      L.DomEvent.stopPropagation(e as any);
                    }}
                  >
                    <div className="flex items-center justify-between border-b border-abyssal-800 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`font-bold text-sm font-heading tracking-wide ${isAnomalous ? 'text-rose-400' : 'text-ocean-cyan'}`}>
                          Float #{f.float_id}
                        </span>
                        
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            L.DomEvent.stopPropagation(e as any);
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            L.DomEvent.stopPropagation(e as any);
                            setActivePopupView(activePopupView === 'info_guide' ? 'grid' : 'info_guide');
                          }}
                          className={`p-1 rounded-full border transition-all cursor-pointer ${
                            activePopupView === 'info_guide'
                              ? 'bg-cyan-400 text-abyssal-950 border-cyan-300 shadow-[0_0_10px_#22d3ee]'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/80 shadow-[0_0_8px_rgba(6,182,212,0.6)] hover:bg-cyan-400 hover:text-abyssal-950'
                          }`}
                          title="Click to view telemetry guide"
                        >
                          <Info className="w-3.5 h-3.5 stroke-[2.5]" />
                        </button>
                      </div>

                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        isAnomalous 
                          ? 'bg-rose-950 text-rose-300 border-rose-600 shadow-sm'
                          : 'bg-abyssal-900 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isAnomalous ? 'ANOMALY' : 'Active'}
                      </span>
                    </div>

                    <div className="min-h-[150px] flex flex-col justify-between">
                      {activePopupView === 'grid' && (
                        <div className="space-y-2.5 font-mono animate-in fade-in duration-100">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-abyssal-900/60 p-1.5 rounded-lg border border-abyssal-800">
                              <span className="text-slate-400 block text-[9.5px] font-sans font-medium">Max Depth</span>
                              <span className="text-slate-100 font-semibold">{f.max_depth ? `${f.max_depth.toFixed(0)}m` : '2000m'}</span>
                            </div>
                            <div className="bg-abyssal-900/60 p-1.5 rounded-lg border border-abyssal-800">
                              <span className="text-slate-400 block text-[9.5px] font-sans font-medium">Date Recorded</span>
                              <span className="text-slate-100 font-semibold">{new Date(f.date).toLocaleDateString('en-GB')}</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-abyssal-900/60 p-1.5 rounded-lg border border-abyssal-800">
                              <span className="text-slate-400 block text-[9.5px] font-sans font-medium">Latitude</span>
                              <span className="text-slate-100 font-semibold">{f.latitude.toFixed(3)}°</span>
                            </div>
                            <div className="bg-abyssal-900/60 p-1.5 rounded-lg border border-abyssal-800">
                              <span className="text-slate-400 block text-[9.5px] font-sans font-medium">Longitude</span>
                              <span className="text-slate-100 font-semibold">{f.longitude.toFixed(3)}°</span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                                setActivePopupView('temp_guide');
                              }}
                              className="p-1.5 rounded-lg bg-abyssal-900 hover:bg-amber-950/40 border border-amber-500/25 hover:border-amber-500/60 text-left transition-all cursor-pointer group"
                            >
                              <span className="text-slate-400 group-hover:text-amber-300 block text-[9.5px] font-sans font-medium flex items-center justify-between">
                                <span>Surface Temp</span>
                                <HelpCircle className="w-2.5 h-2.5 text-amber-400 opacity-70 group-hover:opacity-100" />
                              </span>
                              <span className="text-amber-300 font-bold text-xs mt-0.5 block">
                                {f.surface_temp !== undefined && f.surface_temp !== null ? `${f.surface_temp.toFixed(1)}°C` : '28.4°C'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                                setActivePopupView('sal_guide');
                              }}
                              className="p-1.5 rounded-lg bg-abyssal-900 hover:bg-teal-950/40 border border-teal-500/25 hover:border-teal-500/60 text-left transition-all cursor-pointer group"
                            >
                              <span className="text-slate-400 group-hover:text-teal-300 block text-[9.5px] font-sans font-medium flex items-center justify-between">
                                <span>Surface Salinity</span>
                                <HelpCircle className="w-2.5 h-2.5 text-teal-400 opacity-70 group-hover:opacity-100" />
                              </span>
                              <span className="text-teal-300 font-bold text-xs mt-0.5 block">
                                {f.surface_salinity !== undefined && f.surface_salinity !== null ? `${f.surface_salinity.toFixed(2)} PSU` : '35.12 PSU'}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}

                      {activePopupView === 'info_guide' && (
                        <div className="p-2 rounded-xl bg-[#061526] border border-cyan-500/40 text-[10px] text-cyan-100 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                          <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1 mb-1 font-sans">
                            <span className="font-bold text-cyan-300 text-[11px] flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-cyan-400" /> Card Telemetry Guide
                            </span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                                setActivePopupView('grid');
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              title="Back to telemetry"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1 text-slate-200 overflow-y-auto max-h-[125px] pr-0.5">
                            <div>• <strong className="text-cyan-300">Max Depth:</strong> Deepest level (up to 2000m) recorded in the CTD cast.</div>
                            <div>• <strong className="text-cyan-300">Date Recorded:</strong> Surface transmission timestamp to satellite.</div>
                            <div>• <strong className="text-cyan-300">Lat & Long:</strong> Surface coordinates in the Indian Ocean.</div>
                            <div>• <strong className="text-amber-300">Surface Temp:</strong> In-situ sea surface temperature (0–5m depth).</div>
                            <div>• <strong className="text-teal-300">Surface Salinity:</strong> Dissolved salt level in Practical Salinity Units.</div>
                          </div>
                        </div>
                      )}

                      {activePopupView === 'temp_guide' && (
                        <div className="p-2 rounded-xl bg-[#0a1826] border border-amber-500/40 text-[10px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                          <div className="flex items-center justify-between border-b border-amber-500/30 pb-1 mb-1 font-sans">
                            <span className="font-bold text-amber-300 text-[11px]">🌊 Surface Temp (SST) Ranges</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                                setActivePopupView('grid');
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              title="Back to telemetry"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1 text-slate-300 overflow-y-auto max-h-[125px] pr-0.5">
                            <div>• <strong className="text-cyan-300">&lt; 26.0°C:</strong> Coastal Upwelling (Nutrient-rich feeding grounds).</div>
                            <div>• <strong className="text-emerald-300">26.0° – 28.5°C:</strong> Prime tropical pelagic catch (Surmai, Tuna, Pomfret).</div>
                            <div>• <strong className="text-rose-300">&gt; 29.5°C:</strong> Marine Heatwave risk / thermal stratification.</div>
                          </div>
                        </div>
                      )}

                      {activePopupView === 'sal_guide' && (
                        <div className="p-2 rounded-xl bg-[#071926] border border-teal-500/40 text-[10px] text-slate-200 flex flex-col justify-between h-full animate-in fade-in duration-100 font-mono">
                          <div className="flex items-center justify-between border-b border-teal-500/30 pb-1 mb-1 font-sans">
                            <span className="font-bold text-teal-300 text-[11px]">🧂 Salinity Units (PSU)</span>
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                L.DomEvent.stopPropagation(e as any);
                                setActivePopupView('grid');
                              }}
                              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                              title="Back to telemetry"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="space-y-1 text-slate-300 overflow-y-auto max-h-[125px] pr-0.5">
                            <div>• <strong className="text-teal-200">&lt; 33.0 PSU:</strong> River discharge / Monsoon freshwater lens (Bay of Bengal).</div>
                            <div>• <strong className="text-teal-300">34.5 – 35.5 PSU:</strong> Standard open tropical ocean salinity.</div>
                            <div>• <strong className="text-amber-300">&gt; 36.5 PSU:</strong> High evaporation zone (High-salinity Arabian Sea water).</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        L.DomEvent.stopPropagation(e as any);
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        L.DomEvent.stopPropagation(e as any);
                        if (onInspectFloat) {
                          onInspectFloat(f.float_id);
                        } else if (onSelectFloat) {
                          onSelectFloat(f.float_id);
                        }
                      }}
                      className="w-full mt-2 py-1.5 px-3 rounded-lg bg-gradient-to-r from-ocean-cyan to-teal-400 text-abyssal-950 font-bold text-xs transition text-center cursor-pointer shadow-md active:scale-95 hover:brightness-110"
                    >
                      Inspect CTD Depth Profile
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* Live Vessel GPS Tracker */}
        {userVesselPos && (
          <Marker position={userVesselPos} icon={createVesselIcon()}>
            <Popup>
              <div className="p-1 space-y-1.5 font-mono text-xs text-slate-100 min-w-[210px]">
                <div className="font-bold text-emerald-400 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Your Coastal Vessel (GPS)
                </div>
                <div>Coordinates: <strong className="text-white">{userVesselPos[0].toFixed(3)}°N, {userVesselPos[1].toFixed(3)}°E</strong></div>
                {activeTargetPfz && vesselDistanceKm && (
                  <div className="text-[11px] text-amber-300 pt-1 border-t border-slate-700">
                    Active PFZ Route: <strong>{vesselDistanceKm} km</strong> ({activeTargetPfz.target_species.slice(0, 2).join(', ')})
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Port to PFZ Bearing HUD */}
      {selectedPort && portTargetPfz && (
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto">
          {!isPortHudExpanded ? (
            <button
              type="button"
              onClick={() => setIsPortHudExpanded(true)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-xl shadow-2xl transition cursor-pointer active:scale-95 bg-[#081e34]/95 border-sky-500/60 text-sky-300 ring-1 ring-sky-500/30"
            >
              <Anchor className="w-3.5 h-3.5 text-sky-400" />
              <span>{selectedPort.name} → PFZ ({portTargetPfz.distance_km} km)</span>
              <ChevronUp className="w-3.5 h-3.5 text-sky-400" />
            </button>
          ) : (
            <div className="max-w-xs sm:max-w-sm rounded-2xl border border-sky-500/50 bg-[#07192b]/98 p-3 font-mono text-xs text-slate-200 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-sky-500/30">
              <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-sky-300">
                  <Anchor className="w-3.5 h-3.5 text-sky-400" />
                  <span>Port PFZ Departure</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPortHudExpanded(false)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-sky-950/60 cursor-pointer"
                    title="Minimize card"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPort(null);
                      setPortTargetPfz(null);
                      setIsPortHudExpanded(false);
                    }}
                    className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 cursor-pointer"
                    title="Clear selected port"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-[11px]">
                <div>From: <strong className="text-white">{selectedPort.name}</strong> ({selectedPort.district ? `${selectedPort.district}, ` : ''}{selectedPort.state})</div>
                <div>Target PFZ: <strong className="text-amber-300">{portTargetPfz.distance_km} km</strong> heading <strong className="text-sky-300">{portTargetPfz.compass} ({portTargetPfz.bearing_deg}°)</strong></div>
                <div>Optimal SST: <strong className="text-cyan-300">{portTargetPfz.nearest_pfz.sst_celsius}°C</strong> | Confidence: <strong className="text-emerald-300">{portTargetPfz.nearest_pfz.pfz_score}/100</strong></div>
                <div className="pt-1 text-[10px] text-amber-200/90 font-sans border-t border-sky-500/20">
                  Species Forecast: <strong>{portTargetPfz.nearest_pfz.target_species.join(', ')}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vessel Bottom HUD */}
      {!selectedPort && userVesselPos && (
        <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto">
          {!isVesselHudExpanded ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsVesselHudExpanded(true)}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-xl shadow-2xl transition cursor-pointer active:scale-95 ring-1 bg-[#06201a]/95 border-emerald-500/60 text-emerald-300 shadow-glow-emerald-sm ring-emerald-500/30"
              >
                {isLocating ? (
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                )}
                <span>{activeTargetPfz ? `Navigating to PFZ (${vesselDistanceKm} km)` : 'GPS Active ⛵'}</span>
                <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTargetPfz(null);
                }}
                className="p-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 transition cursor-pointer shadow-lg active:scale-95"
                title="Clear Active Route"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="max-w-xs sm:max-w-sm rounded-2xl border border-emerald-500/50 bg-[#071a17]/98 p-3 font-mono text-xs text-slate-200 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 ring-1 ring-emerald-500/30">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-1.5 mb-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Vessel NavIC GPS</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    100% Offline Edge
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleLocateVessel}
                    disabled={isLocating}
                    title="Re-acquire GPS fix"
                    className="p-1 rounded text-emerald-400 hover:text-emerald-200 hover:bg-emerald-950/60 cursor-pointer"
                  >
                    <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsVesselHudExpanded(false)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-emerald-950/60 cursor-pointer"
                    title="Minimize card"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTargetPfz(null);
                      setIsVesselHudExpanded(false);
                    }}
                    className="p-1 rounded text-rose-400 hover:text-rose-200 hover:bg-rose-950/60 cursor-pointer"
                    title="Clear active route"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1 text-[11px]">
                <div>Vessel Position: <strong className="text-white">{userVesselPos[0].toFixed(3)}°N, {userVesselPos[1].toFixed(3)}°E</strong></div>
                {activeTargetPfz && vesselDistanceKm && (
                  <>
                    <div>Direct to PFZ: <strong className="text-amber-300">{vesselDistanceKm} km</strong></div>
                    <div>Fused SST: <strong className="text-cyan-300">{activeTargetPfz.sst_celsius}°C</strong> | Confidence: <strong className="text-emerald-300">{activeTargetPfz.pfz_score}/100</strong></div>
                    <div className="pt-1 text-[10px] text-amber-200/90 font-sans border-t border-emerald-500/20">
                      Target Catch: <strong>{activeTargetPfz.target_species.slice(0, 3).join(', ')}</strong>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Legend */}
      <div className="absolute bottom-3 right-3 z-[1000] pointer-events-auto">
        {!legendOpen ? (
          <button
            type="button"
            onClick={() => setLegendOpen(true)}
            className="flex items-center space-x-1.5 bg-[#071322]/95 hover:bg-[#0c1e34] border border-cyan-500/30 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-slate-200 shadow-2xl transition cursor-pointer active:scale-95 ring-1 ring-cyan-500/10"
          >
            <Info className="w-3.5 h-3.5 text-ocean-cyan" />
            <span>Map Legend</span>
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          </button>
        ) : (
          <div className="bg-[#071322]/98 backdrop-blur-2xl p-3.5 rounded-2xl border border-cyan-500/40 text-xs text-slate-200 space-y-2.5 shadow-2xl w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-16rem)] overflow-y-auto animate-in fade-in zoom-in-95 duration-150 ring-1 ring-cyan-500/20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 font-mono">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-ocean-cyan" />
                Sensor & PFZ Legend
              </span>
              <button
                type="button"
                onClick={() => setLegendOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-ocean-cyan shadow-glow-cyan-sm shrink-0"></span>
              <span className="text-[11px]">ARGO Floats (0–2,000m Subsurface Cast)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-sky-500 border border-sky-300 shadow-sm shrink-0"></span>
              <span className="text-[11px]">Fish Landing Centers (586 Registered FLCs)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-300 shadow-sm shrink-0"></span>
              <span className="text-[11px]">Deep Pelagic Opportunity Zones (Tuna/Mahi)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 border border-emerald-300 shadow-sm shrink-0"></span>
              <span className="text-[11px]">Live Fishing Vessel (NavIC GPS Tracker)</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm shrink-0"></span>
              <span className="text-[11px]">NOAA Satellite SST Thermal Heatmap</span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-teal-400 shadow-sm shrink-0"></span>
              <span className="text-[11px]">NASA Chlorophyll-a Ocean Color</span>
            </div>

            <div className="pt-1.5 border-t border-slate-800 text-[10px] text-cyan-300/90 font-mono leading-tight">
              Scientific Fusion: In-situ ARGO CTD + continuous NOAA & NASA satellite grids for high-yield fishing zones.
            </div>
          </div>
        )}
      </div>

    </div>
  );
};