/**
 * Polar Operations State Action Dispatcher
 * Synchronizes client state actions across HTTP REST and Serverless invocations.
 */

import { databaseManager } from './database';
import { PolarSystemState } from '../types';

export function handleClientAction(action: string, payload: any): PolarSystemState {
  return databaseManager.updateState((systemState) => {
    switch (action) {
      case 'UPDATE_REGION':
        systemState.region = payload;
        break;

      case 'UPDATE_CONDITION':
        systemState.conditionLevel = payload;
        break;

      case 'UPDATE_ASSET':
        systemState.assets = systemState.assets.map((a) => (a.id === payload.id ? payload : a));
        break;

      case 'ADD_ASSET':
        systemState.assets = [payload, ...systemState.assets];
        break;

      case 'UPDATE_EXPEDITION':
        systemState.expeditions = systemState.expeditions.map((e) => (e.id === payload.id ? payload : e));
        break;

      case 'ADD_EXPEDITION':
        systemState.expeditions = [payload, ...systemState.expeditions];
        break;

      case 'ADD_PERSONNEL':
        if (payload?.id && payload?.name) {
          systemState.personnel = [payload, ...(systemState.personnel || [])];
        }
        break;

      case 'ADD_STATION':
        systemState.stations = [payload, ...(systemState.stations || [])];
        break;

      case 'UPDATE_STATIONS':
        systemState.stations = payload;
        break;

      case 'ADD_WAYPOINT': {
        const { waypoint, expeditionId } = payload || {};
        const wp = waypoint || payload;
        if (expeditionId) {
          systemState.expeditions = systemState.expeditions.map((e) => {
            if (e.id !== expeditionId) return e;
            return {
              ...e,
              waypoints: [...(e.waypoints || []), wp],
            };
          });
        }
        if (Array.isArray(systemState.customWaypoints)) {
          systemState.customWaypoints.push(wp);
        } else {
          systemState.customWaypoints = [wp];
        }
        break;
      }

      case 'UPDATE_WAYPOINTS':
        systemState.customWaypoints = payload;
        break;

      case 'CLEAR_WAYPOINTS':
        systemState.customWaypoints = [];
        break;

      case 'UPDATE_POLARIS_DB':
        if (payload && typeof payload === 'object') {
          systemState.polarisDb = {
            ...systemState.polarisDb,
            ...payload,
          };
        }
        break;

      case 'TRIGGER_DISTRESS':
        systemState.activeDistress = payload;
        systemState.conditionLevel = 'COND-1_SEVERE_BLIZZARD';
        break;

      case 'ACKNOWLEDGE_DISTRESS':
        systemState.activeDistress = payload;
        break;

      case 'RESOLVE_DISTRESS':
        systemState.activeDistress = null;
        systemState.conditionLevel = 'COND-2_CAUTION';
        break;

      case 'RESET_ALL':
        databaseManager.resetToDefaults();
        break;

      default:
        break;
    }
  });
}
