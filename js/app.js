/*-------------- Constants -------------*/
const PAGES = {
    START: 'page1',
    INTRODUCTION: 'introduction'
};

/*---------- Variables (state) ---------*/
let gameData = null;
let nextPage = null;
let user = {
    userClass: null,
    health: 100,
    gold: 0,
    inventory: [],
    level: 1,
    stats: {
        strength: 0,
        dexterity: 0,
        intelligence: 0,
        charisma: 0,
    },
}

/*----- Cached Element References  -----*/
const gameContainer = document.getElementById('game-container');
const choiceBtns = document.querySelectorAll('.choice-btn');
const nav = document.getElementById('nav');
const home = document.getElementById('home');
const stats = document.getElementById('stats');
const closeBtn = document.querySelector('.close-button');
/*-------------- Functions -------------*/
async function loadGameData() {
    const response = await fetch('data/act-1.json');
    gameData = await response.json();
    createWelcomeScreen();
}

function createWelcomeScreen() {
    const hasSavedGame = localStorage.getItem('currentPage') !== null;

    const content = `
                <div class="story-header">
                    <h1>Legacy of the Dragon-Marked</h1>
                </div>
                <div class="story-page">
                <div class="story-text">
                    Welcome Adventurer,</br>  In this game, you will embark on a thrilling journey filled with choices and challenges. 
                    </br>Your decisions will shape the story and determine your fate. 
                    </br>Roll the dice to test your luck in critical moments. 
                    </br>Will you emerge victorious or fall to the perils that lie ahead? 
                    </br>The legacy of the Dragon-Marked awaits you.
                </div>
                <div class="choices">
                    <button id="new-game-btn" class="choice-btn">New Game</button>
                    ${hasSavedGame ? '<button class="choice-btn" id="continue-btn">Load Save</button>' : ''}
                </div>
                </div>`;

    gameContainer.innerHTML = content;

    document.getElementById('new-game-btn').addEventListener('click', () => {
        localStorage.removeItem('currentPage');
        localStorage.removeItem('user');
        displayPage(PAGES.INTRODUCTION);
    });

    if (hasSavedGame) {
        document.getElementById('continue-btn').addEventListener('click', () => {
            const savedPage = localStorage.getItem('currentPage');
            user = JSON.parse(localStorage.getItem('user'));
            displayPage(savedPage);
        });
    }
}

function displayPage(pageId) {
    nav.classList.remove('hidden');
    const page = gameData[pageId];
    let content;
    if (pageId.includes('_roll')) {
        const pageNumber = pageId.split('_')[0];
        const rollNumber = pageId.split('_')[2];
        const modifier = pageId.split('_')[3];
        let diceResult = rollDice();
        switch (modifier) {
            case 'strength':
                diceResult += user.stats.strength;
                break;
            case 'dexterity':
                diceResult += user.stats.dexterity;
                break;
            case 'intelligence':
                diceResult += user.stats.intelligence;
                break;
            case 'charisma':
                diceResult += user.stats.charisma;
                break;
        }
        if (user.inventory.some(item => item.toLowerCase().includes('weapon'))) {
            diceResult += 2;
        }



        nextPage = diceResult >= rollNumber ? `${pageNumber}_success` : `${pageNumber}_fail`;
        if (modifier.includes('_class')||modifier.includes('warrior') || modifier.includes('mage')) {
            nextPage += `_${user.userClass}`;
        }

        content = `
                <div class="story-header">
                    <h1>Legacy of the Dragon-Marked</h1>
                </div>
                <div class="story-page">
                    <div class="story-text">
                        ${page.text}<br><br>
                        <strong>You rolled: ${diceResult}</strong><br>
                        <strong>You needed: ${rollNumber}</strong><br>
                        ${diceResult >= rollNumber ? 'Success!' : 'Failed!'}
                    </div>
                    <div class="choices">
                        <button class="choice-btn" data-next="${nextPage}">
                            Continue
                        </button>
                    </div>
                </div>
            `;
    }
    else {
        content = `
        <div class="story-header">
            <h1>Legacy of the Dragon-Marked</h1>
        </div>

        <div class="story-page">
            <div class="story-text">${page.text}</div>
            <div class="choices">
                ${page.choices.map(choice => `
                    <button class="choice-btn" data-next="${choice.next}">
                        ${choice.text}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
    }

    if (pageId.includes('_levelup')) {
        user.level += 1;
    }

    if (page.inventory) {
        if (!user.inventory.includes(page.inventory)) {
            if (page.inventory.includes('Weapon')) {
                page.inventory = page.inventory.replace('Weapon', user.userClass === 'warrior' ? 'Weapon - Sword' : 'Weapon - Staff');
            }
            user.inventory.push(page.inventory);
        }
    }

    if(page.img){
        document.body.style.backgroundImage = `url(${page.img})`;
    }

    if (pageId === 'page2' || pageId === 'page3') {
        user.userClass = pageId === 'page2' ? 'warrior' : 'mage';
    }
    if (pageId === 'page9') {
        user.health = 0;
    }
    gameContainer.innerHTML = content;
    addChoiceListeners();
}

function addChoiceListeners() {
    document.querySelectorAll('.choice-btn').forEach(button => {
        button.addEventListener('click', handleChoice);
    });
}

function handleChoice(evt) {
    let nextPage = evt.target.dataset.next;
    const choice = evt.target.textContent.trim();
    if (choice.includes('+1')) {
        user.stats[choice.split(' ')[1].toLowerCase()] += 1;
    }
    if (nextPage.includes('_class')) {
        if (user.inventory.some(item => item.toLowerCase().includes('weapon'))) {
            nextPage = nextPage.replace('_class', `_${user.userClass}`);
        } else {
            nextPage = nextPage.replace('_class', `_${user.userClass}_noWeapon`);
        }
    }
    displayPage(nextPage);
    localStorage.setItem('currentPage', nextPage);
    localStorage.setItem('user', JSON.stringify(user));
    if (choice === 'Restart') {
        localStorage.clear();
        location.reload();
    }
}

function rollDice() {
    return Math.floor(Math.random() * 10) + 1; // Rolls 1-10
}

/*----------- Event Listeners ----------*/
window.addEventListener('load', loadGameData);
home.addEventListener('click', () => {
    createWelcomeScreen();
});

stats.addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('user-class').textContent = user.userClass;
    document.getElementById('user-health').textContent = user.health;
    document.getElementById('user-gold').textContent = user.gold;
    document.getElementById('user-level').textContent = user.level;
    document.getElementById('user-strength').textContent = user.stats.strength;
    document.getElementById('user-dexterity').textContent = user.stats.dexterity;
    document.getElementById('user-intelligence').textContent = user.stats.intelligence;
    document.getElementById('user-charisma').textContent = user.stats.charisma;
    document.getElementById('user-inventory').textContent = user.inventory.join(', ');
    document.getElementById('stats-modal').classList.remove('hidden');
});

closeBtn.addEventListener('click', function () {
    document.getElementById('stats-modal').classList.add('hidden');
});

window.addEventListener('click', function (event) {
    if (event.target == document.getElementById('stats-modal')) {
        document.getElementById('stats-modal').classList.add('hidden');
    }
});
