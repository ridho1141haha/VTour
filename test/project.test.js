import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

import viteConfig from '../vite.config.js';
import { SpatialGrid, circleIntersectsBoxXZ, isPositionBlocked } from '../src/lib/collision.js';
import { getLocationsDataUrl } from '../src/lib/locationData.js';
import {
  filterLocations,
  findDeepLinkedLocation,
  findEnteredLocation,
  findNearestLocation,
  getDeepLinkLocationId,
  isPosition,
  publicAssetUrl,
  resolveTeleportPosition,
  validateLocations,
} from '../src/lib/locationUtils.js';
import { useTourStore } from '../src/stores/useTourStore.js';

const locationsPath = new URL('../public/data/locations.json', import.meta.url);
const modelPath = new URL('../public/models/smkn2_ska.glb', import.meta.url);
const playerPath = new URL('../src/components/3d/FirstPersonPlayer.jsx', import.meta.url);
const schoolModelPath = new URL('../src/components/3d/SchoolModel.jsx', import.meta.url);
const locations = validateLocations(JSON.parse(await readFile(locationsPath, 'utf8')));

const EXPECTED_IDS = [
  'gerbang-pos', 'gedung-putih', 'technopark', 'gna-lobby', 'aula-te-samsung',
  'pplg', 'perpustakaan', 'dpib-tkl-tkp', 'masjid', 'uks', 'kantin-kopsis',
  'lab-tjkt', 'um', 'bengkel-to-1', 'bengkel-to-2', 'teori-to', 'bengkel-tm',
  'pembuangan-akhir', 'lapvol', 'labas', 'tpfl', 'kamar-mandi-lab',
  'gedung-organisasi',
];

test('build dan static path aman pada deployment subpath', () => {
  assert.equal(viteConfig.base, './');
  assert.equal(getLocationsDataUrl('/virtual-tour/'), '/virtual-tour/data/locations.json');
  assert.equal(publicAssetUrl('images/locations/pplg/01.webp', '/virtual-tour/'), '/virtual-tour/images/locations/pplg/01.webp');
  assert.equal(publicAssetUrl('https://example.test/photo.webp', '/virtual-tour/'), 'https://example.test/photo.webp');
});

test('dataset memuat tepat 23 location ID final dan schema optional yang valid', () => {
  assert.deepEqual(locations.map(({ id }) => id), EXPECTED_IDS);
  assert.equal(new Set(locations.map(({ id }) => id)).size, 23);
  assert.equal(locations.filter(({ anchorStatus }) => anchorStatus === 'calibrated').length, 9);

  for (const location of locations) {
    assert.ok(location.name && location.shortName && location.category && location.description);
    assert.ok(['calibrated', 'pending'].includes(location.anchorStatus));
    assert.ok(Number.isFinite(location.interactionRadius) && location.interactionRadius > 0);
    assert.ok(Number.isFinite(location.locationRadius) && location.locationRadius > location.interactionRadius);
    assert.ok(Array.isArray(location.details));
    assert.ok(Array.isArray(location.facilities));
    assert.ok(Array.isArray(location.images));

    if (location.anchorStatus === 'calibrated') {
      assert.ok(isPosition(location.position));
      assert.ok(isPosition(resolveTeleportPosition(location)));
      assert.ok(location.mapPosition && Number.isFinite(location.mapPosition.x) && Number.isFinite(location.mapPosition.y));
    } else {
      assert.equal(location.position, null);
      assert.equal(location.teleportPosition, null);
      assert.equal(location.mapPosition, null);
    }
  }
});

test('64 foto asli terkurasi tersedia sebagai WebP gallery dan thumbnail', async () => {
  const images = locations.flatMap((location) => location.images);
  assert.equal(images.length, 64);
  assert.deepEqual(
    locations.filter((location) => location.images.length === 0).map((location) => location.id),
    ['perpustakaan', 'pembuangan-akhir', 'labas'],
  );

  let totalBytes = 0;
  for (const image of images) {
    assert.ok(image.alt && image.caption);
    assert.ok(!/unsplash|^https?:/i.test(`${image.thumbnail}${image.src}`));

    for (const path of [image.thumbnail, image.src]) {
      const file = new URL(`../public/${path}`, import.meta.url);
      const header = await readFile(file, { encoding: null });
      const fileStat = await stat(file);
      assert.equal(header.toString('ascii', 0, 4), 'RIFF');
      assert.equal(header.toString('ascii', 8, 12), 'WEBP');
      assert.ok(fileStat.size > 1_000 && fileStat.size < 600_000, `${path} berukuran tidak wajar`);
      totalBytes += fileStat.size;
    }
  }
  assert.ok(totalBytes < 12 * 1024 * 1024);
});

test('search membaca nama, kategori, deskripsi, details, dan facilities', () => {
  assert.deepEqual(filterLocations(locations, 'lab tjkt').map(({ id }) => id), ['lab-tjkt']);
  assert.ok(filterLocations(locations, 'bengkel', 'Bengkel').length >= 3);
  assert.equal(filterLocations(locations, '', 'Semua').length, 23);

  const fixture = [{
    id: 'fixture', name: 'Contoh', shortName: 'C', category: 'Fasilitas',
    description: '', details: [{ label: 'Jam', value: 'pagi hari' }], facilities: ['jaringan lokal'],
  }];
  assert.equal(filterLocations(fixture, 'pagi').length, 1);
  assert.equal(filterLocations(fixture, 'jaringan lokal').length, 1);
});

test('nearest POI deterministik dan location enter memakai hysteresis', () => {
  const farther = { id: 'farther', position: [4, 1.7, 0], interactionRadius: 4.5, locationRadius: 12 };
  const nearer = { id: 'nearer', position: [1, 1.7, 0], interactionRadius: 4.5, locationRadius: 12 };
  assert.equal(findNearestLocation([farther, nearer], [0, 1.7, 0]).id, 'nearer');
  assert.equal(findNearestLocation([nearer, farther], [0, 1.7, 0]).id, 'nearer');
  assert.equal(findNearestLocation([nearer], [20, 1.7, 0]), null);
  assert.equal(findNearestLocation([{ ...nearer, position: [1, 8, 0] }], [0, 1.7, 0]), null);
  assert.equal(findEnteredLocation([nearer], [13.5, 1.7, 0]), null);
  assert.equal(findEnteredLocation([nearer], [13.5, 1.7, 0], 'nearer').id, 'nearer');
  assert.equal(findEnteredLocation([{ ...nearer, position: [1, 10, 0] }], [1, 1.7, 0]), null);
});

test('deep link baru, alias legacy, dan ID invalid ditangani aman', () => {
  assert.equal(getDeepLinkLocationId('?location=pplg'), 'pplg');
  assert.equal(getDeepLinkLocationId('?room=pplg'), 'pplg');
  assert.equal(getDeepLinkLocationId('?location='), null);
  assert.equal(findDeepLinkedLocation(locations, '?location=pplg').id, 'pplg');
  assert.equal(findDeepLinkedLocation(locations, '?location=tidak-ada'), null);
});

test('teleport memprioritaskan teleportPosition dan fallback hanya ke position valid', () => {
  assert.deepEqual(resolveTeleportPosition({ position: [1, 2, 3], teleportPosition: [4, 5, 6] }), [4, 5, 6]);
  assert.deepEqual(resolveTeleportPosition({ position: [1, 0, 3] }), [1, 0, 3]);
  assert.equal(resolveTeleportPosition({ position: null }), null);
  assert.equal(resolveTeleportPosition({ position: [1, 2] }), null);
});

test('collision circle-vs-AABB dan SpatialGrid menangani obstacle secara konsisten', () => {
  const box = { min: { x: 1, y: 0, z: 1 }, max: { x: 3, y: 3, z: 3 } };
  assert.equal(circleIntersectsBoxXZ(0.8, 2, 0.35, box), true);
  assert.equal(circleIntersectsBoxXZ(0, 0, 0.35, box), false);
  assert.equal(isPositionBlocked(0.8, 2, 0, [box]), true);
  assert.equal(isPositionBlocked(0.8, 2, 5, [box]), false);

  const grid = new SpatialGrid([box], 8);
  assert.equal(isPositionBlocked(0.8, 2, 0, grid), true);
  assert.equal(isPositionBlocked(0.8, 2, 5, grid), false);
  assert.equal(isPositionBlocked(100, 100, 0, grid), false);
});

test('mouse-look dan status pointer lock memakai canvas yang sama', async () => {
  const source = await readFile(playerPath, 'utf8');
  assert.match(source, /domElement=\{gl\.domElement\}/);
  assert.match(source, /document\.pointerLockElement === gl\.domElement/);
});

test('material kaca tidak memicu transmission pass ganda', async () => {
  const source = await readFile(schoolModelPath, 'utf8');
  assert.match(source, /material\.transmission = 0/);
  assert.match(source, /material\.needsUpdate = true/);
});

test('overlay Zustand eksklusif dan teleport menutup overlay', () => {
  const calibrated = locations.find(({ id }) => id === 'pplg');
  const pending = locations.find(({ id }) => id === 'perpustakaan');
  useTourStore.setState({
    overlay: null,
    cameraMode: 'fps',
    isPointerLocked: true,
    nearbyLocation: calibrated,
    currentLocation: calibrated,
    targetTeleport: null,
  });

  useTourStore.getState().openSearch();
  assert.deepEqual(useTourStore.getState().overlay, { type: 'search' });
  useTourStore.getState().openLocation(calibrated);
  assert.equal(useTourStore.getState().overlay.type, 'location');
  useTourStore.getState().setIsPointerLocked(true);
  assert.equal(useTourStore.getState().isPointerLocked, false);

  assert.equal(useTourStore.getState().teleportTo(pending), false);
  assert.equal(useTourStore.getState().overlay.type, 'location');
  assert.equal(useTourStore.getState().teleportTo(calibrated), true);
  assert.equal(useTourStore.getState().overlay, null);
  assert.deepEqual(useTourStore.getState().targetTeleport.position, calibrated.teleportPosition);

  useTourStore.getState().setCameraMode('orbit');
  assert.equal(useTourStore.getState().nearbyLocation, null);
  assert.equal(useTourStore.getState().currentLocation, null);
  useTourStore.getState().resetExplorationState();
  assert.equal(useTourStore.getState().overlay, null);
  assert.equal(useTourStore.getState().isPointerLocked, false);
});

test('aset model utama teroptimasi dan valid secara struktural', async () => {
  const model = await readFile(modelPath);
  const modelStat = await stat(modelPath);
  const jsonLength = model.readUInt32LE(12);
  const gltf = JSON.parse(model.subarray(20, 20 + jsonLength).toString('utf8').trim());

  assert.equal(model.toString('ascii', 0, 4), 'glTF');
  assert.equal(model.readUInt32LE(8), model.length);
  assert.ok(modelStat.size < 15 * 1024 * 1024);
  assert.ok(gltf.extensionsUsed.includes('EXT_meshopt_compression'));
  assert.ok(gltf.extensionsUsed.includes('EXT_mesh_gpu_instancing'));
  assert.ok(gltf.meshes.length >= 400);
  const nodeNames = new Set((gltf.nodes ?? []).map(({ name }) => name));
  assert.ok(nodeNames.has('GROUNDMAIN'));
  assert.ok([...nodeNames].some((name) => name?.startsWith('LantaiPPLG')));

  for (const material of gltf.materials ?? []) {
    const pbr = material.pbrMetallicRoughness ?? {};
    for (const factor of [pbr.metallicFactor, pbr.roughnessFactor]) {
      if (factor != null) assert.ok(factor >= 0 && factor <= 1);
    }
  }
});
