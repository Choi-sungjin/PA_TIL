/* scenes_a.js - 장면 1~5 */
"use strict";
const SCENES = {};
const TEAL = "#5AD1C8";
const MAPCX = 2232, MAPCY = 3182;

/* 작은 아이콘 */
function iconLamp(ctx, x, y, r, a = 1) { ctx.save(); ctx.globalAlpha *= a; ["R", "Y", "G"].forEach((k, i) => { ctx.fillStyle = CC[k]; ctx.beginPath(); ctx.arc(x + (i - 1) * r * 2.1, y, r, 0, 7); ctx.fill(); }); ctx.restore(); }
function iconPips(ctx, x, y, s, n = 5, col = C.paper) { ctx.save(); ctx.fillStyle = col; for (const [dx, dy] of FACES[n]) { ctx.beginPath(); ctx.arc(x + dx / 60 * s, y - dy / 60 * s, s * .22, 0, 7); ctx.fill(); } ctx.restore(); }
function stepChip(ctx, lt, t0, x, y, w, num, label, icon) {
  const u = spring(prog(lt, t0, 0.7)); if (u <= 0) return;
  ctx.save(); ctx.globalAlpha = clamp(u * 2.5, 0, 1); ctx.translate(x - (1 - u) * 120, y);
  card(ctx, 0, 0, w, 72, { r: 36, fill: "rgba(20,29,39,.92)", stroke: "rgba(111,168,255,.4)" });
  ctx.fillStyle = C.blue; ctx.beginPath(); ctx.arc(36, 36, 25, 0, 7); ctx.fill();
  T(ctx, String(num), 36, 37, { f: FM, w: 700, s: 28, c: "#07101A", a: "center", b: "middle" });
  T(ctx, label, 82, 37, { w: 700, s: 31, b: "middle" });
  icon && icon(ctx, w - 70, 36);
  ctx.restore();
}

/* ============ 장면 1: 인트로 ============ */
SCENES[1] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[430, 520, 620, C.blue, .14], [1420, 480, 520, C.violet, .08]]);
  const cam = camAt([[0, 960, 540, 1.10], [S.B(.4), 960, 540, 1.0], [S.dur, 960, 540, 1.02]], lt);
  withCam(ctx, cam, () => {
    T(ctx, "MOTION GUIDE  ·  MISSION OVERVIEW", 120, 215, { f: FM, s: 23, c: C.blue, ls: 3, al: eOut3(prog(lt, .1, .5)) });
    KT(ctx, "주사위", 120, 370, { s: 150, w: 900, lt, t0: .2, glow: "rgba(111,168,255,.30)" });
    KT(ctx, "기억 로봇", 120, 535, { s: 150, w: 900, lt, t0: .55, c: C.blue, glow: "rgba(111,168,255,.4)" });
    const bw = 760 * eOut5(prog(lt, 1.05, .8));
    ctx.fillStyle = C.blue; ctx.fillRect(124, 566, bw, 6);
    stepChip(ctx, lt, S.B(.30), 120, 598, 700, 1, "신호 12번 기억", (c, x, y) => iconLamp(c, x - 18, y, 8));
    stepChip(ctx, lt, S.B(.48), 120, 676, 700, 2, "바코드로 정렬 · 퍽 12개 이동", (c, x, y) => { puck(c, x - 30, y, 12, C.R, "cyl", { shadow: false }); puck(c, x, y, 12, C.G, "cube", { shadow: false }); });
    stepChip(ctx, lt, S.B(.66), 120, 754, 700, 3, "주사위 눈 · 재확인 · 복귀", (c, x, y) => iconPips(c, x - 6, y, 26, 5));
    /* 맵 */
    const sZ = lerp(0.30, 0.118, eInOut(prog(lt, S.B(.12), 2.4)));
    const cx = lerp(730, MAPCX, eInOut(prog(lt, S.B(.12), 2.4))), cy = lerp(950, MAPCY, eInOut(prog(lt, S.B(.12), 2.4)));
    const V = { x: 1080, y: 105, w: 740, h: 770, cx, cy, s: sZ };
    const st = {
      wallsP: prog(lt, S.B(.10), 3.2), zoneA: prog(lt, S.B(.04), .6), platA: prog(lt, S.B(.2), .6), devA: prog(lt, S.B(.16), .6),
      boxesA: P.BOXES.map((_, i) => prog(lt, S.B(.30) + i * .13, .55)),
      locsA: P.LOCS.map((_, i) => prog(lt, S.B(.52) + i * .16, .55)),
      boxHi: P.BOXES.map((_, i) => pulse(lt, S.B(.30) + i * .13 + .2, .8)),
      locHi: P.LOCS.map((_, i) => pulse(lt, S.B(.52) + i * .16 + .2, .8)),
      pucks: [], labels: sZ > .08,
    };
    if (lt > S.B(.34)) P.BOXES.forEach((b, i) => { const a = prog(lt, S.B(.34) + i * .13 + .15, .4); if (a > 0) [0, 1].forEach(j => { const id = i * 2 + j, p = Q1_COMP[id]; const h = homeOf(id); st.pucks.push({ x: h.x, y: h.y, c: p.c, s: p.s, al: a, sc: 1 + .3 * pulse(lt, S.B(.34) + i * .13 + .2, .6) }); }); });
    st.robot = lt > S.B(.58) ? { pose: { x: P.START.x, y: P.START.y, h: Math.PI }, o: { phi: -180 } } : null;
    drawMapView(ctx, V, st);
    const lab = eOut3(prog(lt, S.B(.2), .6));
    T(ctx, "맵 4464 × 6364 mm · 벽판 미로 구조", V.x + V.w / 2, V.y + V.h + 26, { f: FM, s: 20, c: C.muted, a: "center", al: lab });
    /* Q1 배지 + 미니 신호 테이프 */
    const qb = spring(prog(lt, S.B(.84), .7));
    if (qb > 0) {
      ctx.save(); ctx.translate(120, 842); ctx.globalAlpha = clamp(qb * 2, 0, 1); ctx.scale(1, clamp(qb, 0, 1.1));
      T(ctx, "공개 연습 문제 Q1", 0, 22, { w: 700, s: 26, c: C.Y });
      Q1_SEQ.forEach((k, i) => { const u = prog(lt, S.B(.86) + i * .04, .3); ctx.fillStyle = CC[k]; ctx.globalAlpha = u; ctx.beginPath(); ctx.arc(318 + i * 34, 14, 11 * eBack(u), 0, 7); ctx.fill(); });
      ctx.restore();
    }
  });
};

/* ============ 장면 2: 배치 · 퍽 · 그룹 ============ */
SCENES[2] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[470, 480, 560, C.blue, .11], [1450, 480, 520, C.violet, .06]]);
  const cam = camAt([[0, 600, 400, 1.2], [S.B(.12), 960, 540, 1.0], [S.dur, 960, 540, 1.0]], lt);
  withCam(ctx, cam, () => {
    const zz = eInOut(prog(lt, .1, 1.6));
    const V = { x: 60, y: 105, w: 860, h: 770, cx: lerp(1000, MAPCX, zz), cy: lerp(1500, MAPCY, zz), s: lerp(.30, .118, zz) };
    const st = {
      wallsP: prog(lt, .1, 1.8), zoneA: prog(lt, S.B(.02), .6), platA: prog(lt, S.B(.08), .6), devA: prog(lt, S.B(.1), .6),
      boxesA: P.BOXES.map((_, i) => prog(lt, S.B(.22) + i * .14, .5)),
      locsA: P.LOCS.map((_, i) => prog(lt, S.B(.42) + i * .16, .5)),
      boxHi: P.BOXES.map((_, i) => pulse(lt, S.B(.22) + i * .14 + .2, .8)), locHi: P.LOCS.map((_, i) => pulse(lt, S.B(.42) + i * .16 + .2, .8)),
      pucks: [], labels: V.s < .2,
    };
    P.BOXES.forEach((b, i) => { const a = prog(lt, S.B(.24) + i * .14 + .2, .4); if (a > 0) [0, 1].forEach(j => { const id = i * 2 + j, p = Q1_COMP[id], h = homeOf(id); st.pucks.push({ x: h.x, y: h.y, c: p.c, s: p.s, al: a, sc: 1.5 }); }); });
    drawMapView(ctx, mkView(V), st);
    /* 라벨 리더 */
    const lbl = [[0, "L1 · 장소 ID 12", .44], [1, "L2 · 장소 ID 13", .60], [2, "L3 · 장소 ID 14", .76]];
    lbl.forEach(([i, t, f]) => {
      const u = eOut3(prog(lt, S.B(f - .08), .5)); if (u <= 0) return; const l = P.LOCS[i];
      const x0 = V.wx(l.x) + 24, y0 = V.wy(l.y), x1 = V.x + V.w - 18;
      ctx.save(); ctx.globalAlpha = u; ctx.strokeStyle = C.blue; ctx.setLineDash([6, 5]); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1 - 160, u), y0); ctx.stroke(); ctx.setLineDash([]);
      T(ctx, t, x1, y0 + 7, { f: FM, w: 700, s: 20, c: C.blue, a: "right" }); ctx.restore();
    });
    const nu = eOut3(prog(lt, S.B(.3), .6)); T(ctx, "시작 박스 6곳 · 박스마다 퍽 2개", V.x + 24, V.y + 40, { w: 700, s: 24, c: C.paper, al: nu });
    /* 오른쪽 카드 */
    const cx0 = 960, cw = 900;
    const cards = [
      [.04, "경기장", "4464 × 6364 mm · 기존 벽·기둥·박스 위치 유지", C.blue],
      [.22, "시작 박스 6곳 × 퍽 2개", "퍽 총 12개", C.blue],
      [.42, "목적지 L1 · L2 · L3", "처음에는 비어 있음 · L2는 중앙 받침대 북쪽", C.blue],
      [.60, "퍽", "빨강 · 초록 (파랑 없음) · 원기둥 Ø30×60 또는 직육면체 30×30×60 mm", C.G],
      [.78, "신호등 1개", "점멸 총 12회 · 시간 제한 없음", C.Y],
    ];
    cards.forEach(([f, t, d, col], i) => {
      const u = spring(prog(lt, S.B(f), .6)); if (u <= 0) return; const y = 110 + i * 100;
      ctx.save(); ctx.globalAlpha *= clamp(u * 2, 0, 1); ctx.translate((1 - u) * 160, 0);
      card(ctx, cx0, y, cw, 88, { r: 18, bar: col, fill: "rgba(20,29,39,.92)" });
      T(ctx, t, cx0 + 30, y + 38, { w: 900, s: 31 }); T(ctx, d, cx0 + 30, y + 70, { s: 21, c: C.muted });
      if (i === 3) { puck(ctx, cx0 + cw - 150, y + 44, 20, C.R, "cyl", { shadow: false }); puck(ctx, cx0 + cw - 100, y + 44, 20, C.G, "cube", { shadow: false }); puck(ctx, cx0 + cw - 50, y + 44, 20, C.G, "cyl", { shadow: false }); }
      ctx.restore();
    });
    /* 그룹 범례 (음성 없이 시각만) */
    const gy = 625, gu = spring(prog(lt, S.B(.84), .7));
    if (gu > 0) {
      ctx.save(); ctx.globalAlpha *= clamp(gu * 2, 0, 1); ctx.translate(0, (1 - gu) * 40);
      T(ctx, "그룹 의미 — 각 그룹의 퍽 수 = 그 색의 신호 횟수", cx0, gy + 4, { w: 700, s: 24, c: C.paper });
      [["R", "빨강 퍽만", "(모양 무관)"], ["G", "초록 퍽만", "(모양 무관)"], ["Y", "한 모양으로 통일", "(색은 섞여도 됨)"]].forEach(([c, a, b], i) => {
        const y = gy + 24 + i * 64; card(ctx, cx0, y, cw, 54, { r: 27, fill: "rgba(20,29,39,.92)", stroke: CC[c] });
        ctx.fillStyle = CC[c]; ctx.beginPath(); ctx.arc(cx0 + 34, y + 27, 19, 0, 7); ctx.fill(); T(ctx, c, cx0 + 34, y + 29, { f: FM, w: 700, s: 24, a: "center", b: "middle", c: "#0B1118" });
        T(ctx, a, cx0 + 72, y + 29, { w: 900, s: 27, b: "middle", c: CC[c] }); T(ctx, b, cx0 + 72 + measure(ctx, a, 27, 900) + 14, y + 29, { s: 22, b: "middle", c: C.muted });
      });
      ctx.restore();
    }
  });
};

/* ============ 장면 3: 바코드 ============ */
const BAR_PATTERN = (() => { const out = []; let x = 0, k = 0; while (x < 760) { const w = 3 + Math.floor(hash01(k * 3.7 + 5) * 3) * 3.5; if (k % 2 === 0) out.push([x, w]); x += w + 2 + hash01(k * 1.3 + 2) * 4; k++; } return out; })();
SCENES[3] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[520, 480, 560, C.blue, .12], [1450, 460, 480, C.violet, .09]]);
  const cam = camAt([[0, 940, 520, 1.0], [S.dur, 960, 540, 1.0]], lt);
  withCam(ctx, cam, () => {
    const z = eInOut(prog(lt, .1, 1.4));
    const V = { x: 60, y: 105, w: 940, h: 770, cx: lerp(600, 480, z), cy: lerp(950, 890, z), s: lerp(.30, .78, z) };
    const scanT = S.B(.20), dec = S.B(.36);
    drawMapView(ctx, V, {
      wallsP: 1, zoneA: 1, devA: 1, platA: 0, boxesA: [], locsA: [],
      robot: { pose: { x: P.START.x, y: P.START.y, h: Math.PI }, o: { cone: .5 + .25 * pulse(lt, scanT, 2.2), phi: -180, c310: 0 } },
      trails: [], labels: true,
      marks: [{ x: 80, y: 650, u: (lt % 1.2) / 1.2, col: C.violet, r: 320, r0: 60, lw: 3 }],
    });
    /* 맵 위 안내 */
    const bw = eOut3(prog(lt, S.B(.05), .6));
    T(ctx, "출발 구역 중심 (734, 950)에서 −X 방향 관측", V.x + V.w - 28, V.y + V.h - 28, { w: 700, s: 24, c: C.violet, al: bw, a: "right" });
    /* 바코드 카드 */
    const cx0 = 1040, cw = 820;
    const cu = spring(prog(lt, S.B(.06), .7));
    ctx.save(); ctx.globalAlpha = clamp(cu * 2, 0, 1); ctx.translate((1 - cu) * 140, 0);
    card(ctx, cx0, 105, cw, 290, { bar: C.violet });
    T(ctx, "Code 128 바코드", cx0 + 34, 152, { w: 900, s: 32, c: C.violet });
    T(ctx, "중심 (80, 650, 450)", cx0 + cw - 34, 152, { f: FM, s: 22, c: C.muted, a: "right" });
    ctx.fillStyle = "#EEF2F6"; RR(ctx, cx0 + 30, 178, cw - 60, 148, 12); ctx.fill();
    /* 막대 */
    const sweep = ((lt - scanT) / 1.1); const sx = cx0 + 52 + (sweep % 1) * 764;
    const scanning = lt > scanT && lt < dec;
    ctx.fillStyle = "#101820"; BAR_PATTERN.forEach(([x, w]) => ctx.fillRect(cx0 + 52 + x, 190, w, 124));
    if (scanning) {
      ctx.fillStyle = "rgba(239,90,79,.18)"; ctx.fillRect(cx0 + 52, 184, clamp(sx - cx0 - 52, 0, 764), 136);
      ctx.strokeStyle = C.R; ctx.shadowColor = C.R; ctx.shadowBlur = 14; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, 178); ctx.lineTo(sx, 326); ctx.stroke(); ctx.shadowBlur = 0;
    }
    /* 디코드 */
    const code = "P2-01", nChar = Math.floor(clamp((lt - dec) / .12, 0, code.length));
    T(ctx, nChar ? code.slice(0, nChar) : "", cx0 + cw / 2, 376, { f: FM, w: 700, s: 46, c: C.paper, a: "center", glow: C.violet, gb: 18 });
    if (nChar === 0) T(ctx, scanning ? "스캔 중…" : "대기", cx0 + cw / 2, 372, { s: 26, c: C.muted, a: "center" });
    ctx.restore();
    /* 규칙 표 */
    const ty = 420, rh = 76;
    const rows = [["P2-01", "asc"], ["P2-02", "desc"], ["P2-03", "asc"], ["P2-04", "desc"]];
    const tu = spring(prog(lt, S.B(.38), .6));
    ctx.save(); ctx.globalAlpha = clamp(tu * 2, 0, 1);
    T(ctx, "바코드 → 정렬 방향", cx0, ty + 6, { w: 900, s: 30, c: C.paper });
    ctx.restore();
    rows.forEach(([cd, dir], i) => {
      const t0 = S.B(.42 + i * .07), u = spring(prog(lt, t0, .6)); if (u <= 0) return;
      const y = ty + 28 + i * (rh + 8), hi = cd === "P2-01" ? eOut3(prog(lt, S.B(.80), .6)) : 0;
      ctx.save(); ctx.globalAlpha = clamp(u * 2, 0, 1); ctx.translate((1 - u) * 160, 0);
      card(ctx, cx0, y, cw, rh, { r: 14, stroke: hi ? C.Y : C.line, lw: 2 + hi * 2, fill: hi ? "rgba(240,188,53,.10)" : C.panel });
      T(ctx, cd, cx0 + 30, y + rh / 2, { f: FM, w: 700, s: 34, b: "middle", c: hi ? C.Y : C.paper });
      /* 막대 아이콘 */
      const asc = dir === "asc";
      for (let k = 0; k < 3; k++) { const hh = 14 + (asc ? k : 2 - k) * 11; ctx.fillStyle = asc ? C.blue : C.violet; ctx.fillRect(cx0 + 220 + k * 18, y + rh / 2 + 22 - hh, 12, hh); }
      T(ctx, asc ? "오름차순" : "내림차순", cx0 + 300, y + rh / 2, { w: 900, s: 32, b: "middle", c: asc ? C.blue : C.violet });
      T(ctx, asc ? "적은 횟수부터 L1" : "많은 횟수부터 L1", cx0 + 520, y + rh / 2, { s: 26, b: "middle", c: C.muted });
      if (hi) { T(ctx, "Q1 ✓", cx0 + cw - 34, y + rh / 2, { f: FM, w: 700, s: 28, b: "middle", a: "right", c: C.Y, al: hi }); }
      ctx.restore();
    });
  });
};

/* ============ 장면 4: 신호등 관측 ============ */
SCENES[4] = (ctx, lt, S) => {
  const T0 = 1.5, nB = 12;
  const onStart = k => T0 + 2 * k, darkEnd = T0 + 23 + 3;
  const stateAt = t => {
    if (t < T0 || t >= T0 + 23) return null;
    const k = Math.floor((t - T0) / 2), ph = (t - T0) - 2 * k;
    return ph < 1 ? { k, ph } : null;
  };
  const cur = stateAt(lt);
  const lampCol = cur ? Q1_SEQ[cur.k] : null;
  drawBG(ctx, lt, [[430, 400, 520, lampCol ? CC[lampCol] : C.blue, lampCol ? .20 : .10], [1350, 330, 600, C.violet, .06]]);
  const done = clamp(Math.floor((lt - T0 - .35 + 2) / 2), 0, nB); /* 등록된 칩 수 */
  const camKeys = [[0, 600, 380, 1.28], [2.8, 960, 540, 1.0], [S.dur, 975, 548, 1.03]];
  const cam = camAt(camKeys, lt);
  withCam(ctx, cam, () => {
    /* --- 램프 --- */
    const lx = 430, ly = 345;
    card(ctx, 90, 110, 680, 480, { r: 30, fill: "rgba(20,29,39,.8)" });
    T(ctx, "신호등", 130, 160, { w: 900, s: 36 });
    T(ctx, "(80, 950) · 출발 구역에서 −X 방향 관측", 130, 196, { s: 22, c: C.muted });
    /* 하우징 */
    ctx.fillStyle = "#0A1016"; RR(ctx, lx - 150, ly - 130, 300, 300, 40); ctx.fill(); ctx.strokeStyle = "#33414F"; ctx.lineWidth = 4; ctx.stroke();
    const on = cur ? Math.min(1, cur.ph / .06) * Math.min(1, (1 - cur.ph) / .06 + .5) : 0;
    const col = lampCol ? CC[lampCol] : "#1E2A36";
    if (cur) { glowDot(ctx, lx, ly + 20, 330, col, .75 * on); }
    ctx.fillStyle = cur ? col : "#18222D"; ctx.beginPath(); ctx.arc(lx, ly + 20, 112, 0, 7); ctx.fill();
    ctx.fillStyle = cur ? "rgba(255,255,255,.28)" : "rgba(255,255,255,.04)"; ctx.beginPath(); ctx.arc(lx - 28, ly - 8, 52, 0, 7); ctx.fill();
    /* 타이머 링 */
    const inSeq = lt >= T0 && lt < T0 + 23;
    const isDark = lt >= T0 + 23 && lt < darkEnd;
    if (inSeq) {
      const ph = ((lt - T0) % 2);
      ctx.strokeStyle = ph < 1 ? col : C.line; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(lx, ly + 20, 142, -Math.PI / 2, -Math.PI / 2 + (ph < 1 ? ph : ph - 1) * Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.beginPath(); ctx.arc(lx, ly + 20, 142, 0, 7); ctx.stroke();
    }
    if (isDark) {
      const d = lt - (T0 + 23);
      ctx.strokeStyle = C.R; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(lx, ly + 20, 142, -Math.PI / 2, -Math.PI / 2 + d / 3 * Math.PI * 2); ctx.stroke();
      T(ctx, String(Math.max(1, Math.ceil(3 - d))), lx, ly + 20, { f: FM, w: 700, s: 150, a: "center", b: "middle", c: C.paper, glow: C.R, gb: 30 });
    }
    if (lt >= darkEnd) { const u = spring(prog(lt, darkEnd, .6)); ctx.save(); ctx.translate(lx, ly + 20); ctx.scale(u, u); ctx.fillStyle = C.ok; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.fill(); ctx.strokeStyle = "#07101A"; ctx.lineWidth = 12; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(-30, 2); ctx.lineTo(-8, 26); ctx.lineTo(34, -22); ctx.stroke(); ctx.restore(); }
    /* 상태 문구 */
    const stTxt = lt < T0 ? "로봇이 신호등을 관측" : cur ? `ON · ${CN[lampCol]}` : isDark ? "소등 · 3초 대기" : lt >= darkEnd ? "관측 종료" : "OFF · 소등";
    T(ctx, stTxt, lx, 566, { w: 900, s: 38, a: "center", c: cur ? col : (isDark ? C.R : lt >= darkEnd ? C.ok : C.muted) });

    /* --- 파형 스트립 --- */
    const wx0 = 830, wx1 = 1850, wy0 = 150, wh = 120, pps = (wx1 - wx0) / 28;
    const tpos = t => wx0 + (t - (T0 - .6)) * pps;
    card(ctx, 810, 120, 1050, 210, { r: 22, fill: "rgba(20,29,39,.8)" });
    T(ctx, "깜빡임 파형  (1초 ON · 1초 OFF × 12)", 840, 156, { w: 700, s: 26, c: C.paper });
    ctx.save(); ctx.beginPath(); ctx.rect(wx0 - 10, 163, wx1 - wx0 + 40, 157); ctx.clip();
    ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(wx0, 290); ctx.lineTo(wx1 + 10, 290); ctx.stroke();
    for (let k = 0; k < nB; k++) {
      const a = onStart(k), b = a + 1; if (lt < a) break;
      const e = Math.min(lt, b);
      ctx.fillStyle = CC[Q1_SEQ[k]]; ctx.fillRect(tpos(a), 190, (e - a) * pps, 100);
      if (e >= b && lt > b) { T(ctx, String(k + 1), tpos(a) + pps * .5, 312, { f: FM, s: 15, c: C.muted, a: "center" }); }
    }
    if (lt >= T0 + 23) { const x1 = tpos(T0 + 23), x2 = tpos(Math.min(lt, darkEnd)); ctx.fillStyle = "rgba(239,90,79,.14)"; ctx.fillRect(x1, 190, x2 - x1, 100); ctx.strokeStyle = C.R; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.strokeRect(x1, 190, x2 - x1, 100); ctx.setLineDash([]); if (x2 - x1 > 120) T(ctx, "3초 소등", (x1 + x2) / 2, 246, { w: 700, s: 22, a: "center", c: C.R }); }
    if (lt > onStart(3) + 1.2) { const u2 = eOut3(prog(lt, onStart(3) + 1.2, .5)); const x0 = tpos(onStart(2) + 1), x1 = tpos(onStart(3)); ctx.save(); ctx.globalAlpha = u2; ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x0, 183); ctx.lineTo(x0, 188); ctx.lineTo(x1, 188); ctx.lineTo(x1, 183); ctx.stroke(); T(ctx, "같은 색 연속도 소등으로 구별", (x0 + x1) / 2 + 70, 181, { s: 17, c: C.paper, a: "left" }); ctx.restore(); }
    const px = tpos(Math.min(lt, darkEnd + 2));
    ctx.strokeStyle = C.paper; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, 172); ctx.lineTo(px, 296); ctx.stroke();
    ctx.restore();

    /* --- 상태 패널 --- */
    card(ctx, 810, 350, 1050, 150, { r: 22, fill: "rgba(20,29,39,.8)" });
    T(ctx, "관측 기록", 840, 398, { w: 700, s: 26, c: C.muted });
    T(ctx, String(done).padStart(2, "0"), 840, 470, { f: FM, w: 700, s: 84, c: done === 12 ? C.ok : C.paper });
    T(ctx, "/ 12", 960, 470, { f: FM, w: 500, s: 44, c: C.muted });
    const last = done > 0 ? Q1_SEQ[done - 1] : null;
    if (last) { T(ctx, "마지막 색", 1330, 398, { w: 700, s: 22, c: C.muted }); puck(ctx, 1352, 450, 24, CC[last], "cyl", { shadow: false }); T(ctx, CN[last], 1392, 458, { w: 900, s: 36, c: CC[last] }); }
    T(ctx, done === 12 ? "12번째 뒤 3초 연속 소등 = 종료" : "켜진 색 순서 기록 · 소등은 횟수 아님", 1830, 488, { s: 21, a: "right", c: done === 12 ? C.R : C.muted });

    /* --- 타임라인 12칸 --- */
    const sx0 = 120, sw = 140, sy = 636;
    T(ctx, "12칸 타임라인", sx0, sy - 14, { w: 700, s: 24, c: C.muted });
    for (let k = 0; k < nB; k++) {
      const x = sx0 + k * sw;
      card(ctx, x + 4, sy, sw - 8, 118, { r: 14, fill: "rgba(14,21,28,.9)", stroke: C.line, lw: 1.5 });
      T(ctx, String(k + 1), x + sw / 2, sy + 100, { f: FM, s: 20, c: C.muted, a: "center" });
      const reg = onStart(k) + .35, fly = prog(lt, reg, .6);
      if (fly > 0) {
        const c = Q1_SEQ[k], fx = lx, fy = ly + 20, tx = x + sw / 2, ty = sy + 48;
        const e = eOut3(fly), arc = Math.sin(Math.PI * e) * 120;
        const px2 = lerp(fx, tx, e), py2 = lerp(fy, ty, e) - arc;
        const sc = fly < 1 ? lerp(1.6, 1, e) : 1 + .35 * pulse(lt, reg + .6, .7) * (c === "Y" ? 1.4 : 0.4);
        ctx.save(); ctx.translate(px2, py2); ctx.scale(sc, sc);
        RR(ctx, -44, -34, 88, 68, 16); ctx.fillStyle = CC[c]; ctx.shadowColor = CC[c]; ctx.shadowBlur = fly < 1 ? 28 : 8 + 22 * (c === "Y" ? pulse(lt, S.rel("s04b") + .4 + (k === 8 ? 2.2 : k === 10 ? 3.6 : -99), 1.2) : 0); ctx.fill();
        ctx.shadowBlur = 0; T(ctx, c, 0, 2, { f: FM, w: 700, s: 38, c: "#0B1118", a: "center", b: "middle" });
        ctx.restore();
      }
    }
    /* 완성 브래킷 */
    if (lt >= darkEnd - .2) {
      const u = eOut3(prog(lt, darkEnd - .2, .8)); ctx.save(); ctx.strokeStyle = C.ok; ctx.lineWidth = 4; ctx.globalAlpha = u;
      ctx.beginPath(); ctx.moveTo(sx0, sy + 134); ctx.lineTo(sx0, sy + 150); ctx.lineTo(sx0 + sw * 12 * u, sy + 150); ctx.lineTo(sx0 + sw * 12 * u, sy + 134); ctx.stroke();
      T(ctx, "신호 순서 12개 기록 완료 → signal.json", sx0 + sw * 6, sy + 192, { w: 700, s: 26, a: "center", c: C.ok });
      ctx.restore();
    }
  });
};

/* ============ 장면 5: 횟수 세기 · 정렬 ============ */
SCENES[5] = (ctx, lt, S) => {
  drawBG(ctx, lt, [[960, 480, 700, C.blue, .10]]);
  const cam = camAt([[0, 960, 330, 1.12], [S.B(.2), 960, 500, 1.0], [S.B(.52), 960, 520, 1.0], [S.B(.7), 960, 560, 1.04], [S.dur, 965, 548, 1.02]], lt);
  withCam(ctx, cam, () => {
    /* 상단 테이프 */
    const tx = k => 278 + 124 * k, ty = 196;
    const cnt = { R: 0, Y: 0, G: 0 }, bx0 = { R: 480, Y: 960, G: 1440 };
    const bxSort = { Y: 480, R: 960, G: 1440 };
    const sortU = eInOut(prog(lt, S.B(.50), 1.1));
    const bxOf = k => lerp(bx0[k], bxSort[k], sortU);
    const by = 310, bh = 330, bw = 380;
    const flights = [];
    Q1_SEQ.forEach((c, k) => {
      const t0 = S.B(.08) + k * .21, u = prog(lt, t0, .65);
      const slot = cnt[c] % 6; cnt[c] += (u >= 1 ? 1 : 0);
      flights.push({ c, k, u, t0, n: cnt[c] });
    });
    const landed = { R: 0, Y: 0, G: 0 }; Q1_SEQ.forEach((c, k) => { if (flights[k].u >= 1) landed[c]++; });
    /* 버킷 */
    ["R", "Y", "G"].forEach(c => {
      const x = bxOf(c), n = landed[c], tot = Q1_CNT[c];
      const bu = spring(prog(lt, .1 + ["R", "Y", "G"].indexOf(c) * .12, .6));
      ctx.save(); ctx.globalAlpha = clamp(bu * 2, 0, 1); ctx.translate(x, by + bh / 2); ctx.scale(bu, bu); ctx.translate(-x, -(by + bh / 2));
      card(ctx, x - bw / 2, by, bw, bh, { r: 26, bar: CC[c], stroke: n === tot && n > 0 ? CC[c] : C.line, fill: "rgba(20,29,39,.92)" });
      T(ctx, `${CN[c]} ${c}`, x - bw / 2 + 36, by + 54, { w: 900, s: 36, c: CC[c] });
      T(ctx, String(n), x, by + 205, { f: FM, w: 700, s: 150, a: "center", c: C.paper, glow: n > 0 ? CC[c] : null, gb: 22 });
      T(ctx, "회", x + 105, by + 205, { w: 700, s: 36, c: C.muted });
      /* 막대(정렬 시) */
      for (let i = 0; i < n; i++) { ctx.fillStyle = CC[c]; ctx.beginPath(); ctx.arc(x - bw / 2 + 110 + i * 34, by + bh - 32, 12, 0, 7); ctx.fill(); }
      ctx.restore();
    });
    /* 테이프 칩 */
    T(ctx, "관측 기록", tx(0) - 44, ty - 42, { w: 700, s: 22, c: C.muted });
    Q1_SEQ.forEach((c, k) => {
      const f = flights[k];
      const hx = tx(k), hy = ty;
      if (f.u <= 0) { card(ctx, hx - 36, hy - 30, 72, 60, { r: 12, fill: "transparent" }); RR(ctx, hx - 36, hy - 30, 72, 60, 12); ctx.fillStyle = CC[c]; ctx.fill(); T(ctx, c, hx, hy + 2, { f: FM, w: 700, s: 32, a: "center", b: "middle", c: "#0B1118" }); return; }
      if (f.u >= 1) { RR(ctx, hx - 36, hy - 30, 72, 60, 12); ctx.save(); ctx.globalAlpha = .22; ctx.fillStyle = CC[c]; ctx.fill(); ctx.restore(); ctx.strokeStyle = "rgba(255,255,255,.14)"; ctx.lineWidth = 2; ctx.stroke(); T(ctx, c, hx, hy + 2, { f: FM, w: 700, s: 28, a: "center", b: "middle", c: "rgba(232,237,243,.45)" }); return; }
      const e = eInOut(f.u), tgtx = bxOf(c), tgty = by + 120;
      const px = lerp(hx, tgtx, e), py = lerp(hy, tgty, e) - Math.sin(Math.PI * e) * 70;
      RR(ctx, hx - 36, hy - 30, 72, 60, 12); ctx.strokeStyle = "rgba(255,255,255,.12)"; ctx.lineWidth = 2; ctx.stroke();
      ctx.save(); ctx.translate(px, py); ctx.scale(lerp(1, .6, e), lerp(1, .6, e)); RR(ctx, -36, -30, 72, 60, 12); ctx.fillStyle = CC[c]; ctx.shadowColor = CC[c]; ctx.shadowBlur = 20; ctx.fill(); ctx.shadowBlur = 0; T(ctx, c, 0, 2, { f: FM, w: 700, s: 32, a: "center", b: "middle", c: "#0B1118" }); ctx.restore();
    });
    /* 합 12 */
    const su = spring(prog(lt, S.B(.40), .6));
    if (su > 0) { ctx.save(); ctx.translate(960, 672); ctx.scale(su, su); ctx.globalAlpha = clamp(su * 2, 0, 1); RR(ctx, -230, -26, 460, 52, 26); ctx.fillStyle = "rgba(61,182,113,.14)"; ctx.fill(); ctx.strokeStyle = C.ok; ctx.lineWidth = 2; ctx.stroke(); T(ctx, "각 1~6회 ✓   합 12 ✓", 0, 2, { f: FM, w: 700, s: 28, a: "center", b: "middle", c: C.ok }); ctx.restore(); }
    /* 정렬 화살표 + L 슬롯 */
    const au = eOut3(prog(lt, S.B(.54), .8));
    if (au > 0) {
      ctx.save(); ctx.globalAlpha = au;
      drawArrow(ctx, 300, 272, 300 + 1320 * au, 272, C.blue, 5, 18);
      T(ctx, "P2-01 · 오름차순 — 정렬 대상은 퍽 번호가 아니라 횟수", 960, 258, { w: 700, s: 26, c: C.blue, a: "center" });
      ctx.restore();
    }
    ["Y", "R", "G"].forEach((c, i) => {
      const t0 = S.B(.64) + i * .09, u = spring(prog(lt, t0, .6)); if (u <= 0) return;
      const x = bxSort[c], y = 712;
      ctx.save(); ctx.globalAlpha = clamp(u * 2, 0, 1); ctx.translate(x, y + 38); ctx.scale(u, u);
      drawArrow(ctx, 0, -44, 0, -26, C.blue, 3, 10);
      RR(ctx, -170, -14, 340, 66, 33); ctx.fillStyle = "rgba(111,168,255,.15)"; ctx.fill(); ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5; ctx.stroke();
      T(ctx, `L${i + 1}`, -130, 20, { f: FM, w: 700, s: 36, b: "middle", c: C.blue });
      T(ctx, `${CN[c]} ${Q1_CNT[c]}`, 40, 20, { w: 900, s: 34, b: "middle", a: "center", c: CC[c] });
      ctx.restore();
    });
    /* 동률 규칙 */
    const ru = spring(prog(lt, S.B(.86), .7));
    if (ru > 0) {
      ctx.save(); ctx.globalAlpha = clamp(ru * 2, 0, 1); ctx.translate(960, 846 + (1 - ru) * 40);
      T(ctx, "횟수가 같으면", -160, 8, { w: 500, s: 26, c: C.muted, a: "right" });
      ["R", "Y", "G"].forEach((c, i) => { const x = -110 + i * 120; ctx.fillStyle = CC[c]; RR(ctx, x - 34, -18, 68, 48, 12); ctx.fill(); T(ctx, c, x, 8, { f: FM, w: 700, s: 30, a: "center", b: "middle", c: "#0B1118" }); if (i < 2) drawArrow(ctx, x + 40, 6, x + 76, 6, C.muted, 3, 10); });
      T(ctx, "순서 유지", 190, 8, { w: 500, s: 26, c: C.muted });
      ctx.restore();
    }
  });
};
