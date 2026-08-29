import * as THREE from 'three';

export const PLAYER_RADIUS = 0.28;
export const PLAYER_HEIGHT = 1.8;

const COLLISION_DIRECTIONS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
].map(([x, z]) => new THREE.Vector3(x, 0, z).normalize());

const rayOrigin = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const rayHits = [];

export function circleIntersectsBoxXZ(x, z, radius, box) {
  const closestX = Math.max(box.min.x, Math.min(x, box.max.x));
  const closestZ = Math.max(box.min.z, Math.min(z, box.max.z));
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

export class SpatialGrid {
  constructor(boxes, cellSize = 8) {
    this.cellSize = cellSize;
    this.grid = new Map();
    this.boxes = boxes;
    for (let i = 0; i < boxes.length; i += 1) {
      const box = boxes[i];
      const minX = Math.floor(box.min.x / cellSize);
      const maxX = Math.floor(box.max.x / cellSize);
      const minZ = Math.floor(box.min.z / cellSize);
      const maxZ = Math.floor(box.max.z / cellSize);
      for (let cx = minX; cx <= maxX; cx += 1) {
        for (let cz = minZ; cz <= maxZ; cz += 1) {
          const key = `${cx}:${cz}`;
          let cell = this.grid.get(key);
          if (!cell) {
            cell = [];
            this.grid.set(key, cell);
          }
          cell.push(box);
        }
      }
    }
  }

  getPotentialObstacles(x, z, radius = PLAYER_RADIUS) {
    const minX = Math.floor((x - radius) / this.cellSize);
    const maxX = Math.floor((x + radius) / this.cellSize);
    const minZ = Math.floor((z - radius) / this.cellSize);
    const maxZ = Math.floor((z + radius) / this.cellSize);

    if (minX === maxX && minZ === maxZ) {
      return this.grid.get(`${minX}:${minZ}`) || [];
    }

    const result = new Set();
    for (let cx = minX; cx <= maxX; cx += 1) {
      for (let cz = minZ; cz <= maxZ; cz += 1) {
        const cell = this.grid.get(`${cx}:${cz}`);
        if (cell) {
          for (let i = 0; i < cell.length; i += 1) {
            result.add(cell[i]);
          }
        }
      }
    }
    return result;
  }
}

export function isPositionBlocked(x, z, groundY, obstacleSource, radius = PLAYER_RADIUS) {
  const playerTop = groundY + PLAYER_HEIGHT;
  const boxes = obstacleSource?.obstacleGrid instanceof SpatialGrid
    ? obstacleSource.obstacleGrid.getPotentialObstacles(x, z, radius)
    : obstacleSource instanceof SpatialGrid
    ? obstacleSource.getPotentialObstacles(x, z, radius)
    : (obstacleSource || []);
  const obstacles = Array.isArray(boxes) ? boxes : [...boxes];

  const meshes = [...new Set(obstacles.map((box) => box.mesh).filter(Boolean))];
  if (meshes.length > 0) {
    rayOrigin.set(x, groundY + PLAYER_HEIGHT / 2, z);
    raycaster.far = radius;

    for (const direction of COLLISION_DIRECTIONS) {
      raycaster.set(rayOrigin, direction);
      rayHits.length = 0;
      raycaster.intersectObjects(meshes, false, rayHits);
      if (rayHits[0]?.distance <= radius) return true;
    }

    return false;
  }

  for (const box of obstacles) {
    if (box.max.y <= groundY + 0.35 || box.min.y >= playerTop) continue;
    if (circleIntersectsBoxXZ(x, z, radius, box)) return true;
  }

  return false;
}
