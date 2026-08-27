import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useXRStore } from '@react-three/xr';
import * as THREE from 'three';
import { useTourStore } from '../../stores/useTourStore';
import { useKeyboard } from '../../hooks/useKeyboard';
import { findEnteredLocation, findNearestLocation, isPosition } from '../../lib/locationUtils';
import { isPositionBlocked } from '../../lib/collision';

const WALK_SPEED = 3.5;
const SPRINT_SPEED = 6.0;
const MAX_STEP = 0.5;
const MAX_DROP = 0.75;
const DOWN = new THREE.Vector3(0, -1, 0);
const DEAD_ZONE = 0.15;
const DEFAULT_SPAWN = [0, 0, 12];

/**
 * XRPlayer — VR locomotion & interaction controller.
 *
 * Menggerakkan `XROrigin` (origin pemain di dunia virtual 3D) saat WebXR aktif.
 * Mendukung:
 * 1. VR Motion Controller Thumbsticks (Left: Locomotion, Right: Snap-turn)
 * 2. Native WebXR Gamepad axes (axes[2]/[3] & axes[0]/[1])
 * 3. Keyboard WASD / Arrow keys fallback (Shift to sprint, E to interact)
 * 4. Ground raycasting & SpatialGrid obstacle collision detection
 * 5. Proximity POI detection & right trigger / E key interaction
 */
export function XRPlayer({ collisionRef, enabled, originRef }) {
  const { camera } = useThree();
  const xrStore = useXRStore();
  const isXRSession = xrStore.getState().session != null;

  const overlay = useTourStore((s) => s.overlay);
  const locations = useTourStore((s) => s.locations);
  const nearbyLocation = useTourStore((s) => s.nearbyLocation);
  const setNearbyLocation = useTourStore((s) => s.setNearbyLocation);
  const currentLocation = useTourStore((s) => s.currentLocation);
  const setCurrentLocation = useTourStore((s) => s.setCurrentLocation);
  const openLocation = useTourStore((s) => s.openLocation);
  const targetTeleport = useTourStore((s) => s.targetTeleport);
  const clearTeleport = useTourStore((s) => s.clearTeleport);

  // Keyboard controls fallback for testing in VR on PC/emulator
  const keys = useKeyboard(enabled && isXRSession && !overlay);

  const hasSpawnedRef = useRef(false);
  const targetGroundYRef = useRef(null);
  const lastProximityCheckPosRef = useRef(new THREE.Vector3(Infinity, Infinity, Infinity));
  const playerArray = useRef([0, 0, 0]);
  const worldPos = useRef(new THREE.Vector3());
  const rayOrigin = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster(undefined, DOWN, 0, MAX_STEP + MAX_DROP + 0.1));
  const groundHits = useRef([]);
  const forwardVec = useRef(new THREE.Vector3());
  const sideVec = useRef(new THREE.Vector3());
  const moveVec = useRef(new THREE.Vector3());

  // Snap-turn state
  const lastSnapRef = useRef(false);
  const lastInteractRef = useRef(false);

  // Sync initial position from desktop camera when entering VR
  useEffect(() => {
    if (isXRSession && originRef?.current) {
      originRef.current.position.set(camera.position.x, 0, camera.position.z);
      targetGroundYRef.current = 0;
    }
  }, [camera, isXRSession, originRef]);

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
    if (!originRef?.current || !isPosition(teleport?.position)) return false;
    const [x, y, z] = teleport.position;
    const groundY = findGround(x, z, y, true);
    if (groundY == null) return false;
    const obstacleSource = collisionRef.current.obstacleGrid ?? collisionRef.current.obstacleBoxes;
    if (isPositionBlocked(x, z, groundY, obstacleSource)) return false;
    originRef.current.position.set(x, groundY, z);
    targetGroundYRef.current = groundY;
    return true;
  };

  useFrame((_, delta) => {
    if (!enabled || !isXRSession || !originRef?.current) return;
    const origin = originRef.current;
    const collision = collisionRef.current;
    if (!collision.groundMeshes || collision.groundMeshes.length === 0) return;

    // Spawn awal jika belum
    if (!hasSpawnedRef.current) {
      const initialTeleport = targetTeleport ?? { position: DEFAULT_SPAWN };
      if (applyTeleport(initialTeleport)) {
        hasSpawnedRef.current = true;
        if (targetTeleport) clearTeleport();
      }
      return;
    }

    // Teleport dari store
    if (targetTeleport) {
      applyTeleport(targetTeleport);
      clearTeleport();
    }

    const actualDelta = Math.min(delta, 0.05);

    // === 1. Baca Controller Thumbsticks ===
    let moveX = 0;
    let moveZ = 0;
    let turnX = 0;
    let isSprint = keys.sprint;
    let triggerPressed = false;

    // A. Baca via @pmndrs/xr store
    const { inputSourceStates } = xrStore.getState();
    if (Array.isArray(inputSourceStates)) {
      for (const state of inputSourceStates) {
        if (state.inputSource?.targetRayMode === 'tracked-pointer' || state.type === 'controller') {
          const handedness = state.inputSource?.handedness;
          const thumbstick = state.gamepad?.['xr-standard-thumbstick'] || state.gamepad?.thumbstick;
          const trigger = state.gamepad?.['xr-standard-trigger'] || state.gamepad?.trigger;

          if (handedness === 'left') {
            const tx = thumbstick?.xAxis ?? 0;
            const ty = thumbstick?.yAxis ?? 0;
            if (Math.abs(tx) > DEAD_ZONE) moveX += tx;
            if (Math.abs(ty) > DEAD_ZONE) moveZ += ty;
            if (thumbstick?.button?.pressed) isSprint = true;
          } else if (handedness === 'right') {
            const rx = thumbstick?.xAxis ?? 0;
            if (Math.abs(rx) > DEAD_ZONE) turnX += rx;
            if (trigger?.pressed) triggerPressed = true;
          }
        }
      }
    }

    // B. Baca via native WebXR Gamepad API (fallback emulator & browser headsets)
    const session = xrStore.getState().session;
    if (session?.inputSources) {
      for (const inputSource of session.inputSources) {
        const gamepad = inputSource.gamepad;
        if (!gamepad) continue;

        const handedness = inputSource.handedness;
        // axes[2]/[3] = standard thumbstick, axes[0]/[1] = touchpad/thumbstick fallback
        const ax = gamepad.axes[2] ?? gamepad.axes[0] ?? 0;
        const ay = gamepad.axes[3] ?? gamepad.axes[1] ?? 0;

        if (handedness === 'left') {
          if (Math.abs(ax) > DEAD_ZONE && moveX === 0) moveX += ax;
          if (Math.abs(ay) > DEAD_ZONE && moveZ === 0) moveZ += ay;
          if (gamepad.buttons[3]?.pressed) isSprint = true;
        } else if (handedness === 'right') {
          if (Math.abs(ax) > DEAD_ZONE && turnX === 0) turnX += ax;
          if (gamepad.buttons[0]?.pressed) triggerPressed = true;
        }
      }
    }

    // C. Baca via Keyboard (WASD)
    if (keys.forward) moveZ -= 1;
    if (keys.backward) moveZ += 1;
    if (keys.left) moveX -= 1;
    if (keys.right) moveX += 1;

    // === 2. Snap-turn (Controller Kanan) ===
    const shouldSnap = Math.abs(turnX) > 0.55;
    if (shouldSnap && !lastSnapRef.current) {
      const angle = turnX > 0 ? -Math.PI / 4 : Math.PI / 4;
      origin.rotation.y += angle;
    }
    lastSnapRef.current = shouldSnap;

    // === 3. Hitung Vektor Pergerakan Berdasarkan Orientasi Kepala (Head Direction) ===
    camera.getWorldDirection(forwardVec.current);
    forwardVec.current.y = 0;
    forwardVec.current.normalize();
    sideVec.current.crossVectors(camera.up, forwardVec.current).normalize();

    moveVec.current.set(0, 0, 0);
    if (moveZ !== 0) moveVec.current.addScaledVector(forwardVec.current, -moveZ);
    if (moveX !== 0) moveVec.current.addScaledVector(sideVec.current, -moveX);

    if (moveVec.current.lengthSq() > 1) moveVec.current.normalize();

    const isMoving = moveVec.current.lengthSq() > 0.0001;
    const speed = isSprint ? SPRINT_SPEED : WALK_SPEED;
    moveVec.current.multiplyScalar(speed * actualDelta);

    let currentGroundY = targetGroundYRef.current ?? origin.position.y;
    const obstacleSource = collision.obstacleGrid ?? collision.obstacleBoxes;

    // === 4. Collision & Step Ground Finding ===
    if (isMoving) {
      if (moveVec.current.x !== 0) {
        const nextX = origin.position.x + moveVec.current.x;
        const nextGround = findGround(nextX, origin.position.z, currentGroundY);
        if (nextGround != null && !isPositionBlocked(nextX, origin.position.z, nextGround, obstacleSource)) {
          origin.position.x = nextX;
          currentGroundY = nextGround;
        }
      }
      if (moveVec.current.z !== 0) {
        const nextZ = origin.position.z + moveVec.current.z;
        const nextGround = findGround(origin.position.x, nextZ, currentGroundY);
        if (nextGround != null && !isPositionBlocked(origin.position.x, nextZ, nextGround, obstacleSource)) {
          origin.position.z = nextZ;
          currentGroundY = nextGround;
        }
      }
      targetGroundYRef.current = currentGroundY;
    }

    // Smooth vertical ground follow
    origin.position.y = THREE.MathUtils.lerp(
      origin.position.y,
      targetGroundYRef.current ?? currentGroundY,
      1 - Math.exp(-20 * actualDelta),
    );

    // === 5. Proximity Check untuk Titik Lokasi & Multiplayer ===
    camera.getWorldPosition(worldPos.current);
    const distMovedSq = lastProximityCheckPosRef.current.distanceToSquared(worldPos.current);
    if (distMovedSq > 0.0025) {
      lastProximityCheckPosRef.current.copy(worldPos.current);
      playerArray.current[0] = worldPos.current.x;
      playerArray.current[1] = worldPos.current.y;
      playerArray.current[2] = worldPos.current.z;
      const nearest = findNearestLocation(locations, playerArray.current);
      const entered = findEnteredLocation(locations, playerArray.current, currentLocation?.id);
      if (nearest?.id !== nearbyLocation?.id) setNearbyLocation(nearest);
      if (entered?.id !== currentLocation?.id) setCurrentLocation(entered);
    }

    // === 6. Interaksi (Right Trigger / E Key) ===
    const isInteract = triggerPressed || keys.interact;
    if (isInteract && !lastInteractRef.current && nearbyLocation) {
      openLocation(nearbyLocation);
    }
    lastInteractRef.current = isInteract;
  });

  return null;
}
