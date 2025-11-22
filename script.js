const SOUND_PATHS = {
  shoot: "StarBlaze Assets/Audio Assets/Sound FX/Shoot.mp3",
  move:  "StarBlaze Assets/Audio Assets/Sound FX/Tap.mp3",
  hit:   "StarBlaze Assets/Audio Assets/Sound FX/Hit.mp3",
  gameOver: "StarBlaze Assets/Audio Assets/Sound FX/Game_Over.mp3",
  bgMusic: "StarBlaze Assets/Audio Assets/Tracks/StarBlaze Score Composition .wav"
};

// ----------------- SOUND OBJECTS -----------------
const shootSound = new Audio(SOUND_PATHS.shoot);
const moveSound  = new Audio(SOUND_PATHS.move);
const hitSound   = new Audio(SOUND_PATHS.hit);
const gameOverSound = new Audio(SOUND_PATHS.gameOver);

// volumes (tweak)
shootSound.volume = 0.5;
moveSound.volume = 0.25;
hitSound.volume = 0.7;
gameOverSound.volume = 0.8;

// ----------------- DOM & CANVAS -----------------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
const gameWrapper = document.getElementById("gameWrapper");
const player = document.getElementById("player");
const alien = document.getElementById("alien");

const resultPanel = document.getElementById("result");
const resultScore = document.getElementById("score");
const liveScore = document.getElementById("liveScore");

const countdownScreen = document.getElementById("countdownScreen");
const countdownText = document.getElementById("countdownText");

const leftBtn  = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const shootBtn = document.getElementById("shootBtn");
const pauseBtn = document.getElementById("pauseBtn");
const playBtn  = document.getElementById("playBtn");

let bgMusic = document.getElementById("bgMusic");
if (!bgMusic) {
  bgMusic = document.createElement("audio");
  bgMusic.id = "bgMusic";
  bgMusic.src = SOUND_PATHS.bgMusic;
  bgMusic.loop = true;
  document.body.appendChild(bgMusic);
}
bgMusic.volume = 0.45;

// ----------------- BACKGROUND SCROLL -----------------
const bg = new Image();
bg.src = "field.png";
let bgY = 0;
let bgSpeed = 7;
function animateBackground(){
  if (!ctx) return;
  bgY += bgSpeed;
  if (bgY >= canvas.height) bgY = 0;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(bg,0,bgY,canvas.width,canvas.height);
  ctx.drawImage(bg,0,bgY-canvas.height,canvas.width,canvas.height);
  requestAnimationFrame(animateBackground);
}
bg.onload = () => animateBackground();

// ----------------- STATE -----------------
let isGameOver = false;
let gameStarted = false;
let paused = false;
let score = 0;
let alienHidden = false;
let alienFallInterval = null;
let alienMoveInterval = null;

let moveLeft = false;
let moveRight = false;

// ----------------- helpers -----------------
function getNumStyle(el, prop, fallback=0){
  if (!el) return fallback;
  const v = window.getComputedStyle(el).getPropertyValue(prop);
  return parseInt(v) || fallback;
}

// ----------------- reset & spawn -----------------
function resetAlien(){
  if (!alien) return;
  alien.style.top = "0px";
  const maxLeft = Math.max((gameWrapper.clientWidth || 390) - (alien.clientWidth || 100), 0);
  alien.style.left = Math.floor(Math.random() * (maxLeft + 1)) + "px";
  alien.style.display = "block";
  alienHidden = false;
}

function resetGame(){
  isGameOver = false;
  paused = false;
  score = 0;
  if (liveScore) liveScore.innerText = score;
  if (resultPanel) resultPanel.style.display = "none";
  if (player) player.style.left = ((gameWrapper.clientWidth||390)/2 - (player.clientWidth||130)/2) + "px";
  resetAlien();
}

// ----------------- music utils -----------------
function playBgMusic(){ try{ bgMusic.currentTime = 0; bgMusic.play(); }catch(e){} }
function stopBgMusic(){ try{ bgMusic.pause(); bgMusic.currentTime = 0; }catch(e){} }

// ----------------- game over -----------------
function gameOver(){
  if (isGameOver) return;
  isGameOver = true;
  paused = true;
  clearInterval(alienFallInterval);
  clearInterval(alienMoveInterval);
  stopBgMusic();
  try{ gameOverSound.currentTime = 0; gameOverSound.play(); }catch(e){}
  if (resultPanel) resultPanel.style.display = "block";
  if (resultScore) resultScore.innerText = `score: ${score}`;
}

// ----------------- start game -----------------
function startGame(){
  resetGame();
  gameStarted = true;
  paused = false;
  playBgMusic();
  clearInterval(alienFallInterval);
  clearInterval(alienMoveInterval);

  alienFallInterval = setInterval(()=>{
    if (paused || isGameOver || alienHidden) return;
    const top = getNumStyle(alien,"top",0);
    // change speed here by increasing +4 -> +N
    alien.style.top = (top + 6) + "px"; // faster default (you can tweak)
    const gameOverThreshold = (gameWrapper.clientHeight || 600) - 200;
    if (top > gameOverThreshold && !isGameOver) gameOver();
  }, 28);

  alienMoveInterval = setInterval(()=>{
    if (paused || isGameOver || alienHidden) return;
    const maxLeft = Math.max((gameWrapper.clientWidth || 390) - (alien.clientWidth || 100), 0);
    alien.style.left = Math.floor(Math.random() * (maxLeft + 1)) + "px";
  }, 900);
}

// ----------------- countdown -----------------
function startCountdown(seconds=3){
  if (!countdownScreen || !countdownText){ startGame(); return; }
  countdownScreen.style.display = "flex";
  let c = seconds;
  countdownText.innerText = c;
  stopBgMusic();
  const id = setInterval(()=>{
    c--;
    if (c > 0) countdownText.innerText = c;
    else if (c === 0) countdownText.innerText = "START!";
    else {
      clearInterval(id);
      countdownScreen.style.display = "none";
      startGame();
    }
  },1000);
}

// ----------------- spawn bullet (dynamic) -----------------
function spawnBullet(){
  if (!gameStarted || paused || isGameOver || !player) return;
  // create bullet
  const canon = document.createElement("div");
  canon.className = "bullet";
  canon.style.position = "absolute";
  canon.style.zIndex = 60;
  // image
  const img = document.createElement("img");
  img.src = "StarBlaze Assets/Visual Assets/Player Assets/lazer.png";
  img.className = "bulletImg";
  img.style.width = "40px"; img.style.height = "20px";
  canon.appendChild(img);
  // position above player
  const pRect = player.getBoundingClientRect();
  const gRect = gameWrapper.getBoundingClientRect();
  const left = (pRect.left - gRect.left) + ((player.clientWidth||130)/2) - 20;
  const top  = (pRect.top - gRect.top) - 10;
  canon.style.left = left + "px";
  canon.style.top = top + "px";
  gameWrapper.appendChild(canon);
  // sound
  try{ shootSound.currentTime = 0; shootSound.play(); }catch(e){}
  // move bullet
  const id = setInterval(()=>{
    if (paused || isGameOver) return;
    const bTop = getNumStyle(canon,"top",0);
    canon.style.top = (bTop - 12) + "px";
    if (bTop < -40){ clearInterval(id); canon.remove(); return; }
    // collision with alien
    const aTop = getNumStyle(alien,"top",0);
    const aLeft = getNumStyle(alien,"left",0);
    const aW = alien.clientWidth || 100;
    const aH = alien.clientHeight || 80;
    const bLeft = getNumStyle(canon,"left",0);
    const bW = canon.clientWidth || 40;
    const bH = canon.clientHeight || 20;
    if (!(bLeft + bW < aLeft || bLeft > aLeft + aW || bTop + bH < aTop || bTop > aTop + aH)){
      // hit
      try{ hitSound.currentTime = 0; hitSound.play(); }catch(e){}
      clearInterval(id);
      canon.remove();
      alienHidden = true;
      alien.style.display = "none";
      score++;
      if (liveScore) liveScore.innerText = score;
      setTimeout(resetAlien, 300);
    }
  },20);
}

// ----------------- button & keyboard hooks -----------------
if (leftBtn){
  leftBtn.addEventListener("touchstart",(e)=>{ e.preventDefault(); moveLeft=true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} },{passive:false});
  leftBtn.addEventListener("touchend",()=>{ moveLeft=false },{passive:false});
  leftBtn.addEventListener("mousedown", ()=>{ moveLeft=true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} });
  leftBtn.addEventListener("mouseup", ()=> moveLeft=false);
}
if (rightBtn){
  rightBtn.addEventListener("touchstart",(e)=>{ e.preventDefault(); moveRight=true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} },{passive:false});
  rightBtn.addEventListener("touchend",()=>{ moveRight=false },{passive:false});
  rightBtn.addEventListener("mousedown", ()=>{ moveRight=true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} });
  rightBtn.addEventListener("mouseup", ()=> moveRight=false);
}
if (shootBtn){
  shootBtn.addEventListener("touchstart",(e)=>{ e.preventDefault(); spawnBullet(); },{passive:false});
  shootBtn.addEventListener("mousedown", ()=> spawnBullet());
}
if (pauseBtn){
  pauseBtn.addEventListener("click", ()=>{
    if (!gameStarted || isGameOver) return;
    paused = true; stopBgMusic(); pauseBtn.style.opacity = 0.5; playBtn && (playBtn.style.opacity = 1);
  });
}
if (playBtn){
  playBtn.addEventListener("click", ()=>{
    if (!gameStarted || isGameOver) return;
    paused = false; playBgMusic(); playBtn.style.opacity = 0.5; pauseBtn && (pauseBtn.style.opacity = 1);
  });
}

document.addEventListener("keydown",(e)=>{
  if (e.code === "ArrowLeft") { moveLeft = true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} }
  if (e.code === "ArrowRight") { moveRight = true; try{ moveSound.currentTime=0; moveSound.play(); }catch(e){} }
  if (e.code === "Space") spawnBullet();
  if (e.code === "KeyP") {
    if (!gameStarted || isGameOver) return;
    paused = !paused;
    if (paused) stopBgMusic(); else playBgMusic();
  }
});
document.addEventListener("keyup",(e)=>{
  if (e.code === "ArrowLeft") moveLeft = false;
  if (e.code === "ArrowRight") moveRight = false;
});

// continuous player movement (hold)
setInterval(()=>{
  if (!gameStarted || paused || isGameOver) return;
  const left = getNumStyle(player,"left",0);
  const wrapper = gameWrapper.clientWidth || 390;
  const pW = player.clientWidth || 130;
  if (moveLeft && left > 5) player.style.left = Math.max(0,left - 12) + "px";
  if (moveRight && left < wrapper - pW - 5) player.style.left = Math.min(wrapper - pW, left + 12) + "px";
},25);

// init
window.addEventListener("load", ()=>{
  if (liveScore) liveScore.innerText = score;
  resetGame();
  startCountdown(3);
});
