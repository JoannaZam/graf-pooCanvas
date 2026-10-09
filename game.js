
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Clase Ball (Pelota)
class Ball {
    constructor(x, y, radius, speedX, speedY, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.speedX = speedX;
        this.speedY = speedY;
        this.color = color;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    move() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Rebote con la parte superior e inferior
        if (this.y - this.radius <= 0) {
            this.y = this.radius;
            this.speedY = Math.abs(this.speedY);
        }

        if (this.y + this.radius >= canvas.height) {
            this.y = canvas.height - this.radius;
            this.speedY = -Math.abs(this.speedY);
        }
    }

    reset(direction) {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.speedX = Math.abs(this.speedX) * direction;
        this.speedY = Math.abs(this.speedY) *
            (Math.random() < 0.5 ? 1 : -1);
    }
}

// Clase Paddle (Paleta)
class Paddle {
    constructor(x, y, width, height, color, isPlayerControlled = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.isPlayerControlled = isPlayerControlled;
        this.speed = 6;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        if (direction === 'up') {
            this.y -= this.speed;
        } else if (direction === 'down') {
            this.y += this.speed;
        }

        // Evitar que la paleta salga del canvas
        this.y = Math.max(
            0,
            Math.min(canvas.height - this.height, this.y)
        );
    }

    // Movimiento automático de la CPU
    autoMove(ball) {
        const targetY = ball.y - this.height / 2;

        if (this.y + this.height / 2 < ball.y - 10) {
            this.y += this.speed;
        } else if (this.y + this.height / 2 > ball.y + 10) {
            this.y -= this.speed;
        }

        this.y = Math.max(
            0,
            Math.min(canvas.height - this.height, this.y)
        );
    }
}

// Clase Game (Controla el juego)
class Game {
    constructor() {
        // Cinco pelotas de distintos tamaños, colores y velocidades
        this.balls = [
            new Ball(canvas.width / 2, canvas.height / 2, 8, 3, 3, '#00FFFF'),
            new Ball(canvas.width / 2, canvas.height / 2, 12, 4, -3, '#FF4444'),
            new Ball(canvas.width / 2, canvas.height / 2, 16, 5, 2, '#FFFF00'),
            new Ball(canvas.width / 2, canvas.height / 2, 10, 6, -4, '#39FF14'),
            new Ball(canvas.width / 2, canvas.height / 2, 6, 2, 5, '#FF69B4')
        ];

        // Paleta del jugador: el doble de altura (200 px)
        this.paddle1 = new Paddle(
            10, canvas.height / 2 - 100,
            12, 200, '#00BFFF', true
        );

        // Paleta de la computadora
        this.paddle2 = new Paddle(
            canvas.width - 22, canvas.height / 2 - 50,
            12, 100, '#FF4500'
        );

        this.keys = {};
    }

    draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Línea central decorativa
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = '#777777';
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dibujar las cinco pelotas
        this.balls.forEach(ball => ball.draw());

        this.paddle1.draw();
        this.paddle2.draw();
    }

    update() {
        // Movimiento del jugador
        if (this.keys['ArrowUp']) {
            this.paddle1.move('up');
        }

        if (this.keys['ArrowDown']) {
            this.paddle1.move('down');
        }

        // Actualizar todas las pelotas
        this.balls.forEach(ball => {
            ball.move();

            // Colisión con la paleta del jugador
            if (
                ball.speedX < 0 &&
                ball.x - ball.radius <= this.paddle1.x + this.paddle1.width &&
                ball.x + ball.radius >= this.paddle1.x &&
                ball.y + ball.radius >= this.paddle1.y &&
                ball.y - ball.radius <= this.paddle1.y + this.paddle1.height
            ) {
                ball.x = this.paddle1.x + this.paddle1.width + ball.radius;
                ball.speedX = Math.abs(ball.speedX);
            }

            // Colisión con la paleta de la CPU
            if (
                ball.speedX > 0 &&
                ball.x + ball.radius >= this.paddle2.x &&
                ball.x - ball.radius <= this.paddle2.x + this.paddle2.width &&
                ball.y + ball.radius >= this.paddle2.y &&
                ball.y - ball.radius <= this.paddle2.y + this.paddle2.height
            ) {
                ball.x = this.paddle2.x - ball.radius;
                ball.speedX = -Math.abs(ball.speedX);
            }

            // Si sale por un extremo, vuelve al centro
            if (ball.x + ball.radius < 0) {
                ball.reset(1);
            } else if (ball.x - ball.radius > canvas.width) {
                ball.reset(-1);
            }
        });

        // La CPU sigue la pelota que se aproxima a su lado
        const approachingBalls = this.balls.filter(
            ball => ball.speedX > 0
        );

        if (approachingBalls.length > 0) {
            const targetBall = approachingBalls.reduce(
                (closest, ball) =>
                    ball.x > closest.x ? ball : closest
            );

            this.paddle2.autoMove(targetBall);
        }
    }

    handleInput() {
        window.addEventListener('keydown', event => {
            if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault();
            }

            this.keys[event.key] = true;
        });

        window.addEventListener('keyup', event => {
            this.keys[event.key] = false;
        });

        window.addEventListener('blur', () => {
            this.keys = {};
        });
    }

    run() {
        this.handleInput();

        const gameLoop = () => {
            this.update();
            this.draw();
            requestAnimationFrame(gameLoop);
        };

        gameLoop();
    }
}

// Crear y ejecutar el juego
const game = new Game();
game.run();
