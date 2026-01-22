const DIFFICULTIES = {
    easy: { rows: 10, cols: 10, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 20 },
    hard: { rows: 16, cols: 16, mines: 40 }
};

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
    eventLog: [],
    firstClick: true
};

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
    gameState.firstClick = true;
    
    clearInterval(gameState.timerInterval);
    gameState.seconds = 0;
    timerEl.textContent = gameState.seconds;
    
    minesCountEl.textContent = difficulty.mines;
    gameModeEl.textContent = 'Игра';
    gameStatusEl.textContent = '';
    gameStatusEl.className = 'game-status';
    
    createBoard(difficulty.rows, difficulty.cols);
    
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

function placeMinesSafe(firstRow, firstCol, mineCount, rows, cols) {
    logEvent('placeMinesSafe', `Разполагане на ${mineCount} мини безопасно около [${firstRow}, ${firstCol}]`);
    
    let minesPlaced = 0;
    const safeZone = new Set();
    
    for (let r = firstRow - 1; r <= firstRow + 1; r++) {
        for (let c = firstCol - 1; c <= firstCol + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                safeZone.add(`${r},${c}`);
            }
        }
    }
    
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        if (safeZone.has(`${row},${col}`)) {
            continue;
        }
        
        if (!gameState.board[row][col].isMine) {
            gameState.board[row][col].isMine = true;
            gameState.mines.push({ row, col });
            minesPlaced++;
        }
    }
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
    
    if (gameState.firstClick) {
        gameState.firstClick = false;
        startGameWithFirstClick(row, col);
    }
    
    revealCell(row, col);
    
    checkWinCondition();
}

function startGameWithFirstClick(row, col) {
    logEvent('startGameWithFirstClick', `Първи клик на [${row}, ${col}], стартиране на играта`);
    
    const difficulty = DIFFICULTIES[gameState.difficulty];
    const rows = difficulty.rows;
    const cols = difficulty.cols;
    const mineCount = difficulty.mines;
    
    placeMinesSafe(row, col, mineCount, rows, cols);
    
    calculateNumbers(rows, cols);
    
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
    
    if (gameState.board[row][col].number > 0) {
        moveMinesFromNeighbors(row, col, rows, cols, mineCount);
        calculateNumbers(rows, cols);
    }
    
    gameState.board[row][col].number = 0;
}

function moveMinesFromNeighbors(row, col, rows, cols, totalMines) {
    logEvent('moveMinesFromNeighbors', `Преместване на мини от съседите на [${row}, ${col}]`);
    
    const neighborMines = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < rows && c >= 0 && c < cols) {
                if (gameState.board[r][c].isMine) {
                    neighborMines.push({ row: r, col: c });
                    gameState.board[r][c].isMine = false;
                    const mineIndex = gameState.mines.findIndex(m => m.row === r && m.col === c);
                    if (mineIndex !== -1) {
                        gameState.mines.splice(mineIndex, 1);
                    }
                }
            }
        }
    }
    
    if (neighborMines.length === 0) return;
    
    const availableCells = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const distance = Math.max(Math.abs(r - row), Math.abs(c - col));
            if (distance > 1 && !gameState.board[r][c].isMine) {
                availableCells.push({ row: r, col: c });
            }
        }
    }
    
    availableCells.sort(() => Math.random() - 0.5);
    
    let minesToPlace = Math.min(neighborMines.length, availableCells.length);
    for (let i = 0; i < minesToPlace; i++) {
        const newLocation = availableCells[i];
        gameState.board[newLocation.row][newLocation.col].isMine = true;
        gameState.mines.push(newLocation);
    }
    
    const currentMines = gameState.mines.length;
    if (currentMines < totalMines) {
        const additionalMines = totalMines - currentMines;
        placeAdditionalMines(additionalMines, rows, cols, row, col);
    }
}

function placeAdditionalMines(mineCount, rows, cols, firstRow, firstCol) {
    logEvent('placeAdditionalMines', `Разполагане на ${mineCount} допълнителни мини`);
    
    let minesPlaced = 0;
    while (minesPlaced < mineCount) {
        const row = Math.floor(Math.random() * rows);
        const col = Math.floor(Math.random() * cols);
        
        const distance = Math.max(Math.abs(row - firstRow), Math.abs(col - firstCol));
        if (distance > 1 && !gameState.board[row][col].isMine) {
            gameState.board[row][col].isMine = true;
            gameState.mines.push({ row, col });
            minesPlaced++;
        }
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
        if (gameState.revealed.length === 1) { 
            revealArea(row, col);
        } else {
            revealNeighbors(row, col);
        }
    }
}

function revealArea(startRow, startCol) {
    const rows = DIFFICULTIES[gameState.difficulty].rows;
    const cols = DIFFICULTIES[gameState.difficulty].cols;
    const visited = new Set();
    const queue = [{ row: startRow, col: startCol }];
    
    while (queue.length > 0) {
        const { row, col } = queue.shift();
        const key = `${row},${col}`;
        
        if (visited.has(key)) continue;
        visited.add(key);
        
        const cellData = gameState.board[row][col];
        
        if (cellData.isRevealed || cellData.isFlagged) continue;
        
        cellData.isRevealed = true;
        cellData.element.classList.add('revealed');
        gameState.revealed.push({ row, col });
        
        if (cellData.isMine) {
            console.error("Грешка: мина разкрита при първия клик!");
            continue;
        }
        
        if (cellData.number > 0) {
            cellData.element.textContent = cellData.number;
            cellData.element.classList.add(`number-${cellData.number}`);
        } else {
            for (let r = row - 1; r <= row + 1; r++) {
                for (let c = col - 1; c <= col + 1; c++) {
                    if (r >= 0 && r < rows && c >= 0 && c < cols) {
                        if (r === row && c === col) continue;
                        
                        const neighborKey = `${r},${c}`;
                        if (!visited.has(neighborKey)) {
                            queue.push({ row: r, col: c });
                        }
                    }
                }
            }
        }
    }
    
    logEvent('revealArea', `Разкрита област от ${visited.size} клетки при първия клик`);
}

function handleCellRightClick(e) {
    e.preventDefault();
    const cell = e.currentTarget;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);
    
    logEvent('contextmenu', `Десен клик върху клетка [${row}, ${col}]`);
    
    if (gameState.gameOver || gameState.gameWon) return;
    
    if (gameState.firstClick) return;
    
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
    
    if (gameState.firstClick) return;
    
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
                if (gameState.firstClick) {
                    startGameWithFirstClick(row, col);
                    gameState.firstClick = false;
                }
                
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
                if (gameState.firstClick) return;
                
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
        gameStatusEl.textContent = 'Победа! ';
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
        gameStatusEl.textContent = 'Играта свърши!';
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
    if (gameState.gameOver || gameState.gameWon || gameState.hintUsed || gameState.firstClick) return;
    
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
    if (gameState.firstClick) return;
    
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