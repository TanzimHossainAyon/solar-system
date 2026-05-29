// =====================================================
// SOLAR SYSTEM SIMULATOR
// Author: Tanzim Hossain Ayon | BRAC University
// Techniques: Canvas API, RAF, Math/Trig, LocalStorage,
// SVG, CSS Variables, Web Animations API, Event Listeners
// =====================================================

const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');

// ===== STATE =====
let W, H, CX, CY;
let paused = false;
let speed = parseFloat(localStorage.getItem('ss_speed') || '1');
let zoom = 1, offsetX = 0, offsetY = 0;
let dragging = false, dragStart = {x:0, y:0}, dragOffset = {x:0, y:0};
let t = 0;
let selectedPlanet = null;
let stars = [], shootingStars = [];

// ===== PLANET DATA =====
const planets = [
  {
    name:'Mercury', emoji:'⚫', color:'#b5b5b5', glow:'#d0d0d0',
    radius:4, orbit:70, speed:4.15, angle:0,
    type:'Terrestrial', dist:'57.9 million km', diam:'4,879 km',
    period:'88 Earth days', temp:'-180°C to 430°C', moons:'0',
    gravity:'3.7 m/s²',
    desc:'The smallest planet and closest to the Sun, with extreme temperature swings.',
    ring:false
  },
  {
    name:'Venus', emoji:'🟡', color:'#e8cda0', glow:'#f5d98c',
    radius:7, orbit:105, speed:1.62, angle:1,
    type:'Terrestrial', dist:'108.2 million km', diam:'12,104 km',
    period:'225 Earth days', temp:'462°C (avg)', moons:'0',
    gravity:'8.87 m/s²',
    desc:'The hottest planet due to its thick atmosphere of carbon dioxide.',
    ring:false
  },
  {
    name:'Earth', emoji:'🌍', color:'#4f9ef7', glow:'#00d4ff',
    radius:8, orbit:145, speed:1.0, angle:2,
    type:'Terrestrial', dist:'149.6 million km', diam:'12,742 km',
    period:'365.25 days', temp:'-89°C to 58°C', moons:'1 (Moon)',
    gravity:'9.81 m/s²',
    desc:'Our home — the only known planet to harbor life.',
    ring:false
  },
  {
    name:'Mars', emoji:'🔴', color:'#c1440e', glow:'#e05c20',
    radius:6, orbit:190, speed:0.53, angle:3,
    type:'Terrestrial', dist:'227.9 million km', diam:'6,779 km',
    period:'687 Earth days', temp:'-125°C to 20°C', moons:'2 (Phobos, Deimos)',
    gravity:'3.72 m/s²',
    desc:'The Red Planet — home to Olympus Mons, the tallest volcano in the solar system.',
    ring:false
  },
  {
    name:'Jupiter', emoji:'🟠', color:'#c88b3a', glow:'#e8a550',
    radius:22, orbit:270, speed:0.084, angle:4,
    type:'Gas Giant', dist:'778.5 million km', diam:'139,820 km',
    period:'11.86 Earth years', temp:'-110°C (cloud top)', moons:'95 known',
    gravity:'24.79 m/s²',
    desc:'The largest planet — its Great Red Spot is a storm larger than Earth.',
    ring:false
  },
  {
    name:'Saturn', emoji:'🪐', color:'#e4d191', glow:'#f0e0a0',
    radius:18, orbit:345, speed:0.034, angle:5,
    type:'Gas Giant', dist:'1.43 billion km', diam:'116,460 km',
    period:'29.46 Earth years', temp:'-140°C (cloud top)', moons:'146 known',
    gravity:'10.44 m/s²',
    desc:'Famous for its stunning ring system made of ice and rock particles.',
    ring:true
  },
  {
    name:'Uranus', emoji:'🔵', color:'#7de8e8', glow:'#a0f0f0',
    radius:13, orbit:415, speed:0.012, angle:6,
    type:'Ice Giant', dist:'2.87 billion km', diam:'50,724 km',
    period:'84 Earth years', temp:'-195°C (avg)', moons:'28 known',
    gravity:'8.69 m/s²',
    desc:'Rotates on its side — its axis tilts at 98 degrees.',
    ring:false
  },
  {
    name:'Neptune', emoji:'🔵', color:'#3f54ba', glow:'#5b72e8',
    radius:12, orbit:475, speed:0.006, angle:7,
    type:'Ice Giant', dist:'4.5 billion km', diam:'49,244 km',
    period:'164.8 Earth years', temp:'-200°C (avg)', moons:'16 known',
    gravity:'11.15 m/s²',
    desc:'The windiest planet — winds reach up to 2,100 km/h.',
    ring:false
  }
];

// ===== INIT =====
function resize(){
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  CX = W / 2; CY = H / 2;
}
resize();
window.addEventListener('resize', resize);

// Apply saved speed
document.getElementById('speed').value = speed;
document.getElementById('speed-val').textContent = speed + 'x';

// ===== STARS =====
function initStars(){
  stars = [];
  for(let i = 0; i < 800; i++){
    stars.push({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.5 + 0.2,
      opacity: Math.random() * 0.8 + 0.2,
      twinkle: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.02 + 0.005
    });
  }
}
initStars();

function spawnShootingStar(){
  if(Math.random() < 0.003){
    shootingStars.push({
      x: Math.random() * W, y: 0,
      vx: (Math.random() - 0.5) * 8 + 4,
      vy: Math.random() * 4 + 3,
      len: Math.random() * 80 + 40,
      life: 1, decay: 0.02 + Math.random() * 0.02
    });
  }
}

function drawStars(){
  stars.forEach(s => {
    s.twinkle += s.speed;
    const op = s.opacity * (0.7 + 0.3 * Math.sin(s.twinkle));
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${op})`;
    ctx.fill();
  });
  // Shooting stars
  spawnShootingStar();
  shootingStars = shootingStars.filter(ss => ss.life > 0);
  shootingStars.forEach(ss => {
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(ss.x - ss.vx * ss.len / 10, ss.y - ss.vy * ss.len / 10);
    const grad = ctx.createLinearGradient(ss.x, ss.y, ss.x - ss.vx * ss.len / 10, ss.y - ss.vy * ss.len / 10);
    grad.addColorStop(0, `rgba(255,255,255,${ss.life})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ss.x += ss.vx; ss.y += ss.vy; ss.life -= ss.decay;
  });
}

// ===== NEBULA =====
function drawNebula(){
  const nebulas = [
    {x:0.15, y:0.3, r:0.2, c:'rgba(79,142,247,0.04)'},
    {x:0.8, y:0.7, r:0.18, c:'rgba(168,85,247,0.03)'},
    {x:0.5, y:0.1, r:0.15, c:'rgba(0,229,255,0.03)'},
  ];
  nebulas.forEach(n => {
    const g = ctx.createRadialGradient(n.x*W, n.y*H, 0, n.x*W, n.y*H, n.r*W);
    g.addColorStop(0, n.c); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
  });
}

// ===== ASTEROID BELT =====
const asteroids = Array.from({length:120}, () => ({
  angle: Math.random() * Math.PI * 2,
  r: 220 + (Math.random() - 0.5) * 25,
  size: Math.random() * 1.5 + 0.3,
  speed: (Math.random() * 0.0003 + 0.0001) * (Math.random() > 0.5 ? 1 : -1)
}));

function drawAsteroidBelt(){
  asteroids.forEach(a => {
    if(!paused) a.angle += a.speed * speed;
    const x = CX + offsetX + (a.r * zoom) * Math.cos(a.angle);
    const y = CY + offsetY + (a.r * zoom) * Math.sin(a.angle);
    ctx.beginPath();
    ctx.arc(x, y, a.size * zoom, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(150,130,100,0.4)';
    ctx.fill();
  });
}

// ===== SUN =====
function drawSun(){
  const x = CX + offsetX, y = CY + offsetY;
  const r = 28 * zoom;
  // Corona
  for(let i = 3; i > 0; i--){
    const g = ctx.createRadialGradient(x,y,r*0.5,x,y,r*i*1.5);
    g.addColorStop(0, `rgba(255,200,50,${0.04/i})`);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x,y,r*i*1.5,0,Math.PI*2); ctx.fill();
  }
  // Sun body
  const sg = ctx.createRadialGradient(x-r*0.3,y-r*0.3,0,x,y,r);
  sg.addColorStop(0,'#fff7d0'); sg.addColorStop(0.4,'#ffd700'); sg.addColorStop(0.8,'#ff8c00'); sg.addColorStop(1,'#ff4500');
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = sg; ctx.fill();
  // Flare animation
  const flareR = r * (1 + 0.08 * Math.sin(t * 2));
  ctx.beginPath(); ctx.arc(x,y,flareR,0,Math.PI*2);
  ctx.strokeStyle = `rgba(255,200,50,${0.3 + 0.1*Math.sin(t*3)})`; ctx.lineWidth = 2*zoom; ctx.stroke();
}

// ===== ORBIT PATH =====
function drawOrbit(r){
  ctx.beginPath();
  ctx.arc(CX+offsetX, CY+offsetY, r*zoom, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4,8]);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ===== SATURN RING =====
function drawRing(x, y, pr){
  const rx = pr * 2.2 * zoom, ry = pr * 0.5 * zoom;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(228,209,145,0.5)'; ctx.lineWidth = pr*0.6*zoom; ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y, rx*1.2, ry*1.2, 0, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(228,209,145,0.2)'; ctx.lineWidth = pr*0.3*zoom; ctx.stroke();
}

// ===== PLANET =====
function drawPlanet(p){
  drawOrbit(p.orbit);
  if(!paused) p.angle += p.speed * 0.005 * speed;
  const x = CX + offsetX + p.orbit * zoom * Math.cos(p.angle);
  const y = CY + offsetY + p.orbit * zoom * Math.sin(p.angle);
  p._x = x; p._y = y;
  const r = p.radius * zoom;
  const isHovered = selectedPlanet === p;

  // Glow
  const glowSize = isHovered ? r*3.5 : r*2.5;
  const gg = ctx.createRadialGradient(x,y,0,x,y,glowSize);
  gg.addColorStop(0, p.glow + '33'); gg.addColorStop(1, 'transparent');
  ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x,y,glowSize,0,Math.PI*2); ctx.fill();

  // Ring (Saturn)
  if(p.ring) drawRing(x, y, r);

  // Planet body
  const pg = ctx.createRadialGradient(x-r*0.3, y-r*0.3, 0, x, y, r);
  pg.addColorStop(0, lighten(p.color)); pg.addColorStop(0.6, p.color); pg.addColorStop(1, darken(p.color));
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle = pg; ctx.fill();

  // Earth clouds
  if(p.name === 'Earth'){
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=r*0.3; ctx.stroke();
  }
  // Hover ring
  if(isHovered){
    ctx.beginPath(); ctx.arc(x,y,r+4*zoom,0,Math.PI*2);
    ctx.strokeStyle=p.glow+'aa'; ctx.lineWidth=1.5; ctx.stroke();
  }

  // Update label
  updateLabel(p, x, y);
}

// ===== LABELS =====
const labelEls = {};
function initLabels(){
  const container = document.getElementById('labels');
  container.innerHTML = '';
  planets.forEach(p => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.id = 'label-' + p.name;
    el.textContent = p.name.toUpperCase();
    container.appendChild(el);
    labelEls[p.name] = el;
  });
}
initLabels();

function updateLabel(p, x, y){
  const el = labelEls[p.name];
  if(!el) return;
  el.style.left = x + 'px';
  el.style.top = (y - p.radius * zoom - 14) + 'px';
  el.style.opacity = zoom > 0.5 ? '1' : '0';
}

// ===== COLOR HELPERS =====
function lighten(hex){
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.min(255,r+60)},${Math.min(255,g+60)},${Math.min(255,b+60)})`;
}
function darken(hex){
  const r=parseInt(hex.slice(1,3),16), g=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
  return `rgb(${Math.max(0,r-40)},${Math.max(0,g-40)},${Math.max(0,b-40)})`;
}

// ===== MAIN LOOP =====
function draw(){
  ctx.clearRect(0,0,W,H);
  // Space background
  const bg = ctx.createRadialGradient(CX,CY,0,CX,CY,Math.max(W,H));
  bg.addColorStop(0,'#040810'); bg.addColorStop(1,'#000002');
  ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
  drawNebula();
  drawStars();
  drawAsteroidBelt();
  drawSun();
  planets.forEach(p => drawPlanet(p));
  if(!paused) t += 0.016 * speed;
  requestAnimationFrame(draw);
}
draw();

// ===== INTERACTIONS =====
// Click
canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let clicked = null;
  planets.forEach(p => {
    if(!p._x) return;
    const dx = mx - p._x, dy = my - p._y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist < (p.radius + 10) * zoom) clicked = p;
  });
  if(clicked){
    selectedPlanet = clicked;
    showInfo(clicked);
  } else {
    closePanel();
    selectedPlanet = null;
  }
});

// Hover cursor
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left, my = e.clientY - rect.top;
  let onPlanet = false;
  planets.forEach(p => {
    if(!p._x) return;
    const dx = mx - p._x, dy = my - p._y;
    if(Math.sqrt(dx*dx+dy*dy) < (p.radius+10)*zoom) onPlanet = true;
  });
  canvas.style.cursor = onPlanet ? 'pointer' : (dragging ? 'grabbing' : 'crosshair');
});

// Drag/Pan
canvas.addEventListener('mousedown', e => {
  dragging = true;
  dragStart = {x: e.clientX - offsetX, y: e.clientY - offsetY};
});
canvas.addEventListener('mousemove', e => {
  if(!dragging) return;
  offsetX = e.clientX - dragStart.x;
  offsetY = e.clientY - dragStart.y;
});
canvas.addEventListener('mouseup', ()=> dragging = false);
canvas.addEventListener('mouseleave', ()=> dragging = false);

// Zoom
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  zoom = Math.max(0.3, Math.min(3, zoom * delta));
});

// Touch support
let lastTouch = null;
canvas.addEventListener('touchstart', e => {
  lastTouch = {x: e.touches[0].clientX - offsetX, y: e.touches[0].clientY - offsetY};
});
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if(lastTouch){
    offsetX = e.touches[0].clientX - lastTouch.x;
    offsetY = e.touches[0].clientY - lastTouch.y;
  }
});

// ===== INFO PANEL =====
function showInfo(p){
  document.getElementById('p-icon').textContent = p.emoji;
  document.getElementById('p-name').textContent = p.name;
  document.getElementById('p-type').textContent = p.type;
  document.getElementById('p-dist').textContent = p.dist;
  document.getElementById('p-diam').textContent = p.diam;
  document.getElementById('p-period').textContent = p.period;
  document.getElementById('p-temp').textContent = p.temp;
  document.getElementById('p-moons').textContent = p.moons;
  document.getElementById('p-grav').textContent = p.gravity;
  document.getElementById('p-desc').textContent = p.desc;
  document.getElementById('info-panel').classList.remove('hidden');
}
function closePanel(){
  document.getElementById('info-panel').classList.add('hidden');
  selectedPlanet = null;
}

// ===== CONTROLS =====
function togglePause(){
  paused = !paused;
  const btn = document.getElementById('pause-btn');
  btn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  btn.classList.toggle('paused', paused);
}
function setSpeed(val){
  speed = parseFloat(val);
  document.getElementById('speed-val').textContent = speed + 'x';
  localStorage.setItem('ss_speed', speed);
}
function resetView(){
  zoom = 1; offsetX = 0; offsetY = 0;
  paused = false;
  document.getElementById('pause-btn').textContent = '⏸ Pause';
  document.getElementById('pause-btn').classList.remove('paused');
}
