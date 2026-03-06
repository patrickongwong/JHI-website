// ==================== GOLF BALL SCROLL ANIMATION ====================

const golfBall = document.getElementById('golfBall');
const ballShadow = document.getElementById('ballShadow');
const trailCanvas = document.getElementById('trailCanvas');
const ctx = trailCanvas.getContext('2d');

// Resize canvas
function resizeCanvas() {
    trailCanvas.width = window.innerWidth;
    trailCanvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Ball path - defined as scroll-based keyframes
// Each keyframe: { scrollPercent, x (vw), y (vh), rotation, scale }
const ballPath = [
    { scroll: 0.00, x: 85, y: -10, rot: 0,    scale: 0.6 },   // starts above screen, top-right
    { scroll: 0.05, x: 75, y: 15,  rot: 180,  scale: 1.0 },   // flies in from top
    { scroll: 0.10, x: 60, y: 30,  rot: 400,  scale: 1.0 },   // arcing across hero
    { scroll: 0.18, x: 40, y: 50,  rot: 720,  scale: 1.0 },   // mid-hero
    { scroll: 0.25, x: 20, y: 65,  rot: 1080, scale: 1.0 },   // entering about
    { scroll: 0.32, x: 35, y: 55,  rot: 1300, scale: 0.9 },   // bounce up
    { scroll: 0.38, x: 55, y: 70,  rot: 1500, scale: 1.0 },   // arc right
    { scroll: 0.45, x: 75, y: 50,  rot: 1800, scale: 0.9 },   // portfolio section
    { scroll: 0.52, x: 60, y: 65,  rot: 2100, scale: 1.0 },   // weave through cards
    { scroll: 0.58, x: 30, y: 55,  rot: 2400, scale: 0.9 },   // bounce left
    { scroll: 0.65, x: 15, y: 70,  rot: 2700, scale: 1.0 },   // leadership
    { scroll: 0.72, x: 40, y: 55,  rot: 3000, scale: 0.9 },   // arc up
    { scroll: 0.80, x: 65, y: 65,  rot: 3300, scale: 1.0 },   // contact section
    { scroll: 0.88, x: 50, y: 75,  rot: 3600, scale: 1.0 },   // approaching footer
    { scroll: 0.95, x: 50, y: 88,  rot: 3900, scale: 0.8 },   // landing
    { scroll: 1.00, x: 50, y: 95,  rot: 4000, scale: 0.6 },   // resting on green
];

// Trail particles
const particles = [];
const MAX_PARTICLES = 25;

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.alpha = 0.4;
        this.size = Math.random() * 3 + 1;
        this.decay = 0.015 + Math.random() * 0.01;
    }

    update() {
        this.alpha -= this.decay;
        this.size *= 0.97;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
        ctx.fill();
    }
}

// Interpolate between keyframes
function lerp(a, b, t) {
    return a + (b - a) * t;
}

function getScrollProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? window.scrollY / docHeight : 0;
}

function getBallPosition(scrollProgress) {
    // Find the two keyframes we're between
    let i = 0;
    for (; i < ballPath.length - 1; i++) {
        if (scrollProgress <= ballPath[i + 1].scroll) break;
    }
    i = Math.min(i, ballPath.length - 2);

    const from = ballPath[i];
    const to = ballPath[i + 1];
    const segmentProgress = (scrollProgress - from.scroll) / (to.scroll - from.scroll);

    // Smooth easing
    const t = segmentProgress * segmentProgress * (3 - 2 * segmentProgress);

    return {
        x: lerp(from.x, to.x, t),
        y: lerp(from.y, to.y, t),
        rot: lerp(from.rot, to.rot, t),
        scale: lerp(from.scale, to.scale, t),
    };
}

let lastBallX = 0;
let lastBallY = 0;
let animFrame;

function updateBall() {
    const progress = getScrollProgress();
    const pos = getBallPosition(progress);

    const pixelX = (pos.x / 100) * window.innerWidth;
    const pixelY = (pos.y / 100) * window.innerHeight;

    golfBall.style.left = pixelX - 24 + 'px';
    golfBall.style.top = pixelY - 24 + 'px';
    golfBall.style.transform = `rotate(${pos.rot}deg) scale(${pos.scale})`;

    // Shadow adjusts with height
    const shadowScale = pos.scale;
    ballShadow.style.opacity = shadowScale * 0.5;
    ballShadow.style.transform = `translateX(-50%) scale(${shadowScale})`;

    // Add trail particles when moving
    const dx = pixelX - lastBallX;
    const dy = pixelY - lastBallY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3) {
        particles.push(new Particle(pixelX, pixelY));
        if (particles.length > MAX_PARTICLES) {
            particles.shift();
        }
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

    animFrame = requestAnimationFrame(updateBall);
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
    const form = e.target;
    alert('Thank you for your message. We will be in touch shortly.');
    form.reset();
}
// Expose to global scope for inline handler
window.handleSubmit = handleSubmit;

// ==================== SCROLL REVEAL ====================

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const delay = entry.target.dataset.delay || 0;
            setTimeout(() => {
                entry.target.classList.add('visible');
            }, delay);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

// Add reveal class to elements
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
            const duration = 1500;
            const stepTime = duration / target;

            const counter = setInterval(() => {
                current++;
                numberEl.textContent = prefix + current + (suffix || '');
                if (current >= target) {
                    clearInterval(counter);
                    // If no suffix/prefix special handling, add the plus
                    if (!suffix) {
                        // plus is in separate span already
                    }
                }
            }, stepTime);

            statObserver.unobserve(stat);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat').forEach(stat => {
    statObserver.observe(stat);
});
