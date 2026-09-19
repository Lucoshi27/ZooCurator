
// ============================================================
// CONSTANTS
// ============================================================

const ANIMAL_ROOT = 'assets/animals/';
const ENCLOSURE_ROOT = 'assets/Enclosures/';

const ANIMAL_W = 135;
const ANIMAL_H = 194.4;

const HAND_W = 270;
const HAND_H = 388.8;

const ENCLOSURE_W = 350;
const ENCLOSURE_H = 466.6667;

const WORKSPACE_W = 6000;
const WORKSPACE_H = 5000;
const STARTUP_CENTER_X = WORKSPACE_W / 2;
const STARTUP_CENTER_Y = 1700;

const ZOOM_MIN = 0.30;
const ZOOM_MAX = 2;
const ZOOM_STEP = 0.1;

const ENCLOSURE_GAP = 20;

// Fallbacks only. At startup the game samples the actual colour from
// a random Level 1 card for every category (top-right 20 x 20 pixels).
const CATEGORY_COLOURS = {
    'Birds of Prey': '#A26248',
    'Carnivora': '#A24848',
    'Marine Mania': '#A24894',
    'Tropical Birds': '#7248A2',
    'Primates': '#4875A2',
    'Reptiles': '#488FA2',
    'Other Mammals': '#49A248',
    'Other Birds': '#A29448',
    'Ungulates': '#A27C48'
};

const CATEGORY_PROGRESSION_ORDER = [
    'Birds of Prey',
    'Carnivora',
    'Marine Mania',
    'Tropical Birds',
    'Primates',
    'Reptiles',
    'Other Mammals',
    'Other Birds',
    'Ungulates'
];


// ============================================================
// CATEGORY FOLDERS
// ============================================================

const FOLDERS = {
    'Birds of Prey': 'birds of prey',
    'Carnivora': 'carnivora',
    'Marine Mania': 'marine mania',
    'Tropical Birds': 'tropical birds',
    'Primates': 'primates',
    'Reptiles': 'reptiles',
    'Other Mammals': 'other mammals',
    'Other Birds': 'other birds',
    'Ungulates': 'ungulates'
};


// ============================================================
// ENCLOSURE STRUCTURE
//
// Each inner array = one enclosure.
//
// Example:
//
// [[0,1],[2],[3]]
//
// = one large enclosure using positions 0+1
//   plus two single-animal enclosures.
//
// During startup:
// only ONE animal may be generated inside each enclosure.
//
// During normal play:
// all slots belonging to that enclosure can be occupied.
// ============================================================

const GROUPS = {

    1: [
        [0, 1],
        [3]
    ],

    2: [
        [0, 1],
        [2]
    ],

    3: [
        [0, 1],
        [2, 3]
    ],

    4: [
        [0, 1],
        [2],
        [3]
    ],

    5: [
        [0],
        [1],
        [2],
        [3]
    ],

    6: [
        [1],
        [2],
        [3]
    ],

    7: [
        [0],
        [2],
        [3]
    ],

    8: [
        [0, 1, 3],
        [2]
    ],

    9: [
        [0, 1, 2],
        [3]
    ],

    10: [
        [0, 1, 2, 3]
    ],
};


// ============================================================
// STATE
// ============================================================


// ============================================================
// GAME OPTIONS
// ============================================================

const DEFAULT_GAME_OPTIONS = {
    startingSpecies: 5,
    startingMaxEnclosureSpaces: 10,
    enclosureRewardMilestones: [1, 5],
    opponentMode: 'fictional',
    tradeOfferFrequency: 50
};

function normalizeRewardMilestones(value) {
    const values = Array.isArray(value) ? value : String(value || '').split(',');
    const cleaned = [...new Set(
        values
            .map(Number)
            .filter(n => Number.isInteger(n) && n > 0 && n <= 99)
    )].sort((a, b) => a - b);

    return cleaned.length
        ? cleaned
        : [...DEFAULT_GAME_OPTIONS.enclosureRewardMilestones];
}

function loadGameOptions() {
    try {
        const saved = JSON.parse(
            localStorage.getItem('zooCuratorGameOptions') || '{}'
        );

        return {
            startingSpecies: Math.max(
                1,
                Math.min(
                    24,
                    Number(saved.startingSpecies) ||
                    DEFAULT_GAME_OPTIONS.startingSpecies
                )
            ),
            startingMaxEnclosureSpaces: Math.max(
                4,
                Math.min(
                    40,
                    Number(saved.startingMaxEnclosureSpaces) ||
                    DEFAULT_GAME_OPTIONS.startingMaxEnclosureSpaces
                )
            ),
            enclosureRewardMilestones: normalizeRewardMilestones(
                saved.enclosureRewardMilestones ||
                DEFAULT_GAME_OPTIONS.enclosureRewardMilestones
            ),
            opponentMode: saved.opponentMode === 'real' ? 'real' : 'fictional',
            tradeOfferFrequency: Math.max(
                0,
                Math.min(
                    100,
                    Number.isFinite(Number(saved.tradeOfferFrequency))
                        ? Number(saved.tradeOfferFrequency)
                        : DEFAULT_GAME_OPTIONS.tradeOfferFrequency
                )
            )
        };
    } catch (error) {
        console.warn('Could not load saved game options:', error);
        return {
            ...DEFAULT_GAME_OPTIONS,
            enclosureRewardMilestones: [
                ...DEFAULT_GAME_OPTIONS.enclosureRewardMilestones
            ]
        };
    }
}

function saveGameOptions() {
    try {
        localStorage.setItem(
            'zooCuratorGameOptions',
            JSON.stringify(state.gameOptions)
        );
    } catch (error) {
        console.warn('Could not save game options:', error);
    }
}

const state = {
    gameOptions: loadGameOptions(),

    inventory: null,
    animalDatabase: { animals: [] },
    animalDatabaseByName: new Map(),
    zooNamesData: null,
    realZooData: { zoos: [] },
    // Mutable copy of real-zoo holdings for THIS game only.
    // real_zoo_opponents.json remains untouched.
    realZooSessionHoldings: new Map(),
    realZooUnlockedTier: 1,

    zooName: '',
    opponentNames: [],
    activeCategories: new Set(Object.keys(FOLDERS)),
    opponentProfiles: [],
    outgoingOffer: null,
    tradeOffers: [],
    selectedTradeOpponent: null,
    opponentTradeStocks: [],
    opponentStockCycle: 0,
    autonomousTradeOffer: null,
    nextAutonomousOfferTurn: null,

    // Player-initiated trade results are cached per physical animal card for
    // a three-turn window. Removing and re-adding the same card therefore
    // cannot reroll which zoos are interested during that window.
    tradeOfferCache: new Map(),

    unlockedOpponentCount: 2,
    playerLevelsSeen: new Set([1]),

    enclosures: [],
    animals: [],
    hand: [],

    exchange: [
        null,
        null
    ],

    result: null,

    nextId: 1,

    turn: 1,

    // Read-only turn-history snapshots. These contain only the visual zoo
    // state, so even long games stay compact.
    turnHistory: [],
    historyViewTurn: null,
    historyLiveView: null,
    suppressHistoryCapture: false,

    zoom: 1,

    drag: null,
    pan: null,

    lastHoveredAnimal: null,

    enclosure10Unlocked: false,

    /*
        Tracks the category/level rewards already earned.

        Example:
        "Carnivora-2"
    */
    enclosureRewards: new Set(),

    /*
        Enclosures created during the current turn get
        highlighted. Their glow is removed when the NEXT
        turn-ending action happens.
    */
    glowingEnclosureIds: new Set(),

    // Eligible cards whose yellow glow the player manually hid.
    suppressedExchangeGlowIds: new Set(),
    lastExchangeGroupCounts: new Map(),
    exchangeGlowReturnUntil: 0,
    exchangeGlowReturnIds: new Set(),
    exchangeGlowDragStartedAt: 0,
    exchangeGlowContinueIds: new Set(),
    exchangeGlowContinueStartedAt: 0,
    exchangeGlowContinueUntil: 0,

    previewHoveredAnimalId: null,
    previewHideTimer: null,
    previewIntentTimer: null,
    previewIntentAnimalId: null,
    previewWikiAnimalId: null,
    previewWikiRequestToken: 0,
    previewScientificName: '',
    previewZtlAnimalId: null,
    previewZtlScientificName: '',
    previewZtlRequestToken: 0,
    categoryColours: { ...CATEGORY_COLOURS },
    discoveredCategoryLevels: new Set(),
    acquiredLevel2Categories: new Set(),
    awardedLevel2Milestones: new Set(),
    awardedProgressMilestones: new Set(),
    progressionGlowHoverKey: null,
    progressionGlowPinnedKeys: new Set(),

    loaded: false
};


// ============================================================
// DOM
// ============================================================

function $(id) {
    return document.getElementById(id);
}


const bootScreen = $('bootScreen');
const bootStatus = $('bootStatus');
const bootDetail = $('bootDetail');

const fatalError = $('fatalError');
const gameApp = $('gameApp');

const playerZooName = $('playerZooName');
const turnOrder = $('turnOrder');

const drawCard = $('drawCard');

const exchange1 = $('exchange1');
const exchange2 = $('exchange2');
const resultBox = $('result');
const outgoingOfferBox = $('outgoingOffer');
const incomingOfferBox = $('ingoingOffer');

const zooBoard = $('zooBoard');
const zooCanvas = $('zooCanvas');

const handElement = $('hand');

const hoverPreview = $('hoverPreview');
const hoverPreviewImage = $('hoverPreviewImage');


// ============================================================
// REQUIRED ELEMENT CHECK
// ============================================================

function requireElement(element, id) {

    if (!element) {

        throw new Error(
            `Required HTML element #${id} was not found.`
        );

    }

}


requireElement(drawCard, 'drawCard');
requireElement(zooBoard, 'zooBoard');
requireElement(zooCanvas, 'zooCanvas');
requireElement(handElement, 'hand');

// ============================================================
// V40 — TRADE-ELIGIBLE CARD HIGHLIGHT
// ============================================================

let tradeEligibleGlowHideTimer = null;
let tradeEligibleGlowActive = false;

// ============================================================
// V46 — OPPONENT CATEGORY PROGRESSION TRADE RULE
// ============================================================

// To trade FOR a player's level N animal (N > 1), the receiving zoo must
// already own at least one animal from the same category at level N - 1.
// Level 1 is deliberately unrestricted.
function opponentHasCategoryPrerequisite(holdings, wantedAnimal) {
    if (!wantedAnimal) return false;
    if (wantedAnimal.level <= 1) return true;

    return (holdings || []).some(animal =>
        animal &&
        animal.category === wantedAnimal.category &&
        animal.level === wantedAnimal.level - 1
    );
}

function realZooCanTradeFor(record, wantedAnimal) {
    return opponentHasCategoryPrerequisite(
        realZooTradeAnimals(record, false),
        wantedAnimal
    );
}

function fictionalZooCanTradeFor(opponentIndex, wantedAnimal) {
    return opponentHasCategoryPrerequisite(
        state.opponentTradeStocks[opponentIndex] || [],
        wantedAnimal
    );
}

// ============================================================
// V53 — DEADLOCK-SAFETY TRADE
// ============================================================

// "Full" follows the same physical-enclosure logic as startup: every separate
// enclosure group must contain at least one animal. A large enclosure therefore
// counts as occupied as soon as one of its slots is occupied.
function everyPhysicalEnclosureOccupied() {
    if (!state.enclosures.length) return false;

    return state.enclosures.every(enclosure => {
        const groups = GROUPS[enclosure.number] || [[0]];

        return groups.every(group =>
            group.some(slotIndex =>
                state.animals.some(animal =>
                    animal.enclosureId === enclosure.id &&
                    animal.slotIndex === slotIndex
                )
            )
        );
    });
}

function playerHasAnyUpgradeAvailable() {
    return [...exchangeGroupCounts().entries()]
        .some(([key, count]) => {
            if (count < 3) return false;
            const level = Number(String(key).split('|').pop());
            return level < 5;
        });
}

function emergencyTradeNeeded() {
    return (
        state.historyViewTurn === null &&
        !state.hand.length &&
        !state.result &&
        !state.outgoingOffer &&
        !state.autonomousTradeOffer &&
        everyPhysicalEnclosureOccupied() &&
        !playerHasAnyUpgradeAvailable()
    );
}

// Find ONE deterministic legal rescue trade. This bypasses only trade
// reluctance/frequency. Same-level trading, ownership restrictions and the
// opponent category-progression prerequisite remain in force.
function emergencyTradeSelection() {
    if (!emergencyTradeNeeded()) return null;

    const playerAnimals = state.animals.filter(animal =>
        animal.enclosureId !== null &&
        animal.level >= 1 &&
        animal.level <= 5
    );

    const shuffledPlayers = seededShuffle(
        playerAnimals,
        `emergency-player|${state.turn}|${tradeOfferWindow()}`
    );

    // --------------------------------------------------------
    // 1. NORMAL CURRENTLY AVAILABLE OPPONENTS
    // --------------------------------------------------------
    // Do not alter real-zoo unlocking or normal trading behaviour. During a
    // deadlock we only bypass reluctance/frequency while searching opponents
    // that are already available to the player.
    if (isRealOpponentMode()) {
        const unlockedRecords = seededShuffle(
            [...new Set(weightedRealZooPool())],
            `emergency-real-zoos|${state.turn}|${tradeOfferWindow()}`
        );

        for (const outgoing of shuffledPlayers) {
            for (const record of unlockedRecords) {
                if (!realZooCanTradeFor(record, outgoing)) continue;

                const matching = realZooTradeAnimals(record, true)
                    .filter(candidate => candidate.level === outgoing.level);
                if (!matching.length) continue;

                const { seed } = seededRoll(
                    `emergency-real-animal|${outgoing.id}|${record.name}|${state.turn}`
                );

                return {
                    outgoingId: outgoing.id,
                    record,
                    animal: matching[seed % matching.length]
                };
            }
        }
    }
    else {
        const opponentIndexes = [];
        for (
            let index = 0;
            index < Math.min(state.unlockedOpponentCount, state.opponentProfiles.length);
            index++
        ) {
            fillOpponentTradeStock(index);
            opponentIndexes.push(index);
        }

        const shuffledIndexes = seededShuffle(
            opponentIndexes.map(opponentIndex => ({ opponentIndex })),
            `emergency-fictional-zoos|${state.turn}|${tradeOfferWindow()}`
        ).map(item => item.opponentIndex);

        for (const outgoing of shuffledPlayers) {
            for (const opponentIndex of shuffledIndexes) {
                if (!fictionalZooCanTradeFor(opponentIndex, outgoing)) continue;

                const matching = (state.opponentTradeStocks[opponentIndex] || [])
                    .filter(candidate => candidate.level === outgoing.level);
                if (!matching.length) continue;

                const { seed } = seededRoll(
                    `emergency-fictional-animal|${outgoing.id}|${opponentIndex}|${state.turn}`
                );

                return {
                    outgoingId: outgoing.id,
                    opponentIndex,
                    animal: matching[seed % matching.length]
                };
            }
        }
    }

    // --------------------------------------------------------
    // 2. EASTER EGG — PRIVATE PET TRADE
    // --------------------------------------------------------
    // If no currently unlocked/available opponent can make a legal rescue
    // trade, offer a random unused Level 1 animal from "Private Pet Trade".
    // The player therefore needs a Level 1 animal to exchange in this fallback.
    const levelOnePlayers = shuffledPlayers.filter(animal => animal.level === 1);
    if (!levelOnePlayers.length) return null;

    const outgoing = levelOnePlayers[0];
    const ownedKeys = playerOwnedCardKeys();
    const available = [];

    for (const category of Object.keys(FOLDERS)) {
        if (!state.activeCategories.has(category)) continue;

        for (const filename of levelFiles(category, 1)) {
            const key = animalCardKey(category, 1, filename);
            if (ownedKeys.has(key)) continue;
            available.push({ category, filename });
        }
    }

    if (!available.length) return null;

    const { seed } = seededRoll(
        `private-pet-trade|${outgoing.id}|${state.turn}|${tradeOfferWindow()}`
    );
    const chosen = available[seed % available.length];

    return {
        outgoingId: outgoing.id,
        privatePetTrade: true,
        record: {
            name: 'Private Pet Trade',
            tier: 0,
            preferred_categories: []
        },
        animal: {
            id: state.nextId++,
            category: chosen.category,
            level: 1,
            filename: cleanFilename(chosen.filename),
            enclosureId: null,
            slotIndex: null,
            hand: false
        }
    };
}

function emergencyTradeForAnimal(outgoing) {
    if (!outgoing) return null;
    const rescue = emergencyTradeSelection();
    return rescue && rescue.outgoingId === outgoing.id ? rescue : null;
}

function predictedPlayerTradeOffers(animal) {
    if (!animal) return [];

    // Deadlock rescue bypasses reluctance and frequency, and deliberately
    // exposes exactly one player card as the guaranteed trade route.
    const emergency = emergencyTradeForAnimal(animal);
    if (emergency) return [emergency];

    // Mirror the already locked result for this physical card and current
    // three-turn offer window, if one exists.
    const cached = cachedPlayerTradeOffers(animal);
    if (cached) return cached;

    const frequency = tradeFrequencyFactor();
    if (frequency <= 0) return [];

    if (isRealOpponentMode()) {
        const overallRoll = seededRoll(
            `real-overall|${animal.id}|${tradeOfferWindow()}`
        ).roll;
        if (overallRoll > frequency) return [];

        const records = [...new Set(weightedRealZooPool())];
        const candidates = [];

        for (const record of records) {
            if (!realZooCanTradeFor(record, animal)) continue;

            const matching = realZooTradeAnimals(record, true)
                .filter(candidate => candidate.level === animal.level);
            if (!matching.length) continue;

            const favourites = Array.isArray(record.preferred_categories)
                ? record.preferred_categories
                : [];
            const likesOutgoing = favourites.includes(animal.category);
            const baseInterest = likesOutgoing ? 0.24 : 0.09;
            const levelPenalty = (animal.level - 1) * 0.025;
            const zooChance = Math.max(0.025, baseInterest - levelPenalty);

            const { seed, roll } = seededRoll(
                `real-zoo|${animal.id}|${record.name}|${tradeOfferWindow()}`
            );
            if (roll > zooChance) continue;

            const offeredAnimal = matching[(seed >>> 8) % matching.length];
            candidates.push({ record, animal: offeredAnimal });
        }

        return seededShuffle(
            candidates,
            `real-select|${animal.id}|${tradeOfferWindow()}`
        ).slice(0, 3);
    }

    const overallRoll = seededRoll(
        `fictional-overall|${animal.id}|${tradeOfferWindow()}`
    ).roll;
    if (overallRoll > frequency) return [];

    const candidates = [];

    state.opponentProfiles.forEach((profile, index) => {
        if (index >= state.unlockedOpponentCount) return;
        if (!fictionalZooCanTradeFor(index, animal)) return;

        const matching = (state.opponentTradeStocks[index] || [])
            .filter(candidate => candidate.level === animal.level);
        if (!matching.length) return;

        const fav = profile.favourites.includes(animal.category);
        const zooChance = fav ? 0.30 : 0.12;

        const { seed, roll } = seededRoll(
            `fictional-zoo|${animal.id}|${index}|${tradeOfferWindow()}`
        );
        if (roll > zooChance) return;

        const offeredAnimal = matching[(seed >>> 8) % matching.length];
        if (offeredAnimal) {
            candidates.push({ opponentIndex: index, animal: offeredAnimal });
        }
    });

    return seededShuffle(
        candidates,
        `fictional-select|${animal.id}|${tradeOfferWindow()}`
    ).slice(0, 3);
}

function animalCouldReceiveTradeInterest(animal) {
    if (!animal || animal.level < 1 || animal.level > 5) return false;
    if (animal === state.outgoingOffer) return false;

    if (state.autonomousTradeOffer) {
        return outgoingFitsAutonomousOffer(animal);
    }

    // This uses exactly the same seeded rolls, frequency gate, zoo-specific
    // willingness and three-offer cap as actually placing the card.
    return predictedPlayerTradeOffers(animal).length > 0;
}

function clearTradeEligibleGlow(immediate = true) {
    clearTimeout(tradeEligibleGlowHideTimer);
    tradeEligibleGlowHideTimer = null;
    tradeEligibleGlowActive = false;

    const cards = [
        ...document.querySelectorAll('.animal-card.trade-eligible-glow')
    ];

    cards.forEach(card => {
        clearTimeout(card._tradeGlowFadeTimer);

        if (immediate) {
            card.classList.remove('trade-eligible-glow-fading');
            card.classList.remove('trade-eligible-glow');
            return;
        }

        // Use the same CSS-transition approach as the yellow exchange glow.
        // The base blue-glow class remains present while a second class lowers
        // the shadow to zero, so the browser can interpolate it smoothly.
        card.classList.add('trade-eligible-glow-fading');

        card._tradeGlowFadeTimer = setTimeout(() => {
            card.classList.remove('trade-eligible-glow-fading');
            card.classList.remove('trade-eligible-glow');
            delete card._tradeGlowFadeTimer;
        }, 1000);
    });
}

function applyTradeEligibleGlow() {
    // Trade hints belong only to the live/current turn. Historical snapshots
    // are strictly read-only inspection states.
    if (state.historyViewTurn !== null) {
        clearTradeEligibleGlow();
        return;
    }

    // Normally this hint is shown while the trade slots are empty. A
    // spontaneous/autonomous incoming offer is the exception: in that case
    // the glow shows which of the player's cards the offering zoo will accept.
    if (
        state.outgoingOffer ||
        (selectedTradeOffer() && !state.autonomousTradeOffer)
    ) {
        clearTradeEligibleGlow();
        return;
    }

    clearTimeout(tradeEligibleGlowHideTimer);
    tradeEligibleGlowHideTimer = null;

    // Re-entering during the fade restores the full glow immediately.
    document.querySelectorAll('.animal-card.trade-eligible-glow')
        .forEach(card => {
            clearTimeout(card._tradeGlowFadeTimer);
            card.classList.remove('trade-eligible-glow-fading');
        });

    tradeEligibleGlowActive = true;

    document.querySelectorAll('.animal-card[data-animal-id]')
        .forEach(card => {
            const id = Number(card.dataset.animalId);
            const animal = state.animals.find(item => item.id === id)
                || state.hand.find(item => item.id === id);

            card.classList.toggle(
                'trade-eligible-glow',
                Boolean(animal && animalCouldReceiveTradeInterest(animal))
            );
        });
}

function scheduleTradeEligibleGlowFade() {
    clearTimeout(tradeEligibleGlowHideTimer);

    // Keep the full blue glow for one second after the pointer leaves.
    // Then animate it away smoothly during the following one second.
    tradeEligibleGlowHideTimer = setTimeout(() => {
        tradeEligibleGlowHideTimer = null;
        clearTradeEligibleGlow(false);
    }, 1000);
}

function tradeGlowTarget(target) {
    if (!target) return null;

    // The outgoing slot is a hint target whenever it is empty. During a
    // spontaneous offer it highlights cards this particular zoo will accept.
    if (
        !state.outgoingOffer &&
        (target === outgoingOfferBox || outgoingOfferBox.contains(target))
    ) {
        return outgoingOfferBox;
    }

    // With no offer, hovering/tapping the empty incoming slot keeps the
    // existing general "cards that could attract offers" behaviour.
    if (
        !selectedTradeOffer() &&
        (target === incomingOfferBox || incomingOfferBox.contains(target))
    ) {
        return incomingOfferBox;
    }

    // If a zoo spontaneously offered a card, the incoming card itself becomes
    // a hint target too.
    if (
        state.autonomousTradeOffer &&
        (target === incomingOfferBox || incomingOfferBox.contains(target))
    ) {
        return incomingOfferBox;
    }

    return null;
}

// Desktop: hover either EMPTY trade space to reveal potentially tradeable
// cards. The glow lingers for two seconds after leaving, matching the other
// temporary card hints.
[outgoingOfferBox, incomingOfferBox].forEach(box => {
    if (!box) return;

    box.addEventListener('mouseenter', () => {
        if (window.matchMedia('(max-width: 700px)').matches) return;
        if (!tradeGlowTarget(box)) return;
        applyTradeEligibleGlow();
    });

    box.addEventListener('mouseleave', () => {
        if (window.matchMedia('(max-width: 700px)').matches) return;
        if (!tradeEligibleGlowActive) return;
        scheduleTradeEligibleGlowFade();
    });
});

// Mobile: tapping either EMPTY trade box toggles the same hint on. Tapping
// elsewhere dismisses it immediately, as requested.
document.addEventListener('pointerdown', event => {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const tradeTarget = tradeGlowTarget(event.target);

    if (tradeTarget) {
        applyTradeEligibleGlow();
        return;
    }

    if (tradeEligibleGlowActive) {
        clearTradeEligibleGlow();
    }
}, true);


'use strict';

window.__zooScriptStarted = true;




requireElement(exchange1, 'exchange1');
requireElement(exchange2, 'exchange2');
requireElement(resultBox, 'result');
requireElement(outgoingOfferBox, 'outgoingOffer');
requireElement(incomingOfferBox, 'ingoingOffer');

requireElement(hoverPreview, 'hoverPreview');
requireElement(hoverPreviewImage, 'hoverPreviewImage');

requireElement(playerZooName, 'playerZooName');
requireElement(turnOrder, 'turnOrder');


// ============================================================
// GENERAL HELPERS
// ============================================================

function randomItem(array) {

    if (
        !Array.isArray(array) ||
        array.length === 0
    ) {
        return null;
    }

    return array[
        Math.floor(
            Math.random() *
            array.length
        )
    ];

}


function shuffle(array) {

    const copy = [...array];

    for (
        let i = copy.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];

    }

    return copy;

}


function clamp(
    value,
    min,
    max
) {

    return Math.max(
        min,
        Math.min(
            max,
            value
        )
    );

}


function cleanFilename(filename) {

    return String(
        filename || ''
    )
        .replace(
            /\\/g,
            '/'
        )
        .split('/')
        .pop();

}


function getFolder(category) {

    return (
        FOLDERS[category] ||
        String(category).toLowerCase()
    );

}


function animalPath(
    category,
    level,
    filename
) {

    return (
        ANIMAL_ROOT +
        getFolder(category) +
        '/' +
        level +
        '/' +
        cleanFilename(filename)
    );

}


function animalBackPath(
    category,
    level
) {

    return (
        ANIMAL_ROOT +
        getFolder(category) +
        '/' +
        level +
        '/Back.png'
    );

}


function enclosurePath(number) {

    return (
        ENCLOSURE_ROOT +
        'Enclosure ' +
        number +
        '.png'
    );

}


// ============================================================
// LOADING
// ============================================================

function setLoading(
    status,
    detail = ''
) {

    if (bootStatus) {
        bootStatus.textContent = status;
    }

    if (bootDetail) {
        bootDetail.textContent = detail;
    }

}


function showFatal(error) {

    console.error(error);

    if (bootScreen) {
        bootScreen.style.display = 'none';
    }

    if (fatalError) {

        fatalError.classList.add(
            'visible'
        );

        fatalError.textContent =
            'Zoo Curator could not start.\n\n' +
            (
                error?.stack ||
                error?.message ||
                String(error)
            );

    }

}


// ============================================================
// JSON
// ============================================================

async function loadJson(
    path,
    description,
    timeoutMs = 0
) {
    setLoading('Loading Zoo Curator...', description);

    const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId = null;

    if (controller && timeoutMs > 0) {
        timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    }

    try {
        const response = await fetch(
            path,
            controller
                ? { signal: controller.signal, cache: 'no-store' }
                : { cache: 'no-store' }
        );

        if (!response.ok) {
            throw new Error(`Could not load ${path}. HTTP ${response.status}.`);
        }

        try {
            return await response.json();
        } catch (error) {
            throw new Error(
                `${path} was found but could not be read as JSON: ${error.message}`
            );
        }
    } catch (error) {
        if (
            timeoutMs > 0 &&
            (error?.name === 'AbortError' || controller?.signal?.aborted)
        ) {
            throw new Error(
                `${path} did not finish loading within ${Math.round(timeoutMs / 1000)} seconds.`
            );
        }
        throw error;
    } finally {
        if (timeoutId !== null) clearTimeout(timeoutId);
    }
}


// ============================================================
// INVENTORY
// ============================================================

function getCategorySource(category) {

    if (!state.inventory) {
        return null;
    }

    const folder =
        getFolder(category);


    if (state.inventory.animals) {

        if (
            state.inventory.animals[
                category
            ]
        ) {

            return state.inventory.animals[
                category
            ];

        }


        if (
            state.inventory.animals[
                folder
            ]
        ) {

            return state.inventory.animals[
                folder
            ];

        }

    }


    if (state.inventory[category]) {
        return state.inventory[category];
    }


    if (state.inventory[folder]) {
        return state.inventory[folder];
    }


    return null;

}


// ============================================================
// LEVEL FILES
// ============================================================

function levelFiles(
    category,
    level
) {

    const source =
        getCategorySource(category);

    if (!source) {
        return [];
    }


    if (
        !Array.isArray(source) &&
        typeof source === 'object'
    ) {

        const possible = [

            source[level],

            source[
                String(level)
            ],

            source[
                `Level ${level}`
            ],

            source[
                `level${level}`
            ]

        ];


        for (
            const candidate
            of possible
        ) {

            if (
                Array.isArray(candidate)
            ) {

                return candidate

                    .map(item => {

                        if (
                            typeof item ===
                            'string'
                        ) {

                            return cleanFilename(
                                item
                            );

                        }


                        if (
                            item &&
                            typeof item ===
                            'object'
                        ) {

                            return cleanFilename(
                                item.file ??
                                item.filename ??
                                item.path ??
                                item.name ??
                                ''
                            );

                        }


                        return '';

                    })

                    .filter(Boolean)

                    .filter(
                        filename =>
                            !/^back\.png$/i.test(
                                filename
                            )
                    );

            }

        }

    }


    if (Array.isArray(source)) {

        return source

            .filter(item => {

                if (
                    typeof item ===
                    'string'
                ) {
                    return true;
                }


                const itemLevel =
                    Number(
                        item?.level ??
                        item?.Level ??
                        item?.tier ??
                        item?.Tier
                    );


                return (
                    itemLevel ===
                    Number(level)
                );

            })

            .map(item => {

                if (
                    typeof item ===
                    'string'
                ) {

                    return cleanFilename(
                        item
                    );

                }


                return cleanFilename(
                    item.file ??
                    item.filename ??
                    item.path ??
                    item.name ??
                    ''
                );

            })

            .filter(Boolean)

            .filter(
                filename =>
                    !/^back\.png$/i.test(
                        filename
                    )
            );

    }


    return [];

}


// ============================================================
// CREATE ANIMAL
// ============================================================

function animalCardKey(animalOrCategory, level = null, filename = null) {
    if (typeof animalOrCategory === 'object') {
        return `${animalOrCategory.category}|${animalOrCategory.level}|${String(animalOrCategory.filename).toLowerCase()}`;
    }
    return `${animalOrCategory}|${level}|${String(filename).toLowerCase()}`;
}

function playerOwnedCardKeys() {
    return new Set(state.animals.map(animalCardKey));
}

function removePlayerClaimedCardFromOpponents(category, level, filename) {
    const key = animalCardKey(category, level, filename);
    for (let i = 0; i < state.opponentTradeStocks.length; i++) {
        const before = state.opponentTradeStocks[i] || [];
        const removed = before.some(a => animalCardKey(a) === key);
        if (!removed) continue;
        state.opponentTradeStocks[i] = before.filter(a => animalCardKey(a) !== key);
        if (state.autonomousTradeOffer?.opponentIndex === i &&
            animalCardKey(state.autonomousTradeOffer.animal) === key) {
            state.autonomousTradeOffer = null;
            scheduleNextAutonomousOpponentOffer();
        }
        state.tradeOffers = state.tradeOffers.filter(o => animalCardKey(o.animal) !== key);
        fillOpponentTradeStock(i);
    }
}

function createAnimal(category, level, filename = null) {
    const files = levelFiles(category, level);
    const usedByPlayer = playerOwnedCardKeys();

    let chosen = filename ? cleanFilename(filename) : null;
    if (chosen && usedByPlayer.has(animalCardKey(category, level, chosen))) chosen = null;

    if (!chosen) {
        const available = files.filter(file =>
            !usedByPlayer.has(animalCardKey(category, level, file))
        );
        if (!available.length) {
            throw new Error(`No unused Level ${level} animal cards remain for ${category}.`);
        }
        chosen = randomItem(available);
    }

    // The player's generation has priority. If an opponent happened to own this
    // unique card, that copy disappears and the opponent immediately refills.
    removePlayerClaimedCardFromOpponents(category, level, chosen);

    return {
        id: state.nextId++, category, level,
        filename: cleanFilename(chosen),
        enclosureId: null, slotIndex: null, hand: false
    };
}


// ============================================================
// ENCLOSURE INFORMATION
// ============================================================

function getGroups(enclosure) {

    return (
        GROUPS[
            enclosure.number
        ] ||
        [[0]]
    );

}


function getAllSlots(enclosure) {

    return getGroups(
        enclosure
    ).flat();

}


/*
    Total animal spots on the card.

    This is what matters when choosing the starting
    3–4 enclosure cards.
*/

function enclosureSlotCapacity(
    enclosureNumber
) {

    return (
        GROUPS[
            enclosureNumber
        ] ||
        [[0]]
    ).flat().length;

}


// ============================================================
// ANIMAL AT SLOT
// ============================================================

function animalAtSlot(
    enclosureId,
    slotIndex,
    ignoreAnimalId = null
) {

    return state.animals.find(
        animal =>
            animal.id !==
                ignoreAnimalId &&
            animal.enclosureId ===
                enclosureId &&
            animal.slotIndex ===
                slotIndex
    );

}


// ============================================================
// CAN PLACE
// ============================================================

function canPlace(
    animal,
    enclosure,
    slotIndex
) {

    if (
        !animal ||
        !enclosure
    ) {
        return false;
    }


    if (
        enclosure.number === 10 &&
        !state.enclosure10Unlocked
    ) {
        return false;
    }


    if (
        !getAllSlots(enclosure)
            .includes(slotIndex)
    ) {
        return false;
    }


    return !animalAtSlot(
        enclosure.id,
        slotIndex,
        animal.id
    );

}


// ============================================================
// REMOVE ANIMAL FROM LOCATIONS
// ============================================================

function removeAnimalFromLocations(
    animal
) {

    animal.enclosureId = null;
    animal.slotIndex = null;
    animal.hand = false;


    state.hand =
        state.hand.filter(
            item =>
                item.id !==
                animal.id
        );


    state.exchange =
        state.exchange.map(
            item =>
                item?.id ===
                animal.id
                    ? null
                    : item
        );

    if (state.outgoingOffer?.id === animal.id) {
        state.outgoingOffer = null;
        state.tradeOffers = [];
        state.selectedTradeOpponent = null;
    }

}


// ============================================================
// PLACE ANIMAL
// ============================================================

function placeAnimal(
    animal,
    enclosure,
    slotIndex
) {

    if (
        !canPlace(
            animal,
            enclosure,
            slotIndex
        )
    ) {
        return false;
    }


    removeAnimalFromLocations(
        animal
    );


    animal.enclosureId =
        enclosure.id;

    animal.slotIndex =
        slotIndex;


    checkEnclosure10Unlock();
    updateRealZooTierUnlocks();


    return true;

}


// ============================================================
// LEVEL 4 / ENCLOSURE 10
// ============================================================

function level4IsInZoo() {

    return state.animals.some(
        animal =>
            animal.level >= 4 &&
            animal.enclosureId !== null
    );

}


function checkEnclosure10Unlock() {

    if (
        state.enclosure10Unlocked
    ) {
        return;
    }


    if (!level4IsInZoo()) {
        return;
    }


    state.enclosure10Unlocked =
        true;

    console.log(
        'Enclosure 10 unlocked.'
    );

}


// ============================================================
// COMBINATIONS
// ============================================================

function getCombinations(
    array,
    count
) {

    const results = [];


    function walk(
        start,
        current
    ) {

        if (
            current.length ===
            count
        ) {

            results.push(
                [...current]
            );

            return;

        }


        for (
            let i = start;
            i < array.length;
            i++
        ) {

            current.push(
                array[i]
            );

            walk(
                i + 1,
                current
            );

            current.pop();

        }

    }


    walk(
        0,
        []
    );


    return results;

}


// ============================================================
// STARTUP ENCLOSURE SELECTION
//
// RULE:
//
// - enough separate physical enclosures for all starting animals
// - total slot capacity may be BELOW the configured maximum
// - configured startingMaxEnclosureSpaces is a ceiling, not a target
// - Enclosure 10 prohibited
// ============================================================

function chooseStartupEnclosures() {

    const available = [
        1, 2, 3, 4, 5,
        6, 7, 8, 9
    ];

    const requiredAnimals = state.gameOptions.startingSpecies;
    const maxSpots = Math.max(
        requiredAnimals,
        state.gameOptions.startingMaxEnclosureSpaces
    );

    const candidates = [];

    for (let cardCount = 3; cardCount <= available.length; cardCount++) {
        const combinations = getCombinations(available, cardCount);

        for (const combination of combinations) {
            const totalSpots = combination.reduce(
                (total, number) => total + enclosureSlotCapacity(number),
                0
            );

            const physicalEnclosures = combination.reduce(
                (total, number) => total + (GROUPS[number] || [[0]]).length,
                0
            );

            if (
                physicalEnclosures >= requiredAnimals &&
                totalSpots >= requiredAnimals &&
                totalSpots <= maxSpots
            ) {
                candidates.push({ combination, cardCount, totalSpots });
            }
        }
    }

    if (!candidates.length) {
        throw new Error(
            `No starting enclosure layout can hold ${requiredAnimals} starting species ` +
            `within the configured maximum of ${maxSpots} enclosure spaces. ` +
            'Increase “Starting max enclosure spaces” in Game Options.'
        );
    }

    /*
        IMPORTANT:
        startingMaxEnclosureSpaces is a CEILING, not a target.

        First choose randomly between the different valid total-space counts.
        Then choose a random layout with that count. This prevents a setting
        such as “maximum 10” from effectively behaving like “make exactly 10”.

        Example with 5 starting animals and maximum 10:
        a valid 7-, 8-, 9- or 10-space zoo may be selected, provided it also
        contains at least 5 separate physical enclosures for the 5 animals.
    */
    const possibleSpotCounts = [
        ...new Set(candidates.map(item => item.totalSpots))
    ].sort((a, b) => a - b);

    const chosenSpotCount = randomItem(possibleSpotCounts);

    const matchingSpotCount = candidates.filter(
        item => item.totalSpots === chosenSpotCount
    );

    // Within the chosen capacity, favour fewer enclosure cards without
    // forcing the zoo toward the configured maximum number of spaces.
    const minimumCardsForCount = Math.min(
        ...matchingSpotCount.map(item => item.cardCount)
    );

    const practicalLayouts = matchingSpotCount.filter(
        item => item.cardCount <= minimumCardsForCount + 1
    );

    return [...randomItem(practicalLayouts).combination];
}

// ============================================================
// RECTANGLE COLLISION
// ============================================================

function rectanglesOverlap(
    a,
    b,
    gap = 0
) {

    return !(
        a.x + a.w + gap <= b.x ||
        b.x + b.w + gap <= a.x ||
        a.y + a.h + gap <= b.y ||
        b.y + b.h + gap <= a.y
    );

}


// ============================================================
// CREATE CONNECTED POSITION
//
// Generates a position next to an existing enclosure card.
// It can connect on any side.
//
// A little irregular offset is allowed so the zoo can snake.
// ============================================================

function connectedPosition(
    existing,
    occupied,
    gap = ENCLOSURE_GAP
) {

    const directions = shuffle([
        'right',
        'left',
        'bottom',
        'top'
    ]);

    for (const direction of directions) {

        let x = existing.x;
        let y = existing.y;

        if (direction === 'right') {
            x = existing.x + ENCLOSURE_W + gap;
        }
        else if (direction === 'left') {
            x = existing.x - ENCLOSURE_W - gap;
        }
        else if (direction === 'bottom') {
            y = existing.y + ENCLOSURE_H + gap;
        }
        else {
            y = existing.y - ENCLOSURE_H - gap;
        }

        if (
            x < 40 ||
            y < 40 ||
            x + ENCLOSURE_W > WORKSPACE_W - 40 ||
            y + ENCLOSURE_H > WORKSPACE_H - 40
        ) {
            continue;
        }

        const candidate = { x, y, w: ENCLOSURE_W, h: ENCLOSURE_H };

        const collides = occupied.some(item =>
            item.id !== existing.id &&
            rectanglesOverlap(
                candidate,
                { x: item.x, y: item.y, w: ENCLOSURE_W, h: ENCLOSURE_H },
                gap
            )
        );

        if (!collides) {
            return { x, y };
        }
    }

    return null;
}


// ============================================================
// POSITION STARTUP ENCLOSURES
//
// First card is central.
//
// Every later card attaches to a random card already in the
// zoo. This makes the starting zoo less rectangular.
// ============================================================

function positionStartupEnclosures(numbers) {

    for (let buildAttempt = 0; buildAttempt < 100; buildAttempt++) {

        const positioned = [{
            id: state.nextId++,
            number: numbers[0],
            x: STARTUP_CENTER_X - ENCLOSURE_W / 2,
            y: STARTUP_CENTER_Y
        }];

        let failed = false;

        for (let i = 1; i < numbers.length; i++) {
            let position = null;

            const anchors = shuffle(positioned);
            for (const anchor of anchors) {
                position = connectedPosition(anchor, positioned, ENCLOSURE_GAP);
                if (position) break;
            }

            if (!position) {
                failed = true;
                break;
            }

            positioned.push({
                id: state.nextId++,
                number: numbers[i],
                x: position.x,
                y: position.y
            });
        }

        if (!failed) return positioned;
    }

    throw new Error('Could not arrange the starting enclosure cards without overlap.');
}


// ============================================================
// RANDOM LEVEL 1 CATEGORY
// ============================================================

function randomAvailableLevelOneCategory() {
    const available = Object.keys(FOLDERS).filter(category => {
        if (!state.activeCategories.has(category)) return false;
        const files = levelFiles(category, 1);
        return files.some(file => !state.animals.some(animal =>
            animal.category === category && animal.level === 1 &&
            animal.filename.toLowerCase() === file.toLowerCase()
        ));
    });
    if (!available.length) throw new Error('No unused Level 1 animal cards remain.');
    return randomItem(available);
}


// ============================================================
// CREATE STARTING ZOO
//
// Uses the configured number of starting animals.
//
// The selected enclosure cards contain enough physical enclosures
// for those animals, while total slot capacity never exceeds the
// configured starting maximum.
//
// During startup, a physical enclosure receives at most one
// animal. Large enclosures therefore do not start with two.
// ============================================================

function createStartingZoo() {

    state.enclosures = [];
    state.animals = [];
    state.hand = [];

    state.exchange = [
        null,
        null
    ];

    state.result = null;
    state.outgoingOffer = null;
    state.tradeOffers = [];
    state.selectedTradeOpponent = null;
    state.opponentTradeStocks = [];
    state.opponentStockCycle = 0;
    state.autonomousTradeOffer = null;
    state.nextAutonomousOfferTurn = null;
    state.unlockedOpponentCount = 2;
    state.playerLevelsSeen = new Set([1]);
    state.realZooUnlockedTier = 1;
    resetRealZooSessionHoldings();
    state.tradeOfferCache = new Map();

    state.turn = 1;
    resetTurnHistory();

    state.enclosure10Unlocked =
        false;

    state.enclosureRewards =
        new Set();

    state.glowingEnclosureIds =
        new Set();

    state.suppressedExchangeGlowIds = new Set();
    state.lastExchangeGroupCounts = new Map();
    state.previewHoveredAnimalId = null;
    if (state.previewHideTimer) clearTimeout(state.previewHideTimer);
    state.previewHideTimer = null;
    if (state.previewIntentTimer) clearTimeout(state.previewIntentTimer);
    state.previewIntentTimer = null;
    state.previewIntentAnimalId = null;
    state.discoveredCategoryLevels = new Set();
    state.acquiredLevel2Categories = new Set();
    state.awardedLevel2Milestones = new Set();
    state.awardedProgressMilestones = new Set();
    state.progressionGlowHoverKey = null;
    state.progressionGlowPinnedKeys = new Set();


    const numbers =
        chooseStartupEnclosures();


    state.enclosures =
        positionStartupEnclosures(
            numbers
        );


    /*
        Build a list of every physical enclosure available
        at startup.

        Each GROUP is one enclosure.

        A group such as [0,1] contributes ONE startup position,
        not two.
    */

    const startupEnclosures = [];


    for (
        const enclosure
        of state.enclosures
    ) {

        for (
            const group
            of getGroups(enclosure)
        ) {

            startupEnclosures.push({
                enclosure,
                group
            });

        }

    }


    /*
        We need one different physical enclosure per starting animal.

        The chosen cards should provide enough, but verify it
        explicitly so a bad map never silently breaks setup.
    */

    if (
        startupEnclosures.length < state.gameOptions.startingSpecies
    ) {

        throw new Error(
            `Startup enclosure selection did not provide ${state.gameOptions.startingSpecies} separate enclosures.`
        );

    }


    const chosenStartingEnclosures =
        shuffle(
            startupEnclosures
        ).slice(
            0,
            state.gameOptions.startingSpecies
        );


    for (
        const entry
        of chosenStartingEnclosures
    ) {

        const category =
            randomAvailableLevelOneCategory();


        const animal =
            createAnimal(
                category,
                1
            );


        /*
            One random position inside this physical enclosure.

            For a large enclosure the remaining position stays
            empty and can be filled later by the player.
        */

        const startupSlot =
            randomItem(
                entry.group
            );


        animal.enclosureId =
            entry.enclosure.id;

        animal.slotIndex =
            startupSlot;


        state.animals.push(
            animal
        );

    }


    updateTurnDisplay();


    const totalSpots =
        state.enclosures.reduce(
            (
                total,
                enclosure
            ) =>
                total +
                enclosureSlotCapacity(
                    enclosure.number
                ),
            0
        );


    console.log(
        'Startup zoo:',
        state.enclosures.length,
        'enclosure cards,',
        totalSpots,
        'animal spots,',
        state.animals.length,
        'starting animals.'
    );

}


// ============================================================
// TURN SYSTEM
// ============================================================

function updateTurnDisplay() {
    if (state.historyViewTurn !== null) {
        turnOrder.textContent = `Turn ${state.historyViewTurn} · VIEWING`;
        return;
    }

    turnOrder.textContent = `Turn ${state.turn}`;
}


/*
    A turn ends when:

    - a Level 1 card is drawn
    - an upgraded exchange card is taken

    Moving cards, moving enclosures, panning and zooming do
    NOT end a turn.
*/

function endTurn() {

    /*
        First remove glow from enclosure rewards earned during
        the previous turn-ending action.
    */

    state.glowingEnclosureIds.clear();


    state.turn++;


    updateTurnDisplay();

    updateAutonomousOpponentOffer();

    renderZoo();

}


// ============================================================
// EXCHANGE ELIGIBILITY
// ============================================================

function exchangeGroupKey(animal) {
    return `${animal.category}|${animal.level}`;
}

function exchangeGroupCounts() {
    const counts = new Map();
    const seen = new Set();

    const add = animal => {
        if (!animal || seen.has(animal.id)) return;
        seen.add(animal.id);
        const key = exchangeGroupKey(animal);
        counts.set(key, (counts.get(key) || 0) + 1);
    };

    // Animals physically in the zoo still count.
    for (const animal of state.animals) {
        if (animal.enclosureId !== null) add(animal);
    }

    // Animals committed to an exchange slot still belong to the zoo
    // until the upgrade is actually taken.
    for (const animal of state.exchange) add(animal);

    // A card being carried from the zoo/exchange also still counts.
    if (state.drag?.type === 'animal') {
        const drag = state.drag;
        if (drag.originalEnclosureId !== null || drag.originalExchangeIndex >= 0) {
            add(drag.animal);
        }
    }

    return counts;
}

function refreshExchangeGlowSuppression() {
    const counts = exchangeGroupCounts();

    for (const [key, count] of counts) {
        const previous = state.lastExchangeGroupCounts.get(key) || 0;
        if (count > previous) {
            for (const animal of state.animals) {
                if (exchangeGroupKey(animal) === key) {
                    state.suppressedExchangeGlowIds.delete(animal.id);
                }
            }
        }
    }

    state.lastExchangeGroupCounts = new Map(counts);
}

function eligibleExchangeCategories() {
    const counts = exchangeGroupCounts();
    const categories = new Set();

    for (const [key, count] of counts) {
        if (count >= 3) categories.add(key.split('|')[0]);
    }

    return [...categories];
}

function isExchangeEligible(animal) {
    if (!animal || animal.level >= 5) return false;
    return (exchangeGroupCounts().get(exchangeGroupKey(animal)) || 0) >= 3;
}

function shouldGlowForExchange(animal) {
    return isExchangeEligible(animal) &&
        !state.suppressedExchangeGlowIds.has(animal.id);
}


// ============================================================
// ANIMAL IMAGE
// ============================================================

function animalImage(animal) {

    return animalPath(
        animal.category,
        animal.level,
        animal.filename
    );

}


// ============================================================
// IMAGE ERROR
// ============================================================

function attachImageError(
    image,
    description
) {

    image.addEventListener(
        'error',
        () => {

            console.error(
                `Could not load ${description}:`,
                image.src
            );


            image.classList.add(
                'asset-error'
            );


            image.title =
                `Missing asset: ${image.src}`;

        }
    );

}


// ============================================================
// ANIMAL CARD
// ============================================================

function setupAnimalCard(
    image,
    animal,
    location
) {

    image.classList.add(
        'animal-card'
    );


    image.dataset.animalId =
        animal.id;


    image.src =
        animalImage(
            animal
        );


    image.draggable =
        false;


    attachImageError(
        image,
        `animal card ${animal.filename}`
    );


    if (
        location ===
        'enclosure'
    ) {

        image.classList.add(
            'enclosure-animal'
        );

    }


    const trackerKey = progressionKey(animal.category, animal.level);
    if (
        state.progressionGlowHoverKey === trackerKey ||
        state.progressionGlowPinnedKeys.has(trackerKey)
    ) {
        image.classList.add('progression-highlight');
    }

    if (
        shouldGlowForExchange(
            animal
        )
    ) {

        image.classList.add(
            'exchange-eligible'
        );

        // After an animal drag ends, eligible glows fade smoothly back in.
        if (Date.now() < state.exchangeGlowReturnUntil && state.exchangeGlowReturnIds?.has(animal.id)) {
            image.classList.add('exchange-glow-return');
        }

    }

    // Keep the glow state that existed when dragging began visible for one
    // second, then fade it away over the following second. This snapshot is
    // needed because removing the dragged card can temporarily change which
    // cards are logically exchange-eligible.
    if (
        state.drag?.type === 'animal' &&
        state.drag.exchangeGlowIds?.has(animal.id)
    ) {
        image.classList.add('exchange-drag-glow');
    } else if (
        Date.now() < state.exchangeGlowContinueUntil &&
        state.exchangeGlowContinueIds?.has(animal.id)
    ) {
        image.classList.add('exchange-drag-glow');
        const elapsed = Math.max(0, Date.now() - state.exchangeGlowContinueStartedAt);
        image.style.animationDelay = `${-elapsed}ms`;
    }


    image.addEventListener(
        'mouseenter',
        () => {

            requestHoverPreview(
                animal
            );

        }
    );

    image.addEventListener(
        'mouseleave',
        () => {
            hideHoverPreviewIfAllowed(animal);
        }
    );


    image.addEventListener(
        'pointerdown',
        event => {

            if (
                event.button !== 0
            ) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();

            // During a two-finger phone pinch, neither finger may start a
            // card drag. The zooBoard capture listener has already registered
            // this pointer by the time this handler runs.
            if (event.pointerType === 'touch' && zooTouchPointers.size >= 2) return;

            startAnimalDrag(
                event,
                animal,
                location
            );

        }
    );

}


// ============================================================
// HOVER PREVIEW
// ============================================================

function cancelHoverPreviewHide() {
    if (state.previewHideTimer) {
        clearTimeout(state.previewHideTimer);
        state.previewHideTimer = null;
    }
}

const PREVIEW_INTENT_DELAY = 180;
const PREVIEW_VISIBLE_AFTER_LEAVE = 2000;

function cancelHoverPreviewIntent(animal = null) {
    if (animal && state.previewIntentAnimalId !== animal.id) return;
    if (state.previewIntentTimer) clearTimeout(state.previewIntentTimer);
    state.previewIntentTimer = null;
    state.previewIntentAnimalId = null;
}

function showHoverPreview(animal) {
    cancelHoverPreviewHide();
    cancelHoverPreviewIntent();
    state.lastHoveredAnimal = animal;
    state.previewHoveredAnimalId = animal.id;
    state.previewWikiAnimalId = null;
    hoverPreview.classList.remove('wiki-open');
    hoverPreviewImage.src = animalImage(animal);
    hoverPreview.classList.add('visible');
}

/* A short hover-intent delay prevents cards merely crossed by the cursor
   from replacing the preview. 180 ms is quick when you deliberately stop
   on a card, but long enough to ignore normal mouse travel across the zoo. */
function requestHoverPreview(animal) {
    cancelHoverPreviewHide();
    cancelHoverPreviewIntent();
    state.previewIntentAnimalId = animal.id;
    state.previewIntentTimer = setTimeout(() => {
        state.previewIntentTimer = null;
        state.previewIntentAnimalId = null;
        showHoverPreview(animal);
    }, PREVIEW_INTENT_DELAY);
}

function scheduleHoverPreviewHide(animal = null) {
    cancelHoverPreviewIntent(animal);
    cancelHoverPreviewHide();

    if (animal && state.previewHoveredAnimalId !== animal.id) return;

    state.previewHideTimer = setTimeout(() => {
        state.previewHoveredAnimalId = null;
        hoverPreview.classList.remove('visible');
        hoverPreview.classList.remove('super-zoom');
        state.previewHideTimer = null;
    }, PREVIEW_VISIBLE_AFTER_LEAVE);
}

function hideHoverPreviewIfAllowed(animal) {
    /* If the cursor only crossed this card before the intent delay elapsed,
       cancel it without touching the preview that is already on screen. */
    if (state.previewIntentAnimalId === animal.id) {
        cancelHoverPreviewIntent(animal);
        return;
    }
    scheduleHoverPreviewHide(animal);
}

// ============================================================
// WIKIPEDIA CARD BACK
//
// Clicking the enlarged bottom-left preview flips it to a text view of
// the matching English Wikipedia article. The article is loaded through
// Wikipedia's public MediaWiki Action API, which is much more reliable
// here than trying to iframe wikipedia.org (sites can block framing).
// ============================================================

function animalDisplayName(animal) {
    return String(animal?.filename || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function animalDatabaseKey(name) {
    return String(name || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[’‘]/g, "'")
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function indexAnimalDatabase() {
    state.animalDatabaseByName = new Map();
    for (const record of state.animalDatabase?.animals || []) {
        const keys = [record.english_name, record.id, record.scientific_name]
            .map(animalDatabaseKey).filter(Boolean);
        for (const key of keys) state.animalDatabaseByName.set(key, record);
    }
}

function databaseRecordForAnimal(animal) {
    return state.animalDatabaseByName.get(animalDatabaseKey(animalDisplayName(animal))) || null;
}

function formatLocalZootierliste(record) {
    if (!record?.zootierliste) return '';
    const z = record.zootierliste;
    const c = z.combined || {};
    const lines = [
        `${record.english_name} (${record.scientific_name})`,
        '',
        `Current holdings${z.combined_complete ? '' : ' — collected subtotal'}:`,
        `Europe*: ${c.europe_custom ?? 0}`,
        `Netherlands: ${c.netherlands ?? 0}`,
        `EU: ${c.eu ?? 0}`,
        `Non-EU: ${c.non_eu ?? 0}`,
        `North America: ${c.north_america ?? 0}`,
        `South America: ${c.south_america ?? 0}`,
        `Africa: ${c.africa ?? 0}`,
        `Asia: ${c.asia ?? 0}`,
        `Australia & Oceania: ${c.oceania ?? 0}`,
        `Worldwide: ${c.worldwide ?? 0}`,
        '',
        'Listings:'
    ];
    for (const listing of z.listings || []) {
        const h = listing.holdings || {};
        lines.push(
            '',
            `${listing.listing_name} — ${listing.scientific_name}`,
            `Europe*: ${h.europe_custom ?? 0} | NL: ${h.netherlands ?? 0} | EU: ${h.eu ?? 0} | Non-EU: ${h.non_eu ?? 0}`,
            `NA: ${h.north_america ?? 0} | SA: ${h.south_america ?? 0} | Africa: ${h.africa ?? 0} | Asia: ${h.asia ?? 0} | Oceania: ${h.oceania ?? 0} | Total: ${h.worldwide ?? 0}`
        );
        for (const holder of listing.netherlands_holders || []) {
            lines.push(`  NL — ${holder.location} — ${holder.institution}`);
        }
    }
    return lines.join('\n');
}

function ensureWikipediaBack() {
    let back = document.getElementById('hoverPreviewWiki');
    if (back) return back;

    back = document.createElement('div');
    back.id = 'hoverPreviewWiki';
    back.innerHTML = `
        <div class="animal-info-tabs">
            <button type="button" class="animal-info-tab active" data-info-tab="wikipedia">Wikipedia</button>
            <button type="button" class="animal-info-tab" data-info-tab="zootierliste">Zootierliste</button>
        </div>
        <div class="wiki-preview-toolbar">
            <strong id="wikiPreviewTitle">Wikipedia</strong>
            <a id="wikiPreviewLink" target="_blank" rel="noopener noreferrer">Open on Wikipedia ↗</a>
        </div>
        <div id="wikiPreviewStatus">Click a preview card to load its English Wikipedia article.</div>
        <div id="wikiPreviewText"></div>
        <div id="ztlPreviewPane" hidden>
            <div class="wiki-preview-toolbar">
                <strong id="ztlPreviewTitle">Zootierliste</strong>
                <a id="ztlPreviewLink" target="_blank" rel="noopener noreferrer">Open Zootierliste ↗</a>
            </div>
            <div id="ztlPreviewStatus">Zootierliste data has not been loaded yet.</div>
            <div id="ztlPreviewText"></div>
        </div>
    `;
    hoverPreview.appendChild(back);

    back.querySelectorAll('.animal-info-tab').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            selectAnimalInfoTab(button.dataset.infoTab);
        });
    });
    return back;
}

function selectAnimalInfoTab(tab) {
    ensureWikipediaBack();
    const wikiText = document.getElementById('wikiPreviewText');
    const wikiStatus = document.getElementById('wikiPreviewStatus');
    const wikiToolbar = document.querySelector('#hoverPreviewWiki > .wiki-preview-toolbar');
    const ztlPane = document.getElementById('ztlPreviewPane');
    document.querySelectorAll('.animal-info-tab').forEach(button =>
        button.classList.toggle('active', button.dataset.infoTab === tab)
    );

    const ztl = tab === 'zootierliste';
    wikiText.hidden = ztl;
    wikiStatus.hidden = ztl;
    wikiToolbar.hidden = ztl;
    ztlPane.hidden = !ztl;

    if (ztl && state.lastHoveredAnimal && state.previewScientificName) {
        loadZootierlisteForAnimal(state.lastHoveredAnimal, state.previewScientificName);
    }
}

async function wikipediaScientificName(wikibaseItem) {
    if (!wikibaseItem) return '';
    const params = new URLSearchParams({
        action: 'wbgetentities',
        ids: wikibaseItem,
        props: 'claims',
        format: 'json',
        origin: '*'
    });
    const response = await fetch(`https://www.wikidata.org/w/api.php?${params.toString()}`);
    if (!response.ok) return '';
    const data = await response.json();
    return String(data?.entities?.[wikibaseItem]?.claims?.P225?.[0]?.mainsnak?.datavalue?.value || '').trim();
}

async function loadWikipediaForAnimal(animal) {
    ensureWikipediaBack();

    const titleEl = document.getElementById('wikiPreviewTitle');
    const linkEl = document.getElementById('wikiPreviewLink');
    const statusEl = document.getElementById('wikiPreviewStatus');
    const textEl = document.getElementById('wikiPreviewText');
    const colour = state.categoryColours[animal.category] || CATEGORY_COLOURS[animal.category] || '#777777';
    const back = document.getElementById('hoverPreviewWiki');
    back.style.background = colour;

    const query = animalDisplayName(animal);
    titleEl.textContent = query || 'Wikipedia';
    linkEl.removeAttribute('href');
    statusEl.textContent = 'Loading English Wikipedia…';
    textEl.textContent = '';
    state.previewScientificName = '';
    state.previewZtlAnimalId = null;

    const token = ++state.previewWikiRequestToken;

    try {
        const params = new URLSearchParams({
            action: 'query',
            generator: 'search',
            gsrsearch: query,
            gsrlimit: '1',
            prop: 'extracts|pageprops',
            explaintext: '1',
            redirects: '1',
            format: 'json',
            origin: '*'
        });

        const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
        if (!response.ok) throw new Error(`Wikipedia returned HTTP ${response.status}`);
        const data = await response.json();
        if (token !== state.previewWikiRequestToken) return;

        const pages = Object.values(data?.query?.pages || {});
        if (!pages.length) throw new Error(`No English Wikipedia article found for “${query}”.`);

        const page = pages[0];
        const pageTitle = page.title || query;
        const extract = String(page.extract || '').trim();
        const scientificName = await wikipediaScientificName(page?.pageprops?.wikibase_item);
        if (token !== state.previewWikiRequestToken) return;

        state.previewScientificName = scientificName;
        titleEl.textContent = scientificName ? `${pageTitle} (${scientificName})` : pageTitle;
        linkEl.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replace(/ /g, '_'))}`;
        statusEl.textContent = scientificName
            ? `English Wikipedia • scientific name: ${scientificName}`
            : 'English Wikipedia • article text';
        textEl.textContent = extract || 'Wikipedia returned this page without a text extract.';
    }
    catch (error) {
        if (token !== state.previewWikiRequestToken) return;
        statusEl.textContent = 'Wikipedia could not be loaded.';
        textEl.textContent = `${error.message}\n\nYou can still use the Wikipedia link once an article is found in a later attempt.`;
    }
}

function ztlSpeciesBinomial(scientificName) {
    return String(scientificName || '').trim().split(/\s+/).slice(0, 2).join(' ');
}

function ztlProxyUrl(url) {
    return `https://r.jina.ai/${url}`;
}

function ztlExtractSearchLinks(text) {
    const links = [];
    const re = /https?:\/\/(?:www\.)?zootierliste\.de\/(?:en\/)?(?:index\.php)?\?[^\s)\]<>]+/gi;
    for (const match of String(text || '').matchAll(re)) {
        const url = match[0].replace(/[.,;]+$/, '').replace(/&amp;/g, '&');
        if (/\bart=\d+/i.test(url) && !links.includes(url)) links.push(url);
    }
    return links;
}

function ztlHoldingCount(section) {
    const totals = [...String(section || '').matchAll(/Holdings?:\s*(\d+)/gi)].map(m => Number(m[1]));
    if (totals.length) return totals[totals.length - 1];
    const countryCounts = [...String(section || '').matchAll(/\((\d+)\s+Holding\(s\)\)/gi)].map(m => Number(m[1]));
    return countryCounts.reduce((a, b) => a + b, 0);
}

function parseZtlPage(text, url, binomial) {
    const clean = String(text || '').replace(/\r/g, '');
    const latinMatches = [...clean.matchAll(new RegExp(`\\b${binomial.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}(?:\\s+[a-z-]+)?\\b`, 'gi'))];
    if (!latinMatches.length) return null;
    const scientificName = latinMatches[0][0].trim();
    const isRelevant = scientificName.toLowerCase() === binomial.toLowerCase() ||
        scientificName.toLowerCase().startsWith(binomial.toLowerCase() + ' ');
    if (!isRelevant) return null;

    const beforeLatin = clean.slice(Math.max(0, latinMatches[0].index - 500), latinMatches[0].index)
        .split('\n').map(x => x.trim()).filter(Boolean);
    let commonName = beforeLatin.reverse().find(line =>
        line.length < 100 && !/^image\b/i.test(line) && !/^#+\s*$/.test(line) && !/^zootierliste/i.test(line)
    ) || scientificName;
    commonName = commonName.replace(/^#+\s*/, '').trim();

    const currentPart = clean.split(/Former\s+Holdings/i)[0];
    const euMatch = currentPart.match(/Europe\s*\(EU\)([\s\S]*?)(?=Europe\s*\((?:Non-?EU|NichtEU)\)|Africa|Asia|North America|South America|Oceania|$)/i);
    const nonEuMatch = currentPart.match(/Europe\s*\((?:Non-?EU|NichtEU)\)([\s\S]*?)(?=Africa|Asia|North America|South America|Oceania|$)/i);
    const eu = euMatch ? ztlHoldingCount(euMatch[1]) : 0;
    const nonEu = nonEuMatch ? ztlHoldingCount(nonEuMatch[1]) : 0;

    return { commonName, scientificName, url, eu, nonEu, europe: eu + nonEu };
}

async function loadZootierlisteForAnimal(animal, scientificName = '') {
    if (!animal) return;
    const titleEl = document.getElementById('ztlPreviewTitle');
    const linkEl = document.getElementById('ztlPreviewLink');
    const statusEl = document.getElementById('ztlPreviewStatus');
    const textEl = document.getElementById('ztlPreviewText');
    const record = databaseRecordForAnimal(animal);

    if (record) {
        titleEl.textContent = `Zootierliste — ${record.english_name}`;
        statusEl.textContent = record.zootierliste?.combined_complete
            ? 'Local Zoo Curator database • current holdings'
            : 'Local Zoo Curator database • current collected subtotal';
        textEl.textContent = formatLocalZootierliste(record);
        const firstUrl = record.zootierliste?.listings?.find(x => x.source_url)?.source_url;
        linkEl.href = firstUrl || 'https://www.zootierliste.de/en/?action=expsuche';
        state.previewZtlAnimalId = animal.id;
        state.previewZtlScientificName = record.scientific_name || scientificName || '';
        return;
    }

    titleEl.textContent = `Zootierliste — ${animalDisplayName(animal)}`;
    statusEl.textContent = 'This animal is not in assets/data/animals.json yet.';
    textEl.textContent = 'Add this animal to the JSON database and reload the game. No game-code change is required.';
    linkEl.href = 'https://www.zootierliste.de/en/?action=expsuche';
}

async function flipPreviewToWikipedia() {
    const animal = state.lastHoveredAnimal;
    if (!animal || !hoverPreview.classList.contains('visible')) return;

    cancelHoverPreviewHide();
    ensureWikipediaBack();

    if (hoverPreview.classList.contains('wiki-open')) {
        hoverPreview.classList.remove('wiki-open');
        return;
    }

    hoverPreview.classList.add('wiki-open');

    // Wikipedia is the default information view. Zootierliste is available
    // as the second tab and is only loaded when that tab is selected.
    selectAnimalInfoTab('wikipedia');
    if (state.previewWikiAnimalId !== animal.id) {
        state.previewWikiAnimalId = animal.id;
        await loadWikipediaForAnimal(animal);
    }
}

// ============================================================
// RENDER ZOO
// ============================================================

function renderZoo() {

    const scrollLeft =
        zooBoard.scrollLeft;

    const scrollTop =
        zooBoard.scrollTop;


    zooCanvas.innerHTML =
        '';


    zooCanvas.style.width =
        WORKSPACE_W + 'px';

    zooCanvas.style.height =
        WORKSPACE_H + 'px';


    for (
        const enclosure
        of state.enclosures
    ) {

        renderEnclosure(
            enclosure
        );

    }


    zooBoard.scrollLeft =
        scrollLeft;

    zooBoard.scrollTop =
        scrollTop;

}


// ============================================================
// RENDER ENCLOSURE
// ============================================================

function renderEnclosure(
    enclosure
) {

    const element =
        document.createElement(
            'div'
        );


    element.className =
        'enclosure';


    if (
        state.glowingEnclosureIds
            .has(
                enclosure.id
            )
    ) {

        element.classList.add(
            'new-enclosure'
        );

    }


    element.dataset.enclosureId =
        enclosure.id;


    element.style.left =
        enclosure.x + 'px';

    element.style.top =
        enclosure.y + 'px';


    const image =
        document.createElement(
            'img'
        );


    image.className =
        'enclosure-image';


    image.src =
        enclosurePath(
            enclosure.number
        );


    image.draggable =
        false;


    attachImageError(
        image,
        `Enclosure ${enclosure.number}`
    );


    element.appendChild(
        image
    );


    for (
        const slotIndex
        of getAllSlots(
            enclosure
        )
    ) {

        const slot =
            document.createElement(
                'div'
            );


        slot.className =
            'slot';


        slot.dataset.enclosureId =
            enclosure.id;

        slot.dataset.slotIndex =
            slotIndex;


        const animal =
            animalAtSlot(
                enclosure.id,
                slotIndex
            );


        if (animal) {

            const card =
                document.createElement(
                    'img'
                );


            setupAnimalCard(
                card,
                animal,
                'enclosure'
            );


            slot.appendChild(
                card
            );

        }
        else {

            slot.classList.add(
                'empty-slot'
            );

        }


        element.appendChild(
            slot
        );

    }


    element.addEventListener(
        'pointerdown',
        event => {

            if (
                event.button !== 0
            ) {
                return;
            }


            if (
                event.target.closest(
                    '.animal-card'
                )
            ) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();


            startEnclosureDrag(
                event,
                enclosure,
                element
            );

        }
    );


    zooCanvas.appendChild(
        element
    );

}


// ============================================================
// RENDER HAND
// ============================================================

function renderHand() {

    handElement.innerHTML =
        '';


    for (
        const animal
        of state.hand
    ) {

        const image =
            document.createElement(
                'img'
            );


        setupAnimalCard(
            image,
            animal,
            'hand'
        );


        handElement.appendChild(
            image
        );

    }

}


// ============================================================
// EXCHANGE CARD SETUP
//
// Exchange cards are draggable back out of the exchange slots.
// ============================================================

function setupExchangeCard(
    image,
    animal
) {

    image.className =
        'exchange-card animal-card';


    image.src =
        animalImage(
            animal
        );


    image.draggable =
        false;


    attachImageError(
        image,
        'exchange animal'
    );


    image.addEventListener(
        'mouseenter',
        () => {

            requestHoverPreview(
                animal
            );

        }
    );

    image.addEventListener(
        'mouseleave',
        () => {
            hideHoverPreviewIfAllowed(animal);
        }
    );


    image.addEventListener(
        'pointerdown',
        event => {

            if (
                event.button !== 0
            ) {
                return;
            }


            event.preventDefault();
            event.stopPropagation();


            /*
                Taking either card back cancels the pending
                result. The result can simply be recreated
                when two valid cards are inserted again.
            */

            state.result = null;


            startAnimalDrag(
                event,
                animal,
                'exchange'
            );

        }
    );

}


// ============================================================
// RENDER EXCHANGE
// ============================================================

function renderExchange() {

    const categories =
        eligibleExchangeCategories();


    const ready =
        (
            categories.length > 0 ||
            state.exchange.some(Boolean)
        );


    exchange1.classList.toggle(
        'exchange-ready',
        ready
    );


    exchange2.classList.toggle(
        'exchange-ready',
        ready
    );


    exchange1.innerHTML = '';
    exchange2.innerHTML = '';
    exchange1.dataset.boxLabel = 'EXCHANGE';
    exchange2.dataset.boxLabel = 'EXCHANGE';


    state.exchange.forEach(
        (
            animal,
            index
        ) => {

            if (!animal) {
                return;
            }


            const image =
                document.createElement(
                    'img'
                );


            setupExchangeCard(
                image,
                animal
            );


            (
                index === 0
                    ? exchange1
                    : exchange2
            ).appendChild(
                image
            );

        }
    );


    resultBox.innerHTML = '';
    resultBox.dataset.boxLabel = 'UPGRADE';


    resultBox.classList.toggle(
        'result-ready',
        Boolean(
            state.result
        )
    );


    if (state.result) {

        const image =
            document.createElement(
                'img'
            );


        image.className =
            'result-card';


        image.src =
            animalBackPath(
                state.result.category,
                state.result.level
            );


        attachImageError(
            image,
            'exchange result back'
        );


        image.draggable = false;

        image.addEventListener(
            'pointerdown',
            event => {
                if (event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                startResultDrag(event);
            }
        );


        resultBox.appendChild(
            image
        );

    }

}


// ============================================================
// UPGRADE RESULT DRAG
// ============================================================

function startResultDrag(event) {
    if (!state.result || state.drag || state.pan) return;

    const sourceRect = event.currentTarget.getBoundingClientRect();
    const dragImage = document.createElement('img');
    dragImage.className = 'dragging-animal dragging-result';
    dragImage.src = animalBackPath(state.result.category, state.result.level);
    dragImage.style.width = `${sourceRect.width}px`;
    dragImage.style.height = `${sourceRect.height}px`;
    document.body.appendChild(dragImage);

    state.drag = {
        type: 'result',
        image: dragImage,
        startClientX: event.clientX,
        startClientY: event.clientY,
        offsetX: event.clientX - sourceRect.left,
        offsetY: event.clientY - sourceRect.top
    };

    moveResultDragImage(event);
}

function moveResultDragImage(event) {
    if (state.drag?.type !== 'result') return;
    state.drag.image.style.left = `${event.clientX - state.drag.offsetX}px`;
    state.drag.image.style.top = `${event.clientY - state.drag.offsetY}px`;
}

function completeExchange(destination = null) {
    if (!state.result) return false;

    state.glowingEnclosureIds.clear();

    const newAnimal = createAnimal(
        state.result.category,
        state.result.level,
        state.result.filename
    );

    if (destination) {
        if (!placeAnimal(newAnimal, destination.enclosure, destination.slotIndex)) {
            return false;
        }
    } else {
        newAnimal.hand = true;
        state.hand.push(newAnimal);
    }

    state.animals.push(newAnimal);
    markPlayerLevelSeen(newAnimal.level);

    const exchangedIds = state.exchange.filter(Boolean).map(animal => animal.id);
    state.animals = state.animals.filter(animal => !exchangedIds.includes(animal.id));
    state.exchange = [null, null];
    state.result = null;

    for (const id of exchangedIds) state.suppressedExchangeGlowIds.delete(id);

    checkEnclosureReward(newAnimal);
    state.turn++;
    updateTurnDisplay();
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}

function resultDropDestination(event) {
    const target = elementUnderPointer(event);
    if (!target) return null;

    const slot = target.closest('.slot');
    if (slot) {
        const enclosure = state.enclosures.find(item => item.id === Number(slot.dataset.enclosureId));
        const slotIndex = Number(slot.dataset.slotIndex);
        if (enclosure && !animalAtSlot(enclosure.id, slotIndex)) {
            return { enclosure, slotIndex };
        }
    }

    const enclosureElement = target.closest('.enclosure');
    if (!enclosureElement) return null;
    const enclosure = state.enclosures.find(item => item.id === Number(enclosureElement.dataset.enclosureId));
    if (!enclosure) return null;

    const free = getAllSlots(enclosure).find(slotIndex => !animalAtSlot(enclosure.id, slotIndex));
    return free === undefined ? null : { enclosure, slotIndex: free };
}

function finishResultDrag(event) {
    const drag = state.drag;
    if (!drag || drag.type !== 'result') return;

    const distance = Math.hypot(
        event.clientX - drag.startClientX,
        event.clientY - drag.startClientY
    );

    drag.image?.remove();
    state.drag = null;

    // A simple click keeps the existing behaviour: reveal into hand.
    if (distance < 6) {
        completeExchange(null);
        return;
    }

    const destination = resultDropDestination(event);
    if (destination) {
        completeExchange(destination);
    } else {
        renderExchange();
    }
}


function progressionKey(category, level) {
    return `${category}|${level}`;
}

function updateDiscoveredCategoryLevels() {
    for (const animal of state.animals) {
        state.discoveredCategoryLevels.add(progressionKey(animal.category, animal.level));
    }
}

function hasCategoryLevel(category, level) {
    return state.discoveredCategoryLevels.has(progressionKey(category, level));
}

function renderProgressTracker() {
    let tracker = document.getElementById('progressTracker');
    if (!tracker) {
        tracker = document.createElement('div');
        tracker.id = 'progressTracker';
        document.getElementById('actionMenu').appendChild(tracker);
    }

    updateDiscoveredCategoryLevels();
    tracker.innerHTML = '';

    const table = document.createElement('div');
    table.className = 'progress-table';

    const blank = document.createElement('div');
    blank.className = 'progress-heading progress-category-heading';
    blank.textContent = 'Animals';
    table.appendChild(blank);

    for (let level = 1; level <= 5; level++) {
        const h = document.createElement('div');
        h.className = 'progress-heading';
        h.textContent = `Level ${level}`;
        table.appendChild(h);
    }

    // Visual order of the Category Progression rows in the header.
    // Do not alphabetise this list: it follows the game's fixed progression order.
    const categories = CATEGORY_PROGRESSION_ORDER;

    for (const category of categories) {
        const colour = state.categoryColours[category] || CATEGORY_COLOURS[category] || '#777';

        const c = document.createElement('div');
        c.className = 'progress-category';
        c.textContent = category;
        c.style.background = colour;
        table.appendChild(c);

        for (let level = 1; level <= 5; level++) {
            const cell = document.createElement('div');
            cell.className = 'progress-check-cell';

            const box = document.createElement('span');
            box.className = 'progress-checkbox';

            const key = progressionKey(category, level);
            if (hasCategoryLevel(category, level)) {
                box.classList.add('checked');
                box.style.background = colour;
                box.style.borderColor = colour;
                box.title = `Highlight ${category} Level ${level} animals`;
                box.addEventListener('mouseenter', () => {
                    state.progressionGlowHoverKey = key;
                    renderZoo();
                });
                box.addEventListener('mouseleave', () => {
                    if (state.progressionGlowHoverKey === key) state.progressionGlowHoverKey = null;
                    renderZoo();
                });
                box.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (state.progressionGlowPinnedKeys.has(key)) state.progressionGlowPinnedKeys.delete(key);
                    else state.progressionGlowPinnedKeys.add(key);
                    renderProgressTracker();
                    renderZoo();
                });
                if (state.progressionGlowPinnedKeys.has(key)) box.classList.add('pinned');
            }

            cell.appendChild(box);
            table.appendChild(cell);
        }
    }

    tracker.appendChild(table);
}


// ============================================================
// V45 — SAVE / LOAD + READ-ONLY TURN HISTORY
// ============================================================

const SAVE_STORAGE_KEY = 'zooCuratorSavedGamesV1';
const SAVE_FORMAT_VERSION = 1;
const MAX_SAVE_SLOTS = 8;

const SAVE_STATE_KEYS = [
    'gameOptions',
    'zooName',
    'opponentNames',
    'activeCategories',
    'opponentProfiles',
    'outgoingOffer',
    'tradeOffers',
    'selectedTradeOpponent',
    'opponentTradeStocks',
    'opponentStockCycle',
    'autonomousTradeOffer',
    'nextAutonomousOfferTurn',
    'tradeOfferCache',
    'unlockedOpponentCount',
    'playerLevelsSeen',
    'enclosures',
    'animals',
    'hand',
    'exchange',
    'result',
    'nextId',
    'turn',
    'zoom',
    'enclosure10Unlocked',
    'enclosureRewards',
    'glowingEnclosureIds',
    'suppressedExchangeGlowIds',
    'lastExchangeGroupCounts',
    'discoveredCategoryLevels',
    'acquiredLevel2Categories',
    'awardedLevel2Milestones',
    'awardedProgressMilestones',
    'progressionGlowPinnedKeys',
    'realZooUnlockedTier',
    'realZooSessionHoldings'
];

function serialiseSpecial(value) {
    if (value instanceof Set) {
        return { __zooType: 'Set', values: [...value].map(serialiseSpecial) };
    }
    if (value instanceof Map) {
        return {
            __zooType: 'Map',
            entries: [...value.entries()].map(([key, item]) => [
                serialiseSpecial(key),
                serialiseSpecial(item)
            ])
        };
    }
    if (Array.isArray(value)) return value.map(serialiseSpecial);
    if (value && typeof value === 'object') {
        const copy = {};
        for (const [key, item] of Object.entries(value)) {
            // Never save transient DOM objects, drag state or timers.
            if (
                key === 'element' ||
                key === 'image' ||
                key === 'sourceElement'
            ) continue;
            copy[key] = serialiseSpecial(item);
        }
        return copy;
    }
    return value;
}

function deserialiseSpecial(value) {
    if (Array.isArray(value)) return value.map(deserialiseSpecial);
    if (value && typeof value === 'object') {
        if (value.__zooType === 'Set') {
            return new Set((value.values || []).map(deserialiseSpecial));
        }
        if (value.__zooType === 'Map') {
            return new Map((value.entries || []).map(([key, item]) => [
                deserialiseSpecial(key),
                deserialiseSpecial(item)
            ]));
        }
        const copy = {};
        for (const [key, item] of Object.entries(value)) {
            copy[key] = deserialiseSpecial(item);
        }
        return copy;
    }
    return value;
}

function cloneForSave(value) {
    return deserialiseSpecial(
        JSON.parse(JSON.stringify(serialiseSpecial(value)))
    );
}

function currentVisualSnapshot() {
    return {
        turn: state.turn,
        zooName: state.zooName,
        enclosures: cloneForSave(state.enclosures),
        animals: cloneForSave(state.animals),
        zoom: state.zoom
    };
}

function captureTurnSnapshot() {
    if (
        !state.loaded ||
        state.suppressHistoryCapture ||
        state.historyViewTurn !== null
    ) return;

    const snapshot = currentVisualSnapshot();
    const existingIndex = state.turnHistory.findIndex(
        item => item.turn === snapshot.turn
    );

    if (existingIndex >= 0) {
        state.turnHistory[existingIndex] = snapshot;
    } else {
        state.turnHistory.push(snapshot);
        state.turnHistory.sort((a, b) => a.turn - b.turn);
    }

    updateHistoryControls();
}

function resetTurnHistory() {
    state.turnHistory = [];
    state.historyViewTurn = null;
    state.historyLiveView = null;
    document.body.classList.remove('history-viewing');
}

function exportCurrentGameState() {
    const data = {};
    for (const key of SAVE_STATE_KEYS) {
        data[key] = cloneForSave(state[key]);
    }

    return {
        version: SAVE_FORMAT_VERSION,
        state: data,
        turnHistory: cloneForSave(state.turnHistory),
        view: {
            scrollLeft: zooBoard.scrollLeft,
            scrollTop: zooBoard.scrollTop
        }
    };
}

function relinkLoadedPlayerReferences() {
    const byId = new Map(state.animals.map(animal => [animal.id, animal]));
    state.hand = (state.hand || [])
        .map(animal => byId.get(animal.id) || animal);
    state.exchange = (state.exchange || [null, null])
        .map(animal => animal ? (byId.get(animal.id) || animal) : null);
    if (state.outgoingOffer) {
        state.outgoingOffer =
            byId.get(state.outgoingOffer.id) || state.outgoingOffer;
    }
}

function importGameState(saveData) {
    if (!saveData || !saveData.state) {
        throw new Error('This save file does not contain a valid Zoo Curator game.');
    }

    exitHistoryView(false);
    state.suppressHistoryCapture = true;

    for (const key of SAVE_STATE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(saveData.state, key)) {
            state[key] = cloneForSave(saveData.state[key]);
        }
    }

    state.turnHistory = cloneForSave(saveData.turnHistory || []);
    state.historyViewTurn = null;
    state.historyLiveView = null;
    state.drag = null;
    state.pan = null;
    relinkLoadedPlayerReferences();

    document.documentElement.style.setProperty('--zoo-zoom', state.zoom);
    document.body.classList.remove('history-viewing');

    renderAll();

    requestAnimationFrame(() => {
        if (saveData.view) {
            zooBoard.scrollLeft = Number(saveData.view.scrollLeft) || 0;
            zooBoard.scrollTop = Number(saveData.view.scrollTop) || 0;
        }
        state.suppressHistoryCapture = false;
        captureTurnSnapshot();
        updateHistoryControls();
    });
}

function loadSaveSlots() {
    try {
        const parsed = JSON.parse(localStorage.getItem(SAVE_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('Could not read saved games:', error);
        return [];
    }
}

function writeSaveSlots(slots) {
    localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(slots));
}

function saveCurrentGame(slotId = null) {
    if (state.historyViewTurn !== null) {
        alert('Return to the current turn before saving the game.');
        return;
    }

    captureTurnSnapshot();

    const slots = loadSaveSlots();
    let existingIndex = slotId
        ? slots.findIndex(slot => slot.id === slotId)
        : -1;

    let name = existingIndex >= 0
        ? slots[existingIndex].name
        : `Save ${slots.length + 1}`;

    const entered = prompt('Name this save game:', name);
    if (entered === null) return;

    name = entered.trim() || name;

    const record = {
        id: existingIndex >= 0
            ? slots[existingIndex].id
            : `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        zooName: state.zooName,
        turn: state.turn,
        animalCount: state.animals.length,
        enclosureCount: state.enclosures.length,
        savedAt: new Date().toISOString(),
        game: exportCurrentGameState()
    };

    if (existingIndex >= 0) {
        slots[existingIndex] = record;
    } else {
        if (slots.length >= MAX_SAVE_SLOTS) {
            alert(`You can keep up to ${MAX_SAVE_SLOTS} saved games. Delete or overwrite one first.`);
            return;
        }
        slots.unshift(record);
    }

    try {
        writeSaveSlots(slots);
        renderSaveSlots();
    } catch (error) {
        console.error(error);
        alert(
            'The browser could not store this save. Its local storage may be full. ' +
            'Delete an older save and try again.'
        );
    }
}

function loadSavedGame(slotId) {
    const record = loadSaveSlots().find(slot => slot.id === slotId);
    if (!record) return;

    const ok = confirm(
        `Load “${record.name}”?\n\nYour current unsaved game will be replaced.`
    );
    if (!ok) return;

    try {
        importGameState(record.game);
        closeSaveLoadMenu();
    } catch (error) {
        console.error(error);
        alert(`Could not load this save:\n\n${error.message}`);
    }
}

function deleteSavedGame(slotId) {
    const slots = loadSaveSlots();
    const record = slots.find(slot => slot.id === slotId);
    if (!record) return;
    if (!confirm(`Delete “${record.name}”?`)) return;

    writeSaveSlots(slots.filter(slot => slot.id !== slotId));
    renderSaveSlots();
}

function formatSaveDate(iso) {
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(iso));
    } catch {
        return iso || '';
    }
}

function renderSaveSlots() {
    const list = document.getElementById('saveSlotList');
    if (!list) return;

    const slots = loadSaveSlots();
    list.innerHTML = '';

    if (!slots.length) {
        const empty = document.createElement('div');
        empty.className = 'save-empty';
        empty.textContent = 'No saved games yet.';
        list.appendChild(empty);
        return;
    }

    for (const slot of slots) {
        const row = document.createElement('div');
        row.className = 'save-slot';
        row.innerHTML = `
            <div class="save-slot-info">
                <strong></strong>
                <span class="save-slot-zoo"></span>
                <span class="save-slot-meta"></span>
            </div>
            <div class="save-slot-actions">
                <button type="button" data-action="load">Load</button>
                <button type="button" data-action="overwrite">Overwrite</button>
                <button type="button" data-action="delete">Delete</button>
            </div>
        `;

        row.querySelector('strong').textContent = slot.name;
        row.querySelector('.save-slot-zoo').textContent =
            `${slot.zooName || 'Unnamed Zoo'} — Turn ${slot.turn || 1}`;
        row.querySelector('.save-slot-meta').textContent =
            `${slot.animalCount || 0} animals · ${slot.enclosureCount || 0} enclosure cards · ${formatSaveDate(slot.savedAt)}`;

        row.querySelector('[data-action="load"]').addEventListener(
            'click', () => loadSavedGame(slot.id)
        );
        row.querySelector('[data-action="overwrite"]').addEventListener(
            'click', () => saveCurrentGame(slot.id)
        );
        row.querySelector('[data-action="delete"]').addEventListener(
            'click', () => deleteSavedGame(slot.id)
        );

        list.appendChild(row);
    }
}

function openSaveLoadMenu() {
    if (state.historyViewTurn !== null) return;
    renderSaveSlots();
    document.getElementById('saveLoadOverlay')?.classList.add('visible');
}

function closeSaveLoadMenu() {
    document.getElementById('saveLoadOverlay')?.classList.remove('visible');
}

function ensureSaveLoadUI() {
    if (document.getElementById('saveLoadButton')) return;

    const headerLeft = document.getElementById('headerLeft');
    const optionsButton = document.getElementById('gameOptionsButton');
    const turnDisplay = document.getElementById('turnOrder');

    const button = document.createElement('button');
    button.id = 'saveLoadButton';
    button.type = 'button';
    button.className = 'save-load-button';
    button.textContent = 'Save / Load Game';

    if (headerLeft) {
        headerLeft.insertBefore(button, optionsButton || turnDisplay || headerLeft.firstChild);
    }

    const overlay = document.createElement('div');
    overlay.id = 'saveLoadOverlay';
    overlay.className = 'save-load-overlay';
    overlay.innerHTML = `
        <div class="save-load-modal">
            <h2>Save / Load Game</h2>
            <p>Saved games are stored in this browser. Each save also keeps its turn-history viewer.</p>
            <div id="saveSlotList" class="save-slot-list"></div>
            <div class="save-load-footer">
                <button type="button" id="saveCurrentGame">Save Current Game</button>
                <button type="button" id="closeSaveLoad">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    button.addEventListener('click', openSaveLoadMenu);
    overlay.querySelector('#saveCurrentGame').addEventListener(
        'click', () => saveCurrentGame()
    );
    overlay.querySelector('#closeSaveLoad').addEventListener(
        'click', closeSaveLoadMenu
    );
    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay) closeSaveLoadMenu();
    });
}

function ensureTurnHistoryUI() {
    if (document.getElementById('turnHistoryPanel')) return;

    turnOrder.classList.add('turn-history-trigger');
    turnOrder.title = 'View previous turns';

    const panel = document.createElement('div');
    panel.id = 'turnHistoryPanel';
    panel.className = 'turn-history-panel';
    panel.innerHTML = `
        <div class="turn-history-title">Turn History</div>
        <div id="turnHistoryLabel" class="turn-history-label">Current turn</div>
        <input id="turnHistorySlider" type="range" min="1" max="1" value="1" step="1">
        <div class="turn-history-actions">
            <button type="button" id="returnCurrentTurn">Return to Current Turn</button>
            <button type="button" id="closeTurnHistory">Close</button>
        </div>
        <div class="turn-history-note">
            Previous turns are view-only. You can still pan and zoom around the zoo.
        </div>
    `;
    document.body.appendChild(panel);

    turnOrder.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        panel.classList.toggle('visible');
        updateHistoryControls();
    });

    panel.querySelector('#turnHistorySlider').addEventListener('input', event => {
        viewHistoricalTurn(Number(event.target.value));
    });

    panel.querySelector('#returnCurrentTurn').addEventListener('click', () => {
        exitHistoryView(true);
    });

    panel.querySelector('#closeTurnHistory').addEventListener('click', () => {
        panel.classList.remove('visible');
    });
}

function updateHistoryControls() {
    const slider = document.getElementById('turnHistorySlider');
    const label = document.getElementById('turnHistoryLabel');
    const returnButton = document.getElementById('returnCurrentTurn');
    if (!slider || !label) return;

    const turns = state.turnHistory.map(item => item.turn);
    const minimum = turns.length ? Math.min(...turns) : state.turn;
    const maximum = turns.length ? Math.max(...turns, state.turn) : state.turn;

    slider.min = String(minimum);
    slider.max = String(maximum);
    slider.value = String(
        state.historyViewTurn === null ? state.turn : state.historyViewTurn
    );

    if (state.historyViewTurn === null) {
        label.textContent = `Current Turn ${state.turn}`;
        if (returnButton) returnButton.disabled = true;
    } else {
        label.textContent =
            `Viewing Turn ${state.historyViewTurn} — READ ONLY`;
        if (returnButton) returnButton.disabled = false;
    }
}

function viewHistoricalTurn(turn) {
    const snapshot = state.turnHistory.find(item => item.turn === turn);

    // The far-right/current value always means return to the live game.
    if (!snapshot || turn === state.turn) {
        exitHistoryView(true);
        return;
    }

    if (state.historyViewTurn === null) {
        state.historyLiveView = currentVisualSnapshot();
    }

    state.historyViewTurn = turn;
    state.suppressHistoryCapture = true;

    // Historical turns never show or activate blue trade-interest hints.
    clearTradeEligibleGlow();

    state.enclosures = cloneForSave(snapshot.enclosures);
    state.animals = cloneForSave(snapshot.animals);
    state.zoom = snapshot.zoom || state.zoom;
    document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

    document.body.classList.add('history-viewing');
    renderZoo();
    turnOrder.textContent = `Turn ${turn} · VIEWING`;
    updateHistoryControls();

    state.suppressHistoryCapture = false;
}

function exitHistoryView(render = true) {
    if (state.historyViewTurn === null) return;

    const live = state.historyLiveView;
    state.suppressHistoryCapture = true;

    if (live) {
        state.enclosures = cloneForSave(live.enclosures);
        state.animals = cloneForSave(live.animals);
        state.zoom = live.zoom || state.zoom;
        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);
    }

    state.historyViewTurn = null;
    state.historyLiveView = null;
    document.body.classList.remove('history-viewing');

    if (render) renderAll();
    else updateTurnDisplay();

    state.suppressHistoryCapture = false;
    updateHistoryControls();
}

// Capture-phase protection makes historical zoo states genuinely read-only.
// The zoo board itself is deliberately not blocked, so its pan/zoom handlers
// continue to work. Animal/enclosure interaction is disabled by CSS below.

document.addEventListener('pointerdown', event => {
    if (state.historyViewTurn === null) return;

    // Animal cards remain interactive for preview/zoom/info in history mode,
    // but pointer movement must never become a gameplay drag.
    if (event.target.closest('#zooCanvas .animal-card')) {
        // Do not preventDefault(): click/tap and hover preview functionality
        // must still complete. Stopping propagation keeps board drag logic out.
        event.stopPropagation();
        return;
    }

    // Enclosure cards are never draggable in historical snapshots. Stop the
    // event before the zoo-board drag handler can interpret it as an enclosure
    // move. Empty zoo-board space remains available for panning.
    if (event.target.closest('#zooCanvas .enclosure')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
}, true);

document.addEventListener('click', event => {
    if (state.historyViewTurn === null) return;

    const allowed = event.target.closest(
        '#turnHistoryPanel, #turnOrder, #zooBoard, #hoverPreview, #animalInfoPanel'
    );
    if (allowed) return;

    event.preventDefault();
    event.stopPropagation();
}, true);


// ============================================================
// RENDER ALL
// ============================================================

function renderAll() {
    updateRealZooTierUnlocks();
    rotateOpponentTradeStocksIfNeeded();
    updateDiscoveredCategoryLevels();
    refreshExchangeGlowSuppression();
    renderZoo();
    renderHand();
    renderExchange();
    renderTrade();
    renderProgressTracker();
    updateTurnDisplay();
    captureTurnSnapshot();
}


// ============================================================
// START ANIMAL DRAG
// ============================================================

function startAnimalDrag(
    event,
    animal,
    location
) {

    if (
        state.drag ||
        state.pan
    ) {
        return;
    }


    const source =
        event.currentTarget;


    const sourceRect =
        source.getBoundingClientRect();


    const dragWidth =
        ANIMAL_W *
        state.zoom;


    const dragHeight =
        ANIMAL_H *
        state.zoom;


    const relativeX =
        (
            event.clientX -
            sourceRect.left
        ) /
        Math.max(
            sourceRect.width,
            1
        );


    const relativeY =
        (
            event.clientY -
            sourceRect.top
        ) /
        Math.max(
            sourceRect.height,
            1
        );


    const dragImage =
        document.createElement(
            'img'
        );


    dragImage.className =
        'dragging-animal';


    dragImage.src =
        animalImage(
            animal
        );


    dragImage.style.width =
        dragWidth + 'px';


    dragImage.style.height =
        dragHeight + 'px';


    document.body.appendChild(
        dragImage
    );


    state.exchangeGlowDragStartedAt = Date.now();

    const exchangeGlowIdsAtDragStart = new Set(
        state.animals
            .filter(candidate => shouldGlowForExchange(candidate))
            .map(candidate => candidate.id)
    );

    state.drag = {

        type:
            'animal',

        exchangeGlowIds: exchangeGlowIdsAtDragStart,

        animal,

        location,

        originalEnclosureId:
            animal.enclosureId,

        originalSlotIndex:
            animal.slotIndex,

        originalWasHand:
            state.hand.some(
                item =>
                    item.id ===
                    animal.id
            ),

        originalExchangeIndex:
            state.exchange.findIndex(
                item =>
                    item?.id ===
                    animal.id
            ),

        originalWasOutgoing:
            state.outgoingOffer?.id === animal.id,

        offsetX:
            relativeX *
            dragWidth,

        offsetY:
            relativeY *
            dragHeight,

        image:
            dragImage,

        startClientX: event.clientX,
        startClientY: event.clientY

    };


    removeAnimalFromLocations(
        animal
    );


    /*
        If we removed one of two exchange cards, the pending
        upgrade no longer exists until two valid cards are
        placed there again.
    */

    if (
        location ===
        'exchange'
    ) {

        state.result = null;

    }


    moveAnimalDragImage(
        event
    );


    renderZoo();
    renderHand();
    renderExchange();

}


// ============================================================
// MOVE ANIMAL DRAG
// ============================================================

function moveAnimalDragImage(
    event
) {

    if (
        !state.drag ||
        state.drag.type !==
            'animal'
    ) {
        return;
    }


    state.drag.image.style.left =
        (
            event.clientX -
            state.drag.offsetX
        ) +
        'px';


    state.drag.image.style.top =
        (
            event.clientY -
            state.drag.offsetY
        ) +
        'px';

}


// ============================================================
// RESTORE DRAGGED ANIMAL
// ============================================================

function restoreDraggedAnimal() {

    const drag =
        state.drag;


    if (
        !drag ||
        drag.type !==
            'animal'
    ) {
        return;
    }


    const animal =
        drag.animal;


    /*
        Restore to original zoo slot.
    */

    if (
        drag.originalEnclosureId !==
        null
    ) {

        const enclosure =
            state.enclosures.find(
                item =>
                    item.id ===
                    drag.originalEnclosureId
            );


        if (
            enclosure &&
            canPlace(
                animal,
                enclosure,
                drag.originalSlotIndex
            )
        ) {

            animal.enclosureId =
                enclosure.id;

            animal.slotIndex =
                drag.originalSlotIndex;

            return;

        }

    }


    /*
        Restore to exchange.
    */

    if (
        drag.originalExchangeIndex >= 0
    ) {

        state.exchange[
            drag.originalExchangeIndex
        ] =
            animal;


        if (
            state.exchange[0] &&
            state.exchange[1]
        ) {

            createExchangeResult();

        }


        return;

    }


    /* Restore to outgoing trade offer. */
    if (drag.originalWasOutgoing) {
        state.outgoingOffer = animal;
        if (state.autonomousTradeOffer) renderTrade();
        else generateOpponentTradeOffers(animal);
        return;
    }

    /*
        Restore to hand.
    */

    animal.hand =
        true;


    if (
        !state.hand.some(
            item =>
                item.id ===
                animal.id
        )
    ) {

        state.hand.push(
            animal
        );

    }

}


// ============================================================
// ELEMENT UNDER POINTER
// ============================================================

function elementUnderPointer(
    event
) {

    return document.elementFromPoint(
        event.clientX,
        event.clientY
    );

}


// ============================================================
// DROP ON EXACT SLOT
// ============================================================

function tryDropOnExactSlot(
    event,
    animal
) {

    const target =
        elementUnderPointer(
            event
        );


    if (!target) {
        return false;
    }


    const slot =
        target.closest(
            '.slot'
        );


    if (!slot) {
        return false;
    }


    const enclosureId =
        Number(
            slot.dataset.enclosureId
        );


    const slotIndex =
        Number(
            slot.dataset.slotIndex
        );


    const enclosure =
        state.enclosures.find(
            item =>
                item.id ===
                enclosureId
        );


    if (!enclosure) {
        return false;
    }


    return placeAnimal(
        animal,
        enclosure,
        slotIndex
    );

}


// ============================================================
// DROP ON ENCLOSURE
// ============================================================

function tryDropOnEnclosure(
    event,
    animal
) {

    const target =
        elementUnderPointer(
            event
        );


    if (!target) {
        return false;
    }


    const enclosureElement =
        target.closest(
            '.enclosure'
        );


    if (!enclosureElement) {
        return false;
    }


    const enclosureId =
        Number(
            enclosureElement
                .dataset
                .enclosureId
        );


    const enclosure =
        state.enclosures.find(
            item =>
                item.id ===
                enclosureId
        );


    if (!enclosure) {
        return false;
    }


    const slotElements =
        Array.from(
            enclosureElement
                .querySelectorAll(
                    '.slot'
                )
        );


    let best = null;
    let bestDistance = Infinity;


    for (
        const slotElement
        of slotElements
    ) {

        const slotIndex =
            Number(
                slotElement
                    .dataset
                    .slotIndex
            );


        if (
            !canPlace(
                animal,
                enclosure,
                slotIndex
            )
        ) {
            continue;
        }


        const rect =
            slotElement
                .getBoundingClientRect();


        const centerX =
            rect.left +
            rect.width / 2;


        const centerY =
            rect.top +
            rect.height / 2;


        const dx =
            event.clientX -
            centerX;


        const dy =
            event.clientY -
            centerY;


        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance <
            bestDistance
        ) {

            bestDistance =
                distance;

            best =
                slotIndex;

        }

    }


    if (
        best === null
    ) {
        return false;
    }


    return placeAnimal(
        animal,
        enclosure,
        best
    );

}


// ============================================================
// DROP ON EXCHANGE
// ============================================================

function tryDropOnExchange(
    event,
    animal
) {

    const target =
        elementUnderPointer(
            event
        );


    if (!target) {
        return false;
    }


    let index = null;


    if (
        target === exchange1 ||
        exchange1.contains(
            target
        )
    ) {

        index = 0;

    }
    else if (
        target === exchange2 ||
        exchange2.contains(
            target
        )
    ) {

        index = 1;

    }


    if (
        index === null
    ) {
        return false;
    }


    /*
        Any eligible animal from Level 1 through Level 4 can be
        exchanged upward. Level 5 is the maximum level.
    */

    if (
        animal.level < 1 ||
        animal.level >= 5
    ) {
        return false;
    }


    /*
        We need three matching cards in total.

        The dragged card may have come from:
        - the zoo
        - the exchange area

        Count matching cards still physically in the zoo.
    */

    if ((exchangeGroupCounts().get(exchangeGroupKey(animal)) || 0) < 3) {
        return false;
    }


    const otherIndex =
        index === 0
            ? 1
            : 0;


    const other =
        state.exchange[
            otherIndex
        ];


    if (
        other &&
        (
            other.category !==
                animal.category ||
            other.level !==
                animal.level
        )
    ) {
        return false;
    }


    if (
        state.exchange[index]
    ) {
        return false;
    }


    state.exchange[index] =
        animal;


    if (
        state.exchange[0] &&
        state.exchange[1]
    ) {

        createExchangeResult();

    }


    return true;

}


// ============================================================
// CREATE EXCHANGE RESULT
// ============================================================

function createExchangeResult() {

    const first =
        state.exchange[0];


    const second =
        state.exchange[1];


    if (
        !first ||
        !second
    ) {

        state.result = null;
        return;

    }


    if (
        first.category !==
            second.category ||
        first.level !==
            second.level
    ) {

        state.result = null;
        return;

    }


    const nextLevel =
        first.level + 1;


    const files =
        levelFiles(
            first.category,
            nextLevel
        );


    if (
        files.length === 0
    ) {

        console.error(
            `No Level ${nextLevel} animals available for ${first.category}.`
        );

        state.result = null;

        return;

    }


    state.result = {

        category:
            first.category,

        level:
            nextLevel,

        filename:
            randomItem(
                files
            )

    };

}


// ============================================================
// FIND FREE CONNECTED POSITION FOR NEW ENCLOSURE
// ============================================================

function findNewEnclosurePosition() {

    if (
        state.enclosures.length === 0
    ) {

        return {
            x: 500,
            y: 300
        };

    }


    for (
        let attempt = 0;
        attempt < 250;
        attempt++
    ) {

        const anchor =
            randomItem(
                state.enclosures
            );


        const position =
            connectedPosition(
                anchor,
                state.enclosures,
                ENCLOSURE_GAP
            );


        if (!position) continue;

        const rect = {

            x:
                position.x,

            y:
                position.y,

            w:
                ENCLOSURE_W,

            h:
                ENCLOSURE_H

        };


        const collision =
            state.enclosures.some(
                enclosure =>
                    rectanglesOverlap(
                        rect,
                        {
                            x:
                                enclosure.x,

                            y:
                                enclosure.y,

                            w:
                                ENCLOSURE_W,

                            h:
                                ENCLOSURE_H
                        },
                        ENCLOSURE_GAP
                    )
            );


        if (!collision) {

            return position;

        }

    }


    /*
        Fallback.
    */

    const anchor =
        state.enclosures[
            state.enclosures.length - 1
        ];


    return {

        x:
            clamp(
                anchor.x +
                    ENCLOSURE_W +
                    ENCLOSURE_GAP,
                40,
                WORKSPACE_W -
                    ENCLOSURE_W -
                    40
            ),

        y:
            anchor.y

    };

}


// ============================================================
// CHOOSE REWARD ENCLOSURE
// ============================================================

function chooseRewardEnclosureNumber() {

    const available = [
        1, 2, 3, 4, 5,
        6, 7, 8, 9
    ];


    if (
        state.enclosure10Unlocked
    ) {

        available.push(10);

    }


    return randomItem(
        available
    );

}


// ============================================================
// ADD REWARD ENCLOSURE
// ============================================================

function addRewardEnclosure() {

    const number =
        chooseRewardEnclosureNumber();


    const position =
        findNewEnclosurePosition();


    const enclosure = {

        id:
            state.nextId++,

        number,

        x:
            position.x,

        y:
            position.y

    };


    state.enclosures.push(
        enclosure
    );


    state.glowingEnclosureIds.add(
        enclosure.id
    );


    return enclosure;

}


// ============================================================
// CHECK ENCLOSURE REWARD
//
// First time each CATEGORY reaches a new level.
// ============================================================

function progressionCountForLevel(level) {
    const categories = new Set();
    for (const key of state.discoveredCategoryLevels) {
        const [category, levelText] = key.split('|');
        if (Number(levelText) === level) categories.add(category);
    }
    return categories.size;
}

function checkEnclosureReward(animal) {
    if (!animal) return;
    state.discoveredCategoryLevels.add(progressionKey(animal.category, animal.level));

    // Each level has its own independent milestone track. Reaching Level 3,
    // for example, can award its first enclosure even if Level 2 is only 1/9.
    if (animal.level >= 2 && animal.level <= 5) {
        const count = progressionCountForLevel(animal.level);
        for (const milestone of state.gameOptions.enclosureRewardMilestones) {
            const rewardKey = `${animal.level}|${milestone}`;
            if (count >= milestone && !state.awardedProgressMilestones.has(rewardKey)) {
                state.awardedProgressMilestones.add(rewardKey);
                addRewardEnclosure();
            }
        }
    }

    // Keep legacy fields synchronized for old UI/state paths.
    if (animal.level === 2) {
        state.acquiredLevel2Categories.add(animal.category);
        for (const m of state.gameOptions.enclosureRewardMilestones) {
            if (progressionCountForLevel(2) >= m) state.awardedLevel2Milestones.add(m);
        }
    }
    renderProgressTracker();
}


// ============================================================
// REVEAL EXCHANGE RESULT
// ============================================================

function revealExchangeResult() {
    completeExchange(null);
}


function prepareExchangeGlowAfterAnimalDrag(drag) {
    const before = drag?.exchangeGlowIds || new Set();
    const nowEligible = new Set(state.animals.filter(a => shouldGlowForExchange(a)).map(a => a.id));
    const startedAt = state.exchangeGlowDragStartedAt || Date.now();
    const elapsed = Math.max(0, Date.now() - startedAt);
    const continuing = new Set([...before].filter(id => nowEligible.has(id)));
    const newlyEligible = new Set([...nowEligible].filter(id => !before.has(id)));

    state.exchangeGlowReturnIds = newlyEligible;
    state.exchangeGlowReturnUntil = newlyEligible.size ? Date.now() + 1000 : 0;

    // If a pre-existing glow is still in its 1s hold + 1s fade animation,
    // continue that exact animation after the DOM is rebuilt instead of
    // restarting it or replacing it with a new fade-in.
    if (continuing.size && elapsed < 2000) {
        state.exchangeGlowContinueIds = continuing;
        state.exchangeGlowContinueStartedAt = startedAt;
        state.exchangeGlowContinueUntil = startedAt + 2000;
        const remaining = Math.max(0, 2000 - elapsed);
        setTimeout(() => {
            const ids = new Set([...state.exchangeGlowContinueIds].filter(id =>
                state.animals.some(a => a.id === id && shouldGlowForExchange(a))
            ));
            state.exchangeGlowContinueIds.clear();
            state.exchangeGlowContinueUntil = 0;
            if (ids.size) {
                state.exchangeGlowReturnIds = ids;
                state.exchangeGlowReturnUntil = Date.now() + 1000;
                renderZoo();
            }
        }, remaining + 20);
    } else {
        state.exchangeGlowContinueIds.clear();
        state.exchangeGlowContinueUntil = 0;
        // If the old glow already finished fading away, it genuinely needs
        // the normal 1 second return animation.
        for (const id of continuing) newlyEligible.add(id);
        state.exchangeGlowReturnIds = newlyEligible;
        state.exchangeGlowReturnUntil = newlyEligible.size ? Date.now() + 1000 : 0;
    }
}

// ============================================================
// FINISH ANIMAL DRAG
// ============================================================

function finishAnimalDrag(event) {
    const drag = state.drag;
    if (!drag || drag.type !== 'animal') return;
    const animal = drag.animal;
    const clickDistance = Math.hypot(event.clientX-drag.startClientX, event.clientY-drag.startClientY);

    if (clickDistance < 6 && drag.originalEnclosureId !== null) {
        restoreDraggedAnimal();

        const mobileLayout = window.matchMedia('(max-width: 700px)').matches;

        if (mobileLayout) {
            // Phones have no mouse hover, so a tap reuses the existing desktop
            // hover-preview panel and shows the selected animal at bottom-left.
            // A tap on mobile deliberately does NOT suppress the yellow
            // exchange-eligibility glow.
            showHoverPreview(animal);
        } else if (isExchangeEligible(animal)) {
            // Desktop keeps the existing click-to-hide/show yellow glow.
            if (state.suppressedExchangeGlowIds.has(animal.id)) state.suppressedExchangeGlowIds.delete(animal.id);
            else state.suppressedExchangeGlowIds.add(animal.id);
        }

        prepareExchangeGlowAfterAnimalDrag(drag); drag.image?.remove(); state.drag=null; renderAll(); return;
    }

    let placed = tryDropOnOutgoingOffer(event, animal);
    if (!placed) placed = tryDropOnExchange(event, animal);
    if (!placed) placed = tryDropOnExactSlot(event, animal);
    if (!placed) placed = tryDropOnEnclosure(event, animal);
    if (!placed) restoreDraggedAnimal();
    prepareExchangeGlowAfterAnimalDrag(drag);
    drag.image?.remove(); state.drag=null;
    checkEnclosure10Unlock();
    updateDiscoveredCategoryLevels();
    renderAll();
}


// ============================================================
// ENCLOSURE DRAG
// ============================================================

function startEnclosureDrag(
    event,
    enclosure,
    element
) {

    if (
        state.drag ||
        state.pan
    ) {
        return;
    }


    state.drag = {

        type:
            'enclosure',

        enclosure,

        element,

        startClientX:
            event.clientX,

        startClientY:
            event.clientY,

        startX:
            enclosure.x,

        startY:
            enclosure.y

    };


    element.classList.add(
        'dragging-enclosure'
    );

}


// ============================================================
// MOVE ENCLOSURE
// ============================================================

function moveEnclosureDrag(
    event
) {

    const drag =
        state.drag;


    if (
        !drag ||
        drag.type !==
            'enclosure'
    ) {
        return;
    }


    const dx =
        (
            event.clientX -
            drag.startClientX
        ) /
        state.zoom;


    const dy =
        (
            event.clientY -
            drag.startClientY
        ) /
        state.zoom;


    drag.enclosure.x =
        clamp(
            drag.startX + dx,
            0,
            WORKSPACE_W -
                ENCLOSURE_W
        );


    drag.enclosure.y =
        clamp(
            drag.startY + dy,
            0,
            WORKSPACE_H -
                ENCLOSURE_H
        );


    drag.element.style.left =
        drag.enclosure.x +
        'px';


    drag.element.style.top =
        drag.enclosure.y +
        'px';

}


function enclosurePlacementIsValid(enclosure, x, y) {
    const candidate = { x, y, w: ENCLOSURE_W, h: ENCLOSURE_H };
    return state.enclosures.every(other => {
        if (other.id === enclosure.id) return true;
        return !rectanglesOverlap(
            candidate,
            { x: other.x, y: other.y, w: ENCLOSURE_W, h: ENCLOSURE_H },
            ENCLOSURE_GAP
        );
    });
}

function nearestValidEnclosureSnap(enclosure) {
    const candidates = [];

    for (const other of state.enclosures) {
        if (other.id === enclosure.id) continue;
        candidates.push(
            { x: other.x + ENCLOSURE_W + ENCLOSURE_GAP, y: other.y },
            { x: other.x - ENCLOSURE_W - ENCLOSURE_GAP, y: other.y },
            { x: other.x, y: other.y + ENCLOSURE_H + ENCLOSURE_GAP },
            { x: other.x, y: other.y - ENCLOSURE_H - ENCLOSURE_GAP }
        );
    }

    const valid = candidates.filter(pos =>
        pos.x >= 0 && pos.y >= 0 &&
        pos.x + ENCLOSURE_W <= WORKSPACE_W &&
        pos.y + ENCLOSURE_H <= WORKSPACE_H &&
        enclosurePlacementIsValid(enclosure, pos.x, pos.y)
    );

    if (!valid.length) return { x: enclosure.x, y: enclosure.y };

    valid.sort((a, b) =>
        Math.hypot(a.x - enclosure.x, a.y - enclosure.y) -
        Math.hypot(b.x - enclosure.x, b.y - enclosure.y)
    );

    return valid[0];
}


// ============================================================
// FINISH ENCLOSURE DRAG
// ============================================================

function finishEnclosureDrag() {

    if (
        !state.drag ||
        state.drag.type !==
            'enclosure'
    ) {
        return;
    }


    const enclosure = state.drag.enclosure;
    const snapped = nearestValidEnclosureSnap(enclosure);
    enclosure.x = snapped.x;
    enclosure.y = snapped.y;

    state.drag.element.style.left = `${enclosure.x}px`;
    state.drag.element.style.top = `${enclosure.y}px`;

    state.drag.element
        ?.classList
        .remove(
            'dragging-enclosure'
        );


    state.drag = null;

}


// ============================================================
// PAN
// ============================================================

function startPan(event) {

    if (
        state.drag ||
        state.pan
    ) {
        return;
    }


    state.pan = {

        startClientX:
            event.clientX,

        startClientY:
            event.clientY,

        startScrollLeft:
            zooBoard.scrollLeft,

        startScrollTop:
            zooBoard.scrollTop

    };


    zooBoard.classList.add(
        'panning'
    );

}


function movePan(event) {

    if (!state.pan) {
        return;
    }


    const dx =
        event.clientX -
        state.pan.startClientX;


    const dy =
        event.clientY -
        state.pan.startClientY;


    zooBoard.scrollLeft =
        state.pan.startScrollLeft -
        dx;


    zooBoard.scrollTop =
        state.pan.startScrollTop -
        dy;

}


function finishPan() {

    if (!state.pan) {
        return;
    }


    state.pan = null;


    zooBoard.classList.remove(
        'panning'
    );

}


// ============================================================
// ZOO POINTER DOWN
// ============================================================

zooBoard.addEventListener(
    'pointerdown',
    event => {

        if (
            event.button !== 0 &&
            event.button !== 1
        ) {
            return;
        }


        if (
            event.target.closest(
                '.animal-card'
            )
        ) {
            return;
        }


        if (
            event.target.closest(
                '.enclosure'
            )
        ) {
            return;
        }


        event.preventDefault();


        startPan(
            event
        );

    }
);


// ============================================================
// POINTER MOVE
// ============================================================

document.addEventListener(
    'pointermove',
    event => {

        if (state.drag?.type === 'draw-result') { moveDrawDragImage(event); return; }
        if (state.drag?.type === 'trade-result') { moveTradeResultDragImage(event); return; }

        if (state.drag?.type === 'result') {
            moveResultDragImage(event);
            return;
        }

        if (
            state.drag?.type ===
            'animal'
        ) {

            moveAnimalDragImage(
                event
            );

            return;

        }


        if (
            state.drag?.type ===
            'enclosure'
        ) {

            moveEnclosureDrag(
                event
            );

            return;

        }


        if (state.pan) {

            movePan(
                event
            );

        }

    }
);


// ============================================================
// POINTER UP
// ============================================================

document.addEventListener(
    'pointerup',
    event => {

        if (state.drag?.type === 'draw-result') { finishDrawDrag(event); return; }
        if (state.drag?.type === 'trade-result') { finishTradeResultDrag(event); return; }

        if (state.drag?.type === 'result') {
            finishResultDrag(event);
            return;
        }

        if (
            state.drag?.type ===
            'animal'
        ) {

            finishAnimalDrag(
                event
            );

            return;

        }


        if (
            state.drag?.type ===
            'enclosure'
        ) {

            finishEnclosureDrag();

            return;

        }


        if (state.pan) {

            finishPan();

        }

    }
);


// ============================================================
// POINTER CANCEL
// ============================================================

document.addEventListener(
    'pointercancel',
    () => {

        if (state.drag?.type === 'result') {
            state.drag.image?.remove();
            state.drag = null;
            renderExchange();
        }
        else         if (
            state.drag?.type ===
            'animal'
        ) {

            restoreDraggedAnimal();


            state.drag.image
                ?.remove();


            const cancelledDrag = state.drag;
            prepareExchangeGlowAfterAnimalDrag(cancelledDrag);
            state.drag = null;


            renderAll();

        }
        else if (
            state.drag?.type ===
            'enclosure'
        ) {

            finishEnclosureDrag();

        }


        finishPan();

    }
);


// ============================================================
// ZOOM
// ============================================================

function setZoom(
    newZoom,
    clientX = null,
    clientY = null
) {

    const oldZoom =
        state.zoom;


    const nextZoom =
        clamp(
            Math.round(
                newZoom * 100
            ) / 100,
            ZOOM_MIN,
            ZOOM_MAX
        );


    if (
        nextZoom ===
        oldZoom
    ) {
        return;
    }


    let worldX = null;
    let worldY = null;


    if (
        clientX !== null &&
        clientY !== null
    ) {

        const boardRect =
            zooBoard
                .getBoundingClientRect();


        worldX =
            (
                zooBoard.scrollLeft +
                clientX -
                boardRect.left
            ) /
            oldZoom;


        worldY =
            (
                zooBoard.scrollTop +
                clientY -
                boardRect.top
            ) /
            oldZoom;

    }


    state.zoom =
        nextZoom;


    document
        .documentElement
        .style
        .setProperty(
            '--zoo-zoom',
            state.zoom
        );


    if (
        worldX !== null &&
        worldY !== null
    ) {

        const boardRect =
            zooBoard
                .getBoundingClientRect();


        zooBoard.scrollLeft =
            worldX *
                state.zoom -
            (
                clientX -
                boardRect.left
            );


        zooBoard.scrollTop =
            worldY *
                state.zoom -
            (
                clientY -
                boardRect.top
            );

    }

}


// ============================================================
// MOBILE PINCH ZOOM
// ============================================================

const zooTouchPointers = new Map();
let zooPinch = null;

function zooPinchDistance(a, b) {
    return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
}

function zooPinchMidpoint(a, b) {
    return { x: (a.clientX + b.clientX) / 2, y: (a.clientY + b.clientY) / 2 };
}

function cancelAnimalDragForPinch() {
    if (state.drag?.type !== 'animal') return;
    restoreDraggedAnimal();
    state.drag.image?.remove();
    state.drag = null;
    renderAll();
}

function beginZooPinchIfReady() {
    if (zooTouchPointers.size !== 2) return;
    const [a, b] = [...zooTouchPointers.values()];
    const distance = zooPinchDistance(a, b);
    const midpoint = zooPinchMidpoint(a, b);
    if (!distance) return;

    // The second finger always wins over a one-finger card drag or pan.
    cancelAnimalDragForPinch();
    finishPan();

    const boardRect = zooBoard.getBoundingClientRect();
    zooPinch = {
        startDistance: distance,
        startZoom: state.zoom,
        anchorWorldX: (zooBoard.scrollLeft + midpoint.x - boardRect.left) / state.zoom,
        anchorWorldY: (zooBoard.scrollTop + midpoint.y - boardRect.top) / state.zoom
    };
}

zooBoard.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    zooTouchPointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (zooTouchPointers.size === 2) beginZooPinchIfReady();
}, { capture: true });

zooBoard.addEventListener('pointermove', event => {
    if (event.pointerType !== 'touch' || !zooTouchPointers.has(event.pointerId)) return;
    zooTouchPointers.set(event.pointerId, { clientX: event.clientX, clientY: event.clientY });
    if (!zooPinch || zooTouchPointers.size !== 2) return;

    event.preventDefault();
    event.stopPropagation();

    const [a, b] = [...zooTouchPointers.values()];
    const distance = zooPinchDistance(a, b);
    const midpoint = zooPinchMidpoint(a, b);
    if (!distance || !zooPinch.startDistance) return;

    const nextZoom = clamp(
        zooPinch.startZoom * (distance / zooPinch.startDistance),
        ZOOM_MIN,
        ZOOM_MAX
    );
    state.zoom = Math.round(nextZoom * 1000) / 1000;
    document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

    // Keep the exact world point that was between the fingers at pinch start
    // underneath the moving midpoint. This prevents the zoo jumping away.
    const boardRect = zooBoard.getBoundingClientRect();
    zooBoard.scrollLeft = zooPinch.anchorWorldX * state.zoom - (midpoint.x - boardRect.left);
    zooBoard.scrollTop = zooPinch.anchorWorldY * state.zoom - (midpoint.y - boardRect.top);
}, { capture: true, passive: false });

function endZooTouchPointer(event) {
    if (event.pointerType !== 'touch') return;

    const wasPinching = Boolean(zooPinch);
    zooTouchPointers.delete(event.pointerId);

    // Zooming exists ONLY while exactly two live touch pointers exist.
    if (zooTouchPointers.size !== 2) {
        zooPinch = null;
    }

    // If one finger remains after a pinch, do not keep interpreting its
    // vertical movement as part of the old zoom gesture. Start a completely
    // fresh one-finger pan from its current position instead.
    if (wasPinching && zooTouchPointers.size === 1) {
        finishPan();
        const remaining = [...zooTouchPointers.values()][0];
        state.pan = {
            startClientX: remaining.clientX,
            startClientY: remaining.clientY,
            startScrollLeft: zooBoard.scrollLeft,
            startScrollTop: zooBoard.scrollTop,
            touchContinuation: true
        };
        zooBoard.classList.add('panning');
    }

    if (zooTouchPointers.size === 0 && state.pan?.touchContinuation) {
        finishPan();
    }
}

zooBoard.addEventListener('pointerup', endZooTouchPointer, { capture: true });
zooBoard.addEventListener('pointercancel', endZooTouchPointer, { capture: true });

// Defensive cleanup for interrupted browser gestures / app switching.
window.addEventListener('blur', () => {
    zooTouchPointers.clear();
    zooPinch = null;
    if (state.pan?.touchContinuation) finishPan();
});


// ============================================================
// WHEEL ZOOM
// ============================================================

zooBoard.addEventListener(
    'wheel',
    event => {

        event.preventDefault();


        const direction =
            event.deltaY < 0
                ? 1
                : -1;


        setZoom(
            state.zoom +
                direction *
                ZOOM_STEP,
            event.clientX,
            event.clientY
        );

    },
    {
        passive: false
    }
);


// ============================================================
// DRAW LEVEL 1 — CLICK OR DRAG THE DECK CARD
// ============================================================

function createLevelOneForDraw(destination = null) {
    state.glowingEnclosureIds.clear();
    const category = randomAvailableLevelOneCategory();
    const animal = createAnimal(category, 1);
    state.animals.push(animal);
    markPlayerLevelSeen(animal.level);
    if (destination) {
        if (!placeAnimal(animal, destination.enclosure, destination.slotIndex)) {
            state.animals = state.animals.filter(item => item.id !== animal.id);
            return false;
        }
    } else {
        animal.hand = true;
        state.hand.push(animal);
    }
    state.turn++;
    updateTurnDisplay();
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}

function drawLevelOne() { return createLevelOneForDraw(null); }

function startDrawDrag(event) {
    if (state.drag || state.pan) return;
    const rect = drawCard.getBoundingClientRect();
    const source = drawCard.querySelector('img');
    const image = document.createElement('img');
    image.className = 'dragging-animal dragging-result';
    image.src = source?.src || 'assets/animals/carnivora/1/Back.png';
    image.style.width = `${rect.width}px`;
    image.style.height = `${rect.height}px`;
    document.body.appendChild(image);
    state.drag = { type:'draw-result', image, startClientX:event.clientX, startClientY:event.clientY,
        offsetX:event.clientX-rect.left, offsetY:event.clientY-rect.top };
    moveDrawDragImage(event);
}
function moveDrawDragImage(event) {
    if (state.drag?.type !== 'draw-result') return;
    state.drag.image.style.left = `${event.clientX-state.drag.offsetX}px`;
    state.drag.image.style.top = `${event.clientY-state.drag.offsetY}px`;
}
function finishDrawDrag(event) {
    const drag=state.drag; if (!drag || drag.type!=='draw-result') return;
    const distance=Math.hypot(event.clientX-drag.startClientX,event.clientY-drag.startClientY);
    drag.image?.remove(); state.drag=null;
    if (distance < 6) { drawLevelOne(); return; }
    const destination=resultDropDestination(event);
    if (destination) createLevelOneForDraw(destination);
}
drawCard.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation(); startDrawDrag(event);
});


// ============================================================
// GAME OPTIONS — CATEGORY FILTERS
// ============================================================
function ensureGameOptionsUI() {
    if (document.getElementById('gameOptionsButton')) return;

    const button = document.createElement('button');
    button.id = 'gameOptionsButton';
    button.type = 'button';
    button.textContent = 'Game Options';
    button.className = 'game-options-button';
    const headerLeft = document.getElementById('headerLeft');
    const turnDisplay = document.getElementById('turnOrder');
    if (headerLeft) {
        // Keep Game Options above the turn counter on both desktop and mobile.
        headerLeft.insertBefore(button, turnDisplay || headerLeft.firstChild);
    }

    const overlay = document.createElement('div');
    overlay.id = 'gameOptionsOverlay';
    overlay.className = 'game-options-overlay';
    overlay.innerHTML = `
        <div class="game-options-modal">
            <h2>Game Options</h2>
            <p>Change the starting zoo and choose which animal categories may appear.</p>

            <div class="advanced-game-rules" id="advancedGameRules">
                <div class="advanced-options-title">GAME SETUP</div>
                <label>
                    <span>Starting species</span>
                    <input id="optStartingSpecies" type="number" min="1" max="24" step="1">
                </label>
                <label>
                    <span>Maximum starting enclosure spaces</span>
                    <input id="optStartingMaxSpaces" type="number" min="4" max="40" step="1">
                </label>
                <label>
                    <span>New enclosure reward milestones</span>
                    <input id="optRewardMilestones" type="text" placeholder="1, 3, 5, 9">
                </label>
                <label>
                    <span>Opponent zoos</span>
                    <select id="optOpponentMode">
                        <option value="fictional">Fictional opponents</option>
                        <option value="real">Real zoo opponents</option>
                    </select>
                </label>
                <label class="trade-frequency-option">
                    <span>Trade offer frequency: <strong id="optTradeFrequencyValue">50%</strong></span>
                    <input id="optTradeFrequency" type="range" min="0" max="100" step="1" value="50">
                </label>
                <div class="advanced-options-note">
                    Trade offer frequency affects both offers made in response to your outgoing card
                    and spontaneous offers made by opponents. 50% is the standard setting.
                </div>
                <div class="advanced-options-note">
                    Milestones are the distinct category counts at each level that award a new enclosure.
                    These settings are saved in this browser and apply when the zoo is regenerated.
                </div>
            </div>

            <div class="advanced-options-title">ANIMAL CATEGORIES</div>
            <div id="categoryOptionList" class="category-option-list"></div>

            <div class="options-warning">Applying changes regenerates the zoo from scratch.</div>
            <div class="options-actions">
                <button type="button" id="cancelGameOptions">Cancel</button>
                <button type="button" id="applyGameOptions">Apply & Regenerate Zoo</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const list = overlay.querySelector('#categoryOptionList');
    const speciesInput = overlay.querySelector('#optStartingSpecies');
    const spacesInput = overlay.querySelector('#optStartingMaxSpaces');
    const milestonesInput = overlay.querySelector('#optRewardMilestones');
    const opponentModeInput = overlay.querySelector('#optOpponentMode');
    const tradeFrequencyInput = overlay.querySelector('#optTradeFrequency');
    const tradeFrequencyValue = overlay.querySelector('#optTradeFrequencyValue');

    tradeFrequencyInput.addEventListener('input', () => {
        tradeFrequencyValue.textContent = `${Math.round(Number(tradeFrequencyInput.value))}%`;
    });

    for (const category of Object.keys(FOLDERS).sort((a, b) => a.localeCompare(b))) {
        const label = document.createElement('label');
        label.className = 'category-option';
        label.innerHTML = `<input type="checkbox" value="${category}"><span class="category-option-colour"></span><span>${category}</span>`;
        label.querySelector('.category-option-colour').style.background =
            state.categoryColours[category] || CATEGORY_COLOURS[category];
        list.appendChild(label);
    }

    function syncInputs() {
        speciesInput.value = state.gameOptions.startingSpecies;
        spacesInput.value = state.gameOptions.startingMaxEnclosureSpaces;
        milestonesInput.value = state.gameOptions.enclosureRewardMilestones.join(', ');
        opponentModeInput.value = state.gameOptions.opponentMode;
        tradeFrequencyInput.value = state.gameOptions.tradeOfferFrequency;
        tradeFrequencyValue.textContent = `${Math.round(state.gameOptions.tradeOfferFrequency)}%`;
        for (const cb of list.querySelectorAll('input[type="checkbox"]')) {
            cb.checked = state.activeCategories.has(cb.value);
        }
    }

    function open() {
        syncInputs();
        overlay.classList.add('visible');
    }

    function close() {
        overlay.classList.remove('visible');
    }

    button.addEventListener('click', open);
    overlay.querySelector('#cancelGameOptions').addEventListener('click', close);
    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay) close();
    });

    overlay.querySelector('#applyGameOptions').addEventListener('click', () => {
        const selected = [...list.querySelectorAll('input[type="checkbox"]:checked')]
            .map(cb => cb.value);

        if (!selected.length) {
            alert('At least one animal category must remain enabled.');
            return;
        }

        const startingSpecies = Math.max(
            1,
            Math.min(24, Math.round(Number(speciesInput.value) || DEFAULT_GAME_OPTIONS.startingSpecies))
        );
        const startingMaxSpaces = Math.max(
            startingSpecies,
            Math.min(40, Math.round(Number(spacesInput.value) || DEFAULT_GAME_OPTIONS.startingMaxEnclosureSpaces))
        );
        const milestones = normalizeRewardMilestones(milestonesInput.value);
        const opponentMode = opponentModeInput.value === 'real' ? 'real' : 'fictional';
        const tradeOfferFrequency = Math.max(
            0,
            Math.min(100, Math.round(Number(tradeFrequencyInput.value)))
        );

        const categoriesSame =
            selected.length === state.activeCategories.size &&
            selected.every(category => state.activeCategories.has(category));
        const rulesSame =
            startingSpecies === state.gameOptions.startingSpecies &&
            startingMaxSpaces === state.gameOptions.startingMaxEnclosureSpaces &&
            milestones.join(',') === state.gameOptions.enclosureRewardMilestones.join(',') &&
            opponentMode === state.gameOptions.opponentMode &&
            tradeOfferFrequency === state.gameOptions.tradeOfferFrequency;

        if (categoriesSame && rulesSame) {
            close();
            return;
        }

        const ok = confirm(
            `Applying these Game Options will regenerate the game from scratch.\n\n` +
            `The current zoo “${state.zooName}” and all its animals will be lost.\n\nContinue?`
        );
        if (!ok) return;

        state.activeCategories = new Set(selected);
        state.gameOptions.startingSpecies = startingSpecies;
        state.gameOptions.startingMaxEnclosureSpaces = startingMaxSpaces;
        state.gameOptions.enclosureRewardMilestones = milestones;
        state.gameOptions.opponentMode = opponentMode;
        state.gameOptions.tradeOfferFrequency = tradeOfferFrequency;
        saveGameOptions();

        assignZooNames();
        createStartingZoo();
        assignOpponentProfiles();
        renderAll();
        centerInitialView();
        close();
    });
}

// ============================================================
// REAL ZOO OPPONENTS
// ============================================================
function isRealOpponentMode() {
    return state.gameOptions.opponentMode === 'real';
}

function updateRealZooTierUnlocks() {
    if (!isRealOpponentMode()) return;
    let unlocked = Math.max(1, state.realZooUnlockedTier || 1);
    for (let level = 2; level <= 5; level++) {
        const housed = state.animals.filter(animal =>
            animal.level === level && animal.enclosureId !== null
        ).length;
        if (housed >= 3) unlocked = Math.max(unlocked, level);
    }
    state.realZooUnlockedTier = unlocked;
}

function realZooRecordsAvailable() {
    updateRealZooTierUnlocks();
    return (state.realZooData?.zoos || []).filter(zoo =>
        Number(zoo.tier) <= state.realZooUnlockedTier &&
        Array.isArray(zoo.animals) && zoo.animals.length
    );
}

function weightedRealZooPool() {
    const records = realZooRecordsAvailable();
    const newest = state.realZooUnlockedTier;
    const weighted = [];
    for (const zoo of records) {
        const distance = Math.max(0, newest - Number(zoo.tier || 1));
        const weight = distance === 0 ? 6 : Math.max(1, 4 - distance);
        for (let i = 0; i < weight; i++) weighted.push(zoo);
    }
    return weighted;
}

function animalFromRealZooName(name) {
    const wanted = String(name || '').trim().toLowerCase();
    if (!wanted) return null;
    for (const category of Object.keys(FOLDERS)) {
        for (let level = 1; level <= 5; level++) {
            const filename = levelFiles(category, level).find(file =>
                file.replace(/\.png$/i, '').trim().toLowerCase() === wanted
            );
            if (filename) return {
                id: state.nextId++, category, level, filename,
                enclosureId: null, slotIndex: null, hand: false
            };
        }
    }
    return null;
}

function realZooHoldingKey(recordOrName) {
    return String(
        typeof recordOrName === 'string'
            ? recordOrName
            : recordOrName?.name || ''
    ).trim();
}

function resetRealZooSessionHoldings() {
    state.realZooSessionHoldings = new Map();

    for (const record of state.realZooData?.zoos || []) {
        if (!record?.name) continue;
        state.realZooSessionHoldings.set(
            realZooHoldingKey(record),
            Array.isArray(record.animals)
                ? [...record.animals]
                : []
        );
    }
}

function realZooSessionAnimalNames(record) {
    const key = realZooHoldingKey(record);

    if (!state.realZooSessionHoldings.has(key)) {
        state.realZooSessionHoldings.set(
            key,
            Array.isArray(record?.animals)
                ? [...record.animals]
                : []
        );
    }

    return state.realZooSessionHoldings.get(key);
}

function playerOwnedTradeKeys() {
    const keys = new Set();

    for (const animal of state.animals || []) {
        if (animal) keys.add(animalCardKey(animal));
    }

    // Explicitly include the outgoing box as well. In the current object
    // model it normally still exists in state.animals until a trade finishes,
    // but keeping this separate makes the rule robust if that changes later.
    if (state.outgoingOffer) {
        keys.add(animalCardKey(state.outgoingOffer));
    }

    return keys;
}

function realZooTradeAnimals(record, excludePlayerOwned = false) {
    const result = [];
    const seen = new Set();
    const playerKeys = excludePlayerOwned
        ? playerOwnedTradeKeys()
        : null;

    for (const name of realZooSessionAnimalNames(record)) {
        const animal = animalFromRealZooName(name);
        if (!animal) continue;

        const key = animalCardKey(animal);
        if (seen.has(key)) continue;
        if (playerKeys?.has(key)) continue;

        seen.add(key);
        result.push(animal);
    }

    return result;
}

function updateRealZooSessionAfterTrade(record, incoming, outgoing) {
    if (!record || !incoming || !outgoing) return;

    const names = realZooSessionAnimalNames(record);
    const incomingKey = animalCardKey(incoming);
    const outgoingKey = animalCardKey(outgoing);

    // The animal received by the player leaves this zoo for the remainder
    // of the current game session.
    const kept = names.filter(name => {
        const animal = animalFromRealZooName(name);
        return !animal || animalCardKey(animal) !== incomingKey;
    });

    // The player's traded-away animal now belongs to that real zoo and may
    // appear in its future offers. Do not create duplicate holdings.
    const alreadyHasOutgoing = kept.some(name => {
        const animal = animalFromRealZooName(name);
        return animal && animalCardKey(animal) === outgoingKey;
    });

    if (!alreadyHasOutgoing) {
        kept.push(
            String(outgoing.filename || '')
                .replace(/\.png$/i, '')
                .trim()
        );
    }

    state.realZooSessionHoldings.set(
        realZooHoldingKey(record),
        kept
    );
}

function realZooProfile(record, index) {
    return {
        index,
        name: record.name,
        tier: Number(record.tier || 1),
        favourites: Array.isArray(record.preferred_categories)
            ? record.preferred_categories.filter(Boolean).slice(0, 3)
            : [],
        realZooRecord: record
    };
}

function clearRealOpponentDisplay() {
    if (!isRealOpponentMode()) return;
    state.opponentProfiles = [];
    state.opponentTradeStocks = [];
    state.tradeOffers = [];
    state.selectedTradeOpponent = null;
}

function seededRoll(text) {
    let seed = 2166136261;
    for (const ch of String(text)) {
        seed ^= ch.charCodeAt(0);
        seed = Math.imul(seed, 16777619);
    }
    return { seed: seed >>> 0, roll: (seed >>> 0) / 4294967295 };
}

function tradeFrequencyFactor() {
    return Math.max(0, Math.min(1, Number(state.gameOptions.tradeOfferFrequency) / 100));
}

function tradeOfferWindow() {
    return Math.floor(Math.max(0, state.turn - 1) / 3);
}

function tradeOfferCacheKey(outgoing) {
    return `${isRealOpponentMode() ? 'real' : 'fictional'}|${outgoing.id}|${tradeOfferWindow()}`;
}

function cloneCachedOffers(offers) {
    return (offers || []).map(item => ({ ...item }));
}

function cachedPlayerTradeOffers(outgoing) {
    const key = tradeOfferCacheKey(outgoing);
    const cached = state.tradeOfferCache.get(key);
    if (!cached) return null;
    return cloneCachedOffers(cached);
}

function storePlayerTradeOffers(outgoing, offers) {
    const key = tradeOfferCacheKey(outgoing);
    state.tradeOfferCache.set(key, cloneCachedOffers(offers));

    // Keep the cache small. Entries from older three-turn windows are no
    // longer useful once their window has passed.
    const currentWindow = tradeOfferWindow();
    for (const existingKey of state.tradeOfferCache.keys()) {
        const parts = String(existingKey).split('|');
        const windowNumber = Number(parts[parts.length - 1]);
        if (Number.isFinite(windowNumber) && windowNumber < currentWindow - 1) {
            state.tradeOfferCache.delete(existingKey);
        }
    }
}

function seededShuffle(items, seedText) {
    return [...items]
        .map((item, index) => {
            const { seed } = seededRoll(`${seedText}|${index}|${item?.record?.name || item?.opponentIndex || ''}`);
            return { item, seed };
        })
        .sort((a, b) => a.seed - b.seed)
        .map(entry => entry.item);
}

function generateRealZooTradeOffers(outgoing, pendingEmergencyTrade = null) {
    const emergency = pendingEmergencyTrade || emergencyTradeForAnimal(outgoing);

    if (emergency) {
        const selected = [{
            record: emergency.record,
            animal: emergency.animal
        }];

        // Emergency offers are deliberately not cached. Private Pet Trade
        // exists only while the deadlock requires it.
        state.opponentProfiles = selected.map(
            (item, index) => realZooProfile(item.record, index)
        );
        state.opponentTradeStocks = selected.map(
            item => realZooTradeAnimals(item.record, true)
        );
        state.tradeOffers = [{
            opponentIndex: 0,
            animal: emergency.animal
        }];
        state.selectedTradeOpponent = 0;
        renderTrade();
        renderOpponentTradeState();
        return;
    }

    const cached = cachedPlayerTradeOffers(outgoing);

    if (cached) {
        const recordsByName = new Map(
            (state.realZooData?.zoos || []).map(record => [record.name, record])
        );
        const restored = cached
            .map(item => {
                const record = recordsByName.get(item.recordName);
                if (!record) return null;
                const animal = animalFromRealZooName(item.animalName);
                return animal ? { record, animal } : null;
            })
            .filter(Boolean);

        state.opponentProfiles = restored.map((item, index) => realZooProfile(item.record, index));
        state.opponentTradeStocks = restored.map(item => realZooTradeAnimals(item.record, true));
        state.tradeOffers = restored.map((item, index) => ({ opponentIndex: index, animal: item.animal }));
        state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;
        renderTrade();
        renderOpponentTradeState();
        return;
    }

    const frequency = tradeFrequencyFactor();
    const records = [...new Set(weightedRealZooPool())];
    const candidates = [];

    /*
        The slider is the overall chance that this outgoing card attracts ANY
        real-zoo interest. At the default 50%, roughly half of eligible cards
        will receive no offers at all. 0% means none; 100% always passes this
        first gate when at least one valid zoo exists.
    */
    const overallRoll = seededRoll(
        `real-overall|${outgoing.id}|${tradeOfferWindow()}`
    ).roll;

    if (frequency > 0 && overallRoll <= frequency) {
        for (const record of records) {
            const allAnimals = realZooTradeAnimals(record, true);
            const matching = allAnimals.filter(animal => animal.level === outgoing.level);
            if (!matching.length) continue;

            const favourites = Array.isArray(record.preferred_categories)
                ? record.preferred_categories
                : [];
            const likesOutgoing = favourites.includes(outgoing.category);

            /*
                Once the overall 50/50 gate succeeds, individual zoos are still
                deliberately reluctant. This makes 1–2 offers normal and 3 rare.
                Preferred categories help; higher levels remain harder.
            */
            const baseInterest = likesOutgoing ? 0.24 : 0.09;
            const levelPenalty = (outgoing.level - 1) * 0.025;
            const zooChance = Math.max(0.025, baseInterest - levelPenalty);

            const { seed, roll } = seededRoll(
                `real-zoo|${outgoing.id}|${record.name}|${tradeOfferWindow()}`
            );
            if (roll > zooChance) continue;

            const animal = matching[(seed >>> 8) % matching.length];
            candidates.push({ record, animal });
        }
    }

    // Hard maximum: even if many zoos want the card, only three can appear.
    const selected = seededShuffle(
        candidates,
        `real-select|${outgoing.id}|${tradeOfferWindow()}`
    ).slice(0, 3);

    storePlayerTradeOffers(
        outgoing,
        selected.map(item => ({
            recordName: item.record.name,
            animalName: String(item.animal.filename || '').replace(/\.png$/i, '')
        }))
    );

    state.opponentProfiles = selected.map((item, index) => realZooProfile(item.record, index));
    state.opponentTradeStocks = selected.map(item => realZooTradeAnimals(item.record, true));
    state.tradeOffers = selected.map((item, index) => ({ opponentIndex: index, animal: item.animal }));
    state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;
    renderTrade();
    renderOpponentTradeState();
}

function createRealAutonomousOpponentOffer() {
    if (state.outgoingOffer || state.autonomousTradeOffer) return false;

    // The same slider controls spontaneous real-zoo offers.
    if (Math.random() > tradeFrequencyFactor()) return false;

    const pool = weightedRealZooPool();
    if (!pool.length) return false;

    for (let tries = 0; tries < 20; tries++) {
        const record = randomItem(pool);
        const possible = realZooTradeAnimals(record, true).filter(animal =>
            animal.level <= Math.max(1, ...state.playerLevelsSeen)
        );
        if (!possible.length) continue;
        const animal = randomItem(possible);
        state.opponentProfiles = [realZooProfile(record, 0)];
        state.opponentTradeStocks = [possible];
        state.autonomousTradeOffer = {
            opponentIndex: 0,
            animal,
            offeredTurn: state.turn,
            expiresTurn: state.turn + 3
        };
        state.selectedTradeOpponent = 0;
        state.tradeOffers = [];
        renderTrade();
        renderOpponentTradeState();
        return true;
    }
    return false;
}

// ============================================================
// OPPONENT TRADING
// ============================================================
function ensureOpponentZooElements() {
    const container = $('opponentZoos');
    if (!container) return;
    for (let i = 1; i <= 6; i++) {
        let el = $(`opponentName${i}`);
        if (!el) {
            el = document.createElement('div');
            el.id = `opponentName${i}`;
            el.className = 'opponent-name';
            container.appendChild(el);
        }
    }
}

function positionOpponentTradeArea() {
    const area = document.getElementById('opponentTradeArea');

    // Mobile layout is controlled entirely by CSS. Clear the desktop inline
    // positioning/sizing so it cannot bunch the phone HUD together.
    if (window.matchMedia('(max-width: 700px)').matches) {
        if (!area) return;
        area.style.position = '';
        area.style.left = '';
        area.style.right = '';
        area.style.top = '';
        area.style.display = '';
        area.style.visibility = '';
        area.style.opacity = '';
        area.style.removeProperty('--trade-card-height');
        area.style.removeProperty('--trade-card-width');
        area.style.removeProperty('--trade-card-gap');
        return;
    }
    const opponents = document.getElementById('opponentZoos');
    const rowReference = exchange1 || drawCard || resultBox;
    if (!area || !opponents || !rowReference) return;

    const opponentRect = opponents.getBoundingClientRect();
    const rowRect = rowReference.getBoundingClientRect();
    const header = document.getElementById('actionMenu');
    const headerRect = header ? header.getBoundingClientRect() : { bottom: 220 };

    // Make the trade cards as large as the remaining header height allows,
    // while keeping the animal-card 1000:1440 aspect ratio. This keeps them
    // on the same action row but gives the trade area substantially more
    // visual weight, roughly matching the progression tracker vertically.
    // Aim about 40px taller than v26, but never exceed the live header.
    // Centre the cards vertically inside the header so they sit snugly like
    // the progression tracker rather than hanging from the Exchange row.
    const headerPadding = 8;
    const maxHeaderHeight = Math.max(144, Math.floor(headerRect.height - (headerPadding * 2)));
    const desiredHeight = 184;
    const cardHeight = Math.min(desiredHeight, maxHeaderHeight);
    const cardWidth = Math.round(cardHeight * (1000 / 1440));
    const cardGap = 12;
    const areaWidth = (cardWidth * 2) + cardGap;
    const gapBeforeOpponents = 18;
    const screenPadding = 12;

    area.style.setProperty('--trade-card-height', `${cardHeight}px`);
    area.style.setProperty('--trade-card-width', `${cardWidth}px`);
    area.style.setProperty('--trade-card-gap', `${cardGap}px`);

    // Anchor the trade pair to the OPPONENT panel, not to the transformed
    // exchange controls. This guarantees that the boxes are always visible
    // immediately to the left of the opponent zoo names.
    let left = opponentRect.left - gapBeforeOpponents - areaWidth;
    left = Math.max(screenPadding, Math.min(left, window.innerWidth - areaWidth - screenPadding));

    area.style.position = 'fixed';
    area.style.left = `${Math.round(left)}px`;
    area.style.right = 'auto';

    // Use an actual action card as the vertical reference so Outgoing and
    // Incoming are exactly level with Draw / Exchange rather than the title.
    const centredTop = headerRect.top + Math.max(headerPadding, (headerRect.height - cardHeight) / 2);
    area.style.top = `${Math.round(centredTop)}px`;
    area.style.display = 'flex';
    area.style.visibility = 'visible';
    area.style.opacity = '1';
}

function ensureTradeAreaLayout() {
    let area = document.getElementById('opponentTradeArea');
    if (!area) {
        area = document.createElement('div');
        area.id = 'opponentTradeArea';
        area.className = 'opponent-trade-area';
    }

    // IMPORTANT: #headerActions is transformed with translateX(-50%). A
    // position:fixed child of a transformed element is positioned relative to
    // that element rather than the viewport. That was why v22 could make the
    // trade boxes disappear. Keep this fixed overlay directly under <body>.
    if (area.parentElement !== document.body) document.body.appendChild(area);
    if (outgoingOfferBox.parentElement !== area) area.appendChild(outgoingOfferBox);
    if (incomingOfferBox.parentElement !== area) area.appendChild(incomingOfferBox);

    positionOpponentTradeArea();
}

function markPlayerLevelSeen(level) {
    if (!Number.isFinite(level)) return;
    state.playerLevelsSeen.add(level);
    if (level >= 2) state.unlockedOpponentCount = Math.max(state.unlockedOpponentCount, Math.min(6, level + 1));
    renderOpponentTradeState();
}

function randomOpponentStockAnimal(profile) {
    const enabled = [...state.activeCategories];
    const maxPlayerLevel = Math.max(1, ...state.playerLevelsSeen);
    const possibleLevels = [];
    for (let level = 1; level <= Math.min(5, maxPlayerLevel); level++) possibleLevels.push(level);
    for (let tries = 0; tries < 80; tries++) {
        const weightedCategories = [...(profile?.favourites || []), ...(profile?.favourites || []), ...enabled];
        const category = randomItem(weightedCategories);
        const level = randomItem(possibleLevels);
        if (!category || !level) continue;
        const files = levelFiles(category, level);
        if (!files.length) continue;
        const existingKeys = new Set([
            ...state.animals.map(a => `${a.category}|${a.level}|${a.filename.toLowerCase()}`),
            ...state.opponentTradeStocks.flat().filter(Boolean).map(a => `${a.category}|${a.level}|${a.filename.toLowerCase()}`)
        ]);
        const available = files.filter(f => !existingKeys.has(`${category}|${level}|${f.toLowerCase()}`));
        if (!available.length) continue;
        return { id: state.nextId++, category, level, filename: randomItem(available), enclosureId: null, slotIndex: null, hand: false };
    }
    return null;
}

function fillOpponentTradeStock(index) {
    const profile = state.opponentProfiles[index];
    if (!profile) return;
    if (!Array.isArray(state.opponentTradeStocks[index])) state.opponentTradeStocks[index] = [];
    while (state.opponentTradeStocks[index].length < 5) {
        const animal = randomOpponentStockAnimal(profile);
        if (!animal) break;
        state.opponentTradeStocks[index].push(animal);
    }
}

function rotateOpponentTradeStocksIfNeeded() {
    const cycle = Math.floor((state.turn - 1) / 5);
    if (cycle <= state.opponentStockCycle) return;
    while (state.opponentStockCycle < cycle) {
        state.opponentStockCycle++;
        for (let i = 0; i < state.opponentProfiles.length; i++) {
            fillOpponentTradeStock(i);
            const stock = state.opponentTradeStocks[i] || [];
            const keep = shuffle([...stock]).slice(0, Math.min(2, stock.length));
            state.opponentTradeStocks[i] = keep;
            fillOpponentTradeStock(i); // replaces three of five when five were present
        }
    }
    // Existing negotiations expire when the opponents refresh their trade stock.
    if (state.outgoingOffer) {
        state.tradeOffers = [];
        state.selectedTradeOpponent = null;
        generateOpponentTradeOffers(state.outgoingOffer);
    }
}

function assignOpponentProfiles() {
    ensureOpponentZooElements();
    if (isRealOpponentMode()) {
        ensureTradeAreaLayout();
        state.opponentProfiles = [];
        state.opponentTradeStocks = [];
        state.tradeOffers = [];
        state.selectedTradeOpponent = null;
        state.autonomousTradeOffer = null;
        state.realZooUnlockedTier = 1;
        scheduleNextAutonomousOpponentOffer();
        renderOpponentTradeState();
        return;
    }
    ensureTradeAreaLayout();
    const enabled = [...state.activeCategories];
    state.opponentProfiles = state.opponentNames.slice(0, 6).map((name, index) => ({
        index, name,
        favourites: shuffle([...enabled]).slice(0, Math.min(3, enabled.length))
    }));
    state.opponentTradeStocks = state.opponentProfiles.map(() => []);
    state.opponentStockCycle = Math.floor((state.turn - 1) / 5);
    for (let i = 0; i < state.opponentProfiles.length; i++) fillOpponentTradeStock(i);
    state.tradeOffers = [];
    state.selectedTradeOpponent = null;
    scheduleNextAutonomousOpponentOffer();
    renderOpponentTradeState();
}

function randomAutonomousOfferDelay() {
    return 3 + Math.floor(Math.random() * 6); // 3 through 8 turns, inclusive
}

function scheduleNextAutonomousOpponentOffer() {
    state.nextAutonomousOfferTurn = state.turn + randomAutonomousOfferDelay();
}

function clearAutonomousOpponentOffer(resetTimer = true) {
    state.autonomousTradeOffer = null;
    if (resetTimer) scheduleNextAutonomousOpponentOffer();
    renderTrade();
    renderOpponentTradeState();
}

function createAutonomousOpponentOffer() {
    if (isRealOpponentMode()) return createRealAutonomousOpponentOffer();
    if (state.outgoingOffer || state.autonomousTradeOffer) return false;

    // The same slider controls spontaneous fictional-opponent offers.
    if (Math.random() > tradeFrequencyFactor()) return false;

    const unlocked = [];
    for (let i = 0; i < Math.min(state.unlockedOpponentCount, state.opponentProfiles.length); i++) {
        fillOpponentTradeStock(i);
        if ((state.opponentTradeStocks[i] || []).length) unlocked.push(i);
    }
    if (!unlocked.length) return false;
    const opponentIndex = randomItem(unlocked);
    const stock = state.opponentTradeStocks[opponentIndex] || [];
    const animal = randomItem(stock);
    if (!animal) return false;
    state.autonomousTradeOffer = {
        opponentIndex,
        animal,
        offeredTurn: state.turn,
        expiresTurn: state.turn + 3
    };
    state.selectedTradeOpponent = opponentIndex;
    state.tradeOffers = [];
    renderTrade();
    renderOpponentTradeState();
    return true;
}

function updateAutonomousOpponentOffer() {
    if (state.autonomousTradeOffer) {
        if (state.turn >= state.autonomousTradeOffer.expiresTurn) {
            clearAutonomousOpponentOffer(true);
        }
        return;
    }
    if (state.outgoingOffer) return;
    if (!Number.isFinite(state.nextAutonomousOfferTurn)) scheduleNextAutonomousOpponentOffer();
    if (state.turn >= state.nextAutonomousOfferTurn) {
        if (!createAutonomousOpponentOffer()) scheduleNextAutonomousOpponentOffer();
    }
}

function declineAutonomousOpponentOffer() {
    if (!state.autonomousTradeOffer) return;
    clearAutonomousOpponentOffer(true);
    if (isRealOpponentMode()) { clearRealOpponentDisplay(); renderOpponentTradeState(); }
}

function renderOpponentTradeState() {
    ensureOpponentZooElements();
    ensureTradeAreaLayout();
    positionOpponentTradeArea();
    const realMode = isRealOpponentMode();
    for (let i = 0; i < 6; i++) {
        const el = $(`opponentName${i + 1}`);
        if (!el) continue;
        const unlocked = realMode ? i < state.opponentProfiles.length : i < state.unlockedOpponentCount;
        const realHasTrade = state.tradeOffers.some(o => o.opponentIndex === i) || state.autonomousTradeOffer?.opponentIndex === i;
        el.style.display = unlocked && (!realMode || realHasTrade) ? '' : 'none';
        const hasPlayerOffer = unlocked && state.tradeOffers.some(o => o.opponentIndex === i);
        const hasAutonomousOffer = unlocked && state.autonomousTradeOffer?.opponentIndex === i;
        const has = hasPlayerOffer || hasAutonomousOffer;
        if (realMode && state.opponentProfiles[i]?.name && el.dataset.realZooName !== state.opponentProfiles[i].name) {
            el.textContent = state.opponentProfiles[i].name;
            el.dataset.realZooName = state.opponentProfiles[i].name;
        }
        el.classList.toggle('wants-trade', has);
        el.classList.toggle('selected-trade', state.selectedTradeOpponent === i && has);
        const favourites = state.opponentProfiles[i]?.favourites || [];
        let preferenceBar = el.querySelector('.opponent-preference-bar');
        if (!preferenceBar) {
            preferenceBar = document.createElement('div');
            preferenceBar.className = 'opponent-preference-bar';
            el.appendChild(preferenceBar);
        }
        preferenceBar.innerHTML = '';
        for (const category of favourites.slice(0, 3)) {
            const segment = document.createElement('span');
            segment.className = 'opponent-preference-segment';
            segment.style.background = state.categoryColours[category] || CATEGORY_COLOURS[category] || '#888';
            segment.title = category;
            preferenceBar.appendChild(segment);
        }
        const stock = state.opponentTradeStocks[i] || [];
        const stockText = stock.map(a => `${a.filename.replace(/\.png$/i,'')} (L${a.level})`).join(', ');
        el.title = unlocked ? `Favours: ${favourites.join(', ')}\nAvailable for trade: ${stockText || 'none'}` : '';
    }
}

function generateOpponentTradeOffers(outgoing, pendingEmergencyTrade = null) {
    if (isRealOpponentMode()) {
        generateRealZooTradeOffers(outgoing, pendingEmergencyTrade);
        return;
    }

    rotateOpponentTradeStocksIfNeeded();

    const emergency = pendingEmergencyTrade || emergencyTradeForAnimal(outgoing);
    if (emergency) {
        // The Private Pet Trade easter egg uses a temporary one-zoo
        // real-style profile when the current game uses fictional opponents.
        if (emergency.record) {
            state.opponentProfiles = [realZooProfile(emergency.record, 0)];
            state.opponentTradeStocks = [[emergency.animal]];
            state.tradeOffers = [{
                opponentIndex: 0,
                animal: emergency.animal
            }];
            state.selectedTradeOpponent = 0;
        }
        else {
            state.tradeOffers = [{
                opponentIndex: emergency.opponentIndex,
                animal: emergency.animal
            }];
            state.selectedTradeOpponent = emergency.opponentIndex;
        }

        // Do not cache emergency rescue offers: the rescue condition is
        // state-dependent and should disappear as soon as the deadlock does.
        renderTrade();
        renderOpponentTradeState();
        return;
    }

    const cached = cachedPlayerTradeOffers(outgoing);
    if (cached) {
        state.tradeOffers = cached
            .map(item => {
                const animal = animalFromRealZooName(item.animalName);
                return animal
                    ? { opponentIndex: item.opponentIndex, animal }
                    : null;
            })
            .filter(Boolean);
        state.selectedTradeOpponent = state.tradeOffers.length
            ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
            : null;
        renderTrade();
        renderOpponentTradeState();
        return;
    }

    state.tradeOffers = [];
    state.selectedTradeOpponent = null;

    const frequency = tradeFrequencyFactor();
    const overallRoll = seededRoll(
        `fictional-overall|${outgoing.id}|${tradeOfferWindow()}`
    ).roll;

    if (frequency > 0 && overallRoll <= frequency) {
        const candidates = [];

        state.opponentProfiles.forEach((profile, index) => {
            if (index >= state.unlockedOpponentCount) return;

            const matching = (state.opponentTradeStocks[index] || [])
                .filter(a => a.level === outgoing.level);
            if (!matching.length) return;

            const fav = profile.favourites.includes(outgoing.category);
            const zooChance = fav ? 0.30 : 0.12;

            const { seed, roll } = seededRoll(
                `fictional-zoo|${outgoing.id}|${index}|${tradeOfferWindow()}`
            );
            if (roll > zooChance) return;

            const animal = matching[(seed >>> 8) % matching.length];
            if (animal) candidates.push({ opponentIndex: index, animal });
        });

        state.tradeOffers = seededShuffle(
            candidates,
            `fictional-select|${outgoing.id}|${tradeOfferWindow()}`
        ).slice(0, 3);
    }

    storePlayerTradeOffers(
        outgoing,
        state.tradeOffers.map(item => ({
            opponentIndex: item.opponentIndex,
            animalName: String(item.animal.filename || '').replace(/\.png$/i, '')
        }))
    );

    if (state.tradeOffers.length) {
        state.selectedTradeOpponent = state.tradeOffers
            .map(o => o.opponentIndex)
            .sort((a, b) => a - b)[0];
    }

    renderTrade();
    renderOpponentTradeState();
}

function selectedTradeOffer() {
    if (state.autonomousTradeOffer) return state.autonomousTradeOffer;
    return state.tradeOffers.find(o => o.opponentIndex === state.selectedTradeOpponent) || null;
}

function outgoingFitsAutonomousOffer(animal = state.outgoingOffer) {
    const offer = state.autonomousTradeOffer;
    if (!offer || !animal) return false;
    const profile = state.opponentProfiles[offer.opponentIndex];
    if (!profile) return false;
    return animal.level === offer.animal.level && profile.favourites.includes(animal.category);
}

function incomingOfferCanBeAccepted() {
    if (!state.autonomousTradeOffer) return Boolean(state.outgoingOffer);
    return outgoingFitsAutonomousOffer();
}
function tryDropOnOutgoingOffer(event, animal) {
    const target = elementUnderPointer(event); if (!target) return false;
    if (!(target === outgoingOfferBox || outgoingOfferBox.contains(target))) return false;
    if (state.outgoingOffer && state.outgoingOffer.id !== animal.id) return false;
    if (state.autonomousTradeOffer) {
        if (!outgoingFitsAutonomousOffer(animal)) return false;
        state.outgoingOffer = animal; animal.hand = false; animal.enclosureId = null; animal.slotIndex = null;
        renderTrade(); return true;
    }
    // Preserve the rescue offer while the card is still physically in its
    // enclosure. Once removed, the deadlock test would otherwise become false.
    const pendingEmergencyTrade = emergencyTradeForAnimal(animal);

    state.outgoingOffer = animal;
    animal.hand = false;
    animal.enclosureId = null;
    animal.slotIndex = null;

    generateOpponentTradeOffers(animal, pendingEmergencyTrade);
    return true;
}
function renderTrade() {
    if (!outgoingOfferBox || !incomingOfferBox) return;
    outgoingOfferBox.innerHTML = ''; incomingOfferBox.innerHTML = '';
    outgoingOfferBox.classList.toggle('trade-filled', Boolean(state.outgoingOffer));
    if (state.outgoingOffer) { const img=document.createElement('img'); setupAnimalCard(img,state.outgoingOffer,'outgoing'); img.classList.add('trade-card'); outgoingOfferBox.appendChild(img); }
    else outgoingOfferBox.innerHTML='<span>OUTGOING<br>OFFER</span>';
    const offer=selectedTradeOffer(); incomingOfferBox.classList.toggle('trade-filled',Boolean(offer));
    const canAcceptIncoming = Boolean(offer) && incomingOfferCanBeAccepted();
    incomingOfferBox.classList.toggle('trade-locked', Boolean(offer) && !canAcceptIncoming);
    if (offer) {
        const img=document.createElement('img'); img.className='animal-card trade-card incoming-trade-card'; img.src=animalImage(offer.animal); img.draggable=false; attachImageError(img,`trade offer ${offer.animal.filename}`);
        img.addEventListener('mouseenter',()=>requestHoverPreview(offer.animal)); img.addEventListener('mouseleave',()=>hideHoverPreviewIfAllowed(offer.animal));
        if (canAcceptIncoming) img.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();startTradeResultDrag(e);});
        else img.title='Offer a same-level animal from one of this opponent’s three preferred categories first.';
        incomingOfferBox.appendChild(img);
    }
    else incomingOfferBox.innerHTML='<span>INCOMING<br>OFFER</span>';
    let decline = document.getElementById('declineOpponentOffer');
    if (state.autonomousTradeOffer) {
        if (!decline) { decline=document.createElement('button'); decline.id='declineOpponentOffer'; decline.type='button'; decline.className='decline-opponent-offer'; incomingOfferBox.parentElement?.appendChild(decline); }
        const turnsLeft=Math.max(0,state.autonomousTradeOffer.expiresTurn-state.turn);
        decline.textContent=`Decline (${turnsLeft} turn${turnsLeft===1?'':'s'} left)`;
        decline.style.display='block';
        decline.onclick=declineAutonomousOpponentOffer;
    } else if (decline) decline.style.display='none';
    renderOpponentTradeState();
}
function startTradeResultDrag(event) {
    const offer=selectedTradeOffer(); if(!offer||!incomingOfferCanBeAccepted()||state.drag||state.pan)return;
    const rect=event.currentTarget.getBoundingClientRect(), image=document.createElement('img'); image.className='dragging-animal'; image.src=animalImage(offer.animal); image.style.width=`${rect.width}px`; image.style.height=`${rect.height}px`; document.body.appendChild(image);
    state.drag={type:'trade-result',image,startClientX:event.clientX,startClientY:event.clientY,offsetX:event.clientX-rect.left,offsetY:event.clientY-rect.top}; moveTradeResultDragImage(event);
}
function moveTradeResultDragImage(event){if(state.drag?.type!=='trade-result')return;state.drag.image.style.left=`${event.clientX-state.drag.offsetX}px`;state.drag.image.style.top=`${event.clientY-state.drag.offsetY}px`;}
function acceptSelectedTrade(destination=null) {
    const offer=selectedTradeOffer();
    if(!offer) return false;
    const incoming=offer.animal;
    const autonomous = Boolean(state.autonomousTradeOffer);
    if(!state.outgoingOffer) return false;
    if(autonomous && !outgoingFitsAutonomousOffer()) return false;
    if(destination){ if(!placeAnimal(incoming,destination.enclosure,destination.slotIndex))return false; }
    else {incoming.hand=true;state.hand.push(incoming);}

    // In Real Zoo mode, update only this game's in-memory holdings:
    // incoming leaves the real zoo; outgoing joins it and can be offered later.
    if (isRealOpponentMode()) {
        const realProfile = state.opponentProfiles[offer.opponentIndex];
        updateRealZooSessionAfterTrade(
            realProfile?.realZooRecord,
            incoming,
            state.outgoingOffer
        );
    }

    // The offered animal leaves that opponent's current displayed stock.
    const stock=state.opponentTradeStocks[offer.opponentIndex]||[];
    state.opponentTradeStocks[offer.opponentIndex]=stock.filter(a=>a.id!==incoming.id);
    fillOpponentTradeStock(offer.opponentIndex);

    // Every accepted trade is an exchange: the player's offered animal
    // leaves the zoo whether the negotiation was player- or opponent-initiated.
    const outgoingId=state.outgoingOffer.id;
    state.animals=state.animals.filter(a=>a.id!==outgoingId);
    state.suppressedExchangeGlowIds.delete(outgoingId);
    state.outgoingOffer=null;

    state.animals.push(incoming);
    markPlayerLevelSeen(incoming.level);
    checkEnclosureReward(incoming);
    state.tradeOffers=[];
    state.selectedTradeOpponent=null;
    state.autonomousTradeOffer=null;
    if (isRealOpponentMode()) clearRealOpponentDisplay();
    scheduleNextAutonomousOpponentOffer();
    state.glowingEnclosureIds.clear();
    state.turn++;
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}
function finishTradeResultDrag(event) {
    const drag=state.drag;if(!drag||drag.type!=='trade-result')return;
    const distance=Math.hypot(event.clientX-drag.startClientX,event.clientY-drag.startClientY); drag.image?.remove();state.drag=null;
    if(distance<6){acceptSelectedTrade(null);return;} const destination=resultDropDestination(event); if(destination)acceptSelectedTrade(destination); else renderTrade();
}
function setupOpponentTradeClicks() {
    ensureOpponentZooElements();
    for(let i=0;i<6;i++){const el=$(`opponentName${i+1}`);if(!el||el.dataset.tradeClickBound==='1')continue;el.dataset.tradeClickBound='1';el.addEventListener('click',()=>{if(state.autonomousTradeOffer)return;if(!state.tradeOffers.some(o=>o.opponentIndex===i))return;state.selectedTradeOpponent=i;renderTrade();});}
}


// ============================================================
// ZOO NAME EDITING
// ============================================================

function createZooNameEditor() {

    const wrapper =
        document.createElement(
            'div'
        );


    wrapper.className =
        'zoo-name-editor';


    const text =
        document.createElement(
            'span'
        );


    text.className =
        'zoo-name-text';


    text.textContent =
        state.zooName;


    const button =
        document.createElement(
            'button'
        );


    button.type =
        'button';


    button.className =
        'zoo-name-edit-button';


    button.title =
        'Change zoo name';


    button.setAttribute(
        'aria-label',
        'Change zoo name'
    );


    /*
        Unicode pen icon, so no additional graphic asset is
        required.
    */

    button.textContent =
        '✎';


    let editing =
        false;


    button.addEventListener(
        'click',
        event => {

            event.preventDefault();
            event.stopPropagation();


            if (!editing) {

                editing = true;


                const input =
                    document.createElement(
                        'input'
                    );


                input.type =
                    'text';


                input.className =
                    'zoo-name-input';


                input.value =
                    state.zooName;


                wrapper.replaceChild(
                    input,
                    text
                );


                button.classList.add(
                    'editing'
                );


                input.focus();
                input.select();


                input.addEventListener(
                    'keydown',
                    keyEvent => {

                        if (
                            keyEvent.key ===
                            'Enter'
                        ) {

                            button.click();

                        }

                    }
                );

            }
            else {

                const input =
                    wrapper.querySelector(
                        '.zoo-name-input'
                    );


                const newName =
                    input
                        ?.value
                        .trim();


                if (newName) {

                    state.zooName =
                        newName;

                }


                text.textContent =
                    state.zooName;


                wrapper.replaceChild(
                    text,
                    input
                );


                editing = false;


                button.classList.remove(
                    'editing'
                );

            }

        }
    );


    wrapper.appendChild(
        text
    );


    wrapper.appendChild(
        button
    );


    playerZooName.innerHTML =
        '';


    playerZooName.appendChild(
        wrapper
    );

}


// ============================================================
// ZOO NAMES
// ============================================================

function buildZooNamePool(data) {

    if (Array.isArray(data)) {

        return data.filter(
            value =>
                typeof value ===
                'string'
        );

    }


    if (
        Array.isArray(
            data?.names
        )
    ) {

        return data.names;

    }


    if (
        Array.isArray(
            data?.zoos
        )
    ) {

        return data.zoos;

    }


    if (
        Array.isArray(
            data?.prefixes
        ) &&
        Array.isArray(
            data?.places
        )
    ) {

        const names = [];


        for (
            const place
            of data.places
        ) {

            const placeName =
                typeof place ===
                'string'
                    ? place
                    : (
                        place?.name ||
                        ''
                    );


            if (!placeName) {
                continue;
            }


            const prefix =
                randomItem(
                    data.prefixes
                );


            if (prefix) {

                names.push(
                    `${prefix} ${placeName}`
                );

            }
            else {

                names.push(
                    `${placeName} Zoo`
                );

            }

        }


        return names;

    }


    if (
        Array.isArray(
            data?.places
        )
    ) {

        return data.places

            .map(
                place =>
                    typeof place ===
                    'string'
                        ? place
                        : place?.name
            )

            .filter(Boolean)

            .map(
                place =>
                    `${place} Zoo`
            );

    }


    return [];

}


// ============================================================
// ASSIGN ZOO NAMES
// ============================================================

function assignZooNames() {

    const pool =
        shuffle(
            buildZooNamePool(
                state.zooNamesData
            )
        );


    if (
        pool.length === 0
    ) {

        state.zooName =
            'Wildlife Park';


        state.opponentNames = [
            'Riverside Zoo',
            'Forest Wildlife Park',
            'Lakeside Zoo'
        ];

    }
    else {

        state.zooName =
            pool[0];


        state.opponentNames = [

            pool[1] ||
                'Riverside Zoo',

            pool[2] ||
                'Forest Wildlife Park',

            pool[3] ||
                'Lakeside Zoo'

        ];

    }


    // Keep six stable opponent names available even while only two are visible.
    const fallbackOpponentNames = [
        'Riverside Zoo', 'Forest Wildlife Park', 'Lakeside Zoo',
        'Highland Wildlife Park', 'Meadowlands Zoo', 'Coastal Animal Park'
    ];
    const namePool = shuffle(buildZooNamePool(state.zooNamesData)).filter(name => name && name !== state.zooName);
    while (state.opponentNames.length < 6) {
        const candidate = namePool.find(name => !state.opponentNames.includes(name));
        state.opponentNames.push(candidate || fallbackOpponentNames[state.opponentNames.length] || `Opponent Zoo ${state.opponentNames.length + 1}`);
        if (candidate) namePool.splice(namePool.indexOf(candidate), 1);
    }
    state.opponentNames = state.opponentNames.slice(0, 6);


    createZooNameEditor();


    ensureOpponentZooElements();
    for (let i = 0; i < 6; i++) {
        const element = $(`opponentName${i + 1}`);
        if (element) element.textContent = state.opponentNames[i] || `Opponent Zoo ${i + 1}`;
    }

}


// ============================================================
// CENTER INITIAL VIEW
// ============================================================

function centerInitialView() {
    requestAnimationFrame(() => {
        if (state.enclosures.length === 0) return;

        const minX = Math.min(...state.enclosures.map(e => e.x));
        const maxX = Math.max(...state.enclosures.map(e => e.x + ENCLOSURE_W));
        const minY = Math.min(...state.enclosures.map(e => e.y));
        const maxY = Math.max(...state.enclosures.map(e => e.y + ENCLOSURE_H));
        const zooWidth = maxX - minX;
        const zooHeight = maxY - minY;

        // Fit every starting enclosure inside the visible zoo board with a generous margin.
        // Because zooBoard begins below the header, nothing can start hidden underneath it.
        const padding = 70;
        const availableWidth = Math.max(200, zooBoard.clientWidth - padding * 2);
        const availableHeight = Math.max(200, zooBoard.clientHeight - padding * 2);
        const fitZoom = Math.min(1, availableWidth / zooWidth, availableHeight / zooHeight);
        state.zoom = clamp(fitZoom, ZOOM_MIN, ZOOM_MAX);
        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        zooBoard.scrollLeft = Math.max(0, centerX * state.zoom - zooBoard.clientWidth / 2);
        zooBoard.scrollTop = Math.max(0, centerY * state.zoom - zooBoard.clientHeight / 2);
    });
}


hoverPreview.addEventListener('mouseenter', () => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    cancelHoverPreviewHide();
    hoverPreview.classList.add('super-zoom');
});

hoverPreview.addEventListener('mouseleave', () => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    hoverPreview.classList.remove('super-zoom');
    scheduleHoverPreviewHide();
});

hoverPreview.addEventListener('click', event => {
    if (event.target.closest('#wikiPreviewLink, #ztlPreviewLink, .animal-info-tab, .ztl-record')) return;
    event.preventDefault();
    event.stopPropagation();

    const mobileLayout = window.matchMedia('(max-width: 700px)').matches;

    if (mobileLayout) {
        // Mobile has no hover. Recreate the desktop two-stage enlargement
        // deliberately with taps:
        //   card tap -> preview
        //   preview tap -> larger preview
        //   larger-preview tap -> Wikipedia/info back
        if (!hoverPreview.classList.contains('super-zoom')) {
            hoverPreview.classList.add('super-zoom');
            return;
        }
    }

    flipPreviewToWikipedia();
});

function dismissMobileCardPreview() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    if (!hoverPreview.classList.contains('visible')) return;

    cancelHoverPreviewIntent();
    cancelHoverPreviewHide();
    state.previewHoveredAnimalId = null;
    state.previewWikiAnimalId = null;
    hoverPreview.classList.remove('super-zoom');
    hoverPreview.classList.remove('wiki-open');
    hoverPreview.classList.remove('visible');
}

document.addEventListener('pointerdown', event => {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    if (!hoverPreview.classList.contains('visible')) return;

    // Tapping the preview itself keeps it open so its info/back controls work.
    if (event.target.closest('#hoverPreview')) return;

    // Tapping another animal is allowed to replace the current preview after
    // that card's normal tap handling completes.
    if (event.target.closest('.animal-card')) return;

    dismissMobileCardPreview();
}, true);


// ============================================================
// MOBILE TRADE HUD VISIBILITY
// ============================================================

let mobileTradeFadeTimer = null;

function mobileTradeIsActive() {
    return Boolean(
        state.outgoingOffer ||
        state.autonomousTradeOffer ||
        state.tradeOffers.length
    );
}

function wakeMobileTradeArea() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const area = document.getElementById('opponentTradeArea');
    const zoos = document.getElementById('opponentZoos');
    if (!area) return;

    clearTimeout(mobileTradeFadeTimer);
    area.classList.remove('trade-hud-idle');
    zoos?.classList.remove('trade-hud-idle');

    // An active negotiation stays fully visible until completed/cancelled.
    if (mobileTradeIsActive()) return;

    mobileTradeFadeTimer = setTimeout(() => {
        if (mobileTradeIsActive()) return;
        area.classList.add('trade-hud-idle');
        zoos?.classList.add('trade-hud-idle');
    }, 2000);
}

function refreshMobileTradeAreaVisibility() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const area = document.getElementById('opponentTradeArea');
    const zoos = document.getElementById('opponentZoos');
    if (!area) return;

    clearTimeout(mobileTradeFadeTimer);

    if (mobileTradeIsActive()) {
        area.classList.remove('trade-hud-idle');
        zoos?.classList.remove('trade-hud-idle');
        return;
    }

    area.classList.remove('trade-hud-idle');
    zoos?.classList.remove('trade-hud-idle');
    mobileTradeFadeTimer = setTimeout(() => {
        if (mobileTradeIsActive()) return;
        area.classList.add('trade-hud-idle');
        zoos?.classList.add('trade-hud-idle');
    }, 2000);
}

document.addEventListener('pointerdown', event => {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    if (event.target.closest('#opponentTradeArea, #opponentZoos')) {
        wakeMobileTradeArea();
    }
}, true);

// renderTrade/renderOpponentTradeState change these nodes whenever a player
// places/removes a trade card or an opponent creates/cancels an offer.
const mobileTradeObserver = new MutationObserver(() => {
    refreshMobileTradeAreaVisibility();
});

if (outgoingOfferBox) {
    mobileTradeObserver.observe(outgoingOfferBox, { childList: true, subtree: true });
}
if (incomingOfferBox) {
    mobileTradeObserver.observe(incomingOfferBox, { childList: true, subtree: true });
}
const mobileOpponentZoos = document.getElementById('opponentZoos');
if (mobileOpponentZoos) {
    mobileTradeObserver.observe(mobileOpponentZoos, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}

window.addEventListener('resize', refreshMobileTradeAreaVisibility);
setTimeout(refreshMobileTradeAreaVisibility, 0);


// ============================================================
// SAMPLE CATEGORY COLOURS FROM THE ACTUAL CARD ART
//
// One random Level 1 card per category is loaded. The game averages
// the top-right 20 x 20 source-image pixels and uses that colour for
// the progression tracker. This means the tracker follows the assets
// themselves instead of relying on guessed CSS colours.
// ============================================================

function loadImageForColourSample(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error(`Could not sample colour from ${src}`));
        image.src = src;
    });
}

async function sampleCategoryColour(category) {
    const files = levelFiles(category, 1);
    if (!files.length) return CATEGORY_COLOURS[category] || '#777777';

    const filename = randomItem(files);
    const src = animalPath(category, 1, filename);

    try {
        const image = await loadImageForColourSample(src);
        const sampleSize = 20;
        const sourceX = Math.max(0, image.naturalWidth - sampleSize);
        const sourceY = 0;
        const sourceW = Math.min(sampleSize, image.naturalWidth);
        const sourceH = Math.min(sampleSize, image.naturalHeight);

        const canvas = document.createElement('canvas');
        canvas.width = sourceW;
        canvas.height = sourceH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

        const pixels = ctx.getImageData(0, 0, sourceW, sourceH).data;
        let r = 0, g = 0, b = 0, weight = 0;

        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3] / 255;
            if (alpha <= 0.05) continue;
            r += pixels[i] * alpha;
            g += pixels[i + 1] * alpha;
            b += pixels[i + 2] * alpha;
            weight += alpha;
        }

        if (!weight) return CATEGORY_COLOURS[category] || '#777777';

        r = Math.round(r / weight);
        g = Math.round(g / weight);
        b = Math.round(b / weight);
        return `rgb(${r}, ${g}, ${b})`;
    }
    catch (error) {
        console.warn(error);
        return CATEGORY_COLOURS[category] || '#777777';
    }
}

async function sampleAllCategoryColours() {
    const categories = Object.keys(FOLDERS);
    const colours = await Promise.all(categories.map(category => sampleCategoryColour(category)));
    categories.forEach((category, index) => {
        state.categoryColours[category] = colours[index];
    });
}


// ============================================================
// START
// ============================================================

async function startGame() {
    if (incomingOfferBox) incomingOfferBox.innerHTML = '<span>INCOMING<br>OFFER</span>';

    try {

        setLoading(
            'Loading Zoo Curator...',
            'Loading animal asset inventory...'
        );


        state.inventory =
            await loadJson(
                'asset-inventory.json',
                'Loading animal asset inventory...'
            );


        setLoading(
            'Loading Zoo Curator...',
            'Loading local animal information database...'
        );

        try {
            state.animalDatabase = await loadJson(
                'assets/data/animals.json',
                'Loading local animal information database...'
            );
            indexAnimalDatabase();
        } catch (databaseError) {
            console.warn('Animal information database unavailable:', databaseError);
            state.animalDatabase = { animals: [] };
            indexAnimalDatabase();
        }


        setLoading(
            'Loading Zoo Curator...',
            'Loading zoo names...'
        );


        state.zooNamesData =
            await loadJson(
                'zoo-names.json',
                'Loading zoo names...'
            );

        try {
            state.realZooData = await loadJson(
                'real_zoo_opponents.json',
                'Loading real zoo opponents...',
                6000
            );
        } catch (realZooError) {
            console.warn('Real zoo opponent database unavailable:', realZooError);
            state.realZooData = { zoos: [] };
        }


        setLoading(
            'Loading Zoo Curator...',
            'Checking Level 1 animal cards...'
        );


        const availableCategories =
            Object.keys(
                FOLDERS
            ).filter(
                category =>
                    levelFiles(
                        category,
                        1
                    ).length > 0
            );


        if (
            availableCategories.length ===
            0
        ) {

            throw new Error(
                'The asset inventory contains no usable Level 1 animal cards.'
            );

        }


        // Category progression colours are fixed game data. No image sampling
        // is performed, which avoids mobile image-decoding stalls.
        state.categoryColours = { ...CATEGORY_COLOURS };

        setLoading(
            'Loading Zoo Curator...',
            'Generating zoo names...'
        );


        assignZooNames();
        ensureGameOptionsUI();
        ensureSaveLoadUI();
        ensureTurnHistoryUI();
        setupOpponentTradeClicks();


        setLoading(
            'Loading Zoo Curator...',
            `Choosing starting enclosures for ${state.gameOptions.startingSpecies} species...`
        );


        createStartingZoo();
        assignOpponentProfiles();


        setLoading(
            'Loading Zoo Curator...',
            `Placing ${state.gameOptions.startingSpecies} starting animals...`
        );


        document
            .documentElement
            .style
            .setProperty(
                '--zoo-zoom',
                state.zoom
            );


        renderAll();


        setLoading(
            'Loading Zoo Curator...',
            'Centering zoo...'
        );


        state.loaded =
            true;


        gameApp.classList.add(
            'visible'
        );


        centerInitialView();


        setLoading(
            'Zoo Curator ready!',
            ''
        );


        setTimeout(
            () => {

                bootScreen.classList.add(
                    'hidden'
                );

            },
            150
        );

    }
    catch (error) {

        showFatal(
            error
        );

    }

}


// ============================================================
// GO
// ============================================================

startGame();






window.addEventListener('resize', () => { positionOpponentTradeArea(); });
