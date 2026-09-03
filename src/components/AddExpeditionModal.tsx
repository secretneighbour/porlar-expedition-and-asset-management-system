import React, { useState } from 'react';
import { Navigation, X, Plus, Users, Calendar, MapPin } from 'lucide-react';
import { Expedition, PolarRegion, Waypoint } from '../types';

interface AddExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpedition: (newExp: Expedition) => void;
  defaultRegion: PolarRegion;
}

export const AddExpeditionModal: React.FC<AddExpeditionModalProps> = ({
  isOpen,
  onClose,
  onAddExpedition,
  defaultRegion,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [region, setRegion] = useState<PolarRegion>(defaultRegion);
  const [leader, setLeader] = useState('');
  const [objective, setObjective] = useState('');
  const [totalDistanceKm, setTotalDistanceKm] = useState(850);
  const [rationsDays, setRationsDays] = useState(30);
  const [fuelBurnL, setFuelBurnL] = useState(250);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !leader) return;

    // Build realistic default waypoints based on region
    const defaultWaypoints: Waypoint[] = region === 'antarctica'
      ? [
          { id: `wp-${Date.now()}-1`, name: 'Base Gate Departure', lat: -78.0, lng: 166.0, elevationM: 50, passed: true, distanceFromPrevKm: 0 },
          { id: `wp-${Date.now()}-2`, name: 'Trans-Antarctic Foot Slopes', lat: -81.0, lng: 160.0, elevationM: 800, passed: false, distanceFromPrevKm: 330, hazardNote: 'Sastrugi dunes up to 2.5m' },
          { id: `wp-${Date.now()}-3`, name: 'Polar Plateau Coring Site', lat: -85.0, lng: 140.0, elevationM: 2400, passed: false, distanceFromPrevKm: 520 },
        ]
      : [
          { id: `wp-${Date.now()}-1`, name: 'Fjord Harbor Staging', lat: 78.9, lng: 11.9, elevationM: 10, passed: true, distanceFromPrevKm: 0 },
          { id: `wp-${Date.now()}-2`, name: 'Marginal Pack Ice Edge', lat: 80.5, lng: 13.5, elevationM: 2, passed: false, distanceFromPrevKm: 280, hazardNote: 'Sea ice lead shearing' },
        ];

    const newExp: Expedition = {
      id: `exp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      region,
      objective: objective.trim() || 'Scientific ice sheet survey and autonomous sensor deployment.',
      phase: 'staging',
      leader: leader.trim(),
      crew: [
        { id: `c-${Date.now()}-1`, name: leader.trim(), role: 'Traverse Leader', callsign: `${code.split('-')[0] || 'Lead'}`, experienceSeasons: 6, medicalClearance: 'Class-1 Unrestricted' },
        { id: `c-${Date.now()}-2`, name: 'Field Operator Specialist', role: 'Heavy Mechanic', callsign: 'Tech-1', experienceSeasons: 4, medicalClearance: 'Class-1 Unrestricted' },
      ],
      assignedAssetIds: [],
      departureDate: new Date().toISOString().split('T')[0],
      estimatedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      totalDistanceKm: Number(totalDistanceKm),
      distanceCoveredKm: 0,
      currentLat: region === 'antarctica' ? -78.0 : 78.9,
      currentLng: region === 'antarctica' ? 166.0 : 11.9,
      waypoints: defaultWaypoints,
      fuelBurnPerDayL: Number(fuelBurnL),
      rationsDaysRemaining: Number(rationsDays),
      currentWeather: {
        tempC: -36,
        windchillC: -48,
        windKnots: 20,
        condition: 'COND-3_NORMAL',
      },
    };

    onAddExpedition(newExp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-950 border border-slate-700 rounded-xl max-w-xl w-full p-5 shadow-2xl text-xs font-mono text-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white font-display uppercase tracking-wider">
              PLAN & LAUNCH POLAR EXPEDITION TRAVERSE
            </h2>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">MISSION CODE:</label>
              <input
                type="text"
                required
                placeholder="e.g. EXP-801"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">THEATER / REGION:</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as PolarRegion)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="antarctica">Antarctica (South)</option>
                <option value="arctic">Arctic High Latitude (North)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">TRAVERSE LEADER:</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Sean Ross"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 uppercase text-[10px] mb-1">EXPEDITION TITLE:</label>
            <input
              type="text"
              required
              placeholder="e.g. Byrd Glacier Deep Firn Penetration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 uppercase text-[10px] mb-1">SCIENTIFIC / LOGISTICAL OBJECTIVE:</label>
            <textarea
              rows={2}
              required
              placeholder="Detail mission scope, core extraction depth, or resupply payload..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">TOTAL DISTANCE (KM):</label>
              <input
                type="number"
                min="50"
                max="5000"
                value={totalDistanceKm}
                onChange={(e) => setTotalDistanceKm(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">RATIONS ENDURANCE (DAYS):</label>
              <input
                type="number"
                min="5"
                max="120"
                value={rationsDays}
                onChange={(e) => setRationsDays(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 uppercase text-[10px] mb-1">EST. FUEL BURN (L/24H):</label>
              <input
                type="number"
                min="20"
                max="2000"
                value={fuelBurnL}
                onChange={(e) => setFuelBurnL(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors flex items-center gap-1.5 border border-indigo-400/40"
            >
              <Plus className="w-4 h-4" />
              <span>COMMENCE MISSION STAGING</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
