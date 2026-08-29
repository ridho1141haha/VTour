import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Sky, useProgress } from '@react-three/drei';
import { XR, XROrigin } from '@react-three/xr';
import { SchoolModel, clearSchoolModelCache } from './SchoolModel';
import { FirstPersonPlayer } from './FirstPersonPlayer';
import { XRPlayer } from './XRPlayer';
import { LocationMarkers } from './LocationMarkers';
import { PeerMarkers } from './PeerMarkers';
import { useTourStore } from '../../stores/useTourStore';
import { xrStore } from '../../lib/xrStore';

const DEFAULT_SPAWN_POS = [0, 2, 12];

class CanvasErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    console.error('Canvas WebGL error:', error);
    this.props.onError?.();
  }
  render() {
    if (this.state.error) {
      return (
        <div role="alert" className="flex h-full w-full items-center justify-center bg-slate-950 p-6 text-center text-white">
          <div className="max-w-sm">
            <h3 className="text-base font-bold">Renderer 3D mengalami kendala</h3>
            <p className="mt-2 text-xs text-slate-400">WebGL tidak dapat diinisialisasi atau mengalami gangguan.</p>
            <button onClick={() => { this.setState({ error: null }); this.props.onRetry?.(); }} className="mt-4 bg-orange-600 px-4 py-2 text-xs font-semibold text-white hover:bg-orange-500">Muat Ulang</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

class AssetErrorBoundary extends Component {
  state = { error: null, retryKey: 0 };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) {
    console.error('Gagal memuat aset 3D:', error);
    this.props.onError?.();
  }
  retry = () => {
    this.props.onRetry?.();
    clearSchoolModelCache();
    this.setState(({ retryKey }) => ({ error: null, retryKey: retryKey + 1 }));
  };
  render() {
    if (this.state.error) {
      return (
        <Html center>
          <div role="alert" className="min-w-72 border border-red-500/40 bg-slate-950/95 p-5 text-center text-white shadow-2xl">
            <h3 className="text-sm font-semibold">Virtual Tour gagal dimuat</h3>
            <p className="mt-1 text-xs text-slate-400">Periksa koneksi lalu coba lagi.</p>
            <button onClick={this.retry} className="mt-4 bg-orange-600 px-4 py-2 text-xs font-semibold hover:bg-orange-500">Coba Lagi</button>
          </div>
        </Html>
      );
    }
    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div role="status" aria-live="polite" className="min-w-[280px] border border-slate-700 bg-slate-950/95 px-8 py-6 text-white shadow-2xl">
        <p className="eyebrow">Menyiapkan tur</p>
        <h3 className="text-sm font-semibold">Memuat lingkungan sekolah...</h3>
        <p className="mt-1 font-mono text-xs text-slate-400">{progress.toFixed(0)}%</p>
        <div className="mt-4 h-1.5 overflow-hidden bg-slate-800"><div className="h-full bg-orange-500 transition-all" style={{ width: `${progress}%` }} /></div>
      </div>
    </Html>
  );
}

function CanvasLifecycle({ onUnavailable, onRestored }) {
  const { gl } = useThree();
  useEffect(() => {
    const handleContextLost = (event) => {
      event.preventDefault();
      onUnavailable?.();
    };
    const handleContextRestored = () => {
      onRestored?.();
    };
    const element = gl.domElement;
    element.addEventListener('webglcontextlost', handleContextLost);
    element.addEventListener('webglcontextrestored', handleContextRestored);
    return () => {
      element.removeEventListener('webglcontextlost', handleContextLost);
      element.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [gl, onRestored, onUnavailable]);
  return null;
}

function PositionDebug() {
  const { camera } = useThree();
  const posRef = useRef();
  const lookRef = useRef();
  const dirVec = useRef(new THREE.Vector3());
  const elapsedRef = useRef(0);
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2' || (e.ctrlKey && e.shiftKey && e.key === 'D')) {
        e.preventDefault();
        setVisible((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useFrame((_, delta) => {
    if (!visible) return;
    elapsedRef.current += delta;
    if (elapsedRef.current < 0.1 || !posRef.current) return;
    elapsedRef.current = 0;

    const x = camera.position.x.toFixed(2);
    const y = camera.position.y.toFixed(2);
    const z = camera.position.z.toFixed(2);
    posRef.current.textContent = `[${x}, ${y}, ${z}]`;

    if (lookRef.current) {
      camera.getWorldDirection(dirVec.current);
      const lookX = (camera.position.x + dirVec.current.x * 5).toFixed(2);
      const lookZ = (camera.position.z + dirVec.current.z * 5).toFixed(2);
      lookRef.current.textContent = `[${lookX}, ${y}, ${lookZ}]`;
    }
  });

  const copyCoord = () => {
    const text = posRef.current?.textContent ?? '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const copyPOISnippet = () => {
    const x = Number(camera.position.x.toFixed(2));
    const y = Number(camera.position.y.toFixed(2));
    const z = Number(camera.position.z.toFixed(2));
    camera.getWorldDirection(dirVec.current);
    const lookX = Number((camera.position.x + dirVec.current.x * 5).toFixed(2));
    const lookZ = Number((camera.position.z + dirVec.current.z * 5).toFixed(2));

    const snippet = JSON.stringify({
      position: [x, Number((y - 1.25).toFixed(2)), z],
      teleportPosition: [x, y, z],
      teleportLookAt: [lookX, y, lookZ],
    }, null, 2);

    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!visible) return null;

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div
        className="absolute bottom-24 left-4 z-50 flex flex-col gap-1 rounded border border-zinc-700 bg-zinc-950/90 p-2.5 font-mono text-[11px] text-zinc-200 shadow-xl backdrop-blur-md"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-800 pb-1">
          <span className="font-bold text-orange-400">DEV CHAR COORDINATES</span>
          <span className="text-[9px] text-zinc-400">F2 toggle</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-400">POS:</span>
          <span ref={posRef} className="font-bold text-emerald-400">[0.00, 0.00, 0.00]</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-400">
          <span>LOOK:</span>
          <span ref={lookRef} className="text-cyan-400">[0.00, 0.00, 0.00]</span>
        </div>
        <div className="mt-1 flex items-center gap-2 pt-1">
          <button
            onClick={copyCoord}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:border-orange-500 hover:text-white"
          >
            {copied ? '✓ Copied Pos!' : 'Copy Pos'}
          </button>
          <button
            onClick={copyPOISnippet}
            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-200 hover:border-orange-500 hover:text-white"
          >
            Copy POI JSON
          </button>
        </div>
      </div>
    </Html>
  );
}

export function Scene({ controlsEnabled = true, onAssetError, onAssetRetry, onReady, onUnavailable, onRestored }) {
  const cameraMode = useTourStore((state) => state.cameraMode);
  const graphicsQuality = useTourStore((state) => state.graphicsQuality);
  const collisionRef = useRef({ groundMeshes: [], obstacleBoxes: [], obstacleGrid: null });
  const xrOriginRef = useRef(null);
  const [canvasKey, setCanvasKey] = useState(0);
  const dpr = graphicsQuality === 'low' ? 1 : graphicsQuality === 'medium' ? [1, 1.25] : [1, 1.5];

  const handleRetry = () => {
    setCanvasKey((prev) => prev + 1);
    onAssetRetry?.();
  };

  return (
    <div id="canvas-container" className="relative h-full w-full cursor-pointer touch-none" role="region" aria-label="Pemandangan virtual 3D SMKN 2 Surakarta">
      <CanvasErrorBoundary onError={onUnavailable} onRetry={handleRetry}>
        <Canvas key={canvasKey} camera={{ position: DEFAULT_SPAWN_POS, fov: 65, near: 0.1, far: 1000 }} dpr={dpr} shadows={false}>
          <XR store={xrStore}>
            <XROrigin ref={xrOriginRef} />
            <CanvasLifecycle onUnavailable={onUnavailable} onRestored={onRestored} />
            <ambientLight intensity={1.1} />
            <directionalLight position={[60, 90, 30]} intensity={1.5} />
            <directionalLight position={[-60, 60, -50]} intensity={0.85} />
            <directionalLight position={[0, 50, 0]} intensity={0.4} />
            <Sky sunPosition={[60, 90, 30]} turbidity={6} rayleigh={3} />

            <FirstPersonPlayer collisionRef={collisionRef} enabled={cameraMode === 'fps' && controlsEnabled} spawnPosition={DEFAULT_SPAWN_POS} />
            <XRPlayer collisionRef={collisionRef} enabled={controlsEnabled} originRef={xrOriginRef} />
            {cameraMode === 'orbit' && (
              <OrbitControls enableDamping dampingFactor={0.05} target={[-43.28, 1.7, -0.68]} maxDistance={250} minDistance={2} maxPolarAngle={Math.PI / 2 - 0.02} />
            )}

            <AssetErrorBoundary onError={onAssetError} onRetry={onAssetRetry}>
              <Suspense fallback={<Loader />}>
                <SchoolModel collisionRef={collisionRef} onReady={onReady} />
              </Suspense>
            </AssetErrorBoundary>
            <LocationMarkers />
            <PeerMarkers />
            {import.meta.env.DEV && <PositionDebug />}
          </XR>
        </Canvas>
      </CanvasErrorBoundary>
    </div>
  );
}
