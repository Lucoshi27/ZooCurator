/*
 * ZOO CURATOR V172 — COMPACT NEW ZOO + COUNTRY SHORTCUTS
 * Known-good GitHub baseline. Future builds must descend from this version.
 */
const ZOO_CURATOR_VERSION = "V172";


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
    // V94: collection size controls starting animals + starting level curve.
    // Zoo size independently controls starting enclosure-space target.
    startingCollectionSize: 20,
    startingZooSize: 20,
    showEligibilityGlows: true,
    enclosureRewardMilestones: [1, 2, 3, 4, 6, 9],
    opponentMode: 'real',
    tradeOfferFrequency: 50,
    animalLanguage: 'en'
};

function interpolateStartingZooValue(size, points) {
    if (size <= points[0][0]) return points[0][1];

    for (let i = 1; i < points.length; i++) {
        const [rightSize, rightValue] = points[i];
        const [leftSize, leftValue] = points[i - 1];

        if (size <= rightSize) {
            const t = (size - leftSize) / (rightSize - leftSize);
            return leftValue + (rightValue - leftValue) * t;
        }
    }

    return points[points.length - 1][1];
}

function startingCollectionSizeRules(value = 20) {
    const size = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

    // Anchor points agreed for Starting Zoo Size. Values between these points
    // interpolate smoothly, so the slider changes continuously rather than in
    // five hard brackets.
    const species = Math.round(interpolateStartingZooValue(size, [
        [0, 0],
        [20, 8],
        [40, 14],
        [60, 24],
        [80, 36],
        [100, 52]
    ]));

    // Collection-space safety baseline. Actual startup capacity is controlled
    // independently by startingZooSizeRules().
    const maxSpaces = species + 5;

    // These are target chances. A higher-level roll is only allowed if the
    // immediately preceding level of that SAME category is already present
    // among the starting animals generated so far.
    let levelChances;

    if (size < 40) {
        levelChances = { 1: 1, 2: 0, 3: 0, 4: 0 };
    }
    else if (size < 60) {
        const t = (size - 40) / 20;
        levelChances = {
            1: 0.85 - 0.15 * t,
            2: 0.15 + 0.10 * t,
            3: 0.05 * t,
            4: 0
        };
    }
    else if (size < 80) {
        const t = (size - 60) / 20;
        levelChances = {
            1: 0.70 - 0.10 * t,
            2: 0.25 + 0.05 * t,
            3: 0.05 + 0.05 * t,
            4: 0
        };
    }
    else {
        const t = (size - 80) / 20;
        levelChances = {
            1: 0.60 - 0.15 * t,
            2: 0.30,
            3: 0.10 + 0.07 * t,
            4: 0.08 * t
        };
    }

    return { size, species, maxSpaces, levelChances };
}
function startingZooSizeRules(value = 20) {
    const size = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

    // V94 — independent enclosure-space curve.
    // 20% is the new standard: 12 spaces. The remaining anchors preserve
    // approximately the same proportional growth/shrinkage as the old curve.
    const maxSpaces = Math.round(interpolateStartingZooValue(size, [
        [0, 8],
        [20, 12],
        [40, 18],
        [60, 30],
        [80, 44],
        [100, 62]
    ]));

    return { size, maxSpaces };
}


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
            startingZooSize: Math.max(
                0, Math.min(100,
                    Number.isFinite(Number(saved.startingZooSize))
                        ? Number(saved.startingZooSize)
                        : DEFAULT_GAME_OPTIONS.startingZooSize
                )
            ),
            showEligibilityGlows: saved.showEligibilityGlows !== false,
            enclosureRewardMilestones: normalizeRewardMilestones(
                saved.enclosureRewardMilestones ||
                DEFAULT_GAME_OPTIONS.enclosureRewardMilestones
            ),
            opponentMode: saved.opponentMode === 'fictional'
                ? 'fictional'
                : saved.opponentMode === 'real'
                    ? 'real'
                    : DEFAULT_GAME_OPTIONS.opponentMode,
            tradeOfferFrequency: Math.max(
                0,
                Math.min(
                    100,
                    Number.isFinite(Number(saved.tradeOfferFrequency))
                        ? Number(saved.tradeOfferFrequency)
                        : DEFAULT_GAME_OPTIONS.tradeOfferFrequency
                )
            ),
            animalLanguage: saved.animalLanguage === 'nl' ? 'nl' : 'en'
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

    // V145 secret sandbox mode is saved with the game but isolated from normal rules.
    sandboxMode: false,
    sandboxLooseAnimals: [],

    inventory: null,
    animalDatabase: { animals: [] },
    animalDatabaseByName: new Map(),
    compatibilityData: {
        compatible_pairs: [],
        proxy_compatibility: { enabled: false, groups: {} }
    },
    compatibilityDirectGraph: new Map(),
    compatibilityEffectiveGraph: new Map(),
    compatibilityGlowHoldUntil: 0,
    compatibilityGlowFadeUntil: 0,
    compatibilityGlowFadeKeys: new Set(),
    compatibilityAnimalHoverIds: new Set(),
    compatibilityAnimalHoverHoldUntil: 0,
    compatibilityAnimalHoverFadeUntil: 0,
    compatibilityAnimalHoverTimer: null,
    compatibilityHoveredSlotKey: null,
    compatibilityHoveredSlotHoldUntil: 0,
    compatibilityHoveredSlotFadeUntil: 0,
    compatibilityHoveredSlotTimer: null,
    zooNamesData: null,
    realZooData: { zoos: [] },
    // Mutable copy of real-zoo holdings for THIS game only.
    // real_zoo_opponents.json remains untouched.
    realZooSessionHoldings: new Map(),
    provinceConnections: { provinces: {} },
    provinceDistanceCache: new Map(),
    highestZooPrestige: 0,

    zooName: '',
    zooCountry: '',
    zooProvince: '',
    zooLocation: '',
    zooType: 'general',
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
    tradeHistory: [],
    // V161: permanent identity-based provenance for every physical animal card
    // encountered by the player. Never infer location from species/name.
    animalLineage: new Map(),

    // V194 — permanent species collection / discovery journal.
    // collectionRecords is keyed by category|level|filename.
    collectionRecords: new Map(),
    collectionCohabitationActive: new Map(),
    collectionActiveLevel: 1,

    // Player-initiated trade results are cached per physical animal card for
    // a three-turn window. Removing and re-adding the same card therefore
    // cannot reroll which zoos are interested during that window.
    tradeOfferCache: new Map(),

    // Smart asset preloading. We choose the next draw before the player asks
    // for it, preload that exact front image, then consume it on Draw.
    nextDrawSpec: null,
    nextDrawReadyPromise: null,
    assetPreloadPromises: new Map(),

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
    compatibilityIntentTimer: null,
    compatibilityIntentAnimalId: null,
    compatibilityIntentActiveAnimal: null,

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
    // V157: once the player selects an exchange-eligible card, only that
    // category+level group keeps its yellow eligibility glow.
    exchangeGlowFocusKey: null,
    // V158: hovering the Outgoing Offer temporarily suppresses every yellow
    // exchange glow so the blue trade-interest glow is visually isolated.
    outgoingOfferHoverSuppressesExchangeGlow: false,
    outgoingOfferTradeHoverActive: false,
    lastExchangeGroupCounts: new Map(),
    exchangeGlowReturnUntil: 0,
    exchangeGlowReturnIds: new Set(),
    exchangeGlowDragStartedAt: 0,
    exchangeGlowContinueIds: new Set(),
    exchangeGlowContinueStartedAt: 0,
    exchangeGlowContinueUntil: 0,

    // V101: cards placed by a simple click glow yellow for 3 seconds,
    // then fade for 1 second so the player can immediately find them.
    newPlacementGlowStartedAt: {},

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
                    animalOccupiesZooSlot(animal, enclosure.id, slotIndex)
                )
            )
        );
    });
}

function hasNextLevelInventory(category, level) {
    const nextLevel = Number(level) + 1;

    if (
        !category ||
        !Number.isFinite(nextLevel) ||
        nextLevel < 2 ||
        nextLevel > 5
    ) {
        return false;
    }

    return levelFiles(category, nextLevel).length > 0;
}

function playerHasAnyUpgradeAvailable() {
    return [...exchangeGroupCounts().entries()]
        .some(([key, count]) => {
            if (count < 3) return false;

            const parts = String(key).split('|');
            const level = Number(parts.pop());
            const category = parts.join('|');

            return (
                level < 5 &&
                hasNextLevelInventory(category, level)
            );
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
    // During a deadlock, bypass reluctance/frequency but keep the same
    // prestige-window and geographical partner rules as normal trading.
    if (isRealOpponentMode()) {
        for (const outgoing of shuffledPlayers) {
            const candidates = [];
            for (const record of realZooRecordsAvailable()) {
                if (!realZooCanTradeFor(record, outgoing)) continue;

                const matching = realZooTradeAnimals(record, true)
                    .filter(candidate =>
                        candidate.level === outgoing.level &&
                        tradeIncomingHasDestinationAfterOutgoing(candidate, outgoing)
                    );
                if (!matching.length) continue;

                const { seed } = seededRoll(
                    `emergency-real-animal|${outgoing.id}|${record.name}|${state.turn}`
                );
                candidates.push({
                    record,
                    animal: matching[seed % matching.length]
                });
            }

            const selected = selectPrestigeLocationCandidates(
                candidates,
                1,
                `emergency-real-zoos|${outgoing.id}|${state.turn}|${tradeOfferWindow()}`
            )[0];
            if (selected) {
                return {
                    outgoingId: outgoing.id,
                    record: selected.record,
                    animal: selected.animal
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
                    .filter(candidate =>
                        candidate.level === outgoing.level &&
                        tradeIncomingHasDestinationAfterOutgoing(candidate, outgoing)
                    );
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
            const candidate = {
                category,
                level: 1,
                filename: cleanFilename(filename),
                enclosureId: null,
                slotIndex: null,
                hand: false
            };
            if (!tradeIncomingHasDestinationAfterOutgoing(candidate, outgoing)) continue;
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
            country: '',
            province: '',
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


function normalTradeInterestCap() {
    // "No more than a third" means a hard floor. With fewer than three
    // player-owned animals, normal trade interest is therefore zero.
    return Math.floor(state.animals.length / 3);
}

function normalTradeInterestAllowed(animal) {
    if (!animal) return false;

    const cap = normalTradeInterestCap();
    if (cap <= 0) return false;

    const candidates = state.animals.filter(candidate =>
        candidate &&
        candidate.level >= 1 &&
        candidate.level <= 5 &&
        candidate !== state.outgoingOffer
    );

    if (candidates.length <= cap) return true;

    // Stable per three-turn trade window. This prevents hovering/dragging in a
    // different order from changing which third of the zoo is trade-active.
    const ranked = [...candidates]
        .map(candidate => ({
            id: candidate.id,
            score: seededRoll(
                `trade-interest-cap|${candidate.id}|${tradeOfferWindow()}`
            ).seed
        }))
        .sort((a, b) => a.score - b.score || a.id - b.id)
        .slice(0, cap);

    return ranked.some(entry => entry.id === animal.id);
}


function predictedPlayerTradeOffers(animal) {
    if (!animal) return [];

    // Deadlock rescue remains state-dependent and is deliberately not cached.
    const emergency = emergencyTradeForAnimal(animal);
    if (emergency) return [emergency];

    // V133: honour an already-promised offer BEFORE recalculating the interest
    // cap. Once this animal is moved into state.outgoingOffer,
    // normalTradeInterestAllowed() excludes it from the zoo ranking by design.
    // Checking the cap first could therefore overwrite its locked offer with [].
    const cached = cachedPlayerTradeOffers(animal);
    if (cached) return cached;

    // Emergency deadlock rescue bypasses the rarity cap. Ordinary offers do not.
    if (!normalTradeInterestAllowed(animal)) {
        storePlayerTradeOffers(animal, []);
        return [];
    }

    // The first prediction for this physical card/window is locked below, so
    // the blue glow and click/drag trade paths all consume the same result.

    const frequency = tradeFrequencyFactor();

    if (frequency <= 0) {
        storePlayerTradeOffers(animal, []);
        return [];
    }

    if (isRealOpponentMode()) {
        const overallRoll = seededRoll(
            `real-overall|${animal.id}|${tradeOfferWindow()}`
        ).roll;

        if (overallRoll > frequency) {
            storePlayerTradeOffers(animal, []);
            return [];
        }

        const records = realZooRecordsAvailable();
        const candidates = [];

        for (const record of records) {
            if (!realZooCanTradeFor(record, animal)) continue;

            const matching = realZooTradeAnimals(record, true)
                .filter(candidate =>
                    candidate.level === animal.level &&
                    tradeIncomingHasDestinationAfterOutgoing(candidate, animal)
                );
            if (!matching.length) continue;

            const favourites = Array.isArray(record.preferred_categories)
                ? record.preferred_categories
                : [];
            const likesOutgoing = favourites.includes(animal.category);
            const baseInterest = likesOutgoing ? 0.27 : 0.11;
            const levelPenalty = (animal.level - 1) * 0.025;
            const zooChance = Math.max(0.025, baseInterest - levelPenalty);

            const { seed, roll } = seededRoll(
                `real-zoo|${animal.id}|${record.name}|${tradeOfferWindow()}`
            );
            if (roll > zooChance) continue;

            const offeredAnimal = weightedRandomItem(
                matching,
                candidate => animalZooTypeWeight(candidate, record.zoo_types || record.zooTypes || 'general', 'trade'),
                ((seed >>> 8) % 1000000) / 1000000
            );
            candidates.push({ record, animal: offeredAnimal });
        }

        const selected = selectPrestigeLocationCandidates(
            candidates,
            3,
            `real-select|${animal.id}|${tradeOfferWindow()}`
        );

        const locked = selected.map(item => ({
            recordName: item.record.name,
            animalName: String(item.animal.filename || '').replace(/\.png$/i, ''),
            animalSpec: cachedTradeAnimalSpec(item.animal)
        }));

        storePlayerTradeOffers(animal, locked);
        return locked;
    }

    const overallRoll = seededRoll(
        `fictional-overall|${animal.id}|${tradeOfferWindow()}`
    ).roll;

    if (overallRoll > frequency) {
        storePlayerTradeOffers(animal, []);
        return [];
    }

    const candidates = [];

    state.opponentProfiles.forEach((profile, index) => {
        if (index >= state.unlockedOpponentCount) return;
        if (!fictionalZooCanTradeFor(index, animal)) return;

        const matching = (state.opponentTradeStocks[index] || [])
            .filter(candidate =>
                candidate.level === animal.level &&
                tradeIncomingHasDestinationAfterOutgoing(candidate, animal)
            );
        if (!matching.length) return;

        const fav = profile.favourites.includes(animal.category);
        const zooChance = fav ? 0.34 : 0.14;

        const { seed, roll } = seededRoll(
            `fictional-zoo|${animal.id}|${index}|${tradeOfferWindow()}`
        );
        if (roll > zooChance) return;

        const offeredAnimal = weightedRandomItem(
            matching,
            candidate => animalZooTypeWeight(candidate, profile.zooTypes || 'general', 'trade'),
            ((seed >>> 8) % 1000000) / 1000000
        );
        if (offeredAnimal) {
            candidates.push({ opponentIndex: index, animal: offeredAnimal });
        }
    });

    const selected = seededShuffle(
        candidates,
        `fictional-select|${animal.id}|${tradeOfferWindow()}`
    ).slice(0, 3);

    const locked = selected.map(item => ({
        opponentIndex: item.opponentIndex,
        animalName: String(item.animal.filename || '').replace(/\.png$/i, ''),
        animalSpec: cachedTradeAnimalSpec(item.animal)
    }));

    storePlayerTradeOffers(animal, locked);
    return locked;
}

function animalCouldReceiveTradeInterest(animal) {
    // V163: this is specifically the BLUE trade-interest hint. Do not couple
    // it to the yellow exchange-eligibility preference.
    if (!animal || animal.level < 1 || animal.level > 5) return false;
    if (animal === state.outgoingOffer) return false;

    if (state.autonomousTradeOffer) {
        return outgoingFitsAutonomousOffer(animal);
    }

    // This uses exactly the same seeded rolls, frequency gate, zoo-specific
    // willingness and three-offer cap as actually placing the card.
    const predicted = predictedPlayerTradeOffers(animal);

    // Emergency offers are already live objects and bypass the normal cache.
    if (predicted.some(item => item?.animal)) return true;

    // V83: use the SAME full validation as the actual outgoing-offer drop.
    // Merely reconstructing an animal card is not enough: the zoo must still
    // exist/unlocked, still be eligible, still hold that exact card, and the
    // player must not already own the incoming species/card.
    return materializeLockedPlayerTradeOffers(animal, predicted).length > 0;
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
[incomingOfferBox].forEach(box => {
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

    const errorText =
        'Zoo Curator could not start.\n\n' +
        (
            error?.stack ||
            error?.message ||
            String(error)
        );

    // Never remove the boot screen when startup fails. On some mobile
    // browsers the separate fatal-error panel can fail to become visible,
    // which previously left the player looking at a completely white page.
    // Re-use the boot overlay itself as the guaranteed error display.
    if (bootScreen) {
        bootScreen.classList.remove('hidden');
        bootScreen.style.display = '';
        bootScreen.style.opacity = '1';
        bootScreen.style.visibility = 'visible';
        bootScreen.style.pointerEvents = 'auto';
        bootScreen.style.background = '#fff';
        bootScreen.style.color = '#111';
        bootScreen.style.zIndex = '2147483647';
    }

    if (bootStatus) {
        bootStatus.textContent = 'Zoo Curator could not start';
        bootStatus.style.color = '#b00020';
    }

    if (bootDetail) {
        bootDetail.textContent = errorText;
        bootDetail.style.whiteSpace = 'pre-wrap';
        bootDetail.style.overflowWrap = 'anywhere';
        bootDetail.style.maxWidth = '90vw';
        bootDetail.style.maxHeight = '65vh';
        bootDetail.style.overflow = 'auto';
        bootDetail.style.color = '#111';
    }

    // Keep the old fatal panel populated as a secondary desktop fallback.
    if (fatalError) {
        fatalError.classList.add('visible');
        fatalError.textContent = errorText;
    }
}

// Surface otherwise invisible mobile Safari errors on the same boot overlay.
window.addEventListener('error', event => {
    if (!state.loaded) {
        showFatal(event.error || new Error(event.message || 'Unknown JavaScript error.'));
    }
});

window.addEventListener('unhandledrejection', event => {
    if (!state.loaded) {
        const reason = event.reason;
        showFatal(
            reason instanceof Error
                ? reason
                : new Error(typeof reason === 'string' ? reason : JSON.stringify(reason))
        );
    }
});


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
// OPTIONAL REAL-ZOO DATABASE
// ============================================================
//
// The real-zoo database must NEVER block game startup. Some mobile browsers
// have been observed leaving this request pending even when AbortController is
// used. Therefore it is loaded independently after startup has already moved
// on. Failure or timeout simply leaves real-zoo data empty for this session.

// Older files store `zoos` as a flat array. The current file still uses its
// legacy country -> province -> tier-shaped containers for compatibility, but
// tiers no longer participate in gameplay. Normalize both shapes once at load
// and deliberately discard the obsolete per-zoo tier field.
function normaliseRealZooRecords(rawZoos) {
    if (Array.isArray(rawZoos)) {
        return rawZoos
            .filter(record => record && typeof record === 'object')
            .map(({ tier: _obsoleteTier, ...record }) => record);
    }
    if (!rawZoos || typeof rawZoos !== 'object') return [];

    const records = [];
    for (const [country, provinces] of Object.entries(rawZoos)) {
        if (!provinces || typeof provinces !== 'object' || Array.isArray(provinces)) continue;
        for (const [province, tiers] of Object.entries(provinces)) {
            if (!tiers || typeof tiers !== 'object' || Array.isArray(tiers)) continue;
            for (const tierRecords of Object.values(tiers)) {
                if (!Array.isArray(tierRecords)) continue;
                for (const rawRecord of tierRecords) {
                    if (!rawRecord || typeof rawRecord !== 'object') continue;
                    const { tier: _obsoleteTier, ...record } = rawRecord;
                    records.push({
                        ...record,
                        country: rawRecord.country || country,
                        province: rawRecord.province || province
                    });
                }
            }
        }
    }
    return records;
}

function loadRealZooDataInBackground() {
    const path = 'real_zoo_opponents.json';
    const timeoutMs = 8000;

    const request = fetch(path, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error(
                    `Could not load ${path}. HTTP ${response.status}.`
                );
            }
            return response.json();
        });

    const timeout = new Promise((_, reject) => {
        setTimeout(
            () => reject(
                new Error(
                    `${path} did not finish loading within ${Math.round(timeoutMs / 1000)} seconds.`
                )
            ),
            timeoutMs
        );
    });

    Promise.race([request, timeout])
        .then(data => {
            const zoos = normaliseRealZooRecords(data?.zoos);
            if (!data || !zoos.length) {
                throw new Error(`${path} does not contain any valid zoo records.`);
            }

            state.realZooData = { ...data, zoos };
            resetRealZooSessionHoldings();
            // Predictions made before the optional database arrived may have
            // cached an empty offer set. Recompute them against the real data.
            state.tradeOfferCache.clear();
            if (tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) {
                queueMicrotask(applyTradeEligibleGlow);
            }

            // If the player chose real opponents, refresh the passive opponent
            // display now that the database is available. This does not restart
            // or otherwise alter the game.
            if (state.loaded && isRealOpponentMode()) {
                renderOpponentTradeState();
            }

            console.log(
                `Real zoo opponent database loaded in background (${zoos.length} zoos).`
            );
        })
        .catch(error => {
            console.warn(
                'Real zoo opponent database unavailable; game continues without it:',
                error
            );
            state.realZooData = { zoos: [] };
            state.realZooSessionHoldings = new Map();
        });
}

function loadProvinceConnectionsInBackground() {
    const path = 'province_connections.json';
    fetch(path, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (!data?.provinces || typeof data.provinces !== 'object') {
                throw new Error('No provinces object found.');
            }
            state.provinceConnections = data;
            state.provinceDistanceCache = new Map();
            state.tradeOfferCache.clear();
            console.log(
                `Province connection database loaded (${Object.keys(data.provinces).length} provinces).`
            );
        })
        .catch(error => {
            // This enhancement is optional: country-level distance remains
            // usable when the graph is absent or still being downloaded.
            console.warn(
                'Province connection database unavailable; using country-level trade distance:',
                error
            );
            state.provinceConnections = { provinces: {} };
            state.provinceDistanceCache = new Map();
        });
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

            // V167: tagged zoo-type inventories store a level as an
            // object whose keys are filenames and values are tag arrays.
            // Treat those keys exactly like the old filename arrays.
            if (
                candidate &&
                !Array.isArray(candidate) &&
                typeof candidate === 'object'
            ) {
                return Object.keys(candidate)
                    .map(cleanFilename)
                    .filter(Boolean)
                    .filter(filename => !/^back\.png$/i.test(filename));
            }

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

// Tagged inventories may attach tags to filenames and define category/tag
// multipliers under zooTypeWeights. Old inventories default every card to 1.
function levelInventoryEntry(category, level) {
    const source = getCategorySource(category);
    if (!source || Array.isArray(source) || typeof source !== 'object') return null;
    return source[level] ?? source[String(level)] ?? source[`Level ${level}`] ?? source[`level${level}`] ?? null;
}

function animalInventoryTags(category, level, filename) {
    const entry = levelInventoryEntry(category, level);
    if (!entry || Array.isArray(entry) || typeof entry !== 'object') return [];
    const wanted = cleanFilename(filename).toLowerCase();
    const key = Object.keys(entry).find(item => cleanFilename(item).toLowerCase() === wanted);
    const value = key ? entry[key] : null;
    const tags = Array.isArray(value) ? value : (Array.isArray(value?.tags) ? value.tags : []);
    return tags.map(tag => String(tag).trim().toLowerCase()).filter(Boolean);
}

function normaliseZooTypes(value) {
    const values = Array.isArray(value) ? value : [value];
    const result = [...new Set(values.map(type => String(type || '').trim().toLowerCase()).filter(Boolean))];
    return result.length ? result : ['general'];
}

function zooTypeWeightSettings() {
    const root = state.inventory?.zooTypeWeights || state.inventory?.zoo_type_weights || {};
    const generation = root.generation || root;
    return {
        types: generation.weights || generation.types || generation.zooTypes || generation.zoo_types || generation,
        baseline: Number(generation.baseline ?? generation.defaultWeight ?? 1) || 1,
        minimum: Number(generation.min ?? generation.minimum ?? generation.minWeight ?? 1) || 1,
        maximum: Number(generation.max ?? generation.maximum ?? generation.maxWeight ?? 8) || 8,
        tradeStrength: Math.max(0, Math.min(1, Number(root.tradePreferenceStrength ?? root.trade_preference_strength ?? generation.tradePreferenceStrength ?? 0.6))),
        tradeMaximum: Number(root.tradeMaximum ?? root.trade_maximum ?? root.incomingOffers?.max ?? 5) || 5
    };
}

function animalZooTypeWeight(animal, zooTypes, mode = 'generation') {
    if (!animal) return 1;
    const settings = zooTypeWeightSettings();
    const tags = new Set(animalInventoryTags(animal.category, animal.level, animal.filename));
    let multiplier = settings.baseline;
    for (const type of normaliseZooTypes(zooTypes)) {
        const rules = settings.types?.[type];
        if (!rules || typeof rules !== 'object') continue;
        const categories = rules.category || rules.categories || {};
        const categoryKey = Object.keys(categories).find(key => key.toLowerCase() === String(animal.category).toLowerCase());
        if (categoryKey) multiplier *= Number(categories[categoryKey]) || 1;
        const tagWeights = rules.tags || rules.tag || {};
        for (const [tag, weight] of Object.entries(tagWeights)) {
            if (tags.has(String(tag).trim().toLowerCase())) multiplier *= Number(weight) || 1;
        }
    }
    multiplier = Math.max(settings.minimum, Math.min(settings.maximum, multiplier));
    if (mode === 'trade') {
        multiplier = Math.min(
            settings.tradeMaximum,
            1 + ((multiplier - 1) * settings.tradeStrength)
        );
    }
    return Math.max(0.0001, multiplier);
}

function weightedRandomItem(items, weightFor, roll = Math.random()) {
    if (!Array.isArray(items) || !items.length) return null;
    const weights = items.map(item => Math.max(0, Number(weightFor(item)) || 0));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return items[Math.min(items.length - 1, Math.floor(roll * items.length))];
    let target = Math.max(0, Math.min(0.999999999, roll)) * total;
    for (let index = 0; index < items.length; index++) {
        target -= weights[index];
        if (target < 0) return items[index];
    }
    return items[items.length - 1];
}



// ============================================================
// SMART ANIMAL ASSET PRELOADING
// ============================================================

function preloadImageUrl(url) {
    if (!url) return Promise.resolve(false);

    if (state.assetPreloadPromises.has(url)) {
        return state.assetPreloadPromises.get(url);
    }

    // Mobile Safari can occasionally leave Image.decode() or an image load
    // promise pending indefinitely. Preloading is only an optimisation, so it
    // must never be allowed to block Zoo Curator from starting.
    const promise = new Promise(resolve => {
        const image = new Image();
        let settled = false;

        const finish = ok => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            image.onload = null;
            image.onerror = null;
            resolve(ok);
        };

        const timeoutId = setTimeout(() => {
            console.warn('Animal asset preload timed out; continuing without waiting:', url);
            finish(false);
        }, 4000);

        image.onload = () => finish(true);
        image.onerror = () => {
            console.warn('Could not preload animal asset:', url);
            finish(false);
        };

        image.src = url;

        // Cached images may already be complete before handlers get a chance
        // to fire. Do not call decode() here: the normal <img> element can
        // decode/paint it when rendered.
        if (image.complete) {
            finish(image.naturalWidth > 0);
        }
    });

    state.assetPreloadPromises.set(url, promise);
    return promise;
}

function preloadAnimalAsset(animalOrSpec) {
    if (!animalOrSpec) return Promise.resolve(false);

    return preloadImageUrl(
        animalPath(
            animalOrSpec.category,
            animalOrSpec.level,
            animalOrSpec.filename
        )
    );
}

function preloadAnimals(animals) {
    return Promise.all(
        (animals || [])
            .filter(Boolean)
            .map(preloadAnimalAsset)
    );
}

// Startup-only progress counter for the images already present in the zoo.
// A completed count advances whether an image loaded successfully or hit the
// existing fail-safe, so a bad asset cannot leave the counter frozen forever.
async function preloadAnimalsWithProgress(animals) {
    const items = (animals || []).filter(Boolean);
    const total = items.length;

    setLoading('Loading Zoo Curator...', `Loading image data 0/${total}`);

    if (total === 0) return [];

    let completed = 0;

    return Promise.all(
        items.map(animal =>
            preloadAnimalAsset(animal).finally(() => {
                completed += 1;
                setLoading(
                    'Loading Zoo Curator...',
                    `Loading image data ${completed}/${total}`
                );
            })
        )
    );
}

function chooseNextLevelOneSpec() {
    const availableCategories = Object.keys(FOLDERS).filter(category => {
        if (!state.activeCategories.has(category)) return false;

        const files = levelFiles(category, 1);
        return files.some(file => !state.animals.some(animal =>
            animal.category === category &&
            animal.level === 1 &&
            animal.filename.toLowerCase() === file.toLowerCase()
        ));
    });

    if (!availableCategories.length) return null;

    const category = randomItem(availableCategories);
    const used = playerOwnedCardKeys();

    const files = levelFiles(category, 1).filter(file =>
        !used.has(animalCardKey(category, 1, file))
    );

    if (!files.length) return null;

    return {
        category,
        level: 1,
        filename: randomItem(files)
    };
}

function prepareNextDrawAsset() {
    if (state.nextDrawSpec && state.nextDrawReadyPromise) {
        return state.nextDrawReadyPromise;
    }

    state.nextDrawSpec = chooseNextLevelOneSpec();

    if (!state.nextDrawSpec) {
        state.nextDrawReadyPromise = Promise.resolve(false);
        return state.nextDrawReadyPromise;
    }

    state.nextDrawReadyPromise = preloadAnimalAsset(state.nextDrawSpec);

    // V124: availability depends on the exact prepared card. As soon as that
    // asynchronous preparation finishes, refresh the deck's disabled state.
    // Previously the UI could remain visually enabled until the next click/render.
    state.nextDrawReadyPromise.finally(() => {
        queueMicrotask(() => refreshDrawAvailabilityState());
    });

    return state.nextDrawReadyPromise;
}

async function consumePreparedDrawSpec() {
    await prepareNextDrawAsset();

    const spec = state.nextDrawSpec;
    state.nextDrawSpec = null;
    state.nextDrawReadyPromise = null;

    return spec;
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

    const animal = {
        id: state.nextId++, category, level,
        filename: cleanFilename(chosen),
        enclosureId: null, slotIndex: null, hand: false
    };
    ensureAnimalLineage(animal, state.zooName || 'Your Zoo');
    return animal;
}

function ensureAnimalLineage(animal, origin = null) {
    if (!animal?.id) return null;
    if (!(state.animalLineage instanceof Map)) state.animalLineage = new Map();
    let record = state.animalLineage.get(animal.id);
    if (!record) {
        record = {
            animalId: animal.id,
            name: String(animal.filename || '').replace(/\.png$/i, ''),
            level: Number(animal.level) || 0,
            category: animal.category || '',
            originalFrom: origin || state.zooName || 'Your Zoo',
            currentAt: state.zooName || 'Your Zoo',
            exchanged: null
        };
        state.animalLineage.set(animal.id, record);
    } else if (origin && !record.originalFrom) {
        record.originalFrom = origin;
    }
    return record;
}

function animalLineageRecord(animalId) {
    if (!(state.animalLineage instanceof Map)) return null;
    return state.animalLineage.get(Number(animalId)) || state.animalLineage.get(animalId) || null;
}

function markAnimalTradedTo(animal, zooName) {
    const record = ensureAnimalLineage(animal, state.zooName || 'Your Zoo');
    if (!record) return;
    record.currentAt = zooName || 'Unknown';
}

function markAnimalTradedFrom(animal, zooName) {
    const record = ensureAnimalLineage(animal, zooName || 'Unknown');
    if (!record) return;
    if (!record.originalFrom || record.originalFrom === 'Unknown') record.originalFrom = zooName || 'Unknown';
    record.currentAt = state.zooName || 'Your Zoo';
}

function markAnimalExchangedFor(animal, resultAnimal, turn) {
    const record = ensureAnimalLineage(animal, state.zooName || 'Your Zoo');
    if (!record) return;
    record.currentAt = null;
    record.exchanged = {
        by: state.zooName || 'Your Zoo',
        forAnimalId: resultAnimal?.id ?? null,
        forName: String(resultAnimal?.filename || '').replace(/\.png$/i, '') || 'upgrade animal',
        forLevel: Number(resultAnimal?.level) || null,
        turn: Number(turn) || state.turn
    };
}


// ============================================================
// V194 — COLLECTION
// ============================================================

function collectionAnimalKey(animalOrCategory, level = null, filename = null) {
    if (animalOrCategory && typeof animalOrCategory === 'object') {
        return [
            animalOrCategory.category || '',
            Number(animalOrCategory.level) || 0,
            cleanFilename(animalOrCategory.filename || '')
        ].join('|');
    }
    return [animalOrCategory || '', Number(level) || 0, cleanFilename(filename || '')].join('|');
}

function ensureCollectionRecord(animal) {
    if (!animal) return null;
    if (!(state.collectionRecords instanceof Map)) state.collectionRecords = new Map();
    const key = collectionAnimalKey(animal);
    let record = state.collectionRecords.get(key);
    if (!record) {
        record = {
            key,
            category: animal.category || '',
            level: Number(animal.level) || 0,
            filename: cleanFilename(animal.filename || ''),
            firstZooTurn: null,
            shownBy: [],
            cohabitations: [],
            departures: []
        };
        state.collectionRecords.set(key, record);
    }
    return record;
}

function collectionRecordFor(category, level, filename) {
    if (!(state.collectionRecords instanceof Map)) return null;
    return state.collectionRecords.get(collectionAnimalKey(category, level, filename)) || null;
}

function collectionMarkShown(animal, zooName) {
    if (!animal || state.sandboxMode) return;
    const record = ensureCollectionRecord(animal);
    if (!record || record.firstZooTurn != null) return;
    const zoo = String(zooName || 'Another zoo').trim() || 'Another zoo';
    if (!Array.isArray(record.shownBy)) record.shownBy = [];
    if (!record.shownBy.some(item => String(item.zoo).toLowerCase() === zoo.toLowerCase())) {
        record.shownBy.push({ zoo, turn: state.turn });
    }
}

function collectionMarkEnteredZoo(animal) {
    if (!animal || state.sandboxMode) return;
    const record = ensureCollectionRecord(animal);
    if (!record) return;
    if (record.firstZooTurn == null) record.firstZooTurn = state.turn;
}

function collectionMarkDeparture(animal, data = {}) {
    if (!animal || state.sandboxMode) return;
    const record = ensureCollectionRecord(animal);
    if (!record || record.firstZooTurn == null) return;
    if (!Array.isArray(record.departures)) record.departures = [];
    record.departures.push({
        turn: Number(data.turn) || state.turn,
        type: data.type || 'trade',
        to: data.to || null,
        forName: data.forName || null,
        forLevel: Number(data.forLevel) || null
    });
}

function collectionTrackVisibleTradeOffers() {
    if (state.sandboxMode) return;

    const offers = [];
    if (state.autonomousTradeOffer?.animal) {
        offers.push({
            animal: state.autonomousTradeOffer.animal,
            opponentIndex: state.autonomousTradeOffer.opponentIndex
        });
    }
    for (const offer of state.tradeOffers || []) {
        if (offer?.animal) offers.push(offer);
    }

    for (const offer of offers) {
        const zooName =
            state.opponentProfiles?.[offer.opponentIndex]?.name ||
            `Zoo ${Number(offer.opponentIndex) + 1}`;
        collectionMarkShown(offer.animal, zooName);
    }
}

function collectionCurrentCohabitationPairs() {
    const pairs = new Map();

    for (const enclosure of state.enclosures || []) {
        const seenGroups = new Set();
        for (const slotIndex of getAllSlots(enclosure)) {
            const group = enclosureGroupForSlot(enclosure, slotIndex);
            if (!group || group.length <= 1) continue;
            const groupKey = [...group].sort((a,b)=>a-b).join(',');
            if (seenGroups.has(groupKey)) continue;
            seenGroups.add(groupKey);

            const occupants = animalsInEnclosureGroup(enclosure, group, null, false);
            for (let i = 0; i < occupants.length; i++) {
                for (let j = i + 1; j < occupants.length; j++) {
                    const a = occupants[i], b = occupants[j];
                    if (!a || !b || a.id === b.id) continue;
                    const ids = [Number(a.id), Number(b.id)].sort((x,y)=>x-y);
                    pairs.set(`${ids[0]}|${ids[1]}`, { a, b });
                }
            }
        }
    }
    return pairs;
}

function updateCollectionCohabitation() {
    if (state.sandboxMode) return;
    if (!(state.collectionCohabitationActive instanceof Map)) {
        state.collectionCohabitationActive = new Map();
    }

    const current = collectionCurrentCohabitationPairs();

    // Start newly observed continuous cohabitations.
    for (const [pairKey, pair] of current) {
        if (!state.collectionCohabitationActive.has(pairKey)) {
            state.collectionCohabitationActive.set(pairKey, {
                startTurn: state.turn,
                qualified: false,
                aKey: collectionAnimalKey(pair.a),
                bKey: collectionAnimalKey(pair.b),
                aName: animalDisplayName(pair.a),
                bName: animalDisplayName(pair.b)
            });
        }
    }

    // Remove broken episodes. Episodes shorter than three turns disappear
    // without ever entering the permanent collection journal.
    for (const pairKey of [...state.collectionCohabitationActive.keys()]) {
        if (!current.has(pairKey)) state.collectionCohabitationActive.delete(pairKey);
    }

    // A pairing counts after it has survived across three turn numbers, but
    // its permanent journal date is the original first turn together.
    for (const episode of state.collectionCohabitationActive.values()) {
        if (episode.qualified || state.turn - episode.startTurn < 2) continue;
        episode.qualified = true;

        const additions = [
            [episode.aKey, episode.bName],
            [episode.bKey, episode.aName]
        ];
        for (const [key, partnerName] of additions) {
            const record = state.collectionRecords.get(key);
            if (!record || record.firstZooTurn == null) continue;
            if (!Array.isArray(record.cohabitations)) record.cohabitations = [];
            if (!record.cohabitations.some(item =>
                item.partnerName === partnerName && Number(item.startTurn) === Number(episode.startTurn)
            )) {
                record.cohabitations.push({
                    partnerName,
                    startTurn: episode.startTurn
                });
            }
        }
    }
}

function syncCollectionState() {
    if (state.sandboxMode) return;
    for (const animal of state.animals || []) {
        if (animal?.enclosureId !== null && animal?.enclosureId !== undefined) {
            collectionMarkEnteredZoo(animal);
        }
    }
    collectionTrackVisibleTradeOffers();
    updateCollectionCohabitation();
}

function collectionInventoryEntries(level) {
    const entries = [];
    for (const category of CATEGORY_PROGRESSION_ORDER) {
        for (const filename of levelFiles(category, level)) {
            entries.push({ category, level, filename: cleanFilename(filename) });
        }
    }
    return entries;
}

function collectionHoverText(record) {
    if (!record) return '';
    if (record.firstZooTurn == null) {
        const shown = (record.shownBy || [])
            .map(item => `${item.zoo}${item.turn ? ` — Turn ${item.turn}` : ''}`);
        return shown.length
            ? `Shown by:\n${shown.join('\n')}`
            : '';
    }

    const lines = [`First arrived at the zoo: Turn ${record.firstZooTurn}`];

    if ((record.cohabitations || []).length) {
        lines.push('', 'Shared exhibits:');
        for (const item of record.cohabitations) {
            lines.push(`${item.partnerName} — from Turn ${item.startTurn}`);
        }
    }

    if ((record.departures || []).length) {
        lines.push('', 'Departures:');
        for (const item of record.departures) {
            if (item.type === 'upgrade') {
                lines.push(
                    `Turn ${item.turn}: exchanged for ${item.forName || 'upgrade animal'}` +
                    `${item.forLevel ? ` (Level ${item.forLevel})` : ''}`
                );
            } else {
                lines.push(
                    `Turn ${item.turn}: traded to ${item.to || 'another zoo'} for ` +
                    `${item.forName || 'another animal'}` +
                    `${item.forLevel ? ` (Level ${item.forLevel})` : ''}`
                );
            }
        }
    }

    return lines.join('\n');
}

let collectionOverlay = null;
let collectionTooltip = null;

function ensureCollectionMenu() {
    if (collectionOverlay) return;

    collectionOverlay = document.createElement('div');
    collectionOverlay.id = 'collectionOverlay';
    collectionOverlay.innerHTML = `
        <div class="collection-window">
            <div class="collection-header">
                <h2>Collection</h2>
                <button type="button" id="collectionClose">Close</button>
            </div>
            <div class="collection-tabs" id="collectionTabs"></div>
            <div class="collection-body" id="collectionBody"></div>
        </div>`;
    document.body.appendChild(collectionOverlay);

    collectionTooltip = document.createElement('div');
    collectionTooltip.id = 'collectionTooltip';
    document.body.appendChild(collectionTooltip);

    collectionOverlay.querySelector('#collectionClose').onclick = closeCollectionMenu;
    collectionOverlay.addEventListener('pointerdown', event => {
        if (event.target === collectionOverlay) closeCollectionMenu();
    });
}

function closeCollectionMenu() {
    if (collectionOverlay) collectionOverlay.style.display = 'none';
    if (collectionTooltip) collectionTooltip.style.display = 'none';
}

function showCollectionTooltip(event, record) {
    const text = collectionHoverText(record);
    if (!collectionTooltip || !text) return;
    collectionTooltip.textContent = text;
    collectionTooltip.style.display = 'block';
    moveCollectionTooltip(event);
}

function moveCollectionTooltip(event) {
    if (!collectionTooltip || collectionTooltip.style.display === 'none') return;
    const gap = 14;
    const rect = collectionTooltip.getBoundingClientRect();
    let left = event.clientX + gap;
    let top = event.clientY + gap;
    if (left + rect.width > window.innerWidth - 8) left = event.clientX - rect.width - gap;
    if (top + rect.height > window.innerHeight - 8) top = event.clientY - rect.height - gap;
    collectionTooltip.style.left = `${Math.max(8, left)}px`;
    collectionTooltip.style.top = `${Math.max(8, top)}px`;
}

function renderCollectionMenu() {
    ensureCollectionMenu();
    syncCollectionState();

    const tabs = collectionOverlay.querySelector('#collectionTabs');
    const body = collectionOverlay.querySelector('#collectionBody');
    tabs.innerHTML = '';

    for (let level = 1; level <= 5; level++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `Level ${level}`;
        button.className = level === state.collectionActiveLevel ? 'active' : '';
        button.onclick = () => {
            state.collectionActiveLevel = level;
            renderCollectionMenu();
        };
        tabs.appendChild(button);
    }

    body.innerHTML = '';
    const entries = collectionInventoryEntries(state.collectionActiveLevel);

    for (const category of CATEGORY_PROGRESSION_ORDER) {
        const categoryEntries = entries.filter(item => item.category === category);
        if (!categoryEntries.length) continue;

        const section = document.createElement('section');
        section.className = 'collection-category';
        const heading = document.createElement('h3');
        heading.textContent = category;
        section.appendChild(heading);

        const grid = document.createElement('div');
        grid.className = 'collection-grid';

        for (const entry of categoryEntries) {
            const record = collectionRecordFor(entry.category, entry.level, entry.filename);
            const acquired = record?.firstZooTurn != null;
            const offered = !acquired && Boolean(record?.shownBy?.length);

            const card = document.createElement('div');
            card.className =
                'collection-card ' +
                (acquired ? 'collection-acquired' : offered ? 'collection-offered' : 'collection-locked');

            const img = document.createElement('img');
            img.src = animalPath(entry.category, entry.level, entry.filename);
            img.alt = acquired || offered
                ? String(entry.filename).replace(/\.png$/i, '')
                : 'Undiscovered animal';
            img.draggable = false;
            card.appendChild(img);

            // V196: undiscovered cards keep the artwork hidden and also mask
            // the species-name strip printed directly on the card artwork.
            // The mask disappears as soon as a trade offer semi-reveals the
            // species, just like the translated-name rectangle system.
            if (!acquired && !offered) {
                const nameMask = document.createElement('div');
                nameMask.className = 'collection-undiscovered-name-mask';
                nameMask.setAttribute('aria-hidden', 'true');
                card.appendChild(nameMask);
            }

            if (record && (acquired || offered)) {
                card.addEventListener('mouseenter', event => showCollectionTooltip(event, record));
                card.addEventListener('mousemove', moveCollectionTooltip);
                card.addEventListener('mouseleave', () => {
                    if (collectionTooltip) collectionTooltip.style.display = 'none';
                });
            }

            grid.appendChild(card);
        }

        section.appendChild(grid);
        body.appendChild(section);
    }
}

function openCollectionMenu() {
    if (state.sandboxMode) return;
    ensureCollectionMenu();
    renderCollectionMenu();
    collectionOverlay.style.display = 'flex';
}


function ensureCollectionCategoryLinks() {
    const tracker =
        document.getElementById('categoryProgression') ||
        document.getElementById('categoryProgressionTracker') ||
        document.querySelector('.category-progression');

    if (!tracker || tracker.dataset.collectionLinksReady === '1') return;
    tracker.dataset.collectionLinksReady = '1';

    tracker.addEventListener('click', event => {
        // Never hijack the progression tick boxes themselves.
        if (event.target.closest('input, .category-progress-check, .category-check, [role="checkbox"]')) {
            return;
        }

        const nameBox = event.target.closest(
            '.category-name, .category-label, .category-progression-name, ' +
            '.category-progression-label, [data-category]'
        );
        if (!nameBox || !tracker.contains(nameBox)) return;

        const row = nameBox.closest('[data-category], .category-progress-row, .category-progression-row');
        const category =
            nameBox.dataset.category ||
            row?.dataset.category ||
            String(nameBox.textContent || '').trim();

        if (!CATEGORY_PROGRESSION_ORDER.includes(category)) return;

        event.preventDefault();
        event.stopPropagation();
        openCollectionMenu();

        // Scroll the requested category into view after the menu has rendered.
        requestAnimationFrame(() => {
            const headings = [...document.querySelectorAll('#collectionBody .collection-category h3')];
            const heading = headings.find(item => String(item.textContent).trim() === category);
            heading?.scrollIntoView({ block: 'start', behavior: 'smooth' });
        });
    });
}


function ensureCollectionButton() {
    let button = document.getElementById('collectionButton');
    if (!button) {
        button = document.createElement('button');
        button.id = 'collectionButton';
        button.type = 'button';
        button.title = 'Collection';
        button.setAttribute('aria-label', 'Open animal collection');
        button.textContent = '📖';
        button.onclick = openCollectionMenu;
    }

    const turnElement = document.getElementById('turnOrder');
    if (!turnElement || !turnElement.parentElement) return;

    let prestigeElement = document.getElementById('prestigeCounter');
    if (!prestigeElement) {
        prestigeElement = document.createElement('span');
        prestigeElement.id = 'prestigeCounter';
        prestigeElement.title = 'Highest zoo prestige reached; used to determine real-zoo trading partners.';
        prestigeElement.style.cssText =
            'flex:0 0 auto;margin-left:0;white-space:nowrap;font-size:12px;' +
            'font-weight:700;opacity:.78;line-height:1.2;';
    }

    let row = document.getElementById('collectionTurnRow');
    if (!row) {
        const parent = turnElement.parentElement;
        row = document.createElement('div');
        row.id = 'collectionTurnRow';

        // V199: setup runs only after the existing HUD installers. Therefore
        // it is safe to replace the timer's original position with this row.
        parent.insertBefore(row, turnElement);
        row.append(button, turnElement, prestigeElement);
    } else {
        if (button.parentElement !== row) row.insertBefore(button, row.firstChild);
        if (turnElement.parentElement !== row) row.appendChild(turnElement);
        if (prestigeElement.parentElement !== row) row.appendChild(prestigeElement);
    }

    updatePrestigeDisplay();
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

function reserveAnimalZooSlot(animal, enclosureId, slotIndex) {
    if (!animal || enclosureId == null || slotIndex == null) return;
    animal.reservedEnclosureId = enclosureId;
    animal.reservedSlotIndex = slotIndex;
}
function clearAnimalZooReservation(animal) {
    if (!animal) return;
    delete animal.reservedEnclosureId;
    delete animal.reservedSlotIndex;
}
function animalOccupiesZooSlot(animal, enclosureId, slotIndex) {
    return Boolean(animal) && (
        (animal.enclosureId === enclosureId && animal.slotIndex === slotIndex) ||
        (animal.reservedEnclosureId === enclosureId && animal.reservedSlotIndex === slotIndex)
    );
}
function hasPendingPlayerAction() {
    return state.exchange.some(Boolean) || Boolean(state.result) || Boolean(state.outgoingOffer);
}
function releaseExchangeReservations() {
    for (const animal of state.exchange.filter(Boolean)) clearAnimalZooReservation(animal);
}
function releaseOutgoingTradeReservation() {
    if (state.outgoingOffer) clearAnimalZooReservation(state.outgoingOffer);
}

function animalAtSlot(
    enclosureId,
    slotIndex,
    ignoreAnimalId = null,
    includeReserved = true
) {

    return state.animals.find(
        animal =>
            animal.id !== ignoreAnimalId &&
            (
                includeReserved
                    ? animalOccupiesZooSlot(animal, enclosureId, slotIndex)
                    : (
                        animal.enclosureId === enclosureId &&
                        animal.slotIndex === slotIndex
                    )
            )
    );

}


// ============================================================
// ENCLOSURE COMPATIBILITY
//
// compatible_pairs = researched/direct evidence.
// proxy_compatibility = optional transitive gameplay rule, currently
// restricted to the configured tamarin and lemur groups.
//
// Large exhibit groups are the GROUPS entries containing 2+ slots.
// A multi-animal large exhibit is legal when all occupants form one
// connected compatibility chain. This preserves the JSON's existing
// connected_compatibility_chain rule.
// ============================================================

function compatibilityName(value) {
    return String(value || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[’‘]/g, "'")
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

function compatibilityAnimalName(animal) {
    return compatibilityName(animalDisplayName(animal));
}

function graphAddEdge(graph, a, b) {
    a = compatibilityName(a);
    b = compatibilityName(b);
    if (!a || !b || a === b) return;

    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());

    graph.get(a).add(b);
    graph.get(b).add(a);
}

function rebuildCompatibilityGraphs() {
    const direct = new Map();

    for (const pairEntry of state.compatibilityData?.compatible_pairs || []) {
        const pair = Array.isArray(pairEntry)
            ? pairEntry
            : (Array.isArray(pairEntry?.animals) ? pairEntry.animals : pairEntry?.pair);
        if (!Array.isArray(pair) || pair.length < 2) continue;
        graphAddEdge(direct, pair[0], pair[1]);
    }

    state.compatibilityDirectGraph = direct;

    // Effective graph starts as an exact copy of researched direct edges.
    const effective = new Map();
    for (const [name, neighbours] of direct.entries()) {
        effective.set(name, new Set(neighbours));
    }

    const proxy = state.compatibilityData?.proxy_compatibility;
    if (proxy?.enabled && proxy.groups && typeof proxy.groups === 'object') {
        for (const membersRaw of Object.values(proxy.groups)) {
            const members = (Array.isArray(membersRaw) ? membersRaw : [])
                .map(compatibilityName)
                .filter(Boolean);

            const memberSet = new Set(members);
            const visited = new Set();

            // Find connected components using DIRECT evidence only.
            for (const start of members) {
                if (visited.has(start)) continue;

                const component = [];
                const stack = [start];
                visited.add(start);

                while (stack.length) {
                    const current = stack.pop();
                    component.push(current);

                    for (const next of direct.get(current) || []) {
                        if (!memberSet.has(next) || visited.has(next)) continue;
                        visited.add(next);
                        stack.push(next);
                    }
                }

                // Every animal in the same evidence-connected component becomes
                // mutually compatible for gameplay, without adding fake evidence
                // pairs to the JSON.
                if (component.length > 1) {
                    for (let i = 0; i < component.length; i++) {
                        for (let j = i + 1; j < component.length; j++) {
                            graphAddEdge(effective, component[i], component[j]);
                        }
                    }
                }
            }
        }
    }

    // V89 — honour explicit gameplay structures in newer compatibility JSON.
    // complete_groups makes every member of a named group mutually compatible.
    // group_links makes every member of one named group compatible with every
    // member of the linked group. Direct evidence pairs remain unchanged.
    const namedGroups = proxy?.groups && typeof proxy.groups === 'object'
        ? proxy.groups
        : {};

    const normalisedGroupMembers = groupName =>
        (Array.isArray(namedGroups[groupName]) ? namedGroups[groupName] : [])
            .map(compatibilityName)
            .filter(Boolean);

    for (const groupName of proxy?.complete_groups || []) {
        const members = normalisedGroupMembers(groupName);
        for (let i = 0; i < members.length; i++) {
            for (let j = i + 1; j < members.length; j++) {
                graphAddEdge(effective, members[i], members[j]);
            }
        }
    }

    for (const link of proxy?.group_links || []) {
        if (!link || typeof link !== 'object') continue;
        const fromMembers = normalisedGroupMembers(link.from);
        const toMembers = normalisedGroupMembers(link.to);
        for (const fromName of fromMembers) {
            for (const toName of toMembers) {
                graphAddEdge(effective, fromName, toName);
            }
        }
    }

    state.compatibilityEffectiveGraph = effective;
}

function animalsAreCompatible(a, b) {
    if (!a || !b) return false;

    const aName = compatibilityAnimalName(a);
    const bName = compatibilityAnimalName(b);

    // Same species can always cohabit from the compatibility system's point
    // of view; ordinary slot/capacity rules still apply.
    if (aName && aName === bName) return true;
    if (!aName || !bName) return false;

    // Fast path: use the prebuilt effective graph. This contains direct
    // compatible_pairs plus complete_groups and group_links.
    if (state.compatibilityEffectiveGraph.get(aName)?.has(bName)) return true;

    // V90 — defensive live evaluation of named gameplay groups.
    // This deliberately duplicates the group part of rebuildCompatibilityGraphs().
    // It prevents a stale/partially rebuilt graph from silently disabling valid
    // combinations such as Great White Pelican + Dalmatian Pelican or
    // Pygmy Marmoset + Southern Three-Banded Armadillo.
    const proxy = state.compatibilityData?.proxy_compatibility;
    if (!proxy?.enabled || !proxy.groups || typeof proxy.groups !== 'object') {
        return false;
    }

    const groupsForAnimal = animalName => {
        const result = new Set();
        for (const [groupName, membersRaw] of Object.entries(proxy.groups)) {
            if (!Array.isArray(membersRaw)) continue;
            if (membersRaw.some(member => compatibilityName(member) === animalName)) {
                result.add(groupName);
            }
        }
        return result;
    };

    const aGroups = groupsForAnimal(aName);
    const bGroups = groupsForAnimal(bName);

    // Every pair of members inside a complete group is compatible.
    const completeGroups = new Set(
        (Array.isArray(proxy.complete_groups) ? proxy.complete_groups : [])
            .map(String)
    );

    for (const groupName of aGroups) {
        if (bGroups.has(groupName) && completeGroups.has(groupName)) {
            return true;
        }
    }

    // Group links are gameplay compatibility links and are symmetric for
    // placement, regardless of which animal is being dragged first.
    for (const link of Array.isArray(proxy.group_links) ? proxy.group_links : []) {
        if (!link || typeof link !== 'object') continue;
        const from = String(link.from || '');
        const to = String(link.to || '');
        if (!from || !to) continue;

        if (
            (aGroups.has(from) && bGroups.has(to)) ||
            (aGroups.has(to) && bGroups.has(from))
        ) {
            return true;
        }
    }

    return false;
}

function enclosureGroupForSlot(enclosure, slotIndex) {
    return getGroups(enclosure).find(group => group.includes(slotIndex)) || null;
}

function animalsInEnclosureGroup(enclosure, group, ignoreAnimalId = null, includeReserved = true) {
    if (!enclosure || !group) return [];

    const slots = new Set(group);
    return state.animals.filter(animal =>
        animal.id !== ignoreAnimalId &&
        (
            (animal.enclosureId === enclosure.id && slots.has(animal.slotIndex)) ||
            (
                includeReserved &&
                animal.reservedEnclosureId === enclosure.id &&
                slots.has(animal.reservedSlotIndex)
            )
        )
    );
}

function animalsFormCompatibilityChain(animals) {
    if (animals.length <= 1) return true;

    /*
        V93 — STRICT MULTI-SPECIES COMPATIBILITY

        Every animal sharing one logical enclosure must be compatible with
        EVERY other animal in that enclosure.

        Previously this function only required the compatibility graph to be
        connected. That allowed an unintended bridge/chain loophole:
            A compatible with B
            B compatible with C
            A NOT compatible with C
        ...yet A + B + C was accepted.

        A third species must never act as a mediator between two incompatible
        species. Direct pairs and approved proxy/group rules still work; they
        simply have to cover every pair in the resulting enclosure.
    */
    for (let i = 0; i < animals.length; i++) {
        for (let j = i + 1; j < animals.length; j++) {
            if (!animalsAreCompatible(animals[i], animals[j])) {
                return false;
            }
        }
    }

    return true;
}

function compatibilityAllowsPlacement(animal, enclosure, slotIndex) {
    const group = enclosureGroupForSlot(enclosure, slotIndex);
    if (!group) return false;

    // Single-animal exhibits do not need compatibility data.
    if (group.length <= 1) return true;

    const occupants = animalsInEnclosureGroup(enclosure, group, animal.id, false);

    // The first animal can enter an empty large exhibit freely.
    if (occupants.length === 0) return true;

    return animalsFormCompatibilityChain([...occupants, animal]);
}

function slotCompatibilityGlowKey(enclosureId, slotIndex) {
    return `${enclosureId}:${slotIndex}`;
}

function compatibilityHintAnimals() {
    // Dragging is deliberate, so show compatibility immediately.
    if (state.drag?.type === 'animal') return [state.drag.animal];

    // Passive cursor travel must not light combination exhibits. A card only
    // becomes the compatibility candidate after the hover-intent timer fires.
    if (state.compatibilityIntentActiveAnimal) {
        return [state.compatibilityIntentActiveAnimal];
    }

    return [];
}

function animalIsSatisfiedInCombinationExhibit(animal) {
    if (!animal || animal.enclosureId === null || animal.enclosureId === undefined) {
        return false;
    }

    const enclosure = state.enclosures.find(item => item.id === animal.enclosureId);
    if (!enclosure) return false;

    const group = enclosureGroupForSlot(enclosure, animal.slotIndex);
    if (!group || group.length <= 1) return false;

    const animalName = compatibilityAnimalName(animal);
    const partners = animalsInEnclosureGroup(enclosure, group, animal.id, false);

    // "Satisfied" means it is actually in a mixed-species combination now,
    // not merely sitting alone in a large exhibit.
    return partners.some(partner =>
        compatibilityAnimalName(partner) !== animalName &&
        animalsAreCompatible(animal, partner)
    );
}

function slotIsCompatibilityMatch(enclosure, slotIndex, candidateAnimals = compatibilityHintAnimals()) {
    if (animalAtSlot(enclosure.id, slotIndex)) return false;

    const group = enclosureGroupForSlot(enclosure, slotIndex);
    if (!group || group.length <= 1) return false;

    const occupants = animalsInEnclosureGroup(enclosure, group);
    if (occupants.length === 0) return false; // not "available due to a match"

    return candidateAnimals.some(animal => {
        // V191: when passively hovering an animal that is already sharing a
        // mixed-species combination exhibit, it is satisfied: do not advertise
        // alternative combination spaces elsewhere. A solo animal still does.
        // Dragging remains deliberate and continues to show legal destinations.
        if (
            !state.drag &&
            state.compatibilityIntentActiveAnimal?.id === animal?.id &&
            animalIsSatisfiedInCombinationExhibit(animal)
        ) {
            return false;
        }

        // V106: once an animal is already in a combination enclosure, that
        // enclosure is its current home. Do not advertise another empty slot
        // in the same enclosure as a destination. Other compatible enclosures
        // may still glow normally.
        if (animal?.enclosureId !== null && animal?.enclosureId !== undefined &&
            animal.enclosureId === enclosure.id) {
            return false;
        }

        // Same-species cohabitation remains legal, but it is not a
        // mixed-species compatibility hint and therefore must not glow blue.
        const candidateName = compatibilityAnimalName(animal);

        const hasDifferentSpeciesOccupant = occupants.some(
            occupant => compatibilityAnimalName(occupant) !== candidateName
        );

        if (!hasDifferentSpeciesOccupant) return false;

        return compatibilityAllowsPlacement(animal, enclosure, slotIndex);
    });
}

function currentCompatibilityGlowKeys(candidateAnimals = compatibilityHintAnimals()) {
    const keys = new Set();

    for (const enclosure of state.enclosures) {
        for (const slotIndex of getAllSlots(enclosure)) {
            if (slotIsCompatibilityMatch(enclosure, slotIndex, candidateAnimals)) {
                keys.add(slotCompatibilityGlowKey(enclosure.id, slotIndex));
            }
        }
    }

    return keys;
}

function beginCompatibilityGlowFade(keys) {
    state.compatibilityGlowFadeKeys = new Set(keys || []);

    if (!state.compatibilityGlowFadeKeys.size) {
        state.compatibilityGlowHoldUntil = 0;
        state.compatibilityGlowFadeUntil = 0;
        return;
    }

    const now = Date.now();

    // V191: animal-hover destination glows begin fading the instant the
    // pointer leaves the animal. No full-strength hold remains.
    state.compatibilityGlowHoldUntil = now;
    state.compatibilityGlowFadeUntil = now + 1000;

    // Render immediately so the one-second fade animation starts now.
    renderZoo();

    setTimeout(() => {
        if (Date.now() >= state.compatibilityGlowFadeUntil) {
            state.compatibilityGlowFadeKeys.clear();
            state.compatibilityGlowHoldUntil = 0;
            state.compatibilityGlowFadeUntil = 0;
            renderZoo();
        }
    }, 1020);
}

function compatibilityCandidatesForHoveredSlot(enclosure, slotIndex) {
    if (!enclosure || animalAtSlot(enclosure.id, slotIndex)) return [];

    // V190: reverse lookup is intentionally destination-based. An animal may
    // be "satisfied" in a full combination exhibit and therefore show no
    // outgoing destination hints when IT is hovered, but hovering another open
    // combination slot may still highlight that animal if it can legally move
    // there.
    const group = enclosureGroupForSlot(enclosure, slotIndex);
    if (!group || group.length <= 1) return [];

    const occupants = animalsInEnclosureGroup(enclosure, group);
    if (occupants.length === 0) return [];

    return state.animals.filter(animal => {
        // The animal already occupying this exhibit is not a candidate.
        if (occupants.some(occupant => occupant.id === animal.id)) return false;

        // Blue means a mixed-species combination, not ordinary same-species
        // cohabitation.
        const candidateName = compatibilityAnimalName(animal);
        const hasDifferentSpeciesOccupant = occupants.some(
            occupant => compatibilityAnimalName(occupant) !== candidateName
        );
        if (!hasDifferentSpeciesOccupant) return false;

        return compatibilityAllowsPlacement(animal, enclosure, slotIndex);
    });
}

function applyCompatibilityAnimalHoverClasses() {
    const now = Date.now();
    const active = state.compatibilityAnimalHoverIds || new Set();

    document.querySelectorAll('.animal-card[data-animal-id]').forEach(card => {
        const id = Number(card.dataset.animalId);
        card.classList.remove(
            'compatibility-animal-match',
            'compatibility-animal-match-fading'
        );
        card.style.removeProperty('--compatibility-animal-fade-delay');

        if (!active.has(id)) return;

        if (now < state.compatibilityAnimalHoverHoldUntil) {
            card.classList.add('compatibility-animal-match');
            return;
        }

        if (now < state.compatibilityAnimalHoverFadeUntil) {
            card.classList.add('compatibility-animal-match-fading');
            const fadeElapsed = Math.max(
                0,
                now - state.compatibilityAnimalHoverHoldUntil
            );
            card.style.animationDelay = `${-Math.min(fadeElapsed, 1000)}ms`;
        }
    });
}

function applyCompatibilityHoveredSlotClasses() {
    const now = Date.now();

    document.querySelectorAll('.slot').forEach(slot => {
        slot.classList.remove(
            'compatibility-hover-slot-match',
            'compatibility-hover-slot-match-fading'
        );
        slot.style.removeProperty('--compatibility-hover-slot-fade-delay');

        const key = slotCompatibilityGlowKey(
            Number(slot.dataset.enclosureId),
            Number(slot.dataset.slotIndex)
        );

        if (!state.compatibilityHoveredSlotKey || key !== state.compatibilityHoveredSlotKey) {
            return;
        }

        if (!state.compatibilityAnimalHoverIds?.size) return;

        if (now < state.compatibilityHoveredSlotHoldUntil) {
            slot.classList.add('compatibility-hover-slot-match');
            return;
        }

        if (now < state.compatibilityHoveredSlotFadeUntil) {
            slot.classList.add('compatibility-hover-slot-match-fading');
            const fadeElapsed = Math.max(
                0,
                now - state.compatibilityHoveredSlotHoldUntil
            );
            slot.style.animationDelay = `${-Math.min(fadeElapsed, 1000)}ms`;
        }
    });
}

function clearCompatibilityHoverImmediately() {
    if (state.compatibilityAnimalHoverTimer) {
        clearTimeout(state.compatibilityAnimalHoverTimer);
        state.compatibilityAnimalHoverTimer = null;
    }
    if (state.compatibilityHoveredSlotTimer) {
        clearTimeout(state.compatibilityHoveredSlotTimer);
        state.compatibilityHoveredSlotTimer = null;
    }

    state.compatibilityAnimalHoverIds = new Set();
    state.compatibilityAnimalHoverHoldUntil = 0;
    state.compatibilityAnimalHoverFadeUntil = 0;
    state.compatibilityHoveredSlotKey = null;
    state.compatibilityHoveredSlotHoldUntil = 0;
    state.compatibilityHoveredSlotFadeUntil = 0;

    applyCompatibilityAnimalHoverClasses();
    applyCompatibilityHoveredSlotClasses();
}

function startCompatibilityAnimalHover(enclosure, slotIndex) {
    if (document.body.classList.contains('history-viewing')) return;

    // V185: an active animal drag already has a specific compatibility
    // candidate. Do not activate the reverse "what could go here?" glow for
    // an unrelated enclosure under the cursor.
    if (state.drag?.type === 'animal') {
        clearCompatibilityHoverImmediately();
        return;
    }

    const candidates = compatibilityCandidatesForHoveredSlot(
        enclosure,
        slotIndex
    );

    if (state.compatibilityAnimalHoverTimer) {
        clearTimeout(state.compatibilityAnimalHoverTimer);
        state.compatibilityAnimalHoverTimer = null;
    }
    if (state.compatibilityHoveredSlotTimer) {
        clearTimeout(state.compatibilityHoveredSlotTimer);
        state.compatibilityHoveredSlotTimer = null;
    }

    state.compatibilityAnimalHoverIds = new Set(
        candidates.map(animal => animal.id)
    );
    state.compatibilityAnimalHoverHoldUntil = Number.POSITIVE_INFINITY;
    state.compatibilityAnimalHoverFadeUntil = Number.POSITIVE_INFINITY;

    // The empty slot itself only glows if at least one animal CURRENTLY in the
    // zoo can legally join the occupied large exhibit.
    state.compatibilityHoveredSlotKey = candidates.length
        ? slotCompatibilityGlowKey(enclosure.id, slotIndex)
        : null;
    state.compatibilityHoveredSlotHoldUntil = candidates.length
        ? Number.POSITIVE_INFINITY
        : 0;
    state.compatibilityHoveredSlotFadeUntil = candidates.length
        ? Number.POSITIVE_INFINITY
        : 0;

    applyCompatibilityAnimalHoverClasses();
    applyCompatibilityHoveredSlotClasses();
}

function finishCompatibilityAnimalHover() {
    if (!state.compatibilityAnimalHoverIds?.size) {
        clearCompatibilityHoverImmediately();
        return;
    }

    const now = Date.now();

    // V190: reverse compatibility hints from hovering an EMPTY combination
    // slot begin fading immediately when the cursor leaves. There is no
    // one-second full-strength hold. The fade itself still lasts one second.
    state.compatibilityAnimalHoverHoldUntil = now;
    state.compatibilityAnimalHoverFadeUntil = now + 1000;
    state.compatibilityHoveredSlotHoldUntil = now;
    state.compatibilityHoveredSlotFadeUntil = now + 1000;

    applyCompatibilityAnimalHoverClasses();
    applyCompatibilityHoveredSlotClasses();

    if (state.compatibilityAnimalHoverTimer) {
        clearTimeout(state.compatibilityAnimalHoverTimer);
    }

    state.compatibilityAnimalHoverTimer = setTimeout(() => {
        clearCompatibilityHoverImmediately();
    }, 1020);
}



function ensureCompatibilityGlowStyles() {
    if (document.getElementById('compatibilityGlowStyles')) return;

    const style = document.createElement('style');
    style.id = 'compatibilityGlowStyles';
    style.textContent = `
        @keyframes newly-placed-animal-glow {
            0%, 75% {
                filter:
                    drop-shadow(0 0 5px rgba(255, 214, 48, 1))
                    drop-shadow(0 0 12px rgba(255, 214, 48, .95))
                    drop-shadow(0 0 20px rgba(255, 214, 48, .78));
            }
            100% {
                filter:
                    drop-shadow(0 0 0 rgba(255, 214, 48, 0));
            }
        }

        .animal-card.new-placement-glow {
            animation: newly-placed-animal-glow 4s linear forwards;
        }

        @keyframes hover-preview-fade-out {
            from { opacity: 1; }
            to { opacity: 0; }
        }

        #hoverPreview.preview-fading {
            animation: hover-preview-fade-out 1s ease-out forwards !important;
            pointer-events: none;
        }

        @keyframes compatibility-slot-fade {
            from {
                box-shadow:
                    inset 0 0 0 3px rgba(55, 165, 255, .95),
                    0 0 8px rgba(55, 165, 255, .95),
                    0 0 18px rgba(55, 165, 255, .72);
            }
            to {
                box-shadow:
                    inset 0 0 0 0 rgba(55, 165, 255, 0),
                    0 0 0 rgba(55, 165, 255, 0);
            }
        }

        .slot.compatibility-match-glow {
            box-shadow:
                inset 0 0 0 3px rgba(55, 165, 255, .95),
                0 0 8px rgba(55, 165, 255, .95),
                0 0 18px rgba(55, 165, 255, .72);
            border-radius: 8px;
            z-index: 8;
        }

        .slot.compatibility-match-glow-fading {
            border-radius: 8px;
            z-index: 8;
            animation: compatibility-slot-fade 1s ease-out forwards;
        }

        .slot.compatibility-hover-slot-match {
            box-shadow:
                inset 0 0 0 3px rgba(55, 165, 255, .95),
                0 0 8px rgba(55, 165, 255, .95),
                0 0 18px rgba(55, 165, 255, .72);
            border-radius: 8px;
            z-index: 9;
        }

        .slot.compatibility-hover-slot-match-fading {
            border-radius: 8px;
            z-index: 9;
            animation: compatibility-slot-fade 1s ease-out forwards;
        }

        body.history-viewing .slot.compatibility-match-glow,
        body.history-viewing .slot.compatibility-match-glow-fading,
        body.history-viewing .slot.compatibility-hover-slot-match,
        body.history-viewing .slot.compatibility-hover-slot-match-fading {
            box-shadow: none !important;
            animation: none !important;
        }

        @keyframes compatibility-animal-card-fade {
            from {
                filter:
                    drop-shadow(0 0 5px rgba(55, 165, 255, .98))
                    drop-shadow(0 0 12px rgba(55, 165, 255, .90))
                    drop-shadow(0 0 20px rgba(55, 165, 255, .72));
            }
            to {
                filter:
                    drop-shadow(0 0 0 rgba(55, 165, 255, 0));
            }
        }

        .animal-card.compatibility-animal-match {
            filter:
                drop-shadow(0 0 5px rgba(55, 165, 255, .98))
                drop-shadow(0 0 12px rgba(55, 165, 255, .90))
                drop-shadow(0 0 20px rgba(55, 165, 255, .72));
        }

        .animal-card.compatibility-animal-match-fading {
            animation: compatibility-animal-card-fade 1s ease-out forwards;
        }

        body.history-viewing .animal-card.compatibility-animal-match,
        body.history-viewing .animal-card.compatibility-animal-match-fading {
            filter: none !important;
            animation: none !important;
        }
    `;
    document.head.appendChild(style);
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
        !state.sandboxMode &&
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


    // V155: a reservation keeps this slot logically occupied for draw/full-zoo
    // capacity, but it must not block another EXISTING zoo animal from moving
    // into the visually empty slot. Only a physically present card blocks a move.
    if (
        animalAtSlot(
            enclosure.id,
            slotIndex,
            animal.id,
            false
        )
    ) {
        return false;
    }

    // Sandbox deliberately bypasses mixed-species compatibility restrictions.
    // It still requires a real slot and an empty physical position; incompatible
    // occupants are signalled visually with a red glow instead of blocking.
    if (state.sandboxMode) return true;

    return compatibilityAllowsPlacement(
        animal,
        enclosure,
        slotIndex
    );

}

function ensureDrawSpaceGuardStyles() {
    if (document.getElementById('draw-space-guard-styles')) return;

    const style = document.createElement('style');
    style.id = 'draw-space-guard-styles';
    style.textContent = `
        #drawCard {
            position: relative;
            overflow: visible;
        }

        #drawCard img {
            border-radius: 6px;
        }

        #drawCard::before {
            content: attr(data-label);
            position: absolute;
            left: 50%;
            top: -17px;
            transform: translateX(-50%);
            font-size: 10px;
            line-height: 1;
            font-weight: 900;
            letter-spacing: .7px;
            color: #4f4c45;
            white-space: nowrap;
            pointer-events: none;
        }

        #drawCard.draw-no-space {
            cursor: not-allowed !important;
        }

        /* V114: grey the actual card artwork. The deck image can have its own
           rendering/compositing, so filtering only #drawCard was not reliably visible. */
        #drawCard.draw-no-space img {
            opacity: .38 !important;
            filter: grayscale(1) brightness(.72) contrast(.82) !important;
        }

        #drawCard.draw-no-space::after {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: 6px;
            background: rgba(105, 105, 105, .34);
            pointer-events: none;
            z-index: 3;
        }
        @keyframes idleActionGuidePulse {
            0%, 100% {
                box-shadow: 0 0 0 0 rgba(50,135,255,0), inset 0 0 0 0 rgba(50,135,255,0);
                outline-color: rgba(50,135,255,0);
            }
            18%, 65% {
                box-shadow:
                    0 0 0 4px rgba(50,135,255,.98),
                    0 0 18px 9px rgba(50,135,255,.88),
                    0 0 38px 15px rgba(50,135,255,.48),
                    inset 0 0 0 3px rgba(120,190,255,.9);
                outline-color: rgba(105,175,255,1);
            }
        }
        .idle-action-guide {
            position: relative !important;
            z-index: 30 !important;
            outline: 3px solid transparent !important;
            outline-offset: 3px !important;
            animation: idleActionGuidePulse 4s ease-in-out 1 !important;
            overflow: visible !important;
        }
        /* V122: drawCard's visible artwork is a child image, while the wrapper
           can be visually tiny/covered. Give the image itself an unmistakable
           blue ring as well. This also remains visible over the grey disabled
           treatment and older cached style.css rules. */
        #drawCard.idle-action-guide img,
        #outgoingOffer.idle-action-guide img,
        #outgoingOffer.idle-action-guide .animal-card,
        #outgoingOffer.idle-action-guide > * {
            box-shadow:
                0 0 0 4px rgba(50,135,255,.98),
                0 0 20px 10px rgba(50,135,255,.78) !important;
            outline: 3px solid rgba(105,175,255,.95) !important;
            outline-offset: 2px !important;
        }
        /* V112: preserve the original menu width. Controls extend leftward
           toward their labels instead of widening the Game Options panel. */
        .game-options-modal label > input,
        .game-options-modal label > select,
        .game-options-modal .game-options-button,
        .game-options-modal button {
            box-sizing: border-box;
        }
        #optRewardMilestones {
            width: 112px !important;
            min-width: 112px !important;
        }
        .game-options-modal input[type="number"],
        .game-options-modal input[type="text"],
        .game-options-modal select,
        .game-options-modal input[type="range"] {
            width: 112px;
            max-width: 100%;
        }
        .game-options-modal.new-zoo-modal {
            width: min(760px, calc(100vw - 40px));
            max-width: 760px !important;
        }
        .new-zoo-modal #generateZooCountry,
        .new-zoo-modal #generateZooLocation,
        .new-zoo-modal #generateZooName,
        .new-zoo-modal #newZooSize {
            width: 280px !important;
            min-width: 224px !important;
        }
        @media (max-width: 600px) {
            #optRewardMilestones,
            .game-options-modal input[type="number"],
            .game-options-modal input[type="text"],
            .game-options-modal select,
            .game-options-modal input[type="range"] {
                width: min(112px, 100%);
                min-width: 0 !important;
            }
            .new-zoo-modal #generateZooCountry,
            .new-zoo-modal #generateZooLocation,
            .new-zoo-modal #generateZooName,
            .new-zoo-modal #newZooSize {
                width: 100% !important;
                min-width: 0 !important;
            }
        }
    `;
    document.head.appendChild(style);
}


function canPlaceStartingAnimal(animal, enclosure, slotIndex) {
    if (!canPlace(animal, enclosure, slotIndex)) return false;

    const group = enclosureGroupForSlot(enclosure, slotIndex);
    if (!group) return true;

    const occupants = animalsInEnclosureGroup(enclosure, group);

    // Single exhibits still only hold one animal.
    if (group.length <= 1) return occupants.length === 0;

    // Large exhibits may now begin with more than one animal, but only when
    // the complete resulting group remains a legal compatibility chain.
    // canPlace() above is the authoritative JSON-backed compatibility check.
    return true;
}

function hasSafeLevelOneDrawSpace() {
    return state.enclosures.some(enclosure => {
        const groups = GROUPS[enclosure.filename] || [];

        // GROUPS defines logical exhibits. A single-slot group is a normal
        // enclosure; a multi-slot group is one large shared enclosure.
        for (const group of groups) {
            const occupants = animalsInEnclosureGroup(enclosure, group);

            if (group.length === 1) {
                if (!animalAtSlot(enclosure.id, group[0])) return true;
                continue;
            }

            // For drawing safety, a large exhibit only counts if the ENTIRE
            // exhibit is empty. Spare combination slots beside an existing
            // animal deliberately do not count because the unknown next card
            // might be incompatible and softlock the player.
            if (occupants.length === 0) return true;
        }

        // Defensive fallback for enclosure definitions without GROUPS.
        if (!groups.length) {
            return getAllSlots(enclosure).some(
                slotIndex => !animalAtSlot(enclosure.id, slotIndex)
            );
        }

        return false;
    });
}



function eligibleDestinationsForAnimal(animal) {
    if (!animal) return [];

    const destinations = [];
    for (const enclosure of state.enclosures) {
        for (const slotIndex of getAllSlots(enclosure)) {
            if (canPlace(animal, enclosure, slotIndex)) {
                destinations.push({ enclosure, slotIndex });
            }
        }
    }
    return destinations;
}

function randomEligibleDestinationForAnimal(animal) {
    const destinations = eligibleDestinationsForAnimal(animal);
    return destinations.length ? randomItem(destinations) : null;
}

// Trade offers must never promise an incoming card that cannot actually be
// placed after the chosen outgoing animal leaves the zoo. This matters most
// on a completely full zoo and in combination enclosures.
function tradeIncomingHasDestinationAfterOutgoing(incoming, outgoing) {
    if (!incoming || !outgoing) return false;

    const oldEnclosureId = outgoing.enclosureId;
    const oldSlotIndex = outgoing.slotIndex;
    const oldReservedEnclosureId = outgoing.reservedEnclosureId;
    const oldReservedSlotIndex = outgoing.reservedSlotIndex;
    const oldHand = outgoing.hand;

    try {
        outgoing.enclosureId = null;
        outgoing.slotIndex = null;
        clearAnimalZooReservation(outgoing);
        outgoing.hand = false;
        return eligibleDestinationsForAnimal(incoming).length > 0;
    } finally {
        outgoing.enclosureId = oldEnclosureId;
        outgoing.slotIndex = oldSlotIndex;
        outgoing.hand = oldHand;
        if (oldReservedEnclosureId != null && oldReservedSlotIndex != null) {
            reserveAnimalZooSlot(outgoing, oldReservedEnclosureId, oldReservedSlotIndex);
        }
    }
}

function nextLevelOneHasEligibleDestination() {
    // V156: DRAW availability uses LOGICAL zoo occupancy, including reserved
    // slots. Reserved vacancies may be used to rearrange animals already owned,
    // but they are NOT new capacity and must never re-enable Draw Card.
    //
    // hasSafeLevelOneDrawSpace() already counts reservations and also preserves
    // the large-combination-exhibit safety rule (an unknown Level 1 draw only
    // gets access to a genuinely empty logical exhibit).
    if (!hasSafeLevelOneDrawSpace()) return false;

    // If the exact next card is known, it must additionally have a destination
    // that is genuinely unreserved. canPlace() is intentionally physical-only
    // for rearrangement, so filter reserved slots/groups here for DRAW only.
    if (state.nextDrawSpec) {
        return eligibleDestinationsForAnimal(state.nextDrawSpec).some(({ enclosure, slotIndex }) => {
            const group = enclosureGroupForSlot(enclosure, slotIndex);
            if (!group) return false;

            // Any reservation in this logical exhibit means its apparent
            // vacancy belongs to an existing animal/action, not to a new draw.
            const hasReservation = state.animals.some(animal =>
                animal?.reservedEnclosureId === enclosure.id &&
                group.includes(animal.reservedSlotIndex)
            );
            if (hasReservation) return false;

            // For a combination exhibit, Draw Card may only use a truly empty
            // logical exhibit, matching hasSafeLevelOneDrawSpace().
            if (group.length > 1) {
                return animalsInEnclosureGroup(enclosure, group, null, true).length === 0;
            }

            return !animalAtSlot(enclosure.id, slotIndex, null, true);
        });
    }

    return true;
}

function markNewPlacementGlow(animal) {
    if (!animal) return;
    state.newPlacementGlowStartedAt[animal.id] = Date.now();

    setTimeout(() => {
        const started = Number(state.newPlacementGlowStartedAt[animal.id] || 0);
        if (started && Date.now() - started >= 4000) {
            delete state.newPlacementGlowStartedAt[animal.id];
            renderZoo();
        }
    }, 4050);
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

    // V155 reservation hand-off:
    // If this animal is moving from a real zoo slot into a slot currently
    // reserved by a card in Exchange/Outgoing Offer, move that reservation
    // to THIS animal's old slot. The zoo therefore remains logically full
    // while the visible vacancy can travel around the board.
    const movingFromEnclosureId = animal?.enclosureId ?? null;
    const movingFromSlotIndex = animal?.slotIndex ?? null;
    const displacedReservationOwner = state.animals.find(other =>
        other?.id !== animal?.id &&
        other?.reservedEnclosureId === enclosure?.id &&
        other?.reservedSlotIndex === slotIndex
    );

    if (
        !canPlace(
            animal,
            enclosure,
            slotIndex
        )
    ) {
        return false;
    }


    if (
        displacedReservationOwner &&
        movingFromEnclosureId !== null &&
        movingFromSlotIndex !== null
    ) {
        reserveAnimalZooSlot(
            displacedReservationOwner,
            movingFromEnclosureId,
            movingFromSlotIndex
        );
    }

    removeAnimalFromLocations(
        animal
    );


    animal.enclosureId =
        enclosure.id;

    animal.slotIndex =
        slotIndex;

    clearAnimalZooReservation(animal);
    collectionMarkEnteredZoo(animal);
    updateCollectionCohabitation();

    checkEnclosure10Unlock();
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
// - hit the configured enclosure-space target as closely as possible
// - starting animals may share a physical exhibit when compatibility allows
// - higher zoo-size settings deliberately generate fairly full zoos
// - Enclosure 10 prohibited
// ============================================================

function startupProgressionRewardKeys() {
    const present = new Set();

    // Starting animals are generated before enclosure cards. For startup only,
    // progression is therefore calculated from that generated collection rather
    // than from enclosure placement.
    for (const animal of state.animals) {
        if (!animal) continue;
        present.add(progressionKey(animal.category, animal.level));
    }

    const rewardKeys = [];
    for (let level = 2; level <= 5; level++) {
        let count = 0;
        for (const key of present) {
            const [, levelText] = key.split('|');
            if (Number(levelText) === level) count++;
        }

        for (const milestone of state.gameOptions.enclosureRewardMilestones) {
            if (count >= milestone) rewardKeys.push(`${level}|${milestone}`);
        }
    }

    return rewardKeys;
}

function startupLayoutStats(numbers) {
    return numbers.reduce((stats, number) => {
        stats.spots += enclosureSlotCapacity(number);
        stats.physical += (GROUPS[number] || [[0]]).length;
        return stats;
    }, { spots: 0, physical: 0 });
}

function chooseStartupEnclosures(rewardCount = 0) {
    const available = [1,2,3,4,5,6,7,8,9];
    const collectionRules = startingCollectionSizeRules(state.gameOptions.startingCollectionSize);
    const zooRules = startingZooSizeRules(state.gameOptions.startingZooSize);
    const requiredAnimals = collectionRules.species;

    /*
        Startup enclosure order:
        1. The generated animal collection determines earned progression rewards.
        2. Start from the normal 20% zoo baseline (10 enclosure spaces).
        3. Add one actual enclosure card for every already-earned reward.
        4. If that still does not reach the slider's requested starting enclosure
           spaces, add ordinary enclosure cards until it does.
        5. If the reward cards or the need for separate animal exhibits push the
           zoo beyond the slider target, that is intentionally allowed.
    */
    const targetSpots = zooRules.maxSpaces;

    // Earned rewards are real enclosure cards, not merely abstract capacity.
    const numbers = [];
    for (let i = 0; i < rewardCount; i++) {
        numbers.push(randomItem(available));
    }

    const stats = startupLayoutStats(numbers);
    const missingSpots = Math.max(0, targetSpots - stats.spots);

    // Find the smallest overshoot of the requested slot target. We no longer
    // require one physical exhibit per animal: mixed compatible starting
    // exhibits are intentionally allowed and sometimes required (e.g. 20%).
    const maxExtraSpots = Math.max(40, missingSpots + 12);
    const dp = Array(maxExtraSpots + 1).fill(null);
    dp[0] = [];

    for (let spots = 0; spots <= maxExtraSpots; spots++) {
        const current = dp[spots];
        if (!current) continue;

        for (const number of shuffle(available)) {
            const nextSpots = spots + enclosureSlotCapacity(number);
            if (nextSpots > maxExtraSpots) continue;
            const proposed = [...current, number];
            if (!dp[nextSpots] || proposed.length < dp[nextSpots].length) {
                dp[nextSpots] = proposed;
            }
        }
    }

    const candidates = [];
    for (let extraSpots = missingSpots; extraSpots <= maxExtraSpots; extraSpots++) {
        if (!dp[extraSpots]) continue;
        candidates.push({
            extra: dp[extraSpots],
            totalSpots: stats.spots + extraSpots,
            totalCards: numbers.length + dp[extraSpots].length
        });
    }

    if (!candidates.length) {
        throw new Error(
            `Could not build a starting enclosure layout with about ${targetSpots} spaces.`
        );
    }

    const smallestCapacity = Math.min(...candidates.map(item => item.totalSpots));
    const capacityMatches = candidates.filter(item => item.totalSpots === smallestCapacity);
    const fewestCards = Math.min(...capacityMatches.map(item => item.totalCards));
    const best = capacityMatches.filter(item => item.totalCards === fewestCards);

    numbers.push(...randomItem(best).extra);
    return shuffle(numbers);
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
// Every later card attaches to a random card already in the zoo.
// Long horizontal/vertical runs are allowed, but startup generation
// rejects any placement that would create a filled 3 × 3 (or larger)
// block of enclosure cards. This keeps larger starting zoos snaking.
// ============================================================

function startupGridCoordinate(value, origin, step) {
    return Math.round((value - origin) / step);
}

function createsStartupThreeByThree(candidate, occupied) {
    const stepX = ENCLOSURE_W + ENCLOSURE_GAP;
    const stepY = ENCLOSURE_H + ENCLOSURE_GAP;
    const originX = STARTUP_CENTER_X - ENCLOSURE_W / 2;
    const originY = STARTUP_CENTER_Y;

    const cells = new Set();

    for (const item of [...occupied, candidate]) {
        const gx = startupGridCoordinate(item.x, originX, stepX);
        const gy = startupGridCoordinate(item.y, originY, stepY);
        cells.add(`${gx}|${gy}`);
    }

    const candidateGX = startupGridCoordinate(candidate.x, originX, stepX);
    const candidateGY = startupGridCoordinate(candidate.y, originY, stepY);

    // Any new 3x3 block must contain the newly proposed card, so only inspect
    // the nine possible 3x3 windows that could contain this candidate.
    for (let left = candidateGX - 2; left <= candidateGX; left++) {
        for (let top = candidateGY - 2; top <= candidateGY; top++) {
            let full = true;

            for (let dx = 0; dx < 3 && full; dx++) {
                for (let dy = 0; dy < 3; dy++) {
                    if (!cells.has(`${left + dx}|${top + dy}`)) {
                        full = false;
                        break;
                    }
                }
            }

            if (full) return true;
        }
    }

    return false;
}

function startupConnectedPosition(existing, occupied, gap = ENCLOSURE_GAP) {
    const directions = shuffle(['right', 'left', 'bottom', 'top']);

    for (const direction of directions) {
        let x = existing.x;
        let y = existing.y;

        if (direction === 'right') x = existing.x + ENCLOSURE_W + gap;
        else if (direction === 'left') x = existing.x - ENCLOSURE_W - gap;
        else if (direction === 'bottom') y = existing.y + ENCLOSURE_H + gap;
        else y = existing.y - ENCLOSURE_H - gap;

        if (
            x < 40 ||
            y < 40 ||
            x + ENCLOSURE_W > WORKSPACE_W - 40 ||
            y + ENCLOSURE_H > WORKSPACE_H - 40
        ) {
            continue;
        }

        const candidate = {
            x,
            y,
            w: ENCLOSURE_W,
            h: ENCLOSURE_H
        };

        const collides = occupied.some(item =>
            item.id !== existing.id &&
            rectanglesOverlap(
                candidate,
                {
                    x: item.x,
                    y: item.y,
                    w: ENCLOSURE_W,
                    h: ENCLOSURE_H
                },
                gap
            )
        );

        if (collides) continue;

        if (createsStartupThreeByThree(candidate, occupied)) {
            continue;
        }

        return { x, y };
    }

    return null;
}

function positionStartupEnclosures(numbers) {

    for (let buildAttempt = 0; buildAttempt < 300; buildAttempt++) {

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
                position = startupConnectedPosition(
                    anchor,
                    positioned,
                    ENCLOSURE_GAP
                );
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

function startingCategoryHasLevel(category, level) {
    return state.animals.some(animal =>
        animal.category === category &&
        animal.level === level
    );
}

function availableStartingCardsAtLevel(level) {
    const candidates = [];

    for (const category of Object.keys(FOLDERS)) {
        if (!state.activeCategories.has(category)) continue;

        // Progression dependency:
        // L2 requires this category's L1, L3 requires its L2, and L4 requires
        // its L3 to have ALREADY been generated in this starting collection.
        if (
            level > 1 &&
            !startingCategoryHasLevel(category, level - 1)
        ) {
            continue;
        }

        const files = levelFiles(category, level).filter(file =>
            !state.animals.some(animal =>
                animal.category === category &&
                animal.level === level &&
                animal.filename.toLowerCase() === file.toLowerCase()
            )
        );

        for (const filename of files) {
            candidates.push({ category, level, filename });
        }
    }

    return candidates;
}

function randomAvailableStartingAnimal(levelChances) {
    const roll = Math.random();
    let cumulative = 0;
    let rolledLevel = 1;

    for (let level = 1; level <= 4; level++) {
        cumulative += Number(levelChances[level] || 0);
        if (roll <= cumulative) {
            rolledLevel = level;
            break;
        }
    }

    // First try the rolled level. If its progression prerequisite is not yet
    // available, fall back one level at a time rather than ignoring the rule.
    // This lets early L1 cards create the foundation for later L2/L3/L4 rolls.
    for (let level = rolledLevel; level >= 1; level--) {
        const candidates = availableStartingCardsAtLevel(level);
        if (candidates.length) {
            return weightedRandomItem(
                candidates,
                candidate => animalZooTypeWeight(candidate, state.zooType, 'generation')
            );
        }
    }

    throw new Error('No unused legal starting animal cards remain.');
}


// ============================================================
// CREATE STARTING ZOO
//
// Uses the configured number of starting animals.
//
// The selected enclosure cards provide startup capacity while total slot
// capacity never exceeds the configured starting maximum.
//
// Large enclosures may start with compatible mixed-species combinations.
// Compatibility is allowed rather than forced.
// ============================================================

function createStartingZoo() {

    state.sandboxMode = false;
    state.sandboxLooseAnimals = [];
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
    state.tradeHistory = [];
    state.animalLineage = new Map();
    state.collectionRecords = new Map();
    state.collectionCohabitationActive = new Map();
    state.collectionActiveLevel = 1;
    state.unlockedOpponentCount = 2;
    state.playerLevelsSeen = new Set([1]);
    state.highestZooPrestige = 0;
    resetRealZooSessionHoldings();
    state.tradeOfferCache = new Map();
    state.nextDrawSpec = null;
    state.nextDrawReadyPromise = null;

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


    const startupRules = startingCollectionSizeRules(state.gameOptions.startingCollectionSize);

    // Generate the complete starting animal collection FIRST. This lets the
    // starting enclosure count reflect the category progression the zoo has
    // already achieved before the player takes control.
    for (let i = 0; i < startupRules.species; i++) {
        const startingCard = randomAvailableStartingAnimal(startupRules.levelChances);
        const animal = createAnimal(
            startingCard.category,
            startingCard.level,
            startingCard.filename
        );
        state.animals.push(animal);
        markPlayerLevelSeen(animal.level);
    }
    const startupRewardKeys = startupProgressionRewardKeys();
    state.awardedProgressMilestones = new Set(startupRewardKeys);
    state.awardedLevel2Milestones = new Set(
        startupRewardKeys
            .map(key => String(key).split('|'))
            .filter(([levelText]) => Number(levelText) === 2)
            .map(([, milestoneText]) => Number(milestoneText))
    );

    const numbers = chooseStartupEnclosures(startupRewardKeys.length);

    state.enclosures = positionStartupEnclosures(numbers);


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
        V171 startup placement:
        - a physical exhibit may contain multiple starting animals when the
          compatibility rules permit it;
        - placement uses backtracking instead of a greedy random choice, so an
          early card cannot accidentally consume the only valid spot for a
          later card;
        - if a generated collection genuinely cannot fit, replace one animal
          at a time with a fresh legal card and try again. This preserves the
          requested starting-animal count instead of crashing or silently
          leaving a card unplaced.
    */
    function clearStartupPlacements() {
        for (const animal of state.animals) {
            animal.enclosureId = null;
            animal.slotIndex = null;
        }
    }

    /*
        V179 startup solver:
        The previous recursive search could explore an enormous compatibility
        tree and repeatedly call canPlace()/getAllSlots(), eventually triggering
        Firefox's long-running-script timeout during startup.

        Give the search a hard node budget. If a mixed-exhibit solution is not
        found quickly, the existing collection-repair loop gets another try.
        This keeps startup bounded instead of ever hanging the page.
    */
    const STARTUP_SEARCH_NODE_LIMIT = Math.max(2500, startupRules.species * 700);
    let startupSearchNodes = 0;

    function placeStartingCollectionBacktracking(animals, index = 0) {
        if (index >= animals.length) return true;
        if (++startupSearchNodes > STARTUP_SEARCH_NODE_LIMIT) return false;

        // Most constrained animals first greatly reduces dead ends.
        let bestIndex = index;
        let bestCandidates = null;

        for (let i = index; i < animals.length; i++) {
            const animal = animals[i];
            const candidates = [];

            for (const entry of startupEnclosures) {
                for (const slotIndex of entry.group) {
                    if (canPlaceStartingAnimal(animal, entry.enclosure, slotIndex)) {
                        candidates.push({ enclosure: entry.enclosure, slotIndex });
                    }
                }
            }

            if (bestCandidates === null || candidates.length < bestCandidates.length) {
                bestCandidates = candidates;
                bestIndex = i;
            }
            if (!candidates.length) break;
        }

        if (!bestCandidates?.length) return false;

        [animals[index], animals[bestIndex]] = [animals[bestIndex], animals[index]];
        const animal = animals[index];

        for (const destination of shuffle(bestCandidates)) {
            if (startupSearchNodes > STARTUP_SEARCH_NODE_LIMIT) break;

            animal.enclosureId = destination.enclosure.id;
            animal.slotIndex = destination.slotIndex;

            if (placeStartingCollectionBacktracking(animals, index + 1)) return true;

            animal.enclosureId = null;
            animal.slotIndex = null;
        }

        [animals[index], animals[bestIndex]] = [animals[bestIndex], animals[index]];
        return false;
    }

    let placed = false;
    const maxCollectionRepairs = Math.min(12, Math.max(4, startupRules.species));

    for (let attempt = 0; attempt <= maxCollectionRepairs && !placed; attempt++) {
        clearStartupPlacements();
        startupSearchNodes = 0;
        const ordered = shuffle([...state.animals]);
        placed = placeStartingCollectionBacktracking(ordered);

        if (placed) break;
        if (attempt === maxCollectionRepairs || !state.animals.length) break;

        // Replace one generated card and retry the whole layout. The replacement
        // still obeys level/progression availability and zoo-type weighting.
        const replaceIndex = Math.floor(Math.random() * state.animals.length);
        const oldAnimal = state.animals[replaceIndex];
        state.animals.splice(replaceIndex, 1);

        try {
            const replacementCard = randomAvailableStartingAnimal(startupRules.levelChances);
            const replacement = createAnimal(
                replacementCard.category,
                replacementCard.level,
                replacementCard.filename
            );
            state.animals.splice(replaceIndex, 0, replacement);
            markPlayerLevelSeen(replacement.level);
        } catch (error) {
            state.animals.splice(replaceIndex, 0, oldAnimal);
        }
    }

    if (!placed) {
        // Guaranteed fast fallback: avoid another combinatorial search.
        // Fill empty logical exhibits first, then only use shared exhibits when
        // canPlace confirms the combination immediately.
        clearStartupPlacements();
        let fallbackFailed = false;

        for (const animal of state.animals) {
            let destination = null;

            // Prefer completely empty exhibits: these need no compatibility
            // chain and are therefore both safe and cheap to evaluate.
            for (const entry of startupEnclosures) {
                if (animalsInEnclosureGroup(entry.enclosure, entry.group).length) continue;
                const slotIndex = entry.group.find(slot =>
                    !animalAtSlot(entry.enclosure.id, slot) &&
                    canPlaceStartingAnimal(animal, entry.enclosure, slot)
                );
                if (slotIndex !== undefined) {
                    destination = { enclosure: entry.enclosure, slotIndex };
                    break;
                }
            }

            // If every logical exhibit already has an occupant, try a legal
            // mixed-exhibit slot without backtracking.
            if (!destination) {
                outer:
                for (const entry of startupEnclosures) {
                    for (const slotIndex of entry.group) {
                        if (canPlaceStartingAnimal(animal, entry.enclosure, slotIndex)) {
                            destination = { enclosure: entry.enclosure, slotIndex };
                            break outer;
                        }
                    }
                }
            }

            if (!destination) {
                fallbackFailed = true;
                break;
            }

            animal.enclosureId = destination.enclosure.id;
            animal.slotIndex = destination.slotIndex;
        }

        if (fallbackFailed) {
            throw new Error(
                `Could not find a compatible starting layout for ${startupRules.species} animals ` +
                `inside ${startingZooSizeRules(state.gameOptions.startingZooSize).maxSpaces} starting spaces.`
            );
        }

        placed = true;
        console.warn('Startup used bounded greedy placement after compatibility search reached its limit.');
    }

    // A generated Level 4 card counts as placed now, so Enclosure 10 becomes
    // available for future rewards exactly as it would during normal play.
    checkEnclosure10Unlock();
    updateHighestZooPrestige();

    updateDiscoveredCategoryLevels();
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
    updatePrestigeDisplay();
    if (state.sandboxMode) {
        turnOrder.textContent = 'Turn ∞ · SANDBOX';
        return;
    }
    if (state.historyViewTurn !== null) {
        turnOrder.textContent = `Turn ${state.historyViewTurn} · VIEWING`;
        return;
    }

    turnOrder.textContent = `Turn ${state.turn}`;
}

function updatePrestigeDisplay() {
    const element = document.getElementById('prestigeCounter');
    if (!element) return;
    if (state.sandboxMode) {
        element.textContent = 'Prestige ∞';
        return;
    }
    element.textContent = `Prestige ${updateHighestZooPrestige()}`;
}


/*
    A turn ends when:

    - a Level 1 card is drawn
    - an upgraded exchange card is taken

    Moving cards, moving enclosures, panning and zooming do
    NOT end a turn.
*/

function endTurn() {
    // Sandbox has no turn progression.
    if (state.sandboxMode) {
        updateTurnDisplay();
        writeAutoResumeSnapshot();
        return;
    }

    /*
        First remove glow from enclosure rewards earned during
        the previous turn-ending action.
    */

    state.glowingEnclosureIds.clear();

    // Collection cohabitation journals mature on turn boundaries.
    updateCollectionCohabitation();

    state.turn++;
    updateCollectionCohabitation();


    updateTurnDisplay();

    updateAutonomousOpponentOffer();

    renderZoo();

    // V89 — endTurn() bypasses renderAll(), so V88's renderAll autosave hook
    // missed ordinary turns that ended through this path.
    writeAutoResumeSnapshot();

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
        if (count < 3) continue;

        const parts = String(key).split('|');
        const level = Number(parts.pop());
        const category = parts.join('|');

        if (hasNextLevelInventory(category, level)) {
            categories.add(category);
        }
    }

    return [...categories];
}

function isExchangeEligible(animal) {
    if (!animal || animal.level >= 5) return false;

    if (!hasNextLevelInventory(animal.category, animal.level)) {
        return false;
    }

    return (exchangeGroupCounts().get(exchangeGroupKey(animal)) || 0) >= 3;
}

function activeExchangeGlowFocusKey() {
    // A card actually sitting in an exchange box always defines the focus.
    const slotted = state.exchange.find(Boolean);
    if (slotted) return exchangeGroupKey(slotted);
    return state.exchangeGlowFocusKey || null;
}

function shouldGlowForExchange(animal) {
    if (state.outgoingOfferHoverSuppressesExchangeGlow) return false;

    if (
        state.gameOptions.showEligibilityGlows === false ||
        !isExchangeEligible(animal) ||
        state.suppressedExchangeGlowIds.has(animal.id)
    ) {
        return false;
    }

    const focusKey = activeExchangeGlowFocusKey();
    return !focusKey || exchangeGroupKey(animal) === focusKey;
}

function clearExchangeGlowFocusIfIdle() {
    if (!state.exchange.some(Boolean) && !state.result) {
        state.exchangeGlowFocusKey = null;
    }
}

function ensureTradeHoverExchangeGlowStyles() {
    if (document.getElementById('trade-hover-exchange-glow-v158')) return;
    const style = document.createElement('style');
    style.id = 'trade-hover-exchange-glow-v158';
    style.textContent = `
        .animal-card.exchange-eligible {
            transition: filter .45s ease, box-shadow .45s ease, opacity .45s ease !important;
        }
    `;
    document.head.appendChild(style);
}

function setOutgoingOfferExchangeGlowSuppression(active) {
    active = Boolean(active) && !state.sandboxMode;
    if (state.outgoingOfferHoverSuppressesExchangeGlow === active) return;

    state.outgoingOfferHoverSuppressesExchangeGlow = active;
    document.body.classList.toggle('trade-hover-suppress-exchange', active);

    if (active) {
        // V163: NEVER rebuild the zoo here. renderZoo() replaces every animal
        // DOM node, which destroys a blue trade-eligible class that may have
        // been applied by the other mouseenter listener a moment earlier.
        // shouldGlowForExchange() already suppresses yellow for any later
        // render while this flag is active.
        document.querySelectorAll('.animal-card.exchange-eligible')
            .forEach(card => card.classList.remove('exchange-eligible'));
        document.querySelectorAll('.animal-card.exchange-glow-return')
            .forEach(card => card.classList.remove('exchange-glow-return'));
        return;
    }

    // Restore currently eligible yellow glows with the existing fade-in class.
    const ids = new Set(
        state.animals
            .filter(animal => isExchangeEligible(animal))
            .filter(animal => {
                const focusKey = activeExchangeGlowFocusKey();
                return !focusKey || exchangeGroupKey(animal) === focusKey;
            })
            .map(animal => animal.id)
    );
    state.exchangeGlowReturnIds = ids;
    state.exchangeGlowReturnUntil = ids.size ? Date.now() + 1000 : 0;
    document.body.classList.remove('trade-hover-suppress-exchange');

    // Restore yellow on the existing nodes so an active/fading blue trade glow
    // is not erased by a full zoo rerender.
    document.querySelectorAll('.animal-card[data-animal-id]')
        .forEach(card => {
            const animal = state.animals.find(item =>
                item.id === Number(card.dataset.animalId)
            );
            if (!animal || !ids.has(animal.id)) return;
            card.classList.add('exchange-eligible', 'exchange-glow-return');
        });
}

ensureTradeHoverExchangeGlowStyles();


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

// ============================================================
// DUTCH CARD + UI LOCALISATION (V105)
// ============================================================

const translatedCardImageCache = new Map();
const CARD_NAMEPLATE = Object.freeze({
    x:72, y:1288, width:856, height:126,
    background:'#f0e4c0', foreground:'#2b1708'
});
const CARD_CATEGORYPLATE = Object.freeze({
    x:220, y:18, width:760, height:108,
    foreground:'#2b1708'
});

function normaliseTranslationKey(value) {
    return String(value || '')
        .replace(/\.[^.]+$/, '')
        .replace(/[‐‑‒–—_-]+/g, ' ')
        .replace(/[’‘]/g, "'")
        .replace(/\s+/g, ' ')
        .trim()
        .toLocaleLowerCase('en');
}

function translationLookup(table, value) {
    if (!table) return null;
    if (Object.prototype.hasOwnProperty.call(table, value)) return table[value];
    const wanted = normaliseTranslationKey(value);
    for (const [key, translated] of Object.entries(table)) {
        if (normaliseTranslationKey(key) === wanted) return translated;
    }
    return null;
}

function dutchAnimalName(animal) {
    if (![1,2].includes(Number(animal?.level))) return null;
    return translationLookup(
        window.ZOO_TRANSLATIONS?.nl?.animals,
        animalDisplayName(animal)
    );
}

function dutchCategoryName(category) {
    return translationLookup(
        window.ZOO_TRANSLATIONS?.nl?.categories,
        category
    );
}

function splitCardNameLines(ctx,text,maxWidth) {
    const words=String(text||'').trim().split(/\s+/).filter(Boolean);
    if (!words.length || ctx.measureText(text).width<=maxWidth) return [text];
    let best=null;
    for(let i=1;i<words.length;i++){
        const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
        const w=Math.max(ctx.measureText(a).width,ctx.measureText(b).width);
        if(!best||w<best.w)best={lines:[a,b],w};
    }
    return best?.lines||[text];
}

function paintDutchCardName(ctx,name) {
    const p=CARD_NAMEPLATE;
    ctx.fillStyle=p.background;
    ctx.fillRect(p.x,p.y,p.width,p.height);
    const maxWidth=p.width-34;
    let size=102,lines=[name];
    for(;size>=46;size-=2){
        ctx.font=`700 ${size}px Arial, Helvetica, sans-serif`;
        lines=splitCardNameLines(ctx,name,maxWidth);
        const widest=Math.max(...lines.map(x=>ctx.measureText(x).width));
        if(widest<=maxWidth && (lines.length===1 || size<=70)) break;
    }
    ctx.fillStyle=p.foreground;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font=`700 ${size}px Arial, Helvetica, sans-serif`;
    const cx=p.x+p.width/2,cy=p.y+p.height/2;
    if(lines.length===1)ctx.fillText(lines[0],cx,cy+2);
    else {
        const lh=size*.91;
        ctx.fillText(lines[0],cx,cy-lh/2);
        ctx.fillText(lines[1],cx,cy+lh/2);
    }
}

function sampledCategoryColour(ctx) {
    // Sample several quiet pixels in the category banner itself. This makes the
    // overlay work for every category without hard-coding nine banner colours.
    const points=[[930,32],[850,28],[760,24],[500,20]];
    const samples=[];
    for(const [x,y] of points){
        try {
            const d=ctx.getImageData(x,y,1,1).data;
            if(d[3]>240)samples.push([d[0],d[1],d[2]]);
        } catch {}
    }
    if(!samples.length)return '#a26248';
    const avg=i=>Math.round(samples.reduce((s,v)=>s+v[i],0)/samples.length);
    return `rgb(${avg(0)}, ${avg(1)}, ${avg(2)})`;
}

function paintDutchCardCategory(ctx,name) {
    if(!name)return;
    const p=CARD_CATEGORYPLATE;
    ctx.fillStyle=sampledCategoryColour(ctx);
    // Deliberately starts at x=220: the level numeral and its cream field remain untouched.
    ctx.fillRect(p.x,p.y,p.width,p.height);
    // V106: a second shallow strip removes descenders from the original
    // category text (the old 'p' in Reptiles was just below the main mask).
    // It stays well above the curved divider and never enters the level-number area.
    ctx.fillRect(p.x, p.y + p.height - 2, p.width, 22);
    const maxWidth=p.width-36;
    let size=88;
    for(;size>=48;size-=2){
        ctx.font=`700 ${size}px Arial, Helvetica, sans-serif`;
        if(ctx.measureText(name).width<=maxWidth)break;
    }
    ctx.fillStyle=p.foreground;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.font=`700 ${size}px Arial, Helvetica, sans-serif`;
    ctx.fillText(name,p.x+p.width/2,p.y+p.height/2+2);
}

function translatedAnimalCardUrl(animal) {
    const name=dutchAnimalName(animal);
    const categoryName=dutchCategoryName(animal?.category);
    const source=animalImage(animal);
    if(!name && !categoryName)return Promise.resolve(source);
    const key=`${source}|nl|${name||''}|${categoryName||''}`;
    if(translatedCardImageCache.has(key))return translatedCardImageCache.get(key);
    const promise=new Promise(resolve=>{
        const im=new Image();
        im.onload=()=>{
            try{
                const c=document.createElement('canvas');
                c.width=im.naturalWidth||1000;
                c.height=im.naturalHeight||1440;
                const ctx=c.getContext('2d');
                ctx.drawImage(im,0,0,c.width,c.height);
                ctx.save();
                ctx.scale(c.width/1000,c.height/1440);
                if(categoryName)paintDutchCardCategory(ctx,categoryName);
                if(name)paintDutchCardName(ctx,name);
                ctx.restore();
                c.toBlob(blob=>resolve(blob?URL.createObjectURL(blob):source),'image/png');
            }catch(e){
                console.warn('Dutch card overlay failed:',e);
                resolve(source);
            }
        };
        im.onerror=()=>resolve(source);
        im.src=source;
    });
    translatedCardImageCache.set(key,promise);
    return promise;
}

function applyLocalizedAnimalImage(image,animal) {
    const source=animalImage(animal);
    image.src=source;
    const token=`${animal?.id??''}|${animalCardKey(animal)}|${Date.now()}|${Math.random()}`;
    image.dataset.localizedImageToken=token;
    if(state.gameOptions.animalLanguage!=='nl')return;
    translatedAnimalCardUrl(animal).then(url=>{
        if(image.dataset.localizedImageToken===token&&state.gameOptions.animalLanguage==='nl')image.src=url;
    });
}

// Translate ordinary DOM text as well as categories and menu labels.
// Original text is remembered so switching back to English remains reversible.
const uiOriginalText = new WeakMap();
let uiLocalisationBusy = false;

function translateUiString(text) {
    const table=window.ZOO_TRANSLATIONS?.nl?.ui||{};
    const categories=window.ZOO_TRANSLATIONS?.nl?.categories||{};
    const leading=(text.match(/^\s*/)||[''])[0];
    const trailing=(text.match(/\s*$/)||[''])[0];
    let core=text.trim();
    if(!core)return text;

    if(table[core]) core=table[core];
    else if(categories[core]) core=categories[core];
    else {
        core=core
            .replace(/^Turn (\d+)$/, 'Beurt $1')
            .replace(/^Level (\d+)$/, 'Niveau $1')
            .replace(/^Enclosure (\d+)$/, 'Verblijf $1')
            .replace(/^Decline \((\d+) turns? left\)$/, 'Weigeren ($1 beurten over)')
            .replace(/^Current Turn (\d+)$/, 'Huidige beurt $1')
            .replace(/^Current turn$/, 'Huidige beurt')
            .replace(/^Viewing Turn (\d+) — READ ONLY$/, 'Beurt $1 bekijken — ALLEEN LEZEN')
            .replace(/^Turn (\d+) - (.+)$/, 'Beurt $1 - $2')
            .replace(/^(.+) — Turn (\d+)$/, '$1 — Beurt $2')
            .replace(/^Turn (\d+) · VIEWING$/, 'Beurt $1 · BEKIJKEN')
            .replace(/(\d+) animals\b/g, '$1 dieren')
            .replace(/(\d+) enclosure cards\b/g, '$1 verblijfskaarten')
            .replace(/(\d+) starting animals\b/g, '$1 startdieren')
            .replace(/cards up to Level (\d+)/g, 'kaarten tot niveau $1')
            .replace(/(\d+) starting enclosure spaces\b/g, '$1 startplaatsen')
            .replace(/(\d+) spare spaces\b/g, '$1 vrije plaatsen')
            .replace(/Starting collection size:/g, 'Grootte startcollectie:')
            .replace(/Starting zoo size:/g, 'Grootte startdierentuin:')
            .replace(/Trade offer frequency:/g, 'Frequentie ruilaanbiedingen:')
            .replace(/Exchange 2 → Level (\d+)/g, 'Ruil 2 → niveau $1')
            .replace(/Level (\d+) Animals/g, 'Niveau $1-dieren');
    }
    return leading+core+trailing;
}

function uiText(english) {
    if (state?.gameOptions?.animalLanguage !== 'nl') return english;
    return window.ZOO_TRANSLATIONS?.nl?.ui?.[english] || translateUiString(english);
}

function localizeDocument() {
    if(uiLocalisationBusy)return;
    uiLocalisationBusy=true;
    try {
        const dutch=state?.gameOptions?.animalLanguage==='nl';
        if (drawCard) drawCard.dataset.label = dutch ? 'TREK KAART' : 'DRAW CARD';
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        const nodes=[];
        while(walker.nextNode())nodes.push(walker.currentNode);
        for(const node of nodes){
            const parent=node.parentElement;
            if(!parent || ['SCRIPT','STYLE','TEXTAREA'].includes(parent.tagName))continue;
            if(!uiOriginalText.has(node))uiOriginalText.set(node,node.nodeValue);
            const original=uiOriginalText.get(node);
            node.nodeValue=dutch?translateUiString(original):original;
        }
        for(const el of document.querySelectorAll('[aria-label],[title],[placeholder]')){
            for(const attr of ['aria-label','title','placeholder']){
                if(!el.hasAttribute(attr))continue;
                const key=`i18nOriginal${attr.replace(/-([a-z])/g,(_,c)=>c.toUpperCase()).replace(/^./,c=>c.toUpperCase())}`;
                if(!(key in el.dataset))el.dataset[key]=el.getAttribute(attr);
                const original=el.dataset[key];
                el.setAttribute(attr,dutch?translateUiString(original):original);
            }
        }
    } finally {
        uiLocalisationBusy=false;
    }
}

const uiLocalisationObserver=new MutationObserver(()=>{
    if(state?.gameOptions?.animalLanguage==='nl')queueMicrotask(localizeDocument);
});
window.addEventListener('DOMContentLoaded',()=>{
    uiLocalisationObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
});

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

    image.addEventListener('pointerenter', () => {
        if (state.sandboxMode) sandboxHoveredAnimalId = animal.id;
    });
    image.addEventListener('pointerleave', () => {
        if (state.sandboxMode && sandboxHoveredAnimalId === animal.id) sandboxHoveredAnimalId = null;
    });


    // Show the real animal card directly. The temporary Back.png
    // loading/fallback system has been removed.
    applyLocalizedAnimalImage(image, animal);


    image.draggable =
        false;

    // DOM cards are recreated by renderZoo/renderHand. Reapply any active
    // compatibility-hover highlight from the shared timestamped state.
    if (state.compatibilityAnimalHoverIds?.has(animal.id)) {
        const now = Date.now();

        if (now < state.compatibilityAnimalHoverHoldUntil) {
            image.classList.add('compatibility-animal-match');
        }
        else if (now < state.compatibilityAnimalHoverFadeUntil) {
            image.classList.add('compatibility-animal-match-fading');
            const fadeElapsed = Math.max(
                0,
                now - state.compatibilityAnimalHoverHoldUntil
            );
            image.style.animationDelay = `${-Math.min(fadeElapsed, 1000)}ms`;
        }
    }


    attachImageError(
        image,
        `animal card ${animal.filename}`
    );


    if (location === 'sandbox-loose' && state.sandboxMode) {
        image.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault(); event.stopPropagation();
            const animalId = animal.id;
            const startX=event.clientX, startY=event.clientY;
            const ox=animal.x, oy=animal.y;
            const move=e=>{
                animal.x=clamp(ox+(e.clientX-startX)/state.zoom,20,WORKSPACE_W-ANIMAL_W-20);
                animal.y=clamp(oy+(e.clientY-startY)/state.zoom,20,WORKSPACE_H-ANIMAL_H-20);
                const wrap=image.closest('.sandbox-loose-card');
                if(wrap){wrap.style.left=animal.x+'px';wrap.style.top=animal.y+'px';}
            };
            const up=e=>{
                window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
                const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.slot.empty-slot');
                if(target){
                    const enclosure=state.enclosures.find(x=>String(x.id)===String(target.dataset.enclosureId));
                    const slotIndex=Number(target.dataset.slotIndex);
                    if(enclosure && canPlace(animal,enclosure,slotIndex)){
                        animal.sandboxLoose=false;
                        state.sandboxLooseAnimals=state.sandboxLooseAnimals.filter(x=>x.id!==animalId);
                        placeAnimal(animal,enclosure,slotIndex);
                        renderAll();
                        return;
                    }
                }

                // Free sandbox placement is allowed anywhere around the zoo,
                // but never on top of an enclosure card unless snapped into a
                // genuine slot. Also keep loose cards from overlapping each other.
                const proposed={x:animal.x,y:animal.y,w:ANIMAL_W,h:ANIMAL_H};
                const hitsEnclosure=state.enclosures.some(enc=>rectanglesOverlap(
                    proposed,{x:enc.x,y:enc.y,w:ENCLOSURE_W,h:ENCLOSURE_H},0
                ));
                const hitsLoose=(state.sandboxLooseAnimals||[]).some(other=>
                    other.id!==animal.id && other.enclosureId==null &&
                    rectanglesOverlap(proposed,{x:other.x,y:other.y,w:ANIMAL_W,h:ANIMAL_H},20)
                );
                if(hitsEnclosure || hitsLoose){
                    animal.x=ox; animal.y=oy;
                }
                renderAll();
            };
            window.addEventListener('pointermove',move); window.addEventListener('pointerup',up,{once:true});
        });
    }

    if (
        location ===
        'enclosure'
    ) {

        image.classList.add(
            'enclosure-animal'
        );

        const glowStarted = Number(state.newPlacementGlowStartedAt[animal.id] || 0);
        const glowElapsed = glowStarted ? Date.now() - glowStarted : Infinity;
        if (glowElapsed >= 0 && glowElapsed < 4000) {
            image.classList.add('new-placement-glow');
            // renderZoo() rebuilds DOM nodes; resume instead of restarting.
            image.style.animationDelay = `${-glowElapsed}ms`;
        }

    }


    const trackerKey = progressionKey(animal.category, animal.level);
    if (
        state.progressionGlowHoverKey === trackerKey ||
        state.progressionGlowPinnedKeys.has(trackerKey)
    ) {
        image.classList.add('progression-highlight');
        if (state.progressionGlowPinnedKeys.has(trackerKey)) {
            image.classList.add('progression-highlight-pinned');
        }
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

        // renderZoo() rebuilds card DOM nodes. Resume this animation from the
        // original drag-start timestamp instead of restarting it on every render.
        const elapsed = Math.max(
            0,
            Date.now() - state.exchangeGlowDragStartedAt
        );
        image.style.animationDelay = `${-Math.min(elapsed, 2000)}ms`;
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
            requestCompatibilityIntent(
                animal
            );

        }
    );

    image.addEventListener(
        'mouseleave',
        () => {
            hideHoverPreviewIfAllowed(animal);
            finishCompatibilityIntent(animal);
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
// COMPATIBILITY HOVER INTENT
// ============================================================

const COMPATIBILITY_INTENT_DELAY = 180;

function cancelCompatibilityIntent(animal = null) {
    if (animal && state.compatibilityIntentAnimalId !== animal.id) return;
    if (state.compatibilityIntentTimer) clearTimeout(state.compatibilityIntentTimer);
    state.compatibilityIntentTimer = null;
    state.compatibilityIntentAnimalId = null;
}

function requestCompatibilityIntent(animal) {
    // V185: while a card is selected/being dragged, its own legal destinations
    // are the only compatibility hint that may glow. Merely crossing another
    // animal must not replace that with the hovered animal's compatibility.
    if (state.drag?.type === 'animal') {
        cancelCompatibilityIntent();
        return;
    }

    cancelCompatibilityIntent();
    state.compatibilityIntentAnimalId = animal.id;

    state.compatibilityIntentTimer = setTimeout(() => {
        if (state.compatibilityIntentAnimalId !== animal.id) return;

        state.compatibilityIntentTimer = null;
        state.compatibilityIntentAnimalId = null;
        state.compatibilityIntentActiveAnimal = animal;

        // Remove any old outgoing fade before showing this deliberate hint.
        state.compatibilityGlowFadeKeys.clear();
        state.compatibilityGlowHoldUntil = 0;
        state.compatibilityGlowFadeUntil = 0;
        renderZoo();
    }, COMPATIBILITY_INTENT_DELAY);
}

function finishCompatibilityIntent(animal) {
    cancelCompatibilityIntent(animal);

    if (state.compatibilityIntentActiveAnimal?.id !== animal.id) return;

    const oldKeys = currentCompatibilityGlowKeys([animal]);
    state.compatibilityIntentActiveAnimal = null;
    beginCompatibilityGlowFade(oldKeys);
    renderZoo();
}


// ============================================================
// HOVER PREVIEW
// ============================================================

function cancelHoverPreviewHide() {
    if (state.previewHideTimer) {
        clearTimeout(state.previewHideTimer);
        state.previewHideTimer = null;
    }
    hoverPreview?.classList.remove('preview-fading');
}

const PREVIEW_INTENT_DELAY = 180;
const PREVIEW_VISIBLE_AFTER_LEAVE = 1000;
const PREVIEW_FADE_DURATION = 1000;

function setHoverPreviewSuperZoom(enabled) {
    hoverPreview.classList.toggle('super-zoom', enabled);

    if (!enabled) {
        hoverPreview.style.removeProperty('width');
        hoverPreview.style.removeProperty('height');
        hoverPreview.style.removeProperty('aspect-ratio');
        return;
    }

    // Size the container from the card artwork's native 1000:1440 ratio.
    // The image and Wikipedia back then fit this card-shaped container,
    // instead of the container being distorted to fit the information pane.
    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const margin = mobile ? 16 : 36;
    const maximumWidth = mobile ? 300 : 810;
    const availableWidth = Math.max(120, window.innerWidth - margin);
    const availableHeight = Math.max(172.8, window.innerHeight - margin);
    const width = Math.min(maximumWidth, availableWidth, availableHeight * (1000 / 1440));
    const height = width * (1440 / 1000);

    hoverPreview.style.setProperty('width', `${width}px`, 'important');
    hoverPreview.style.setProperty('height', `${height}px`, 'important');
    hoverPreview.style.setProperty('aspect-ratio', '1000 / 1440', 'important');
}

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
    hoverPreview.classList.remove('preview-fading');
    applyLocalizedAnimalImage(hoverPreviewImage, animal);
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
        // Stay fully visible for one second after leaving the source card,
        // then visibly fade for one second before being hidden.
        hoverPreview.classList.add('preview-fading');

        state.previewHideTimer = setTimeout(() => {
            state.previewHoveredAnimalId = null;
            hoverPreview.classList.remove('preview-fading');
            hoverPreview.classList.remove('visible');
            setHoverPreviewSuperZoom(false);
            state.previewHideTimer = null;
        }, PREVIEW_FADE_DURATION);
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
            <button type="button" class="animal-info-tab active" data-info-tab="information">Information</button>
            <button type="button" class="animal-info-tab" data-info-tab="wikipedia">Wikipedia</button>
            <button type="button" class="animal-info-tab" data-info-tab="zootierliste">Zootierliste</button>
        </div>
        <div id="animalInformationPane">
            <div class="wiki-preview-toolbar">
                <strong id="animalInformationTitle">Information</strong>
            </div>
            <div id="animalInformationText">
                <div class="animal-continent-row"><strong>Continent:</strong> <span id="animalContinentValue">Loading…</span></div>
                <div class="animal-combinations-heading">Possible combinations</div>
                <div id="animalCombinationList"></div>
            </div>
            <div class="animal-information-footer">
                <em id="animalInformationScientificName"></em>
                <a id="animalInformationZtlLink" target="_blank" rel="noopener noreferrer">Open on Zootierliste ↗</a>
            </div>
        </div>
        <div class="wiki-preview-toolbar" id="wikiPreviewToolbar">
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

    const infoPane = document.getElementById('animalInformationPane');
    const wikiText = document.getElementById('wikiPreviewText');
    const wikiStatus = document.getElementById('wikiPreviewStatus');
    const wikiToolbar = document.getElementById('wikiPreviewToolbar');
    const ztlPane = document.getElementById('ztlPreviewPane');

    document.querySelectorAll('.animal-info-tab').forEach(button =>
        button.classList.toggle('active', button.dataset.infoTab === tab)
    );

    const information = tab === 'information';
    const ztl = tab === 'zootierliste';
    const wikipedia = !information && !ztl;

    infoPane.hidden = !information;
    wikiText.hidden = !wikipedia;
    wikiStatus.hidden = !wikipedia;
    wikiToolbar.hidden = !wikipedia;
    ztlPane.hidden = !ztl;

    // V187: some existing .wiki-preview-toolbar CSS forces display:flex,
    // which can override the HTML hidden attribute. Set display explicitly so
    // the Wikipedia footer/toolbar can never leak into Information.
    if (wikiToolbar) wikiToolbar.style.display = wikipedia ? '' : 'none';
    if (wikiStatus) wikiStatus.style.display = wikipedia ? '' : 'none';
    if (wikiText) wikiText.style.display = wikipedia ? '' : 'none';
    if (ztlPane) ztlPane.style.display = ztl ? '' : 'none';
    if (infoPane) infoPane.style.display = information ? '' : 'none';

    if (information && state.lastHoveredAnimal) {
        renderAnimalInformation(state.lastHoveredAnimal);
    }

    if (ztl && state.lastHoveredAnimal) {
        loadZootierlisteForAnimal(state.lastHoveredAnimal, state.previewScientificName || '');
    }

    // Wikipedia remains lazy: only fetch it when its tab is actually selected.
    if (wikipedia && state.lastHoveredAnimal &&
        state.previewWikiAnimalId !== state.lastHoveredAnimal.id) {
        state.previewWikiAnimalId = state.lastHoveredAnimal.id;
        loadWikipediaForAnimal(state.lastHoveredAnimal);
    }
}


function compatibilityPairKey(a, b) {
    return [compatibilityName(a), compatibilityName(b)].filter(Boolean).sort().join('|||');
}

function rebuildCompatibilityEvidenceIndex() {
    const index = new Map();
    const seenObjects = new WeakSet();

    const formatEvidenceSource = source => {
        if (source == null) return '';

        if (typeof source === 'string' || typeof source === 'number') {
            return String(source).trim();
        }

        if (Array.isArray(source)) {
            return source.map(formatEvidenceSource).filter(Boolean).join('\n');
        }

        if (typeof source === 'object') {
            // V176: current eligible-combinations.json direct evidence records
            // are commonly { zoo, country, date }. Format those cleanly while
            // retaining support for older evidence/source structures.
            const primary = [
                source.zoo || source.institution || source.facility,
                source.country || source.location,
                source.date || source.year
            ].filter(Boolean).map(String);

            let text = primary.join(' — ');

            const detail = source.source || source.title || source.reference ||
                source.citation || source.note || source.notes;
            if (detail) text += `${text ? '\n' : ''}${String(detail).trim()}`;

            const url = source.url || source.link;
            if (url) text += `${text ? '\n' : ''}${String(url).trim()}`;

            if (!text) {
                text = Object.entries(source)
                    .filter(([key, value]) =>
                        value != null &&
                        !['pair', 'animals', 'species'].includes(key) &&
                        (typeof value === 'string' || typeof value === 'number')
                    )
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(' — ');
            }
            return text.trim();
        }

        return '';
    };

    const add = (pair, source) => {
        if (!Array.isArray(pair) || pair.length < 2 || source == null) return;

        // compatibilityPairKey sorts both normalized names, so evidence lookup
        // is explicitly symmetric: A–B and B–A always share this same bucket.
        const key = compatibilityPairKey(pair[0], pair[1]);
        if (!key) return;
        if (!index.has(key)) index.set(key, []);

        const sources = Array.isArray(source) ? source : [source];
        for (const item of sources) {
            const text = formatEvidenceSource(item);
            if (text && !index.get(key).includes(text)) index.get(key).push(text);
        }
    };

    const walk = value => {
        if (!value || typeof value !== 'object') return;
        if (seenObjects.has(value)) return;
        seenObjects.add(value);

        if (!Array.isArray(value)) {
            const pair = value.pair || value.animals || value.species;
            const source = value.source || value.evidence || value.citation ||
                value.reference || value.sources;
            if (Array.isArray(pair) && pair.length >= 2) {
                if (Array.isArray(source)) source.forEach(item => add(pair, item));
                else add(pair, source);
            }

            // V174: a lot of the compatibility research is stored as a batch:
            // { direct_pairs: [[A,B], [C,D]], evidence: "..." } rather than as
            // { pair:[A,B], source:"..." } objects. Index that batch evidence too.
            const batchSource = value.source || value.evidence || value.citation ||
                value.reference || value.sources;
            if (batchSource) {
                const candidateCollections = [
                    value.direct_pairs,
                    value.added_pairs,
                    value.new_pairs,
                    value.new_direct_pairs,
                    value.confirmed_pairs,
                    value.confirmed_existing_pairs
                ];
                for (const collection of candidateCollections) {
                    if (!Array.isArray(collection)) continue;
                    for (const candidate of collection) {
                        const candidatePair = Array.isArray(candidate)
                            ? candidate
                            : candidate?.pair || candidate?.animals || candidate?.species;
                        if (!Array.isArray(candidatePair) || candidatePair.length < 2) continue;
                        const candidateSource = (!Array.isArray(candidate) && candidate &&
                            (candidate.source || candidate.evidence || candidate.citation ||
                             candidate.reference || candidate.sources)) || batchSource;
                        if (Array.isArray(candidateSource)) {
                            candidateSource.forEach(item => add(candidatePair, item));
                        } else {
                            add(candidatePair, candidateSource);
                        }
                    }
                }
            }
        }

        if (Array.isArray(value)) value.forEach(walk);
        else Object.values(value).forEach(walk);
    };

    walk(state.compatibilityData);
    state.compatibilityEvidenceIndex = index;
}

function proxyExplanationForPair(a, b) {
    const proxy = state.compatibilityData?.proxy_compatibility;
    const groups = proxy?.groups || {};
    const aName = compatibilityName(a);
    const bName = compatibilityName(b);
    const aDisplay = inventoryDisplayNameForCompatibilityName(a);
    const bDisplay = inventoryDisplayNameForCompatibilityName(b);
    const aGroups = [];
    const bGroups = [];

    for (const [groupName, members] of Object.entries(groups)) {
        if (!Array.isArray(members)) continue;
        if (members.some(x => compatibilityName(x) === aName)) aGroups.push(groupName);
        if (members.some(x => compatibilityName(x) === bName)) bGroups.push(groupName);
    }

    const evidenceFor = (x, y) =>
        state.compatibilityEvidenceIndex?.get(compatibilityPairKey(x, y)) || [];

    const pretty = value => inventoryDisplayNameForCompatibilityName(value);

    const formatProxy = (proxyLines, evidencePairs) => {
        const lines = ['**Compatible by proxy**'];
        for (const line of proxyLines) lines.push(line);

        if (evidencePairs.length) {
            lines.push('', '**Evidence:**');
            evidencePairs.slice(0, 4).forEach((item, itemIndex) => {
                if (itemIndex) lines.push('');
                lines.push(`${pretty(item.left)} + ${pretty(item.right)}`);
                item.sources.slice(0, 3).forEach((source, sourceIndex) => {
                    if (sourceIndex) lines.push('');
                    lines.push(source);
                });
            });
        } else {
            lines.push('', 'No direct supporting pair is stored for this proxy in the current database.');
        }
        return lines.join('\n');
    };

    // Explicit group links: find the closest documented cross-group pair.
    for (const link of proxy?.group_links || []) {
        if (!link) continue;
        const forward = aGroups.includes(link.from) && bGroups.includes(link.to);
        const reverse = aGroups.includes(link.to) && bGroups.includes(link.from);
        if (!forward && !reverse) continue;

        const aGroup = forward ? link.from : link.to;
        const bGroup = forward ? link.to : link.from;
        const aMembers = (groups[aGroup] || []).map(compatibilityName);
        const bMembers = (groups[bGroup] || []).map(compatibilityName);
        const candidates = [];

        for (const left of aMembers) {
            for (const right of bMembers) {
                const sources = evidenceFor(left, right);
                if (!sources.length) continue;
                const substitutions =
                    (left === aName ? 0 : 1) +
                    (right === bName ? 0 : 1);
                candidates.push({ left, right, sources, substitutions });
            }
        }

        candidates.sort((x, y) => {
            if (x.substitutions !== y.substitutions) {
                return x.substitutions - y.substitutions;
            }

            // V187 proxy logic gate:
            // For a requested A + B combination, prefer evidence where B is
            // still exactly B and only A is replaced by a close proxy.
            // Example: Cotton-Top Tamarin + Common Trumpeter should prefer
            // Goeldi's Monkey + Common Trumpeter over Cotton-Top Tamarin +
            // an unrelated proxy for Common Trumpeter.
            const xKeepsPartner = x.right === bName ? 1 : 0;
            const yKeepsPartner = y.right === bName ? 1 : 0;
            if (xKeepsPartner !== yKeepsPartner) return yKeepsPartner - xKeepsPartner;

            const xKeepsSubject = x.left === aName ? 1 : 0;
            const yKeepsSubject = y.left === aName ? 1 : 0;
            if (xKeepsSubject !== yKeepsSubject) return yKeepsSubject - xKeepsSubject;

            return pretty(x.left).localeCompare(pretty(y.left)) ||
                pretty(x.right).localeCompare(pretty(y.right));
        });

        if (candidates.length) {
            const best = candidates[0];
            const proxyLines = [];

            if (best.left !== aName) {
                proxyLines.push(`${aDisplay} is considered compatible based on evidence from ${pretty(best.left)}.`);
            }
            if (best.right !== bName) {
                proxyLines.push(`${bDisplay} is considered compatible based on evidence from ${pretty(best.right)}.`);
            }

            // If the direct evidence happens to use the displayed animal on one
            // side, say only which other animal is the proxy.
            if (!proxyLines.length) {
                proxyLines.push('This combination is supported by the direct evidence below.');
            }

            const bestKeepsPartner = best.right === bName;
            const bestKeepsSubject = best.left === aName;
            return formatProxy(proxyLines, candidates.filter(item =>
                item.substitutions === best.substitutions &&
                (item.right === bName) === bestKeepsPartner &&
                (item.left === aName) === bestKeepsSubject
            ));
        }

        return formatProxy(
            [`${aDisplay} and ${bDisplay} are considered compatible based on closely related documented combinations.`],
            []
        );
    }

    // Complete/shared groups: find a directly documented member that can stand
    // in for one of the displayed animals.
    const complete = new Set(proxy?.complete_groups || []);
    const sharedGroups = aGroups.filter(group => bGroups.includes(group));

    for (const groupName of sharedGroups) {
        const members = (groups[groupName] || []).map(compatibilityName);
        const candidates = [];

        for (const member of members) {
            if (member !== aName) {
                const sources = evidenceFor(member, bName);
                if (sources.length) candidates.push({
                    left: member, right: bName, sources, proxyFor: aDisplay
                });
            }
            if (member !== bName) {
                const sources = evidenceFor(aName, member);
                if (sources.length) candidates.push({
                    left: aName, right: member, sources, proxyFor: bDisplay
                });
            }
        }

        if (candidates.length) {
            candidates.sort((x, y) =>
                pretty(x.left).localeCompare(pretty(y.left)) ||
                pretty(x.right).localeCompare(pretty(y.right))
            );
            const best = candidates[0];
            const proxyAnimal = best.left === aName ? best.right : best.left;
            const targetAnimal = best.left === aName ? bDisplay : aDisplay;
            return formatProxy(
                [`${targetAnimal} is considered compatible based on evidence from ${pretty(proxyAnimal)}.`],
                candidates
            );
        }

        // Older connected-component proxy groups: reconstruct a direct evidence path.
        const memberSet = new Set(members);
        const queue = [[aName, [aName]]];
        const visited = new Set([aName]);

        while (queue.length) {
            const [current, path] = queue.shift();
            if (current === bName && path.length > 1) {
                const evidencePairs = [];
                for (let i = 0; i < path.length - 1; i++) {
                    const sources = evidenceFor(path[i], path[i + 1]);
                    if (sources.length) evidencePairs.push({
                        left: path[i], right: path[i + 1], sources
                    });
                }

                const proxyAnimal = path.length > 2 ? path[1] : bName;
                return formatProxy(
                    [`${aDisplay} is considered compatible based on evidence from ${pretty(proxyAnimal)}.`],
                    evidencePairs
                );
            }

            for (const next of state.compatibilityDirectGraph?.get(current) || []) {
                if (!memberSet.has(next) || visited.has(next)) continue;
                visited.add(next);
                queue.push([next, [...path, next]]);
            }
        }

        if (complete.has(groupName)) {
            return formatProxy(
                [`${aDisplay} and ${bDisplay} are considered compatible based on evidence from other members of the same compatibility set.`],
                []
            );
        }
    }

    return '**Compatible by proxy**\nThis combination is supported by another documented animal combination, but the specific proxy animal is not stored in the current database.';
}

function sourceTextForCombination(a, b) {
    const sources = state.compatibilityEvidenceIndex?.get(compatibilityPairKey(a, b)) || [];
    if (sources.length) return sources.join('\n\n\n');
    return proxyExplanationForPair(a, b);
}

function renderCombinationSourceTooltip(popup, text) {
    // V186: allow only our two known heading tokens to become bold. Everything
    // else remains literal text, so evidence strings/URLs cannot inject HTML.
    popup.replaceChildren();

    const parts = String(text || '').split(/(\*\*Compatible by proxy\*\*|\*\*Evidence:\*\*)/g);
    for (const part of parts) {
        if (!part) continue;
        if (part === '**Compatible by proxy**' || part === '**Evidence:**') {
            const strong = document.createElement('strong');
            strong.textContent = part.slice(2, -2);
            popup.appendChild(strong);
        } else {
            popup.appendChild(document.createTextNode(part));
        }
    }
}

function inventoryTagsForAnimal(animal) {
    if (!animal) return [];

    const source = getCategorySource(animal.category);
    if (!source || Array.isArray(source) || typeof source !== 'object') return [];

    const level = animal.level;
    const levelSource =
        source[level] ??
        source[String(level)] ??
        source[`Level ${level}`] ??
        source[`level${level}`];

    if (!levelSource) return [];

    const wanted = animalDatabaseKey(animal.filename);

    if (!Array.isArray(levelSource) && typeof levelSource === 'object') {
        for (const [filename, value] of Object.entries(levelSource)) {
            if (animalDatabaseKey(filename) !== wanted) continue;
            if (Array.isArray(value)) return value.map(String);
            if (Array.isArray(value?.tags)) return value.tags.map(String);
            return [];
        }
    }

    if (Array.isArray(levelSource)) {
        const entry = levelSource.find(item =>
            item && typeof item === 'object' &&
            animalDatabaseKey(item.file ?? item.filename ?? item.path ?? item.name ?? '') === wanted
        );
        if (entry && Array.isArray(entry.tags)) return entry.tags.map(String);
    }

    return [];
}

function continentFromInventoryTags(animal) {
    const labels = new Map([
        ['africa', 'Africa'],
        ['asia', 'Asia'],
        ['europe', 'Europe'],
        ['north-america', 'North America'],
        ['south-america', 'South America'],
        ['oceania', 'Oceania'],
        ['antarctica', 'Antarctica']
    ]);

    const tags = inventoryTagsForAnimal(animal)
        .map(tag => String(tag).trim().toLowerCase());

    return [...labels.entries()]
        .filter(([tag]) => tags.includes(tag))
        .map(([, label]) => label)
        .join(', ');
}

function continentFromAnimalRecord(record) {
    if (!record) return '';
    const raw = record.continents ?? record.continent ?? record.native_continents ??
        record.native_continent ?? record.native_range ?? record.range ??
        record.distribution ?? record.region ?? record.regions;
    if (Array.isArray(raw)) return raw.filter(Boolean).join(', ');
    if (raw && typeof raw === 'object') {
        return Object.values(raw).flat().filter(x => typeof x === 'string' && x.trim()).join(', ');
    }
    return String(raw || '').trim();
}

function inventoryDisplayNameForCompatibilityName(value) {
    const wanted = compatibilityName(value);
    if (!wanted) return String(value || '');

    // Card filenames are the canonical player-facing names in Zoo Curator.
    for (const category of Object.keys(FOLDERS)) {
        for (let level = 1; level <= 5; level++) {
            for (const file of levelFiles(category, level)) {
                const display = String(file || '')
                    .replace(/\.[^.]+$/, '')
                    .replace(/[_-]+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                if (compatibilityName(display) === wanted) return display;
            }
        }
    }

    // Fallback for a compatibility entry not currently represented by a card.
    return String(value || '')
        .replace(/\b\w/g, char => char.toUpperCase());
}

function renderAnimalInformation(animal) {
    if (!animal) return;
    ensureWikipediaBack();

    const name = animalDisplayName(animal);
    const title = document.getElementById('animalInformationTitle');
    const continent = document.getElementById('animalContinentValue');
    const list = document.getElementById('animalCombinationList');
    if (!title || !continent || !list) return;

    const record = databaseRecordForAnimal(animal);
    const scientificName = String(
        record?.scientific_name ||
        record?.scientificName ||
        record?.latin_name ||
        record?.latinName ||
        record?.zootierliste?.listings?.find(item =>
            item?.scientific_name || item?.scientificName
        )?.scientific_name ||
        record?.zootierliste?.listings?.find(item =>
            item?.scientific_name || item?.scientificName
        )?.scientificName ||
        state.previewScientificName ||
        ''
    ).trim();

    // V187: Information always uses English name followed by Latin name.
    title.textContent = scientificName ? `${name} (${scientificName})` : (name || 'Information');

    const scientificFooter = document.getElementById('animalInformationScientificName');
    const ztlLink = document.getElementById('animalInformationZtlLink');
    if (scientificFooter) {
        scientificFooter.textContent = scientificName;
        scientificFooter.hidden = !scientificName;
    }
    if (ztlLink) {
        const firstUrl = record?.zootierliste?.listings?.find(x => x.source_url)?.source_url;
        ztlLink.href = firstUrl || 'https://www.zootierliste.de/en/?action=expsuche';
        ztlLink.textContent = 'Open on Zootierliste ↗';
    }

    // V183: geography lives in asset-inventory.json. The Information tab
    // should use the continent tags we audited there rather than expecting
    // animals.json to duplicate them.
    const inventoryContinent = continentFromInventoryTags(animal);
    const databaseContinent = continentFromAnimalRecord(record);
    continent.textContent = inventoryContinent || databaseContinent || 'Not listed yet';

    const animalName = compatibilityName(name);

    // V182: species currently sharing this animal's logical exhibit are shown
    // first. Multiple current partners remain alphabetical.
    const currentExhibitPartnerNames = new Set();
    if (animal.enclosureId !== null && animal.enclosureId !== undefined) {
        const enclosure = state.enclosures.find(item => item.id === animal.enclosureId);
        const group = enclosure ? enclosureGroupForSlot(enclosure, animal.slotIndex) : null;
        if (enclosure && group) {
            for (const occupant of animalsInEnclosureGroup(enclosure, group, animal.id, false)) {
                const occupantName = compatibilityAnimalName(occupant);
                if (occupantName && occupantName !== animalName) {
                    currentExhibitPartnerNames.add(occupantName);
                }
            }
        }
    }

    // V188: split compatible species into animals currently represented in
    // the player's zoo and all remaining combinations. Both groups are
    // alphabetical. The current-zoo group is always shown first.
    const zooAnimalNames = new Set(
        state.animals
            .filter(item =>
                item &&
                item.id !== animal.id &&
                item.enclosureId !== null &&
                item.enclosureId !== undefined
            )
            .map(item => compatibilityAnimalName(item))
            .filter(Boolean)
    );

    const allPartners = [...(state.compatibilityEffectiveGraph?.get(animalName) || [])];
    const alphabetical = (a, b) =>
        inventoryDisplayNameForCompatibilityName(a)
            .localeCompare(inventoryDisplayNameForCompatibilityName(b));

    // V189 ordering:
    // 1. Animals sharing this animal's current exhibit (yellow), alphabetically.
    // 2. Other compatible animals currently elsewhere in the player's zoo.
    // 3. Divider.
    // 4. All remaining combinations.
    const currentExhibitPartners = allPartners
        .filter(partner => currentExhibitPartnerNames.has(partner))
        .sort(alphabetical);

    const zooPartners = allPartners
        .filter(partner =>
            zooAnimalNames.has(partner) &&
            !currentExhibitPartnerNames.has(partner)
        )
        .sort(alphabetical);

    const otherPartners = allPartners
        .filter(partner =>
            !zooAnimalNames.has(partner) &&
            !currentExhibitPartnerNames.has(partner)
        )
        .sort(alphabetical);

    const zooSectionPartners = [...currentExhibitPartners, ...zooPartners];
    const partners = [...zooSectionPartners, ...otherPartners];

    list.innerHTML = '';
    if (!partners.length) {
        const empty = document.createElement('div');
        empty.className = 'animal-combination-empty';
        empty.textContent = state.compatibilityData?.compatible_pairs?.length
            ? 'No compatible species are currently listed.'
            : 'Compatibility data is still loading…';
        list.appendChild(empty);
        return;
    }

    for (let partnerIndex = 0; partnerIndex < partners.length; partnerIndex++) {
        const partner = partners[partnerIndex];

        if (
            zooSectionPartners.length &&
            otherPartners.length &&
            partnerIndex === zooSectionPartners.length
        ) {
            const divider = document.createElement('div');
            divider.className = 'animal-combination-zoo-divider';
            divider.setAttribute('aria-hidden', 'true');
            list.appendChild(divider);
        }

        const row = document.createElement('div');
        row.className = 'animal-combination-row';
        if (currentExhibitPartnerNames.has(partner)) {
            row.classList.add('current-exhibit-combination');
        }
        row.textContent = inventoryDisplayNameForCompatibilityName(partner);

        // V174: use a body-level tooltip instead of nesting it inside the
        // fixed/zoom preview. The old nested popup could be trapped by the
        // preview's stacking/positioning context; the cursor changed to the
        // browser's help '?' cursor but no source box became visible.
        const showSource = event => {
            let popup = document.getElementById('combinationSourceTooltip');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'combinationSourceTooltip';
                popup.style.cssText = [
                    'position:fixed',
                    'z-index:50000',
                    'display:none',
                    'max-width:min(420px,calc(100vw - 24px))',
                    'max-height:min(320px,calc(100vh - 24px))',
                    'overflow:auto',
                    'padding:10px 12px',
                    'border:1px solid rgba(0,0,0,.38)',
                    'border-radius:7px',
                    'background:#fff',
                    'color:#242424',
                    'box-shadow:0 8px 24px rgba(0,0,0,.28)',
                    'white-space:pre-wrap',
                    'pointer-events:none',
                    'font-size:11px',
                    'line-height:1.4'
                ].join(';');
                document.body.appendChild(popup);
            }

            renderCombinationSourceTooltip(popup, sourceTextForCombination(animalName, partner));
            popup.style.display = 'block';

            const margin = 12;
            const gap = 12;
            const rect = popup.getBoundingClientRect();
            let left = event.clientX + gap;
            let top = event.clientY + gap;
            if (left + rect.width > window.innerWidth - margin) {
                left = Math.max(margin, event.clientX - rect.width - gap);
            }
            if (top + rect.height > window.innerHeight - margin) {
                top = Math.max(margin, event.clientY - rect.height - gap);
            }
            popup.style.left = `${left}px`;
            popup.style.top = `${top}px`;
        };

        const moveSource = event => {
            const popup = document.getElementById('combinationSourceTooltip');
            if (!popup || popup.style.display === 'none') return;
            const margin = 12;
            const gap = 12;
            const rect = popup.getBoundingClientRect();
            let left = event.clientX + gap;
            let top = event.clientY + gap;
            if (left + rect.width > window.innerWidth - margin) {
                left = Math.max(margin, event.clientX - rect.width - gap);
            }
            if (top + rect.height > window.innerHeight - margin) {
                top = Math.max(margin, event.clientY - rect.height - gap);
            }
            popup.style.left = `${left}px`;
            popup.style.top = `${top}px`;
        };

        const hideSource = () => {
            const popup = document.getElementById('combinationSourceTooltip');
            if (popup) popup.style.display = 'none';
        };

        row.addEventListener('mouseenter', showSource);
        row.addEventListener('mousemove', moveSource);
        row.addEventListener('mouseleave', hideSource);

        list.appendChild(row);
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
    statusEl.textContent = uiText('Loading English Wikipedia…');
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
            ? (state.gameOptions.animalLanguage === 'nl'
                ? `Engelse Wikipedia • wetenschappelijke naam: ${scientificName}`
                : `English Wikipedia • scientific name: ${scientificName}`)
            : uiText('English Wikipedia • article text');
        textEl.textContent = extract || uiText('Wikipedia returned this page without a text extract.');
    }
    catch (error) {
        if (token !== state.previewWikiRequestToken) return;
        statusEl.textContent = uiText('Wikipedia could not be loaded.');
        textEl.textContent = state.gameOptions.animalLanguage === 'nl'
            ? `${error.message}\n\nJe kunt de Wikipedia-link alsnog gebruiken zodra bij een latere poging een artikel wordt gevonden.`
            : `${error.message}\n\nYou can still use the Wikipedia link once an article is found in a later attempt.`;
    }
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
            ? uiText('Local Zoo Curator database • current holdings')
            : uiText('Local Zoo Curator database • current collected subtotal');
        textEl.textContent = formatLocalZootierliste(record);
        const firstUrl = record.zootierliste?.listings?.find(x => x.source_url)?.source_url;
        linkEl.href = firstUrl || 'https://www.zootierliste.de/en/?action=expsuche';
        state.previewZtlAnimalId = animal.id;
        state.previewZtlScientificName = record.scientific_name || scientificName || '';
        return;
    }

    titleEl.textContent = `Zootierliste — ${animalDisplayName(animal)}`;
    statusEl.textContent = uiText('This animal is not in assets/data/animals.json yet.');
    textEl.textContent = uiText('Add this animal to the JSON database and reload the game. No game-code change is required.');
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

    // Colour belongs to the whole information card, not specifically Wikipedia.
    // Apply it immediately so the default Information tab opens in the correct category colour.
    const back = ensureWikipediaBack();
    back.style.background =
        state.categoryColours[animal.category] ||
        CATEGORY_COLOURS[animal.category] ||
        '#777777';

    // Information is the default view; Wikipedia and Zootierliste are secondary tabs.
    selectAnimalInfoTab('information');
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

    // Sandbox cards may exist loose on the board until the player drags them
    // into an enclosure. They are deliberately outside normal-game state.
    if (state.sandboxMode) renderSandboxLooseAnimals();

    zooBoard.scrollLeft =
        scrollLeft;

    zooBoard.scrollTop =
        scrollTop;

}


// ============================================================
// V149 SANDBOX COMPATIBILITY WARNINGS
// ============================================================
function sandboxAnimalHasCompatibilityConflict(animal) {
    if (!state.sandboxMode || !animal || animal.enclosureId == null) return false;
    const enclosure = state.enclosures.find(e => e.id === animal.enclosureId);
    if (!enclosure) return false;
    const group = enclosureGroupForSlot(enclosure, animal.slotIndex);
    if (!group || group.length <= 1) return false;
    const occupants = animalsInEnclosureGroup(enclosure, group, animal.id);
    return occupants.some(other => !animalsAreCompatible(animal, other));
}

function ensureSandboxConflictStyles() {
    if (document.getElementById('sandbox-conflict-styles')) return;
    const style=document.createElement('style');
    style.id='sandbox-conflict-styles';
    style.textContent=`
      .animal-card.sandbox-compatibility-conflict {
        filter: drop-shadow(0 0 4px rgba(255,30,30,1))
                drop-shadow(0 0 10px rgba(255,30,30,.95))
                drop-shadow(0 0 18px rgba(255,30,30,.8)) !important;
      }
    `;
    document.head.appendChild(style);
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

    element.addEventListener('pointerenter', () => {
        if (state.sandboxMode) sandboxHoveredEnclosureId = enclosure.id;
    });
    element.addEventListener('pointerleave', () => {
        if (state.sandboxMode && sandboxHoveredEnclosureId === enclosure.id) sandboxHoveredEnclosureId = null;
    });


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

        const compatibilityKey =
            slotCompatibilityGlowKey(enclosure.id, slotIndex);

        if (slotIsCompatibilityMatch(enclosure, slotIndex)) {
            slot.classList.add('compatibility-match-glow');
        }
        else if (
            state.compatibilityGlowFadeKeys.has(compatibilityKey) &&
            Date.now() < state.compatibilityGlowHoldUntil
        ) {
            slot.classList.add('compatibility-match-glow');
        }
        else if (
            state.compatibilityGlowFadeKeys.has(compatibilityKey) &&
            Date.now() < state.compatibilityGlowFadeUntil
        ) {
            slot.classList.add('compatibility-match-glow-fading');
        }


        const animal =
            animalAtSlot(
                enclosure.id,
                slotIndex,
                null,
                false
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

            if (state.sandboxMode && sandboxAnimalHasCompatibilityConflict(animal)) {
                ensureSandboxConflictStyles();
                card.classList.add('sandbox-compatibility-conflict');
                card.title = 'Sandbox: this mixed exhibit is not allowed by the compatibility rules.';
            }


            slot.appendChild(
                card
            );

        }
        else {

            slot.classList.add(
                'empty-slot'
            );

            // Reverse compatibility hint:
            // hover an empty position in an OCCUPIED large exhibit to reveal
            // every animal elsewhere in the zoo that can legally join it.
            // V192: empty combination slots are hints only. Hovering them
            // still reveals compatible animals with the blue glow, but clicking
            // the slot never auto-moves/teleports an animal into it.
            slot.addEventListener('mouseenter', () => {
                startCompatibilityAnimalHover(enclosure, slotIndex);
            });

            slot.addEventListener('mouseleave', () => {
                finishCompatibilityAnimalHover();
            });

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

    // Sandbox has no player hand. Defensive cleanup also repairs any sandbox
    // card that an older drag path/save accidentally marked as a hand card.
    if (state.sandboxMode) {
        for (const animal of state.hand) {
            if (animal) animal.hand = false;
        }
        state.hand = [];
        return;
    }


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


    applyLocalizedAnimalImage(image, animal);


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

    if (state.sandboxMode) {
        renderSandboxToolbar();
        return;
    }

    restoreNormalActionBoxesIfNeeded();

    const categories =
        eligibleExchangeCategories();

    // V130: keep the alternating yellow action hint synchronized with the
    // same eligibility calculation that produces the three yellow card glows.
    queueMicrotask(refreshYellowExchangeHintState);


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
    const dutchUi = state.gameOptions.animalLanguage === 'nl';
    exchange1.dataset.boxLabel = dutchUi ? 'INRUILEN' : 'EXCHANGE';
    exchange2.dataset.boxLabel = dutchUi ? 'INRUILEN' : 'EXCHANGE';


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
    resultBox.dataset.boxLabel = dutchUi ? 'UPGRADEN' : 'UPGRADE';


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

    releaseExchangeReservations();

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

async function completeExchange(destination = null, autoPlace = false) {
    if (!state.result) return false;

    if (state.result.readyPromise) {
        await state.result.readyPromise;
    } else {
        await preloadAnimalAsset(state.result);
    }

    state.glowingEnclosureIds.clear();

    const newAnimal = createAnimal(
        state.result.category,
        state.result.level,
        state.result.filename
    );

    if (autoPlace && !destination) {
        releaseExchangeReservations();
        destination = randomEligibleDestinationForAnimal(newAnimal);
    }

    if (destination) {
        if (!placeAnimal(newAnimal, destination.enclosure, destination.slotIndex)) {
            return false;
        }
        if (autoPlace) markNewPlacementGlow(newAnimal);
    } else {
        // A clicked upgrade result must be placed automatically. If there is
        // nowhere legal to put it, leave the upgrade untouched.
        if (autoPlace) return false;
        newAnimal.hand = true;
        state.hand.push(newAnimal);
    }

    state.animals.push(newAnimal);
    markPlayerLevelSeen(newAnimal.level);

    const exchangedAnimals = state.exchange.filter(Boolean);
    const exchangedIds = exchangedAnimals.map(animal => animal.id);
    for (const animal of exchangedAnimals) {
        markAnimalExchangedFor(animal, newAnimal, state.turn);
        collectionMarkDeparture(animal, {
            type: 'upgrade',
            turn: state.turn,
            forName: animalDisplayName(newAnimal),
            forLevel: newAnimal.level
        });
    }
    state.animals = state.animals.filter(animal => !exchangedIds.includes(animal.id));
    state.exchange = [null, null];
    state.result = null;
    state.exchangeGlowFocusKey = null;

    for (const id of exchangedIds) state.suppressedExchangeGlowIds.delete(id);

    checkEnclosureReward(newAnimal);
    updateCollectionCohabitation();
    state.turn++;
    updateCollectionCohabitation();
    updateTurnDisplay();
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}

function levelOneDrawDropDestinationAtPoint(clientX, clientY) {
    // V84: baseline-style Level 1 draw targeting.
    // A Level 1 draw may target an empty single exhibit or a completely empty
    // large exhibit. It does NOT need the preselected nextDrawSpec in order to
    // resolve the drop target.
    const slotElements = [...zooBoard.querySelectorAll('.slot')];

    for (const slot of slotElements) {
        const rect = slot.getBoundingClientRect();
        if (
            clientX < rect.left || clientX > rect.right ||
            clientY < rect.top || clientY > rect.bottom
        ) continue;

        const enclosure = state.enclosures.find(
            item => item.id === Number(slot.dataset.enclosureId)
        );
        const slotIndex = Number(slot.dataset.slotIndex);
        if (!enclosure || animalAtSlot(enclosure.id, slotIndex)) continue;
        if (enclosure.number === 10 && !state.enclosure10Unlocked) continue;

        const group = enclosureGroupForSlot(enclosure, slotIndex);
        if (!group) return { enclosure, slotIndex };

        const occupants = animalsInEnclosureGroup(enclosure, group);

        // Single exhibit: empty slot is safe.
        if (group.length === 1) return { enclosure, slotIndex };

        // Large exhibit: only a completely empty group is draw-safe.
        if (occupants.length === 0) return { enclosure, slotIndex };
    }

    const enclosureElements = [...zooBoard.querySelectorAll('.enclosure')];
    for (const element of enclosureElements) {
        const rect = element.getBoundingClientRect();
        if (
            clientX < rect.left || clientX > rect.right ||
            clientY < rect.top || clientY > rect.bottom
        ) continue;

        const enclosure = state.enclosures.find(
            item => item.id === Number(element.dataset.enclosureId)
        );
        if (!enclosure) continue;
        if (enclosure.number === 10 && !state.enclosure10Unlocked) continue;

        for (const group of getGroups(enclosure)) {
            const occupants = animalsInEnclosureGroup(enclosure, group);
            if (group.length > 1 && occupants.length > 0) continue;

            const freeSlot = group.find(
                slotIndex => !animalAtSlot(enclosure.id, slotIndex)
            );
            if (freeSlot !== undefined) {
                return { enclosure, slotIndex: freeSlot };
            }
        }
    }

    return null;
}


function levelOneDrawDropDestination(event, dragRect = null) {
    const points = [[event.clientX, event.clientY]];

    if (dragRect) {
        points.push(
            [dragRect.left + dragRect.width * 0.50, dragRect.top + dragRect.height * 0.50],
            [dragRect.left + dragRect.width * 0.25, dragRect.top + dragRect.height * 0.25],
            [dragRect.left + dragRect.width * 0.75, dragRect.top + dragRect.height * 0.25],
            [dragRect.left + dragRect.width * 0.25, dragRect.top + dragRect.height * 0.75],
            [dragRect.left + dragRect.width * 0.75, dragRect.top + dragRect.height * 0.75]
        );
    }

    for (const [x, y] of points) {
        const destination = levelOneDrawDropDestinationAtPoint(x, y);
        if (destination) return destination;
    }

    return null;
}


function resultDropDestinationAtPoint(clientX, clientY, prospectiveAnimal) {
    if (!prospectiveAnimal) return null;

    // Prefer the exact slot whose rectangle contains the tested point.
    // This does not depend on pointer capture, z-index, or elementFromPoint().
    const slotElements = [...zooBoard.querySelectorAll('.slot')];

    for (const slot of slotElements) {
        const rect = slot.getBoundingClientRect();
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            continue;
        }

        const enclosure = state.enclosures.find(
            item => item.id === Number(slot.dataset.enclosureId)
        );
        const slotIndex = Number(slot.dataset.slotIndex);

        if (
            enclosure &&
            canPlace(prospectiveAnimal, enclosure, slotIndex)
        ) {
            return { enclosure, slotIndex };
        }
    }

    // If the tested point is on enclosure artwork but not directly on a slot,
    // choose the nearest legal slot on that enclosure.
    const enclosureElements = [...zooBoard.querySelectorAll('.enclosure')];

    for (const element of enclosureElements) {
        const rect = element.getBoundingClientRect();
        if (
            clientX < rect.left ||
            clientX > rect.right ||
            clientY < rect.top ||
            clientY > rect.bottom
        ) {
            continue;
        }

        const enclosure = state.enclosures.find(
            item => item.id === Number(element.dataset.enclosureId)
        );
        if (!enclosure) continue;

        const legalSlots = getAllSlots(enclosure)
            .filter(slotIndex => canPlace(prospectiveAnimal, enclosure, slotIndex));

        if (!legalSlots.length) continue;

        let bestSlot = legalSlots[0];
        let bestDistance = Infinity;

        for (const slotIndex of legalSlots) {
            const slot = element.querySelector(
                `.slot[data-slot-index="${slotIndex}"]`
            );
            if (!slot) continue;

            const slotRect = slot.getBoundingClientRect();
            const dx = clientX - (slotRect.left + slotRect.width / 2);
            const dy = clientY - (slotRect.top + slotRect.height / 2);
            const distance = dx * dx + dy * dy;

            if (distance < bestDistance) {
                bestDistance = distance;
                bestSlot = slotIndex;
            }
        }

        return { enclosure, slotIndex: bestSlot };
    }

    return null;
}


function resultDropDestinationFromDrag(event, prospectiveAnimal, dragRect = null) {
    const points = [
        [event.clientX, event.clientY]
    ];

    // A player visually drags the CARD into an exhibit, not merely the mouse
    // hotspot. Test the card centre and several inset points as well. This
    // fixes drops when the card overlaps an enclosure but the original grab
    // point sits just outside its slot.
    if (dragRect) {
        const x1 = dragRect.left + dragRect.width * 0.25;
        const x2 = dragRect.left + dragRect.width * 0.50;
        const x3 = dragRect.left + dragRect.width * 0.75;
        const y1 = dragRect.top + dragRect.height * 0.25;
        const y2 = dragRect.top + dragRect.height * 0.50;
        const y3 = dragRect.top + dragRect.height * 0.75;

        points.push(
            [x2, y2],
            [x1, y1], [x3, y1],
            [x1, y3], [x3, y3]
        );
    }

    for (const [x, y] of points) {
        const destination =
            resultDropDestinationAtPoint(x, y, prospectiveAnimal);

        if (destination) return destination;
    }

    return null;
}


function resultDropDestination(event, prospectiveAnimal = null) {
    /*
        V81: result drags use a floating image that follows the pointer.
        document.elementFromPoint() can therefore return that drag image instead
        of the enclosure underneath it. Search the full element stack and take
        the first actual slot/enclosure target.
    */
    const targets = document.elementsFromPoint(
        event.clientX,
        event.clientY
    );

    const target = targets.find(element =>
        element?.classList?.contains('slot') ||
        element?.classList?.contains('enclosure') ||
        element?.closest?.('.slot, .enclosure')
    );

    if (!target) return null;

    // Upgrade-result drags use state.result. Draw-result drags can pass the
    // already-selected next Level 1 card explicitly. This keeps destination
    // validation compatibility-aware without accidentally requiring an
    // upgrade result to exist.
    if (!prospectiveAnimal) {
        if (!state.result) return null;

        prospectiveAnimal = {
            id: -1,
            category: state.result.category,
            level: state.result.level,
            filename: state.result.filename
        };
    }

    const slot = target.closest('.slot');
    if (slot) {
        const enclosure = state.enclosures.find(
            item => item.id === Number(slot.dataset.enclosureId)
        );
        const slotIndex = Number(slot.dataset.slotIndex);

        if (
            enclosure &&
            canPlace(prospectiveAnimal, enclosure, slotIndex)
        ) {
            return { enclosure, slotIndex };
        }

        // The player explicitly aimed at this slot, so an illegal exact slot
        // does not redirect to another position.
        return null;
    }

    const enclosureElement = target.closest('.enclosure');
    if (!enclosureElement) return null;

    const enclosure = state.enclosures.find(
        item => item.id === Number(enclosureElement.dataset.enclosureId)
    );
    if (!enclosure) return null;

    const free = getAllSlots(enclosure).find(
        slotIndex => canPlace(prospectiveAnimal, enclosure, slotIndex)
    );

    return free === undefined
        ? null
        : { enclosure, slotIndex: free };
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

    // V101: clicking the upgrade card auto-places it in a random eligible
    // enclosure. Dragging the card to a chosen enclosure remains unchanged.
    if (distance < 6) {
        completeExchange(null, true);
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
    // Category progression is a LIVE view of what is currently in the player's
    // zoo, not a lifetime achievement record. Cards in the hand, exchange area
    // or outgoing trade box do not keep a progression box checked.
    const current = new Set();

    for (const animal of state.animals) {
        if (!animal || animal.enclosureId === null) continue;
        current.add(progressionKey(animal.category, animal.level));
    }

    state.discoveredCategoryLevels = current;

    // A pinned/highlighted progression box cannot remain pinned after the last
    // matching animal leaves the zoo.
    state.progressionGlowPinnedKeys = normaliseLoadedCollection(
        state.progressionGlowPinnedKeys,
        'Set'
    );
    state.progressionGlowPinnedKeys = new Set(
        [...state.progressionGlowPinnedKeys].filter(key => current.has(key))
    );

    if (
        state.progressionGlowHoverKey &&
        !current.has(state.progressionGlowHoverKey)
    ) {
        state.progressionGlowHoverKey = null;
    }

    // Keep the old Level-2 compatibility fields synchronized with CURRENT
    // progression rather than historical progression.
    state.acquiredLevel2Categories = new Set(
        [...current]
            .filter(key => Number(key.split('|')[1]) === 2)
            .map(key => key.split('|')[0])
    );
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

    // The tracker is rebuilt as progression changes, so re-check the live
    // desktop header after the browser has laid out the new table.
    queueMicrotask(() => {
        fitProgressTrackerAroundActions();
        positionOpponentTradeArea();
    });
}


// V154 — progression tracker highlight polish.
// Pinned/ticked tracker highlights remain at full strength until explicitly
// unticked. The glow is also intentionally broader than the old highlight.
function ensureProgressionGlowStyles() {
    if (document.getElementById('progression-glow-v154-styles')) return;
    const style = document.createElement('style');
    style.id = 'progression-glow-v154-styles';
    style.textContent = `
        .animal-card.progression-highlight {
            filter:
                drop-shadow(0 0 5px rgba(255,220,45,1))
                drop-shadow(0 0 13px rgba(255,205,20,.95))
                drop-shadow(0 0 24px rgba(255,190,0,.72)) !important;
        }
        .animal-card.progression-highlight-pinned {
            animation: none !important;
            opacity: 1 !important;
            filter:
                drop-shadow(0 0 6px rgba(255,225,50,1))
                drop-shadow(0 0 16px rgba(255,205,20,1))
                drop-shadow(0 0 30px rgba(255,185,0,.82)) !important;
        }
    `;
    document.head.appendChild(style);
}
ensureProgressionGlowStyles();

// ============================================================
// V45 — SAVE / LOAD + READ-ONLY TURN HISTORY
// ============================================================

const SAVE_STORAGE_KEY = 'zooCuratorSavedGamesV1';
const SAVE_FORMAT_VERSION = 1;
const MAX_SAVE_SLOTS = 8;

// V88 — one silent browser-local resume snapshot, separate from named saves.
// It is intentionally updated only when a NEW turn has been reached.
const AUTO_RESUME_STORAGE_KEY = 'zooCuratorAutoResumeV1';
const AUTO_RESUME_FORMAT_VERSION = 1;
let lastAutoResumeTurn = null;
let autoResumeWriteSuppressed = false;

const SAVE_STATE_KEYS = [
    'gameOptions',
    'sandboxMode',
    'sandboxLooseAnimals',
    'zooName',
    'zooCountry',
    'zooProvince',
    'zooLocation',
    'zooType',
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
    'tradeHistory',
    'animalLineage',
    'collectionRecords',
    'collectionCohabitationActive',
    'collectionActiveLevel',
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
    'highestZooPrestige',
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

function clearAutoResumeSnapshot() {
    try {
        localStorage.removeItem(AUTO_RESUME_STORAGE_KEY);
    } catch (error) {
        console.warn('Could not clear automatic resume snapshot:', error);
    }
    lastAutoResumeTurn = null;
}

function writeAutoResumeSnapshot(force = false) {
    if (
        !state.loaded ||
        autoResumeWriteSuppressed ||
        state.suppressHistoryCapture ||
        state.historyViewTurn !== null
    ) return false;

    const turn = Number(state.turn) || 0;
    if (!force && lastAutoResumeTurn === turn) return false;

    try {
        const record = {
            formatVersion: AUTO_RESUME_FORMAT_VERSION,
            gameVersion: ZOO_CURATOR_VERSION,
            savedAt: new Date().toISOString(),
            turn,
            zooName: state.zooName,
            game: serialiseSpecial(exportCurrentGameState())
        };

        localStorage.setItem(
            AUTO_RESUME_STORAGE_KEY,
            JSON.stringify(record)
        );
        lastAutoResumeTurn = turn;
        return true;
    } catch (error) {
        // Automatic resume must never interrupt gameplay if storage is
        // unavailable/full/private-mode restricted.
        console.warn('Could not update automatic resume snapshot:', error);
        return false;
    }
}

function readAutoResumeSnapshot() {
    try {
        const raw = localStorage.getItem(AUTO_RESUME_STORAGE_KEY);
        if (!raw) return null;

        const record = JSON.parse(raw);
        if (!record || !record.game) return null;

        return {
            ...record,
            game: deserialiseSpecial(record.game)
        };
    } catch (error) {
        console.warn('Automatic resume snapshot is invalid:', error);
        clearAutoResumeSnapshot();
        return null;
    }
}

function zooNameNeedsRepair(value) {
    if (typeof value !== 'string') return true;
    const name = value.trim();
    if (!name) return true;

    const placeholder = name.toLowerCase().replace(/\s+/g, ' ');
    return (
        placeholder === 'loading zoo...' ||
        placeholder === 'loading zoo…' ||
        placeholder === 'loading zoo' ||
        placeholder === 'loading...'
    );
}

function repairLoadedZooName() {
    if (!zooNameNeedsRepair(state.zooName)) return false;

    const pool = buildZooNamePool(state.zooNamesData);
    state.zooName = pool.length
        ? randomItem(pool)
        : randomItem([
            'Riverside Zoo',
            'Forest Wildlife Park',
            'Lakeside Zoo',
            'Highland Wildlife Park',
            'Meadowlands Zoo',
            'Coastal Animal Park'
        ]);

    return true;
}

function restoreAutoResumeSnapshot() {
    const record = readAutoResumeSnapshot();
    if (!record) return false;

    try {
        autoResumeWriteSuppressed = true;
        importGameState(record.game);

        // zoocurator.nl has its own localStorage, separate from localhost.
        // An older production auto-resume snapshot can therefore contain the
        // old header placeholder ("Loading zoo...") even when localhost is
        // perfectly clean. Never let that stale UI placeholder become a saved
        // zoo name.
        const repairedZooName = repairLoadedZooName();
        if (repairedZooName) {
            createZooNameEditor();
        }

        lastAutoResumeTurn = Number(record.turn) || Number(state.turn) || 0;
        return true;
    } catch (error) {
        console.warn('Could not restore automatic resume snapshot:', error);
        clearAutoResumeSnapshot();
        return false;
    } finally {
        autoResumeWriteSuppressed = false;
    }
}

function normaliseLoadedCollection(value, kind = 'Set') {
    // Older saves, JSON round-trips and saves made by versions before a field
    // existed can leave Set/Map state as arrays, plain objects or undefined.
    if (kind === 'Map') {
        if (value instanceof Map) return value;
        if (Array.isArray(value)) return new Map(value);
        if (value && typeof value === 'object') {
            if (value.__zooType === 'Map') {
                return new Map(value.entries || []);
            }
            return new Map(Object.entries(value));
        }
        return new Map();
    }

    if (value instanceof Set) return value;
    if (Array.isArray(value)) return new Set(value);
    if (value && typeof value === 'object') {
        if (value.__zooType === 'Set') {
            return new Set(value.values || []);
        }
        return new Set(
            Object.entries(value)
                .filter(([, enabled]) => Boolean(enabled))
                .map(([key]) => key)
        );
    }
    return new Set();
}

function normaliseLoadedGameCollections() {
    const setKeys = [
        'activeCategories',
        'playerLevelsSeen',
        'enclosureRewards',
        'glowingEnclosureIds',
        'suppressedExchangeGlowIds',
        'exchangeGlowReturnIds',
        'exchangeGlowContinueIds',
        'discoveredCategoryLevels',
        'acquiredLevel2Categories',
        'awardedLevel2Milestones',
        'awardedProgressMilestones',
        'progressionGlowPinnedKeys'
    ];

    for (const key of setKeys) {
        state[key] = normaliseLoadedCollection(state[key], 'Set');
    }

    const mapKeys = [
        'lastExchangeGroupCounts',
        'realZooSessionHoldings',
        'animalLineage',
        'tradeOfferCache',
        'assetPreloadPromises'
    ];

    for (const key of mapKeys) {
        state[key] = normaliseLoadedCollection(state[key], 'Map');
    }
}


function relinkLoadedPlayerReferences() {
    const byId = new Map(state.animals.map(animal => [animal.id, animal]));
    if (!(state.animalLineage instanceof Map)) state.animalLineage = new Map();
    state.collectionRecords = normaliseLoadedCollection(state.collectionRecords, 'Map');
    state.collectionCohabitationActive = normaliseLoadedCollection(state.collectionCohabitationActive, 'Map');
    state.collectionActiveLevel = Math.min(5, Math.max(1, Number(state.collectionActiveLevel) || 1));
    for (const animal of state.animals) {
        if (!state.animalLineage.has(animal.id)) {
            ensureAnimalLineage(animal, state.zooName || 'Your Zoo');
        }
    }
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
        throw new Error(uiText('This save file does not contain a valid Zoo Curator game.'));
    }

    exitHistoryView(false);
    state.suppressHistoryCapture = true;

    for (const key of SAVE_STATE_KEYS) {
        if (Object.prototype.hasOwnProperty.call(saveData.state, key)) {
            state[key] = cloneForSave(saveData.state[key]);
        }
    }

    if (!Object.prototype.hasOwnProperty.call(saveData.state, 'zooType')) {
        state.zooType = inferZooTypeFromAnyGeneratedName(state.zooName);
    }
    state.zooType = normaliseZooTypes(state.zooType)[0];

    state.sandboxMode = Boolean(state.sandboxMode);
    if (!Array.isArray(state.sandboxLooseAnimals)) state.sandboxLooseAnimals = [];
    state.turnHistory = cloneForSave(saveData.turnHistory || []);
    state.historyViewTurn = null;
    state.historyLiveView = null;
    state.drag = null;
    state.pan = null;

    // V85: repair collection types before any render/update function can call
    // .has(), .add(), spread syntax, .entries(), etc. This keeps older saves
    // compatible with newer state fields such as progressionGlowPinnedKeys.
    normaliseLoadedGameCollections();
    relinkLoadedPlayerReferences();
    if (!Object.prototype.hasOwnProperty.call(saveData.state, 'zooProvince')) {
        state.zooProvince = zooSetupProvinceForLocation(
            state.zooCountry,
            state.zooLocation
        );
    }
    if (!Object.prototype.hasOwnProperty.call(saveData.state, 'highestZooPrestige')) {
        state.highestZooPrestige = currentZooPrestige();
    }
    updateHighestZooPrestige();

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
        alert(uiText('Return to the current turn before saving the game.'));
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

    const entered = prompt(uiText('Name this save game:'), name);
    if (entered === null) return;

    name = entered.trim() || name;

    const record = {
        id: existingIndex >= 0
            ? slots[existingIndex].id
            : `save-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        zooName: state.zooName,
        turn: state.sandboxMode ? '∞' : state.turn,
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
        lastAutoResumeTurn = null;
        importGameState(record.game);
        // Make the manually loaded game the browser's new resume point.
        requestAnimationFrame(() => writeAutoResumeSnapshot(true));
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
    queueMicrotask(localizeDocument);
}

function openSaveLoadMenu() {
    if (state.historyViewTurn !== null) return;
    pauseAllHintGlowsForMenu();
    renderSaveSlots();
    document.getElementById('saveLoadOverlay')?.classList.add('visible');
}

function closeSaveLoadMenu() {
    document.getElementById('saveLoadOverlay')?.classList.remove('visible');
    resumeHintGlowsAfterMenu();
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
                <button type="button" id="startNewGameFromSaveMenu">Start New Game</button>
                <span style="flex:1 1 auto;"></span>
                <button type="button" id="saveCurrentGame">Save Current Game</button>
                <button type="button" id="closeSaveLoad">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    button.addEventListener('click', openSaveLoadMenu);
    overlay.querySelector('#startNewGameFromSaveMenu').addEventListener(
        'click', () => {
            closeSaveLoadMenu();
            startFreshZooFromCurrentOptions();
        }
    );
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
        const opening = !panel.classList.contains('visible');
        panel.classList.toggle('visible');
        if (opening) pauseAllHintGlowsForMenu();
        else resumeHintGlowsAfterMenu();
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
        resumeHintGlowsAfterMenu();
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
    queueMicrotask(localizeDocument);
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

let idleGuideSetupWasComplete = false;

function refreshDrawAvailabilityState() {
    if (!drawCard) return false;

    const noOpenSpace = !nextLevelOneHasEligibleDestination();
    const drawAlreadyCommitted = state.hand.length > 0 ||
        state.drag?.type === 'draw' ||
        state.drag?.type === 'draw-result';
    const actionPending = hasPendingPlayerAction();
    const drawUnavailable = noOpenSpace || drawAlreadyCommitted || actionPending;

    drawCard.classList.toggle('draw-no-space', drawUnavailable);
    drawCard.setAttribute('aria-disabled', drawUnavailable ? 'true' : 'false');
    drawCard.style.cursor = drawUnavailable ? 'not-allowed' : '';

    const image = drawCard.querySelector('img');
    if (image) {
        image.style.setProperty('opacity', drawUnavailable ? '0.38' : '', 'important');
        image.style.setProperty(
            'filter',
            drawUnavailable ? 'grayscale(1) brightness(.72) contrast(.82)' : '',
            'important'
        );
    }

    drawCard.title = noOpenSpace
        ? 'No eligible enclosure space is available for the next Level 1 card.'
        : (actionPending ? 'Finish the current exchange or trade first.' : '');

    return !drawUnavailable;
}

function renderAll() {

    refreshDrawAvailabilityState();


    rotateOpponentTradeStocksIfNeeded();
    updateDiscoveredCategoryLevels();
    refreshExchangeGlowSuppression();
    renderZoo();
    // renderZoo() recreates card nodes. Repaint whenever the hint is active,
    // including incoming-box hints and cases where layout/rendering happened
    // without a fresh mouseenter event.
    if ((tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) && !state.outgoingOffer) {
        queueMicrotask(() => {
            if (tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) {
                applyTradeEligibleGlow();
            }
        });
    }
    renderHand();
    renderExchange();
    renderTrade();
    renderProgressTracker();
    updateTurnDisplay();
    captureTurnSnapshot();
    writeAutoResumeSnapshot();

    // V106: render functions rebuild a number of menu/status nodes. Re-run
    // localisation after every full render so Dutch mode cannot leave freshly
    // rendered English labels behind, and English mode restores originals.
    queueMicrotask(localizeDocument);
    if (state.loaded && !idleGuideSetupWasComplete) {
        idleGuideSetupWasComplete = true;
        armActionHint(blueHintInitialDelay());
    } else if (!state.loaded) {
        idleGuideSetupWasComplete = false;
    }
}


// ============================================================
// START ANIMAL DRAG
// ============================================================

function startAnimalDrag(
    event,
    animal,
    location
) {

    // V149: in sandbox, an animal already snapped into an enclosure may be
    // pulled back out and freely parked around the zoo. The ordinary game drag
    // system remains untouched.
    if (state.sandboxMode && location === 'enclosure') {
        const source = event.currentTarget;
        const sourceRect = source.getBoundingClientRect();
        const originalEnclosureId = animal.enclosureId;
        const originalSlotIndex = animal.slotIndex;
        const relativeX = (event.clientX - sourceRect.left) / Math.max(sourceRect.width, 1);
        const relativeY = (event.clientY - sourceRect.top) / Math.max(sourceRect.height, 1);

        event.preventDefault();
        event.stopPropagation();

        // A foreground drag ghost is independent of the enclosure DOM, so it
        // remains fully visible even while crossing the enclosure artwork.
        const ghost = document.createElement('img');
        ghost.className = 'dragging-animal sandbox-dragging-animal';
        applyLocalizedAnimalImage(ghost, animal);
        Object.assign(ghost.style, {
            position: 'fixed',
            width: `${ANIMAL_W * state.zoom}px`,
            height: `${ANIMAL_H * state.zoom}px`,
            objectFit: 'contain',
            pointerEvents: 'none',
            zIndex: '10020',
            opacity: '1'
        });
        document.body.appendChild(ghost);
        source.style.opacity = '0';

        const positionGhost = e => {
            ghost.style.left = `${e.clientX - relativeX * ANIMAL_W * state.zoom}px`;
            ghost.style.top = `${e.clientY - relativeY * ANIMAL_H * state.zoom}px`;
        };
        positionGhost(event);

        const move = e => positionGhost(e);
        const up = e => {
            window.removeEventListener('pointermove', move);
            ghost.remove();
            source.style.opacity = '';

            const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('.slot.empty-slot');
            if (target) {
                const targetEnc = state.enclosures.find(x => String(x.id) === String(target.dataset.enclosureId));
                const targetSlot = Number(target.dataset.slotIndex);
                if (targetEnc && canPlace(animal, targetEnc, targetSlot)) {
                    // Keep sandbox cards completely out of the hand at every stage.
                    state.hand = state.hand.filter(x => x.id !== animal.id);
                    animal.hand = false;
                    animal.enclosureId = null;
                    animal.slotIndex = null;
                    placeAnimal(animal, targetEnc, targetSlot);
                    renderAll();
                    return;
                }
            }

            // Convert screen drop coordinates back to zoo-canvas coordinates.
            const canvasRect = zooCanvas.getBoundingClientRect();
            const x = clamp(
                (e.clientX - canvasRect.left) / state.zoom - relativeX * ANIMAL_W,
                20, WORKSPACE_W - ANIMAL_W - 20
            );
            const y = clamp(
                (e.clientY - canvasRect.top) / state.zoom - relativeY * ANIMAL_H,
                20, WORKSPACE_H - ANIMAL_H - 20
            );
            const proposed = {x, y, w:ANIMAL_W, h:ANIMAL_H};
            const blocked =
                state.enclosures.some(enc => rectanglesOverlap(
                    proposed, {x:enc.x,y:enc.y,w:ENCLOSURE_W,h:ENCLOSURE_H}, 0
                )) ||
                (state.sandboxLooseAnimals || []).some(other =>
                    other.id !== animal.id && other.enclosureId == null &&
                    rectanglesOverlap(proposed, {x:other.x,y:other.y,w:ANIMAL_W,h:ANIMAL_H}, 20)
                );

            if (blocked) {
                animal.enclosureId = originalEnclosureId;
                animal.slotIndex = originalSlotIndex;
            } else {
                state.hand = state.hand.filter(x => x.id !== animal.id);
                animal.hand = false;
                animal.enclosureId = null;
                animal.slotIndex = null;
                animal.sandboxLoose = true;
                animal.x = x;
                animal.y = y;
                if (!(state.sandboxLooseAnimals || []).some(x => x.id === animal.id)) {
                    state.sandboxLooseAnimals.push(animal);
                }
            }
            renderAll();
        };

        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up, {once:true});
        return;
    }

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


    applyLocalizedAnimalImage(dragImage, animal);


    dragImage.style.width =
        dragWidth + 'px';


    dragImage.style.height =
        dragHeight + 'px';


    document.body.appendChild(
        dragImage
    );


    // V160: the moment an exchange-eligible zoo card is picked up, focus the
    // yellow glow on that exact category+level group. Unrelated yellow glows
    // cut off immediately; matching cards keep their CURRENT glow state.
    //
    // Capture the already-visible matching glow IDs before changing focus so
    // renderZoo() can continue the existing animation instead of restarting a
    // fade-in.
    const draggedExchangeEligible =
        location === 'enclosure' &&
        isExchangeEligible(animal);

    if (draggedExchangeEligible) {
        state.exchangeGlowFocusKey = exchangeGroupKey(animal);
    }

    state.exchangeGlowDragStartedAt = Date.now();

    const exchangeGlowIdsAtDragStart = new Set(
        state.animals
            .filter(candidate => {
                if (!shouldGlowForExchange(candidate)) return false;
                if (!draggedExchangeEligible) return true;
                return exchangeGroupKey(candidate) === exchangeGroupKey(animal);
            })
            .map(candidate => candidate.id)
    );

    // IMPORTANT: dragging an animal immediately removes it from its enclosure.
    // A deadlock rescue must therefore be captured here, while the board is
    // still full. Waiting until the card reaches the trade box is too late:
    // by then emergencyTradeNeeded() sees an empty enclosure and returns false.
    const emergencyTradeAtDragStart =
        location === 'enclosure'
            ? emergencyTradeForAnimal(animal)
            : null;

    const compatibilityGlowKeysAtDragStart =
        currentCompatibilityGlowKeys([animal]);

    // V185: the drag owns compatibility guidance from this point onward.
    // Remove hover-derived blue hints before creating the drag state.
    clearCompatibilityHoverImmediately();
    cancelCompatibilityIntent();
    state.compatibilityIntentActiveAnimal = null;

    state.drag = {

        type:
            'animal',

        exchangeGlowIds: exchangeGlowIdsAtDragStart,
        emergencyTradeAtDragStart,
        compatibilityGlowKeys: compatibilityGlowKeysAtDragStart,

        animal,

        location,

        originalEnclosureId:
            animal.enclosureId ?? animal.reservedEnclosureId ?? null,

        originalSlotIndex:
            animal.slotIndex ?? animal.reservedSlotIndex ?? null,

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


    // V126: an animal dragged out of an enclosure is still considered to
    // occupy that slot until a legal destination/action is committed.
    // This keeps draw availability, full-zoo checks and placement logic stable
    // while the card is merely following the cursor.
    if (
        location === 'enclosure' &&
        state.drag.originalEnclosureId !== null &&
        state.drag.originalSlotIndex !== null
    ) {
        reserveAnimalZooSlot(
            animal,
            state.drag.originalEnclosureId,
            state.drag.originalSlotIndex
        );
    }

    removeAnimalFromLocations(
        animal
    );

    // removeAnimalFromLocations deliberately clears the live location but does
    // not clear reservedEnclosureId/reservedSlotIndex. Refresh the deck now so
    // the visual disabled state cannot flicker during the drag.
    refreshDrawAvailabilityState();


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

        reserveAnimalZooSlot(animal, drag.originalEnclosureId, drag.originalSlotIndex);

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
        Inventory failsafe:
        an animal is only exchangeable if its category actually has at least
        one card in the next level. For example, Level 3 Reptiles remain
        non-upgradeable while the Level 4 Reptiles inventory is empty.
    */
    if (!hasNextLevelInventory(animal.category, animal.level)) {
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
    state.exchangeGlowFocusKey = exchangeGroupKey(animal);

    if (state.drag?.type === 'animal' && state.drag.animal?.id === animal.id) {
        reserveAnimalZooSlot(animal, state.drag.originalEnclosureId, state.drag.originalSlotIndex);
    }

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

    // The back can be shown immediately, while the exact front card is
    // decoded in the background before the player takes the upgrade.
    state.result.readyPromise = preloadAnimalAsset(state.result);

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
    // Always count boxes that are checked RIGHT NOW.
    updateDiscoveredCategoryLevels();

    let count = 0;
    for (const key of state.discoveredCategoryLevels) {
        const [, levelText] = key.split('|');
        if (Number(levelText) === level) count++;
    }
    return count;
}


function progressionRewardKeysForMilestones(milestones) {
    updateDiscoveredCategoryLevels();
    const keys = new Set();
    for (let level = 2; level <= 5; level++) {
        const count = progressionCountForLevel(level);
        for (const milestone of normalizeRewardMilestones(milestones)) {
            if (count >= milestone) keys.add(`${level}|${milestone}`);
        }
    }
    return keys;
}

function emptyEnclosures() {
    const occupied = new Set(
        state.animals
            .filter(animal => animal && animal.enclosureId !== null && animal.enclosureId !== undefined)
            .map(animal => animal.enclosureId)
    );
    return state.enclosures.filter(enclosure => !occupied.has(enclosure.id));
}

function removeEmptyEnclosures(count) {
    const available = emptyEnclosures();
    const chosen = available
        .slice()
        .sort((a,b) => Number(b.id) - Number(a.id))
        .slice(0, Math.max(0, count));
    const ids = new Set(chosen.map(enclosure => enclosure.id));
    state.enclosures = state.enclosures.filter(enclosure => !ids.has(enclosure.id));
    for (const id of ids) state.glowingEnclosureIds.delete(id);
    return { removed: chosen.length, available: available.length };
}

function applyMilestonesToCurrentZoo(newMilestones, retroactive) {
    const oldAwarded = new Set(state.awardedProgressMilestones || []);
    const expected = progressionRewardKeysForMilestones(newMilestones);

    if (!retroactive) {
        // "From now on": milestones already satisfied today count as passed,
        // but do not add/remove enclosure cards merely because the rule changed.
        state.awardedProgressMilestones = expected;
    } else {
        const delta = expected.size - oldAwarded.size;

        if (delta > 0) {
            for (let i=0; i<delta; i++) addRewardEnclosure();
        } else if (delta < 0) {
            const wanted = -delta;
            const result = removeEmptyEnclosures(wanted);
            if (result.removed < wanted) {
                const missing = wanted - result.removed;
                alert(
                    `The new milestone settings would remove ${wanted} enclosure card${wanted===1?'':'s'}, ` +
                    `but only ${result.removed} completely empty enclosure card${result.removed===1?' is':'s are'} available.\n\n` +
                    `Only the ${result.removed} available empty enclosure card${result.removed===1?' has':'s have'} been removed. ` +
                    `${missing} occupied enclosure card${missing===1?' was':'s were'} left in place.`
                );
            }
        }
        state.awardedProgressMilestones = expected;
    }

    state.awardedLevel2Milestones = new Set(
        [...state.awardedProgressMilestones]
            .map(key => String(key).split('|'))
            .filter(([levelText]) => Number(levelText) === 2)
            .map(([, milestoneText]) => Number(milestoneText))
    );
}

function checkCurrentProgressionRewards() {
    // Rebuild the checkboxes from the actual animals currently placed in the
    // zoo before testing reward thresholds.
    updateDiscoveredCategoryLevels();

    for (let level = 2; level <= 5; level++) {
        const count = progressionCountForLevel(level);

        for (const milestone of state.gameOptions.enclosureRewardMilestones) {
            const rewardKey = `${level}|${milestone}`;

            // An enclosure reward itself is still awarded only once. What has
            // changed is the qualification test: the milestone must be met by
            // simultaneously checked boxes, never by historical boxes.
            if (
                count >= milestone &&
                !state.awardedProgressMilestones.has(rewardKey)
            ) {
                state.awardedProgressMilestones.add(rewardKey);
                addRewardEnclosure();
            }
        }
    }

    // Legacy Level-2 reward state remains compatible with older saves/UI.
    state.awardedLevel2Milestones = new Set(
        [...state.awardedProgressMilestones]
            .map(key => String(key).split('|'))
            .filter(([levelText]) => Number(levelText) === 2)
            .map(([, milestoneText]) => Number(milestoneText))
    );
}

function checkEnclosureReward(animal) {
    if (!animal) return;

    // The incoming/new animal has already been placed before this is called,
    // so reward eligibility can be determined entirely from current zoo state.
    checkCurrentProgressionRewards();
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
    const nowEligible = new Set(
        state.animals
            .filter(animal => shouldGlowForExchange(animal))
            .map(animal => animal.id)
    );

    // V162:
    // A card that was already glowing before this drag and is still eligible
    // afterwards must simply KEEP glowing. Rebuilding the zoo DOM must not
    // reinterpret it as a newly appearing glow and must not restart a fade-in.
    //
    // Only cards that genuinely became eligible during/after this drag get the
    // exchange-glow-return animation.
    const newlyEligible = new Set(
        [...nowEligible].filter(id => !before.has(id))
    );

    state.exchangeGlowContinueIds.clear();
    state.exchangeGlowContinueStartedAt = 0;
    state.exchangeGlowContinueUntil = 0;

    state.exchangeGlowReturnIds = newlyEligible;
    state.exchangeGlowReturnUntil =
        newlyEligible.size ? Date.now() + 1000 : 0;
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
            // V157: selecting an exchange-ready animal focuses the eligibility
            // glow on this exact category+level group. Other eligible groups
            // fade away until the exchange is completed or cancelled.
            state.exchangeGlowFocusKey = exchangeGroupKey(animal);
        }

        prepareExchangeGlowAfterAnimalDrag(drag); drag.image?.remove(); state.drag=null; renderAll(); return;
    }

    let placed = tryDropOnOutgoingOffer(event, animal);
    if (!placed) placed = tryDropOnExchange(event, animal);
    if (!placed) placed = tryDropOnExactSlot(event, animal);
    if (!placed) placed = tryDropOnEnclosure(event, animal);
    if (!placed) {
        restoreDraggedAnimal();
    } else {
        beginCompatibilityGlowFade(drag.compatibilityGlowKeys);
    }

    // If the selected exchange card was returned to the zoo and no exchange
    // remains pending, restore all otherwise eligible yellow glows.
    clearExchangeGlowFocusIfIdle();

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

function randomAvailableLevelOneCategory() {
    const candidates = [];

    for (const category of Object.keys(FOLDERS)) {
        if (!state.activeCategories.has(category)) continue;

        const available = levelFiles(category, 1).filter(file =>
            !state.animals.some(animal =>
                animal.category === category &&
                animal.level === 1 &&
                animal.filename.toLowerCase() === file.toLowerCase()
            )
        );

        // Weight categories by the number of unused cards they still contain,
        // so every unused Level 1 card has an equal chance of being reached.
        for (let i = 0; i < available.length; i++) {
            candidates.push(category);
        }
    }

    if (!candidates.length) {
        throw new Error(
            'No unused Level 1 animal cards remain in the enabled categories.'
        );
    }

    return randomItem(candidates);
}

async function createLevelOneForDraw(destination = null, autoPlace = false) {

    if (!nextLevelOneHasEligibleDestination()) {
        setMessage?.(
            'No eligible enclosure space is available for the next Level 1 card.'
        );
        renderAll?.();
        return false;
    }


    state.glowingEnclosureIds.clear();

    // The exact next card was selected and preloaded ahead of time.
    const spec = await consumePreparedDrawSpec();
    if (!spec) {
        console.error('No unused Level 1 animal cards remain.');
        return false;
    }

    const animal = createAnimal(spec.category, 1, spec.filename);
    state.animals.push(animal);
    markPlayerLevelSeen(animal.level);

    if (autoPlace && !destination) {
        destination = randomEligibleDestinationForAnimal(animal);
    }

    if (destination) {
        if (!placeAnimal(animal, destination.enclosure, destination.slotIndex)) {
            state.animals = state.animals.filter(item => item.id !== animal.id);
            return false;
        }
        if (autoPlace) markNewPlacementGlow(animal);
    } else {
        // Dragging behaviour still uses the hand fallback where appropriate.
        // A click, however, must never create a hand card.
        if (autoPlace) {
            state.animals = state.animals.filter(item => item.id !== animal.id);
            return false;
        }
        animal.hand = true;
        state.hand.push(animal);
    }
    state.turn++;
    updateTurnDisplay();
    updateAutonomousOpponentOffer();
    renderAll();
    noteNewCardAction();

    // Immediately choose and preload the following draw while the player
    // continues playing this turn.
    prepareNextDrawAsset();

    return true;
}

async function drawLevelOne() { return createLevelOneForDraw(null, true); }

function startDrawDrag(event) {
    if (state.drag || state.pan) return;
    const rect = drawCard.getBoundingClientRect();
    const source = drawCard.querySelector('img');
    const image = document.createElement('img');
    image.className = 'dragging-animal dragging-result';
    image.style.pointerEvents = 'none';
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
async function finishDrawDrag(event) {
    const drag = state.drag;
    if (!drag || drag.type !== 'draw-result') return;

    const distance = Math.hypot(
        event.clientX - drag.startClientX,
        event.clientY - drag.startClientY
    );

    const dragRect = drag.image?.getBoundingClientRect?.() || null;
    drag.image?.remove?.();
    state.drag = null;

    // V101: a simple click auto-places the prepared Level 1 card in a
    // random eligible enclosure. Dragging remains unchanged.
    if (distance < 6) {
        await drawLevelOne();
        return;
    }

    // V84: resolve the EMPTY EXHIBIT first, exactly as the known-good V74
    // architecture did. Do not make drag success depend on nextDrawSpec.
    const destination = levelOneDrawDropDestination(event, dragRect);

    if (!destination) {
        setMessage?.(
            uiText('That Level 1 card was not dropped on an empty single exhibit or completely empty large exhibit. No card was drawn.')
        );
        renderAll?.();
        return;
    }

    // Only after the drop target is locked do we consume/create the prepared
    // card. createLevelOneForDraw() then uses normal placeAnimal()/canPlace().
    const placed = await createLevelOneForDraw(destination);

    if (!placed) {
        setMessage?.(
            uiText('The Level 1 card could not be placed in that exhibit. No turn was used.')
        );
        renderAll?.();
    }
}

if (drawCard) drawCard.dataset.label = state.gameOptions.animalLanguage === 'nl' ? 'TREK KAART' : 'DRAW CARD';



// V143: hint rings belong to the game layer, below every modal/menu layer.
const MENU_SAFE_HINT_Z = 9000;

// ============================================================
// V141 TURN-AWARE HINT POLICY
//
// Turns 1-10: keep the existing beginner hint timing.
// Turn 11+: hints are true inactivity hints. Any visible user interaction
// resets them, and they wait 15 quiet seconds before appearing again.
// ============================================================
function isBeginnerHintTurn() {
    return Number(state.turn || 0) <= 10;
}

function blueHintInitialDelay() {
    return isBeginnerHintTurn() ? 4000 : 15000;
}

function blueHintRepeatDelay() {
    // Existing beginner cycle was 4s glow + 10s quiet = 14s between starts.
    // Later turns use 15 quiet seconds after the 4s glow.
    return isBeginnerHintTurn() ? 14000 : 19000;
}

function yellowHintQuietDelay() {
    return isBeginnerHintTurn() ? 4000 : 15000;
}

let lateTurnHintActivityScheduled = false;

function noteLateTurnScreenActivity() {
    if (isBeginnerHintTurn() || !state.loaded || state.historyViewTurn !== null) return;
    if (lateTurnHintActivityScheduled) return;
    lateTurnHintActivityScheduled = true;

    requestAnimationFrame(() => {
        lateTurnHintActivityScheduled = false;
        if (isBeginnerHintTurn() || !state.loaded || state.historyViewTurn !== null) return;

        // Blue action hint: cancel anything visible/pending and require a new
        // uninterrupted 15-second idle period.
        actionHintGeneration++;
        if (actionHintTimer) clearTimeout(actionHintTimer);
        if (actionHintRepeatTimer) clearTimeout(actionHintRepeatTimer);
        actionHintTimer = null;
        actionHintRepeatTimer = null;
        removeActionHintOverlay();
        armActionHint(15000);

        // Yellow exchange hint follows the same late-game inactivity rule.
        if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
        yellowExchangeHintTimer = null;
        clearYellowExchangeHintOverlays();
        yellowExchangeHintPhase = 'waiting';
        yellowExchangeHintWasPossible = yellowExchangePossible();
        if (yellowExchangeHintWasPossible) scheduleYellowExchangeHint(15000);
    });
}

// "Nothing happens onscreen" means genuine user inactivity in the late game.
// Pointer movement/hovering, clicking/tapping, scrolling and keyboard use all
// postpone hints. Throttling through requestAnimationFrame prevents mousemove
// from repeatedly rebuilding timers within the same frame.
for (const eventName of ['pointermove', 'pointerdown', 'wheel', 'keydown']) {
    document.addEventListener(eventName, noteLateTurnScreenActivity, {
        capture: true,
        passive: eventName !== 'keydown'
    });
}


// ============================================================
// V130 ALTERNATING YELLOW EXCHANGE HINT
//
// When 3+ matching cards make an upgrade possible:
//   4s wait -> both EXCHANGE boxes glow yellow for 2s
//   immediately -> UPGRADE box glows yellow for 2s
//   4s wait -> repeat
//
// This uses fixed body overlays like the blue action hint, so enclosure/menu
// CSS cannot clip or hide the glow.
// ============================================================
let yellowExchangeHintTimer = null;
let yellowExchangeHintOverlays = [];
let yellowExchangeHintAnimations = [];
let yellowExchangeHintWasPossible = false;
let yellowExchangeHintPhase = 'waiting';

function yellowExchangePossible() {
    return (
        !state.sandboxMode &&
        state.loaded &&
        state.historyViewTurn === null &&
        eligibleExchangeCategories().length > 0 &&
        // V136: this is an idle discovery hint, not guidance while the player
        // is already performing the exchange. As soon as either exchange box
        // contains a selected animal, suppress the entire yellow hint cycle.
        !state.exchange.some(Boolean) &&
        !state.result
    );
}

function clearYellowExchangeHintOverlays() {
    for (const animation of yellowExchangeHintAnimations) {
        try { animation?.cancel?.(); } catch (_) {}
    }
    yellowExchangeHintAnimations = [];

    for (const overlay of yellowExchangeHintOverlays) {
        overlay?.remove?.();
    }
    yellowExchangeHintOverlays = [];
}

function makeYellowHintOverlay(target, duration = 2000) {
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return null;

    const ring = document.createElement('div');
    Object.assign(ring.style, {
        position: 'fixed',
        left: `${rect.left - 7}px`,
        top: `${rect.top - 7}px`,
        width: `${rect.width + 14}px`,
        height: `${rect.height + 14}px`,
        boxSizing: 'border-box',
        border: '5px solid rgb(255, 210, 35)',
        borderRadius: '10px',
        background: 'rgba(255, 215, 45, .08)',
        boxShadow: '0 0 13px 7px rgba(255,210,35,.98), 0 0 32px 14px rgba(255,190,20,.72)',
        pointerEvents: 'none',
        zIndex: '8999',
        opacity: '0'
    });
    document.body.appendChild(ring);
    yellowExchangeHintOverlays.push(ring);

    if (typeof ring.animate === 'function') {
        const animation = ring.animate([
            { opacity: 0, transform: 'scale(.985)' },
            { opacity: 1, transform: 'scale(1.025)', offset: .18 },
            { opacity: 1, transform: 'scale(1.025)', offset: .72 },
            { opacity: 0, transform: 'scale(.99)' }
        ], { duration, easing: 'ease-in-out' });
        yellowExchangeHintAnimations.push(animation);
    } else {
        ring.style.opacity = '1';
    }

    return ring;
}

function scheduleYellowExchangeHint(delay = 4000) {
    if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
    yellowExchangeHintTimer = null;

    if (!yellowExchangePossible()) {
        yellowExchangeHintWasPossible = false;
        yellowExchangeHintPhase = 'waiting';
        clearYellowExchangeHintOverlays();
        return;
    }

    yellowExchangeHintWasPossible = true;
    yellowExchangeHintPhase = 'waiting';

    yellowExchangeHintTimer = setTimeout(() => {
        yellowExchangeHintTimer = null;
        if (!yellowExchangePossible()) {
            clearYellowExchangeHintOverlays();
            yellowExchangeHintWasPossible = false;
            return;
        }

        // V148: blue Draw/Outgoing and yellow Exchange hints are mutually
        // exclusive. If the blue hint is currently visible, wait until its
        // four-second animation has cleared before starting yellow.
        if (actionHintOverlay) {
            scheduleYellowExchangeHint(isBeginnerHintTurn() ? 4000 : 15000);
            return;
        }

        // Phase 1: both exchange boxes together for two seconds.
        yellowExchangeHintPhase = 'exchange';
        clearYellowExchangeHintOverlays();
        makeYellowHintOverlay(exchange1, 2000);
        makeYellowHintOverlay(exchange2, 2000);

        yellowExchangeHintTimer = setTimeout(() => {
            yellowExchangeHintTimer = null;
            if (!yellowExchangePossible()) {
                clearYellowExchangeHintOverlays();
                yellowExchangeHintWasPossible = false;
                return;
            }

            // Phase 2: upgrade/result box for two seconds.
            yellowExchangeHintPhase = 'upgrade';
            clearYellowExchangeHintOverlays();
            makeYellowHintOverlay(resultBox, 2000);

            yellowExchangeHintTimer = setTimeout(() => {
                yellowExchangeHintTimer = null;
                clearYellowExchangeHintOverlays();
                if (yellowExchangePossible()) {
                    // Early game: 4s quiet. Turn 11+: 15s quiet.
                    scheduleYellowExchangeHint(yellowHintQuietDelay());
                } else {
                    yellowExchangeHintWasPossible = false;
                }
            }, 2000);
        }, 2000);
    }, delay);
}

function refreshYellowExchangeHintState() {
    const possible = yellowExchangePossible();

    if (possible && !yellowExchangeHintWasPossible) {
        // Early game keeps the teaching cadence; after turn 10 this becomes
        // a true inactivity hint and waits 15 seconds.
        scheduleYellowExchangeHint(yellowHintQuietDelay());
    } else if (!possible && yellowExchangeHintWasPossible) {
        if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
        yellowExchangeHintTimer = null;
        yellowExchangeHintWasPossible = false;
        yellowExchangeHintPhase = 'waiting';
        clearYellowExchangeHintOverlays();
    }
}

// renderAll does not run for every drag/drop path in this game, so poll the
// exchange eligibility state as a safety net. This does not reset the cycle.
setInterval(refreshYellowExchangeHintState, 250);

// V125 TURN-ACTION BLUE HINT
// A hint is scheduled whenever the player reaches a stable playable state.
// It is cancelled ONLY by an action that acquires/commits a new card.
// Ordinary zoo interaction never cancels it.
let actionHintTimer = null;
let actionHintRepeatTimer = null;
let actionHintOverlay = null;
let actionHintAnimation = null;
let actionHintGeneration = 0;

function removeActionHintOverlay() {
    actionHintAnimation?.cancel?.();
    actionHintAnimation = null;
    actionHintOverlay?.remove?.();
    actionHintOverlay = null;
}

function pauseAllHintGlowsForMenu() {
    // Blue action hint.
    if (actionHintTimer) clearTimeout(actionHintTimer);
    if (actionHintRepeatTimer) clearTimeout(actionHintRepeatTimer);
    actionHintTimer = null;
    actionHintRepeatTimer = null;
    ++actionHintGeneration;
    removeActionHintOverlay();

    // Yellow exchange/upgrade hint.
    if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
    yellowExchangeHintTimer = null;
    yellowExchangeHintWasPossible = false;
    yellowExchangeHintPhase = 'waiting';
    clearYellowExchangeHintOverlays();
}

function resumeHintGlowsAfterMenu() {
    // Menus count as deliberate UI activity: begin a fresh quiet period rather
    // than immediately restoring a glow that was visible behind the menu.
    armActionHint(blueHintInitialDelay());
    refreshYellowExchangeHintState();
}

function actionHintTarget() {
    if (!state.loaded) return null;

    // Use the same availability result that now correctly greys the deck.
    const drawEnabled = drawCard &&
        drawCard.getAttribute('aria-disabled') !== 'true' &&
        nextLevelOneHasEligibleDestination();

    return drawEnabled ? drawCard : outgoingOfferBox;
}

function showActionHintNow() {
    // V148: never display the blue Draw/Outgoing hint at the same time as the
    // yellow Exchange/Upgrade hint. The blue scheduler will retry later.
    if (yellowExchangeHintPhase !== 'waiting' || yellowExchangeHintOverlays.length) {
        return false;
    }

    refreshDrawAvailabilityState();
    const target = actionHintTarget();
    if (!target) {
        return false;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) {
        return false;
    }

    removeActionHintOverlay();

    const ring = document.createElement('div');
    ring.setAttribute('data-zoo-action-hint', 'true');
    Object.assign(ring.style, {
        position: 'fixed',
        left: `${rect.left - 8}px`,
        top: `${rect.top - 8}px`,
        width: `${rect.width + 16}px`,
        height: `${rect.height + 16}px`,
        boxSizing: 'border-box',
        border: '6px solid #3b9cff',
        borderRadius: '12px',
        background: 'rgba(45,145,255,.10)',
        boxShadow: '0 0 12px 7px rgba(55,155,255,1), 0 0 34px 17px rgba(55,145,255,.85)',
        pointerEvents: 'none',
        zIndex: '9000',
        opacity: '1'
    });
    document.body.appendChild(ring);
    actionHintOverlay = ring;

    // Keep the two hint systems in one alternating cadence rather than letting
    // their independent timers converge and glow simultaneously.
    if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
    yellowExchangeHintTimer = null;
    clearYellowExchangeHintOverlays();

    if (yellowExchangePossible()) {
        yellowExchangeHintWasPossible = true;
        scheduleYellowExchangeHint(isBeginnerHintTurn() ? 4000 : 15000);
    }

    if (typeof ring.animate === 'function') {
        actionHintAnimation = ring.animate([
            { opacity: .25, transform: 'scale(.985)' },
            { opacity: 1, transform: 'scale(1.035)' },
            { opacity: .45, transform: 'scale(1)' },
            { opacity: 1, transform: 'scale(1.035)' },
            { opacity: 0, transform: 'scale(.99)' }
        ], { duration: 4000, easing: 'ease-in-out' });
        actionHintAnimation.onfinish = removeActionHintOverlay;
    } else {
        setTimeout(removeActionHintOverlay, 4000);
    }
    return true;
}

function armActionHint(delay = 4000) {
    if (actionHintTimer) clearTimeout(actionHintTimer);
    if (actionHintRepeatTimer) clearTimeout(actionHintRepeatTimer);
    const generation = ++actionHintGeneration;

    actionHintTimer = setTimeout(function fireHint() {
        if (generation !== actionHintGeneration) {
            return;
        }

        // Do not interpret dragging/panning/reading as activity. If the exact
        // instant lands during a drag, retry quickly rather than resetting.
        if (state.drag || state.pan) {
            actionHintTimer = setTimeout(fireHint, 250);
            return;
        }

        if (showActionHintNow()) {
            actionHintRepeatTimer = setTimeout(() => {
                if (generation === actionHintGeneration) fireHint();
            }, blueHintRepeatDelay());
        } else {
            actionHintTimer = setTimeout(fireHint, 500);
        }
    }, delay);
}

function noteNewCardAction() {
    // This is the ONLY reset path for the hint.
    actionHintGeneration++;
    if (actionHintTimer) clearTimeout(actionHintTimer);
    if (actionHintRepeatTimer) clearTimeout(actionHintRepeatTimer);
    actionHintTimer = null;
    actionHintRepeatTimer = null;
    removeActionHintOverlay();

    // Early turns keep the teaching delay. From turn 11 onward, a completed
    // action begins a full 15-second inactivity window.
    armActionHint(blueHintInitialDelay());
}


drawCard.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;

    // V116: immediate visual feedback as soon as this draw is committed.
    // renderAll() will subsequently decide whether it remains disabled.
    drawCard.classList.add('draw-no-space');
    drawCard.setAttribute('aria-disabled', 'true');
    const immediateDrawImage = drawCard.querySelector('img');
    if (immediateDrawImage) {
        immediateDrawImage.style.opacity = '0.38';
        immediateDrawImage.style.filter = 'grayscale(1) brightness(.72) contrast(.82)';
    }

    if (hasPendingPlayerAction()) {
        event.preventDefault();
        event.stopPropagation();
        setMessage?.('Finish or return the current exchange/trade card before drawing a new card.');
        renderAll?.();
        return;
    }

    if (!nextLevelOneHasEligibleDestination()) {
        event.preventDefault();
        event.stopPropagation();
        setMessage?.(
            'No eligible enclosure space is available for the next Level 1 card.'
        );
        renderAll?.();
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    startDrawDrag(event);
});


// ============================================================
// V145 SECRET SANDBOX MODE
// ============================================================
let sandboxPickerOverlay = null;
let sandboxToolbarInstalled = false;
let sandboxHoveredAnimalId = null;
let sandboxHoveredEnclosureId = null;

function removeSandboxAnimalById(animalId) {
    // Deliberately hard-gated: this destructive shortcut must NEVER work in a normal game.
    if (!state.sandboxMode) return false;
    const id = Number(animalId);
    if (!Number.isFinite(id) || !state.animals.some(animal => animal.id === id)) return false;

    state.animals = state.animals.filter(animal => animal.id !== id);
    state.sandboxLooseAnimals = (state.sandboxLooseAnimals || []).filter(animal => animal.id !== id);
    state.hand = (state.hand || []).filter(animal => animal?.id !== id);
    state.exchange = (state.exchange || []).map(animal => animal?.id === id ? null : animal);
    if (state.result?.id === id) state.result = null;
    if (state.outgoingOffer?.id === id) state.outgoingOffer = null;
    state.tradeOffers = (state.tradeOffers || []).filter(offer =>
        offer?.animal?.id !== id && offer?.outgoing?.id !== id
    );
    sandboxHoveredAnimalId = null;
    renderAll();
    writeAutoResumeSnapshot(true);
    return true;
}

function removeSandboxEnclosureById(enclosureId) {
    if (!state.sandboxMode) return false;
    const id = Number(enclosureId);
    const enclosure = state.enclosures.find(item => item.id === id);
    if (!enclosure) return false;

    // Removing an enclosure also removes the animal cards physically inside it.
    const animalIds = new Set(
        state.animals.filter(animal => animal.enclosureId === id).map(animal => animal.id)
    );
    state.animals = state.animals.filter(animal => !animalIds.has(animal.id));
    state.sandboxLooseAnimals = (state.sandboxLooseAnimals || []).filter(animal => !animalIds.has(animal.id));
    state.enclosures = state.enclosures.filter(item => item.id !== id);
    state.glowingEnclosureIds.delete(id);
    sandboxHoveredEnclosureId = null;
    sandboxHoveredAnimalId = null;
    renderAll();
    writeAutoResumeSnapshot(true);
    return true;
}

window.addEventListener('keydown', event => {
    if (!state.sandboxMode) return;
    if (event.key !== 'Backspace' && event.key !== 'Delete') return;
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement ||
        event.target?.isContentEditable) return;

    // Animal takes priority when it sits on top of an enclosure.
    if (sandboxHoveredAnimalId != null && removeSandboxAnimalById(sandboxHoveredAnimalId)) {
        event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (sandboxHoveredEnclosureId != null && removeSandboxEnclosureById(sandboxHoveredEnclosureId)) {
        event.preventDefault();
        event.stopPropagation();
    }
});
function startSandboxMode() {
    if (!confirm('Start a new Sandbox game? Your current unsaved game will be replaced.')) return;
    clearAutoResumeSnapshot();
    exitHistoryView(false);
    state.sandboxMode = true;
    state.sandboxLooseAnimals = [];
    state.enclosures = [];
    state.animals = [];
    state.hand = [];
    state.exchange = [null, null];
    state.result = null;
    state.outgoingOffer = null;
    state.tradeOffers = [];
    state.selectedTradeOpponent = null;
    state.autonomousTradeOffer = null;
    state.tradeHistory = [];
    state.animalLineage = new Map();
    state.collectionRecords = new Map();
    state.collectionCohabitationActive = new Map();
    state.collectionActiveLevel = 1;
    state.turn = 1;
    state.nextId = 1;
    state.enclosureRewards = new Set();
    state.glowingEnclosureIds = new Set();
    state.suppressedExchangeGlowIds = new Set();
    state.exchangeGlowFocusKey = null;
    state.discoveredCategoryLevels = new Set();
    state.awardedProgressMilestones = new Set();
    state.awardedLevel2Milestones = new Set();
    state.opponentProfiles = [];
    state.opponentTradeStocks = [];
    state.tradeOffers = [];
    state.autonomousTradeOffer = null;
    state.selectedTradeOpponent = null;
    assignZooNames();
    closeSaveLoadMenu();
    document.getElementById('generateZooOverlay')?.classList.remove('visible');
    removeActionHintOverlay();
    clearYellowExchangeHintOverlays();
    renderAll();
    centerInitialView();
    writeAutoResumeSnapshot(true);
}

function sandboxCardKey(category, level, filename) {
    return `${category}|${level}|${cleanFilename(filename)}`;
}

function sandboxOccupiedRects() {
    const rects = state.enclosures.map(e => ({x:e.x,y:e.y,w:ENCLOSURE_W,h:ENCLOSURE_H}));
    for (const a of state.sandboxLooseAnimals || []) {
        rects.push({x:a.x,y:a.y,w:ANIMAL_W,h:ANIMAL_H});
    }
    return rects;
}

function sandboxFindLoosePosition(w = ANIMAL_W, h = ANIMAL_H) {
    const occupied = sandboxOccupiedRects();
    const centerX = STARTUP_CENTER_X - w / 2;
    const centerY = STARTUP_CENTER_Y + 160;
    for (let ring=0; ring<80; ring++) {
        for (let dx=-ring; dx<=ring; dx++) {
            for (const dy of [-ring, ring]) {
                const x=centerX + dx*(w+20), y=centerY + dy*(h+20);
                const r={x,y,w,h};
                if (x<20||y<20||x+w>WORKSPACE_W-20||y+h>WORKSPACE_H-20) continue;
                if (!occupied.some(o=>rectanglesOverlap(r,o,20))) return {x,y};
            }
        }
        for (let dy=-ring+1; dy<ring; dy++) {
            for (const dx of [-ring, ring]) {
                const x=centerX + dx*(w+20), y=centerY + dy*(h+20);
                const r={x,y,w,h};
                if (x<20||y<20||x+w>WORKSPACE_W-20||y+h>WORKSPACE_H-20) continue;
                if (!occupied.some(o=>rectanglesOverlap(r,o,20))) return {x,y};
            }
        }
    }
    return {x:centerX,y:centerY};
}

function sandboxSpawnAnimal(category, level, filename) {
    if (!state.sandboxMode) return;
    // Sandbox intentionally allows selecting any inventory card directly,
    // independent of normal deck ownership/progression rules.
    const pos = sandboxFindLoosePosition();
    const animal = {
        id: state.nextId++, category, level, filename: cleanFilename(filename),
        enclosureId:null, slotIndex:null, hand:false, sandboxLoose:true,
        x:pos.x, y:pos.y
    };
    state.animals.push(animal);
    state.sandboxLooseAnimals.push(animal);
    state.hand = state.hand.filter(x => x.id !== animal.id);
    renderAll();
}

function sandboxSpawnEnclosure(number) {
    if (!state.sandboxMode) return;
    const pos = sandboxFindLoosePosition(ENCLOSURE_W, ENCLOSURE_H);
    state.enclosures.push({id:state.nextId++, number:Number(number), x:pos.x, y:pos.y});
    renderAll();
}

function renderSandboxLooseAnimals() {
    for (const animal of state.sandboxLooseAnimals || []) {
        if (!animal || animal.enclosureId !== null) continue;
        const wrap=document.createElement('div');
        wrap.className='sandbox-loose-card';
        wrap.style.cssText=`position:absolute;left:${animal.x}px;top:${animal.y}px;width:${ANIMAL_W}px;height:${ANIMAL_H}px;z-index:12;`;
        const img=document.createElement('img');
        setupAnimalCard(img,animal,'sandbox-loose');
        img.style.cssText='width:100%;height:100%;object-fit:contain;';
        wrap.appendChild(img);
        zooCanvas.appendChild(wrap);
    }
}

function ensureSandboxPicker() {
    if (sandboxPickerOverlay) return;
    sandboxPickerOverlay=document.createElement('div');
    sandboxPickerOverlay.id='sandboxPickerOverlay';
    sandboxPickerOverlay.style.cssText='position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,.58);z-index:10035;padding:18px;box-sizing:border-box;';
    sandboxPickerOverlay.innerHTML=`<div style="width:min(900px,96vw);max-height:88vh;overflow:auto;background:#f4efe2;color:#222;border-radius:10px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.45);">
      <div style="display:flex;gap:10px;align-items:center"><h2 id="sandboxPickerTitle" style="flex:1;margin:0">Sandbox</h2><button id="sandboxPickerClose" type="button">Close</button></div>
      <input id="sandboxPickerSearch" type="search" placeholder="Search cards..." style="width:100%;box-sizing:border-box;margin:14px 0 10px;padding:9px">
      <div id="sandboxPickerCards"></div></div>`;
    document.body.appendChild(sandboxPickerOverlay);
    sandboxPickerOverlay.querySelector('#sandboxPickerClose').onclick=()=>sandboxPickerOverlay.style.display='none';
    sandboxPickerOverlay.addEventListener('pointerdown',e=>{if(e.target===sandboxPickerOverlay)sandboxPickerOverlay.style.display='none';});
}

function openSandboxAnimalPicker(level) {
    ensureSandboxPicker();
    const title=sandboxPickerOverlay.querySelector('#sandboxPickerTitle');
    const search=sandboxPickerOverlay.querySelector('#sandboxPickerSearch');
    const body=sandboxPickerOverlay.querySelector('#sandboxPickerCards');
    title.textContent=`Draw Level ${level}`;
    search.style.display='';
    search.value='';
    const draw=()=>{
        const q=search.value.trim().toLowerCase();
        body.innerHTML='';
        for (const category of CATEGORY_PROGRESSION_ORDER) {
            const files=levelFiles(category,level).filter(f=>!q||String(f).replace(/\.png$/i,'').toLowerCase().includes(q));
            if(!files.length) continue;
            const h=document.createElement('h3'); h.textContent=category; body.appendChild(h);
            const grid=document.createElement('div');
            grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:10px;margin-bottom:18px;';
            for(const filename of files){
                const b=document.createElement('button'); b.type='button'; b.title=String(filename).replace(/\.png$/i,'');
                b.style.cssText='padding:5px;background:#fff;border:1px solid #999;border-radius:6px;cursor:pointer;';
                const img=document.createElement('img'); img.src=animalPath(category,level,filename); img.style.cssText='width:100%;height:auto;display:block;';
                b.appendChild(img);
                b.onclick=()=>{sandboxSpawnAnimal(category,level,filename); sandboxPickerOverlay.style.display='none';};
                grid.appendChild(b);
            }
            body.appendChild(grid);
        }
    };
    search.oninput=draw; draw();
    sandboxPickerOverlay.style.display='flex';
}

function openSandboxEnclosurePicker() {
    ensureSandboxPicker();
    sandboxPickerOverlay.querySelector('#sandboxPickerTitle').textContent='Draw Enclosure Card';
    const search=sandboxPickerOverlay.querySelector('#sandboxPickerSearch');
    search.style.display='none';
    const body=sandboxPickerOverlay.querySelector('#sandboxPickerCards');
    body.innerHTML='';
    const grid=document.createElement('div');
    grid.style.cssText='display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;margin-top:14px;';
    for(let number=1;number<=10;number++){
        const b=document.createElement('button'); b.type='button'; b.style.cssText='padding:5px;background:#fff;border:1px solid #999;border-radius:6px;cursor:pointer;';
        const img=document.createElement('img'); img.src=enclosurePath(number); img.style.cssText='width:100%;height:auto;display:block;';
        b.appendChild(img); b.onclick=()=>{sandboxSpawnEnclosure(number);sandboxPickerOverlay.style.display='none';}; grid.appendChild(b);
    }
    body.appendChild(grid); sandboxPickerOverlay.style.display='flex';
}

function renderSandboxToolbar() {
    if (!sandboxToolbarInstalled) {
        const parent=exchange1.parentElement;
        if (parent) {
            const bar=document.createElement('div');
            bar.id='sandboxToolbar';
            bar.style.cssText='display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;';
            for(let level=1;level<=5;level++){
                const b=document.createElement('button'); b.type='button'; b.textContent=`Draw Level ${level}`;
                b.onclick=()=>openSandboxAnimalPicker(level); bar.appendChild(b);
            }
            const e=document.createElement('button'); e.type='button'; e.textContent='Draw Enclosure Card'; e.onclick=openSandboxEnclosurePicker; bar.appendChild(e);
            parent.insertBefore(bar,exchange1);
        }
        sandboxToolbarInstalled=true;
    }
    const bar=document.getElementById('sandboxToolbar');
    if(bar) bar.style.display='flex';
    exchange1.style.display='none'; exchange2.style.display='none'; resultBox.style.display='none';
    if(drawCard) drawCard.style.display='none';
}

function restoreNormalActionBoxesIfNeeded() {
    const bar=document.getElementById('sandboxToolbar');
    if(bar) bar.style.display='none';
    exchange1.style.display=''; exchange2.style.display=''; resultBox.style.display='';
    if(drawCard) drawCard.style.display='';
}

// ============================================================
// GAME OPTIONS — CATEGORY FILTERS
// ============================================================
function startFreshZooFromCurrentOptions() {
    // New Game deliberately keeps the options currently selected in this
    // session. It only replaces the zoo itself. The previous automatic resume
    // point must not bring the old zoo back after a refresh.
    clearAutoResumeSnapshot();
    assignZooNames();
    createStartingZoo();
    assignOpponentProfiles();
    renderAll();
    centerInitialView();
}

// ============================================================
// V166 — GENERATE ZOO / NEW GAME SETUP
// ============================================================
function zooSetupCountries() {
    const places = state.zooNamesData?.places;
    if (!places || typeof places !== 'object' || Array.isArray(places)) return [];
    return Object.keys(places).sort((a, b) => a.localeCompare(b));
}

function flattenZooSetupLocations(value, output = []) {
    if (Array.isArray(value)) {
        for (const item of value) {
            if (typeof item === 'string' && item.trim()) output.push(item.trim());
            else if (item && typeof item === 'object') flattenZooSetupLocations(item, output);
        }
    } else if (value && typeof value === 'object') {
        for (const child of Object.values(value)) flattenZooSetupLocations(child, output);
    }
    return [...new Set(output)];
}

function zooSetupLocations(country) {
    return flattenZooSetupLocations(state.zooNamesData?.places?.[country]);
}

function zooSetupProvinceForLocation(country, location) {
    const root = state.zooNamesData?.places?.[country];
    const wanted = normaliseGeographyPart(location);
    if (!root || !wanted) return '';

    function containsLocation(node) {
        if (Array.isArray(node)) {
            return node.some(item =>
                typeof item === 'string' && normaliseGeographyPart(item) === wanted
            );
        }
        if (!node || typeof node !== 'object') return false;
        return Object.values(node).some(containsLocation);
    }

    if (Array.isArray(root)) return '';
    for (const [province, contents] of Object.entries(root)) {
        if (containsLocation(contents)) return province;
    }
    return '';
}

function zooSetupPrefixGroups(country, location = '') {
    const root = state.zooNamesData?.prefixes?.[country];
    if (!root || typeof root !== 'object') return [];

    const types = new Set(['general','aquarium','tropical','safari','forest','farm','bird','raptor','reptile','alpine']);
    const groups = [];

    function visit(node) {
        if (!node || typeof node !== 'object') return;
        for (const [key, value] of Object.entries(node)) {
            if (types.has(key) && Array.isArray(value)) {
                for (const prefix of value) {
                    if (typeof prefix === 'string' && prefix.trim()) {
                        groups.push({ prefix: prefix.trim(), zooType: key });
                    }
                }
            } else if (value && typeof value === 'object') {
                visit(value);
            }
        }
    }
    visit(root);
    return groups;
}

function generateZooSetupIdentity(country, keepCountry = true) {
    const countries = zooSetupCountries();
    const chosenCountry =
        keepCountry && country && countries.includes(country)
            ? country
            : (countries.length ? randomItem(countries) : 'Netherlands');

    const locations = zooSetupLocations(chosenCountry);
    const location = locations.length ? randomItem(locations) : chosenCountry;
    const groups = zooSetupPrefixGroups(chosenCountry, location);
    const choice = groups.length
        ? randomItem(groups)
        : { prefix: 'Zoo', zooType: 'general' };

    return {
        country: chosenCountry,
        location,
        province: zooSetupProvinceForLocation(chosenCountry, location),
        zooName: `${choice.prefix} ${location}`.replace(/\s+/g, ' ').trim(),
        zooType: choice.zooType || 'general'
    };
}

function inferZooTypeFromGeneratedName(country, zooName) {
    const name = String(zooName || '').trim().toLowerCase();
    if (!name) return 'general';

    const groups = zooSetupPrefixGroups(country);
    const match = groups
        .filter(item => name.includes(item.prefix.toLowerCase()))
        .sort((a, b) => b.prefix.length - a.prefix.length)[0];

    return match?.zooType || 'general';
}

function inferZooTypeFromAnyGeneratedName(zooName) {
    const name = String(zooName || '').trim().toLowerCase();
    if (!name) return 'general';
    const matches = zooSetupCountries().flatMap(country => zooSetupPrefixGroups(country))
        .filter(item => name.includes(item.prefix.toLowerCase()))
        .sort((a, b) => b.prefix.length - a.prefix.length);
    return matches[0]?.zooType || 'general';
}

function ensureGenerateZooUI() {
    let overlay = document.getElementById('generateZooOverlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'generateZooOverlay';
    overlay.className = 'game-options-overlay';
    overlay.innerHTML = `
        <div class="game-options-modal new-zoo-modal">
            <div class="new-zoo-heading-row">
                <h2>New Zoo:</h2>
                <div class="new-zoo-name-display">
                    <strong id="generateZooNameDisplay"></strong>
                    <button type="button" class="new-zoo-edit-name" id="editZooName" title="Edit zoo name" aria-label="Edit zoo name">✎</button>
                    <button type="button" class="new-zoo-randomize" id="randomizeZooName" title="Randomize zoo name" aria-label="Randomize zoo name">↻</button>
                </div>
            </div>

            <div class="advanced-game-rules">
                <label class="new-zoo-country-row">
                    <span>Country</span>
                    <span class="new-zoo-field-with-random">
                        <span class="new-zoo-country-picker" id="generateZooCountryPicker">
                            <button type="button" class="new-zoo-country-trigger" id="generateZooCountryTrigger" aria-haspopup="listbox" aria-expanded="false"></button>
                            <span class="new-zoo-country-menu" id="generateZooCountryMenu" role="listbox"></span>
                        </span>
                        <select id="generateZooCountry" class="new-zoo-hidden-select" aria-hidden="true" tabindex="-1"></select>
                        <button type="button" class="new-zoo-randomize" id="randomizeZooCountry" title="Randomize country" aria-label="Randomize country">↻</button>
                    </span>
                </label>
                <label class="new-zoo-location-row">
                    <span>Location</span>
                    <span class="new-zoo-location-display">
                        <strong id="generateZooLocationDisplay"></strong>
                        <button type="button" class="new-zoo-edit-location" id="editZooLocation" title="Edit location" aria-label="Edit location">✎</button>
                        <button type="button" class="new-zoo-randomize" id="randomizeZooLocation" title="Randomize location" aria-label="Randomize location">↻</button>
                    </span>
                </label>
                <input id="generateZooLocation" class="new-zoo-hidden-editor" type="text" autocomplete="off">
                <input id="generateZooName" class="new-zoo-hidden-editor" type="text" autocomplete="off">
                <label class="trade-frequency-option new-zoo-size-option">
                    <span>Starting Size</span>
                    <input id="newZooSize" type="range" min="0" max="100" step="1" value="20">
                    <button type="button" class="new-zoo-size-reset" id="resetNewZooSize" title="Reset starting size" aria-label="Reset starting size">↻</button>
                    <span id="newZooSizeValue" class="new-zoo-size-value" aria-hidden="true"></span>
                </label>
                <div class="advanced-options-note" id="newZooSizeNote"></div>
            </div>

            <div class="new-zoo-inline-editor" id="newZooInlineEditor" aria-hidden="true">
                <div class="new-zoo-inline-editor-card">
                    <label id="newZooInlineEditorLabel" for="newZooInlineEditorInput"></label>
                    <input id="newZooInlineEditorInput" type="text" autocomplete="off">
                    <div class="new-zoo-inline-editor-actions">
                        <button type="button" id="newZooInlineEditorCancel">Cancel</button>
                        <button type="button" id="newZooInlineEditorSave">Save</button>
                    </div>
                </div>
            </div>

            <div class="options-actions new-zoo-actions" style="flex-wrap:wrap">
                <button type="button" id="newZooSandbox" style="margin-right:auto">Sandbox Mode</button>
                <button type="button" id="generateZooCancel">Cancel</button>
                <button type="button" id="generateZooStart">Open New Zoo</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const country = overlay.querySelector('#generateZooCountry');
    const countryTrigger = overlay.querySelector('#generateZooCountryTrigger');
    const countryMenu = overlay.querySelector('#generateZooCountryMenu');
    const location = overlay.querySelector('#generateZooLocation');
    const zooName = overlay.querySelector('#generateZooName');
    const zooNameDisplay = overlay.querySelector('#generateZooNameDisplay');
    const locationDisplay = overlay.querySelector('#generateZooLocationDisplay');
    const zooSize = overlay.querySelector('#newZooSize');
    const zooSizeValue = overlay.querySelector('#newZooSizeValue');
    const zooSizeNote = overlay.querySelector('#newZooSizeNote');

    function updateZooSizePreview() {
        const collectionRules = startingCollectionSizeRules(zooSize.value);
        const enclosureRules = startingZooSizeRules(zooSize.value);
        const possibleLevels = Object.entries(collectionRules.levelChances)
            .filter(([, chance]) => chance > 0)
            .map(([level]) => Number(level));
        const maxLevel = possibleLevels.length ? Math.max(...possibleLevels) : 1;
        zooSizeValue.textContent = '';
        zooSizeNote.textContent =
            `${collectionRules.species} starting animals · cards up to Level ${maxLevel} · ` +
            `${enclosureRules.maxSpaces} starting enclosure spaces`;
    }

    zooSize.addEventListener('input', updateZooSizePreview);

    function countryFlagEmoji(name) {
        const codes = {
            'Albania':'AL','Andorra':'AD','Austria':'AT','Belarus':'BY','Belgium':'BE',
            'Bosnia and Herzegovina':'BA','Bulgaria':'BG','Croatia':'HR','Cyprus':'CY',
            'Czech Republic':'CZ','Czechia':'CZ','Denmark':'DK','Estonia':'EE','Finland':'FI',
            'France':'FR','Germany':'DE','Greece':'GR','Hungary':'HU','Iceland':'IS',
            'Ireland':'IE','Italy':'IT','Kosovo':'XK','Latvia':'LV','Liechtenstein':'LI',
            'Lithuania':'LT','Luxembourg':'LU','Malta':'MT','Moldova':'MD','Monaco':'MC',
            'Montenegro':'ME','Netherlands':'NL','North Macedonia':'MK','Norway':'NO',
            'Poland':'PL','Portugal':'PT','Romania':'RO','Russia':'RU','San Marino':'SM',
            'Serbia':'RS','Slovakia':'SK','Slovenia':'SI','Spain':'ES','Sweden':'SE',
            'Switzerland':'CH','Ukraine':'UA','United Kingdom':'GB','Vatican City':'VA',
            'United States':'US','Canada':'CA','Mexico':'MX','Brazil':'BR','Argentina':'AR',
            'Chile':'CL','Peru':'PE','Colombia':'CO','Ecuador':'EC','Venezuela':'VE',
            'Australia':'AU','New Zealand':'NZ','Japan':'JP','China':'CN','India':'IN',
            'Indonesia':'ID','Malaysia':'MY','Singapore':'SG','Thailand':'TH','Vietnam':'VN',
            'Philippines':'PH','South Korea':'KR','Taiwan':'TW','Israel':'IL','Turkey':'TR',
            'United Arab Emirates':'AE','South Africa':'ZA','Kenya':'KE','Tanzania':'TZ',
            'Morocco':'MA','Egypt':'EG','Tunisia':'TN'
        };
        const code = codes[name];
        if (!code) return '🌐';
        return code.replace(/[A-Z]/g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
    }

    function setCountryMenuOpen(open) {
        countryMenu.classList.toggle('visible', open);
        countryTrigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function selectCountry(value, regenerate = true) {
        if (![...country.options].some(option => option.value === value)) return;
        country.value = value;
        countryTrigger.textContent = `${countryFlagEmoji(value)} ${value}`;
        setCountryMenuOpen(false);
        if (regenerate) applyIdentity(generateZooSetupIdentity(value, true));
    }

    function refreshCountries(preferred) {
        const countries = zooSetupCountries();
        const pool = countries.length ? countries : ['Netherlands'];
        country.innerHTML = '';
        countryMenu.innerHTML = '';

        for (const value of pool) {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            country.appendChild(option);
        }

        const addCountryButton = (value, sticky = false) => {
            if (!pool.includes(value)) return;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `new-zoo-country-option${sticky ? ' sticky-option' : ''}`;
            button.dataset.country = value;
            button.setAttribute('role', 'option');
            button.textContent = `${countryFlagEmoji(value)} ${value}`;
            button.addEventListener('click', () => selectCountry(value, true));
            countryMenu.appendChild(button);
        };

        const sticky = ['Netherlands', 'Germany', 'United Kingdom'];
        const stickyWrap = document.createElement('span');
        stickyWrap.className = 'new-zoo-country-sticky';
        countryMenu.appendChild(stickyWrap);
        for (const value of sticky) {
            if (!pool.includes(value)) continue;
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'new-zoo-country-option sticky-option';
            button.textContent = `${countryFlagEmoji(value)} ${value}`;
            button.addEventListener('click', () => selectCountry(value, true));
            stickyWrap.appendChild(button);
        }

        const list = document.createElement('span');
        list.className = 'new-zoo-country-scroll-list';
        countryMenu.appendChild(list);
        for (const value of pool) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'new-zoo-country-option';
            button.textContent = `${countryFlagEmoji(value)} ${value}`;
            button.addEventListener('click', () => selectCountry(value, true));
            list.appendChild(button);
        }

        country.value = pool.includes(preferred) ? preferred : pool[0];
        countryTrigger.textContent = `${countryFlagEmoji(country.value)} ${country.value}`;
    }

    function applyIdentity(identity) {
        refreshCountries(identity.country);
        country.value = identity.country;
        location.value = identity.location;
        zooName.value = identity.zooName;
        locationDisplay.textContent = identity.location;
        zooNameDisplay.textContent = identity.zooName;
        overlay.dataset.generatedZooType = identity.zooType || 'general';
        overlay.dataset.generatedZooCountry = identity.country;
        overlay.dataset.generatedZooLocation = identity.location;
        overlay.dataset.generatedZooProvince = identity.province ||
            zooSetupProvinceForLocation(identity.country, identity.location);
    }

    function normalizeZooIdentityText(value) {
        return String(value || '')
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    }

    function updateInferredType() {
        const fullName = zooName.value.trim();
        const normalizedName = normalizeZooIdentityText(fullName);
        const normalizedLocation = normalizeZooIdentityText(location.value);

        // Start with the existing generator-aware type inference.
        let inferred = inferZooTypeFromGeneratedName(country.value, fullName);
        let bestMatchLength = -1;

        // Then silently check the complete edited name against every known
        // prefix for this country. Longest match wins.
        for (const item of zooSetupPrefixGroups(country.value, location.value)) {
            const prefix = String(item?.prefix || '').trim();
            const normalizedPrefix = normalizeZooIdentityText(prefix);
            if (!normalizedPrefix) continue;
            if ((normalizedName === normalizedPrefix ||
                 normalizedName.startsWith(`${normalizedPrefix} `)) &&
                normalizedPrefix.length > bestMatchLength) {
                bestMatchLength = normalizedPrefix.length;
                inferred = item.zooType || inferred;
            }
        }

        overlay.dataset.generatedZooType = inferred || 'general';
        overlay.dataset.generatedZooCountry = country.value;
        overlay.dataset.generatedZooLocation = location.value.trim();

        // The place database is grouped by country -> province/region -> place.
        // Resolve the selected place through that tree rather than expecting
        // the province name to appear in the visible zoo name.
        const matchedRegion = zooSetupProvinceForLocation(
            country.value,
            location.value.trim()
        );

        overlay.dataset.generatedZooProvince = matchedRegion;
        overlay.dataset.generatedZooRegion = matchedRegion;
    }

    countryTrigger.addEventListener('click', event => {
        event.stopPropagation();
        setCountryMenuOpen(!countryMenu.classList.contains('visible'));
    });
    countryMenu.addEventListener('click', event => event.stopPropagation());
    document.addEventListener('pointerdown', () => setCountryMenuOpen(false));
    zooName.addEventListener('input', updateInferredType);

    overlay.querySelector('#randomizeZooCountry').addEventListener('click', () => {
        const countries = zooSetupCountries();
        const alternatives = countries.filter(value => value !== country.value);
        const nextCountry = randomItem(alternatives.length ? alternatives : countries) || country.value;
        applyIdentity(generateZooSetupIdentity(nextCountry, true));
    });
    overlay.querySelector('#randomizeZooLocation').addEventListener('click', () => {
        // New location means a fully regenerated matching identity.
        const identity = generateZooSetupIdentity(country.value, true);
        location.value = identity.location;
        locationDisplay.textContent = identity.location;
        zooName.value = identity.zooName;
        zooNameDisplay.textContent = identity.zooName;
        overlay.dataset.generatedZooType = identity.zooType || 'general';
        overlay.dataset.generatedZooProvince = identity.province ||
            zooSetupProvinceForLocation(country.value, identity.location);
    });
    overlay.querySelector('#randomizeZooName').addEventListener('click', () => {
        // Keep the current location; only choose a fresh prefix/type.
        const groups = zooSetupPrefixGroups(country.value, location.value);
        const current = zooName.value.trim();
        let choices = groups;
        if (groups.length > 1) {
            choices = groups.filter(item =>
                `${item.prefix} ${location.value}`.replace(/\s+/g, ' ').trim() !== current
            );
        }
        const choice = randomItem(choices.length ? choices : groups) || { prefix:'Zoo', zooType:'general' };
        const nextName = `${choice.prefix} ${location.value}`.replace(/\s+/g, ' ').trim();
        zooName.value = nextName;
        zooNameDisplay.textContent = nextName;
        overlay.dataset.generatedZooType = choice.zooType || 'general';
    });

    const inlineEditor = overlay.querySelector('#newZooInlineEditor');
    const inlineEditorLabel = overlay.querySelector('#newZooInlineEditorLabel');
    const inlineEditorInput = overlay.querySelector('#newZooInlineEditorInput');
    let inlineEditorTarget = null;

    function closeInlineEditor() {
        inlineEditor.classList.remove('visible');
        inlineEditor.setAttribute('aria-hidden', 'true');
        inlineEditorTarget = null;
    }

    function openInlineEditor(kind) {
        inlineEditorTarget = kind;
        const isName = kind === 'name';
        inlineEditorLabel.textContent = isName ? 'Zoo Name' : 'Location';
        inlineEditorInput.placeholder = isName ? 'Full zoo name' : 'Location';
        inlineEditorInput.value = isName ? zooName.value : location.value;
        inlineEditor.classList.add('visible');
        inlineEditor.setAttribute('aria-hidden', 'false');
        requestAnimationFrame(() => {
            inlineEditorInput.focus();
            inlineEditorInput.select();
        });
    }

    function saveInlineEditor() {
        const clean = inlineEditorInput.value.trim();
        if (!clean || !inlineEditorTarget) return;
        if (inlineEditorTarget === 'name') {
            zooName.value = clean;
            zooNameDisplay.textContent = clean;
            updateInferredType();
        } else {
            location.value = clean;
            locationDisplay.textContent = clean;
            updateInferredType();
        }
        closeInlineEditor();
    }

    overlay.querySelector('#editZooName').addEventListener('click', () => openInlineEditor('name'));
    overlay.querySelector('#editZooLocation').addEventListener('click', () => openInlineEditor('location'));
    overlay.querySelector('#newZooInlineEditorCancel').addEventListener('click', closeInlineEditor);
    overlay.querySelector('#newZooInlineEditorSave').addEventListener('click', saveInlineEditor);
    inlineEditorInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') saveInlineEditor();
        if (event.key === 'Escape') closeInlineEditor();
    });
    inlineEditor.addEventListener('pointerdown', event => {
        if (event.target === inlineEditor) closeInlineEditor();
    });

    overlay.querySelector('#resetNewZooSize').addEventListener('click', () => {
        zooSize.value = '20';
        updateZooSizePreview();
    });
    overlay.querySelector('#newZooSandbox').addEventListener('click', () => {
        startSandboxMode();
    });
    overlay.querySelector('#generateZooCancel').addEventListener('click', () => {
        overlay.classList.remove('visible');
        resumeHintGlowsAfterMenu();
    });
    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay) {
            overlay.classList.remove('visible');
            resumeHintGlowsAfterMenu();
        }
    });

    overlay.querySelector('#generateZooStart').addEventListener('click', () => {
        const finalName = zooName.value.trim();
        const finalLocation = location.value.trim();
        if (!finalName) {
            alert('Please enter a zoo name.');
            zooName.focus();
            return;
        }
        if (!finalLocation) {
            alert('Please enter a location.');
            location.focus();
            return;
        }

        clearAutoResumeSnapshot();

        // Install the identity before startup animals are selected so the
        // chosen zoo type can bias that collection.
        state.zooName = finalName;
        state.zooCountry = country.value;
        state.zooProvince = overlay.dataset.generatedZooProvince ||
            zooSetupProvinceForLocation(country.value, finalLocation);
        state.zooLocation = finalLocation;
        state.zooType = inferZooTypeFromGeneratedName(country.value, finalName);
        const selectedZooSize = Math.max(0, Math.min(100, Math.round(Number(zooSize.value))));
        state.gameOptions.startingCollectionSize = selectedZooSize;
        state.gameOptions.startingZooSize = selectedZooSize;
        saveGameOptions();
        createStartingZoo();

        assignOpponentProfiles();
        createZooNameEditor();
        renderAll();
        centerInitialView();
        writeAutoResumeSnapshot(true);

        overlay.classList.remove('visible');
        resumeHintGlowsAfterMenu();
    });

    overlay._applyZooIdentity = applyIdentity;
    overlay._syncZooSize = () => {
        // New Zoo always opens at the standard 20% preset. The user's previous
        // zoo size is deliberately not carried into the next New Zoo dialog.
        zooSize.value = 20;
        updateZooSizePreview();
    };
    return overlay;
}

function openGenerateZooMenu() {
    pauseAllHintGlowsForMenu();
    const overlay = ensureGenerateZooUI();

    const countries = zooSetupCountries();
    const rememberedCountry =
        state.zooCountry && countries.includes(state.zooCountry)
            ? state.zooCountry
            : (countries.includes('Netherlands') ? 'Netherlands' : countries[0]);

    overlay._applyZooIdentity(generateZooSetupIdentity(rememberedCountry, true));
    overlay._syncZooSize();
    overlay.classList.add('visible');
}

function requestNewGame() {
    if (state.historyViewTurn !== null) {
        exitHistoryView(true);
    }

    // New Game opens the dedicated New Zoo setup instead of
    // immediately replacing the zoo or routing through Save / Load.
    openGenerateZooMenu();
}

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

        const newGameButton = document.createElement('button');
        newGameButton.id = 'newGameButton';
        newGameButton.type = 'button';
        newGameButton.textContent = 'New Game';
        newGameButton.className = 'game-options-button';
        newGameButton.addEventListener('click', requestNewGame);
        headerLeft.insertBefore(newGameButton, button);


    }

    const overlay = document.createElement('div');
    overlay.id = 'gameOptionsOverlay';
    overlay.className = 'game-options-overlay';
    overlay.innerHTML = `
        <div class="game-options-modal">
            <h2>Game Options</h2>
            <p>Choose gameplay preferences and which animal categories may appear.</p>

            <div class="advanced-game-rules" id="advancedGameRules">
                <label class="glow-option">
                    <span>Eligibility glows</span>
                    <input id="optEligibilityGlows" type="checkbox" checked>
                </label>
                <div class="advanced-options-note">Shows yellow upgrade-ready glows and blue trade-interest glows.</div>
                <label><span>Language</span><select id="optAnimalLanguage"><option value="en">English</option><option value="nl">Nederlands</option></select></label>
                <div class="advanced-options-note">Dutch translation covers all Level 1 and Level 2 animal cards, card categories, menus and on-screen interface text.</div>
                <label class="reward-milestones-option">
                    <span>New enclosure reward milestones</span>
                    <input id="optRewardMilestones" type="text" placeholder="1, 2, 3, 4, 6, 9">
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

            <div class="options-actions">
                <button type="button" id="resetGameOptionsChanges">Reset Changes</button>
                <span style="flex:1 1 auto;"></span>
                <button type="button" id="cancelGameOptions">Cancel</button>
                <button type="button" id="applyGameOptions">Apply</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);

    const list = overlay.querySelector('#categoryOptionList');
    const eligibilityGlowsInput = overlay.querySelector('#optEligibilityGlows');
    const animalLanguageInput = overlay.querySelector('#optAnimalLanguage');
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
        eligibilityGlowsInput.checked = state.gameOptions.showEligibilityGlows !== false;
        animalLanguageInput.value = state.gameOptions.animalLanguage === 'nl' ? 'nl' : 'en';
        milestonesInput.value = state.gameOptions.enclosureRewardMilestones.join(', ');
        opponentModeInput.value = state.gameOptions.opponentMode;
        tradeFrequencyInput.value = state.gameOptions.tradeOfferFrequency;
        tradeFrequencyValue.textContent = `${Math.round(state.gameOptions.tradeOfferFrequency)}%`;
        for (const cb of list.querySelectorAll('input[type="checkbox"]')) {
            cb.checked = state.activeCategories.has(cb.value);
        }
    }

    function open() {
        pauseAllHintGlowsForMenu();
        syncInputs();
        overlay.classList.add('visible');
    }

    function close() {
        overlay.classList.remove('visible');
        resumeHintGlowsAfterMenu();
    }

    button.addEventListener('click', open);
    overlay.querySelector('#cancelGameOptions').addEventListener('click', close);

    overlay.querySelector('#resetGameOptionsChanges').addEventListener('click', () => {
        // Restore the standard/default option values in the menu only.
        // The player can still Cancel, or press Apply to commit them.
        eligibilityGlowsInput.checked = true;
        animalLanguageInput.value = 'en';
        milestonesInput.value = '1, 2, 3, 4, 6, 9';
        opponentModeInput.value = 'real';
        tradeFrequencyInput.value = 50;
        tradeFrequencyValue.textContent = '50%';

        for (const cb of list.querySelectorAll('input[type="checkbox"]')) {
            cb.checked = true;
        }

    });

    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay) close();
    });

    overlay.querySelector('#applyGameOptions').addEventListener('click', () => {
        const selected = [...list.querySelectorAll('input[type="checkbox"]:checked')]
            .map(cb => cb.value);

        if (!selected.length) {
            alert(uiText('At least one animal category must remain enabled.'));
            return;
        }

        const showEligibilityGlows = eligibilityGlowsInput.checked;
        const animalLanguage = animalLanguageInput.value === 'nl' ? 'nl' : 'en';
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
            showEligibilityGlows === (state.gameOptions.showEligibilityGlows !== false) &&
            animalLanguage === (state.gameOptions.animalLanguage === 'nl' ? 'nl' : 'en') &&
            milestones.join(',') === state.gameOptions.enclosureRewardMilestones.join(',') &&
            opponentMode === state.gameOptions.opponentMode &&
            tradeOfferFrequency === state.gameOptions.tradeOfferFrequency;

        if (categoriesSame && rulesSame) {
            close();
            return;
        }

        const milestonesChanged =
            milestones.join(',') !== state.gameOptions.enclosureRewardMilestones.join(',');
        let applyMilestonesRetroactively = false;

        if (milestonesChanged) {
            const oldAwardedCount = (state.awardedProgressMilestones || new Set()).size;
            const expectedCount = progressionRewardKeysForMilestones(milestones).size;
            const difference = expectedCount - oldAwardedCount;

            if (difference !== 0) {
                const actionText = difference > 0
                    ? `This would immediately add ${difference} enclosure card${difference===1?'':'s'} to your current zoo.`
                    : `This would immediately remove ${-difference} enclosure card${difference===-1?'':'s'} from your current zoo, using completely empty enclosures only.`;

                applyMilestonesRetroactively = confirm(
                    `The new enclosure milestones change rewards your current zoo would already have earned.

` +
                    `${actionText}

` +
                    `OK = Recalculate the current zoo now
` +
                    `Cancel = Use the new milestones from this point onward`
                );
            }
        }

        state.activeCategories = new Set(selected);
        state.gameOptions.showEligibilityGlows = showEligibilityGlows;
        state.gameOptions.animalLanguage = animalLanguage;
        setTimeout(localizeDocument, 0);
        state.gameOptions.enclosureRewardMilestones = milestones;
        if (milestonesChanged) {
            applyMilestonesToCurrentZoo(milestones, applyMilestonesRetroactively);
        }
        state.gameOptions.opponentMode = opponentMode;
        state.gameOptions.tradeOfferFrequency = tradeOfferFrequency;
        saveGameOptions();

        // Game Options now contains only live, non-size preferences.
        assignOpponentProfiles();
        renderAll();

        close();
    });
}

// ============================================================
// REAL ZOO OPPONENTS
// ============================================================
function isRealOpponentMode() {
    return state.gameOptions.opponentMode === 'real';
}

const ZOO_PRESTIGE_BY_LEVEL = Object.freeze({ 1: 1, 2: 4, 3: 12, 4: 36, 5: 144 });
const REAL_ZOO_ANIMAL_LEVEL_CACHE = new Map();

// same province, adjacent domestic, adjacent foreign, farther domestic,
// farther Europe. Rows are smoothly interpolated between prestige anchors.
const REAL_ZOO_GEOGRAPHY_PRESTIGE_CURVE = Object.freeze([
    { prestige: 8,   weights: [70, 20, 10, 0, 0] },
    { prestige: 25,  weights: [60, 25, 12, 8, 2] },
    { prestige: 70,  weights: [50, 28, 16, 18, 8] },
    { prestige: 160, weights: [40, 28, 20, 24, 14] },
    { prestige: 350, weights: [32, 26, 22, 24, 18] },
    { prestige: 700, weights: [22, 21, 20, 21, 20] }
]);

function currentZooPrestige() {
    return (state.animals || []).reduce((total, animal) => {
        if (!animal || animal.enclosureId === null) return total;
        return total + (ZOO_PRESTIGE_BY_LEVEL[Number(animal.level)] || 0);
    }, 0);
}

function updateHighestZooPrestige() {
    state.highestZooPrestige = Math.max(
        Number(state.highestZooPrestige) || 0,
        currentZooPrestige()
    );
    return state.highestZooPrestige;
}

function interpolatedPrestigeWeights(curve, prestige = updateHighestZooPrestige()) {
    if (prestige <= curve[0].prestige) return [...curve[0].weights];
    const last = curve[curve.length - 1];
    if (prestige >= last.prestige) return [...last.weights];

    for (let i = 1; i < curve.length; i++) {
        const upper = curve[i];
        if (prestige > upper.prestige) continue;
        const lower = curve[i - 1];
        const span = upper.prestige - lower.prestige;
        const fraction = span > 0 ? (prestige - lower.prestige) / span : 0;
        return lower.weights.map((weight, index) =>
            weight + (upper.weights[index] - weight) * fraction
        );
    }
    return [...last.weights];
}

function realZooRecordsAvailable() {
    return (state.realZooData?.zoos || []).filter(zoo =>
        Array.isArray(zoo.animals) && zoo.animals.length
    );
}

function normaliseGeographyPart(value) {
    return String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function provinceGraphKey(country, province) {
    return `${String(country || '').trim()}|${String(province || '').trim()}`;
}

function resolveProvinceGraphKey(country, province) {
    const exact = provinceGraphKey(country, province);
    const graph = state.provinceConnections?.provinces || {};
    if (graph[exact]) return exact;

    const aliases = state.provinceConnections?.aliases || {};
    if (aliases[exact] && graph[aliases[exact]]) return aliases[exact];

    const wantedCountry = normaliseGeographyPart(country);
    const wantedProvince = normaliseGeographyPart(province);
    const normalisedAlias = Object.entries(aliases).find(([alias]) => {
        const split = String(alias).split('|');
        return normaliseGeographyPart(split.shift()) === wantedCountry &&
            normaliseGeographyPart(split.join('|')) === wantedProvince;
    });
    if (normalisedAlias && graph[normalisedAlias[1]]) return normalisedAlias[1];

    return Object.keys(graph).find(key => {
        const node = graph[key] || {};
        return normaliseGeographyPart(node.country) === wantedCountry &&
            normaliseGeographyPart(node.province) === wantedProvince;
    }) || '';
}

function provinceGraphDistance(fromCountry, fromProvince, toCountry, toProvince) {
    const from = resolveProvinceGraphKey(fromCountry, fromProvince);
    const to = resolveProvinceGraphKey(toCountry, toProvince);
    if (!from || !to) return Number.POSITIVE_INFINITY;
    if (from === to) return 0;

    const cacheKey = `${from}->${to}`;
    if (state.provinceDistanceCache.has(cacheKey)) {
        return state.provinceDistanceCache.get(cacheKey);
    }

    const graph = state.provinceConnections?.provinces || {};
    const queue = [{ key: from, distance: 0 }];
    const visited = new Set([from]);
    while (queue.length) {
        const current = queue.shift();
        for (const neighbour of graph[current.key]?.neighbours || []) {
            if (visited.has(neighbour) || !graph[neighbour]) continue;
            const distance = current.distance + 1;
            if (neighbour === to) {
                state.provinceDistanceCache.set(cacheKey, distance);
                state.provinceDistanceCache.set(`${to}->${from}`, distance);
                return distance;
            }
            visited.add(neighbour);
            queue.push({ key: neighbour, distance });
        }
    }
    state.provinceDistanceCache.set(cacheKey, Number.POSITIVE_INFINITY);
    return Number.POSITIVE_INFINITY;
}

function realZooGeographyBand(record) {
    const sameCountry = normaliseGeographyPart(record?.country) ===
        normaliseGeographyPart(state.zooCountry);
    const playerProvinceKey = resolveProvinceGraphKey(
        state.zooCountry,
        state.zooProvince
    );
    const recordProvinceKey = resolveProvinceGraphKey(
        record?.country,
        record?.province
    );
    const sameProvince = sameCountry && playerProvinceKey &&
        playerProvinceKey === recordProvinceKey;
    if (sameProvince) return 0;

    const distance = provinceGraphDistance(
        state.zooCountry,
        state.zooProvince,
        record?.country,
        record?.province
    );
    if (distance === 1) return sameCountry ? 1 : 2;
    return sameCountry ? 3 : 4;
}

function realZooRelationshipLabel(record) {
    if (!record?.country) return '';
    const sameCountry = normaliseGeographyPart(record.country) ===
        normaliseGeographyPart(state.zooCountry);
    if (!sameCountry) return 'FOREIGN';

    const playerProvince = resolveProvinceGraphKey(state.zooCountry, state.zooProvince);
    const zooProvince = resolveProvinceGraphKey(record.country, record.province);
    const sameProvince = playerProvince && zooProvince
        ? playerProvince === zooProvince
        : Boolean(record.province && state.zooProvince) &&
            normaliseGeographyPart(record.province) === normaliseGeographyPart(state.zooProvince);
    if (sameProvince) return 'LOCAL';
    return 'NATIONAL';
}

function realZooLocationLines(record, includeRelationship = false) {
    if (!record) return [];
    const relationship = includeRelationship
        ? realZooRelationshipLabel(record)
        : '';
    const lines = [
        `COUNTRY: ${record.country || 'Unknown'}`,
        `PROVINCE: ${record.province || 'Unknown'}${relationship ? ` (${relationship})` : ''}`
    ];
    return lines;
}

function weightedIndex(weights, roll = Math.random()) {
    const safe = weights.map(weight => Math.max(0, Number(weight) || 0));
    const total = safe.reduce((sum, weight) => sum + weight, 0);
    if (total <= 0) return -1;
    let cursor = Math.max(0, Math.min(0.999999999, roll)) * total;
    for (let index = 0; index < safe.length; index++) {
        cursor -= safe[index];
        if (cursor < 0) return index;
    }
    return safe.length - 1;
}

function realZooAnimalLevelByName(name) {
    const wanted = String(name || '').replace(/\.png$/i, '').trim().toLowerCase();
    if (!wanted) return 0;
    if (REAL_ZOO_ANIMAL_LEVEL_CACHE.has(wanted)) {
        return REAL_ZOO_ANIMAL_LEVEL_CACHE.get(wanted);
    }
    for (const category of Object.keys(FOLDERS)) {
        for (let level = 1; level <= 5; level++) {
            if (levelFiles(category, level).some(file =>
                file.replace(/\.png$/i, '').trim().toLowerCase() === wanted
            )) {
                REAL_ZOO_ANIMAL_LEVEL_CACHE.set(wanted, level);
                return level;
            }
        }
    }
    REAL_ZOO_ANIMAL_LEVEL_CACHE.set(wanted, 0);
    return 0;
}

function realZooPrestige(record) {
    return realZooSessionAnimalNames(record).reduce((total, name) => {
        const level = realZooAnimalLevelByName(name);
        return total + (ZOO_PRESTIGE_BY_LEVEL[level] || 0);
    }, 0);
}

function realZooPrestigeWindow(prestige = updateHighestZooPrestige()) {
    const centre = Math.max(0, Number(prestige) || 0);
    const radius = Math.max(32, 20 + centre * 0.10);
    return {
        centre,
        radius,
        minimum: Math.max(0, centre - radius),
        maximum: centre + radius
    };
}

function realZooPrestigeSimilarityWeight(record, window) {
    const difference = Math.abs(realZooPrestige(record) - window.centre);
    return Math.max(0.10, 1 - difference / (window.radius + 1));
}

// Select without replacement. The prestige window is applied first. Geography
// chooses a band independently of how many zoos that band contains, and the
// chosen band is then weighted by prestige similarity. This keeps local zoos
// dominant without letting a province with many records overpower the stated
// geographical percentages.
function selectPrestigeLocationCandidates(candidates, count, seedText = '') {
    const selected = [];
    const prestige = updateHighestZooPrestige();
    const window = realZooPrestigeWindow(prestige);
    const geographyWeights = interpolatedPrestigeWeights(
        REAL_ZOO_GEOGRAPHY_PRESTIGE_CURVE,
        prestige
    );
    const remaining = candidates.filter(item => {
        const zooPrestige = realZooPrestige(item.record);
        return zooPrestige >= window.minimum && zooPrestige <= window.maximum;
    });

    while (remaining.length && selected.length < count) {
        // Above 700 prestige, locality gradually stops mattering. Below that,
        // the geography roll is made by band rather than by individual zoo.
        const geographyFade = Math.max(0, Math.min(1, (prestige - 700) / 300));
        const ignoreGeography = seededRoll(
            `${seedText}|geography-fade|${selected.length}`
        ).roll < geographyFade;

        let choicePool = remaining;
        let chosen = null;
        if (ignoreGeography) {
            const weights = choicePool.map(item =>
                realZooPrestigeSimilarityWeight(item.record, window)
            );
            const choiceIndex = weightedIndex(
                weights,
                seededRoll(`${seedText}|prestige-zoo|${selected.length}`).roll
            );
            chosen = choicePool[choiceIndex];
        } else {
            const availableBands = new Set(
                remaining.map(item => realZooGeographyBand(item.record))
            );
            const rollWeights = geographyWeights.map((weight, band) =>
                availableBands.has(band) ? weight : 0
            );
            let chosenBand = weightedIndex(
                rollWeights,
                seededRoll(`${seedText}|geography-band|${selected.length}`).roll
            );

            // A distant domestic zoo is the last normal fallback even when its
            // starting percentage is zero. Farther Europe participates only
            // after the geography curve has explicitly given it weight.
            if (chosenBand < 0) {
                const fallbackOrder = [0, 1, 2, 3];
                if (geographyWeights[4] > 0) fallbackOrder.push(4);
                chosenBand = fallbackOrder.find(band => availableBands.has(band));
            }
            if (!Number.isInteger(chosenBand)) break;

            choicePool = remaining.filter(item =>
                realZooGeographyBand(item.record) === chosenBand
            );
            const weights = choicePool.map(item =>
                realZooPrestigeSimilarityWeight(item.record, window)
            );
            const choiceIndex = weightedIndex(
                weights,
                seededRoll(`${seedText}|prestige-zoo|${selected.length}`).roll
            );
            if (choiceIndex < 0) continue;
            chosen = choicePool[choiceIndex];
        }
        if (!chosen) break;
        selected.push(chosen);
        remaining.splice(remaining.indexOf(chosen), 1);
    }
    return selected;
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

function realZooHasAnimal(record, animal) {
    if (!record || !animal) return false;
    const wanted = animalCardKey(animal);
    return realZooSessionAnimalNames(record).some(name => {
        const held = animalFromRealZooName(name);
        return held && animalCardKey(held) === wanted;
    });
}

function fictionalOpponentHasAnimal(index, animal) {
    if (!animal) return false;
    const wanted = animalCardKey(animal);
    return (state.opponentTradeStocks[index] || []).some(held =>
        held && animalCardKey(held) === wanted
    );
}

function opponentAlreadyHasAnimal(index, animal) {
    if (isRealOpponentMode()) {
        return realZooHasAnimal(state.opponentProfiles[index]?.realZooRecord, animal);
    }
    return fictionalOpponentHasAnimal(index, animal);
}

function playerAlreadyHasAnimal(animal) {
    return Boolean(animal) && playerOwnedTradeKeys().has(animalCardKey(animal));
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
        country: record.country || '',
        province: record.province || '',
        prestige: realZooPrestige(record),
        favourites: Array.isArray(record.preferred_categories)
            ? record.preferred_categories.filter(Boolean).slice(0, 3)
            : [],
        zooTypes: normaliseZooTypes(record.zoo_types || record.zooTypes || 'general'),
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

function cachedTradeAnimalSpec(animal) {
    if (!animal) return null;
    return {
        category: animal.category,
        level: animal.level,
        filename: animal.filename
    };
}

function resolveCachedTradeAnimal(item) {
    if (!item) return null;

    // New cache format: exact card identity, no name reconstruction required.
    if (item.animalSpec?.category && item.animalSpec?.level && item.animalSpec?.filename) {
        return createAnimal(
            item.animalSpec.category,
            item.animalSpec.level,
            item.animalSpec.filename
        );
    }

    // Backward compatibility for any cache entry made before this fix.
    if (item.animalName) {
        return animalFromRealZooName(item.animalName);
    }

    return null;
}

function materializeLockedPlayerTradeOffers(outgoing, cached) {
    if (!outgoing || !Array.isArray(cached)) return [];

    if (isRealOpponentMode()) {
        const recordsByName = new Map(
            (state.realZooData?.zoos || []).map(record => [record.name, record])
        );

        return cached.map(item => {
            const record = recordsByName.get(item.recordName);
            if (!record) return null;
            if (realZooHasAnimal(record, outgoing)) return null;

            const animal = resolveCachedTradeAnimal(item);
            if (!animal) return null;
            if (playerAlreadyHasAnimal(animal)) return null;
            if (!realZooHasAnimal(record, animal)) return null;
            // V132: the outgoing animal's old slot is deliberately reserved
            // while it sits in Outgoing Offer. Test the incoming animal against
            // the post-trade zoo, not against the currently reserved zoo.
            if (!tradeIncomingHasDestinationAfterOutgoing(animal, outgoing)) return null;

            return { record, animal };
        }).filter(Boolean);
    }

    return cached.map(item => {
        if (!Number.isInteger(item.opponentIndex)) return null;
        if (item.opponentIndex < 0 || item.opponentIndex >= state.unlockedOpponentCount) return null;
        if (!state.opponentProfiles[item.opponentIndex]) return null;
        if (fictionalOpponentHasAnimal(item.opponentIndex, outgoing)) return null;

        const animal = resolveCachedTradeAnimal(item);
        if (!animal || playerAlreadyHasAnimal(animal)) return null;
        // Same reservation rule for fictional opponents: materialise the
        // already-promised offer using the zoo state AFTER outgoing leaves.
        if (!tradeIncomingHasDestinationAfterOutgoing(animal, outgoing)) return null;

        const stillHeld = (state.opponentTradeStocks[item.opponentIndex] || [])
            .some(held => held && animalCardKey(held) === animalCardKey(animal));

        return stillHeld ? { opponentIndex: item.opponentIndex, animal } : null;
    }).filter(Boolean);
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

    // V115: use the exact same prediction/materialisation path as the blue
    // trade-interest glow. If a card glows, dropping that card is therefore
    // guaranteed to expose the same currently-valid offers.
    const locked = predictedPlayerTradeOffers(outgoing);
    const restored = materializeLockedPlayerTradeOffers(outgoing, locked);

    state.opponentProfiles = restored.map((item, index) =>
        realZooProfile(item.record, index)
    );
    state.opponentTradeStocks = restored.map(item =>
        realZooTradeAnimals(item.record, true)
    );
    state.tradeOffers = restored.map((item, index) => ({
        opponentIndex: index,
        animal: item.animal
    }));
    state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;

    preloadAnimals(state.tradeOffers.map(offer => offer.animal)).then(() => {
        renderTrade();
        renderOpponentTradeState();
    });
}

function createRealAutonomousOpponentOffer() {
    if (state.outgoingOffer || state.autonomousTradeOffer) return false;

    // The same slider controls spontaneous real-zoo offers.
    if (Math.random() > tradeFrequencyFactor()) return false;

    const candidates = [];
    for (const record of realZooRecordsAvailable()) {
        const possible = realZooTradeAnimals(record, true).filter(incoming =>
            incoming.level <= Math.max(1, ...state.playerLevelsSeen) &&
            state.animals.some(outgoing => {
                const profile = realZooProfile(record, 0);
                return outgoing.level === incoming.level &&
                    profile.favourites.includes(outgoing.category) &&
                    !realZooHasAnimal(record, outgoing) &&
                    !playerAlreadyHasAnimal(incoming) &&
                    tradeIncomingHasDestinationAfterOutgoing(incoming, outgoing);
            })
        );
        if (possible.length) candidates.push({ record, possible });
    }

    const selected = selectPrestigeLocationCandidates(
        candidates,
        1,
        `real-autonomous|${state.turn}`
    )[0];
    if (!selected) return false;

    const { record, possible } = selected;
    const animal = weightedRandomItem(
        possible,
        candidate => animalZooTypeWeight(
            candidate,
            record.zoo_types || record.zooTypes || 'general',
            'trade'
        )
    );
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

// ============================================================
// OTHER ZOOS INFO POPUP + TRADE HISTORY
// ============================================================

let opponentInfoHideTimer = null;
let opponentInfoFadeTimer = null;
let opponentInfoFadeStarted = false;
let opponentInfoShowTimer = null;

function ensureOtherZoosUI() {
    const container = document.getElementById('opponentZoos');
    if (!container) return;

    // Rename the existing heading without depending on a particular HTML tag.
    for (const node of container.querySelectorAll('*')) {
        if (node.children.length === 0 && /^opponents:?$/i.test(node.textContent.trim())) {
            node.textContent = 'Other Zoos';
        }
    }

    // Also catch a direct text node such as "OPPONENTS".
    for (const node of [...container.childNodes]) {
        if (node.nodeType === Node.TEXT_NODE && /^(\s*)opponents:?(\s*)$/i.test(node.textContent)) {
            node.textContent = node.textContent.replace(/opponents:?/i, 'Other Zoos');
        }
    }

    const title = container.querySelector('.opponent-title');
    let header = document.getElementById('otherZoosHeader');
    if (!header) {
        header = document.createElement('div');
        header.id = 'otherZoosHeader';
        header.style.cssText =
            'display:flex;align-items:center;justify-content:flex-end;gap:10px;' +
            'min-height:34px;margin-bottom:8px;box-sizing:border-box;';
        container.insertBefore(header, container.firstChild);
    }
    if (title && title.parentElement !== header) {
        header.appendChild(title);
    }
    if (title) {
        // V135: hidden-button behaviour. Keep this looking exactly like the
        // ordinary "Other Zoos" heading: no underline, button chrome or
        // pointer cursor. It is nevertheless clickable/tappable.
        title.style.cssText =
            'margin:0;flex:1;min-width:0;text-align:right;font-size:13px;' +
            'font-weight:700;opacity:.6;white-space:nowrap;cursor:default;';
        title.setAttribute('role', 'button');
        title.setAttribute('tabindex', '0');
        title.setAttribute('aria-label', 'Open all zoos directory');
        if (!title.dataset.realZooDirectoryBound) {
            title.dataset.realZooDirectoryBound = '1';
            title.addEventListener('click', openRealZooDirectory);
            title.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openRealZooDirectory();
                }
            });
        }
    }

    let historyButton = document.getElementById('tradeHistoryButton');
    if (!historyButton) {
        historyButton = document.createElement('button');
        historyButton.id = 'tradeHistoryButton';
        historyButton.type = 'button';
        historyButton.textContent = 'Trade History';
        historyButton.title = 'Trade history';
        historyButton.setAttribute('aria-label', 'Trade history');
        historyButton.className = 'save-load-button';
        historyButton.style.cssText =
            'position:static;flex:0 0 auto;white-space:nowrap;cursor:pointer;z-index:3;';
        historyButton.addEventListener('click', openTradeHistoryMenu);
    }
    if (historyButton.parentElement !== header) header.appendChild(historyButton);

    if (!document.getElementById('opponentInfoPopup')) {
        const popup = document.createElement('div');
        popup.id = 'opponentInfoPopup';
        popup.style.cssText =
            'position:fixed;display:none;z-index:10040;max-width:min(430px,calc(100vw - 24px));' +
            'max-height:calc(100vh - 24px);overflow-y:auto;overflow-x:hidden;box-sizing:border-box;' +
            'padding:12px 14px;background:rgba(25,25,25,.97);color:white;border:1px solid rgba(255,255,255,.3);' +
            'border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.45);white-space:pre-wrap;' +
            'font-size:13px;line-height:1.35;opacity:1;transition:opacity 1s ease;';
        document.body.appendChild(popup);
        popup.addEventListener('mouseenter', cancelOpponentInfoHide);
        popup.addEventListener('mouseleave', scheduleOpponentInfoHide);
        popup.addEventListener('wheel', event => {
            event.stopPropagation();
        }, { passive: true });
    }

    if (!document.getElementById('realZooDirectoryOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'realZooDirectoryOverlay';
        overlay.style.cssText =
            'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
            'background:rgba(0,0,0,.55);z-index:10028;padding:18px;box-sizing:border-box;';
        overlay.innerHTML = `
            <div id="realZooDirectoryPanel" style="width:min(620px,94vw);max-height:84vh;overflow:auto;
                        background:#f4efe2;color:#222;border-radius:10px;padding:18px;
                        box-shadow:0 12px 40px rgba(0,0,0,.45);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
                    <h2 style="margin:0;flex:1;">All Zoos</h2>
                    <button type="button" id="closeRealZooDirectory">Close</button>
                </div>
                <div style="font-size:12px;opacity:.72;margin-bottom:12px;">
                    Hover over a zoo to view its current collection and trade history.
                </div>
                <div id="realZooDirectoryList"></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#closeRealZooDirectory')
            .addEventListener('click', closeRealZooDirectory);
        overlay.addEventListener('pointerdown', event => {
            if (event.target === overlay) closeRealZooDirectory();
        });
    }

    if (!document.getElementById('zooTradePopup')) {
        const popup = document.createElement('div');
        popup.id = 'zooTradePopup';
        popup.style.cssText =
            'position:fixed;display:none;z-index:10040;width:min(360px,calc(100vw - 24px));' +
            'max-height:calc(100vh - 24px);overflow:auto;box-sizing:border-box;padding:12px 14px;' +
            'background:rgba(25,25,25,.97);color:white;border:1px solid rgba(255,255,255,.3);' +
            'border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.45);font-size:13px;line-height:1.4;' +
            'opacity:1;transition:opacity 1s ease;';
        document.body.appendChild(popup);
        popup.addEventListener('mouseenter', cancelOpponentInfoHide);
        popup.addEventListener('mouseleave', scheduleOpponentInfoHide);
        popup.addEventListener('wheel', event => event.stopPropagation(), { passive: true });
    }

    if (!document.getElementById('tradeAnimalInteractionStyles')) {
        const style = document.createElement('style');
        style.id = 'tradeAnimalInteractionStyles';
        style.textContent = `
            .trade-animal-name { cursor: default; transition: color .08s linear; }
            .trade-animal-name.trade-animal-yellow { color:#ffd52a !important; }
            #tradeHistoryList .trade-animal-name.trade-history-animal-name {
                cursor:pointer;
                color:inherit !important;
                font-weight:inherit;
            }
            #tradeHistoryList .trade-animal-name.trade-history-animal-name.trade-animal-locked {
                color:inherit !important;
                font-weight:800;
            }
            #tradeAnimalLocationPopup {
                position:fixed; display:none; z-index:10060; max-width:280px;
                padding:9px 11px; border-radius:7px; background:rgba(20,20,20,.97);
                color:white; border:1px solid rgba(255,255,255,.3);
                box-shadow:0 7px 22px rgba(0,0,0,.4); font-size:12px; line-height:1.35;
            }
            #tradeAnimalLocationPopup button {
                margin-left:4px; padding:2px 6px; font:inherit; font-weight:700; cursor:pointer;
            }
        `;
        document.head.appendChild(style);
    }

    if (!document.getElementById('tradeAnimalLocationPopup')) {
        const popup = document.createElement('div');
        popup.id = 'tradeAnimalLocationPopup';
        document.body.appendChild(popup);
    }

    if (!document.getElementById('tradeHistoryOverlay')) {
        const overlay = document.createElement('div');
        overlay.id = 'tradeHistoryOverlay';
        overlay.style.cssText =
            'position:fixed;inset:0;display:none;align-items:center;justify-content:center;' +
            'background:rgba(0,0,0,.55);z-index:10030;padding:18px;box-sizing:border-box;';
        overlay.innerHTML = `
            <div id="tradeHistoryPanel" style="width:min(720px,96vw);max-height:85vh;overflow:auto;background:#f4efe2;color:#222;
                        border-radius:10px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.45);">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <button type="button" id="tradeHistoryAllZoos" class="save-load-button">All Zoos</button>
                    <h2 style="margin:0;flex:1;font-size:20px;line-height:1.15;">Trade History</h2>
                    <button type="button" id="closeTradeHistory" class="game-options-button">Close</button>
                </div>
                <div id="tradeHistoryList"></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#closeTradeHistory').addEventListener('click', closeTradeHistoryMenu);
        overlay.querySelector('#tradeHistoryAllZoos').addEventListener('click', () => {
            closeTradeHistoryMenu(false);
            openRealZooDirectory();
        });
        overlay.addEventListener('pointerdown', event => {
            if (event.target === overlay) closeTradeHistoryMenu();
        });
    }
}

function cancelOpponentInfoHide() {
    // Hovering the popup may cancel the pending 1-second hold, but once the
    // actual fade has begun the popup is committed to disappearing. Only
    // hovering a zoo name (showOpponentInfoPopup) may revive it after that.
    if (opponentInfoFadeStarted) return;

    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    const popup = document.getElementById('opponentInfoPopup');
    const tradePopup = document.getElementById('zooTradePopup');
    if (popup && popup.style.display !== 'none') popup.style.opacity = '1';
    if (tradePopup && tradePopup.style.display !== 'none') tradePopup.style.opacity = '1';
}

function scheduleOpponentInfoHide() {
    if (pinnedZooPopupName) return;
    clearTimeout(opponentInfoShowTimer);
    opponentInfoShowTimer = null;
    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    opponentInfoHideTimer = setTimeout(() => {
        const popup = document.getElementById('opponentInfoPopup');
        const tradePopup = document.getElementById('zooTradePopup');
        if (!popup && !tradePopup) return;
        opponentInfoFadeStarted = true;
        if (popup) popup.style.opacity = '0';
        if (tradePopup) tradePopup.style.opacity = '0';
        opponentInfoFadeTimer = setTimeout(() => {
            if (popup?.style.opacity === '0') popup.style.display = 'none';
            if (tradePopup?.style.opacity === '0') tradePopup.style.display = 'none';
            opponentInfoFadeStarted = false;
        }, 1000);
    }, 1000);
}


let pinnedZooPopupName = null;
let activeZooMenuRecord = null;
let tradeAnimalLockedKey = null;
let tradeAnimalHoverKey = null;
let tradeAnimalLockTimer = null;

function tradeAnimalKey(name, level = null) {
    return `${String(name || '').replace(/\.png$/i, '').trim().toLowerCase()}|${level == null ? '' : Number(level)}`;
}

function refreshTradeAnimalHighlights() {
    document.querySelectorAll('.trade-animal-name[data-animal-key]').forEach(node => {
        const key = node.dataset.animalKey;
        const active = key === tradeAnimalLockedKey || key === tradeAnimalHoverKey;
        const locked = key === tradeAnimalLockedKey;
        const inTradeHistoryMiddle = node.classList.contains('trade-history-animal-name');

        // V142: the middle Trade History menu keeps its normal text colour.
        // Its animal name becomes bold only once selected/locked. The two
        // side popups continue to use yellow for hover and locked selection.
        node.classList.toggle('trade-animal-yellow', active && !inTradeHistoryMiddle);
        node.classList.toggle('trade-animal-locked', locked && inTradeHistoryMiddle);
    });
}

function clearTradeAnimalTransientHover(key = null) {
    if (key && tradeAnimalHoverKey !== key) return;
    clearTimeout(tradeAnimalLockTimer);
    tradeAnimalLockTimer = null;
    tradeAnimalHoverKey = null;
    refreshTradeAnimalHighlights();
    hideTradeAnimalLocationPopup();
}

function animalCurrentRealZooRecord(name, level = null) {
    const wantedName = String(name || '').replace(/\.png$/i, '').trim().toLowerCase();
    for (const record of state.realZooData?.zoos || []) {
        const found = realZooSessionAnimalNames(record).some(raw => {
            const animal = animalFromRealZooName(raw);
            if (!animal) return false;
            const sameName = String(animal.filename || '').replace(/\.png$/i, '').trim().toLowerCase() === wantedName;
            return sameName && (level == null || Number(animal.level) === Number(level));
        });
        if (found) return record;
    }
    return null;
}

function playerCurrentlyHasTradeAnimal(name, level = null) {
    const wantedName = String(name || '').replace(/\.png$/i, '').trim().toLowerCase();
    return (state.animals || []).some(animal =>
        String(animal?.filename || '').replace(/\.png$/i, '').trim().toLowerCase() === wantedName &&
        (level == null || Number(animal.level) === Number(level))
    );
}

function activeZooCurrentlyHasTradeAnimal(name, level = null) {
    if (!activeZooMenuRecord) return false;
    const wantedName = String(name || '').replace(/\.png$/i, '').trim().toLowerCase();
    return realZooSessionAnimalNames(activeZooMenuRecord).some(raw => {
        const animal = animalFromRealZooName(raw);
        if (!animal) return false;
        return String(animal.filename || '').replace(/\.png$/i, '').trim().toLowerCase() === wantedName &&
            (level == null || Number(animal.level) === Number(level));
    });
}

function hideTradeAnimalLocationPopup() {
    const popup = document.getElementById('tradeAnimalLocationPopup');
    if (popup) popup.style.display = 'none';
}

function showTradeAnimalLocationPopup(node, name, level, animalId = null) {
    const popup = document.getElementById('tradeAnimalLocationPopup');
    if (!popup) return;

    popup.innerHTML = '';

    // V161: current trade-history rows carry the exact physical animal ID.
    // Older saved histories do not, so they retain the old best-effort fallback.
    const hasPhysicalAnimalId = animalId != null && String(animalId).trim() !== '';
    const lineage = hasPhysicalAnimalId ? animalLineageRecord(animalId) : null;

    if (lineage) {
        const origin = lineage.originalFrom || 'Unknown';
        const first = document.createElement('div');
        first.textContent = `Originally from ${origin}.`;
        popup.appendChild(first);

        const second = document.createElement('div');
        second.style.marginTop = '4px';

        if (lineage.exchanged) {
            const ex = lineage.exchanged;
            second.textContent =
                `Exchanged by ${ex.by || state.zooName || 'Your Zoo'} for ` +
                `${ex.forName || 'upgrade animal'}` +
                `${ex.forLevel ? ` (L${ex.forLevel})` : ''} at turn ${ex.turn}.`;
        } else {
            second.append(document.createTextNode('Currently at '));
            const current = lineage.currentAt || 'Unknown';

            const realRecord = (state.realZooData?.zoos || []).find(record =>
                String(record?.name || '').trim().toLowerCase() ===
                String(current).trim().toLowerCase()
            );

            if (realRecord) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = realRecord.name;
                button.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    selectTradeHistoryZoo(realRecord);
                    hideTradeAnimalLocationPopup();
                });
                second.appendChild(button);
            } else {
                const strong = document.createElement('strong');
                strong.textContent = current;
                second.appendChild(strong);
            }
            second.append(document.createTextNode('.'));
        }

        popup.appendChild(second);
    } else if (hasPhysicalAnimalId) {
        // V164: an ID-bearing history entry represents one exact physical card.
        // If its lineage record is unavailable, NEVER guess by species/name,
        // because another zoo may own a different card of the same species.
        const first = document.createElement('div');
        first.textContent = 'Specific animal history unavailable.';
        popup.appendChild(first);
        const second = document.createElement('div');
        second.style.marginTop = '4px';
        second.textContent = 'Its current location cannot be determined without its provenance record.';
        popup.appendChild(second);
    } else {
        // Legacy-save fallback only: old trade entries genuinely lack physical card IDs.
        const realRecord = animalCurrentRealZooRecord(name, level);
        const atPlayer = playerCurrentlyHasTradeAnimal(name, level);
        const first = document.createElement('div');
        first.textContent = 'Original zoo unavailable (legacy trade record).';
        popup.appendChild(first);
        const second = document.createElement('div');
        second.style.marginTop = '4px';
        second.append(document.createTextNode('Currently at '));
        const strong = document.createElement('strong');
        strong.textContent = realRecord?.name || (atPlayer ? (state.zooName || 'Your Zoo') : 'an unknown location');
        second.appendChild(strong);
        second.append(document.createTextNode('.'));
        popup.appendChild(second);
    }

    popup.style.display = 'block';
    const rect = node.getBoundingClientRect();
    requestAnimationFrame(() => {
        const width = popup.offsetWidth, height = popup.offsetHeight;
        let left = Math.min(rect.left, innerWidth - width - 12);
        let top = rect.bottom + 6;
        if (top + height > innerHeight - 12) top = rect.top - height - 6;
        popup.style.left = `${Math.max(12, left)}px`;
        popup.style.top = `${Math.max(12, top)}px`;
    });
}

function beginTradeAnimalHover(node, allowLocation = false) {
    const key = node?.dataset?.animalKey;
    if (!key) return;
    tradeAnimalHoverKey = key;
    refreshTradeAnimalHighlights();
    clearTimeout(tradeAnimalLockTimer);
    tradeAnimalLockTimer = setTimeout(() => {
        if (tradeAnimalHoverKey !== key) return;
        tradeAnimalLockedKey = key;
        tradeAnimalHoverKey = null;
        refreshTradeAnimalHighlights();
    }, 2000);

    if (allowLocation) {
        showTradeAnimalLocationPopup(
            node,
            node.dataset.animalName || node.textContent,
            Number(node.dataset.animalLevel || 0) || null,
            node.dataset.animalId || null
        );
    }
}

function makeTradeAnimalSpan(name, level, allowLocation = false, inTradeHistoryMiddle = false, animalId = null) {
    const span = document.createElement('span');
    span.className = 'trade-animal-name' + (inTradeHistoryMiddle ? ' trade-history-animal-name' : '');
    span.textContent = name;
    span.dataset.animalName = name;
    span.dataset.animalLevel = String(level ?? '');
    if (animalId != null) span.dataset.animalId = String(animalId);
    span.dataset.animalKey = animalId != null
        ? `id:${animalId}`
        : tradeAnimalKey(name, level);
    span.addEventListener('mouseenter', () => {
        if (inTradeHistoryMiddle) {
            // V146: middle Trade History names may show transient hover/location
            // feedback, but hovering there can never create or replace a lock.
            const key = span.dataset.animalKey;
            tradeAnimalHoverKey = key;
            refreshTradeAnimalHighlights();
            clearTimeout(tradeAnimalLockTimer);
            tradeAnimalLockTimer = null;
            if (allowLocation) {
                showTradeAnimalLocationPopup(
                    span,
                    span.dataset.animalName || span.textContent,
                    Number(span.dataset.animalLevel || 0) || null,
                    span.dataset.animalId || null
                );
            }
            return;
        }

        // Popup animal names retain the existing 2-second hover-to-lock rule.
        beginTradeAnimalHover(span, allowLocation);
    });
    span.addEventListener('mouseleave', () => clearTradeAnimalTransientHover(span.dataset.animalKey));

    // Clicking an animal name is the instant equivalent of the 2-second hover
    // lock. Clicking another animal immediately switches the selection.
    span.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(tradeAnimalLockTimer);
        tradeAnimalLockTimer = null;

        const key = span.dataset.animalKey;

        // V144: clicking the animal that is already locked toggles it off.
        // Clicking a different animal still switches the lock immediately.
        if (tradeAnimalLockedKey === key) {
            tradeAnimalLockedKey = null;
            tradeAnimalHoverKey = null;
            hideTradeAnimalLocationPopup();
            refreshTradeAnimalHighlights();
            return;
        }

        tradeAnimalLockedKey = key;
        tradeAnimalHoverKey = null;
        refreshTradeAnimalHighlights();
        if (allowLocation) {
            showTradeAnimalLocationPopup(
                span,
                span.dataset.animalName || span.textContent,
                Number(span.dataset.animalLevel || 0) || null,
                span.dataset.animalId || null
            );
        }
    });
    return span;
}

function resetTradeAnimalHighlightUI(clearLock = false) {
    clearTimeout(tradeAnimalLockTimer);
    tradeAnimalLockTimer = null;
    tradeAnimalHoverKey = null;
    if (clearLock) tradeAnimalLockedKey = null;
    hideTradeAnimalLocationPopup();
    refreshTradeAnimalHighlights();
}

function tradesForZooName(zooName) {
    const wanted = String(zooName || '').trim().toLowerCase();
    return (state.tradeHistory || []).filter(trade =>
        String(trade?.zooName || '').trim().toLowerCase() === wanted
    );
}

function fillZooTradePopup(recordOrName) {
    const popup = document.getElementById('zooTradePopup');
    if (!popup) return;
    const zooName = typeof recordOrName === 'string'
        ? recordOrName
        : recordOrName?.name || 'Zoo';
    const trades = tradesForZooName(zooName);

    popup.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = `${zooName} — Trade History`;
    popup.appendChild(title);
    if (recordOrName && typeof recordOrName === 'object') {
        const location = document.createElement('div');
        location.textContent = realZooLocationLines(recordOrName).join('\n');
        location.style.cssText = 'margin-top:4px;opacity:.82;white-space:pre-line;';
        popup.appendChild(location);
    }

    if (!trades.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No trades with this zoo yet.';
        empty.style.marginTop = '10px';
        popup.appendChild(empty);
        return;
    }

    for (const trade of [...trades].reverse()) {
        const row = document.createElement('div');
        row.style.cssText = 'padding:9px 0;border-top:1px solid rgba(255,255,255,.18);';
        const turn = document.createElement('div');
        turn.innerHTML = `<strong>Turn ${trade.turn}</strong>`;
        const line = document.createElement('div');
        line.append(
            makeTradeAnimalSpan(trade.outgoingName, trade.outgoingLevel, true, false, trade.outgoingId),
            document.createTextNode(` (L${trade.outgoingLevel}) ↔ `),
            makeTradeAnimalSpan(trade.incomingName, trade.incomingLevel, true, false, trade.incomingId),
            document.createTextNode(` (L${trade.incomingLevel})`)
        );
        row.append(turn, line);
        popup.appendChild(row);
    }
    refreshTradeAnimalHighlights();
}

function positionZooSidePopups(panel) {
    const collection = document.getElementById('opponentInfoPopup');
    const trades = document.getElementById('zooTradePopup');
    if (!panel || !collection || !trades) return;
    const panelRect = panel.getBoundingClientRect();

    const place = () => {
        const cw = collection.offsetWidth, ch = collection.offsetHeight;
        const tw = trades.offsetWidth, th = trades.offsetHeight;
        collection.style.left = `${Math.max(12, panelRect.left - cw - 10)}px`;
        collection.style.top = `${Math.max(12, Math.min(panelRect.top, innerHeight - ch - 12))}px`;

        let tradeLeft = panelRect.right + 10;
        if (tradeLeft + tw > innerWidth - 12) tradeLeft = Math.max(12, innerWidth - tw - 12);
        trades.style.left = `${tradeLeft}px`;
        trades.style.top = `${Math.max(12, Math.min(panelRect.top, innerHeight - th - 12))}px`;
    };
    requestAnimationFrame(place);
}

function fillZooCollectionPopup(record) {
    const popup = document.getElementById('opponentInfoPopup');
    if (!popup || !record) return;
    const currentAnimals = [...realZooSessionAnimalNames(record)]
        .map(name => animalFromRealZooName(name))
        .filter(Boolean);

    popup.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = record.name || 'Zoo';
    popup.append(title, document.createElement('br'));
    const location = document.createElement('div');
    location.textContent = realZooLocationLines(record).join('\n');
    location.style.cssText = 'margin-top:4px;opacity:.82;white-space:pre-line;';
    popup.append(location, document.createElement('br'));
    const label = document.createElement('strong');
    label.textContent = 'Animals by category:';
    popup.append(label, document.createElement('br'));

    const grouped = new Map();
    for (const animal of currentAnimals) {
        if (!grouped.has(animal.category)) grouped.set(animal.category, []);
        grouped.get(animal.category).push(animal);
    }
    const order = [...CATEGORY_PROGRESSION_ORDER, ...[...grouped.keys()].filter(c => !CATEGORY_PROGRESSION_ORDER.includes(c)).sort()];
    for (const category of order.filter(c => grouped.get(c)?.length)) {
        const cat = document.createElement('div');
        cat.style.marginTop = '8px';
        const catName = document.createElement('strong');
        catName.textContent = `${category}:`;
        cat.appendChild(catName);
        for (const animal of [...grouped.get(category)].sort((a,b)=>a.level-b.level || String(a.filename).localeCompare(String(b.filename)))) {
            const line = document.createElement('div');
            line.style.paddingLeft = '10px';
            const name = String(animal.filename || '').replace(/\.png$/i,'');
            line.append(makeTradeAnimalSpan(name, animal.level, false), document.createTextNode(` (L${animal.level})`));
            cat.appendChild(line);
        }
        popup.appendChild(cat);
    }
    refreshTradeAnimalHighlights();
}

function showZooDualPopups(record, panel, pinned = false) {
    if (!record) return;
    const collection = document.getElementById('opponentInfoPopup');
    const trades = document.getElementById('zooTradePopup');
    if (!collection || !trades) return;

    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    clearTimeout(opponentInfoShowTimer);
    opponentInfoFadeStarted = false;

    activeZooMenuRecord = record;
    fillZooCollectionPopup(record);
    fillZooTradePopup(record);

    for (const popup of [collection, trades]) {
        popup.style.display = 'block';
        popup.style.opacity = '1';
    }
    pinnedZooPopupName = pinned ? String(record.name || '') : null;
    positionZooSidePopups(panel);
}

function hideZooDualPopups(immediate = false) {
    pinnedZooPopupName = null;
    activeZooMenuRecord = null;
    resetTradeAnimalHighlightUI(false);
    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    const popups = [
        document.getElementById('opponentInfoPopup'),
        document.getElementById('zooTradePopup')
    ].filter(Boolean);
    if (immediate) {
        for (const popup of popups) {
            popup.style.opacity = '0';
            popup.style.display = 'none';
        }
        return;
    }
    for (const popup of popups) popup.style.opacity = '0';
    opponentInfoFadeTimer = setTimeout(() => {
        for (const popup of popups) {
            if (popup.style.opacity === '0') popup.style.display = 'none';
        }
    }, 1000);
}

function closeRealZooDirectory() {
    resetTradeAnimalHighlightUI(true);
    const overlay = document.getElementById('realZooDirectoryOverlay');
    if (overlay) overlay.style.display = 'none';
    hideZooDualPopups(false);
    resumeHintGlowsAfterMenu();
    hideZooDualPopups(true);
}

function showRealZooDirectoryCollection(record, anchor) {
    ensureOtherZoosUI();
    const popup = document.getElementById('opponentInfoPopup');
    if (!popup || !record || !anchor) return;

    opponentInfoFadeStarted = false;
    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    clearTimeout(opponentInfoShowTimer);

    // IMPORTANT: use the session holdings, not record.animals. Trades update
    // realZooSessionAnimalNames(), so this is the zoo's collection NOW.
    const currentNames = [...realZooSessionAnimalNames(record)];
    const currentAnimals = currentNames
        .map(name => animalFromRealZooName(name))
        .filter(Boolean);

    popup.textContent =
        `${record.name || 'Zoo'}\n\n` +
        `${realZooLocationLines(record).join('\n')}\n\n` +
        `Animals by category:\n${opponentAnimalsGroupedByCategory(currentAnimals) || 'none'}`;

    popup.style.display = 'block';
    popup.style.opacity = '1';

    requestAnimationFrame(() => {
        const rect = anchor.getBoundingClientRect();
        const width = popup.offsetWidth;
        const height = popup.offsetHeight;
        const overlay = document.getElementById('realZooDirectoryOverlay');
        const panel = document.getElementById('realZooDirectoryPanel');
        const panelRect = panel?.getBoundingClientRect();

        // Prefer immediately to the left of the directory panel, then right,
        // then clamp to the viewport. This keeps the collection visible while
        // the user moves down the zoo list.
        let left = panelRect ? panelRect.left - width - 10 : rect.left - width - 8;
        if (left < 12 && panelRect && panelRect.right + width + 10 <= window.innerWidth - 12) {
            left = panelRect.right + 10;
        }
        if (left < 12) left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));

        let top = Math.min(rect.top, window.innerHeight - height - 12);
        if (top < 12) top = 12;
        popup.style.left = `${Math.round(left)}px`;
        popup.style.top = `${Math.round(top)}px`;
    });
}

function openRealZooDirectory() {
    pauseAllHintGlowsForMenu();
    ensureOtherZoosUI();
    const overlay = document.getElementById('realZooDirectoryOverlay');
    const list = document.getElementById('realZooDirectoryList');
    if (!overlay || !list) return;

    list.innerHTML = '';
    const zoos = Array.isArray(state.realZooData?.zoos)
        ? [...state.realZooData.zoos]
        : [];

    zoos.sort((a, b) =>
        String(a?.country || '').localeCompare(String(b?.country || '')) ||
        String(a?.province || '').localeCompare(String(b?.province || '')) ||
        String(a?.name || '').localeCompare(String(b?.name || ''))
    );

    if (!zoos.length) {
        const empty = document.createElement('div');
        empty.textContent = 'Real zoo database is still loading.';
        empty.style.cssText = 'padding:10px 0;opacity:.72;';
        list.appendChild(empty);
    } else {
        let lastLocation = '';
        for (const record of zoos) {
            const locationKey = `${record.country || 'Unknown'}|${record.province || 'Unknown'}`;
            if (locationKey !== lastLocation) {
                const heading = document.createElement('div');
                heading.textContent = `${record.country || 'Unknown'} — ${record.province || 'Unknown'}`;
                heading.style.cssText =
                    'margin:13px 0 4px;font-size:11px;font-weight:800;opacity:.55;' +
                    'text-transform:uppercase;letter-spacing:.06em;';
                list.appendChild(heading);
                lastLocation = locationKey;
            }

            const row = document.createElement('div');
            row.className = 'real-zoo-directory-row';
            row.textContent = record.name || 'Zoo';
            row.style.cssText =
                'padding:5px 2px;border-top:1px solid rgba(0,0,0,.10);' +
                'font-size:13px;line-height:1.35;cursor:default;';

            row.addEventListener('mouseenter', () =>
                showZooDualPopups(record, document.getElementById('realZooDirectoryPanel'), false)
            );
            row.addEventListener('mouseleave', () => {
                if (!pinnedZooPopupName) scheduleOpponentInfoHide();
            });

            // Touch devices have no hover: tapping a zoo name shows the same
            // current-collection popup without turning the row into a button.
            row.addEventListener('pointerdown', event => {
                if (event.pointerType === 'touch') {
                    event.preventDefault();
                    event.stopPropagation();
                    showRealZooDirectoryCollection(record, row);
                }
            });

            list.appendChild(row);
        }
    }

    overlay.style.display = 'flex';
    queueMicrotask(localizeDocument);
}

function showOpponentInfoPopup(index, anchor) {
    ensureOtherZoosUI();

    // The zoo name is the one thing allowed to revive a popup whose fade has
    // already started.
    opponentInfoFadeStarted = false;
    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);

    clearTimeout(opponentInfoShowTimer);

    const popup = document.getElementById('opponentInfoPopup');
    const profile = state.opponentProfiles[index];
    if (!popup || !profile) return;

    const favourites = profile.favourites || [];
    const stock = state.opponentTradeStocks[index] || [];
    const record = profile.realZooRecord || null;
    const locationText = record
        ? `${realZooLocationLines(record, true).join('\n')}\n\n`
        : '';
    popup.textContent =
        `${profile.name || `Zoo ${index + 1}`}\n\n` +
        locationText +
        `Favours: ${favourites.length ? favourites.join(', ') : 'none'}\n\n` +
        `Animals by category:\n${opponentAnimalsGroupedByCategory(stock) || 'none'}`;

    popup.style.display = 'none';
    popup.style.opacity = '1';

    opponentInfoShowTimer = setTimeout(() => {
        opponentInfoShowTimer = null;
        const rect = anchor.getBoundingClientRect();
        popup.style.display = 'block';
        const width = popup.offsetWidth;
        const height = popup.offsetHeight;
        const fitsOnRight = rect.right + 8 + width <= window.innerWidth - 12;
        let left = fitsOnRight ? rect.right + 8 : rect.left - width - 8;
        if (left < 12) left = 12;
        let top = Math.min(rect.bottom + 6, window.innerHeight - height - 12);
        if (top < 12) top = 12;
        popup.style.left = `${Math.round(left)}px`;
        popup.style.top = `${Math.round(top)}px`;
    }, 1000);
}

function selectTradeHistoryZoo(record) {
    const panel = document.getElementById('tradeHistoryPanel');
    if (!record || !panel) return;
    const sameZoo = pinnedZooPopupName === String(record.name || '');
    document.querySelectorAll('#tradeHistoryList button[data-zoo-name]')
        .forEach(button => button.classList.remove('selected-zoo-history'));
    if (sameZoo) {
        hideZooDualPopups(false);
        return;
    }
    document.querySelectorAll('#tradeHistoryList button[data-zoo-name]').forEach(button => {
        if (String(button.dataset.zooName || '').trim().toLowerCase() === String(record.name || '').trim().toLowerCase()) {
            button.classList.add('selected-zoo-history');
        }
    });
    showZooDualPopups(record, panel, true);
}

function openTradeHistoryMenu() {
    pauseAllHintGlowsForMenu();
    ensureOtherZoosUI();
    const overlay = document.getElementById('tradeHistoryOverlay');
    const list = document.getElementById('tradeHistoryList');
    const panel = document.getElementById('tradeHistoryPanel');
    if (!overlay || !list || !panel) return;

    pinnedZooPopupName = null;
    activeZooMenuRecord = null;
    resetTradeAnimalHighlightUI(false);
    list.innerHTML = '';
    const history = state.tradeHistory || [];

    if (!history.length) {
        list.textContent = 'No trades have been completed yet.';
    } else {
        for (const trade of [...history].reverse()) {
            const row = document.createElement('div');
            row.style.cssText = 'padding:10px 0;border-top:1px solid rgba(0,0,0,.18);line-height:1.45;';

            const heading = document.createElement('div');
            heading.style.cssText = 'display:flex;align-items:center;gap:8px;';
            const turn = document.createElement('strong');
            turn.textContent = `Turn ${trade.turn} -`;
            const zooButton = document.createElement('button');
            zooButton.type = 'button';
            zooButton.textContent = trade.zooName;
            zooButton.dataset.zooName = trade.zooName;
            zooButton.style.cssText = 'font:inherit;font-weight:700;padding:2px 7px;cursor:pointer;';
            heading.append(turn, zooButton);

            const details = document.createElement('div');
            details.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:3px;';
            details.append(
                makeTradeAnimalSpan(trade.outgoingName, trade.outgoingLevel, true, true, trade.outgoingId),
                document.createTextNode(` (L${trade.outgoingLevel}) `)
            );
            const arrows = document.createElement('span');
            arrows.setAttribute('aria-label','traded for');
            arrows.style.cssText='display:inline-flex;flex-direction:column;justify-content:center;font-weight:800;font-size:10px;line-height:.72;';
            arrows.innerHTML='<span>-&gt;</span><span>&lt;-</span>';
            details.append(
                arrows,
                makeTradeAnimalSpan(trade.incomingName, trade.incomingLevel, true, true, trade.incomingId),
                document.createTextNode(` (L${trade.incomingLevel})`)
            );

            zooButton.addEventListener('click', () => {
                const record = (state.realZooData?.zoos || []).find(zoo =>
                    String(zoo?.name || '').trim().toLowerCase() === String(trade.zooName || '').trim().toLowerCase()
                );
                if (record) selectTradeHistoryZoo(record);
            });

            row.append(heading, details);
            list.appendChild(row);
        }
    }

    overlay.style.display = 'flex';
    refreshTradeAnimalHighlights();
    queueMicrotask(localizeDocument);
}

function closeTradeHistoryMenu(resumeHints = true) {
    resetTradeAnimalHighlightUI(true);
    const overlay = document.getElementById('tradeHistoryOverlay');
    if (overlay) overlay.style.display = 'none';
    // V142: Trade History itself vanishes instantly, so its side popups do too.
    hideZooDualPopups(true);
    if (resumeHints) resumeHintGlowsAfterMenu();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ============================================================
// OPPONENT TRADING
// ============================================================
function ensureOpponentZooElements() {
    const container = $('opponentZoos');
    if (!container) return;
    ensureOtherZoosUI();
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

// V165 — preserve the established desktop composition on laptop viewports.
//
// The normal stylesheet remains the source of truth for position. On a narrower
// desktop/MacBook viewport we ONLY scale the progression tracker if its natural
// desktop position would collide with Draw/Exchange. We do not relocate it to a
// newly calculated x/y coordinate. This keeps the older desktop composition
// visually identical while allowing it to fit on a smaller screen.
function visibleElementRect(element) {
    if (!element || !element.isConnected) return null;
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') return null;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return null;
    return rect;
}

function unionRects(rects) {
    const valid = rects.filter(Boolean);
    if (!valid.length) return null;
    const left = Math.min(...valid.map(rect => rect.left));
    const top = Math.min(...valid.map(rect => rect.top));
    const right = Math.max(...valid.map(rect => rect.right));
    const bottom = Math.max(...valid.map(rect => rect.bottom));
    return { left, top, right, bottom, width: right - left, height: bottom - top };
}

function rectsOverlap(a, b, gap = 0) {
    if (!a || !b) return false;
    return !(
        a.right + gap <= b.left ||
        b.right + gap <= a.left ||
        a.bottom + gap <= b.top ||
        b.bottom + gap <= a.top
    );
}

function actionControlsRect() {
    return unionRects([
        visibleElementRect(drawCard),
        visibleElementRect(exchange1),
        visibleElementRect(exchange2),
        visibleElementRect(resultBox)
    ]);
}

function fitProgressTrackerAroundActions() {
    const tracker = document.getElementById('progressTracker');
    if (!tracker) return;

    // Always restore the exact stylesheet position before measuring. Mobile has
    // its own CSS and must never inherit a desktop correction.
    tracker.style.removeProperty('transform');
    tracker.style.removeProperty('transform-origin');
    tracker.style.removeProperty('position');
    tracker.style.removeProperty('left');
    tracker.style.removeProperty('right');
    tracker.style.removeProperty('top');
    tracker.style.removeProperty('z-index');
    tracker.classList.remove('laptop-header-fitted');

    if (window.matchMedia('(max-width: 700px)').matches) return;

    const controls = actionControlsRect();
    const natural = visibleElementRect(tracker);
    if (!controls || !natural) return;

    const gap = 12;

    // If the old desktop layout already fits, leave BOTH scale and position
    // completely untouched. This is what makes the transition seamless.
    if (!rectsOverlap(natural, controls, gap)) return;

    // Preserve the tracker's natural top-left point. Only its rendered width and
    // height are reduced. This avoids the horizontal/vertical drift introduced
    // by the previous fixed-position MacBook guard.
    const availableWidth = Math.max(1, controls.left - gap - natural.left);
    const scale = Math.max(0.50, Math.min(1, availableWidth / natural.width));

    tracker.style.transformOrigin = 'top left';
    tracker.style.transform = `scale(${scale})`;
    tracker.classList.add('laptop-header-fitted');
}

function positionOpponentTradeArea() {
    const area = document.getElementById('opponentTradeArea');

    // Mobile layout is controlled entirely by CSS. Clear every desktop inline
    // correction so the phone HUD remains unchanged.
    if (window.matchMedia('(max-width: 700px)').matches) {
        if (!area) return;
        area.classList.remove('laptop-trade-below-header');
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

    fitProgressTrackerAroundActions();

    const opponentRect = opponents.getBoundingClientRect();
    const header = document.getElementById('actionMenu');
    const headerRect = header ? header.getBoundingClientRect() : { top: 0, height: 200 };

    // Restore the established V65–V76 trade-card dimensions and positioning.
    // Crucially, do not shrink the cards according to whatever horizontal gap
    // happens to remain on a MacBook; that changed both their scale and their
    // perceived position compared with the older desktop layout.
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

    // Match the older layout: the pair belongs immediately to the left of Other
    // Zoos. Its x-position therefore follows that panel, not Draw/Exchange or
    // the progression tracker.
    let left = opponentRect.left - gapBeforeOpponents - areaWidth;
    left = Math.max(screenPadding, Math.min(left, window.innerWidth - areaWidth - screenPadding));

    // Match the older vertical placement as well: centred within the header.
    const top = headerRect.top + Math.max(headerPadding, (headerRect.height - cardHeight) / 2);

    area.classList.remove('laptop-trade-below-header');
    area.style.position = 'fixed';
    area.style.left = `${Math.round(left)}px`;
    area.style.right = 'auto';
    area.style.top = `${Math.round(top)}px`;
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
    const existingKeys = new Set([
        ...state.animals.map(a => `${a.category}|${a.level}|${a.filename.toLowerCase()}`),
        ...state.opponentTradeStocks.flat().filter(Boolean).map(a => `${a.category}|${a.level}|${a.filename.toLowerCase()}`)
    ]);
    const candidates = [];
    for (const category of enabled) {
        for (const level of possibleLevels) {
            for (const filename of levelFiles(category, level)) {
                if (!existingKeys.has(`${category}|${level}|${filename.toLowerCase()}`)) {
                    candidates.push({ category, level, filename });
                }
            }
        }
    }
    const selected = weightedRandomItem(candidates, candidate => {
        const favouriteMultiplier = profile?.favourites?.includes(candidate.category) ? 3 : 1;
        return favouriteMultiplier * animalZooTypeWeight(candidate, profile?.zooTypes || 'general', 'trade');
    });
    return selected
        ? { id: state.nextId++, ...selected, enclosureId: null, slotIndex: null, hand: false }
        : null;
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
    // V83: cached blue-glow predictions are promises about exact stock cards.
    // Once fictional stocks rotate, those promises are stale.
    state.tradeOfferCache.clear();

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
        scheduleNextAutonomousOpponentOffer();
        renderOpponentTradeState();
        return;
    }
    ensureTradeAreaLayout();
    const enabled = [...state.activeCategories];
    state.opponentProfiles = state.opponentNames.slice(0, 6).map((name, index) => ({
        index, name,
        favourites: shuffle([...enabled]).slice(0, Math.min(3, enabled.length)),
        zooTypes: [inferZooTypeFromAnyGeneratedName(name)]
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
    const profile = state.opponentProfiles[opponentIndex];
    const stock = (state.opponentTradeStocks[opponentIndex] || [])
        .filter(incoming =>
            !playerAlreadyHasAnimal(incoming) &&
            state.animals.some(outgoing =>
                outgoing.level === incoming.level &&
                profile?.favourites?.includes(outgoing.category) &&
                !opponentAlreadyHasAnimal(opponentIndex, outgoing) &&
                tradeIncomingHasDestinationAfterOutgoing(incoming, outgoing)
            )
        );
    const animal = weightedRandomItem(
        stock,
        candidate => animalZooTypeWeight(candidate, profile?.zooTypes || 'general', 'trade')
    );
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
    if (state.sandboxMode) return;
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

function opponentAnimalsGroupedByCategory(stock) {
    const grouped = new Map();

    for (const animal of stock || []) {
        if (!animal) continue;
        if (!grouped.has(animal.category)) grouped.set(animal.category, []);
        grouped.get(animal.category).push(animal);
    }

    const categoryOrder = [
        ...CATEGORY_PROGRESSION_ORDER,
        ...[...grouped.keys()]
            .filter(category => !CATEGORY_PROGRESSION_ORDER.includes(category))
            .sort((a, b) => a.localeCompare(b))
    ];

    return categoryOrder
        .filter(category => grouped.get(category)?.length)
        .map(category => {
            const animals = [...grouped.get(category)].sort((a, b) =>
                a.level - b.level ||
                String(a.filename).localeCompare(String(b.filename))
            );
            return `${category}:\n` + animals.map(animal =>
                `  ${animal.filename.replace(/\.png$/i, '')} (L${animal.level})`
            ).join('\n');
        })
        .join('\n\n');
}

function renderOpponentTradeState() {
    const opponentContainer = document.getElementById('opponentZoos');
    const opponentTradeArea = document.getElementById('opponentTradeArea');
    if (state.sandboxMode) {
        if (opponentContainer) opponentContainer.style.display = 'none';
        if (opponentTradeArea) opponentTradeArea.style.display = 'none';
        return;
    }
    if (opponentContainer) opponentContainer.style.display = '';
    if (opponentTradeArea) opponentTradeArea.style.display = '';
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
        const stockText = opponentAnimalsGroupedByCategory(stock);
        // Detailed information is shown in the custom hover popup so it can
        // remain open, fade, and scroll. Disable the browser's native tooltip.
        el.title = '';
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

    // V115: materialise exactly the same locked offer set used by the blue
    // eligibility glow. This removes the old second calculation that could
    // make a non-glowing animal unexpectedly receive offers.
    const locked = predictedPlayerTradeOffers(outgoing);
    state.tradeOffers = materializeLockedPlayerTradeOffers(outgoing, locked);
    state.selectedTradeOpponent = state.tradeOffers.length
        ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
        : null;

    preloadAnimals(state.tradeOffers.map(offer => offer.animal)).then(() => {
        renderTrade();
        renderOpponentTradeState();
    });
}

function materializeCapturedPlayerTradeOffers(outgoing, locked) {
    if (!outgoing || !Array.isArray(locked) || !locked.length) return false;

    if (isRealOpponentMode()) {
        const restored = materializeLockedPlayerTradeOffers(outgoing, locked);

        state.opponentProfiles = restored.map((item, index) =>
            realZooProfile(item.record, index)
        );
        state.opponentTradeStocks = restored.map(item =>
            realZooTradeAnimals(item.record, true)
        );
        state.tradeOffers = restored.map((item, index) => ({
            opponentIndex: index,
            animal: item.animal
        }));
        state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;
    } else {
        state.tradeOffers = materializeLockedPlayerTradeOffers(outgoing, locked);
        state.selectedTradeOpponent = state.tradeOffers.length
            ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
            : null;
    }

    preloadAnimals(state.tradeOffers.map(offer => offer.animal)).then(() => {
        renderTrade();
        renderOpponentTradeState();
    });

    return state.tradeOffers.length > 0;
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
    return (
        animal.level === offer.animal.level &&
        profile.favourites.includes(animal.category) &&
        !opponentAlreadyHasAnimal(offer.opponentIndex, animal) &&
        !playerAlreadyHasAnimal(offer.animal) &&
        tradeIncomingHasDestinationAfterOutgoing(offer.animal, animal)
    );
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
        state.outgoingOffer = animal;
        if (state.drag?.type === 'animal' && state.drag.animal?.id === animal.id) {
            reserveAnimalZooSlot(animal, state.drag.originalEnclosureId, state.drag.originalSlotIndex);
        }
        animal.hand = false; animal.enclosureId = null; animal.slotIndex = null;
        noteNewCardAction();
        renderTrade(); return true;
    }
    // startAnimalDrag() captured the rescue before removing the animal from
    // its enclosure. Use that exact preserved offer here.
    const pendingEmergencyTrade =
        state.drag?.type === 'animal' &&
        state.drag.animal?.id === animal.id
            ? state.drag.emergencyTradeAtDragStart
            : emergencyTradeForAnimal(animal);

    state.outgoingOffer = animal;
    if (state.drag?.type === 'animal' && state.drag.animal?.id === animal.id) {
        reserveAnimalZooSlot(animal, state.drag.originalEnclosureId, state.drag.originalSlotIndex);
    }
    animal.hand = false;
    animal.enclosureId = null;
    animal.slotIndex = null;

    noteNewCardAction();
    generateOpponentTradeOffers(animal, pendingEmergencyTrade);
    return true;
}

function autoSelectOutgoingOfferAnimal() {
    if (!state.loaded || state.drag || state.pan) return false;
    if (state.outgoingOffer || state.result || state.exchange.some(Boolean)) return false;

    // Only animals genuinely in the zoo are candidates. A card in hand or
    // already committed elsewhere is never auto-selected.
    const candidates = state.animals.flatMap(animal => {
        if (animal.hand) return [];
        if (animal.enclosureId === null || animal.enclosureId === undefined) return [];

        // V134: "predicted" is not enough. The blue trade-interest glow only
        // promises an offer after materializeLockedPlayerTradeOffers() has
        // verified that the opponent still exists/holds the card and that the
        // incoming animal is genuinely placeable after this outgoing animal.
        //
        // Capture those fully materialised LIVE offers while the animal is
        // still in its enclosure. The click shortcut will use these exact
        // objects; nothing is rerolled or revalidated after state changes.
        const lockedOffers = predictedPlayerTradeOffers(animal);
        const liveOffers = materializeLockedPlayerTradeOffers(animal, lockedOffers);
        return liveOffers.length ? [{ animal, liveOffers }] : [];
    });

    if (!candidates.length) return false;

    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    const animal = selected.animal;
    const liveOffers = selected.liveOffers;

    // Preserve the zoo slot exactly as if the player had dragged this card
    // into Outgoing Offer manually. It remains logically occupied until the
    // incoming card is picked up/accepted.
    reserveAnimalZooSlot(animal, animal.enclosureId, animal.slotIndex);

    state.outgoingOffer = animal;
    animal.hand = false;
    animal.enclosureId = null;
    animal.slotIndex = null;

    noteNewCardAction();
    refreshDrawAvailabilityState();
    renderZoo();

    // V134: install the exact VERIFIED live offers captured above. Do not call
    // predictedPlayerTradeOffers() or materializeLockedPlayerTradeOffers()
    // again after the animal has moved into Outgoing Offer.
    if (isRealOpponentMode()) {
        state.opponentProfiles = liveOffers.map((item, index) =>
            realZooProfile(item.record, index)
        );
        state.opponentTradeStocks = liveOffers.map(item =>
            realZooTradeAnimals(item.record, true)
        );
        state.tradeOffers = liveOffers.map((item, index) => ({
            opponentIndex: index,
            animal: item.animal
        }));
        state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;
    } else {
        state.tradeOffers = liveOffers.map(item => ({
            opponentIndex: item.opponentIndex,
            animal: item.animal
        }));
        state.selectedTradeOpponent = state.tradeOffers.length
            ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
            : null;
    }

    // The offer is now in state synchronously, so renderTrade() can show it
    // immediately. Preloading only improves the image and can no longer decide
    // whether the trade exists.
    renderTrade();
    renderOpponentTradeState();
    preloadAnimals(state.tradeOffers.map(offer => offer.animal)).then(() => {
        renderTrade();
        renderOpponentTradeState();
    });
    return true;
}

// Clicking/tapping the empty Outgoing Offer box is a shortcut for choosing a
// random zoo animal that is already known to have at least one valid offer.
outgoingOfferBox.addEventListener('click', event => {
    if (state.drag || state.pan) return;
    if (state.outgoingOffer) return;

    event.preventDefault();
    event.stopPropagation();
    autoSelectOutgoingOfferAnimal();
});

// V163: one authoritative Outgoing Offer hover path.
// Order matters: suppress yellow first WITHOUT rebuilding DOM, then calculate
// and paint the blue trade glow onto those same card nodes.
// V173: entering either trade-offer box must hand the hover preview back to
// its normal hide lifecycle. The preview itself cancels its hide timer while
// hovered; without this reset, moving from the enlarged preview into the trade
// controls could leave the bottom-left card stuck on screen indefinitely.
function releaseHoverPreviewForTradeControls() {
    cancelHoverPreviewIntent();
    if (!hoverPreview.classList.contains('visible')) return;
    setHoverPreviewSuperZoom(false);
    scheduleHoverPreviewHide();
}

outgoingOfferBox.addEventListener('mouseenter', () => {
    releaseHoverPreviewForTradeControls();

    if (state.sandboxMode) return;

    state.outgoingOfferTradeHoverActive = true;
    setOutgoingOfferExchangeGlowSuppression(true);

    if (!window.matchMedia('(max-width: 700px)').matches &&
        tradeGlowTarget(outgoingOfferBox)) {
        applyTradeEligibleGlow();
    }
});

outgoingOfferBox.addEventListener('mouseleave', () => {
    if (state.sandboxMode) return;

    state.outgoingOfferTradeHoverActive = false;
    setOutgoingOfferExchangeGlowSuppression(false);

    if (!window.matchMedia('(max-width: 700px)').matches &&
        tradeEligibleGlowActive) {
        scheduleTradeEligibleGlowFade();
    }
});

// Keep Incoming Offer consistent with Outgoing Offer. It does not need the
// outgoing blue-glow state, but it must release any preview hide cancellation.
incomingOfferBox.addEventListener('mouseenter', () => {
    releaseHoverPreviewForTradeControls();
});

function renderTrade() {
    if (!outgoingOfferBox || !incomingOfferBox) return;
    collectionTrackVisibleTradeOffers();
    if (state.sandboxMode) {
        outgoingOfferBox.style.display = 'none';
        incomingOfferBox.style.display = 'none';
        const area = document.getElementById('opponentTradeArea');
        if (area) area.style.display = 'none';
        return;
    }
    outgoingOfferBox.style.display = '';
    incomingOfferBox.style.display = '';
    const area = document.getElementById('opponentTradeArea');
    if (area) area.style.display = '';
    outgoingOfferBox.innerHTML = ''; incomingOfferBox.innerHTML = '';
    outgoingOfferBox.classList.toggle('trade-filled', Boolean(state.outgoingOffer));
    if (state.outgoingOffer) { const img=document.createElement('img'); setupAnimalCard(img,state.outgoingOffer,'outgoing'); img.classList.add('trade-card'); outgoingOfferBox.appendChild(img); }
    else outgoingOfferBox.innerHTML = state.gameOptions.animalLanguage === 'nl'
        ? '<span>UITGAAND<br>AANBOD</span>'
        : '<span>OUTGOING<br>OFFER</span>';
    const offer=selectedTradeOffer(); incomingOfferBox.classList.toggle('trade-filled',Boolean(offer));
    const canAcceptIncoming = Boolean(offer) && incomingOfferCanBeAccepted();
    incomingOfferBox.classList.toggle('trade-locked', Boolean(offer) && !canAcceptIncoming);
    if (offer) {
        const img=document.createElement('img'); img.className='animal-card trade-card incoming-trade-card'; applyLocalizedAnimalImage(img,offer.animal); img.draggable=false; attachImageError(img,`trade offer ${offer.animal.filename}`);
        img.addEventListener('mouseenter',()=>requestHoverPreview(offer.animal)); img.addEventListener('mouseleave',()=>hideHoverPreviewIfAllowed(offer.animal));
        if (canAcceptIncoming) img.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();startTradeResultDrag(e);});
        else img.title='Offer a same-level animal from one of this opponent’s three preferred categories first.';
        incomingOfferBox.appendChild(img);
    }
    else incomingOfferBox.innerHTML = state.gameOptions.animalLanguage === 'nl'
        ? '<span>INKOMEND<br>AANBOD</span>'
        : '<span>INCOMING<br>OFFER</span>';
    let decline = document.getElementById('declineOpponentOffer');
    if (state.autonomousTradeOffer) {
        if (!decline) {
            decline=document.createElement('button');
            decline.id='declineOpponentOffer';
            decline.type='button';
            decline.className='decline-opponent-offer';
        }
        // V101: never attach this button to whichever parent the incoming box
        // happens to have during a render. During layout changes that could be
        // #exchangeControls, leaving the decline prompt under EXCHANGE after
        // the incoming box was moved into the fixed trade overlay.
        ensureTradeAreaLayout();
        const tradeArea = document.getElementById('opponentTradeArea');
        if (tradeArea && decline.parentElement !== tradeArea) tradeArea.appendChild(decline);
        const turnsLeft=Math.max(0,state.autonomousTradeOffer.expiresTurn-state.turn);
        decline.textContent=`Decline (${turnsLeft} turn${turnsLeft===1?'':'s'} left)`;
        decline.style.display='block';
        decline.onclick=declineAutonomousOpponentOffer;
    } else if (decline) decline.style.display='none';
    renderOpponentTradeState();
}
function startTradeResultDrag(event) {
    const offer=selectedTradeOffer(); if(!offer||!incomingOfferCanBeAccepted()||state.drag||state.pan)return;
    const rect=event.currentTarget.getBoundingClientRect(), image=document.createElement('img'); image.className='dragging-animal'; applyLocalizedAnimalImage(image,offer.animal); image.style.width=`${rect.width}px`; image.style.height=`${rect.height}px`; image.style.pointerEvents='none'; document.body.appendChild(image);

    // V117: until the player actually picks up the incoming animal, the
    // outgoing animal's former zoo slot stays logically occupied. The instant
    // the incoming card is dragged, release that reservation so the incoming
    // card can be dropped into precisely that newly-vacated slot.
    const outgoing = state.outgoingOffer;
    const releasedReservation = outgoing && outgoing.reservedEnclosureId != null
        ? {
            enclosureId: outgoing.reservedEnclosureId,
            slotIndex: outgoing.reservedSlotIndex
        }
        : null;
    if (outgoing) clearAnimalZooReservation(outgoing);

    // Keep the exact incoming animal on the drag itself.
    state.drag={
        type:'trade-result',
        image,
        incomingAnimal:offer.animal,
        releasedOutgoingReservation:releasedReservation,
        startClientX:event.clientX,
        startClientY:event.clientY,
        offsetX:event.clientX-rect.left,
        offsetY:event.clientY-rect.top
    };
    moveTradeResultDragImage(event);
    renderAll();
}
function moveTradeResultDragImage(event){if(state.drag?.type!=='trade-result')return;state.drag.image.style.left=`${event.clientX-state.drag.offsetX}px`;state.drag.image.style.top=`${event.clientY-state.drag.offsetY}px`;}
function acceptSelectedTrade(destination=null, autoPlace=false) {
    const offer=selectedTradeOffer();
    if(!offer) return false;
    const incoming=offer.animal;
    const autonomous = Boolean(state.autonomousTradeOffer);
    if(!state.outgoingOffer) return false;
    if(autonomous && !outgoingFitsAutonomousOffer()) return false;

    const outgoingForHistory = state.outgoingOffer;
    releaseOutgoingTradeReservation();
    const tradeProfile = state.opponentProfiles[offer.opponentIndex];
    const tradeZooName = tradeProfile?.name || `Zoo ${offer.opponentIndex + 1}`;

    if(autoPlace && !destination) {
        destination = randomEligibleDestinationForAnimal(incoming);
    }

    if(destination) {
        if(!placeAnimal(incoming,destination.enclosure,destination.slotIndex)) return false;
        if(autoPlace) markNewPlacementGlow(incoming);
    } else {
        // Clicking an incoming trade card now requires a legal automatic
        // destination. Dragging remains the manual placement path.
        if(autoPlace) return false;
        incoming.hand=true;
        state.hand.push(incoming);
    }

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

    if (!isRealOpponentMode()) {
        const outgoingForOpponent = state.outgoingOffer;
        if (
            outgoingForOpponent &&
            !fictionalOpponentHasAnimal(offer.opponentIndex, outgoingForOpponent)
        ) {
            state.opponentTradeStocks[offer.opponentIndex].push(outgoingForOpponent);
        }
    }

    fillOpponentTradeStock(offer.opponentIndex);

    // V161: update the exact physical cards' provenance before ownership moves.
    markAnimalTradedTo(outgoingForHistory, tradeZooName);
    markAnimalTradedFrom(incoming, tradeZooName);
    collectionMarkDeparture(outgoingForHistory, {
        type: 'trade',
        turn: state.turn,
        to: tradeZooName,
        forName: animalDisplayName(incoming),
        forLevel: incoming.level
    });

    // Every accepted trade is an exchange: the player's offered animal
    // leaves the zoo whether the negotiation was player- or opponent-initiated.
    const outgoingId=state.outgoingOffer.id;
    state.animals=state.animals.filter(a=>a.id!==outgoingId);
    state.suppressedExchangeGlowIds.delete(outgoingId);
    state.outgoingOffer=null;
    setOutgoingOfferExchangeGlowSuppression(false);

    state.animals.push(incoming);
    markPlayerLevelSeen(incoming.level);

    // Recalculate progression only after BOTH sides of the trade have changed
    // ownership, so a traded-away last card cannot keep a box checked while
    // the incoming card is being evaluated.
    checkEnclosureReward(incoming);
    state.tradeOffers=[];
    state.selectedTradeOpponent=null;
    state.autonomousTradeOffer=null;
    if (isRealOpponentMode()) clearRealOpponentDisplay();
    scheduleNextAutonomousOpponentOffer();
    state.glowingEnclosureIds.clear();

    state.tradeHistory.push({
        turn: state.turn,
        zooName: tradeZooName,
        outgoingId: outgoingForHistory.id,
        outgoingName: String(outgoingForHistory.filename || '').replace(/\.png$/i, ''),
        outgoingLevel: outgoingForHistory.level,
        incomingId: incoming.id,
        incomingName: String(incoming.filename || '').replace(/\.png$/i, ''),
        incomingLevel: incoming.level
    });

    updateCollectionCohabitation();
    state.turn++;
    updateCollectionCohabitation();
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}
function finishTradeResultDrag(event) {
    const drag=state.drag;if(!drag||drag.type!=='trade-result')return;
    const distance=Math.hypot(event.clientX-drag.startClientX,event.clientY-drag.startClientY);
    const dragRect=drag.image?.getBoundingClientRect?.()||null;
    const incoming=drag.incomingAnimal||selectedTradeOffer()?.animal||null;
    drag.image?.remove();state.drag=null;
    if(distance<6){
        // A click/very short drag uses auto-placement. The reservation remains
        // released while the destination is chosen.
        if(!acceptSelectedTrade(null,true) && state.outgoingOffer && drag.releasedOutgoingReservation) {
            reserveAnimalZooSlot(
                state.outgoingOffer,
                drag.releasedOutgoingReservation.enclosureId,
                drag.releasedOutgoingReservation.slotIndex
            );
            renderAll();
        }
        return;
    }

    // V87: validate the destination against the ACTUAL incoming trade card.
    // The outgoing card has already been removed from its enclosure when it
    // entered OUTGOING OFFER, so its former slot is immediately eligible here.
    // Use the same geometry-aware targeting as other result-card drags, with
    // DOM hit-testing as a fallback.
    const destination = incoming
        ? (resultDropDestinationFromDrag(event,incoming,dragRect) ||
           resultDropDestination(event,incoming))
        : null;

    if(destination) {
        if(!acceptSelectedTrade(destination) && state.outgoingOffer && drag.releasedOutgoingReservation) {
            reserveAnimalZooSlot(
                state.outgoingOffer,
                drag.releasedOutgoingReservation.enclosureId,
                drag.releasedOutgoingReservation.slotIndex
            );
            renderAll();
        }
    } else {
        // Cancelled/invalid drop: the trade has not happened, so put the
        // logical occupancy reservation back exactly where it was.
        if(state.outgoingOffer && drag.releasedOutgoingReservation) {
            reserveAnimalZooSlot(
                state.outgoingOffer,
                drag.releasedOutgoingReservation.enclosureId,
                drag.releasedOutgoingReservation.slotIndex
            );
        }
        renderAll();
    }
}
function setupOpponentTradeClicks() {
    ensureOpponentZooElements();
    for (let i = 0; i < 6; i++) {
        const el = $(`opponentName${i + 1}`);
        if (!el || el.dataset.tradeClickBound === '1') continue;
        el.dataset.tradeClickBound = '1';

        el.addEventListener('click', () => {
            if (state.autonomousTradeOffer) return;
            if (!state.tradeOffers.some(o => o.opponentIndex === i)) return;
            state.selectedTradeOpponent = i;
            renderTrade();
        });

        // V152: opponent names on the main game screen no longer open
        // collection popups. All Zoos and Trade History retain their popups.
    }
}


// ============================================================
// ZOO NAME EDITING
// ============================================================

function ensureZooNameRandomButtonStyles() {
    if (document.getElementById('zoo-name-random-button-styles')) return;

    const style = document.createElement('style');
    style.id = 'zoo-name-random-button-styles';
    style.textContent = `
        .zoo-name-random-button {
            margin-left: 4px;
            width: 26px;
            height: 26px;
            padding: 0;
            line-height: 24px;
            text-align: center;
            cursor: pointer;
        }
        .zoo-name-random-button[hidden] {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}


function createZooNameEditor() {

    ensureZooNameRandomButtonStyles();

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


    const randomButton =
        document.createElement(
            'button'
        );

    randomButton.type =
        'button';

    randomButton.className =
        'zoo-name-random-button';

    randomButton.title =
        'Generate a new random zoo name';

    randomButton.setAttribute(
        'aria-label',
        'Generate a new random zoo name'
    );

    randomButton.textContent =
        '↻';

    randomButton.hidden =
        true;


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

                randomButton.hidden =
                    false;


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

                randomButton.hidden =
                    true;

            }

        }
    );


    randomButton.addEventListener(
        'click',
        event => {
            event.preventDefault();
            event.stopPropagation();

            const pool = buildZooNamePool(state.zooNamesData)
                .filter(name => name && name !== state.zooName);

            const nextName = pool.length
                ? randomItem(pool)
                : randomItem([
                    'Riverside Zoo',
                    'Forest Wildlife Park',
                    'Lakeside Zoo',
                    'Highland Wildlife Park',
                    'Meadowlands Zoo',
                    'Coastal Animal Park'
                ]);

            const input = wrapper.querySelector('.zoo-name-input');

            if (input) {
                input.value = nextName;
                input.focus();
                input.select();
            } else {
                state.zooName = nextName;
                text.textContent = state.zooName;
            }
        }
    );


    wrapper.appendChild(
        text
    );


    wrapper.appendChild(
        button
    );

    wrapper.appendChild(
        randomButton
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

function generateNewPlayerZooName() {
    const pool = buildZooNamePool(state.zooNamesData)
        .filter(name => name && name !== state.zooName);

    state.zooName = pool.length
        ? randomItem(pool)
        : randomItem([
            'Riverside Zoo',
            'Forest Wildlife Park',
            'Lakeside Zoo',
            'Highland Wildlife Park',
            'Meadowlands Zoo',
            'Coastal Animal Park'
        ]);

    createZooNameEditor();
}

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

    // The instant-start path has no setup country, but a generated name can
    // still identify its type once the expanded name data is available.
    state.zooType = inferZooTypeFromAnyGeneratedName(state.zooName);


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
    setHoverPreviewSuperZoom(true);
});

hoverPreview.addEventListener('mouseleave', () => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    setHoverPreviewSuperZoom(false);
    scheduleHoverPreviewHide();
});

hoverPreview.addEventListener('click', event => {
    if (event.target.closest('#wikiPreviewLink, #ztlPreviewLink, #animalInformationZtlLink, .animal-info-tab, .ztl-record')) return;

    // V181: normal click still flips the card, but a click-drag text selection
    // inside the information face must remain a normal browser selection.
    const selection = window.getSelection?.();
    if (selection && !selection.isCollapsed && String(selection).trim()) {
        return;
    }

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
            setHoverPreviewSuperZoom(true);
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
    setHoverPreviewSuperZoom(false);
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

// ============================================================
// START
// ============================================================

async function loadOptionalJsonInBackground(path, timeoutMs = 8000) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId = null;

    try {
        if (controller) {
            timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        }

        const response = await fetch(
            path,
            controller
                ? { signal: controller.signal, cache: 'default' }
                : { cache: 'default' }
        );

        if (!response.ok) {
            throw new Error(`Could not load ${path}. HTTP ${response.status}.`);
        }

        return await response.json();
    } finally {
        if (timeoutId !== null) clearTimeout(timeoutId);
    }
}

function loadNonEssentialGameData() {
    // These resources improve the game, but none of them is allowed to hold
    // the boot screen open. Mobile Safari can leave individual fetches pending
    // for much longer than desktop browsers, so each job is independent and
    // time-limited.
    loadOptionalJsonInBackground('eligible-combinations.json')
        .then(data => {
            state.compatibilityData = data || {
                compatible_pairs: [],
                proxy_compatibility: { enabled: false, groups: {} }
            };
            rebuildCompatibilityGraphs();
            rebuildCompatibilityEvidenceIndex();
            ensureCompatibilityGlowStyles();
            renderAll();
        })
        .catch(error => console.warn('Compatibility rules unavailable:', error));

    loadOptionalJsonInBackground('assets/data/animals.json')
        .then(data => {
            state.animalDatabase = data || { animals: [] };
            indexAnimalDatabase();
        })
        .catch(error => {
            console.warn('Animal information database unavailable:', error);
            state.animalDatabase = { animals: [] };
            indexAnimalDatabase();
        });

    loadOptionalJsonInBackground('zoo-names.json')
        .then(data => {
            // The expanded European database can provide country, location,
            // prefix and zoo-type information for New Zoo.
            state.zooNamesData = data;
            if (repairLoadedZooName()) {
                createZooNameEditor();
                writeAutoResumeSnapshot(true);
            }
        })
        .catch(error => console.warn('Zoo names unavailable; using built-in fallbacks:', error));

    state.realZooData = { zoos: [] };
    state.realZooSessionHoldings = new Map();
    loadRealZooDataInBackground();
    loadProvinceConnectionsInBackground();
}

async function startGame() {
    if (incomingOfferBox) incomingOfferBox.innerHTML =
        state.gameOptions.animalLanguage === 'nl'
            ? '<span>INKOMEND<br>AANBOD</span>'
            : '<span>INCOMING<br>OFFER</span>';

    try {
        // asset-inventory.json is the one external data file required to build
        // an actual playable zoo. Everything else starts in the background.
        setLoading('Starting Zoo Curator...', 'Loading animal cards...');

        state.inventory = await loadJson(
            'asset-inventory.json',
            'Loading animal cards...',
            10000
        );

        const availableCategories = Object.keys(FOLDERS).filter(
            category => levelFiles(category, 1).length > 0
        );

        if (availableCategories.length === 0) {
            throw new Error('The asset inventory contains no usable Level 1 animal cards.');
        }

        // Safe defaults let the zoo become playable before optional JSON files
        // have arrived.
        state.compatibilityData = {
            compatible_pairs: [],
            proxy_compatibility: { enabled: false, groups: {} }
        };
        rebuildCompatibilityGraphs();
        rebuildCompatibilityEvidenceIndex();
        ensureCompatibilityGlowStyles();
        ensureDrawSpaceGuardStyles();

        state.animalDatabase = { animals: [] };
        indexAnimalDatabase();
        state.zooNamesData = null;
        state.categoryColours = { ...CATEGORY_COLOURS };

        ensureGameOptionsUI();
        ensureSaveLoadUI();
        ensureTurnHistoryUI();
        ensureCollectionButton();
        ensureCollectionCategoryLinks();
        setupOpponentTradeClicks();

        const resumedPreviousZoo = restoreAutoResumeSnapshot();

        if (!resumedPreviousZoo) {
            // assignZooNames already has built-in fallback names when the
            // external zoo-name pool has not arrived yet.
            assignZooNames();
            createStartingZoo();
            assignOpponentProfiles();
        } else {
            // A resumed zoo does not pass through assignZooNames(), so make
            // sure the header editor is rebuilt from the restored/repaired
            // name instead of leaving the HTML placeholder behind.
            repairLoadedZooName();
            createZooNameEditor();
        }

        // Make startup progress visible on mobile instead of showing only a
        // generic image-loading message.
        await preloadAnimalsWithProgress(state.animals);

        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);
        renderAll();
        state.loaded = true;

        // V128: the game is now genuinely playable. The old hint code waited
        // for state.setupComplete, a legacy property that is no longer set in
        // the current auto-generated-starting-zoo flow, so its timer never
        // armed. Start the decision hint from the real ready-state instead.
        idleGuideSetupWasComplete = true;
        armActionHint(blueHintInitialDelay());

        // Tell the independent HTML startup watchdog that JavaScript has
        // successfully reached the playable state. Without this flag the
        // 20-second watchdog overlays the already-running game and makes it
        // appear frozen.
        window.__zooGameReady = true;

        if (!resumedPreviousZoo) {
            writeAutoResumeSnapshot(true);
        }

        gameApp.classList.add('visible');
        centerInitialView();

        // V175: once the playable zoo is visible, remove the loading overlay
        // immediately. Do not paint a transient "Zoo Curator ready!" frame on
        // reload; that produced an unnecessary ZOO CURATOR / READY flash.
        if (bootScreen) {
            bootScreen.classList.add('hidden');
            bootScreen.style.display = 'none';
        }

        // Nothing below this line is allowed to delay the visible/playable zoo.
        setTimeout(() => {
            loadNonEssentialGameData();
            prepareNextDrawAsset();
        }, 0);
    }
    catch (error) {
        showFatal(error);
    }
}


// ============================================================
// GO
// ============================================================

startGame();


window.addEventListener('resize', () => { positionOpponentTradeArea(); });
