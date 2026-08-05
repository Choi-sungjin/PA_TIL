# TIL 저장소 규칙

- 파일 경로: `YYYY/MM/YYYY-MM-DD.md` 고정. 이 규칙이 URL을 결정하므로 변경 금지.
- 커밋 메시지: `docs: TIL YYYY-MM-DD` 형식
- 브랜치: main 하나만 사용 (PR 실습 시에만 til/YYYY-MM-DD)
- force push, history 재작성 금지
- 커밋 전 파일이 300자 이상인지 확인. 미만이면 미작성으로 보고 중단.
- 푸시 후 raw.githubusercontent.com URL이 200인지 검증하고,
  성공 시에만 `~/til-bot/today_url.txt` 갱신
- 토큰/비밀번호를 저장소 안에 쓰지 말 것

## 환경 메모

- 이 PC는 Windows다. `~` = `C:\Users\MSI`
  - `~/TIL` → `C:\Users\MSI\TIL`
  - `~/til-bot/today_url.txt` → `C:\Users\MSI\til-bot\today_url.txt`
- 저장소 **내부** 경로는 OS와 무관하게 `YYYY/MM/YYYY-MM-DD.md` 형식을 유지한다.

## 저작권

- 강의 자료(Notion 등) 원문을 그대로 복사해 오지 않는다.
  공개 저장소이므로 **본인이 이해한 내용을 직접 쓴 정리 노트**만 커밋한다.
