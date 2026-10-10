import * as THREE from 'three';

const root = document.querySelector('#game-root');
const loading = document.querySelector('#loading');
const questTitle = document.querySelector('#quest-title');
const objective = document.querySelector('#objective');
const dialogueBox = document.querySelector('#dialogue');
const speakerEl = document.querySelector('#speaker');
const lineEn = document.querySelector('#line-en');
const lineJa = document.querySelector('#line-ja');
const toastEl = document.querySelector('#toast');
const result = document.querySelector('#result');
const hpBar = document.querySelector('#hp-bar');
const hpText = document.querySelector('#hp-text');

let scene, camera, renderer, player, waguri, gate, yokai, clock;
let yaw = 0, pitch = -0.12, hp = 100, enemyHp = 100, stage = 0, dialogueIndex = 0;
let isTalking = false, missionDone = false, attackCooldown = 0, invulnerable = 0;
const keys = new Set();
const touchMoves = new Set();
const saveKey = 'tyu-awakening-save-v1';
const saved = (()=>{try{return JSON.parse(localStorage.getItem(saveKey)||'{}')}catch{return {}}})();
stage = Math.min(Number(saved.stage)||0, 3);
missionDone = stage >= 3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function mat(color, roughness=.75, metalness=0){return new THREE.MeshStandardMaterial({color,roughness,metalness});}
function box(w,h,d,material,x,y,z){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;}
function makePerson({x=0,z=0,hair=0x20243a,coat=0x343c5a,skin=0xe8bda4,hood=false}={}){
  const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);
  const skinM=mat(skin), hairM=mat(hair), coatM=mat(coat), dark=mat(0x111827), eye=mat(0xe6f7ff, .25, .1);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.65,5,8),coatM);torso.position.y=1.12;torso.castShadow=true;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.29,16,12),skinM);head.position.y=1.95;head.castShadow=true;g.add(head);
  const hairTop=new THREE.Mesh(new THREE.SphereGeometry(.31,14,10),hairM);hairTop.scale.set(1.04,.7,1.03);hairTop.position.y=2.12;g.add(hairTop);
  for(let i=0;i<5;i++){const spike=new THREE.Mesh(new THREE.ConeGeometry(.10,.32,6),hairM);spike.position.set((i-2)*.105,2.29,0.02);spike.rotation.z=(i-2)*-.25;g.add(spike);}
  for(const s of [-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.045,8,8),eye);e.position.set(s*.105,1.98,.255);g.add(e);}
  const legM=mat(0x171e2c);
  for(const s of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.55,4,6),legM);leg.position.set(s*.16,.43,0);leg.castShadow=true;g.add(leg);}
  if(hood){const emblem=new THREE.Mesh(new THREE.TorusGeometry(.11,.025,6,16),mat(0x71eaf7,.35,.4));emblem.position.set(0,1.22,.322);g.add(emblem);}
  g.userData={head,torso};return g;
}
function createTokyo(){
  scene=new THREE.Scene();scene.background=new THREE.Color(0x080e20);scene.fog=new THREE.FogExp2(0x080e20,.018);
  camera=new THREE.PerspectiveCamera(65,innerWidth/innerHeight,.1,180);
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;root.appendChild(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0x9ebdff,0x15101e,2));
  const moon=new THREE.DirectionalLight(0xa7c9ff,2.4);moon.position.set(-10,18,8);moon.castShadow=true;scene.add(moon);
  const neon=new THREE.PointLight(0x8d42ff,26,35);neon.position.set(0,5,-10);scene.add(neon);
  const cyan=new THREE.PointLight(0x26dfff,18,28);cyan.position.set(8,4,1);scene.add(cyan);
  const ground= new THREE.Mesh(new THREE.PlaneGeometry(180,180),mat(0x151b2a,.92));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  // Wet-looking street and lane markings
  box(12,.025,100,mat(0x202638,.25,.25),0,.02,-24);
  for(let z=12;z>-70;z-=7)box(.12,.035,2.8,mat(0x9ba9bb,.5),0,.05,z);
  // Sidewalks
  box(5,.2,100,mat(0x333849),-8.5,.08,-24);box(5,.2,100,mat(0x333849),8.5,.08,-24);
  // City blocks, windows, signboards
  for(let side of [-1,1]){
    for(let i=0;i<12;i++){
      const z=14-i*7.3, x=side*(11+Math.random()*4), w=3+Math.random()*3, h=6+Math.random()*13;
      const building=box(w,h,5+Math.random()*3,mat([0x202940,0x25243d,0x18283a,0x30233e][i%4]),x,h/2-.05,z);
      // glowing window grid on street-facing side
      const winMat=mat(i%3===0?0x54ddeb:0x8d69ff,.25,.1);
      for(let wy=1.4;wy<h-1;wy+=1.65)for(let wx=-w/2+.45;wx<w/2-.2;wx+=.9){
        const win=new THREE.Mesh(new THREE.PlaneGeometry(.35,.62),winMat);
        win.position.set(x+wx,wy,z+(side<0?1:-1)*(2.53));win.rotation.y=side<0?0:Math.PI;scene.add(win);
      }
      if(i%2===0){const sign=box(1.5,1.1,.12,mat(i%4===0?0x7a31d9:0x087d9b,.3,.1),x-side*(w/2+.1),Math.min(h-1,5),z+2.7);sign.rotation.y=side<0?-.08:.08;}
    }
  }
  // lanterns
  for(let z=8;z>-48;z-=12){for(let s of [-1,1]){
    const pole=box(.12,3.4,.12,mat(0x343c52),s*6,1.7,z);
    const lamp=new THREE.PointLight(s<0?0x6e4bff:0x31dfff,5,10);lamp.position.set(s*6,3.4,z);scene.add(lamp);
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,8,8),mat(s<0?0x925cff:0x48f1ff,.2,.1));bulb.position.copy(lamp.position);scene.add(bulb);
  }}
  // Gate, glowing torii-like supernatural portal
  gate=new THREE.Group();gate.position.set(0,0,-28);scene.add(gate);
  const gateMat=mat(0x6b3fbb,.28,.4), gateGlow=mat(0x7a42ff,.22,.3);
  const post1=new THREE.Mesh(new THREE.BoxGeometry(.55,6.3,.55),gateMat);post1.position.set(-2.5,3,0);gate.add(post1);
  const post2=post1.clone();post2.position.x=2.5;gate.add(post2);
  const beam=new THREE.Mesh(new THREE.BoxGeometry(6.8,.55,.8),gateMat);beam.position.set(0,6.05,0);gate.add(beam);
  const beam2=new THREE.Mesh(new THREE.BoxGeometry(7.5,.24,.95),gateGlow);beam2.position.set(0,6.5,0);gate.add(beam2);
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(4.5,5.2),new THREE.MeshBasicMaterial({color:0x5a25b8,transparent:true,opacity:.28,side:THREE.DoubleSide}));portal.position.set(0,3,-.08);gate.add(portal);gate.userData.portal=portal;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.8,.06,8,48),new THREE.MeshBasicMaterial({color:0x9c70ff}));ring.position.set(0,3,0);gate.add(ring);gate.userData.ring=ring;
  player=makePerson({x:0,z:8,hair:0xd9e3f3,coat:0x555c72,hood:true});
  waguri=makePerson({x:2.4,z:-4,hair:0x171523,coat:0x582e6c,skin:0xf0c8b4});waguri.rotation.y=-.3;
  // Yokai: floating dark mask with violet aura
  yokai=new THREE.Group();yokai.position.set(0,1.6,-22);scene.add(yokai);
  const aura=new THREE.Mesh(new THREE.SphereGeometry(.95,16,16),new THREE.MeshBasicMaterial({color:0x8b35ff,transparent:true,opacity:.18}));yokai.add(aura);
  const body=new THREE.Mesh(new THREE.SphereGeometry(.56,16,12),mat(0x171126,.3,.25));body.scale.set(.85,1.15,.65);body.castShadow=true;yokai.add(body);
  const mask=new THREE.Mesh(new THREE.SphereGeometry(.42,16,12),mat(0xcac8df,.5));mask.scale.set(1,.72,.3);mask.position.z=.43;yokai.add(mask);
  for(const s of [-1,1]){const eye=new THREE.Mesh(new THREE.SphereGeometry(.075,8,8),new THREE.MeshBasicMaterial({color:0xff2e86}));eye.position.set(s*.14,.06,.7);yokai.add(eye);}
  for(let i=0;i<4;i++){const flame=new THREE.Mesh(new THREE.ConeGeometry(.15,.55,6),new THREE.MeshBasicMaterial({color:0x9d48ff,transparent:true,opacity:.75}));flame.position.set((i-1.5)*.32,-.8,0);flame.rotation.z=Math.PI; yokai.add(flame);}
  // street debris
  for(let i=0;i<30;i++){const stone=new THREE.Mesh(new THREE.BoxGeometry(.2+Math.random()*.4,.08,.15+Math.random()*.4),mat(0x44485c));stone.position.set((Math.random()-.5)*10,.08,-Math.random()*60);stone.rotation.y=Math.random()*2;scene.add(stone);}
  clock=new THREE.Clock();
}
function toast(text){toastEl.textContent=text;toastEl.classList.add('show');setTimeout(()=>toastEl.classList.remove('show'),1800);}
function save(){try{localStorage.setItem(saveKey,JSON.stringify({stage,hp,enemyHp,missionDone}));}catch{}}
const conversations=[
  [{who:'WAGURI',en:'You can see it too, can’t you? That gate wasn’t here yesterday.',ja:'あの門が見えるのね。昨日までは、ここになかった。'},{who:'RINTARO',en:'I see it. And whatever is inside… it knows my name.',ja:'見えるよ。中にいる何かは…俺の名前を知っている。'},{who:'WAGURI',en:'Stay close. If a Yokai appears, don’t let its eyes meet yours.',ja:'離れないで。妖怪が現れても、目を合わせないで。'}],
  [{who:'RINTARO',en:'That thing came through the gate. I’m not letting it reach the city.',ja:'あいつは門から来た。街には行かせない。'},{who:'WAGURI',en:'Your energy… it feels older than the gate itself.',ja:'あなたの気配…門そのものより古く感じる。'}],
  [{who:'WAGURI',en:'You defeated it… but the gate is still responding to you.',ja:'倒したのね…でも門は、まだあなたに反応している。'},{who:'RINTARO',en:'Then I’ll find out why. Whatever waits underground, I’m going in.',ja:'なら理由を突き止める。地下に何が待っていようと、俺は進む。'}]
];
function openDialogue(index){if(isTalking)return;isTalking=true;dialogueIndex=0;dialogueBox.classList.remove('hidden');showLine(index);}
function showLine(index){const list=conversations[index]||conversations[0];const item=list[dialogueIndex];speakerEl.textContent=item.who;lineEn.textContent=item.en;lineJa.textContent=item.ja;document.querySelector('#next-line').textContent=dialogueIndex<list.length-1?'CONTINUE ↗':'CLOSE ✕';dialogueBox.dataset.conversation=String(index);}
function advanceDialogue(){if(!isTalking)return;const idx=Number(dialogueBox.dataset.conversation);if(dialogueIndex<(conversations[idx]||[]).length-1){dialogueIndex++;showLine(idx);return;}dialogueBox.classList.add('hidden');isTalking=false;
  if(idx===0&&stage===0){stage=1;questTitle.textContent='Defeat the Yokai';objective.textContent='Approach the Yokai and press Space or ✦ to attack.';toast('NEW OBJECTIVE: Defeat the Yokai');}
  else if(idx===1&&stage===1){/* combat dialogue can be repeated */ }
  else if(idx===2){stage=3;missionDone=true;result.classList.remove('hidden');save();}
  save();
}
function interact(){if(isTalking){advanceDialogue();return;}const p=player.position;
  if(stage===0&&Math.hypot(p.x-gate.position.x,p.z-gate.position.z)<8){openDialogue(0);return;}
  if(stage===0&&Math.hypot(p.x-waguri.position.x,p.z-waguri.position.z)<3){openDialogue(0);return;}
  if(stage===1&&Math.hypot(p.x-waguri.position.x,p.z-waguri.position.z)<3){openDialogue(1);return;}
  if(stage===2&&Math.hypot(p.x-waguri.position.x,p.z-waguri.position.z)<3){openDialogue(2);return;}
  if(Math.hypot(p.x-gate.position.x,p.z-gate.position.z)<5){toast('The gate hums with a familiar energy…');return;}
  toast('Nothing to interact with nearby.');
}
function attack(){if(isTalking||missionDone||stage===0){if(stage===0)toast('Talk to Waguri or investigate the gate first.');return;}if(attackCooldown>0)return;attackCooldown=.45;
  const dist=player.position.distanceTo(yokai.position);
  if(stage===1&&dist<7){enemyHp=Math.max(0,enemyHp-25);toast(`SPIRIT STRIKE  -25  |  YOKAI ${enemyHp}%`);yokai.userData.hit=0.22;
    if(enemyHp===0){stage=2;questTitle.textContent='Return to Waguri';objective.textContent='Talk to Waguri to learn what the gate wants.';yokai.visible=false;toast('YOKAI PURIFIED');save();}
  }else if(stage===1){toast('Move closer to the Yokai before attacking.');}
  else {toast('Your energy flickers, waiting for a target.');}
}
function takeDamage(){if(invulnerable>0||stage!==1)return;invulnerable=1;hp=Math.max(0,hp-12);hpBar.style.width=hp+'%';hpText.textContent=`${hp} / 100`;toast('YOKAI STRIKE  -12 HP');if(hp<=0){hp=100;player.position.set(0,0,8);toast('You recovered at the last checkpoint.');}save();}
function updateCamera(){const target=new THREE.Vector3(player.position.x,player.position.y+2.1,player.position.z);const distance=7.5;const offset=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch)*distance,Math.sin(pitch)*distance+2.2,Math.cos(yaw)*Math.cos(pitch)*distance);camera.position.copy(target).add(offset);camera.lookAt(target);}
function update(dt){const speed=(keys.has('Shift')?8.5:5)*dt;let f=0,s=0;
  if(keys.has('KeyW')||keys.has('ArrowUp')||touchMoves.has('forward'))f+=1;
  if(keys.has('KeyS')||keys.has('ArrowDown')||touchMoves.has('back'))f-=1;
  if(keys.has('KeyA')||keys.has('ArrowLeft')||touchMoves.has('left'))s-=1;
  if(keys.has('KeyD')||keys.has('ArrowRight')||touchMoves.has('right'))s+=1;
  if(f||s){const len=Math.hypot(f,s);f/=len;s/=len;const dx=(Math.sin(yaw)*f+Math.cos(yaw)*s)*speed;const dz=(Math.cos(yaw)*f-Math.sin(yaw)*s)*speed;player.position.x=clamp(player.position.x+dx,-5.3,5.3);player.position.z=clamp(player.position.z+dz,-65,14);player.rotation.y=Math.atan2(dx,dz);}
  attackCooldown=Math.max(0,attackCooldown-dt);invulnerable=Math.max(0,invulnerable-dt);
  if(yokai.visible){yokai.position.y=1.6+Math.sin(clock.elapsedTime*2.6)*.24;yokai.rotation.y=Math.sin(clock.elapsedTime)*.18;if(yokai.userData.hit>0){yokai.userData.hit-=dt;yokai.scale.setScalar(1.15);}else yokai.scale.setScalar(1);if(stage===1&&player.position.distanceTo(yokai.position)<2.1&&Math.random()<.02)takeDamage();}
  gate.userData.ring.rotation.z+=dt*.3;gate.userData.portal.material.opacity=.2+Math.sin(clock.elapsedTime*2)*.12;
  waguri.position.y=Math.sin(clock.elapsedTime*1.3)*.025;
  updateCamera();
}
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);update(dt);renderer.render(scene,camera);}
function bindControls(){
  addEventListener('keydown',e=>{keys.add(e.code);if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='KeyE')interact();if(e.code==='Space')attack();},{passive:false});
  addEventListener('keyup',e=>keys.delete(e.code));
  let dragging=false,lastX=0,lastY=0;
  renderer.domElement.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture?.(e.pointerId);});
  renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw-=dx*.005;pitch=clamp(pitch+dy*.003,-.7,.35);});
  renderer.domElement.addEventListener('pointerup',()=>dragging=false);renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
  document.querySelector('#next-line').addEventListener('click',advanceDialogue);
  document.querySelector('#interact-btn').addEventListener('click',interact);
  document.querySelector('#attack-btn').addEventListener('click',attack);
  document.querySelectorAll('[data-move]').forEach(btn=>{const key=btn.dataset.move;const start=e=>{e.preventDefault();touchMoves.add(key);};const end=e=>{e.preventDefault();touchMoves.delete(key);};btn.addEventListener('pointerdown',start);btn.addEventListener('pointerup',end);btn.addEventListener('pointerleave',end);btn.addEventListener('pointercancel',end);});
  document.querySelector('#continue-game').addEventListener('click',()=>result.classList.add('hidden'));
  document.querySelector('#reset-game').addEventListener('click',()=>{try{localStorage.removeItem(saveKey)}catch{}location.reload();});
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
}
function restoreState(){if(saved.hp){hp=clamp(saved.hp,1,100);hpBar.style.width=hp+'%';hpText.textContent=`${hp} / 100`;}if(saved.enemyHp!==undefined)enemyHp=clamp(saved.enemyHp,0,100);
  if(stage===1){questTitle.textContent='Defeat the Yokai';objective.textContent='Approach the Yokai and press Space or ✦ to attack.';}
  if(stage===2){questTitle.textContent='Return to Waguri';objective.textContent='Talk to Waguri to learn what the gate wants.';yokai.visible=false;}
  if(stage>=3){questTitle.textContent='Mission complete';objective.textContent='Explore Tokyo. Your story will continue…';yokai.visible=false;}
}
try{createTokyo();restoreState();bindControls();animate();setTimeout(()=>{loading.style.opacity='0';setTimeout(()=>loading.remove(),650);},450);}
catch(err){loading.innerHTML='<strong>Unable to start 3D scene</strong><span>Open this project through a local web server and check your internet connection for the Three.js library.</span>';console.error(err);}
