/**
 * POST /api/ai/sar/dispatch-crevasse-fall
 * Simulates crevasse fall incident and triggers immediate autonomous SAR response
 */

import {
  handleCors,
  parseJsonBody,
  sendSuccess,
  sendError,
  authenticateServerlessRequest,
} from '../../../src/server/serverlessHandler';
import { executeAutonomousSAR } from '../../../src/server/sarService';
import { ActiveDistressAlert } from '../../../src/types';

export default async function handler(req: any, res: any) {
  if (handleCors(req, res, { allowedMethods: ['POST', 'OPTIONS'] })) {
    return;
  }

  if (req.method !== 'POST') {
    return sendError(res, 'Method Not Allowed', 405, 'METHOD_NOT_ALLOWED');
  }

  const user = authenticateServerlessRequest(req, res);
  if (!user) return;

  try {
    const body = await parseJsonBody(req);
    const {
      incidentType = 'CREVASSE FALL - SCIENTIST TRAPPED AT -22M',
      personnelName = 'Dr. Elena Rostova',
      callsign = 'POLAR-RECON-3',
      coordinates = '-71.420, 12.280',
      depthMeters = 22,
      targetLat = -71.42,
      targetLng = 12.28,
    } = body || {};

    const distress: ActiveDistressAlert = {
      id: `DIST-CRV-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      incidentType,
      location: 'Crevasse Shear Zone Alpha-4',
      coordinates,
      summary: `MAYDAY: Trapped in blind transverse crevasse (depth ~${depthMeters}m). Harness jammed on ice shelf. Ambient -48°C. Immediate thermal winch extraction required! (${personnelName})`,
      reporterCallsign: callsign,
      reportedByDevice: 'Crawler Console',
      active: true,
      acknowledgedByHQ: false,
      targetLat,
      targetLng,
    };

    const result = executeAutonomousSAR(distress);

    sendSuccess(res, {
      distress: result,
      autonomousDispatch: result.autonomousSAR,
      message: `Zero-Click Autonomous SAR Dispatched for ${personnelName} (Crevasse Fall -${depthMeters}m)`,
    });
  } catch (err: any) {
    sendError(res, err.message || 'Crevasse fall dispatch failure.', 500, 'SAR_ERROR');
  }
}
