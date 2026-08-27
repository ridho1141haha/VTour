import React, { Component, Suspense, useEffect, useRef, useState } from 'react';
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
  const valueRef = useRef();
  const elapsedRef = useRef(0);
  useFrame((_, delta) => {
    elapsedRef.current += delta;
    if (elapsedRef.current < 0.2 || !valueRef.current) return;
    elapsedRef.current = 0;
    valueRef.current.textContent = `[${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}, ${camera.position.z.toFixed(2)}]`;
  });
  return (
    <Html fullscreen style={{ pointerEvents: 'none' }}>
      <div className="absolute bottom-24 left-4 bg-black/80 px-3 py-2 font-mono text-xs text-white" style={{ pointerEvents: 'auto' }}>
        <span className="text-orange-400">DEV POSITION </span><span ref={valueRef} />
        <button className="ml-3 text-slate-300 underline" onClick={() => navigator.clipboard.writeText(valueRef.current?.textContent ?? '')}>Copy</button>
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
            <ambientLight intensity={0.9} />
            <directionalLight position={[60, 90, 30]} intensity={1.75} />
            <directionalLight position={[-50, 40, -30]} intensity={0.35} />
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
