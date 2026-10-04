// Icon Matcher - Game Logic

const iconPatterns = {
  heart: [
    "0110110",
    "1111111",
    "1111111",
    "0111110",
    "0011100",
    "0001000"
  ],

  shield: [
    "0111110",
    "1111111",
    "1111111",
    "1111111",
    "0111110",
    "0011100",
    "0001000"
  ],

  star: [
    "0010000",
    "0010000",
    "1111111",
    "0111110",
    "0011100",
    "0101010",
    "1000001"
  ],

  grid: [
    "1111111",
    "1010101",
    "1111111",
    "1010101",
    "1111111",
    "1010101",
    "1111111"
  ],

  circle: [
    "0011100",
    "0111110",
    "1100011",
    "1100011",
    "1100011",
    "0111110",
    "0011100"
  ],

  bolt: [
    "0001100",
    "0011100",
    "0111000",
    "1111111",
    "0011100",
    "0011000",
    "0010000"
  ],

  arrow: [
    "0010000",
    "0011000",
    "0011100",
    "1111111",
    "0011100",
    "0011000",
    "0010000"
  ],

  diamond: [
    "0001000",
    "0011100",
    "0111110",
    "1111111",
    "0111110",
    "0011100",
    "0001000"
  ],

  crown: [
    "1000001",
    "1100011",
    "1110111",
    "1111111",
    "0111110",
    "0111110",
    "0111110"
  ],

  wave: [
    "1100000",
    "0110000",
    "0011000",
    "0001100",
    "0000110",
    "0000011",
    "0000001"
  ]
};

const patternNames = Object.keys(iconPatterns);

let currentGrid = "2x4";
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;
let currentPlayer = 1;
let gameMode = "1P";

const gameBoard = document.getElementById("game-board");
const movesElement = document.getElementById("moves");
const bestElement = document.getElementById("best");
const gridSelect = document.getElementById("grid-select");
const resetButton = document.getElementById("reset-button");

const player1Score = document.getElementById("player1-score");
const player2Score = document.getElementById("player2-score");
const player1Panel = document.getElementById("player1-panel");
const player2Panel = document.getElementById("player2-panel");

const player1Button = document.getElementById("player-1");
const player2Button = document.getElementById("player-2");

const victoryOverlay = document.getElementById("victory-overlay");
const victoryTitle = document.getElementById("victory-title");
const playAgainButton = document.getElementById("play-again");


// --------------------------------------------------
// Utility
// --------------------------------------------------

function shuffle(array) {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}


function getPairCount() {
  const parts = currentGrid.split("x");

  const rows = Number(parts[0]);
  const columns = Number(parts[1]);

  return (rows * columns) / 2;
}


function getGridClass() {
  return `grid-${currentGrid.replace("x", "-")}`;
}


// --------------------------------------------------
// Dot icons
// --------------------------------------------------

function createDotIcon(patternName, extraClass = "") {
  const pattern = iconPatterns[patternName];

  const icon = document.createElement("span");

  icon.className = `dot-icon ${extraClass}`;

  const columns = pattern[0].length;

  icon.style.gridTemplateColumns =
    `repeat(${columns}, var(--dot))`;

  pattern.forEach(row => {
    [...row].forEach(value => {
      const dot = document.createElement("span");

      dot.className = "dot";

      if (value === "0") {
        dot.style.visibility = "hidden";
      }

      icon.appendChild(dot);
    });
  });

  return icon;
}


function createQuestionMark() {
  const question = document.createElement("span");

  question.className = "question-mark";

  question.textContent = "?";

  return question;
}


// --------------------------------------------------
// Game initialization
// --------------------------------------------------

function initGame() {
  currentGrid = gridSelect.value;

  cards = [];
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  isLocked = false;
  currentPlayer = 1;

  gameBoard.innerHTML = "";

  gameBoard.className = `game-board ${getGridClass()}`;

  hideVictory();

  updateMoves();
  updatePlayerDisplay();

  const pairCount = getPairCount();

  const selectedPatterns = patternNames.slice(0, pairCount);

  const deck = [];

  selectedPatterns.forEach(patternName => {
    deck.push(patternName);
    deck.push(patternName);
  });

  const shuffledDeck = shuffle(deck);

  shuffledDeck.forEach((patternName, index) => {
    const card = createCard(patternName, index);

    cards.push(card);

    gameBoard.appendChild(card);
  });

  updateBestScore();
}


// --------------------------------------------------
// Card creation
// --------------------------------------------------

function createCard(patternName, index) {
  const card = document.createElement("button");

  card.type = "button";
  card.className = "card";
  card.dataset.index = index;
  card.dataset.icon = patternName;

  const inner = document.createElement("span");

  inner.className = "card-inner";

  const back = document.createElement("span");

  back.className = "card-face card-back";

  back.appendChild(createQuestionMark());

  const front = document.createElement("span");

  front.className = "card-face card-front";

  front.appendChild(createDotIcon(patternName));

  inner.appendChild(back);
  inner.appendChild(front);

  card.appendChild(inner);

  card.addEventListener("click", () => {
    handleCardClick(card);
  });

  return card;
}


// --------------------------------------------------
// Card interaction
// --------------------------------------------------

function handleCardClick(card) {
  if (isLocked) {
    return;
  }

  if (card.classList.contains("flipped")) {
    return;
  }

  if (card.classList.contains("matched")) {
    return;
  }

  if (flippedCards.length >= 2) {
    return;
  }

  card.classList.add("flipped");

  flippedCards.push(card);

  if (flippedCards.length === 2) {
    moves++;

    updateMoves();

    checkMatch();
  }
}


// --------------------------------------------------
// Matching
// --------------------------------------------------

function checkMatch() {
  const firstCard = flippedCards[0];
  const secondCard = flippedCards[1];

  const firstIcon = firstCard.dataset.icon;
  const secondIcon = secondCard.dataset.icon;

  isLocked = true;

  if (firstIcon === secondIcon) {
    setTimeout(() => {
      firstCard.classList.add("matched");
      secondCard.classList.add("matched");

      matchedPairs++;

      addPlayerPoint();

      flippedCards = [];

      isLocked = false;

      if (matchedPairs === getPairCount()) {
        finishGame();
      }
    }, 350);

  } else {
    firstCard.classList.add("wrong");
    secondCard.classList.add("wrong");

    setTimeout(() => {
      firstCard.classList.remove("flipped", "wrong");
      secondCard.classList.remove("flipped", "wrong");

      flippedCards = [];

      switchPlayer();

      isLocked = false;
    }, 850);
  }
}


// --------------------------------------------------
// Players
// --------------------------------------------------

function addPlayerPoint() {
  const scoreElement =
    currentPlayer === 1
      ? player1Score
      : player2Score;

  const currentScore =
    Number(scoreElement.dataset.score || 0) + 1;

  scoreElement.dataset.score = currentScore;

  setDotText(scoreElement, currentScore);
}


function switchPlayer() {
  if (gameMode !== "2P") {
    return;
  }

  currentPlayer = currentPlayer === 1 ? 2 : 1;

  updatePlayerDisplay();
}


function updatePlayerDisplay() {
  if (player1Panel) {
    player1Panel.classList.toggle(
      "active",
      currentPlayer === 1
    );
  }

  if (player2Panel) {
    player2Panel.classList.toggle(
      "active",
      currentPlayer === 2
    );
  }
}


// --------------------------------------------------
// Text / stats
// --------------------------------------------------

function setDotText(element, value) {
  if (!element) {
    return;
  }

  element.textContent = value;
  element.dataset.text = value;
}


function updateMoves() {
  if (!movesElement) {
    return;
  }

  setDotText(movesElement, moves);
}


function getBestKey() {
  return `icon-matcher-best-${currentGrid}`;
}


function updateBestScore() {
  if (!bestElement) {
    return;
  }

  const best = localStorage.getItem(getBestKey());

  if (best === null) {
    setDotText(bestElement, "--");
  } else {
    setDotText(bestElement, best);
  }
}


function saveBestScore() {
  const oldBest = localStorage.getItem(getBestKey());

  if (oldBest === null || moves < Number(oldBest)) {
    localStorage.setItem(getBestKey(), moves);

    updateBestScore();
  }
}


// --------------------------------------------------
// Victory
// --------------------------------------------------

function finishGame() {
  saveBestScore();

  setTimeout(() => {
    showVictory();
  }, 500);
}


function showVictory() {
  if (!victoryOverlay) {
    return;
  }

  if (victoryTitle) {
    if (gameMode === "2P") {
      const score1 =
        Number(player1Score?.dataset.score || 0);

      const score2 =
        Number(player2Score?.dataset.score || 0);

      if (score1 > score2) {
        victoryTitle.textContent = "P1 WINS";
      } else if (score2 > score1) {
        victoryTitle.textContent = "P2 WINS";
      } else {
        victoryTitle.textContent = "DRAW";
      }
    } else {
      victoryTitle.textContent = "COMPLETE";
    }
  }

  victoryOverlay.classList.add("show");
}


function hideVictory() {
  if (victoryOverlay) {
    victoryOverlay.classList.remove("show");
  }
}


// --------------------------------------------------
// Reset scores
// --------------------------------------------------

function resetPlayerScores() {
  if (player1Score) {
    player1Score.dataset.score = "0";
    setDotText(player1Score, "0");
  }

  if (player2Score) {
    player2Score.dataset.score = "0";
    setDotText(player2Score, "0");
  }
}


// --------------------------------------------------
// Mode buttons
// --------------------------------------------------

function setGameMode(mode) {
  gameMode = mode;

  if (player1Button) {
    player1Button.classList.toggle(
      "active",
      mode === "1P"
    );
  }

  if (player2Button) {
    player2Button.classList.toggle(
      "active",
      mode === "2P"
    );
  }

  resetPlayerScores();

  currentPlayer = 1;

  updatePlayerDisplay();

  initGame();
}


// --------------------------------------------------
// Event listeners
// --------------------------------------------------

if (gridSelect) {
  gridSelect.addEventListener("change", () => {
    initGame();
  });
}


if (resetButton) {
  resetButton.addEventListener("click", () => {
    resetPlayerScores();

    initGame();
  });
}


if (playAgainButton) {
  playAgainButton.addEventListener("click", () => {
    resetPlayerScores();

    initGame();
  });
}


if (player1Button) {
  player1Button.addEventListener("click", () => {
    setGameMode("1P");
  });
}


if (player2Button) {
  player2Button.addEventListener("click", () => {
    setGameMode("2P");
  });
}


// --------------------------------------------------
// Start game
// --------------------------------------------------

resetPlayerScores();

setGameMode("1P");
