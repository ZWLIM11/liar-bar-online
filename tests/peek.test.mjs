import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
test('peek reveals only presentation and new rounds cover the hand again',()=>{
 const elements=new Map(),classes=new Set(),listeners=new Map(),events=[];const el=id=>{if(!elements.has(id))elements.set(id,{setAttribute(k,v){this[k]=v}});return elements.get(id)};
 const window={addEventListener(n,f){listeners.set(n,f)},dispatchEvent(e){events.push(e);listeners.get(e.type)?.(e)}};
 const g={mode:'dice',round:1,players:[{alive:true,poison:0,dice:[1,2,3,4,5]}]};
 const ctx=vm.createContext({window,document:{body:{classList:{toggle(n,v){v?classes.add(n):classes.delete(n)}}}},$:el,game:g,localSeat:0,CustomEvent:class{constructor(type,args){this.type=type;this.detail=args?.detail}}});
 const code=readFileSync(new URL('../experience.js',import.meta.url),'utf8');vm.runInContext(code.slice(code.indexOf('let handOpen=')),ctx);
 listeners.get('table-state')();assert.equal(el('peekHand')['aria-pressed'],'false');const before=JSON.stringify(g);el('peekHand').onclick();assert.ok(classes.has('hand-open'));assert.equal(JSON.stringify(g),before);listeners.get('table-state')();assert.ok(classes.has('hand-open'));g.round++;listeners.get('table-state')();assert.ok(!classes.has('hand-open'));g.mode='deck';g.players[0].pulls=1;listeners.get('table-state')();assert.equal(el('peekHand').textContent,'Flip cards · peek');listeners.get('request-peek')();assert.equal(el('peekHand').textContent,'Turn cards down');assert.equal(events.at(-1).detail.open,true);
});
