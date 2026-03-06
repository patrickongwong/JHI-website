// ==================== GOLF BALL SCROLL ANIMATION ====================

const golfBall = document.getElementById('golfBall');
const ballShadow = document.getElementById('ballShadow');
const golfHole = document.getElementById('golfHole');
const golfClub = document.getElementById('golfClub');
const trailCanvas = document.getElementById('trailCanvas');
const ctx = trailCanvas.getContext('2d');

function resizeCanvas() {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Landing position (where the hole is)
const LANDING_X = 50; // vw
const LANDING_Y = 88; // vh

function getScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
}

// ---- Flight path with natural bounce landing ----
// Phase 1 (0–0.85): Smooth parabolic arc flight
// Phase 2 (0.85–0.92): First bounce — ball hits near hole, pops up
// Phase 3 (0.92–0.96): Second smaller bounce
// Phase 4 (0.96–1.0): Roll/settle into hole and sink

// Club impact happens at t = 0.03
// Ball sits on tee until impact, then launches
const IMPACT_T = 0.03;
const TEE_X = 82;  // ball starting position (vw)
const TEE_Y = 55;  // ball on tee, mid-hero area (vh)

function getBallPosition(t) {
    const endX = LANDING_X;
    const groundY = LANDING_Y;

    let x, y, rot, scale;

    if (t <= IMPACT_T) {
        // Ball sitting on tee, waiting for club to hit
        x = TEE_X;
        y = TEE_Y;
        rot = 0;
        scale = 1.0;

    } else {
        // After impact — remap t so flight starts at 0
        const ft = (t - IMPACT_T) / (1 - IMPACT_T); // 0 to 1 for flight

        // Horizontal: ball moves LEFT the whole time (tee at 82vw → hole at 50vw)
        // Starts fast (launch), eases to a stop
        const tSmooth = 1 - Math.pow(1 - ft, 2.5);
        x = TEE_X + (endX - TEE_X) * tSmooth;

        const peakFt = 0.12;  // peak of the arc
        const peakY = 8;      // peak of arc — high in viewport (vh)

        if (ft <= peakFt) {
            // Launch: ball goes UP and left
            const p = ft / peakFt;
            const pSmooth = Math.sin(p * Math.PI / 2);
            y = TEE_Y + (peakY - TEE_Y) * pSmooth;
            rot = ft * 2000;
            scale = 1.0;

        } else if (ft <= 0.82) {
            // Descent: ball comes DOWN and continues left — gravity arc
            const p = (ft - peakFt) / (0.82 - peakFt);
            y = peakY + (groundY - peakY) * (p * p);
            rot = 240 + (ft - peakFt) * 2000;
            scale = 1.0;

        } else if (ft <= 0.90) {
            // First bounce
            const p = (ft - 0.82) / 0.08;
            const bounceHeight = 15;
            y = groundY - bounceHeight * 4 * p * (1 - p);
            rot = 1680 + p * 360;
            scale = 1.0;

        } else if (ft <= 0.95) {
            // Second bounce
            const p = (ft - 0.90) / 0.05;
            const bounceHeight = 6;
            y = groundY - bounceHeight * 4 * p * (1 - p);
            rot = 2040 + p * 180;
            scale = 1.0;

        } else {
            // Settle and sink into hole
            const p = (ft - 0.95) / 0.05;
            y = groundY;
            rot = 2220 + p * 40;
            scale = 1.0 - p * 0.7;
        }
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

// ---- Landing animation state ----
let hasTriggeredBounce1 = false;
let hasTriggeredBounce2 = false;
let hasTriggeredSink = false;
let lastProgress = 0;

function triggerRipple() {
    const ripple1 = golfHole.querySelector('.hole-ripple');
    const ripple2 = golfHole.querySelector('.hole-ripple-2');
    // Reset and replay
    ripple1.classList.remove('animate');
    ripple2.classList.remove('animate');
    void ripple1.offsetWidth; // force reflow
    ripple1.classList.add('animate');
    ripple2.classList.add('animate');
}

function triggerGrassSpray() {
    const sprays = golfHole.querySelectorAll('.grass-spray');
    sprays.forEach(s => {
        s.classList.remove('animate');
        void s.offsetWidth;
        s.classList.add('animate');
    });
}

function resetLandingEffects() {
    hasTriggeredBounce1 = false;
    hasTriggeredBounce2 = false;
    hasTriggeredSink = false;
    golfBall.classList.remove('landing', 'sinking');
    const ripple1 = golfHole.querySelector('.hole-ripple');
    const ripple2 = golfHole.querySelector('.hole-ripple-2');
    ripple1.classList.remove('animate');
    ripple2.classList.remove('animate');
    golfHole.querySelectorAll('.grass-spray').forEach(s => s.classList.remove('animate'));
}

function updateBall() {
    const progress = getScrollProgress();
    const pos = getBallPosition(progress);

    const w = window.innerWidth;
    const pixelX = (pos.x / 100) * w;
    const pixelY = (pos.y / 100) * window.innerHeight;
    const halfBall = w <= 480 ? 12 : w <= 768 ? 15 : 24;

    // Detect scroll direction for resetting effects
    const scrollingUp = progress < lastProgress - 0.005;
    if (scrollingUp && progress < 0.84) {
        resetLandingEffects();
    }

    // Map progress to flight-time for bounce detection
    const ft = progress > IMPACT_T ? (progress - IMPACT_T) / (1 - IMPACT_T) : 0;

    // Squish the ball on bounce impacts
    let transformExtra = '';
    if (ft >= 0.82 && ft <= 0.825) {
        const impactP = (ft - 0.82) / 0.005;
        const squish = impactP < 1 ? Math.sin(impactP * Math.PI) * 0.2 : 0;
        transformExtra = ` scaleX(${1 + squish}) scaleY(${1 - squish})`;
    } else if (ft >= 0.90 && ft <= 0.905) {
        const impactP = (ft - 0.90) / 0.005;
        const squish = impactP < 1 ? Math.sin(impactP * Math.PI) * 0.12 : 0;
        transformExtra = ` scaleX(${1 + squish}) scaleY(${1 - squish})`;
    }

    golfBall.style.left = (pixelX - halfBall) + 'px';
    golfBall.style.top = (pixelY - halfBall) + 'px';
    golfBall.style.transform = `rotate(${pos.rot}deg) scale(${pos.scale})${transformExtra}`;

    // ---- Golf club swing ----
    const clubOffsetX = w <= 480 ? 14 : w <= 768 ? 20 : 30;
    const clubShaftLen = w <= 480 ? 90 : w <= 768 ? 120 : 200;
    const clubPivotX = (TEE_X / 100) * w + clubOffsetX;
    const clubPivotY = (TEE_Y / 100) * window.innerHeight - clubShaftLen;

    golfClub.style.left = clubPivotX + 'px';
    golfClub.style.top = clubPivotY + 'px';

    const fadeEnd = IMPACT_T + 0.04; // club disappears shortly after impact

    if (progress < fadeEnd) {
        golfClub.style.opacity = 1;

        let clubAngle;
        if (progress < IMPACT_T * 0.4) {
            // Backswing: hold at -50deg
            clubAngle = -50;
        } else if (progress < IMPACT_T) {
            // Downswing: accelerate from -50 to 0 (impact)
            const p = (progress - IMPACT_T * 0.4) / (IMPACT_T * 0.6);
            const ease = p * p; // accelerate into ball
            clubAngle = -50 + ease * 50; // -50 → 0 at impact
        } else {
            // Follow-through: 0 → 120, then fade out
            const p = (progress - IMPACT_T) / 0.04;
            const ease = 1 - Math.pow(1 - p, 2); // decelerate
            clubAngle = ease * 120;
            golfClub.style.opacity = 1 - ease;
        }

        golfClub.style.transform = `rotate(${clubAngle}deg)`;
    } else {
        golfClub.style.opacity = 0;
    }

    // Shadow — gets bigger and darker as ball approaches ground
    const groundProximity = Math.max(0, (pos.y - 12) / (LANDING_Y - 12));
    ballShadow.style.opacity = 0.1 + groundProximity * 0.4;
    ballShadow.style.transform = `translateX(-50%) scale(${0.4 + groundProximity * 0.6})`;

    // Position the golf hole
    const holeX = (LANDING_X / 100) * window.innerWidth;
    const holeY = (LANDING_Y / 100) * window.innerHeight;
    golfHole.style.left = (holeX - 30) + 'px';
    golfHole.style.top = (holeY + 10) + 'px';

    // Show hole only when contact section is in view
    const contactSection = document.getElementById('contact');
    const contactRect = contactSection.getBoundingClientRect();
    if (contactRect.top < window.innerHeight * 0.8) {
        golfHole.classList.add('visible');
    } else {
        golfHole.classList.remove('visible');
    }

    // --- Trigger landing effects at key moments ---

    // First bounce impact (ft ≈ 0.82)
    if (ft >= 0.82 && !hasTriggeredBounce1) {
        hasTriggeredBounce1 = true;
        triggerGrassSpray();
    }

    // Second bounce impact (ft ≈ 0.90)
    if (ft >= 0.90 && !hasTriggeredBounce2) {
        hasTriggeredBounce2 = true;
        triggerGrassSpray();
    }

    // Sink into hole (ft ≈ 0.96)
    if (ft >= 0.96 && !hasTriggeredSink) {
        hasTriggeredSink = true;
        golfBall.classList.add('sinking');
        triggerRipple();
    }

    // Fade ball out as it sinks
    if (ft > 0.96) {
        golfBall.style.opacity = Math.max(0, (1 - ft) / 0.04);
    } else {
        golfBall.style.opacity = 1;
    }

    // Trail particles — only during flight (not during bounces/settling)
    if (ft > 0 && ft < 0.82) {
        const dx = pixelX - lastBallX;
        const dy = pixelY - lastBallY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 4) {
            particles.push(new Particle(pixelX, pixelY));
            if (particles.length > MAX_PARTICLES) particles.shift();
        }
    }

    lastBallX = pixelX;
    lastBallY = pixelY;
    lastProgress = progress;

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
