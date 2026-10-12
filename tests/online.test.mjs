import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{LiarRoom} from '../server/worker.mjs';
import {createGame,applyAction,publicView,forfeit,timeoutAction} from '../server/engine.mjs';
function env(){const objects=new Map();return {ASSETS:{fetch:()=>new Response('assets')},ROOMS:{idFromName:n=>n,get(id){if(!objects.has(id)){const db=new Map(),storage={async get(k){return structuredClone(db.get(k))},async put(k,v){db.set(k,structuredClone(v))},async deleteAll(){db.clear()},async setAlarm(t){this.alarm=t}};objects.set(id,new LiarRoom({storage}))}return objects.get(id)}}}}
const seats=[{name:'Alice',avatar:'🤠'},{name:'Bob',avatar:'🕵️'},{name:'Cora',avatar:'👩🏽'}];
function client(environment){return async(path,body,token)=>{const headers={'Content-Type':'application/json'};if(token)headers.Authorization='Bearer '+token;const req=new Request('https://game.test'+path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body)});const res=await worker.fetch(req,environment);return {status:res.status,data:await res.json()}}}
test('all four modes: independent players join, ready, start, take turns, reconnect and leave',async()=>{
 for(const [mode,ruleset,action] of [['dice','Standard',{type:'bid',qty:1,face:2}],['deck','Standard',{type:'play',cards:[0]}],['poker','Table adaptation',{type:'call'}],['roulette','Table adaptation',{type:'spin'}]]){
  const api=client(env());let a=(await api('/api/rooms',{mode,ruleset,capacity:2,name:'Alice',avatar:0})).data;const path='/api/rooms/'+a.code,ta=a.token;
  let b=(await api(path+'/join',{name:'Bob',avatar:1})).data,tb=b.token;
  assert.notEqual(ta,tb);assert.equal((await api(path)).status,401);
  let r=await api(path+'/start',{revision:b.revision},tb);assert.equal(r.status,400);
  r=await api(path+'/ready',{revision:b.revision,ready:true},ta);r=await api(path+'/ready',{revision:r.data.revision,ready:true},tb);
  r=await api(path+'/start',{revision:r.data.revision},ta);assert.equal(r.status,200);assert.equal(r.data.game.turn,0);
  assert.equal((await api(path+'/join',{name:'Late'})).status,409);
  const rev=r.data.revision;
  assert.equal((await api(path+'/action',{revision:rev,action},tb)).status,400);
  r=await api(path+'/action',{revision:rev,action},ta);assert.equal(r.status,200);
  assert.equal((await api(path+'/action',{revision:rev,action},ta)).status,409);
  const restored=(await api(path,undefined,tb)).data;assert.equal(restored.revision,r.data.revision);assert.equal(restored.seat,1);
  assert.ok(!JSON.stringify(restored).includes(ta));assert.ok(!JSON.stringify(restored).includes(tb));
  for(const p of restored.game.players){assert.equal(p.loaded,undefined)}
  assert.deepEqual(restored.game.players[0].hand,[]);assert.deepEqual(restored.game.players[0].dice,[]);assert.deepEqual(restored.game.players[0].cards,[]);assert.equal(restored.game.players[0].reels,null);
  r=await api(path+'/leave',{revision:restored.revision},ta);assert.equal(r.status,200);
  const last=(await api(path,undefined,tb)).data;assert.equal(last.game.phase,'ended');assert.equal(last.host,1);
  assert.equal((await api(path,undefined,ta)).status,401);
  r=await api(path+'/rematch',{revision:last.revision},tb);assert.equal(r.status,200);assert.equal(r.data.seat,0);assert.equal(r.data.game,null);
 }
});
test('private projection hides deck claims, unrevealed board, remaining deck and chamber positions',()=>{
 let g=createGame('deck','Standard',seats);g=applyAction(g,0,{type:'play',cards:[0,1]});let v=publicView(g,1);assert.deepEqual(v.pending.cards,[null,null]);assert.equal(v.players[0].hand.length,0);assert.equal(v.players[1].hand.length,5);
 g=createGame('poker','Table adaptation',seats);v=publicView(g,1);assert.deepEqual(v.community,[]);assert.equal(v.pokerRemaining,undefined);assert.equal(v.players[1].cards.length,2);
 g=createGame('roulette','Table adaptation',seats);g=applyAction(g,0,{type:'spin'});g=applyAction(g,0,{type:'claim',claim:'1'});assert.equal(publicView(g,1).pending.reels.length,1);
});
test('invalid payloads cannot mutate authoritative state or buy extra spins',()=>{
 let g=createGame('dice','Standard',seats),before=structuredClone(g);
 for(const action of [{type:'bid',qty:0,face:2},{type:'bid',qty:1,face:2.3},{type:'bid',qty:NaN,face:2},{type:'spot'},{type:'fold'}])assert.throws(()=>applyAction(g,0,action));assert.deepEqual(g,before);
 g=createGame('deck','Standard',seats);assert.throws(()=>applyAction(g,0,{type:'play',cards:[0,0]}));assert.throws(()=>applyAction(g,0,{type:'play',cards:[-1]}));
 g=createGame('roulette','Table adaptation',seats);g=applyAction(g,0,{type:'spin'});assert.throws(()=>applyAction(g,0,{type:'spin'}));assert.throws(()=>applyAction(g,0,{type:'double'}));
});
test('timeouts advance all modes and expired rooms cannot reconnect',async()=>{
 const e=env(),api=client(e);let a=(await api('/api/rooms',{mode:'dice',ruleset:'Standard',capacity:2,name:'A'})).data;const ta=a.token,path='/api/rooms/'+a.code;let b=(await api(path+'/join',{name:'B'})).data;
 let r=await api(path+'/ready',{revision:b.revision,ready:true},ta);r=await api(path+'/ready',{revision:r.data.revision,ready:true},b.token);await api(path+'/start',{revision:r.data.revision},ta);
 const object=e.ROOMS.get(a.code);let room=await object.ctx.storage.get('room');room.deadline=Date.now()-1;await object.ctx.storage.put('room',room);await object.alarm();room=await object.ctx.storage.get('room');assert.equal(room.game.turn,1);
 room.expires=Date.now()-1;await object.ctx.storage.put('room',room);assert.equal((await api(path,undefined,ta)).status,404);
 for(const [m,rules] of [['deck','Standard'],['poker','Table adaptation'],['roulette','Table adaptation']]){let g=createGame(m,rules,seats);g=applyAction(g,g.turn,timeoutAction(g));assert.ok(g.log.length>0)}
});
test('forfeits cannot leave poker on a folded player or trap the last contender',()=>{
 let g=createGame('poker','Table adaptation',seats);g.players[1].folded=true;g.turn=0;g=forfeit(g,0);assert.equal(g.players[g.turn].alive,true);assert.equal(g.players[g.turn].folded,false);
});
test('concurrent writes accept only one matching revision',async()=>{
 const api=client(env());const a=(await api('/api/rooms',{mode:'dice',ruleset:'Standard',capacity:2,name:'A'})).data;
 const results=await Promise.all([true,false].map(ready=>api('/api/rooms/'+a.code+'/ready',{revision:a.revision,ready},a.token)));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
});
