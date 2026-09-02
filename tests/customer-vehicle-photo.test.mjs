import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const source = readFileSync(new URL('../packages/backend/src/index.ts', import.meta.url), 'utf8');
const start = source.indexOf('export async function setCustomerVehiclePhoto(');
const end = source.indexOf('\nexport async function', start + 1);
const compiled = ts.transpileModule(source.slice(start, end).replace('export async', 'async'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const updatePhoto = new Function(`${compiled}; return setCustomerVehiclePhoto;`)();
const file = { type: 'image/jpeg', size: 100 };

function mock(options = {}) {
  const calls = [];
  const old = options.old ?? null;
  const bucket = {
    async upload(path, value, config) { calls.push(['upload', path, config]); return { error: options.uploadError ?? null }; },
    async remove(paths) { calls.push(['remove', paths]); return { error: null }; },
  };
  const db = {
    select() { return this; },
    eq(key, value) { calls.push(['eq', key, value]); return this; },
    is(key, value) { calls.push(['is', key, value]); return this; },
    update(values) { calls.push(['update', values]); return this; },
    async single() { return { data: { photo_path: old }, error: options.readError ?? null }; },
    async maybeSingle() { return { data: options.conflict ? null : { id: 'vehicle' }, error: options.updateError ?? null }; },
  };
  return { calls, client: {
    auth: { async getUser() { return { data: { user: options.unauthenticated ? null : { id: 'owner' } }, error: null }; } },
    from(name) { assert.equal(name, 'user_vehicles'); return db; },
    storage: { from(name) { assert.equal(name, 'customer-vehicle-photos'); return bucket; } },
  } };
}

test('valid upload is owner/vehicle scoped and saved after upload', async () => {
  const { client, calls } = mock();
  await updatePhoto(client, 'vehicle', file);
  const upload = calls.find(x => x[0] === 'upload');
  assert.match(upload[1], /^owner\/vehicle\/[\da-f-]+\.jpg$/);
  assert.equal(upload[2].upsert, false);
  assert.ok(calls.some(x => x[0] === 'eq' && x[1] === 'user_id' && x[2] === 'owner'));
  assert.ok(calls.findIndex(x => x[0] === 'upload') < calls.findIndex(x => x[0] === 'update'));
});
test('restoring original clears personal path then removes the old upload', async () => {
  const { client, calls } = mock({ old: 'owner/vehicle/old.jpg' });
  await updatePhoto(client, 'vehicle', null);
  assert.deepEqual(calls.find(x => x[0] === 'update')[1], { photo_path: null });
  assert.equal(calls.some(x => x[0] === 'upload'), false);
  assert.deepEqual(calls.at(-1), ['remove', ['owner/vehicle/old.jpg']]);
});
test('invalid type, zero size and oversized uploads rejected before any database write', async () => {
  for (const invalid of [{ type: 'image/svg+xml', size: 100 }, { ...file, size: 0 }, { ...file, size: 5242881 }]) {
    const { client, calls } = mock();
    await assert.rejects(updatePhoto(client, 'vehicle', invalid), /5 MB/);
    assert.equal(calls.length, 0);
  }
});
test('anonymous upload rejected', async () => {
  const { client, calls } = mock({ unauthenticated: true });
  await assert.rejects(updatePhoto(client, 'vehicle', file), /Sign in/);
  assert.equal(calls.length, 0);
});
test('upload failure leaves original photo unchanged', async () => {
  const { client, calls } = mock({ old: 'old.jpg', uploadError: new Error('upload failed') });
  await assert.rejects(updatePhoto(client, 'vehicle', file), /upload failed/);
  assert.equal(calls.some(x => x[0] === 'update' || x[0] === 'remove'), false);
});
test('concurrent edit cleans only newly uploaded file and preserves old photo', async () => {
  const { client, calls } = mock({ old: 'owner/vehicle/old.jpg', conflict: true });
  await assert.rejects(updatePhoto(client, 'vehicle', file), /another tab/);
  assert.deepEqual(calls.at(-1), ['remove', [calls.find(x => x[0] === 'upload')[1]]]);
});
test('database failure cleans new upload without deleting old image', async () => {
  const { client, calls } = mock({ old: 'old.jpg', updateError: new Error('database failed') });
  await assert.rejects(updatePhoto(client, 'vehicle', file), /database failed/);
  assert.notEqual(calls.at(-1)[1][0], 'old.jpg');
});
