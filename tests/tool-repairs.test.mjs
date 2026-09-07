import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const scripts=new Map();
function source(app){if(!scripts.has(app)){const file=app==='GLYPHSHIFT'?'app.js':'index.html';let s=fs.readFileSync(path.join(root,'public',app,file),'utf8');if(file==='index.html')s=[...s.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');scripts.set(app,s)}return scripts.get(app)}
function fn(app,name){const s=source(app),tree=ts.createSourceFile('app.js',s,ts.ScriptTarget.Latest,true);let result;function visit(node){if(ts.isFunctionDeclaration(node)&&node.name?.text===name)result=node.getText(tree);ts.forEachChild(node,visit)}visit(tree);assert.ok(result,`Missing function ${name}`);return result}

test('all repaired standalone scripts parse',()=>{for(const app of ['MOTTLE','PIXEL-FORGE','GLYPHSHIFT'])new vm.Script(source(app))});

test('Pixel Forge project validation rejects malformed pixels, active indexes and palettes',()=>{
 const c=vm.createContext({Uint8ClampedArray});vm.runInContext(fn('PIXEL-FORGE','parsePixelProject'),c);
 const good={width:8,height:8,frames:[Array(256).fill(42)],active:0,palette:['#abcdef']};
 assert.equal(c.parsePixelProject(good).frames[0][0],42);
 for(const bad of [{frames:[[9]]},{active:.5},{active:1},{palette:[{}]},{frames:[Array(256).fill(-1)]},{width:8.5,height:8.5}])assert.throws(()=>c.parsePixelProject({...good,...bad}));
});

test('Pixel Forge rejected resized project leaves the current session untouched',async()=>{
 const elements={};const c=vm.createContext({Uint8ClampedArray,$:id=>elements[id]??=( {} ),alert(){}});
 vm.runInContext('let S=32,frames=[new Uint8ClampedArray(4096).fill(17)],active=0;'+fn('PIXEL-FORGE','parsePixelProject'),c);
 const s=source('PIXEL-FORGE');vm.runInContext(s.slice(s.indexOf('let projectLoadId=0;'),s.lastIndexOf('renderPal();setColor(')),c);
 const input={files:[{size:50,text:async()=>JSON.stringify({width:64,height:64,frames:[[9]]})}],value:'project.json'};
 await elements.loadFile.onchange({target:input});
 assert.equal(vm.runInContext('S',c),32);assert.equal(vm.runInContext('frames[0][0]',c),17);assert.equal(input.value,'');
});

test('Glyphshift manual text is included in editor history snapshots',()=>{
 const c=vm.createContext({document:{querySelectorAll:()=>[]},state:{viewport:{x:1,y:2,zoom:1},manualText:'edited text',textMode:true}});vm.runInContext(fn('GLYPHSHIFT','snapshotEditor'),c);
 const snapshot=c.snapshotEditor();assert.equal(snapshot.manualText,'edited text');assert.equal(snapshot.textMode,true);
});

test('Glyphshift unsupported video codec leaves export available',async()=>{
 class Recorder{static isTypeSupported(){return false}}
 const c=vm.createContext({state:{imageReady:true,recording:false},isAnimated:()=>true,window:{MediaRecorder:Recorder},MediaRecorder:Recorder,transport:{},out:{captureStream(){throw Error('must not start')}}});vm.runInContext(fn('GLYPHSHIFT','record'),c);await c.record();
 assert.equal(c.state.recording,false);assert.match(c.transport.textContent,/NOT SUPPORTED/);
});

test('Glyphshift recording constructor failures clean up tracks and busy state',async()=>{
 let stopped=0;const button={classList:{add(){},remove(){}},textContent:''};class Recorder{static isTypeSupported(){return true}constructor(){throw Error('codec setup failed')}}
 const c=vm.createContext({state:{imageReady:true,recording:false},isAnimated:()=>true,window:{MediaRecorder:Recorder},MediaRecorder:Recorder,transport:{},out:{captureStream:()=>({getTracks:()=>[{stop(){stopped++}}]})},ui:{fps:{value:'30'},resolveSound:{value:'none'}},$:()=>button,clearTimeout});vm.runInContext(fn('GLYPHSHIFT','record'),c);await c.record();
 assert.equal(c.state.recording,false);assert.equal(stopped,1);assert.match(c.transport.textContent,/FAILED/);assert.match(button.textContent,/EXPORT BUILD/);
});

test('Glyphshift failed source import preserves the currently edited source and text',async()=>{
 const revoked=[];const c=vm.createContext({state:{media:'old source',manualText:'my text',playing:false},URL:{createObjectURL:()=> 'blob:new',revokeObjectURL:url=>revoked.push(url)},status:{},prepareSource:async()=>{throw Error('bad image')},releasePreparedSource(){}});
 vm.runInContext('let sourceLoadId=0;'+fn('GLYPHSHIFT','load'),c);await c.load({name:'broken.png'});
 assert.equal(c.state.media,'old source');assert.equal(c.state.manualText,'my text');assert.deepEqual(revoked,['blob:new']);assert.match(c.status.textContent,/PREVIOUS WORK KEPT/);
});

test('Mottle long video frame allocation stays within the pixel budget',()=>{
 const c=vm.createContext({});vm.runInContext(fn('MOTTLE','videoSampleCount'),c);
 for(const duration of [1,60,7200,100000]){const maxFrames=Math.floor(24000000/(240*135)),n=c.videoSampleCount(duration,30,maxFrames);assert.ok(n>=1&&n<=maxFrames);assert.ok(n*240*135<=24000000)}
});

function mottleContext(extra={}){
 const defaults={scale:1,fps:12,nframes:12,fg:'#000000',bg:'#ffffff'};
 const c=vm.createContext({DEFAULTS:defaults,$:()=>null,FXDEF:{},TEMPDEF:{},normalizeMask:v=>v,...extra});vm.runInContext(fn('MOTTLE','validateMottleProject'),c);return c;
}
test('Mottle validates all frame timing before any source decode',()=>{
 const c=mottleContext();assert.throws(()=>c.validateMottleProject({format:'mottle',settings:{scale:0}}));assert.throws(()=>c.validateMottleProject({format:'mottle',source:{kind:'frames',frames:['data:image/png;base64,a'],delays:[]}}));assert.throws(()=>c.validateMottleProject({format:'mottle',settings:{fps:'fast'}}));
});

test('Mottle source decode failure does not mutate the current project or history',async()=>{
 let pushed=0;const c=mottleContext({S:{scale:7,img:'original'},pushUndo(){pushed++},imageFromData:async()=>{throw Error('bad image')}});vm.runInContext('let projectRestoreId=0;'+fn('MOTTLE','loadProjectObject'),c);
 await assert.rejects(c.loadProjectObject({format:'mottle',settings:{scale:2},source:{kind:'still',data:'bad'}}),/bad image/);assert.equal(c.S.scale,7);assert.equal(c.S.img,'original');assert.equal(pushed,0);
});

test('Mottle project loader refuses external media URLs',async()=>{
 const c=vm.createContext({});vm.runInContext(fn('MOTTLE','imageFromData'),c);await assert.rejects(c.imageFromData('https://example.com/tracker.png'),/embedded/);
});

test('Mottle clean export switches full quality and restores preview even after errors',()=>{
 let scheduled=0;const c=vm.createContext({S:{img:{}},out:{width:1920,height:1080},stopPreview(){},scheduleRender(){scheduled++},toCanvas:(canvas,w,h)=>({w,h})});vm.runInContext('let renderingExport=false;'+fn('MOTTLE','cleanExportCanvas'),c);
 c.render=()=>assert.equal(vm.runInContext('renderingExport',c),true);assert.deepEqual({...c.cleanExportCanvas()},{w:1920,h:1080});assert.equal(vm.runInContext('renderingExport',c),false);
 c.render=()=>{throw Error('render fail')};assert.throws(()=>c.cleanExportCanvas(),/render fail/);assert.equal(vm.runInContext('renderingExport',c),false);assert.equal(scheduled,2);
});

test('Mottle clean renders exclude the interactive split-comparison divider',()=>{
 let splitCalls=0;const c=vm.createContext({renderCore:()=>({w:8,h:8}),S:{scale:1,img:{}},out:{width:8,height:8},octx:{drawImage(){}},src:{},splitOn:true,drawSplit(){splitCalls++},$:()=>({})});
 vm.runInContext('let renderingExport=true;'+fn('MOTTLE','render'),c);c.render();assert.equal(splitCalls,0);vm.runInContext('renderingExport=false',c);c.render();assert.equal(splitCalls,1);
});

test('Mottle settings recovery reports persistence failure rather than claiming saved',()=>{
 const status={};const c=vm.createContext({store:{set:()=>false},projectObject:()=>({source:null}),$:()=>status,clearTimeout(){},setTimeout(fn){fn();return 1}});vm.runInContext('let autosaveTimer=0;'+fn('MOTTLE','autosaveProject'),c);c.autosaveProject();assert.match(status.textContent,/session only/);assert.match(status.textContent,/storage unavailable/);
});
