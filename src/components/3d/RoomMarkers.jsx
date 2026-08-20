import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { Info } from 'lucide-react';

function SingleMarker({ room }) {
  const markerRef = useRef();
  const { openRoomModal, nearbyRoom, appState } = useTourStore();
  const isNearby = nearbyRoom?.id === room.id;

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
      {appState !== 'modal_open' && (
        <Html
          position={[0, 0.5, 0]}
          center
          distanceFactor={12}
          zIndexRange={[20, 0]}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              openRoomModal(room);
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
  const { rooms, setRooms } = useTourStore();

  useEffect(() => {
    fetch('/data/rooms.json')
      .then((res) => res.json())
      .then((data) => setRooms(data))
      .catch((err) => console.error('Gagal memuat data rooms.json:', err));
  }, [setRooms]);

  return (
    <group name="room-markers-group">
      {rooms.map((room) => (
        <SingleMarker key={room.id} room={room} />
      ))}
    </group>
  );
}
