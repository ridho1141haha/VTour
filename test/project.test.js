import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

import viteConfig from '../vite.config.js';
import { useTourStore } from '../src/stores/useTourStore.js';

const roomsPath = new URL('../public/data/rooms.json', import.meta.url);
const modelPath = new URL('../public/models/smkn2_ska.glb', import.meta.url);

test('build memakai URL relatif agar aman di subpath', () => {
  assert.equal(viteConfig.base, './');
});

test('data ruangan valid dan memiliki ID unik', async () => {
  const rooms = JSON.parse(await readFile(roomsPath, 'utf8'));

  assert.ok(Array.isArray(rooms) && rooms.length > 0);
  assert.equal(new Set(rooms.map(({ id }) => id)).size, rooms.length);

  for (const room of rooms) {
    assert.ok(room.id && room.name && room.shortName);
    assert.ok(room.contentNote);
    assert.ok(Number.isFinite(room.floor));
    assert.equal(room.position.length, 3);
    assert.ok(room.position.every(Number.isFinite));
    assert.ok(Array.isArray(room.facilities));
    assert.ok(room.facilities.every((facility) => typeof facility === 'string'));
    assert.ok(Array.isArray(room.images));
    assert.ok(room.images.every((image) => image.url && image.caption.includes('Foto ilustrasi')));
  }
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

  for (const material of gltf.materials ?? []) {
    const pbr = material.pbrMetallicRoughness ?? {};
    for (const factor of [pbr.metallicFactor, pbr.roughnessFactor]) {
      if (factor != null) assert.ok(factor >= 0 && factor <= 1);
    }
  }
});

test('transisi mode membersihkan state FPS yang sudah tidak berlaku', () => {
  useTourStore.setState({
    activeRoom: null,
    cameraMode: 'fps',
    currentZone: 'Gedung A',
    isPointerLocked: true,
    nearbyRoom: { id: 'room-a' },
  });

  useTourStore.getState().setCameraMode('orbit');
  assert.equal(useTourStore.getState().cameraMode, 'orbit');
  assert.equal(useTourStore.getState().isPointerLocked, false);
  assert.equal(useTourStore.getState().nearbyRoom, null);
  assert.equal(useTourStore.getState().currentZone, null);

  useTourStore.getState().openRoomModal({ id: 'room-a' });
  useTourStore.getState().setIsPointerLocked(true);
  assert.equal(useTourStore.getState().isPointerLocked, false);
  useTourStore.getState().closeRoomModal();
});
