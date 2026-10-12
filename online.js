let roomState=null, roomPoll=null, onlineBusy=false;
const onlineNotice=text=>{$('onlineNotice').textContent=text};
function savedSeat(){try{return JSON.parse(sessionStorage.getItem('liarSeat'))}catch{return null}}
async function roomFetch(path,body,authenticated=true){
 const headers={'Content-Type':'application/json'};if(authenticated&&onlineSession)headers.Authorization='Bearer '+onlineSession.token;
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),10000);
 try{const res=await fetch(path,{method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});const data=await res.json();if(!res.ok)throw Error(data.error||'Room request failed.');return data}finally{clearTimeout(timeout)}
}
function roomPath(action=''){return '/api/rooms/'+onlineSession.code+(action?'/'+action:'')}
function applyRoom(data){
 const oldRound=game?.round;roomState=data;localSeat=data.seat;clearTimeout(botTimer);
 if(selectedMode!==data.mode){selectedMode=data.mode;setup()}
 $('rulesetSelect').value=data.ruleset;$('playerCount').value=String(data.capacity);
 document.querySelectorAll('#modeGrid button,#characterGrid button,#rulesetSelect,#playerCount').forEach(e=>e.disabled=true);
 $('reconnectRoom').hidden=true;
 $('roomCode').textContent=data.code;
 $('roomLobby').hidden=false;
 $('roomSeats').textContent=data.seats.map((p,i)=>`${p.name}${i===data.host?' (host)':''} — ${p.left?'left':p.ready?'ready':'not ready'}`).join(' · ');
 $('roomReady').hidden=!!data.game;$('roomReady').textContent=data.seats[data.seat].ready?'Not ready':'Ready';
 $('roomStart').hidden=!!data.game||data.host!==data.seat;
 $('roomStart').disabled=data.seats.length<2||!data.seats.every(p=>p.ready);
 $('startButton').disabled=true;$('createRoom').disabled=$('joinRoom').disabled=true;
 if(data.game){const selected=oldRound===data.game.round?(game?.selected||[]):[];game=data.game;game.selected=selected;render()}
 else{game=null;document.body.classList.remove('in-game');$('playerRow').textContent='';$('privateArea').textContent='';$('actionArea').textContent='';$('message').textContent='Everyone selects Ready, then the host starts.';$('turnRibbon').textContent='Private room '+data.code;$('tableCenter').textContent='Waiting for players';}
 onlineNotice(data.game?`Connected · ${modes[data.mode].name} · turn limit 45 seconds`:`Room ${data.seats.length}/${data.capacity} · ${modes[data.mode].name} · ${data.ruleset}`);
}
function pollRoom(){clearTimeout(roomPoll);roomPoll=setTimeout(async()=>{
 if(!onlineSession)return;if(onlineBusy){pollRoom();return}
 try{const data=await roomFetch(roomPath());if(data.revision!==roomState?.revision)applyRoom(data);else onlineNotice('Connected'+(data.deadline?' · '+Math.max(0,Math.ceil((data.deadline-Date.now())/1000))+'s remaining':''))}
 catch{onlineNotice('Connection interrupted. Reconnecting…')}
 pollRoom();
},1500)}
async function connectRoom(join){if(onlineBusy)return;onlineBusy=true;onlineNotice('Connecting…');try{
 const name=$('onlineName').value.trim()||'Player',code=$('joinCode').value.trim().toUpperCase();
 if(join&&!/^[A-F0-9]{10}$/.test(code))throw Error('Enter the 10-character room code.');
 const data=await roomFetch(join?'/api/rooms/'+code+'/join':'/api/rooms',{name,avatar:selectedAvatar,mode:selectedMode,ruleset:$('rulesetSelect').value,capacity:+$('playerCount').value},false);
 onlineSession={code:data.code,token:data.token};sessionStorage.setItem('liarSeat',JSON.stringify(onlineSession));delete data.token;applyRoom(data);pollRoom();
}catch(e){onlineNotice(e.message==='Failed to fetch'?'Online rooms need the Cloudflare Worker. Use npm run dev locally.':e.message)}finally{onlineBusy=false}}
async function roomCommand(action,extra={}){if(!onlineSession||onlineBusy)return;onlineBusy=true;try{const data=await roomFetch(roomPath(action),{revision:roomState.revision,...extra});if(data.left){disconnectRoom();return}if(action==='action'&&game)game.selected=[];applyRoom(data)}catch(e){onlineNotice(e.message);try{applyRoom(await roomFetch(roomPath()))}catch{}}finally{onlineBusy=false}}
function onlineAct(type){if(type==='rematch')return roomCommand('rematch');if(type==='lobby')return roomCommand('rematch');const action={type};if(type==='bid'){action.qty=+$('bidQty').value;action.face=+$('bidFace').value}if(type==='play')action.cards=game.selected||[];if(type==='claim')action.claim=$('claim').value;return roomCommand('action',{action})}
function disconnectRoom(){clearTimeout(roomPoll);onlineSession=null;roomState=null;localSeat=0;game=null;sessionStorage.removeItem('liarSeat');document.querySelectorAll('#modeGrid button,#characterGrid button,#rulesetSelect,#playerCount').forEach(e=>e.disabled=false);$('reconnectRoom').hidden=true;$('roomLobby').hidden=true;$('startButton').disabled=false;$('createRoom').disabled=$('joinRoom').disabled=false;act('lobby');onlineNotice('You left the room.');}
$('createRoom').onclick=()=>connectRoom(false);$('joinRoom').onclick=()=>connectRoom(true);
$('roomReady').onclick=()=>roomCommand('ready',{ready:!roomState.seats[localSeat].ready});$('roomStart').onclick=()=>roomCommand('start');$('leaveRoom').onclick=()=>roomCommand('leave');
$('copyRoom').onclick=async()=>{const url=new URL(location.href);url.searchParams.set('room',onlineSession.code);try{await navigator.clipboard.writeText(url.href);onlineNotice('Invite link copied.')}catch{onlineNotice('Share this room code: '+onlineSession.code)}};
$('reconnectRoom').onclick=async()=>{const saved=savedSeat();if(!saved){onlineNotice('No saved seat in this tab.');return}onlineSession=saved;try{applyRoom(await roomFetch(roomPath()));pollRoom()}catch(e){onlineSession=null;onlineNotice(e.message)}};
const invite=new URLSearchParams(location.search).get('room');if(invite)$('joinCode').value=invite;
if(savedSeat())$('reconnectRoom').hidden=false;
