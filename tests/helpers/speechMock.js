export async function installSpeechRecognitionMock(page) {
  await page.addInitScript(() => {
    window.__speechMock = {
      instances: [],
      startCount: 0,
      stopCount: 0
    };

    class MockSpeechRecognition {
      constructor() {
        this.lang = '';
        this.continuous = false;
        this.interimResults = false;
        this.onend = null;
        this.onerror = null;
        this.onresult = null;
        this.started = false;
        window.__speechMock.instances.push(this);
      }

      start() {
        this.started = true;
        window.__speechMock.startCount += 1;
      }

      stop() {
        this.started = false;
        window.__speechMock.stopCount += 1;
      }

      emitResult(transcript) {
        if (!this.onresult) return;
        this.onresult({
          results: [
            [
              {
                transcript
              }
            ]
          ]
        });
      }
    }

    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });
}

export async function getSpeechMockState(page) {
  return page.evaluate(() => ({
    instanceCount: window.__speechMock?.instances.length || 0,
    startCount: window.__speechMock?.startCount || 0,
    stopCount: window.__speechMock?.stopCount || 0,
    latestStarted: window.__speechMock?.instances.at(-1)?.started || false
  }));
}

export async function emitSpeechResult(page, transcript) {
  await page.evaluate((value) => {
    window.__speechMock.instances.at(-1)?.emitResult(value);
  }, transcript);
}
