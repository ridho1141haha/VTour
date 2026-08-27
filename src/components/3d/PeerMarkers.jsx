import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { presence } from '../../lib/presence';
import { stepPeer } from '../../lib/presenceClient';

function PeerMarker({ id, name }) {
  const groupRef = useRef();
  const bodyRef = useRef();

  useFrame((_, delta) => {
    const peer = presence.peers.get(id);
    if (!peer || !groupRef.current) return;
    stepPeer(peer, delta);
    groupRef.current.position.set(peer.x, 1.05 + Math.sin(peer.x * 3 + peer.z) * 0.04, peer.z);
    if (bodyRef.current) bodyRef.current.rotation.y = peer.yaw;
  });

  const isGuide = useTourStore((state) => state.guide?.id === id);

  return (
    <group ref={groupRef} name={`peer-${id}`}>
      <group ref={bodyRef}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial
            color={isGuide ? '#34d399' : '#f1f0e8'}
            emissive={isGuide ? '#059669' : '#52525b'}
            emissiveIntensity={isGuide ? 0.7 : 0.25}
            roughness={0.35}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[0, 0, -0.34]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.1, 0.24, 8]} />
          <meshStandardMaterial color={isGuide ? '#34d399' : '#a1a1aa'} roughness={0.5} />
        </mesh>
      </group>
      <Html center distanceFactor={16} zIndexRange={[15, 5]} style={{ pointerEvents: 'none' }}>
        <div
          className={`whitespace-nowrap border px-2 py-0.5 font-mono text-[10px] backdrop-blur-sm ${
            isGuide
              ? 'border-emerald-400/70 bg-emerald-950/90 text-emerald-200'
              : 'border-zinc-700/80 bg-zinc-950/85 text-zinc-300'
          }`}
        >
          {isGuide ? '▸ ' : ''}{name}
        </div>
      </Html>
    </group>
  );
}

function PresenceReporter() {
  const directionRef = useRef(new THREE.Vector3());
  useFrame(({ camera }) => {
    const state = useTourStore.getState();
    if (!state.presenceEnabled || state.cameraMode !== 'fps') return;
    camera.getWorldDirection(directionRef.current);
    presence.sendMove(camera.position.x, camera.position.z, Math.atan2(directionRef.current.x, directionRef.current.z));
  });
  return null;
}

export function PeerMarkers() {
  const roster = useTourStore((state) => state.presenceRoster);
  const enabled = useTourStore((state) => state.presenceEnabled);

  return (
    <group name="presence-peers">
      <PresenceReporter />
      {enabled && roster.map((peer) => (
        <PeerMarker key={peer.id} id={peer.id} name={peer.name} />
      ))}
    </group>
  );
}
