"use strict";
class Player {
    constructor(name) {
        this.name = name;
        this.score = 0;
        this.numbers = {
            "20": 0,
            "19": 0,
            "18": 0,
            "17": 0,
            "16": 0,
            "15": 0,
            "B": 0,
        };
    }
    updateScore(points) {
        this.score += points;
    }
    updateNumber(number, hits) {
        if (this.numbers.hasOwnProperty(number)) {
            this.numbers[number] = Math.min(this.numbers[number] + hits, 3);
        }
    }
}
class Game {
    constructor(playerNames) {
        this.history = [];
        this.players = playerNames.map((name) => new Player(name));
        this.currentPlayerIndex = 0;
        this.history = [];
        this.historyIndex = -1;
    }
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }
    nextPlayer() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }
    addScore(number, hits) {
        const currentPlayer = this.getCurrentPlayer();
        currentPlayer.updateNumber(number, hits);
        if (currentPlayer.numbers[number] === 3) {
            this.players.forEach((player, index) => {
                if (player !== currentPlayer && player.numbers[number] < 3) {
                    const points = isNaN(parseInt(number)) ? hits * 25 : parseInt(number) * hits;
                    player.updateScore(points);
                }
            });
        }
        this.addToHistory("add", number, hits);
        this.nextPlayer();
    }
    undo() {
        if (this.historyIndex < 0)
            return;
        const action = this.history[this.historyIndex];
        const player = this.players[action.playerIndex];
        if (action.action === "add") {
            player.updateScore(-action.points);
        }
        this.historyIndex--;
    }
    redo() {
        if (this.historyIndex >= this.history.length - 1)
            return;
        this.historyIndex++;
        const action = this.history[this.historyIndex];
        const player = this.players[action.playerIndex];
        if (action.action === "add") {
            player.updateScore(action.points);
        }
    }
    getWinner() {
        for (const player of this.players) {
            let allNumbersClosed = true;
            for (const number in player.numbers) {
                if (player.numbers[number] < 3) {
                    allNumbersClosed = false;
                    break;
                }
            }
            if (allNumbersClosed) {
                const lowestScore = Math.min(...this.players.map((p) => p.score));
                if (player.score === lowestScore) {
                    return player;
                }
            }
        }
        return null;
    }
    addToHistory(action, number, hits) {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push({
            action,
            playerIndex: this.currentPlayerIndex,
            number,
            hits,
        });
        this.historyIndex++;
    }
}
class UI {
    constructor() {
        this.game = null;
        this.setupEventListeners();
    }
    setupEventListeners() {
        // Player registration form
        const playerRegistrationForm = document.getElementById("player-registration-form");
        playerRegistrationForm.addEventListener("submit", this.handlePlayerRegistration.bind(this));
        // Number input form
        const numberInputForm = document.getElementById("number-input-form");
        numberInputForm.addEventListener("submit", this.handleNumberInput.bind(this));
    }
    handlePlayerRegistration(event) {
        event.preventDefault();
        const form = event.target;
        const names = [];
        for (let i = 1; i <= 4; i++) {
            const input = form.elements.namedItem(`player${i}`);
            if (input.value.trim() !== "") {
                names.push(input.value.trim());
            }
        }
        if (names.length >= 2) {
            this.game = new Game(names);
            this.updateScoreboard();
        }
        else {
            alert("Please enter at least 2 player names.");
        }
    }
    handleUndo() {
        if (!this.game)
            return;
        this.game.undo();
        this.updateScoreboard();
    }
    handleRedo() {
        if (!this.game)
            return;
        this.game.redo();
        this.updateScoreboard();
    }
    handleNewGame() {
        this.showPlayerSetup();
    }
    showPlayerSetup() {
        var _a, _b, _c;
        (_a = document.querySelector(".player-setup")) === null || _a === void 0 ? void 0 : _a.setAttribute("style", "display: block;");
        (_b = document.querySelector(".gameboard")) === null || _b === void 0 ? void 0 : _b.setAttribute("style", "display: none;");
        (_c = document.querySelector(".game-over")) === null || _c === void 0 ? void 0 : _c.setAttribute("style", "display: none;");
    }
    showGameBoard() {
        var _a, _b, _c;
        (_a = document.querySelector(".player-setup")) === null || _a === void 0 ? void 0 : _a.setAttribute("style", "display: none;");
        (_b = document.querySelector(".gameboard")) === null || _b === void 0 ? void 0 : _b.setAttribute("style", "display: block;");
        (_c = document.querySelector(".game-over")) === null || _c === void 0 ? void 0 : _c.setAttribute("style", "display: none;");
    }
    showGameOver(winner) {
        var _a, _b, _c;
        const winnerMessage = document.getElementById("winner-message");
        winnerMessage.textContent = `${winner.name} wins with ${winner.score} points!`;
        (_a = document.querySelector(".player-setup")) === null || _a === void 0 ? void 0 : _a.setAttribute("style", "display: none;");
        (_b = document.querySelector(".gameboard")) === null || _b === void 0 ? void 0 : _b.setAttribute("style", "display: none;");
        (_c = document.querySelector(".game-over")) === null || _c === void 0 ? void 0 : _c.setAttribute("style", "display: block;");
    }
    updateScoreboard() {
        if (!this.game)
            return;
        const scoreboard = document.querySelector(".scoreboard");
        if (!scoreboard)
            return;
        scoreboard.innerHTML = "";
        this.game.players.forEach((player, index) => {
            const playerScore = document.createElement("div");
            playerScore.classList.add("player-score");
            const playerName = document.createElement("h3");
            playerName.textContent = player.name;
            playerScore.appendChild(playerName);
            const playerPoints = document.createElement("p");
            playerPoints.textContent = `Points: ${player.score}`;
            playerScore.appendChild(playerPoints);
            const playerNumbers = document.createElement("div");
            playerNumbers.classList.add("player-numbers");
            for (const number in player.numbers) {
                const numberElement = document.createElement("span");
                numberElement.classList.add("player-number");
                numberElement.textContent = `${number}: ${player.numbers[number]}`;
                playerNumbers.appendChild(numberElement);
            }
            playerScore.appendChild(playerNumbers);
            scoreboard.appendChild(playerScore);
        });
        const winner = this.game.getWinner();
        if (winner) {
            this.showWinnerModal(winner.name);
            this.game = null;
        }
    }
    showWinnerModal(winnerName) {
        const winnerModal = document.getElementById("winner-modal");
        const winnerMessage = document.getElementById("winner-message");
        const modalClose = document.getElementById("modal-close");
        winnerMessage.textContent = `${winnerName} wins!`;
        winnerModal.classList.remove("hidden");
        modalClose.onclick = () => {
            winnerModal.classList.add("hidden");
            this.game = null;
        };
        window.onclick = (event) => {
            if (event.target === winnerModal) {
                winnerModal.classList.add("hidden");
                this.game = null;
            }
        };
    }
    handleNumberInput(event) {
        event.preventDefault();
        const form = event.target;
        const numberSelect = form.elements.namedItem("number");
        const hitsSelect = form.elements.namedItem("hits");
        const number = numberSelect.value;
        const hits = parseInt(hitsSelect.value);
        if (this.game) {
            this.game.addScore(number, hits);
            this.updateScoreboard();
        }
    }
}
// Initialize the UI
new UI();
