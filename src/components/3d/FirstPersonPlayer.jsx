import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useTourStore } from '../../stores/useTourStore';

export function FirstPersonPlayer({ spawnPosition = [0, 2, 20] }) {
  const { camera, scene } = useThree();
  const controlsRef = useRef();
  const keys = useKeyboard();
  const { appState, setIsPointerLocked } = useTourStore();

  const moveVector = useRef(new THREE.Vector3());
  const forwardVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 20));

  useEffect(() => {
    // Set posisi awal kamera
    camera.position.set(...spawnPosition);
  }, []);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const onLock = () => setIsPointerLocked(true);
    const onUnlock = () => setIsPointerLocked(false);

    controls.addEventListener('lock', onLock);
    controls.addEventListener('unlock', onUnlock);

    return () => {
      controls.removeEventListener('lock', onLock);
      controls.removeEventListener('unlock', onUnlock);
    };
  }, [setIsPointerLocked]);

  useFrame((_, delta) => {
    if (appState === 'modal_open') return;

    const baseSpeed = 9.0;
    const speed = keys.sprint ? baseSpeed * 1.75 : baseSpeed;
    const actualDelta = Math.min(delta, 0.1);

    // Ambil orientasi kamera horizontal
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
        const targetY = validHit.point.y + 1.7; // Tinggi pandangan mata 1.7m
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.25);
      }
    }
  });

  return (
    <PointerLockControls 
      ref={controlsRef} 
    />
  );
}
