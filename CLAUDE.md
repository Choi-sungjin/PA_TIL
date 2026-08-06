# TIL 저장소 규칙

- 파일 경로: `YYYY/MM/YYYY-MM-DD.md` 고정. 이 규칙이 URL을 결정하므로 변경 금지.
- 커밋 메시지: `docs: TIL YYYY-MM-DD` 형식
- **커밋 메시지에 `Co-Authored-By:` 트레일러를 넣지 않는다.**
  GitHub이 공동 작성자로 읽어 "Choi-sungjin and claude"로 표시된다. 본인 단독 기록으로 남긴다.
- 브랜치: main 하나만 사용 (PR 실습 시에만 til/YYYY-MM-DD)
- force push, history 재작성 금지
- 커밋 전 파일이 300자 이상인지 확인. 미만이면 미작성으로 보고 중단.
- 푸시 후 raw.githubusercontent.com URL이 200인지 검증하고,
  성공 시에만 `~/til-bot/today_url.txt` 갱신
- 토큰/비밀번호를 저장소 안에 쓰지 말 것

## 환경 메모

**주 작업 PC는 Ubuntu다.** Windows PC는 보조 (최초 세팅을 여기서 함).

| | Ubuntu (주) | Windows (보조) |
|---|---|---|
| 저장소 | `~/TIL` | `C:\Users\MSI\TIL` |
| URL 기록 | `~/til-bot/today_url.txt` | `C:\Users\MSI\til-bot\today_url.txt` |

- 저장소 **내부** 경로는 OS와 무관하게 `YYYY/MM/YYYY-MM-DD.md` 형식을 유지한다.
  이 규칙이 GitHub URL을 결정한다.
- 줄바꿈은 `.gitattributes`의 `* text=auto eol=lf`로 LF 통일. 임의로 바꾸지 말 것.
- 두 PC를 오갈 때는 작업 시작 전 `git pull` 을 먼저 한다. 안 그러면 다음 push가 거부된다.
- 인증(`gh auth login` / git credential)은 **PC마다 따로** 해야 한다. 저장소를 clone 했다고 인증이 따라오지 않는다.

## 원격 저장소

- `origin` = `https://github.com/Choi-sungjin/PA_TIL.git` (**public**)
- public이므로 강의 자료 원문을 그대로 옮기지 않는다. 위 저작권 항목 참고.
- 제출용 URL: `https://github.com/Choi-sungjin/PA_TIL/blob/main/YYYY/MM/YYYY-MM-DD.md`
- 검증용 raw URL: `https://raw.githubusercontent.com/Choi-sungjin/PA_TIL/main/YYYY/MM/YYYY-MM-DD.md`

## 저작권

- 강의 자료(Notion 등) 원문을 그대로 복사해 오지 않는다.
  공개 저장소이므로 **본인이 이해한 내용을 직접 쓴 정리 노트**만 커밋한다.
