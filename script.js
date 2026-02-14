// ========================================
// GLOBAL FUNCTIONS (must be defined early for onclick handlers)
// ========================================
window.startJourney = function() {
    console.log('startJourney called!');
    // Start the first game (Connections)
    if (typeof goToSection === 'function') {
        goToSection(1);
    } else {
        console.error('goToSection is not defined yet');
    }
}

console.log('Script loaded! startJourney is:', typeof window.startJourney);

// ========================================
// STATE MANAGEMENT
// ========================================
let gameState = {
    currentSection: 0,
    connectionsComplete: false,
    strandsComplete: false,
    wordleComplete: false,
    cardsScratched: [false, false, false]
};

// ========================================
// CONNECTIONS GAME DATA
// ========================================
const connectionsData = {
    categories: [
        {
            name: "Faith's Favorite Foods",
            words: ["Miso", "Ramen", "Dumplings", "Salmon"],
            difficulty: 1,
            found: false
        },
        {
            name: "Places We've Traveled To",
            words: ["New York City", "Asheville", "Knoxville", "Gatlinburg"],
            difficulty: 2,
            found: false
        },
        {
            name: "Famous People We Like",
            words: ["Ramsay", "Monet", "Renzema", "Chalamet"],
            difficulty: 3,
            found: false
        },
        {
            name: "Stinkle",
            words: ["Farts", "Onions", "Guacamole", "Armpits"],
            difficulty: 4,
            found: false
        }
    ],
    selectedWords: [],
    hearts: 4,
    allWords: []
};

// ========================================
// STRANDS GAME DATA
// ========================================
const strandsData = {
    targetWords: ["ESPRESSO", "LATTE", "POUROVER", "ARABICA", "MUG", "GRINDER", "COFFEETIME"],
    foundWords: [],
    // 8 rows × 6 columns = 48 squares
    // Custom grid layout designed by user
    grid: [
        ['R', 'S', 'C', 'O', 'L', 'T'],
        ['E', 'P', 'E', 'F', 'A', 'T'],
        ['S', 'O', 'F', 'C', 'I', 'E'],
        ['S', 'E', 'A', 'G', 'A', 'B'],
        ['E', 'R', 'E', 'I', 'R', 'R'],
        ['V', 'P', 'T', 'N', 'D', 'A'],
        ['O', 'O', 'I', 'E', 'R', 'U'],
        ['R', 'U', 'M', 'E', 'M', 'G']
    ],
    currentSelection: [],
    isSelecting: false,
    isDragging: false,
    clickedSelectedCell: false,
    clickedCell: null
};

// ========================================
// WORDLE GAME DATA
// ========================================
const wordleData = {
    solution: "MOAKS",
    currentRow: 0,
    currentCol: 0,
    gameOver: false,
    keyboard: [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACK']
    ],
    guesses: [],
    keyStates: {}
};

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    initFloatingHearts();
    loadGameState();
    updateHomeScreen();
    updateNavMenu();
    initConnections();
    initStrands();
    initWordle();
    initScratchCards();
});

// ========================================
// FLOATING HEARTS BACKGROUND
// ========================================
function initFloatingHearts() {
    const container = document.getElementById('heartsBackground');
    setInterval(() => {
        if (Math.random() > 0.7) {
            const heart = document.createElement('div');
            heart.className = 'heart-float';
            heart.innerHTML = '💕';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.animationDuration = (Math.random() * 4 + 6) + 's';
            heart.style.fontSize = (Math.random() * 20 + 15) + 'px';
            container.appendChild(heart);

            setTimeout(() => heart.remove(), 8000);
        }
    }, 500);
}

// ========================================
// NAVIGATION
// ========================================
window.playGame = function(gameIndex) {
    const cardEl = document.getElementById(`gameCard${gameIndex}`);

    // Don't allow clicking locked cards
    if (cardEl.classList.contains('locked')) {
        return;
    }

    goToSection(gameIndex);
}

window.toggleNav = function() {
    const navItems = document.getElementById('navItems');
    navItems.classList.toggle('active');
}

function goToSection(sectionIndex) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => section.classList.remove('active'));

    const sectionIds = ['home', 'connections', 'strands', 'wordle', 'card1'];
    const targetSection = document.getElementById(sectionIds[sectionIndex]);

    if (targetSection) {
        targetSection.classList.add('active');
        gameState.currentSection = sectionIndex;
        saveGameState();
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Close nav menu if open
        const navItems = document.getElementById('navItems');
        navItems.classList.remove('active');

        // Show/hide nav menu (hide on home screen)
        const navMenu = document.getElementById('navMenu');
        navMenu.style.display = sectionIndex === 0 ? 'none' : 'block';

        // Update nav menu items
        updateNavMenu();
    }
}

function updateNavMenu() {
    const navItems = document.getElementById('navItems');
    navItems.innerHTML = '';

    // Always add Home button
    const homeBtn = document.createElement('button');
    homeBtn.className = 'nav-item';
    homeBtn.innerHTML = '<i class="bi bi-house-heart-fill"></i> Home';
    homeBtn.onclick = () => goToSection(0);
    navItems.appendChild(homeBtn);

    // Add unlocked/completed games based on progression
    const games = [
        { index: 1, name: 'Connections', icon: 'bi-grid-3x3-gap-fill', unlocked: true, completed: gameState.connectionsComplete },
        { index: 2, name: 'Strands', icon: 'bi-search-heart', unlocked: gameState.connectionsComplete, completed: gameState.strandsComplete },
        { index: 3, name: 'Wordle', icon: 'bi-alphabet', unlocked: gameState.strandsComplete, completed: gameState.wordleComplete },
        { index: 4, name: 'Surprises', icon: 'bi-gift-fill', unlocked: gameState.wordleComplete, completed: gameState.cardsScratched.some(c => c) }
    ];

    games.forEach(game => {
        // Only show games that are unlocked (previous game completed)
        if (game.unlocked) {
            const btn = document.createElement('button');
            btn.className = 'nav-item';
            btn.innerHTML = `<i class="bi ${game.icon}"></i> ${game.name}`;
            btn.onclick = () => goToSection(game.index);
            navItems.appendChild(btn);
        }
    });
}

function updateHomeScreen() {
    const journeyBtn = document.getElementById('startJourneyBtn');
    const gameCardsGrid = document.getElementById('gameCardsGrid');

    // Always show the journey button
    if (journeyBtn) {
        journeyBtn.style.display = 'inline-flex';
    }

    // Update game card states based on progress
    const cards = [
        { id: 1, completed: gameState.connectionsComplete, unlocked: true },
        { id: 2, completed: gameState.strandsComplete, unlocked: gameState.connectionsComplete },
        { id: 3, completed: gameState.wordleComplete, unlocked: gameState.strandsComplete },
        { id: 4, completed: gameState.cardsScratched.some(c => c), unlocked: gameState.wordleComplete }
    ];

    cards.forEach(card => {
        const cardEl = document.getElementById(`gameCard${card.id}`);
        const statusEl = document.getElementById(`status${card.id}`);
        const lockOverlay = cardEl.querySelector('.lock-overlay');

        if (card.completed) {
            cardEl.classList.remove('locked');
            cardEl.classList.add('completed');
            if (lockOverlay) lockOverlay.style.display = 'none';
            statusEl.innerHTML = '<i class="bi bi-check-circle-fill"></i> Completed';
        } else if (card.unlocked) {
            cardEl.classList.remove('locked');
            if (lockOverlay) lockOverlay.style.display = 'none';
            if (card.id === 1) {
                statusEl.innerHTML = '<i class="bi bi-play-circle-fill"></i> Start Here!';
            } else {
                statusEl.innerHTML = '<i class="bi bi-play-circle-fill"></i> Play Now';
            }
        } else {
            cardEl.classList.add('locked');
            if (lockOverlay) lockOverlay.style.display = 'flex';
            statusEl.innerHTML = '<i class="bi bi-lock-fill"></i> Locked';
        }
    });
}

// ========================================
// LOCAL STORAGE
// ========================================
function saveGameState() {
    localStorage.setItem('valentineGameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('valentineGameState');
    if (saved) {
        const loadedState = JSON.parse(saved);
        gameState = { ...gameState, ...loadedState };
        // Only restore section if user has made progress (not on home screen)
        if (loadedState.currentSection > 0) {
            goToSection(gameState.currentSection);
        }
    }
}

// ========================================
// MODAL
// ========================================
function showModal(message) {
    const modal = document.getElementById('messageModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('messageModal');
    modal.classList.remove('active');
}

// ========================================
// CONNECTIONS GAME
// ========================================
function initConnections() {
    // Flatten all words and shuffle
    connectionsData.allWords = connectionsData.categories.flatMap(cat =>
        cat.words.map(word => ({ word, category: cat.name }))
    );
    shuffleArray(connectionsData.allWords);
    renderConnectionsGrid();
}

function renderConnectionsGrid() {
    const grid = document.getElementById('connectionsGrid');
    grid.innerHTML = '';

    connectionsData.allWords.forEach(item => {
        const button = document.createElement('button');
        button.className = 'word-button';
        button.textContent = item.word;
        button.onclick = () => selectWord(item.word);
        grid.appendChild(button);
    });
}

function selectWord(word) {
    const button = Array.from(document.querySelectorAll('.word-button'))
        .find(btn => btn.textContent === word);

    if (!button || button.classList.contains('found')) return;

    if (connectionsData.selectedWords.includes(word)) {
        connectionsData.selectedWords = connectionsData.selectedWords.filter(w => w !== word);
        button.classList.remove('selected');
    } else {
        if (connectionsData.selectedWords.length < 4) {
            connectionsData.selectedWords.push(word);
            button.classList.add('selected');
        }
    }

    updateSubmitButton();
}

function updateSubmitButton() {
    const btn = document.getElementById('submitConnectionsBtn');
    btn.disabled = connectionsData.selectedWords.length !== 4;
}

function deselectAll() {
    connectionsData.selectedWords = [];
    document.querySelectorAll('.word-button.selected').forEach(btn => {
        btn.classList.remove('selected');
    });
    updateSubmitButton();
}

function shuffleWords() {
    shuffleArray(connectionsData.allWords);
    renderConnectionsGrid();

    // Restore selections
    connectionsData.selectedWords.forEach(word => {
        const button = Array.from(document.querySelectorAll('.word-button'))
            .find(btn => btn.textContent === word);
        if (button) button.classList.add('selected');
    });
}

function submitConnections() {
    const selected = connectionsData.selectedWords;

    // Check if selected words form a category
    const category = connectionsData.categories.find(cat =>
        !cat.found && selected.every(word => cat.words.includes(word)) &&
        cat.words.every(word => selected.includes(word))
    );

    if (category) {
        // Correct!
        category.found = true;
        showCategoryFound(category);
        deselectAll();

        // Check if all categories found
        if (connectionsData.categories.every(cat => cat.found)) {
            setTimeout(() => {
                document.getElementById('connectionsNext').style.display = 'block';
                gameState.connectionsComplete = true;
                saveGameState();
                updateHomeScreen();
                updateNavMenu();
                createConfetti();
            }, 1000);
        }
    } else {
        // Incorrect
        connectionsData.hearts--;
        updateHearts();
        shakeSelectedWords();

        if (connectionsData.hearts <= 0) {
            showModal("Because I love you, I'll give you my hearts 💕");
            connectionsData.hearts = 4;
            updateHearts();
        }

        setTimeout(deselectAll, 600);
    }
}

function showCategoryFound(category) {
    const container = document.getElementById('foundCategories');
    const banner = document.createElement('div');
    banner.className = 'category-banner';
    banner.innerHTML = `
        <div class="category-name">${category.name}</div>
        <div class="category-words">${category.words.join(', ')}</div>
    `;
    container.appendChild(banner);

    // Remove found words from the allWords array
    connectionsData.allWords = connectionsData.allWords.filter(
        item => !category.words.includes(item.word)
    );

    // Re-render the grid without the found words
    renderConnectionsGrid();
}

function updateHearts() {
    const container = document.getElementById('connectionsHearts');
    const hearts = container.querySelectorAll('i');
    hearts.forEach((heart, index) => {
        if (index >= connectionsData.hearts) {
            heart.classList.add('lost');
        } else {
            heart.classList.remove('lost');
        }
    });
}

function shakeSelectedWords() {
    document.querySelectorAll('.word-button.selected').forEach(btn => {
        btn.classList.add('shake');
        setTimeout(() => btn.classList.remove('shake'), 500);
    });
}

// ========================================
// STRANDS GAME
// ========================================
function initStrands() {
    renderStrandsGrid();
    setupStrandsInteraction();
}

function renderStrandsGrid() {
    const grid = document.getElementById('strandsGrid');
    grid.innerHTML = '';

    strandsData.grid.forEach((row, rowIndex) => {
        row.forEach((letter, colIndex) => {
            const button = document.createElement('button');
            button.className = 'letter-button';
            button.textContent = letter;
            button.dataset.row = rowIndex;
            button.dataset.col = colIndex;
            grid.appendChild(button);
        });
    });
}

function setupStrandsInteraction() {
    const grid = document.getElementById('strandsGrid');

    // Click to toggle cell selection
    grid.addEventListener('click', handleStrandsCellClick);
}

function handleStrandsCellClick(e) {
    const target = e.target.closest('.letter-button');
    if (!target || target.classList.contains('found')) return;

    const row = parseInt(target.dataset.row);
    const col = parseInt(target.dataset.col);

    // Check if this cell is already selected
    const existingIndex = strandsData.currentSelection.findIndex(
        s => s.row === row && s.col === col
    );

    if (existingIndex !== -1) {
        // Deselect this cell
        strandsData.currentSelection.splice(existingIndex, 1);
        target.classList.remove('selecting');
    } else {
        // Select this cell
        strandsData.currentSelection.push({
            row,
            col,
            letter: target.textContent
        });
        target.classList.add('selecting');
    }

    updateCurrentWord();
}

function submitStrandsWord() {
    if (strandsData.currentSelection.length === 0) return;

    const word = strandsData.currentSelection.map(s => s.letter).join('');

    if (strandsData.targetWords.includes(word) && !strandsData.foundWords.includes(word)) {
        // Correct word found!
        strandsData.foundWords.push(word);
        markStrandsWordFound(word);
        addFoundWordChip(word);

        // Check if all words found
        if (strandsData.foundWords.length === strandsData.targetWords.length) {
            setTimeout(() => {
                document.getElementById('strandsNext').style.display = 'block';
                gameState.strandsComplete = true;
                saveGameState();
                updateHomeScreen();
                updateNavMenu();
                createConfetti();
            }, 500);
        }
    } else {
        // Wrong word - show feedback
        clearStrandsSelection();
    }
}

function addFoundWordChip(word) {
    const container = document.getElementById('foundWords');

    // Remove hint text if this is the first word
    if (strandsData.foundWords.length === 1) {
        container.innerHTML = '';
    }

    const chip = document.createElement('div');
    chip.className = word === 'COFFEETIME' ? 'word-chip spangram found' : 'word-chip found';
    chip.textContent = word === 'COFFEETIME' ? word + ' ⭐' : word;
    container.appendChild(chip);
}

function markStrandsWordFound(word) {
    // Get the index of this word in foundWords array (determines color)
    const wordIndex = strandsData.foundWords.length - 1;

    strandsData.currentSelection.forEach(sel => {
        const button = document.querySelector(
            `.letter-button[data-row="${sel.row}"][data-col="${sel.col}"]`
        );
        if (button) {
            button.classList.remove('selecting');
            if (word === 'COFFEETIME') {
                button.classList.add('spangram');
            } else {
                button.classList.add('found');
                button.classList.add(`found-${wordIndex % 6}`); // Cycle through 6 colors
            }
        }
    });
    strandsData.currentSelection = [];
    updateCurrentWord();
}

function clearStrandsSelection() {
    document.querySelectorAll('.letter-button.selecting').forEach(btn => {
        btn.classList.remove('selecting');
    });
    strandsData.currentSelection = [];
    updateCurrentWord();
}

function updateCurrentWord() {
    const display = document.getElementById('currentWord');
    display.textContent = strandsData.currentSelection.map(s => s.letter).join('');
}

// ========================================
// WORDLE GAME
// ========================================
function initWordle() {
    renderWordleGrid();
    renderWordleKeyboard();
    setupWordleKeyboardListener();
}

function setupWordleKeyboardListener() {
    document.addEventListener('keydown', (e) => {
        // Only handle keyboard input when on the Wordle section
        const wordleSection = document.getElementById('wordle');
        if (!wordleSection.classList.contains('active')) return;

        if (wordleData.gameOver) return;

        const key = e.key.toUpperCase();

        // Handle letter keys (A-Z)
        if (/^[A-Z]$/.test(key)) {
            e.preventDefault();
            handleWordleKey(key);
        }
        // Handle Enter
        else if (e.key === 'Enter') {
            e.preventDefault();
            handleWordleKey('ENTER');
        }
        // Handle Backspace/Delete
        else if (e.key === 'Backspace' || e.key === 'Delete') {
            e.preventDefault();
            handleWordleKey('BACK');
        }
    });
}

function renderWordleGrid() {
    const grid = document.getElementById('wordleGrid');
    grid.innerHTML = '';

    for (let i = 0; i < 6; i++) {
        const row = document.createElement('div');
        row.className = 'wordle-row';
        row.id = `wordle-row-${i}`;

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.className = 'wordle-tile';
            tile.id = `tile-${i}-${j}`;
            row.appendChild(tile);
        }

        grid.appendChild(row);
    }
}

function renderWordleKeyboard() {
    const keyboard = document.getElementById('wordleKeyboard');
    keyboard.innerHTML = '';

    wordleData.keyboard.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        row.forEach(key => {
            const keyBtn = document.createElement('button');
            keyBtn.className = key.length > 1 ? 'key wide' : 'key';
            keyBtn.textContent = key === 'BACK' ? '⌫' : key;
            keyBtn.onclick = () => handleWordleKey(key);
            keyBtn.id = `key-${key}`;
            rowDiv.appendChild(keyBtn);
        });

        keyboard.appendChild(rowDiv);
    });
}

function handleWordleKey(key) {
    if (wordleData.gameOver) return;

    if (key === 'ENTER') {
        submitWordleGuess();
    } else if (key === 'BACK') {
        deleteWordleLetter();
    } else {
        addWordleLetter(key);
    }
}

function addWordleLetter(letter) {
    if (wordleData.currentCol < 5) {
        const tile = document.getElementById(`tile-${wordleData.currentRow}-${wordleData.currentCol}`);
        tile.textContent = letter;
        tile.classList.add('filled');
        wordleData.currentCol++;
    }
}

function deleteWordleLetter() {
    if (wordleData.currentCol > 0) {
        wordleData.currentCol--;
        const tile = document.getElementById(`tile-${wordleData.currentRow}-${wordleData.currentCol}`);
        tile.textContent = '';
        tile.classList.remove('filled');
    }
}

function submitWordleGuess() {
    if (wordleData.currentCol !== 5) return;

    const guess = [];
    for (let i = 0; i < 5; i++) {
        const tile = document.getElementById(`tile-${wordleData.currentRow}-${i}`);
        guess.push(tile.textContent);
    }

    const guessWord = guess.join('');
    wordleData.guesses.push(guessWord);

    // Count letter frequencies in solution
    const solutionLetterCount = {};
    for (let letter of wordleData.solution) {
        solutionLetterCount[letter] = (solutionLetterCount[letter] || 0) + 1;
    }

    // First pass: mark correct positions and track used letters
    const tileStates = new Array(5).fill(null);
    const usedLetters = {};

    for (let i = 0; i < 5; i++) {
        if (guess[i] === wordleData.solution[i]) {
            tileStates[i] = 'correct';
            usedLetters[guess[i]] = (usedLetters[guess[i]] || 0) + 1;
        }
    }

    // Second pass: mark present/absent for remaining tiles (left to right)
    for (let i = 0; i < 5; i++) {
        if (tileStates[i] === 'correct') continue;

        const letter = guess[i];
        const usedCount = usedLetters[letter] || 0;
        const availableCount = solutionLetterCount[letter] || 0;

        if (availableCount > usedCount) {
            tileStates[i] = 'present';
            usedLetters[letter] = usedCount + 1;
        } else {
            tileStates[i] = 'absent';
        }
    }

    // Animate and color tiles based on calculated states
    guess.forEach((letter, index) => {
        const tile = document.getElementById(`tile-${wordleData.currentRow}-${index}`);

        setTimeout(() => {
            tile.classList.add('flip');
            tile.classList.add(tileStates[index]);
            updateKeyState(letter, tileStates[index]);
        }, index * 300);
    });

    // Check win condition
    setTimeout(() => {
        if (guessWord === wordleData.solution) {
            wordleData.gameOver = true;
            setTimeout(() => {
                document.getElementById('wordleNext').style.display = 'block';
                gameState.wordleComplete = true;
                saveGameState();
                updateHomeScreen();
                updateNavMenu();
                createConfetti();
            }, 500);
        } else if (wordleData.currentRow === 5) {
            // Used all 6 guesses
            showModal("You know you hate it when you lose. Keep trying 😏");
            setTimeout(() => {
                wordleData.currentRow = 0;
                wordleData.currentCol = 0;
                wordleData.guesses = [];
                renderWordleGrid();
            }, 2000);
        } else {
            wordleData.currentRow++;
            wordleData.currentCol = 0;
        }
    }, 1500);
}

function updateKeyState(letter, state) {
    const key = document.getElementById(`key-${letter}`);
    if (!key) return;

    // Only update if new state is better (correct > present > absent)
    const priority = { 'correct': 3, 'present': 2, 'absent': 1 };
    const currentState = wordleData.keyStates[letter] || 'absent';

    if (!wordleData.keyStates[letter] || priority[state] > priority[currentState]) {
        wordleData.keyStates[letter] = state;
        key.classList.remove('correct', 'present', 'absent');
        key.classList.add(state);
    }
}

// ========================================
// SCRATCH CARDS
// ========================================
function initScratchCards() {
    for (let i = 1; i <= 3; i++) {
        initScratchCard(i);
    }
}

function initScratchCard(cardNum) {
    const canvas = document.getElementById(`scratchCanvas${cardNum}`);
    const ctx = canvas.getContext('2d');

    // Set canvas size to match the card-activity container
    const activityDiv = canvas.parentElement;
    canvas.width = activityDiv.offsetWidth;
    canvas.height = activityDiv.offsetHeight;

    // Draw scratch overlay
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Track scratching
    let isScratching = false;
    let scratchedPercentage = 0;

    function scratch(e) {
        if (!isScratching) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();

        // Calculate scratched percentage
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let transparent = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) transparent++;
        }
        scratchedPercentage = transparent / (imageData.data.length / 4);

        // Auto-reveal at 40%
        if (scratchedPercentage > 0.4 && !gameState.cardsScratched[cardNum - 1]) {
            autoReveal();
        }
    }

    function autoReveal() {
        gameState.cardsScratched[cardNum - 1] = true;
        saveGameState();
        updateHomeScreen();
        updateNavMenu();

        canvas.style.transition = 'opacity 0.5s';
        canvas.style.opacity = '0';

        setTimeout(() => {
            canvas.remove();
            createConfetti();

            // Show final message when all cards are scratched
            const allScratched = gameState.cardsScratched.every(scratched => scratched);
            if (allScratched) {
                setTimeout(() => {
                    document.getElementById('finalMessage').style.display = 'block';
                }, 500);
            }
        }, 500);
    }

    canvas.addEventListener('mousedown', () => isScratching = true);
    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('mouseup', () => isScratching = false);
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isScratching = true;
    });
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        scratch(e);
    });
    canvas.addEventListener('touchend', () => isScratching = false);
}

// ========================================
// CONFETTI EFFECT
// ========================================
function createConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.textContent = '💕';
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-50px';
        confetti.style.fontSize = Math.random() * 20 + 15 + 'px';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';
        confetti.style.transition = 'all 2s ease-out';
        document.body.appendChild(confetti);

        setTimeout(() => {
            confetti.style.top = '100vh';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            confetti.style.opacity = '0';
        }, 100);

        setTimeout(() => confetti.remove(), 2100);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
