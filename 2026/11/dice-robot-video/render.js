#!/usr/bin/env node
/* render.js - index.html 의 window.seek(t) 를 프레임마다 호출해 스크린샷 → ffmpeg(H.264) 로 mp4 생성.
   사용:
     node render.js                       # preview_silent.mp4 전체 렌더 (1920x1080, 30fps)
     node render.js --shots               # shots/ 에 장면별 대표 프레임 PNG 저장 (+콘솔 에러 검사)
     node render.js --at 12.5 --png x.png # 한 시점만 PNG
     옵션: --out file.mp4  --from 10 --to 40 (초)  --workers 4  --crf 20
   timing.json / script.json 을 바꾸면 그대로 재렌더 (장면 길이 = timing.json). */
const fs = require("fs"), path = require("path"), http = require("http"), { spawn } = require("child_process");
const { chromium } = require("playwright");
const ROOT = __dirname, FPS = 30;
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i < 0 ? d : (process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true); };
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css", ".woff2": "font/woff2", ".png": "image/png" };

function serve() {
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]).replace(/^\/+$/, "/index.html"));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { "Content-Type": MIME[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-store" }); fs.createReadStream(p).pipe(r);
    }).listen(0, "127.0.0.1", () => res(srv));
  });
}
async function openPage(browser, url, errors) {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
  page.on("pageerror", e => errors.push("[pageerror] " + e.message));
  page.on("requestfailed", r => errors.push("[requestfailed] " + r.url()));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready || window.__error, null, { timeout: 120000 });
  const er = await page.evaluate(() => window.__error); if (er) throw new Error("page init: " + er);
  return page;
}
const grab = async (page, t) => { const b64 = await page.evaluate(t => { window.seek(t); return document.getElementById("c").toDataURL("image/png").slice(22); }, t); return Buffer.from(b64, "base64"); };

(async () => {
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/index.html`;
  const browser = await chromium.launch(), errors = [];
  const workers = +arg("workers", 4);
  const pages = []; for (let i = 0; i < workers; i++) pages.push(await openPage(browser, url, errors));
  const total = await pages[0].evaluate(() => window.__total), scenes = await pages[0].evaluate(() => window.__scenes);
  console.log(`total ${total.toFixed(2)}s, ${scenes.length} scenes`);
  if (arg("at")) {
    const t = parseFloat(arg("at")), out = arg("png", "frame.png"); fs.writeFileSync(out, await grab(pages[0], t)); console.log("saved", out);
  } else if (arg("shots")) {
    fs.mkdirSync(path.join(ROOT, "shots"), { recursive: true });
    const list = JSON.parse(fs.readFileSync(path.join(ROOT, "shots_plan.json"), "utf8"));
    let n = 0; const jobs = [];
    for (const sc of scenes) for (const f of (list[sc.n] || [0.5])) jobs.push({ sc, f });
    for (let i = 0; i < jobs.length; i += workers) await Promise.all(jobs.slice(i, i + workers).map(async (j, k) => {
      const t = j.sc.start + Math.min(j.f, 0.9999) * j.sc.dur, name = `shots/s${String(j.sc.n).padStart(2, "0")}_${String(Math.round(j.f * 100)).padStart(3, "0")}.png`;
      fs.writeFileSync(path.join(ROOT, name), await grab(pages[k], t)); n++;
    }));
    /* 장면 전환 프레임 (경계 + 0.3초) */
    for (const sc of scenes.slice(1)) { const name = `shots/trans_s${String(sc.n).padStart(2, "0")}.png`; fs.writeFileSync(path.join(ROOT, name), await grab(pages[0], sc.start + 0.3)); n++; }
    console.log("shots saved:", n);
  } else {
    const out = arg("out", "preview_silent.mp4"), t0 = +arg("from", 0), t1 = Math.min(+arg("to", total), total);
    const f0 = Math.floor(t0 * FPS), f1 = Math.round(t1 * FPS);
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", String(arg("crf", 20)),
      "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", path.resolve(ROOT, out)], { stdio: ["pipe", "inherit", "inherit"] });
    const t00 = Date.now();
    for (let f = f0; f < f1; f += workers) {
      const idx = []; for (let k = 0; k < workers && f + k < f1; k++) idx.push(f + k);
      const bufs = await Promise.all(idx.map((fi, k) => grab(pages[k], fi / FPS)));
      for (const b of bufs) if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once("drain", r));
      if ((f - f0) % 150 < workers) { const done = f - f0 + workers, el = (Date.now() - t00) / 1000; console.log(`frame ${f}/${f1}  ${(done / el).toFixed(1)} fps  eta ${((f1 - f0 - done) / (done / el)).toFixed(0)}s`); }
    }
    ff.stdin.end(); await new Promise(r => ff.on("close", r));
    console.log("wrote", out, ((Date.now() - t00) / 1000).toFixed(0) + "s");
  }
  fs.writeFileSync(path.join(ROOT, "console_log.txt"), errors.length ? errors.join("\n") : "(no console errors/warnings)\n");
  console.log("console errors/warnings:", errors.length); errors.slice(0, 20).forEach(e => console.log("  ", e));
  await browser.close(); srv.close();
})().catch(e => { console.error("FATAL", e); process.exit(1); });
