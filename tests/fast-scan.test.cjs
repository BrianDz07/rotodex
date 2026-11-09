const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('dist/app.js','utf8');const c=vm.createContext({});vm.runInContext(source.slice(source.indexOf('function sameCardSignature('),source.indexOf('function prepare(')),c);
assert.equal(c.sameCardSignature(new Uint8Array([10,20,30]),new Uint8Array([10,20,30])),true);assert.equal(c.sameCardSignature(new Uint8Array([10,20,30]),new Uint8Array([40,50,60])),false);assert.equal(c.sameCardSignature(null,new Uint8Array([1])),false);
// Even near-identical artwork cannot bypass a fresh OCR read indefinitely.
const same=new Uint8Array([10,20,30]);assert.equal(c.canReuseReading(same,same,100),true);assert.equal(c.canReuseReading(same,same,1000),false);assert.equal(c.canReuseReading(same,new Uint8Array([40,50,60]),100),false);
console.log('PASS unchanged-card shortcut, changed-card handling, and bounded OCR recheck');
