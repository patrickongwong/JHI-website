export const PhysicsConfig = {
    ball: {
        radius: 8,
        restitution: 0.5,
        friction: 0.05,
        frictionAir: 0.002,
        density: 0.002,
        maxHitPower: 16,
        minHitPower: 0.5,
        sandFriction: 0.15,
        waterResetPenalty: 1,
        holeGravityRadius: 40,
        holeGravityForce: 0.002,
        holeSpeedThreshold: 2
    },
    player: {
        speed: 3.8,
        jumpForce: -10,
        width: 24,
        height: 40,
        frictionAir: 0.05
    },
    biomes: {
        meadow: { gravity: 1.5, wind: 0 },
        desert: { gravity: 1.5, wind: 0 },
        tundra: { gravity: 1.5, wind: 0.0008 },
        space:  { gravity: 0.5, wind: 0 }
    }
};
