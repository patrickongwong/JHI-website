export class BackgroundSystem {
    constructor(scene, skyConfig, biome) {
        this.scene = scene;
        this.skyConfig = skyConfig;
        this.biome = biome;
        this.elements = [];
        this.clouds = [];
        this.rainGraphics = null;

        const { width, height } = scene.scale;
        this.screenWidth = width;
        this.screenHeight = height;

        this.createSkyGradient(skyConfig);

        if (skyConfig.hasStars) {
            this.createStars();
        }

        if (skyConfig.hasSun) {
            this.createSun(skyConfig);
        } else if (biome === 'space') {
            this.createEarth();
        } else {
            this.createMoon();
        }

        if (biome !== 'space') {
            this.createParallaxHills(biome);
        }

        if (skyConfig.hasClouds) {
            this.createClouds();
        }

        if (skyConfig.hasRain) {
            this.createRain();
        }
    }

    createSkyGradient(skyConfig) {
        const { screenWidth, screenHeight } = this;
        const sky = this.scene.add.graphics();
        sky.fillGradientStyle(skyConfig.top, skyConfig.top, skyConfig.bottom, skyConfig.bottom, 1);
        sky.fillRect(0, 0, screenWidth * 3, screenHeight);
        sky.setScrollFactor(0);
        sky.setDepth(-10);
        this.elements.push(sky);
    }

    createStars() {
        const { screenWidth, screenHeight, scene } = this;
        const starCount = 50 + Math.floor(Math.random() * 31); // 50-80

        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * screenWidth;
            const y = Math.random() * screenHeight * 0.7;
            const radius = 1 + Math.random() * 2;

            const star = scene.add.circle(x, y, radius, 0xffffff);
            star.setScrollFactor(0);
            star.setDepth(-9);
            star.setAlpha(0.3 + Math.random() * 0.7);

            scene.tweens.add({
                targets: star,
                alpha: { from: 0.3, to: 1.0 },
                duration: 1000 + Math.random() * 2000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.elements.push(star);
        }
    }

    createSun(skyConfig) {
        const { screenWidth, scene } = this;
        const time = this.getTimeFromConfig(skyConfig);
        const isLow = (time === 'afternoon' || time === 'sunset');
        const sunX = screenWidth * 0.8;
        const sunY = isLow ? 120 : 60;
        const sunColor = isLow ? 0xFF8C00 : 0xFFDD44;

        // Warm glow behind sun
        const glow = scene.add.circle(sunX, sunY, 60, sunColor, 0.2);
        glow.setScrollFactor(0);
        glow.setDepth(-8);
        this.elements.push(glow);

        // Sun body
        const sun = scene.add.circle(sunX, sunY, 30, sunColor);
        sun.setScrollFactor(0);
        sun.setDepth(-8);
        this.elements.push(sun);
    }

    createMoon() {
        const { screenWidth, scene } = this;
        const moonX = screenWidth * 0.75;
        const moonY = 70;

        // Moon body
        const moon = scene.add.circle(moonX, moonY, 25, 0xcccccc);
        moon.setScrollFactor(0);
        moon.setDepth(-8);
        this.elements.push(moon);

        // Crater details
        const craters = [
            { ox: -8, oy: -5, r: 5 },
            { ox: 6, oy: 3, r: 4 },
            { ox: -3, oy: 8, r: 3 },
            { ox: 10, oy: -8, r: 3 }
        ];
        craters.forEach(c => {
            const crater = scene.add.circle(moonX + c.ox, moonY + c.oy, c.r, 0x999999);
            crater.setScrollFactor(0);
            crater.setDepth(-8);
            this.elements.push(crater);
        });
    }

    createEarth() {
        const { screenWidth, scene } = this;
        const earthX = screenWidth * 0.3;
        const earthY = 80;
        const radius = 80;

        // Atmosphere glow
        const atmo = scene.add.circle(earthX, earthY, radius + 8, 0x4488ff, 0.15);
        atmo.setScrollFactor(0);
        atmo.setDepth(-8);
        this.elements.push(atmo);

        // Earth body (blue ocean)
        const earth = scene.add.circle(earthX, earthY, radius, 0x2255aa);
        earth.setScrollFactor(0);
        earth.setDepth(-8);
        this.elements.push(earth);

        // Continent shapes (green patches using graphics)
        const continents = scene.add.graphics();
        continents.setScrollFactor(0);
        continents.setDepth(-8);
        continents.fillStyle(0x33aa44, 1);
        // Approximate continent blobs
        continents.fillEllipse(earthX - 20, earthY - 15, 30, 20);
        continents.fillEllipse(earthX + 25, earthY + 5, 20, 28);
        continents.fillEllipse(earthX - 10, earthY + 25, 24, 14);
        this.elements.push(continents);

        // Cloud wisps (semi-transparent white ellipses)
        const cloudWisps = scene.add.graphics();
        cloudWisps.setScrollFactor(0);
        cloudWisps.setDepth(-8);
        cloudWisps.fillStyle(0xffffff, 0.3);
        cloudWisps.fillEllipse(earthX - 30, earthY - 5, 40, 8);
        cloudWisps.fillEllipse(earthX + 15, earthY - 20, 35, 6);
        cloudWisps.fillEllipse(earthX + 5, earthY + 15, 30, 7);
        this.elements.push(cloudWisps);
    }

    createParallaxHills(biome) {
        const { screenWidth, screenHeight, scene } = this;
        const colorMap = {
            meadow: { far: 0x2d5a27, near: 0x3d7a37 },
            desert: { far: 0x8b7355, near: 0xb09970 },
            tundra: { far: 0x5a6a7a, near: 0x7a8a9a }
        };
        const colors = colorMap[biome];
        if (!colors) return;

        // Far hills - darker, slower parallax
        const farHills = scene.add.graphics();
        farHills.fillStyle(colors.far, 1);
        farHills.beginPath();
        farHills.moveTo(0, screenHeight);
        const farSegments = 8;
        for (let i = 0; i <= farSegments; i++) {
            const x = (i / farSegments) * screenWidth;
            const y = screenHeight - 80 - Math.sin(i * 0.9 + 0.5) * 40 - Math.sin(i * 1.7) * 20;
            farHills.lineTo(x, y);
        }
        farHills.lineTo(screenWidth, screenHeight);
        farHills.closePath();
        farHills.fillPath();
        farHills.setScrollFactor(0.15);
        farHills.setDepth(-5);
        this.elements.push(farHills);

        // Near hills - lighter, faster parallax
        const nearHills = scene.add.graphics();
        nearHills.fillStyle(colors.near, 1);
        nearHills.beginPath();
        nearHills.moveTo(0, screenHeight);
        for (let i = 0; i <= farSegments; i++) {
            const x = (i / farSegments) * screenWidth;
            const y = screenHeight - 50 - Math.sin(i * 1.2 + 2) * 30 - Math.sin(i * 2.1) * 15;
            nearHills.lineTo(x, y);
        }
        nearHills.lineTo(screenWidth, screenHeight);
        nearHills.closePath();
        nearHills.fillPath();
        nearHills.setScrollFactor(0.3);
        nearHills.setDepth(-5);
        this.elements.push(nearHills);
    }

    createClouds() {
        const { screenWidth, screenHeight, scene } = this;
        const cloudCount = 5 + Math.floor(Math.random() * 4); // 5-8

        for (let i = 0; i < cloudCount; i++) {
            const x = Math.random() * screenWidth;
            const y = 20 + Math.random() * (screenHeight * 0.3);
            const cloud = scene.add.graphics();
            cloud.fillStyle(0xffffff, 0.5 + Math.random() * 0.3);

            // Draw a cloud as overlapping ellipses
            const w = 40 + Math.random() * 40;
            const h = 15 + Math.random() * 10;
            cloud.fillEllipse(0, 0, w, h);
            cloud.fillEllipse(-w * 0.3, 3, w * 0.6, h * 0.7);
            cloud.fillEllipse(w * 0.3, 2, w * 0.5, h * 0.8);

            cloud.setPosition(x, y);
            cloud.setScrollFactor(0.3);
            cloud.setDepth(-4);

            this.clouds.push(cloud);
            this.elements.push(cloud);
        }
    }

    createRain() {
        const { screenWidth, screenHeight, scene } = this;
        this.rainGraphics = scene.add.graphics();
        this.rainGraphics.setScrollFactor(0);
        this.rainGraphics.setDepth(-3);
        this.elements.push(this.rainGraphics);

        // Pre-generate rain drop positions
        this.rainDrops = [];
        for (let i = 0; i < 120; i++) {
            this.rainDrops.push({
                x: Math.random() * screenWidth,
                y: Math.random() * screenHeight,
                speed: 4 + Math.random() * 4,
                length: 8 + Math.random() * 12
            });
        }
    }

    getTimeFromConfig(skyConfig) {
        // Determine time-of-day string from skyConfig properties
        if (skyConfig.hasSun && skyConfig.top === 0x87CEEB) return 'day';
        if (skyConfig.hasSun && skyConfig.top === 0xFF8C42) return 'afternoon';
        if (skyConfig.hasSun && skyConfig.top === 0x8B1A1A) return 'sunset';
        return 'other';
    }

    update(time) {
        // Animate clouds
        if (this.clouds.length > 0) {
            const { screenWidth } = this;
            this.clouds.forEach(cloud => {
                cloud.x += 0.2;
                if (cloud.x > screenWidth + 100) {
                    cloud.x = -100;
                }
            });
        }

        // Animate rain
        if (this.rainGraphics && this.rainDrops) {
            this.rainGraphics.clear();
            this.rainGraphics.lineStyle(1, 0xaaaacc, 0.4);
            this.rainDrops.forEach(drop => {
                drop.y += drop.speed;
                if (drop.y > this.screenHeight) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * this.screenWidth;
                }
                this.rainGraphics.beginPath();
                this.rainGraphics.moveTo(drop.x, drop.y);
                this.rainGraphics.lineTo(drop.x - 1, drop.y + drop.length);
                this.rainGraphics.strokePath();
            });
        }
    }

    destroy() {
        this.elements.forEach(el => {
            if (el && el.destroy) {
                el.destroy();
            }
        });
        this.elements = [];
        this.clouds = [];
        this.rainDrops = null;
        this.rainGraphics = null;
    }
}
