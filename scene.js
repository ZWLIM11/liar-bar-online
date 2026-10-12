import * as T from './vendor/three.module.min.js';
const host=document.getElementById('sceneHost');
try { init(); } catch(error) { host.classList.add('scene-fallback');document.getElementById('viewHint').textContent='3D unavailable on this device. The game remains playable.';console.warn('3D renderer unavailable:',error.message); }
function init(){
 const scene=new T.Scene();scene.background=new T.Color('#180e0b');scene.fog=new T.FogExp2('#25150f',.032);
 const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;host.appendChild(renderer.domElement);
 const camera=new T.PerspectiveCamera(65,1,.05,70);
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
 let playerGroups=[],guns=[],dice=[],cards=[];
 function gun(parent,x,y,z){let g=new T.Group();g.position.set(x,y,z);parent.add(g);box(.1,.1,.54,dark,0,0,-.16,g);cyl(.1,.1,.18,dark,0,-.025,.1,g).rotation.x=Math.PI/2;box(.1,.28,.13,wood,0,-.16,.15,g).rotation.x=-.35;box(.045,.05,.055,brass,0,.07,-.39,g);let flash=sphere(.1,new T.MeshBasicMaterial({color:'#fff1b0'}),0,0,-.48,g);flash.visible=false;g.userData.flash=flash;return g}
 function person(angle,index){let g=new T.Group();g.position.set(Math.sin(angle)*3.15,0,Math.cos(angle)*3.15);g.rotation.y=angle+0;scene.add(g);let clothes=mat(['#342c29','#3f2730','#243238','#674730'][index]);
  box(.9,.2,.85,wood,0,.5,0,g);box(.95,1.2,.14,wood,0,1,.38,g);cyl(.37,.3,.83,clothes,0,1.12,0,g);sphere(.235,skin,0,1.87,-.04,g);sphere(.22,mat('#261811'),0,1.97,.015,g);cyl(.37,.38,.05,wood,0,2.05,-.04,g);cyl(.24,.26,.22,wood,0,2.17,-.04,g);
  for(const side of [-1,1]){let arm=box(.18,.53,.2,clothes,side*.42,1.27,-.12,g);arm.rotation.x=-.65;let fore=box(.17,.18,.58,clothes,side*.4,1.09,-.48,g);sphere(.105,skin,side*.4,1.1,-.79,g);box(.23,.58,.27,clothes,side*.21,.43,-.15,g)}
  for(const side of [-1,1]){sphere(.065,skin,side*.23,1.87,-.04,g);sphere(.023,ivory,side*.08,1.89,-.251,g);sphere(.011,dark,side*.08,1.89,-.273,g);box(.09,.025,.025,dark,side*.08,1.935,-.257,g)}
let nose=sphere(.05,skin,0,1.83,-.268,g);nose.scale.set(.7,1,1);box(.085,.018,.015,dark,0,1.755,-.249,g);cyl(.1,.12,.17,skin,0,1.62,-.02,g);for(let y=1;y<1.5;y+=.12)sphere(.013,brass,0,y,-.33,g);box(.05,.5,.035,trim,0,1.22,-.33,g);g.userData.baseY=0;playerGroups.push(g);guns.push(gun(g,.63,1.07,-.85));return g;
 }
 for(let i=0;i<4;i++)person(i*Math.PI/2,i);
 function diceMat(face){let c=document.createElement('canvas');c.width=c.height=128;let x=c.getContext('2d');x.fillStyle='#ead8af';x.fillRect(0,0,128,128);x.strokeStyle='#bca078';x.lineWidth=8;x.strokeRect(3,3,122,122);const spots={1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],4:[[-1,-1],[1,-1],[-1,1],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]};x.fillStyle='#2a180f';for(let [a,b]of spots[face]){x.beginPath();x.arc(64+a*31,64+b*31,10,0,Math.PI*2);x.fill()}let t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.MeshStandardMaterial({map:t,roughness:.35})}
 const dm=[1,2,3,4,5,6].map(diceMat);
 for(let i=0;i<5;i++){let d=box(.2,.2,.2,[dm[0],dm[5],dm[i],dm[6-i-1],dm[1],dm[4]],(i-2)*.26,1.17,1.78);dice.push(d)}
 const cardBack=mat('#852d23');for(let i=0;i<5;i++){let c=box(.34,.014,.5,cardBack,(i-2)*.28,1.08,1.68);c.rotation.y=(i-2)*.08;cards.push(c)}
 for(let i=0;i<4;i++){let a=i*Math.PI/2;cyl(.18,.14,.3,mat('#593a21'),Math.sin(a)*2.22,1.2,Math.cos(a)*2.22);cyl(.105,.085,.27,mat('#b47a28',.15,.2),Math.sin(a+.25)*2.3,1.18,Math.cos(a+.25)*2.3)}
 const personal=new T.Group();scene.add(personal);[...dice,...cards].forEach(m=>personal.attach(m));const ownGun=gun(scene,0,0,0);ownGun.visible=false;
 const hands=new T.Group();scene.add(hands);box(.17,.16,.68,mat('#49352a'),-.5,1.19,2.83,hands);sphere(.105,skin,-.5,1.23,2.5,hands);box(.17,.16,.68,mat('#49352a'),.5,1.19,2.83,hands);sphere(.105,skin,.5,1.23,2.5,hands);
 let yaw=0,pitch=-.16,zoom=65,view='seat',drag=null,time=0,currentSeat=0,playerCount=4,effect=null,prev=null,mutedMotion=false;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;mutedMotion=reduced;
 let flashLight=new T.PointLight('#ffc16b',0,5);scene.add(flashLight);
 const smoke=[];for(let i=0;i<12;i++){let m=sphere(.05,new T.MeshBasicMaterial({color:'#b9aaa0',transparent:true,opacity:0,depthWrite:false}),0,0,0);smoke.push(m)}
 function resize(){const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(host);
 renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','3D saloon. Drag to look; arrow keys look around; R resets view.');
 renderer.domElement.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];renderer.domElement.setPointerCapture(e.pointerId)});
 renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.004;pitch=Math.max(-.8,Math.min(.5,pitch-(e.clientY-drag[1])*.003));drag=[e.clientX,e.clientY]});renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
 renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(38,Math.min(85,zoom+e.deltaY*.025))},{passive:false});
 renderer.domElement.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','r','R'].includes(e.key))e.preventDefault();if(e.key==='ArrowLeft')yaw+=.1;if(e.key==='ArrowRight')yaw-=.1;if(e.key==='ArrowUp')pitch=Math.min(.5,pitch+.08);if(e.key==='ArrowDown')pitch=Math.max(-.8,pitch-.08);if(e.key.toLowerCase()==='r'){yaw=0;pitch=-.16;zoom=65}});
 document.getElementById('resetView').onclick=()=>{yaw=0;pitch=-.16;zoom=65};
 document.getElementById('cameraView').onclick=()=>{view=view==='seat'?'overview':'seat';document.getElementById('cameraView').textContent=view==='seat'?'Table overview':'First-person seat'};
 document.getElementById('motionButton').onclick=()=>{mutedMotion=!mutedMotion;document.getElementById('motionButton').textContent=mutedMotion?'Effects: gentle':'Effects: cinematic'};
 document.getElementById('motionButton').textContent=mutedMotion?'Effects: gentle':'Effects: cinematic';
 document.getElementById('fullView').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else host.parentElement.requestFullscreen?.()};
 function fire(kind,who){effect={kind,who,start:performance.now()};let p=playerGroups[who]||playerGroups[0];flashLight.position.copy(p.position).add(new T.Vector3(0,1.4,0));document.getElementById('sceneEvent').textContent=kind==='shot'?'BANG!':kind==='click'?'Click… survived':kind==='drink'?'Poison taken':kind==='card'?'Cards on the table':'Dice rolled';if(window.gameAudio)window.gameAudio(kind)}
 window.addEventListener('table-state',e=>{let g=e.detail.game;currentSeat=e.detail.seat||0;if(!g)return;playerCount=g.players.length;
  playerGroups.forEach((p,i)=>{p.visible=i<g.players.length&&(view!=='seat'||i!==currentSeat);p.userData.alive=g.players[i]?.alive!==false});
  let mine=g.players[currentSeat];for(let i=0;i<5;i++){dice[i].visible=g.mode==='dice';if(mine?.dice?.[i])dice[i].material[2]=dm[mine.dice[i]-1];cards[i].visible=g.mode==='deck'&&i<(mine?.hand?.length||0)||g.mode==='poker'&&i<2}
  if(prev){let lines=g.log.filter(l=>!prev.log.includes(l));let eventLine=lines.find(l=>/chamber fired|eliminated by|executed|survived|pulled the trigger|drinks|placed/.test(l))||'';let who=g.players.findIndex(p=>eventLine.startsWith(p.name));if(lines.some(l=>/chamber fired|eliminated by|executed/.test(l)))fire('shot',Math.max(0,who));else if(lines.some(l=>/survived|pulled the trigger/.test(l)))fire('click',Math.max(0,who));else if(lines.some(l=>/drinks|drink\./.test(l)))fire('drink',Math.max(0,who));else if(lines.some(l=>/placed/.test(l)))fire('card',Math.max(0,who));else if(g.round!==prev.round)fire(g.mode==='dice'?'roll':'card',currentSeat)}else fire(g.mode==='dice'?'roll':'card',currentSeat);prev={round:g.round,log:[...g.log]};
 });
 function frame(now){requestAnimationFrame(frame);if(document.hidden)return;time=now*.001;const a=currentSeat*Math.PI/2;
  hands.rotation.y=a;personal.rotation.y=a;ownGun.visible=false;playerGroups.forEach((p,i)=>{p.visible=i<playerCount&&(i!==currentSeat||view==='overview');p.rotation.z=p.userData.alive===false?.2:0;p.position.y=p.userData.alive===false?-.45:Math.sin(time*.8+i)*.006});
  if(view==='seat'){camera.position.set(Math.sin(a)*3.15,1.82,Math.cos(a)*3.15);camera.rotation.order='YXZ';camera.rotation.set(pitch,yaw+a,0);hands.visible=true}else{camera.position.set(Math.sin(yaw+a)*6,5+pitch*2,Math.cos(yaw+a)*6);camera.lookAt(0,.9,0);hands.visible=false}
  camera.fov=zoom;camera.updateProjectionMatrix();flashLight.intensity=0;guns.forEach(g=>{g.userData.flash.visible=false;g.rotation.set(0,0,0);g.position.set(.63,1.07,-.85)});smoke.forEach(s=>s.material.opacity=0);
  if(effect){let dt=(now-effect.start)/1000;if(dt>2){effect=null;document.getElementById('sceneEvent').textContent=''}else{let firstPerson=effect.who===currentSeat&&view==='seat';let gun=firstPerson?ownGun:guns[effect.who];if(effect.kind==='shot'||effect.kind==='click'){let lift=Math.sin(Math.min(1,dt/1.5)*Math.PI);gun.position.set(.63-lift*.28,1.07+lift*.67,-.85+lift*.77);gun.rotation.set(-lift*.18,-lift*1.4,lift*.1);if(firstPerson){ownGun.visible=true;ownGun.userData.flash.visible=false;gun.position.set(Math.sin(a)*2.45+Math.cos(a)*.46,1.32+lift*.15,Math.cos(a)*2.45-Math.sin(a)*.46);gun.rotation.set(-lift*.4,a,0);}if(effect.kind==='shot'&&dt>.3&&dt<.45&&!mutedMotion){gun.userData.flash.visible=true;flashLight.intensity=60;camera.rotation.z=Math.sin(dt*100)*.008}if(effect.kind==='shot'&&dt>.35&&!mutedMotion)smoke.forEach((s,i)=>{s.position.copy(flashLight.position);s.position.y+=dt*.4+i*.025;s.position.x+=Math.sin(i)*dt*.15;s.scale.setScalar(1+dt*2);s.material.opacity=Math.max(0,.17-dt*.08)})}if(effect.kind==='roll'&&!mutedMotion)dice.forEach((d,i)=>{d.position.y=1.17+Math.abs(Math.sin(dt*10+i))*.25*Math.max(0,1-dt);d.rotation.z=dt<1?dt*10:0});if(effect.kind==='card'&&!mutedMotion)cards.forEach((c,i)=>{c.position.y=1.07+Math.sin(Math.min(dt,1)*Math.PI)*.12})}}
  renderer.render(scene,camera);
 }resize();requestAnimationFrame(frame);document.getElementById('viewHint').textContent='Drag to look · scroll to zoom · arrow keys · R to reset';
}
