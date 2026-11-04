#!/usr/bin/env python3
"""mux.py - audio/<id>.wav 를 장면 시작 시각에 맞춰 이어 붙여 mp4 에 입힌다.
  python3 mux.py [--video preview_silent.mp4] [--out final.mp4] [--speed 1.15]
- 시작 시각: schedule.js(= render.js 와 같은 로직)로 계산한 audio_start (슬롯 시작 + 0.3초)
- 배속: 기본 1.15 (ffmpeg atempo). 이미 배속된 파일이면 --speed 1.0
- audio/ 에 파일이 하나도 없으면 무음 mp4 를 그대로 복사한다.
- 음성이 슬롯보다 길면(= timing.json 이 실제 음성 길이 기준이 아님) 경고 -> make_timing.py --audio 후 재렌더.
순서(권장): 1) audio/s01.wav … 배치  2) python3 make_timing.py --audio  3) node render.js  4) python3 mux.py"""
import argparse, json, os, shutil, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
ap = argparse.ArgumentParser()
ap.add_argument('--video', default='preview_silent.mp4'); ap.add_argument('--out', default='final.mp4')
ap.add_argument('--speed', type=float, default=1.15); ap.add_argument('--audio-dir', default='audio')
a = ap.parse_args()
os.chdir(here)
sched = json.loads(subprocess.check_output(['node', '-e',
    "const s=require('./schedule.js').build(require('./script.json'),require('./timing.json'));console.log(JSON.stringify(s))"]))
def dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode())
items = []
for sc in sched['scenes']:
    for it in sc['items']:
        for ext in ('wav', 'mp3', 'flac', 'm4a'):
            p = os.path.join(a.audio_dir, f"{it['id']}.{ext}")
            if os.path.exists(p):
                d = dur(p) / a.speed
                if d > it['slot'] - 0.6 + 0.05: print(f"WARN {it['id']}: audio {d:.2f}s > slot {it['slot']-0.6:.2f}s (timing.json 갱신 필요)")
                items.append((it, p)); break
        else: print(f"missing audio for {it['id']}")
if not items:
    print('오디오 없음 -> 무음 영상 복사'); shutil.copy(a.video, a.out); sys.exit(0)
tmp = os.path.join(here, '.mux_mix.wav')
cmd = ['ffmpeg', '-y', '-loglevel', 'error']
for _, p in items: cmd += ['-i', p]
fc = []; labs = []
for k, (it, _) in enumerate(items):
    ms = int(round(it['audio_start'] * 1000))
    f = f"[{k}:a]aresample=48000,aformat=channel_layouts=mono"
    if abs(a.speed - 1) > 1e-6: f += f",atempo={a.speed}"
    f += f",adelay={ms}:all=1[a{k}]"; fc.append(f); labs.append(f"[a{k}]")
fc.append(''.join(labs) + f"amix=inputs={len(labs)}:normalize=0:dropout_transition=0,apad=whole_dur={sched['total']}[aout]")
cmd += ['-filter_complex', ';'.join(fc), '-map', '[aout]', '-t', str(sched['total']), tmp]
print(f"{len(items)} audio clips, speed {a.speed}, total {sched['total']}s")
subprocess.check_call(cmd)   # 1) 장면 시작 시각에 맞춰 믹스한 wav
subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', '-i', a.video, '-i', tmp, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', str(sched['total']), '-movflags', '+faststart', a.out])  # 2) 영상에 입힘
os.remove(tmp); print('wrote', a.out)
