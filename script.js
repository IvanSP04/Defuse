let correctCable;
let time = 10;
let timerInterval;
let gameOver = false;
let round = 1;
let maxRounds = 6;
let score = 0;
let baseTime = 10;
let hintsLeft = 1;
let previousCuts = [];
let previousCorrects = [];
let multiplier = 1;
let currentPuzzle = null;

const HINT_COST = 5;
const TIME_COST = 3;

const COLORS = ['Rojo','Azul','Verde'];

function startGame(){
  round = 1;
  score = 0;
  previousCuts = [];
  previousCorrects = [];
  multiplier = 1;
  document.getElementById('score').innerText = 'Puntos: ' + score;
  document.getElementById('mult').innerText = 'Multiplicador: x' + multiplier;
  document.getElementById('result').classList.add('hidden');
  document.getElementById('reset').classList.add('hidden');
  startRound();
}

function startRound(){
  gameOver = false;
  hintsLeft = 1;
  document.getElementById('hint').disabled = false;
  // Mostrar regla acumulativa fija en la UI
  const ruleEl = document.getElementById('rule');
  if(ruleEl) ruleEl.innerText = 'Regla: el cable correcto no se repite';

  const puzzle = generatePuzzle();
  currentPuzzle = puzzle;
  document.getElementById('puzzle').innerText = puzzle.prompt;

  correctCable = resolveCorrectFromPuzzle(puzzle);
  correctCable = applyMemoryRules(correctCable);

  // show legend/choices next to each cable
  const choices = puzzle.legend || [];
  for(let i=0;i<3;i++){
    const el = document.getElementById('choice-'+i);
    if(el){
      if(choices[i]){ el.innerText = choices[i]; el.style.display='none'; }
      else { el.innerText = ''; el.style.display='none'; }
    }
  }

  time = Math.max(4, baseTime - Math.floor((round-1)/2));
  document.getElementById('timer').innerText = time;
  document.getElementById('result').classList.add('hidden');
  document.getElementById('reset').classList.add('hidden');
  document.getElementById('cables').classList.remove('hidden');
  enableAllCables();
  document.getElementById('round').innerText = `Ronda: ${round}/${maxRounds}`;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    time--;
    document.getElementById('timer').innerText = time;
    if(time <= 0){
      loseGame('⏱️ Tiempo agotado. La bomba explotó 💥');
    }
  }, 1000);
}

function generatePuzzle(){
  // Puzzles simples, sin matemáticas
  const types = ['letters','most_common','initial','partial'];
  const t = types[Math.floor(Math.random()*types.length)];

  if(t === 'letters'){
    const prompt = 'Corta el cable del color que tiene más letras.';
    const lengths = COLORS.map(c => c.length);
    return {
      type:'letters',
      prompt,
      resolver: ()=>{ const max = Math.max(...lengths); return lengths.indexOf(max); },
      legend: [`Rojo: ${lengths[0]} letras`,`Azul: ${lengths[1]} letras`,`Verde: ${lengths[2]} letras`]
    };
  }

  if(t === 'most_common'){
    const sample = [];
    for(let i=0;i<5;i++) sample.push(COLORS[Math.floor(Math.random()*3)]);
    sample[0] = sample[1]; // asegurar repetición
    const prompt = `Observa: ${sample.join(', ')}. ¿Qué color aparece más veces?`;
    const counts = [0,0,0];
    sample.forEach(s=>{ const idx = COLORS.indexOf(s); if(idx>=0) counts[idx]++; });
    const idxMax = counts.indexOf(Math.max(...counts));
    return {
      type:'most_common',
      prompt,
      resolver: ()=>idxMax,
      legend: [`Frecuencias: Rojo ${counts[0]}, Azul ${counts[1]}, Verde ${counts[2]}`]
    };
  }

  if(t === 'initial'){
    const options = [
      {text:'Elige el color que empieza por A.', test:(s)=>s.startsWith('A')},
      {text:'Elige el color que empieza por V.', test:(s)=>s.startsWith('V')},
      {text:'Elige el color que termina en "o".', test:(s)=>s.endsWith('o')}
    ];
    const pick = options[Math.floor(Math.random()*options.length)];
    const prompt = pick.text;
    return {
      type:'initial',
      prompt,
      resolver: ()=>{ for(let i=0;i<COLORS.length;i++) if(pick.test(COLORS[i])) return i; return 0; },
      legend: ['Rojo','Azul','Verde']
    };
  }

  // partial
  const hints = [
    {text:'No es azul.', resolver: ()=> Math.random()>0.5?0:2},
    {text:'Tiene menos letras que Verde.', resolver: ()=>{ const len = COLORS.map(c=>c.length); for(let i=0;i<3;i++) if(len[i]<len[2]) return i; return 0; }},
    {text:'Es un color primario (Rojo o Azul).', resolver: ()=> Math.random()>0.5?0:1}
  ];
  const pick = hints[Math.floor(Math.random()*hints.length)];
  return {type:'partial', prompt: pick.text, resolver: pick.resolver, legend:['Rojo','Azul','Verde']};
}

function resolveCorrectFromPuzzle(p){
  if(p && p.resolver) return p.resolver(p);
  return Math.floor(Math.random()*3);
}

function applyMemoryRules(candidate){
  if(previousCorrects.length>0 && candidate === previousCorrects[previousCorrects.length-1]){
    candidate = (candidate+1)%3;
  }
  for(const cut of previousCuts){
    if(candidate === cut){
      for(let i=0;i<3;i++){
        if(i!==candidate && !previousCuts.includes(i) && (previousCorrects.filter(x=>x===i).length<2)){
          candidate = i; break;
        }
      }
    }
  }
  if(previousCorrects.filter(x=>x===1).length>=2 && candidate===1){
    candidate = (candidate+1)%3;
  }
  previousCorrects.push(candidate);
  if(previousCorrects.length>10) previousCorrects.shift();
  return candidate;
}

function cutCable(index){
  if(gameOver) return;
  disableAllCables();
  previousCuts.push(index);
  if(previousCuts.length>10) previousCuts.shift();

  if(index === correctCable){
    winRound();
  } else {
    loseGame('❌ Cable incorrecto. La bomba explotó 💥');
  }
}

function winRound(){
  clearInterval(timerInterval);
  gameOver = true;
  const gained = Math.round(10 * round * multiplier);
  score += gained;
  document.getElementById('score').innerText = 'Puntos: ' + score;
  document.getElementById('result').innerText = `✅ ¡Ronda ${round} completada! +${gained} puntos`;
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('cables').classList.add('hidden');

  if(round >= maxRounds){
    setTimeout(() => {
      document.getElementById('result').innerText = `🏆 ¡Juego completado! Puntos finales: ${score}`;
      document.getElementById('reset').classList.remove('hidden');
    }, 800);
  } else {
    round++;
    multiplier = 1;
    document.getElementById('mult').innerText = 'Multiplicador: x' + multiplier;
    setTimeout(() => startRound(), 900);
  }
}

function loseGame(msg){
  gameOver = true;
  clearInterval(timerInterval);
  document.getElementById('result').innerText = msg + ` Puntos: ${score}`;
  document.getElementById('result').classList.remove('hidden');
  document.getElementById('cables').classList.add('hidden');
  document.getElementById('reset').classList.remove('hidden');
}

function useHint(){
  if(gameOver) return;
  // pista gratuita: mostrar leyendas debajo de los cables
  document.getElementById('score').innerText = 'Puntos: ' + score;
  let extra = '';
  if(currentPuzzle && currentPuzzle.type === 'letters'){
    const lengths = COLORS.map(c=>c.length);
    extra = `Cuenta letras: Rojo ${lengths[0]}, Azul ${lengths[1]}, Verde ${lengths[2]}`;
  } else if(currentPuzzle && currentPuzzle.type === 'most_common'){
    extra = (currentPuzzle.legend && currentPuzzle.legend[0]) || 'Observa qué color aparece más veces en la muestra.';
  } else if(currentPuzzle && currentPuzzle.type === 'initial'){
    extra = 'Fíjate en la primera letra de cada color: R, A, V.';
  } else if(currentPuzzle && currentPuzzle.type === 'partial'){
    extra = `Pista: ${currentPuzzle.prompt}`;
  } else {
    extra = 'Pista: fíjate bien en las palabras del enunciado.';
  }
  showMessage(extra,4000);
  multiplier = 0.75;
  document.getElementById('mult').innerText = 'Multiplicador: x' + multiplier;
  // reveal per-cable choice texts
  const choices = currentPuzzle && currentPuzzle.legend ? currentPuzzle.legend : [];
  for(let i=0;i<3;i++){
    const el = document.getElementById('choice-'+i);
    if(el && choices[i]) el.style.display = 'block';
  }
}

function buyTime(){
  if(gameOver) return;
  if(score < TIME_COST){ showMessage('No tienes suficientes puntos para comprar tiempo.',3000); return; }
  score -= TIME_COST;
  time += 3;
  document.getElementById('score').innerText = 'Puntos: ' + score;
  document.getElementById('timer').innerText = time;
  multiplier = Math.max(0.5, multiplier - 0.2);
  document.getElementById('mult').innerText = 'Multiplicador: x' + multiplier;
}

function disableAllCables(){
  const cables = document.getElementsByClassName('cable');
  for(const c of cables){ c.disabled = true; }
}

function enableAllCables(){
  const cables = document.getElementsByClassName('cable');
  for(const c of cables){ c.disabled = false; c.classList.remove('disabled'); }
}

function showMessage(text, timeout=3000){
  const m = document.getElementById('message');
  if(!m) return;
  m.innerText = text;
  m.classList.remove('hidden');
  setTimeout(()=>{ m.classList.add('hidden'); }, timeout);
}

document.getElementById('reset').addEventListener('click', () => startGame());
startGame();
