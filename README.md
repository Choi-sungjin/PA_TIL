# PA_TIL (Today I Learned)

매일 배운 내용을 기록하는 개인 학습 저장소입니다.

---

## 📌 디렉터리 및 파일 규칙

```text
YYYY/MM/YYYY-MM-DD.md

---

## ⚙️ 저장소 운용 및 커밋 규칙

* **커밋 메시지**: `docs: TIL YYYY-MM-DD` 형식 준수
* **단독 작성 엄수**: 커밋 메시지에 `Co-Authored-By:` 트레일러 절대 금지
* **브랜치 전략**: `main` 브랜치 단독 사용 (단, PR 실습 시에만 `til/YYYY-MM-DD` 활용)
* **이력 보호**: `force push` 및 git history 재작성 절대 금지
* **최소 작성 분량**: 커밋 전 파일 내용이 **300자 이상**인지 확인 (300자 미만 시 미작성으로 보고 작업 중단)
* **URL 검증 및 갱신**: 푸시 후 `raw.githubusercontent.com` URL 응답이 `200`인지 확인하고, 성공 시에만 `today_url.txt` 파일 갱신
* **보안**: 저장소 내부에 토큰, 비밀번호 등 민감 정보 절대 작성 금지
* **저작권 준수**: 강의 자료(Notion 등) 원문을 그대로 복사하지 않으며, 공개(Public) 저장소 특성에 맞게 **본인이 이해한 내용을 직접 정리한 노트**만 커밋

---
### 주의사항

* **줄바꿈 설정**: `.gitattributes` 파일의 `* text=auto eol=lf` 설정을 유지하여 LF로 통일 (임의 변경 금지)
* **작업 전 동기화**: 두 PC를 오갈 때는 작업 시작 전에 반드시 `git pull` 먼저 수행 (미수행 시 다음 push 거부됨)
* **인증 개별 관리**: `gh auth login` 및 Git Credential 인증은 PC마다 각각 따로 설정

---
