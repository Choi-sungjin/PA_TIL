# 주사위 기억 로봇 — 수행 방법 모션그래픽

- 기준: 공식 발제 "주사위 기억 로봇" (2026.11.04, v5). 도전 A·B·C는 제외
- 결과물: `final.mp4` (1920×1080, 30fps, 약 4분)
- 흐름: 발제의 공개 연습 문제 Q1을 따라감 (신호 R G R R G R G G Y G Y G, 바코드 P2-01 → L1=Y2, L2=R4, L3=G6)
  ① 바코드 → ② 12회 점멸 → ③④ 횟수·그룹 배정 → ⑤ 전체 할당 → ⑥ 집기·놓기·주사위 눈 → ⑦ 재검증 → ⑧ 복귀 → 채점 100점 → 오류 정지

## 다시 만드는 방법
1. `python3 tts_openai.py <이 폴더> coral` — OpenAI `gpt-4o-mini-tts`로 장면별 음성 생성 후 `atempo=1.15` 배속 (`audio/`)
2. `python3 stt_check.py <이 폴더>` — 받아쓰기(whisper-1)로 스크립트 대조
3. `SPEED=1.0 python3 make_timing.py --audio` — 실제 음성 길이로 장면 시간 갱신
4. `node render.js` — Playwright로 `window.seek(t)` 프레임 렌더 → `preview_silent.mp4`
5. `python3 mux.py --speed 1.0 --out final.mp4` — 음성 합성

음성은 원래 Supertonic-3로 만들 계획이었지만, 클라우드 환경에서 huggingface.co가 막혀 있어 OpenAI TTS로 대체했다.
