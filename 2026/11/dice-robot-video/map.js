/* map.js - 맵/로봇 그리기 + 시뮬레이션 타임라인 (좌표·벽·로직은 plan.js = ref HTML 재사용) */
"use strict";
const P = window.PLAN;
const ZONE = P.ZONE, PLAT = P.PLATFORM;
const D435 = { near: P.CAM.h / Math.tan((P.CAM.pitch + P.CAM.vfov / 2) * Math.PI / 180), far: 1200, ta: Math.tan(P.CAM.hfov / 2 * Math.PI / 180) };
const pocketAng = (k, phi) => (180 - 30 * k + phi) * Math.PI / 180;

/* 월드 → 화면 */
function mkView(V) {
  V.wx = x => V.x + V.w / 2 + (x - V.cx) * V.s;
  V.wy = y => V.y + V.h / 2 - (y - V.cy) * V.s;
  return V;
}
const A = (x, i) => (Array.isArray(x) ? (x[i] == null ? 1 : x[i]) : (x == null ? 1 : x));

/* ---------- 로봇: 카메라 + 집게를 가진 일반 자율주행 로봇 (발제에 없는 사양은 그리지 않음) ----------
   이미 translate(sx,sy) scale(s,-s) rotate(h) 가 적용된 mm 좌표계(+x = 전방)에서 그림.
   o: cone(카메라 시야 알파), tip({x,y} 집게 끝, 기본=접힘), holding({c,s}), scan(카메라 링 알파) */
function robotBody(ctx, s, o = {}) {
  const L = px => px / s, FOOT = P.FOOT;
  ctx.save();
  if (o.cone) {
    ctx.save(); ctx.globalAlpha *= o.cone; const cx0 = 120;
    const g = ctx.createLinearGradient(cx0, 0, cx0 + 1300, 0);
    g.addColorStop(0, "rgba(181,146,234,.38)"); g.addColorStop(1, "rgba(181,146,234,.05)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0 + 1300, -880); ctx.lineTo(cx0 + 1300, 880); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(181,146,234,.8)"; ctx.lineWidth = L(1.5); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = "#3A4A5B";
  for (const sg of [-1, 1]) { RR(ctx, -60, sg > 0 ? 140 : -172, 120, 32, 8); ctx.fill(); }
  RR(ctx, FOOT.xb, -FOOT.hw, FOOT.xf - FOOT.xb, 2 * FOOT.hw, 30);
  ctx.fillStyle = o.bodyFill || "#18222D"; ctx.fill(); ctx.strokeStyle = o.stroke || "#9FB3C8"; ctx.lineWidth = Math.max(L(2), 3); ctx.stroke();
  ctx.fillStyle = "#223140"; RR(ctx, FOOT.xb + 40, -90, 190, 180, 24); ctx.fill();
  /* 집게 */
  const tip = o.tip || { x: FOOT.xf + 40, y: 0 }, bx = FOOT.xf - 20;
  const dx = tip.x - bx, dy = tip.y, len = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy, dx);
  ctx.save(); ctx.translate(bx, 0); ctx.rotate(ang);
  ctx.strokeStyle = "#D9E2EC"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(L(5), 18);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, 0); ctx.stroke();
  const open = o.open == null ? .5 : o.open, pw = 18 + 24 * open;
  ctx.lineWidth = Math.max(L(3.5), 12);
  for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(len - 6, sg * 8); ctx.lineTo(len - 6, sg * pw); ctx.lineTo(len + 44, sg * pw); ctx.stroke(); }
  ctx.restore();
  if (o.holding) { const hx = bx + Math.cos(ang) * (len + 6), hy = Math.sin(ang) * (len + 6); puck(ctx, hx, hy, 24, CC[o.holding.c], o.holding.s, { shadow: false, ring: o.holding.ring }); }
  /* 카메라 */
  ctx.save(); ctx.fillStyle = C.violet; RR(ctx, 70, -42, 56, 84, 12); ctx.fill();
  ctx.fillStyle = "#0B1118"; ctx.beginPath(); ctx.arc(116, 0, 16, 0, 7); ctx.fill();
  if (o.scan) { ctx.strokeStyle = C.violet; ctx.globalAlpha *= o.scan; ctx.lineWidth = Math.max(L(2), 4); ctx.beginPath(); ctx.arc(116, 0, 50 + 18 * Math.sin((o.scanPhase || 0) * 6), 0, 7); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.moveTo(FOOT.xf - 90, 0); ctx.lineTo(FOOT.xf - 130, -26); ctx.lineTo(FOOT.xf - 130, 26); ctx.closePath(); ctx.fill();
  ctx.restore();
}
/* 로봇 로컬 좌표(mm) → 월드 */
const r2w = (pose, q) => P.toMap(pose, q);

/* ---------- 맵 그리기 ---------- */
function drawMapView(ctx, V, st = {}) {
  mkView(V);
  const s = V.s, wx = V.wx, wy = V.wy;
  ctx.save();
  RR(ctx, V.x, V.y, V.w, V.h, 22); ctx.clip();
  ctx.fillStyle = "#0E151C"; ctx.fillRect(V.x, V.y, V.w, V.h);
  /* 격자 500mm */
  ctx.strokeStyle = "rgba(160,190,220,.07)"; ctx.lineWidth = 1; ctx.beginPath();
  for (let x = 0; x <= P.MAP.W; x += 500) { ctx.moveTo(wx(x), wy(0)); ctx.lineTo(wx(x), wy(P.MAP.H)); }
  for (let y = 0; y <= P.MAP.H; y += 500) { ctx.moveTo(wx(0), wy(y)); ctx.lineTo(wx(P.MAP.W), wy(y)); }
  ctx.stroke();
  /* 맵 바닥 */
  ctx.fillStyle = "rgba(111,168,255,.035)"; ctx.fillRect(wx(0), wy(P.MAP.H), P.MAP.W * s, P.MAP.H * s);
  /* 출발·복귀 구역 */
  const za = A(st.zoneA, 0);
  if (za > 0) {
    ctx.save(); ctx.globalAlpha = za;
    ctx.fillStyle = "rgba(111,168,255,.13)"; ctx.fillRect(wx(ZONE.x0), wy(ZONE.y1), (ZONE.x1 - ZONE.x0) * s, (ZONE.y1 - ZONE.y0) * s);
    ctx.setLineDash([8, 6]); ctx.strokeStyle = C.blue; ctx.lineWidth = 2; ctx.strokeRect(wx(ZONE.x0), wy(ZONE.y1), (ZONE.x1 - ZONE.x0) * s, (ZONE.y1 - ZONE.y0) * s); ctx.setLineDash([]);
    if (st.labels !== false) T(ctx, "출발 · 복귀", wx((ZONE.x0 + ZONE.x1) / 2), wy(ZONE.y0) + 8, { s: clamp(s * 90, 15, 30), w: 700, c: C.blue, a: "center", b: "top" });
    ctx.restore();
  }
  /* 중앙 받침대 */
  const pa = A(st.platA, 0);
  if (pa > 0) {
    ctx.save(); ctx.globalAlpha = pa;
    ctx.fillStyle = "rgba(139,151,164,.18)"; ctx.fillRect(wx(PLAT.x0), wy(PLAT.y1), (PLAT.x1 - PLAT.x0) * s, (PLAT.y1 - PLAT.y0) * s);
    ctx.strokeStyle = "rgba(139,151,164,.6)"; ctx.lineWidth = 1.5; ctx.strokeRect(wx(PLAT.x0), wy(PLAT.y1), (PLAT.x1 - PLAT.x0) * s, (PLAT.y1 - PLAT.y0) * s);
    if (st.labels !== false && s > 0.1) T(ctx, "중앙 받침대", wx(2202), wy(3250), { s: clamp(s * 80, 13, 24), c: C.muted, a: "center" });
    ctx.restore();
  }
  /* 벽 */
  const wp = st.wallsP == null ? 1 : st.wallsP;
  ctx.save(); ctx.strokeStyle = "#A8B6C4"; ctx.lineCap = "round"; ctx.lineWidth = Math.max(3, 40 * s);
  const bx0 = wx(0), by0 = wy(P.MAP.H), bw = P.MAP.W * s, bh = P.MAP.H * s;
  const per = 2 * (bw + bh), ou = clamp(wp * 2.2, 0, 1);
  if (ou > 0) {
    ctx.beginPath(); const pts = [[bx0, by0 + bh], [bx0, by0], [bx0 + bw, by0], [bx0 + bw, by0 + bh], [bx0, by0 + bh]];
    let rem = per * ou; ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length && rem > 0; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b[0] - a[0], b[1] - a[1]), u = Math.min(1, rem / l); ctx.lineTo(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u); rem -= l; }
    ctx.stroke();
  }
  const WL = P.WALLS, nW = WL.length;
  ctx.beginPath();
  WL.forEach(([x1, y1, x2, y2], i) => {
    const u = clamp((wp - 0.15) / 0.85 * (nW + 3) - i, 0, 1); if (u <= 0) return;
    ctx.moveTo(wx(x1), wy(y1)); ctx.lineTo(wx(lerp(x1, x2, eOut3(u))), wy(lerp(y1, y2, eOut3(u))));
  });
  ctx.stroke();
  ctx.fillStyle = "#A8B6C4";
  if (wp > 0.9) WL.forEach(([x1, y1, x2, y2]) => { for (const [x, y] of [[x1, y1], [x2, y2]]) { ctx.beginPath(); ctx.arc(wx(x), wy(y), Math.max(2.4, 38 * s), 0, 7); ctx.fill(); } });
  ctx.restore();
  /* 신호등 · 바코드 */
  const da = A(st.devA, 0);
  if (da > 0) {
    ctx.save(); ctx.globalAlpha = da;
    const lc = st.lamp ? CC[st.lamp] : null;
    if (lc) glowDot(ctx, wx(80), wy(950), Math.max(30, 380 * s), lc, 0.9);
    ctx.fillStyle = "#33414F"; ctx.fillRect(wx(30), wy(1020), Math.max(7, 100 * s), 140 * s);
    ctx.fillStyle = lc || "#56677A"; ctx.beginPath(); ctx.arc(wx(80), wy(950), Math.max(5, 56 * s), 0, 7); ctx.fill();
    ctx.fillStyle = "#E8EDF3";
    for (let k = 0; k < 7; k++) ctx.fillRect(wx(40) + k * Math.max(2.2, 18 * s), wy(650 + 50), Math.max(1.4, (k % 2 ? 7 : 12) * s), 100 * s);
    if (st.labels !== false) {
      const fs = clamp(s * 110, 14, 26);
      T(ctx, "신호등", wx(80) + 10 * 0, wy(1130), { s: fs, w: 700, c: lc || C.paper, a: "left" });
      T(ctx, "바코드", wx(80), wy(520), { s: fs, w: 700, c: C.paper, a: "left", b: "top" });
    }
    ctx.restore();
  }
  /* 시작 박스 */
  P.BOXES.forEach((b, i) => {
    const a = A(st.boxesA, i); if (a <= 0) return;
    const sc = spring(a), hi = st.boxHi ? (st.boxHi[i] || 0) : 0;
    ctx.save(); ctx.translate(wx(b.x), wy(b.y)); ctx.scale(sc, sc); ctx.globalAlpha = clamp(a * 2.5, 0, 1);
    const hw = 102.5 * s;
    RR(ctx, -hw, -hw, 2 * hw, 2 * hw, 5); ctx.fillStyle = hi ? "rgba(111,168,255,.28)" : "#18222D"; ctx.fill();
    ctx.strokeStyle = hi ? C.blue : "#66788B"; ctx.lineWidth = hi ? 3 : 1.6; ctx.stroke();
    if (hi) { ctx.strokeStyle = "rgba(111,168,255," + (0.6 * hi) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, hw * (1.4 + 0.5 * hi), 0, 7); ctx.stroke(); }
    ctx.restore();
    if (st.labels !== false) T(ctx, "S" + (i + 1), wx(b.x), wy(b.y) - 102.5 * s - 5, { s: clamp(s * 100, 14, 28), w: 700, c: hi ? C.blue : C.muted, a: "center", al: clamp(a * 2, 0, 1) });
  });
  /* 장소 L1~L3 */
  P.LOCS.forEach((l, i) => {
    const a = A(st.locsA, i); if (a <= 0) return;
    const sc = spring(a), done = st.locDone ? st.locDone[i] : 0, hi = st.locHi ? (st.locHi[i] || 0) : 0;
    const hw = 102.5 * s;
    ctx.save(); ctx.translate(wx(l.x), wy(l.y)); ctx.scale(sc, sc); ctx.globalAlpha = clamp(a * 2.5, 0, 1);
    RR(ctx, -hw, -hw, 2 * hw, 2 * hw, 5); ctx.fillStyle = "rgba(111,168,255,.16)"; ctx.fill();
    ctx.strokeStyle = C.blue; ctx.lineWidth = (done || hi) ? 3 : 1.8; ctx.stroke();
    if (hi) { ctx.strokeStyle = "rgba(111,168,255," + (0.7 * hi) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, hw * (1.5 + 0.7 * hi), 0, 7); ctx.stroke(); }
    ctx.fillStyle = "rgba(111,168,255,.55)";
    for (const dx of [-60, 0, 60]) for (const dy of [-60, 0, 60]) { ctx.beginPath(); ctx.arc(dx * s, -dy * s, Math.max(0.9, 6 * s), 0, 7); ctx.fill(); }
    ctx.restore();
    if (st.labels !== false) T(ctx, l.k, wx(l.x), wy(l.y) - 102.5 * s - 5, { s: clamp(s * 110, 15, 30), w: 900, c: C.blue, a: "center", al: clamp(a * 2, 0, 1) });
  });
  /* 궤적 */
  for (const tr of (st.trails || [])) {
    if (!tr.pts || tr.pts.length < 2) continue;
    ctx.save(); ctx.strokeStyle = tr.col || C.blue; ctx.lineWidth = tr.lw || 3.5; ctx.globalAlpha = tr.al == null ? 0.85 : tr.al; ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (tr.dash) ctx.setLineDash(tr.dash);
    ctx.shadowColor = tr.col || C.blue; ctx.shadowBlur = tr.glow == null ? 10 : tr.glow;
    ctx.beginPath(); tr.pts.forEach((p, i) => (i ? ctx.lineTo(wx(p.x), wy(p.y)) : ctx.moveTo(wx(p.x), wy(p.y)))); ctx.stroke(); ctx.restore();
  }
  /* 표시 링 */
  for (const m of (st.marks || [])) {
    ctx.save(); ctx.strokeStyle = m.col || C.blue; ctx.lineWidth = m.lw || 3; ctx.globalAlpha = (m.al == null ? 1 : m.al) * (1 - m.u);
    ctx.beginPath(); ctx.arc(wx(m.x), wy(m.y), (m.r0 || 60) * s + m.u * (m.r || 400) * s, 0, 7); ctx.stroke(); ctx.restore();
  }
  /* 퍽 */
  for (const p of (st.pucks || [])) {
    const r = Math.max(15 * s, st.puckMin == null ? 4.5 : st.puckMin);
    puck(ctx, wx(p.x), wy(p.y), r * (p.sc == null ? 1 : p.sc), CC[p.c], p.s, { al: p.al, ring: p.ring, shadow: false });
  }
  /* 로봇 */
  if (st.robot) {
    const rb = st.robot, ps = rb.pose;
    ctx.save();
    ctx.translate(wx(ps.x), wy(ps.y)); ctx.scale(s, -s); ctx.rotate(ps.h);
    robotBody(ctx, s, rb.o || {});
    ctx.restore();
  }
  /* 월드 좌표 텍스트 */
  for (const tx of (st.texts || [])) T(ctx, tx.t, wx(tx.x), wy(tx.y), tx.o || {});
  ctx.restore();
  /* 테두리 */
  ctx.save(); RR(ctx, V.x, V.y, V.w, V.h, 22); ctx.strokeStyle = st.border || C.line; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
}

/* ---------- 시뮬레이션 타임라인 (ref TL 포팅, 속도 파라미터화) ---------- */
class TL {
  constructor(p, V, OM) { this.V = V; this.OM = OM; this.p0 = { ...p }; this.pose = { ...p }; this.t = 0; this.prims = []; this.ev = []; this.moves = []; }
  wait(d) { if (d <= 0) return; const q = this.pose; this.prims.push({ type: "w", t0: this.t, t1: this.t + d, x: q.x, y: q.y, h: q.h }); this.t += d; }
  rotTo(h) {
    const dh = P.angN(h - this.pose.h); if (Math.abs(dh) < .004) return;
    const d = Math.abs(dh) / this.OM + .15; this.prims.push({ type: "r", t0: this.t, t1: this.t + d, x: this.pose.x, y: this.pose.y, h0: this.pose.h, dh });
    this.t += d; this.pose.h = P.angN(this.pose.h + dh);
  }
  lineTo(x, y) {
    const L = Math.hypot(x - this.pose.x, y - this.pose.y); if (L < 2) return;
    this.rotTo(Math.atan2(y - this.pose.y, x - this.pose.x));
    const d = L / this.V + .2; this.prims.push({ type: "l", t0: this.t, t1: this.t + d, x0: this.pose.x, y0: this.pose.y, x1: x, y1: y, h: this.pose.h });
    this.t += d; this.pose.x = x; this.pose.y = y;
  }
  follow(pts) { for (const p of pts.slice(1)) this.lineTo(p.x, p.y); }
  event(kind, d, data) { const e = { kind, t0: this.t, t1: this.t + d, ...data }; this.ev.push(e); this.wait(d); return e; }
  poseAt(t) {
    const Pm = this.prims; if (!Pm.length || t <= Pm[0].t0) return { ...this.p0 };
    let lo = 0, hi = Pm.length - 1;
    const fin = p => (p.type === "l" ? { x: p.x1, y: p.y1, h: p.h } : p.type === "r" ? { x: p.x, y: p.y, h: P.angN(p.h0 + p.dh) } : { x: p.x, y: p.y, h: p.h });
    if (t >= Pm[hi].t1) return fin(Pm[hi]);
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (Pm[m].t0 <= t) lo = m; else hi = m - 1; }
    const p = Pm[lo], u = P.ease(clamp((t - p.t0) / (p.t1 - p.t0), 0, 1));
    if (p.type === "l") return { x: lerp(p.x0, p.x1, u), y: lerp(p.y0, p.y1, u), h: p.h };
    if (p.type === "r") return { x: p.x, y: p.y, h: P.angN(p.h0 + p.dh * u) };
    return { x: p.x, y: p.y, h: p.h };
  }
  /* 시각 t 까지의 이동 궤적(월드 점 목록) */
  trailTo(t, step = 0.25, from = 0) {
    const out = []; for (let k = from; k < t; k += step) { const p = this.poseAt(k); out.push({ x: p.x, y: p.y }); }
    const p = this.poseAt(t); out.push({ x: p.x, y: p.y }); return out;
  }
}

/* ---------- 퍽 구성 / 할당 (ref Q1_COMP 와 동일: 설명용 예시 구성 R6·G6) ---------- */
const Q1_SEQ = "RGRRGRGGYGYG".split("");
const Q1_COMP = [["R", "cyl"], ["G", "cube"], ["R", "cube"], ["G", "cyl"], ["R", "cyl"], ["G", "cube"], ["R", "cube"], ["G", "cyl"], ["R", "cyl"], ["G", "cyl"], ["R", "cube"], ["G", "cube"]].map(([c, s], id) => ({ id, c, s }));
const Q1_CNT = { R: 4, Y: 2, G: 6 };
/* 할당: ref solveAlloc 와 동일 로직 → Y = 빨강 원기둥 id 0,4 */
function solveAlloc(comp, cnt) {
  const reds = comp.filter(p => p.c === "R"), greens = comp.filter(p => p.c === "G");
  const yr = reds.length - cnt.R, yg = greens.length - cnt.G;
  for (const s of ["cyl", "cube"]) {
    const hr = reds.filter(p => p.s === s).length, hg = greens.filter(p => p.s === s).length;
    if (yr >= 0 && yg >= 0 && hr >= yr && hg >= yg) {
      const Y = [...reds.filter(p => p.s === s).slice(0, yr), ...greens.filter(p => p.s === s).slice(0, yg)];
      const ys = new Set(Y.map(p => p.id)); const grp = {};
      for (const p of comp) grp[p.id] = ys.has(p.id) ? "Y" : p.c;
      return { ok: true, s, grp };
    }
  }
  return { ok: false };
}
const Q1_ALLOC = solveAlloc(Q1_COMP, Q1_CNT);
const Q1_SORTED = [{ c: "Y", n: 2 }, { c: "R", n: 4 }, { c: "G", n: 6 }]; /* 오름차순(P2-01): L1,L2,L3 */
const homeOf = id => { const b = P.BOXES[Math.floor(id / 2)]; return { x: b.x + (id % 2 ? 40 : -40), y: b.y }; };
