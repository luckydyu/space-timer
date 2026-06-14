/* exported sndBeepLow, sndBeepHigh, sndNitro, sndSuccess, sndFanfare, sndClick */

    let audioCtx = null;

    function initAudio() { 
      if (!audioCtx) { 
        audioCtx = new (window.AudioContext || window.webkitAudioContext)(); 
      } 
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
    function playTone(freq, type, duration, delay = 0, gainVal = 0.1) {
      try { 
        initAudio(); 
        const osc = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain(); 
        osc.type = type; 
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay); 
        gain.gain.setValueAtTime(gainVal, audioCtx.currentTime + delay); 
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + duration); 
        osc.connect(gain); 
        gain.connect(audioCtx.destination); 
        osc.start(audioCtx.currentTime + delay); 
        osc.stop(audioCtx.currentTime + delay + duration); 
      } catch {
        // Audio playback is best-effort and may be blocked before user activation.
      }
    }
    // 사운드 이펙트 함수들
    const sndBeepLow = () => playTone(523.25, 'square', 0.15);
    const sndBeepHigh = () => playTone(1046.50, 'square', 0.4);
    const sndNitro = () => { 
      try { 
        initAudio(); 
        const osc = audioCtx.createOscillator(); 
        const gain = audioCtx.createGain(); 
        osc.type = 'sawtooth'; 
        osc.frequency.setValueAtTime(100, audioCtx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.6); 
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime); 
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.6); 
        osc.connect(gain); 
        gain.connect(audioCtx.destination); 
        osc.start(); 
        osc.stop(audioCtx.currentTime + 0.6); 
      } catch {
        // Audio playback is best-effort and may be blocked before user activation.
      } 
    }
    const sndSuccess = () => { 
      playTone(523.25, 'sine', 0.1, 0); 
      playTone(659.25, 'sine', 0.1, 0.08); 
      playTone(783.99, 'sine', 0.1, 0.16); 
      playTone(1046.50, 'sine', 0.3, 0.24); 
    }
    const sndFanfare = () => { 
      const t = 0.12; 
      [523, 523, 523, 523, 415, 466, 523].forEach((f, i) => playTone(f, 'triangle', i==3?0.4:0.15, t*i + (i>3?t:0))); 
    }
    const sndClick = () => playTone(600, 'sine', 0.08, 0, 0.15);
