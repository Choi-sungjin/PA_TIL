#!/bin/sh
# 사용: ./mux.sh [final.mp4]   (SPEED 환경변수로 배속, 기본 1.15)
cd "$(dirname "$0")" && python3 mux.py --out "${1:-final.mp4}" --speed "${SPEED:-1.15}"
