import * as T from './vendor/three.module.min.js';
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
 const light=new T.PointLight('#ffb355',42,10,2);light.position.set(0,2.5,.1);light.castShadow=true;light.shadow.mapSize.set(1024,1024);scene.add(light);scene.add(new T.HemisphereLight('#e8c69a','#28140e',1.6));
 for(const x of [-5,5]){let l=new T.PointLight('#ff752b',65,13);l.position.set(x,3,-6);scene.add(l);cyl(.6,.1,.25,brass,x,3.5,-6)}

 // Ceiling beams, windows and secondary tables give free-look a complete room.
 box(22,.18,22,wood,0,6.8,0);box(22,7,.25,wood,0,3.4,9);
 for(let x=-8;x<=8;x+=4)box(.24,.36,18,trim,x,6.55,0);
 const night=new T.MeshStandardMaterial({color:'#203747',emissive:'#1c3041',emissiveIntensity:.3,roughness:.25});
 for(const x of [-9.8,9.8])for(const z of [-4,3]){let window=box(.08,2,1.6,night,x,3,z);box(.14,2.2,.09,trim,x,3,z-.84);box(.14,2.2,.09,trim,x,3,z+.84);box(.14,.1,1.7,trim,x,2,z);box(.14,.1,1.7,trim,x,4,z);box(.16,2,.06,trim,x,3,z);box(.16,.08,1.7,trim,x,3,z);}
 for(const x of [-6,6]){cyl(1.2,1.15,.14,wood,x,.9,3.7);cyl(.15,.35,.85,wood,x,.4,3.7);for(const dx of [-1.4,1.4]){box(.65,.12,.65,wood,x+dx,.5,3.7);box(.65,.9,.09,wood,x+dx,1,4);}}
 const warmGlass=mat('#6c542c',.12,.3);for(const a of [0,1,2,3].map(x=>x*Math.PI/2)){let x=Math.sin(a+.3)*2.2,z=Math.cos(a+.3)*2.2;cyl(.07,.08,.45,warmGlass,x,1.28,z);cyl(.033,.04,.19,brass,x,1.59,z)}
 let playerGroups=[],guns=[],dice=[],cards=[];
 function gun(parent,x,y,z){
  const g=new T.Group();g.position.set(x,y,z);parent.add(g);
  const steel=mat('#626169',.32,.65),edge=mat('#a6a1a0',.23,.75),grip=mat('#3a1c10',.7);
  let barrel=cyl(.046,.048,.48,steel,0,.035,-.24,g);barrel.rotation.x=Math.PI/2;
  let bore=mesh(new T.RingGeometry(.024,.047,32),edge,0,.035,-.485,g);bore.rotation.y=Math.PI;
  mesh(new T.CircleGeometry(.024,24),mat('#030303'),0,.035,-.484,g).rotation.y=Math.PI;
  box(.075,.035,.43,steel,0,.075,-.22,g);box(.018,.042,.045,dark,0,.105,-.43,g);
  const cylinder=new T.Group();cylinder.position.set(0,.005,.055);g.add(cylinder);
  cyl(.083,.083,.16,steel,0,0,0,cylinder).rotation.x=Math.PI/2;
  for(let i=0;i<6;i++){let a=i*Math.PI/3;let c=cyl(.021,.021,.165,dark,Math.sin(a)*.059,Math.cos(a)*.059,0,cylinder);c.rotation.x=Math.PI/2;sphere(.014,brass,Math.sin(a)*.054,Math.cos(a)*.054,.084,cylinder)}
  box(.035,.15,.24,steel,-.076,0,.06,g);box(.035,.15,.24,steel,.076,0,.06,g);box(.11,.035,.25,steel,0,.09,.06,g);
  let handle=box(.1,.23,.095,grip,0,-.17,.15,g);handle.rotation.x=-.28;
  for(let y=-.24;y<-.08;y+=.025)box(.104,.004,.065,edge,0,y,.177,g);
  let guard=mesh(new T.TorusGeometry(.07,.009,8,24),steel,0,-.115,.015,g);guard.rotation.y=Math.PI/2;guard.scale.y=1.1;
  box(.017,.065,.014,edge,0,-.08,.022,g).rotation.x=.35;let hammer=box(.026,.065,.055,steel,0,.12,.17,g);hammer.rotation.x=-.4;
  const flash=new T.Group();flash.position.set(0,.035,-.5);g.add(flash);let flame=mesh(new T.ConeGeometry(.09,.35,9),new T.MeshBasicMaterial({color:'#ffd060',transparent:true,opacity:.85,blending:T.AdditiveBlending,depthWrite:false}),0,0,-.12,flash);flame.rotation.x=-Math.PI/2;sphere(.07,new T.MeshBasicMaterial({color:'#fffce3'}),0,0,0,flash);flash.visible=false;
  g.userData={flash,cylinder,hammer};return g;
 }
 function hand(parent,x,y,z,rotation=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.z=rotation;parent.add(g);let palm=sphere(.085,skin,0,0,0,g);palm.scale.set(.8,.48,1.25);for(let i=0;i<4;i++){let f=mesh(new T.CapsuleGeometry(.018,.09,4,8),skin,(i-1.5)*.035,0,-.10,g);f.rotation.x=Math.PI/2;let nail=box(.018,.004,.027,ivory,(i-1.5)*.035,.022,-.145,g)}let thumb=mesh(new T.CapsuleGeometry(.023,.07,4,8),skin,.077,-.01,-.025,g);thumb.rotation.z=.7;thumb.rotation.x=1;return g}
 function person(angle,index){let g=new T.Group();g.position.set(Math.sin(angle)*3.15,0,Math.cos(angle)*3.15);g.rotation.y=angle+0;scene.add(g);let clothes=mat(['#342c29','#3f2730','#243238','#674730'][index]);
  box(.9,.2,.85,wood,0,.5,0,g);box(.95,1.2,.14,wood,0,1,.38,g);cyl(.37,.3,.83,clothes,0,1.12,0,g);let head=sphere(.19,skin,0,1.87,-.04,g);head.scale.set(.86,1.2,.92);sphere(.17,mat('#261811'),0,1.99,.015,g);cyl(.37,.38,.05,wood,0,2.05,-.04,g);cyl(.24,.26,.22,wood,0,2.17,-.04,g);
  for(const side of [-1,1]){let arm=mesh(new T.CapsuleGeometry(.095,.36,5,12),clothes,side*.42,1.27,-.12,g);arm.rotation.x=-.65;let fore=mesh(new T.CapsuleGeometry(.09,.42,5,12),clothes,side*.4,1.09,-.48,g);fore.rotation.x=Math.PI/2;hand(g,side*.4,1.1,-.79);box(.23,.58,.27,clothes,side*.21,.43,-.15,g)}
  for(const side of [-1,1]){sphere(.04,skin,side*.175,1.87,-.04,g);sphere(.014,ivory,side*.08,1.89,-.21,g);sphere(.008,dark,side*.08,1.89,-.23,g);box(.09,.025,.025,dark,side*.08,1.935,-.218,g)}
let nose=sphere(.032,skin,0,1.83,-.23,g);nose.scale.set(.7,1,1);box(.085,.018,.015,dark,0,1.755,-.215,g);cyl(.1,.12,.17,skin,0,1.62,-.02,g);for(let y=1;y<1.5;y+=.12)sphere(.013,brass,0,y,-.33,g);box(.05,.5,.035,trim,0,1.22,-.33,g);g.userData.baseY=0;playerGroups.push(g);guns.push(gun(g,.63,1.07,-.85));return g;
 }
 for(let i=0;i<4;i++)person(i*Math.PI/2,i);
 function diceMat(face){let c=document.createElement('canvas');c.width=c.height=128;let x=c.getContext('2d');x.fillStyle='#ead8af';x.fillRect(0,0,128,128);x.strokeStyle='#bca078';x.lineWidth=8;x.strokeRect(3,3,122,122);const spots={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};x.fillStyle='#2a180f';for(let [a,b]of spots[face]){x.beginPath();x.arc(64+a*31,64+b*31,10,0,Math.PI*2);x.fill()}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.35})}
 const dm=[1,2,3,4,5,6].map(diceMat);
 for(let i=0;i<5;i++){let d=box(.2,.2,.2,[dm[0],dm[5],dm[i],dm[6-i-1],dm[1],dm[4]],(i-2)*.26,1.17,1.78);dice.push(d)}
 const cardBack=mat('#852d23');for(let i=0;i<5;i++){let c=box(.34,.014,.5,cardBack,(i-2)*.28,1.08,1.68);c.rotation.y=(i-2)*.08;cards.push(c)}
 for(let i=1;i<4;i++){let a=i*Math.PI/2;cyl(.18,.14,.3,mat('#593a21'),Math.sin(a)*2.22,1.2,Math.cos(a)*2.22);cyl(.105,.085,.27,mat('#b47a28',.15,.2),Math.sin(a+.25)*2.3,1.18,Math.cos(a+.25)*2.3)}
 const personal=new T.Group();scene.add(personal);[...dice,...cards].forEach(m=>personal.attach(m));const ownGun=gun(scene,0,0,0);ownGun.visible=false;ownGun.scale.setScalar(.7);const fill=new T.PointLight('#b6c6e0',1.5,3);fill.position.set(-.3,.3,-.2);camera.add(fill);

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
 function fire(kind,who){if(effect&&(effect.kind==='shot'||effect.kind==='click')){if(kind==='shot'||kind==='click')effectQueue.push({kind,who});return}effect={kind,who,start:performance.now(),sounded:false};if(kind==='shot'||kind==='click'){window.cinematicUntil=performance.now()+3000;document.body.classList.add('is-cinematic');}document.getElementById('sceneEvent').textContent=kind==='shot'||kind==='click'?'One deep breath…':kind==='drink'?'Poison taken':kind==='card'?'Cards on the table':'Dice rolled';if(kind!=='shot'&&kind!=='click')window.gameAudio?.(kind)}
 document.getElementById('rehearseShot').onclick=()=>fire('shot',currentSeat);
 window.addEventListener('table-reset',()=>{prev=null;sceneRound=null;privateOpen=false;effect=null;effectQueue.length=0;document.body.classList.remove('is-cinematic')});
 window.addEventListener('table-state',e=>{let g=e.detail.game;currentSeat=e.detail.seat||0;if(!g)return;playerCount=g.players.length;tableMode=g.mode;if(sceneRound!==g.round||prev?.mode!==g.mode){sceneRound=g.round;roundStart=performance.now();privateOpen=false;peekAmount=0;}
  playerGroups.forEach((p,i)=>{p.visible=i<g.players.length&&(view!=='seat'||i!==currentSeat);p.userData.alive=g.players[i]?.alive!==false});
  let mine=g.players[currentSeat];handSize=g.mode==='poker'?2:(mine?.hand?.length||0);cup.visible=g.mode==='dice';poisonGlass.visible=g.mode==='dice';poisonLiquid.scale.y=Math.max(.02,1-(mine?.poison||0)/2);poisonLiquid.position.y=.015+.1*poisonLiquid.scale.y;
  for(let i=0;i<5;i++){dice[i].visible=g.mode==='dice';dice[i].scale.setScalar(.65);if(mine?.dice?.[i])dice[i].material[2]=dm[mine.dice[i]-1];cards[i].visible=['deck','poker'].includes(g.mode)&&i<handSize;if(cards[i].visible){let label=g.mode==='poker'?mine.cards[i]?.label:mine.hand[i];cards[i].material=[cardBack,cardBack,cardFace(String(label||'')),cardBack,cardBack,cardBack];}}

  if(prev){for(const event of sceneEvents(g,prev))fire(event.kind,event.who)}else fire(g.mode==='dice'?'roll':'card',currentSeat);prev={round:g.round,mode:g.mode,log:[...g.log]};

 });
 function frame(now){requestAnimationFrame(frame);if(document.hidden||!document.body.classList.contains('in-game'))return;time=now*.001;const a=currentSeat*Math.PI/2;
  hands.rotation.y=a;personal.rotation.y=a;ownGun.visible=false;playerGroups.forEach((p,i)=>{p.visible=i<playerCount&&(i!==currentSeat||view==='overview');p.rotation.z=p.userData.alive===false?.2:0;p.position.y=p.userData.alive===false?-.45:Math.sin(time*.8+i)*.006});
  if(view==='seat'){camera.position.set(Math.sin(a)*3.15,1.82,Math.cos(a)*3.15);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw+a,0);hands.visible=true}else{camera.position.set(Math.sin(yaw+a)*6,5+pitch*2,Math.cos(yaw+a)*6);camera.lookAt(0,.9,0);hands.visible=false}

  const dealTime=(now-roundStart)/1000;peekAmount+=(Number(privateOpen)-peekAmount)*(mutedMotion?1:.14);
  const rolling=tableMode==='dice'&&dealTime<1.5;poisonGlass.position.set(.76,1.055,1.91);poisonGlass.rotation.z=0;
  cup.position.set(rolling&&!mutedMotion?Math.sin(dealTime*35)*.035:0,1.05+peekAmount*.52,1.7-peekAmount*.2);cup.rotation.z=rolling&&!mutedMotion?Math.sin(dealTime*30)*.1:peekAmount*-.24;
  dice.forEach((d,i)=>{d.position.set((i%3-1)*.16,1.13,1.66+Math.floor(i/3)*.17);d.visible=tableMode==='dice'&&(privateOpen||peekAmount>.15);d.rotation.set(0,0,0);if(rolling&&!mutedMotion){d.position.y+=Math.abs(Math.sin(dealTime*17+i))*.12;d.rotation.set(dealTime*12+i,dealTime*9,dealTime*15)}});
  cards.forEach((c,i)=>{if(!c.visible)return;const t=mutedMotion?1:Math.max(0,Math.min(1,(dealTime-i*.15)/.65));const ease=1-(1-t)**3;c.position.set((i-(handSize-1)/2)*.24*ease,1.08+Math.sin(t*Math.PI)*.25,1.12+ease*.53);c.rotation.set(Math.PI*(1-peekAmount), (i-(handSize-1)/2)*.08,0);});
  camera.fov=zoom;camera.updateProjectionMatrix();flashLight.intensity=0;guns.forEach(g=>{g.userData.flash.visible=false;g.rotation.set(0,0,0);g.position.set(.63,1.07,-.85)});smoke.forEach(s=>s.material.opacity=0);
  if(effect){let dt=(now-effect.start)/1000;if(dt>3){effect=null;document.body.classList.remove('is-cinematic');document.getElementById('sceneEvent').textContent='';if(effectQueue.length){let next=effectQueue.shift();fire(next.kind,next.who)}}else{
   const firstPerson=effect.who===currentSeat&&view==='seat',gun=firstPerson?ownGun:guns[effect.who];
   if(effect.kind==='drink'&&effect.who===currentSeat&&!mutedMotion){const lift=Math.sin(Math.min(1,dt/2)*Math.PI);poisonGlass.position.set(.76-lift*.3,1.055+lift*.55,1.91+lift*.55);poisonGlass.rotation.z=-lift*.5;}
   if(effect.kind==='shot'||effect.kind==='click'){
    const pose=shotPose(dt);gun.userData.cylinder.rotation.z=pose.cock*Math.PI/3;gun.userData.hammer.rotation.x=-.4-pose.cock*.6;
    gun.position.set(.63-pose.lift*.31,1.07+pose.lift*.72,-.85+pose.lift*.55);gun.rotation.set(-pose.lift*.1,-pose.lift*1.4,pose.recoil*.3);
    if(firstPerson){ownGun.visible=true;ownGun.userData.flash.visible=false;camera.add(ownGun);gun.position.set(.28,-.42+pose.lift*.3,-.7+pose.lift*.18+pose.recoil*.09);gun.rotation.set(.08+pose.recoil*.3,pose.lift*-.7,-.12-pose.lift*.12);hands.visible=false;}
    else if(ownGun.parent===camera){scene.attach(ownGun)}
    if(dt>=1.3&&!effect.sounded){effect.sounded=true;window.gameAudio?.(effect.kind);document.getElementById('sceneEvent').textContent=effect.kind==='shot'?'BANG':'Click. Still breathing.'}
    gun.updateWorldMatrix(true,true);gun.userData.flash.getWorldPosition(flashLight.position);
    if(effect.kind==='shot'&&pose.flash&&!mutedMotion){gun.userData.flash.visible=true;flashLight.intensity=85;camera.rotation.z=pose.recoil*.012;}
    if(effect.kind==='shot'&&dt>=1.3&&!mutedMotion)smoke.forEach((p,i)=>{const t=dt-1.3;p.position.copy(flashLight.position);p.position.y+=t*.3+i*.012;p.position.x+=Math.sin(i*2.4)*t*.12;p.scale.setScalar(.15+t*.28+i*.02);p.material.opacity=Math.max(0,.8-t*.4)})
   }


  }}

  renderer.render(scene,camera);
 }resize();requestAnimationFrame(frame);document.getElementById('viewHint').textContent='Drag to look · scroll to zoom · arrow keys · R to reset';
}
