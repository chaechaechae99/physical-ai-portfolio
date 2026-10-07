# 🐍 모션 뱀게임

웹캠 앞에서 취한 동작을 [Teachable Machine](https://teachablemachine.withgoogle.com/) 이미지 모델로 인식해서 뱀을 조종하는 웹 기반 뱀게임입니다.

## 작업 내용 (2026-10-07)

- `index.html` 하나로 동작하는 뱀게임 구현 (HTML + CSS + JavaScript, 별도 빌드 없음)
- Teachable Machine 모델 연동
  - 모델 주소: https://teachablemachine.withgoogle.com/models/Ym9OG82Ii/
  - 클래스 5개를 방향에 연결

    | 클래스 | 동작 |
    |---|---|
    | 좌 | 왼쪽으로 이동 |
    | 우 | 오른쪽으로 이동 |
    | 상 | 위로 이동 |
    | 하 | 아래로 이동 |
    | 중립 | 현재 방향 유지 |

- 클래스별 인식 확률을 막대그래프로 실시간 표시
- 인식 임계값 슬라이더 (기본 0.80): 이 값 이상으로 확실할 때만 방향을 바꿈
- 정반대 방향으로 바로 꺾는 것은 막아서, 오인식으로 바로 죽지 않도록 함
- 키보드 조작 지원 (방향키 / WASD), 스페이스바로 시작·일시정지
- 속도 5단계 조절, 점수와 최고 점수 표시 (최고 점수는 브라우저에 저장)
- GitHub 저장소 생성 및 업로드

## 실행 방법

1. `index.html`을 크롬으로 엽니다. (모델과 라이브러리를 CDN에서 불러오므로 인터넷 연결 필요)
2. **📷 카메라 켜기**를 누르고 카메라 권한을 허용합니다.
3. **▶ 게임 시작** 또는 스페이스바로 게임을 시작합니다.

브라우저가 `file://`에서 카메라를 막는 경우, 폴더에서 로컬 서버를 띄운 뒤 `http://localhost:8000`으로 접속하세요.

```
python -m http.server 8000
```

## 참고

- 웹캠 화면은 Teachable Machine 학습 환경과 같게 좌우 반전되어 있습니다. 좌·우가 반대로 인식되면 `index.html`의 `new tmImage.Webcam(224, 224, true)`에서 `true`를 `false`로 바꿔보세요.
- 사용 라이브러리: TensorFlow.js 1.3.1, `@teachablemachine/image` 0.8
