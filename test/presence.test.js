import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MAP_BOUNDS,
  clampMove,
  containsBlockedWord,
  createRateLimiter,
  maskBlockedWords,
  sanitizeChat,
  sanitizeName,
} from '../server/lib/util.js';
import { lerpAngle, sanitizeClientName, stepPeer } from '../src/lib/presenceClient.js';

test('sanitizeName membersihkan, membatasi, dan menolak nama terlarang', () => {
  assert.equal(sanitizeName('  Rido   Putra '), 'Rido Putra');
  assert.equal(sanitizeName('x'.repeat(40)), 'x'.repeat(20));
  assert.equal(sanitizeName('a\u0000b\u001fc'), 'abc');
  assert.match(sanitizeName(''), /^Pengunjung-\d{2}$/);
  assert.match(sanitizeName('anjing'), /^Pengunjung-\d{2}$/);
  assert.match(sanitizeName(null), /^Pengunjung-\d{2}$/);
  assert.equal(containsBlockedWord('Babi hutan'), true);
  assert.equal(containsBlockedWord('budi'), false);
});

test('sanitizeChat dan maskBlockedWords menjaga pesan tetap aman', () => {
  assert.equal(sanitizeChat('  halo   dunia  '), 'halo dunia');
  assert.equal(sanitizeChat('y'.repeat(300)), 'y'.repeat(200));
  assert.equal(sanitizeChat('   '), null);
  assert.equal(sanitizeChat(42), null);
  assert.equal(maskBlockedWords('tolol sekali'), '***** sekali');
  assert.equal(maskBlockedWords('FUCK'), '****');
});

test('clampMove memvalidasi angka dan membatasi ke area map', () => {
  const move = clampMove(999, -999, 7.5);
  assert.equal(move.x, MAP_BOUNDS.maxX);
  assert.equal(move.z, MAP_BOUNDS.minZ);
  assert.ok(move.yaw >= 0 && move.yaw < Math.PI * 2);
  assert.equal(clampMove(Number.NaN, 0, 0), null);
  assert.equal(clampMove('0', 0, 0), null);
  assert.equal(clampMove(Infinity, 0, 0), null);
});

test('createRateLimiter memblokir lonjakan dan reset per window', async () => {
  const limiter = createRateLimiter({ limit: 3, windowMs: 30 });
  assert.equal(limiter(), true);
  assert.equal(limiter(), true);
  assert.equal(limiter(), true);
  assert.equal(limiter(), false);
  await new Promise((resolve) => setTimeout(resolve, 40));
  assert.equal(limiter(), true);
});

test('lerpAngle memperhitungkan perputaran melingkar', () => {
  assert.ok(Math.abs(lerpAngle(0.1, 0.2, 0.5) - 0.15) < 1e-9);
  assert.ok(Math.abs(lerpAngle(6.2, 0.1, 0.5) - 0.0084) < 0.005);
  const stepped = lerpAngle(-3.1, 3.1, 1);
  assert.ok(Math.abs(stepped) < Math.PI + 1e-9);
});

test('stepPeer menggerakkan posisi menuju target secara halus', () => {
  const peer = { x: 0, z: 0, yaw: 0, tx: 10, tz: 0, tyaw: Math.PI };
  stepPeer(peer, 0.5);
  assert.ok(peer.x > 0 && peer.x < 10);
  stepPeer(peer, 5);
  assert.ok(Math.abs(peer.x - 10) < 0.1);
  assert.ok(Math.abs(peer.z) < 1e-6);
});

test('sanitizeClientName mengembalikan null untuk input kosong', () => {
  assert.equal(sanitizeClientName('  Budi  '), 'Budi');
  assert.equal(sanitizeClientName(''), null);
  assert.equal(sanitizeClientName(undefined), null);
});
