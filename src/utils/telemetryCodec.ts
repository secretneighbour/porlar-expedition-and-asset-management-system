/**
 * POLARIS — Compact Telemetry Serialization Codec (Polar Compact Frame v1)
 * Optimized for extreme sub-zero SATCOM bandwidth (Iridium SBD 340-byte constraints).
 * Transparently interoperates with standard JSON with zero breaking changes.
 */

export interface TelemetryFrame {
  type: 'HEARTBEAT' | 'GPS_PING' | 'WEATHER_READING' | 'DISTRESS_PING';
  deviceId: string;
  lat: number;
  lng: number;
  altMeters?: number;
  batteryPct?: number;
  tempCelsius?: number;
  windSpeedKts?: number;
  rssi?: number;
  timestamp: number;
}

export const POLAR_MAGIC = [0x50, 0x4f, 0x4c, 0x01]; // 'P', 'O', 'L', v1

const TYPE_TO_BYTE: Record<TelemetryFrame['type'], number> = {
  HEARTBEAT: 0x01,
  GPS_PING: 0x02,
  WEATHER_READING: 0x03,
  DISTRESS_PING: 0x04,
};

const BYTE_TO_TYPE: Record<number, TelemetryFrame['type']> = {
  0x01: 'HEARTBEAT',
  0x02: 'GPS_PING',
  0x03: 'WEATHER_READING',
  0x04: 'DISTRESS_PING',
};

/**
 * Encodes a TelemetryFrame into a compact binary buffer.
 * Coordinates are packed as 32-bit signed fixed-point integers (1e5 factor, ~1m resolution).
 */
export function encodeCompactTelemetry(frame: TelemetryFrame): Uint8Array {
  const deviceIdBytes = new TextEncoder().encode(frame.deviceId.slice(0, 32));
  const idLen = deviceIdBytes.length;

  // Header: 4 magic + 1 type + 1 idLen + idBytes + 4 lat + 4 lng + 2 alt + 1 batt + 2 temp + 1 wind + 1 rssi + 8 timestamp
  const totalLength = 4 + 1 + 1 + idLen + 4 + 4 + 2 + 1 + 2 + 1 + 1 + 8;
  const buffer = new ArrayBuffer(totalLength);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. Magic bytes & Version
  bytes.set(POLAR_MAGIC, 0);

  // 2. Message Type
  const typeByte = TYPE_TO_BYTE[frame.type] || 0x01;
  view.setUint8(4, typeByte);

  // 3. Device ID
  view.setUint8(5, idLen);
  bytes.set(deviceIdBytes, 6);

  let offset = 6 + idLen;

  // 4. Coordinates (Fixed-point: val * 100,000)
  const latFixed = Math.round(Math.max(-90, Math.min(90, frame.lat)) * 100000);
  const lngFixed = Math.round(Math.max(-180, Math.min(180, frame.lng)) * 100000);
  view.setInt32(offset, latFixed, false);
  view.setInt32(offset + 4, lngFixed, false);
  offset += 8;

  // 5. Altitude (-500m to 10000m)
  const alt = Math.round(Math.max(-500, Math.min(10000, frame.altMeters ?? 0)));
  view.setInt16(offset, alt, false);
  offset += 2;

  // 6. Battery % (0 to 100)
  const batt = Math.max(0, Math.min(100, Math.round(frame.batteryPct ?? 100)));
  view.setUint8(offset, batt);
  offset += 1;

  // 7. Temperature (Fixed point: celsius * 10, e.g. -54.2°C -> -542)
  const temp = Math.round(Math.max(-100, Math.min(60, frame.tempCelsius ?? 0)) * 10);
  view.setInt16(offset, temp, false);
  offset += 2;

  // 8. Wind speed (0 to 200 kts)
  const wind = Math.max(0, Math.min(200, Math.round(frame.windSpeedKts ?? 0)));
  view.setUint8(offset, wind);
  offset += 1;

  // 9. RSSI (-128 to 0 dBm)
  const rssi = Math.max(-128, Math.min(0, Math.round(frame.rssi ?? -70)));
  view.setInt8(offset, rssi);
  offset += 1;

  // 10. Timestamp (64-bit BigInt / millis)
  view.setBigUint64(offset, BigInt(frame.timestamp || Date.now()), false);

  return bytes;
}

/**
 * Decodes either a compact binary frame or standard JSON payload transparently.
 */
export function decodeCompactTelemetry(input: Uint8Array | ArrayBuffer | string): TelemetryFrame | null {
  try {
    if (typeof input === 'string') {
      const parsed = JSON.parse(input);
      if (parsed && parsed.deviceId && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed as TelemetryFrame;
      }
      return null;
    }

    const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
    if (bytes.length < 29) return null; // Minimum possible frame length

    // Check magic bytes
    if (
      bytes[0] !== POLAR_MAGIC[0] ||
      bytes[1] !== POLAR_MAGIC[1] ||
      bytes[2] !== POLAR_MAGIC[2] ||
      bytes[3] !== POLAR_MAGIC[3]
    ) {
      // Attempt JSON fallback on binary buffer
      const text = new TextDecoder().decode(bytes);
      if (text.startsWith('{')) {
        return JSON.parse(text);
      }
      return null;
    }

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const typeByte = view.getUint8(4);
    const type = BYTE_TO_TYPE[typeByte] || 'HEARTBEAT';

    const idLen = view.getUint8(5);
    if (bytes.length < 6 + idLen + 23) return null;

    const deviceId = new TextDecoder().decode(bytes.subarray(6, 6 + idLen));
    let offset = 6 + idLen;

    const lat = view.getInt32(offset, false) / 100000;
    const lng = view.getInt32(offset + 4, false) / 100000;
    offset += 8;

    const altMeters = view.getInt16(offset, false);
    offset += 2;

    const batteryPct = view.getUint8(offset);
    offset += 1;

    const tempCelsius = view.getInt16(offset, false) / 10;
    offset += 2;

    const windSpeedKts = view.getUint8(offset);
    offset += 1;

    const rssi = view.getInt8(offset);
    offset += 1;

    const timestamp = Number(view.getBigUint64(offset, false));

    return {
      type,
      deviceId,
      lat,
      lng,
      altMeters,
      batteryPct,
      tempCelsius,
      windSpeedKts,
      rssi,
      timestamp,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Measures size comparison between JSON string and Polar Compact Binary representation.
 */
export function compareTelemetrySizes(frame: TelemetryFrame): {
  jsonBytes: number;
  compactBytes: number;
  savingsBytes: number;
  savingsPercent: number;
} {
  const jsonStr = JSON.stringify(frame);
  const jsonBytes = new TextEncoder().encode(jsonStr).length;
  const compact = encodeCompactTelemetry(frame);
  const compactBytes = compact.length;
  const savingsBytes = jsonBytes - compactBytes;
  const savingsPercent = (savingsBytes / jsonBytes) * 100;

  return {
    jsonBytes,
    compactBytes,
    savingsBytes,
    savingsPercent,
  };
}
