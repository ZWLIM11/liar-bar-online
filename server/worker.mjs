import {createGame,applyAction,publicView,timeoutAction,variants,forfeit} from './engine.mjs';
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const AVATARS=['🤠','🕵️','👩🏽','🧔🏽','👩🏻','👨🏿'];
const identity=b=>({name:String(b.name||'Player').trim().replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,20)||'Player',avatar:AVATARS[Number.isInteger(b.avatar)&&b.avatar>=0&&b.avatar<6?b.avatar:0]});
export default {async fetch(request,env){
 const url=new URL(request.url);
 if(!url.pathname.startsWith('/api/'))return env.ASSETS.fetch(request);
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return json({error:'Use this game’s own website.'},403);
 if(url.pathname==='/api/health')return json({online:true});
 let code,action;
 if(url.pathname==='/api/rooms'&&request.method==='POST'){code=crypto.randomUUID().replaceAll('-','').slice(0,10).toUpperCase();action='create'}
 else{const m=url.pathname.match(/^\/api\/rooms\/([A-F0-9]{10})(?:\/(join|ready|start|action|leave|rematch))?$/);if(!m)return json({error:'Room not found.'},404);code=m[1];action=m[2]||'state'}
 if((action==='state'&&request.method!=='GET')||(action!=='state'&&request.method!=='POST'))return json({error:'Method not allowed.'},405);
 const id=env.ROOMS.idFromName(code),stub=env.ROOMS.get(id);
 const headers=new Headers(request.headers);headers.set('X-Room-Code',code);headers.set('X-Room-Action',action);
 return stub.fetch(new Request('https://room.internal/',{method:request.method,headers,body:request.method==='POST'?request.body:undefined,duplex:'half'}));
}};

export class LiarRoom {
 constructor(ctx){this.ctx=ctx;this.queue=Promise.resolve()}
 serial(fn){const p=this.queue.then(fn);this.queue=p.catch(()=>{});return p}
 fetch(req){return this.serial(()=>this.handle(req))}
 async handle(req){try{
  let room=await this.ctx.storage.get('room');const action=req.headers.get('X-Room-Action');
  let body={};if(req.method==='POST'){const text=await req.text();if(text.length>4096)return json({error:'Request too large.'},413);try{body=JSON.parse(text||'{}')}catch{return json({error:'Invalid JSON.'},400)}}
  if(room&&room.expires<=Date.now()){await this.ctx.storage.deleteAll();room=null}
  if(action==='create'){
   if(room)return json({error:'Room already exists.'},409);
   if(!variants[body.mode]?.includes(body.ruleset)||![2,3,4].includes(body.capacity))return json({error:'Invalid room settings.'},400);
   const seat={...identity(body),token:crypto.randomUUID(),ready:false,left:false};
   room={code:req.headers.get('X-Room-Code'),mode:body.mode,ruleset:body.ruleset,capacity:body.capacity,host:0,seats:[seat],revision:1,game:null,expires:Date.now()+86400000,deadline:null};
   await this.save(room);return json({...this.view(room,0),token:seat.token});
  }
  if(!room)return json({error:'Room not found or expired.'},404);
  if(action==='join'){
   if(room.game||room.seats.length>=room.capacity)return json({error:'This table is full or has started.'},409);
   const seat={...identity(body),token:crypto.randomUUID(),ready:false,left:false};room.seats.push(seat);room.revision++;await this.save(room);return json({...this.view(room,room.seats.length-1),token:seat.token});
  }
  const token=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');let index=room.seats.findIndex(s=>s.token===token&&!s.left);
  if(index<0)return json({error:'Your seat could not be verified. Join or reconnect with the saved seat.'},401);
  if(action==='state')return json(this.view(room,index));
  if(body.revision!==room.revision)return json({error:'The table changed. Please try again.',stale:true},409);
  if(action==='ready'){if(room.game)throw Error('The match has already started.');room.seats[index].ready=body.ready===true}
  else if(action==='start'){
   if(index!==room.host||room.game||room.seats.length<2||!room.seats.every(s=>s.ready))throw Error('Only the host can start after everyone is ready.');
   room.game=createGame(room.mode,room.ruleset,room.seats);room.deadline=Date.now()+45000;
  }else if(action==='action'){
   if(!room.game||!body.action||typeof body.action!=='object')throw Error('No active match.');
   const previousTurn=room.game.turn,previousRound=room.game.round;
   room.game=applyAction(room.game,index,body.action);
   // Spin and Switch do not buy more time for the same turn.
   if(room.game.turn!==previousTurn||room.game.round!==previousRound)room.deadline=Date.now()+45000;
   if(room.game.phase==='ended')room.deadline=null;
  }else if(action==='rematch'){
   if(index!==room.host||room.game?.phase!=='ended')throw Error('The host may reopen the lobby after the match.');
   room.seats=room.seats.filter(s=>!s.left).map(s=>({...s,ready:false}));index=room.seats.findIndex(s=>s.token===token);room.host=index;room.game=null;room.deadline=null;
  }else if(action==='leave'){
   if(!room.game){room.seats.splice(index,1);if(index<room.host)room.host--;if(room.host>=room.seats.length||index===room.host)room.host=0}
   else{room.seats[index].left=true;room.game=forfeit(room.game,index);room.deadline=room.game.phase==='playing'?Date.now()+45000:null;if(room.host===index)room.host=room.seats.findIndex(s=>!s.left)}
   room.revision++;if(!room.seats.some(s=>!s.left)){await this.ctx.storage.deleteAll();return json({left:true})}await this.save(room);return json({left:true});
  }else throw Error('Unknown room action.');
  room.revision++;await this.save(room);return json(this.view(room,index));
 }catch(error){return json({error:error.message||'Unable to update the table.'},400)}}
 view(room,index){return {code:room.code,mode:room.mode,ruleset:room.ruleset,capacity:room.capacity,host:room.host,seat:index,revision:room.revision,deadline:room.deadline,seats:room.seats.map(s=>({name:s.name,avatar:s.avatar,ready:s.ready,left:s.left})),game:publicView(room.game,index)}}
 async save(room){await this.ctx.storage.put('room',room);await this.ctx.storage.setAlarm(Math.min(room.expires,room.deadline||room.expires))}
 alarm(){return this.serial(async()=>{let room=await this.ctx.storage.get('room');if(!room)return;if(room.expires<=Date.now()){await this.ctx.storage.deleteAll();return}if(room.game?.phase==='playing'&&room.deadline<=Date.now()){
  const who=room.game.players[room.game.turn].name;room.game=applyAction(room.game,room.game.turn,timeoutAction(room.game));room.game.log.unshift(who+' ran out of time; the house made the default move.');room.revision++;room.deadline=room.game.phase==='playing'?Date.now()+45000:null;
 }await this.save(room)})}
}
