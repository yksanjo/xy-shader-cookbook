const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const shaderCanvas = document.getElementById('shader');
const modeGameBtn = document.getElementById('mode-game');
const modeShaderBtn = document.getElementById('mode-shader');
const modeIdeasBtn = document.getElementById('mode-ideas');
const modeRRPGBtn = document.getElementById('mode-rrpg');
const modeARPGBtn = document.getElementById('mode-arpg');
const shaderUI = document.getElementById('shader-ui');
const ideasEl = document.getElementById('ideas');
const rrpgUI = document.getElementById('rrpg-ui');
const arpgUI = document.getElementById('arpg-ui');
const rrpgExecuteBtn = document.getElementById('rrpg-execute');
const rrpgResetBtn = document.getElementById('rrpg-reset');
const shaderSelect = document.getElementById('shaderSelect');
const param1El = document.getElementById('param1');
const param2El = document.getElementById('param2');
let mode = 'game';
let stars = [];
function size() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; shaderCanvas.width = window.innerWidth; shaderCanvas.height = window.innerHeight; initStars() }
size();
window.addEventListener('resize', size);
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const hpBarEl = document.getElementById('hpbar');
const hpTextEl = document.getElementById('hptext');
const restartBtn = document.getElementById('restart');
function setMode(m) {
  mode = m;
  modeGameBtn.classList.toggle('active', m === 'game');
  modeShaderBtn.classList.toggle('active', m === 'shader');
  modeIdeasBtn.classList.toggle('active', m === 'ideas');
  modeRRPGBtn.classList.toggle('active', m === 'rrpg');
  modeARPGBtn.classList.toggle('active', m === 'arpg');
  if (m === 'game') {
    canvas.style.display = 'block';
    shaderCanvas.style.display = 'none';
    shaderUI.style.display = 'none';
    ideasEl.style.display = 'none';
    rrpgUI.style.display = 'none';
    arpgUI.style.display = 'none';
    document.querySelector('.hint').style.display = 'block';
    document.querySelector('.scores').style.display = 'inline-flex';
    document.querySelector('.health').style.display = 'block';
    restartBtn.style.display = 'none';
  } else {
    canvas.style.display = 'none';
    document.querySelector('.hint').style.display = 'none';
    document.querySelector('.scores').style.display = 'none';
    document.querySelector('.health').style.display = 'none';
    if (m === 'shader') {
      shaderCanvas.style.display = 'block';
      shaderUI.style.display = 'flex';
      ideasEl.style.display = 'none';
      rrpgUI.style.display = 'none';
      arpgUI.style.display = 'none';
    } else {
      shaderCanvas.style.display = 'none';
      shaderUI.style.display = 'none';
      rrpgUI.style.display = 'none';
      ideasEl.style.display = 'block';
      if (m === 'rrpg') {
        ideasEl.style.display = 'none';
        rrpgUI.style.display = 'flex';
        canvas.style.display = 'block';
        arpgUI.style.display = 'none';
      }
      if (m === 'arpg') {
        ideasEl.style.display = 'none';
        rrpgUI.style.display = 'none';
        shaderCanvas.style.display = 'none';
        shaderUI.style.display = 'none';
        canvas.style.display = 'block';
        arpgUI.style.display = 'flex';
      }
    }
  }
}
modeGameBtn.addEventListener('click', () => setMode('game'));
modeShaderBtn.addEventListener('click', () => setMode('shader'));
modeIdeasBtn.addEventListener('click', () => setMode('ideas'));
modeRRPGBtn.addEventListener('click', () => setMode('rrpg'));
modeARPGBtn.addEventListener('click', () => setMode('arpg'));
setMode('arpg');
let best = parseFloat(localStorage.getItem('fun_best') || '0');
bestEl.textContent = Math.floor(best);
const keys = new Set();
window.addEventListener('keydown', e => { keys.add(e.key.toLowerCase()); if (e.key === ' ') e.preventDefault() });
window.addEventListener('keyup', e => { keys.delete(e.key.toLowerCase()) });
const player = { x: 0, y: 0, r: 14, speed: 280, hpMax: 100, hp: 100 };
function centerPlayer() { player.x = canvas.width * 0.5; player.y = canvas.height * 0.8 }
centerPlayer();
let enemies = [];
let items = [];
let bullets = [];
let spawnT = 0;
let alienT = 2.0;
let healT = 8.0;
let fireT = 0;
let hitT = 0;
let score = 0;
let running = true;
let shake = 0;
let trail = [];
let particles = [];
restartBtn.addEventListener('click', () => restart());
function restart() { enemies = []; items = []; bullets = []; score = 0; running = true; spawnT = 0; alienT = 2.0; healT = 8.0; fireT = 0; hitT = 0; player.hp = player.hpMax; centerPlayer(); restartBtn.style.display = 'none'; updateHPBar() }
function spawn() {
  const w = 20 + Math.random() * 32;
  const h = 16 + Math.random() * 28;
  const x = Math.random() * (canvas.width - w);
  const y = -h - 10;
  const speed = 140 + Math.random() * 220;
  const hue = Math.floor(Math.random() * 360);
  enemies.push({ x, y, w, h, speed, hue, type: 'ob' });
}
function spawnAlien() {
  const w = 30 + Math.random() * 34;
  const h = 22 + Math.random() * 30;
  const x = Math.random() * (canvas.width - w);
  const y = -h - 20;
  const speed = 120 + Math.random() * 160;
  const hue = 200 + Math.random() * 120;
  const hp = 3;
  const amp = 40 + Math.random() * 60;
  const phase = Math.random() * Math.PI * 2;
  enemies.push({ x, y, w, h, speed, hue, type: 'alien', hp, amp, phase });
}
function spawnHeal() {
  const r = 10;
  const x = r + Math.random() * (canvas.width - r * 2);
  const y = -20;
  const speed = 100 + Math.random() * 140;
  items.push({ x, y, r, speed, type: 'heal', amount: 30 });
}
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)) }
function circleRectCollide(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= r * r;
}
function roundRect(x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function makeBurst(x, y, hue, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 260;
    particles.push({
      x, y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      r: 1 + Math.random() * 2.5,
      life: 0.6 + Math.random() * 1.2,
      hue,
    });
  }
}
function updateHPBar() {
  const pct = Math.max(0, Math.min(1, player.hp / player.hpMax));
  hpBarEl.style.width = `${pct * 100}%`;
  const hue = 10 + pct * 110;
  hpBarEl.style.background = `linear-gradient(to right, hsla(${hue},80%,55%,1), hsla(${hue + 10},80%,50%,1))`;
  if (hpTextEl) hpTextEl.textContent = `HP ${Math.floor(player.hp)}/${player.hpMax}`;
}
function shoot() {
  if (!running || fireT > 0) return;
  fireT = 0.18;
  bullets.push({ x: player.x, y: player.y - player.r - 6, r: 4, vy: -600 });
}
window.addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); if (running) shoot(); else restart() }
  if (e.key.toLowerCase() === 'j') shoot();
  if (e.key === '1') setMode('game');
  if (e.key === '2') setMode('shader');
  if (e.key === '3') setMode('ideas');
  if (e.key === '4') setMode('rrpg');
});
function initStars() {
  stars = [];
  const area = canvas.width * canvas.height;
  const n1 = Math.max(30, Math.floor(area / 40000));
  const n2 = Math.max(20, Math.floor(area / 70000));
  for (let i = 0; i < n1; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 0.8 + Math.random() * 1.6, a: 0.2 + Math.random() * 0.5, sp: 30 });
  for (let i = 0; i < n2; i++) stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, r: 1.2 + Math.random() * 2.0, a: 0.25 + Math.random() * 0.5, sp: 55 });
}
let last = performance.now();
const gl = shaderCanvas.getContext('webgl2') || shaderCanvas.getContext('webgl');
let glProg = null;
let glBuf = null;
let uTime = null;
let uRes = null;
let uA = null;
let uB = null;
function makeProgram(fsrc) {
  const vsrc = gl instanceof WebGL2RenderingContext ? `#version 300 es
  layout(location=0) in vec2 a_pos;
  void main(){gl_Position=vec4(a_pos,0.0,1.0);}` : `attribute vec2 a_pos;void main(){gl_Position=vec4(a_pos,0.0,1.0);}`;
  const vs = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vs, vsrc);
  gl.compileShader(vs);
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  const head = gl instanceof WebGL2RenderingContext ? `#version 300 es
  precision highp float;
  out vec4 fragColor;
  uniform vec2 u_res;uniform float u_time;uniform float u_a;uniform float u_b;vec2 uv;vec2 p;vec3 col;` : `precision highp float;uniform vec2 u_res;uniform float u_time;uniform float u_a;uniform float u_b;vec2 uv;vec2 p;vec3 col;`;
  const body = gl instanceof WebGL2RenderingContext ? `
  void main(){uv=gl_FragCoord.xy/u_res;p=uv*2.0-1.0;${fsrc}fragColor=vec4(col,1.0);}` : `
  void main(){uv=gl_FragCoord.xy/u_res;p=uv*2.0-1.0;${fsrc}gl_FragColor=vec4(col,1.0);}`;
  gl.shaderSource(fs, head + body);
  gl.compileShader(fs);
  const pr = gl.createProgram();
  gl.attachShader(pr, vs);
  gl.attachShader(pr, fs);
  if (gl instanceof WebGL2RenderingContext) gl.bindAttribLocation(pr, 0, 'a_pos');
  gl.linkProgram(pr);
  glProg = pr;
  gl.useProgram(glProg);
  uTime = gl.getUniformLocation(glProg, 'u_time');
  uRes = gl.getUniformLocation(glProg, 'u_res');
  uA = gl.getUniformLocation(glProg, 'u_a');
  uB = gl.getUniformLocation(glProg, 'u_b');
  const pts = new Float32Array([-1,-1, -1,1, 1,-1, 1,-1, -1,1, 1,1]);
  glBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, glBuf);
  gl.bufferData(gl.ARRAY_BUFFER, pts, gl.STATIC_DRAW);
  const loc = gl instanceof WebGL2RenderingContext ? 0 : gl.getAttribLocation(glProg, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}
function shaderSrc(name) {
  if (name === 'rings') return `float d=length(p);float v=0.5+0.5*cos(u_a*8.0*d-u_time*u_b*2.0);col=vec3(v, v*0.8, 1.0-v);`;
  if (name === 'checker') return `vec2 q=floor((uv*u_a*8.0));float v=mod(q.x+q.y,2.0);v=mix(0.15,0.9,v);col=vec3(v,0.5*v,1.0-v);`;
  if (name === 'plasma') return `float v=sin(8.0*p.x+u_time*u_b)+sin(8.0*p.y-u_time*u_b);v=0.5+0.5*sin(v);col=vec3(0.2+0.8*v, 0.3+0.7*sin(v+1.0), 0.3+0.7*sin(v+2.0));`;
  return `float v=sin(u_a*3.0*length(p)+u_time*u_b);col=vec3(0.2+0.8*abs(v),0.3+0.7*abs(sin(v+1.0)),0.3+0.7*abs(sin(v+2.0)));`;
}
let currentShader = 'rings';
function selectShader() { currentShader = shaderSelect.value; makeProgram(shaderSrc(currentShader)) }
if (gl) { selectShader() }
shaderSelect.addEventListener('change', () => selectShader());
const rr = { party: [], enemies: [], nodes: [], links: [], selected: new Set(), turn: 'player', lost: false, won: false };
function rrSetup() {
  rr.party = [
    { name: 'Aerin', hpMax: 80, hp: 80 },
    { name: 'Kross', hpMax: 100, hp: 100 },
    { name: 'Lyra', hpMax: 70, hp: 70 },
  ];
  rr.enemies = [
    { name: 'Wisp', hpMax: 60, hp: 60 },
    { name: 'Golem', hpMax: 120, hp: 120 },
  ];
  rr.nodes = [
    { id: 'A1', x: 0.35, y: 0.45, type: 'attack', label: 'Strike' },
    { id: 'A2', x: 0.55, y: 0.48, type: 'attack', label: 'Pierce' },
    { id: 'AMP1', x: 0.45, y: 0.32, type: 'amp', label: 'Amplify' },
    { id: 'AMP2', x: 0.65, y: 0.35, type: 'amp', label: 'Overload' },
    { id: 'CHAIN', x: 0.60, y: 0.62, type: 'chain', label: 'Chain' },
    { id: 'HEAL', x: 0.30, y: 0.62, type: 'heal', label: 'Restore' },
    { id: 'FOCUS', x: 0.40, y: 0.75, type: 'focus', label: 'Focus' },
  ];
  rr.links = [
    ['A1','AMP1'],['A1','CHAIN'],['A2','AMP2'],['A2','CHAIN'],['HEAL','FOCUS'],['AMP1','AMP2']
  ];
  rr.selected = new Set();
  rr.turn = 'player';
  rr.lost = false;
  rr.won = false;
}
function rrMetric() {
  let a=0,b=0,c=0,f=0,h=0;
  rr.nodes.forEach(n=>{ if(rr.selected.has(n.id)){ if(n.type==='attack') a++; else if(n.type==='amp') b++; else if(n.type==='chain') c++; else if(n.type==='focus') f++; else if(n.type==='heal') h++; } });
  return { a,b,c,f,h };
}
function rrExecute() {
  if (rr.turn !== 'player' || rr.lost || rr.won) return;
  const m = rrMetric();
  const dmg = Math.floor(12*m.a*(1+0.5*m.b) + (m.f>0?5:0));
  const hits = Math.max(1, m.c+1);
  const healAmt = Math.floor(10*m.h*(1+0.3*m.f));
  if (healAmt>0) {
    let tgt = rr.party.slice().sort((x,y)=> (x.hp/x.hpMax) - (y.hp/y.hpMax))[0];
    tgt.hp = Math.min(tgt.hpMax, tgt.hp + healAmt);
  }
  for (let i=0;i<hits;i++) {
    const enemy = rr.enemies.find(e=>e.hp>0);
    if (!enemy) break;
    enemy.hp -= dmg;
    if (enemy.hp <= 0) enemy.hp = 0;
  }
  rr.selected.clear();
  if (!rr.enemies.some(e=>e.hp>0)) { rr.won = true; rr.turn = 'player'; return }
  rr.turn = 'enemy';
}
function rrEnemyTurn() {
  if (rr.turn !== 'enemy' || rr.lost || rr.won) return;
  for (let i=0;i<rr.enemies.length;i++) {
    const e = rr.enemies[i];
    if (e.hp<=0) continue;
    const dmg = 8 + Math.floor(Math.random()*6);
    const idx = Math.floor(Math.random()*rr.party.length);
    const p = rr.party[idx];
    p.hp -= dmg;
    if (p.hp<0) p.hp=0;
  }
  if (!rr.party.some(p=>p.hp>0)) { rr.lost = true; rr.turn = 'player'; return }
  rr.turn = 'player';
}
function rrReset() { rr.selected.clear() }
function rrNodeAt(x,y) {
  const r = Math.max(18, canvas.height*0.015);
  for (let i=0;i<rr.nodes.length;i++) {
    const n = rr.nodes[i];
    const nx = n.x*canvas.width;
    const ny = n.y*canvas.height;
    if (Math.hypot(nx-x, ny-y) <= r) return n;
  }
  return null;
}
canvas.addEventListener('click', e=>{
  if (mode!=='rrpg') return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const n = rrNodeAt(x,y);
  if (!n) return;
  if (rr.selected.has(n.id)) rr.selected.delete(n.id); else rr.selected.add(n.id);
});
rrpgExecuteBtn.addEventListener('click', ()=>{ rrExecute(); rrEnemyTurn() });
rrpgResetBtn.addEventListener('click', ()=> rrReset());
const arpg = { init: false, player: null, enemies: [], shots: [], fx: [], aimX: 0, aimY: 0 };
function arpgSetup(){
  arpg.player = { x: canvas.width*0.5, y: canvas.height*0.7, r: 16, hpMax: 120, hp: 120, energyMax: 100, energy: 100, speed: 280, dash: 0, i: 0, cd:{ fire:0, heal:0, shield:0 } };
  arpg.enemies = [];
  arpg.shots = [];
  arpg.fx = [];
  arpg.init = true;
}
function arpgSpawn(dt){
  if (Math.random() < dt*0.7) {
    const r = 14+Math.random()*10;
    const x = Math.random()*canvas.width;
    const y = -20;
    const hp = 40+Math.random()*40;
    const sp = 60+Math.random()*90;
    const hue = 330+Math.random()*40;
    arpg.enemies.push({ x,y,r,hpMax:hp,hp, sp, hue, tele: 1.2+Math.random()*0.6, t:0 });
  }
}
function arpgFire(){
  const p = arpg.player;
  if (p.cd.fire>0 || p.energy<12) return;
  const a = Math.atan2(arpg.aimY - p.y, arpg.aimX - p.x);
  const sp = 520;
  arpg.shots.push({ x:p.x, y:p.y, r:5, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, hue:160 });
  p.energy -= 12;
  p.cd.fire = 0.25;
}
function arpgHeal(){
  const p = arpg.player;
  if (p.cd.heal>0 || p.energy<20 || p.hp>=p.hpMax) return;
  p.hp = Math.min(p.hpMax, p.hp+28);
  p.energy -= 20;
  p.cd.heal = 4;
}
function arpgDash(){
  const p = arpg.player;
  if (p.dash>0 || p.energy<16) return;
  p.dash = 0.28;
  p.energy -= 16;
  p.i = 0.22;
}
function arpgShieldDown(){ arpg.player.cd.shield = 0 }
function arpgShield(){
  const p = arpg.player;
  if (p.energy<10) return;
  p.cd.shield = 0.1;
}
canvas.addEventListener('mousemove', e=>{ const r = canvas.getBoundingClientRect(); arpg.aimX = e.clientX - r.left; arpg.aimY = e.clientY - r.top });
canvas.addEventListener('mousedown', e=>{ if (mode==='arpg' && e.button===0) arpgFire(); });
canvas.addEventListener('mouseup', e=>{ if (mode==='arpg' && e.button===2) arpgShieldDown() });
canvas.addEventListener('contextmenu', e=>{ if (mode==='arpg') e.preventDefault() });
window.addEventListener('keydown', e=>{ if (mode==='arpg'){ if (e.key==='Shift') arpgDash(); if (e.key.toLowerCase()==='e') arpgHeal() } });
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  if (mode === 'shader') {
    if (!gl) { requestAnimationFrame(loop); return }
    gl.viewport(0, 0, shaderCanvas.width, shaderCanvas.height);
    gl.useProgram(glProg);
    gl.uniform1f(uTime, now * 0.001);
    gl.uniform2f(uRes, shaderCanvas.width, shaderCanvas.height);
    gl.uniform1f(uA, parseFloat(param1El.value));
    gl.uniform1f(uB, parseFloat(param2El.value));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
    return;
  }
  if (mode === 'ideas') { requestAnimationFrame(loop); return }
  if (mode === 'rrpg') {
    if (rr.party.length===0) rrSetup();
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, '#0b1022');
    bg.addColorStop(1, '#16132c');
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    for (let i=0;i<rr.links.length;i++) {
      const a = rr.nodes.find(n=>n.id===rr.links[i][0]);
      const b = rr.nodes.find(n=>n.id===rr.links[i][1]);
      const ax = a.x*canvas.width, ay = a.y*canvas.height;
      const bx = b.x*canvas.width, by = b.y*canvas.height;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
    }
    for (let i=0;i<rr.nodes.length;i++) {
      const n = rr.nodes[i];
      const x = n.x*canvas.width, y = n.y*canvas.height;
      ctx.save();
      ctx.shadowColor = rr.selected.has(n.id) ? '#a78bfa' : '#22d3ee';
      ctx.shadowBlur = rr.selected.has(n.id) ? 18 : 12;
      const g = ctx.createRadialGradient(x,y,0,x,y,Math.max(18,canvas.height*0.015));
      if (n.type==='attack') { g.addColorStop(0,'#3be1f7'); g.addColorStop(1,'#22d3ee') }
      else if (n.type==='amp') { g.addColorStop(0,'#c4b5fd'); g.addColorStop(1,'#a78bfa') }
      else if (n.type==='chain') { g.addColorStop(0,'#fdba74'); g.addColorStop(1,'#fb923c') }
      else if (n.type==='heal') { g.addColorStop(0,'#6ee7b7'); g.addColorStop(1,'#22c55e') }
      else { g.addColorStop(0,'#fde68a'); g.addColorStop(1,'#f59e0b') }
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x,y,Math.max(18,canvas.height*0.015),0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#e6e8f0';
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(n.label, x, y - Math.max(24,canvas.height*0.022));
      ctx.restore();
    }
    const m = rrMetric();
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(16,16,260,96);
    ctx.fillRect(canvas.width-276,16,260,96);
    ctx.fillStyle = '#e6e8f0';
    ctx.font = '14px system-ui';
    ctx.fillText('Party', 26, 34);
    let oy = 54;
    for (let i=0;i<rr.party.length;i++) {
      const p = rr.party[i];
      const pct = Math.max(0, Math.min(1, p.hp/p.hpMax));
      ctx.fillText(`${p.name} ${Math.floor(p.hp)}/${p.hpMax}`, 26, oy-6);
      ctx.fillStyle = '#111827';
      ctx.fillRect(26, oy, 200, 12);
      const gh = ctx.createLinearGradient(26, oy, 26+200*pct, oy);
      gh.addColorStop(0,'#22c55e'); gh.addColorStop(1,'#84cc16');
      ctx.fillStyle = gh;
      ctx.fillRect(26, oy, 200*pct, 12);
      oy += 24;
    }
    ctx.fillStyle = '#e6e8f0';
    ctx.fillText('Enemies', canvas.width-266, 34);
    oy = 54;
    for (let i=0;i<rr.enemies.length;i++) {
      const e = rr.enemies[i];
      const pct = Math.max(0, Math.min(1, e.hp/e.hpMax));
      ctx.fillText(`${e.name} ${Math.floor(e.hp)}/${e.hpMax}`, canvas.width-266, oy-6);
      ctx.fillStyle = '#111827';
      ctx.fillRect(canvas.width-266, oy, 200, 12);
      const eh = ctx.createLinearGradient(canvas.width-266, oy, canvas.width-266+200*pct, oy);
      eh.addColorStop(0,'#ef4444'); eh.addColorStop(1,'#f97316');
      ctx.fillStyle = eh;
      ctx.fillRect(canvas.width-266, oy, 200*pct, 12);
      oy += 24;
    }
    ctx.fillStyle = '#e6e8f0';
    ctx.fillText(`Attack ${m.a} • Amp ${m.b} • Chain ${m.c} • Heal ${m.h} • Focus ${m.f}`, 26, canvas.height-26);
    if (rr.won) {
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('Victory', canvas.width*0.5 - 40, 40);
    } else if (rr.lost) {
      ctx.fillStyle = '#fecaca';
      ctx.font = 'bold 18px system-ui';
      ctx.fillText('Defeat', canvas.width*0.5 - 36, 40);
    }
    if (rr.turn==='enemy') { rrEnemyTurn() }
    requestAnimationFrame(loop);
    return;
  }
  if (mode === 'arpg') {
    if (!arpg.init) arpgSetup();
    const p = arpg.player;
    const bg = ctx.createLinearGradient(0,0,0,canvas.height);
    bg.addColorStop(0,'#0b1022'); bg.addColorStop(1,'#16132c');
    ctx.fillStyle = bg; ctx.fillRect(0,0,canvas.width,canvas.height);
    let vx=0, vy=0;
    if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
    if (keys.has('arrowright') || keys.has('d')) vx += 1;
    if (keys.has('arrowup') || keys.has('w')) vy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) vy += 1;
    const len = Math.hypot(vx, vy)||1;
    p.x += (vx/len)*p.speed*dt; p.y += (vy/len)*p.speed*dt;
    p.x = clamp(p.x, p.r, canvas.width-p.r); p.y = clamp(p.y, p.r, canvas.height-p.r);
    p.cd.fire = Math.max(0, p.cd.fire - dt);
    p.cd.heal = Math.max(0, p.cd.heal - dt);
    p.cd.shield = Math.max(0, p.cd.shield - dt);
    p.dash = Math.max(0, p.dash - dt);
    p.i = Math.max(0, p.i - dt);
    p.energy = Math.min(p.energyMax, p.energy + dt*12);
    arpgSpawn(dt);
    for (let i=arpg.enemies.length-1;i>=0;i--){
      const e = arpg.enemies[i];
      e.t += dt;
      if (e.t>e.tele){
        const a = Math.atan2(p.y - e.y, p.x - e.x);
        const sp = 240;
        arpg.shots.push({ x:e.x, y:e.y, r:6, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, hue: e.hue });
        e.t = 0;
      }
      e.y += e.sp*dt*0.6;
      if (e.y>canvas.height+40) arpg.enemies.splice(i,1);
    }
    for (let i=arpg.shots.length-1;i>=0;i--){
      const s = arpg.shots[i];
      s.x += s.vx*dt; s.y += s.vy*dt;
      if (s.y<-20 || s.y>canvas.height+20 || s.x<-20 || s.x>canvas.width+20){ arpg.shots.splice(i,1); continue }
      for (let j=arpg.enemies.length-1;j>=0;j--){
        const e = arpg.enemies[j];
        if (Math.hypot(s.x-e.x, s.y-e.y) <= s.r+e.r){
          e.hp -= 26;
          if (e.hp<=0){ arpg.enemies.splice(j,1) }
          arpg.shots.splice(i,1);
          break;
        }
      }
      if (Math.hypot(s.x-p.x, s.y-p.y) <= s.r+p.r){
        const block = p.cd.shield>0 ? 0.6 : 1.0;
        if (p.i<=0) p.hp -= Math.floor(16*block);
        arpg.shots.splice(i,1);
      }
    }
    ctx.save();
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 24;
    const pg = ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r);
    pg.addColorStop(0,'#3be1f7'); pg.addColorStop(1,'#22d3ee');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.fill();
    ctx.restore();
    ctx.save();
    for (let i=0;i<arpg.enemies.length;i++){
      const e = arpg.enemies[i];
      const g = ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);
      g.addColorStop(0, `hsla(${e.hue},85%,65%,1)`);
      g.addColorStop(1, `hsla(${e.hue},85%,55%,1)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      const rr = e.r+8;
      ctx.beginPath(); ctx.arc(e.x,e.y,rr,0,Math.PI*2);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    for (let i=0;i<arpg.shots.length;i++){
      const s = arpg.shots[i];
      ctx.shadowColor = 'rgba(167,243,208,0.7)'; ctx.shadowBlur = 12;
      const bg = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);
      bg.addColorStop(0,'rgba(213,255,235,1)'); bg.addColorStop(1,'rgba(167,243,208,1)');
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
    const hpPct = Math.max(0, Math.min(1, p.hp/p.hpMax));
    const enPct = Math.max(0, Math.min(1, p.energy/p.energyMax));
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(16,16,260,44);
    ctx.fillRect(16,66,260,18);
    ctx.fillStyle = '#e6e8f0'; ctx.font = '14px system-ui';
    ctx.fillText(`HP ${Math.floor(p.hp)}/${p.hpMax}`, 24, 34);
    ctx.fillText(`EN ${Math.floor(p.energy)}/${p.energyMax}`, 24, 78);
    const hbg = ctx.createLinearGradient(24, 40, 24+220*hpPct, 40);
    hbg.addColorStop(0,'#22c55e'); hbg.addColorStop(1,'#84cc16');
    ctx.fillStyle = hbg; ctx.fillRect(24,40,220*hpPct,12);
    const ebg = ctx.createLinearGradient(24, 84, 24+220*enPct, 84);
    ebg.addColorStop(0,'#3be1f7'); ebg.addColorStop(1,'#22d3ee');
    ctx.fillStyle = ebg; ctx.fillRect(24,84,220*enPct,12);
    ctx.fillStyle = '#e6e8f0'; ctx.font = '12px system-ui';
    ctx.fillText(`Fire ${p.cd.fire.toFixed(1)} • Heal ${p.cd.heal.toFixed(1)} • Shield ${p.cd.shield.toFixed(1)} • Dash ${p.dash.toFixed(1)}`, 16, canvas.height-20);
    requestAnimationFrame(loop);
    return;
  }
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, '#0b1022');
  bg.addColorStop(1, '#16132c');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.y += s.sp * dt;
    if (s.y > canvas.height + 2) { s.y = -2; s.x = Math.random() * canvas.width }
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `hsla(200, 80%, 80%, ${s.a})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  if (running) {
    let vx = 0, vy = 0;
    if (keys.has('arrowleft') || keys.has('a')) vx -= 1;
    if (keys.has('arrowright') || keys.has('d')) vx += 1;
    if (keys.has('arrowup') || keys.has('w')) vy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) vy += 1;
    const len = Math.hypot(vx, vy) || 1;
    player.x += (vx / len) * player.speed * dt;
    player.y += (vy / len) * player.speed * dt;
    player.x = clamp(player.x, player.r, canvas.width - player.r);
    player.y = clamp(player.y, player.r, canvas.height - player.r);
    spawnT -= dt;
    if (spawnT <= 0) { spawn(); spawnT = 0.6 + Math.random() * 0.5 }
    alienT -= dt;
    if (alienT <= 0) { spawnAlien(); alienT = 2.2 + Math.random() * 2.1 }
    healT -= dt;
    if (healT <= 0) { spawnHeal(); healT = 8 + Math.random() * 6 }
    fireT = Math.max(0, fireT - dt);
    hitT = Math.max(0, hitT - dt);
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];
      e.y += e.speed * dt;
      if (e.type === 'alien') {
        e.phase += dt * 2.0;
        e.x += Math.sin(e.phase) * dt * e.amp;
        e.x = clamp(e.x, 0, canvas.width - e.w);
      }
      if (e.y - e.h > canvas.height + 40) enemies.splice(i, 1);
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      it.y += it.speed * dt;
      if (it.y - it.r > canvas.height + 40) items.splice(i, 1);
    }
    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i];
      if (hitT === 0 && circleRectCollide(player.x, player.y, player.r, e.x, e.y, e.w, e.h)) {
        const dmg = e.type === 'alien' ? 25 : 34;
        player.hp -= dmg;
        updateHPBar();
        makeBurst(player.x, player.y, e.type === 'alien' ? 260 : 10, 20);
        shake = 10;
        hitT = 0.7;
        if (player.hp <= 0) {
          running = false;
          restartBtn.style.display = 'inline-block';
          best = Math.max(best, score);
          localStorage.setItem('fun_best', String(best));
          bestEl.textContent = Math.floor(best);
          break;
        }
      }
    }
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (Math.hypot(player.x - it.x, player.y - it.y) <= player.r + it.r) {
        if (it.type === 'heal') {
          player.hp = Math.min(player.hpMax, player.hp + it.amount);
          updateHPBar();
          makeBurst(it.x, it.y, 120, 16);
        }
        items.splice(i, 1);
      }
    }
    for (let bi = bullets.length - 1; bi >= 0; bi--) {
      const b = bullets[bi];
      b.y += b.vy * dt;
      if (b.y + b.r < -10) { bullets.splice(bi, 1); continue }
      for (let ei = enemies.length - 1; ei >= 0; ei--) {
        const e = enemies[ei];
        if (e.type !== 'alien') continue;
        if (circleRectCollide(b.x, b.y, b.r, e.x, e.y, e.w, e.h)) {
          bullets.splice(bi, 1);
          e.hp -= 1;
          makeBurst(b.x, b.y, e.hue, 6);
          if (e.hp <= 0) {
            makeBurst(e.x + e.w * 0.5, e.y + e.h * 0.5, e.hue, 20);
            score += 25;
            enemies.splice(ei, 1);
          }
          break;
        }
      }
    }
    score += dt * 10;
    scoreEl.textContent = Math.floor(score);
    trail.push({ x: player.x, y: player.y });
    if (trail.length > 14) trail.shift();
  }
  ctx.save();
  const ox = (Math.random() * 2 - 1) * shake;
  const oy = (Math.random() * 2 - 1) * shake;
  ctx.translate(ox, oy);
  shake *= 0.9;
  if (shake < 0.1) shake = 0;
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const a = i / trail.length;
    ctx.fillStyle = `hsla(188, 88%, 60%, ${a * 0.35})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, player.r * (0.7 + a * 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.save();
  ctx.shadowColor = '#22d3ee';
  ctx.shadowBlur = 24;
  const pg = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, player.r);
  pg.addColorStop(0, '#3be1f7');
  pg.addColorStop(1, '#22d3ee');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i];
    const eg = ctx.createLinearGradient(e.x, e.y, e.x, e.y + e.h);
    eg.addColorStop(0, `hsla(${e.hue}, 85%, 65%, 1)`);
    eg.addColorStop(1, `hsla(${e.hue}, 85%, 55%, 1)`);
    ctx.fillStyle = eg;
    ctx.save();
    ctx.shadowColor = `hsla(${e.hue}, 90%, 60%, 0.6)`;
    ctx.shadowBlur = 14;
    roundRect(e.x, e.y, e.w, e.h, 8);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    ctx.save();
    ctx.shadowColor = '#a7f3d0';
    ctx.shadowBlur = 12;
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    bg.addColorStop(0, 'rgba(213, 255, 235, 1)');
    bg.addColorStop(1, 'rgba(167, 243, 208, 1)');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 30 * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    const a = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = `hsla(${p.hue}, 85%, 65%, ${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
  ctx.save();
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type === 'heal') {
      ctx.save();
      ctx.shadowColor = 'rgba(74,222,128,0.6)';
      ctx.shadowBlur = 14;
      const ig = ctx.createRadialGradient(it.x, it.y, 0, it.x, it.y, it.r);
      ig.addColorStop(0, 'rgba(110,231,183,1)');
      ig.addColorStop(1, 'rgba(74,222,128,1)');
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(it.x, it.y, it.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = 'rgba(34,197,94,0.9)';
      ctx.fillRect(it.x - 2, it.y - it.r + 2, 4, it.r * 2 - 4);
      ctx.fillRect(it.x - it.r + 2, it.y - 2, it.r * 2 - 4, 4);
    }
  }
  ctx.restore();
  const vg = ctx.createRadialGradient(canvas.width * 0.5, canvas.height * 0.6, canvas.height * 0.15, canvas.width * 0.5, canvas.height * 0.6, canvas.height * 0.9);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);