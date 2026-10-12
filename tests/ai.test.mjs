import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createGame,applyAction,publicView,variants} from '../server/engine.mjs';
const context=vm.createContext({window:{},botMove:null});vm.runInContext(readFileSync(new URL('../ai.js',import.meta.url),'utf8'),context);
const choose=context.chooseBotAction;
const seats=['Alice','Bob','Cora','Dan'].map(name=>({name,avatar:'X'}));
test('all AI difficulties play legal actions in every ruleset without opponents private data',()=>{
 for(const [mode,rulesets] of Object.entries(variants))for(const ruleset of rulesets)for(const difficulty of ['casual','standard','expert']){
 let g=createGame(mode,ruleset,seats);
 for(let n=0;n<120&&g.phase==='playing';n++){
 const seat=g.turn,v=publicView(g,seat);
 const action=choose(v,seat,difficulty,()=>.55);
 assert.doesNotThrow(()=>{g=applyAction(g,seat,JSON.parse(JSON.stringify(action)))},`${mode}/${ruleset}/${difficulty}: ${JSON.stringify(action)}`);
 }
 }
});
test('AI decisions do not depend on other players hidden cards, rolls or future board',()=>{
 for(const [mode,rulesets] of Object.entries(variants)){
 let g=createGame(mode,rulesets[0],seats);let hidden=publicView(g,0);
 assert.equal(JSON.stringify(choose(g,0,'expert',()=>.5)),JSON.stringify(choose(hidden,0,'expert',()=>.5)));
 }
});
