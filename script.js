
  (function () {
    const section = document.getElementById('projects');
    const canvas = document.getElementById('projects-stars');
    const ctx = canvas.getContext('2d');

    const COLORS = ['#ffffff', '#83DAD5', '#E12885'];
    const STAR_COUNT = 120;

    let stars = [];

    function resizeCanvas() {
      const rect = section.getBoundingClientRect();
      canvas.width  = rect.width;
      canvas.height = rect.height;

      
      stars = Array.from({ length: STAR_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,             
        v: Math.random() * 0.9 + 0.2,             
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        alpha: Math.random() * 0.6 + 0.4         
      }));
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const s of stars) {
        s.y += s.v;
        if (s.y - s.r > canvas.height) {
            s.y = - (Math.random() * 500 + s.r); 
            s.x = Math.random() * canvas.width;
            s.v = Math.random() * 0.9 + 0.2;
            s.r = Math.random() * 1.6 + 0.4;
            s.color = COLORS[Math.floor(Math.random() * COLORS.length)];
            s.alpha = Math.random() * 0.6 + 0.4;
        }

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      requestAnimationFrame(draw);
    }

    
    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    draw();
  })();

 document.addEventListener('mousemove', (e) => {
  const sun = document.getElementById('vaporwave-sun');
  
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const moveX = (e.clientX - centerX) * 0.02;
  const moveY = (e.clientY - centerY) * 0.02;

  sun.style.transform = `translateX(-50%) translate(${moveX}px, ${moveY}px)`;
});

document.addEventListener('DOMContentLoaded', () => {
  const elements = document.querySelectorAll('.animate-on-scroll');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');  
      } else {
        entry.target.classList.remove('visible'); 
      }
    });
  }, {
    threshold: 0.2 
  });

  elements.forEach(el => observer.observe(el));
});



// =========================
// Config
// =========================
const STAR_DELAY_MS = 10000;
const LOOP_MIN_DELAY = 80;  
const LOOP_MAX_DELAY = 200; 
const BURSTS_PER_LOOP = 6;  
const PARTICLES_PER_BURST = 120; 

// =========================
// Estado
// =========================
let partyActive = false;
let confettiTimer = null;
let starDelayTimer = null;

const defaults = {
  spread: 360,
  ticks: 120,
  gravity: 0.8,
  decay: 0.92,
  startVelocity: 45,
  colors: [ '#fcf08bff', '#ffed50ff', '#FFE400', '#FFFFFF'],
  shapes: ['star']
};

// =========================
// Confetti
// =========================
function megaBurst() {
  for (let i = 0; i < BURSTS_PER_LOOP; i++) {
    confetti({
      ...defaults,
      particleCount: PARTICLES_PER_BURST,
      scalar: 1.2,
      origin: {
        x: Math.random(),           
        y: Math.random() * 0.5     
      }
    });
  }
}

function startConfettiLoop() {
  if (!partyActive) return;

  megaBurst();

  const nextDelay = Math.random() * (LOOP_MAX_DELAY - LOOP_MIN_DELAY) + LOOP_MIN_DELAY;
  confettiTimer = setTimeout(startConfettiLoop, nextDelay);
}

function stopConfettiLoop() {
  clearTimeout(confettiTimer);
  confettiTimer = null;
  if (confetti && typeof confetti.reset === 'function') confetti.reset();
}

// =========================
// Video + control del evento
// =========================
function startParty() {
  if (partyActive) return;
  partyActive = true;

  const video = document.getElementById('miku-video');
  const container = document.getElementById('video-container');
  const closeBtn = document.getElementById('close-party');

  container.classList.remove('hidden');
  closeBtn.classList.remove('hidden');

  video.currentTime = 0;
  video.play();


  starDelayTimer = setTimeout(() => {
    if (!partyActive) return;
    startConfettiLoop();
  }, STAR_DELAY_MS);

 
  video.onended = () => stopParty();
}

function stopParty() {
  if (!partyActive) return;
  partyActive = false;

  const video = document.getElementById('miku-video');
  const container = document.getElementById('video-container');
  const closeBtn = document.getElementById('close-party');

  container.classList.add('hidden');
  closeBtn.classList.add('hidden');

  video.pause();
  video.currentTime = 0;
  video.onended = null;

  clearTimeout(starDelayTimer);
  starDelayTimer = null;

  stopConfettiLoop();
}

// =========================
// Listeners
// =========================
document.getElementById('special-btn').addEventListener('click', startParty);
document.getElementById('close-party').addEventListener('click', stopParty);
