/* ICON MATCHER - 1P / 2P */

/* This file contains the updated game logic:
   - Switchable 1P / 2P
   - Alternating turns
   - Points awarded to current player
   - Winner shown at the end of 2P games
*/

const iconPatterns = {
  heart:["01100110","11111111","11111111","01111110","00111100","00011000"],
  shield:["01111110","11111111","11111111","01111110","00111100","00011000"],
  star:["001100","101101","011110","111111","011110","110011"],
  grid:["111111","100001","101101","101101","100001","111111"],
  circle:["001100","010010","100001","100001","010010","001100"],
  bolt:["00110","01100","11110","00110","01100","11000"],
  arrow:["001000","011000","111111","011000","001100","000110"],
  diamond:["001100","011110","111111","111111","011110","001100"],
  crown:["10001","11011","11111","10101","11111","11111"],
  wave:["100001","110011","011110","001100","011110","110011"]
};

const iconNames=Object.keys(iconPatterns);

let board=[],flippedCards=[],matchedPairs=0,moves=0,isLock=false;
let playerMode=1,activePlayer=1;
let scores={1:0,2:0};

const boardEl=document.getElementById("game-board");
const moveEl=document.getElementById("move-count");
const bestEl=document.getElementById("best-score");
const gridSelect=document.getElementById("grid-select");
const resetBtn=document.getElementById("reset-btn");
const onePlayerBtn=document.getElementById("one-player");
const twoPlayerBtn=document.getElementById("two-player");
const p1Panel=document.getElementById("player-one-score");
const p2Panel=document.getElementById("player-two-score");
const p1ScoreEl=document.getElementById("p1-score");
const p2ScoreEl=document.getElementById("p2-score");
const victoryOverlay=document.getElementById("victory-overlay");
const victoryMoves=document.getElementById("victory-moves");
const victoryBest=document.getElementById("victory-best-score");
const playAgainBtn=document.getElementById("play-again-btn");

let victoryTitle=document.getElementById("victory-title");
if(!victoryTitle&&victoryOverlay){
  victoryTitle=document.createElement("div");
  victoryTitle.id="victory-title";
  victoryTitle.className="victory-title";
  victoryOverlay.prepend(victoryTitle);
}

let finalScore=document.getElementById("victory-player-score");
if(!finalScore&&victoryOverlay){
  finalScore=document.createElement("div");
  finalScore.id="victory-player-score";
  finalScore.className="victory-player-score";
  finalScore.hidden=true;
  victoryOverlay.prepend(finalScore);
}

function shuffle(a){
  const c=[...a];
  for(let i=c.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [c[i],c[j]]=[c[j],c[i]];
  }
  return c;
}

function createDotIcon(pattern){
  const icon=document.createElement("span");
  icon.className="dot-icon";
  icon.style.gridTemplateColumns=`repeat(${pattern[0].length},var(--dot))`;
  pattern.forEach(row=>[...row].forEach(v=>{
    const dot=document.createElement("span");
    dot.className="dot";
    if(v==="0")dot.style.visibility="hidden";
    icon.appendChild(dot);
  }));
  return icon;
}

function createQuestionMark(){
  return createDotIcon(["01110","10001","00010","00100","00000","00100"]);
}

function setDotText(el,value){
  if(el)el.textContent=String(value);
}

function initGame(){
  if(!gridSelect||!boardEl)return;

  const [rows,cols]=gridSelect.value.split("x").map(Number);
  document.documentElement.style.setProperty("--cols",cols);
  document.documentElement.style.setProperty("--rows",rows);

  const pairs=(rows*cols)/2;
  const selected=iconNames.slice(0,pairs);

  board=shuffle([...selected,...selected]);
  boardEl.innerHTML="";
  flippedCards=[];
  matchedPairs=0;
  moves=0;
  isLock=false;
  activePlayer=1;
  scores={1:0,2:0};

  updateMoveDisplay();
  updateScoreDisplay();
  updatePlayerPanels();
  hideVictory();

  const best=localStorage.getItem(`best_${gridSelect.value}`);
  bestEl.textContent=best||"-";

  board.forEach((symbol,index)=>boardEl.appendChild(createCard(symbol,index)));
}

function createCard(symbol,index){
  const card=document.createElement("button");
  card.type="button";
  card.className="card";
  card.dataset.symbol=symbol;
  card.dataset.index=index;
  card.setAttribute("aria-label","Hidden memory card");

  const inner=document.createElement("span");
  inner.className="card-inner";

  const back=document.createElement("span");
  back.className="card-face card-back";
  back.appendChild(createQuestionMark());

  const front=document.createElement("span");
  front.className="card-face card-front";
  front.appendChild(createDotIcon(iconPatterns[symbol]));

  inner.append(back,front);
  card.appendChild(inner);
  card.addEventListener("click",handleCardClick);
  return card;
}

function handleCardClick(e){
  const card=e.currentTarget;
  if(isLock||card.classList.contains("flipped")||card.classList.contains("matched"))return;
  if(flippedCards.length>=2)return;

  card.classList.add("flipped");
  card.setAttribute("aria-label","Revealed memory card");
  flippedCards.push(card);

  if(flippedCards.length===2){
    moves++;
    updateMoveDisplay();
    checkMatch();
  }
}

function checkMatch(){
  const [a,b]=flippedCards;
  if(!a||!b)return;

  if(a.dataset.symbol===b.dataset.symbol){
    a.classList.add("matched");
    b.classList.add("matched");
    matchedPairs++;
    scores[activePlayer]++;
    updateScoreDisplay();
    flippedCards=[];
    isLock=false;

    const [rows,cols]=gridSelect.value.split("x").map(Number);
    if(matchedPairs===(rows*cols)/2){
      updateBestScore(gridSelect.value,moves);
      setTimeout(showVictory,500);
      return;
    }

    if(playerMode===2)switchPlayer();
    return;
  }

  isLock=true;
  a.classList.add("match-error");
  b.classList.add("match-error");

  setTimeout(()=>{
    a.classList.remove("flipped","match-error");
    b.classList.remove("flipped","match-error");
    a.setAttribute("aria-label","Hidden memory card");
    b.setAttribute("aria-label","Hidden memory card");
    flippedCards=[];
    isLock=false;
    if(playerMode===2)switchPlayer();
  },760);
}

function switchPlayer(){
  if(playerMode!==2)return;
  activePlayer=activePlayer===1?2:1;
  updatePlayerPanels();
}

function updatePlayerPanels(){
  if(!p1Panel||!p2Panel)return;
  p1Panel.classList.toggle("active",playerMode===1||activePlayer===1);
  p2Panel.classList.toggle("active",playerMode===2&&activePlayer===2);
  setDotText(p1ScoreEl,scores[1]);
  setDotText(p2ScoreEl,scores[2]);
}

function updateScoreDisplay(){
  setDotText(p1ScoreEl,scores[1]);
  setDotText(p2ScoreEl,scores[2]);
  updatePlayerPanels();
}

function updateMoveDisplay(){
  if(moveEl)moveEl.textContent=String(moves);
}

function updateBestScore(key,current){
  const old=localStorage.getItem(`best_${key}`);
  if(!old||current<Number(old)){
    localStorage.setItem(`best_${key}`,current);
    if(bestEl)bestEl.textContent=String(current);
  }
}

function setPlayerMode(mode){
  playerMode=mode===2?2:1;
  activePlayer=1;

  if(onePlayerBtn){
    onePlayerBtn.classList.toggle("active",playerMode===1);
    onePlayerBtn.setAttribute("aria-pressed",String(playerMode===1));
  }

  if(twoPlayerBtn){
    twoPlayerBtn.classList.toggle("active",playerMode===2);
    twoPlayerBtn.setAttribute("aria-pressed",String(playerMode===2));
  }

  updatePlayerPanels();
}

if(onePlayerBtn)onePlayerBtn.addEventListener("click",()=>{
  setPlayerMode(1);
  initGame();
});

if(twoPlayerBtn)twoPlayerBtn.addEventListener("click",()=>{
  setPlayerMode(2);
  initGame();
});

if(gridSelect)gridSelect.addEventListener("change",initGame);
if(resetBtn)resetBtn.addEventListener("click",initGame);

function showVictory(){
  if(!victoryOverlay)return;

  if(playerMode===1){
    if(victoryTitle)victoryTitle.textContent="GAME COMPLETE!";
    if(finalScore)finalScore.hidden=true;
  }else{
    if(scores[1]>scores[2])victoryTitle.textContent="PLAYER 1 WINS!";
    else if(scores[2]>scores[1])victoryTitle.textContent="PLAYER 2 WINS!";
    else victoryTitle.textContent="DRAW!";

    if(finalScore){
      finalScore.textContent=`P1 ${scores[1]}  •  P2 ${scores[2]}`;
      finalScore.hidden=false;
    }
  }

  if(victoryMoves)victoryMoves.textContent=String(moves);
  if(victoryBest)victoryBest.textContent=bestEl?bestEl.textContent:"-";
  victoryOverlay.hidden=false;
}

function hideVictory(){
  if(victoryOverlay)victoryOverlay.hidden=true;
}

if(playAgainBtn)playAgainBtn.addEventListener("click",initGame);

setPlayerMode(1);
initGame();
