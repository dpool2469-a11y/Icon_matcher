/* =========================================================
   ICON MATCHER
   Dot-matrix icons + 1P / 2P alternating turns
   ========================================================= */

const iconPatterns = {
  heart: [
    "01100110",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000"
  ],

  shield: [
    "01111110",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000"
  ],

  star: [
    "001100",
    "101101",
    "011110",
    "111111",
    "011110",
    "110011"
  ],

  grid: [
    "111111",
    "100001",
    "101101",
    "101101",
    "100001",
    "111111"
  ],

  circle: [
    "001100",
    "010010",
    "100001",
    "100001",
    "010010",
    "001100"
  ],

  bolt: [
    "00110",
    "01100",
    "11110",
    "00110",
    "01100",
    "11000"
  ],

  arrow: [
    "001000",
    "011000",
    "111111",
    "011000",
    "001100",
    "000110"
  ],

  diamond: [
    "001100",
    "011110",
    "111111",
    "111111",
    "011110",
    "001100"
  ],

  crown: [
    "10001",
    "11011",
    "11111",
    "10101",
    "11111",
    "11111"
  ],

  wave: [
    "100001",
    "110011",
    "011110",
    "001100",
    "011110",
    "110011"
  ]
};

const iconNames = Object.keys(iconPatterns);

/* =========================================================
   GAME STATE
   ========================================================= */

let board = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;

let isLock = false;

let playerMode = 1;
let activePlayer = 1;

let scores = {
  1: 0,
  2: 0
};

/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const boardEl = document.getElementById("game-board");
const moveEl = document.getElementById("move-count");
const bestEl = document.getElementById("best-score");

const gridSelect = document.getElementById("grid-select");
const resetBtn = document.getElementById("reset-btn");

const onePlayerBtn = document.getElementById("one-player");
const twoPlayerBtn = document.getElementById("two-player");

const p1Panel = document.getElementById("player-one-score");
const p2Panel = document.getElementById("player-two-score");

const p1ScoreEl = document.getElementById("p1-score");
const p2ScoreEl = document.getElementById("p2-score");

const victoryOverlay = document.getElementById("victory-overlay");
const victoryMoves = document.getElementById("victory-moves");
const victoryBest = document.getElementById("victory-best-score");

const playAgainBtn = document.getElementById("play-again-btn");

/* =========================================================
   SHUFFLE
   ========================================================= */

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* =========================================================
   DOT ICON CREATION
   ========================================================= */

function createDotIcon(pattern, extraClass = "") {
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

/* =========================================================
   QUESTION MARK
   ========================================================= */

function createQuestionMark() {
  const pattern = [
    "01110",
    "10001",
    "00010",
    "00100",
    "00000",
    "00100"
  ];

  return createDotIcon(pattern);
}

/* =========================================================
   DOT TEXT
   ========================================================= */

function setDotText(element, value) {
  if (!element) return;

  element.dataset.text = String(value);
  element.textContent = String(value);
}

/* =========================================================
   INITIALIZE GAME
   ========================================================= */

function initGame() {

  const gridValue = gridSelect.value;

  const [rows, cols] =
    gridValue.split("x").map(Number);

  document.documentElement.style.setProperty(
    "--cols",
    cols
  );

  document.documentElement.style.setProperty(
    "--rows",
    rows
  );

  const totalCards = rows * cols;
  const numberOfPairs = totalCards / 2;

  const selectedIcons =
    iconNames.slice(0, numberOfPairs);

  board = shuffle([
    ...selectedIcons,
    ...selectedIcons
  ]);

  boardEl.innerHTML = "";

  flippedCards = [];
  matchedPairs = 0;
  moves = 0;

  isLock = false;

  activePlayer = 1;

  scores = {
    1: 0,
    2: 0
  };

  updateMoveDisplay();
  updateScoreDisplay();
  updatePlayerPanels();

  hideVictory();

  const savedBest =
    localStorage.getItem(`best_${gridValue}`);

  if (savedBest) {
    bestEl.textContent = savedBest;
  } else {
    bestEl.textContent = "-";
  }

  board.forEach((symbol, index) => {

    const card =
      createCard(symbol, index);

    boardEl.appendChild(card);
  });
}

/* =========================================================
   CREATE CARD
   ========================================================= */

function createCard(symbol, index) {

  const card =
    document.createElement("button");

  card.type = "button";

  card.className = "card";

  card.dataset.symbol = symbol;
  card.dataset.index = index;

  card.setAttribute(
    "aria-label",
    "Hidden memory card"
  );

  const inner =
    document.createElement("span");

  inner.className = "card-inner";

  /* BACK */

  const back =
    document.createElement("span");

  back.className =
    "card-face card-back";

  back.appendChild(
    createQuestionMark()
  );

  /* FRONT */

  const front =
    document.createElement("span");

  front.className =
    "card-face card-front";

  front.appendChild(
    createDotIcon(
      iconPatterns[symbol]
    )
  );

  inner.appendChild(back);
  inner.appendChild(front);

  card.appendChild(inner);

  card.addEventListener(
    "click",
    handleCardClick
  );

  return card;
}

/* =========================================================
   CARD CLICK
   ========================================================= */

function handleCardClick(event) {

  const card =
    event.currentTarget;

  /*
   Do not allow another card while
   two cards are being checked.
  */

  if (isLock) {
    return;
  }

  if (
    card.classList.contains("flipped") ||
    card.classList.contains("matched")
  ) {
    return;
  }

  card.classList.add("flipped");

  card.setAttribute(
    "aria-label",
    "Revealed memory card"
  );

  flippedCards.push(card);

  /*
   Two cards selected:
   this is one complete turn.
  */

  if (flippedCards.length === 2) {

    moves++;

    updateMoveDisplay();

    checkMatch();
  }
}

/* =========================================================
   CHECK MATCH
   ========================================================= */

function checkMatch() {

  const card1 = flippedCards[0];
  const card2 = flippedCards[1];

  if (!card1 || !card2) {
    return;
  }

  const isMatch =
    card1.dataset.symbol ===
    card2.dataset.symbol;

  /*
   MATCH
  */

  if (isMatch) {

    card1.classList.add("matched");
    card2.classList.add("matched");

    matchedPairs++;

    /*
     Give the point to the player
     whose turn it currently is.
    */

    scores[activePlayer]++;

    updateScoreDisplay();

    flippedCards = [];

    /*
     IMPORTANT:
     Unlock immediately after a match.
     This prevents the game from stopping.
    */

    isLock = false;

    const gridValue =
      gridSelect.value;

    const [rows, cols] =
      gridValue.split("x").map(Number);

    const totalPairs =
      (rows * cols) / 2;

    /*
     Check if game is complete.
    */

    if (matchedPairs === totalPairs) {

      updateBestScore(
        gridValue,
        moves
      );

      setTimeout(() => {
        showVictory();
      }, 450);

      return;
    }

    /*
     2 PLAYER:
     A successful match still ends
     that player's turn.
    */

    if (playerMode === 2) {
      switchPlayer();
    }

    return;
  }

  /*
   WRONG MATCH
  */

  isLock = true;

  card1.classList.add(
    "match-error"
  );

  card2.classList.add(
    "match-error"
  );

  setTimeout(() => {

    card1.classList.remove(
      "flipped",
      "match-error"
    );

    card2.classList.remove(
      "flipped",
      "match-error"
    );

    card1.setAttribute(
      "aria-label",
      "Hidden memory card"
    );

    card2.setAttribute(
      "aria-label",
      "Hidden memory card"
    );

    flippedCards = [];

    /*
     Unlock before changing player.
    */

    isLock = false;

    /*
     Wrong pair also ends the turn.
    */

    if (playerMode === 2) {
      switchPlayer();
    }

  }, 760);
}

/* =========================================================
   SWITCH PLAYER
   ========================================================= */

function switchPlayer() {

  if (playerMode !== 2) {
    return;
  }

  if (activePlayer === 1) {
    activePlayer = 2;
  } else {
    activePlayer = 1;
  }

  updatePlayerPanels();
}

/* =========================================================
   PLAYER PANELS
   ========================================================= */

function updatePlayerPanels() {

  if (!p1Panel || !p2Panel) {
    return;
  }

  /*
   P1 active when it is P1's turn.
  */

  p1Panel.classList.toggle(
    "active",
    activePlayer === 1
  );

  /*
   P2 active only during 2P mode.
  */

  p2Panel.classList.toggle(
    "active",
    playerMode === 2 &&
    activePlayer === 2
  );

  /*
   In 1P mode P1 is always active.
  */

  if (playerMode === 1) {

    p1Panel.classList.add(
      "active"
    );

    p2Panel.classList.remove(
      "active"
    );
  }

  setDotText(
    p1ScoreEl,
    scores[1]
  );

  setDotText(
    p2ScoreEl,
    scores[2]
  );
}

/* =========================================================
   SCORE DISPLAY
   ========================================================= */

function updateScoreDisplay() {

  setDotText(
    p1ScoreEl,
    scores[1]
  );

  setDotText(
    p2ScoreEl,
    scores[2]
  );

  updatePlayerPanels();
}

/* =========================================================
   MOVE DISPLAY
   ========================================================= */

function updateMoveDisplay() {

  if (!moveEl) {
    return;
  }

  moveEl.textContent =
    String(moves);
}

/* =========================================================
   BEST SCORE
   ========================================================= */

function updateBestScore(
  gridKey,
  currentMoves
) {

  const oldBest =
    localStorage.getItem(
      `best_${gridKey}`
    );

  if (
    !oldBest ||
    currentMoves < Number(oldBest)
  ) {

    localStorage.setItem(
      `best_${gridKey}`,
      currentMoves
    );

    bestEl.textContent =
      String(currentMoves);
  }
}

/* =========================================================
   PLAYER MODE
   ========================================================= */

function setPlayerMode(mode) {

  playerMode = mode;

  /*
   Update buttons.
  */

  if (onePlayerBtn) {

    onePlayerBtn.classList.toggle(
      "active",
      mode === 1
    );

    onePlayerBtn.setAttribute(
      "aria-pressed",
      String(mode === 1)
    );
  }

  if (twoPlayerBtn) {

    twoPlayerBtn.classList.toggle(
      "active",
      mode === 2
    );

    twoPlayerBtn.setAttribute(
      "aria-pressed",
      String(mode === 2)
    );
  }

  /*
   Always start a new mode with P1.
  */

  activePlayer = 1;

  updatePlayerPanels();
}

/* =========================================================
   1 PLAYER BUTTON
   ========================================================= */

if (onePlayerBtn) {

  onePlayerBtn.addEventListener(
    "click",
    () => {

      /*
       Switching mode starts
       a fresh game.
      */

      playerMode = 1;

      initGame();
    }
  );
}

/* =========================================================
   2 PLAYER BUTTON
   ========================================================= */

if (twoPlayerBtn) {

  twoPlayerBtn.addEventListener(
    "click",
    () => {

      /*
       Enable 2-player mode
       and start with Player 1.
      */

      playerMode = 2;

      initGame();
    }
  );
}

/* =========================================================
   GRID CHANGE
   ========================================================= */

if (gridSelect) {

  gridSelect.addEventListener(
    "change",
    () => {

      initGame();
    }
  );
}

/* =========================================================
   RESET
   ========================================================= */

if (resetBtn) {

  resetBtn.addEventListener(
    "click",
    () => {

      initGame();
    }
  );
}

/* =========================================================
   VICTORY
   ========================================================= */

function hideVictory() {

  if (!victoryOverlay) {
    return;
  }

  victoryOverlay.hidden = true;
}

function showVictory() {

  if (!victoryOverlay) {
    return;
  }

  if (victoryMoves) {

    victoryMoves.textContent =
      String(moves);
  }

  if (victoryBest) {

    victoryBest.textContent =
      bestEl.textContent;
  }

  victoryOverlay.hidden = false;
}

/* =========================================================
   PLAY AGAIN
   ========================================================= */

if (playAgainBtn) {

  playAgainBtn.addEventListener(
    "click",
    () => {

      initGame();
    }
  );
}

/* =========================================================
   START GAME
   ========================================================= */

setPlayerMode(1);

initGame();
