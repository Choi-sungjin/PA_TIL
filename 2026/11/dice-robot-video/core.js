/* core.js - 공통 유틸: 이징, 텍스트, 도형, 배경, HUD(챕터/자막/진행바) */
"use strict";
const W = 1920, H = 1080;
const C = {
  bg: "#0B1118", panel: "#141D27", panel2: "#1B2733", line: "#2B3947",
  paper: "#E8EDF3", muted: "#8B97A4", blue: "#6FA8FF", violet: "#B592EA",
  R: "#EF5A4F", Y: "#F0BC35", G: "#3DB671", ok: "#3DB671", bad: "#EF5A4F",
};
const CC = { R: C.R, Y: C.Y, G: C.G };
const CN = { R: "빨강", Y: "노랑", G: "초록" };
const F = '"Noto Sans KR", sans-serif';
const FM = '"JetBrains Mono", "Noto Sans KR", monospace';

/* ---------- math / easing ---------- */
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (lt, t0, d) => clamp((lt - t0) / d, 0, 1);
const eOut3 = u => 1 - Math.pow(1 - u, 3);
const eOut5 = u => 1 - Math.pow(1 - u, 5);
const eIn3 = u => u * u * u;
const eInOut = u => (u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const eBack = (u, s = 1.9) => { const c = s + 1, v = u - 1; return 1 + c * v * v * v + s * v * v; };
/* 감쇠 스프링(오버슈트). u:0..1 */
const spring = u => (u <= 0 ? 0 : u >= 1 ? 1 : 1 - Math.exp(-7 * u) * Math.cos(15 * u));
const pulse = (lt, t0, d = 0.9) => { const u = (lt - t0) / d; return u < 0 || u > 1 ? 0 : Math.sin(Math.PI * u); };
const hash01 = n => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const countUp = (lt, t0, d, to) => Math.round(to * eOut3(prog(lt, t0, d)));

/* ---------- drawing helpers ---------- */
function RR(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function T(ctx, s, x, y, o = {}) {
  ctx.save();
  ctx.font = `${o.w || 500} ${o.s || 32}px ${o.f || F}`;
  ctx.textAlign = o.a || "left"; ctx.textBaseline = o.b || "alphabetic";
  ctx.globalAlpha *= o.al == null ? 1 : o.al;
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.gb || 24; }
  ctx.fillStyle = o.c || C.paper;
  if (o.ls && "letterSpacing" in ctx) ctx.letterSpacing = o.ls + "px";
  ctx.fillText(s, x, y);
  ctx.restore();
}
/* 글자별 낙하·오버슈트 등장 키네틱 타이포 */
function KT(ctx, str, x, y, o) {
  const size = o.s || 80, w = o.w || 900, st = o.st == null ? 0.045 : o.st, t0 = o.t0 || 0, lt = o.lt;
  ctx.save();
  ctx.font = `${w} ${size}px ${o.f || F}`; ctx.textBaseline = o.b || "alphabetic";
  const chars = [...str], ws = chars.map(ch => ctx.measureText(ch).width + (o.ls || 0));
  const tot = ws.reduce((a, b) => a + b, 0);
  let cx = o.a === "center" ? x - tot / 2 : o.a === "right" ? x - tot : x;
  chars.forEach((ch, i) => {
    const u = prog(lt, t0 + i * st, 0.55);
    if (u > 0 && ch.trim()) {
      const e = eBack(u, 2.2);
      ctx.save();
      ctx.globalAlpha *= clamp(u * 3, 0, 1);
      ctx.translate(cx + ws[i] / 2, y + (1 - e) * (o.rise == null ? -60 : o.rise));
      const sc = 0.6 + 0.4 * e; ctx.scale(sc, sc);
      ctx.textAlign = "center"; ctx.fillStyle = o.c || C.paper;
      if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 30; }
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
    cx += ws[i];
  });
  ctx.restore();
  return tot;
}
const measure = (ctx, s, size, w = 500, f = F) => { ctx.save(); ctx.font = `${w} ${size}px ${f}`; const m = ctx.measureText(s).width; ctx.restore(); return m; };

function glowDot(ctx, x, y, r, col, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col); g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function card(ctx, x, y, w, h, o = {}) {
  ctx.save();
  RR(ctx, x, y, w, h, o.r == null ? 18 : o.r);
  ctx.fillStyle = o.fill || C.panel; ctx.fill();
  ctx.lineWidth = o.lw || 2; ctx.strokeStyle = o.stroke || C.line; ctx.stroke();
  if (o.bar) { ctx.save(); RR(ctx, x, y, w, h, o.r == null ? 18 : o.r); ctx.clip(); ctx.fillStyle = o.bar; ctx.fillRect(x, y, 7, h); ctx.restore(); }
  ctx.restore();
}
/* 퍽: 원기둥(원) / 직육면체(사각). 위에서 본 모양 */
function puck(ctx, x, y, r, col, shape, o = {}) {
  ctx.save(); ctx.globalAlpha *= o.al == null ? 1 : o.al;
  if (o.shadow !== false) { ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = r * 0.5; ctx.shadowOffsetY = r * 0.18; }
  ctx.fillStyle = col; ctx.strokeStyle = "rgba(0,0,0,.45)"; ctx.lineWidth = Math.max(1, r * 0.07);
  if (shape === "cube") { RR(ctx, x - r, y - r, 2 * r, 2 * r, r * 0.16); } else { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }
  ctx.fill(); ctx.shadowColor = "transparent"; ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.22)";
  if (shape === "cube") { RR(ctx, x - r * .66, y - r * .66, r * 1.32, r * 1.32, r * .1); } else { ctx.beginPath(); ctx.arc(x, y, r * .66, 0, Math.PI * 2); }
  ctx.fill();
  if (o.ring) {
    ctx.strokeStyle = o.ring; ctx.lineWidth = Math.max(2, r * 0.14);
    if (shape === "cube") RR(ctx, x - r - r * .22, y - r - r * .22, 2 * r + r * .44, 2 * r + r * .44, r * .3); else { ctx.beginPath(); ctx.arc(x, y, r * 1.22, 0, Math.PI * 2); }
    ctx.stroke();
  }
  if (o.label != null) { ctx.fillStyle = "rgba(10,14,18,.85)"; ctx.font = `700 ${Math.round(r * 0.8)}px ${FM}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(o.label, x, y + r * .04); }
  ctx.restore();
}
function drawArrow(ctx, x1, y1, x2, y2, col, lw = 4, head = 14) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2 - Math.cos(a) * head * .6, y2 - Math.sin(a) * head * .6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - head * Math.cos(a - .45), y2 - head * Math.sin(a - .45)); ctx.lineTo(x2 - head * Math.cos(a + .45), y2 - head * Math.sin(a + .45)); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* 주사위 눈 좌표 (mm, +Y = 위) */
const FACES = { 1: [[0, 0]], 2: [[-60, 60], [60, -60]], 3: [[-60, 60], [0, 0], [60, -60]], 4: [[-60, 60], [60, 60], [-60, -60], [60, -60]],
  5: [[-60, 60], [60, 60], [0, 0], [-60, -60], [60, -60]], 6: [[-60, 60], [-60, 0], [-60, -60], [60, 60], [60, 0], [60, -60]] };

/* ---------- background ---------- */
function drawBG(ctx, lt, glows = []) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  for (const g of glows) glowDot(ctx, g[0], g[1], g[2], g[3], g[4] == null ? 0.16 : g[4]);
  ctx.save(); ctx.fillStyle = "rgba(160,190,220,.07)";
  const off = (lt * 10) % 64;
  for (let gx = -64; gx < W + 64; gx += 64) for (let gy = -64; gy < H + 64; gy += 64) { ctx.beginPath(); ctx.arc(gx + off, gy + off * .5, 1.8, 0, 7); ctx.fill(); }
  ctx.restore();
  /* 떠다니는 입자(시드 고정) */
  ctx.save();
  for (let i = 0; i < 18; i++) {
    const px = (hash01(i + 1) * W + lt * (6 + hash01(i + 9) * 14)) % W, py = (hash01(i + 40) * H - lt * (8 + hash01(i + 5) * 10) + H * 4) % H;
    ctx.fillStyle = "rgba(111,168,255,.10)"; ctx.beginPath(); ctx.arc(px, py, 2 + hash01(i + 77) * 3, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function vignette(ctx) {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

/* ---------- HUD: 챕터 칩 / 자막 / 진행바 ---------- */
const CHAPTERS = [
  "인트로", "배치 · 퍽", "① 바코드 읽기", "② 신호등 12회 관측", "③④ 횟수 계산 · 그룹 배정", "⑤ 전체 할당 계획", "⑥ 집기 · 이동 · 놓기", "⑥ 주사위 눈 배치", "⑦⑧ 재검증 · 복귀", "채점 100점", "오류 정지 · 마무리",
];
function drawChapter(ctx, t, sc, lt) {
  const u = spring(prog(lt, 0.15, 0.7)), n = sc.n;
  ctx.save();
  ctx.translate(48 - (1 - u) * 80, 36); ctx.globalAlpha = clamp(u * 2, 0, 1);
  RR(ctx, 0, 0, 74, 48, 12); ctx.fillStyle = C.blue; ctx.fill();
  T(ctx, String(n).padStart(2, "0"), 37, 25, { f: FM, w: 700, s: 28, c: "#07101A", a: "center", b: "middle" });
  T(ctx, CHAPTERS[n - 1], 92, 25, { w: 700, s: 30, c: C.paper, b: "middle" });
  ctx.restore();
}
function drawQTag(ctx, lt, n) {
  if (n < 3) return;
  ctx.save(); ctx.globalAlpha = clamp(lt * 1.2, 0, 1) * 0.95;
  const label = "공개 연습 문제 Q1 · P2-01 · 오름차순";
  const w = measure(ctx, label, 22, 500) + 36;
  RR(ctx, W - 48 - w, 40, w, 42, 21); ctx.fillStyle = "rgba(111,168,255,.12)"; ctx.fill(); ctx.strokeStyle = "rgba(111,168,255,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
  T(ctx, label, W - 48 - w / 2, 62, { s: 22, w: 500, c: C.blue, a: "center", b: "middle" });
  ctx.restore();
}
function drawProgress(ctx, t, SC) {
  const total = SC.total, y = H - 14;
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(0, y, W, 6);
  ctx.fillStyle = C.blue; ctx.fillRect(0, y, W * clamp(t / total, 0, 1), 6);
  for (const s of SC.scenes) { ctx.fillStyle = "rgba(11,17,24,.9)"; ctx.fillRect(s.start / total * W - 1, y, 2, 6); }
  const hx = W * clamp(t / total, 0, 1);
  glowDot(ctx, hx, y + 3, 16, C.blue, 0.8);
  ctx.restore();
}
/* 자막: 문장 단위로 tts 길이 비례 배분 */
const _subCache = {};
function subFor(ctx, entry) {
  if (_subCache[entry.id]) return _subCache[entry.id];
  const sents = entry.text.split(/(?<=[.?!])\s+/).filter(Boolean);
  const wts = sents.map(s => s.length), tot = wts.reduce((a, b) => a + b, 0);
  let acc = 0; const arr = sents.map((s, i) => { const f0 = acc / tot; acc += wts[i]; return { s, f0, f1: acc / tot }; });
  /* 줄바꿈 */
  const maxW = 1560;
  for (const q of arr) {
    let size = 40; ctx.save(); ctx.font = `500 ${size}px ${F}`;
    const words = q.s.split(" "); let lines = [], cur = "";
    for (const wd of words) { const tr = cur ? cur + " " + wd : wd; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = tr; }
    if (cur) lines.push(cur);
    if (lines.length > 2) { size = 34; ctx.font = `500 ${size}px ${F}`; lines = []; cur = ""; for (const wd of words) { const tr = cur ? cur + " " + wd : wd; if (ctx.measureText(tr).width > maxW && cur) { lines.push(cur); cur = wd; } else cur = tr; } if (cur) lines.push(cur); }
    q.lines = lines; q.size = size; ctx.restore();
  }
  return _subCache[entry.id] = arr;
}
function drawSubtitle(ctx, t, SC) {
  let item = null;
  for (const sc of SC.scenes) for (const it of sc.items) if (t >= it.start && t < it.start + it.slot) item = it;
  if (!item) return;
  const entry = SC.script.find(e => e.id === item.id);
  const narr0 = item.start + SC.lead, narrLen = item.slot - 0.6; /* 음성 구간 */
  const p = (t - narr0) / narrLen;
  const sents = subFor(ctx, entry);
  let cur = sents[0];
  for (const q of sents) if (p >= q.f0 - 0.001) cur = q;
  if (p < 0 && t - item.start < SC.lead) cur = null;
  if (!cur) return;
  const t0 = narr0 + cur.f0 * narrLen;
  const u = prog(t, t0 - 0.05, 0.28); if (u <= 0 && p >= 0) { }
  const lines = cur.lines, lh = cur.size * 1.42, bh = lines.length * lh + 30;
  const widths = lines.map(l => measure(ctx, l, cur.size, 500)), bw = Math.max(...widths) + 76;
  const by = 1034 - bh, bx = (W - bw) / 2;
  const a = eOut3(clamp((t - Math.max(item.start, t0 - 0.05)) / 0.28, 0, 1)) * (1 - eIn3(prog(t, item.start + item.slot - 0.25, 0.25)));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 14);
  RR(ctx, bx, by, bw, bh, 20); ctx.fillStyle = "rgba(8,12,17,.78)"; ctx.fill(); ctx.strokeStyle = "rgba(111,168,255,.28)"; ctx.lineWidth = 1.5; ctx.stroke();
  lines.forEach((l, i) => T(ctx, l, W / 2, by + 15 + lh * (i + 0.5), { s: cur.size, w: 500, c: C.paper, a: "center", b: "middle" }));
  ctx.restore();
}

/* ---------- camera ---------- */
/* keys: [[t, fx, fy, z], ...]  (화면 좌표 초점, 배율) — 장면 전체 변환 */
function camAt(keys, lt) {
  if (lt <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
  for (let i = 1; i < keys.length; i++) {
    if (lt <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], u = eInOut(clamp((lt - a[0]) / (b[0] - a[0]), 0, 1));
      return { x: lerp(a[1], b[1], u), y: lerp(a[2], b[2], u), z: lerp(a[3], b[3], u) };
    }
  }
  const l = keys[keys.length - 1]; return { x: l[1], y: l[2], z: l[3] };
}
function withCam(ctx, cam, fn) {
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(cam.z, cam.z); ctx.translate(-cam.x, -cam.y);
  fn(); ctx.restore();
}
