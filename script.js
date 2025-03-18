const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const menu = document.getElementById('menu');
const finalScoreDisplay = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let labubuImage = new Image();
labubuImage.src = 'imagenes/labubu.png';
let labubu2Image = new Image();
labubu2Image.src = 'imagenes/labubu2.png';
let currentLabubuImage = labubuImage;
let virusImage = new Image();
let virusImageSrc = ['imagenes/virus.png', 'imagenes/virus2.png', 'imagenes/virus3.png'];
virusImage.src = virusImageSrc[0];
let bossImage = new Image();
bossImage.src = 'imagenes/boss.png';
let windosImage = new Image();
windosImage.src = 'imagenes/windos.png';
const fondos = ['imagenes/fondo1.jpg', 'imagenes/fondo2.jpg', 'imagenes/fondo3.jpg'];

let player = {
    x: canvas.width / 2 - 25,
    y: canvas.height / 2 - 25,
    width: 50,
    height: 50,
    speed: 5,
    isMoving: {
        left: false,
        right: false,
        up: false,
        down: false
    },
    transformed: false,
    invulnerable: false,
    invulnerableTimer: 0
};

let bugs = [];
let bullets = [];
let score = 0;
let time = 0;
let gameInterval;
let bugInterval;
let boss = null;
let bossHealth = 500;
let difficulty = 0.7;
let windos = null;
let initialBugInterval = 1500;
let currentBugInterval;
let level = 1;
let bossDefeated = false;
let scoreAtBossDefeat = 0; // Para rastrear la puntuación al derrotar al boss

function createBug() {
    let newBugX, newBugY;
    do {
        newBugX = Math.random() * (canvas.width - 50);
        newBugY = Math.random() * (canvas.height - 50);
    } while (Math.abs(newBugX - player.x) < 100 && Math.abs(newBugY - player.y) < 100);

    let bug = {
        x: newBugX,
        y: newBugY,
        width: 50,
        height: 50,
        speedX: (Math.random() - 0.5) * 2 * difficulty * level,
        speedY: (Math.random() - 0.5) * 2 * difficulty * level
    };
    bugs.push(bug);
}

function createBoss() {
    boss = {
        x: canvas.width / 2 - 100,
        y: 50,
        width: 200,
        height: 200,
        health: bossHealth * level,
        speedX: 0.8 * difficulty * level,
        speedY: 0.8 * difficulty * level
    };
}

function createWindos() {
    windos = {
        x: Math.random() * (canvas.width - 30),
        y: Math.random() * (canvas.height - 30),
        width: 30,
        height: 30
    };
}

function createBullet(xOffset = 0, isBig = false) {
    let size = isBig ? 10 : 5;
    let height = isBig ? 20 : 10;
    let bullet = {
        x: player.x + player.width / 2 - size / 2 + xOffset,
        y: player.y,
        width: size,
        height: height,
        speed: 10
    };
    bullets.push(bullet);
}

function shootRafaga() {
    if (player.transformed) {
        createBullet(0, true);
        createBullet(-10, true);
        createBullet(10, true);
    } else {
        createBullet(0, false);
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentLabubuImage, player.x, player.y, player.width, player.height);

    if (player.isMoving.left && player.x > 0) player.x -= player.speed;
    if (player.isMoving.right && player.x < canvas.width - player.width) player.x += player.speed;
    if (player.isMoving.up && player.y > 0) player.y -= player.speed;
    if (player.isMoving.down && player.y < canvas.height - player.height) player.y += player.speed;

    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i];
        ctx.fillStyle = 'white';
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        bullet.y -= bullet.speed;

        if (bullet.y < 0) {
            bullets.splice(i, 1);
            i--;
            continue;
        }

        for (let j = 0; j < bugs.length; j++) {
            let bug = bugs[j];
            if (bullet.x < bug.x + bug.width &&
                bullet.x + bullet.width > bug.x &&
                bullet.y < bug.y + bug.height &&
                bullet.y + bullet.height > bug.y) {
                bugs.splice(j, 1);
                bullets.splice(i, 1);
                score += 20;
                i--;
                break;
            }
        }

        if (boss) {
            if (bullet.x < boss.x + boss.width &&
                bullet.x + bullet.width > boss.x &&
                bullet.y < boss.y + boss.height &&
                bullet.y + bullet.height > boss.y) {
                boss.health -= 10;
                bullets.splice(i, 1);
                i--;
                if (boss.health <= 0) {
                    boss = null;
                    level++;
                    difficulty += 0.05;
                    clearInterval(bugInterval);
                    currentBugInterval = Math.max(300, initialBugInterval - (level * 150));
                    bugInterval = setInterval(createBug, currentBugInterval);
                    bossDefeated = true;
                    scoreAtBossDefeat = score; // Guardar la puntuación al derrotar al boss
                    document.body.style.backgroundImage = `url('${fondos[0]}')`; // Volver al fondo 1
                }
            }
        }
    }

    for (let i = 0; i < bugs.length; i++) {
        let bug = bugs[i];
        ctx.drawImage(virusImage, bug.x, bug.y, bug.width, bug.height);
        bug.x += bug.speedX;
        bug.y += bug.speedY;

        if (bug.x < 0 || bug.x > canvas.width - bug.width) bug.speedX *= -1;
        if (bug.y < 0 || bug.y > canvas.height - bug.height) bug.speedY *= -1;

        const dx = player.x + player.width / 2 - (bug.x + bug.width / 2);
        const dy = player.y + player.height / 2 - (bug.y + bug.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < player.width / 2 + bug.width / 2 - 10) {
            if (player.transformed) {
                player.transformed = false;
                currentLabubuImage = labubuImage;
                player.width = 50;
                player.height = 50;
                player.invulnerable = true;
                player.invulnerableTimer = 180;
            } else if (!player.invulnerable) {
                gameOver();
            }
        }
    }

    if (boss) {
        ctx.drawImage(bossImage, boss.x, boss.y, boss.width, boss.height);
        ctx.fillStyle = 'red';
        ctx.fillRect(boss.x, boss.y - 20, boss.width, 10);
        ctx.fillStyle = 'green';
        ctx.fillRect(boss.x, boss.y - 20, (boss.width * boss.health) / bossHealth, 10);

        boss.x += boss.speedX;
        boss.y += boss.speedY;

        if (boss.x < 0 || boss.x > canvas.width - boss.width) boss.speedX *= -1;
        if (boss.y < 0 || boss.y > canvas.height - boss.height) boss.speedY *= -1;

        const dxBoss = player.x + player.width / 2 - (boss.x + boss.width / 2);
        const dyBoss = player.y + player.height / 2 - (boss.y + boss.height / 2);
        const distanceBoss = Math.sqrt(dxBoss * dxBoss + dyBoss * dyBoss);

        if (distanceBoss < player.width / 2 + boss.width / 2 - 50 && !player.invulnerable) {
            gameOver();
        }
    }

    if (windos) {
        ctx.drawImage(windosImage, windos.x, windos.y, windos.width, windos.height);
        if (player.x < windos.x + windos.width &&
            player.x + player.width > windos.x &&
            player.y < windos.y + windos.height &&
            player.y + player.height > windos.y) {
            windos = null;
            player.transformed = true;
            currentLabubuImage = labubu2Image;
            player.width = 70;
            player.height = 70;
        }
    }

    scoreDisplay.textContent = 'Puntuación: ' + score;
    timeDisplay.textContent = 'Tiempo: ' + time;
    scoreDisplay.textContent += ` Nivel: ${level}`;

    changeBackground();

    if (score % 500 === 0 && score > 0 && !windos) {
        createWindos();
    }

    if (player.invulnerable) {
        player.invulnerableTimer--;
        if (player.invulnerableTimer <= 0) {
            player.invulnerable = false;
        }
    }

    if (bossDefeated && boss === null) {
        bossDefeated = false;
    }
}

function handleKeyDown(e) {
    if (e.key === 'ArrowLeft') player.isMoving.left = true;
    if (e.key === 'ArrowRight') player.isMoving.right = true;
    if (e.key === 'ArrowUp') player.isMoving.up = true;
    if (e.key === 'ArrowDown') player.isMoving.down = true;
    if (e.key === ' ') shootRafaga();
}

function handleKeyUp(e) {
    if (e.key === 'ArrowLeft') player.isMoving.left = false;
    if (e.key === 'ArrowRight') player.isMoving.right = false;
    if (e.key === 'ArrowUp') player.isMoving.up = false;
    if (e.key === 'ArrowDown') player.isMoving.down = false;
}

function gameOver() {
    clearInterval(gameInterval);
    clearInterval(bugInterval);
    finalScoreDisplay.textContent = 'Puntuación final: ' + score;
    menu.classList.remove('hidden');
}

function restartGame() {
    menu.classList.add('hidden');
    bugs = [];
    bullets = [];
    score = 0;
    time = 0;
    level = 1;
    bossDefeated = false;
    scoreAtBossDefeat = 0;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height / 2 - 25;
    player.width = 50;
    player.height = 50;
    player.transformed = false;
    player.invulnerable = false;
    player.invulnerableTimer = 0;
    currentLabubuImage = labubuImage;
    gameInterval = setInterval(update, 1000 / 60);
    currentBugInterval = initialBugInterval;
    clearInterval(bugInterval);
    bugInterval = setInterval(createBug, currentBugInterval);
    setInterval(() => time++, 1000);
    boss = null;
    bossHealth = 500;
    difficulty = 0.7;
    windos = null;
    changeBackground();
}

function changeBackground() {
    if (score <= 200) {
        document.body.style.backgroundImage = `url('${fondos[0]}')`;
    } else if (score > 200 && score <= 400) {
        document.body.style.backgroundImage = `url('${fondos[1]}')`;
    } else if (score > 400 && boss === null && (score - scoreAtBossDefeat) >= 400) {
        document.body.style.backgroundImage = `url('${fondos[2]}')`;
        createBoss();
    }
}

restartButton.addEventListener('click', restartGame);

function startGame() {
    gameInterval = setInterval(update, 1000 / 60);
    currentBugInterval = initialBugInterval;
    bugInterval = setInterval(createBug, currentBugInterval);
    setInterval(() => time++, 1000);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

startGame();

window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - 25;
    player.y = canvas.height / 2 - 25;
});