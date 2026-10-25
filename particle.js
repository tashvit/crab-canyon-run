// Code for fireworks adapted from Daniel Shiffman
// https://editor.p5js.org/codingtrain/sketches/O2M0SO-WO

const FIREWORK_COLORS = [
    [255, 79, 135], // pink
    [238, 221, 96], // yellow 
    [241, 148, 87], // orange
    [0, 255, 0] // green
];

class Firework {
    constructor() {
        push();
        //colorMode(HSB);
        let fireworkColor = random(FIREWORK_COLORS);
        this.hu = hue(color(fireworkColor[0], fireworkColor[1], fireworkColor[2]));
        pop();

        this.firework = new Particle(random(width), height - 200, this.hu, true);
        this.exploded = false;
        this.particles = [];
    }

    done() {
        if (this.exploded && this.particles.length === 0) {
            return true;
        } else {
            return false;
        }
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(gravity);
            this.firework.update();

            if (this.firework.vel.y >= 0) {
                this.exploded = true;
                this.explode();
            }
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].applyForce(gravity);
            this.particles[i].update();

            if (this.particles[i].done()) {
                this.particles.splice(i, 1);
            }
        }
    }

    explode() {
        // Create 100 particles for the explosion
        for (let i = 0; i < 100; i++) {
            const p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, false);
            this.particles.push(p);
        }
    }

    show() {
        push();
        colorMode(HSB);
        if (!this.exploded) {
            this.firework.show();
        }

        for (var i = 0; i < this.particles.length; i++) {
            this.particles[i].show();
        }
        pop();
    }
}