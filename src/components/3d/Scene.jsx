import React, { Component, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Html, useProgress } from '@react-three/drei';
import { SchoolModel, clearSchoolModelCache } from './SchoolModel';
import { FirstPersonPlayer } from './FirstPersonPlayer';
import { RoomMarkers } from './RoomMarkers';
import { useTourStore } from '../../stores/useTourStore';

class AssetErrorBoundary extends Component {
  state = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error) {
    return { error };
  }

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
    const { error, retryKey } = this.state;

    if (error) {
      return (
        <Html center>
          <div className="min-w-72 rounded-2xl border border-red-500/40 bg-slate-950/95 p-5 text-center text-white shadow-2xl">
            <h3 className="text-sm font-semibold">Model 3D gagal dimuat</h3>
            <p className="mt-1 text-xs text-slate-400">Periksa koneksi atau muat ulang aset.</p>
            <button
              type="button"
              onClick={this.retry}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500"
            >
              Coba Lagi
            </button>
          </div>
        </Html>
      );
    }

    return <React.Fragment key={retryKey}>{this.props.children}</React.Fragment>;
  }
}

function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="bg-slate-900/90 text-white px-8 py-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-4 min-w-[280px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <h3 className="text-sm font-semibold text-white">Memuat 3D Virtual Tour...</h3>
          <p className="text-xs text-slate-400 mt-1">{progress.toFixed(0)}% selesai</p>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
          <div 
            className="bg-blue-500 h-full transition-all duration-300 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </Html>
  );
}

function CanvasLifecycle({ onUnavailable }) {
  const { gl } = useThree();

  useEffect(() => {
    const canvas = gl.domElement;
    const handleContextLost = (event) => {
      event.preventDefault();
      onUnavailable?.();
    };

    canvas.addEventListener('webglcontextlost', handleContextLost);

    return () => canvas.removeEventListener('webglcontextlost', handleContextLost);
  }, [gl, onUnavailable]);

  return null;
}

export function Scene({
  controlsEnabled = true,
  onAssetError,
  onAssetRetry,
  onReady,
  onUnavailable,
}) {
  const cameraMode = useTourStore((state) => state.cameraMode);

  return (
    <div
      id="canvas-container"
      className="w-full h-full relative cursor-pointer"
      role="region"
      aria-label="Pemandangan virtual 3D SMKN 2 Surakarta"
    >
      <Canvas
        camera={{ position: [0, 2, 12], fov: 65, near: 0.1, far: 1000 }}
        dpr={[1, 1.5]}
        className="w-full h-full"
      >
        <CanvasLifecycle onUnavailable={onUnavailable} />
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[60, 90, 30]}
          intensity={1.8}
        />
        <directionalLight position={[-50, 40, -30]} intensity={0.4} />

        <Sky sunPosition={[60, 90, 30]} turbidity={6} rayleigh={3} />

        {/* Controller Switcher: First Person (WASD) vs Orbit (Overview) */}
        {cameraMode === 'fps' && controlsEnabled ? (
          <FirstPersonPlayer spawnPosition={[0, 2, 12]} />
        ) : cameraMode === 'orbit' ? (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxDistance={250}
            minDistance={2}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />
        ) : null}

        <AssetErrorBoundary onError={onAssetError} onRetry={onAssetRetry}>
          <Suspense fallback={<Loader />}>
            <SchoolModel onReady={onReady} />
          </Suspense>
        </AssetErrorBoundary>
        <RoomMarkers />
      </Canvas>
    </div>
  );
}
