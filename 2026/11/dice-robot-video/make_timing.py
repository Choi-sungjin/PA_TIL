#!/usr/bin/env python3
"""timing.json 생성.
  python3 make_timing.py            -> tts 글자 수 기반 추정 (초당 7.5자 기준 + 앞뒤 여유 0.6초)
  python3 make_timing.py --audio    -> audio/<id>.wav 실제 길이 기반 (SPEED 배속 반영: 길이/SPEED + 0.6)
환경변수 SPEED(기본 1.15): 음성에 적용할 배속. 이미 1.15배속된 파일이면 SPEED=1.0 으로 실행.
"""
import json, os, subprocess, sys
here = os.path.dirname(os.path.abspath(__file__))
script = json.load(open(os.path.join(here, 'script.json'), encoding='utf-8'))
PAD = 0.6
use_audio = '--audio' in sys.argv
speed = float(os.environ.get('SPEED', '1.15'))
out = {}
for e in script:
    i = e['id']
    if use_audio:
        p = os.path.join(here, 'audio', i + '.wav')
        if not os.path.exists(p):
            sys.exit('missing ' + p)
        d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())
        out[i] = round(d / speed + PAD, 2)
    else:
        out[i] = round(len(e['tts']) / 7.5 + PAD, 2)
json.dump(out, open(os.path.join(here, 'timing.json'), 'w'), indent=1)
print(out)
