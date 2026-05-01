const canvas = document.getElementById('particles-bg');
const ctx = canvas.getContext('2d');

let particlesArray;

// Resize canvas
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    init();
});

// Particle object
class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
        this.baseSize = size;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fill();
    }

    update() {
        if (this.x > canvas.width || this.x < 0) {
            this.directionX = -this.directionX;
        }
        if (this.y > canvas.height || this.y < 0) {
            this.directionY = -this.directionY;
        }

        this.x += this.directionX;
        this.y += this.directionY;
        
        // Randomly pulse size
        if(Math.random() > 0.98) {
            this.size = this.baseSize * (1 + Math.random());
        } else {
            this.size += (this.baseSize - this.size) * 0.1;
        }

        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    
    // colors: blue, purple, pink
    const colors = ['rgba(0, 243, 255, 0.8)', 'rgba(188, 19, 254, 0.8)', 'rgba(255, 0, 127, 0.8)'];
    
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 2) - 1;
        let directionY = (Math.random() * 2) - 1;
        let color = colors[Math.floor(Math.random() * colors.length)];

        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
}

init();
animate();

// --- Promo Logic ---
document.addEventListener('DOMContentLoaded', () => {
    const text1 = document.getElementById('promo-text-1');
    const text2 = document.getElementById('promo-text-2');
    const skills = document.getElementById('promo-skills');
    const text3 = document.getElementById('promo-text-3');
    const startBtn = document.getElementById('start-btn');
    const promoScreen = document.getElementById('promo-screen');
    const authScreen = document.getElementById('auth-screen');

    // Simulate promo intro
    setTimeout(() => {
        text1.classList.add('hidden');
        text2.classList.remove('hidden');
    }, 2000);

    setTimeout(() => {
        text2.classList.add('hidden');
        skills.classList.remove('hidden');
    }, 4000);

    setTimeout(() => {
        skills.classList.add('hidden');
        text3.classList.remove('hidden');
        startBtn.classList.remove('hidden');
    }, 6500);

    startBtn.addEventListener('click', () => {
        promoScreen.classList.add('hidden');
        authScreen.classList.remove('hidden');
    });
});
