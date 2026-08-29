import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PointerLockControls } from '@react-three/drei';
import { useXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { useKeyboard } from '../../hooks/useKeyboard';
import { useTourStore } from '../../stores/useTourStore';
import { findEnteredLocation, findNearestLocation, isPosition } from '../../lib/locationUtils';
import { isPositionBlocked } from '../../lib/collision';

const DEFAULT_SPAWN = [0, 2, 12];
const EYE_HEIGHT = 1.7;
const WALK_SPEED = 4;
const SPRINT_SPEED = 6.5;
const JUMP_VELOCITY = 4.8;
const GRAVITY = 14;
const MAX_FRAME_DELTA = 0.05;
const MAX_STEP = 0.65;
const MAX_DROP = 0.85;
const GROUND_DAMPING = 20;
const DOWN = new THREE.Vector3(0, -1, 0);

export function FirstPersonPlayer({ collisionRef, enabled, spawnPosition = DEFAULT_SPAWN }) {
  const { camera, gl } = useThree();
  const xrStore = useXRStore();
  const isXRSession = xrStore.getState().session != null;
  const controlsRef = useRef();
  const overlay = useTourStore((state) => state.overlay);
  const setIsPointerLocked = useTourStore((state) => state.setIsPointerLocked);
  const locations = useTourStore((state) => state.locations);
  const nearbyLocation = useTourStore((state) => state.nearbyLocation);
  const setNearbyLocation = useTourStore((state) => state.setNearbyLocation);
  const currentLocation = useTourStore((state) => state.currentLocation);
  const setCurrentLocation = useTourStore((state) => state.setCurrentLocation);
  const openLocation = useTourStore((state) => state.openLocation);
  const targetTeleport = useTourStore((state) => state.targetTeleport);
  const clearTeleport = useTourStore((state) => state.clearTeleport);
  const mouseSensitivity = useTourStore((state) => state.mouseSensitivity);
  const movementEnabled = enabled && !overlay;
  const keys = useKeyboard(movementEnabled);

  const hasSpawnedRef = useRef(false);
  const spawnAttemptsRef = useRef(0);
  const targetGroundYRef = useRef(null);
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);
  const wasEnabledRef = useRef(enabled);
  const savedPoseRef = useRef(null);
  const lastInteractRef = useRef(false);
  const touchLookIdRef = useRef(null);
  const lastTouchPosRef = useRef({ x: 0, y: 0 });
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const moveVector = useRef(new THREE.Vector3());
  const keyboardVector = useRef(new THREE.Vector3());
  const forwardVector = useRef(new THREE.Vector3());
  const sideVector = useRef(new THREE.Vector3());
  const rayOrigin = useRef(new THREE.Vector3());
  const playerArray = useRef([0, 0, 0]);
  const lastProximityCheckPosRef = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));
  const raycaster = useRef(new THREE.Raycaster(undefined, DOWN, 0, MAX_STEP + MAX_DROP + 0.1));
  const groundHits = useRef([]);

  const enabledRef = useRef(enabled);
  const overlayRef = useRef(overlay);
  const sensitivityRef = useRef(mouseSensitivity);
  enabledRef.current = enabled;
  overlayRef.current = overlay;
  sensitivityRef.current = mouseSensitivity;

  const findGround = (x, z, referenceGroundY, teleport = false) => {
    const groundMeshes = collisionRef.current.groundMeshes;
    if (!groundMeshes || groundMeshes.length === 0) return null;

    const startOffset = teleport ? 3 : MAX_STEP;
    const maxDistance = teleport ? 12 : MAX_STEP + MAX_DROP;
    rayOrigin.current.set(x, referenceGroundY + startOffset, z);
    raycaster.current.set(rayOrigin.current, DOWN);
    raycaster.current.far = maxDistance;
    groundHits.current.length = 0;
    raycaster.current.intersectObjects(groundMeshes, false, groundHits.current);
    return groundHits.current[0]?.point.y ?? null;
  };

  const applyTeleport = (teleport) => {
    if (!isPosition(teleport?.position)) return false;
    const [x, y, z] = teleport.position;
    const groundY = findGround(x, z, y - EYE_HEIGHT, true);
    if (groundY == null) return false;
    if (isPositionBlocked(x, z, groundY, collisionRef.current)) return false;

    camera.position.set(x, groundY + EYE_HEIGHT, z);
    targetGroundYRef.current = groundY;
    if (isPosition(teleport.lookAt)) {
      camera.lookAt(teleport.lookAt[0], camera.position.y, teleport.lookAt[2]);
    }
    return true;
  };

  useEffect(() => {
    const handlePointerLockChange = () => {
      setIsPointerLocked(document.pointerLockElement === gl.domElement);
    };
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      if (document.pointerLockElement === gl.domElement) {
        document.exitPointerLock();
      }
    };
  }, [gl, setIsPointerLocked]);

  useEffect(() => {
    if (!enabled && document.pointerLockElement === gl.domElement) {
      document.exitPointerLock();
    }
  }, [enabled, gl]);

  useEffect(() => {
    if (wasEnabledRef.current && !enabled && hasSpawnedRef.current) {
      savedPoseRef.current = {
        position: camera.position.clone(),
        quaternion: camera.quaternion.clone(),
      };
    } else if (!wasEnabledRef.current && enabled && savedPoseRef.current && !targetTeleport) {
      camera.position.copy(savedPoseRef.current.position);
      camera.quaternion.copy(savedPoseRef.current.quaternion);
      targetGroundYRef.current = camera.position.y - EYE_HEIGHT;
    }
    wasEnabledRef.current = enabled;
  }, [camera, enabled, targetTeleport]);

  useEffect(() => {
    const canvas = gl.domElement;
    const resetTouch = () => {
      touchLookIdRef.current = null;
    };

    const onTouchStart = (event) => {
      if (!enabledRef.current || overlayRef.current) return;
      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i];
        if (touch.clientX > window.innerWidth * 0.35 && touchLookIdRef.current === null) {
          touchLookIdRef.current = touch.identifier;
          lastTouchPosRef.current.x = touch.clientX;
          lastTouchPosRef.current.y = touch.clientY;
          break;
        }
      }
    };

    const onTouchMove = (event) => {
      if (touchLookIdRef.current === null) return;
      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i];
        if (touch.identifier !== touchLookIdRef.current) continue;
        const deltaX = touch.clientX - lastTouchPosRef.current.x;
        const deltaY = touch.clientY - lastTouchPosRef.current.y;
        lastTouchPosRef.current.x = touch.clientX;
        lastTouchPosRef.current.y = touch.clientY;
        eulerRef.current.setFromQuaternion(camera.quaternion);
        const sensitivity = 0.003 * sensitivityRef.current;
        eulerRef.current.y -= deltaX * sensitivity;
        eulerRef.current.x = THREE.MathUtils.clamp(
          eulerRef.current.x - deltaY * sensitivity,
          -Math.PI / 2.2,
          Math.PI / 2.2,
        );
        camera.quaternion.setFromEuler(eulerRef.current);
        break;
      }
    };

    const onTouchEnd = (event) => {
      for (let i = 0; i < event.changedTouches.length; i += 1) {
        const touch = event.changedTouches[i];
        if (touch.identifier === touchLookIdRef.current) {
          touchLookIdRef.current = null;
        }
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
    window.addEventListener('blur', resetTouch);
    window.addEventListener('pagehide', resetTouch);
    document.addEventListener('visibilitychange', resetTouch);

    return () => {
      resetTouch();
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('blur', resetTouch);
      window.removeEventListener('pagehide', resetTouch);
      document.removeEventListener('visibilitychange', resetTouch);
    };
  }, [camera, gl]);

  useFrame((_, delta) => {
    if (isXRSession) return;
    const collision = collisionRef.current;
    if (!collision.groundMeshes || collision.groundMeshes.length === 0) return;

    if (!hasSpawnedRef.current) {
      const initialTeleport = targetTeleport ?? { position: spawnPosition, lookAt: [0, 2, 0] };
      if (applyTeleport(initialTeleport)) {
        hasSpawnedRef.current = true;
        if (targetTeleport) clearTeleport();
      } else {
        spawnAttemptsRef.current += 1;
        if (spawnAttemptsRef.current > 60) {
          camera.position.set(spawnPosition[0], spawnPosition[1], spawnPosition[2]);
          targetGroundYRef.current = spawnPosition[1] - EYE_HEIGHT;
          hasSpawnedRef.current = true;
          if (targetTeleport) clearTeleport();
        }
      }
      return;
    }

    if (targetTeleport) {
      applyTeleport(targetTeleport);
      clearTeleport();
    }

    if (!movementEnabled) {
      lastInteractRef.current = keys.interact;
      return;
    }

    const actualDelta = Math.min(delta, MAX_FRAME_DELTA);
    camera.getWorldDirection(forwardVector.current);
    forwardVector.current.y = 0;
    forwardVector.current.normalize();
    sideVector.current.crossVectors(camera.up, forwardVector.current).normalize();

    keyboardVector.current.set(0, 0, 0);
    if (keys.forward) keyboardVector.current.add(forwardVector.current);
    if (keys.backward) keyboardVector.current.sub(forwardVector.current);
    if (keys.left) keyboardVector.current.add(sideVector.current);
    if (keys.right) keyboardVector.current.sub(sideVector.current);
    if (keyboardVector.current.lengthSq() > 1) keyboardVector.current.normalize();

    moveVector.current.copy(keyboardVector.current);
    // Baca input touch via getState agar joystick tidak memicu re-render player tiap frame.
    const { touchMoveVector, touchSprint: isTouchSprint } = useTourStore.getState();
    if (touchMoveVector.x !== 0 || touchMoveVector.y !== 0) {
      moveVector.current.addScaledVector(forwardVector.current, touchMoveVector.y);
      moveVector.current.addScaledVector(sideVector.current, -touchMoveVector.x);
    }
    if (moveVector.current.lengthSq() > 1) moveVector.current.normalize();

    const isMoving = moveVector.current.lengthSq() > 0.0001;
    const speed = keys.sprint || isTouchSprint ? SPRINT_SPEED : WALK_SPEED;
    moveVector.current.multiplyScalar(speed * actualDelta);

    let currentGroundY = targetGroundYRef.current ?? (camera.position.y - EYE_HEIGHT);
    const obstacleSource = collision.obstacleGrid ?? collision.obstacleBoxes;

    // Trigger jump bila player sedang di atas tanah
    if (keys.jump && isGroundedRef.current) {
      verticalVelocityRef.current = JUMP_VELOCITY;
      isGroundedRef.current = false;
    }

    if (isMoving) {
      if (moveVector.current.x !== 0) {
        const nextX = camera.position.x + moveVector.current.x;
        const nextGround = findGround(nextX, camera.position.z, currentGroundY);
        if (nextGround != null && !isPositionBlocked(nextX, camera.position.z, nextGround, obstacleSource)) {
          camera.position.x = nextX;
          currentGroundY = nextGround;
        }
      }
      if (moveVector.current.z !== 0) {
        const nextZ = camera.position.z + moveVector.current.z;
        const nextGround = findGround(camera.position.x, nextZ, currentGroundY);
        if (nextGround != null && !isPositionBlocked(camera.position.x, nextZ, nextGround, obstacleSource)) {
          camera.position.z = nextZ;
          currentGroundY = nextGround;
        }
      }
      targetGroundYRef.current = currentGroundY;
    }

    // Fisika vertikal (Lompat & Gravitasi)
    if (!isGroundedRef.current) {
      verticalVelocityRef.current -= GRAVITY * actualDelta;
      camera.position.y += verticalVelocityRef.current * actualDelta;
      const detectedGround = findGround(camera.position.x, camera.position.z, targetGroundYRef.current ?? (camera.position.y - EYE_HEIGHT));
      const landingY = (detectedGround ?? targetGroundYRef.current ?? currentGroundY) + EYE_HEIGHT;

      if (camera.position.y <= landingY) {
        camera.position.y = landingY;
        verticalVelocityRef.current = 0;
        isGroundedRef.current = true;
        if (detectedGround != null) targetGroundYRef.current = detectedGround;
      }
    } else {
      const targetCameraY = (targetGroundYRef.current ?? currentGroundY) + EYE_HEIGHT;
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        targetCameraY,
        1 - Math.exp(-GROUND_DAMPING * actualDelta),
      );
    }

    // Proximity check optimization: run when moved > 0.05 units
    const distMovedSq = lastProximityCheckPosRef.current.distanceToSquared(camera.position);
    if (distMovedSq > 0.0025) {
      lastProximityCheckPosRef.current.copy(camera.position);
      playerArray.current[0] = camera.position.x;
      playerArray.current[1] = camera.position.y;
      playerArray.current[2] = camera.position.z;
      const nearest = findNearestLocation(locations, playerArray.current);
      const entered = findEnteredLocation(locations, playerArray.current, currentLocation?.id);

      if (nearest?.id !== nearbyLocation?.id) setNearbyLocation(nearest);
      if (entered?.id !== currentLocation?.id) setCurrentLocation(entered);
    }

    if (keys.interact && !lastInteractRef.current && nearbyLocation) {
      openLocation(nearbyLocation);
    }
    lastInteractRef.current = keys.interact;
  });

  if (!enabled || overlay || isXRSession) return null;
  return (
    <PointerLockControls
      ref={controlsRef}
      domElement={gl.domElement}
      enabled={enabled && !overlay}
      pointerSpeed={mouseSensitivity}
    />
  );
}
