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

        // Physics-based bounce system
        // Real ball: rises fast (initial velocity), decelerates (gravity),
        // falls accelerating. Each bounce loses energy (restitution ~0.5).
        // y(p) = ground - height * (1 - (2p-1)^2) is symmetric;
        // Instead use: y(p) = ground - v0*p + 0.5*g*p^2 (projectile)
        //
        // Bounce phases with diminishing energy:
        //   Main flight:   0    → 0.80  (big arc from tee)
        //   Bounce 1:      0.80 → 0.89  (height ~14vh, restitution)
        //   Bounce 2:      0.89 → 0.94  (height ~5vh)
        //   Bounce 3:      0.94 → 0.97  (height ~1.5vh, barely visible)
        //   Settle/sink:   0.97 → 1.0

        // Projectile: given duration d and peak height h,
        // gravity g = 2h / (d/2)^2, initial velocity v0 = g * (d/2)
        // y_offset(p) = v0*p - 0.5*g*p^2  (positive = upward)
        // This naturally gives fast rise, slow peak, accelerating fall.

        function projectileY(p, h, d) {
            // p: 0→d is time, h is peak height
            const halfD = d / 2;
            const g = 2 * h / (halfD * halfD);
            const v0 = g * halfD;
            return v0 * p - 0.5 * g * p * p;
        }

        const b1Start = 0.80;  // first bounce start
        const b1End   = 0.89;  // first bounce end
        const b1H     = 14;    // first bounce height (vh)

        const b2Start = 0.89;
        const b2End   = 0.94;
        const b2H     = 5;

        const b3Start = 0.94;
        const b3End   = 0.97;
        const b3H     = 1.5;

        if (ft <= peakFt) {
            // Launch: ball goes UP and left
            const p = ft / peakFt;
            const pSmooth = Math.sin(p * Math.PI / 2);
            y = TEE_Y + (peakY - TEE_Y) * pSmooth;
            rot = ft * 2000;
            scale = 1.0;

        } else if (ft <= b1Start) {
            // Main flight descent — gravity arc
            const p = (ft - peakFt) / (b1Start - peakFt);
            // Quadratic ease-in (accelerating fall)
            y = peakY + (groundY - peakY) * (p * p);
            rot = 240 + (ft - peakFt) * 2000;
            scale = 1.0;

        } else if (ft <= b1End) {
            // First bounce — physics projectile
            const dur = b1End - b1Start;
            const p = ft - b1Start;
            const offset = projectileY(p, b1H, dur);
            y = groundY - offset;
            // Spin decays: fast at start, slowing
            rot = 1640 + ((ft - b1Start) / dur) * 280;
            scale = 1.0;

        } else if (ft <= b2End) {
            // Second bounce
            const dur = b2End - b2Start;
            const p = ft - b2Start;
            const offset = projectileY(p, b2H, dur);
            y = groundY - offset;
            rot = 1920 + ((ft - b2Start) / dur) * 120;
            scale = 1.0;

        } else if (ft <= b3End) {
            // Third bounce — tiny
            const dur = b3End - b3Start;
            const p = ft - b3Start;
            const offset = projectileY(p, b3H, dur);
            y = groundY - offset;
            rot = 2040 + ((ft - b3Start) / dur) * 40;
            scale = 1.0;

        } else {
            // Settle, roll to hole, tip in, and drop
            const p = (ft - b3End) / (1 - b3End); // 0 → 1

            if (p < 0.4) {
                // Rolling slowly toward the hole center
                const rp = p / 0.4;
                y = groundY;
                rot = 2080 + rp * 60; // slow roll
                scale = 1.0;
            } else if (p < 0.6) {
                // Teetering on the edge — slight wobble
                const rp = (p - 0.4) / 0.2;
                const wobble = Math.sin(rp * Math.PI * 3) * (1 - rp) * 1.5;
                y = groundY + wobble;
                rot = 2140 + rp * 10;
                scale = 1.0;
            } else {
                // Drop into hole — ball sinks in place, shrinks quickly
                const rp = (p - 0.6) / 0.4;
                const dropEase = rp * rp;
                y = groundY + dropEase * 1.5; // barely drops, just into the hole
                rot = 2150 + rp * 30;
                scale = Math.max(0, 1.0 - dropEase * 1.2); // shrinks to nothing
            }
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

const contactSection = document.getElementById('contact');
let holeVisible = false;
let animFrameId = null;
let needsUpdate = true;

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

    // Squish the ball on bounce impacts — proportional to bounce energy
    let transformExtra = '';
    if (ft >= 0.80 && ft <= 0.806) {
        // First impact — biggest squish
        const impactP = (ft - 0.80) / 0.006;
        const squish = impactP < 1 ? Math.sin(impactP * Math.PI) * 0.22 : 0;
        transformExtra = ` scaleX(${1 + squish}) scaleY(${1 - squish})`;
    } else if (ft >= 0.89 && ft <= 0.895) {
        // Second impact — medium squish
        const impactP = (ft - 0.89) / 0.005;
        const squish = impactP < 1 ? Math.sin(impactP * Math.PI) * 0.12 : 0;
        transformExtra = ` scaleX(${1 + squish}) scaleY(${1 - squish})`;
    } else if (ft >= 0.94 && ft <= 0.944) {
        // Third impact — tiny squish
        const impactP = (ft - 0.94) / 0.004;
        const squish = impactP < 1 ? Math.sin(impactP * Math.PI) * 0.05 : 0;
        transformExtra = ` scaleX(${1 + squish}) scaleY(${1 - squish})`;
    }

    golfBall.style.transform = `translate(${pixelX - halfBall}px, ${pixelY - halfBall}px) rotate(${pos.rot}deg) scale(${pos.scale})${transformExtra}`;

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
    let holeY = (LANDING_Y / 100) * window.innerHeight;

    // On mobile, cap the hole so it doesn't go below the footer-grass curve
    const isMobileView = window.innerWidth <= 768;
    if (isMobileView) {
        const footerGrass = document.querySelector('.footer-grass');
        if (footerGrass) {
            const grassRect = footerGrass.getBoundingClientRect();
            // Position hole so it sits just above the grass curve (offset for hole height + flag)
            const maxHoleY = grassRect.top - 30;
            if (holeY + 10 > maxHoleY) {
                holeY = maxHoleY - 10;
            }
        }
    }

    golfHole.style.transform = `translate(${holeX - 30}px, ${holeY + 10}px)`;

    // Show hole only when contact section is in view
    const contactRect = contactSection.getBoundingClientRect();
    if (contactRect.top < window.innerHeight * 0.8) {
        if (!holeVisible) { golfHole.classList.add('visible'); holeVisible = true; }
    } else {
        if (holeVisible) { golfHole.classList.remove('visible'); holeVisible = false; }
    }

    // --- Trigger landing effects at key moments ---

    // First bounce impact (ft ≈ 0.80)
    if (ft >= 0.80 && !hasTriggeredBounce1) {
        hasTriggeredBounce1 = true;
        triggerGrassSpray();
    }

    // Second bounce impact (ft ≈ 0.89)
    if (ft >= 0.89 && !hasTriggeredBounce2) {
        hasTriggeredBounce2 = true;
        triggerGrassSpray();
    }

    // Sink phase: ball drops in at ~0.6 of settle phase (ft ≈ 0.988)
    const sinkFt = 0.97 + (1 - 0.97) * 0.6; // ~0.988
    if (ft >= sinkFt && !hasTriggeredSink) {
        hasTriggeredSink = true;
        golfBall.classList.add('sinking');
        triggerRipple();
    }

    // Ball vanishes as it shrinks into hole
    if (ft >= sinkFt) {
        const dropP = (ft - sinkFt) / (1 - sinkFt);
        golfBall.style.opacity = Math.max(0, 1 - dropP * 1.5);
    } else {
        golfBall.style.opacity = 1;
    }

    // Trail particles — only during flight (not during bounces/settling)
    if (ft > 0 && ft < 0.80) {
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

    // Continue loop only if there are active particles
    if (particles.length > 0) {
        animFrameId = requestAnimationFrame(updateBall);
    } else {
        animFrameId = null;
    }
}

// Run on scroll instead of continuous rAF
function scheduleUpdate() {
    needsUpdate = true;
    if (!animFrameId) {
        animFrameId = requestAnimationFrame(updateBall);
    }
}

window.addEventListener('scroll', scheduleUpdate, { passive: true });
window.addEventListener('resize', scheduleUpdate, { passive: true });

// Initial render
scheduleUpdate();

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
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form._subject.value.trim();
    const message = form.message.value.trim();

    const body = `From: ${name} (${email})\n\n${message}`;
    const mailtoLink = `mailto:jhi@januarius.ph?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    form.reset();
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

function animateCounter(stat) {
    const target = parseInt(stat.dataset.target);
    const numberEl = stat.querySelector('.stat-number');
    const prefix = stat.dataset.prefix || '';
    const suffix = stat.dataset.suffix || '';
    const duration = 2000; // ms
    const startTime = performance.now();

    function update(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out: fast start, slow finish
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(eased * target);

        numberEl.textContent = prefix + current + (suffix || '');

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounter(entry.target);
            statObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => statObserver.observe(stat));
