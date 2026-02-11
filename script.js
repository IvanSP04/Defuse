let correctCable;
let time = 10;
let timerInterval;
let gameOver = false;

function startGame(){
  correctCable = Math.floor(Math.random()*3);
  time = 10;
  gameOver = false;

  document.getElementById("timer").innerText = time;
  document.getElementById("result").classList.add("hidden");
  document.getElementById("reset").classList.add("hidden");
  document.getElementById("cables").classList.remove("hidden");

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    time--;
    document.getElementById("timer").innerText = time;

    if(time <= 0){
      loseGame("⏱️ Tiempo agotado. La bomba explotó 💥");
    }
  },1000);
}

function cutCable(index){
  if(gameOver) return;

  if(index === correctCable){
    winGame();
  } else {
    loseGame("❌ Cable incorrecto. La bomba explotó 💥");
  }
}

function winGame(){
  gameOver = true;
  clearInterval(timerInterval);
  document.getElementById("result").innerText = "✅ ¡Bomba desactivada! Ganaste 😎";
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("cables").classList.add("hidden");
  document.getElementById("reset").classList.remove("hidden");
}

function loseGame(msg){
  gameOver = true;
  clearInterval(timerInterval);
  document.getElementById("result").innerText = msg;
  document.getElementById("result").classList.remove("hidden");
  document.getElementById("cables").classList.add("hidden");
  document.getElementById("reset").classList.remove("hidden");
}

startGame();
