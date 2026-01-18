let selectedShape = null;
let score = 0;
let shapesCount = 0;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const colors = [
    '#4361ee', '#3a0ca3', '#7209b7', '#f72585', 
    '#4cc9f0', '#4895ef', '#560bad', '#b5179e'
];

const arena = document.getElementById('arena');
const shapesContainer = document.getElementById('shapesContainer');
const selectedShapeInfo = document.getElementById('selectedShapeInfo');
const totalShapes = document.getElementById('totalShapes');
const scoreElement = document.getElementById('score');

function createShape(type, x, y) {
    shapesCount++;
    totalShapes.textContent = shapesCount;
    
    const shape = document.createElement('div');
    shape.className = `shape ${type}`;
    shape.id = `shape-${shapesCount}`;
    
    const size = type === 'triangle' ? 0 : Math.floor(Math.random() * 40) + 40;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    if (type === 'triangle') {
        shape.style.borderBottomColor = color;
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        shape.style.width = '0';
        shape.style.height = '0';
    } else if (type === 'star') {
        shape.textContent = '★';
        shape.style.fontSize = `${size}px`;
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.display = 'flex';
        shape.style.justifyContent = 'center';
        shape.style.alignItems = 'center';
    } else {
        shape.style.width = `${size}px`;
        shape.style.height = `${size}px`;
        shape.style.left = `${x}px`;
        shape.style.top = `${y}px`;
        shape.style.backgroundColor = color;
    }
    
    shape.dataset.points = Math.floor(Math.random() * 5) + 1;
    shape.dataset.type = type;
    
    addShapeEvents(shape);
    
    shapesContainer.appendChild(shape);
    
    shape.style.transform = 'scale(0)';
    setTimeout(() => {
        shape.style.transition = 'transform 0.3s ease';
        shape.style.transform = 'scale(1)';
    }, 10);
    
    return shape;
}

function addShapeEvents(shape) {
    shape.addEventListener('click', function(e) {
        e.stopPropagation();
        selectShape(shape);
        
        addScore(parseInt(shape.dataset.points));
    });
    
    shape.addEventListener('mousedown', startDrag);
    
    shape.addEventListener('dblclick', function() {
        if (selectedShape === shape) {
            explodeShape(shape);
        }
    });
    
    shape.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        if (selectedShape === shape) {
            changeShapeColor(shape);
        }
    });
}

function selectShape(shape) {
    if (selectedShape) {
        selectedShape.classList.remove('selected');
    }
    
    selectedShape = shape;
    selectedShape.classList.add('selected');
    
    selectedShapeInfo.textContent = `${shape.dataset.type} (${shape.dataset.points} точки)`;
}

function startDrag(e) {
    if (e.button !== 0) return;
    
    const shape = e.target;
    selectShape(shape);
    
    isDragging = true;
    
    const rect = shape.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    
    document.addEventListener('mousemove', dragShape);
    document.addEventListener('mouseup', stopDrag);
    
    e.preventDefault();
}

function dragShape(e) {
    if (!isDragging || !selectedShape) return;
    
    const arenaRect = arena.getBoundingClientRect();
    const shapeWidth = selectedShape.offsetWidth;
    const shapeHeight = selectedShape.offsetHeight;
    
    let newX = e.clientX - arenaRect.left - dragOffsetX;
    let newY = e.clientY - arenaRect.top - dragOffsetY;
    
    newX = Math.max(0, Math.min(newX, arenaRect.width - shapeWidth));
    newY = Math.max(0, Math.min(newY, arenaRect.height - shapeHeight));
    
    selectedShape.style.left = `${newX}px`;
    selectedShape.style.top = `${newY}px`;
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', dragShape);
    document.removeEventListener('mouseup', stopDrag);
}

document.addEventListener('keydown', function(e) {
    if (!selectedShape) return;
    
    const key = e.key.toLowerCase();
    const step = 10;
    const arenaRect = arena.getBoundingClientRect();
    const shapeRect = selectedShape.getBoundingClientRect();
    
    let currentX = parseInt(selectedShape.style.left) || 0;
    let currentY = parseInt(selectedShape.style.top) || 0;
    
    switch(key) {
        case 'w':
            currentY = Math.max(0, currentY - step);
            break;
        case 's':
            currentY = Math.min(arenaRect.height - shapeRect.height, currentY + step);
            break;
        case 'a':
            currentX = Math.max(0, currentX - step);
            break;
        case 'd':
            currentX = Math.min(arenaRect.width - shapeRect.width, currentX + step);
            break;
        default:
            return;
    }
    
    selectedShape.style.left = `${currentX}px`;
    selectedShape.style.top = `${currentY}px`;
});

function addScore(points) {
    score += points;
    scoreElement.textContent = score;
    
    scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
    }, 200);
}

function changeShapeColor(shape) {
    const currentColor = shape.style.backgroundColor || shape.style.borderBottomColor;
    let newColor;
    
    do {
        newColor = colors[Math.floor(Math.random() * colors.length)];
    } while (newColor === currentColor);
    
    if (shape.dataset.type === 'triangle') {
        shape.style.borderBottomColor = newColor;
    } else if (shape.dataset.type === 'star') {
        shape.style.color = newColor;
    } else {
        shape.style.backgroundColor = newColor;
    }
    
    addScore(1);
}

function changeShapeSize(shape, factor) {
    const currentWidth = parseInt(shape.style.width) || 50;
    const currentHeight = parseInt(shape.style.height) || 50;
    const currentFontSize = parseInt(shape.style.fontSize) || 40;
    const minSize = 20;
    const maxSize = 150;
    
    if (shape.dataset.type === 'star') {
        const newSize = Math.max(minSize, Math.min(maxSize, currentFontSize * factor));
        shape.style.fontSize = `${newSize}px`;
        shape.style.width = `${newSize}px`;
        shape.style.height = `${newSize}px`;
    } else if (shape.dataset.type !== 'triangle') {
        const newWidth = Math.max(minSize, Math.min(maxSize, currentWidth * factor));
        const newHeight = Math.max(minSize, Math.min(maxSize, currentHeight * factor));
        shape.style.width = `${newWidth}px`;
        shape.style.height = `${newHeight}px`;
    }
    
    addScore(1);
}

function explodeShape(shape) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    
    const rect = shape.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    
    explosion.style.left = `${rect.left - arenaRect.left - 50 + rect.width/2}px`;
    explosion.style.top = `${rect.top - arenaRect.top - 50 + rect.height/2}px`;
    
    arena.appendChild(explosion);
    
    explosion.addEventListener('animationend', function() {
        explosion.remove();
    });
    
    if (selectedShape === shape) {
        selectedShape = null;
        selectedShapeInfo.textContent = 'Няма избрана фигура';
    }
    
    shape.remove();
    shapesCount--;
    totalShapes.textContent = shapesCount;
    
    addScore(parseInt(shape.dataset.points) * 2);
}

function removeShape(shape) {
    if (selectedShape === shape) {
        selectedShape = null;
        selectedShapeInfo.textContent = 'Няма избрана фигура';
    }
    
    shape.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    shape.style.transform = 'scale(0)';
    shape.style.opacity = '0';
    
    setTimeout(() => {
        shape.remove();
        shapesCount--;
        totalShapes.textContent = shapesCount;
    }, 300);
}

function addPointsToShape(shape) {
    const currentPoints = parseInt(shape.dataset.points);
    const newPoints = currentPoints + 1;
    shape.dataset.points = newPoints;
    
    if (selectedShape === shape) {
        selectedShapeInfo.textContent = `${shape.dataset.type} (${newPoints} точки)`;
    }
    
    shape.style.transform = 'scale(1.1)';
    setTimeout(() => {
        shape.style.transform = 'scale(1)';
    }, 200);
    
    addScore(2);
}

document.getElementById('createCube').addEventListener('click', function() {
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape('cube', x, y);
});

document.getElementById('createCircle').addEventListener('click', function() {
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape('circle', x, y);
});

document.getElementById('createTriangle').addEventListener('click', function() {
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape('triangle', x, y);
});

document.getElementById('createHexagon').addEventListener('click', function() {
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape('hexagon', x, y);
});

document.getElementById('createStar').addEventListener('click', function() {
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape('star', x, y);
});

document.getElementById('createRandom').addEventListener('click', function() {
    const types = ['cube', 'circle', 'triangle', 'hexagon', 'star'];
    const type = types[Math.floor(Math.random() * types.length)];
    const x = Math.random() * (arena.offsetWidth - 60);
    const y = Math.random() * (arena.offsetHeight - 60);
    createShape(type, x, y);
});

document.getElementById('changeColor').addEventListener('click', function() {
    if (selectedShape) {
        changeShapeColor(selectedShape);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

document.getElementById('increaseSize').addEventListener('click', function() {
    if (selectedShape) {
        changeShapeSize(selectedShape, 1.2);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

document.getElementById('decreaseSize').addEventListener('click', function() {
    if (selectedShape) {
        changeShapeSize(selectedShape, 0.8);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

document.getElementById('addPoints').addEventListener('click', function() {
    if (selectedShape) {
        addPointsToShape(selectedShape);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

document.getElementById('explode').addEventListener('click', function() {
    if (selectedShape) {
        explodeShape(selectedShape);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

document.getElementById('removeShape').addEventListener('click', function() {
    if (selectedShape) {
        removeShape(selectedShape);
    } else {
        alert('Моля, изберете първо фигура!');
    }
});

arena.addEventListener('click', function(e) {
    if (e.target === arena) {
        if (selectedShape) {
            selectedShape.classList.remove('selected');
            selectedShape = null;
            selectedShapeInfo.textContent = 'Няма избрана фигура';
        }
    }
});

window.addEventListener('DOMContentLoaded', function() {
    for (let i = 0; i < 5; i++) {
        const types = ['cube', 'circle', 'triangle', 'hexagon', 'star'];
        const type = types[Math.floor(Math.random() * types.length)];
        const x = Math.random() * (arena.offsetWidth - 80);
        const y = Math.random() * (arena.offsetHeight - 80);
        createShape(type, x, y);
    }
});