import {
  INITIAL_ASSETS,
  INITIAL_EXPEDITIONS,
  INITIAL_SUPPLIES,
  INITIAL_DISPATCH_LOGS,
  INITIAL_STATIONS,
} from '../src/data/polarData';
import {
  INITIAL_EXPEDITIONS as INITIAL_POLARIS_EXPEDITIONS,
  INITIAL_PERSONNEL,
  INITIAL_ASSETS as INITIAL_POLARIS_ASSETS,
  INITIAL_INVENTORY,
  INITIAL_SHIPMENTS,
  INITIAL_TRANSPORTATION,
  INITIAL_MAINTENANCE,
  INITIAL_TASKS,
  buildAlerts,
  INITIAL_EXPENSES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOG,
  INITIAL_COMPLETED_WORK_LOGS,
} from '../src/data/polarisData';

export default function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  return res.end(
    JSON.stringify({
      region: 'antarctica',
      conditionLevel: 'COND-2_CAUTION',
      assets: INITIAL_ASSETS,
      expeditions: INITIAL_EXPEDITIONS,
      supplies: INITIAL_SUPPLIES,
      dispatchLogs: INITIAL_DISPATCH_LOGS,
      activeDistress: null,
      personnel: INITIAL_PERSONNEL,
      stations: INITIAL_STATIONS,
      customWaypoints: [],
      polarisDb: {
        expeditions: INITIAL_POLARIS_EXPEDITIONS,
        personnel: INITIAL_PERSONNEL,
        assets: INITIAL_POLARIS_ASSETS,
        inventory: INITIAL_INVENTORY,
        shipments: INITIAL_SHIPMENTS,
        transportation: INITIAL_TRANSPORTATION,
        maintenance: INITIAL_MAINTENANCE,
        tasks: INITIAL_TASKS,
        alerts: buildAlerts(),
        expenses: INITIAL_EXPENSES,
        users: INITIAL_USERS,
        auditLog: INITIAL_AUDIT_LOG,
        completedWorkLogs: INITIAL_COMPLETED_WORK_LOGS,
      },
      lastUpdated: new Date().toISOString(),
    })
  );
}
