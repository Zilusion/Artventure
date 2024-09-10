const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Храним подключенных игроков и их ходы
let players = [];
let currentPlayerIndex = 0;
let currentRound = 0;
let timer = null;
const roundTime = 10; // Время на ход в секундах
let currentCanvasData = null;
let gameInProgress = false;

// Сервируем статические файлы
app.use(express.static(path.join(__dirname, '../../public')));

// Главная страница
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../../public/pages/index.html'));
});

// Начало игры
function startGame() {
	if (players.length === 0) return;
	gameInProgress = true;
	currentPlayerIndex = 0;
	currentRound = 0;
	currentCanvasData = null;
	io.emit('gameStart');
	startTurn();
}

// Начать ход игрока
function startTurn() {
	if (currentPlayerIndex >= players.length) {
		//endGame();
		return;
	}

	const player = players[currentPlayerIndex];
	io.to(player.id).emit('yourTurn', { time: roundTime, canvasData: currentCanvasData });
	io.emit('gameInfo', {
		currentPlayer: player.name,
		currentIndex: currentPlayerIndex + 1,
		totalPlayers: players.length,
	});

	timer = setTimeout(() => {
		// Заканчиваем ход игрока
		io.to(player.id).emit('endTurn');
		currentPlayerIndex++;
		startTurn();
	}, roundTime * 1000);
}

// Закончить игру
function endGame() {
	clearTimeout(timer);
	io.emit('gameEnd', currentCanvasData);

	// Сохранение итогового изображения
	if (currentCanvasData) {
		const imageBuffer = Buffer.from(currentCanvasData.split(',')[1], 'base64');
		const imagePath = path.join(__dirname, '../../public/images/output', `final-image-${Date.now()}.png`);
		fs.writeFileSync(imagePath, imageBuffer);
	}
	gameInProgress = false;
}

// Подключение клиента
io.on('connection', (socket) => {
	console.log(`Игрок подключился: ${socket.id}`);

	socket.on('joinGame', (name) => {
		if (!gameInProgress) {
			players.push({ id: socket.id, name });
			io.emit(
				'updatePlayers',
				players.map((player) => player.name)
			);
			console.log(`Текущие игроки:`);
			for (let index = 0; index < players.length; index++) {
				console.log(players[index]);
			}
		}

		socket.emit('gameInfo', {
			currentPlayerIndex: currentPlayerIndex + 1,
			totalPlayers: players.length,
			gameInProgress,
		});
	});

	socket.on('sendCanvasData', (data) => {
		currentCanvasData = data;
		io.emit('updateCanvas', currentCanvasData);
		console.log('Данные получены');

		if (currentPlayerIndex >= players.length) {
			endGame(); 
		} 
	});

	socket.on('disconnect', () => {
		console.log(`Игрок отключился: ${socket.id}`);
		console.log(`Текущие игроки: ${players.forEach(console.log)}`);
		players = players.filter((player) => player.id !== socket.id);
		io.emit(
			'updatePlayers',
			players.map((player) => player.name)
		);

		if (players.length === 0) {
			clearTimeout(timer);
			gameInProgress = false;
		}
		console.log(`Текущие игроки:`);
		for (let index = 0; index < players.length; index++) {
			console.log(players[index]);
		}
	});

	socket.on('startGame', () => {
		if (!gameInProgress && players.length > 0) {
			startGame();
		}
	});
});

server.listen(PORT, () => {
	console.log(`Сервер запущен на порту ${PORT}`);
});