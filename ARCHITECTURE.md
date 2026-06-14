# Space Timer Architecture

이 문서는 AI나 새 기여자가 프로젝트 구조를 빠르게 이해하고 안전하게 수정할 수 있도록 작성한 안내서입니다.

## 개요

이 프로젝트는 빌드 단계 없이 GitHub Pages에서 그대로 호스팅되는 정적 웹 앱입니다. `index.html`이 마크업과 스크립트 로딩 순서를 담당하고, 앱 로직은 `src/` 아래의 classic script 파일들이 `window.SpaceTimer*` 전역 네임스페이스를 통해 연결됩니다.

ES module import/export를 쓰지 않는 이유는 현재 배포 방식을 단순하게 유지하기 위해서입니다. 새 파일을 추가할 때는 `index.html`에 `<script src="./src/..."></script>`를 올바른 순서로 추가해야 합니다.

## 주요 진입점

- `index.html`: 화면 마크업, CSS/스크립트 로드 순서
- `styles/app.css`: Tailwind로 표현하기 어려운 앱 전용 스타일과 애니메이션
- `src/app/main.js`: 앱 조립 루트. 상태, 데이터, 서비스, view, controller, 이벤트 라우터를 초기화합니다.
- `src/app/events.js`: DOM 이벤트 위임 라우터. `data-*` 속성을 실제 핸들러 호출로 매핑합니다.

## 스크립트 로딩 순서

`index.html`의 스크립트 순서가 의존성 순서입니다.

1. `src/services/audio.js`
2. `src/services/speech.js`
3. `src/services/effects.js`
4. `src/services/preferences.js`
5. `src/state.js`
6. `src/data/voiceCommands.js`
7. `src/data/missionData.js`
8. `src/data/categoryIcons.js`
9. `src/utils/raceStats.js`
10. `src/dom/elements.js`
11. `src/features/setupView.js`
12. `src/views/raceView.js`
13. `src/views/resultView.js`
14. `src/features/raceController.js`
15. `src/app/events.js`
16. `src/app/main.js`

`main.js`는 마지막에 실행되어 앞에서 등록된 전역 객체들을 초기화합니다.

## 전역 네임스페이스

각 모듈은 IIFE 형태로 실행되고 필요한 공개 API만 `window`에 등록합니다.

- `window.SpaceTimerState`: 앱 상태 객체
- `window.SpaceTimerData`: 명령어, 자동차/목적지, 카테고리 데이터
- `window.SpaceTimerRaceStats`: 시간 포맷, 랩 합계, 순위, 결과 요약 등 순수 계산
- `window.SpaceTimerDom`: `byId`, `all`, `closest` DOM 헬퍼
- `window.SpaceTimerSetupView`: 설정 화면 렌더링과 선택 상태 반영
- `window.SpaceTimerRaceView`: 레이스 화면, 타이머, 트랙, 랩 목록 렌더링
- `window.SpaceTimerResultView`: 결과 화면 렌더링
- `window.SpaceTimerRaceController`: 레이스 상태 전환과 흐름 제어
- `window.SpaceTimerSpeech`: Web Speech API와 음성 합성
- `window.SpaceTimerEffects`: 배경 파티클과 confetti 효과
- `window.SpaceTimerPreferences`: localStorage 기반 설정/즐겨찾기 저장
- `window.SpaceTimerEvents`: 이벤트 위임 라우터

`audio.js`는 아직 `sndClick`, `sndBeepLow` 같은 classic script 전역 함수를 제공합니다. `main.js`는 ESLint를 위해 해당 함수들을 `/* global ... */` 주석으로 선언합니다.

## 책임 분리

### App Layer

`src/app/main.js`

- 앱 전체를 조립합니다.
- 각 모듈의 `init(...)`에 의존성을 주입합니다.
- 초기 화면 렌더링과 이벤트 바인딩을 실행합니다.
- 음성 명령을 실제 레이스 동작으로 라우팅합니다.

`src/app/events.js`

- 클릭/변경 이벤트를 한 곳에서 위임 처리합니다.
- `data-action`, `data-lap-diff`, `data-car-id`, `data-destination-id`, `data-delete-lap-index`를 해석합니다.
- 실제 동작 구현은 알지 않고, `main.js`가 넘긴 핸들러만 호출합니다.

### Data and State

`src/state.js`

- 현재 앱 상태를 담는 단일 mutable 객체입니다.
- 예: `appState`, `targetLaps`, `currentLap`, `lapRecords`, `chosenCar`, `chosenDestination`

`src/data/*.js`

- 앱에서 쓰는 정적 데이터입니다.
- 음성 명령어, 자동차/목적지 목록, 카테고리 아이콘 등이 포함됩니다.

### Features

`src/features/setupView.js`

- 설정 화면의 렌더링과 선택 상태 반영을 담당합니다.
- 자동차/목적지 카테고리 탭, 선택 그리드, 랜덤 선택, 장수 변경을 처리합니다.
- 선택 결과는 `state`에 기록하고 트랙/결과 화면의 관련 DOM도 갱신합니다.

`src/features/raceController.js`

- 레이스 상태 전환을 담당합니다.
- 시작 대기, 랩 시작, 랩 완료, 결과 진입, 재시작, 기록 삭제 흐름을 제어합니다.
- 직접 DOM을 만지지 않고 `raceView`/`resultView`를 호출합니다.

### Views

`src/views/raceView.js`

- 레이스 중 화면 표현을 담당합니다.
- 음성 테스트 버튼 상태, 메인 버튼 상태, 카운트다운, 타이머, 로켓 위치, 랩 대시보드를 갱신합니다.

`src/views/resultView.js`

- 결과 화면 표시와 최종 기록 렌더링을 담당합니다.
- 총 시간, 평균 시간, 최고 기록, 랩별 상세 결과를 표시합니다.

### Services

`src/services/audio.js`

- 효과음을 생성합니다.
- 현재는 Web Audio API 기반 classic 전역 함수 형태입니다.

`src/services/speech.js`

- Web Speech API 음성 인식과 speech synthesis를 담당합니다.
- 첫 화면에서는 실제 마이크를 시작하지 않고, 미션 화면 진입 후부터 인식이 시작되도록 제어합니다.
- 음성 명령 매칭 후 `main.js`의 `simulateVoiceCommand`로 전달합니다.

`src/services/effects.js`

- 우주 배경 파티클과 결과 화면 confetti 애니메이션을 담당합니다.

`src/services/preferences.js`

- 로켓/도착지 즐겨찾기를 `localStorage`에 저장합니다.
- 브라우저 저장소가 제한되거나 저장 값이 깨진 경우에도 앱이 계속 동작하도록 기본값으로 복구합니다.
- 즐겨찾기 개수 제한 같은 저장 정책은 이 서비스에서 관리합니다.

### Utils and DOM

`src/utils/raceStats.js`

- 순수 계산 함수 모음입니다.
- 단위 테스트 대상입니다.

`src/dom/elements.js`

- DOM 접근 헬퍼입니다.
- view나 feature 모듈은 직접 `document.getElementById`를 반복하기보다 이 헬퍼를 사용합니다.

## 주요 흐름

### 초기 로드

1. `index.html`이 모든 classic script를 순서대로 로드합니다.
2. `src/app/main.js`가 상태/데이터/서비스/view/controller를 초기화합니다.
3. 설정 화면 카테고리와 선택 그리드를 렌더링합니다.
4. 랜덤 미션 선택을 한 번 수행합니다.
5. 음성 상태는 "첫 미션부터 마이크 대기"로 표시합니다.

### 레이스 시작

1. 사용자가 `경기 시작하기`를 누르거나 음성 시작 명령을 냅니다.
2. 이벤트 라우터 또는 음성 라우터가 `enterMissionReady`를 호출합니다.
3. `raceController`가 상태를 `LAP_WAITING`으로 바꾸고 러닝 화면을 보여줍니다.
4. 마이크 옵션이 켜져 있으면 이 시점부터 실제 음성 인식을 시작합니다.

### 랩 진행

1. 시작 명령 또는 메인 버튼으로 `startNextLap`이 호출됩니다.
2. 상태가 `FOCUS`로 바뀌고 타이머 interval이 시작됩니다.
3. `raceView.updateLapTimer()`가 타이머와 로켓 위치를 갱신합니다.
4. 끝 명령 또는 메인 버튼으로 `completeLap`이 호출됩니다.
5. 완료 애니메이션 후 다음 랩 대기 또는 결과 화면으로 이동합니다.

### 결과

1. 마지막 랩 완료 후 `finishRace`가 호출됩니다.
2. 음성 인식을 중지합니다.
3. `resultView`가 결과 화면과 기록 목록을 렌더링합니다.
4. fanfare와 confetti 효과를 실행합니다.

## 테스트

주요 명령:

```bash
npm run lint
npm test
```

세부 명령:

```bash
npm run test:unit
npm run test:e2e
npm run test:headed
npm run test:ui
```

테스트 구조:

- `tests/unit/raceStats.test.mjs`: 순수 계산 유틸 단위 테스트
- `tests/e2e/*.spec.js`: Playwright 기반 사용자 흐름 테스트
- `tests/helpers/speechMock.js`: Web Speech API 테스트 목
- `tests/helpers/run-playwright.mjs`: 정적 서버 실행 후 Playwright 구동
- `tests/helpers/check-inline-scripts.mjs`: `index.html` 인라인 스크립트 문법 검사. 현재 인라인 앱 스크립트는 0개입니다.

## 수정 가이드

- 새 화면 렌더링은 가능하면 `src/views/`에 둡니다.
- 상태 전환 흐름은 `src/features/raceController.js`에 둡니다.
- 설정 화면 선택/렌더링은 `src/features/setupView.js`에 둡니다.
- Web Speech API나 speech synthesis 변경은 `src/services/speech.js`에서 처리합니다.
- 시간/순위/요약 계산은 `src/utils/raceStats.js`에 둡니다.
- 새 script 파일을 추가하면 `index.html`의 로딩 순서를 반드시 확인합니다.
- 동작 변경 후에는 최소 `npm run lint`와 `npm test`를 실행합니다.

## 주의할 점

- 이 프로젝트는 빌드 없는 static hosting을 전제로 합니다. 번들러나 module import 전환은 별도 큰 단계로 다뤄야 합니다.
- `state`는 shared mutable object입니다. 여러 모듈이 같은 객체를 참조하므로, 상태 필드 이름 변경은 영향 범위가 큽니다.
- 첫 화면 음성 오탐 방지를 위해 `speech.js`는 `SETUP` 상태에서 실제 인식을 시작하지 않습니다. 이 동작은 회귀 테스트로 보호되고 있습니다.
- `raceController`는 DOM을 직접 조작하지 않는 방향을 유지합니다. 화면 변경은 `raceView` 또는 `resultView`로 보냅니다.
- `events.js`는 이벤트 해석만 담당해야 합니다. 비즈니스 로직을 넣지 않는 편이 좋습니다.
