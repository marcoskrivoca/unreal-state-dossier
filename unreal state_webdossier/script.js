// --- STATE ---
const state = { choice0: localStorage.getItem('choice0') || null };
const phone  = document.getElementById('phone');
const slidesWrap = document.getElementById('slides');

// --- HEADER: single-line ticker for slide 0 ---
(function ticker(){
  const host = document.getElementById('diag');
  if(!host) return;
  host.innerHTML = '<div class="ticker"><div class="track" id="tickerTrack"></div></div>';
  const track = document.getElementById('tickerTrack');
  const pick=(a)=>a[Math.floor(Math.random()*a.length)];
  const int=(a,b)=>Math.floor(a+Math.random()*(b-a+1));
  const float=(a,b,d=1)=>(a+Math.random()*(b-a)).toFixed(d);
  const hex=(n)=>Array.from({length:n},()=>pick('0123456789ABCDEF'.split(''))).join('');
  const clinical=[()=>`PULSE:${int(58,108)}bpm`,()=>`O2SAT:${int(94,100)}%`,()=>`TEMP:${float(35.8,37.8)}°C`,()=>`EEG.ALPHA:${int(18,86)}%`,()=>`NEURAL.NOISE:${float(0.8,3.6,2)}dB`];
  const corporate=[()=>`CHANNEL:KCEO.NET`,()=>`NODE:ECHO-${int(1,32)}`,()=>`SYNC:${pick(['OK','PENDING','DELAYED'])}`,()=>`INTEGRITY:${float(82.0,99.9)}%`,()=>`SUBJECT:${hex(2)}-${hex(2)}${int(10,99)}`];
  const japanese=[()=>`状態: ${pick(['安定','変動','保留','解析中'])}`,()=>`同意: ${pick(['未設定','保留','確認済'])}`,()=>`信号: ${pick(['安定','弱い','探索中'])}`,()=>`幸福指数:${int(40,99)}%`];
  function seg(){const buckets=[clinical,corporate,clinical]; if(Math.random()<0.2)buckets.push(japanese); const f=pick(pick(buckets)); return f();}
  function build(){
    const items=Array.from({length:int(14,18)},()=>seg());
    const dup=items.concat(items);
    track.innerHTML = dup.map(t=>`<span class="seg">${t}</span><span class="sep">•</span>`).join('');
    track.style.animation='none'; void track.offsetWidth;
    const dur=Math.max(18,Math.min(30,Math.floor(track.scrollWidth/40)));
    track.style.animation=`tickerMove ${dur}s linear infinite`;
  }
  build(); setInterval(build, 12000);
})();

// --- BACKGROUND CODEFLOW (slide 0) ---
(function buildCode(){
  const cf = document.getElementById('codeflow'); if(!cf) return;
  const cols=6, rows=140; const symbols = "#@$%&*/+-=<>|{}[]()01\u2588\u2591\u2592\u2593";
  for(let c=0;c<cols;c++){
    const pre=document.createElement('pre'); pre.className='scroll c'+(c%4); let s='';
    for(let r=0;r<rows;r++){
      let line=''; for(let k=0;k<18;k++){ line += symbols[Math.floor(Math.random()*symbols.length)]; }
      s += line + "\n";
    }
      // duplicate the generated content so the vertical scroll can loop
      // smoothly (0 -> -50%) without producing a blank gap at the end.
      pre.textContent = s + s;
      cf.appendChild(pre);
  }
})();

// --- HELPERS ---
function addRipple(x,y){ const r=document.createElement('span'); r.className='ripple'; r.style.left=x+'px'; r.style.top=y+'px'; slidesWrap.appendChild(r); r.addEventListener('animationend',()=>r.remove()); }
function showLog(lines){ const log=document.getElementById('syslog'); log.innerHTML = lines.map(l=>`[SYS.LOG] ${l}`).join('<br/>'); log.classList.add('show'); clearTimeout(showLog.t); showLog.t=setTimeout(()=>log.classList.remove('show'),1800); }

// Clear transient overlays and stuck states that can hide slides
function clearTransientOverlays(){
  try{
    // remove ephemeral overlay elements if present
    document.querySelectorAll('.section-loader, .glitch-overlay, .wipe, .flicker, .chroma-wash').forEach(n=>{ try{ n.remove(); }catch(_){} });
    // ensure phone is not left in a glitching state
    if(phone){ try{ phone.classList.remove('glitching'); phone.style.backgroundColor = ''; }catch(_){} }
  }catch(e){ /* swallow */ }
}
window.clearTransientOverlays = clearTransientOverlays;

// Overlay observer and debug helpers removed in cleanup: diagnostic MutationObserver
// was useful during debugging but is no longer necessary in production. If you need
// similar diagnostics again, reinstate a lightweight observer that records add/remove
// events for transient overlay nodes (.wipe, .flicker, .section-loader, etc.).

function goToSlide(id){
  // remove any stuck overlays before changing slides so content is visible
  try{ clearTransientOverlays(); }catch(e){}
  document.querySelectorAll('.slide').forEach(s=> s.classList.remove('active'));
  const next = document.querySelector(`.slide[data-id="${id}"]`);
  if(next) next.classList.add('active');
  const diag = document.getElementById('diag'); // header only on slide 0
  if(diag) diag.style.display = (id===0 ? 'block' : 'none');
  // phone-level CRT toggle removed — keep phone class/state unchanged
  if(id===1){
    // pure-CSS handles animation offset when the slide becomes active.
    enterTitle1();
  }
  if(id===2){ enterSlide2(); }
  if(id===7){ try{ enterSlide7(); }catch(e){} }
  // Recompute layout (phone fit, button widths) after slide change so
  // responsive/pinned elements render correctly.
  try{ fit(); }catch(e){}
  // Defensive cleanup: if we landed on slide 3, ensure any transient
  // overlay elements (which can occasionally persist) are removed after
  // a short delay so the slide content is visible.
  try{
    if(id===3){
      // Defensive cleanup: ensure no transient overlays or 'glitching' state
      // remain when activating slide 3. We purposely avoid inline emergency
      // style overrides here — the CSS fix for slide 3 should be authoritative.
      try{ clearTransientOverlays(); }catch(e){}
      try{ if(phone) phone.classList.remove('glitching'); }catch(e){}
      // Small delayed re-check as a race protection (keeps behavior robust).
      setTimeout(()=>{ try{ clearTransientOverlays(); if(phone) phone.classList.remove('glitching'); }catch(_){} }, 60);
    }
  }catch(e){}
}

/* scanline wipe (0→1) */
function scanWipeTint(color, next){
  try{
    // remove any existing wipe overlays so they don't stack or get stuck
    document.querySelectorAll('.wipe').forEach(n=>{ try{ n.remove(); }catch(_){} });
    const w = document.createElement('div');
    w.className = 'wipe run';
    w.style.setProperty('--edge', color);
    // force immediate visibility and ensure it sits above other elements
    w.style.opacity = '1';
    w.style.zIndex = '10000';
    w.style.pointerEvents = 'none';
    // expose for debugging and quick inspection from the console
    try{ window.__lastWipe = w; }catch(_){ }
    console.log('[wipe] create', color);
    try{
      if(window.__holdWipeForOnChoice){
        // lengthen animation so the wipe is easier to perceive when triggered by consent
        w.style.animation = 'wipeAnim 1.6s ease forwards';
        delete window.__holdWipeForOnChoice;
      }
    }catch(_){}
    phone.appendChild(w);
    // force reflow so the animation reliably starts
    void w.offsetWidth;
    if(!w.classList.contains('run')) w.classList.add('run');
    w.addEventListener('animationend',()=>{ try{ w.remove(); }catch(_){}; if(typeof next==='function') next(); });
  }catch(e){ console.warn('scanWipeTint error', e); if(typeof next==='function') next(); }
}
/* black flicker (1→2) */
function flickerTo(next){
  const f = document.createElement('div');
  f.className = 'flicker run';
  phone.appendChild(f);
  f.addEventListener('animationend',()=>{ f.remove(); if(typeof next==='function') next(); });
}

/* chromaWash transition: short chromatic overlay that pulses then fades */
function chromaWash(next){
  const c = document.createElement('div');
  c.className = 'chroma-wash'; phone.appendChild(c);
  // force reflow then play
  void c.offsetWidth; c.classList.add('play');
  c.addEventListener('animationend',()=>{ c.remove(); if(typeof next==='function') next(); });
}

/* mapReveal: create a tiled overlay that animates away revealing the next slide
   callback is called after the animation completes */
function mapReveal(callback){
  const cols = 12;
  const rows = 8;
  const container = document.createElement('div');
  container.className = 'map-reveal';
  // create tiles in grid
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const t = document.createElement('div');
      t.className = 'map-tile';
      // stagger delay from top-left -> bottom-right, with some randomness
      const delay = (r + c) * 28 + Math.floor(Math.random()*30);
      t.style.animationDelay = delay + 'ms';
      container.appendChild(t);
    }
  }
  phone.appendChild(container);
  // force reflow then start
  void container.offsetWidth;
  container.classList.add('play');
  // compute max delay + duration to cleanup
  const maxDelay = (rows + cols) * 28 + 40;
  const duration = 720; // matches CSS
  const total = maxDelay + duration + 160;
  setTimeout(()=>{
    container.remove();
    if(typeof callback === 'function') callback();
  }, total);
}

/* glitchTo: brief 'something broke' overlay used when transitioning to a corrupted slide
   returns a Promise that resolves after navigation completes. The overlay animates
   and then calls goToSlide(nextId). */
function glitchTo(nextId){
  return new Promise(res=>{
    try{
      const o = document.createElement('div'); o.className='glitch-overlay';
      // include layered text that says 'interruption' — animated via CSS
      o.innerHTML = '<div class="back"></div><div class="g1"></div><div class="g2"></div><div class="noise"></div>' +
                    '<div class="glitch-text">' +
                      '<span class="layer c0">interruption</span>' +
                      '<span class="layer c1">interruption</span>' +
                      '<span class="layer c2">interruption</span>' +
                    '</div>';
  phone.appendChild(o);
  // make this overlay heavy: add flash + invert classes to get white/black flashes + invert
  o.classList.add('flash'); o.classList.add('invert');
  // mark phone as glitching so underlying slides are hidden and phone background is forced to black
  try{ phone.classList.add('glitching'); phone.style.backgroundColor = '#000'; }catch(e){}
  // play
  void o.offsetWidth; o.classList.add('run');
      // When the overlay plays, navigate to next slide while the overlay is visible
      // so we don't flash the previous slide at the end. Remove overlay after
      // a short delay once navigation has occurred and new slide has had time
      // to render beneath it.
      try{ if(typeof nextId !== 'undefined' && nextId !== null) goToSlide(nextId); }catch(e){}
      const onEnd = ()=>{
        try{ phone.classList.remove('glitching'); phone.style.backgroundColor=''; }catch(e){}
        try{ if(document.body.contains(o)) o.remove(); }catch(_){}
        res();
      };
      // remove overlay a short time after the animation ends to ensure the
      // new slide is visible under it (prevents a frame of the old slide)
      o.addEventListener('animationend', ()=> setTimeout(onEnd, 60));
  // safety fallback slightly longer than animation (2s)
  setTimeout(()=>{ try{ if(typeof nextId !== 'undefined' && nextId !== null) goToSlide(nextId); }catch(e){} try{ if(document.body.contains(o)) o.remove(); }catch(_){} try{ phone.classList.remove('glitching'); phone.style.backgroundColor=''; }catch(e){} res(); }, 2400);
    }catch(e){ try{ if(typeof nextId !== 'undefined' && nextId !== null) goToSlide(nextId); }catch(_){} res(); }
  });
}

/* enterSlide7: run typed text for the interruption, then reveal a media placeholder
   and fade in three choice buttons. */
function enterSlide7(){
  const host = document.getElementById('slide7Typed'); if(!host) return;
  // Prevent rerunning if we've already populated this slide during this session
  const slideEl = document.querySelector('.slide[data-id="7"]');
  if(slideEl && slideEl.dataset.entered === '1') return;
  if(slideEl) slideEl.dataset.entered = '1';

  host.innerHTML = '';
  const text = `I know you want to take a well deserved rest\nfrom so much serious reading.\n\nBut there is an incisive part of your brain that keeps\nasking:\n\nWhat are we going to do with this parking lot situation?\n`;
  const msPerChar = 26;

  // ensure buttons are hidden before typing
  Array.from(document.querySelectorAll('#slide7 .fade-item')).forEach(b=>{ b.classList.remove('show'); b.classList.remove('visible'); });
  // hide media placeholder until typing completes
  const media = document.getElementById('slide7Media'); if(media){ media.classList.remove('visible'); }

  // small delay so the slide becomes active visually
  setTimeout(()=>{
    typeAll(host, text, msPerChar).then(()=>{
      // reveal media placeholder (class-driven)
      if(media){ media.classList.add('visible'); }
      // fade-in buttons with stagger
      const btns = Array.from(document.querySelectorAll('#slide7 .fade-item'));
      btns.forEach((b,i)=>{ setTimeout(()=>{ b.classList.add('show'); b.classList.add('visible'); }, 240 + (i*220)); });
    });
  }, 120);
}

// Ensure enterSlide7 runs when slide 7 becomes active, even if navigation bypasses goToSlide
(() => {
  const target = document.querySelector('.slide[data-id="7"]');
  if(!target) return;
  const obs = new MutationObserver((list)=>{
    for(const m of list){
      if(m.type === 'attributes' && m.attributeName === 'class'){
        if(target.classList.contains('active')){
          try{ enterSlide7(); }catch(e){}
        }
      }
    }
  });
  obs.observe(target, { attributes: true });
})();

/* Populate Slide 5 dynamically based on the selected location */
function populateSlide5(which){
  const body = document.getElementById('slide5Body');
  const nearest = document.getElementById('nearestBtn');
  const read  = document.getElementById('readBtn');
  if(!body||!nearest||!read) return;
  if(which==='library'){
    const txt = 'Here, let me guide you to your nearest library.';
    nearest.textContent = txt; nearest.dataset.label = txt;
    body.innerHTML = `
      <p>As the reader you are, it’s probably the place to be.</p>
      <p>A fellow reader approaches you and lets you know that next week, this library will be turned into a parking lot.</p>
      <p>You decide to steal a book as a sign of resistance. Once you open it, it says:</p>
    `;
    read.textContent = 'read book';
    read.textContent = 'read book';
    nearest.dataset.dest = 'library';
  } else if(which==='cemetery'){
    const txt = 'Here, let me guide you to your nearest cemetery.';
    nearest.textContent = txt; nearest.dataset.label = txt;
    body.innerHTML = `
      <p>You come here once a week to visit your family.</p>
      <p>A cemetery worker approaches you and lets you know that next week, this cemetery will be turned into a parking lot.</p>
      <p>The wind moves a branch that was blocking a gravestone near you. It reads:</p>
    `;
    read.textContent = 'read inscription';
    nearest.dataset.dest = 'cemetery';
  } else {
    const txt = 'Here, let me guide you to your nearest museum.';
    nearest.textContent = txt; nearest.dataset.label = txt;
    body.innerHTML = `
      <p>As the reader you are, no knowledge is enough.</p>
      <p>While standing in front of a thought provoking piece, you see a museum guard crying while holding a pamphlet.</p>
      <p>They tell you the museum will be turned into a parking lot, and hands you the paper, where it is printed:</p>
    `;
    read.textContent = 'read inscription';
    nearest.dataset.dest = 'museum';
  }
}

/* Populate Slide 6 (reader view) */
function populateSlide6(which){
  // Populate the conceptual framework content for slide 6. The content is
  // intentionally the same regardless of the 'which' parameter (choice)
  // because this slide presents a general framing of the project.
  const container = document.getElementById('slide6Body'); if(!container) return;
  container.innerHTML = `
    <p>unreal state stages a world shaped by algorithmic governance and the collapse of collective fictions. It unfolds within the infrastructures that now host power and spectacle. Guided by the King CEO, a voice that merges technocratic authority with monarchical seduction, the experience draws on imaginaries proposed by Curtis Yarvin and Nick Land, where democracy is replaced by streamlined control. This performance uses the same devices that shape contemporary behavior. It explores how interactive media and mobile technologies have become new rehearsal spaces for obedience.</p>

    <p>As Benjamin Bratton suggests in The Stack, planetary-scale computation operates across layers. unreal state turns these layers into narrative space. Participants navigate a system that observes, anticipates, and absorbs their decisions. But within that structure, something else begins to form. Not escape, but rhythm, friction, or pause.</p>

    <p>Shall we continue?</p>
  `;
}

/* Navigation helpers: compute next and last slide ids based on DOM order */
function getOrderedSlideIds(){
  return Array.from(document.querySelectorAll('.slide')).map(s=> s.getAttribute('data-id'));
}
function getCurrentSlideIndex(){
  const active = document.querySelector('.slide.active'); if(!active) return -1;
  const id = active.getAttribute('data-id'); const arr = getOrderedSlideIds(); return arr.indexOf(id);
}

/* Match slide-0 buttons width to title width and place side-by-side */
function fitButtonsToTitle(){
  const title = document.getElementById('title0');
  const row = document.getElementById('actions0');
  if(!title || !row) return;
  const w = title.getBoundingClientRect().width;
  // keep existing behavior (buttons width based on title) but also
  // ensure the title visually matches the buttons: if buttons wider,
  // scale title down to match their combined width.
  row.style.width = Math.max(220, Math.floor(w)) + 'px';
  row.style.maxWidth = '86%';
  row.style.display = 'flex';
  row.style.gap = '12px';
  row.querySelectorAll('button').forEach(b=>{ b.style.flex = '1 1 0'; });
  // After setting button widths, ensure title shrinks to the sum width
  try{ fitTitleToButtons(); }catch(e){}
}

function fitTitleToButtons(){
  const title = document.getElementById('title0');
  const row = document.getElementById('actions0');
  if(!title || !row) return;
  const rowW = row.getBoundingClientRect().width;
  const titleW = title.getBoundingClientRect().width;
  if(titleW > rowW){
    const scale = Math.max(0.7, rowW / titleW);
    title.style.transformOrigin = 'center';
    title.style.transform = `scale(${scale})`;
  } else {
    title.style.transform = '';
  }
}

function adjustTitleWidth(){
  const tMain = document.getElementById('tMain');
  const tTop  = document.getElementById('tTop');
  const tBy   = document.getElementById('tBy');
  if(!tMain||!tTop||!tBy) return;
  const prevTransform = tMain.style.transform;
  tMain.style.transform = 'scale(1)';
  const target = tMain.getBoundingClientRect().width;
  tMain.style.transform = prevTransform;
  [tTop, tBy].forEach(el=>{
    el.style.letterSpacing='0px';
    const w = el.getBoundingClientRect().width;
    const n = Math.max(2, el.textContent.length - 1);
    const extra = target - w;
    const per = extra / n;
    el.style.letterSpacing = (per>0? per: 0) + 'px';
    el.style.textAlign='center';
    el.style.maxWidth = target + 'px';
  });

  // Ensure the main title does not visually exceed the width of the
  // auxiliary lines (tTop / tBy). If it is wider, scale it down to match
  // their width so all three lines appear the same width.
  try{
    const topW = tTop.getBoundingClientRect().width;
    const byW  = tBy.getBoundingClientRect().width;
    const desired = Math.max(topW, byW);
    const mainW = tMain.getBoundingClientRect().width;
    if(desired && mainW > desired){
      // Prevent the title from being scaled too small — keep it readable.
      // Use JS scaling to match widths but clamp the minimum scale to 0.6.
      const scale = Math.max(0.6, desired / mainW);
      tMain.style.transformOrigin = 'center center';
      tMain.style.transform = `scale(${scale})`;
    } else {
      tMain.style.transform = '';
    }
  }catch(e){}
}

function enterTitle1(){
  const tTop= document.getElementById('tTop');
  const tMain=document.getElementById('tMain');
  const tBy = document.getElementById('tBy');
  const title1 = document.getElementById('title1');
  const startBtn = document.querySelector('.btn.start');
  if(!tTop||!tMain||!tBy||!startBtn) return;
  [tTop,tMain,tBy].forEach(el=>{ el.style.opacity=0; el.style.transform=''; el.classList.remove('top-in','main-in','by-in'); });
  if(title1) title1.classList.remove('sheen');
  startBtn.style.opacity=0; startBtn.classList.remove('start-in');

  adjustTitleWidth();
  tTop.classList.remove('top-in'); void tTop.offsetWidth; tTop.classList.add('top-in');

  // Stagger the lines more deliberately: top -> main -> by -> button
  // Increase delays so the sequence reads comfortably on mobile.
  const mainDelay = 520; // ms after top
  const byDelay = 1120;  // ms after top
  const btnDelay = 1520; // ms after top

  // Prevent any transition of transform during the entrance to avoid
  // a perceived 'growing' effect; restore after the animation.
  tMain.style.transition = 'none';

  setTimeout(()=>{
    tMain.classList.remove('main-in'); void tMain.offsetWidth; tMain.classList.add('main-in');
    tMain.addEventListener('animationend', function handler(e){
      if(e.animationName!== 'mainGlitch') return;
      tMain.removeEventListener('animationend', handler);
  // sheen follows the main animation — apply to the whole title block
  try{ if(title1){ title1.classList.add('sheen'); setTimeout(()=> title1.classList.remove('sheen'), 1100); } else { tMain.classList.add('sheen'); setTimeout(()=> tMain.classList.remove('sheen'), 1100); } }catch(e){}
      // restore any transition on the main title
      tMain.style.transition = '';
    });
  }, mainDelay);

  setTimeout(()=>{
    tBy.classList.remove('by-in'); void tBy.offsetWidth; tBy.classList.add('by-in');
  }, byDelay);

  setTimeout(()=>{
    startBtn.classList.remove('start-in'); void startBtn.offsetWidth; startBtn.classList.add('start-in');
  }, btnDelay);

  // also add a global sheen/sweep effect over the full slide while titles animate
  try{
    const s = document.querySelector('.slide[data-id="1"]');
    if(s){ s.classList.add('global-sheen'); setTimeout(()=> s.classList.remove('global-sheen'), 1400); }
  }catch(e){}

  // failsafe: ensure visible even if animations are interrupted
  setTimeout(()=>{
    [tTop,tMain,tBy,startBtn].forEach(el=>{
      if(el && parseFloat(getComputedStyle(el).opacity||'0') < 0.05){ el.style.opacity = 1; }
    });
  }, 1800);
  // animate slide-1 background reveal
  try{
    const s1 = document.querySelector('.slide[data-id="1"]');
    if(s1){ s1.classList.remove('bg-animate'); void s1.offsetWidth; s1.classList.add('bg-animate'); setTimeout(()=> s1.classList.remove('bg-animate'), 1200); }
  }catch(e){}
}

// --- Slide 2 typing ---
function escapeHTML(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function typeAll(el, text, msPerChar, render){
  return new Promise(res=>{
    let i=0; const speed = Math.max(12, Math.min(200, msPerChar||90));
    const tick=()=>{
      const slice = text.slice(0,i);
      const html = (render ? render(slice) : escapeHTML(slice)).replace(/\n/g,'<br>');
      el.innerHTML = html + '<span class="cursor">_</span>';
      if(i<text.length){ i++; setTimeout(tick, (text[i-1]===' ')? speed*1.0 : speed); }
      else { el.innerHTML = (render ? render(text) : escapeHTML(text)).replace(/\n/g,'<br>') + '<span class="cursor">_</span>'; res(); }
    };
    tick();
  });
}
function renderScanLive(raw){
  // Produce HTML with contextual highlights while preserving line breaks.
  const lines = String(raw).split('\n');
  const out = lines.map((ln)=>{
    const t = ln.trim();
    let escaped = escapeHTML(ln);
    // highlight leading directives like > RESULT or lines starting with >
    if(/^>/.test(t)){
      // color result lines cyan and character lines magenta for contrast
      if(/RESULT/i.test(t)) return `<span class="typing-glow typing-cyan">${escaped}</span>`;
      if(/YOUR CHARACTER IS/i.test(t)) return `<span class="typing-glow typing-mag">${escaped}</span>`;
      return `<span class="typing-glow">${escaped}</span>`;
    }
    // highlight indexed blocks [01] / [02] / [03] and trailing OK
    if(/^\[0?\d+\]/.test(t)){
      escaped = escaped.replace(/(\[0?\d+\])/,'<span class="typing-glow typing-ylw">$1</span>');
      escaped = escaped.replace(/(OK)$/,'<span class="typing-glow typing-cyan">$1</span>');
      escaped = escaped.replace(/_/g,'<span class="typing-glow">_</span>');
      return escaped;
    }
    // inline highlights for important tokens
    escaped = escaped.replace(/(RESULT:\s*SUCCESS)/g,'<span class="typing-glow typing-cyan">$1</span>');
    escaped = escaped.replace(/(YOUR CHARACTER IS)/g,'<span class="typing-glow typing-mag">$1</span>');
    escaped = escaped.replace(/(permissions\s*=)/g,'<span class="typing-glow">$1</span>');
    escaped = escaped.replace(/(emotional_state\s*=)/g,'<span class="typing-glow">$1</span>');
    escaped = escaped.replace(/_/g,'<span class="typing-glow">_</span>');
    // Emphasize bracketed counters like [01]
    escaped = escaped.replace(/(\[0?\d+\])/g,'<span class="typing-glow">$1</span>');
    return escaped;
  }).join('\n');
  return `<span class="typing-glow">${out}</span>`;
}

function fitScanToWidth(){
  // With wrapping enabled we don't need complex scaling logic.
  // Ensure the <pre> fills the available width and resets any transforms.
  const pre = document.getElementById('scanAll');
  if(!pre) return;
  const box = pre.parentElement;  // .scan
  pre.style.transform = '';
  pre.style.transformOrigin = '';
  pre.style.left = '';
  pre.style.margin = '';
  pre.style.width = '100%';
  // Small font adjustment on very narrow screens to keep content readable
  const boxWidth = box.clientWidth;
  if(boxWidth < 220){
    pre.style.fontSize = '10px';
  } else {
    pre.style.fontSize = '';
  }
}
addEventListener('resize', fitScanToWidth, {passive:true});


function enterSlide2(){
  const pre = document.getElementById('scanAll');
  const nextBtn = document.getElementById('scanNext');
  pre.textContent=''; nextBtn.style.display='none'; pre.classList.remove('mono-white'); pre.classList.remove('typing-glow');

  const agreed = (state.choice0 === 'agree');

  // Slide 2 copy per user's request
  const introAgree = [
    'This dossier will ask of you to trust the button process.',
    'We are together in this journey.',
    'Who am I?  Right now, just this voice in your head. ',
    'Who are you? Oh, let me check.  '
  ];
  // bring back a short intro even when disagreeing so the flow reads
  const introDis = [
    'This dossier will ask of you to trust the button process.',
    'We are together in this journey.'
  ];

  const sysCommon = [
    'INITIATING USER IDENTIFICATION...',
    '[01] ASSESSING PRIVATE INFORMATION .... OK',
    '      _ Scanning files and apps',
    '      _ Extracting passwords and search history  ',
    '[02] BALANCING IDEAS + CONTEXT .... OK',
    '      _ Cross-referencing keywords index',
    '      _ Choosing cognitive pairing',
    '[03] RENDERING SOCIETAL MODEL .... OK',
    '      _ Estimating compliance probability',
    '      _ Assigning narrative weight  '
  ];

  const tailAgree = [
    '> RESULT: SUCCESS  ',
    '> YOUR CHARACTER IS: "Reader of this dossier"',
    '> permissions = [observe, interpret]',
    '> emotional_state = [unstable]',
    '',
    'Congratulations! Try to stay in character at all times.'
  ];

  const tailDis = [
    '> RESULT: SUCCESS  ',
    '> YOUR CHARACTER IS: "Non-compliant reader of this dossier"',
    '> permissions = [question, discuss]',
    '> emotional_state = [unstable]',
    '',
    'Congratulations! Try to stay in character at all times.'
  ];

  const narrative = (agreed ? introAgree : introDis).concat(['']).concat(sysCommon).concat(['']).concat(agreed? tailAgree: tailDis);
  const fullText = narrative.join('\n');

  // much faster typing pace per user's request (22 ms/char)
  // Compute an estimated duration for typing and use it as a failsafe
  const msPerChar = 22;
  const estimatedMs = Math.max(3000, fullText.length * msPerChar);
  // Cap the failsafe so it doesn't wait forever; give a comfortable buffer
  // so the 'I promise' button doesn't appear before typing completes.
  // Use a scale factor rather than a small constant to accommodate longer texts.
  const failsafeMs = Math.min(60000, Math.floor(estimatedMs * 1.25));

  let failsafeTimer = setTimeout(()=>{
    if(getComputedStyle(nextBtn).display === 'none'){
      nextBtn.style.display = 'inline-block';
    }
  }, failsafeMs);

  // create and start two loader bars whose animation length matches
  // the estimated typing time; they'll act like loading/margin indicators
  const container = pre.parentElement;
  // remove any previous loaders to keep the DOM clean (idempotent)
  Array.from(container.querySelectorAll('.scan-loader')).forEach(n=>n.remove());
  const loaderLeft = document.createElement('div'); loaderLeft.className='scan-loader left';
  const loaderRight = document.createElement('div'); loaderRight.className='scan-loader right';
  container.appendChild(loaderLeft); container.appendChild(loaderRight);
  // set animation duration slightly longer than estimated typing
  const animMs = Math.max(1200, Math.min(60000, estimatedMs + 400));
  loaderLeft.style.animationDuration = animMs + 'ms';
  loaderRight.style.animationDuration = animMs + 'ms';
  // trigger animation class
  void loaderLeft.offsetWidth; loaderLeft.classList.add('play');
  void loaderRight.offsetWidth; loaderRight.classList.add('play');

  typeAll(pre, fullText, msPerChar, renderScanLive).then(()=>{
    // Clear the failsafe so button is not shown twice
    clearTimeout(failsafeTimer);

    // Fit wrapped text to container
    try { fitScanToWidth(); } catch(_) {}

    // Fade to white (keeps the blinking _)
    pre.classList.add('mono-white');

    // Show the button only after typing finished
    nextBtn.style.display = 'inline-block';
    // ensure starting opacity 0 for animation
    nextBtn.classList.remove('fade-in');
    // force reflow then add fade-in class
    void nextBtn.offsetWidth; nextBtn.classList.add('fade-in');
    // transition the loaders into a short 'hold' pulse then fade them out
    try{
      loaderLeft.classList.add('hold'); loaderRight.classList.add('hold');
      // after a brief hold, trigger a fade-out and remove when transition ends
      setTimeout(()=>{
        [loaderLeft, loaderRight].forEach(l=>{
          try{
            l.classList.add('fade-out');
            const onEnd = function(ev){
              // wait for opacity/height transition to finish
              if(ev.propertyName === 'opacity' || ev.propertyName === 'height'){
                l.removeEventListener('transitionend', onEnd);
                try{ l.remove(); }catch(_){ }
              }
            };
            l.addEventListener('transitionend', onEnd);
          }catch(_){ try{ l.remove(); }catch(e){} }
        });
      }, 260);
    }catch(_){ }
  });

}

/* swipeTo: transition between slides with a horizontal swipe effect */
function swipeTo(id){
  const current = document.querySelector('.slide.active');
  const next = document.querySelector(`.slide[data-id="${id}"]`);
  if(!next) return;
  if(current === next){ return; }
  // prepare next slide and play animation
  next.classList.add('swipe-in');
  next.classList.add('active');
  current.classList.add('swipe-out');
  // cleanup after animation completes on the current slide
  const onEnd = ()=>{
    current.classList.remove('active');
    current.classList.remove('swipe-out');
    next.classList.remove('swipe-in');
    current.removeEventListener('animationend', onEnd);
  };
  current.addEventListener('animationend', onEnd);
}

/* showSectionLoader: ephemeral overlay used between sections (returns a Promise) */
function showSectionLoader(ms, nextId){
  return new Promise(res=>{
    try{
      const existing = document.querySelector('.section-loader'); if(existing){ existing.remove(); }
      const wrap = document.createElement('div'); wrap.className='section-loader';
      const back = document.createElement('div'); back.className='loader-back';
  const box = document.createElement('div'); box.className='loader-box';
  // ring spinner + plain text (no boxed text)
  const ring = document.createElement('div'); ring.className='loader-ring';
  const txt = document.createElement('div'); txt.className='loader-text'; txt.textContent='gathering pertinent information about the experience for you';
  box.appendChild(ring); box.appendChild(txt);
  wrap.appendChild(back); wrap.appendChild(box);
      phone.appendChild(wrap);
      // After ms elapses, navigate to next slide (if provided) while overlay
      // remains visible, then fade the overlay and resolve.
      setTimeout(()=>{
        try{ if(typeof nextId !== 'undefined' && nextId !== null) goToSlide(nextId); }catch(e){}
        wrap.style.transition = 'opacity .28s ease'; wrap.style.opacity = '0';
        setTimeout(()=>{ try{ wrap.remove(); }catch(_){}; res(); }, 360);
      }, Math.max(220, ms));
    }catch(e){ res(); }
  });
}

// --- INTERACTIONS ---
function onChoice(val){
  try{ state.choice0 = val; localStorage.setItem('choice0', val); }catch(e){ console.warn('localStorage error', e); }
  const title = document.getElementById('title0');
  if(title){
    title.style.setProperty('--ack-color', (val==='agree')?'var(--cyan)':'var(--mag)');
    // Prevent title transform/scale animation during the 0->1 transition
    title.style.transition = 'none';
    title.style.transform = 'none';
    title.classList.remove('ack'); void title.offsetWidth; title.classList.add('ack');
  }
  const edge = (val==='agree') ? getComputedStyle(document.documentElement).getPropertyValue('--cyan') || '#4dfcff' : getComputedStyle(document.documentElement).getPropertyValue('--mag') || '#ff58f6';
  // Start showing slide 1 immediately so its entrance can overlap the wipe.
  // Call goToSlide first because goToSlide() runs clearTransientOverlays();
  // creating the wipe before goToSlide led to the new wipe being removed
  // immediately. Creating the slide first, then the wipe, ensures the
  // wipe remains visible above the freshly-rendered slide.
  try{ goToSlide(1); }catch(e){}
  // one-time hint: ask scanWipeTint to hold the wipe longer for this consent flow
  try{ window.__holdWipeForOnChoice = true; }catch(_){}
  scanWipeTint(edge.trim() || (val==='agree' ? '#4dfcff' : '#ff58f6'), ()=>{
    // restore any transition on the title after the wipe completes
    try{ const t = document.getElementById('title0'); if(t){ t.style.transition = ''; } }catch(e){}
  });
  showLog([`USER CONSENT: ${String(val).toUpperCase()}`, 'INITIALIZING']);
}
window.onChoice = onChoice;

document.addEventListener('click', (e)=>{
  const btn = e.target && e.target.closest && e.target.closest('button.btn');
  if(!btn) return;
  try{ const rect = slidesWrap.getBoundingClientRect(); addRipple(e.clientX-rect.left, e.clientY-rect.top); }catch(_){ }
  if(btn.classList.contains('agree')) return onChoice('agree');
  if(btn.classList.contains('disagree')) return onChoice('disagree');
  if(btn.classList.contains('start')){ return flickerTo(()=>{ goToSlide(2); }); }
  if(btn.id==='scanNext'){
    // Show a centered section loader (3s) between slide 2 and 3 and then
    // navigate directly to slide 3 while the overlay is still visible so
    // there's no flash-back to slide 2.
    showSectionLoader(3000, 3).then(()=>{});
    return;
  }
  if(btn.id==='wantLink'){
    // Open one of a small set of curated links in a new tab
    const links = [
      'https://www.youtube.com/watch?v=1bW_a52VaO4',
      'https://www.amazon.com/toilet-paper/s?k=toilet+paper',
      'https://www.google.com/travel/flights?q=flights%20to%20Aruba'
    ];
    const url = links[Math.floor(Math.random()*links.length)];
    try{ window.open(url, '_blank'); showLog([`OPEN: ${url}`]); }catch(e){ showLog(['Unable to open link']); }
    return;
  }
  if(btn.id==='continueDossier'){
    // Continue: use swipe transition to slide 4
    showLog(['CONTINUING DOSSIER']);
    try{ swipeTo(4); }catch(e){ try{ goToSlide(4); }catch(_){} }
    return;
  }
  // Slide 4 choices: Library / Cemetery / Museum
  if(btn.id==='siteLibrary' || btn.id==='siteCemetery' || btn.id==='siteMuseum'){
    const which = btn.id==='siteLibrary'? 'library' : (btn.id==='siteCemetery'? 'cemetery' : 'museum');
    try{ state.choice1 = which; localStorage.setItem('choice1', which); }catch(e){}
    populateSlide5(which);
    try{ swipeTo(5); }catch(e){ goToSlide(5); }
    return;
  }

  // Slide 5 interactions
  if(btn.id==='nearestBtn'){
    // open maps link according to current choice
    const dest = state.choice1 || 'library';
    const mapDest = (dest==='museum')? 'museum' : dest; // normalize
    const url = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(mapDest) + '&travelmode=walking';
    try{ window.open(url, '_blank'); showLog([`MAP: ${mapDest}`]); }catch(e){ showLog(['Unable to open map']); }
    return;
  }
  if(btn.id==='readBtn'){
    // populate slide 6 with content depending on choice
    const dest = state.choice1 || 'library';
    populateSlide6(dest);
    try{ swipeTo(6); }catch(e){ goToSlide(6); }
    return;
  }
  if(btn.id==='readContinue'){
    // generic continue from reader — return to slide 3 (concept) or slide 0
    showLog(['CONTINUING']);
    try{ swipeTo(3); }catch(e){ goToSlide(3); }
    return;
  }
  // Slide 6 interactions: yes -> next slide (DOM-order), no -> last slide (DOM-order)
  if(btn.id==='slide6Yes' || btn.id==='slide6No'){
    const ids = getOrderedSlideIds();
    const curIndex = getCurrentSlideIndex();
    if(btn.id==='slide6Yes'){
      const nextIndex = curIndex >= 0 && curIndex < ids.length-1 ? curIndex + 1 : null;
      if(nextIndex !== null){
        const nextId = ids[nextIndex];
        // If the next slide is the corrupted/interrupt slide (7), play the glitch
        // overlay first so the transition feels like 'something broke'.
        if(String(nextId) === '7'){
          try{ glitchTo(nextId); }catch(e){ try{ swipeTo(nextId); }catch(_){ goToSlide(nextId); } }
        } else {
          try{ swipeTo(nextId); }catch(e){ goToSlide(nextId); }
        }
      } else { /* no next slide: return to concept */ try{ swipeTo(3); }catch(e){ goToSlide(3); } }
    } else {
      // no -> go to last slide in DOM order
      const lastId = ids[ids.length-1]; if(lastId){ try{ swipeTo(lastId); }catch(e){ goToSlide(lastId); } }
    }
    return;
  }

  // Slide 7 buttons: record the user's rhetorical choice and navigate to slide 8.
  if(btn.id==='slide7Btn1' || btn.id==='slide7Btn2' || btn.id==='slide7Btn3'){
    const map = { slide7Btn1:'progress', slide7Btn2:'negotiate', slide7Btn3:'revolution' };
    const val = map[btn.id] || 'progress';
    try{ state.choice2 = val; localStorage.setItem('choice2', val); }catch(e){}
    showLog([`CHOICE7: ${String(val).toUpperCase()}`]);
    // All three choices navigate to slide 8. Slide 9 should later read state.choice2
    try{ swipeTo(8); }catch(e){ goToSlide(8); }
    return;
  }

  if(btn.id==='slide8Continue'){
    // proceed to slide 9 (if it exists) or to the next DOM-ordered slide
    // Before navigating, if a slide 9 exists populate it based on choices
    try{ populateSlide9(); }catch(e){}
    // Prefer an explicit slide 9 if it exists in the DOM (robust to DOM reordering)
    const explicitNine = document.querySelector('.slide[data-id="9"]') ? '9' : null;
    let targetId = explicitNine;
    if(!targetId){ const ids = getOrderedSlideIds(); const cur = getCurrentSlideIndex(); targetId = (cur >= 0 && cur < ids.length-1) ? ids[cur+1] : null; }
    if(targetId){ try{ swipeTo(targetId); }catch(e){ goToSlide(targetId); } }
    return;
  }
  // Slide 10 interactions
  if(btn.id === 'slide10Top'){
    try{ goToSlide(0); }catch(e){}
    return;
  }
  if(btn.id === 'slide10Nice'){
    const url = 'https://open.spotify.com/intl-es/album/4d8k5kiUfN9lrrRDiHikOI?si=SEw6ah2yQ0yIap2YN1IP7w&nd=1&dlsi=b0090bd1c5e644ac';
    try{ window.open(url, '_blank'); showLog(['OPEN: spotify']); }catch(e){ showLog(['Unable to open link']); }
    return;
  }
  if(!btn) return;
  if(btn.id === 'slide9Restart'){
    // clear choices and go back to slide 0
    try{ localStorage.removeItem('choice1'); localStorage.removeItem('choice2'); state.choice1 = null; state.choice2 = null; }catch(e){}
    try{ goToSlide(10); }catch(e){ }
  }
}, true);
/* ------------------ Slide 9 population ------------------ */
const ENDINGS = {
  library: {
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. The parking lots grew until they reached the old libraries. Books were evicted for asphalt. Cars now sleep between the remains of forgotten ideas.\n\nIf a car runs over someone, it’s the person who gets hit that ends up being sued. Because it’s a car’s world, baby, and I know that’s what you wanted.\n\nLet’s jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with libraries and schools. Reading became a premium service with limited parking hours.\n\nIf you miss a payment, your favorite shelf becomes a car space. Everything is a potential parking spot unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    revolution: `You took the first step from inside the library. You made barricades with encyclopedias and Molotovs out of ink bottles. The books burned beautifully.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in the reading room. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI’ve had a wonderful time. I truly hope to see you again.`
  },
  cemetery: {
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. They now sleep over the graves, warmed by the quiet hum of engines.\n\nThey eat and bathe where you used to mourn. When a car runs over someone, it’s the person who gets hit that ends up being sued.\n\nBecause it’s a car’s world, baby, and the dead are finally at peace under the traffic lights.\n\nLet’s jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with cemeteries. People now rent graves by the hour and park by the meter.\n\nIf you miss a payment, your resting place becomes a parking spot. Everything is a potential car space unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    revolution: `You gathered the first comrades among the tombs. You spoke to the bones and promised resurrection through rage.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in sacred ground. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI’ve had a wonderful time. I truly hope to see you again.`
  },
  museum: {
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. The parking lots grew until they reached the museums.\n\nThe statues are gone, replaced by charging stations. The paintings are repainted with the color of fuel. If a car runs over someone, it’s the person who gets hit that ends up being sued.\n\nBecause it’s a car’s world, baby, and I know that’s what you wanted.\n\nLet’s jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with museums. Each car became an exhibit, each driver a donor.\n\nIf you miss a payment, your collection becomes a parking spot. Everything is a potential car space unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI’ve had a wonderful time. I truly hope to see you again.`,
    revolution: `You chose the museum as your battlefield. You shouted among marble heads and bronze generals, calling for the end of ownership.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in cultural institutions. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI’ve had a wonderful time. I truly hope to see you again.`
  }
};

function populateSlide9(){
  const chat = document.getElementById('slide9Chat');
  if(!chat) return;
  chat.innerHTML = '';
  const place = (state.choice1 || localStorage.getItem('choice1') || 'library');
  const choice = (state.choice2 || localStorage.getItem('choice2') || 'progress');
  const p = String(place).toLowerCase();
  const c = String(choice).toLowerCase();
  let txt = '';
  try{ txt = (ENDINGS[p] && ENDINGS[p][c]) ? ENDINGS[p][c] : ENDINGS.library.progress; }catch(e){ txt = ENDINGS.library.progress; }
  const paragraphs = String(txt).split('\n\n').filter(x=>String(x||'').trim().length>0);

  // Insert typing indicator
  const typingLi = document.createElement('li'); typingLi.className = 'typing';
  const tAv = document.createElement('div'); tAv.className = 'avatar';
  const dotsWrap = document.createElement('div'); dotsWrap.className = 'dots';
  for(let d=0; d<3; d++){ const dot = document.createElement('span'); dot.className = 'dot'; dotsWrap.appendChild(dot); }
  typingLi.appendChild(tAv); typingLi.appendChild(dotsWrap);
  chat.appendChild(typingLi);

  const typingMs = 560;

  // helper to wait
  const wait = (ms)=> new Promise(res=>setTimeout(res, ms));

  // Start the sequential reveal: each paragraph appears at the bottom,
  // previous ones naturally move up. After all are shown, reveal the button.
  (async function runSequence(){
    try{
      // small pause showing 'typing...'
      await wait(typingMs);
      try{ typingLi.remove(); }catch(_){}

      const frame = document.getElementById('slide9Media') || document.querySelector('.slide[data-id="9"] .chat-frame');

      for(let i=0;i<paragraphs.length;i++){
        const para = paragraphs[i];
        const li = document.createElement('li'); li.className = 'msg king';
        const av = document.createElement('div'); av.className = 'avatar'; av.setAttribute('aria-hidden','true');
        const bub = document.createElement('div'); bub.className = 'bubble';
        bub.innerHTML = para.replace(/\n/g,'<br>');
        li.appendChild(av); li.appendChild(bub);
        chat.appendChild(li);

        // reveal with pop-in
        void bub.offsetWidth; bub.classList.add('visible');

        // allow a tiny settle/reflow so layout measurements are accurate and
        // so the pop-in animation has a moment to run before we nudge layout
        await wait(90);

        // adjust the chat list position so all current messages remain visible
        // inside the frame (we avoid native scrolling). Reserve space for the
        // action button so it won't overlap the messages when revealed.
        try{
          const totalH = chat.scrollHeight;
          const frameH = frame ? frame.clientHeight : (window.innerHeight * 0.5);
          const btn = document.querySelector('.slide[data-id="9"] .btn-row');
          // compute reserved button space. If the button is positioned
          // absolutely (out-of-flow) we don't need to reserve vertical space
          // because it won't push the chat content. Otherwise reserve a bit
          // of extra gap to avoid overlap.
          let btnH = 80;
          try{
            if(btn){ const cs = getComputedStyle(btn); if(cs.position === 'absolute'){ btnH = 0; } else { btnH = btn.offsetHeight + 28; } }
          }catch(e){ btnH = btn ? (btn.offsetHeight + 28) : 80; }
          const desired = Math.max(0, frameH - totalH - btnH - 8);
          chat.style.marginTop = desired + 'px';
        }catch(e){ /* ignore measurement errors */ }

        // wait 2000ms before showing the next bubble so the user can read
        await wait(2000);
      }

  // Sequence complete — give layout a short moment to settle (fonts and
  // transitions) before making the final measurement and revealing buttons.
  await wait(80);

  // Sequence complete — before revealing buttons, ensure all messages
  // are readable on screen. If the total chat content fits within the
  // frame, add top margin so the messages sit fully inside the frame
  // (no scrolling). Otherwise, keep the natural scroll at bottom.
      const slideEl = document.querySelector('.slide[data-id="9"]');
      try{
        const f = document.getElementById('slide9Media') || document.querySelector('.slide[data-id="9"] .chat-frame');
        if(f){
          const totalH = chat.scrollHeight;
          const frameH = f.clientHeight;
          if(totalH <= frameH){
            // messages fit — push the list down so all items are visible.
            // Keep a small reserved gap (36px) between the last message and
            // the absolute-positioned button so they visually connect without
            // overlapping. This reduces the large empty area above the button.
            const reservedGap = 36;
            chat.style.marginTop = Math.max(0, frameH - totalH - reservedGap) + 'px';
            // ensure no scroll offset
            f.scrollTop = 0;
          } else {
            // messages overflow — clear any manual margin and scroll to bottom
            chat.style.marginTop = '';
            f.scrollTop = f.scrollHeight;
          }
        }
      }catch(e){ /* ignore measurement errors */ }

      // reveal action buttons by toggling class (CSS will show them).
      // Also add a small deferred 'show' class so the button can fade in
      // after layout has settled.
      if(slideEl){
        slideEl.classList.add('messages-done');
        const btn = document.querySelector('.slide[data-id="9"] .btn-row');
        if(btn){
          setTimeout(()=>{
            try{ btn.classList.add('show'); }catch(_){ }
            // Safety nudge: after the button begins to show, measure overlap
            // between the last visible bubble and the button. If the button
            // would overlap the last message, nudge the chat list up by the
            // overlap amount so the message remains visible. This guards
            // against late font loads or device-specific rendering differences.
            setTimeout(()=>{
              try{
                const lastBubble = chat.querySelector('.bubble.visible:last-of-type') || chat.querySelector('.msg:last-child .bubble');
                if(!lastBubble || !btn) return;
                const lastRect = lastBubble.getBoundingClientRect();
                const btnRect = btn.getBoundingClientRect();
                const frameEl = frame || document.querySelector('.slide[data-id="9"] .chat-frame');
                const frameRect = frameEl ? frameEl.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
                const desiredGap = 8; // px
                // If the bottom of the last message is below the top of the button (minus gap)
                if(lastRect.bottom > (btnRect.top - desiredGap)){
                  const overlap = lastRect.bottom - (btnRect.top - desiredGap);
                  const computed = parseFloat(getComputedStyle(chat).marginTop) || 0;
                  const newMargin = computed - overlap;
                  chat.style.marginTop = newMargin + 'px';
                }
              }catch(e){ /* ignore measurement errors */ }
            }, 80);
          }, 120);
        }
      }
    }catch(e){ console.warn('populateSlide9 sequence error', e); }
  })();
}
 

// 9:16 fit + button row width sync
function fit(){ const vw=innerWidth,vh=innerHeight; const w=Math.min(vw,vh*9/16); const h=Math.min(vh,vw*16/9); phone.style.width=w+'px'; phone.style.height=h+'px'; fitButtonsToTitle(); }
addEventListener('resize', fit, {passive:true}); fit();
// ensure title widths are computed on load for slide 1 alignment
try{ adjustTitleWidth(); }catch(e){}
// Ensure at least one slide is active on load (restore to slide 0 if none)
if(!document.querySelector('.slide.active')){
  try{ goToSlide(0); }catch(e){}
}

// self-test (smoke checks)
(function selfTests(){
  const results=[]; const assert=(ok,msg)=>results.push({ok,msg});
  assert(!!document.querySelector('.slide[data-id="0"] .btn.agree'),'Agree exists');
  assert(!!document.querySelector('.slide[data-id="0"] .btn.disagree'),'Disagree exists');
  assert(!!document.querySelector('.slide[data-id="1"] .t-main'),'Slide 1 title exists');
  assert(!!document.getElementById('scanAll'),'Slide 2 pre exists');
  console.log('[SELF-TEST]',results);
  console.log('[SELF-TEST]',results);
})();

// debug block removed

