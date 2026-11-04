/* main.js - 데이터 로드, 장면 합성, 전환, seek(t) */
"use strict";
const cv = document.getElementById("c"), ctx = cv.getContext("2d");
let SC = null, SS = [];
const TR = 0.6; /* 전환 길이(초) */

async function init() {
  const get = async u => { const r = await fetch(u + "?v=" + Date.now()); if (!r.ok) throw new Error(u + " " + r.status); return r.json(); };
  const [script, timing] = await Promise.all([get("script.json"), get("timing.json")]);
  SC = SCHED.build(script, timing); SC.script = script;
  SS = SC.scenes.map(sc => {
    const items = sc.items;
    const S = {
      n: sc.n, start: sc.start, dur: sc.dur, items,
      B: f => 0.3 + f * (sc.dur - 0.6),
      rel: id => items.find(i => i.id === id).start - sc.start,
      relB: (id, f) => { const it = items.find(i => i.id === id); return (it.start - sc.start) + 0.3 + f * (it.slot - 0.6); },
    };
    return S;
  });
  await Promise.all([...document.fonts].map(f => f.load().catch(() => null)));
  await document.fonts.load('900 40px "Noto Sans KR"', "주사위 기억 로봇");
  await document.fonts.load('500 20px "JetBrains Mono"', "0123456789");
  window.__total = SC.total; window.__scenes = SC.scenes;
  window.__ready = true;
}

function sceneIndex(t) { let i = 0; for (let k = 0; k < SS.length; k++) if (t >= SS[k].start - 1e-9) i = k; return i; }
function drawSceneI(i, lt) {
  const S = SS[i];
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  SCENES[S.n](ctx, lt, S);
  vignette(ctx);
  ctx.restore();
}
function transition(i, lt) {
  const prev = SS[i - 1], type = (i - 1) % 4, u = clamp(lt / TR, 0, 1), e = eInOut(u);
  const ltOut = prev.dur + lt;
  if (type === 3) {
    ctx.save(); ctx.translate(0, -H * 0.35 * e); ctx.globalAlpha = 1 - e * .5; drawSceneI(i - 1, ltOut); ctx.restore();
    ctx.save(); ctx.translate(0, H * (1 - eOut5(u))); drawSceneI(i, lt); ctx.restore();
    ctx.fillStyle = C.blue; ctx.fillRect(0, H * (1 - eOut5(u)) - 6, W, 6);
    return;
  }
  ctx.save(); ctx.translate(W / 2, H / 2); const z = 1 + .08 * e; ctx.scale(z, z); ctx.translate(-W / 2, -H / 2); drawSceneI(i - 1, ltOut); ctx.restore();
  ctx.fillStyle = "rgba(5,8,12," + (0.5 * e) + ")"; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (type === 0) {
    const slant = 260, edge = -slant + (W + 2 * slant) * e;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(edge + slant, 0); ctx.lineTo(edge - slant, H); ctx.lineTo(0, H); ctx.closePath(); ctx.clip();
    drawSceneI(i, lt); ctx.restore();
    ctx.save(); ctx.fillStyle = C.blue; ctx.globalAlpha = .9; ctx.beginPath(); ctx.moveTo(edge + slant, 0); ctx.lineTo(edge + slant + 26, 0); ctx.lineTo(edge - slant + 26, H); ctx.lineTo(edge - slant, H); ctx.closePath(); ctx.fill(); ctx.restore();
  } else if (type === 1) {
    ctx.beginPath(); ctx.arc(W / 2, H / 2, e * 1250, 0, 7); ctx.clip(); drawSceneI(i, lt); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.blue; ctx.lineWidth = 10 * (1 - e) + 2; ctx.globalAlpha = 1 - e * .6; ctx.beginPath(); ctx.arc(W / 2, H / 2, e * 1250, 0, 7); ctx.stroke(); ctx.restore();
  } else {
    const n = 8, w = W / n; ctx.beginPath();
    for (let j = 0; j < n; j++) { const f = clamp(e * 1.9 - j * .12, 0, 1); ctx.rect(j * w, 0, w * f + 1, H); }
    ctx.clip(); drawSceneI(i, lt); ctx.restore();
    ctx.save(); ctx.fillStyle = C.blue; for (let j = 0; j < n; j++) { const f = clamp(e * 1.9 - j * .12, 0, 1); if (f > 0 && f < 1) ctx.fillRect(j * w + w * f, 0, 5, H); } ctx.restore();
  }
}
function seek(t) {
  if (!window.__ready) throw new Error("not ready");
  t = clamp(t, 0, SC.total - 1e-6);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.clearRect(0, 0, W, H);
  const i = sceneIndex(t), lt = t - SS[i].start;
  if (i > 0 && lt < TR) transition(i, lt); else drawSceneI(i, lt);
  const hi = (i > 0 && lt < TR * .3) ? i - 1 : i, hlt = hi === i ? lt : SS[hi].dur + lt;
  drawChapter(ctx, t, SS[hi], hi === i ? lt : 99);
  drawQTag(ctx, hi === i ? lt : 99, SS[hi].n);
  drawSubtitle(ctx, t, SC);
  drawProgress(ctx, t, SC);
  const fo = eIn3(prog(t, SC.total - 0.9, 0.9));
  if (fo > 0) { ctx.fillStyle = "rgba(0,0,0," + fo + ")"; ctx.fillRect(0, 0, W, H); }
}
window.seek = seek;
init().then(() => { const q = new URLSearchParams(location.search); if (q.has("t")) seek(parseFloat(q.get("t"))); }).catch(e => { window.__error = String(e); console.error(e); });
