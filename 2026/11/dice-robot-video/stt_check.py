import json, sys, subprocess, difflib, re
from pathlib import Path
V = Path(sys.argv[1]); res = {}
norm = lambda t: re.sub(r"[\s\.,·!?\-–—~:;()\"']", "", t)
for s in json.loads((V/"script.json").read_text()):
    f = V/"audio"/f"{s['id']}.wav"
    out = subprocess.check_output(["curl","-sS","-m","180","https://api.openai.com/v1/audio/transcriptions",
        "-H","Authorization: Bearer sk-dummy","-F",f"file=@{f}","-F","model=whisper-1","-F","language=ko",
        "-F","prompt=로봇 미션 설명. 표기 예: 엘 원, 피투 공일, 큐 원, 알 와이 지"]).decode()
    t = json.loads(out).get("text", out)
    a, b = norm(s["tts"]), norm(t)
    sm = difflib.SequenceMatcher(None, a, b)
    cer = 1 - sm.ratio()
    diffs = [(a[i1:i2], b[j1:j2]) for op,i1,i2,j1,j2 in sm.get_opcodes() if op != "equal"]
    res[s["id"]] = {"stt": t, "cer": round(cer,3), "diffs": diffs}
    print(f"{s['id']}: 차이율 {cer:.3f}  {diffs}", flush=True)
(V/"review"/"stt_check.json").write_text(json.dumps(res, ensure_ascii=False, indent=1))
