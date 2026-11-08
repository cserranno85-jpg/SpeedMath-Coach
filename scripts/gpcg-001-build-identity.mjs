#!/usr/bin/env node
// GPCG-001: public-safe artifact fingerprint. Build evidence only, NOT Play compliance approval.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const SOURCE=/^[a-f0-9]{40}$/i;
export async function fingerprint(file,commit){
 if(!SOURCE.test(commit||''))throw Error('Missing immutable 40-character source commit');
 const st=fs.statSync(file);
 if(!st.isFile()||st.size<4096)throw Error('AAB missing or implausibly small');
 const fd=fs.openSync(file,'r'),head=Buffer.alloc(4);
 try{if(fs.readSync(fd,head,0,4,0)!==4||!head.equals(Buffer.from([80,75,3,4])))throw Error('Not ZIP-format Android bundle candidate');}
 finally{fs.closeSync(fd);}
 const hash=createHash('sha256');
 for await(const part of fs.createReadStream(file))hash.update(part);
 return {status:'BUILD_IDENTITY_RECORDED_NOT_RELEASE_APPROVED',app_id:'speedmath',source_commit:commit.toLowerCase(),aab_sha256:hash.digest('hex'),aab_bytes:st.size};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const opts={};
 for(let i=2;i<process.argv.length;i+=2){
  const k=process.argv[i]?.replace(/^--/,'');
  if(!['aab','source','output'].includes(k)||!process.argv[i]?.startsWith('--')||!process.argv[i+1]||k in opts){console.error('Invalid arguments');process.exit(2);}
  opts[k]=process.argv[i+1];
 }
 fingerprint(opts.aab,opts.source).then(record=>{
  if(!opts.output)throw Error('Output identity path required');
  fs.writeFileSync(opts.output,JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify(record,null,2));
  console.log('Signing verification is independent; no Play submission is authorized.');
 }).catch(e=>{console.error('GPCG-001: '+e.message);process.exitCode=1;});
}