// Server-only rules. Clients receive only the explicit publicView projection.
export const variants={dice:['Standard','Traditional'],deck:['Standard','Devil','Devils Deal adaptation','Chaos adaptation'],poker:['Table adaptation'],roulette:['Table adaptation']};
const faces=['⚀','⚁','⚂','⚃','⚄','⚅'];
const rand=n=>{const v=new Uint32Array(1);let limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(v)}while(v[0]>=limit);return v[0]%n};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=rand(i+1);[a[i],a[j]]=[a[j],a[i]]}return a};
function runtime(game){
 const living=()=>game.players.filter(p=>p.alive),next=i=>{for(let n=1;n<=game.players.length;n++){let j=(i+n)%game.players.length;if(game.players[j].alive)return j}return 0};
 const log=s=>{game.logSerial=(game.logSerial||0)+1;game.log.unshift(s);game.log=game.log.slice(0,20)};
 const say=s=>{throw new Error(s)},render=()=>{},scheduleBot=()=>{};
 const advance=()=>{game.turn=next(game.turn)};
 const endCheck=()=>{if(living().length>1)return false;game.phase='ended';game.message=(living()[0]?.name||'Nobody')+' wins the table.';return true};
 function newDiceRound(){game.bid=null;for(const p of living())p.dice=Array.from({length:5},()=>1+rand(6));game.turn=game.turn??0;game.message='Secret dice rolled. Make the first bid.'}
function diceBid(i,qty,face){const max=living().length*5,b=game.bid;if(!Number.isInteger(qty)||qty<1||qty>max||face<1||face>6||b&&(qty<b.qty||qty===b.qty&&face<=b.face)){say('That bid must raise the quantity or raise the face at the same quantity.');return}game.bid={qty,face,by:i};log(`${game.players[i].name} bids ${qty} ${faces[face-1]}s.`);game.message=`${game.players[i].name} bids ${qty} ${faces[face-1]}s.`;advance()}
function diceChallenge(i,spot){let b=game.bid;if(!b)return;let total=living().flatMap(p=>p.dice).filter(x=>x===b.face||(game.ruleset==='Traditional'&&b.face!==1&&x===1)).length;game.lastReveal={id:(game.revealSerial=(game.revealSerial||0)+1),title:spot?'Spot On result':'Dice challenge',claim:b.qty+' × '+b.face,rows:living().map(p=>({name:p.name,values:p.dice.slice()})),reason:spot?(total===b.qty?'Exactly right: every other player drinks.':'Not an exact count: the caller drinks.'):(total<b.qty?'Too few matching dice: the bidder drinks.':'The bid is supported: the challenger drinks.'),actual:total+' matching dice'+(game.ruleset==='Traditional'&&b.face!==1?' (including wild ones)':'')};let loser;if(spot){if(total===b.qty){for(const p of living())if(p!==game.players[i])p.poison++;log(`${game.players[i].name} called Spot On: exactly ${total}! Everyone else drinks.`)}else{loser=game.players[i];loser.poison++;log(`${game.players[i].name}'s Spot On missed. Actual count: ${total}.`)}}else{loser=game.players[total<b.qty?b.by:i];loser.poison++;log(`${game.players[i].name} called bluff. Actual count: ${total}. ${loser.name} drinks.`)}for(const p of living())if(p.poison>=2){p.alive=false;log(`${p.name} is out of the dice game.`)}if(endCheck())return;game.round++;game.turn=loser?.alive?game.players.indexOf(loser):next(i);newDiceRound();game.message=`Dice revealed: ${total} matching. Fresh rolls for round ${game.round}.`}

// Deck: cards are dealt anew after every challenge. A chamber position belongs to each player for the match.
function deckPack(){return shuffle(game.ruleset==='Chaos adaptation'?[...Array(5).fill('K'),...Array(5).fill('Q'),'M','C']:[...Array(6).fill('A'),...Array(6).fill('K'),...Array(6).fill('Q'),'J','J',...(game.ruleset==='Devil'?['D']:game.ruleset==='Devils Deal adaptation'?['D','E']:[])]).slice()}
function newDeckRound(){game.tablePlays=[];game.dealHistory=[];let pack=deckPack();game.rank=game.ruleset==='Chaos adaptation'?['K','Q'][rand(2)]:['A','K','Q'][rand(3)];for(const p of living())p.hand=pack.splice(0,game.ruleset==='Chaos adaptation'?3:5);game.pending=null;game.selected=[];game.message=`${game.rank}'s table. Play ${game.ruleset==='Chaos adaptation'?'one card':'one to three cards'}, or challenge the previous claim.`}
function deckPlay(i,indices){let p=game.players[i];if(!indices.length||indices.length>(game.ruleset==='Chaos adaptation'?1:3)||new Set(indices).size!==indices.length||indices.some(k=>k<0||k>=p.hand.length)){say(`Select ${game.ruleset==='Chaos adaptation'?'one card':'one to three cards'} first.`);return}let cards=indices.sort((a,b)=>b-a).map(k=>p.hand.splice(k,1)[0]);if((cards.includes('D')||cards.includes('E'))&&cards.length!==1){p.hand.push(...cards);say('Devil and Deal cards must be played alone.');return}if(cards[0]==='E'&&game.ruleset==='Devils Deal adaptation'){const history=game.dealHistory||[];const success=history.length===4&&history.every(c=>c!==game.rank&&c!=='J');log(p.name+" revealed Devil's Deal: "+(success?'four lies — every opponent faces the chamber.':'the condition failed — the revealer faces the chamber (house rule).'));for(const target of living())if(success?target!==p:target===p)trigger(target);game.selected=[];if(endCheck())return;game.round++;game.turn=next(i);newDeckRound();return;}game.dealHistory=[...(game.dealHistory||[]),...cards.slice().reverse()].slice(-4);game.tablePlays=[...(game.tablePlays||[]),{by:i,count:cards.length}];game.pending={by:i,cards};game.selected=[];log(`${p.name} placed ${cards.length} card${cards.length>1?'s':''}, claiming ${game.rank}.`);game.message=`${p.name} claims ${cards.length} ${game.rank}${cards.length>1?'s':''}.`;advance()}
function trigger(p){p.pulls++;let fired=p.pulls===p.loaded;if(fired){p.alive=false;log(`${p.name}'s chamber fired. ${p.name} is eliminated.`)}else log(`${p.name} pulled the trigger and survived (${p.pulls}/6).`);return fired}
function deckChallenge(i){let pending=game.pending;if(!pending)return;let player=game.players[pending.by],challenger=game.players[i],devil=pending.cards[0]==='D',chaos=pending.cards[0]==='C',master=pending.cards[0]==='M';let truthful=pending.cards.every(c=>c===game.rank||c==='J');game.lastReveal={id:(game.revealSerial=(game.revealSerial||0)+1),title:'Card challenge',claim:pending.cards.length+' × '+game.rank,rows:[{name:player.name,values:pending.cards.slice()}],actual:truthful?'All cards match (Jokers are wild)':'At least one card does not match',reason:devil&&game.ruleset!=='Standard'?'Devil card: the special rule resolves.':game.ruleset==='Chaos adaptation'&&(chaos||master)?'Special Chaos card: the house rule resolves.':truthful?challenger.name+' called a truthful claim and faces the chamber.':player.name+' bluffed and faces the chamber.'};log(`${challenger.name} called Liar. Revealed: ${pending.cards.join(', ')}.`);if(devil&&['Devil','Devils Deal adaptation'].includes(game.ruleset)){for(const p of living())if(p!==player)trigger(p)}else if(game.ruleset==='Chaos adaptation'&&chaos){for(const p of living())trigger(p)}else if(game.ruleset==='Chaos adaptation'&&master){trigger(challenger)}else trigger(truthful?challenger:player);if(endCheck())return;game.round++;game.turn=next(i);newDeckRound();game.message=devil?'The Devil card was revealed. A new deal begins.':`The claim was ${truthful?'true':'false'}. A new deal begins.`}

// Poker is an explicit house implementation of the broad Steam description.
function pokerDeck(){const suits=['♠','♥','♦','♣'];return shuffle(suits.flatMap((s,si)=>Array.from({length:13},(_,n)=>({rank:n+2,suit:s,label:`${'23456789TJQKA'[n]}${s}`,red:si===1||si===2}))))}
function newPokerRound(){let deck=pokerDeck();game.community=deck.splice(0,5);for(const p of living()){p.cards=deck.splice(0,2);p.stake=0;p.folded=false;p.switchedThisTurn=false;p.firstDecision=p.firstDecision??true}game.pokerRemaining=deck;game.street=0;game.acted=[];game.message='Private cards dealt. Call, fold, switch, or go all in.'}
function pokerAction(i,a){let p=game.players[i];if(a==='switch'){if(p.switched||game.street>=3){say('Switch is available once per match, before the river.');return}p.cards[rand(2)]=game.pokerRemaining.pop();p.switched=true;p.switchedThisTurn=true;log(`${p.name} switched a private card.`);game.message=`${p.name} switched a card. Choose a betting action.`;return}
  if(a==='coward'){if(!p.firstDecision||p.cowardUsed){say('Coward’s Fold is available only on your first decision.');return}p.cowardUsed=true;p.stake=1;p.folded=true;log(`${p.name} used Coward’s Fold and faces one bullet.`);pokerRisk(p)}else if(a==='fold'){p.folded=true;p.stake=Math.max(1,p.stake);log(`${p.name} folded and faces ${p.stake} bullet${p.stake>1?'s':''}.`);pokerRisk(p)}else if(a==='allin'){if(p.switchedThisTurn){say('All in is unavailable on the same turn as Switch.');return}p.stake=6;log(`${p.name} went all in.`)}else if(a==='call'){p.stake=Math.min(6,p.stake+1);log(`${p.name} called with a bullet.`)}else return;
  p.firstDecision=false;p.switchedThisTurn=false;
  game.acted.push(i);let active=living().filter(x=>!x.folded);if(endCheck())return;
  if(active.length<=1){pokerResolve();return}
  const wait=active.find(x=>!game.acted.includes(game.players.indexOf(x)));if(wait){game.turn=game.players.indexOf(wait);game.message=`${wait.name} decides on the ${['pre-flop','flop','turn','river'][game.street]}.`;return}
  if(game.street<3){game.street++;game.acted=[];game.turn=game.players.indexOf(active[0]);game.message=`${['','Flop','Turn','River'][game.street]} revealed. Betting continues.`;log(game.message)}else pokerResolve();
}
function pokerRisk(p){const risk=Math.min(6,p.stake);if(rand(6)<risk){p.alive=false;log(`${p.name} was eliminated by the ${risk}/6 chamber risk.`)}else log(`${p.name} survived the ${risk}/6 chamber risk.`)}
function score(cards){let best=[0];const c=cards;for(let a=0;a<c.length-4;a++)for(let b=a+1;b<c.length-3;b++)for(let d=b+1;d<c.length-2;d++)for(let e=d+1;e<c.length-1;e++)for(let f=e+1;f<c.length;f++){let hand=[c[a],c[b],c[d],c[e],c[f]],r=hand.map(x=>x.rank).sort((x,y)=>y-x),counts=[...new Set(r)].map(x=>[x,r.filter(y=>y===x).length]).sort((x,y)=>y[1]-x[1]||y[0]-x[0]),flush=hand.every(x=>x.suit===hand[0].suit),uniq=[...new Set(r)],straight=uniq.length===5&&(uniq[0]-uniq[4]===4||JSON.stringify(uniq)==='[14,5,4,3,2]'),hi=uniq[0]===14&&uniq[1]===5?5:uniq[0],v=flush&&straight?[8,hi]:counts[0][1]===4?[7,counts[0][0],counts[1][0]]:counts[0][1]===3&&counts[1][1]===2?[6,counts[0][0],counts[1][0]]:flush?[5,...r]:straight?[4,hi]:counts[0][1]===3?[3,counts[0][0],...counts.slice(1).map(x=>x[0])]:counts[0][1]===2&&counts[1][1]===2?[2,...counts.map(x=>x[0])]:counts[0][1]===2?[1,...counts.map(x=>x[0])]:[0,...r];if(compare(v,best)>0)best=v}return best}
function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){let d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
function pokerResolve(){let contenders=living().filter(p=>!p.folded);if(contenders.length){let top=contenders.map(p=>({p,s:score([...p.cards,...game.community])})).sort((a,b)=>compare(b.s,a.s));let winners=top.filter(x=>compare(x.s,top[0].s)===0).map(x=>x.p);log(`Showdown: ${winners.map(p=>p.name).join(' and ')} win with ${top[0].s[0]+1}-tier hand.`);for(const p of contenders)if(!winners.includes(p))pokerRisk(p)}if(endCheck())return;game.round++;game.turn=next(game.turn);newPokerRound()}

// Roulette scoring and Death Spin details below are labeled house rules in the UI.
const reelSymbols=['♥','♠','◆','♣'];
function newRouletteRound(){for(const p of living())p.reels=null;game.pending=null;game.message='Spin the four reels. One symbol will remain public.'}
function rouletteSpin(i,double){let p=game.players[i];if(double){if(p.double){say('Double Spin has already been used.');return}p.double=true}if(game.pending)rouletteAccept();let roll=()=>Array.from({length:4},()=>reelSymbols[rand(4)]);p.reels=roll();if(double){const second=roll();if(second.filter(x=>x==='♥').length>p.reels.filter(x=>x==='♥').length)p.reels=second}log(`${p.name} spun the reels${double?' twice':''}. One reel shows ${p.reels[0]}.`);game.message=`${p.name} has spun. Make a claim.`}
function rouletteClaim(i,claim){let p=game.players[i];if(!p.reels){say('Spin before making a claim.');return}if(!['1','2','3','JACKPOT'].includes(claim))return;game.pending={by:i,claim,reels:p.reels.slice()};p.reels=null;log(`${p.name} claims ${claim==='JACKPOT'?'Jackpot':`${claim} Heart${claim==='1'?'':'s'}`}.`);game.message=`${p.name} claims ${claim}. Challenge or take the next spin.`;advance()}
function rouletteTruth(p){let c=p.claim;return c==='JACKPOT'?p.reels.every(x=>x===p.reels[0]):p.reels.filter(x=>x==='♥').length>=+c}
function deathSpin(p){let result=reelSymbols[rand(4)];if(result!=='♥'){p.alive=false;log(`${p.name}'s Death Spin showed ${result}: eliminated.`)}else{let amount=game.pending?.claim==='JACKPOT'?4:Number(game.pending?.claim||0);p.points=Math.max(0,p.points-amount);log(`${p.name}'s Death Spin showed ♥: survived.`)}}
function rouletteChallenge(i){let q=game.pending;if(!q)return;let truthful=rouletteTruth(q),loser=game.players[truthful?i:q.by];game.lastReveal={id:(game.revealSerial=(game.revealSerial||0)+1),title:'Slots challenge',claim:q.claim,rows:[{name:game.players[q.by].name,values:q.reels.slice()}],actual:truthful?'The claim is supported':'The claim was a bluff',reason:loser.name+' faces Death Spin.'};log(`${game.players[i].name} called Liar. The reels were ${q.reels.join(' ')}: ${truthful?'truthful':'a bluff'}.`);deathSpin(loser);if(endCheck())return;game.round++;game.turn=loser.alive?game.players.indexOf(loser):next(i);newRouletteRound()}
function rouletteExecute(i){let p=game.players[i],others=living().filter(x=>x!==p);if(p.points<5||others.some(x=>x.points>=p.points)){say('Execute requires at least five points and the sole highest score.');return}let low=Math.min(...others.map(x=>x.points)),targets=others.filter(x=>x.points===low),target=targets[rand(targets.length)];target.alive=false;log(`${p.name} executed ${target.name}, the lowest-scoring player.`);if(endCheck())return;game.turn=next(i);game.round++;newRouletteRound()}
function rouletteAccept(){let q=game.pending;if(!q)return;let p=game.players[q.by],amount=q.claim==='JACKPOT'?4:+q.claim;p.points+=amount;log(`${p.name}'s claim stood. +${amount} point${amount>1?'s':''}.`);game.pending=null}


 return {remove(i){
 game.players[i].alive=false;log(game.players[i].name+' left the table.');if(endCheck())return;
 if(game.mode==='poker'&&living().filter(p=>!p.folded).length<=1){pokerResolve();return}
 if(game.pending?.by===i){if(game.mode==='deck'){game.round++;newDeckRound()}else game.pending=null}
 if(game.turn===i){game.turn=next(i);if(game.mode==='poker'){while(game.players[game.turn].folded)game.turn=next(game.turn)}}
},begin(){({dice:newDiceRound,deck:newDeckRound,poker:newPokerRound,roulette:newRouletteRound})[game.mode]()},run(i,a){
 if(game.phase!=='playing'||game.turn!==i||!game.players[i]?.alive)throw new Error('It is not your turn.');
 const p=game.players[i];
 if(game.mode==='dice'){
  if(a.type==='bid'){if(!Number.isInteger(a.face))throw new Error('Invalid face.');diceBid(i,a.qty,a.face)}
  else if(a.type==='challenge'||a.type==='spot'){if(!game.bid||a.type==='spot'&&game.ruleset!=='Traditional')throw new Error('No valid challenge.');diceChallenge(i,a.type==='spot')}
  else throw new Error('Invalid dice action.');
 }else if(game.mode==='deck'){
  if(a.type==='play'){if(!Array.isArray(a.cards)||a.cards.some(x=>!Number.isInteger(x)))throw new Error('Invalid cards.');deckPlay(i,[...a.cards])}
  else if(a.type==='challenge'&&game.pending)deckChallenge(i);else throw new Error('Invalid deck action.');
 }else if(game.mode==='poker'){
  if(p.folded||!['call','fold','coward','switch','allin'].includes(a.type))throw new Error('Invalid poker action.');pokerAction(i,a.type);
 }else{
  if(a.type==='spin'||a.type==='double'){if(p.reels)throw new Error('Already spun. Declare your result.');rouletteSpin(i,a.type==='double')}
  else if(a.type==='claim'){if(!p.reels||!['1','2','3','JACKPOT'].includes(a.claim))throw new Error('Invalid claim.');rouletteClaim(i,a.claim)}
  else if(a.type==='challenge'&&game.pending)rouletteChallenge(i);
  else if(a.type==='execute')rouletteExecute(i);else throw new Error('Invalid Slots action.');
 }
 }};
}
export function createGame(mode,ruleset,seats){
 if(!variants[mode]?.includes(ruleset)||seats.length<2||seats.length>4)throw new Error('Invalid table settings.');
 const game={mode,ruleset,players:seats.map(p=>({name:p.name,avatar:p.avatar,alive:true,poison:0,pulls:0,loaded:1+rand(6),points:0,switched:false,double:false})),turn:0,round:1,log:[],message:'',pending:null,phase:'playing'};
 runtime(game).begin();return game;
}
export function applyAction(state,seat,action){const game=structuredClone(state);runtime(game).run(seat,action);return game}
export function timeoutAction(g){const p=g.players[g.turn];if(g.mode==='dice')return g.bid?{type:'challenge'}:{type:'bid',qty:1,face:2};if(g.mode==='deck')return g.pending?{type:'challenge'}:{type:'play',cards:[0]};if(g.mode==='poker')return {type:'fold'};return g.pending?{type:'challenge'}:p.reels?{type:'claim',claim:'1'}:{type:'spin'}}
export function publicView(g,seat){
 if(!g)return null;
 return {tablePlays:(g.tablePlays||[]).map(p=>({by:p.by,count:p.count})),logSerial:g.logSerial,lastReveal:g.lastReveal,mode:g.mode,ruleset:g.ruleset,turn:g.turn,round:g.round,phase:g.phase,message:g.message,log:g.log,
 players:g.players.map((p,i)=>({name:p.name,avatar:p.avatar,alive:p.alive,poison:p.poison,pulls:p.pulls,points:p.points,stake:p.stake,folded:p.folded,switched:p.switched,switchedThisTurn:p.switchedThisTurn,firstDecision:p.firstDecision,cowardUsed:p.cowardUsed,double:p.double,handCount:p.hand?.length||0,...(i===seat?{hand:p.hand,dice:p.dice,cards:p.cards,reels:p.reels}:{hand:[],dice:[],cards:[],reels:null})})),
 bid:g.bid,rank:g.rank,street:g.street,community:g.community?.slice(0,[0,3,4,5][g.street]),
 pending:g.pending?{by:g.pending.by,...(g.mode==='deck'?{cards:Array(g.pending.cards.length).fill(null)}:{claim:g.pending.claim,reels:[g.pending.reels[0]]})}:null};
}

export function forfeit(state,seat){const game=structuredClone(state);runtime(game).remove(seat);return game}
