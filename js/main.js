// ==================== GOLF BALL SCROLL ANIMATION ====================

const golfBall = document.getElementById('golfBall');
const ballShadow = document.getElementById('ballShadow');
const golfHole = document.getElementById('golfHole');
const trailCanvas = document.getElementById('trailCanvas');
const ctx = trailCanvas.getContext('2d');

function resizeCanvas() {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ---- Smooth parabolic flight path ----
// The ball follows a single graceful arc from top-right to bottom-center,
// like a real golf shot flying through the air and landing in the hole.
// We use a quadratic bezier-style path for the horizontal movement
// and a parabolic arc for the vertical (simulating gravity).

// Landing position (where the hole is) - center-bottom area
const LANDING_X = 50; // vw
const LANDING_Y = 88; // vh

function getScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
}

function getBallPosition(t) {
    // t goes from 0 to 1 as user scrolls

    // Horizontal: smooth ease from right (80vw) to center (50vw)
    // with a gentle S-curve
    const startX = 82;
    const endX = LANDING_X;
    // Cubic ease-in-out for smooth horizontal drift
    const tSmooth = t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    const x = startX + (endX - startX) * tSmooth;

    // Vertical: parabolic arc
    // Ball starts above screen (-10vh), peaks around 20vh at t~0.15,
    // then follows a natural downward parabola to land at LANDING_Y
    //
    // We split into two phases:
    // Phase 1 (0 to 0.12): Ball enters from above — rises to peak
    // Phase 2 (0.12 to 1.0): Long graceful descent to the hole

    let y;
    const peakT = 0.10;
    const peakY = 12; // highest visible point (vh)
    const startY = -8;
    const endY = LANDING_Y;

    if (t <= peakT) {
        // Rising phase: ease from startY to peakY
        const p = t / peakT;
        const pSmooth = Math.sin(p * Math.PI / 2); // ease-out
        y = startY + (peakY - startY) * pSmooth;
    } else {
        // Descent phase: quadratic (gravity-like) from peakY to endY
        const p = (t - peakT) / (1 - peakT);
        // Quadratic ease-in gives a natural gravity feel
        y = peakY + (endY - peakY) * (p * p);
    }

    // Rotation: steady spin that gradually slows as ball "lands"
    const rotSpeed = 1800; // total degrees over full scroll
    // Spin fast at first, slow down near landing
    const rotEase = 1 - Math.pow(1 - t, 0.5);
    const rot = rotEase * rotSpeed;

    // Scale: slightly smaller at start/end, full size in flight
    let scale;
    if (t < 0.08) {
        scale = 0.5 + (t / 0.08) * 0.5;
    } else if (t > 0.92) {
        const p = (t - 0.92) / 0.08;
        scale = 1.0 - p * 0.3; // shrink slightly as it drops into hole
    } else {
        scale = 1.0;
    }

    return { x, y, rot, scale };
}

// Trail particles
const particles = [];
const MAX_PARTICLES = 20;

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 0.3;
        this.size = Math.random() * 2.5 + 1;
        this.decay = 0.012 + Math.random() * 0.008;
    }
    update() {
        this.alpha -= this.decay;
        this.size *= 0.98;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, this.alpha)})`;
        ctx.fill();
    }
}

let lastBallX = 0;
let lastBallY = 0;

function updateBall() {
    const progress = getScrollProgress();
    const pos = getBallPosition(progress);

    const pixelX = (pos.x / 100) * window.innerWidth;
    const pixelY = (pos.y / 100) * window.innerHeight;
    const ballSize = 48;
    const halfBall = ballSize / 2;

    golfBall.style.left = (pixelX - halfBall) + 'px';
    golfBall.style.top = (pixelY - halfBall) + 'px';
    golfBall.style.transform = `rotate(${pos.rot}deg) scale(${pos.scale})`;

    // Shadow adjusts with "height" — bigger shadow = closer to ground
    const groundProximity = Math.max(0, (pos.y - 12) / (LANDING_Y - 12));
    ballShadow.style.opacity = 0.1 + groundProximity * 0.4;
    ballShadow.style.transform = `translateX(-50%) scale(${0.4 + groundProximity * 0.6})`;

    // Position the golf hole at the landing spot
    const holeX = (LANDING_X / 100) * window.innerWidth;
    const holeY = (LANDING_Y / 100) * window.innerHeight;
    golfHole.style.left = (holeX - 30) + 'px';
    golfHole.style.top = (holeY + 10) + 'px';

    // Show hole when user has scrolled enough to see the landing zone
    if (progress > 0.5) {
        golfHole.classList.add('visible');
    } else {
        golfHole.classList.remove('visible');
    }

    // Hide ball when it's "in the hole"
    if (progress > 0.97) {
        golfBall.style.opacity = Math.max(0, (1 - progress) / 0.03);
    } else {
        golfBall.style.opacity = 1;
    }

    // Trail particles — only when moving
    const dx = pixelX - lastBallX;
    const dy = pixelY - lastBallY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 4) {
        particles.push(new Particle(pixelX, pixelY));
        if (particles.length > MAX_PARTICLES) particles.shift();
    }

    lastBallX = pixelX;
    lastBallY = pixelY;

    // Draw trail
    ctx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        if (particles[i].alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }
        particles[i].draw();
    }

    requestAnimationFrame(updateBall);
}

updateBall();

// ==================== MOBILE NAV ====================

const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// ==================== NAVBAR SCROLL ====================

const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 60) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}, { passive: true });

// ==================== CONTACT FORM ====================

function handleSubmit(e) {
    e.preventDefault();
    alert('Thank you for your message. We will be in touch shortly.');
    e.target.reset();
}
window.handleSubmit = handleSubmit;

// ==================== SCROLL REVEAL ====================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => entry.target.classList.add('visible'), delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.section-title, .section-subtitle, .section-badge, .about-text, .about-stats, .portfolio-card, .leader-card, .contact-info, .contact-form').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// ==================== STAT COUNTER ANIMATION ====================

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stat = entry.target;
            const target = parseInt(stat.dataset.target);
            const numberEl = stat.querySelector('.stat-number');
            const prefix = stat.dataset.prefix || '';
            const suffix = stat.dataset.suffix || '';
            let current = 0;
            const stepTime = 1500 / target;

            const counter = setInterval(() => {
                current++;
                numberEl.textContent = prefix + current + (suffix || '');
                if (current >= target) clearInterval(counter);
            }, stepTime);

            statObserver.unobserve(stat);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => statObserver.observe(stat));
