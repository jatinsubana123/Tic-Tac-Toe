"use strict";

const cells = [...document.querySelectorAll(".cell")];
const statusText = document.getElementById("status");
const turnBadge = document.getElementById("turnBadge");
const turnSymbol = document.getElementById("turnSymbol");
const turnLabel = document.getElementById("turnLabel");

const scoreXText = document.getElementById("scoreX");
const scoreOText = document.getElementById("scoreO");
const scoreDrawText = document.getElementById("scoreDraw");

const scoreCardX = document.getElementById("scoreCardX");
const scoreCardO = document.getElementById("scoreCardO");
const nameX = document.getElementById("nameX");
const nameO = document.getElementById("nameO");
const hint = document.getElementById("hint");

const twoPlayerToggle =
  document.getElementById("twoPlayerToggle");
const restartButton = document.getElementById("restart");
const resetScoresButton =
  document.getElementById("resetScores");

const HUMAN = "X";
const COMPUTER = "O";

const winningPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6]
];

let board = Array(9).fill("");
let currentPlayer = HUMAN;
let gameActive = true;
let computerThinking = false;

let scores = { X: 0, O: 0, draw: 0 };
let computerTimer = null;

function isTwoPlayerMode() {
  return twoPlayerToggle.checked;
}

function getWinningPattern(state = board) {
  return winningPatterns.find(([a, b, c]) =>
    state[a] !== "" &&
    state[a] === state[b] &&
    state[a] === state[c]
  );
}

function updateTurnDisplay() {
  const isX = currentPlayer === HUMAN;
  const computerTurn =
    !isTwoPlayerMode() && currentPlayer === COMPUTER;

  turnSymbol.textContent = currentPlayer;
  turnLabel.textContent = computerTurn
    ? "THINKING"
    : "YOUR TURN";

  turnBadge.style.color = isX ? "var(--x)" : "var(--o)";
  turnBadge.style.background = isX
    ? "#68c7ff12"
    : "#c19aff12";

  turnBadge.style.borderColor = isX
    ? "#68c7ff26"
    : "#c19aff26";

  scoreCardX.classList.toggle(
    "active",
    gameActive && !computerThinking && isX
  );

  scoreCardO.classList.toggle(
    "active",
    gameActive && (computerThinking || !isX)
  );
}

function updateScoreboard() {
  scoreXText.textContent = scores.X;
  scoreOText.textContent = scores.O;
  scoreDrawText.textContent = scores.draw;
}

function updateModeLabels() {
  if (isTwoPlayerMode()) {
    nameX.textContent = "PLAYER 1 · X";
    nameO.textContent = "PLAYER 2 · O";
    hint.textContent =
      "Two-player mode: take turns on the same device.";
  } else {
    nameX.textContent = "YOU · X";
    nameO.textContent = "COMPUTER · O";
    hint.textContent =
      "You are X. The computer is O and plays at medium difficulty.";
  }
}

function renderMove(index, player) {
  const cell = cells[index];

  board[index] = player;
  cell.textContent = player;

  cell.classList.add(
    player === HUMAN ? "mark-x" : "mark-o"
  );

  cell.setAttribute(
    "aria-label",
    `Cell ${index + 1}, ${player}`
  );

  cell.disabled = true;
}

function finishRound(pattern) {
  gameActive = false;
  computerThinking = false;

  cells.forEach(cell => {
    cell.disabled = true;
  });

  if (pattern) {
    pattern.forEach(index => {
      cells[index].classList.add("winner");
    });

    if (!isTwoPlayerMode() && currentPlayer === COMPUTER) {
      statusText.textContent = "Computer wins this round!";
    } else if (!isTwoPlayerMode()) {
      statusText.textContent = "You win! Great move! 🎉";
    } else {
      statusText.textContent =
        `Player ${currentPlayer} wins! 🎉`;
    }

    scores[currentPlayer]++;
  } else {
    statusText.textContent = "It's a draw!";
    scores.draw++;
  }

  updateScoreboard();
  updateTurnDisplay();
}

function checkRoundEnd() {
  const pattern = getWinningPattern();

  if (pattern) {
    finishRound(pattern);
    return true;
  }

  if (board.every(value => value !== "")) {
    finishRound(null);
    return true;
  }

  return false;
}

// Find a move that immediately wins for the given player.
function findImmediateMove(player) {
  for (let i = 0; i < board.length; i++) {
    if (board[i] !== "") continue;

    board[i] = player;
    const wins = Boolean(getWinningPattern());
    board[i] = "";

    if (wins) return i;
  }

  return -1;
}

// Medium difficulty: win, block, prefer center/corners,
// or choose a random available square.
function chooseMediumMove() {
  // 1. Win if possible.
  const winningMove = findImmediateMove(COMPUTER);

  if (winningMove !== -1) {
    return winningMove;
  }

  // 2. Block the human's immediate winning move.
  const blockingMove = findImmediateMove(HUMAN);

  if (blockingMove !== -1) {
    return blockingMove;
  }

  // 3. Prefer the center.
  if (board[4] === "") {
    return 4;
  }

  // 4. Usually prefer an available corner.
  const corners = [0, 2, 6, 8].filter(
    index => board[index] === ""
  );

  if (corners.length > 0 && Math.random() < 0.75) {
    return corners[
      Math.floor(Math.random() * corners.length)
    ];
  }

  // 5. Otherwise choose any empty square.
  const available = board
    .map((value, index) => value === "" ? index : -1)
    .filter(index => index !== -1);

  return available[
    Math.floor(Math.random() * available.length)
  ];
}

function computerMove() {
  if (
    !gameActive ||
    isTwoPlayerMode() ||
    currentPlayer !== COMPUTER
  ) {
    return;
  }

  computerThinking = true;
  statusText.textContent = "Computer is thinking…";
  updateTurnDisplay();

  // Small delay makes the computer's move feel natural.
  computerTimer = window.setTimeout(() => {
    computerTimer = null;

    if (
      !gameActive ||
      isTwoPlayerMode() ||
      currentPlayer !== COMPUTER
    ) {
      computerThinking = false;
      return;
    }

    const move = chooseMediumMove();

    if (move !== -1) {
      renderMove(move, COMPUTER);
    }

    computerThinking = false;

    if (checkRoundEnd()) return;

    currentPlayer = HUMAN;
    statusText.textContent = "Your turn (X)";
    updateTurnDisplay();
  }, 450);
}

function handleCellClick(event) {
  const index = Number(event.currentTarget.dataset.index);

  if (
    !gameActive ||
    computerThinking ||
    board[index] !== ""
  ) {
    return;
  }

  // In computer mode, only the human can make a manual move.
  if (!isTwoPlayerMode() && currentPlayer !== HUMAN) {
    return;
  }

  renderMove(index, currentPlayer);

  if (checkRoundEnd()) return;

  if (isTwoPlayerMode()) {
    currentPlayer =
      currentPlayer === HUMAN ? COMPUTER : HUMAN;

    statusText.textContent =
      `Player ${currentPlayer}'s turn`;

    updateTurnDisplay();
  } else {
    currentPlayer = COMPUTER;
    statusText.textContent = "Computer is thinking…";
    updateTurnDisplay();
    computerMove();
  }
}

function restartRound() {
  if (computerTimer !== null) {
    clearTimeout(computerTimer);
    computerTimer = null;
  }

  board = Array(9).fill("");
  currentPlayer = HUMAN;
  gameActive = true;
  computerThinking = false;

  statusText.textContent = isTwoPlayerMode()
    ? "Player X's turn"
    : "Your turn (X)";

  cells.forEach((cell, index) => {
    cell.textContent = "";
    cell.disabled = false;

    cell.classList.remove(
      "mark-x",
      "mark-o",
      "winner"
    );

    cell.setAttribute(
      "aria-label",
      `Cell ${index + 1}, empty`
    );
  });

  updateModeLabels();
  updateTurnDisplay();
}

function resetScores() {
  scores = { X: 0, O: 0, draw: 0 };

  updateScoreboard();
  restartRound();
}

twoPlayerToggle.addEventListener("change", restartRound);

cells.forEach(cell => {
  cell.addEventListener("click", handleCellClick);
});

restartButton.addEventListener("click", restartRound);
resetScoresButton.addEventListener("click", resetScores);

updateScoreboard();
updateModeLabels();
updateTurnDisplay();