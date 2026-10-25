// Code for fireworks adapted from Daniel Shiffman
// https://editor.p5js.org/codingtrain/sketches/O2M0SO-WO

class Particle {
    constructor(x, y, hu, firework) {
        this.pos = createVector(x, y);
        this.firework = firework;
        this.lifespan = 255;
        this.hu = hu;
        this.acc = createVector(0, 0);
        if (this.firework) {
            this.vel = createVector(0, random(-12, -8));
        } else {
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(2, 10));
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.firework) {
            this.vel.mult(0.9);
            this.lifespan -= 3; // fade speed
        }
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
    }

    done() {
        if (this.lifespan < 0) {
            return true;
        } else {
            return false;
        }
    }

    show() {
        push();
        colorMode(HSB);

        if (!this.firework) {
            strokeWeight(4);
            stroke(this.hu, 255, 255, this.lifespan);
        } else {
            strokeWeight(8);
            stroke(this.hu, 255, 255);
        }

        point(this.pos.x, this.pos.y);
        pop();
    }
}