import React, { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { SpatialGrid } from '../../lib/collision';

export const SCHOOL_MODEL_URL = `${import.meta.env.BASE_URL}models/smkn2_ska.glb`;
export const WALKABLE_MESH_PATTERN = /^(GROUND|Rumput|Rumfut|Plane|FLOOR|INT_Floor|K_Lantai|Lantai|TANGGA|JALAN|ASPAL|PATOKAN|SEMEN|KERAMIK|PAVING|TROTOAR)/i;

export function clearSchoolModelCache() {
  useGLTF.clear(SCHOOL_MODEL_URL);
}

function addObstacleBoxes(mesh, obstacleBoxes, instanceMatrix, worldMatrix) {
  if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
  const geometryBox = mesh.geometry.boundingBox;
  if (!geometryBox) return;

  // Pintu, kaca, dan penanda tidak menghalangi jalur pemain.
  if (/^(ROOF|ATAP|CEILING|PLAFON|GENTENG|PINTU|DOOR|CUTPINTU|JENDELA|WINDOW|FRAME|GLASS|KACA|REF_)/i.test(mesh.name)) {
    return;
  }

  const worldBox = geometryBox.clone().applyMatrix4(mesh.matrixWorld);

  if (mesh.isInstancedMesh) {
    for (let index = 0; index < mesh.count; index += 1) {
      mesh.getMatrixAt(index, instanceMatrix);
      worldMatrix.multiplyMatrices(mesh.matrixWorld, instanceMatrix);
      const obstacleBox = geometryBox.clone().applyMatrix4(worldMatrix);
      obstacleBox.mesh = mesh;
      obstacleBoxes.push(obstacleBox);
    }
    return;
  }

  worldBox.mesh = mesh;
  obstacleBoxes.push(worldBox);
}

export function SchoolModel({ collisionRef, onReady }) {
  const { scene } = useGLTF(SCHOOL_MODEL_URL, true);

  useEffect(() => {
    const groundMeshes = [];
    const obstacleBoxes = [];
    const adjustedGlassMaterials = new Set();
    const instanceMatrix = new THREE.Matrix4();
    const worldMatrix = new THREE.Matrix4();

    scene.updateWorldMatrix(true, true);
    scene.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = false;
      child.receiveShadow = false;

      // Pastikan material dinding/atap/bangunan bersifat DoubleSide agar tidak tembus pandang/bolong dari dalam
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      for (const material of materials) {
        if (!material) continue;

        // Jadikan DoubleSide agar bagian dalam gedung tidak bolong/tembus pandang
        if (material.side !== THREE.DoubleSide) {
          material.side = THREE.DoubleSide;
          material.needsUpdate = true;
        }

        // transmission > 0 memicu render pass tambahan seluruh scene per frame;
        // ganti dengan opacity biasa agar kaca tetap terlihat tanpa pass ganda.
        if (material.transmission > 0 && !adjustedGlassMaterials.has(material)) {
          adjustedGlassMaterials.add(material);
          material.transmission = 0;
          material.transparent = true;
          material.opacity = 0.35;
          material.needsUpdate = true;
        }
      }

      if (WALKABLE_MESH_PATTERN.test(child.name)) {
        groundMeshes.push(child);
      } else {
        addObstacleBoxes(child, obstacleBoxes, instanceMatrix, worldMatrix);
      }
    });

    const obstacleGrid = new SpatialGrid(obstacleBoxes);
    collisionRef.current = { groundMeshes, obstacleBoxes, obstacleGrid };

    if (import.meta.env.DEV) {
      console.debug('[tour] collision siap', {
        groundMeshes: groundMeshes.length,
        obstacleBoxes: obstacleBoxes.length,
        glassMaterials: adjustedGlassMaterials.size,
      });
    }

    onReady?.({ groundMeshes: groundMeshes.length, obstacleBoxes: obstacleBoxes.length });

    return () => {
      collisionRef.current = { groundMeshes: [], obstacleBoxes: [], obstacleGrid: null };
    };
  }, [collisionRef, onReady, scene]);

  return <primitive object={scene} />;
}

useGLTF.preload(SCHOOL_MODEL_URL, true);
