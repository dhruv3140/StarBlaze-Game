// Select DOM elements
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const finalScoreElement = document.getElementById("finalScore");
const gameOverElement = document.getElementById("gameOver");
const playButton = document.getElementById("playButton");

// Load audio files
const shootSound = new Audio("assets/shoot.mp3");
const moveSound = new Audio("assets/move.mp3");
const hitSound = new Audio("assets/hit.mp3");
const bgMusic = new Audio("assets/bg.mp3");
const gameOverSound = new Audio("assets/gameover.mp3");

// Loop the background music
bgMusic.loop = true;

// Balance audio volumes
bgMusic.volume = 0.6;
gameOverSound.volume = 0.5;
shootSound.volume = 0.25;
moveSound.volume = 0.15;
hitSound.volume = 0.35;

// Player spaceship
const player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100,
  width: 40,
  height: 60,
  speed: 4,
};

// Player bullets
const bullets = [];

// Enemies
const enemies = [];
const enemySpeed = 1;

// Score
let score = 0;
let gameRunning = true;

// Load images
const playerImg = new Image();
playerImg.src = "assets/player.png";

const alienImg = new Image();
alienImg.src = "assets/alien.png";

// Spawn enemies
function spawnEnemies(num) {
  for (let i = 0; i < num; i++) {
    enemies.push({
      x: Math.random() * (canvas.width - 50),
      y: Math.random() * -canvas.height,
      width: 50,
      height: 50,
    });
  }
}
spawnEnemies(7);

// CONTROLS
let keys = {};

document.addEventListener("keydown", (event) => {
  keys[event.code] = true;
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// Shoot bullet
function shoot() {
  bullets.push({
    x: player.x + player.width / 2 - 3,
    y: player.y,
    width: 6,
    height: 15,
    speed: 5,
  });
  shootSound.currentTime = 0;
  shootSound.play();
}

// Movement + shooting
function movePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) {
    player.x -= player.speed;
    moveSound.currentTime = 0;
    moveSound.play();
  }
  if (keys["ArrowRight"] && player.x + player.width < canvas.width) {
    player.x += player.speed;
    moveSound.currentTime = 0;
    moveSound.play();
  }
  if (keys["Space"]) {
    if (!keys["_shootLock"]) {
      shoot();
      keys["_shootLock"] = true;
    }
  } else {
    keys["_shootLock"] = false;
  }
}

// Collision detection
function isCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Update all game objects
function update() {
  if (!gameRunning) return;

  movePlayer();

  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.y -= bullet.speed;

    if (bullet.y < 0) bullets.splice(index, 1);

    // Check bullet collision with enemies
    enemies.forEach((enemy, enemyIndex) => {
      if (isCollision(bullet, enemy)) {
        hitSound.currentTime = 0;
        hitSound.play();

        bullets.splice(index, 1);
        enemies.splice(enemyIndex, 1);

        enemies.push({
          x: Math.random() * (canvas.width - 50),
          y: -50,
          width: 50,
          height: 50,
        });

        score += 10;
        scoreElement.textContent = score;
      }
    });
  });

  // Update enemies
  enemies.forEach((enemy) => {
    enemy.y += enemySpeed;

    // Enemy hits bottom → Game Over
    if (enemy.y > canvas.height - 100) {
      endGame();
    }
  });
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameRunning) return;

  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  bullets.forEach((bullet) => {
    ctx.fillStyle = "yellow";
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  enemies.forEach((enemy) => {
    ctx.drawImage(alienImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  requestAnimationFrame(gameLoop);
}

// Main game loop
function gameLoop() {
  update();
  draw();
}

// Game Over
function endGame() {
  gameRunning = false;

  bgMusic.pause();
  gameOverSound.currentTime = 0;
  gameOverSound.play();

  finalScoreElement.textContent = score;
  gameOverElement.style.display = "block";
}

// Restart
function restartGame() {
  enemies.length = 0;
  bullets.length = 0;

  spawnEnemies(7);
  score = 0;
  scoreElement.textContent = score;
  player.x = canvas.width / 2 - 20;

  gameRunning = true;

  bgMusic.currentTime = 0;
  bgMusic.play();

  gameOverElement.style.display = "none";

  gameLoop();
}

// PLAY BUTTON
playButton.addEventListener("click", () => {
  // Start background music (mobile-safe)
  bgMusic.currentTime = 0;
  bgMusic.play().catch(() => {});

  // Start game loop
  if (!gameRunning) {
    restartGame();
  } else {
    gameLoop();
  }

  // Hide play button after click
  playButton.style.display = "none";
});
