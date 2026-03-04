interface Card {
    id: number;
    value: string;
    image: string;
    flipped: boolean;
    matched: boolean;
}

class MemoryGame {
    private board = document.getElementById("game-board")!;
    private timeElement = document.getElementById("time")!;
    private scoreElement = document.getElementById("score")!;
    private bestScoreElement = document.getElementById("best-score")!;

    private cards: Card[] = [];
    private flippedCards: Card[] = [];
    private score = 0;
    private bestScore = 0;
    private lockBoard = false;
    private timeLeft = 60;
    private timerInterval: number | null = null;

    constructor() {
        this.bestScore = Number(localStorage.getItem("bestScore")) || 0;
        this.bestScoreElement.textContent = this.bestScore.toString();
        this.init();
    }

    async init() {
        console.log("Game starting...");
        const pokemonCards = await this.fetchPokemonCards();
        this.createCards(pokemonCards);
        this.shuffleCards();
        this.renderCards();
        this.startTimer();
    }

    async fetchPokemonCards() {
        const id = Array.from({ length: 8 }, () => Math.floor(Math.random() * 151) + 1);

        const responses = await Promise.all(
            id.map((id) => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
            )
        );
        
        const data = await Promise.all(responses.map((res) => res.json()));
        return data.map((pokemon) => ({
            name: pokemon.name,
            image: pokemon.sprites.front_default,
        }));
    }

    createCards(pokemonCards: any[]) {
        const duplicatedCards = [...pokemonCards, ...pokemonCards];
        this.cards = duplicatedCards.map((pokemon, index) => ({
            id: index,
            value: pokemon.name,
            image: pokemon.image,
            flipped: false,
            matched: false,
        }));
    }

    shuffleCards() {
        this.cards.sort(() => Math.random() - 0.5);
    }

    renderCards() {
        this.board.innerHTML = "";
        this.cards.forEach((card) => {
            const cardElement = document.createElement("div");
            cardElement.className = "card";
            cardElement.innerHTML = `
                <div class="card-inner">
                    <div class="card-front">?</div>
                    <div class="card-back">
                        <img src="${card.image}" alt="${card.value}" />
                    </div>
                </div>
            `;

            cardElement.addEventListener("click", () => this.flipCard(card, cardElement));
            this.board.appendChild(cardElement);
        });
    }

    flipCard(card: Card, cardElement: HTMLElement) {
        if (this.lockBoard || card.flipped || card.matched) return;

        card.flipped = true;
        cardElement.classList.add("flipped");
        this.flippedCards.push(card);

        if (this.flippedCards.length === 2) {
            this.checkForMatch();
        }
    }

    checkForMatch() {
        const [firstCard, secondCard] = this.flippedCards;
        this.lockBoard = true;

        if (firstCard.value === secondCard.value) {   
            firstCard.matched = true;
            secondCard.matched = true;
            this.score++;
            this.updateScore();
            this.resetTurn();
        }
        else {
            setTimeout(() => {
                this.cards.forEach((c, i) => {
                    if (!c.matched) {
                        const cardElement = this.board.children[i] as HTMLElement;
                        cardElement.classList.remove("flipped");
                        c.flipped = false;
                    }
                });
                this.resetTurn();
            }, 1000);
        }
    }

    updateScore() { 
        this.scoreElement.textContent = this.score.toString();
    }

    resetTurn() {
        this.flippedCards = [];
        this.lockBoard = false;

        const allMatched = this.cards.every(card => card.matched);

        if (allMatched) {
            setTimeout(() => this.win(), 500); 
        }
    }

    win() {
        if (this.timerInterval) clearInterval(this.timerInterval);  

        this.score += this.timeLeft;
        this.updateScore();
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem("bestScore", this.bestScore.toString());
            this.bestScoreElement.textContent = this.bestScore.toString();
        }

        alert(`You Win! Your score: ${this.score}`);
        this.resetGame();
        }

    startTimer() {
        this.timeElement.textContent = this.formatTime(this.timeLeft);  
        this.timerInterval = window.setInterval(() => {
            this.timeLeft--;
            this.timeElement.textContent = this.formatTime(this.timeLeft);
            
            if (this.timeLeft <= 0) {
                this.gameOver();
            }
        }, 1000);
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        
        const formattedMins = mins < 10 ? `0${mins}` : mins.toString();
        const formattedSecs = secs < 10 ? `0${secs}` : secs.toString();

        return `${formattedMins}:${formattedSecs}`;
    }

    gameOver() {
        if (this.timerInterval) clearInterval(this.timerInterval);

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem("bestScore", this.bestScore.toString());
            this.bestScoreElement.textContent = this.bestScore.toString();
        }

        alert("Game Over! Time's up!");
        this.resetGame();
    }

    resetGame() {
        this.timeLeft = 60;
        this.score = 0;
        this.cards = [];
        this.flippedCards = [];
        this.board.innerHTML = "";
        this.updateScore(); 
        this.init();
    }
}

new MemoryGame();
