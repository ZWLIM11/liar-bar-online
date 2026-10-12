import * as T from './vendor/three.module.min.js';
import {cartoonPerson,cartoonHand,cartoonRevolver} from './cartoon-models.js';
import {shotPose,sceneEvents} from './scene-events.js';
const host=document.getElementById('sceneHost');
try { init(); } catch(error) { host.classList.add('scene-fallback');document.getElementById('viewHint').textContent='3D unavailable: enable hardware acceleration and reload.';console.warn('3D renderer unavailable:',error.message); }
function init(){
 const scene=new T.Scene();scene.background=new T.Color('#180e0b');scene.fog=new T.FogExp2('#25150f',.032);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;host.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(65,1,.05,70);scene.add(camera);
 const mat=(color,roughness=.7,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const wood=mat('#4c2815'),trim=mat('#9c6231',.45),felt=mat('#183f34'),brass=mat('#bb9148',.3,.7),dark=mat('#171316',.38,.45),skin=mat('#b07955'),ivory=mat('#eddfbd');
 function mesh(geo,material,x,y,z,parent=scene){let m=new T.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
 const box=(w,h,d,m,x,y,z,p)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);
 const cyl=(r1,r2,h,m,x,y,z,p)=>mesh(new T.CylinderGeometry(r1,r2,h,48),m,x,y,z,p);
 const sphere=(r,m,x,y,z,p)=>mesh(new T.SphereGeometry(r,24,16),m,x,y,z,p);
 // Real geometry and procedural wood grain, rather than a flat backdrop.
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const cx=canvas.getContext('2d');cx.fillStyle='#633a22';cx.fillRect(0,0,512,512);for(let i=0;i<750;i++){const y=Math.random()*512;cx.strokeStyle=`rgba(${Math.random()>.5?'190,129,70':'30,12,4'},.18)`;cx.beginPath();cx.moveTo(0,y);cx.bezierCurveTo(180,y+Math.random()*10,330,y-8,512,y+2);cx.stroke()}const grain=new T.CanvasTexture(canvas);grain.colorSpace=T.SRGBColorSpace;grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(3,3);wood.map=grain;
 box(22,.15,22,wood,0,-.12,0);box(22,7,.25,wood,0,3.4,-9);box(.25,7,22,wood,-10,3.4,0);box(.25,7,22,wood,10,3.4,0);
 for(let x=-10;x<11;x+=2){box(.12,5,.25,trim,x,2.5,-8.8);box(1.9,.08,17,dark,x,-.025,0)}
 box(12,1.25,1.7,wood,0,.63,-6.7);box(12.4,.16,1.9,trim,0,1.33,-6.7);
 for(let y=1.7;y<4.6;y+=1){box(10,.12,.75,trim,0,y,-8.2);for(let x=-4.5;x<5;x+=.6){const green=mat(['#24472e','#80501f','#344e3d'][Math.floor(Math.random()*3)],.24,.1);cyl(.12,.13,.42,green,x,y+.26,-8.1);cyl(.045,.06,.2,brass,x,y+.56,-8.1)}}
 const signCanvas=document.createElement('canvas');signCanvas.width=1024;signCanvas.height=256;let sc=signCanvas.getContext('2d');sc.fillStyle='#170b08';sc.fillRect(0,0,1024,256);sc.textAlign='center';sc.fillStyle='#f2b45e';sc.font='bold 78px Georgia';sc.fillText("THE LIAR'S TABLE",512,134);sc.font='25px Georgia';sc.fillText('NO HONOUR AMONG LIARS',512,190);let signTex=new T.CanvasTexture(signCanvas);signTex.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(6.8,1.7),new T.MeshBasicMaterial({map:signTex}),0,5.2,-8.75);
 cyl(2.95,2.8,.23,wood,0,.9,0);cyl(2.7,2.7,.025,felt,0,1.03,0);cyl(.48,.75,.85,wood,0,.4,0);
 const rim=mesh(new T.TorusGeometry(2.77,.045,12,90),brass,0,1.04,0);rim.rotation.x=Math.PI/2;
 const lamp=cyl(.17,.25,.4,brass,0,1.25,0);sphere(.13,new T.MeshStandardMaterial({color:'#ffb345',emissive:'#ff8219',emissiveIntensity:3}),0,1.58,0);
 const light=new T.PointLight('#ffd4a0',30,10,2);light.position.set(0,2.5,.1);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);scene.add(new T.HemisphereLight('#e4e7f0','#473329',2.1));
 for(const x of [-5,5]){let l=new T.PointLight('#ffab69',42,13);l.position.set(x,3,-6);scene.add(l);cyl(.6,.1,.25,brass,x,3.5,-6)}

 // Ceiling beams, windows and secondary tables give free-look a complete room.
 box(22,.18,22,wood,0,6.8,0);box(22,7,.25,wood,0,3.4,9);
 for(let x=-8;x<=8;x+=4)box(.24,.36,18,trim,x,6.55,0);
 const night=new T.MeshStandardMaterial({color:'#203747',emissive:'#1c3041',emissiveIntensity:.3,roughness:.25});
 for(const x of [-9.8,9.8])for(const z of [-4,3]){let window=box(.08,2,1.6,night,x,3,z);box(.14,2.2,.09,trim,x,3,z-.84);box(.14,2.2,.09,trim,x,3,z+.84);box(.14,.1,1.7,trim,x,2,z);box(.14,.1,1.7,trim,x,4,z);box(.16,2,.06,trim,x,3,z);box(.16,.08,1.7,trim,x,3,z);}
 for(const x of [-6,6]){cyl(1.2,1.15,.14,wood,x,.9,3.7);cyl(.15,.35,.85,wood,x,.4,3.7);for(const dx of [-1.4,1.4]){box(.65,.12,.65,wood,x+dx,.5,3.7);box(.65,.9,.09,wood,x+dx,1,4);}}
 const warmGlass=mat('#6c542c',.12,.3);for(const a of [0,1,2,3].map(x=>x*Math.PI/2)){let x=Math.sin(a+.3)*2.2,z=Math.cos(a+.3)*2.2;cyl(.07,.08,.45,warmGlass,x,1.28,z);cyl(.033,.04,.19,brass,x,1.59,z)}
 let playerGroups=[],guns=[],dice=[],cards=[];
 function gun(parent,x,y,z){const g=cartoonRevolver();g.position.set(x,y,z);parent.add(g);return g}
 function hand(parent,x,y,z,rotation=0){const h=cartoonHand(parent,x,y,z);h.rotation.z=rotation;return h}
 function person(angle,index){const g=cartoonPerson(index);g.position.set(Math.sin(angle)*3.15,0,Math.cos(angle)*3.15);g.rotation.y=angle;scene.add(g);playerGroups.push(g);guns.push(gun(g,.63,1.13,-.85));return g}
 for(let i=0;i<4;i++)person(i*Math.PI/2,i);
 function diceMat(face){let c=document.createElement('canvas');c.width=c.height=128;let x=c.getContext('2d');x.fillStyle='#ead8af';x.fillRect(0,0,128,128);x.strokeStyle='#bca078';x.lineWidth=8;x.strokeRect(3,3,122,122);const spots={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};x.fillStyle='#2a180f';for(let [a,b]of spots[face]){x.beginPath();x.arc(64+a*31,64+b*31,10,0,Math.PI*2);x.fill()}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.35})}
 const dm=[1,2,3,4,5,6].map(diceMat);
 for(let i=0;i<5;i++){let d=box(.2,.2,.2,[dm[0],dm[5],dm[i],dm[6-i-1],dm[1],dm[4]],(i-2)*.26,1.17,1.78);dice.push(d)}
 const cardBack=mat('#852d23');for(let i=0;i<5;i++){let c=box(.34,.014,.5,cardBack,(i-2)*.28,1.08,1.68);c.rotation.y=(i-2)*.08;cards.push(c)}
 for(let i=1;i<4;i++){let a=i*Math.PI/2;cyl(.18,.14,.3,mat('#593a21'),Math.sin(a)*2.22,1.2,Math.cos(a)*2.22);cyl(.105,.085,.27,mat('#b47a28',.15,.2),Math.sin(a+.25)*2.3,1.18,Math.cos(a+.25)*2.3)}
 const personal=new T.Group();scene.add(personal);[...dice,...cards].forEach(m=>personal.attach(m));const ownGun=gun(scene,0,0,0);ownGun.visible=true;ownGun.scale.setScalar(.9);const fill=new T.PointLight('#b6c6e0',1.5,3);fill.position.set(-.3,.3,-.2);camera.add(fill);

 // The player's leather cup actually covers a compact group of five dice.
 const cup=new T.Group();personal.add(cup);cup.position.set(0,1.05,1.7);
 const leather=mat('#432619',.9),seam=mat('#bd8b50',.75);
 mesh(new T.CylinderGeometry(.32,.36,.55,48,1,true),leather,0,.275,0,cup);
 cyl(.32,.32,.035,leather,0,.55,0,cup);
 for(const y of [.035,.49]){let ring=mesh(new T.TorusGeometry(y<.1?.357:.327,.012,8,48),seam,0,y,0,cup);ring.rotation.x=Math.PI/2;}
 const poisonGlass=new T.Group();personal.add(poisonGlass);poisonGlass.position.set(.76,1.055,1.91);
 const glass=new T.MeshPhysicalMaterial({color:'#baa889',transparent:true,opacity:.25,roughness:.08,metalness:.05,side:T.DoubleSide});
 mesh(new T.CylinderGeometry(.12,.095,.3,32,1,true),glass,0,.15,0,poisonGlass);cyl(.095,.095,.018,glass,0,.01,0,poisonGlass);
 let glassRim=mesh(new T.TorusGeometry(.12,.008,8,40),brass,0,.3,0,poisonGlass);glassRim.rotation.x=Math.PI/2;
 const poisonLiquid=cyl(.107,.09,.20,mat('#668744',.22),0,.11,0,poisonGlass);
 const cardTextures=new Map();function cardFace(label){if(cardTextures.has(label))return cardTextures.get(label);let c=document.createElement('canvas');c.width=256;c.height=384;let x=c.getContext('2d');x.fillStyle='#e5d6b6';x.fillRect(0,0,256,384);x.strokeStyle='#9b794d';x.lineWidth=9;x.strokeRect(12,12,232,360);x.fillStyle=/[♥♦]/.test(label)?'#962d25':'#261c14';x.font='bold 57px Georgia';x.fillText(label,25,76);x.textAlign='center';x.font='bold 94px Georgia';x.fillText(label,128,232);let map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const material=new T.MeshStandardMaterial({map,roughness:.78});cardTextures.set(label,material);return material}

 // Public table pile: geometry contains no private card ranks.
 const playedCards=[], revealedCards=[];let pileRound=null,pileCount=0,pileReveal=null;
 function clearCards(list){for(const c of list){scene.remove(c);c.geometry.dispose()}list.length=0}
 function syncPile(g){
  if(g.mode!=='deck'){clearCards(playedCards);clearCards(revealedCards);pileRound=null;pileReveal=null;return}
  if(pileRound!==g.round){clearCards(playedCards);pileRound=g.round;pileCount=0}
  let n=0;
  for(const play of g.tablePlays||[])for(let j=0;j<play.count;j++,n++){
   if(n<pileCount)continue;
   const angle=play.by*Math.PI/2, c=box(.34,.014,.5,cardBack,0,1.08,0);
   c.userData={start:performance.now()+j*90,from:new T.Vector3(Math.sin(angle)*1.9,1.3,Math.cos(angle)*1.9),to:new T.Vector3(.48+(n%3)*.075,1.07+n*.017,.35+(n%2)*.06),spin:(n%5-2)*.16};playedCards.push(c);
  }pileCount=n;
  if(g.lastReveal?.title==='Card challenge'&&pileReveal!==g.lastReveal.id){
   pileReveal=g.lastReveal.id;clearCards(revealedCards);
   g.lastReveal.rows[0].values.forEach((v,i)=>{const c=box(.4,.016,.58,[cardBack,cardBack,cardFace(String(v)),cardBack,cardBack,cardBack],(i-1)*.45,1.1,.94);c.userData.start=performance.now()+i*120;revealedCards.push(c)});
  }
 }
 window.addEventListener('table-reset',()=>{clearCards(playedCards);clearCards(revealedCards);pileRound=null;pileCount=0;pileReveal=null});
 let privateOpen=false,peekAmount=0,tableMode='dice',roundStart=0,sceneRound=null,handSize=5;
 window.addEventListener('hand-peek',e=>privateOpen=e.detail.open);
 const raycaster=new T.Raycaster(),pointer=new T.Vector2();let tapStart=null;
 renderer.domElement.addEventListener('pointerdown',e=>tapStart=[e.clientX,e.clientY]);
 renderer.domElement.addEventListener('pointerup',e=>{if(!tapStart||Math.hypot(e.clientX-tapStart[0],e.clientY-tapStart[1])>8)return;const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const targets=tableMode==='dice'?[cup,...dice]:cards.filter(c=>c.visible);if(raycaster.intersectObjects(targets,true).length)window.dispatchEvent(new CustomEvent('request-peek'));else if(raycaster.intersectObject(poisonGlass,true).length){document.getElementById('sceneEvent').textContent=tableMode==='dice'?'Poison glass · two drinks eliminate you':'Your glass';}});
 const hands=new T.Group();scene.add(hands);for(const side of [-1,1]){let sleeve=mesh(new T.CapsuleGeometry(.085,.46,5,16),mat('#49352a'),side*.47,1.16,2.78,hands);sleeve.rotation.x=Math.PI/2;hand(hands,side*.47,1.21,2.45)}
 const gripHand=hand(ownGun,0,-.16,.16);gripHand.rotation.x=1.1;gripHand.rotation.z=1.4;
 let yaw=0,pitch=-.16,zoom=65,view='seat',drag=null,time=0,currentSeat=0,playerCount=4,effect=null,prev=null,mutedMotion=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;mutedMotion=reduced;
 let flashLight=new T.PointLight('#ffc16b',0,5);scene.add(flashLight);
 const smokeCanvas=document.createElement('canvas');smokeCanvas.width=smokeCanvas.height=128;const smokeCtx=smokeCanvas.getContext('2d');const gradient=smokeCtx.createRadialGradient(64,64,2,64,64,64);gradient.addColorStop(0,'rgba(180,168,148,.35)');gradient.addColorStop(.35,'rgba(150,142,132,.2)');gradient.addColorStop(1,'rgba(130,124,117,0)');smokeCtx.fillStyle=gradient;smokeCtx.fillRect(0,0,128,128);const smokeMap=new T.CanvasTexture(smokeCanvas);const smoke=[];for(let i=0;i<9;i++){let p=new T.Sprite(new T.SpriteMaterial({map:smokeMap,transparent:true,opacity:0,depthWrite:false}));scene.add(p);smoke.push(p)}

 function resize(){const {width,height}=host.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D saloon. Drag to look; arrow keys look around; R resets view.');
 renderer.domElement.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId)});
 renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.004;pitch=Math.max(-.8,Math.min(.5,pitch-(e.clientY-drag[1])*.003));drag=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(38,Math.min(85,zoom+e.deltaY*.025))},{passive:false});
 renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')yaw+=.1;if(e.key==='ArrowRight')yaw-=.1;if(e.key==='ArrowUp')pitch=Math.min(.5,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.08);if(e.key.toLowerCase()==='r'){yaw=0;pitch=-.16;zoom=65}});
 document.getElementById('resetView').onclick=()=>{yaw=0;pitch=-.16;zoom=65};
 document.getElementById('cameraView').onclick=()=>{view=view==='seat'?'overview':'seat';document.getElementById('cameraView').textContent=view==='seat'?'Table overview':'First-person seat'};
 document.getElementById('motionButton').onclick=()=>{mutedMotion=!mutedMotion;document.getElementById('motionButton').textContent=mutedMotion?'Effects: gentle':'Effects: cinematic'};
 document.getElementById('motionButton').textContent=mutedMotion?'Effects: gentle':'Effects: cinematic';
 document.getElementById('fullView').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else document.getElementById('gameScreen').requestFullscreen?.()};
 const effectQueue=[];
 function fire(kind,who){if(effect&&(effect.kind==='shot'||effect.kind==='click')){if(kind==='shot'||kind==='click')effectQueue.push({kind,who});return}effect={kind,who,start:performance.now(),sounded:false,rate:window.animationRate||1};if(kind==='shot'||kind==='click'){window.cinematicUntil=performance.now()+3500/(window.animationRate||1);document.body.classList.add('is-cinematic');}document.getElementById('sceneEvent').textContent=kind==='shot'||kind==='click'?'One deep breath…':kind==='drink'?'Poison taken':kind==='card'?'Cards on the table':'Dice rolled';if(kind!=='shot'&&kind!=='click')window.gameAudio?.(kind)}
 document.getElementById('rehearseShot').onclick=()=>fire('shot',currentSeat);
 window.addEventListener('table-reset',()=>{prev=null;sceneRound=null;privateOpen=false;effect=null;effectQueue.length=0;document.body.classList.remove('is-cinematic')});
 window.addEventListener('table-state',e=>{let g=e.detail.game;currentSeat=e.detail.seat||0;if(!g)return;playerCount=g.players.length;tableMode=g.mode;syncPile(g);if(sceneRound!==g.round||prev?.mode!==g.mode){sceneRound=g.round;roundStart=performance.now();privateOpen=false;peekAmount=0;}
  playerGroups.forEach((p,i)=>{p.visible=i<g.players.length&&(view!=='seat'||i!==currentSeat);p.userData.alive=g.players[i]?.alive!==false});
  let mine=g.players[currentSeat];handSize=g.mode==='poker'?2:(mine?.hand?.length||0);cup.visible=g.mode==='dice';poisonGlass.visible=g.mode==='dice';poisonLiquid.scale.y=Math.max(.02,1-(mine?.poison||0)/2);poisonLiquid.position.y=.015+.1*poisonLiquid.scale.y;
  for(let i=0;i<5;i++){dice[i].visible=g.mode==='dice';dice[i].scale.setScalar(.65);if(mine?.dice?.[i])dice[i].material[2]=dm[mine.dice[i]-1];cards[i].visible=['deck','poker'].includes(g.mode)&&i<handSize;if(cards[i].visible){let label=g.mode==='poker'?mine.cards[i]?.label:mine.hand[i];cards[i].material=[cardBack,cardBack,cardFace(String(label||'')),cardBack,cardBack,cardBack];}}

  if(prev){for(const event of sceneEvents(g,prev))fire(event.kind,event.who)}else fire(g.mode==='dice'?'roll':'card',currentSeat);prev={round:g.round,mode:g.mode,log:[...g.log]};

 });
 function frame(now){requestAnimationFrame(frame);if(document.hidden||!document.body.classList.contains('in-game'))return;time=now*.001;const a=currentSeat*Math.PI/2;
  playedCards.forEach(c=>{const u=c.userData,t=mutedMotion?1:Math.max(0,Math.min(1,(now-u.start)/650*(window.animationRate||1)));c.position.copy(u.from).lerp(u.to,1-(1-t)**3);c.position.y+=Math.sin(t*Math.PI)*.35;c.rotation.set(0,u.spin+(1-t)*1.4,0)});
  revealedCards.forEach(c=>{const t=mutedMotion?1:Math.max(0,Math.min(1,(now-c.userData.start)/650));c.rotation.x=Math.PI*(1-t);c.visible=now-c.userData.start<8500;});
  hands.rotation.y=a;personal.rotation.y=a;if(ownGun.parent!==personal)personal.add(ownGun);ownGun.visible=true;ownGun.position.set(camera.aspect<.8?.48:.88,1.16,camera.aspect<.8?.65:.9);ownGun.rotation.set(0,-.55,Math.PI/2);ownGun.scale.setScalar(.9);ownGun.userData.flash.visible=false;ownGun.userData.hammer.rotation.x=-.4;gripHand.visible=false;playerGroups.forEach((p,i)=>{p.visible=i<playerCount&&(i!==currentSeat||view==='overview');const blink=!mutedMotion&&Math.sin(time*.68+i*1.7)>.997;p.userData.eyes.scale.y=blink?.12:1;const reaction=effect?.who===i?effect:null;const elapsed=reaction?(now-reaction.start)/1000*reaction.rate:0;const waitingShot=reaction&&(reaction.kind==='shot'||reaction.kind==='click')&&elapsed<1.65;const dead=p.userData.alive===false&&!waitingShot;const targetLean=dead?.28:0;p.rotation.z+=(targetLean-p.rotation.z)*.055;p.position.y+=((dead?-.4:0)-p.position.y)*.055;const head=p.userData.head;if(head){head.rotation.y=mutedMotion?0:Math.sin(time*.7+i*2)*.07;head.rotation.x=dead?.25:waitingShot?-.09+Math.sin(time*9)*.013:reaction?.kind==='click'&&elapsed>1.65?Math.sin((elapsed-1.65)*4)*.10:0;head.rotation.z=dead?.13:0}});
  if(view==='seat'){camera.position.set(Math.sin(a)*3.15,1.82,Math.cos(a)*3.15);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw+a,0);hands.visible=true}else{camera.position.set(Math.sin(yaw+a)*6,5+pitch*2,Math.cos(yaw+a)*6);camera.lookAt(0,.9,0);hands.visible=false}

  const dealTime=(now-roundStart)/1000*(window.animationRate||1);peekAmount+=(Number(privateOpen)-peekAmount)*(mutedMotion?1:.14);
  const rolling=tableMode==='dice'&&dealTime<1.5;poisonGlass.position.set(.76,1.055,1.91);poisonGlass.rotation.z=0;
  cup.position.set(rolling&&!mutedMotion?Math.sin(dealTime*35)*.035:0,1.05+peekAmount*.52,1.7-peekAmount*.2);cup.rotation.z=rolling&&!mutedMotion?Math.sin(dealTime*30)*.1:peekAmount*-.24;
  dice.forEach((d,i)=>{d.position.set((i%3-1)*.16,1.13,1.66+Math.floor(i/3)*.17);d.visible=tableMode==='dice'&&(privateOpen||peekAmount>.15);d.rotation.set(0,0,0);if(rolling&&!mutedMotion){d.position.y+=Math.abs(Math.sin(dealTime*17+i))*.12;d.rotation.set(dealTime*12+i,dealTime*9,dealTime*15)}});
  cards.forEach((c,i)=>{if(!c.visible)return;const t=mutedMotion?1:Math.max(0,Math.min(1,(dealTime-i*.15)/.65));const ease=1-(1-t)**3;c.position.set((i-(handSize-1)/2)*.24*ease,1.08+Math.sin(t*Math.PI)*.25,1.12+ease*.53);c.rotation.set(Math.PI*(1-peekAmount), (i-(handSize-1)/2)*.08,0);});
  camera.fov=zoom;camera.updateProjectionMatrix();flashLight.intensity=0;guns.forEach(g=>{g.userData.flash.visible=false;g.rotation.set(0,0,0);g.position.set(.63,1.07,-.85)});smoke.forEach(s=>s.material.opacity=0);
  if(effect){let dt=(now-effect.start)/1000*effect.rate;if(dt>3.5){effect=null;document.body.classList.remove('is-cinematic');document.getElementById('sceneEvent').textContent='';if(effectQueue.length){let next=effectQueue.shift();fire(next.kind,next.who)}}else{
   const firstPerson=effect.who===currentSeat&&view==='seat',gun=firstPerson?ownGun:guns[effect.who];
   if(effect.kind==='drink'&&effect.who===currentSeat&&!mutedMotion){const lift=Math.sin(Math.min(1,dt/2)*Math.PI);poisonGlass.position.set(.76-lift*.3,1.055+lift*.55,1.91+lift*.55);poisonGlass.rotation.z=-lift*.5;}
   if(effect.kind==='shot'||effect.kind==='click'){
    const pose=shotPose(dt);if(effect.kind==='click'){pose.recoil=0;pose.settle=0;}gun.userData.cylinder.rotation.z=pose.cock*Math.PI/3;gun.userData.hammer.rotation.x=-.4-pose.cock*.6;
    gun.position.set(.63-pose.lift*.31,1.07+pose.lift*.72,-.85+pose.lift*.55);gun.rotation.set(-pose.lift*.1,-pose.lift*1.4,pose.recoil*.3);
    if(firstPerson){
     const restPosition=new T.Vector3(camera.aspect<.8?.48:.88,1.16,camera.aspect<.8?.65:.9);
     camera.updateMatrixWorld();personal.updateMatrixWorld();
     const aim=camera.localToWorld(new T.Vector3(.27,-.12+pose.breath,-.54+pose.recoil*.065));personal.worldToLocal(aim);
     ownGun.position.copy(restPosition).lerp(aim,pose.lift);ownGun.scale.setScalar(.9-.2*pose.lift);
     const restRotation=new T.Quaternion().setFromEuler(new T.Euler(0,-.55,Math.PI/2));
     const aimRotation=camera.quaternion.clone().multiply(new T.Quaternion().setFromEuler(new T.Euler(.08+pose.recoil*.22+pose.settle*.025,-.7,-.24)));
     const localAim=personal.getWorldQuaternion(new T.Quaternion()).invert().multiply(aimRotation);
     ownGun.quaternion.copy(restRotation).slerp(localAim,pose.lift);gripHand.visible=pose.lift>.12;hands.visible=pose.lift<.2;
    }
    if(dt>.82&&!effect.cocked){effect.cocked=true;window.gameAudio?.('click');document.getElementById('sceneEvent').textContent='Steady…';}

    if(pose.trigger&&!effect.sounded){effect.sounded=true;window.gameAudio?.(effect.kind);document.getElementById('sceneEvent').textContent=effect.kind==='shot'?'BANG':'Click. Still breathing.'}
    gun.updateWorldMatrix(true,true);gun.userData.flash.getWorldPosition(flashLight.position);
    if(effect.kind==='shot'&&pose.flash&&!mutedMotion){gun.userData.flash.visible=true;flashLight.intensity=85;camera.rotation.z=pose.recoil*.012+pose.settle*.004;}
    if(effect.kind==='shot'&&pose.trigger&&!mutedMotion)smoke.forEach((p,i)=>{const t=dt-1.65;p.position.copy(flashLight.position);p.position.y+=t*.3+i*.012;p.position.x+=Math.sin(i*2.4)*t*.12;p.scale.setScalar(.15+t*.28+i*.02);p.material.opacity=Math.max(0,.8-t*.4)})
   }


  }}

  renderer.render(scene,camera);
 }resize();requestAnimationFrame(frame);document.getElementById('viewHint').textContent='Drag to look · scroll to zoom · arrow keys · R to reset';
}
