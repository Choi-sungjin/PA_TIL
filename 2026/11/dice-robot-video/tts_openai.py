"""OpenAI TTS로 장면별 내레이션 생성 → atempo 1.15 → video/audio/<id>.wav"""
import json, subprocess, sys, urllib.request
from pathlib import Path
V = Path(sys.argv[1]); voice = sys.argv[2] if len(sys.argv) > 2 else "coral"
only = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else None
raw = V / "audio_raw"; out = V / "audio"; raw.mkdir(exist_ok=True); out.mkdir(exist_ok=True)
INSTR = ("한국어 로봇 미션 설명 영상의 내레이터. 또렷하고 활기찬 톤, 자연스러운 표준어 억양. "
         "숫자와 영문 약어는 적힌 한글 표기 그대로 읽고, 문장 사이 쉼은 짧게.")
for s in json.loads((V / "script.json").read_text()):
    if only and s["id"] not in only: continue
    body = json.dumps({"model": "gpt-4o-mini-tts", "voice": voice, "input": s["tts"],
                       "instructions": INSTR, "response_format": "wav"}).encode()
    req = urllib.request.Request("https://api.openai.com/v1/audio/speech", data=body,
          headers={"Authorization": "Bearer sk-dummy", "Content-Type": "application/json"})
    p = raw / f"{s['id']}.wav"; p.write_bytes(urllib.request.urlopen(req, timeout=180).read())
    q = out / f"{s['id']}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(p), "-af",
                    "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,atempo=1.15",
                    "-ar", "44100", "-ac", "1", str(q)], check=True)
    d = lambda f: float(subprocess.check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",str(f)]))
    print(s["id"], f"raw {d(p):.2f}s -> 1.15x {d(q):.2f}s", flush=True)
