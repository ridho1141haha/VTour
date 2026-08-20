import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { Info, MapPin } from 'lucide-react';

function SingleMarker({ room }) {
  const markerRef = useRef();
  const { openRoomModal, nearbyRoom } = useTourStore();
  const isNearby = nearbyRoom?.id === room.id;

  useFrame(({ clock }) => {
    if (markerRef.current) {
      // Efek melayang naik turun secara halus (bobbing)
      const t = clock.getElapsedTime();
      markerRef.current.position.y = room.position[1] + Math.sin(t * 2 + room.position[0]) * 0.15 + 0.3;
    }
  });

  return (
    <group position={room.position} ref={markerRef}>
      {/* 3D Visual Mesh Pin / Halo */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial 
          color={isNearby ? "#3b82f6" : "#60a5fa"} 
          emissive={isNearby ? "#1d4ed8" : "#2563eb"} 
          emissiveIntensity={isNearby ? 1.2 : 0.6}
          roughness={0.2}
        />
      </mesh>

      {/* Cincin Efek Berdenyut di Bawah Marker */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.45, 24]} />
        <meshBasicMaterial 
          color="#3b82f6" 
          transparent 
          opacity={isNearby ? 0.8 : 0.4} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* HTML Label Billboard */}
      <Html
        position={[0, 0.6, 0]}
        center
        distanceFactor={18}
        zIndexRange={[100, 0]}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            openRoomModal(room);
          }}
          className={`group flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer pointer-events-auto whitespace-nowrap ${
            isNearby
              ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-blue-500/40 ring-2 ring-blue-400/50'
              : 'bg-slate-900/85 border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-500'
          }`}
        >
          <div className={`p-0.5 rounded-full ${isNearby ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
            <Info size={12} />
          </div>
          <span className="text-xs font-semibold">{room.shortName}</span>
        </button>
      </Html>
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
