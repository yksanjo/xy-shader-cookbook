const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const shaderCanvas = document.getElementById('shader');
const modeGameBtn = document.getElementById('mode-game');
const modeShaderBtn = document.getElementById('mode-shader');
const shaderUI = document.getElementById('shader-ui');
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
  if (m === 'game') {
    canvas.style.display = 'block';
    shaderCanvas.style.display = 'none';
    shaderUI.style.display = 'none';
    document.querySelector('.hint').style.display = 'block';
    document.querySelector('.scores').style.display = 'inline-flex';
    document.querySelector('.health').style.display = 'block';
    restartBtn.style.display = 'none';
  } else {
    canvas.style.display = 'none';
    shaderCanvas.style.display = 'block';
    shaderUI.style.display = 'flex';
    document.querySelector('.hint').style.display = 'none';
    document.querySelector('.scores').style.display = 'none';
    document.querySelector('.health').style.display = 'none';
  }
}
modeGameBtn.addEventListener('click', () => setMode('game'));
modeShaderBtn.addEventListener('click', () => setMode('shader'));
setMode('game');
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