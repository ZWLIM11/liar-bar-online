// Bots use their own hand/roll and public information only.
function chooseBotAction(g,i,difficulty='standard',random=Math.random){
 const p=g.players[i],alive=g.players.filter(x=>x.alive).length;
 if(g.mode==='dice'){
  const b=g.bid,wild=g.ruleset==='Traditional';
  if(b){const own=p.dice.filter(v=>v===b.face||wild&&b.face!==1&&v===1).length;
   const unknown=(alive-1)*5,prob=wild&&b.face!==1?1/3:1/6;
   let likelihood=0;for(let k=Math.max(0,b.qty-own);k<=unknown;k++){let comb=1;for(let j=1;j<=k;j++)comb*=((unknown-j+1)/j);likelihood+=comb*prob**k*(1-prob)**(unknown-k)}
   const threshold=difficulty==='casual'?.23:difficulty==='expert'?.57:.42;
   if(likelihood<threshold||b.qty===alive*5&&b.face===6)return {type:'challenge'};
  }
  const options=[];for(let f=1;f<=6;f++){let qty=b?b.qty+(f<=b.face?1:0):1;if(qty>alive*5)continue;let own=p.dice.filter(v=>v===f||wild&&f!==1&&v===1).length;options.push({type:'bid',qty,face:f,value:own+(alive-1)*5*(wild&&f!==1?1/3:1/6)-qty+random()*.8})}return options.sort((a,b)=>b.value-a.value)[0]||{type:'challenge'};
 }
 if(g.mode==='deck'){
  const matches=p.hand.map((c,k)=>c===g.rank||c==='J'?k:-1).filter(k=>k>=0);
  const challengeChance=difficulty==='casual'?.18:difficulty==='expert'?.38:.28;
  if(g.pending&&(!p.hand.length||random()<challengeChance))return {type:'challenge'};
  let choices=matches.length&&random()<.74?matches:[Math.floor(random()*p.hand.length)];return {type:'play',cards:choices.slice(0,g.ruleset==='Chaos adaptation'?1:1+Math.floor(random()*Math.min(3,choices.length)))};
 }
 if(g.mode==='poker'){
  const visible=g.community.slice(0,[0,3,4,5][g.street]);const ranks=[...p.cards,...visible].map(c=>c.rank);const pair=new Set(ranks).size<ranks.length;
  if(!pair&&p.stake>=2&&random()<.4)return {type:'fold'};return {type:'call'};
 }
 const others=g.players.filter((x,k)=>k!==i&&x.alive);if(p.points>=5&&others.every(x=>x.points<p.points))return {type:'execute'};
 if(g.pending&&(g.pending.claim==='JACKPOT'||random()<.3))return {type:'challenge'};
 if(!p.reels)return {type:!p.double&&random()<.2?'double':'spin'};
 const hearts=p.reels.filter(s=>s==='♥').length;return {type:'claim',claim:p.reels.every(s=>s===p.reels[0])?'JACKPOT':String(Math.min(3,Math.max(1,hearts+(random()<.2?1:0))))};
}
botMove=function(){if(!game||onlineSession||game.phase!=='playing'||game.turn===0)return;const i=game.turn,a=chooseBotAction(game,i,$('aiDifficulty').value);
 if(game.mode==='dice')a.type==='bid'?diceBid(i,a.qty,a.face):diceChallenge(i,false);
 if(game.mode==='deck')a.type==='play'?deckPlay(i,a.cards):deckChallenge(i);
 if(game.mode==='poker')pokerAction(i,a.type);
 if(game.mode==='roulette'){if(a.type==='execute')rouletteExecute(i);else if(a.type==='challenge')rouletteChallenge(i);else if(a.type==='claim')rouletteClaim(i,a.claim);else rouletteSpin(i,a.type==='double')}
 render();scheduleBot();
};
window.gameAudio=function(kind){if(!sound)return;try{const ctx=new(window.AudioContext||window.webkitAudioContext)();let gain=ctx.createGain();gain.gain.value=kind==='shot'?.11:.025;gain.connect(ctx.destination);if(kind==='shot'){let buffer=ctx.createBuffer(1,ctx.sampleRate*.22,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(ctx.sampleRate*.04));let source=ctx.createBufferSource();source.buffer=buffer;source.connect(gain);source.start()}else{let o=ctx.createOscillator();o.frequency.value=kind==='click'?120:kind==='roll'?230:400;o.connect(gain);o.start();gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.16);o.stop(ctx.currentTime+.17)}setTimeout(()=>ctx.close(),500)}catch{}};
