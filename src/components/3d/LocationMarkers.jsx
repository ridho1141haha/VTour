import React, { useCallback, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { loadLocations } from '../../lib/locationData';

function LocationMarker({ location }) {
  const markerRef = useRef();
  const labelRef = useRef();
  const worldPositionRef = useRef(new THREE.Vector3());
  const lastParentVisibleRef = useRef(true);
  const lastLabelVisibleRef = useRef(true);
  const openLocation = useTourStore((state) => state.openLocation);
  const nearbyLocation = useTourStore((state) => state.nearbyLocation);
  const overlay = useTourStore((state) => state.overlay);
  const isNearby = nearbyLocation?.id === location.id;

  useFrame(({ clock, camera }) => {
    if (markerRef.current) {
      const t = clock.getElapsedTime();
      markerRef.current.position.y = 0.15 + Math.sin(t * 2 + location.position[0]) * 0.08;
      markerRef.current.rotation.y = t * 0.8;

      const distance = camera.position.distanceTo(markerRef.current.getWorldPosition(worldPositionRef.current));
      const shouldParentBeVisible = distance <= 65;
      if (lastParentVisibleRef.current !== shouldParentBeVisible) {
        if (markerRef.current.parent) markerRef.current.parent.visible = shouldParentBeVisible;
        lastParentVisibleRef.current = shouldParentBeVisible;
      }

      const shouldLabelBeVisible = distance <= 30 || isNearby;
      if (lastLabelVisibleRef.current !== shouldLabelBeVisible) {
        if (labelRef.current) labelRef.current.style.display = shouldLabelBeVisible ? 'block' : 'none';
        lastLabelVisibleRef.current = shouldLabelBeVisible;
      }
    }
  });

  return (
    <group position={location.position} name={`location-marker-${location.id}`}>
      {/* 3D Visual Mesh Diamond / Minimalist Pin */}
      <group ref={markerRef}>
        <mesh position={[0, 0, 0]}>
          <octahedronGeometry args={[0.18, 0]} />
          <meshStandardMaterial 
            color={isNearby ? "#ffffff" : "#a1a1aa"} 
            emissive={isNearby ? "#3b82f6" : "#27272a"} 
            emissiveIntensity={isNearby ? 0.9 : 0.3}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      </group>

      {/* Subtle Ground Ring */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.3, 24]} />
        <meshBasicMaterial 
          color={isNearby ? "#ffffff" : "#71717a"} 
          transparent 
          opacity={isNearby ? 0.6 : 0.2} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* HTML Label Billboard */}
      {!overlay && (
        <Html
          position={[0, 0.45, 0]}
          center
          distanceFactor={13}
          zIndexRange={[20, 0]}
        >
          <div ref={labelRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isNearby) openLocation(location);
            }}
            disabled={!isNearby}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border shadow-lg backdrop-blur-md transition-all duration-150 cursor-pointer pointer-events-auto select-none font-mono ${
              isNearby
                ? 'bg-zinc-100 border-white text-zinc-950 shadow-white/10 font-bold scale-105'
                : 'bg-zinc-950/90 border-zinc-800 text-zinc-300 hover:border-zinc-500'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full ${isNearby ? 'bg-zinc-950' : 'bg-blue-400'}`}></div>
            <span className="text-[11px] uppercase tracking-wider whitespace-nowrap">{location.shortName}</span>
            {isNearby && <span className="border-l border-zinc-400 pl-1.5 text-[10px]">E · INFO</span>}
          </button>
          </div>
        </Html>
      )}
    </group>
  );
}

export function LocationMarkers() {
  const locations = useTourStore((state) => state.locations);
  const status = useTourStore((state) => state.locationsStatus);
  const error = useTourStore((state) => state.locationsError);
  const setLoading = useTourStore((state) => state.setLocationsLoading);
  const setLocations = useTourStore((state) => state.setLocations);
  const setError = useTourStore((state) => state.setLocationsError);
  const requestRef = useRef(null);

  const fetchLocations = useCallback(() => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading();
    loadLocations({ signal: controller.signal })
      .then(setLocations)
      .catch((loadError) => {
        if (loadError.name !== 'AbortError') setError(loadError.message);
      });
  }, [setError, setLoading, setLocations]);

  useEffect(() => {
    if (useTourStore.getState().locationsStatus !== 'ready') fetchLocations();
    return () => requestRef.current?.abort();
  }, [fetchLocations]);

  if (status === 'error') {
    return (
      <Html center>
        <div role="alert" className="min-w-72 border border-red-500/40 bg-slate-950/95 p-5 text-center text-white shadow-2xl">
          <h3 className="text-sm font-semibold">Data lokasi gagal dimuat</h3>
          <p className="mt-1 text-xs text-slate-400">{error}</p>
          <button
            onClick={() => {
              fetchLocations();
            }}
            className="mt-4 bg-orange-600 px-4 py-2 text-xs font-semibold hover:bg-orange-500"
          >
            Coba Lagi
          </button>
        </div>
      </Html>
    );
  }

  return (
    <group name="location-markers-group">
      {locations.filter((location) => location.position).map((location) => (
        <LocationMarker key={location.id} location={location} />
      ))}
    </group>
  );
}
