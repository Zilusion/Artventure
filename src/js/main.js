// Canvas
const drawingCanvas = document.querySelector('#drawingCanvas');
const drawingContext = drawingCanvas.getContext('2d');
const previewCanvas = document.querySelector('#previewCanvas');
const previewContext = previewCanvas.getContext('2d');
const canvasMenu = document.querySelector('.canvas__menu');

// Info
const canvasWidth = document.querySelector('.canvas-width');
const canvasHeight = document.querySelector('.canvas-height');
const mouseCoordinatesText = document.querySelector('.mouse-coordinates');
const directionText = document.querySelector('.mouse-direction');

// Brush settings
const thicknessRange = document.querySelector('#thicknessRange');
const colorPicker = document.querySelector('#colorPicker');

let previewMouseCoordinates = {
	x: null,
	y: null,
};

let mouseCoordinates = {
	x: null,
	y: null,
};

let oldMouseCoordinates = {
	x: null,
	y: null,
};

let startCoordinates = {
	x: null,
	y: null,
};

let startDirection = null;

let isDrawing = false;
let isShiftPressed = false;
let straightLineMode = false;

// При нажатии Shift
document.addEventListener('keydown', function (event) {
	if (event.key === 'Shift' && !isShiftPressed) {
		isShiftPressed = true;
		// Ставим начальные координаты при нажатии Shift для проведения прямой линии
		startCoordinates.x = mouseCoordinates.x;
		startCoordinates.y = mouseCoordinates.y;
		// Обнуляем начальное направление для определения при первом движении мыши
		startDirection = null;

		if (isDrawing) {
			straightLineMode = true;
		}
	}
});

// При отжатии Shift
document.addEventListener('keyup', function (event) {
	if (event.key === 'Shift') {
		isShiftPressed = false;
		startCoordinates.x = null;
		startCoordinates.y = null;
		straightLineMode = false;
	}
});

// При нажатии ЛКМ
drawingCanvas.onmousedown = function (event) {
	if (!isMyTurn) return;
	isDrawing = true; // Включает режим рисования
	updateMouseCoordinates(event); // Получаем координаты мыши

	// Если есть старые координаты мыши (то есть мы имеем дело не с точкой), то соединяем старую позицию с новой линией, чтобы была гладкая линия, а не точечная, что происходит при большой скорости движения мыши.
	if (isShiftPressed && oldMouseCoordinates.x !== null && oldMouseCoordinates.y !== null) {
		straightLineMode = true;
		drawingContext.beginPath();
		drawingContext.moveTo(oldMouseCoordinates.x, oldMouseCoordinates.y);
		drawingContext.lineTo(mouseCoordinates.x, mouseCoordinates.y);
		drawingContext.lineWidth = thicknessRange.value;
		drawingContext.strokeStyle = colorPicker.value;
		drawingContext.lineCap = 'round';
		drawingContext.stroke();

		// Сбрасываем направление, чтобы оно определялось при первом движении мыши после Shift
		startDirection = null;
	}
	//Если Shift не нажат, то рисуем простую точку
	else {
		straightLineMode = false;
		drawingContext.beginPath();
		drawingContext.arc(mouseCoordinates.x, mouseCoordinates.y, thicknessRange.value / 2, 0, 2 * Math.PI);
		drawingContext.fillStyle = colorPicker.value;
		drawingContext.fill();
	}
	// Сохраняем текущие координаты как старые, чтобы следующая линия шла от них
	oldMouseCoordinates.x = mouseCoordinates.x;
	oldMouseCoordinates.y = mouseCoordinates.y;
};

drawingCanvas.onmousemove = function (event) {
	if (!isMyTurn) return;
	updatePreviewMouseCoordinates(event);
	drawBrushPreview();
	if (isDrawing) {
		updateMouseCoordinates(event);
		showMouseInfo();

		drawingContext.beginPath();
		// В режиме ведения прямой линии
		if (straightLineMode) {
			if (!startDirection) {
				// Определяем направление при первом движении мыши после нажатия Shift
				startDirection = getDirection();
			}

			// Переходим на последнюю точку, чтобы соединить её с последующий для образования плавной линии
			drawingContext.moveTo(oldMouseCoordinates.x, oldMouseCoordinates.y);
			if (startDirection === 'right' || startDirection === 'left') {
				drawingContext.lineTo(mouseCoordinates.x, oldMouseCoordinates.y);
				oldMouseCoordinates.x = mouseCoordinates.x;
			} else if (startDirection === 'up' || startDirection === 'down') {
				drawingContext.lineTo(oldMouseCoordinates.x, mouseCoordinates.y);
				oldMouseCoordinates.y = mouseCoordinates.y;
			}
		}
		// В обычном режиме рисуем линию
		else {
			drawingContext.moveTo(oldMouseCoordinates.x, oldMouseCoordinates.y);
			drawingContext.lineTo(mouseCoordinates.x, mouseCoordinates.y);

			oldMouseCoordinates.x = mouseCoordinates.x;
			oldMouseCoordinates.y = mouseCoordinates.y;
		}

		drawingContext.lineWidth = thicknessRange.value;
		drawingContext.strokeStyle = colorPicker.value;
		drawingContext.lineCap = 'round';
		drawingContext.stroke();
	}
};

// Отключает рисование при отпускании ЛКМ
drawingCanvas.onmouseup = function () {
	isDrawing = false;
};

// Отключает рисование за пределами холста
drawingCanvas.onmouseleave = function () {
	isDrawing = false;
};

// Вмещает холст в окно при загрузке
window.onload = function () {
	setCanvasSize(drawingCanvas);
	setCanvasSize(previewCanvas);

	requestAnimationFrame(() => {
		setCanvasSize(drawingCanvas);
		setCanvasSize(previewCanvas);
	});
};

// Обновляет размер холста при расширении
window.onresize = function () {
	saveCanvasData();
	setCanvasSize(drawingCanvas);
	setCanvasSize(previewCanvas);
	loadCanvasData();
	//showCanvasInfo();
};

let canvases = document.querySelector('.canvases');

// Задаем пропорцию (например, 4:3)
const scaleFactor = {
	x: 16,
	y: 9,
};

const maxResolution = 4000;

// Функция для установки ширины и высоты холста
function setCanvasSize(canvas) {
	// Ширина холста равна 100% от ширины родительского блока
	let width = canvases.clientWidth;

	// Вычисляем высоту на основе пропорции
	let height = (scaleFactor.y / scaleFactor.x) * width;

	// Устанавливаем размеры через стили (для отображения в браузере)
	canvas.style.width = `${width}px`;
	canvas.style.height = `${height}px`;
	canvas.style.maxWidth = `${maxResolution}px`;
	canvas.style.maxHeight = `${maxResolution}px`;

	// Начальные реальные размеры для рисования
	let realWidth = scaleFactor.x * 500;
	let realHeight = scaleFactor.y * 500;

	// Проверяем, если одно из значений превышает максимальное разрешение
	if (realWidth > maxResolution || realHeight > maxResolution) {
		// Вычисляем коэффициент масштабирования
		let scaleFactorResolution = Math.min(maxResolution / realWidth, maxResolution / realHeight);

		// Масштабируем реальные размеры
		realWidth = realWidth * scaleFactorResolution;
		realHeight = realHeight * scaleFactorResolution;
	}

	// Устанавливаем атрибуты width и height (это реальные размеры холста для рисования)
	canvas.width = realWidth;
	canvas.height = realHeight;
}

function getMouseCoordinates(event, canvas) {
	const rect = canvas.getBoundingClientRect();

	// Определяем масштаб между реальными размерами холста и визуальными размерами
	const scaleX = canvas.width / rect.width; // Соотношение по ширине
	const scaleY = canvas.height / rect.height; // Соотношение по высоте
	let coordinates = new Object();
	coordinates.x = (event.clientX - rect.left) * scaleX; // Масштабируем координаты по X
	coordinates.y = (event.clientY - rect.top) * scaleY; // Масштабируем координаты по Y

	return coordinates;
}

// Обновить координаты
function updateMouseCoordinates(event) {
	mouseCoordinates = getMouseCoordinates(event, drawingCanvas);
}

function updatePreviewMouseCoordinates(event) {
	previewMouseCoordinates = getMouseCoordinates(event, previewCanvas);
}

// Получить направление движения мыши
function getDirection() {
	if (
		mouseCoordinates.x !== null &&
		mouseCoordinates.y !== null &&
		oldMouseCoordinates.x !== null &&
		oldMouseCoordinates.y !== null
	) {
		let xOffset = mouseCoordinates.x - oldMouseCoordinates.x;
		let yOffset = mouseCoordinates.y - oldMouseCoordinates.y;
		return Math.abs(xOffset) > Math.abs(yOffset) ? (xOffset > 0 ? 'right' : 'left') : yOffset > 0 ? 'down' : 'up';
	}
}

// Info
function showMouseInfo() {
	// mouseCoordinatesText.innerHTML = `Старые координаты мыши: ${oldMouseCoordinates.x}:${oldMouseCoordinates.y}\nКоординаты мыши: ${mouseCoordinates.x}:${mouseCoordinates.y}`;
	//directionText.innerHTML = getDirection();
}

function showCanvasInfo() {
	canvasWidth.innerHTML = `Ширина холста: ${drawingCanvas.clientWidth}`;
	canvasHeight.innerHTML = `Высота холста: ${drawingCanvas.clientHeight}`;
}

// Превью кисти
function drawBrushPreview() {
	previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
	previewContext.beginPath();
	previewContext.arc(previewMouseCoordinates.x, previewMouseCoordinates.y, thicknessRange.value / 2, 0, 2 * Math.PI);
	previewContext.fillStyle = 'transparent';
	previewContext.fill();
	let rgb = hexToRgb(colorPicker.value);
	let action = isColorCloserToBlackOrWhite(colorPicker.value);
	let color =
		action == 'white'
			? `rgb(${rgb.r - 50}, ${rgb.g - 50}, ${rgb.b - 50})`
			: `rgb(${rgb.r + 50}, ${rgb.g + 50}, ${rgb.b + 50})`;
	previewContext.strokeStyle = color;
	previewContext.stroke();
}

function hexToRgb(hex) {
	var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	hex = hex.replace(shorthandRegex, function (r, g, b) {
		return r + r + g + g + b + b;
	});

	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? {
				r: parseInt(result[1], 16),
				g: parseInt(result[2], 16),
				b: parseInt(result[3], 16),
		  }
		: null;
}

function isColorCloserToBlackOrWhite(color) {
	let result = hexToRgb(color);
	let brightness = 0.299 * result.r + 0.587 * result.g + 0.114 * result.b;
	const threshold = 127.5;
	return brightness > threshold ? 'white' : 'black';
}

//Загрузка и сохранение холста
let canvasData;

function saveCanvasData() {
	canvasData = drawingCanvas.toDataURL();
	localStorage.setItem('canvasData', canvasData);
}

const saveButton = document.querySelector('.button--save');

// saveButton.addEventListener('click', function () {
// 	// saveCanvasData();
// });

function loadCanvasData() {
	const img = new Image();
	img.src = localStorage.getItem('canvasData');
	img.onload = function () {
		drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height); // Очищаем холст
		drawingContext.drawImage(img, 0, 0);
	};
}

const loadButton = document.querySelector('.button--load');

// loadButton.addEventListener('click', function () {
// 	loadCanvasData();
// });

const saveToImageButton = document.querySelector('.button--save-to-image');
// saveToImageButton.addEventListener('click', function () {
// 	saveCanvasToImage();
// });

function saveCanvasToImage() {
	let savedImage = document.querySelector('.canvas__saved-image');
	savedImage.src = drawingCanvas.toDataURL();
	savedImage.style.display = 'block';
}

canvases.addEventListener('wheel', function (event) {
	event.preventDefault();
	if (!event.ctrlKey) return;
	let step = thicknessRange.getAttribute('max') / 20;
	if (event.deltaY < 0) {
		thicknessRange.value = +thicknessRange.value + step;
	} else if (event.deltaY > 0) {
		thicknessRange.value = +thicknessRange.value - step;
	}
	drawBrushPreview();
});

const socket = io();


const startGameButton = document.getElementById('startGameButton');
const playersList = document.getElementById('playersList');
const currentPlayer = document.getElementById('currentPlayer');
const timeLeft = document.getElementById('timeLeft');
let isMyTurn = false;

function updateCanvas(data) {
	const img = new Image();
	img.src = data;
	img.onload = () => {
		drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
		drawingContext.drawImage(img, 0, 0);
	};
}

// Подключаемся к игре
const playerName = prompt('Введите ваше имя:');
socket.emit('joinGame', playerName);

// Обновляем список игроков
socket.on('updatePlayers', (players) => {
	playersList.innerHTML = 'Игроки: ' + players.join(', ');
});

// Обновляем холст
socket.on('updateCanvas', (data) => {
	updateCanvas(data);
});

// Начало хода
socket.on('yourTurn', ({ time, canvasData }) => {
	isMyTurn = true;
	if (canvasData) updateCanvas(canvasData);

	let timeRemaining = time;
	const countdown = setInterval(() => {
		timeLeft.textContent = `Осталось времени: ${timeRemaining} секунд`;
		timeRemaining--;

		if (timeRemaining < 0 || !isMyTurn) {
			clearInterval(countdown);
			socket.emit('sendCanvasData', drawingCanvas.toDataURL());
			isMyTurn = false;
			console.log('Отправлено');
		}
	}, 1000);
});

// Конец хода
socket.on('endTurn', () => {
	isMyTurn = false;
	timeLeft.textContent = 'Ваш ход завершен';
});

// Обновляем информацию об игре
socket.on('gameInfo', ({ currentPlayer, currentIndex, totalPlayers }) => {
	currentPlayer.textContent = `Ход игрока: ${currentPlayer} (${currentIndex}/${totalPlayers})`;
});

// Окончание игры
socket.on('gameEnd', (finalCanvasData) => {
	updateCanvas(finalCanvasData);
	alert('Игра завершена! Смотрите итоговый рисунок.');
});

// Кнопка для начала игры
startGameButton.addEventListener('click', () => {
	socket.emit('startGame');
});

// Окончание игры
socket.on('gameStart', () => {
	drawingContext.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
});