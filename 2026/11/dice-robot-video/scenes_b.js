/* scenes_b.js - 장면 6~11 (공식 발제 v5 기준 콘텐츠) */
"use strict";

/* ---------- 공통 ---------- */
const LOC_N = [2, 4, 6];                                 /* Q1: L1=Y2, L2=R4, L3=G6 */
const SORT_GRP = { 0: "Y", 1: "R", 2: "G" };
const GRP_IDS = { Y: [0, 4], R: [2, 6, 8, 10], G: [1, 3, 5, 7, 9, 11] }; /* 예제 구성(빨6·초6)의 할당 결과 */
const LOC_ID = [12, 13, 14];
function tick(ctx, x, y, r, col = C.ok, lw = 5) { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(x - r * .5, y + r * .02); ctx.lineTo(x - r * .12, y + r * .4); ctx.lineTo(x + r * .55, y - r * .38); ctx.stroke(); ctx.restore(); }
function ringProg(ctx, x, y, r, u, col, lw = 8) { ctx.save(); ctx.lineCap = "round"; ctx.strokeStyle = "rgba(255,255,255,.1)"; ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); ctx.stroke(); ctx.restore(); }
function badge(ctx, x, y, txt, col, size = 26, a = 1) { const w = measure(ctx, txt, size, 900) + 44; ctx.save(); ctx.globalAlpha *= a; RR(ctx, x - w / 2, y - size, w, size * 2, size); ctx.fillStyle = "rgba(11,17,24,.92)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke(); T(ctx, txt, x, y + 1, { w: 900, s: size, a: "center", b: "middle", c: col }); ctx.restore(); }

/* ============ 장면 6: 전체 할당 계획 ============ */
SCENES[6] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[420, 420, 560, C.blue, .10], [1450, 480, 560, C.violet, .07]]);
  const cam = camAt([[0, 700, 440, 1.12], [S.B(.1), 960, 540, 1.0], [S.dur, 965, 545, 1.02]], lt);
  const poolPos = id => ({ x: 190 + (id % 4) * 125, y: 238 + Math.floor(id / 4) * 118 });
  const laneY = [255, 475, 695], laneX = i => 1196 + 112 * i;
  const LANE = { Y: 0, R: 1, G: 2 }, fly = {};
  const sched = { G: S.B(.70), R: S.B(.80), Y: S.B(.90) };
  for (const g of ["G", "R", "Y"]) GRP_IDS[g].forEach((id, i) => { fly[id] = { t0: sched[g] + i * .1, g, slot: i }; });
  withCam(ctx, cam, () => {
    T(ctx, "시작 박스에서 인식한 퍽 12개", 100, 150, { w: 700, s: 26 });
    T(ctx, "설명용 예시 구성: 빨강 6 · 초록 6", 100, 184, { s: 21, c: C.muted });
    for (let id = 0; id < 12; id++) { const p = poolPos(id); ctx.beginPath(); ctx.arc(p.x, p.y, 46, 0, 7); ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 2; ctx.stroke(); }
    ["Y", "R", "G"].forEach(g => {
      const i = LANE[g], y = laneY[i], u = spring(prog(lt, S.B(.62) + i * .04, .6)); if (u <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1); ctx.translate((1 - u) * 160, 0);
      card(ctx, 830, y - 90, 1030, 180, { r: 24, bar: CC[g], fill: "rgba(20,29,39,.9)" });
      T(ctx, `L${i + 1}`, 872, y - 18, { f: FM, w: 700, s: 52, c: C.blue }); T(ctx, `${CN[g]} ${Q1_CNT[g]}`, 872, y + 40, { w: 900, s: 40, c: CC[g] });
      for (let k = 0; k < Q1_CNT[g]; k++) { ctx.beginPath(); ctx.arc(laneX(k), y, 42, 0, 7); ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.setLineDash([6, 6]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); }
      ctx.restore();
    });
    for (let id = 0; id < 12; id++) {
      const src = Q1_COMP[id], pp = poolPos(id), f = fly[id], g = f.g;
      const appear = spring(prog(lt, .15 + id * .05, .5)); if (appear <= 0) continue;
      const u = prog(lt, f.t0, .75), e = eInOut(u), tx = laneX(f.slot), ty = laneY[LANE[g]];
      const x = lerp(pp.x, tx, e), y = lerp(pp.y, ty, e) - Math.sin(Math.PI * e) * 90;
      const sc = u >= 1 ? 1 + .22 * pulse(lt, f.t0 + .75, .5) : 1 + .25 * Math.sin(Math.PI * u);
      let ring = null;
      if (g === "Y" && lt >= S.B(.86)) ring = C.Y;
      if (g === "Y" && lt >= S.B(.64) && lt < S.B(.86)) ring = "#FFFFFF";
      puck(ctx, x, y, 36 * appear * sc, CC[src.c], src.s, { ring, label: id });
    }
    const rulesA = 1 - eOut3(prog(lt, S.B(.40), .5));
    if (rulesA > .01) {
      [["R", "빨강 그룹", "= 빨강 퍽만", .02], ["G", "초록 그룹", "= 초록 퍽만", .09], ["Y", "노랑 그룹", "= 색 무관, 한 모양으로 통일", .16]].forEach(([c, a, b, f], i) => {
        const u = spring(prog(lt, S.B(f), .6)); if (u <= 0) return; const y = 560 + i * 72;
        ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1) * rulesA; ctx.translate(-(1 - u) * 120, 0);
        card(ctx, 90, y, 680, 62, { r: 31, fill: "rgba(20,29,39,.92)", stroke: CC[c] });
        ctx.fillStyle = CC[c]; ctx.beginPath(); ctx.arc(130, y + 31, 20, 0, 7); ctx.fill(); T(ctx, c, 130, y + 33, { f: FM, w: 700, s: 24, a: "center", b: "middle", c: "#0B1118" });
        T(ctx, a, 168, y + 33, { w: 900, s: 28, b: "middle", c: CC[c] }); T(ctx, b, 168 + measure(ctx, a, 28, 900) + 12, y + 33, { s: 24, b: "middle", c: C.paper });
        ctx.restore();
      });
    }
    const bu = spring(prog(lt, S.B(.30), .7));
    if (bu > 0) badge(ctx, 430, 790, "전체 할당을 먼저 계획", C.Y, 28, clamp(bu * 2, 0, 1));
    const exA = eOut3(prog(lt, S.B(.40), .5)) * (1 - eOut3(prog(lt, S.B(.64), .5)));
    if (exA > .01) {
      ctx.save(); ctx.globalAlpha *= exA; const x0 = 100, y0 = 585;
      T(ctx, "발제 예", x0, y0, { w: 900, s: 28, c: C.Y }); T(ctx, "※ 설명용 도식", x0 + 120, y0, { s: 20, c: C.muted });
      for (let i = 0; i < 8; i++) puck(ctx, x0 + 22 + i * 44, y0 + 52, 17, C.R, i < 3 ? "cyl" : (i % 2 ? "cube" : "cyl"), { ring: i < 3 ? C.Y : null, shadow: false });
      for (let i = 0; i < 4; i++) puck(ctx, x0 + 22 + (8 + i) * 44 + 10, y0 + 52, 17, C.G, i % 2 ? "cube" : "cyl", { shadow: false });
      T(ctx, "빨강 8 · 초록 4  (같은 모양 빨강 3개)", x0, y0 + 100, { s: 23, c: C.paper });
      const q = spring(prog(lt, S.B(.50), .6)); ctx.save(); ctx.globalAlpha *= clamp(q * 2, 0, 1);
      T(ctx, "→  R 5   Y 3   G 4", x0, y0 + 146, { f: FM, w: 700, s: 34, c: C.Y }); ctx.restore();
      ctx.restore();
    }
    const q1 = spring(prog(lt, S.B(.64), .7));
    if (q1 > 0) { ctx.save(); ctx.globalAlpha *= clamp(q1 * 2, 0, 1); T(ctx, "Q1 설명용 예시: G6 = 초록 전부 · R4 = 빨강 4 · Y2 = 같은 모양 빨강 2", 100, 610, { s: 22, c: C.Y }); ctx.restore(); }
  });
};

/* ============ 장면 7: 집기 · 이동 · 놓기 (왕복 3번 + 타임랩스) ============ */
let _TR = null;
function getTrips() {
  if (_TR) return _TR;
  const tl = new TL({ x: P.START.x, y: P.START.y, h: Math.PI }, 3000, 5);
  const order = [0, 2, 3, 1, 4, 5, 6, 7, 8, 9, 10, 11], cnt = [0, 0, 0], inv = { Y: 0, R: 1, G: 2 }; let cur = "S"; const trips = [];
  for (const id of order) {
    const box = Math.floor(id / 2), bk = "B" + box, li = inv[Q1_ALLOC.grp[id]], lk = "L" + li;
    if (cur !== bk) { tl.follow(P.pathBetween(cur, bk)); cur = bk; } tl.rotTo(P.KEYS[bk].h);
    const prevEnd = trips.length ? trips[trips.length - 1].place1 : 0, start = tl.t, pose1 = { ...tl.pose }, pick = tl.event("pick", 1.0, { id });
    tl.follow(P.pathBetween(cur, lk)); cur = lk; tl.rotTo(P.KEYS[lk].h);
    const slot = cnt[li]++, [dx, dy] = FACES[LOC_N[li]][slot], L = P.LOCS[li], pose2 = { ...tl.pose }, place = tl.event("place", 1.0, { id });
    trips.push({ id, box, li, slot, prevEnd, start, pick0: pick.t0, pick1: pick.t1, place0: place.t0, place1: place.t1, pose1, pose2, pip: { x: L.x + dx, y: L.y + dy } });
  }
  return _TR = { tl, trips, T: tl.t, simA: trips[2].place1 };
}
const TRV = { a0: 1.4, dA: 11.0, dB: 6.5 };
function tripSim(lt) {
  const R = getTrips(), a1 = TRV.a0 + TRV.dA, b1 = a1 + TRV.dB;
  if (lt <= TRV.a0) return 0;
  if (lt <= a1) return (lt - TRV.a0) / TRV.dA * R.simA;
  if (lt <= b1) return R.simA + (lt - a1) / TRV.dB * (R.T - R.simA);
  return R.T;
}
SCENES[7] = (ctx, lt, S) => {
  const R = getTrips(), ts = tripSim(lt), a1 = TRV.a0 + TRV.dA;
  drawBG(ctx, lt, [[560, 480, 620, C.blue, .10], [1500, 400, 480, C.violet, .07]]);
  const pose = R.tl.poseAt(ts), lag = R.tl.poseAt(Math.max(0, ts - 0.5));
  const zIn = eInOut(prog(lt, TRV.a0 - 1.0, 1.2)), zOut = eInOut(prog(lt, a1 - 1.2, 1.5));
  const s = lerp(.125, .30, zIn * (1 - zOut)), wgt = (s - .125) / (.30 - .125);
  const V = { x: 40, y: 105, w: 1030, h: 770, s };
  const hwv = V.w / 2 / s, hhv = V.h / 2 / s;
  V.cx = lerp(MAPCX, clamp(lag.x, hwv - 400, P.MAP.W - hwv + 400), wgt); V.cy = lerp(MAPCY, clamp(lag.y, hhv - 400, P.MAP.H - hhv + 400), wgt);
  const cam = camAt([[0, 960, 540, 1.0], [S.dur, 960, 540, 1.0]], lt);
  withCam(ctx, cam, () => {
    const pucks = []; let placed = 0, act = null; const cntL = [0, 0, 0];
    R.trips.forEach(t => {
      const src = Q1_COMP[t.id], g = Q1_ALLOC.grp[t.id];
      if (ts < t.pick0 + .5) { const h = homeOf(t.id); pucks.push({ x: h.x, y: h.y, c: src.c, s: src.s, sc: 1.25 }); }
      else if (ts >= t.place0 + .5) { pucks.push({ x: t.pip.x, y: t.pip.y, c: src.c, s: src.s, sc: 1.25, ring: g === "Y" ? C.Y : null }); placed++; cntL[t.li]++; }
      if (ts >= t.prevEnd && ts < t.place1) act = t;
    });
    let tip = null, holding = null;
    if (act) {
      const src = Q1_COMP[act.id], g = Q1_ALLOC.grp[act.id], hd = { c: src.c, s: src.s, ring: g === "Y" ? C.Y : null };
      const rp1 = P.toRobot(act.pose1, homeOf(act.id)), rp2 = P.toRobot(act.pose2, act.pip), dft = { x: P.FOOT.xf + 40, y: 0 };
      if (ts >= act.pick0 && ts < act.pick1) { const u = (ts - act.pick0) / (act.pick1 - act.pick0); const e = u < .45 ? eOut3(u / .45) : 1 - eInOut((u - .45) / .55); tip = { x: lerp(dft.x, rp1.x, e), y: lerp(0, rp1.y, e) }; if (u >= .5) holding = hd; }
      else if (ts >= act.pick1 && ts < act.place0) holding = hd;
      else if (ts >= act.place0 && ts < act.place1) { const u = (ts - act.place0) / (act.place1 - act.place0); const e = u < .5 ? eOut3(u / .5) : 1 - eInOut((u - .5) / .5); tip = { x: lerp(dft.x, rp2.x, e), y: lerp(0, rp2.y, e) }; if (u < .5) holding = hd; }
    }
    const trail = R.tl.trailTo(ts, .25, Math.max(0, ts - 7));
    drawMapView(ctx, V, {
      wallsP: 1, zoneA: 1, platA: 1, devA: 1, boxesA: 1, locsA: 1, labels: true, pucks, puckMin: 6,
      trails: [{ pts: trail, col: C.blue, lw: 4, al: .9 }],
      robot: { pose, o: { tip: tip || undefined, holding, open: tip ? .8 : .4 } },
    });
    const M = { x: V.x + V.w - 188, y: V.y + 14, w: 174, h: 246, cx: MAPCX, cy: MAPCY, s: .0385 };
    drawMapView(ctx, M, { wallsP: 1, zoneA: 1, platA: 1, devA: 0, boxesA: 1, locsA: 1, labels: false, trails: [{ pts: trail, col: C.blue, lw: 2, al: .9, glow: 0 }], border: C.blue });
    ctx.strokeStyle = C.paper; ctx.lineWidth = 1.6; ctx.strokeRect(M.wx(V.cx - hwv), M.wy(V.cy + hhv), V.w / s * M.s, V.h / s * M.s);
    ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(M.wx(pose.x), M.wy(pose.y), 5, 0, 7); ctx.fill();
    const stateTxt = act ? `S${act.box + 1} → L${act.li + 1}` : (placed === 12 ? "12개 모두 놓음" : "이동 준비");
    const lw2 = measure(ctx, stateTxt, 28, 700, FM) + 40; RR(ctx, V.x + 18, V.y + V.h - 62, lw2, 46, 23); ctx.fillStyle = "rgba(11,17,24,.88)"; ctx.fill(); ctx.strokeStyle = "rgba(111,168,255,.5)"; ctx.lineWidth = 1.5; ctx.stroke();
    T(ctx, stateTxt, V.x + 38, V.y + V.h - 38, { f: FM, w: 700, s: 28, c: C.blue, b: "middle" });
    const tlu = spring(prog(lt, a1 - .2, .6)) * (lt < a1 + TRV.dB + .2 ? 1 : 0);
    if (tlu > 0) { const rA = R.simA / TRV.dA, rB = (R.T - R.simA) / TRV.dB; badge(ctx, V.x + V.w / 2, V.y + 70, `⏩ 타임랩스 ×${Math.round(rB / rA)}`, C.Y, 30, clamp(tlu, 0, 1)); }
    const px = 1130;
    T(ctx, "놓은 퍽", px, 170, { w: 700, s: 30, c: C.muted });
    T(ctx, String(placed).padStart(2, "0"), px, 290, { f: FM, w: 700, s: 130, c: placed === 12 ? C.ok : C.paper });
    T(ctx, "/ 12", px + 215, 290, { f: FM, w: 500, s: 56, c: C.muted });
    [0, 1, 2].forEach(li => {
      const y = 380 + li * 130, g = SORT_GRP[li], n = LOC_N[li];
      card(ctx, px, y, 700, 108, { r: 20, bar: CC[g], fill: "rgba(20,29,39,.92)", stroke: cntL[li] === n ? C.ok : C.line });
      T(ctx, `L${li + 1}`, px + 34, y + 70, { f: FM, w: 700, s: 46, c: C.blue });
      for (let k = 0; k < n; k++) {
        const x = px + 150 + k * 66, filled = k < cntL[li];
        ctx.beginPath(); ctx.arc(x, y + 54, 24, 0, 7); ctx.strokeStyle = "rgba(255,255,255,.16)"; ctx.setLineDash([5, 5]); ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]);
        if (filled) { const src = Q1_COMP[R.trips.filter(t => t.li === li)[k].id]; puck(ctx, x, y + 54, 22, CC[src.c], src.s, { ring: g === "Y" ? C.Y : null, shadow: false }); }
      }
      T(ctx, `${CN[g]} ${n}`, px + 690, y + 66, { w: 900, s: 28, a: "right", c: CC[g] });
    });
    T(ctx, "집기 순서는 자유 · 전체 할당 계획대로 옮김", px, 800, { s: 22, c: C.muted });
  });
};

/* ============ 장면 8: 주사위 눈 배치 ============ */
const T_HEAD = .8, T_PL = .6, T_HOLD = 2.0, T_GAP = .35;
function diceStages() {
  const out = []; let t = .8;
  [0, 1, 2].forEach(li => {
    const g = SORT_GRP[li], n = LOC_N[li], st = { li, g, n, ids: GRP_IDS[g], t0: t, pl0: t + T_HEAD };
    st.pl1 = st.pl0 + n * T_PL; st.hold1 = st.pl1 + T_HOLD; st.end = st.hold1 + T_GAP; t = st.end; out.push(st);
  });
  return out;
}
let _DS = null; const getDS = () => _DS || (_DS = diceStages());
SCENES[8] = (ctx, lt, S) => {
  const DS = getDS();
  drawBG(ctx, lt, [[620, 480, 560, C.blue, .12], [1500, 460, 500, C.violet, .07]]);
  let cur = DS[0]; for (const d of DS) if (lt >= d.t0) cur = d;
  const cam = camAt([[0, 700, 480, 1.1], [1.2, 960, 540, 1.0], [S.dur, 965, 545, 1.02]], lt);
  withCam(ctx, cam, () => {
    const tx = 560, ty = 470, k = 2.6, side = 205 * k;
    ctx.save(); ctx.translate(tx, ty);
    ctx.fillStyle = "rgba(20,29,39,.85)"; RR(ctx, -side / 2 - 18, -side / 2 - 18, side + 36, side + 36, 34); ctx.fill();
    const stable = lt >= cur.hold1 - .01;
    ctx.strokeStyle = stable ? C.ok : C.blue; ctx.lineWidth = stable ? 6 : 3; ctx.stroke();
    for (const dx of [-60, 0, 60]) for (const dy of [-60, 0, 60]) { ctx.beginPath(); ctx.arc(dx * k, -dy * k, 7, 0, 7); ctx.fillStyle = "rgba(111,168,255,.5)"; ctx.fill(); }
    ctx.strokeStyle = "rgba(111,168,255,.18)"; ctx.lineWidth = 2; ctx.beginPath();
    for (const v of [-60, 0, 60]) { ctx.moveTo(v * k, -60 * k); ctx.lineTo(v * k, 60 * k); ctx.moveTo(-60 * k, v * k); ctx.lineTo(60 * k, v * k); } ctx.stroke();
    const pips = FACES[cur.n];
    pips.forEach(([dx, dy], i) => {
      const gu = spring(prog(lt, cur.pl0 - .2 + i * .04, .5)); if (gu <= 0) return;
      ctx.beginPath(); ctx.arc(dx * k, -dy * k, 44 * gu, 0, 7); ctx.setLineDash([7, 6]); ctx.strokeStyle = CC[cur.g]; ctx.lineWidth = 2.5; ctx.globalAlpha = .7; ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    });
    cur.ids.forEach((id, i) => {
      const w0 = cur.pl0 + i * T_PL; if (lt < w0) return;
      const src = Q1_COMP[id], [dx, dy] = pips[i], u = prog(lt, w0, .45), e = spring(u);
      const x = dx * k, y = dy * -k - (1 - e) * 150, sc = u < 1 ? 1.2 - .2 * e : 1 + .2 * pulse(lt, w0 + .45, .45);
      puck(ctx, x, y, 42 * sc, CC[src.c], src.s, { ring: cur.g === "Y" ? C.Y : null, label: id, al: clamp(u * 3, 0, 1) });
      if (i === 0) { const tu = prog(lt, w0 + .45, .4) * (1 - prog(lt, cur.pl1 + .2, .6)); if (tu > 0) { ctx.save(); ctx.globalAlpha = tu; ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(dx * k, -dy * k, 10 * k, 0, 7); ctx.stroke(); ctx.restore(); T(ctx, "중심 오차 ±10 mm", dx * k + 70, -dy * k - 56, { w: 700, s: 22, c: C.paper, al: tu, a: "left" }); } }
    });
    ctx.restore();
    const axx = tx - side / 2 - 52;
    drawArrow(ctx, axx, ty + 60, axx, ty - 110, C.muted, 3, 12);
    ctx.save(); ctx.translate(axx - 16, ty - 20); ctx.rotate(-Math.PI / 2); T(ctx, "지도 위쪽 (+Y)", 0, 0, { w: 700, s: 22, c: C.muted, a: "center" }); ctx.restore();
    ctx.save(); ctx.strokeStyle = C.Y; ctx.lineWidth = 2.5;
    const dyL = ty - side / 2 - 40; ctx.beginPath(); ctx.moveTo(tx, dyL); ctx.lineTo(tx + 60 * k, dyL); ctx.moveTo(tx, dyL - 8); ctx.lineTo(tx, dyL + 8); ctx.moveTo(tx + 60 * k, dyL - 8); ctx.lineTo(tx + 60 * k, dyL + 8); ctx.stroke();
    T(ctx, "점 간격 60 mm", tx + 30 * k, dyL - 14, { f: FM, w: 700, s: 22, a: "center", c: C.Y }); ctx.restore();
    const by0 = ty + side / 2 + 50;
    if (lt >= cur.pl1 - .05 && lt < cur.end) {
      const u = clamp((lt - cur.pl1) / T_HOLD, 0, 1);
      ctx.save(); RR(ctx, tx - side / 2, by0, side, 20, 10); ctx.fillStyle = "rgba(255,255,255,.1)"; ctx.fill();
      RR(ctx, tx - side / 2, by0, Math.max(side * u, 1), 20, 10); ctx.fillStyle = u >= 1 ? C.ok : C.Y; ctx.fill(); ctx.restore();
      T(ctx, u >= 1 ? "2초 안정 ✓" : `안정 대기 ${(u * 2).toFixed(1)} / 2.0 초`, tx, by0 + 52, { f: u >= 1 ? F : FM, w: 900, s: 30, a: "center", c: u >= 1 ? C.ok : C.Y });
    }
    T(ctx, "완료", 150, 218, { w: 700, s: 22, c: C.muted, a: "center" });
    [0, 1, 2].forEach(li => {
      const x = 150, y = 300 + li * 118, done = DS.find(d => d.li === li && lt >= d.hold1), g = SORT_GRP[li];
      RR(ctx, x - 48, y - 44, 96, 88, 14); ctx.fillStyle = "rgba(20,29,39,.9)"; ctx.fill(); ctx.strokeStyle = done ? C.ok : C.line; ctx.lineWidth = done ? 3 : 1.5; ctx.stroke();
      T(ctx, `L${li + 1}`, x - 40, y - 24, { f: FM, w: 700, s: 17, c: C.blue });
      if (done) FACES[LOC_N[li]].forEach(([dx, dy], i) => { const src = Q1_COMP[GRP_IDS[g][i]]; puck(ctx, x + dx * .28, y + 6 - dy * .28, 7.5, CC[src.c], src.s, { ring: g === "Y" ? C.Y : null, shadow: false }); });
    });
    const ix = 1140, hu = spring(prog(lt, cur.t0 + .05, .6));
    ctx.save(); ctx.globalAlpha *= clamp(hu * 2, 0, 1);
    T(ctx, `L${cur.li + 1}`, ix, 220, { f: FM, w: 700, s: 130, c: C.blue, glow: "rgba(111,168,255,.4)", gb: 24 });
    T(ctx, `장소 ID ${LOC_ID[cur.li]}`, ix + 250, 160, { f: FM, w: 700, s: 30, c: C.paper });
    if (cur.li === 1) T(ctx, "중앙 받침대 북쪽", ix + 250, 196, { s: 22, c: C.muted });
    ctx.save(); ctx.translate(ix, 250); RR(ctx, 0, 0, 560, 60, 30); ctx.fillStyle = cur.g === "Y" ? "rgba(240,188,53,.14)" : "rgba(255,255,255,.05)"; ctx.fill(); ctx.strokeStyle = CC[cur.g]; ctx.lineWidth = 2.5; ctx.stroke();
    T(ctx, `${CN[cur.g]} 퍽 ${cur.n}개 → 눈 ${cur.n}`, 28, 31, { w: 900, s: 30, b: "middle", c: CC[cur.g] }); ctx.restore();
    ctx.restore();
    const nPl = cur.ids.filter((_, i) => lt >= cur.pl0 + i * T_PL + .45).length, allPl = nPl === cur.n;
    const rules = [["3×3 격자 · 점 간격 60 mm", lt >= cur.pl0 - .2], ["정해진 점마다 퍽 1개", allPl], ["중심 오차 10 mm 이내", allPl], ["2초 안정", lt >= cur.hold1], ["바닥 높이 Z = 70 mm · 쌓기·바닥 임시 보관 금지", allPl], ["눈 모양 회전으로 대체 불가 (그림 방향 그대로)", allPl]];
    rules.forEach(([t, ok], i) => {
      const y = 338 + i * 56; card(ctx, ix, y, 720, 48, { r: 14, fill: "rgba(20,29,39,.9)", stroke: ok ? C.ok : C.line, lw: ok ? 2.5 : 1.5 });
      ctx.beginPath(); ctx.arc(ix + 30, y + 24, 14, 0, 7); ctx.fillStyle = ok ? C.ok : "rgba(255,255,255,.08)"; ctx.fill(); if (ok) tick(ctx, ix + 30, y + 24, 26, "#07101A", 3.5);
      T(ctx, t, ix + 58, y + 25, { s: 22, b: "middle", c: ok ? C.paper : C.muted });
    });
    T(ctx, `L${cur.li + 1} 놓은 퍽  ${nPl} / ${cur.n}`, ix, 720, { f: FM, w: 700, s: 30, c: C.paper });
    T(ctx, "빈 격자에 추가 퍽이 있으면 그 장소는 실패", ix, 764, { s: 22, c: C.muted });
  });
};

/* ============ 장면 9: 재검증 + 복귀 ============ */
let _VER = null;
function getVer() {
  if (_VER) return _VER;
  const k0 = "L2", K = P.KEYS[k0];
  const tl = new TL({ x: K.pt.x, y: K.pt.y, h: K.h }, 3200, 5.0);
  let cur = k0; const rem = [0, 1, 2], vs = [];
  while (rem.length) {
    rem.sort((a, b) => P.D(cur, "L" + a) - P.D(cur, "L" + b)); const i = rem.shift(), key = "L" + i;
    if (cur !== key) { tl.follow(P.pathBetween(cur, key)); cur = key; } tl.rotTo(P.KEYS[key].h);
    const e = tl.event("verify", 1.8, { li: i }); vs.push({ li: i, t0: e.t0, t1: e.t1 });
  }
  tl.follow(P.pathBetween(cur, "S")); const arrive = tl.t; tl.rotTo(Math.PI); const home = tl.event("home", 3.0, {});
  return _VER = { tl, vs, arrive, home0: home.t0, home1: home.t1, T: tl.t };
}
SCENES[9] = (ctx, lt, S) => {
  const VR = getVer(), t0 = .8, FF = 1.43, rt = Math.max(0, lt - t0);
  const ts = rt * FF < VR.home0 ? rt * FF : VR.home0 + (rt - VR.home0 / FF);
  drawBG(ctx, lt, [[460, 480, 560, C.blue, .10], [1450, 460, 560, C.ok, .05]]);
  const pose = VR.tl.poseAt(ts), zoom = eInOut(prog(ts, VR.arrive - 2.4, 2.0));
  const V = { x: 90, y: 105, w: 690, h: 770, s: lerp(.121, .42, zoom), cx: lerp(MAPCX, 760, zoom), cy: lerp(MAPCY, 950, zoom) };
  const cam = camAt([[0, 700, 480, 1.1], [1.2, 960, 540, 1.0], [S.dur, 965, 545, 1.02]], lt);
  withCam(ctx, cam, () => {
    const active = VR.vs.find(v => ts >= v.t0 && ts < v.t1), trail = VR.tl.trailTo(ts, .2);
    const locHi = P.LOCS.map((_, li) => (active && active.li === li ? 1 : 0));
    const locDone = P.LOCS.map((_, li) => { const v = VR.vs.find(v => v.li === li); return v && ts >= v.t1 ? 1 : 0; });
    const pucks = [];
    P.LOCS.forEach((l, li) => { const g = SORT_GRP[li]; GRP_IDS[g].forEach((id, i) => { const [dx, dy] = FACES[LOC_N[li]][i], src = Q1_COMP[id]; pucks.push({ x: l.x + dx, y: l.y + dy, c: src.c, s: src.s, ring: g === "Y" ? C.Y : null, sc: 1.2 }); }); });
    const homeA = ts >= VR.home0;
    drawMapView(ctx, V, {
      wallsP: 1, zoneA: 1, platA: 1, devA: 1, boxesA: 1, locsA: 1, locHi, locDone, labels: V.s < .3, trails: [{ pts: trail, col: C.blue, lw: 3.5, al: .85 }], pucks, puckMin: 4,
      marks: homeA ? [{ x: pose.x, y: pose.y, u: ((ts - VR.home0) % 1), col: C.ok, r: 420, r0: 200 }] : [],
      robot: { pose, o: { cone: active ? .6 : 0 } },
    });
    T(ctx, homeA ? "차체 전체가 출발 구역 안 · 정지" : active ? `L${active.li + 1} 새 관측` : ts < VR.arrive ? "이동 중" : "복귀", V.x + 24, V.y + V.h - 24, { w: 900, s: 28, c: homeA ? C.ok : C.blue });
    const bx = 880, bw = 980;
    T(ctx, "재검증 기록", bx, 150, { w: 900, s: 34 }); T(ctx, "새 관측 기반 · 장소별 ID · 위치", bx + 230, 150, { s: 23, c: C.muted });
    const nx = spring(prog(lt, S.B(.55), .6));
    if (nx > 0) badge(ctx, bx + bw - 250, 140, "목표 상태 복사 로그 ✗ 불인정", C.R, 19, clamp(nx * 2, 0, 1));
    P.LOCS.forEach((l, li) => {
      const v = VR.vs.find(v => v.li === li), g = SORT_GRP[li], ids = GRP_IDS[g], y = 182 + li * 150, u = v ? spring(prog(ts, v.t1, .5)) : 0;
      card(ctx, bx, y, bw, 132, { r: 20, fill: "rgba(20,29,39,.9)", stroke: u > 0 ? C.ok : C.line, lw: u > 0 ? 2.5 : 1.5, bar: C.blue });
      T(ctx, `L${li + 1}`, bx + 34, y + 76, { f: FM, w: 700, s: 56, c: C.blue }); T(ctx, `장소 ID ${LOC_ID[li]}`, bx + 34, y + 110, { f: FM, s: 20, c: C.muted });
      if (v && ts >= v.t0 && ts < v.t1) { const rr = (ts - v.t0) / (v.t1 - v.t0); ringProg(ctx, bx + bw - 60, y + 66, 28, rr, C.violet, 6); T(ctx, "관측", bx + bw - 60, y + 66, { s: 14, a: "center", b: "middle", c: C.violet }); }
      if (u > 0) {
        ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1);
        ids.forEach((id, i) => { const src = Q1_COMP[id], x = bx + 190 + i * 100, yy = y + 52, sc = spring(prog(ts, v.t1 + i * .06, .4)); card(ctx, x - 40, yy - 30, 84, 60, { r: 12, fill: "rgba(255,255,255,.04)", stroke: CC[src.c], lw: 2 }); ctx.save(); ctx.translate(x - 2, yy); ctx.scale(sc, sc); puck(ctx, -18, 0, 13, CC[src.c], src.s, { ring: g === "Y" ? C.Y : null, shadow: false }); T(ctx, String(id), 10, 1, { f: FM, w: 700, s: 24, b: "middle" }); ctx.restore(); });
        T(ctx, `퍽 ${ids.length}개 · 눈 ${ids.length} 위치 기록`, bx + 190, y + 112, { s: 22, c: C.muted });
        ctx.restore();
        const tu = spring(prog(ts, v.t1 + .2, .4)); ctx.save(); ctx.translate(bx + bw - 60, y + 66); ctx.scale(tu, tu); ctx.fillStyle = C.ok; ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.fill(); tick(ctx, 0, 0, 40, "#07101A", 5); ctx.restore();
      }
    });
    const lastV = Math.max(...VR.vs.map(v => v.t1)), ju = spring(prog(ts, lastV + .3, .6));
    if (ju > 0) { ctx.save(); ctx.translate(bx + bw / 2, 664); ctx.scale(ju, ju); ctx.globalAlpha *= clamp(ju * 2, 0, 1); RR(ctx, -bw / 2, -34, bw, 68, 34); ctx.fillStyle = "rgba(61,182,113,.14)"; ctx.fill(); ctx.strokeStyle = C.ok; ctx.lineWidth = 2.5; ctx.stroke(); T(ctx, "전체 중복 없음 ✓   누락 없음 ✓   ID 12 / 12", 0, 2, { w: 900, s: 32, a: "center", b: "middle", c: C.ok }); ctx.restore(); }
    const ru = spring(prog(ts, VR.arrive - 1.8, .6));
    if (ru > 0) {
      ctx.save(); ctx.globalAlpha *= clamp(ru * 2, 0, 1); const rx = bx + 120, ry = 780, hu = clamp((ts - VR.home0) / 3, 0, 1);
      ringProg(ctx, rx, ry, 62, hu, hu >= 1 ? C.ok : C.blue, 10);
      const rem2 = ts >= VR.home0 ? Math.max(0, Math.ceil(3 - (ts - VR.home0))) : 3;
      T(ctx, hu >= 1 ? "✓" : String(rem2), rx, ry + 2, { f: FM, w: 700, s: 64, a: "center", b: "middle", c: hu >= 1 ? C.ok : C.paper });
      T(ctx, "복귀: 차체 전체가 출발 구역 안에서 3초 정지", rx + 100, ry - 8, { w: 900, s: 30 });
      T(ctx, hu >= 1 ? "정지 완료" : ts >= VR.home0 ? "정지 중…" : "출발 구역으로 이동", rx + 100, ry + 30, { s: 24, c: hu >= 1 ? C.ok : C.muted });
      ctx.restore();
    }
  });
};

/* ============ 장면 10: 채점 ============ */
const SCORE = [
  ["신호 순서 기억", "12개 시점별 색상 일치 각 1점", 12, "#6FA8FF"],
  ["색상별 횟수", "R · Y · G 정답 횟수 각 3점", 9, "#8C9BFF"],
  ["바코드 해석", "실물 코드와 정렬 방향 모두 일치", 4, "#B592EA"],
  ["장소 그룹 배정", "정답 그룹을 L1~L3에 배정 각 3점", 9, "#D08FE0"],
  ["색상 · 모양 선택", "장소별 개수와 R/G 색상 또는 Y 모양 각 6점", 18, "#5AD1C8"],
  ["주사위 눈 배치", "정답 눈 · 위치 · 안정 조건 각 10점", 30, "#4FB6E8"],
  ["이동 후 검증", "새 관측 기반 장소별 ID·위치 6 + 중복/누락 판정 2", 8, "#7FA0D8"],
  ["복귀", "차체 전체가 출발 구역 안에서 3초 정지", 10, "#9AD0F5"],
];
SCENES[10] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[1560, 470, 640, C.blue, .13], [400, 480, 480, C.violet, .06]]);
  const cam = camAt([[0, 800, 480, 1.1], [S.B(.1), 960, 540, 1.0], [S.B(.86), 960, 540, 1.0], [S.B(.93), 960, 530, 1.03], [S.dur, 960, 530, 1.03]], lt);
  const rowT = i => S.B(.10 + i * .092);
  withCam(ctx, cam, () => {
    SCORE.forEach(([name, det, pts, col], i) => {
      const t0 = rowT(i), u = spring(prog(lt, t0, .6)), y = 125 + i * 92, cu = countUp(lt, t0 + .15, .7, pts);
      if (u <= 0) return;
      ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1); ctx.translate(-(1 - u) * 140, 0);
      card(ctx, 90, y, 1130, 80, { r: 16, fill: "rgba(20,29,39,.9)", bar: col });
      T(ctx, name, 124, y + 36, { w: 900, s: 33 });
      if (det) T(ctx, det, 124, y + 66, { s: 21, c: C.muted });
      const bw = 280 * (pts / 30) * eOut3(prog(lt, t0 + .15, .8));
      ctx.fillStyle = "rgba(255,255,255,.07)"; RR(ctx, 800, y + 30, 280, 20, 10); ctx.fill();
      ctx.fillStyle = col; RR(ctx, 800, y + 30, Math.max(bw, 1), 20, 10); ctx.fill();
      T(ctx, `+${cu}`, 1196, y + 56, { f: FM, w: 700, s: 44, a: "right", c: col });
      ctx.restore();
    });
    const cx = 1560, cy = 450, R = 215, lw = 52;
    ctx.save(); ctx.lineWidth = lw; ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke();
    let a0 = -Math.PI / 2;
    SCORE.forEach(([n, d, pts, col], i) => { const fr = pts / 100, u = eOut3(prog(lt, rowT(i) + .1, .8)); if (u > 0) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "butt"; ctx.beginPath(); ctx.arc(cx, cy, R, a0, a0 + fr * Math.PI * 2 * u - (u > .98 ? .012 : 0)); ctx.stroke(); } a0 += fr * Math.PI * 2; });
    ctx.restore();
    const total = SCORE.reduce((a, r, i) => a + countUp(lt, rowT(i) + .15, .7, r[2]), 0), pun = spring(prog(lt, S.B(.88), .7));
    T(ctx, String(total), cx, cy + 36, { f: FM, w: 700, s: 150 * (total === 100 ? (.9 + .1 * pun) : 1), a: "center", c: C.paper, glow: total === 100 ? C.blue : null, gb: 40 });
    T(ctx, "/ 100점", cx, cy + 96, { w: 700, s: 34, a: "center", c: C.muted }); T(ctx, "원점수 합계", cx, cy - 92, { w: 700, s: 28, a: "center", c: C.muted });
    if (pun > 0) {
      for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, u = prog(lt, S.B(.88), .9), r = R + 40 + 150 * eOut3(u) * (.6 + .4 * hash01(i + 3)); ctx.fillStyle = SCORE[i % 8][3]; ctx.globalAlpha = (1 - u); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 6 * (1 - u * .5), 0, 7); ctx.fill(); ctx.globalAlpha = 1; }
      ctx.save(); ctx.translate(cx, cy + 285); ctx.scale(pun, pun); RR(ctx, -250, -30, 500, 60, 30); ctx.fillStyle = "rgba(111,168,255,.15)"; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; ctx.stroke();
      T(ctx, "12+9+4+9+18+30+8+10 = 100", 0, 2, { f: FM, w: 700, s: 26, a: "center", b: "middle", c: C.blue }); ctx.restore();
    }
  });
};

/* ============ 장면 11: 오류 정지 + 아웃트로 ============ */
const ERR_CARDS = [
  ["점멸 12회 미만 · 초과", "12회 미만 · 초과", .22],
  ["불명 색상", "임의 추정 금지", .36],
  ["미등록 바코드", "P2-01 ~ P2-04 외 코드", .50],
  ["퍽 ID 중복 · 누락", "중복 · 누락", .64],
];
function glyph(ctx, kind, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = s * .12; ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (kind === 0) { for (let i = 0; i < 5; i++) { ctx.fillStyle = i < 3 ? col : "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.arc((i - 2) * s * .36, 0, s * .13, 0, 7); ctx.fill(); } }
  else if (kind === 1) { ctx.beginPath(); ctx.arc(0, 0, s * .38, 0, 7); ctx.stroke(); T(ctx, "?", 0, s * .02, { f: FM, w: 700, s: s * .6, a: "center", b: "middle", c: col }); }
  else if (kind === 2) { for (let i = 0; i < 7; i++) ctx.fillRect(-s * .5 + i * s * .15, -s * .32, s * (i % 2 ? .05 : .09), s * .64); ctx.beginPath(); ctx.moveTo(-s * .55, s * .4); ctx.lineTo(s * .55, -s * .4); ctx.stroke(); }
  else { puck(ctx, -s * .22, 0, s * .22, C.R, "cyl", { shadow: false }); puck(ctx, s * .22, 0, s * .22, C.R, "cyl", { shadow: false }); T(ctx, "ID", 0, s * .02, { f: FM, w: 700, s: s * .28, a: "center", b: "middle", c: "#0B1118" }); }
  ctx.restore();
}
SCENES[11] = (ctx, lt, S) => {
  const b0 = S.rel("s11b"), bt = f => S.relB("s11a", f), ot = f => S.relB("s11b", f);
  drawBG(ctx, lt, [[960, 480, 700, lt < b0 ? C.R : C.blue, lt < b0 ? .10 : .13]]);
  const cam = camAt([[0, 960, 520, 1.1], [1.0, 960, 500, 1.0], [b0 - .5, 960, 500, 1.03], [b0 + 1.4, 960, 520, 1.12], [S.dur, 960, 540, 1.0]], lt);
  const outU = eInOut(prog(lt, b0 - .1, .7));
  withCam(ctx, cam, () => {
    ctx.save(); ctx.globalAlpha = 1 - outU; ctx.translate(0, outU * 90);
    const flow = [["오류 감지", C.R], ["오류 기록", C.Y], ["안전 정지", C.bad]];
    flow.forEach(([t, col], i) => {
      const u = spring(prog(lt, bt(.04 + i * .07), .6)); if (u <= 0) return;
      const x = 330 + i * 430; ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1); ctx.translate(x, 170); ctx.scale(u, u);
      RR(ctx, -190, -38, 380, 76, 38); ctx.fillStyle = "rgba(20,29,39,.95)"; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
      T(ctx, t, 0, 2, { w: 900, s: 34, a: "center", b: "middle", c: col }); ctx.restore();
      if (i < 2) drawArrow(ctx, x + 205, 170, x + 225, 170, C.muted, 4, 12);
    });
    const su = spring(prog(lt, bt(.2), .7));
    if (su > 0) { ctx.save(); ctx.translate(1700, 170); ctx.scale(su, su); const r = 46; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fillStyle = C.bad; ctx.fill(); T(ctx, "정지", 0, 2, { w: 900, s: 28, a: "center", b: "middle", c: "#fff" }); ctx.restore(); }
    ERR_CARDS.forEach(([t, d, f], i) => {
      const t0 = bt(f), u = spring(prog(lt, t0, .6)); if (u <= 0) return;
      const col = i % 2, row = Math.floor(i / 2), w = 800, h = 190, x = 120 + col * 840, y = 280 + row * 215, fl = pulse(lt, t0, .7);
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(.85 + .15 * u, .85 + .15 * u); ctx.globalAlpha *= clamp(u * 2, 0, 1); ctx.translate(-w / 2, -h / 2);
      card(ctx, 0, 0, w, h, { r: 22, fill: "rgba(28,20,24,.95)", stroke: fl > .05 ? C.R : "rgba(239,90,79,.45)", lw: 2 + fl * 3, bar: C.bad });
      if (fl > .05) { ctx.shadowColor = C.R; ctx.shadowBlur = 40 * fl; RR(ctx, 0, 0, w, h, 22); ctx.strokeStyle = "rgba(239,90,79,.8)"; ctx.stroke(); ctx.shadowBlur = 0; }
      glyph(ctx, i, 130, 95, 100, C.R);
      T(ctx, t, 260, 88, { w: 900, s: 38, c: C.paper }); T(ctx, d, 260, 130, { s: 25, c: C.muted });
      ctx.restore();
    });
    const nu = spring(prog(lt, bt(.84), .7));
    if (nu > 0) { ctx.save(); ctx.globalAlpha *= clamp(nu * 2, 0, 1); card(ctx, 120, 715, 1640, 80, { r: 20, fill: "rgba(20,29,39,.95)", stroke: C.Y }); T(ctx, "팀 오류 뒤에는 신호를 다시 보여주거나 수동 수정 후 같은 회차를 이어가지 않음", 960, 756, { w: 700, s: 28, a: "center", b: "middle", c: C.Y }); ctx.restore(); }
    ctx.restore();
    if (lt >= b0 - .1) {
      const fadeEnd = 1 - eIn3(prog(lt, S.dur - 1.1, 1.0));
      ctx.save(); ctx.globalAlpha = fadeEnd;
      KT(ctx, "주사위 기억 로봇", 960, 250, { s: 110, w: 900, a: "center", lt, t0: b0 + .15, st: .06, glow: "rgba(111,168,255,.35)" });
      const steps = ["바코드", "점멸 관측", "횟수 계산", "그룹 배정", "전체 할당", "집기·놓기", "재검증", "복귀"];
      const x0 = 190, dx = 220, y = 480, lu = eOut3(prog(lt, ot(.02), (S.items[1].slot - .6) * .85));
      ctx.strokeStyle = "rgba(111,168,255,.25)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + dx * 7, y); ctx.stroke();
      ctx.strokeStyle = C.blue; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + dx * 7 * lu, y); ctx.stroke();
      steps.forEach((s, i) => {
        const t0 = ot(.04 + i * .1), u = spring(prog(lt, t0, .55)), x = x0 + i * dx;
        ctx.beginPath(); ctx.arc(x, y, 38, 0, 7); ctx.fillStyle = C.bg; ctx.fill(); ctx.strokeStyle = "rgba(111,168,255,.35)"; ctx.lineWidth = 4; ctx.stroke();
        if (u > 0) { ctx.save(); ctx.translate(x, y); ctx.scale(u, u); glowDot(ctx, 0, 0, 90, C.blue, .5); ctx.beginPath(); ctx.arc(0, 0, 38, 0, 7); ctx.fillStyle = C.blue; ctx.fill(); T(ctx, String(i + 1), 0, 2, { f: FM, w: 700, s: 34, a: "center", b: "middle", c: "#07101A" }); ctx.restore(); }
        T(ctx, s, x, y + 84, { w: 900, s: 30, a: "center", c: u > 0 ? C.paper : C.muted });
      });
      T(ctx, "12번 점멸 기억 → 바코드로 정렬 → 퍽 12개로 L1~L3 주사위 눈 → 재확인 → 복귀", 960, 680, { s: 30, a: "center", c: C.muted, al: eOut3(prog(lt, ot(.8), .8)) });
      ctx.restore();
    }
  });
};
