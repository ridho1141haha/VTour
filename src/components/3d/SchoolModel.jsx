import React, { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';

export const SCHOOL_MODEL_URL = `${import.meta.env.BASE_URL}models/smkn2_ska.glb`;

export function clearSchoolModelCache() {
  useGLTF.clear(SCHOOL_MODEL_URL);
}

export function SchoolModel({ onReady }) {
  const groupRef = useRef();
  const { scene } = useGLTF(SCHOOL_MODEL_URL);

  useEffect(() => {
    const colliders = [];
    const colliderRoot = groupRef.current;

    scene.traverse((child) => {
      if (child.isMesh) {
        // Model besar ini terlalu mahal bila semua mesh menggambar shadow map.
        child.castShadow = false;
        child.receiveShadow = false;
        colliders.push(child);
      }
    });

    if (colliderRoot) {
      colliderRoot.userData.tourColliders = colliders;
    }
    onReady?.();

    return () => {
      if (colliderRoot) colliderRoot.userData.tourColliders = [];
    };
  }, [onReady, scene]);

  return (
    <group ref={groupRef} name="school-model-collider-root">
      <primitive
        object={scene}
        position={[0, 0, 0]}
        scale={[1, 1, 1]}
      />
    </group>
  );
}

useGLTF.preload(SCHOOL_MODEL_URL);
