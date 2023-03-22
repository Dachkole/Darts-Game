class Player {
    name: string;
    score: number;
    numbers: { [key: string]: number };

    constructor(name: string) {
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

    updateScore(points: number): void {
        this.score += points;
    }

    updateNumber(number: string, hits: number): void {
        if (this.numbers.hasOwnProperty(number)) {
            this.numbers[number] = Math.min(this.numbers[number] + hits, 3);
        }
    }
}


class Game {
    players: Player[];
    currentPlayerIndex: number;
    history: any[] = [];
    historyIndex: number;

    constructor(playerNames: string[]) {
        this.players = playerNames.map((name) => new Player(name));
        this.currentPlayerIndex = 0;
        this.history = [];
        this.historyIndex = -1;
    }

    getCurrentPlayer(): Player {
        return this.players[this.currentPlayerIndex];
    }

    nextPlayer(): void {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    addScore(number: string, hits: number): void {
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

    undo(): void {
        if (this.historyIndex < 0) return;

        const action = this.history[this.historyIndex];
        const player = this.players[action.playerIndex];

        if (action.action === "add") {
            player.updateScore(-action.points);
        }

        this.historyIndex--;
    }

    redo(): void {
        if (this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        const action = this.history[this.historyIndex];
        const player = this.players[action.playerIndex];

        if (action.action === "add") {
            player.updateScore(action.points);
        }
    }

    getWinner(): Player | null {
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

    private addToHistory(action: string, number: string, hits: number): void {
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
    private game: Game | null;

    constructor() {
        this.game = null;
        this.setupEventListeners();
    }

    private setupEventListeners(): void {
        // Player registration form
        const playerRegistrationForm = document.getElementById("player-registration-form") as HTMLFormElement;
        playerRegistrationForm.addEventListener("submit", this.handlePlayerRegistration.bind(this));

        // Number input form
        const numberInputForm = document.getElementById("number-input-form") as HTMLFormElement;
        numberInputForm.addEventListener("submit", this.handleNumberInput.bind(this));
    }

    private handlePlayerRegistration(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const names: string[] = [];
        for (let i = 1; i <= 4; i++) {
            const input = form.elements.namedItem(`player${i}`) as HTMLInputElement;
            if (input.value.trim() !== "") {
                names.push(input.value.trim());
            }
        }

        if (names.length >= 2) {
            this.game = new Game(names);
            this.updateScoreboard();
        } else {
            alert("Please enter at least 2 player names.");
        }
    }

    private handleUndo(): void {
        if (!this.game) return;
        this.game.undo();
        this.updateScoreboard();
    }

    private handleRedo(): void {
        if (!this.game) return;
        this.game.redo();
        this.updateScoreboard();
    }

    private handleNewGame(): void {
        this.showPlayerSetup();
    }

    private showPlayerSetup(): void {
        document.querySelector(".player-setup")?.setAttribute("style", "display: block;");
        document.querySelector(".gameboard")?.setAttribute("style", "display: none;");
        document.querySelector(".game-over")?.setAttribute("style", "display: none;");
    }

    private showGameBoard(): void {
        document.querySelector(".player-setup")?.setAttribute("style", "display: none;");
        document.querySelector(".gameboard")?.setAttribute("style", "display: block;");
        document.querySelector(".game-over")?.setAttribute("style", "display: none;");
    }

    private showGameOver(winner: Player): void {
        const winnerMessage = document.getElementById("winner-message") as HTMLParagraphElement;
        winnerMessage.textContent = `${winner.name} wins with ${winner.score} points!`;

        document.querySelector(".player-setup")?.setAttribute("style", "display: none;");
        document.querySelector(".gameboard")?.setAttribute("style", "display: none;");
        document.querySelector(".game-over")?.setAttribute("style", "display: block;");
    }

    private updateScoreboard(): void {
        if (!this.game) return;

        const scoreboard = document.querySelector(".scoreboard");
        if (!scoreboard) return;
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

    private showWinnerModal(winnerName: string): void {
        const winnerModal = document.getElementById("winner-modal") as HTMLDivElement;
        const winnerMessage = document.getElementById("winner-message") as HTMLParagraphElement;
        const modalClose = document.getElementById("modal-close") as HTMLSpanElement;
    
        winnerMessage.textContent = `${winnerName} wins!`;
        winnerModal.classList.remove("hidden");
    
        modalClose.onclick = () => {
          winnerModal.classList.add("hidden");
          this.game = null;
        };
    
        window.onclick = (event: MouseEvent) => {
          if (event.target === winnerModal) {
            winnerModal.classList.add("hidden");
            this.game = null;
          }
        };
      }


    private handleNumberInput(event: Event): void {
        event.preventDefault();
        const form = event.target as HTMLFormElement;
        const numberSelect = form.elements.namedItem("number") as HTMLSelectElement;
        const hitsSelect = form.elements.namedItem("hits") as HTMLSelectElement;

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
