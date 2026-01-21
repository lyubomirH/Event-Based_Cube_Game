// Игрални константи
const DIFFICULTIES = {
    easy: { rows: 10, cols: 10, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 20 },
    hard: { rows: 16, cols: 16, mines: 40 }
};

// Състояние на играта
let gameState = {
    difficulty: 'medium',
    board: [],
    mines: [],
    flags: [],
    revealed: [],
    gameOver: false,
    gameWon: false,
    startTime: null,
    timerInterval: null,
    seconds: 0,
    selectedCell: null,
    hintUsed: false,
    cheatMode: false,
    eventLog: []
};

// DOM елементи
const gameBoard = document.getElementById('game-board');
const minesCountEl = document.getElementById('mines-count');
const timerEl = document.getElementById('timer');
const gameModeEl = document.getElementById('game-mode');
const gameStatusEl = document.getElementById('game-status');
const newGameBtn = document.getElementById('new-game-btn');
const changeDifficultyBtn = document.getElementById('change-difficulty-btn');
const hintBtn = document.getElementById('hint-btn');
const cheatBtn = document.getElementById('cheat-btn');
const eventListEl = document.getElementById('event-list');

function initGame() {
    logEvent('initGame', 'Инициализация на нова игра');
    
    const difficulty = DIFFICULTIES[gameState.difficulty];
    gameState.board = [];
    gameState.mines = [];
    gameState.flags = [];
    gameState.revealed = [];
    gameState.gameOver = false;
    gameState.gameWon = false;
    gameState.hintUsed = false;
    gameState.cheatMode = false;
    gameState.selectedCell = null;
    
    clearInterval(gameState.timerInterval);
    gameState.seconds = 0;
    timerEl.textContent = gameState.seconds;
    
    minesCountEl.textContent = difficulty.mines;
    gameModeEl.textContent = 'Игра';
    gameStatusEl.textContent = '';
    gameStatusEl.className = 'game-status';
    
    createBoard(difficulty.rows, difficulty.cols);
    
    placeMines(difficulty.mines, difficulty.rows, difficulty.cols);
    
    calculateNumbers(difficulty.rows, difficulty.cols);
    
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    hintBtn.disabled = false;
    cheatBtn.textContent = "Покажи мини";
    cheatBtn.innerHTML = '<i class="fas fa-eye"></i> Покажи мини';
}

function createBoard(rows, cols) {
    logEvent('createBoard', `Създаване на поле: ${rows}x${cols}`);
    
    gameBoard.innerHTML = '';
    
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    
    for (let row = 0; row < rows; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.dataset.index = row * cols + col;
            
            cell.addEventListener('click', handleCellClick);
            cell.addEventListener('contextmenu', handleCellRightClick);
            cell.addEventListener('dblclick', handleCellDoubleClick);
            cell.addEventListener('mouseenter', handleCellMouseEnter);
            cell.addEventListener('mouseleave', handleCellMouseLeave);
            
            gameBoard.appendChild(cell);
            gameState.board[row][col] = {
                element: cell,
                isMine: false,
                number: 0,
                isRevealed: false,
                isFlagged: false
            };
        }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    
    updateEventList();
}

function placeMines(mineCount, rows, cols) {
    logEvent('placeMines', `Разполагане на ${mineCount} мини`);
    
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        if (!gameState.board[row][col].isMine) {
            gameState.board[row][col].isMine = true;
            gameState.mines.push({ row, col });
            minesPlaced++;
        }
    }
}
function calculateNumbers(rows, cols) {
    logEvent('calculateNumbers', 'Изчисляване на числата на клетките');
    
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (gameState.board[row][col].isMine) continue;
            
            let count = 0;
            
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        if (gameState.board[r][c].isMine) {
                            count++;
                        }
                    }
                }
            }
            
            gameState.board[row][col].number = count;
        }
    }
}

function handleCellClick(e) {
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    logEvent('click', `Клик върху клетка [${row}, ${col}]`);
    
    if (gameState.gameOver || gameState.gameWon) return;
    
    if (gameState.board[row][col].isFlagged) return;
    
    revealCell(row, col);
    
    checkWinCondition();
}

function handleCellRightClick(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    logEvent('contextmenu', `Десен клик върху клетка [${row}, ${col}]`);
    
    if (gameState.gameOver || gameState.gameWon) return;
    
    if (gameState.board[row][col].isRevealed) return;
    
    toggleFlag(row, col);
    
    checkWinCondition();
}

function handleCellDoubleClick(e) {
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    logEvent('dblclick', `Двойно кликване върху клетка [${row}, ${col}]`);
    
    if (gameState.gameOver || gameState.gameWon) return;
    
    if (!gameState.board[row][col].isRevealed) return;
    
    revealNeighbors(row, col);
    
    checkWinCondition();
}

function handleCellMouseEnter(e) {
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    gameState.selectedCell = { row, col };
    
    if (!gameState.gameOver && !gameState.gameWon) {
        cell.style.boxShadow = 'inset 0 0 0 2px #7fdbda';
    }
}

function handleCellMouseLeave(e) {
    const cell = e.currentTarget;
    
    cell.style.boxShadow = '';
}

function handleKeyDown(e) {
    logEvent('keydown', `Натиснат клавиш: ${e.key}`);
    
    if (!gameState.selectedCell) return;
    
    const { row, col } = gameState.selectedCell;
    const rows = DIFFICULTIES[gameState.difficulty].rows;
    const cols = DIFFICULTIES[gameState.difficulty].cols;
    
    let newRow = row;
    let newCol = col;
    
    switch(e.key) {
        case 'ArrowUp':
            e.preventDefault();
            newRow = Math.max(0, row - 1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            newRow = Math.min(rows - 1, row + 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            newCol = Math.max(0, col - 1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            newCol = Math.min(cols - 1, col + 1);
            break;
        case ' ':
        case 'Enter':
            e.preventDefault();
            if (!gameState.gameOver && !gameState.gameWon) {
                if (!gameState.board[row][col].isFlagged) {
                    revealCell(row, col);
                    checkWinCondition();
                }
            }
            return;
        case 'f':
        case 'F':
            e.preventDefault();
            if (!gameState.gameOver && !gameState.gameWon) {
                if (!gameState.board[row][col].isRevealed) {
                    toggleFlag(row, col);
                    checkWinCondition();
                }
            }
            return;
    }
    
    if (newRow !== row || newCol !== col) {
        if (gameState.selectedCell) {
            const oldCell = gameState.board[row][col].element;
            oldCell.style.boxShadow = '';
        }
        
        gameState.selectedCell = { row: newRow, col: newCol };
        const newCell = gameState.board[newRow][newCol].element;
        newCell.style.boxShadow = 'inset 0 0 0 2px #7fdbda';
        
        newCell.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
}

function revealCell(row, col) {
    const cellData = gameState.board[row][col];
    
    if (cellData.isRevealed || cellData.isFlagged) return;
    
    cellData.isRevealed = true;
    cellData.element.classList.add('revealed');
    gameState.revealed.push({ row, col });
    
    if (cellData.isMine) {
        cellData.element.classList.add('mine');
        gameOver(false);
        return;
    }
    
    if (cellData.number > 0) {
        cellData.element.textContent = cellData.number;
        cellData.element.classList.add(`number-${cellData.number}`);
    } else {
        revealNeighbors(row, col);
    }
}

function revealNeighbors(row, col) {
    const rows = DIFFICULTIES[gameState.difficulty].rows;
    const cols = DIFFICULTIES[gameState.difficulty].cols;
    
    let flagCount = 0;
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                if (gameState.board[r][c].isFlagged) {
                    flagCount++;
                }
            }
        }
    }
    if (flagCount === gameState.board[row][col].number) {
        for (let r = row - 1; r <= row + 1; r++) {
            for (let c = col - 1; c <= col + 1; c++) {
                if (r >= 0 && r < rows && c >= 0 && c < cols) {
                    if (!gameState.board[r][c].isRevealed && !gameState.board[r][c].isFlagged) {
                        revealCell(r, c);
                    }
                }
            }
        }
    }
}

function toggleFlag(row, col) {
    const cellData = gameState.board[row][col];
    const difficulty = DIFFICULTIES[gameState.difficulty];
    
    if (!cellData.isFlagged && gameState.flags.length >= difficulty.mines) {
        return;
    }
    cellData.isFlagged = !cellData.isFlagged;
    
    if (cellData.isFlagged) {
        cellData.element.classList.add('flagged');
        gameState.flags.push({ row, col });
    } else {
        cellData.element.classList.remove('flagged');
        const flagIndex = gameState.flags.findIndex(f => f.row === row && f.col === col);
        if (flagIndex !== -1) {
            gameState.flags.splice(flagIndex, 1);
        }
    }
    
    minesCountEl.textContent = difficulty.mines - gameState.flags.length;
}

function checkWinCondition() {
    const difficulty = DIFFICULTIES[gameState.difficulty];
    const totalCells = difficulty.rows * difficulty.cols;
    const totalRevealed = gameState.revealed.length;
    const totalMines = difficulty.mines;
    
    if (totalRevealed === totalCells - totalMines) {
        gameOver(true);
    }
}

function gameOver(isWin) {
    clearInterval(gameState.timerInterval);
    gameState.gameOver = true;
    
    if (isWin) {
        gameState.gameWon = true;
        gameStatusEl.textContent = 'Победа! 🎉';
        gameStatusEl.classList.add('win');
        gameModeEl.textContent = 'Победа';
        
        gameState.mines.forEach(mine => {
            const cellData = gameState.board[mine.row][mine.col];
            if (!cellData.isFlagged) {
                cellData.element.classList.add('flagged');
            }
        });
        
        logEvent('gameOver', 'Играта е спечелена!');
    } else {
        gameStatusEl.textContent = 'Играта свърши! 💥';
        gameStatusEl.classList.add('lose');
        gameModeEl.textContent = 'Загуба';
        
        gameState.mines.forEach(mine => {
            const cellData = gameState.board[mine.row][mine.col];
            if (!cellData.isRevealed) {
                cellData.element.classList.add('mine');
                cellData.element.classList.add('revealed');
                    }
                });
                
                logEvent('gameOver', 'Играта е загубена (настъпи на мина)');
            }
            
            hintBtn.disabled = true;
        }
        
        function updateTimer() {
            gameState.seconds++;
            timerEl.textContent = gameState.seconds;
        }
        
        function logEvent(type, description) {
            const timestamp = new Date().toLocaleTimeString();
            gameState.eventLog.unshift({ type, description, timestamp });
            
            if (gameState.eventLog.length > 15) {
                gameState.eventLog.pop();
            }
            
            updateEventList();
        }
        
        function updateEventList() {
            eventListEl.innerHTML = '';
            
            gameState.eventLog.forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.className = 'event-item';
                eventItem.innerHTML = `
                    <strong>${event.type}</strong><br>
                    ${event.description}<br>
                    <small>${event.timestamp}</small>
                `;
                eventListEl.appendChild(eventItem);
            });
        }
        
        function changeDifficulty() {
            const difficulties = ['easy', 'medium', 'hard'];
            const currentIndex = difficulties.indexOf(gameState.difficulty);
            const nextIndex = (currentIndex + 1) % difficulties.length;
            gameState.difficulty = difficulties[nextIndex];
            
            logEvent('changeDifficulty', `Промяна на трудността на: ${gameState.difficulty}`);
            
            initGame();
        }
        
        function giveHint() {
            if (gameState.gameOver || gameState.gameWon || gameState.hintUsed) return;
            
            logEvent('hint', 'Използвана подсказка');
            const difficulty = DIFFICULTIES[gameState.difficulty];
            let hintFound = false;
            
            for (let row = 0; row < difficulty.rows && !hintFound; row++) {
                for (let col = 0; col < difficulty.cols && !hintFound; col++) {
                    const cellData = gameState.board[row][col];
                    if (!cellData.isMine && !cellData.isRevealed && !cellData.isFlagged) {
                        cellData.element.style.boxShadow = 'inset 0 0 0 3px #fbc531';
                        setTimeout(() => {
                            cellData.element.style.boxShadow = '';
                        }, 2000);
                        
                        hintFound = true;
                        gameState.hintUsed = true;
                        hintBtn.disabled = true;
                    }
                }
            }
        }
        
        function toggleCheatMode() {
            gameState.cheatMode = !gameState.cheatMode;
            
            if (gameState.cheatMode) {
                logEvent('cheatMode', 'Активиран cheat mode');
                cheatBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Скрий мини';
                
                gameState.mines.forEach(mine => {
                    const cellData = gameState.board[mine.row][mine.col];
                    if (!cellData.isRevealed && !cellData.isFlagged) {
                        cellData.element.style.backgroundColor = '#e94560';
                        cellData.element.style.opacity = '0.7';
                    }
                });
            } else {
                logEvent('cheatMode', 'Деактивиран cheat mode');
                cheatBtn.innerHTML = '<i class="fas fa-eye"></i> Покажи мини';
                
                gameState.mines.forEach(mine => {
                    const cellData = gameState.board[mine.row][mine.col];
                    if (!cellData.isRevealed && !cellData.isFlagged) {
                        cellData.element.style.backgroundColor = '';
                        cellData.element.style.opacity = '';
                    }
                });
            }
        }
        
        newGameBtn.addEventListener('click', initGame);
        changeDifficultyBtn.addEventListener('click', changeDifficulty);
        hintBtn.addEventListener('click', giveHint);
        cheatBtn.addEventListener('click', toggleCheatMode);
        
        document.addEventListener('DOMContentLoaded', () => {
            logEvent('DOMContentLoaded', 'Страницата е заредена');
            initGame();
        });
        
        window.addEventListener('beforeunload', () => {
            logEvent('beforeunload', 'Страницата се затваря');
        });
        
        window.addEventListener('resize', () => {
            logEvent('resize', 'Прозорецът е преоразмерен');
        });
        
        window.onload = () => {
            logEvent('load', 'Играта Minesweeper е заредена успешно');
        };