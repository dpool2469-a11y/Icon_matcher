const icons = ['🐶', '🐱', '🦊', '🐼', '🦁', '🐯', '🐻', '🐨', '🐸', '🐵'];

let board = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLock = false;

const boardEl = document.getElementById('game-board');
const moveEl = document.getElementById('move-count');
const bestEl = document.getElementById('best-score');
const gridSelect = document.getElementById('grid-select');
const resetBtn = document.getElementById('reset-btn');

function initGame() {
  const gridValue = gridSelect.value;
  const [rows, cols] = gridValue.split('x').map(Number);
  document.documentElement.style.setProperty('--cols', cols);
  
  const totalCards = rows * cols;
  const numPairs = totalCards / 2;
  
  const selectedIcons = icons.slice(0, numPairs);
  board = [...selectedIcons, ...selectedIcons].sort(() => Math.random() - 0.5);
  
  boardEl.innerHTML = '';
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  isLock = false;
  moveEl.textContent = moves;

  // Load Best Score from LocalStorage
  const savedBest = localStorage.getItem(`best_${gridValue}`);
  bestEl.textContent = savedBest ? savedBest : '-';

  board.forEach((symbol, index) => {
    const card = document.createElement('div');
    card.classList.add('card');
    card.dataset.symbol = symbol;
    card.textContent = '❓';
    card.addEventListener('click', handleCardClick);
    boardEl.appendChild(card);
  });
}

function handleCardClick(e) {
  const card = e.currentTarget;
  if (isLock || card.classList.contains('flipped') || card.classList.contains('matched')) return;

  card.classList.add('flipped');
  card.textContent = card.dataset.symbol;
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    moves++;
    moveEl.textContent = moves;
    checkMatch();
  }
}

function checkMatch() {
  const [card1, card2] = flippedCards;
  if (card1.dataset.symbol === card2.dataset.symbol) {
    card1.classList.add('matched');
    card2.classList.add('matched');
    flippedCards = [];
    matchedPairs++;
    
    const gridValue = gridSelect.value;
    const [rows, cols] = gridValue.split('x').map(Number);
    if (matchedPairs === (rows * cols) / 2) {
      updateBestScore(gridValue, moves);
      setTimeout(() => alert(`🎉 Cleared in ${moves} moves!`), 300);
    }
  } else {
    isLock = true;
    setTimeout(() => {
      card1.classList.remove('flipped');
      card2.classList.remove('flipped');
      card1.textContent = '❓';
      card2.textContent = '❓';
      flippedCards = [];
      isLock = false;
    }, 800);
  }
}

function updateBestScore(gridKey, currentMoves) {
  const currentBest = localStorage.getItem(`best_${gridKey}`);
  if (!currentBest || currentMoves < Number(currentBest)) {
    localStorage.setItem(`best_${gridKey}`, currentMoves);
    bestEl.textContent = currentMoves;
  }
}

gridSelect.addEventListener('change', initGame);
resetBtn.addEventListener('click', initGame);

initGame();
        
