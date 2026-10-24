import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import {
  Mountain,
  Layers,
  RotateCcw,
  Compass,
  Eye,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ShieldAlert,
  Radio,
  Building2,
  Crosshair,
  SunMedium,
  Sliders,
  AlertTriangle
} from 'lucide-react';
import { ResearchStation, Expedition, ActiveDistressAlert, PolarRegion } from '../types';
import { generateElevationGrid, getPolarElevationMeters, POLAR_GEODETIC_LANDMARKS } from '../utils/polarElevationData';

interface PolarTerrain3DViewProps {
  region: PolarRegion;
  stations: ResearchStation[];
  expeditions: Expedition[];
  activeDistress?: ActiveDistressAlert | null;
  focusCoords?: { lat: number; lng: number } | null;
  onExit3DView: (coords?: { lat: number; lng: number }) => void;
  onSelectStation?: (station: ResearchStation) => void;
}

export const PolarTerrain3DView: React.FC<PolarTerrain3DViewProps> = ({
  region,
  stations,
  expeditions,
  activeDistress,
  focusCoords,
  onExit3DView,
  onSelectStation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sector Center Coordinates (default to active distress or McMurdo / South Pole)
  const [centerLat, setCenterLat] = useState<number>(() => {
    if (activeDistress?.targetLat) return activeDistress.targetLat;
    if (focusCoords?.lat) return focusCoords.lat;
    return region === 'antarctica' ? -85.25 : 78.92;
  });

  const [centerLng, setCenterLng] = useState<number>(() => {
    if (activeDistress?.targetLng) return activeDistress.targetLng;
    if (focusCoords?.lng) return focusCoords.lng;
    return region === 'antarctica' ? 151.10 : 11.92;
  });

  // Camera State (Spherical coordinates)
  const [cameraDistance, setCameraDistance] = useState<number>(140); // km
  const [cameraPitch, setCameraPitch] = useState<number>(0.65); // Radians from horizontal
  const [cameraYaw, setCameraYaw] = useState<number>(-0.8);   // Radians around Z
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);

  // Terrain Controls
  const [exaggeration, setExaggeration] = useState<number>(2.5); // Vertical scale multiplier
  const [wireframeMode, setWireframeMode] = useState<boolean>(false);
  const [sunAngle, setSunAngle] = useState<number>(45); // Degrees
  const [webGlSupported, setWebGlSupported] = useState<boolean>(true);
  const [webGlError, setWebGlError] = useState<string | null>(null);

  // Drag Interaction State
  const isDraggingRef = useRef<boolean>(false);
  const dragButtonRef = useRef<number>(0);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate 3D Elevation Mesh Data for current center sector
  const terrainData = useMemo(() => {
    return generateElevationGrid(centerLat, centerLng, 41, 120); // 41x41 grid over 120km span
  }, [centerLat, centerLng]);

  // Center elevation stats
  const centerElevInfo = useMemo(() => {
    return getPolarElevationMeters(centerLat, centerLng);
  }, [centerLat, centerLng]);

  // Matrix Math Helpers
  const mat4 = useMemo(() => ({
    create: () => new Float32Array(16),
    perspective: (out: Float32Array, fovy: number, aspect: number, near: number, far: number) => {
      const f = 1.0 / Math.tan(fovy / 2);
      const nf = 1 / (near - far);
      out.fill(0);
      out[0] = f / aspect;
      out[5] = f;
      out[10] = (far + near) * nf;
      out[11] = -1;
      out[14] = (2 * far * near) * nf;
      return out;
    },
    lookAt: (out: Float32Array, eye: number[], center: number[], up: number[]) => {
      let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
      let eyex = eye[0], eyey = eye[1], eyez = eye[2];
      let upx = up[0], upy = up[1], upz = up[2];
      let centerx = center[0], centery = center[1], centerz = center[2];

      z0 = eyex - centerx;
      z1 = eyey - centery;
      z2 = eyez - centerz;
      len = 1 / Math.hypot(z0, z1, z2);
      z0 *= len; z1 *= len; z2 *= len;

      x0 = upy * z2 - upz * z1;
      x1 = upz * z0 - upx * z2;
      x2 = upx * z1 - upy * z0;
      len = Math.hypot(x0, x1, x2);
      if (!len) {
        x0 = 0; x1 = 0; x2 = 0;
      } else {
        len = 1 / len;
        x0 *= len; x1 *= len; x2 *= len;
      }

      y0 = z1 * x2 - z2 * x1;
      y1 = z2 * x0 - z0 * x2;
      y2 = z0 * x1 - z1 * x0;
      len = Math.hypot(y0, y1, y2);
      if (!len) {
        y0 = 0; y1 = 0; y2 = 0;
      } else {
        len = 1 / len;
        y0 *= len; y1 *= len; y2 *= len;
      }

      out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
      out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
      out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
      out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
      out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
      out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
      out[15] = 1;
      return out;
    }
  }), []);

  // WebGL Render Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (canvas.getContext('webgl2') || canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) {
      setWebGlSupported(false);
      setWebGlError('WebGL 3D hardware acceleration is not supported on this browser or terminal device.');
      return;
    }

    // Vertex Shader Source
    const vsSource = `
      attribute vec3 aPosition;
      attribute vec3 aNormal;
      uniform mat4 uProjection;
      uniform mat4 uModelView;
      uniform float uExaggeration;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vElevation;

      void main() {
        vec3 pos = aPosition;
        pos.z = pos.z * uExaggeration;
        vElevation = aPosition.z;
        vNormal = aNormal;
        vPosition = pos;
        gl_Position = uProjection * uModelView * vec4(pos, 1.0);
      }
    `;

    // Fragment Shader Source
    const fsSource = `
      precision mediump float;
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vElevation;
      uniform vec3 uSunDirection;
      uniform bool uWireframe;
      uniform vec4 uWireframeColor;

      void main() {
        if (uWireframe) {
          gl_FragColor = uWireframeColor;
          return;
        }

        vec3 norm = normalize(vNormal);
        vec3 sunDir = normalize(uSunDirection);
        float diff = max(dot(norm, sunDir), 0.20);

        // Hypsometric tinting based on authentic elevation (km)
        // < 0.1km: Ice Shelf / Marine Blue-Cyan
        // 0.1 - 1.2km: Valley Glaciers / Exposed Nunataks (Dark grey/blue)
        // 1.2 - 2.8km: Polar Ice Sheet (Ice cyan-white)
        // > 2.8km: High Mountain Summits / Plateau Perennial Snow (Pure white)
        vec3 baseColor;
        if (vElevation < 0.1) {
          baseColor = mix(vec3(0.08, 0.22, 0.38), vec3(0.25, 0.55, 0.75), clamp(vElevation / 0.1, 0.0, 1.0));
        } else if (vElevation < 1.2) {
          baseColor = mix(vec3(0.25, 0.55, 0.75), vec3(0.48, 0.52, 0.60), clamp((vElevation - 0.1) / 1.1, 0.0, 1.0));
        } else if (vElevation < 2.8) {
          baseColor = mix(vec3(0.48, 0.52, 0.60), vec3(0.85, 0.93, 0.98), clamp((vElevation - 1.2) / 1.6, 0.0, 1.0));
        } else {
          baseColor = mix(vec3(0.85, 0.93, 0.98), vec3(1.0, 1.0, 1.0), clamp((vElevation - 2.8) / 1.5, 0.0, 1.0));
        }

        // Add subtle contour grid stripes every 250m elevation
        float contour = mod(vElevation * 1000.0, 250.0);
        if (contour < 8.0) {
          baseColor *= 0.85;
        }

        vec3 ambient = vec3(0.12, 0.15, 0.24) * baseColor;
        vec3 diffuse = diff * baseColor;
        gl_FragColor = vec4(ambient + diffuse, 1.0);
      }
    `;

    function createShader(type: number, src: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, src);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error('[3D-TERRAIN] Shader compilation error:', gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[3D-TERRAIN] Program linking failed:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    // Buffers
    const vaoPosBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vaoPosBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, terrainData.vertices, gl.STATIC_DRAW);
    const aPositionLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPositionLoc);
    gl.vertexAttribPointer(aPositionLoc, 3, gl.FLOAT, false, 0, 0);

    const vaoNormBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vaoNormBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, terrainData.normals, gl.STATIC_DRAW);
    const aNormalLoc = gl.getAttribLocation(program, 'aNormal');
    gl.enableVertexAttribArray(aNormalLoc);
    gl.vertexAttribPointer(aNormalLoc, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, terrainData.indices, gl.STATIC_DRAW);

    // Uniform Locations
    const uProjLoc = gl.getUniformLocation(program, 'uProjection');
    const uMvLoc = gl.getUniformLocation(program, 'uModelView');
    const uExaggLoc = gl.getUniformLocation(program, 'uExaggeration');
    const uSunLoc = gl.getUniformLocation(program, 'uSunDirection');
    const uWireframeLoc = gl.getUniformLocation(program, 'uWireframe');
    const uWireframeColorLoc = gl.getUniformLocation(program, 'uWireframeColor');

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.04, 0.06, 0.10, 1.0);

    // Animation / Render Frame
    let animId: number;
    const render = () => {
      if (!canvas || !gl) return;
      const width = canvas.clientWidth || 800;
      const height = canvas.clientHeight || 500;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      // Camera Eye Position in Spherical Coordinates
      const eyeX = panX + cameraDistance * Math.cos(cameraPitch) * Math.sin(cameraYaw);
      const eyeY = panY + cameraDistance * Math.cos(cameraPitch) * Math.cos(cameraYaw);
      const eyeZ = Math.max(2.0, (centerElevInfo.elevationM / 1000.0) * exaggeration) + cameraDistance * Math.sin(cameraPitch);

      const targetX = panX;
      const targetY = panY;
      const targetZ = (centerElevInfo.elevationM / 1000.0) * exaggeration;

      const pMatrix = mat4.create();
      mat4.perspective(pMatrix, 45 * (Math.PI / 180), width / height, 0.5, 1000.0);

      const mvMatrix = mat4.create();
      mat4.lookAt(mvMatrix, [eyeX, eyeY, eyeZ], [targetX, targetY, targetZ], [0, 0, 1]);

      gl.uniformMatrix4fv(uProjLoc, false, pMatrix);
      gl.uniformMatrix4fv(uMvLoc, false, mvMatrix);
      gl.uniform1f(uExaggLoc, exaggeration);

      // Sun Lighting Direction Vector
      const sunRad = sunAngle * (Math.PI / 180);
      gl.uniform3f(uSunLoc, Math.cos(sunRad), Math.sin(sunRad), 0.7);

      if (wireframeMode) {
        gl.uniform1i(uWireframeLoc, 1);
        gl.uniform4f(uWireframeColorLoc, 0.22, 0.75, 0.98, 0.85);
        gl.drawElements(gl.LINES, terrainData.indices.length, gl.UNSIGNED_SHORT, 0);
      } else {
        gl.uniform1i(uWireframeLoc, 0);
        gl.drawElements(gl.TRIANGLES, terrainData.indices.length, gl.UNSIGNED_SHORT, 0);

        // Optional wireframe overlay over shaded surface
        gl.enable(gl.POLYGON_OFFSET_FILL);
        gl.polygonOffset(1.0, 1.0);
        gl.uniform1i(uWireframeLoc, 1);
        gl.uniform4f(uWireframeColorLoc, 0.15, 0.25, 0.35, 0.25);
        gl.drawElements(gl.LINES, terrainData.indices.length, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.POLYGON_OFFSET_FILL);
      }
    };

    render();

    // Event Listener for Window Resize
    const onResize = () => render();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      gl.deleteBuffer(vaoPosBuffer);
      gl.deleteBuffer(vaoNormBuffer);
      gl.deleteBuffer(indexBuffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [
    terrainData,
    cameraDistance,
    cameraPitch,
    cameraYaw,
    panX,
    panY,
    exaggeration,
    wireframeMode,
    sunAngle,
    centerElevInfo,
    mat4,
  ]);

  // Mouse Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragButtonRef.current = e.button;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    if (dragButtonRef.current === 0) {
      // Left-Click: Orbit (Pitch / Yaw)
      setCameraYaw(prev => prev - dx * 0.008);
      setCameraPitch(prev => Math.max(0.08, Math.min(1.50, prev + dy * 0.008)));
    } else {
      // Right-Click / Middle-Click: Pan
      const panSpeed = cameraDistance * 0.0015;
      setPanX(prev => prev - dx * panSpeed * Math.cos(cameraYaw) + dy * panSpeed * Math.sin(cameraYaw));
      setPanY(prev => prev + dx * panSpeed * Math.sin(cameraYaw) + dy * panSpeed * Math.cos(cameraYaw));
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 1.12 : 0.89;
    setCameraDistance(prev => Math.max(15, Math.min(400, prev * zoomFactor)));
  };

  // Keyboard Shortcuts (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit3DView({ lat: centerLat, lng: centerLng });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit3DView, centerLat, centerLng]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] bg-slate-950 rounded-xl overflow-hidden border border-purple-500/30 shadow-2xl flex flex-col"
    >
      {/* 3D Topbar HUD */}
      <div className="absolute top-0 inset-x-0 z-20 bg-slate-950/85 backdrop-blur-md border-b border-purple-500/20 px-4 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-exit-3d"
            onClick={() => onExit3DView({ lat: centerLat, lng: centerLng })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 border border-purple-500/40 transition-colors font-medium shadow-sm cursor-pointer"
            aria-label="Exit 3D terrain and return to 2D map"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>RETURN TO 2D MAP</span>
          </button>

          <div className="flex items-center gap-2 text-cyan-300 font-bold tracking-wider">
            <Mountain className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span>GENUINE 3D POLAR TERRAIN RELIEF</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-600/50 text-cyan-300 font-normal">
              GEBCO/REMA DEM
            </span>
          </div>
        </div>

        {/* Sector Telemetry & Elevation KPI */}
        <div className="hidden sm:flex items-center gap-4 text-slate-300">
          <div>
            <span className="text-slate-500">SECTOR CENTER:</span>{' '}
            <span className="text-cyan-200">{centerLat.toFixed(2)}°, {centerLng.toFixed(2)}°</span>
          </div>
          <div>
            <span className="text-slate-500">SURFACE ELEVATION:</span>{' '}
            <span className="text-emerald-400 font-bold">{centerElevInfo.elevationM.toLocaleString()} m</span>
          </div>
          <div>
            <span className="text-slate-500">SPAN:</span>{' '}
            <span className="text-purple-300">120 km</span>
          </div>
        </div>
      </div>

      {/* Main 3D WebGL Canvas */}
      <div className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        {!webGlSupported ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/95 z-30">
            <AlertTriangle className="w-12 h-12 text-amber-400 mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-100 font-space mb-2">3D WebGL Acceleration Unavailable</h3>
            <p className="text-sm text-slate-400 max-w-md mb-5 font-mono">{webGlError}</p>
            <button
              type="button"
              id="btn-fallback-exit-3d"
              onClick={() => onExit3DView({ lat: centerLat, lng: centerLng })}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-medium text-sm flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Switch to Resilient 2D Leaflet Map</span>
            </button>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onContextMenu={(e) => e.preventDefault()}
            onWheel={handleWheel}
            className="w-full h-full block"
          />
        )}

        {/* Floating Quick Camera Presets (Top Right) */}
        <div className="absolute top-14 right-3 z-10 flex flex-col gap-1.5 bg-slate-900/85 backdrop-blur-md p-2 rounded-xl border border-slate-700/60 shadow-xl text-[11px] font-mono">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold px-1">Camera Presets</div>
          <button
            onClick={() => { setCameraPitch(0.65); setCameraYaw(-0.8); setCameraDistance(140); setPanX(0); setPanY(0); }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/50 text-slate-200 text-left transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-purple-400" />
            <span>Overview 45°</span>
          </button>
          <button
            onClick={() => { setCameraPitch(1.48); setCameraYaw(0); setCameraDistance(150); setPanX(0); setPanY(0); }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/50 text-slate-200 text-left transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-blue-400" />
            <span>Top-Down (Map)</span>
          </button>
          <button
            onClick={() => { setCameraPitch(0.15); setCameraYaw(-0.4); setCameraDistance(85); }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-purple-900/50 text-slate-200 text-left transition-colors flex items-center gap-1.5"
          >
            <Mountain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Low Horizon (Crawler)</span>
          </button>
          {activeDistress && (
            <button
              onClick={() => {
                if (activeDistress.targetLat && activeDistress.targetLng) {
                  setCenterLat(activeDistress.targetLat);
                  setCenterLng(activeDistress.targetLng);
                  setCameraPitch(0.45);
                  setCameraDistance(65);
                  setPanX(0);
                  setPanY(0);
                }
              }}
              className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-500/50 text-left transition-colors flex items-center gap-1.5"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>Focus Mayday Site</span>
            </button>
          )}
        </div>

        {/* 3D Operational Markers HUD Overlay (Overlaying the 3D scene) */}
        <div className="absolute top-14 left-3 z-10 flex flex-col gap-2 max-w-xs pointer-events-none">
          {/* Active Mayday 3D Beacon Card */}
          {activeDistress && (
            <div className="bg-rose-950/90 backdrop-blur-md border border-rose-500/70 p-2.5 rounded-xl shadow-2xl text-xs font-mono text-rose-200 pointer-events-auto">
              <div className="flex items-center gap-1.5 text-rose-300 font-bold mb-1">
                <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
                <span>3D MAYDAY BEACON ACTIVE</span>
              </div>
              <div className="text-[11px] text-rose-100/90 leading-tight">
                {activeDistress.incidentType}
              </div>
              <div className="text-[10px] text-rose-300/80 mt-1 flex justify-between">
                <span>Elevation: ~1,450 m</span>
                <span>{activeDistress.coordinates}</span>
              </div>
            </div>
          )}

          {/* Quick Landmark Jump Selector */}
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/60 p-2 rounded-xl shadow-xl text-xs font-mono pointer-events-auto">
            <div className="text-[10px] text-slate-400 font-bold mb-1.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-cyan-400" />
              <span>GEODETIC SECTOR JUMP:</span>
            </div>
            <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto pr-1">
              {POLAR_GEODETIC_LANDMARKS.slice(0, 6).map((lm) => (
                <button
                  key={lm.name}
                  onClick={() => {
                    setCenterLat(lm.lat);
                    setCenterLng(lm.lng);
                    setPanX(0);
                    setPanY(0);
                  }}
                  className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${
                    Math.abs(centerLat - lm.lat) < 0.1 && Math.abs(centerLng - lm.lng) < 0.1
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lm.name.split(' ')[0]} ({lm.elevationM}m)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Interactive Controls Panel */}
        <div className="absolute bottom-3 inset-x-3 z-10 bg-slate-950/85 backdrop-blur-md border border-slate-700/60 px-4 py-2 rounded-xl shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-300">
          <div className="flex items-center gap-4">
            {/* Exaggeration Slider */}
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[11px] text-slate-400">Vertical Scale:</span>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.5"
                value={exaggeration}
                onChange={(e) => setExaggeration(parseFloat(e.target.value))}
                className="w-20 accent-purple-500 cursor-pointer"
                aria-label="Elevation exaggeration scale"
              />
              <span className="text-purple-300 font-bold text-[11px]">{exaggeration.toFixed(1)}x</span>
            </div>

            {/* Sun Angle Slider */}
            <div className="flex items-center gap-2">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] text-slate-400">Sun:</span>
              <input
                type="range"
                min="0"
                max="360"
                step="15"
                value={sunAngle}
                onChange={(e) => setSunAngle(parseInt(e.target.value, 10))}
                className="w-16 accent-amber-500 cursor-pointer"
                aria-label="Sun azimuth angle"
              />
              <span className="text-amber-300 text-[11px]">{sunAngle}°</span>
            </div>

            {/* Wireframe Mode Toggle */}
            <button
              onClick={() => setWireframeMode(!wireframeMode)}
              className={`px-2 py-1 rounded flex items-center gap-1.5 transition-colors text-[11px] ${
                wireframeMode
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{wireframeMode ? 'Wireframe ON' : 'Shaded Relief'}</span>
            </button>
          </div>

          {/* Navigation Controls Tip & Attribution */}
          <div className="flex items-center gap-4 text-[10px] text-slate-400">
            <span className="hidden md:inline">
              Left-Drag: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Orbit</kbd> • Right-Drag: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Pan</kbd> • Wheel: <kbd className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">Zoom</kbd>
            </span>
            <span className="text-slate-500">
              DEM: GEBCO 2024 / REMA • SCAR / PGC (Public Domain)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolarTerrain3DView;
