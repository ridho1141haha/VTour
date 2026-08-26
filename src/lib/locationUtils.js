export function isPosition(value) {
  return Array.isArray(value) && value.length === 3 && value.every(Number.isFinite);
}

export function resolveTeleportPosition(location) {
  if (isPosition(location?.teleportPosition)) return location.teleportPosition;
  if (isPosition(location?.position)) return location.position;
  return null;
}

export function findNearestLocation(locations, playerPosition, maxVerticalDistance = 2.5) {
  if (!isPosition(playerPosition)) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  for (const location of locations) {
    if (!isPosition(location.position)) continue;
    const verticalDistance = Math.abs(playerPosition[1] - location.position[1]);
    if (verticalDistance > maxVerticalDistance) continue;

    const distance = Math.hypot(
      playerPosition[0] - location.position[0],
      playerPosition[2] - location.position[2],
    );
    const radius = location.interactionRadius ?? 4.5;

    if (distance <= radius && distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function findEnteredLocation(locations, playerPosition, previousLocationId = null, maxVerticalDistance = 3.5) {
  if (!isPosition(playerPosition)) return null;

  let nearest = null;
  let nearestDistance = Infinity;

  // Check if still within previous location's hysteresis exit radius
  const prevLoc = previousLocationId ? locations.find((loc) => loc.id === previousLocationId) : null;
  if (prevLoc && isPosition(prevLoc.position)) {
    const vDist = Math.abs(playerPosition[1] - prevLoc.position[1]);
    if (vDist <= maxVerticalDistance) {
      const dist = Math.hypot(
        playerPosition[0] - prevLoc.position[0],
        playerPosition[2] - prevLoc.position[2],
      );
      const exitRadius = (prevLoc.locationRadius ?? 12) + 2;
      if (dist <= exitRadius) {
        nearest = prevLoc;
        nearestDistance = dist;
      }
    }
  }

  for (const location of locations) {
    if (!isPosition(location.position)) continue;
    const verticalDistance = Math.abs(playerPosition[1] - location.position[1]);
    if (verticalDistance > maxVerticalDistance) continue;

    const distance = Math.hypot(
      playerPosition[0] - location.position[0],
      playerPosition[2] - location.position[2],
    );
    const radius = location.locationRadius ?? 12;

    if (distance <= radius && distance < nearestDistance) {
      nearest = location;
      nearestDistance = distance;
    }
  }

  return nearest;
}

export function filterLocations(locations, query = '', category = 'Semua') {
  const normalizedQuery = query.trim().toLocaleLowerCase('id');

  return locations.filter((location) => {
    if (category !== 'Semua' && location.category !== category) return false;
    if (!normalizedQuery) return true;

    const searchable = [
      location.name,
      location.shortName,
      location.category,
      location.description,
      location.building,
      ...(location.details ?? []).flatMap((detail) => (
        typeof detail === 'string' ? detail : [detail.label, detail.value]
      )),
      ...(location.facilities ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('id');

    return searchable.includes(normalizedQuery);
  });
}

export function getDeepLinkLocationId(search) {
  const params = new URLSearchParams(search);
  return params.get('location') || params.get('room') || null;
}

export function findDeepLinkedLocation(locations, search) {
  const id = getDeepLinkLocationId(search);
  return id ? locations.find((location) => location.id === id) ?? null : null;
}

export function publicAssetUrl(path, baseUrl = './') {
  if (!path || /^(https?:)?\/\//i.test(path)) return path;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${path.replace(/^\//, '')}`;
}

export function validateLocations(data) {
  if (!Array.isArray(data)) throw new Error('Data lokasi harus berupa array.');

  const ids = new Set();
  for (const location of data) {
    if (!location?.id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(location.id)) {
      throw new Error('Setiap lokasi harus memiliki ID slug yang valid.');
    }
    if (ids.has(location.id)) throw new Error(`ID lokasi duplikat: ${location.id}`);
    ids.add(location.id);

    if (!location.name || !location.shortName || !location.category || !location.description) {
      throw new Error(`Metadata wajib belum lengkap: ${location.id}`);
    }
    if (location.anchorStatus === 'calibrated' && !isPosition(location.position)) {
      throw new Error(`Lokasi terkalibrasi tanpa posisi valid: ${location.id}`);
    }
    if (location.position != null && !isPosition(location.position)) {
      throw new Error(`Posisi lokasi tidak valid: ${location.id}`);
    }
    if (location.teleportPosition != null && !isPosition(location.teleportPosition)) {
      throw new Error(`Posisi teleport tidak valid: ${location.id}`);
    }
    if (!Array.isArray(location.images)) {
      throw new Error(`Galeri lokasi harus berupa array: ${location.id}`);
    }
    for (const image of location.images) {
      if (!image.thumbnail || !image.src || !image.alt) {
        throw new Error(`Data foto tidak lengkap: ${location.id}`);
      }
    }
  }

  return data;
}

export function hydrateLocationAssets(locations, baseUrl) {
  return locations.map((location) => ({
    ...location,
    images: location.images.map((image) => ({
      ...image,
      thumbnail: publicAssetUrl(image.thumbnail, baseUrl),
      src: publicAssetUrl(image.src, baseUrl),
    })),
  }));
}
