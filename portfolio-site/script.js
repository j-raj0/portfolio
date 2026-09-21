(function(){
"use strict";

/* =======================================================================
   CONTENT
   -----------------------------------------------------------------------
   The whole site is built from PROJECTS below. One entry = one sheet in
   the stack. The top sheet is the title sheet and is not clickable.

     title    : project name — used for the sheet label and the headline
     images   : how many images sit beside the headline (0-4), OR an array
                of image sources, e.g. images: ["data:image/jpeg;base64,..."]
     intro    : paragraphs beside those images (array of strings)
     sections : the design-process stages, in order
                  heading : stage name
                  images  : count, or an array of sources
                  body    : paragraphs (array of strings)

   Add a stage by adding an object to sections. Add a project by adding an
   entry to PROJECTS — a new sheet appears in the stack by itself. Odd
   image counts put the last image full width.

   Swapping in real photos: every image slot is a fixed box (square, or
   wide for the odd one out) and the picture is cropped to fill it, the
   same way a phone's photo grid works — so a photo of any resolution or
   aspect ratio drops in cleanly, no resizing needed on your end. The
   pixelate-in effect is applied to whatever ends up in the slot; it isn't
   baked into the placeholder art, so it doesn't need touching when you
   swap an image, and you never have to edit it just to change a picture.

   One real constraint: this page is self-contained, so a photo has to be
   pasted in as a data URI (a long "data:image/jpeg;base64,...." string) —
   a normal file path or a link to somewhere on your computer won't load.
   Easiest path: hand me the image file and I'll convert and drop it in.
   ======================================================================= */

const LOREM_A = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation";
const LOREM_B = "ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum";
const LOREM_C = "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo";
const PICTO_BRAINSTORMING = "My partner and I were initially struggling to find ideas. The first idea was that the messaging should be 'no jewelry'. We thought up recognisable symbols for jewelry like diamond rings, watches, and necklaces.";
const PICTO_ABOUT = "A pictograph is a visual symbol designed to communicate a simple message, without the use of words. Pictographs are widely used in signage and UI elements, or whenever an idea needs to be communicated across languages.";
const PICTO_ABOUT_2 = "The assignment (9/16/26) was to work with a partner and produce (individually) two sketches that communicated one idea, and two sketches that communicated another idea, for a total of eight sketches across a duo. The first person was assigned to pick one idea and create one refined sketch from their four rough drafts, and the second person was assigned the same. My partner transferred out of the class halfway through the project, so I will be sharing the brainstorming process as it pertained to us as a duo. However, there is only one sketch to speak of when it comes to the refinement process. By then, I was working solo.";
const PICTO_SKETCHING = "The first four sketches we produced were communicating this 'no jewelry' idea. She focused on necklaces, and I focused on watches and rings. However, one of the sketches I produced (the one with the watch and the hand) looked like a pictograph that was asking people to wait instead. That was the genesis of our second idea, which never went further than the sketching phase, as my partner left by the refining process.";
const PICTO_REFINEMENT = "I decided to go with the ring with a strikethrough for the final markup. I added a few details, namely the details on the diamond and the spark, as well as the proportions of the ring in relation to the diamond. I decided to make the ring and strikethrough black, being the central elements of the pictograph. The border is a square rather than a circle since doing a circle-on-circle design might be a bit visually cluttered. Ultimately, people thought the messaging had something to do with marriage rather than jewelry, which is probably because the diamond ring is stereotypically a symbol of marriage—something I failed to consider."

const PROJECTS = [
  {
    title:"PICTOGRAPH", intro:[PICTO_ABOUT, PICTO_ABOUT_2],
    sections:[
      { heading:"BRAINSTORMING", body:[PICTO_BRAINSTORMING] },
      { heading:"SKETCHING", images:["images/sketch1.png", "images/sketch2.png"], body:[PICTO_SKETCHING] },
      { heading:"REFINEMENT", images:["images/double ultra final.png"], body:[PICTO_REFINEMENT] }
    ]
  }
];

/* Tuning ---------------------------------------------------------------- */
const ANGLE   = -30;                 /* sheet rotation, degrees            */
const PHASES  = [5, 13, 34, 0];      /* pixel steps; set to [0] to disable */
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const HOVER_SOUND = true;            /* set false to drop the rustle and keep only the slide */

/* Sound */
const Sound = (function(){
  let ctx = null, buf = null, bus = null, enabled = true, lastRustle = 0;

  function ready(){
    if (!enabled) return null;
    if (!ctx){
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch(e){ return null; }
      bus = ctx.createGain(); bus.gain.value = 0.6; bus.connect(ctx.destination);
      const n = Math.floor(ctx.sampleRate * 1.6);
      buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i=0;i<n;i++) d[i] = Math.random()*2 - 1;
    }
    if (ctx.state === "suspended") ctx.resume().catch(function(){});
    return ctx.state === "running" ? ctx : null;
  }

  function grain(o){
    const c = ready(); if (!c) return;
    const t0 = c.currentTime + (o.at || 0), dur = o.dur;
    const src = c.createBufferSource(); src.buffer = buf;
    const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = o.q || 1.1;
    bp.frequency.setValueAtTime(o.f0, t0);
    if (o.f1) bp.frequency.exponentialRampToValueAtTime(o.f1, t0 + dur);
    const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = o.hp || 520;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(o.peak, t0 + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(bp); bp.connect(hp); hp.connect(g); g.connect(bus);
    src.start(t0, Math.random() * (buf.duration - dur - 0.1));
    src.stop(t0 + dur + 0.03);
  }

  return {
    unlock: function(){ ready(); },
    toggle: function(){ enabled = !enabled; if (enabled) ready(); return enabled; },
    rustle: function(){
      if (!HOVER_SOUND) return;
      const now = Date.now(); if (now - lastRustle < 150) return; lastRustle = now;
      /* a soft, broadband wash underneath — no resonant pitch, so it reads as
         texture rather than a struck note (that pitch was what made it sound
         like a typewriter key). Long-ish soft attack, high-passed well above
         the range that gives a click its "body". */
      grain({ dur:0.16 + Math.random()*0.05, f0:4200, f1:2600, q:0.22, peak:0.026, attack:0.03, hp:1700 });
      /* a scatter of tiny bright flickers on top, irregularly timed so they
         don't fall into a beat, each with its own soft onset. */
      const n = 6 + ((Math.random()*5)|0);
      for (let i=0;i<n;i++){
        grain({
          at: Math.random()*0.13,
          dur: 0.018 + Math.random()*0.03,
          f0: 3400 + Math.random()*5000,
          f1: 3400 + Math.random()*5000,
          q: 0.25 + Math.random()*0.25,
          peak: 0.009 + Math.random()*0.013,
          attack: 0.012 + Math.random()*0.018,
          hp: 2200
        });
      }
    },
    slide: function(){
      grain({ dur:0.46, f0:760,  f1:5200, q:0.5,  peak:0.17, attack:0.055 });
      grain({ at:0.02, dur:0.36, f0:2600, f1:900, q:0.45, peak:0.09, attack:0.1 });
      for (let i=0;i<4;i++){
        grain({ at:0.03 + i*0.07, dur:0.05, f0:2100 + Math.random()*3200, q:1.5, peak:0.038 });
      }
    }
  };
})();
["pointerdown","keydown","touchstart"].forEach(function(ev){
  window.addEventListener(ev, function(){ Sound.unlock(); }, {passive:true});
});

const sndBtn = document.getElementById("snd");
sndBtn.addEventListener("click", function(){
  const on = Sound.toggle();
  sndBtn.textContent = on ? "SOUND ON" : "SOUND OFF";
  sndBtn.setAttribute("aria-pressed", String(on));
  if (on) Sound.rustle();
});

/* =======================================================================
   MENU — a title sheet (inert) with the project sheets beneath it
   ======================================================================= */
const stack   = document.getElementById("stack");
const sheetsEl= document.getElementById("sheets");
const grabsEl = document.getElementById("grabs");
const titleEl = document.getElementById("title");
const menu    = document.getElementById("menu");

function sheet(i){
  const el = document.createElement("article");
  el.className = "page";
  el.style.setProperty("--i", i);
  return el;
}
sheetsEl.appendChild(sheet(0));                       /* the title sheet */

PROJECTS.forEach(function(p, pi){
  const el = sheet(pi + 1);
  const lab = document.createElement("span");
  lab.className = "label";
  lab.textContent = p.title;
  el.appendChild(lab);
  sheetsEl.appendChild(el);

  const g = document.createElement("button");
  g.className = "grab" + (pi === PROJECTS.length - 1 ? " last" : "");
  g.style.setProperty("--i", pi + 1);
  g.dataset.p = pi;
  g.setAttribute("aria-label", "Open project: " + p.title);
  grabsEl.appendChild(g);
});

const pages = Array.prototype.slice.call(sheetsEl.children);

function setActive(pi){
  const s = pi === null ? -1 : pi + 1;
  pages.forEach(function(el, j){
    el.classList.toggle("is-out",  j === s);
    el.classList.toggle("is-push", s >= 0 && j > s);
  });
}

Array.prototype.forEach.call(grabsEl.children, function(g){
  const pi = +g.dataset.p;
  g.addEventListener("pointerenter", function(){ if (!busy){ setActive(pi); Sound.rustle(); } });
  g.addEventListener("focus",        function(){ if (!busy){ setActive(pi); Sound.rustle(); } });
  g.addEventListener("click",        function(){ openProject(pi); });
});
stack.addEventListener("pointerleave", function(){ setActive(null); });

/* fit the wordmark to the sheet edge --------------------------------- */
function anchor(){
  const r = menu.getBoundingClientRect();
  return { x: r.left + stack.offsetLeft, y: r.top + stack.offsetTop + stack.offsetHeight };
}
function fitTitle(){
  const a = anchor();
  const avail = (window.innerWidth - 26 - a.x) / Math.cos(Math.PI/6);
  titleEl.style.fontSize = "100px";
  const w = titleEl.offsetWidth || 1;
  titleEl.style.fontSize = Math.max(22, Math.min(150, 100 * avail / w)).toFixed(1) + "px";
}
fitTitle();
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitle);
setTimeout(fitTitle, 900);
let rz; window.addEventListener("resize", function(){ clearTimeout(rz); rz = setTimeout(fitTitle, 90); });

/* =======================================================================
   The red sweep between screens
   ======================================================================= */
const wipe = document.getElementById("wipe");
const RAD  = ANGLE * Math.PI / 180;
const TX   = { x: Math.cos(RAD), y: Math.sin(RAD) };
const NY   = { x: -Math.sin(RAD), y: Math.cos(RAD) };

function sweepGeometry(){
  const a = anchor(), W = window.innerWidth, H = window.innerHeight;
  let dmin = Infinity, dmax = -Infinity, tmin = Infinity, tmax = -Infinity;
  [[0,0],[W,0],[0,H],[W,H]].forEach(function(p){
    const vx = p[0]-a.x, vy = p[1]-a.y;
    const d = vx*NY.x + vy*NY.y, t = vx*TX.x + vy*TX.y;
    if(d<dmin)dmin=d; if(d>dmax)dmax=d; if(t<tmin)tmin=t; if(t>tmax)tmax=t;
  });
  dmin -= 40; dmax += 40; tmin -= 40; tmax += 40;
  wipe.style.left = a.x + "px"; wipe.style.top = a.y + "px";
  wipe.style.width = (tmax - tmin) + "px";
  wipe.style.height = (dmax - dmin) + "px";
  return {
    hidden:  "rotate(" + ANGLE + "deg) translate(" + tmin + "px," + dmax + "px)",
    covered: "rotate(" + ANGLE + "deg) translate(" + tmin + "px," + dmin + "px)"
  };
}
function sweep(dir, ms){
  if (wipe.getAnimations) wipe.getAnimations().forEach(function(a){ a.cancel(); });
  const g = sweepGeometry();
  const from = dir === "in" ? g.hidden : g.covered;
  const to   = dir === "in" ? g.covered : g.hidden;
  wipe.style.display = "block";
  wipe.style.transform = from;
  if (REDUCED){ wipe.style.transform = to; return Promise.resolve(); }
  return wipe.animate([{transform:from},{transform:to}],
    { duration: ms, easing:"cubic-bezier(.62,0,.2,1)", fill:"forwards" })
    .finished.catch(function(){});
}

/* =======================================================================
   Artwork + the pixel-resolve loader
   ======================================================================= */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function makeArt(seed, kind){
  const W = 560, H = 460;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const x = c.getContext("2d");
  const r = mulberry32(seed * 9781 + 137);

  const bg = x.createLinearGradient(0,0,W,H);
  bg.addColorStop(0,"#050505"); bg.addColorStop(.55,"#191919"); bg.addColorStop(1,"#080808");
  x.fillStyle = bg; x.fillRect(0,0,W,H);
  function grey(lo,hi,a){ const v = Math.floor(lo + r()*(hi-lo)); return "rgba("+v+","+v+","+v+","+a+")"; }

  if (kind === 0){
    for (let i=0;i<30;i++){
      const cx=r()*W, cy=r()*H, len=(.3+r()*.7)*H, wd=(.02+r()*.075)*W, ang=-1.1+r()*2.2;
      x.save(); x.translate(cx,cy); x.rotate(ang);
      const g = x.createLinearGradient(0,-len/2,0,len/2);
      g.addColorStop(0,grey(10,40,0));
      g.addColorStop(.45,grey(26,92,(.2+r()*.5).toFixed(2)));
      g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g; x.beginPath(); x.moveTo(0,-len/2);
      x.quadraticCurveTo(wd,0,0,len/2); x.quadraticCurveTo(-wd,0,0,-len/2);
      x.fill(); x.strokeStyle=grey(40,110,.16); x.lineWidth=1; x.stroke(); x.restore();
    }
  } else if (kind === 1){
    for (let i=0;i<46;i++){
      const y0=r()*H, amp=8+r()*46, th=2+r()*26;
      x.beginPath(); x.moveTo(-20,y0);
      for (let px=-20;px<=W+20;px+=26) x.lineTo(px, y0 + Math.sin((px/W)*6.2 + i)*amp*(.4+r()*.6));
      x.strokeStyle=grey(14,96,(.1+r()*.38).toFixed(2)); x.lineWidth=th; x.lineCap="round"; x.stroke();
    }
    const v = x.createRadialGradient(W*.5,H*.42,10,W*.5,H*.5,W*.78);
    v.addColorStop(0,"rgba(255,255,255,.07)"); v.addColorStop(1,"rgba(0,0,0,.72)");
    x.fillStyle=v; x.fillRect(0,0,W,H);
  } else {
    for (let i=0;i<9;i++){
      const cx=W*(.3+r()*.45), cy=H*(.34+r()*.42), rad=(.18+r()*.4)*W;
      const g = x.createRadialGradient(cx-rad*.32, cy-rad*.38, rad*.04, cx, cy, rad);
      g.addColorStop(0,grey(50,120,(.5+r()*.4).toFixed(2)));
      g.addColorStop(.45,grey(16,52,.55)); g.addColorStop(1,"rgba(0,0,0,0)");
      x.fillStyle=g; x.beginPath(); x.arc(cx,cy,rad,0,6.2832); x.fill();
    }
    for (let i=0;i<70;i++){
      const cx=r()*W, cy=r()*H, rad=2+r()*16;
      x.fillStyle=grey(20,140,(.05+r()*.2).toFixed(2));
      x.beginPath(); x.arc(cx,cy,rad,0,6.2832); x.fill();
    }
    const v = x.createRadialGradient(W*.48,H*.46,20,W*.5,H*.5,W*.72);
    v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(0,0,0,.8)");
    x.fillStyle=v; x.fillRect(0,0,W,H);
  }

  const id = x.getImageData(0,0,W,H), d = id.data;
  for (let i=0;i<d.length;i+=4){
    const n = (r()-.5)*24;
    d[i]   = Math.max(0,Math.min(255,d[i]   + n));
    d[i+1] = Math.max(0,Math.min(255,d[i+1] + n));
    d[i+2] = Math.max(0,Math.min(255,d[i+2] + n*0.86));
  }
  x.putImageData(id,0,0);
  return c;
}

const artCache = {};
function getArt(key, seed, src){
  if (artCache[key]) return Promise.resolve(artCache[key]);
  if (src){
    return new Promise(function(res){
      const img = new Image();
      img.onload = function(){ artCache[key] = img; res(img); };
      img.onerror = function(){ const a = makeArt(seed, seed % 3); artCache[key] = a; res(a); };
      img.src = src;
    });
  }
  const a = makeArt(seed, seed % 3);
  artCache[key] = a;
  return Promise.resolve(a);
}

const tmp = document.createElement("canvas");
function drawAt(canvas, art, res){
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  if (!res){ ctx.drawImage(art, 0, 0, canvas.width, canvas.height); return; }
  const w = Math.max(2, res), h = Math.max(2, Math.round(res * canvas.height / canvas.width));
  tmp.width = w; tmp.height = h;
  const t = tmp.getContext("2d");
  t.imageSmoothingEnabled = true; t.clearRect(0,0,w,h);
  t.drawImage(art, 0, 0, w, h);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(tmp, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
}

const timers = [];
function clearTimers(){ timers.forEach(clearTimeout); timers.length = 0; }

function revealFigure(fig){
  if (fig.dataset.done) return;
  fig.dataset.done = "1";
  const canvas = fig.querySelector("canvas");
  const delay = (+fig.dataset.k || 0) * 110;
  getArt(fig.dataset.key, +fig.dataset.seed, fig.dataset.src || "").then(function(art){
    canvas.width  = art.naturalWidth  || art.width;
    canvas.height = art.naturalHeight || art.height;
    if (REDUCED || PHASES.length === 1){
      drawAt(canvas, art, PHASES[PHASES.length-1]); fig.classList.add("lit"); return;
    }
    PHASES.forEach(function(res, k){
      timers.push(setTimeout(function(){
        drawAt(canvas, art, res);
        if (k === 0) fig.classList.add("lit");
      }, delay + k * 155));
    });
  });
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function resolveText(el, text){
  if (REDUCED){ el.textContent = text; return; }
  const chars = text.split("");
  let step = 0; const steps = 5;
  (function tick(){
    const frac = step / steps;
    el.textContent = chars.map(function(ch, i){
      if (ch === " ") return " ";
      return (i / chars.length) < frac ? ch : GLYPHS[(Math.random()*GLYPHS.length)|0];
    }).join("");
    if (step++ < steps) timers.push(setTimeout(tick, 95));
    else el.textContent = text;
  })();
}

/* =======================================================================
   Project page
   ======================================================================= */
const project = document.getElementById("project");
const scroller= document.getElementById("scroller");
const doc     = document.getElementById("doc");
const sbar    = document.getElementById("sbar");
const sthumb  = document.getElementById("sthumb");
let busy = false, io = null;

function mediaBlock(spec, keyBase){
  const list = Array.isArray(spec) ? spec : [];
  const n = Array.isArray(spec) ? spec.length : (spec | 0);
  if (!n) return null;
  const el = document.createElement("div");
  el.className = "media";
  el.setAttribute("aria-hidden","true");
  for (let k=0;k<n;k++){
    const f = document.createElement("figure");
    if (n % 2 === 1 && k === n-1) f.className = "wide";
    f.dataset.key  = keyBase + ":" + k;
    f.dataset.seed = String(Math.abs(hash(keyBase + k)) % 9973);
    f.dataset.k    = String(k);
    if (list[k]) f.dataset.src = list[k];
    f.appendChild(document.createElement("canvas"));
    el.appendChild(f);
  }
  return el;
}
function hash(s){
  let h = 2166136261;
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h;
}

function paragraphs(list, stagger){
  const el = document.createElement("div");
  el.className = "body" + (stagger ? " stagger" : "");
  list.forEach(function(t, i){
    const p = document.createElement("p");
    p.textContent = t;
    if (stagger) p.style.transitionDelay = (120 + i*90) + "ms";
    el.appendChild(p);
  });
  return el;
}

function buildDoc(pi){
  const p = PROJECTS[pi];
  doc.innerHTML = "";

  const layout  = document.createElement("div"); layout.className = "layout";
  const mediaCol= document.createElement("div"); mediaCol.className = "media-col";
  const copyCol = document.createElement("div"); copyCol.className = "copy-col";
  layout.appendChild(mediaCol);
  layout.appendChild(copyCol);
  doc.appendChild(layout);

  /* Each stage is one "pair": its media group and its text chunk. The two
     live in separate columns (mediaCol / copyCol) so a tall image group
     never delays the next heading — but `order` keeps them reading
     image-then-text in DOM order too, which is what takes over on mobile
     once the columns dissolve (see the .layout media query in the CSS). */
  let pair = 0;
  function addPair(mediaSpec, copyEl, keyBase){
    const m = mediaBlock(mediaSpec, keyBase);
    if (m){ m.style.order = String(2*pair + 1); mediaCol.appendChild(m); }
    copyEl.style.order = String(2*pair + 2);
    copyCol.appendChild(copyEl);
    pair++;
  }

  /* opening pair: headline + intro, beside the hero images */
  const head = document.createElement("h2");
  head.className = "ptitle";
  head.textContent = p.title;
  const heroCopy = document.createElement("div");
  heroCopy.className = "copy-chunk";
  heroCopy.appendChild(head);
  const heroBody = paragraphs(p.intro || [], true);
  heroCopy.appendChild(heroBody);
  addPair(p.images, heroCopy, pi + ":hero");

  /* the stages */
  (p.sections || []).forEach(function(s, si){
    const copy = document.createElement("div");
    copy.className = "copy-chunk";
    const h = document.createElement("h3");
    h.className = "shead";
    h.textContent = s.heading;
    copy.appendChild(h);
    copy.appendChild(paragraphs(s.body || [], false));
    addPair(s.images, copy, pi + ":s" + si);
  });

  /* back, at the foot of the page, full width beneath both columns */
  const rule = document.createElement("div"); rule.className = "endrule";
  const back = document.createElement("button");
  back.className = "back"; back.type = "button";
  back.textContent = "\u2190 BACK";
  back.setAttribute("aria-label","Back to the menu");
  back.addEventListener("click", closeProject);
  doc.appendChild(rule); doc.appendChild(back);

  return { headEl: head, heroBody: heroBody };
}

function watchFigures(){
  if (io) io.disconnect();
  io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){ io.unobserve(e.target); revealFigure(e.target); }
    });
  }, { root: scroller, rootMargin: "140px 0px" });
  Array.prototype.forEach.call(doc.querySelectorAll("figure"), function(f){ io.observe(f); });
}

function openProject(pi){
  if (busy) return;
  busy = true;
  Sound.slide();

  sweep("in", REDUCED ? 0 : 520).then(function(){
    menu.hidden = true;
    project.classList.add("show");
    project.classList.remove("leaving");
    scroller.scrollTop = 0;
    sbar.classList.remove("in");

    const built = buildDoc(pi);
    wipe.style.display = "none";
    void doc.offsetHeight;                     /* commit the start state */

    resolveText(built.headEl, PROJECTS[pi].title);
    watchFigures();
    requestAnimationFrame(function(){
      built.heroBody.classList.add("in");
      sbar.classList.add("in");
      syncBar();
    });
    timers.push(setTimeout(function(){ busy = false; }, 500));
  });
}

function closeProject(){
  if (busy) return;
  busy = true;
  Sound.rustle();
  clearTimers();
  project.classList.add("leaving");
  setTimeout(function(){
    const g = sweepGeometry();
    wipe.style.display = "block";
    wipe.style.transform = g.covered;
    project.classList.remove("show");
    menu.hidden = false;
    setActive(null);
    fitTitle();
    requestAnimationFrame(function(){
      sweep("out", REDUCED ? 0 : 520).then(function(){
        wipe.style.display = "none";
        busy = false;
      });
    });
  }, REDUCED ? 0 : 170);
}

document.addEventListener("keydown", function(e){
  if (e.key === "Escape" && project.classList.contains("show")) closeProject();
});

/* =======================================================================
   Custom scrollbar
   ======================================================================= */
function syncBar(){
  const view = scroller.clientHeight, full = scroller.scrollHeight;
  const track = sbar.clientHeight;
  const th = Math.max(26, track * Math.min(1, view / full));
  const max = full - view;
  const top = max > 0 ? (scroller.scrollTop / max) * (track - th) : 0;
  sthumb.style.height = th + "px";
  sthumb.style.transform = "translateY(" + top + "px)";
}
scroller.addEventListener("scroll", syncBar, {passive:true});
window.addEventListener("resize", syncBar);

sthumb.addEventListener("pointerdown", function(e){
  e.preventDefault();
  const startY = e.clientY, startTop = scroller.scrollTop;
  const span = sbar.clientHeight - sthumb.offsetHeight;
  const max = scroller.scrollHeight - scroller.clientHeight;
  function move(ev){ if (span > 0) scroller.scrollTop = startTop + (ev.clientY - startY) * (max / span); }
  function up(){
    document.removeEventListener("pointermove", move);
    document.removeEventListener("pointerup", up);
  }
  document.addEventListener("pointermove", move);
  document.addEventListener("pointerup", up);
});
sbar.addEventListener("pointerdown", function(e){
  if (e.target === sthumb) return;
  const rect = sbar.getBoundingClientRect();
  scroller.scrollTop = ((e.clientY - rect.top) / rect.height) * (scroller.scrollHeight - scroller.clientHeight);
});

})();
