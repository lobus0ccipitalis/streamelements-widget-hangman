const words = ["BERG", "PFAD", "HAUS", ...];
const GITHUB_ASSET_BASE = "https://raw.githubusercontent.com/lobus0ccipitalis/streamelements-widget-hangman/main/assets/";

let currentWord = "";
let fadeTimeout = null;
let guessedLetters = [];
let wrongGuesses = 0;
let gameActive = true;
const maxWrong = 12;
let lastCommandTime = 0;
const commandCooldown = 2000;

window.addEventListener('DOMContentLoaded', () => {
    const hangmanContainer = document.getElementById("hangman-container");
    const wordContainer = hangmanContainer.querySelector(".word-container");
    const gallowsContainer = hangmanContainer.querySelector(".gallows img");

    function startGame() {
        gameActive = true;
        guessedLetters = [];
        wrongGuesses = 0;

        const randomIndex = Math.floor(Math.random() * words.length);
        currentWord = words[randomIndex];

        const firstLetterIndex = Math.floor(Math.random() * currentWord.length);
        guessedLetters.push(currentWord[firstLetterIndex]);

        wordContainer.innerHTML = "";
        for (let i = 0; i < currentWord.length; i++) {
            const span = document.createElement("div");
            span.classList.add("word-space");

            const img = document.createElement("img");
            img.src = `${GITHUB_ASSET_BASE}word-space.png`;
            span.appendChild(img);

            const letter = document.createElement("span");
            letter.classList.add("word-letter");
            if (guessedLetters.includes(currentWord[i])) {
                letter.textContent = currentWord[i];
            }
            span.appendChild(letter);
            wordContainer.appendChild(span);
        }

        renderGallows();

        setTimeout(() => {
            wordContainer.querySelectorAll(".word-space").forEach(el => el.classList.add("show"));
            gallowsContainer.classList.add("show");
        }, 50);
    }

    function renderWord() {
        const spans = wordContainer.querySelectorAll(".word-space");
        spans.forEach((span, i) => {
            const letterSpan = span.querySelector(".word-letter");
            if (guessedLetters.includes(currentWord[i])) {
                letterSpan.textContent = currentWord[i];
            }
        });
    }

    function renderGallows() {
        const state = Math.min(wrongGuesses, maxWrong);
        gallowsContainer.src = `${GITHUB_ASSET_BASE}gallow-state-${state.toString().padStart(2,"0")}.png`;
    }

    function checkWin() {
        return currentWord.split("").every(l => guessedLetters.includes(l));
    }

    function sendBotMessage(msg) {
        if (window.SeElements) {
            window.SeElements.call("sendMessage", msg);
        }
    }

    function endGameFade(callback) {
        wordContainer.querySelectorAll(".word-space").forEach(el => el.classList.remove("show"));
        gallowsContainer.classList.remove("show");

        setTimeout(() => {
            callback();
        }, 1500);
    }

    window.addEventListener('onEventReceived', function(obj) {
        const data = obj.detail;
        if (data.listener !== "message") return;

        if (!gameActive) return;

        const text = (data.event.data?.text || data.event.text || "").trim().toUpperCase();
        if (!text.startsWith("!HANGMAN ")) return;

        const now = Date.now();
        if (now - lastCommandTime < commandCooldown) return;
        lastCommandTime = now;

        const parts = text.split(/\s+/);
        const letter = parts[1]?.substring(0,1);
        if (!letter || !/^[A-Z]$/.test(letter)) return;

        if (guessedLetters.includes(letter)) return;

        guessedLetters.push(letter);

        if (currentWord.includes(letter)) {
            renderWord();
            if (checkWin()) {
                sendBotMessage(`Gewonnen! Das Wort war: ${currentWord}`);
                gameActive = false;
                if (fadeTimeout) clearTimeout(fadeTimeout);
                fadeTimeout = setTimeout(() => {
                    endGameFade(() => startGame());
                }, 2000);
            }
        } else {
            wrongGuesses++;
            renderGallows();
            if (wrongGuesses >= maxWrong) {
                sendBotMessage(`Game Over! Das Wort war: ${currentWord}`);
                gameActive = false;
                if (fadeTimeout) clearTimeout(fadeTimeout);
                fadeTimeout = setTimeout(() => {
                    endGameFade(() => startGame());
                }, 2000);
            }
        }
    });

    startGame();
});
