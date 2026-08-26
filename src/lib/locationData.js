import { hydrateLocationAssets, validateLocations } from './locationUtils.js';

export const LOCATIONS_DATA_PATH = 'data/locations.json';

export function getLocationsDataUrl(baseUrl = './') {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${normalizedBase}${LOCATIONS_DATA_PATH}`;
}

export async function loadLocations({ signal, baseUrl = import.meta.env?.BASE_URL ?? './' } = {}) {
  const response = await fetch(getLocationsDataUrl(baseUrl), { signal, cache: 'no-cache' });
  if (!response.ok) throw new Error(`Data lokasi gagal dimuat (${response.status}).`);

  const locations = validateLocations(await response.json());
  return hydrateLocationAssets(locations, baseUrl);
}
