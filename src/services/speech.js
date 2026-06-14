(() => {
  let recognition = null;
  let isRealSpeechActive = true;
  let isRecognitionPausedForSpeech = false;
  let isSpeechSynthesisPrimed = false;
  let koreanVoice = null;
  let serviceState = null;
  let startCommands = [];
  let finishCommands = [];
  let onCommand = () => {};
  let initUserAudio = () => {};

  function init(options) {
    serviceState = options.state;
    startCommands = options.startCommands;
    finishCommands = options.finishCommands;
    onCommand = options.onCommand;
    initUserAudio = options.initAudio;

    if ('speechSynthesis' in window) {
      loadSpeechVoices();
      window.speechSynthesis.onvoiceschanged = loadSpeechVoices;
    }
  }

  function loadSpeechVoices() {
    if (!('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    koreanVoice = voices.find(voice => voice.lang === 'ko-KR')
      || voices.find(voice => voice.lang.startsWith('ko'))
      || null;
  }

  function primeSpeechSynthesis() {
    if (isSpeechSynthesisPrimed || !('speechSynthesis' in window)) return;
    loadSpeechVoices();

    try {
      const utterance = new SpeechSynthesisUtterance(' ');
      utterance.lang = 'ko-KR';
      if (koreanVoice) utterance.voice = koreanVoice;
      utterance.volume = 0;
      utterance.rate = 1;
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
      isSpeechSynthesisPrimed = true;
    } catch {
      // Speech synthesis may be unavailable before browser/user activation.
    }
  }

  function primeUserAudio() {
    initUserAudio();
    primeSpeechSynthesis();
  }

  function toggleSpeechRecognition() {
    primeUserAudio();
    const toggle = document.getElementById('mic-toggle-input');
    isRealSpeechActive = toggle.checked;

    if (isRealSpeechActive) {
      if (serviceState.appState === 'SETUP') {
        setSpeechRecognitionWaitingStatus();
      } else {
        startRealSpeechEngine();
      }
    } else {
      stopRealSpeechEngine();
    }
  }

  function setSpeechRecognitionWaitingStatus() {
    document.getElementById('status-dot').className = 'w-2.5 h-2.5 rounded-full bg-yellow-500';
    document.getElementById('status-text').textContent = '첫 미션부터 마이크 대기';
  }

  function startRealSpeechEngine() {
    if (serviceState.appState === 'SETUP') {
      setSpeechRecognitionWaitingStatus();
      return;
    }
    if (serviceState.appState === 'RESULT') return;

    initUserAudio();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const warningBox = document.getElementById('mic-support-alert');
      warningBox.innerHTML = '⚠️ 이 브라우저 또는 태블릿 기기는 실제 음성 인식 API를 지원하지 않습니다. (구글 크롬 / 애플 사파리 권장)';
      warningBox.classList.remove('hidden');
      document.getElementById('mic-toggle-input').checked = false;
      isRealSpeechActive = false;
      return;
    }

    if (!recognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = function(event) {
        const resultText = event.results[event.results.length - 1][0].transcript.trim();
        console.log('음성 감지:', resultText);

        if (matchesVoiceCommand(resultText, startCommands)) {
          onCommand('시작');
        } else if (matchesVoiceCommand(resultText, finishCommands)) {
          onCommand('끝');
        }
      };

      recognition.onend = function() {
        if (isRealSpeechActive
          && !isRecognitionPausedForSpeech
          && serviceState.appState !== 'SETUP'
          && serviceState.appState !== 'RESULT') {
          try {
            recognition.start();
          } catch {
            // Start can throw when the browser is already starting recognition.
          }
        }
      };

      recognition.onerror = function(event) {
        console.error('음성 인식 오류 발생:', event.error);
      };
    }

    try {
      recognition.start();
      document.getElementById('status-dot').className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
      document.getElementById('status-text').textContent = '실제 마이크 작동 중';
    } catch (error) {
      console.error('인식 시작 차단:', error);
    }
  }

  function stopRealSpeechEngine() {
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        // Stop can throw when recognition is already inactive.
      }
    }
    document.getElementById('status-dot').className = 'w-2.5 h-2.5 rounded-full bg-red-500';
    document.getElementById('status-text').textContent = '음성 인식 꺼짐';
  }

  function speakMissionTime(ms) {
    if (!('speechSynthesis' in window)) return;
    loadSpeechVoices();

    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = String(Math.floor((Math.max(0, ms) % 1000) / 10)).padStart(2, '0');
    const timeText = minutes > 0
      ? `${minutes}분 ${seconds}.${hundredths} 초입니다`
      : `${seconds}.${hundredths} 초입니다`;

    const shouldResumeRecognition = isRealSpeechActive && recognition && serviceState.appState !== 'RESULT';
    if (shouldResumeRecognition) {
      isRecognitionPausedForSpeech = true;
      try {
        recognition.stop();
      } catch {
        // Stop can throw when recognition is already inactive.
      }
    }

    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    const utterance = new SpeechSynthesisUtterance(timeText);
    utterance.lang = 'ko-KR';
    if (koreanVoice) utterance.voice = koreanVoice;
    utterance.volume = 1;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    let resumeTimer = null;
    const resumeRecognition = function() {
      if (resumeTimer) clearTimeout(resumeTimer);
      if (shouldResumeRecognition && serviceState.appState !== 'RESULT') {
        isRecognitionPausedForSpeech = false;
        startRealSpeechEngine();
      }
    };
    utterance.onend = utterance.onerror = resumeRecognition;
    resumeTimer = setTimeout(resumeRecognition, 5000);
    window.speechSynthesis.speak(utterance);
  }

  function isSpeechRecognitionActive() {
    return isRealSpeechActive;
  }

  function matchesVoiceCommand(text, commands) {
    const normalizeVoiceText = value => String(value).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
    const normalizedText = normalizeVoiceText(text);
    return commands.some(command => normalizedText.includes(normalizeVoiceText(command)));
  }

  function renderVoiceCommandHelp() {
    const renderCommandPills = commands => commands.map(command =>
      `<span class="inline-block mr-1.5 mb-1.5 px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 game-font">${command}</span>`
    ).join('');
    const startList = document.getElementById('voice-start-command-list');
    const finishList = document.getElementById('voice-finish-command-list');
    if (startList) startList.innerHTML = renderCommandPills(startCommands);
    if (finishList) finishList.innerHTML = renderCommandPills(finishCommands);
  }

  function openVoiceCommandHelp() {
    renderVoiceCommandHelp();
    document.getElementById('voice-command-modal').classList.remove('hidden');
  }

  function closeVoiceCommandHelp() {
    document.getElementById('voice-command-modal').classList.add('hidden');
  }

  window.SpaceTimerSpeech = {
    init,
    primeUserAudio,
    toggleSpeechRecognition,
    setSpeechRecognitionWaitingStatus,
    startRealSpeechEngine,
    stopRealSpeechEngine,
    speakMissionTime,
    isSpeechRecognitionActive,
    openVoiceCommandHelp,
    closeVoiceCommandHelp
  };
})();
