(() => {
  let confettiContext = null;
  let isConfettiActive = false;
  let confettiPieces = [];

  function createParticles() {
    const container = document.getElementById('particle-container');
    container.innerHTML = '';
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.right = '0px';
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 0.8}s`;
      container.appendChild(particle);
    }
  }

  function createConfettiPiece(width) {
    return {
      x: Math.random() * width,
      y: -20,
      size: Math.random() * 6 + 4,
      color: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)],
      sX: Math.random() * 4 - 2,
      sY: Math.random() * 3 + 2,
      r: Math.random() * 360,
      rS: Math.random() * 10 - 5
    };
  }

  function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    confettiContext = canvas.getContext('2d');
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    isConfettiActive = true;
    confettiPieces = [];

    for (let i = 0; i < 60; i++) {
      confettiPieces.push(createConfettiPiece(canvas.width));
    }

    function update() {
      if (!isConfettiActive) return;
      confettiContext.clearRect(0, 0, canvas.width, canvas.height);
      confettiPieces.forEach(piece => {
        piece.y += piece.sY;
        piece.x += piece.sX;
        piece.r += piece.rS;
        if (piece.y > canvas.height) piece.y = -20;
        confettiContext.save();
        confettiContext.translate(piece.x, piece.y);
        confettiContext.rotate((piece.r * Math.PI) / 180);
        confettiContext.fillStyle = piece.color;
        confettiContext.fillRect(-piece.size / 2, -piece.size / 2, piece.size, piece.size);
        confettiContext.restore();
      });
      requestAnimationFrame(update);
    }

    update();
  }

  function stopConfetti() {
    isConfettiActive = false;
    if (confettiContext) {
      confettiContext.clearRect(0, 0, 2000, 2000);
    }
  }

  window.SpaceTimerEffects = {
    createParticles,
    startConfetti,
    stopConfetti
  };
})();
