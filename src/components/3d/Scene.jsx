import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Html, useProgress } from '@react-three/drei';
import { SchoolModel } from './SchoolModel';
import { FirstPersonPlayer } from './FirstPersonPlayer';
import { useTourStore } from '../../stores/useTourStore';

function Loader() {
  const { progress, active } = useProgress();
  if (!active) return null;

  return (
    <Html center>
      <div className='bg-slate-900/90 text-white px-8 py-6 rounded-2xl border border-slate-700 shadow-2xl flex flex-col items-center gap-4 min-w-[280px]'>
        <div className='w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
        <div className='text-center'>
          <h3 className='text-sm font-semibold text-white'>Memuat 3D Virtual Tour...</h3>
          <p className='text-xs text-slate-400 mt-1'>{progress.toFixed(0)}% selesai</p>
        </div>
        <div className='w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700'>
          <div 
            className='bg-blue-500 h-full transition-all duration-300 rounded-full' 
            style={{ width: progress + '%' }}
          ></div>
        </div>
      </div>
    </Html>
  );
}

export function Scene() {
  const { cameraMode } = useTourStore();

  return (
    <div id='canvas-container' className='w-full h-full relative cursor-pointer'>
      <Canvas
        camera={{ position: [0, 2, 20], fov: 65, near: 0.1, far: 1000 }}
        shadows
        className='w-full h-full'
      >
        <ambientLight intensity={0.8} />
        <directionalLight
          position={[60, 90, 30]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
        />
        <directionalLight position={[-50, 40, -30]} intensity={0.4} />

        <Sky sunPosition={[60, 90, 30]} turbidity={6} rayleigh={3} />

        {/* Controller Switcher: First Person (WASD) vs Orbit (Overview) */}
        {cameraMode === 'fps' ? (
          <FirstPersonPlayer spawnPosition={[0, 2, 20]} />
        ) : (
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05} 
            maxDistance={250}
            minDistance={2}
            maxPolarAngle={Math.PI / 2 - 0.02}
          />
        )}

        <Suspense fallback={<Loader />}>
          <SchoolModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
