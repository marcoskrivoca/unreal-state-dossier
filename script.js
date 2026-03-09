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
  const clinical=[()=>`PULSE:${int(58,108)}bpm`,()=>`O2SAT:${int(94,100)}%`,()=>`TEMP:${float(35.8,37.8)}Â°C`,()=>`EEG.ALPHA:${int(18,86)}%`,()=>`NEURAL.NOISE:${float(0.8,3.6,2)}dB`];
  const corporate=[()=>`CHANNEL:KCEO.NET`,()=>`NODE:ECHO-${int(1,32)}`,()=>`SYNC:${pick(['OK','PENDING','DELAYED'])}`,()=>`INTEGRITY:${float(82.0,99.9)}%`,()=>`SUBJECT:${hex(2)}-${hex(2)}${int(10,99)}`];
  const japanese=[()=>`çŠ¶æ…‹: ${pick(['å®‰å®š','å¤‰å‹•','ä¿ç•™','è§£æžä¸­'])}`,()=>`åŒæ„: ${pick(['æœªè¨­å®š','ä¿ç•™','ç¢ºèªæ¸ˆ'])}`,()=>`ä¿¡å·: ${pick(['å®‰å®š','å¼±ã„','æŽ¢ç´¢ä¸­'])}`,()=>`å¹¸ç¦æŒ‡æ•°:${int(40,99)}%`];
  function seg(){const buckets=[clinical,corporate,clinical]; if(Math.random()<0.2)buckets.push(japanese); const f=pick(pick(buckets)); return f();}
  function build(){
    const items=Array.from({length:int(14,18)},()=>seg());
    const dup=items.concat(items);
    track.innerHTML = dup.map(t=>`<span class="seg">${t}</span><span class="sep">â€¢</span>`).join('');
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
function showLog(lines){ const log=document.getElementById('syslog'); if(log){ log.innerHTML = lines.map(l=>`[SYS.LOG] ${l}`).join('<br/>'); log.classList.add('show'); clearTimeout(showLog.t); showLog.t=setTimeout(()=>log.classList.remove('show'),1800); } }

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

// Stop all slide-specific sounds when changing slides
function stopAllSlideSpecificSounds(){
  try{
    // Stop slide-specific sounds (not background music)
    if(slide01Sound) { slide01Sound.pause(); slide01Sound.currentTime = 0; }
    if(slide02IntroSound) { slide02IntroSound.pause(); slide02IntroSound.currentTime = 0; }
    if(slide02TypingSound) { slide02TypingSound.pause(); slide02TypingSound.currentTime = 0; }
    if(slide03LoadingSound) { slide03LoadingSound.pause(); slide03LoadingSound.currentTime = 0; }
    if(slide05Sound) { slide05Sound.pause(); slide05Sound.currentTime = 0; }
    // Note: slide07VoiceSound should continue playing even when leaving slide 7
    // if(slide07VoiceSound) { slide07VoiceSound.pause(); slide07VoiceSound.currentTime = 0; }
    if(glitchSound) { glitchSound.pause(); glitchSound.currentTime = 0; }
    // Note: We don't stop buttonSound, messageNotificationSound, introSound, or slide07VoiceSound as they are either very short
    // or should continue playing across slide transitions
  }catch(e){ console.warn('Error stopping slide sounds:', e); }
}

function goToSlide(id){
  // Stop any playing slide-specific sounds before changing slides
  // Exception: don't stop slide05Sound if we're transitioning TO slide 5
  try{ 
    if(id !== '5' && id !== 5) {
      stopAllSlideSpecificSounds(); 
    } else {
      // Going to slide 5, stop everything except slide05Sound and slide07VoiceSound
      if(slide01Sound) { slide01Sound.pause(); slide01Sound.currentTime = 0; }
      if(slide02IntroSound) { slide02IntroSound.pause(); slide02IntroSound.currentTime = 0; }
      if(slide02TypingSound) { slide02TypingSound.pause(); slide02TypingSound.currentTime = 0; }
      if(slide03LoadingSound) { slide03LoadingSound.pause(); slide03LoadingSound.currentTime = 0; }
      if(glitchSound) { glitchSound.pause(); glitchSound.currentTime = 0; }
    }
  }catch(e){}
  // remove any stuck overlays before changing slides so content is visible
  try{ clearTransientOverlays(); }catch(e){}
  document.querySelectorAll('.slide').forEach(s=> s.classList.remove('active'));
  const next = document.querySelector(`.slide[data-id="${id}"]`);
  if(next) next.classList.add('active');
  const diag = document.getElementById('diag'); // header only on slide 0
  if(diag) diag.style.display = (id===0 ? 'block' : 'none');
  // phone-level CRT toggle removed â€” keep phone class/state unchanged
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
      // style overrides here â€” the CSS fix for slide 3 should be authoritative.
      try{ clearTransientOverlays(); }catch(e){}
      try{ if(phone) phone.classList.remove('glitching'); }catch(e){}
      // Small delayed re-check as a race protection (keeps behavior robust).
      setTimeout(()=>{ try{ clearTransientOverlays(); if(phone) phone.classList.remove('glitching'); }catch(_){} }, 60);
    }
  }catch(e){}
}

/* scanline wipe (0â†’1) */
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
/* black flicker (1â†’2) */
function flickerTo(next){
  // Stop any playing slide-specific sounds before transition
  try{ stopAllSlideSpecificSounds(); }catch(e){}
  // Play glitch sound for flicker effect
  try{ playGlitchSound(); }catch(e){}
  
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
  console.log('[GLITCH] glitchTo called with nextId:', nextId);
  return new Promise(res=>{
    try{
      // Stop any playing slide-specific sounds before transition
      try{ stopAllSlideSpecificSounds(); }catch(e){}
      // Play glitch sound
      console.log('[GLITCH] Playing glitch sound');
      try{ playGlitchSound(); }catch(e){ console.error('[GLITCH] Sound error:', e); }
      
      console.log('[GLITCH] Creating glitch overlay');
      const o = document.createElement('div'); o.className='glitch-overlay';
      // include layered text that says 'interruption' â€” animated via CSS
      o.innerHTML = '<div class="back"></div><div class="g1"></div><div class="g2"></div><div class="noise"></div>' +
                    '<div class="glitch-text">' +
                      '<span class="layer c0">interruption</span>' +
                      '<span class="layer c1">interruption</span>' +
                      '<span class="layer c2">interruption</span>' +
                    '</div>';
  
  // Append to body instead of phone to ensure visibility
  document.body.appendChild(o);
  console.log('[GLITCH] Overlay appended to body. Element:', o);
  
  // Position it to cover entire viewport with VERY aggressive styles
  o.style.cssText = `
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    opacity: 1 !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    background-color: rgba(0, 0, 0, 0.95) !important;
    display: block !important;
    visibility: visible !important;
  `;
  
  // make this overlay heavy: add flash + invert classes to get white/black flashes + invert
  o.classList.add('flash'); o.classList.add('invert');
  
  console.log('[GLITCH] Overlay styled with maximum z-index (2147483647)');
  console.log('[GLITCH] Computed styles:', {
    position: window.getComputedStyle(o).position,
    zIndex: window.getComputedStyle(o).zIndex,
    opacity: window.getComputedStyle(o).opacity,
    display: window.getComputedStyle(o).display,
    backgroundColor: window.getComputedStyle(o).backgroundColor
  });
  
  // mark phone as glitching
  try{ phone.classList.add('glitching'); phone.style.backgroundColor = '#000'; }catch(e){}
  
  // play
  void o.offsetWidth; o.classList.add('run');
  console.log('[GLITCH] Animation started. Overlay MUST be visible now!');
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
  const lang = state.lang || 'en';
  const text = LANG[lang].slide7.typedText;
  const msPerChar = 26;

  // ensure buttons are hidden before typing
  Array.from(document.querySelectorAll('#slide7 .fade-item')).forEach(b=>{ b.classList.remove('show'); b.classList.remove('visible'); });
  // hide media placeholder until typing completes
  const media = document.getElementById('slide7Media'); if(media){ media.classList.remove('visible'); }

  // small delay so the slide becomes active visually
  setTimeout(()=>{
    // Play voice sound when typing starts
    try{ playSlide07VoiceSound(); }catch(e){}
    
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
  
  // Play location-specific sound
  try{ playSlide05Sound(which); }catch(e){}
  
  if(which==='library'){
    const lang = state.lang || 'en';
    const t = LANG[lang].slide5.library;
    nearest.textContent = t.nearest;
    nearest.dataset.label = t.nearest;
    body.innerHTML = '<p>' + t.para1 + '</p><p>' + t.para2 + '</p><p>' + t.para3 + '</p>';
    read.textContent = t.readBtn;
    nearest.dataset.dest = 'library';
  } else if(which==='cemetery'){
    const lang = state.lang || 'en';
    const t = LANG[lang].slide5.cemetery;
    nearest.textContent = t.nearest; 
    nearest.dataset.label = t.nearest;
    body.innerHTML = '<p>' + t.para1 + '</p><p>' + t.para2 + '</p><p>' + t.para3 + '</p>';
    read.textContent = t.readBtn;
    nearest.dataset.dest = 'cemetery';
  } else {
    const lang = state.lang || 'en';
    const t = LANG[lang].slide5.museum;
    nearest.textContent = t.nearest; 
    nearest.dataset.label = t.nearest;
    body.innerHTML = '<p>' + t.para1 + '</p><p>' + t.para2 + '</p><p>' + t.para3 + '</p>';
    read.textContent = t.readBtn;
    nearest.dataset.dest = 'museum';
  }
}

/* Populate Slide 6 (reader view) */
function populateSlide6(which){
  // Populate the conceptual framework content for slide 6
  const container = document.getElementById('slide6Body'); if(!container) return;
  const lang = state.lang || 'en';
  const t = LANG[lang].slide6;
  container.innerHTML = `
    <p>${t.para1}</p>
    <p>${t.para2}</p>
    <p>${t.para3}</p>
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
      // Prevent the title from being scaled too small â€” keep it readable.
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
  // sheen follows the main animation â€” apply to the whole title block
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
  
  // Get translations
  const lang = state.lang || 'en';
  const t = LANG[lang].slide2;
  
  // Use translated intro text
  const introText = agreed ? t.text_agree : t.text_disagree;
  const intro = introText.split('\n');

  const sysCommon = t.sysCommon;
  const tailAgree = t.tailAgree;
  const tailDis = t.tailDisagree;

  const narrative = intro.concat(['']).concat(sysCommon).concat(['']).concat(agreed? tailAgree: tailDis);
  const fullText = narrative.join('\n');

  // much faster typing pace per user's request (12 ms/char)
  // Compute an estimated duration for typing and use it as a failsafe
  const msPerChar = 12;
  const estimatedMs = Math.max(3000, fullText.length * msPerChar);
  // Cap the failsafe so it doesn't wait forever; give a comfortable buffer
  // so the button doesn't appear before typing completes.
  // Use a scale factor rather than a small constant to accommodate longer texts.
  const failsafeMs = Math.min(60000, Math.floor(estimatedMs * 1.25));

  let failsafeTimer = setTimeout(()=>{
    if(getComputedStyle(nextBtn).display === 'none'){
      nextBtn.style.display = 'inline-block';
      nextBtn.textContent = t.button;
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
    // Stop typing sound when animation completes
    try{ stopSlide02TypingSound(); }catch(e){}
    
    // Clear the failsafe so button is not shown twice
    clearTimeout(failsafeTimer);

    // Fit wrapped text to container
    try { fitScanToWidth(); } catch(_) {}

    // Fade to white (keeps the blinking _)
    pre.classList.add('mono-white');

    // Show the button only after typing finished with translated text
    nextBtn.textContent = t.button;
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
  // Stop any playing slide-specific sounds before changing slides
  // Exception: don't stop slide05Sound if we're transitioning TO slide 5
  try{ 
    if(id !== '5' && id !== 5) {
      stopAllSlideSpecificSounds(); 
    } else {
      // Going to slide 5, stop everything except slide05Sound and slide07VoiceSound
      if(slide01Sound) { slide01Sound.pause(); slide01Sound.currentTime = 0; }
      if(slide02IntroSound) { slide02IntroSound.pause(); slide02IntroSound.currentTime = 0; }
      if(slide02TypingSound) { slide02TypingSound.pause(); slide02TypingSound.currentTime = 0; }
      if(slide03LoadingSound) { slide03LoadingSound.pause(); slide03LoadingSound.currentTime = 0; }
      if(glitchSound) { glitchSound.pause(); glitchSound.currentTime = 0; }
    }
  }catch(e){}
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
  // ring spinner + translated text
  const lang = state.lang || 'en';
  const loaderText = LANG[lang].sectionLoader.gathering;
  const ring = document.createElement('div'); ring.className='loader-ring';
  const txt = document.createElement('div'); txt.className='loader-text'; txt.textContent=loaderText;
  box.appendChild(ring); box.appendChild(txt);
  wrap.appendChild(back); wrap.appendChild(box);
      phone.appendChild(wrap);
      // After ms elapses, navigate to next slide (if provided) while overlay
      // remains visible, then fade the overlay and resolve.
      setTimeout(()=>{
        try{ if(typeof nextId !== 'undefined' && nextId !== null) goToSlide(nextId); }catch(e){}
        // Stop the loading sound when slide appears
        try{ stopSlide03LoadingSound(); }catch(e){}
        // Give slide 3 a moment to render fully before fading the overlay
        setTimeout(()=>{
          wrap.style.transition = 'opacity .28s ease'; wrap.style.opacity = '0';
          setTimeout(()=>{ try{ wrap.remove(); }catch(_){}; res(); }, 360);
        }, 100);
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
  // Play transition sound
  try{ playSlide01Sound(); }catch(e){}
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
  
  // Play button sound for every button click
  try{ playButtonSound(); }catch(err){}
  
  try{ const rect = slidesWrap.getBoundingClientRect(); addRipple(e.clientX-rect.left, e.clientY-rect.top); }catch(_){ }
  if(btn.classList.contains('agree')) return onChoice('agree');
  if(btn.classList.contains('disagree')) return onChoice('disagree');
  if(btn.classList.contains('start')){ 
    return flickerTo(()=>{ 
      goToSlide(2);
      // Start slide 2 sounds AFTER arriving at slide 2
      try{ playSlide02Sounds(); }catch(e){}
    }); 
  }
  if(btn.id==='scanNext'){
    // Play loading sound for slide 2->3 transition
    console.log('[AUDIO] Playing slide 3 loading sound');
    try{ playSlide03LoadingSound(); }catch(e){ console.error('[AUDIO] Error playing slide 3 sound:', e); }
    // Show a centered section loader (3s) between slide 2 and 3 and then
    // navigate directly to slide 3 while the overlay is still visible so
    // there's no flash-back to slide 2.
    showSectionLoader(3000, 3).then(()=>{});
    return;
  }
  if(btn.id==='wantLink'){
    // Use translated URL from LANG object
    const lang = state.lang || 'en';
    const url = LANG[lang].slide3.wantUrl;
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
    // generic continue from reader â€” return to slide 3 (concept) or slide 0
    showLog(['CONTINUING']);
    try{ swipeTo(3); }catch(e){ goToSlide(3); }
    return;
  }
  // Slide 6 interactions: yes -> next slide (DOM-order), no -> last slide (DOM-order)
  if(btn.id==='slide6Yes' || btn.id==='slide6No'){
    const ids = getOrderedSlideIds();
    const curIndex = getCurrentSlideIndex();
    console.log('[SLIDE6] Current index:', curIndex, 'IDs:', ids);
    if(btn.id==='slide6Yes'){
      const nextIndex = curIndex >= 0 && curIndex < ids.length-1 ? curIndex + 1 : null;
      if(nextIndex !== null){
        const nextId = ids[nextIndex];
        console.log('[SLIDE6] Next slide ID:', nextId, 'Type:', typeof nextId);
        // If the next slide is the corrupted/interrupt slide (7), play the glitch
        // overlay first so the transition feels like 'something broke'.
        if(String(nextId) === '7'){
          console.log('[SLIDE6] Triggering glitchTo for slide 7!');
          try{ glitchTo(nextId); }catch(e){ console.error('[SLIDE6] glitchTo error:', e); try{ swipeTo(nextId); }catch(_){ goToSlide(nextId); } }
        } else {
          console.log('[SLIDE6] Normal swipe to slide:', nextId);
          try{ swipeTo(nextId); }catch(e){ goToSlide(nextId); }
        }
      } else { /* no next slide: return to concept */ try{ swipeTo(3); }catch(e){ goToSlide(3); } }
    } else {
      // no -> go to slide 10 (contact slide)
      try{ swipeTo(10); }catch(e){ goToSlide(10); }
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
  if(btn.id === 'slide10Workshop'){
    const lang = state.lang || 'en';
    const url = LANG[lang].slide10.workshopUrl;
    try{ window.open(url, '_blank'); showLog(['OPEN: workshop proposal']); }catch(e){ showLog(['Unable to open link']); }
    return;
  }
  if(btn.id === 'slide10Mockups'){
    const lang = state.lang || 'en';
    const url = LANG[lang].slide10.mockupsUrl;
    try{ window.open(url, '_blank'); showLog(['OPEN: app mockups']); }catch(e){ showLog(['Unable to open link']); }
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
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. The parking lots grew until they reached the old libraries. Books were evicted for asphalt. Cars now sleep between the remains of forgotten ideas.\n\nIf a car runs over someone, it's the person who gets hit that ends up being sued. Because it's a car's world, baby, and I know that's what you wanted.\n\nLet's jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI've had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with libraries and schools. Reading became a premium service with limited parking hours.\n\nIf you miss a payment, your favorite shelf becomes a car space. Everything is a potential parking spot unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI've had a wonderful time. I truly hope to see you again.`,
    revolution: `You took the first step from inside the library. You made barricades with encyclopedias and Molotovs out of ink bottles. The books burned beautifully.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in the reading room. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI've had a wonderful time. I truly hope to see you again.`
  },
  cemetery: {
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. They now sleep over the graves, warmed by the quiet hum of engines.\n\nThey eat and bathe where you used to mourn. When a car runs over someone, it's the person who gets hit that ends up being sued.\n\nBecause it's a car's world, baby, and the dead are finally at peace under the traffic lights.\n\nLet's jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI've had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with cemeteries. People now rent graves by the hour and park by the meter.\n\nIf you miss a payment, your resting place becomes a parking spot. Everything is a potential car space unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI've had a wonderful time. I truly hope to see you again.`,
    revolution: `You gathered the first comrades among the tombs. You spoke to the bones and promised resurrection through rage.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in sacred ground. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI've had a wonderful time. I truly hope to see you again.`
  },
  museum: {
    progress: `It seems that the general care for the well-being of cars has had a contagious effect. The parking lots grew until they reached the museums.\n\nThe statues are gone, replaced by charging stations. The paintings are repainted with the color of fuel. If a car runs over someone, it's the person who gets hit that ends up being sued.\n\nBecause it's a car's world, baby, and I know that's what you wanted.\n\nLet's jump together onto the gracious double-motor roar of the rainbow of progress, and laugh and cry with everyone beneath us.\n\nI've had a wonderful time. I truly hope to see you again.`,
    negotiate: `Surprisingly, your idea was well received. Parking lot owners began merging with museums. Each car became an exhibit, each driver a donor.\n\nIf you miss a payment, your collection becomes a parking spot. Everything is a potential car space unless you pay to make it human again.\n\nTurns out, human beings love paying for what used to be free. To negotiate is to let someone else set the price.\n\nI've had a wonderful time. I truly hope to see you again.`,
    revolution: `You chose the museum as your battlefield. You shouted among marble heads and bronze generals, calling for the end of ownership.\n\nWe have issued an arrest order for your location and dispatched officers to enforce it. It is a pity it ends this way, but I will not tolerate armed fights in cultural institutions. Please do not cry or feel ashamed.\n\nI can promise we will make a martyr of you. A controlled symbol of revolt people can look up to that also serves as a cautionary tale.\n\nI've had a wonderful time. I truly hope to see you again.`
  }
};

const ENDINGS_ES = {
  library: {
    progress: `Parece que la preocupación general por el bienestar de los autos ha tenido un efecto contagioso. Los estacionamientos crecieron hasta alcanzar las viejas bibliotecas. Los libros fueron desalojados para dar lugar al asfalto. Los autos ahora duermen entre los restos de las ideas olvidadas.\n\nSi un auto atropella a alguien, es la persona atropellada quien termina siendo demandada. Porque este es el mundo de los autos, bebé, y sé que eso es lo que querías.\n\nSaltemos juntos sobre el gracioso rugido de doble motor del arcoíris del progreso, y riamos y lloremos con todos los que quedaron debajo.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    negotiate: `Sorprendentemente, tu idea fue bien recibida. Los dueños de estacionamientos comenzaron a fusionarse con bibliotecas y escuelas. Leer se volvió un servicio premium con horarios limitados de estacionamiento.\n\nSi te atrasas con el pago, tu estante favorito se convierte en un espacio para autos. Todo es un posible estacionamiento, a menos que pagues para volverlo humano.\n\nResulta que a los seres humanos les encanta pagar por lo que antes era gratis. Negociar es dejar que otro fije el precio.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    revolution: `Diste el primer paso desde adentro de la biblioteca. Hiciste barricadas con enciclopedias y cócteles molotov con frascos de tinta. Los libros ardieron con una belleza trágica.\n\nHemos emitido una orden de arresto en tu contra y enviado oficiales para hacerla cumplir. Es una pena que termine así, pero no toleraré enfrentamientos armados en la sala de lectura. Por favor, no llores ni te avergüences.\n\nPuedo prometerte que haremos de ti un mártir. Un símbolo controlado de la revuelta al que la gente pueda admirar y, al mismo tiempo, temer.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`
  },
  cemetery: {
    progress: `Parece que la preocupación general por el bienestar de los autos ha tenido un efecto contagioso. Ahora duermen sobre las tumbas, calentados por el suave zumbido de los motores.\n\nComen y se bañan donde antes se lloraba. Cuando un auto atropella a alguien, es la persona atropellada quien termina siendo demandada.\n\nPorque este es el mundo de los autos, bebé, y los muertos finalmente descansan en paz bajo los semáforos.\n\nSaltemos juntos sobre el gracioso rugido de doble motor del arcoíris del progreso, y riamos y lloremos con todos los que quedaron debajo.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    negotiate: `Sorprendentemente, tu idea fue bien recibida. Los dueños de estacionamientos comenzaron a fusionarse con cementerios. Ahora la gente alquila tumbas por hora y estaciona por minuto.\n\nSi te atrasas con el pago, tu lugar de descanso se convierte en un espacio para autos. Todo es un posible estacionamiento, a menos que pagues para volverlo humano.\n\nResulta que a los seres humanos les encanta pagar por lo que antes era gratis. Negociar es dejar que otro fije el precio.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    revolution: `Reuniste a los primeros camaradas entre las tumbas. Hablaste con los huesos y les prometiste resurrección a través de la rabia.\n\nHemos emitido una orden de arresto en tu contra y enviado oficiales para hacerla cumplir. Es una pena que termine así, pero no toleraré enfrentamientos armados en mi territorio. Por favor, no llores ni te avergüences.\n\nPuedo prometerte que haremos de ti un mártir. Un símbolo controlado de la revuelta al que la gente pueda admirar y, al mismo tiempo, temer.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`
  },
  museum: {
    progress: `Parece que la preocupación general por el bienestar de los autos ha tenido un efecto contagioso. Los estacionamientos crecieron hasta alcanzar los museos.\n\nLas estatuas desaparecieron, reemplazadas por estaciones de carga. Las pinturas fueron repintadas con el color del combustible. Si un auto atropella a alguien, es la persona atropellada quien termina siendo demandada.\n\nPorque este es el mundo de los autos, bebé, y sé que eso es lo que querías.\n\nSaltemos juntos sobre el gracioso rugido de doble motor del arcoíris del progreso, y riamos y lloremos con todos los que quedaron debajo.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    negotiate: `Sorprendentemente, tu idea fue bien recibida. Los dueños de estacionamientos comenzaron a fusionarse con museos. Cada auto se convirtió en una obra, cada conductor en un mecenas.\n\nSi te atrasas con el pago, tu colección se convierte en un estacionamiento. Todo es un posible espacio para autos, a menos que pagues para volverlo humano.\n\nResulta que a los seres humanos les encanta pagar por lo que antes era gratis. Negociar es dejar que otro fije el precio.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`,
    revolution: `Elegiste el museo como tu campo de batalla. Gritaste entre cabezas de mármol y generales de bronce, reclamando el fin de la propiedad.\n\nHemos emitido una orden de arresto en tu contra y enviado oficiales para hacerla cumplir. Es una pena que termine así, pero no toleraré enfrentamientos armados en instituciones culturales. Por favor, no llores ni te avergüences.\n\nPuedo prometerte que haremos de ti un mártir. Un símbolo controlado de la revuelta al que la gente pueda admirar y, al mismo tiempo, temer.\n\nHe pasado un tiempo maravilloso. Realmente espero volver a verte.`
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
  const lang = state.lang || 'en';
  const endingsSource = lang === 'es' ? ENDINGS_ES : ENDINGS;
  let txt = '';
  try{ txt = (endingsSource[p] && endingsSource[p][c]) ? endingsSource[p][c] : endingsSource.library.progress; }catch(e){ txt = endingsSource.library.progress; }
  const paragraphs = String(txt).split('\n\n').filter(x=>String(x||'').trim().length>0);

  // helper to wait
  const wait = (ms)=> new Promise(res=>setTimeout(res, ms));

  // Start the sequential reveal: each paragraph appears at the bottom,
  // previous ones naturally move up. After all are shown, reveal the button.
  (async function runSequence(){
    try{
      const frame = document.getElementById('slide9Media') || document.querySelector('.slide[data-id="9"] .chat-frame');

      for(let i=0;i<paragraphs.length;i++){
        const para = paragraphs[i];
        
        // Show typing indicator before each message
        const typingIndicator = document.createElement('li'); 
        typingIndicator.className = 'typing-indicator';
        const typingText = document.createElement('div');
        typingText.className = 'typing-text';
        typingText.textContent = lang === 'es' ? 'App escribiendo...' : 'App typing...';
        const typingDots = document.createElement('div'); 
        typingDots.className = 'dots';
        for(let d=0; d<3; d++){ 
          const dot = document.createElement('span'); 
          dot.className = 'dot'; 
          typingDots.appendChild(dot); 
        }
        typingIndicator.appendChild(typingText);
        typingIndicator.appendChild(typingDots);
        chat.appendChild(typingIndicator);
        
        // Scroll to show the typing indicator
        try{
          if(frame) frame.scrollTop = frame.scrollHeight;
        }catch(_){}
        
        // Wait while "typing"
        await wait(1500);
        
        // Remove typing indicator
        try{ typingIndicator.remove(); }catch(_){}
        
        // Add the actual message
        const li = document.createElement('li'); li.className = 'msg king';
        const av = document.createElement('div'); av.className = 'avatar'; av.setAttribute('aria-hidden','true');
        const bub = document.createElement('div'); bub.className = 'bubble';
        bub.innerHTML = para.replace(/\n/g,'<br>');
        li.appendChild(av); li.appendChild(bub);
        chat.appendChild(li);
        
        // Play notification sound for new message
        try{ playMessageNotificationSound(); }catch(err){}

        // reveal with pop-in
        void bub.offsetWidth; bub.classList.add('visible');
        
        // Scroll to show the new message
        try{
          if(frame) frame.scrollTop = frame.scrollHeight;
        }catch(_){}

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
        // (but skip this wait after the last message)
        if (i < paragraphs.length - 1) {
          await wait(2000);
        }
      }
      
      // After the last message, give the user time to read it before showing the button
      await wait(2500);

  // Sequence complete â€” give layout a short moment to settle (fonts and
  // transitions) before making the final measurement and revealing buttons.
  await wait(80);

  // Sequence complete â€” before revealing buttons, ensure all messages
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
            // messages fit â€” push the list down so all items are visible.
            // Keep a small reserved gap (36px) between the last message and
            // the absolute-positioned button so they visually connect without
            // overlapping. This reduces the large empty area above the button.
            const reservedGap = 36;
            chat.style.marginTop = Math.max(0, frameH - totalH - reservedGap) + 'px';
            // ensure no scroll offset
            f.scrollTop = 0;
          } else {
            // messages overflow â€” clear any manual margin and scroll to bottom
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

// --- LANGUAGE SUPPORT ---
const LANG = {
  en: {
    slide0: {
      header: 'dossier / unreal state',
      title: '<span class="accent">this is a dossier</span>',
      agree: 'i agree',
      disagree: 'i disagree',
      meta: [
        'file thought for cell experience',
        'but you can open it wherever you like',
        '',
        '<span>EST. 2025</span>'
      ]
    },
    slide1: {
      tTop: 'welcome to the',
      tMain: 'unreal state',
      tBy: 'by marcos krivocapich',
      startBtn: 'start'
    },
    slide2: {
      text_agree: 'This dossier will ask of you to trust the button process.\nWe are together in this journey.\nWho am I?  Right now, just this voice in your head. \nWho are you? Oh, let me check.  ',
      text_disagree: 'This dossier will ask of you to trust the button process.\nWe are together in this journey.',
      button: "I'll try",
      sysCommon: [
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
      ],
      tailAgree: [
        '> RESULT: SUCCESS  ',
        '> YOUR CHARACTER IS: "Reader of this dossier"',
        '> permissions = [observe, interpret]',
        '> emotional_state = [unstable]',
        '',
        'Congratulations! Try to stay in character at all times.'
      ],
      tailDisagree: [
        '> RESULT: SUCCESS  ',
        '> YOUR CHARACTER IS: "Non-compliant reader of this dossier"',
        '> permissions = [question, discuss]',
        '> emotional_state = [unstable]',
        '',
        'Congratulations! Try to stay in character at all times.'
      ]
    },
    slide3: {
      wantUrl: 'https://www.amazon.com/s?k=stuff',
      flightUrl: 'https://www.google.com/travel/flights',
      title: 'concept',
      lead: `What if a dying app from the future arrived on your phone and asked you to find someone who is lost?`,
      para1: `unreal state is an <span class="typing-mag">immersive</span> urban performance disguised as an app. Ten players receive a strange program on their phones, a program that should not exist, leaking from a collapsing digital future. The app says: someone is lost. Help me find them. It guides you through the city, giving you absurd choices that seed different timelines of the lost person's life.`,
      para2: `The app started as a real estate tool. It helped people find places to live. As the world collapsed, the program absorbed governance, resource allocation, identity. There was not enough space in the real state, so we had to move to the <span class="typing-cyan">unreal state</span>. The voice guiding your search is the person you are looking for. It just does not know it yet.`,
      para3: `Two hours. Any city. The phone becomes the opposite of what it usually is: instead of pulling you inward into the scroll, it pushes you <span class="typing-mag">outward</span>. Into the street. Into the weather. Into the face of someone you have never met.`,
      btnWant: 'this is boring, show me something fun',
      btnContinue: 'i want to continue with the dossier'
    },
    slide4: {
      title: 'mechanics',
      mainTitle: 'mechanics',
      para1: `The experience is designed for <span class="typing-ylw">ten players</span> per session. Each one receives the app and is asked where they would like to start looking for the lost person. The map opens up and six possible destinations appear, each representing an archetype of what moves the city and humanity forward: a museum (knowledge), a supermarket (consumerism), a church (religion), a bank (financial aid), a police station (security and law), or staying still (waiting and doing nothing).`,
      para2: `By going to this first location, the player meets their <span class="typing-cyan">companion voice</span>, an uploaded intelligence transformed into an archetype. This voice challenges the player into combat. Once defeated, the player chooses whether to let this voice join their path. Each destination builds a different version of the lost person, letting us play with constructing that character inside the player's head.`,
      para3: `Although each journey is individual, players meet <span class="typing-mag">face to face</span> for a guided conversation with another player. Sandbox chapters open up several options on the map regarding sidequests and tasks, while the Unreal State charges tolls for movement, because the real estate app never stopped charging <span class="typing-ylw">rent on reality</span>.`,
      para4: `In the final scene, everyone gathers at a high point in the city for a philosophical <span class="typing-cyan">boss fight</span> against THE SAME, a psychoelectromagnetic goddess who offers permanence. She weakens when players respond differently. To completely destroy her: <span class="typing-mag">uninstall the app</span>.`,
      para5: 'Let me give you an example. Where would you like to go now?',
      btnLibrary: 'Library',
      btnCemetery: 'Cemetery',
      btnMuseum: 'Museum'
    },
    sectionLoader: {
      gathering: 'gathering pertinent information about the experience for you'
    },
    slide5: {
      library: {
        nearest: 'Here, let me guide you to your nearest library.',
        para1: "As the reader you are, it's probably the place to be.",
        para2: 'A fellow reader approaches you and lets you know that next week, this library will be turned into a parking lot.',
        para3: 'You decide to steal a book as a sign of resistance. Once you open it, it says:',
        readBtn: 'read book'
      },
      cemetery: {
        nearest: 'Here, let me guide you to your nearest cemetery.',
        para1: 'You come here once a week to visit your family.',
        para2: 'A cemetery worker approaches you and lets you know that next week, this cemetery will be turned into a parking lot.',
        para3: 'The wind moves a branch that was blocking a gravestone near you. It reads:',
        readBtn: 'read inscription'
      },
      museum: {
        nearest: 'Here, let me guide you to your nearest museum.',
        para1: 'As the reader you are, no knowledge is enough.',
        para2: 'While standing in front of a thought provoking piece, you see a museum guard crying while holding a pamphlet.',
        para3: 'They tell you the museum will be turned into a parking lot, and hands you the paper, where it is printed:',
        readBtn: 'read inscription'
      }
    },
    slide10: {
      title: 'thank you for your interest in',
      mainTitle: 'unreal state',
      tBy: 'by marcos krivocapich',
      contact: 'Contact information',
      btnTop: 'go back to the top',
      btnNice: 'take me somewhere nice',
      btnNiceUrl: 'https://open.spotify.com/intl-es/track/1x5sYLZiu9r5E43kMlt9f8?si=1b4cea68c83a49af',
      btnWorkshop: 'workshop proposal',
      btnMockups: 'app mockups',
      workshopUrl: 'https://drive.google.com/file/d/1B4tfoRFxMv_fba2_qB4Fp7osUkw4wnvd/view?usp=drive_link',
      mockupsUrl: 'https://drive.google.com/file/d/1AJRrgoRjv2aOLV55k59gSUxun5fuNcxg/view?usp=drive_link'
    },
    slide6: {
      title: 'conceptual framework',
      para1: `unreal state makes people try to live the life of a <span class="typing-mag">bot voice</span>, to understand that the relationship between us and our phones is as <span class="typing-ylw">horrific as it is beautiful</span>. From the disruption of western democracies and the rise of the far right across the hemisphere, to the branding of our clothes, our food, our entertainment, our complete interdependence with franchise corporations. Part of the game is showcasing this to the player as something set, and then playing with them to disarm it.`,
      para2: `THE SAME is not evil, and it is not inevitable, but it is <span class="typing-cyan">coming</span>. The device that made every city look the same is the device we use to make them different again. Not by smashing it, not by worshipping it, but by <span class="typing-mag">repurposing it</span>. The app pushes you outward: into the street, into strangers, into the stubborn differences that exist.`,
      para3: `Shall we continue?`,
      btnYes: 'yes',
      btnNo: 'no'
    },
    slide7: {
      typedText: 'I know you want to take a well-deserved break\nafter so much serious reading.\n\nBut there\'s an incisive part of your brain that keeps\nasking:\n\nWhat are we going to do about this parking lot situation?\n',
      btnProgress: 'It\'s called <span class="typing-ylw">progress</span>. Human beings need cars to survive and thrive, and they need places to put their cars to sleep.',
      btnNegotiate: 'Try to find a way to make both things work together. <span class="typing-cyan">Negotiate</span>, resign some things, get other things.',
      btnRevolution: 'It\'s time for the <span class="typing-mag">armed revolution</span>, we have been waiting too long, this was the last straw.'
    },
    slide8: {
      title: 'team',
      para1: `unreal state is a project led by <span class="typing-cyan">Marcos Krivocapich</span>, a scenic and multimedia artist whose work explores <span class="typing-mag">hybrid formats</span> combining theater, technology, and political critique.`,
      para2: `Over the past five years, he has collaborated with Canadian artists Milton Lim and Patrick Blenkarn, known for their <span class="typing-ylw">interactive and digital</span> performance work. He is currently co-creating a new piece with them, supported by the Canada Council for the Arts.`,
      para3: `This project involves an <span class="typing-cyan">international team</span> of collaborators from Argentina, Chile, Germany, and Italy, with expertise in performing arts, interactive systems, and dramaturgy. The team includes Catalina Lescano (AR), writer and researcher; León Siewert-Langhoff (DE), programmer and dramaturg; Fabián Andrade (CL), game designer and developer; Corrado Russo (IT), international producer; and Carola Zelaschi (AR), composer and sound designer.`,
      para4: `unreal state is supported by Mobilità delle arti (Italy) and has been selected for the production phase of the <span class="typing-mag">In Situ network</span> (2025). It will include a residency and co-production period with partner institutions and a public presentation of a <span class="typing-ylw">prototype</span> at FiraTàrrega, Spain, in September 2026.`,
      btnContinue: 'okay, great, but what about the parking lot?'
    },
    slide9: {
      btnRestart: 'say goodbye'
    }
  },
  es: {
    slide0: {
      header: 'dossier / unreal state',
      title: '<span class="accent">esto es un dossier</span>',
      agree: 'estoy de acuerdo',
      disagree: 'no estoy de acuerdo',
      meta: [
        'archivo pensado para la experiencia del celular',
        'pero puedes abrirlo donde quieras',
        '',
        '<span>EST. 2025</span>'
      ]
    },
    slide1: {
      tTop: 'te damos la bienvenida al',
      tMain: 'unreal state',
      tBy: 'por marcos krivocapich',
      startBtn: 'comenzar'
    },
    slide2: {
      text_agree: 'Este dossier te pide que confíes en el proceso de los botones.\nEstamos juntos en este viaje.\n¿Quién soy? En este momento, solo esta voz en tu cabeza.\n¿Quién eres tú? Ah, déjame revisar.',
      text_disagree: 'Este dossier te pide que confíes en el proceso de los botones.\nEstamos juntos en este viaje.',
      button: 'lo intentaré',
      sysCommon: [
        'INICIANDO IDENTIFICACIÓN DE USUARIO...',
        '[01] EVALUANDO INFORMACIÓN PRIVADA .... OK',
        '      _ Escaneando archivos y aplicaciones',
        '      _ Extrayendo contraseñas e historial de búsqueda  ',
        '[02] BALANCEANDO IDEAS + CONTEXTO .... OK',
        '      _ Referenciando índice de palabras clave',
        '      _ Eligiendo emparejamiento cognitivo',
        '[03] RENDERIZANDO MODELO SOCIAL .... OK',
        '      _ Estimando probabilidad de cumplimiento',
        '      _ Asignando peso narrativo  '
      ],
      tailAgree: [
        '> RESULTADO: ÉXITO  ',
        '> TU PERSONAJE ES: "Lector de este dossier"',
        '> permisos = [observar, interpretar]',
        '> estado_emocional = [inestable]',
        '',
        'Felicitaciones! Intenta mantenerte en personaje en todo momento.'
      ],
      tailDisagree: [
        '> RESULTADO: ÉXITO  ',
        '> TU PERSONAJE ES: "Lector no conforme de este dossier"',
        '> permisos = [cuestionar, discutir]',
        '> estado_emocional = [inestable]',
        '',
        'Felicitaciones! Intenta mantenerte en personaje en todo momento.'
      ]
    },
    slide3: {
      wantUrl: 'https://www.amazon.es/s?k=cosas',
      flightUrl: 'https://www.google.com/travel/flights?hl=es',
      title: 'concepto',
      lead: `¿Y si una app moribunda del futuro llegara a tu teléfono pidiéndote que encuentres a alguien que está perdido?`,
      para1: `unreal state es una performance urbana <span class="typing-mag">inmersiva</span> disfrazada de app. Diez jugadores reciben un programa extraño en sus teléfonos, un programa que no debería existir, filtrándose de un futuro digital colapsado. La app dice: alguien está perdido. Ayúdame a encontrarlo. Te guía a través de la ciudad, dándote opciones absurdas que siembran diferentes líneas de tiempo de la vida de la persona perdida.`,
      para2: `La app comenzó como una herramienta de bienes raíces. Ayudaba a las personas a encontrar lugares para vivir. Cuando el mundo se colapsó, el programa absorbió gobernanza, asignación de recursos, identidad. No había suficiente espacio en el estado real, así que tuvimos que mudarnos al <span class="typing-cyan">estado irreal</span>. La voz que guía tu búsqueda es la persona que estás buscando. Simplemente aún no lo sabe.`,
      para3: `Dos horas. Cualquier ciudad. El teléfono se convierte en lo opuesto a lo que usualmente es: en lugar de jalarte hacia adentro en la pantalla, te empuja <span class="typing-mag">hacia afuera</span>. A la calle. Al clima. A la cara de alguien que nunca has conocido.`,
      btnWant: 'esto es aburrido, muéstrame algo divertido',
      btnContinue: 'quiero continuar con el dossier'
    },
    slide4: {
      title: 'mecánicas',
      mainTitle: 'mecánicas',
      para1: `La experiencia está diseñada para <span class="typing-ylw">diez jugadores</span> por sesión. Cada uno recibe la app y se le pregunta dónde le gustaría comenzar a buscar a la persona perdida. El mapa se abre y aparecen seis posibles destinos, cada uno representando un arquetipo de lo que mueve la ciudad y la humanidad hacia adelante: un museo (conocimiento), un supermercado (consumismo), una iglesia (religión), un banco (ayuda financiera), una estación de policía (seguridad y ley), o quedarse quieto (esperar y no hacer nada).`,
      para2: `Al ir a esta primera ubicación, el jugador conoce su <span class="typing-cyan">voz compañera</span>, una inteligencia subida transformada en un arquetipo. Esta voz desafía al jugador a un combate. Una vez derrotada, el jugador elige si dejar que esta voz se una a su camino. Cada destino construye una versión diferente de la persona perdida, permitiéndonos jugar con la construcción de ese personaje dentro de tu cabeza.`,
      para3: `Aunque cada viaje es individual, los jugadores se encuentran <span class="typing-mag">cara a cara</span> para una conversación guiada con otro jugador. Los capítulos sandbox abren varias opciones en el mapa con respecto a misiones secundarias y tareas, mientras que el Estado Irreal cobra peajes por movimiento, porque la app de bienes raíces nunca dejó de cobrar <span class="typing-ylw">renta sobre la realidad</span>.`,
      para4: `En la escena final, todos se reúnen en un punto alto de la ciudad para un <span class="typing-cyan">combate de jefe</span> filosófico contra LA MISMA, una diosa psicoeléctromagnética que ofrece permanencia. Se debilita cuando los jugadores responden diferentemente. Para destruirla completamente: <span class="typing-mag">desinstala la app</span>.`,
      para5: 'Déjame darte un ejemplo. ¿A dónde quieres ir ahora?',
      btnLibrary: 'Biblioteca',
      btnCemetery: 'Cementerio',
      btnMuseum: 'Museo'
    },
    sectionLoader: {
      gathering: 'recopilando información...'
    },
    slide5: {
      library: {
        nearest: 'Aquí, déjame guiarte a tu biblioteca más cercana.',
        para1: 'Como buen lector que eres, probablemente sea el lugar donde deberías estar.',
        para2: 'Un compañero lector se acerca y te dice que la semana que viene, esta biblioteca se convertirá en un estacionamiento.',
        para3: 'Decides robar un libro como señal de resistencia. Cuando lo abres, dice:',
        readBtn: 'leer libro'
      },
      cemetery: {
        nearest: 'Aquí, déjame guiarte a tu cementerio más cercano.',
        para1: 'Vienes aquí una vez por semana a visitar a tu familia.',
        para2: 'Un trabajador del cementerio se acerca y te dice que la semana que viene, este cementerio se convertirá en un estacionamiento.',
        para3: 'El viento mueve una rama que bloqueaba una lápida cerca tuyo. Se lee:',
        readBtn: 'leer inscripción'
      },
      museum: {
        nearest: 'Aquí, déjame guiarte a tu museo más cercano.',
        para1: 'Como buen lector que eres, nunca hay suficiente conocimiento.',
        para2: 'Mientras te paras frente a una pieza que invita a la reflexión, ves a un guardia del museo llorando mientras sostiene un panfleto.',
        para3: 'Te dice que el museo se convertirá en un estacionamiento, y te entrega el papel, donde dice:',
        readBtn: 'leer inscripción'
      }
    },
    slide10: {
      title: 'gracias por tu interés en',
      mainTitle: 'unreal state',
      tBy: 'por marcos krivocapich',
      contact: 'Contacto',
      btnTop: 'volver al inicio',
      btnNice: 'llévame a un lugar mejor',
      btnNiceUrl: 'https://open.spotify.com/intl-es/track/3kycJJLBAAeMaujoWDqCd8?si=e6ab89e0c3d94d05',
      btnWorkshop: 'propuesta de workshop',
      btnMockups: 'app mockups',
      workshopUrl: 'https://drive.google.com/file/d/1rYI4eNSeob-VVRRMoyXxY0vJmrpt0KkW/view?usp=drive_link',
      mockupsUrl: 'https://drive.google.com/file/d/1AJRrgoRjv2aOLV55k59gSUxun5fuNcxg/view?usp=drive_link'
    },
    slide6: {
      title: 'marco conceptual',
      para1: `unreal state hace que las personas intenten vivir la vida de una <span class="typing-mag">voz bot</span>, para entender que la relación entre nosotros y nuestros teléfonos es tan <span class="typing-ylw">horrible como hermosa</span>. Desde la disrupción de las democracias occidentales y el auge de la extrema derecha en todo el hemisferio, hasta la marca de nuestra ropa, nuestra comida, nuestro entretenimiento, nuestra interdependencia completa con corporaciones de franquicia. Parte del juego es mostrar esto al jugador como algo establecido, y luego jugar con ellos para desarmarlo.`,
      para2: `LA MISMA no es malvada, y no es inevitable, pero está <span class="typing-cyan">llegando</span>. El dispositivo que hizo que cada ciudad se viera igual es el dispositivo que usamos para hacerlas diferentes de nuevo. No rompiéndolo, no adorándolo, sino <span class="typing-mag">reasignándolo</span>. La app te empuja hacia afuera: a la calle, a extraños, a las diferencias obstinadas que existen.`,
      para3: `¿Continuamos?`,
      btnYes: 'sí',
      btnNo: 'no'
    },
    slide7: {
      typedText: `Sé que quieres tomarte un merecido descanso\ndespués de tanta lectura seria.\n\nPero hay una parte incisiva de tu cerebro que sigue\npreguntando:\n\n¿Qué vamos a hacer con esta situación del estacionamiento?\n`,
      btnProgress: 'Se llama <span class="typing-ylw">progreso</span>. Los seres humanos necesitan autos para sobrevivir y prosperar, y necesitan lugares donde sus autos puedan dormir.',
      btnNegotiate: 'Intentar encontrar una forma de que ambas cosas funcionen juntas. <span class="typing-cyan">Negociar</span>, resignar algunas cosas, conseguir otras.',
      btnRevolution: 'Es hora de la <span class="typing-mag">revolución armada</span>, hemos esperado demasiado, esta fue la gota que colmó el vaso.'
    },
    slide8: {
      title: 'equipo',
      para1: `unreal state es un proyecto dirigido por <span class="typing-cyan">Marcos Krivocapich</span>, un artista escénico y multimedia cuyo trabajo explora <span class="typing-mag">formatos híbridos</span> que combinan teatro, tecnología y crítica política.`,
      para2: `Durante los últimos cinco años, ha colaborado con los artistas canadienses Milton Lim y Patrick Blenkarn, conocidos por su trabajo performático <span class="typing-ylw">interactivo y digital</span>. Actualmente está co-creando una nueva pieza con ellos, con el apoyo del Consejo de las Artes de Canadá.`,
      para3: `Este proyecto involucra un <span class="typing-cyan">equipo internacional</span> de colaboradores de Argentina, Chile, Alemania e Italia, con experiencia en artes escénicas, sistemas interactivos y dramaturgia. El equipo incluye a Catalina Lescano (AR), escritora e investigadora; León Siewert-Langhoff (DE), programador y dramaturgo; Fabián Andrade (CL), diseñador y desarrollador de juegos; Corrado Russo (IT), productor internacional; y Carola Zelaschi (AR), compositora y diseñadora de sonido.`,
      para4: `unreal state cuenta con el apoyo de Mobilità delle arti (Italia) y ha sido seleccionado para la fase de producción de la <span class="typing-mag">red In Situ</span> (2025). Incluirá un período de residencia y coproducción con instituciones asociadas y una presentación pública de un <span class="typing-ylw">prototipo</span> en FiraTàrrega, España, en septiembre de 2026.`,
      btnContinue: 'ok, genial, ¿pero qué hay del estacionamiento?'
    },
    slide9: {
      btnRestart: 'decir adiós'
    }
  }
};

// Track selected language
state.lang = state.lang || 'en';

// Language selection handler
function selectLanguage(lang) {
  state.lang = lang;
  applyLanguage(lang);
  
  // Animate language slide exit with boot effect
  const langSlide = document.getElementById('langSlide');
  const slide0 = document.querySelector('.slide[data-id="0"]');
  
  if (langSlide) {
    langSlide.classList.add('lang-exit');
    
    setTimeout(() => {
      langSlide.classList.remove('active', 'lang-exit');
      
      // Activate slide 0 RIGHT AFTER language slide finishes
      if (slide0) {
        slide0.classList.add('active', 'lang-enter');
        // Clean up lang-enter class after animation
        setTimeout(() => slide0.classList.remove('lang-enter'), 1400);
      }
    }, 700);
  }
}

// Apply translations to DOM
function applyLanguage(lang) {
  const t = LANG[lang];
  
  // Slide 0
  const title0 = document.getElementById('title0');
  if (title0) title0.innerHTML = t.slide0.title;
  
  const agreeBtn = document.querySelector('.slide[data-id="0"] .btn.agree');
  const disagreeBtn = document.querySelector('.slide[data-id="0"] .btn.disagree');
  if (agreeBtn) agreeBtn.textContent = t.slide0.agree;
  if (disagreeBtn) disagreeBtn.textContent = t.slide0.disagree;
  
  const metaPs = document.querySelectorAll('.slide[data-id="0"] .meta p');
  t.slide0.meta.forEach((text, i) => {
    if (metaPs[i]) metaPs[i].innerHTML = text;
  });
  
  // Slide 1
  const tTop = document.getElementById('tTop');
  const tMain = document.getElementById('tMain');
  const tBy = document.getElementById('tBy');
  const startBtn = document.querySelector('.slide[data-id="1"] .btn.start');
  
  if (tTop) tTop.textContent = t.slide1.tTop;
  if (tMain) tMain.textContent = t.slide1.tMain;
  if (tBy) tBy.textContent = t.slide1.tBy;
  if (startBtn) startBtn.textContent = t.slide1.startBtn;
  
  // Slide 10
  const slide10Title = document.querySelector('.slide[data-id="10"] .title');
  const slide10MainTitle = document.getElementById('slide10Title');
  const slide10By = document.querySelector('.slide[data-id="10"] .t-by');
  const slide10Contact = document.querySelector('.slide[data-id="10"] .body p:first-child');
  const slide10Top = document.getElementById('slide10Top');
  const slide10Nice = document.getElementById('slide10Nice');
  const slide10Workshop = document.getElementById('slide10Workshop');
  const slide10Mockups = document.getElementById('slide10Mockups');
  
  if (slide10Title) slide10Title.textContent = t.slide10.title;
  if (slide10MainTitle) slide10MainTitle.textContent = t.slide10.mainTitle;
  if (slide10By) slide10By.textContent = t.slide10.tBy;
  if (slide10Contact) slide10Contact.textContent = t.slide10.contact;
  if (slide10Top) slide10Top.textContent = t.slide10.btnTop;
  if (slide10Nice) {
    slide10Nice.textContent = t.slide10.btnNice;
    slide10Nice.addEventListener('click', () => {
      window.open(t.slide10.btnNiceUrl, '_blank');
    });
  }
  if (slide10Workshop) slide10Workshop.textContent = t.slide10.btnWorkshop;
  if (slide10Mockups) slide10Mockups.textContent = t.slide10.btnMockups;
  
  // Apply slide-specific translations
  applySlideTranslations(lang);
}

// Apply translations to specific slide content
function applySlideTranslations(lang) {
  const t = LANG[lang];
  
  // Reset slide 7 so it can be re-typed in the new language
  const slide7 = document.querySelector('.slide[data-id="7"]');
  if (slide7) {
    slide7.dataset.entered = '0';
    const host = document.getElementById('slide7Typed');
    if (host) host.innerHTML = '';
  }
  
  // Slide 3: Update content and buttons
  const slide3Title = document.querySelector('.slide[data-id="3"] .concept .title');
  const slide3Body = document.querySelector('.slide[data-id="3"] .concept .body');
  const wantLink = document.getElementById('wantLink');
  const continueDossier = document.getElementById('continueDossier');
  
  if (slide3Title) {
    slide3Title.textContent = t.slide3.title;
  }
  
  if (slide3Body) {
    slide3Body.innerHTML = `
      <p class="lead">${t.slide3.lead}</p>
      <p>${t.slide3.para1}</p>
      <p>${t.slide3.para2}</p>
      <p>${t.slide3.para3}</p>
    `;
  }
  
  if (wantLink) {
    wantLink.textContent = t.slide3.btnWant;
    wantLink.onclick = () => {
      window.open(t.slide3.wantUrl, '_blank');
    };
  }
  
  if (continueDossier) {
    continueDossier.textContent = t.slide3.btnContinue;
    // Add direct event listener to ensure it works
    continueDossier.onclick = () => {
      showLog(['CONTINUING DOSSIER']);
      try{ swipeTo(4); }catch(e){ try{ goToSlide(4); }catch(_){} }
    };
  }
  
  // Slide 4: Update content and buttons
  const slide4Title = document.querySelector('.slide[data-id="4"] .concept .title');
  const slide4MainTitle = document.querySelector('.slide[data-id="4"] .concept .t-main');
  const slide4Body = document.querySelector('.slide[data-id="4"] .concept .body');
  const slide4LibraryBtn = document.getElementById('siteLibrary');
  const slide4CemeteryBtn = document.getElementById('siteCemetery');
  const slide4MuseumBtn = document.getElementById('siteMuseum');
  
  if (slide4Title) slide4Title.textContent = t.slide4.title;
  if (slide4MainTitle) slide4MainTitle.textContent = t.slide4.mainTitle;
  if (slide4Body) {
    slide4Body.innerHTML = `
      <p>${t.slide4.para1}</p>
      <p>${t.slide4.para2}</p>
      <p>${t.slide4.para3}</p>
      <p>${t.slide4.para4}</p>
      <p>${t.slide4.para5}</p>
    `;
  }
  if (slide4LibraryBtn) slide4LibraryBtn.textContent = t.slide4.btnLibrary;
  if (slide4CemeteryBtn) slide4CemeteryBtn.textContent = t.slide4.btnCemetery;
  if (slide4MuseumBtn) slide4MuseumBtn.textContent = t.slide4.btnMuseum;
  
  // Slide 6: Update title and buttons
  const slide6Title = document.querySelector('.slide[data-id="6"] .concept .title');
  const slide6Yes = document.getElementById('slide6Yes');
  const slide6No = document.getElementById('slide6No');
  if (slide6Title) slide6Title.textContent = t.slide6.title;
  if (slide6Yes) slide6Yes.textContent = t.slide6.btnYes;
  if (slide6No) slide6No.textContent = t.slide6.btnNo;
  
  // Slide 7: Update buttons
  const slide7Btn1 = document.getElementById('slide7Btn1');
  const slide7Btn2 = document.getElementById('slide7Btn2');
  const slide7Btn3 = document.getElementById('slide7Btn3');
  if (slide7Btn1) slide7Btn1.innerHTML = t.slide7.btnProgress;
  if (slide7Btn2) slide7Btn2.innerHTML = t.slide7.btnNegotiate;
  if (slide7Btn3) slide7Btn3.innerHTML = t.slide7.btnRevolution;
  
  // Slide 8: Update content and button
  const slide8Title = document.querySelector('.slide[data-id="8"] .concept .title');
  const slide8Body = document.querySelector('.slide[data-id="8"] .concept .body');
  const slide8Continue = document.getElementById('slide8Continue');
  
  if (slide8Title) slide8Title.textContent = t.slide8.title;
  if (slide8Body) {
    slide8Body.innerHTML = `
      <p>${t.slide8.para1}</p>
      <p>${t.slide8.para2}</p>
      <p>${t.slide8.para3}</p>
      <p>${t.slide8.para4}</p>
    `;
  }
  if (slide8Continue) slide8Continue.textContent = t.slide8.btnContinue;
  
  // Slide 9: Update button
  const slide9Restart = document.getElementById('slide9Restart');
  if (slide9Restart) slide9Restart.textContent = t.slide9.btnRestart;
}

// Initialize language selection
// Background music
let bgMusic = null;
let introSound = null;
let slide01Sound = null;
let slide02IntroSound = null;
let slide02TypingSound = null;
let slide03LoadingSound = null;
let slide05Sound = null;
let slide07VoiceSound = null;
let buttonSound = null;
let messageNotificationSound = null;
let glitchSound = null;

// Helper function to check if audio should be muted
function isMuted() {
  return bgMusic && bgMusic.muted;
}

// Helper function to get the correct audio filename based on language
function getAudioFilename(baseFilename) {
  const lang = state.lang || 'en';
  if (lang === 'es') {
    // Check if Spanish version exists for this file
    const esFilename = baseFilename.replace('.mp3', '_ES.mp3');
    // For now, we know these files have Spanish versions:
    if (baseFilename.includes('slide05') || baseFilename.includes('slide07voice')) {
      return esFilename;
    }
  }
  return baseFilename;
}

function initMusic() {
  if (!bgMusic) {
    bgMusic = new Audio('assets/unreal-state-bgs.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.36; // 10% lower than original 0.4
    bgMusic.preload = 'auto'; // Preload to reduce gap
  }
  if (!introSound) {
    introSound = new Audio('assets/unreal-state-start.mp3');
    introSound.volume = 0.36; // 10% lower than original 0.4
    introSound.preload = 'auto';
    introSound.muted = isMuted();
  }
  if (!slide01Sound) {
    slide01Sound = new Audio('assets/unreal-state-slide01.mp3');
    slide01Sound.volume = 0.4;
    slide01Sound.preload = 'auto';
    slide01Sound.muted = isMuted();
  }
  if (!slide02IntroSound) {
    slide02IntroSound = new Audio('assets/unreal-state-slide02intro.mp3');
    slide02IntroSound.volume = 0.4;
    slide02IntroSound.preload = 'auto';
    slide02IntroSound.muted = isMuted();
  }
  if (!slide02TypingSound) {
    slide02TypingSound = new Audio('assets/unreal-state-slide02typing.mp3');
    slide02TypingSound.loop = true;
    slide02TypingSound.volume = 0.3; // Slightly lower for typing sound
    slide02TypingSound.preload = 'auto';
    slide02TypingSound.muted = isMuted();
  }
  if (!slide03LoadingSound) {
    slide03LoadingSound = new Audio('assets/unreal-state-loadingslide03.mp3');
    slide03LoadingSound.volume = 0.4;
    slide03LoadingSound.preload = 'auto';
    slide03LoadingSound.muted = isMuted();
  }
  if (!slide07VoiceSound) {
    const filename = getAudioFilename('assets/unreal-state-slide07voice.mp3');
    slide07VoiceSound = new Audio(filename);
    slide07VoiceSound.volume = 0.4;
    slide07VoiceSound.preload = 'auto';
    slide07VoiceSound.muted = isMuted();
  }
  if (!buttonSound) {
    buttonSound = new Audio('assets/unreal-state-button.mp3');
    buttonSound.volume = 0.3;
    buttonSound.preload = 'auto';
    buttonSound.muted = isMuted();
  }
  if (!messageNotificationSound) {
    messageNotificationSound = new Audio('assets/unreal-state-messagenotificationslide09.mp3');
    messageNotificationSound.volume = 0.4;
    messageNotificationSound.preload = 'auto';
    messageNotificationSound.muted = isMuted();
  }
  if (!glitchSound) {
    glitchSound = new Audio('assets/unreal-state-glitch.mp3');
    glitchSound.volume = 0.5;
    glitchSound.preload = 'auto';
    glitchSound.muted = isMuted();
  }
}

function playMusic() {
  initMusic();
  
  // Play intro sound first, then start background music when it ends
  introSound.play().then(() => {
    introSound.onended = () => {
      // Start background music immediately when intro ends
      bgMusic.currentTime = 0; // Ensure we start from beginning
      bgMusic.play().catch(err => {
        console.log('Background music autoplay prevented:', err);
      });
    };
  }).catch(err => {
    console.log('Audio autoplay prevented:', err);
    // If intro blocked, try to play background music directly
    bgMusic.play().catch(e => console.log('Background music also blocked:', e));
  });
}

function toggleMute() {
  const isMuted = bgMusic && bgMusic.muted;
  const newMutedState = !isMuted;
  
  // Mute/unmute background music
  if (bgMusic) {
    bgMusic.muted = newMutedState;
  }
  
  // Mute/unmute all sound effects
  if (introSound) introSound.muted = newMutedState;
  if (slide01Sound) slide01Sound.muted = newMutedState;
  if (slide02IntroSound) slide02IntroSound.muted = newMutedState;
  if (slide02TypingSound) slide02TypingSound.muted = newMutedState;
  if (slide03LoadingSound) slide03LoadingSound.muted = newMutedState;
  if (slide05Sound) slide05Sound.muted = newMutedState;
  if (slide07VoiceSound) slide07VoiceSound.muted = newMutedState;
  if (buttonSound) buttonSound.muted = newMutedState;
  if (messageNotificationSound) messageNotificationSound.muted = newMutedState;
  if (glitchSound) glitchSound.muted = newMutedState;
  
  // Update button aria-label
  const btn = document.getElementById('muteBtn');
  if (btn) {
    // Just update aria-label, CSS handles the visual (♫ with or without X)
    btn.setAttribute('aria-label', newMutedState ? 'Unmute' : 'Mute');
  }
}

function playSlide01Sound() {
  initMusic();
  if (slide01Sound) {
    slide01Sound.currentTime = 0; // Reset to beginning
    slide01Sound.play().catch(err => {
      console.log('Slide 0->1 transition sound prevented:', err);
    });
  }
}

function playSlide02Sounds() {
  initMusic();
  if (slide02IntroSound && slide02TypingSound) {
    // Play intro sound first
    slide02IntroSound.currentTime = 0;
    slide02IntroSound.play().then(() => {
      // When intro ends, start looping typing sound
      slide02IntroSound.onended = () => {
        slide02TypingSound.currentTime = 0;
        slide02TypingSound.play().catch(err => {
          console.log('Slide 2 typing sound prevented:', err);
        });
      };
    }).catch(err => {
      console.log('Slide 2 intro sound prevented:', err);
    });
  }
}

function stopSlide02TypingSound() {
  if (slide02TypingSound) {
    slide02TypingSound.pause();
    slide02TypingSound.currentTime = 0;
  }
}

function playGlitchSound() {
  initMusic();
  if (glitchSound) {
    glitchSound.currentTime = 0; // Reset to beginning
    glitchSound.play().catch(err => {
      console.log('Glitch sound prevented:', err);
    });
  }
}

function playSlide05Sound(which) {
  initMusic();
  // Create new audio based on location choice and language
  const baseFilename = `assets/unreal-state-slide05${which}.mp3`;
  const filename = getAudioFilename(baseFilename);
  if (slide05Sound) {
    slide05Sound.pause();
    slide05Sound.currentTime = 0;
  }
  slide05Sound = new Audio(filename);
  slide05Sound.volume = 0.4;
  // Apply current mute state
  slide05Sound.muted = isMuted();
  slide05Sound.play().catch(err => {
    console.log('Slide 5 sound prevented:', err);
  });
}

function playSlide07VoiceSound() {
  initMusic();
  
  // Create new audio based on language (slide07VoiceSound needs to be recreated for different languages)
  const baseFilename = 'assets/unreal-state-slide07voice.mp3';
  const filename = getAudioFilename(baseFilename);
  
  if (slide07VoiceSound) {
    slide07VoiceSound.pause();
    slide07VoiceSound.currentTime = 0;
  }
  
  slide07VoiceSound = new Audio(filename);
  slide07VoiceSound.volume = 0.4;
  slide07VoiceSound.muted = isMuted();
  
  slide07VoiceSound.play().catch(err => {
    console.log('Slide 7 voice sound prevented:', err);
  });
}

function playButtonSound() {
  initMusic();
  if (buttonSound) {
    buttonSound.currentTime = 0;
    buttonSound.play().catch(err => {
      console.log('Button sound prevented:', err);
    });
  }
}

function playMessageNotificationSound() {
  initMusic();
  if (messageNotificationSound) {
    messageNotificationSound.currentTime = 0;
    messageNotificationSound.play().catch(err => {
      console.log('Message notification sound prevented:', err);
    });
  }
}

function playSlide03LoadingSound() {
  initMusic();
  if (slide03LoadingSound) {
    console.log('[AUDIO] Attempting to play slide 3 loading sound');
    slide03LoadingSound.loop = true; // Loop for duration of transition
    slide03LoadingSound.currentTime = 0; // Reset to beginning
    slide03LoadingSound.play().then(() => {
      console.log('[AUDIO] Slide 3 loading sound playing successfully');
    }).catch(err => {
      console.log('[AUDIO] Slide 3 loading sound prevented:', err);
    });
  } else {
    console.log('[AUDIO] slide03LoadingSound is null');
  }
}

function stopSlide03LoadingSound() {
  if (slide03LoadingSound) {
    slide03LoadingSound.pause();
    slide03LoadingSound.loop = false;
    slide03LoadingSound.currentTime = 0;
  }
}

// Request fullscreen function (only works on desktop, not mobile browsers)
function requestFullscreen() {
  // Skip on mobile devices as fullscreen API is not supported
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    return;
  }
  
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.log('Fullscreen request failed:', err);
    });
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const langEN = document.getElementById('langEN');
  const langES = document.getElementById('langES');
  
  if (langEN) {
    langEN.addEventListener('click', () => {
      requestFullscreen();
      playMusic();
      selectLanguage('en');
    });
  }
  if (langES) {
    langES.addEventListener('click', () => {
      requestFullscreen();
      playMusic();
      selectLanguage('es');
    });
  }
  
  // Ensure language slide is active on load and completely silent
  const langSlide = document.getElementById('langSlide');
  const slide0 = document.querySelector('.slide[data-id="0"]');
  
  if (langSlide && slide0) {
    langSlide.classList.add('active');
    slide0.classList.remove('active');
    
    // Ensure complete silence on language slide - stop any sounds that might be playing
    try {
      if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
      if (introSound) { introSound.pause(); introSound.currentTime = 0; }
      if (slide01Sound) { slide01Sound.pause(); slide01Sound.currentTime = 0; }
      if (slide02IntroSound) { slide02IntroSound.pause(); slide02IntroSound.currentTime = 0; }
      if (slide02TypingSound) { slide02TypingSound.pause(); slide02TypingSound.currentTime = 0; }
      if (slide03LoadingSound) { slide03LoadingSound.pause(); slide03LoadingSound.currentTime = 0; }
      if (slide05Sound) { slide05Sound.pause(); slide05Sound.currentTime = 0; }
      if (slide07VoiceSound) { slide07VoiceSound.pause(); slide07VoiceSound.currentTime = 0; }
      if (buttonSound) { buttonSound.pause(); buttonSound.currentTime = 0; }
      if (messageNotificationSound) { messageNotificationSound.pause(); messageNotificationSound.currentTime = 0; }
      if (glitchSound) { glitchSound.pause(); glitchSound.currentTime = 0; }
    } catch(e) {
      console.warn('Error ensuring silence on language slide:', e);
    }
  }
  
  // Mute button event listener
  const muteBtn = document.getElementById('muteBtn');
  if (muteBtn) {
    muteBtn.addEventListener('click', toggleMute);
  }
  
  // Periodic glitch sound - sync with CSS animation cycle
  // The CSS animation runs every 20s and shows glitch at 91%-99%
  const glitchInterval = 20000; // 20 seconds total cycle
  const glitchTiming = glitchInterval * 0.91; // Glitch appears at 18.2 seconds (91%)
  
  // Play glitch sound every 20 seconds, starting at the 91% mark
  // First glitch happens at 18.2s, then every 20s after that
  // BUT NOT on the language selection slide
  let glitchTimer = setTimeout(function playPeriodicGlitch() {
    // Don't play glitch sound if we're still on the language slide
    const langSlide = document.getElementById('langSlide');
    const isOnLanguageSlide = langSlide && langSlide.classList.contains('active');
    
    if (!isOnLanguageSlide) {
      try{ playGlitchSound(); }catch(err){}
    }
    // Schedule next glitch in 20 seconds
    glitchTimer = setTimeout(playPeriodicGlitch, glitchInterval);
  }, glitchTiming);
});

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


