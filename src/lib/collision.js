export const PLAYER_RADIUS = 0.35;
export const PLAYER_HEIGHT = 1.8;

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
  const boxes = obstacleSource instanceof SpatialGrid
    ? obstacleSource.getPotentialObstacles(x, z, radius)
    : (obstacleSource || []);

  for (const box of boxes) {
    if (box.max.y <= groundY + 0.08 || box.min.y >= playerTop) continue;
    if (circleIntersectsBoxXZ(x, z, radius, box)) return true;
  }

  return false;
}
