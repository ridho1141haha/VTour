import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { Info } from 'lucide-react';

const ROOMS_URL = `${import.meta.env.BASE_URL}data/rooms.json`;

function validateRooms(data) {
  if (!Array.isArray(data)) throw new Error('Format data ruangan bukan array.');

  const ids = new Set();
  data.forEach((room, index) => {
    const isValid = room
      && typeof room.id === 'string'
      && typeof room.name === 'string'
      && typeof room.shortName === 'string'
      && typeof room.building === 'string'
      && typeof room.category === 'string'
      && typeof room.description === 'string'
      && typeof room.contentNote === 'string'
      && Number.isFinite(room.floor)
      && Array.isArray(room.facilities)
      && room.facilities.every((facility) => typeof facility === 'string')
      && Array.isArray(room.images)
      && room.images.every((image) => image
        && typeof image.url === 'string'
        && typeof image.caption === 'string')
      && Array.isArray(room.position)
      && room.position.length === 3
      && room.position.every(Number.isFinite)
      && !ids.has(room.id);

    if (!isValid) throw new Error(`Data ruangan ke-${index + 1} tidak valid.`);
    ids.add(room.id);
  });

  return data;
}

function SingleMarker({ room }) {
  const markerRef = useRef();
  const openRoomModal = useTourStore((state) => state.openRoomModal);
  const nearbyRoom = useTourStore((state) => state.nearbyRoom);
  const isModalOpen = useTourStore((state) => Boolean(state.activeRoom));
  const cameraMode = useTourStore((state) => state.cameraMode);
  const isNearby = nearbyRoom?.id === room.id;
  const canOpen = cameraMode === 'orbit' || isNearby;

  useFrame(({ clock }) => {
    if (markerRef.current) {
      // Efek melayang naik turun secara halus (bobbing)
      const t = clock.getElapsedTime();
      markerRef.current.position.y = room.position[1] + Math.sin(t * 2 + room.position[0]) * 0.12 + 0.2;
    }
  });

  return (
    <group position={room.position} ref={markerRef}>
      {/* 3D Visual Mesh Pin / Halo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial 
          color={isNearby ? "#3b82f6" : "#60a5fa"} 
          emissive={isNearby ? "#1d4ed8" : "#2563eb"} 
          emissiveIntensity={isNearby ? 1.0 : 0.4}
          roughness={0.2}
        />
      </mesh>

      {/* Cincin Efek Berdenyut di Bawah Marker */}
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.35, 24]} />
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent 
          opacity={isNearby ? 0.7 : 0.3} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* HTML Label Billboard (Sembunyikan jika modal sedang terbuka) */}
      {!isModalOpen && (
        <Html
          position={[0, 0.5, 0]}
          center
          distanceFactor={12}
          zIndexRange={[5, 0]}
          style={{ pointerEvents: canOpen ? 'auto' : 'none' }}
        >
          <button
            type="button"
            disabled={!canOpen}
            aria-hidden={!canOpen}
            aria-label={`Lihat informasi ${room.name}`}
            onClick={(e) => {
              e.stopPropagation();
              if (canOpen) openRoomModal(room);
            }}
            className={`group flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer pointer-events-auto select-none ${
              isNearby
                ? 'bg-blue-600/95 border-blue-400 text-white shadow-blue-500/30 ring-2 ring-blue-400/50'
                : 'bg-slate-900/85 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500'
            }`}
            style={{ transform: 'translate3d(0, 0, 0)' }}
          >
            <div className={`p-0.5 rounded-full ${isNearby ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
              <Info size={13} />
            </div>
            <span className="text-[12px] font-semibold whitespace-nowrap tracking-wide">{room.shortName}</span>
          </button>
        </Html>
      )}
    </group>
  );
}

export function RoomMarkers() {
  const rooms = useTourStore((state) => state.rooms);
  const setRooms = useTourStore((state) => state.setRooms);
  const [loadError, setLoadError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(null);

    fetch(ROOMS_URL, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(validateRooms)
      .then(setRooms)
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error('Gagal memuat data rooms.json:', error);
        setLoadError(error);
      });

    return () => controller.abort();
  }, [retryCount, setRooms]);

  return (
    <group name="room-markers-group">
      {rooms.map((room) => (
        <SingleMarker key={room.id} room={room} />
      ))}
      {loadError && (
        <Html center>
          <div className="min-w-64 rounded-xl border border-red-500/40 bg-slate-950/95 p-4 text-center text-white shadow-2xl">
            <p className="text-sm font-semibold">Data ruangan gagal dimuat</p>
            <p className="mt-1 text-xs text-slate-400">Periksa koneksi lalu coba lagi.</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold hover:bg-blue-500"
            >
              Coba Lagi
            </button>
          </div>
        </Html>
      )}
    </group>
  );
}
