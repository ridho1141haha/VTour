import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

export function SchoolModel() {
  const { scene } = useGLTF('/models/smkn2_ska.glb');

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <primitive 
      object={scene} 
      position={[0, 0, 0]} 
      scale={[1, 1, 1]} 
    />
  );
}

useGLTF.preload('/models/smkn2_ska.glb');
