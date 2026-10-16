# 10강. 트러블슈팅 모음

실제로 겪은 문제와 해결법. 증상 → 원인 → 해결 순.

---

### 1. 크롤링 결과 한글이 깨진다
- **증상**: `����` 출력
- **원인**: 데이터는 UTF-8인데 Windows 콘솔이 cp949
- **해결**: `PYTHONIOENCODING=utf-8 python …`

### 2. 폼 페이지를 긁었는데 결과가 없다
- **원인**: 결과는 `good_luck.php`로 POST해야 나옴
- **해결**: `<form action>` 확인 → Firecrawl actions 또는 직접 POST (01강)

### 3. 생년월일을 바꿔도 1990년 결과만 나온다
- **원인**: 프로토타입이 예시 결과 하나로 고정돼 있었음
- **해결**: 헤더 입력칸 + 사주 계산 연동. **견본의 한계는 미리 알릴 것**

### 4. 폴더 삭제 시 `Device or resource busy`
- **원인**: 셸의 현재 작업 폴더가 그 안이었음
- **해결**: `cd` 로 빠져나온 뒤 `rmdir`

### 5. sed로 Windows 경로를 넣었더니 `C:devortune-service`
- **원인**: `\f`(form feed)·`\d` 등이 이스케이프로 해석됨
- **해결**: 경로는 슬래시로 `Path("C:/dev/fortune-service/data")`

### 6. 빌드 후 개발 서버가 500, 다음 실행은 3001 포트
- **원인**: 백그라운드 작업을 멈춰도 **node 프로세스가 남아** 3000 포트를 잡고 있었고, 빌드가 `.next`를 바꿔버림
- **해결**:
  ```powershell
  Get-NetTCPConnection -LocalPort 3000 -State Listen | % { Stop-Process -Id $_.OwningProcess -Force }
  ```
  그 뒤 `.next` 지우고 `npm run dev`. **dev 서버 실행 중엔 build 하지 않기**

### 7. `basePath has to start with a /, found "C:/Program Files/Git/fortune-service"`
- **원인**: Git Bash(MSYS)가 `/fortune-service`를 Windows 경로로 자동 변환
- **해결**: `MSYS_NO_PATHCONV=1 PAGES_BASE_PATH=/fortune-service npm run build`

### 8. `git push` 403
- **원인**: git이 gh CLI 토큰이 아닌 다른 자격 증명을 사용
- **해결**: `gh auth setup-git` 후 push

### 9. Vercel "Could not access the repository"
- **원인**: Vercel 계정과 GitHub 계정이 연결되지 않음 (GitHub App 설치 ≠ Vercel 로그인 연결)
- **해결**: GitHub Pages로 전환 (09강)

### 10. 저장소를 비공개로 바꾸자 사이트가 404
- **원인**: 무료 플랜은 비공개 저장소의 Pages 미지원
- **해결**: 사이트 전용 공개 저장소 분리. **먼저 새 사이트를 띄우고 나서** 소스를 비공개로 (다운타임 최소화)

### 11. 배포 직후 타로 카드가 안 보임
- **원인**: 새 Pages 사이트 첫 로딩이 느림 (JS가 늦게 실행)
- **해결**: 잠시 후 새로고침 — 정상. 검증할 땐 대기 시간을 충분히

### 12. 꿈해몽 전체 크롤링이 10시간+
- **원인**: 색인어 936개 × 목록 페이지 × 꿈마다 1초
- **해결**: `--cats`, `--per-cat`, `--max-pages`로 **필요한 만큼만**

### 13. 병렬 작업 중 충돌 위험
- **해결**: 파일 소유권 분리, npm install은 한 작업만, 시작 전 커밋, 공유 export 고정 (06강)

---

## 교훈 요약
1. 출력 깨짐 ≠ 데이터 깨짐
2. 백그라운드 프로세스는 포트까지 확인하고 정리
3. Windows + Git Bash는 경로 변환·이스케이프를 의심
4. 공개 범위를 바꾸기 전에 영향(사이트 중단)을 먼저 확인
