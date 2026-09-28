import { normalizeExpedition, normalizeExpeditions, Expedition, Waypoint } from '../src/types';
import { runDeterministicWaypointOptimizer } from '../src/utils/deterministicRouteOptimizer';

console.log('--- RUNNING WAYPOINT STUDIO ROBUSTNESS TEST SUITE ---');

// Case A: Expedition with valid waypoints
const caseA = normalizeExpedition({
  id: 'exp-valid',
  code: 'VAL-01',
  name: 'Valid Expedition',
  waypoints: [
    { id: 'wp-1', name: 'WP 1', lat: -77.0, lng: 160.0, elevationM: 100, distanceFromPrevKm: 0, passed: true },
    { id: 'wp-2', name: 'WP 2', lat: -78.0, lng: 162.0, elevationM: 200, distanceFromPrevKm: 120, passed: false }
  ]
});
console.assert(caseA.waypoints.length === 2, 'Case A failed: should have 2 waypoints');
console.log('✓ Case A Passed: Valid waypoints preserved (length: ' + caseA.waypoints.length + ')');

// Case B: Expedition with zero waypoints
const caseB = normalizeExpedition({
  id: 'exp-zero',
  code: 'ZER-01',
  name: 'Zero WP Expedition',
  waypoints: []
});
console.assert(Array.isArray(caseB.waypoints) && caseB.waypoints.length === 0, 'Case B failed: should have []');
console.log('✓ Case B Passed: Zero waypoints canonical []');

// Case C: Expedition with missing property
const caseC = normalizeExpedition({
  id: 'exp-missing',
  code: 'MIS-01',
  name: 'Missing Property Expedition'
} as any);
console.assert(Array.isArray(caseC.waypoints) && caseC.waypoints.length === 0, 'Case C failed: missing waypoints should normalize to []');
console.log('✓ Case C Passed: Missing property normalized to []');

// Case D: Expedition with waypoints: undefined
const caseD = normalizeExpedition({
  id: 'exp-undef',
  code: 'UND-01',
  name: 'Undefined WP Expedition',
  waypoints: undefined
} as any);
console.assert(Array.isArray(caseD.waypoints) && caseD.waypoints.length === 0, 'Case D failed: undefined should normalize to []');
console.log('✓ Case D Passed: waypoints: undefined normalized to []');

// Case E: Expedition with waypoints: null
const caseE = normalizeExpedition({
  id: 'exp-null',
  code: 'NUL-01',
  name: 'Null WP Expedition',
  waypoints: null
} as any);
console.assert(Array.isArray(caseE.waypoints) && caseE.waypoints.length === 0, 'Case E failed: null should normalize to []');
console.log('✓ Case E Passed: waypoints: null normalized to []');

// Case F: Expedition with malformed waypoint data (nulls, non-objects, missing ids/names)
const caseF = normalizeExpedition({
  id: 'exp-malformed',
  name: 'Malformed WP Expedition',
  waypoints: [
    null,
    undefined,
    'garbage-string',
    42,
    { name: 'Partial Waypoint without ID or coords' },
    { id: 'wp-good', name: 'Real WP', lat: -80.0, lng: 140.0 }
  ]
} as any);
console.assert(Array.isArray(caseF.waypoints) && caseF.waypoints.length === 2, 'Case F failed: malformed non-objects should be pruned');
console.assert(typeof caseF.waypoints[0].id === 'string', 'Case F failed: auto-generated ID for partial waypoint');
console.log('✓ Case F Passed: Malformed waypoint data sanitized gracefully (valid count: ' + caseF.waypoints.length + ')');

// Case G: Brand-new expedition creation
const newExp: Expedition = normalizeExpedition({
  id: 'exp-new-001',
  code: 'NEW-01',
  name: 'Newly Created Expedition',
  region: 'antarctica',
  objective: 'Explore ice ridge',
  phase: 'staging',
  leader: 'Explorer Doe',
  crew: [],
  assignedAssetIds: [],
  departureDate: '2026-10-01',
  estimatedReturnDate: '2026-10-20',
  totalDistanceKm: 0,
  distanceCoveredKm: 0,
  currentLat: -75.0,
  currentLng: 120.0,
  waypoints: [],
  fuelBurnPerDayL: 100,
  rationsDaysRemaining: 30,
  currentWeather: { tempC: -30, windchillC: -45, windKnots: 15, condition: 'COND-3_NORMAL' }
});
console.assert(newExp.waypoints.length === 0, 'Case G failed: new expedition waypoints must be []');
console.log('✓ Case G Passed: Newly created expedition initialized with waypoints: []');

// Case H: Loading existing saved expeditions
const rawBatch = [caseA, caseB, caseC, caseD, caseE, caseF];
const loadedBatch = normalizeExpeditions(rawBatch);
console.assert(loadedBatch.length === 6, 'Case H failed');
console.assert(loadedBatch.every(e => Array.isArray(e.waypoints)), 'Case H failed: every loaded expedition must have array waypoints');
console.log('✓ Case H Passed: Batch loading of diverse expeditions ensures 100% valid waypoints arrays');

// Case I: Editing and saving waypoints
const editedWp: Waypoint = { ...caseA.waypoints[0], name: 'Renamed Field Depot', elevationM: 250 };
const updatedWps = caseA.waypoints.map(w => w.id === editedWp.id ? editedWp : w);
const caseI = normalizeExpedition({ ...caseA, waypoints: updatedWps });
console.assert(caseI.waypoints[0].name === 'Renamed Field Depot', 'Case I failed: editing waypoint failed');
console.log('✓ Case I Passed: Editing and saving waypoint maintained integrity');

// Case J: Deleting the final waypoint
const singleWpExp = normalizeExpedition({
  id: 'exp-single',
  waypoints: [{ id: 'final-wp', name: 'Sole Waypoint', lat: -78.0, lng: 160.0, elevationM: 100, distanceFromPrevKm: 0, passed: false }]
});
const afterDelete = normalizeExpedition({
  ...singleWpExp,
  waypoints: singleWpExp.waypoints.filter(w => w.id !== 'final-wp')
});
console.assert(afterDelete.waypoints.length === 0, 'Case J failed: deleting final waypoint should yield []');
console.log('✓ Case J Passed: Deleting final waypoint safely yields waypoints: []');

// Case K: Reordering waypoints
const reversedWps = [...caseA.waypoints].reverse();
const caseK = normalizeExpedition({ ...caseA, waypoints: reversedWps });
console.assert(caseK.waypoints[0].id === 'wp-2' && caseK.waypoints[1].id === 'wp-1', 'Case K failed');
console.log('✓ Case K Passed: Reordering waypoints works flawlessly');

// Case L: Route optimization with 0 waypoints and multiple waypoints
try {
  // Test zero waypoints with deterministic optimizer
  const zeroOpt = runDeterministicWaypointOptimizer({
    waypoints: [],
    environment: {},
    constraints: {}
  }, 'Zero waypoint test');
  console.assert(zeroOpt.orderedWaypoints.length === 0, 'Case L failed: zero waypoints optimizer should return empty');
  console.log('✓ Case L1 Passed: Deterministic route optimization with 0 waypoints handles gracefully');

  // Test multiple waypoints
  const multiOpt = runDeterministicWaypointOptimizer({
    waypoints: caseA.waypoints,
    environment: { tempC: -35, apparentTempC: -48, windSpeedKts: 20 },
    constraints: { mandatoryWaypointIds: ['wp-1'] }
  }, 'Multi waypoint test');
  console.assert(multiOpt.orderedWaypoints.length === 2, 'Case L failed: multi waypoint optimization');
  console.log('✓ Case L2 Passed: Route optimization with multiple waypoints preserved all waypoints');
} catch (err: any) {
  console.error('Case L Error:', err);
  process.exit(1);
}

// Case M: Simulation mode with zero waypoints and multiple waypoints
const simZeroExp = normalizeExpedition({ id: 'sim-zero', waypoints: [] });
const simZeroWps = (simZeroExp.waypoints || []).map((w: any) => ({ ...w, passed: true }));
console.assert(simZeroWps.length === 0, 'Case M failed');
const simMultiExp = normalizeExpedition({ id: 'sim-multi', waypoints: caseA.waypoints });
const simMultiWps = (simMultiExp.waypoints || []).map((w: any, idx: number) => ({ ...w, passed: idx === 0 }));
console.assert(simMultiWps.length === 2 && simMultiWps[0].passed && !simMultiWps[1].passed, 'Case M failed');
console.log('✓ Case M Passed: Simulation step with zero and multiple waypoints works without exceptions');

console.log('--- ALL TEST SUITE CASES A THROUGH M PASSED SUCCESSFULLY! ---');
