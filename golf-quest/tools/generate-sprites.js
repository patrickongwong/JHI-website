#!/usr/bin/env node
/**
 * generate-sprites.js
 * Generates pixel-art sprite sheets for Golf Quest entities.
 * Owlboy-inspired style: rich shading (3-4 levels), warm highlights, cool shadows,
 * dark outlines, big-head proportions, expressive eyes.
 *
 * Output: golf-quest/assets/sprites/*.png
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets', 'sprites');
fs.mkdirSync(OUT, { recursive: true });

// ─── Color Palettes ─────────────────────────────────────────────────────────

const PAL = {
  // Skin tones (brown, 4 shades: shadow → highlight)
  skinBrown:    ['#6B3A1F', '#8B5E3C', '#A67C52', '#C9A06C'],
  // Hair
  darkHair:     ['#1A0F0A', '#2E1E14', '#3D2B1C'],
  straightHair: ['#0F0A05', '#1C1410', '#2A1F18'],
  // White polo
  whitePolo:    ['#B0B8C0', '#D0D8E0', '#E8EFF5', '#F8FCFF'],
  // Purple polo
  purplePolo:   ['#3A1860', '#5C2D91', '#7B47B0', '#9B6FCC'],
  // Khaki pants
  khaki:        ['#6B6040', '#8B8060', '#A89878', '#C4B898'],
  // Shoes
  shoes:        ['#2A1A0A', '#3E2E1E', '#564530'],
  // Glasses
  glasses:      ['#1A1A2E', '#2E3050'],
  // Outline
  outline:      '#1A1020',
  // Eyes
  eyeWhite:     '#F0F0F0',
  eyePupil:     '#1A0F0A',
  // Sand golem
  sand:         ['#5C4420', '#7A6030', '#A08050', '#C0A070'],
  sandCrack:    '#3A2A10',
  // Lunar dragon
  dragonScale:  ['#3A4560', '#506078', '#6A7A90', '#8494A8'],
  dragonWing:   ['#2A3548', '#3E4E65', '#556880'],
  dragonEye:    ['#CC8800', '#FFAA00', '#FFD040'],
  dragonBelly:  ['#5A6A80', '#7A8A9A', '#9AAAB8'],
  fire:         ['#CC3300', '#FF6600', '#FFAA00', '#FFE060'],
  // Ball
  ballWhite:    ['#C8C8C8', '#E0E0E0', '#F0F0F0', '#FFFFFF'],
  // Projectile
  rock:         ['#5C4420', '#7A6030', '#A08050'],
  // Asteroid
  asteroid:     ['#505050', '#707070', '#909090', '#A8A8A8'],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function px(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

/** Draw a filled rectangle of pixels */
function rect(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** Save canvas to PNG */
function save(canvas, name) {
  const buf = canvas.toBuffer('image/png');
  const p = path.join(OUT, name);
  fs.writeFileSync(p, buf);
  console.log(`  ✓ ${name} (${canvas.width}x${canvas.height})`);
}

// ─── Character Drawing Primitives ────────────────────────────────────────────

/**
 * Draw a humanoid character frame.
 * opts: { skin, hair, hairStyle, shirt, pants, shoes, outline,
 *         hasGlasses, glassesColor,
 *         headOffY, bodyOffY, armLAngle, armRAngle,
 *         legLOff, legROff, legLBend, legRBend,
 *         lookDir, mouthOpen, glowOutline }
 */
function drawCharacter(ctx, ox, oy, opts) {
  const o = Object.assign({
    headOffY: 0, bodyOffY: 0,
    armLAngle: 0, armRAngle: 0,  // -1=up, 0=down, 1=back
    legLOff: 0, legROff: 0,
    legLBend: 0, legRBend: 0,
    lookDir: 0, mouthOpen: false,
    hasGlasses: false, glowOutline: false,
  }, opts);

  const skin = o.skin;
  const hair = o.hair;
  const shirt = o.shirt;
  const pants = o.pants;
  const shoes = o.shoes;
  const ol = o.outline || PAL.outline;

  const hoy = o.headOffY;
  const boy = o.bodyOffY;

  // Glow outline (for psychic pose)
  if (o.glowOutline) {
    ctx.fillStyle = '#9B6FCC';
    // Draw a slightly expanded silhouette around character
    rect(ctx, ox + 5, oy + 1 + hoy, 22, 18, '#9B6FCC44');
    rect(ctx, ox + 7, oy + 18 + boy, 18, 14, '#7B47B044');
  }

  // ── Dark outline for head ──
  rect(ctx, ox + 8, oy + 2 + hoy, 16, 1, ol);   // top
  rect(ctx, ox + 7, oy + 3 + hoy, 1, 14, ol);    // left
  rect(ctx, ox + 24, oy + 3 + hoy, 1, 14, ol);   // right
  rect(ctx, ox + 8, oy + 17 + hoy, 16, 1, ol);   // bottom

  // ── Hair ──
  if (o.hairStyle === 'curly') {
    // Curly hair: poofy top
    rect(ctx, ox + 8, oy + 2 + hoy, 16, 5, hair[0]);
    rect(ctx, ox + 9, oy + 1 + hoy, 14, 3, hair[1]);
    rect(ctx, ox + 10, oy + 0 + hoy, 12, 2, hair[2]);
    // Side tufts
    rect(ctx, ox + 7, oy + 3 + hoy, 2, 4, hair[1]);
    rect(ctx, ox + 23, oy + 3 + hoy, 2, 4, hair[1]);
  } else {
    // Straight hair: flat top
    rect(ctx, ox + 8, oy + 2 + hoy, 16, 4, hair[0]);
    rect(ctx, ox + 9, oy + 1 + hoy, 14, 3, hair[1]);
    rect(ctx, ox + 7, oy + 3 + hoy, 2, 3, hair[0]);
    rect(ctx, ox + 23, oy + 3 + hoy, 2, 3, hair[0]);
  }

  // ── Face ──
  rect(ctx, ox + 8, oy + 6 + hoy, 16, 11, skin[2]);  // base
  rect(ctx, ox + 9, oy + 7 + hoy, 14, 9, skin[2]);
  // Shading
  rect(ctx, ox + 8, oy + 14 + hoy, 16, 3, skin[1]);   // chin shadow
  rect(ctx, ox + 20, oy + 7 + hoy, 4, 7, skin[1]);    // right shadow
  rect(ctx, ox + 9, oy + 7 + hoy, 3, 3, skin[3]);     // left highlight

  // ── Eyes ──
  const eyeY = oy + 10 + hoy;
  // Left eye
  px(ctx, ox + 11, eyeY, PAL.eyeWhite);
  px(ctx, ox + 12, eyeY, PAL.eyeWhite);
  px(ctx, ox + 12 + o.lookDir, eyeY, PAL.eyePupil);
  // Right eye
  px(ctx, ox + 19, eyeY, PAL.eyeWhite);
  px(ctx, ox + 20, eyeY, PAL.eyeWhite);
  px(ctx, ox + 20 + o.lookDir, eyeY, PAL.eyePupil);

  // Glasses
  if (o.hasGlasses) {
    const gc = o.glassesColor || PAL.glasses;
    // Left lens frame
    rect(ctx, ox + 10, eyeY - 1, 4, 3, gc[0]);
    rect(ctx, ox + 11, eyeY, 2, 1, PAL.eyeWhite);
    px(ctx, ox + 12 + o.lookDir, eyeY, PAL.eyePupil);
    // Right lens frame
    rect(ctx, ox + 18, eyeY - 1, 4, 3, gc[0]);
    rect(ctx, ox + 19, eyeY, 2, 1, PAL.eyeWhite);
    px(ctx, ox + 20 + o.lookDir, eyeY, PAL.eyePupil);
    // Bridge
    rect(ctx, ox + 14, eyeY, 4, 1, gc[1]);
  }

  // Mouth
  if (o.mouthOpen) {
    rect(ctx, ox + 14, oy + 14 + hoy, 4, 2, skin[0]);
  } else {
    rect(ctx, ox + 14, oy + 14 + hoy, 4, 1, skin[0]);
  }

  // ── Body / Shirt ──
  // Outline
  rect(ctx, ox + 9, oy + 18 + boy, 1, 12, ol);
  rect(ctx, ox + 22, oy + 18 + boy, 1, 12, ol);

  rect(ctx, ox + 10, oy + 18 + boy, 12, 12, shirt[1]);  // base
  rect(ctx, ox + 10, oy + 18 + boy, 6, 6, shirt[2]);    // highlight
  rect(ctx, ox + 16, oy + 24 + boy, 6, 6, shirt[0]);    // shadow
  // Collar
  rect(ctx, ox + 13, oy + 17 + boy, 6, 2, shirt[3]);

  // ── Arms ──
  drawArm(ctx, ox + 6, oy + 19 + boy, o.armLAngle, shirt, skin, ol, false);
  drawArm(ctx, ox + 23, oy + 19 + boy, o.armRAngle, shirt, skin, ol, true);

  // ── Pants ──
  rect(ctx, ox + 10, oy + 30 + boy, 12, 8, pants[1]);
  rect(ctx, ox + 10, oy + 30 + boy, 6, 4, pants[2]);
  rect(ctx, ox + 16, oy + 34 + boy, 6, 4, pants[0]);
  // Leg gap
  rect(ctx, ox + 15, oy + 34 + boy, 2, 4, pants[0]);

  // ── Legs ──
  const legY = oy + 38 + boy;
  // Left leg
  rect(ctx, ox + 10 + o.legLOff, legY + o.legLBend, 5, 4, pants[1]);
  rect(ctx, ox + 10 + o.legLOff, legY + 4 + o.legLBend, 5, 2, shoes[1]);
  rect(ctx, ox + 10 + o.legLOff, legY + 4 + o.legLBend, 2, 2, shoes[2]);
  // Outline
  rect(ctx, ox + 9 + o.legLOff, legY + o.legLBend, 1, 6, ol);
  rect(ctx, ox + 15 + o.legLOff, legY + o.legLBend, 1, 6, ol);
  rect(ctx, ox + 10 + o.legLOff, legY + 6 + o.legLBend, 5, 1, ol);

  // Right leg
  rect(ctx, ox + 17 + o.legROff, legY + o.legRBend, 5, 4, pants[1]);
  rect(ctx, ox + 17 + o.legROff, legY + 4 + o.legRBend, 5, 2, shoes[1]);
  rect(ctx, ox + 17 + o.legROff, legY + 4 + o.legRBend, 2, 2, shoes[2]);
  // Outline
  rect(ctx, ox + 16 + o.legROff, legY + o.legRBend, 1, 6, ol);
  rect(ctx, ox + 22 + o.legROff, legY + o.legRBend, 1, 6, ol);
  rect(ctx, ox + 17 + o.legROff, legY + 6 + o.legRBend, 5, 1, ol);
}

function drawArm(ctx, ax, ay, angle, shirt, skin, ol, isRight) {
  // angle: -1 = raised, 0 = resting, 1 = back, 2 = swing forward
  let dx = 0, dy = 0;
  if (angle === -1) { dy = -6; }
  else if (angle === 0) { dy = 0; }
  else if (angle === 1) { dx = isRight ? 2 : -2; dy = -3; }
  else if (angle === 2) { dx = isRight ? 3 : -3; dy = 2; }

  // Sleeve
  rect(ctx, ax + dx, ay + dy, 3, 4, shirt[1]);
  // Hand
  rect(ctx, ax + dx, ay + 4 + dy, 3, 3, skin[2]);
  rect(ctx, ax + dx, ay + 5 + dy, 2, 2, skin[3]);
  // Outline
  rect(ctx, ax - 1 + dx, ay + dy, 1, 7, ol);
  rect(ctx, ax + 3 + dx, ay + dy, 1, 7, ol);
}

// ─── JJ Sprite Sheet ────────────────────────────────────────────────────────

function generateJJ() {
  const W = 32, H = 48, FRAMES = 18;
  const canvas = createCanvas(W * FRAMES, H);
  const ctx = canvas.getContext('2d');

  const base = {
    skin: PAL.skinBrown, hair: PAL.darkHair, hairStyle: 'curly',
    shirt: PAL.whitePolo, pants: PAL.khaki, shoes: PAL.shoes,
  };

  // Frames 0-3: Idle (breathing)
  for (let i = 0; i < 4; i++) {
    const breathOff = [0, -1, 0, -1][i];
    drawCharacter(ctx, i * W, 0, { ...base, headOffY: breathOff, bodyOffY: breathOff });
  }

  // Frames 4-9: Walk cycle
  const walkLegs = [
    { legLOff: -1, legROff: 1, legLBend: 0, legRBend: -1 },
    { legLOff: -2, legROff: 2, legLBend: 0, legRBend: -2 },
    { legLOff: -1, legROff: 1, legLBend: 0, legRBend: -1 },
    { legLOff: 0, legROff: 0, legLBend: 0, legRBend: 0 },
    { legLOff: 1, legROff: -1, legLBend: -1, legRBend: 0 },
    { legLOff: 2, legROff: -2, legLBend: -2, legRBend: 0 },
  ];
  const walkArms = [
    { armLAngle: 1, armRAngle: 0 },
    { armLAngle: 1, armRAngle: 0 },
    { armLAngle: 0, armRAngle: 0 },
    { armLAngle: 0, armRAngle: 1 },
    { armLAngle: 0, armRAngle: 1 },
    { armLAngle: 0, armRAngle: 0 },
  ];
  for (let i = 0; i < 6; i++) {
    drawCharacter(ctx, (4 + i) * W, 0, { ...base, ...walkLegs[i], ...walkArms[i] });
  }

  // Frames 10-11: Jump
  drawCharacter(ctx, 10 * W, 0, { ...base, armLAngle: -1, armRAngle: -1, headOffY: -2, bodyOffY: -2, legLBend: -2, legRBend: -2 });
  drawCharacter(ctx, 11 * W, 0, { ...base, armLAngle: 0, armRAngle: 0, headOffY: 0, bodyOffY: 0, legLOff: 1, legROff: -1 });

  // Frames 12-15: Golf swing
  drawCharacter(ctx, 12 * W, 0, { ...base, armLAngle: 0, armRAngle: 1, lookDir: 0 });   // windup
  drawCharacter(ctx, 13 * W, 0, { ...base, armLAngle: 1, armRAngle: -1, lookDir: 0 });  // backswing
  drawCharacter(ctx, 14 * W, 0, { ...base, armLAngle: 2, armRAngle: 2, lookDir: 0 });   // contact
  drawCharacter(ctx, 15 * W, 0, { ...base, armLAngle: -1, armRAngle: -1, lookDir: 0 }); // follow-through

  // Frames 16-17: Hurt
  drawCharacter(ctx, 16 * W, 0, { ...base, headOffY: -1, bodyOffY: 1, lookDir: -1 });   // flinch
  drawCharacter(ctx, 17 * W, 0, { ...base, headOffY: 0, bodyOffY: 0, lookDir: 0 });     // recovery

  save(canvas, 'jj.png');
}

// ─── Patrick Sprite Sheet ────────────────────────────────────────────────────

function generatePatrick() {
  const W = 32, H = 48, FRAMES = 20;
  const canvas = createCanvas(W * FRAMES, H);
  const ctx = canvas.getContext('2d');

  const base = {
    skin: PAL.skinBrown, hair: PAL.straightHair, hairStyle: 'straight',
    shirt: PAL.purplePolo, pants: PAL.khaki, shoes: PAL.shoes,
    hasGlasses: true,
  };

  // Frames 0-3: Idle
  for (let i = 0; i < 4; i++) {
    const breathOff = [0, -1, 0, -1][i];
    drawCharacter(ctx, i * W, 0, { ...base, headOffY: breathOff, bodyOffY: breathOff });
  }

  // Frames 4-9: Walk cycle
  const walkLegs = [
    { legLOff: -1, legROff: 1, legLBend: 0, legRBend: -1 },
    { legLOff: -2, legROff: 2, legLBend: 0, legRBend: -2 },
    { legLOff: -1, legROff: 1, legLBend: 0, legRBend: -1 },
    { legLOff: 0, legROff: 0, legLBend: 0, legRBend: 0 },
    { legLOff: 1, legROff: -1, legLBend: -1, legRBend: 0 },
    { legLOff: 2, legROff: -2, legLBend: -2, legRBend: 0 },
  ];
  const walkArms = [
    { armLAngle: 1, armRAngle: 0 },
    { armLAngle: 1, armRAngle: 0 },
    { armLAngle: 0, armRAngle: 0 },
    { armLAngle: 0, armRAngle: 1 },
    { armLAngle: 0, armRAngle: 1 },
    { armLAngle: 0, armRAngle: 0 },
  ];
  for (let i = 0; i < 6; i++) {
    drawCharacter(ctx, (4 + i) * W, 0, { ...base, ...walkLegs[i], ...walkArms[i] });
  }

  // Frames 10-11: Jump
  drawCharacter(ctx, 10 * W, 0, { ...base, armLAngle: -1, armRAngle: -1, headOffY: -2, bodyOffY: -2, legLBend: -2, legRBend: -2 });
  drawCharacter(ctx, 11 * W, 0, { ...base, armLAngle: 0, armRAngle: 0, legLOff: 1, legROff: -1 });

  // Frames 12-15: Golf swing
  drawCharacter(ctx, 12 * W, 0, { ...base, armLAngle: 0, armRAngle: 1 });
  drawCharacter(ctx, 13 * W, 0, { ...base, armLAngle: 1, armRAngle: -1 });
  drawCharacter(ctx, 14 * W, 0, { ...base, armLAngle: 2, armRAngle: 2 });
  drawCharacter(ctx, 15 * W, 0, { ...base, armLAngle: -1, armRAngle: -1 });

  // Frames 16-17: Hurt
  drawCharacter(ctx, 16 * W, 0, { ...base, headOffY: -1, bodyOffY: 1, lookDir: -1 });
  drawCharacter(ctx, 17 * W, 0, { ...base });

  // Frames 18-19: Psychic pose
  drawCharacter(ctx, 18 * W, 0, { ...base, armLAngle: -1, armRAngle: -1, glowOutline: true, headOffY: -1 });
  drawCharacter(ctx, 19 * W, 0, { ...base, armLAngle: -1, armRAngle: -1, glowOutline: true, headOffY: -2 });

  save(canvas, 'patrick.png');
}

// ─── Sand Golem (Enemy) ─────────────────────────────────────────────────────

function generateEnemy() {
  const W = 48, H = 48, FRAMES = 9;
  const canvas = createCanvas(W * FRAMES, H);
  const ctx = canvas.getContext('2d');

  function drawGolem(ox, oy, opts = {}) {
    const { swayX = 0, armBack = false, armForward = false,
            crumble = 0, // 0=none, 1=cracking, 2=breaking, 3=rubble
          } = opts;
    const s = PAL.sand;
    const ol = PAL.outline;
    const crack = PAL.sandCrack;

    if (crumble >= 3) {
      // Just rubble piles
      rect(ctx, ox + 8, oy + 38, 8, 6, s[1]);
      rect(ctx, ox + 20, oy + 40, 10, 5, s[2]);
      rect(ctx, ox + 34, oy + 39, 6, 5, s[0]);
      rect(ctx, ox + 14, oy + 42, 5, 4, s[0]);
      rect(ctx, ox + 28, oy + 41, 4, 3, s[1]);
      // Outline bits
      px(ctx, ox + 8, oy + 37, ol);
      px(ctx, ox + 22, oy + 39, ol);
      px(ctx, ox + 35, oy + 38, ol);
      return;
    }

    const sx = swayX;

    // ── Body outline ──
    rect(ctx, ox + 12 + sx, oy + 4, 24, 1, ol);
    rect(ctx, ox + 11 + sx, oy + 5, 1, 18, ol);
    rect(ctx, ox + 36 + sx, oy + 5, 1, 18, ol);
    rect(ctx, ox + 12 + sx, oy + 23, 24, 1, ol);

    // ── Head / Body (merged boulder shape) ──
    rect(ctx, ox + 12 + sx, oy + 5, 24, 18, s[2]);  // base
    rect(ctx, ox + 14 + sx, oy + 5, 10, 8, s[3]);    // highlight
    rect(ctx, ox + 24 + sx, oy + 13, 12, 10, s[1]);  // shadow
    rect(ctx, ox + 12 + sx, oy + 18, 24, 5, s[1]);   // lower shadow

    // Cracks
    rect(ctx, ox + 18 + sx, oy + 8, 1, 6, crack);
    rect(ctx, ox + 19 + sx, oy + 14, 1, 4, crack);
    rect(ctx, ox + 28 + sx, oy + 10, 1, 8, crack);
    rect(ctx, ox + 27 + sx, oy + 18, 1, 3, crack);

    if (crumble >= 1) {
      // Extra cracks
      rect(ctx, ox + 15 + sx, oy + 12, 1, 6, crack);
      rect(ctx, ox + 22 + sx, oy + 6, 1, 10, crack);
      rect(ctx, ox + 32 + sx, oy + 8, 1, 8, crack);
    }
    if (crumble >= 2) {
      // Pieces falling off
      rect(ctx, ox + 10, oy + 20, 4, 4, s[1]);
      rect(ctx, ox + 34, oy + 22, 5, 3, s[0]);
      rect(ctx, ox + 20, oy + 26, 3, 3, s[1]);
    }

    // ── Eyes (glowing orange-red) ──
    rect(ctx, ox + 16 + sx, oy + 9, 3, 2, '#FF6600');
    rect(ctx, ox + 17 + sx, oy + 9, 1, 1, '#FFAA00');
    rect(ctx, ox + 27 + sx, oy + 9, 3, 2, '#FF6600');
    rect(ctx, ox + 28 + sx, oy + 9, 1, 1, '#FFAA00');

    // ── Mouth ──
    rect(ctx, ox + 20 + sx, oy + 15, 8, 2, crack);
    rect(ctx, ox + 22 + sx, oy + 16, 4, 1, s[0]);

    // ── Arms ──
    if (armBack) {
      // Arm pulled back (right)
      rect(ctx, ox + 36 + sx, oy + 8, 6, 5, s[2]);
      rect(ctx, ox + 37 + sx, oy + 9, 4, 3, s[3]);
      rect(ctx, ox + 35 + sx, oy + 8, 1, 5, ol);
      rect(ctx, ox + 42 + sx, oy + 8, 1, 5, ol);
    } else if (armForward) {
      // Arm thrown forward (right)
      rect(ctx, ox + 36 + sx, oy + 14, 8, 5, s[2]);
      rect(ctx, ox + 37 + sx, oy + 15, 6, 3, s[1]);
      rect(ctx, ox + 35 + sx, oy + 14, 1, 5, ol);
      rect(ctx, ox + 44 + sx, oy + 14, 1, 5, ol);
    } else {
      // Arms at sides
      rect(ctx, ox + 8 + sx, oy + 10, 4, 12, s[2]);
      rect(ctx, ox + 9 + sx, oy + 11, 2, 10, s[1]);
      rect(ctx, ox + 7 + sx, oy + 10, 1, 12, ol);
      rect(ctx, ox + 36 + sx, oy + 10, 4, 12, s[2]);
      rect(ctx, ox + 37 + sx, oy + 11, 2, 10, s[1]);
      rect(ctx, ox + 40 + sx, oy + 10, 1, 12, ol);
    }

    // ── Legs ──
    if (crumble < 2) {
      // Left leg
      rect(ctx, ox + 14 + sx, oy + 24, 8, 14, s[1]);
      rect(ctx, ox + 15 + sx, oy + 25, 6, 6, s[2]);
      rect(ctx, ox + 14 + sx, oy + 34, 8, 4, s[0]); // foot
      rect(ctx, ox + 13 + sx, oy + 24, 1, 18, ol);
      rect(ctx, ox + 22 + sx, oy + 24, 1, 18, ol);
      rect(ctx, ox + 14 + sx, oy + 42, 8, 1, ol);

      // Right leg
      rect(ctx, ox + 26 + sx, oy + 24, 8, 14, s[1]);
      rect(ctx, ox + 27 + sx, oy + 25, 6, 6, s[2]);
      rect(ctx, ox + 26 + sx, oy + 34, 8, 4, s[0]);
      rect(ctx, ox + 25 + sx, oy + 24, 1, 18, ol);
      rect(ctx, ox + 34 + sx, oy + 24, 1, 18, ol);
      rect(ctx, ox + 26 + sx, oy + 42, 8, 1, ol);
    }
  }

  // Frames 0-3: Idle/patrol (sway)
  drawGolem(0 * W, 0, { swayX: 0 });
  drawGolem(1 * W, 0, { swayX: 1 });
  drawGolem(2 * W, 0, { swayX: 0 });
  drawGolem(3 * W, 0, { swayX: -1 });

  // Frames 4-5: Throw attack
  drawGolem(4 * W, 0, { armBack: true });
  drawGolem(5 * W, 0, { armForward: true });

  // Frames 6-8: Death crumble
  drawGolem(6 * W, 0, { crumble: 1 });
  drawGolem(7 * W, 0, { crumble: 2 });
  drawGolem(8 * W, 0, { crumble: 3 });

  save(canvas, 'enemy.png');
}

// ─── Lunar Dragon (Boss) ────────────────────────────────────────────────────

function generateBoss() {
  const W = 128, H = 128, FRAMES = 15;
  const canvas = createCanvas(W * FRAMES, H);
  const ctx = canvas.getContext('2d');

  function drawDragon(ox, oy, opts = {}) {
    const {
      wingAngle = 0,   // 0=mid, 1=up, -1=down
      diving = false,
      mouthOpen = false,
      fireBreath = false,
      tailUp = false,
      tailSlam = false,
      hurt = false,
      enraged = false,
      pullUp = false,
    } = opts;

    const sc = PAL.dragonScale;
    const wg = PAL.dragonWing;
    const ey = PAL.dragonEye;
    const bl = PAL.dragonBelly;
    const ol = PAL.outline;

    // Flash effect for hurt
    if (hurt) {
      rect(ctx, ox + 20, oy + 15, 88, 80, '#FFFFFF30');
    }
    if (enraged) {
      rect(ctx, ox + 18, oy + 13, 92, 84, '#FF440020');
    }

    const bodyY = diving ? -10 : 0;
    const bodyX = diving ? 10 : 0;

    // ── Wings ──
    const wingY = wingAngle === 1 ? -12 : wingAngle === -1 ? 8 : 0;

    if (!diving) {
      // Left wing
      rect(ctx, ox + 15 + bodyX, oy + 25 + bodyY + wingY, 25, 35, wg[1]);
      rect(ctx, ox + 10 + bodyX, oy + 20 + bodyY + wingY, 20, 10, wg[2]);
      rect(ctx, ox + 5 + bodyX, oy + 18 + bodyY + wingY, 15, 6, wg[0]);
      // Wing membrane lines
      for (let i = 0; i < 4; i++) {
        rect(ctx, ox + 12 + i * 5 + bodyX, oy + 22 + bodyY + wingY, 1, 30, wg[0]);
      }
      // Right wing
      rect(ctx, ox + 88 + bodyX, oy + 25 + bodyY + wingY, 25, 35, wg[1]);
      rect(ctx, ox + 98 + bodyX, oy + 20 + bodyY + wingY, 20, 10, wg[2]);
      rect(ctx, ox + 108 + bodyX, oy + 18 + bodyY + wingY, 15, 6, wg[0]);
      for (let i = 0; i < 4; i++) {
        rect(ctx, ox + 90 + i * 5 + bodyX, oy + 22 + bodyY + wingY, 1, 30, wg[0]);
      }
    } else {
      // Tucked wings
      rect(ctx, ox + 30 + bodyX, oy + 35 + bodyY, 10, 40, wg[1]);
      rect(ctx, ox + 88 + bodyX, oy + 35 + bodyY, 10, 40, wg[1]);
    }

    // ── Body ──
    // Outline
    rect(ctx, ox + 39 + bodyX, oy + 19 + bodyY, 50, 1, ol);
    rect(ctx, ox + 38 + bodyX, oy + 20 + bodyY, 1, 56, ol);
    rect(ctx, ox + 89 + bodyX, oy + 20 + bodyY, 1, 56, ol);
    rect(ctx, ox + 39 + bodyX, oy + 76 + bodyY, 50, 1, ol);

    rect(ctx, ox + 39 + bodyX, oy + 20 + bodyY, 50, 56, sc[1]); // base
    rect(ctx, ox + 42 + bodyX, oy + 22 + bodyY, 20, 25, sc[2]); // highlight
    rect(ctx, ox + 62 + bodyX, oy + 45 + bodyY, 25, 28, sc[0]); // shadow

    // Belly
    rect(ctx, ox + 48 + bodyX, oy + 45 + bodyY, 32, 28, bl[1]);
    rect(ctx, ox + 50 + bodyX, oy + 47 + bodyY, 14, 12, bl[2]);
    rect(ctx, ox + 64 + bodyX, oy + 58 + bodyY, 14, 12, bl[0]);
    // Belly scale lines
    for (let i = 0; i < 5; i++) {
      rect(ctx, ox + 48 + bodyX, oy + 48 + i * 5 + bodyY, 32, 1, sc[0]);
    }

    // ── Head ──
    const headX = ox + 42 + bodyX;
    const headY = oy + 8 + bodyY;

    // Head outline
    rect(ctx, headX - 1, headY, 1, 18, ol);
    rect(ctx, headX + 30, headY, 1, 18, ol);
    rect(ctx, headX, headY - 1, 30, 1, ol);
    rect(ctx, headX, headY + 18, 30, 1, ol);

    rect(ctx, headX, headY, 30, 18, sc[2]);
    rect(ctx, headX + 2, headY + 2, 12, 8, sc[3]); // highlight
    rect(ctx, headX + 18, headY + 10, 10, 6, sc[0]); // shadow

    // Horns
    rect(ctx, headX + 2, headY - 6, 3, 6, sc[0]);
    rect(ctx, headX + 3, headY - 8, 2, 3, sc[1]);
    rect(ctx, headX + 25, headY - 6, 3, 6, sc[0]);
    rect(ctx, headX + 26, headY - 8, 2, 3, sc[1]);

    // Eyes (glowing amber)
    rect(ctx, headX + 5, headY + 5, 5, 4, ey[0]);
    rect(ctx, headX + 6, headY + 6, 3, 2, ey[1]);
    px(ctx, headX + 7, headY + 6, ey[2]);

    rect(ctx, headX + 20, headY + 5, 5, 4, ey[0]);
    rect(ctx, headX + 21, headY + 6, 3, 2, ey[1]);
    px(ctx, headX + 22, headY + 6, ey[2]);

    // Snout / Mouth
    if (mouthOpen) {
      rect(ctx, headX + 8, headY + 12, 14, 6, sc[0]);
      rect(ctx, headX + 9, headY + 13, 12, 4, '#3A0A0A'); // mouth interior
      // Teeth
      for (let i = 0; i < 4; i++) {
        rect(ctx, headX + 10 + i * 3, headY + 13, 2, 2, '#E0E0E0');
      }
      // Weak point glow when mouth open
      rect(ctx, headX + 10, headY + 14, 10, 2, '#FF660088');
    } else {
      rect(ctx, headX + 8, headY + 13, 14, 3, sc[0]);
      rect(ctx, headX + 9, headY + 14, 12, 1, sc[1]);
    }

    // Nostrils
    px(ctx, headX + 10, headY + 11, ol);
    px(ctx, headX + 19, headY + 11, ol);

    // ── Fire / Ice breath ──
    if (fireBreath) {
      const f = PAL.fire;
      for (let i = 0; i < 20; i++) {
        const fx = headX + 8 + i * 2;
        const fy = headY + 20 + Math.sin(i * 0.8) * 4;
        const fw = 6 - Math.floor(i / 5);
        const fh = 8 - Math.floor(i / 4);
        const ci = Math.min(i % f.length, f.length - 1);
        rect(ctx, fx, fy, Math.max(fw, 1), Math.max(fh, 2), f[ci]);
      }
    }

    // ── Tail ──
    const tailBaseX = ox + 39 + bodyX;
    const tailBaseY = oy + 65 + bodyY;

    if (tailSlam) {
      // Tail slamming down
      rect(ctx, tailBaseX - 15, tailBaseY + 10, 20, 8, sc[1]);
      rect(ctx, tailBaseX - 25, tailBaseY + 14, 15, 6, sc[0]);
      rect(ctx, tailBaseX - 30, tailBaseY + 16, 8, 5, sc[0]);
      // Impact lines
      rect(ctx, tailBaseX - 28, tailBaseY + 21, 25, 2, ol);
      // Debris
      rect(ctx, tailBaseX - 20, tailBaseY + 8, 3, 3, sc[2]);
      rect(ctx, tailBaseX - 10, tailBaseY + 5, 2, 2, sc[1]);
    } else if (tailUp) {
      // Tail raised
      rect(ctx, tailBaseX - 10, tailBaseY - 15, 12, 8, sc[1]);
      rect(ctx, tailBaseX - 18, tailBaseY - 25, 10, 12, sc[0]);
      rect(ctx, tailBaseX - 22, tailBaseY - 30, 6, 8, sc[0]);
      rect(ctx, tailBaseX - 23, tailBaseY - 32, 4, 4, sc[2]);
    } else {
      // Tail resting / curled
      rect(ctx, tailBaseX - 10, tailBaseY, 12, 6, sc[1]);
      rect(ctx, tailBaseX - 20, tailBaseY + 4, 14, 5, sc[0]);
      rect(ctx, tailBaseX - 28, tailBaseY + 6, 10, 4, sc[0]);
      rect(ctx, tailBaseX - 32, tailBaseY + 5, 6, 4, sc[2]);
    }

    // ── Legs (small, since hovering) ──
    if (!diving) {
      // Left leg
      rect(ctx, ox + 45 + bodyX, oy + 75 + bodyY, 8, 12, sc[1]);
      rect(ctx, ox + 43 + bodyX, oy + 85 + bodyY, 12, 4, sc[0]);
      // Claws
      rect(ctx, ox + 43 + bodyX, oy + 89 + bodyY, 3, 3, ol);
      rect(ctx, ox + 48 + bodyX, oy + 89 + bodyY, 3, 3, ol);
      rect(ctx, ox + 53 + bodyX, oy + 89 + bodyY, 2, 2, ol);

      // Right leg
      rect(ctx, ox + 75 + bodyX, oy + 75 + bodyY, 8, 12, sc[1]);
      rect(ctx, ox + 73 + bodyX, oy + 85 + bodyY, 12, 4, sc[0]);
      rect(ctx, ox + 73 + bodyX, oy + 89 + bodyY, 3, 3, ol);
      rect(ctx, ox + 78 + bodyX, oy + 89 + bodyY, 3, 3, ol);
      rect(ctx, ox + 83 + bodyX, oy + 89 + bodyY, 2, 2, ol);
    }
  }

  // Frames 0-3: Idle hovering (wing flap cycle)
  drawDragon(0 * W, 0, { wingAngle: 0 });
  drawDragon(1 * W, 0, { wingAngle: 1 });
  drawDragon(2 * W, 0, { wingAngle: 0 });
  drawDragon(3 * W, 0, { wingAngle: -1 });

  // Frames 4-6: Dive attack
  drawDragon(4 * W, 0, { wingAngle: 1 });           // prep
  drawDragon(5 * W, 0, { diving: true });             // dive
  drawDragon(6 * W, 0, { wingAngle: -1, pullUp: true }); // pull up

  // Frames 7-9: Breath attack
  drawDragon(7 * W, 0, { mouthOpen: true });
  drawDragon(8 * W, 0, { mouthOpen: true, fireBreath: true });
  drawDragon(9 * W, 0, { mouthOpen: false });

  // Frames 10-11: Tail slam
  drawDragon(10 * W, 0, { tailUp: true });
  drawDragon(11 * W, 0, { tailSlam: true });

  // Frames 12-14: Hurt/enraged
  drawDragon(12 * W, 0, { hurt: true });
  drawDragon(13 * W, 0, { enraged: true, mouthOpen: true });
  drawDragon(14 * W, 0, { enraged: true, wingAngle: 1 });

  save(canvas, 'boss.png');
}

// ─── Ball ────────────────────────────────────────────────────────────────────

function generateBall() {
  const W = 16, H = 16;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const b = PAL.ballWhite;

  // Circle shape
  // Row by row, rough circle
  const rows = [
    [5, 11],   // y=2
    [4, 12],   // y=3
    [3, 13],   // y=4
    [2, 14],   // y=5
    [2, 14],   // y=6
    [2, 14],   // y=7
    [2, 14],   // y=8
    [2, 14],   // y=9
    [2, 14],   // y=10
    [3, 13],   // y=11
    [4, 12],   // y=12
    [5, 11],   // y=13
  ];

  rows.forEach(([x1, x2], i) => {
    const y = i + 2;
    for (let x = x1; x <= x2; x++) {
      // Determine shade based on position (light from top-left)
      const dx = x - 6, dy = y - 5;
      const d = Math.sqrt(dx * dx + dy * dy);
      let shade;
      if (d < 3) shade = b[3];
      else if (d < 5) shade = b[2];
      else if (d < 7) shade = b[1];
      else shade = b[0];
      px(ctx, x, y, shade);
    }
  });

  // Outline
  rows.forEach(([x1, x2], i) => {
    const y = i + 2;
    px(ctx, x1 - 1, y, PAL.outline);
    px(ctx, x2 + 1, y, PAL.outline);
  });
  for (let x = 5; x <= 11; x++) { px(ctx, x, 1, PAL.outline); px(ctx, x, 14, PAL.outline); }
  for (let x = 4; x <= 12; x++) {
    if (x < 5 || x > 11) { px(ctx, x, 2, PAL.outline); px(ctx, x, 13, PAL.outline); }
  }

  // Dimples
  px(ctx, 6, 5, b[1]);
  px(ctx, 9, 4, b[1]);
  px(ctx, 5, 8, b[1]);
  px(ctx, 10, 7, b[1]);
  px(ctx, 7, 10, b[1]);
  px(ctx, 11, 10, b[1]);
  px(ctx, 8, 7, b[0]);
  px(ctx, 4, 6, b[0]);

  // Specular highlight
  px(ctx, 5, 4, '#FFFFFF');
  px(ctx, 6, 3, '#FFFFFF');
  px(ctx, 6, 4, '#FFFFFF');

  save(canvas, 'ball.png');
}

// ─── Projectile ──────────────────────────────────────────────────────────────

function generateProjectile() {
  const W = 16, H = 16;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const r = PAL.rock;
  const ol = PAL.outline;

  // Irregular rock shape
  // Rough oval with jagged edges
  const rows = [
    [6, 10],   // y=3
    [4, 12],   // y=4
    [3, 13],   // y=5
    [3, 13],   // y=6
    [2, 14],   // y=7
    [2, 13],   // y=8
    [3, 14],   // y=9
    [3, 13],   // y=10
    [4, 12],   // y=11
    [5, 11],   // y=12
  ];

  rows.forEach(([x1, x2], i) => {
    const y = i + 3;
    for (let x = x1; x <= x2; x++) {
      const shade = (x + y) % 3 === 0 ? r[0] : (x + y) % 3 === 1 ? r[1] : r[2];
      px(ctx, x, y, shade);
    }
    // Outline
    px(ctx, x1 - 1, y, ol);
    px(ctx, x2 + 1, y, ol);
  });

  // Top/bottom outline
  for (let x = 6; x <= 10; x++) px(ctx, x, 2, ol);
  for (let x = 5; x <= 11; x++) px(ctx, x, 13, ol);

  // Rough edges - add some jagged pixels
  px(ctx, 5, 3, ol);
  px(ctx, 11, 3, ol);
  px(ctx, 2, 8, ol);

  save(canvas, 'projectile.png');
}

// ─── Asteroid ────────────────────────────────────────────────────────────────

function generateAsteroid() {
  const W = 32, H = 32;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const a = PAL.asteroid;
  const ol = PAL.outline;

  // Irregular round shape, row by row
  const rows = [
    [11, 21],  // y=4
    [9, 23],   // y=5
    [7, 25],   // y=6
    [6, 26],   // y=7
    [5, 27],   // y=8
    [4, 27],   // y=9
    [4, 28],   // y=10
    [3, 28],   // y=11
    [3, 28],   // y=12
    [3, 28],   // y=13
    [3, 28],   // y=14
    [3, 27],   // y=15
    [4, 27],   // y=16
    [4, 27],   // y=17
    [4, 26],   // y=18
    [5, 26],   // y=19
    [5, 25],   // y=20
    [6, 25],   // y=21
    [7, 24],   // y=22
    [8, 23],   // y=23
    [9, 22],   // y=24
    [11, 21],  // y=25
    [13, 19],  // y=26
  ];

  rows.forEach(([x1, x2], i) => {
    const y = i + 4;
    for (let x = x1; x <= x2; x++) {
      // Shading: light from top-left
      const dx = x - 12, dy = y - 11;
      const d = Math.sqrt(dx * dx + dy * dy);
      let shade;
      if (d < 5) shade = a[3];
      else if (d < 9) shade = a[2];
      else if (d < 12) shade = a[1];
      else shade = a[0];
      px(ctx, x, y, shade);
    }
    // Outline
    px(ctx, x1 - 1, y, ol);
    px(ctx, x2 + 1, y, ol);
  });

  // Top/bottom outline
  for (let x = 11; x <= 21; x++) px(ctx, x, 3, ol);
  for (let x = 13; x <= 19; x++) px(ctx, x, 27, ol);

  // Crater dimples (darker circles)
  const craters = [
    { x: 10, y: 10, r: 3 },
    { x: 20, y: 8, r: 2 },
    { x: 15, y: 18, r: 3 },
    { x: 22, y: 16, r: 2 },
    { x: 8, y: 16, r: 2 },
  ];
  craters.forEach(c => {
    for (let dy = -c.r; dy <= c.r; dy++) {
      for (let dx = -c.r; dx <= c.r; dx++) {
        if (dx * dx + dy * dy <= c.r * c.r) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          const shade = dist < c.r * 0.5 ? a[0] : a[1];
          px(ctx, c.x + dx, c.y + dy, shade);
        }
      }
    }
    // Crater rim highlight (top-left edge)
    px(ctx, c.x - c.r, c.y - 1, a[3]);
    px(ctx, c.x - 1, c.y - c.r, a[3]);
  });

  save(canvas, 'asteroid.png');
}

// ─── Main ────────────────────────────────────────────────────────────────────

console.log('Generating Golf Quest sprite sheets...\n');

generateJJ();
generatePatrick();
generateEnemy();
generateBoss();
generateBall();
generateProjectile();
generateAsteroid();

console.log('\nDone! All sprites generated in golf-quest/assets/sprites/');
