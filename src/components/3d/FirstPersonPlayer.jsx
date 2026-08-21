import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useTourStore } from '../../stores/useTourStore';

export function FirstPersonPlayer({ spawnPosition = [0, 2, 12] }) {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  const keys = useKeyboard(true);
  const { 
    appState, 
    setIsPointerLocked, 
    rooms, 
    nearbyRoom, 
    setNearbyRoom, 
    openRoomModal,
    currentZone,
    setCurrentZone,
    isSearchOpen,
    isMapOpen,
    targetTeleport,
    clearTeleport
  } = useTourStore();

  const moveVector = useRef(new THREE.Vector3());
  const forwardVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 20));
  const playerPos = useRef(new THREE.Vector3());
  const roomPos = useRef(new THREE.Vector3());
  const lastInteractRef = useRef(false);

  useEffect(() => {
    camera.position.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
  }, [camera, spawnPosition]);

  // Handle Teleportasi Instan
  useEffect(() => {
    if (targetTeleport && Array.isArray(targetTeleport)) {
      camera.position.set(targetTeleport[0], targetTeleport[1] || 2, targetTeleport[2]);
      clearTeleport();
    }
  }, [targetTeleport, camera, clearTeleport]);

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = Boolean(document.pointerLockElement);
      setIsPointerLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [setIsPointerLocked]);

  useFrame((_, delta) => {
    // Nonaktifkan pergerakan saat modal, pencarian, atau denah sedang dibuka
    if (appState === 'modal_open' || isSearchOpen || isMapOpen) return;

    const baseSpeed = 9.0;
    const speed = keys.sprint ? baseSpeed * 1.75 : baseSpeed;
    const actualDelta = Math.min(delta, 0.1);

    // Orientasi horizontal kamera
    camera.getWorldDirection(forwardVector.current);
    forwardVector.current.y = 0;
    forwardVector.current.normalize();

    sideVector.current.crossVectors(camera.up, forwardVector.current).normalize();

    moveVector.current.set(0, 0, 0);

    if (keys.forward) moveVector.current.add(forwardVector.current);
    if (keys.backward) moveVector.current.sub(forwardVector.current);
    if (keys.left) moveVector.current.add(sideVector.current);
    if (keys.right) moveVector.current.sub(sideVector.current);

    if (moveVector.current.lengthSq() > 0) {
      moveVector.current.normalize();
      camera.position.addScaledVector(moveVector.current, speed * actualDelta);
    }

    // Raycast lantai
    const rayOrigin = camera.position.clone();
    rayOrigin.y += 2.0;
    raycaster.current.set(rayOrigin, new THREE.Vector3(0, -1, 0));

    const intersects = raycaster.current.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const validHit = intersects.find(hit => hit.object.type === 'Mesh' && !hit.object.name?.includes('marker'));
      if (validHit && validHit.distance > 0.05) {
        const targetY = validHit.point.y + 1.7; // Ketinggian pandangan mata manusia 1.7m
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.25);
      }
    }

    // Deteksi Proximity ke Marker Ruangan (< 4.5 meter)
    playerPos.current.set(camera.position.x, 0, camera.position.z);
    let foundNearby = null;
    let closestZone = null;
    let minDistance = Infinity;

    for (const room of rooms) {
      roomPos.current.set(room.position[0], 0, room.position[2]);
      const dist = playerPos.current.distanceTo(roomPos.current);

      if (dist < 4.5) {
        foundNearby = room;
      }

      if (dist < 12 && dist < minDistance) {
        minDistance = dist;
        closestZone = `${room.building} • ${room.shortName}`;
      }
    }

    if (foundNearby?.id !== nearbyRoom?.id) {
      setNearbyRoom(foundNearby);
    }

    if (closestZone && closestZone !== currentZone) {
      setCurrentZone(closestZone);
    }

    // Handle tombol [E]
    if (keys.interact && !lastInteractRef.current && foundNearby) {
      openRoomModal(foundNearby);
    }
    lastInteractRef.current = keys.interact;
  });

  return (
    <PointerLockControls 
      ref={controlsRef} 
      selector="#canvas-container"
    />
  );
}
