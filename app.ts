interface Card {
    id: number;
    value: string;
    image: string;
    flipped: boolean;
    matched: boolean;
}

class MemoryGame {
    private board = document.getElementById("game-board")!;
    private scoreElement = document.getElementById("score")!;
    private bestScoreElement = document.getElementById("best-score")!;

    private cards: Card[] = [];
    private flippedCards: Card[] = [];
    private score = 0;
    private bestScore = 0;
    private lockBoard = false;

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
        alert(`You Win!`);   
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem("bestScore", this.bestScore.toString());
        }
        location.reload();
        }
}

new MemoryGame();
