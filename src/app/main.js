/* global initAudio, sndBeepLow, sndBeepHigh, sndNitro, sndSuccess, sndFanfare, sndClick */
// --- 0. 기본 상태 및 기획 변수 ---
const state = window.SpaceTimerState;
const {
  START_COMMANDS,
  FINISH_COMMANDS
} = window.SpaceTimerData;
const dom = window.SpaceTimerDom;
const byId = id => dom.byId(id);
const raceStats = window.SpaceTimerRaceStats;
const effectsService = window.SpaceTimerEffects;
const preferences = window.SpaceTimerPreferences;


// --- 1. 실제 마이크 음성 인식 시스템 (Web Speech API) ---
const speechService = window.SpaceTimerSpeech;
speechService.init({
  state,
  startCommands: START_COMMANDS,
  finishCommands: FINISH_COMMANDS,
  initAudio,
  onCommand: simulateVoiceCommand
});
const primeUserAudio = () => speechService.primeUserAudio();
const toggleSpeechRecognition = () => speechService.toggleSpeechRecognition();
const setSpeechRecognitionWaitingStatus = () => speechService.setSpeechRecognitionWaitingStatus();
const startRealSpeechEngine = () => speechService.startRealSpeechEngine();
const stopRealSpeechEngine = () => speechService.stopRealSpeechEngine();
const speakMissionTime = ms => speechService.speakMissionTime(ms);
const isSpeechRecognitionActive = () => speechService.isSpeechRecognitionActive();
const openVoiceCommandHelp = () => speechService.openVoiceCommandHelp();
const closeVoiceCommandHelp = () => speechService.closeVoiceCommandHelp();

const setupView = window.SpaceTimerSetupView;
setupView.init({
  state,
  data: window.SpaceTimerData,
  dom,
  preferences,
  primeUserAudio,
  playClick: sndClick
});
const renderCarCategoryTabs = () => setupView.renderCarCategoryTabs();
const renderDestinationCategoryTabs = () => setupView.renderDestinationCategoryTabs();
const renderCarSelectionGrid = () => setupView.renderCarSelectionGrid();
const renderDestinationSelectionGrid = () => setupView.renderDestinationSelectionGrid();
const renderFavorites = () => setupView.renderFavorites();
const randomizeMissionSelection = shouldPrimeAudio => setupView.randomizeMissionSelection(shouldPrimeAudio);
const selectCarCategory = category => setupView.selectCarCategory(category);
const selectDestinationCategory = category => setupView.selectDestinationCategory(category);
const selectCar = (color, shouldPrimeAudio) => setupView.selectCar(color, shouldPrimeAudio);
const selectDestination = (destinationId, shouldPrimeAudio) => setupView.selectDestination(destinationId, shouldPrimeAudio);
const toggleFavoriteCar = id => setupView.toggleFavoriteCar(id);
const toggleFavoriteDestination = id => setupView.toggleFavoriteDestination(id);
const removeFavoriteCar = id => setupView.removeFavoriteCar(id);
const removeFavoriteDestination = id => setupView.removeFavoriteDestination(id);
const changeLaps = diff => setupView.changeLaps(diff);

const raceView = window.SpaceTimerRaceView;
raceView.init({
  state,
  dom,
  raceStats,
  setupView
});
const resultView = window.SpaceTimerResultView;
resultView.init({
  state,
  dom,
  raceStats
});

const raceController = window.SpaceTimerRaceController;
raceController.init({
  state,
  raceStats,
  raceView,
  resultView,
  audio: {
    click: sndClick,
    beepLow: sndBeepLow,
    beepHigh: sndBeepHigh,
    nitro: sndNitro,
    success: sndSuccess,
    fanfare: sndFanfare
  },
  speech: {
    primeUserAudio,
    isSpeechRecognitionActive,
    startRealSpeechEngine,
    stopRealSpeechEngine,
    speakMissionTime,
    setSpeechRecognitionWaitingStatus
  },
  effects: effectsService
});
const handleMainAction = () => raceController.handleMainAction();
const enterMissionReady = () => raceController.enterMissionReady();
const startNextLap = () => raceController.startNextLap();
const completeLap = () => raceController.completeLap();
const restartApp = () => raceController.restartApp();
const deleteRecordedLap = index => raceController.deleteRecordedLap(index);
const undoLastLap = () => raceController.undoLastLap();

// --- 2. 가상 음성 명령 시뮬레이션 시스템 ---
function simulateVoiceCommand(word) {
  primeUserAudio();
  
  // 실제 명령 로직 수행
  if (word === '시작') {
    if (state.appState === "SETUP") {
      createVoiceBubble(word);
      sndClick();
      enterMissionReady();
    } else if (state.appState === "LAP_WAITING") {
      createVoiceBubble(word);
      sndClick();
      startNextLap();
    }
  } else if (word === '끝') {
    if (state.appState === "FOCUS") {
      createVoiceBubble(word);
      completeLap();
    }
  }
}

// 말풍선 귀여운 연출 추가
function createVoiceBubble(text) {
  const container = byId('bubble-container');
  container.innerHTML = ''; // 단일화

  const bubble = document.createElement('div');
  bubble.className = "voice-bubble bg-indigo-500 text-slate-950 game-font text-2xl md:text-3xl px-6 py-3 rounded-2xl border-4 border-white shadow-2xl relative font-extrabold flex items-center gap-2";
  bubble.innerHTML = `🗣️ "${text}!!!"`;

  // 꼬리표 디테일
  const arrow = document.createElement('div');
  arrow.className = "absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-t-white";
  bubble.appendChild(arrow);

  container.appendChild(bubble);

  // 일정시간 후 제거
  setTimeout(() => {
    bubble.remove();
  }, 1800);
}

// 앱 이벤트 바인딩
function bindEventHandlers() {
  window.SpaceTimerEvents.bind({
    dom,
    handlers: {
      toggleSpeechRecognition,
      changeLaps,
      selectCar,
      selectDestination,
      toggleFavoriteCar,
      toggleFavoriteDestination,
      removeFavoriteCar,
      removeFavoriteDestination,
      deleteRecordedLap,
      openVoiceCommandHelp,
      closeVoiceCommandHelp,
      randomizeMissionSelection,
      enterMissionReady,
      handleMainAction,
      undoLastLap,
      restartApp,
      selectCarCategory,
      selectDestinationCategory
    }
  });
}

// Initial UI binding
bindEventHandlers();
renderCarCategoryTabs();
renderDestinationCategoryTabs();
renderFavorites();
renderCarSelectionGrid();
renderDestinationSelectionGrid();
randomizeMissionSelection(false);
setSpeechRecognitionWaitingStatus();
