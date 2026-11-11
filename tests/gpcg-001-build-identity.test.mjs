import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fingerprint} from '../scripts/gpcg-001-build-identity.mjs';
test('records byte identity without claiming release approval',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'speedmath-gpcg-'));
 try{
  const aab=path.join(dir,'sample.aab');fs.writeFileSync(aab,Buffer.concat([Buffer.from([80,75,3,4]),Buffer.alloc(6000)]));
  const f=await fingerprint(aab,'a'.repeat(40));
  assert.equal(f.status,'BUILD_IDENTITY_RECORDED_NOT_RELEASE_APPROVED');
  assert.equal(f.app_id,'speedmath');
  assert.equal(f.aab_sha256.length,64);
  await assert.rejects(()=>fingerprint(aab,'moving-branch'));
  fs.writeFileSync(aab,Buffer.alloc(6000));await assert.rejects(()=>fingerprint(aab,'a'.repeat(40)));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});