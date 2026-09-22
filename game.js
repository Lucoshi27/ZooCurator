/*
 * ZOO CURATOR 
 * Current consolidated build. Historical patch-version labels were removed
 * from inline comments so this constant is the single in-code version marker.
 */
const ZOO_CURATOR_VERSION = "V220.88";


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
const MOBILE_ZOOM_MIN = 0.22;

function currentZoomMin() {
    return window.matchMedia('(max-width: 700px)').matches
        ? MOBILE_ZOOM_MIN
        : ZOOM_MIN;
}
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
    // collection size controls starting animals + starting level curve.
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

    // independent enclosure-space curve.
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

    // secret sandbox mode is saved with the game but isolated from normal rules.
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
    realZooDataLoadState: 'loading',
    // trade shortlist is embedded inside real_zoo_opponents.json, so the
    // browser needs only one real-zoo request and never builds the index at runtime.
    realZooTradeIndex: null,
    realZooRecordByStaticId: new Map(),
    // Mutable copy of real-zoo holdings for THIS game only.
    // real_zoo_opponents.json remains untouched.
    realZooSessionHoldings: new Map(),
    realZooTradeDirtyZoos: new Set(),
    provinceConnections: { provinces: {} },
    provinceDistanceCache: new Map(),
    highestZooPrestige: 0,

    zooName: '',
    zooCountry: '',
    zooProvince: '',
    zooLocation: '',
    zooType: 'general',
    // A manual main-screen rename keeps the chosen text while the zoo remains
    // in the same identity territory. The latch is cleared only after the
    // collection genuinely crosses into another specialist/general territory.
    manualZooNameOverrideType: null,
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
    // permanent identity-based provenance for every physical animal card
    // encountered by the player. Never infer location from species/name.
    animalLineage: new Map(),

    // permanent species collection / discovery journal.
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
    newEnclosureGlowStartedAt: new Map(),

    // Eligible cards whose yellow glow the player manually hid.
    suppressedExchangeGlowIds: new Set(),
    // once the player selects an exchange-eligible card, only that
    // category+level group keeps its yellow eligibility glow.
    exchangeGlowFocusKey: null,
    // hovering the Outgoing Offer temporarily suppresses every yellow
    // exchange glow so the blue trade-interest glow is visually isolated.
    outgoingOfferHoverSuppressesExchangeGlow: false,
    outgoingOfferTradeHoverActive: false,
    // Yellow exchange-eligibility card glows are contextual only: they are
    // visible while the player is inspecting an Exchange or Upgrade box.
    exchangeEligibilityHoverActive: false,
    lastExchangeGroupCounts: new Map(),
    exchangeGlowReturnUntil: 0,
    exchangeGlowReturnIds: new Set(),
    exchangeGlowDragStartedAt: 0,
    exchangeGlowContinueIds: new Set(),
    exchangeGlowContinueStartedAt: 0,
    exchangeGlowContinueUntil: 0,

    // cards placed by a simple click glow yellow for 3 seconds,
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


// Older/embedded WebKit builds may lack queueMicrotask. Several UI paths use
// it before/around startup, so provide a Promise-based equivalent rather than
// allowing a ReferenceError to abort the script.
const enqueueMicrotask =
    typeof queueMicrotask === 'function'
        ? queueMicrotask.bind(globalThis)
        : callback => Promise.resolve().then(callback);

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

const hoverPreview = $('hoverPreview');
const hoverPreviewImage = $('hoverPreviewImage');

// keep the bottom-left card preview out of the very first paint.
// Its artwork/source may already exist while the page is booting, so relying
// only on the later `.visible` class can briefly expose the white card box.
// The preview is explicitly released only by showHoverPreview().
if (hoverPreview) {
    hoverPreview.style.setProperty('display', 'none', 'important');
    hoverPreview.style.setProperty('visibility', 'hidden', 'important');
    hoverPreview.setAttribute('aria-hidden', 'true');
}


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


// Required-element validation belongs inside startGame()'s try/catch.
// Keeping it at top level could abort the whole script before showFatal()
// had any chance to replace the mobile loading screen with a useful error.

// ============================================================
// TRADE-ELIGIBLE CARD HIGHLIGHT
// ============================================================

let tradeEligibleGlowHideTimer = null;
let tradeEligibleGlowActive = false;
// trade-hover work is chunked across animation frames so hovering the
// trade area never performs every zoo/animal calculation in one blocking task.
let tradeEligibleGlowWorkToken = 0;

// ============================================================
// OPPONENT CATEGORY PROGRESSION TRADE RULE
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
    if (!record || !wantedAnimal) return false;

    // True specialist rule: if a real zoo has exactly one favoured category,
    // it will only accept animals from that category. Zoos with zero or two+
    // favourites keep the existing broader trade behaviour.
    const favourites = Array.isArray(record.preferred_categories)
        ? record.preferred_categories.filter(Boolean)
        : [];

    if (favourites.length === 1 && wantedAnimal.category !== favourites[0]) {
        return false;
    }

    return opponentHasCategoryPrerequisite(
        realZooTradeSpecs(record),
        wantedAnimal
    );
}


// Hard acceptance rule used by the last real-zoo rescue pass. A true
// specialist never breaks its sole-category identity, but a generalist zoo may
// become unusually accommodating when the player would otherwise have no real
// zoo offer. This deliberately ignores the normal category-progression
// reluctance; it does NOT relax duplicate-species, same-level, actual-holdings
// or destination-space rules.
function realZooCanHelpfullyTradeFor(record, wantedAnimal) {
    if (!record || !wantedAnimal) return false;

    const favourites = Array.isArray(record.preferred_categories)
        ? record.preferred_categories.filter(Boolean)
        : [];

    return !(
        favourites.length === 1 &&
        wantedAnimal.category !== favourites[0]
    );
}

function fictionalZooCanTradeFor(opponentIndex, wantedAnimal) {
    return opponentHasCategoryPrerequisite(
        state.opponentTradeStocks[opponentIndex] || [],
        wantedAnimal
    );
}

// ============================================================
// GUARANTEED TRADE AVAILABILITY
// ============================================================

// "Full" follows the same physical-enclosure logic as startup: every separate
// enclosure group must contain at least one animal. A large enclosure therefore
// counts as occupied as soon as one of its slots is occupied.
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

function emergencyTradeNeeded() {
    // The guaranteed-offer path is no longer a deadlock-only rescue.
    // Whenever the player is in the live zoo with no trade already in progress,
    // at least one legal trade option should exist if the current holdings and
    // opponent pools make any legal trade possible. Draw/upgrade availability
    // does not suppress this guarantee.
    return (
        state.historyViewTurn === null &&
        !state.sandboxMode &&
        !state.result &&
        !state.outgoingOffer &&
        !state.autonomousTradeOffer
    );
}

// Find ONE deterministic legal guaranteed trade. This bypasses only trade
// reluctance/frequency when ordinary rolls would otherwise leave zero options. Same-level trading, ownership restrictions and the
// opponent category-progression prerequisite remain in force.
function emergencyTradeSelection(writeState = true) {
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
    // For the guaranteed option, bypass reluctance/frequency but keep the same
    // prestige-window and geographical partner rules as normal trading.
    if (isRealOpponentMode()) {
        for (const outgoing of shuffledPlayers) {
            const records = realZooRecordsAvailableForTrade(outgoing);
            const orderedRecords = selectPrestigeLocationCandidates(
                records.map(record => ({ record })),
                records.length,
                `emergency-real-record-order|${outgoing.id}|${state.turn}|${tradeOfferWindow()}`
            ).map(item => item.record);

            for (const record of orderedRecords) {
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
            if (writeState) fillOpponentTradeStock(index);
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
    // 2. HELPFUL REAL-ZOO MODE BEFORE PRIVATE PET TRADE
    // --------------------------------------------------------
    // If normal partner rules still produce no guaranteed offer, ask every real
    // zoo whether it can HELP the player. At this point soft reluctance is gone:
    // prestige/geography, random offer chance, preferred-category weighting and
    // the normal category-progression prerequisite no longer veto a generalist.
    // Hard rules remain untouched: no duplicate species for the player, the zoo
    // must genuinely own the offered animal, the trade stays same-level, there
    // must be a legal destination, and one-category specialists remain strict.
    if (isRealOpponentMode()) {
        const allRealZoos = realZooRecordsAvailable();
        const tradePrestige = playerTradeAccessPrestige(updateHighestZooPrestige());

        for (const outgoing of shuffledPlayers) {
            const candidates = allRealZoos
                .filter(record => realZooCanHelpfullyTradeFor(record, outgoing))
                .map(record => {
                    const matching = realZooTradeAnimals(record, true)
                        .filter(candidate =>
                            candidate.level === outgoing.level &&
                            tradeIncomingHasDestinationAfterOutgoing(candidate, outgoing)
                        );
                    return { record, matching };
                })
                .filter(item => item.matching.length)
                .sort((a, b) => {
                    // Keep the forced partner as sensible as possible: prefer a
                    // zoo closest to the player's trade-access prestige, then
                    // nearer geography, then a stable name order.
                    const prestigeDifference =
                        Math.abs(realZooPrestige(a.record) - tradePrestige) -
                        Math.abs(realZooPrestige(b.record) - tradePrestige);
                    if (prestigeDifference) return prestigeDifference;

                    const geographyDifference =
                        realZooGeographyBand(a.record) - realZooGeographyBand(b.record);
                    if (geographyDifference) return geographyDifference;

                    return String(a.record.name || '').localeCompare(
                        String(b.record.name || '')
                    );
                });

            if (candidates.length) {
                const chosenZoo = candidates[0];
                const { seed } = seededRoll(
                    `forced-real-animal|${outgoing.id}|${chosenZoo.record.name}|${state.turn}`
                );
                return {
                    outgoingId: outgoing.id,
                    record: chosenZoo.record,
                    animal: chosenZoo.matching[seed % chosenZoo.matching.length],
                    forcedRealZooTrade: true,
                    helpfulRealZooTrade: true
                };
            }
        }
    }

    // --------------------------------------------------------
    // 3. LAST RESORT — PRIVATE PET TRADE
    // --------------------------------------------------------
    // Never interpret "the real-zoo database has not loaded" as "no real zoo
    // can trade". That race was the reason Private Pet Trade could dominate
    // immediately after startup (and also masked malformed real-zoo JSON).
    // In real-opponent mode, Private Pet Trade is permitted only after the
    // database has successfully loaded and the exhaustive helpful-zoo pass
    // above genuinely found zero legal real-zoo trades.
    if (isRealOpponentMode() && state.realZooDataLoadState !== 'ready') {
        return null;
    }

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
            id: writeState ? state.nextId++ : -1,
            category: chosen.category,
            level: 1,
            filename: cleanFilename(chosen.filename),
            enclosureId: null,
            slotIndex: null,
            }
    };
}

function emergencyTradeForAnimal(outgoing, writeState = true) {
    if (!outgoing) return null;
    const rescue = emergencyTradeSelection(writeState);
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


function predictedPlayerTradeOffers(animal, writeCache = true) {
    if (!animal) return [];

    // Guaranteed fallback remains state-dependent and is deliberately not cached.
    const emergency = emergencyTradeForAnimal(animal, writeCache);
    if (emergency) return [emergency];

    // honour an already-promised offer BEFORE recalculating the interest
    // cap. Once this animal is moved into state.outgoingOffer,
    // normalTradeInterestAllowed() excludes it from the zoo ranking by design.
    // Checking the cap first could therefore overwrite its locked offer with [].
    const cached = cachedPlayerTradeOffers(animal);
    if (cached) return cached;

    // The guaranteed fallback bypasses the ordinary interest cap. Ordinary offers do not.
    if (!normalTradeInterestAllowed(animal)) {
        if (writeCache) storePlayerTradeOffers(animal, []);
        return [];
    }

    // The first prediction for this physical card/window is locked below, so
    // the blue glow and click/drag trade paths all consume the same result.

    const frequency = tradeFrequencyFactor();

    if (frequency <= 0) {
        if (writeCache) storePlayerTradeOffers(animal, []);
        return [];
    }

    if (isRealOpponentMode()) {
        const overallRoll = seededRoll(
            `real-overall|${animal.id}|${tradeOfferWindow()}`
        ).roll;

        if (overallRoll > frequency) {
            if (writeCache) storePlayerTradeOffers(animal, []);
            return [];
        }

        const records = realZooRecordsAvailableForTrade(animal);
        const orderedRecords = selectPrestigeLocationCandidates(
            records.map(record => ({ record })),
            records.length,
            `real-record-order|${animal.id}|${tradeOfferWindow()}`
        ).map(item => item.record);
        const candidates = [];

        // Prestige and geography are resolved before any zoo collection is
        // inspected. Walk that ordered shortlist until the offer slots are
        // full instead of materialising every animal held by every zoo.
        for (const record of orderedRecords) {
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
            if (candidates.length >= 3) break;
        }

        const locked = candidates.map(item => ({
            recordName: item.record.name,
            animalName: String(item.animal.filename || '').replace(/\.png$/i, ''),
            animalSpec: cachedTradeAnimalSpec(item.animal)
        }));

        if (writeCache) storePlayerTradeOffers(animal, locked);
        return locked;
    }

    const overallRoll = seededRoll(
        `fictional-overall|${animal.id}|${tradeOfferWindow()}`
    ).roll;

    if (overallRoll > frequency) {
        if (writeCache) storePlayerTradeOffers(animal, []);
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

    if (writeCache) storePlayerTradeOffers(animal, locked);
    return locked;
}

function animalCouldReceiveTradeInterest(animal) {
    // this is specifically the BLUE trade-interest hint. Do not couple
    // it to the yellow exchange-eligibility preference.
    if (!animal || animal.level < 1 || animal.level > 5) return false;
    if (animal === state.outgoingOffer) return false;

    if (state.autonomousTradeOffer) {
        return outgoingFitsAutonomousOffer(animal);
    }

    // This uses exactly the same seeded rolls, frequency gate, zoo-specific
    // willingness and three-offer cap as actually placing the card.
    const predicted = predictedPlayerTradeOffers(animal, false);

    // Emergency offers are already live objects and bypass the normal cache.
    if (predicted.some(item => item?.animal)) return true;

    // use the SAME full validation as the actual outgoing-offer drop.
    // Merely reconstructing an animal card is not enough: the zoo must still
    // exist/unlocked, still be eligible, still hold that exact card, and the
    // player must not already own the incoming species/card.
    return lockedPlayerTradeOffersHaveLiveOffer(animal, predicted);
}

function clearTradeEligibleGlow(immediate = true) {
    ++tradeEligibleGlowWorkToken;
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
            refreshAnimalGlowPrecedence(card.parentElement || document);
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
            refreshAnimalGlowPrecedence(card.parentElement || document);
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

    // performance fix: do NOT synchronously calculate trade interest for
    // every visible animal on pointer-enter. That used to make the browser
    // inspect many real-zoo collections in one frame and caused the visible
    // one-second freeze. Process a tiny batch per animation frame instead.
    // predictedPlayerTradeOffers() still locks/caches the exact same result,
    // so trade rules and percentages are unchanged.
    const workToken = ++tradeEligibleGlowWorkToken;
    const animalById = new Map();
    for (const animal of state.animals) animalById.set(animal.id, animal);

    const cards = [...document.querySelectorAll('.animal-card[data-animal-id]')];
    let cursor = 0;

    const processTradeGlowBatch = () => {
        if (workToken !== tradeEligibleGlowWorkToken || !tradeEligibleGlowActive) return;

        // One exact calculation per frame keeps pointer/drag/animation input
        // responsive even with a large real-zoo database. Cached cards become
        // effectively free on later hovers in the same trade window.
        const end = Math.min(cards.length, cursor + 1);
        for (; cursor < end; cursor++) {
            const card = cards[cursor];
            const animal = animalById.get(Number(card.dataset.animalId));
            card.classList.toggle(
                'trade-eligible-glow',
                Boolean(animal && animalCouldReceiveTradeInterest(animal))
            );
        }

        refreshAnimalGlowPrecedence();
        if (cursor < cards.length) requestAnimationFrame(processTradeGlowBatch);
    };

    requestAnimationFrame(processTradeGlowBatch);
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

function updateBootLoadingStatus(
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
    updateBootLoadingStatus('Loading Zoo Curator...', description);

    // The timeout must cover the ENTIRE operation, including reading and
    // parsing the response body. Racing fetch() alone only protects the wait
    // for response headers; Safari can otherwise hang indefinitely in
    // response.json() after the timeout has effectively been disarmed.
    const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId = null;

    const fullRequest = (async () => {
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
            if (error?.name === 'AbortError') throw error;
            throw new Error(
                `${path} was found but could not be read as JSON: ${error.message}`
            );
        }
    })();

    const timedRequest = timeoutMs > 0
        ? Promise.race([
            fullRequest,
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    if (controller) controller.abort();
                    reject(new Error(
                        `${path} did not finish loading within ${Math.round(timeoutMs / 1000)} seconds.`
                    ));
                }, timeoutMs);
            })
        ])
        : fullRequest;

    try {
        return await timedRequest;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error(
                `${path} did not finish loading within ${Math.round(timeoutMs / 1000)} seconds.`
            );
        }
        throw error;
    } finally {
        if (timeoutId !== null) clearTimeout(timeoutId);
    }
}


function loadOptionalJsonInBackground(path, timeoutMs = 8000) {
    const controller =
        typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timeoutId = null;

    const fullRequest = (async () => {
        const response = await fetch(
            path,
            controller
                ? { signal: controller.signal, cache: 'no-store' }
                : { cache: 'no-store' }
        );
        if (!response.ok) {
            throw new Error(`Could not load ${path}. HTTP ${response.status}.`);
        }
        return await response.json();
    })();

    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            controller?.abort();
            reject(new Error(
                `${path} did not finish loading within ${Math.round(timeoutMs / 1000)} seconds.`
            ));
        }, timeoutMs);
    });

    return Promise.race([fullRequest, timeout]).finally(() => {
        if (timeoutId !== null) clearTimeout(timeoutId);
    });
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

function rebuildRealZooStaticIdMap() {
    state.realZooRecordByStaticId = new Map();
    for (const record of state.realZooData?.zoos || []) {
        const id = Number(record?.trade_id);
        if (Number.isFinite(id)) state.realZooRecordByStaticId.set(id, record);
    }
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

    let timeoutId = null;
    const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(
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
            if (timeoutId !== null) clearTimeout(timeoutId);
            const zoos = normaliseRealZooRecords(data?.zoos);
            if (!data || !zoos.length) {
                throw new Error(`${path} does not contain any valid zoo records.`);
            }

            state.realZooData = { ...data, zoos };
            state.realZooDataLoadState = 'ready';
            const embeddedTradeIndex = data?.trade_index;
            state.realZooTradeIndex = (
                embeddedTradeIndex?.schema_version === 1 &&
                embeddedTradeIndex?.candidates_by_outgoing &&
                typeof embeddedTradeIndex.candidates_by_outgoing === 'object'
            ) ? embeddedTradeIndex : null;
            resetRealZooSessionHoldings();
            rebuildRealZooStaticIdMap();
            // Predictions made before the optional database arrived may have
            // cached an empty offer set. Recompute them against the real data.
            state.tradeOfferCache.clear();
            if (tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) {
                enqueueMicrotask(applyTradeEligibleGlow);
            }

            // If the player chose real opponents, refresh the passive opponent
            // display now that the database is available. This does not restart
            // or otherwise alter the game.
            if (state.loaded && isRealOpponentMode()) {
                renderOpponentTradeState();
            }

        })
        .catch(error => {
            if (timeoutId !== null) clearTimeout(timeoutId);
            console.warn(
                'Real zoo opponent database unavailable; game continues without it:',
                error
            );
            state.realZooData = { zoos: [] };
            state.realZooDataLoadState = 'failed';
            state.realZooTradeIndex = null;
            state.realZooRecordByStaticId = new Map();
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

            // tagged zoo-type inventories store a level as an
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

// Specialist zoo names establish a real collection identity instead of merely
// nudging random weights. The quota is applied only to starting generation;
// ordinary draws and trades retain the existing weighted preference system.
const SPECIALIST_STARTING_CATEGORIES = Object.freeze({
    aquarium: ['Marine Mania'],
    bird: ['Other Birds', 'Tropical Birds'],
    raptor: ['Birds of Prey'],
    reptile: ['Reptiles'],
    farm: ['Ungulates'],
    tropical: ['Tropical Birds', 'Primates', 'Reptiles'],
    safari: ['Ungulates', 'Carnivora'],
    forest: ['Other Mammals', 'Other Birds', 'Carnivora'],
    alpine: ['Ungulates', 'Carnivora', 'Birds of Prey']
});

function specialistStartingCategories(zooType = state.zooType) {
    const categories = [];
    for (const type of normaliseZooTypes(zooType)) {
        for (const category of SPECIALIST_STARTING_CATEGORIES[type] || []) {
            if (!categories.includes(category) && levelFiles(category, 1).length) categories.push(category);
        }
    }
    return categories;
}

function specialistStartingQuota(total, zooType = state.zooType) {
    if (!specialistStartingCategories(zooType).length) return 0;
    // About two thirds of a specialist zoo's opening collection should express
    // its advertised identity. 8 animals -> 6 specialist animals.
    return Math.min(total, Math.max(1, Math.ceil(total * 0.65)));
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

            // A timeout/network failure is transient. Do not permanently cache
            // a failed preload promise for the rest of the session; a later
            // request should be allowed to try this asset again.
            if (!ok) {
                enqueueMicrotask(() => {
                    if (state.assetPreloadPromises.get(url) === promise) {
                        state.assetPreloadPromises.delete(url);
                    }
                });
            }

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

function chooseNextLevelOneSpec() {
    const used = playerOwnedCardKeys();
    const candidates = [];

    for (const category of Object.keys(FOLDERS)) {
        if (!state.activeCategories.has(category)) continue;

        for (const filename of levelFiles(category, 1)) {
            if (used.has(animalCardKey(category, 1, filename))) continue;
            candidates.push({ category, level: 1, filename });
        }
    }

    if (!candidates.length) return null;

    // Ordinary draws now respect the same zoo-type identity used by starting
    // collection generation, but deliberately at reduced strength. Starting
    // specialists still feel strongly curated; later draws only lean toward
    // that identity and can comfortably produce off-type animals.
    return weightedRandomItem(
        candidates,
        candidate => {
            // Ordinary Level 1 draws get a simple, deliberately modest identity
            // bias: cards from categories associated with the current zoo type
            // are 1.5x as likely as otherwise-equivalent cards. Starting-zoo
            // generation remains much more strongly curated.
            const matchingCategories = specialistStartingCategories(state.zooType);
            return matchingCategories.includes(candidate.category) ? 1.5 : 1;
        }
    );
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

    // availability depends on the exact prepared card. As soon as that
    // asynchronous preparation finishes, refresh the deck's disabled state.
    // Previously the UI could remain visually enabled until the next click/render.
    state.nextDrawReadyPromise.finally(() => {
        enqueueMicrotask(() => refreshDrawAvailabilityState());
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
        enclosureId: null, slotIndex: null
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
// COLLECTION
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
            acquisitions: [],
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

    if (!Array.isArray(record.acquisitions)) record.acquisitions = [];

    // Track physical arrivals, not placements. Moving an animal between
    // enclosures calls this function again, so animalId prevents those moves
    // from becoming fake acquisitions.
    const animalId = Number(animal.id);
    if (!record.acquisitions.some(item => Number(item.animalId) === animalId)) {
        const lineage = animalLineageRecord(animal.id);
        const source = lineage?.originalFrom && lineage.originalFrom !== (state.zooName || 'Your Zoo')
            ? lineage.originalFrom
            : null;
        record.acquisitions.push({
            turn: Number(state.turn) || 0,
            animalId,
            from: source
        });
        record.acquisitions.sort((a, b) => Number(a.turn) - Number(b.turn));
    }

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

    const acquisitions = Array.isArray(record.acquisitions)
        ? [...record.acquisitions].sort((a, b) => Number(a.turn) - Number(b.turn))
        : [];
    // Backwards compatibility for saves made before acquisition history existed.
    if (!acquisitions.length && record.firstZooTurn != null) {
        acquisitions.push({ turn: record.firstZooTurn, from: null });
    }
    if (acquisitions.length) {
        lines.push('', 'Acquisitions:');
        for (const item of acquisitions) {
            lines.push(
                `Turn ${item.turn}: acquired` +
                (item.from ? ` from ${item.from}` : '')
            );
        }
    }

    if ((record.cohabitations || []).length) {
        lines.push('', 'Shared exhibits:');
        for (const item of record.cohabitations) {
            lines.push(`${item.partnerName} — from Turn ${item.startTurn}`);
        }
    }

    if ((record.departures || []).length) {
        lines.push('', 'Departures:');
        for (const item of [...record.departures].sort((a, b) => Number(a.turn) - Number(b.turn))) {
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
            if (acquired || offered) applyLocalizedAnimalImage(img, entry);
            img.alt = acquired || offered
                ? String(entry.filename).replace(/\.png$/i, '')
                : uiText('Undiscovered animal');
            img.draggable = false;
            card.appendChild(img);

            // undiscovered cards keep the artwork hidden and also mask
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


let categoryProgressHoverTimer = null;

function bindProgressCategoryInteraction(box, category) {
    // Bind directly to the freshly-created category node. This avoids relying on
    // delegated listeners surviving/rebinding correctly while the progression
    // tracker is repeatedly rebuilt.
    if (!box || box.dataset.zooCategoryPopupBound === '1') return;
    box.dataset.zooCategoryPopupBound = '1';
    box.style.pointerEvents = 'auto';
    box.style.cursor = 'pointer';

    box.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(categoryProgressHoverTimer);
        categoryProgressHoverTimer = null;
        if (categoryZooPopup?.style.display !== 'none' && categoryZooPopupCategory === category) {
            closeCategoryZooPopup();
        } else {
            openCategoryZooPopup(category, box);
        }
    });

    box.addEventListener('mouseenter', () => {
        clearTimeout(categoryProgressHoverTimer);
        categoryProgressHoverTimer = setTimeout(() => {
            categoryProgressHoverTimer = null;
            if (box.isConnected) openCategoryZooPopup(category, box);
        }, 2000);
    });

    box.addEventListener('mouseleave', () => {
        clearTimeout(categoryProgressHoverTimer);
        categoryProgressHoverTimer = null;
    });
}

function ensureCollectionCategoryLinks() {
    // V220.62: category names no longer open the Collection Book.
    // They now open a live list of animals of that category in the current zoo.
    const tracker = document.getElementById('progressTracker');
    if (!tracker || tracker.dataset.categoryZooPopupReady === '1') return;
    tracker.dataset.categoryZooPopupReady = '1';

    ensureCategoryZooPopup();

    let hoverTimer = null;
    let hoverCategory = null;

    const categoryFromTarget = target => {
        const box = target?.closest?.('.progress-category');
        if (!box || !tracker.contains(box)) return null;
        const category = String(box.dataset.category || box.textContent || '').trim();
        return CATEGORY_PROGRESSION_ORDER.includes(category) ? category : null;
    };

    tracker.addEventListener('click', event => {
        const category = categoryFromTarget(event.target);
        if (!category) return;
        event.preventDefault();
        event.stopPropagation();
        clearTimeout(hoverTimer);
        hoverTimer = null;
        if (categoryZooPopup?.style.display !== 'none' && categoryZooPopupCategory === category) {
            closeCategoryZooPopup();
        } else {
            openCategoryZooPopup(category, event.target.closest('.progress-category'));
        }
    });

    tracker.addEventListener('pointerover', event => {
        const category = categoryFromTarget(event.target);
        if (!category || category === hoverCategory) return;
        clearTimeout(hoverTimer);
        hoverCategory = category;
        const anchor = event.target.closest('.progress-category');
        hoverTimer = setTimeout(() => {
            hoverTimer = null;
            openCategoryZooPopup(category, anchor);
        }, 2000);
    });

    tracker.addEventListener('pointerout', event => {
        const box = event.target?.closest?.('.progress-category');
        if (!box) return;
        if (box.contains(event.relatedTarget)) return;
        clearTimeout(hoverTimer);
        hoverTimer = null;
        hoverCategory = null;
    });
}

let categoryZooPopup = null;
let categoryZooPopupGlowId = null;
let categoryZooPopupCategory = null;

function ensureCategoryZooPopup() {
    if (categoryZooPopup) return;

    const style = document.createElement('style');
    style.id = 'category-zoo-popup-styles';
    style.textContent = `
        #categoryZooPopup {
            position: fixed; z-index: 10040; display: none;
            min-width: 250px; max-width: 360px; max-height: min(70vh, 620px);
            overflow: auto; padding: 10px; border: 2px solid rgba(0,0,0,.45);
            border-radius: 9px; background: rgba(250,248,242,.98);
            box-shadow: 0 5px 18px rgba(0,0,0,.28); color: #222;
        }
        #categoryZooPopup .category-zoo-title { font-weight: 800; margin: 0 0 8px; font-size: 15px; }
        #categoryZooPopup .category-zoo-empty { padding: 6px 4px; opacity: .7; }
        #categoryZooPopup .category-zoo-level { font-weight: 800; font-size: 12px; margin: 8px 2px 3px; opacity: .72; }
        #categoryZooPopup .category-zoo-animal {
            display: block; width: 100%; text-align: left; border: 1px solid rgba(0,0,0,.16);
            border-radius: 5px; background: #fff; padding: 6px 8px; margin: 3px 0;
            cursor: pointer; font: inherit;
        }
        #categoryZooPopup .category-zoo-animal:hover { background: #fff4b5; }
        .animal-card.category-zoo-name-glow {
            box-shadow: 0 0 0 4px #ffd400, 0 0 18px 8px #ffd400 !important;
            filter: drop-shadow(0 0 7px #ffd400) !important;
            transition: none !important; animation: none !important;
        }
    `;
    document.head.appendChild(style);

    categoryZooPopup = document.createElement('div');
    categoryZooPopup.id = 'categoryZooPopup';
    categoryZooPopup.addEventListener('pointerdown', event => event.stopPropagation());
    categoryZooPopup.addEventListener('click', event => event.stopPropagation());
    document.body.appendChild(categoryZooPopup);

    document.addEventListener('pointerdown', event => {
        if (categoryZooPopup?.style.display !== 'none' &&
            !categoryZooPopup.contains(event.target) &&
            !event.target.closest?.('.progress-category')) {
            closeCategoryZooPopup();
        }
    });
}

function clearCategoryZooAnimalGlow() {
    if (categoryZooPopupGlowId != null) {
        document.querySelectorAll(`.animal-card[data-animal-id="${categoryZooPopupGlowId}"]`)
            .forEach(card => card.classList.remove('category-zoo-name-glow'));
    }
    categoryZooPopupGlowId = null;
}

function setCategoryZooAnimalGlow(animalId) {
    clearCategoryZooAnimalGlow();
    categoryZooPopupGlowId = Number(animalId);
    document.querySelectorAll(`.animal-card[data-animal-id="${categoryZooPopupGlowId}"]`)
        .forEach(card => card.classList.add('category-zoo-name-glow'));
}

function closeCategoryZooPopup() {
    clearCategoryZooAnimalGlow();
    categoryZooPopupCategory = null;
    if (categoryZooPopup) categoryZooPopup.style.display = 'none';
}

function categoryZooAnimalName(animal) {
    // Do not call an optional helper by identifier here: an undeclared identifier
    // still throws before optional chaining can help. The card filename is the
    // reliable species-name fallback in Zoo Curator.
    const filenameName = String(animal?.filename || '')
        .replace(/\.[^.]+$/, '')
        .replace(/_+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return animal?.name || animal?.displayName || animal?.commonName || filenameName || 'Animal';
}

function openCategoryZooPopup(category, anchor) {
    ensureCategoryZooPopup();
    clearCategoryZooAnimalGlow();
    categoryZooPopupCategory = category;

    const animals = state.animals
        .filter(animal => animal && animal.enclosureId != null && animal.category === category)
        .sort((a, b) => Number(a.level || 0) - Number(b.level || 0) ||
            categoryZooAnimalName(a).localeCompare(categoryZooAnimalName(b)));

    categoryZooPopup.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'category-zoo-title';
    title.textContent = `${category} in your zoo`;
    categoryZooPopup.appendChild(title);

    if (!animals.length) {
        const empty = document.createElement('div');
        empty.className = 'category-zoo-empty';
        empty.textContent = 'No animals of this category are currently in the zoo.';
        categoryZooPopup.appendChild(empty);
    } else {
        let lastLevel = null;
        for (const animal of animals) {
            if (animal.level !== lastLevel) {
                lastLevel = animal.level;
                const level = document.createElement('div');
                level.className = 'category-zoo-level';
                level.textContent = `Level ${animal.level}`;
                categoryZooPopup.appendChild(level);
            }
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'category-zoo-animal';
            button.textContent = categoryZooAnimalName(animal);
            button.addEventListener('mouseenter', () => setCategoryZooAnimalGlow(animal.id));
            button.addEventListener('mouseleave', clearCategoryZooAnimalGlow);
            button.addEventListener('focus', () => setCategoryZooAnimalGlow(animal.id));
            button.addEventListener('blur', clearCategoryZooAnimalGlow);
            button.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                clearCategoryZooAnimalGlow();
                focusZooAnimalAnimated(animal.id);
            });
            categoryZooPopup.appendChild(button);
        }
    }

    categoryZooPopup.style.display = 'block';
    const rect = anchor?.getBoundingClientRect?.() || { left: 12, bottom: 12, right: 12 };
    const popupRect = categoryZooPopup.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + popupRect.width > innerWidth - 8) left = innerWidth - popupRect.width - 8;
    if (top + popupRect.height > innerHeight - 8) top = Math.max(8, rect.top - popupRect.height - 6);
    categoryZooPopup.style.left = `${Math.max(8, left)}px`;
    categoryZooPopup.style.top = `${Math.max(8, top)}px`;
}

function focusZooAnimalAnimated(animalId) {
    const card = document.querySelector(`.animal-card[data-animal-id="${Number(animalId)}"]`);
    if (!card || !zooBoard) return;

    const startZoom = Number(state.zoom) || 1;
    const boardRect = zooBoard.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const worldCenterX = (zooBoard.scrollLeft + cardRect.left - boardRect.left + cardRect.width / 2) / startZoom;
    const worldCenterY = (zooBoard.scrollTop + cardRect.top - boardRect.top + cardRect.height / 2) / startZoom;
    const targetZoom = clamp(0.9, currentZoomMin(), ZOOM_MAX);
    const startLeft = zooBoard.scrollLeft;
    const startTop = zooBoard.scrollTop;
    const duration = 650;
    const started = performance.now();

    // Keep the category popup open while the camera travels to the animal.
    // It closes only when its category is clicked again or the user clicks
    // somewhere outside the popup/category control.
    const ease = t => 1 - Math.pow(1 - t, 3);
    const frame = now => {
        const t = Math.min(1, (now - started) / duration);
        const k = ease(t);
        const zoom = startZoom + (targetZoom - startZoom) * k;
        state.zoom = Math.round(zoom * 1000) / 1000;
        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

        const targetLeft = worldCenterX * state.zoom - zooBoard.clientWidth / 2;
        const targetTop = worldCenterY * state.zoom - zooBoard.clientHeight / 2;
        zooBoard.scrollLeft = startLeft + (targetLeft - startLeft) * k;
        zooBoard.scrollTop = startTop + (targetTop - startTop) * k;

        if (t < 1) requestAnimationFrame(frame);
        else {
            state.zoom = targetZoom;
            document.documentElement.style.setProperty('--zoo-zoom', state.zoom);
            zooBoard.scrollLeft = worldCenterX * state.zoom - zooBoard.clientWidth / 2;
            zooBoard.scrollTop = worldCenterY * state.zoom - zooBoard.clientHeight / 2;
        }
    };
    requestAnimationFrame(frame);
}

function ensureCollectionButton() {
    let button = document.getElementById('collectionButton');
    if (!button) {
        button = document.createElement('button');
        button.id = 'collectionButton';
        button.type = 'button';
        button.title = 'Collection';
        button.setAttribute('aria-label', 'Open animal collection');
        // Use a small drawn book instead of the platform emoji so its colour is consistent.
        button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 28 24" width="24" height="21" style="display:block">
            <path d="M2.5 3.2c4.2-.9 7.8-.2 11.5 2.1v16c-3.7-2.3-7.3-3-11.5-2.1z" fill="#7a4b2a" stroke="#4d2d18" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M25.5 3.2c-4.2-.9-7.8-.2-11.5 2.1v16c3.7-2.3 7.3-3 11.5-2.1z" fill="#8b5a32" stroke="#4d2d18" stroke-width="1.4" stroke-linejoin="round"/>
            <path d="M4.5 5.1c3.2-.4 5.7.1 8.1 1.5v11.8c-2.5-1.3-5-1.8-8.1-1.4z" fill="#e7d5ad" opacity=".95"/>
            <path d="M23.5 5.1c-3.2-.4-5.7.1-8.1 1.5v11.8c2.5-1.3 5-1.8 8.1-1.4z" fill="#e7d5ad" opacity=".95"/>
            <path d="M14 5.3v16" stroke="#4d2d18" stroke-width="1.2"/>
        </svg>`;
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

        // setup runs only after the existing HUD installers. Therefore
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

    // IMPORTANT: merely appearing together in proxy.groups does NOT make
    // species interchangeable. Some named groups are partner pools used only
    // as one side of a group_link (for example hystrix_shared_partner_pool).
    // Treating every group as an evidence-connected equivalence class caused
    // Plains Zebra to inherit unrelated Aardwolf/Caracal/etc. combinations.
    // Compatibility expansion is therefore performed ONLY by the explicit
    // complete_groups and group_links rules below.

    // honour explicit gameplay structures in newer compatibility JSON.
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

        // A *_shared_partner_pool is a list of partners that have been
        // documented with AT LEAST ONE member of the source husbandry group.
        // It is not a proxy group of interchangeable partner species.
        // Therefore Cape Porcupine may inherit Indian Crested Porcupine's
        // documented Plains Zebra compatibility, but Plains Zebra may never
        // inherit an unrelated Caracal edge merely because both occur in the
        // same partner pool.
        const exactPartnerInheritance =
            String(link.to || '').endsWith('_shared_partner_pool') ||
            link.mode === 'shared_partner_inheritance';

        if (exactPartnerInheritance) {
            for (const partner of toMembers) {
                const hasDocumentedAnchor = fromMembers.some(sourceMember =>
                    direct.get(sourceMember)?.has(partner)
                );
                if (!hasDocumentedAnchor) continue;
                for (const sourceMember of fromMembers) {
                    graphAddEdge(effective, sourceMember, partner);
                }
            }
            continue;
        }

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

    // defensive live evaluation of named gameplay groups.
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

        const forward = aGroups.has(from) && bGroups.has(to);
        const reverse = aGroups.has(to) && bGroups.has(from);
        if (!forward && !reverse) continue;

        const exactPartnerInheritance =
            to.endsWith('_shared_partner_pool') ||
            link.mode === 'shared_partner_inheritance';

        if (exactPartnerInheritance) {
            const sourceMembers = (proxy.groups[from] || []).map(compatibilityName);
            const exactPartner = forward ? bName : aName;
            if (sourceMembers.some(sourceMember =>
                state.compatibilityDirectGraph.get(sourceMember)?.has(exactPartner)
            )) {
                return true;
            }
            continue;
        }

        return true;
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
        STRICT MULTI-SPECIES COMPATIBILITY

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
        // when passively hovering an animal that is already sharing a
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

        // once an animal is already in a combination enclosure, that
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

function applyCompatibilityDestinationGlowClasses() {
    const now = Date.now();
    const activeKeys = currentCompatibilityGlowKeys();

    document.querySelectorAll('.slot[data-enclosure-id][data-slot-index]').forEach(slot => {
        const key = slotCompatibilityGlowKey(
            Number(slot.dataset.enclosureId),
            Number(slot.dataset.slotIndex)
        );

        slot.classList.remove(
            'compatibility-match-glow',
            'compatibility-match-glow-fading'
        );

        if (activeKeys.has(key)) {
            slot.classList.add('compatibility-match-glow');
        } else if (
            state.compatibilityGlowFadeKeys.has(key) &&
            now < state.compatibilityGlowHoldUntil
        ) {
            slot.classList.add('compatibility-match-glow');
        } else if (
            state.compatibilityGlowFadeKeys.has(key) &&
            now < state.compatibilityGlowFadeUntil
        ) {
            slot.classList.add('compatibility-match-glow-fading');
        }
    });
}

function beginCompatibilityGlowFade(keys) {
    state.compatibilityGlowFadeKeys = new Set(keys || []);

    if (!state.compatibilityGlowFadeKeys.size) {
        state.compatibilityGlowHoldUntil = 0;
        state.compatibilityGlowFadeUntil = 0;
        return;
    }

    const now = Date.now();

    // animal-hover destination glows begin fading the instant the
    // pointer leaves the animal. No full-strength hold remains.
    state.compatibilityGlowHoldUntil = now;
    state.compatibilityGlowFadeUntil = now + 1000;

    // glow-only updates must not rebuild the zoo DOM.
    applyCompatibilityDestinationGlowClasses();

    setTimeout(() => {
        if (Date.now() >= state.compatibilityGlowFadeUntil) {
            state.compatibilityGlowFadeKeys.clear();
            state.compatibilityGlowHoldUntil = 0;
            state.compatibilityGlowFadeUntil = 0;
            applyCompatibilityDestinationGlowClasses();
        }
    }, 1020);
}

function compatibilityCandidatesForHoveredSlot(enclosure, slotIndex) {
    if (!enclosure || animalAtSlot(enclosure.id, slotIndex)) return [];

    // reverse lookup is intentionally destination-based. An animal may
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

    // an active animal drag already has a specific compatibility
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

    // reverse compatibility hints from hovering an EMPTY combination
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


    // a reservation keeps this slot logically occupied for draw/full-zoo
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

        /* grey the actual card artwork. The deck image can have its own
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
        /* drawCard's visible artwork is a child image, while the wrapper
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
        /* preserve the original menu width. Controls extend leftward
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


function ensureMobilePhoneLayout() {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    if (!document.getElementById('mobile-phone-layout-styles')) {
        const style = document.createElement('style');
        style.id = 'mobile-phone-layout-styles';
        style.textContent = `
            @media (max-width:700px) {
                /* Compact phone HUD: one slim information row plus six action cards. */
                #headerLeft { gap:4px !important; padding:3px 5px !important; min-height:0 !important; }
                #mobileTopHudRow {
                    width:100%; display:grid; grid-template-columns:auto auto minmax(0,1fr) auto auto;
                    align-items:center; gap:5px; min-height:30px; padding:0; margin:0;
                    box-sizing:border-box;
                }
                #mobileTopHudRow #collectionButton,
                #mobileTopHudRow #mobileSettingsButton {
                    width:30px !important; height:30px !important; min-width:30px !important;
                    min-height:30px !important; padding:3px !important; margin:0 !important;
                    display:flex !important; align-items:center; justify-content:center;
                }
                #mobileTopHudRow #prestigeCounter,
                #mobileTopHudRow #turnOrder { margin:0 !important; font-size:10px !important; line-height:1.05 !important; white-space:nowrap; }
                #mobileTopHudRow #playerZooName { min-width:0 !important; margin:0 !important; padding:0 !important; text-align:center; }
                #mobileTopHudRow .zoo-name-editor { display:flex; align-items:center; justify-content:center; gap:2px; min-width:0; }
                #mobileTopHudRow .zoo-name-text { font-size:12px !important; line-height:1.05 !important; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; min-width:0; }
                #mobileTopHudRow .zoo-name-edit-button { width:22px !important; height:22px !important; min-width:22px !important; padding:0 !important; margin:0 !important; font-size:13px !important; }
                #collectionTurnRow { display:contents !important; }
                #saveLoadButton, #newGameButton, #gameOptionsButton { display:none !important; }
                #tradeHistoryButton { display:none !important; }

                #actionMenu {
                    display:grid !important; grid-template-columns:repeat(6,minmax(0,1fr)) !important;
                    gap:4px !important; align-items:end !important; width:100% !important;
                    padding:0 5px 10px !important; margin:0 !important; box-sizing:border-box !important;
                    min-height:0 !important;
                }
                #actionMenu > * { min-width:0 !important; margin:0 !important; }
                #drawCard { grid-column:1; }
                #exchange1 { grid-column:2; }
                #exchange2 { grid-column:3; }
                #result { grid-column:4; }
                #outgoingOffer { grid-column:5; }
                #ingoingOffer { grid-column:6; }
                #drawCard, #exchange1, #exchange2, #result, #outgoingOffer, #ingoingOffer {
                    width:100% !important; max-width:none !important; height:auto !important;
                    aspect-ratio:1000/1440 !important; box-sizing:border-box !important;
                }
                #drawCard img, #exchange1 img, #exchange2 img, #result img, #outgoingOffer img, #ingoingOffer img,
                #drawCard .animal-card, #exchange1 .animal-card, #exchange2 .animal-card, #result .animal-card,
                #outgoingOffer .animal-card, #ingoingOffer .animal-card {
                    width:100% !important; height:100% !important; object-fit:contain !important;
                }
                #drawCard::before { top:-11px !important; font-size:7px !important; letter-spacing:.2px !important; }

                /* The options dialog must fit a phone viewport without page/modal scrolling. */
                #gameOptionsOverlay { padding:4px !important; box-sizing:border-box !important; }
                #gameOptionsOverlay .game-options-modal {
                    width:calc(100vw - 8px) !important; max-width:none !important;
                    height:auto !important; max-height:calc(100dvh - 8px) !important;
                    overflow:hidden !important; padding:7px !important; gap:3px !important;
                    box-sizing:border-box !important; font-size:10px !important;
                }
                #gameOptionsOverlay .game-options-modal h2 { margin:0 0 2px !important; font-size:16px !important; line-height:1 !important; }
                #gameOptionsOverlay .game-options-modal > p,
                #gameOptionsOverlay .advanced-options-note { display:none !important; }
                #gameOptionsOverlay .advanced-game-rules { display:grid !important; grid-template-columns:1fr 1fr !important; gap:3px 7px !important; margin:0 !important; }
                #gameOptionsOverlay .advanced-game-rules > label { min-height:24px !important; margin:0 !important; gap:3px !important; font-size:9px !important; }
                #gameOptionsOverlay .advanced-game-rules input,
                #gameOptionsOverlay .advanced-game-rules select { height:23px !important; font-size:9px !important; padding:1px 3px !important; }
                #gameOptionsOverlay .advanced-options-title { margin:3px 0 1px !important; font-size:10px !important; }
                #gameOptionsOverlay .category-option-list { display:grid !important; grid-template-columns:repeat(3,1fr) !important; gap:2px 4px !important; margin:0 !important; }
                #gameOptionsOverlay .category-option { min-height:19px !important; margin:0 !important; font-size:8.5px !important; gap:2px !important; }
                #gameOptionsOverlay .category-option input { width:12px !important; height:12px !important; margin:0 !important; }
                #gameOptionsOverlay .options-actions { margin-top:4px !important; gap:4px !important; }
                #gameOptionsOverlay .options-actions button { min-height:25px !important; padding:3px 6px !important; font-size:9px !important; }

                /* One centred full-size card on phone; no bottom-corner intermediate stage. */
                #hoverPreview.visible {
                    position:fixed !important; left:50% !important; top:50% !important; right:auto !important; bottom:auto !important;
                    transform:translate(-50%,-50%) !important; margin:0 !important; z-index:40000 !important;
                }
                #hoverPreview.super-zoom { left:50% !important; top:50% !important; transform:translate(-50%,-50%) !important; }
                #hoverPreview .animal-info-tabs { display:grid !important; grid-template-columns:repeat(3,minmax(0,1fr)) !important; gap:2px !important; padding:3px !important; }
                #hoverPreview .animal-info-tab { min-width:0 !important; padding:4px 2px !important; font-size:9px !important; line-height:1.05 !important; white-space:nowrap !important; }
                #animalInformationTitle, #wikiPreviewTitle, #ztlPreviewTitle { font-size:11px !important; line-height:1.2 !important; }
                #wikiPreviewStatus, #wikiPreviewText, #ztlPreviewStatus, #ztlPreviewText, #animalInformationText { font-size:10px !important; line-height:1.3 !important; }

                .enclosure-card, .enclosure { -webkit-user-select:none !important; user-select:none !important; -webkit-touch-callout:none !important; }
            }
        `;
        document.head.appendChild(style);
    }

    // Put the five requested phone-header items into one row. References to
    // these elements remain valid after moving them; desktop never enters here.
    const headerLeft = document.getElementById('headerLeft');
    const collection = document.getElementById('collectionButton');
    const prestige = document.getElementById('prestigeCounter');
    const zooName = document.getElementById('playerZooName');
    const turn = document.getElementById('turnOrder');
    const settings = document.getElementById('mobileSettingsButton');
    if (headerLeft && collection && prestige && zooName && turn && settings) {
        let row = document.getElementById('mobileTopHudRow');
        if (!row) {
            row = document.createElement('div');
            row.id = 'mobileTopHudRow';
            headerLeft.insertBefore(row, headerLeft.firstChild);
        }
        row.append(collection, prestige, zooName, turn, settings);
    }

    // Keep the six gameplay cards in a single deterministic phone row even if
    // older HTML grouped trade/exchange controls in nested wrappers.
    const actionMenu = document.getElementById('actionMenu');
    if (actionMenu) {
        for (const id of ['drawCard','exchange1','exchange2','result','outgoingOffer','ingoingOffer']) {
            const node = document.getElementById(id);
            if (node && node.parentElement !== actionMenu) actionMenu.appendChild(node);
        }
    }
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
        // GROUPS is keyed by enclosure NUMBER. Using enclosure.filename here
        // silently missed the logical exhibit map and made Draw availability
        // disagree with the actual enclosure rules.
        if (!state.sandboxMode && enclosure.number === 10 && !state.enclosure10Unlocked) {
            return false;
        }
        const groups = GROUPS[enclosure.number] || [];

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

    try {
        outgoing.enclosureId = null;
        outgoing.slotIndex = null;
        clearAnimalZooReservation(outgoing);
        return eligibleDestinationsForAnimal(incoming).length > 0;
    } finally {
        outgoing.enclosureId = oldEnclosureId;
        outgoing.slotIndex = oldSlotIndex;
        if (oldReservedEnclosureId != null && oldReservedSlotIndex != null) {
            reserveAnimalZooSlot(outgoing, oldReservedEnclosureId, oldReservedSlotIndex);
        }
    }
}

function nextLevelOneHasEligibleDestination() {
    // DRAW availability uses LOGICAL zoo occupancy, including reserved
    // slots. Reserved vacancies may be used to rearrange animals already owned,
    // but they are NOT new capacity and must never re-enable Draw Card.
    //
    // hasSafeLevelOneDrawSpace() already counts reservations and also preserves
    // the large-combination-exhibit safety rule (an unknown Level 1 draw only
    // gets access to a genuinely empty logical exhibit).
    if (!hasSafeLevelOneDrawSpace()) return false;

    // If preparation has already established that the Level 1 pool is empty,
    // physical enclosure space must not keep Draw enabled.
    if (
        state.nextDrawSpec == null &&
        state.nextDrawReadyPromise &&
        chooseNextLevelOneSpec() == null
    ) {
        return false;
    }

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
            document.querySelectorAll(`.animal-card[data-animal-id="${animal.id}"]`)
                .forEach(card => {
                    card.classList.remove('new-placement-glow');
                    card.style.removeProperty('animation-delay');
                });
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

    // reservation transfer:
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


}


// ============================================================
// COMBINATIONS
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

    // Large starting collections used to depend on the mixed-exhibit
    // backtracking solver. At 24-52 animals that can create a very large search
    // tree and make the browser appear to crash. For large starts, guarantee
    // one independent logical exhibit per animal. This may add enclosure cards
    // beyond the slider's nominal space target, which is already an allowed
    // startup rule when the collection needs more physical exhibits.
    if (requiredAnimals >= 24) {
        let physical = startupLayoutStats(numbers).physical;
        const byPhysicalYield = [...available].sort((a, b) =>
            (GROUPS[b] || [[0]]).length - (GROUPS[a] || [[0]]).length
        );
        while (physical < requiredAnimals) {
            const maxYield = (GROUPS[byPhysicalYield[0]] || [[0]]).length;
            const choices = byPhysicalYield.filter(number =>
                (GROUPS[number] || [[0]]).length === maxYield
            );
            const number = randomItem(choices);
            numbers.push(number);
            physical += (GROUPS[number] || [[0]]).length;
        }
    }

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

function randomAvailableStartingAnimal(levelChances, preferredCategories = null) {
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

    const preferredSet = new Set(Array.isArray(preferredCategories) ? preferredCategories : []);

    // For specialist quota picks, search downward for a legal specialist card
    // before falling back to the ordinary pool. This preserves level/progression
    // rules without allowing an unavailable high-level specialist to dilute the
    // zoo's identity with an unrelated animal.
    if (preferredSet.size) {
        for (let level = rolledLevel; level >= 1; level--) {
            const preferred = availableStartingCardsAtLevel(level)
                .filter(candidate => preferredSet.has(candidate.category));
            if (preferred.length) {
                return weightedRandomItem(
                    preferred,
                    candidate => animalZooTypeWeight(candidate, state.zooType, 'generation')
                );
            }
        }
    }

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
    const specialistCategories = specialistStartingCategories();
    const specialistQuota = specialistStartingQuota(startupRules.species);
    let specialistCount = 0;

    for (let i = 0; i < startupRules.species; i++) {
        const stillNeeded = Math.max(0, specialistQuota - specialistCount);
        const slotsRemaining = startupRules.species - i;
        // Fill the specialist quota early. If a requested level has no legal
        // specialist card, randomAvailableStartingAnimal safely falls back to
        // the normal pool rather than making startup fail.
        const preferSpecialist = specialistCategories.length && stillNeeded > 0 &&
            (specialistCount < specialistQuota || slotsRemaining <= stillNeeded);
        const startingCard = randomAvailableStartingAnimal(
            startupRules.levelChances,
            preferSpecialist ? specialistCategories : null
        );
        const animal = createAnimal(
            startingCard.category,
            startingCard.level,
            startingCard.filename
        );
        state.animals.push(animal);
        if (specialistCategories.includes(animal.category)) specialistCount += 1;
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
        startup placement:
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
        startup solver:
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

    // During the critical startup path compatibility JSON is deliberately
    // loaded later in the background. Until it arrives, mixed exhibits cannot
    // be proven compatible, so the recursive solver would only spend thousands
    // of checks discovering that occupied groups are unavailable. Place into
    // distinct empty exhibits directly when enough exist.
    const compatibilityPairsReady =
        Array.isArray(state.compatibilityData?.compatible_pairs) &&
        state.compatibilityData.compatible_pairs.length > 0;

    if (!compatibilityPairsReady && startupEnclosures.length >= state.animals.length) {
        clearStartupPlacements();
        const emptyDestinations = shuffle([...startupEnclosures]);

        for (let i = 0; i < state.animals.length; i++) {
            const entry = emptyDestinations[i];
            const slotIndex = entry.group[0];
            state.animals[i].enclosureId = entry.enclosure.id;
            state.animals[i].slotIndex = slotIndex;
        }
        placed = true;
    }

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
            // startup failsafe: an 8-animal opening is preferred, but a
            // rare compatibility dead-end must never abort the whole game.
            // Retry the cheap greedy placement with 7 animals, then 6.
            const originalCount = state.animals.length;
            const fallbackCounts = [7, 6].filter(count => count < originalCount);

            for (const targetCount of fallbackCounts) {
                while (state.animals.length > targetCount) {
                    state.animals.pop();
                }
                clearStartupPlacements();
                fallbackFailed = false;

                for (const animal of state.animals) {
                    let destination = null;

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

                    if (!destination) {
                        outerFallback:
                        for (const entry of startupEnclosures) {
                            for (const slotIndex of entry.group) {
                                if (canPlaceStartingAnimal(animal, entry.enclosure, slotIndex)) {
                                    destination = { enclosure: entry.enclosure, slotIndex };
                                    break outerFallback;
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

                if (!fallbackFailed) {
                    placed = true;
                    console.warn(`Startup reduced from ${originalCount} to ${targetCount} animals after compatibility placement failed.`);
                    break;
                }
            }

            if (fallbackFailed) {
                throw new Error(
                    `Could not find a compatible starting layout even after reducing the opening collection to ${state.animals.length} animals ` +
                    `inside ${startingZooSizeRules(state.gameOptions.startingZooSize).maxSpaces} starting spaces.`
                );
            }
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
        // Sandbox prestige is a live score of animals actually placed in
        // enclosures. Loose cards on the board do not count.
        element.textContent = `Prestige ${currentZooPrestige()}`;
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
    if (!state.exchangeEligibilityHoverActive) return false;
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

function refreshContextualExchangeEligibilityGlows() {
    const active =
        state.exchangeEligibilityHoverActive &&
        !state.outgoingOfferHoverSuppressesExchangeGlow &&
        state.gameOptions.showEligibilityGlows !== false;

    const focusKey = activeExchangeGlowFocusKey();

    document.querySelectorAll('.animal-card[data-animal-id]').forEach(card => {
        const animalId = Number(card.dataset.animalId);
        const animal = state.animals.find(item => item.id === animalId);
        const eligible = Boolean(
            active &&
            animal &&
            isExchangeEligible(animal) &&
            !state.suppressedExchangeGlowIds.has(animal.id) &&
            (!focusKey || exchangeGroupKey(animal) === focusKey)
        );

        card.classList.toggle('exchange-eligible', eligible);
        if (!eligible) card.classList.remove('exchange-glow-return');
    });
}

function setExchangeEligibilityHover(active) {
    active = Boolean(active) && !state.sandboxMode;
    if (state.exchangeEligibilityHoverActive === active) return;
    state.exchangeEligibilityHoverActive = active;
    refreshContextualExchangeEligibilityGlows();
    scheduleAnimalGlowPrecedenceRefresh();
}

function setOutgoingOfferExchangeGlowSuppression(active) {
    active = Boolean(active) && !state.sandboxMode;
    if (state.outgoingOfferHoverSuppressesExchangeGlow === active) return;

    state.outgoingOfferHoverSuppressesExchangeGlow = active;
    document.body.classList.toggle('trade-hover-suppress-exchange', active);

    if (active) {
        // NEVER rebuild the zoo here. renderZoo() replaces every animal
        // DOM node, which destroys a blue trade-eligible class that may have
        // been applied by the other mouseenter listener a moment earlier.
        // shouldGlowForExchange() already suppresses yellow for any later
        // render while this flag is active.
        document.querySelectorAll('.animal-card.exchange-eligible')
            .forEach(card => card.classList.remove('exchange-eligible'));
        document.querySelectorAll('.animal-card.exchange-glow-return')
            .forEach(card => card.classList.remove('exchange-glow-return'));
        scheduleAnimalGlowPrecedenceRefresh();
        return;
    }

    document.body.classList.remove('trade-hover-suppress-exchange');

    // Yellow eligibility is contextual now. Leaving Outgoing Offer must not
    // resurrect the old persistent glow; only an active Exchange/Upgrade hover
    // is allowed to paint it.
    refreshContextualExchangeEligibilityGlows();
    scheduleAnimalGlowPrecedenceRefresh();
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
// DUTCH CARD + UI LOCALISATION ()
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
    // a second shallow strip removes descenders from the original
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

    // Menu and popup copy is frequently written across several source lines.
    // Collapse layout whitespace before translation lookup so those strings
    // match the single-line keys in translations-nl.js.
    core=core.replace(/\s+/g, ' ');

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
            .replace(/Level (\d+) Animals/g, 'Niveau $1-dieren')
            .replace(/^Country:\s*/i, 'Land: ')
            .replace(/^Province:\s*/i, 'Provincie: ')
            .replace(/^Location:\s*/i, 'Plaats: ')
            .replace(/^Zoo type:\s*/i, 'Type dierentuin: ')
            .replace(/^Prestige (\d+(?:\.\d+)?)$/i, 'Prestige $1')
            .replace(/^New Zoo:\s*/i, 'Nieuwe dierentuin: ')
            .replace(/^Originally from (.+)\.$/, 'Oorspronkelijk uit $1.')
            .replace(/^Exchanged by (.+) for$/, 'Ingeruild door $1 voor')
            .replace(/^(.+) — Trade History$/, '$1 — Ruilgeschiedenis')
            .replace(/^No trades with this zoo yet\.$/, 'Nog geen ruiltransacties met deze dierentuin.')
            .replace(/^No trades completed yet\.$/, 'Nog geen ruiltransacties voltooid.')
            .replace(/^COUNTRY:\s*/gmi, 'LAND: ')
            .replace(/^PROVINCE:\s*/gmi, 'PROVINCIE: ')
            .replace(/^LOCATION:\s*/gmi, 'PLAATS: ')
            .replace(/^Shown by:$/gmi, 'Getoond door:')
            .replace(/^First arrived at the zoo: Turn (\d+)$/gmi, 'Voor het eerst in de dierentuin: beurt $1')
            .replace(/^Acquisitions:$/gmi, 'Verkregen:')
            .replace(/^Shared exhibits:$/gmi, 'Gedeelde verblijven:')
            .replace(/^Departures:$/gmi, 'Vertrokken:')
            .replace(/^Turn (\d+): acquired$/gmi, 'Beurt $1: verkregen')
            .replace(/^Turn (\d+): acquired from (.+)$/gmi, 'Beurt $1: verkregen van $2')
            .replace(/^(.+) — from Turn (\d+)$/gmi, '$1 — vanaf beurt $2')
            .replace(/^Would you like to save (.+) before opening the New Zoo menu\?$/i, 'Wil je $1 opslaan voordat je het menu Nieuwe dierentuin opent?');
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

const uiLocalisationObserver =
    typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (state?.gameOptions?.animalLanguage === 'nl') enqueueMicrotask(localizeDocument);
        })
        : null;
window.addEventListener('DOMContentLoaded', () => {
    uiLocalisationObserver?.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
});

function setupAnimalCard(
    image,
    animal,
    location
) {

    // All animation/glow decisions for this card belong to one DOM-build
    // moment. Reuse one timestamp instead of repeatedly querying the clock.
    const renderNow = Date.now();

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

    // DOM cards are recreated by renderZoo. Reapply any active
    // compatibility-hover highlight from the shared timestamped state.
    if (state.compatibilityAnimalHoverIds?.has(animal.id)) {
        const now = renderNow;

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
        const glowElapsed = glowStarted ? renderNow - glowStarted : Infinity;
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
        image.classList.add('progression-highlight-instant', 'progression-highlight');
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
        if (renderNow < state.exchangeGlowReturnUntil && state.exchangeGlowReturnIds?.has(animal.id)) {
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
            renderNow - state.exchangeGlowDragStartedAt
        );
        image.style.animationDelay = `${-Math.min(elapsed, 2000)}ms`;
    } else if (
        renderNow < state.exchangeGlowContinueUntil &&
        state.exchangeGlowContinueIds?.has(animal.id)
    ) {
        image.classList.add('exchange-drag-glow');
        const elapsed = Math.max(0, renderNow - state.exchangeGlowContinueStartedAt);
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
    // while a card is selected/being dragged, its own legal destinations
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
        applyCompatibilityDestinationGlowClasses();
    }, COMPATIBILITY_INTENT_DELAY);
}

function finishCompatibilityIntent(animal) {
    cancelCompatibilityIntent(animal);

    if (state.compatibilityIntentActiveAnimal?.id !== animal.id) return;

    const oldKeys = currentCompatibilityGlowKeys([animal]);
    state.compatibilityIntentActiveAnimal = null;
    beginCompatibilityGlowFade(oldKeys);
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
    // Only an intentional card hover is allowed to reveal the preview.
    // index.html deliberately starts the preview with inline
    // visibility:hidden; opacity:0; pointer-events:none to prevent the
    // pre-JS white flash. Release ALL of those first-paint guards here.
    // Removing only visibility leaves inline opacity:0 winning over
    // #hoverPreview.visible, making the preview logically open but invisible.
    hoverPreview.style.removeProperty('display');
    hoverPreview.style.removeProperty('visibility');
    hoverPreview.style.removeProperty('opacity');
    hoverPreview.style.removeProperty('pointer-events');
    hoverPreview.setAttribute('aria-hidden', 'false');
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
            hoverPreview.style.setProperty('display', 'none', 'important');
            hoverPreview.style.setProperty('visibility', 'hidden', 'important');
            hoverPreview.setAttribute('aria-hidden', 'true');
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
    // Card filenames are the canonical player-facing animal names.
    // Underscores are filename separators; hyphens are part of the name.
    return String(animal?.filename || '')
        .replace(/\.[^.]+$/, '')
        .replace(/_+/g, ' ')
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

    // some existing .wiki-preview-toolbar CSS forces display:flex,
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
            // current eligible-combinations.json direct evidence records
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

            // a lot of the compatibility research is stored as a batch:
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
            lines.push('', 'Evidence not yet available in the compatibility file for this proxy combination.');
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
        const exactPartnerInheritance =
            String(link.to || '').endsWith('_shared_partner_pool') ||
            link.mode === 'shared_partner_inheritance';

        for (const left of aMembers) {
            for (const right of bMembers) {
                // Shared partner pools inherit evidence for the EXACT selected
                // partner only. Never explain Zebra using Caracal/Meerkat/etc.
                if (exactPartnerInheritance && right !== bName) continue;
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

            // proxy logic gate:
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
    // Only explicitly complete groups are equivalence/proxy groups. Merely
    // sharing membership in a partner-pool group must never create or explain
    // compatibility between the two members.
    const sharedGroups = aGroups.filter(group =>
        bGroups.includes(group) && complete.has(group)
    );

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

    return '**Compatible by proxy**\nEvidence not yet available in the compatibility file for this proxy combination.';
}

function sourceTextForCombination(a, b) {
    const sources = state.compatibilityEvidenceIndex?.get(compatibilityPairKey(a, b)) || [];
    if (sources.length) return sources.join('\n\n\n');

    // A pair may be explicitly allowed while its research citation has not yet
    // been entered. Do not mislabel that situation as proxy evidence.
    const aName = compatibilityName(a);
    const bName = compatibilityName(b);
    if (state.compatibilityDirectGraph?.get(aName)?.has(bName)) {
        return '**Evidence:**\nEvidence not yet available in the compatibility file for this direct combination.';
    }

    // Only after direct evidence has been exhausted do we reconstruct proxy
    // provenance through group links / group members / graph paths.
    return proxyExplanationForPair(a, b);
}

function renderCombinationSourceTooltip(popup, text) {
    // allow only our two known heading tokens to become bold. Everything
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
                    .replace(/_+/g, ' ')
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

    // Information always uses English name followed by Latin name.
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

    // geography lives in asset-inventory.json. The Information tab
    // should use the continent tags we audited there rather than expecting
    // animals.json to duplicate them.
    const inventoryContinent = continentFromInventoryTags(animal);
    const databaseContinent = continentFromAnimalRecord(record);
    continent.textContent = inventoryContinent || databaseContinent || 'Not listed yet';

    const animalName = compatibilityName(name);

    // species currently sharing this animal's logical exhibit are shown
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

    // split compatible species into animals currently represented in
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

    // ordering:
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

        // use a body-level tooltip instead of nesting it inside the
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
            if (popup) {
            popup.style.display = 'none';
            popup.style.pointerEvents = 'none';
        }
        };

        row.addEventListener('mouseenter', showSource);
        row.addEventListener('mousemove', moveSource);
        row.addEventListener('mouseleave', event => {
            if (!window.matchMedia('(max-width: 700px)').matches) hideSource();
        });
        row.addEventListener('click', event => {
            if (!window.matchMedia('(max-width: 700px)').matches) return;
            event.preventDefault();
            event.stopPropagation();
            showSource(event);
            const popup = document.getElementById('combinationSourceTooltip');
            if (popup) {
                popup.dataset.mobilePinned = '1';
                popup.style.pointerEvents = 'auto';
            }
        });

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
// Keep exactly the same amount of empty pannable space around the enclosure
// bounding box. Coordinates are normalized when the outer edge changes, so the
// visual zoo does not drift toward one side of a giant fixed canvas.
const ZOO_WORKSPACE_MARGIN = 3800;

function normalizeZooWorkspace() {
    if (!state.enclosures.length) {
        return { dx: 0, dy: 0, width: ZOO_WORKSPACE_MARGIN * 2, height: ZOO_WORKSPACE_MARGIN * 2 };
    }

    const minX = Math.min(...state.enclosures.map(enclosure => enclosure.x));
    const minY = Math.min(...state.enclosures.map(enclosure => enclosure.y));
    const maxX = Math.max(...state.enclosures.map(enclosure => enclosure.x + ENCLOSURE_W));
    const maxY = Math.max(...state.enclosures.map(enclosure => enclosure.y + ENCLOSURE_H));

    const dx = ZOO_WORKSPACE_MARGIN - minX;
    const dy = ZOO_WORKSPACE_MARGIN - minY;

    if (dx || dy) {
        for (const enclosure of state.enclosures) {
            enclosure.x += dx;
            enclosure.y += dy;
        }
        // Loose sandbox cards use board coordinates too and must remain in the
        // same visual place relative to the enclosure layout.
        for (const animal of state.sandboxLooseAnimals || []) {
            if (Number.isFinite(animal.x)) animal.x += dx;
            if (Number.isFinite(animal.y)) animal.y += dy;
        }
    }

    return {
        dx,
        dy,
        width: Math.max(1, (maxX - minX) + ZOO_WORKSPACE_MARGIN * 2),
        height: Math.max(1, (maxY - minY) + ZOO_WORKSPACE_MARGIN * 2)
    };
}


function renderZoo() {

    const scrollLeft =
        zooBoard.scrollLeft;

    const scrollTop =
        zooBoard.scrollTop;

    const workspace = normalizeZooWorkspace();

    zooCanvas.innerHTML =
        '';

    // The scrollable world now follows the actual zoo instead of remaining a
    // fixed 6000×5000 rectangle. Empty space is symmetrical on every side.
    zooCanvas.style.width =
        `${workspace.width}px`;

    zooCanvas.style.height =
        `${workspace.height}px`;


    // Compatibility legality can inspect enclosure groups and the full animal
    // collection. Calculate the currently glowing destinations once per zoo
    // render instead of repeating that work independently for every slot.
    const compatibilityGlowKeys = currentCompatibilityGlowKeys();


    for (
        const enclosure
        of state.enclosures
    ) {

        renderEnclosure(
            enclosure,
            compatibilityGlowKeys
        );

    }

    // Sandbox cards may exist loose on the board until the player drags them
    // into an enclosure. They are deliberately outside normal-game state.
    if (state.sandboxMode) renderSandboxLooseAnimals();

    // If normalization shifted world coordinates, compensate the scroll
    // position by the same rendered distance. Existing enclosures therefore
    // stay visually stationary while the pannable world grows around them.
    zooBoard.scrollLeft =
        Math.max(0, scrollLeft + workspace.dx * state.zoom);

    zooBoard.scrollTop =
        Math.max(0, scrollTop + workspace.dy * state.zoom);

    refreshAnimalGlowPrecedence(zooCanvas);

}


// ============================================================
// SANDBOX COMPATIBILITY WARNINGS
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
    enclosure,
    compatibilityGlowKeys = null
) {

    // All compatibility-fade decisions in this enclosure belong to the same
    // render frame. Reading the clock once avoids repeated renderNow calls
    // for every slot and guarantees a consistent fade boundary across slots.
    const renderNow = Date.now();

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

        const started = Number(state.newEnclosureGlowStartedAt.get(enclosure.id) || 0);
        const elapsed = started ? renderNow - started : 0;
        if (elapsed >= 1000) element.classList.add('new-enclosure-fading');

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


    // Build the visible occupancy lookup once for this enclosure. Previously
    // animalAtSlot(..., includeReserved=false) scanned the entire animal array
    // separately for every slot during every zoo render.
    const visibleAnimalsBySlot = new Map();
    for (const animal of state.animals) {
        if (
            animal &&
            animal.enclosureId === enclosure.id &&
            animal.slotIndex !== null &&
            animal.slotIndex !== undefined
        ) {
            visibleAnimalsBySlot.set(animal.slotIndex, animal);
        }
    }

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

        if (
            compatibilityGlowKeys
                ? compatibilityGlowKeys.has(compatibilityKey)
                : slotIsCompatibilityMatch(enclosure, slotIndex)
        ) {
            slot.classList.add('compatibility-match-glow');
        }
        else if (
            state.compatibilityGlowFadeKeys.has(compatibilityKey) &&
            renderNow < state.compatibilityGlowHoldUntil
        ) {
            slot.classList.add('compatibility-match-glow');
        }
        else if (
            state.compatibilityGlowFadeKeys.has(compatibilityKey) &&
            renderNow < state.compatibilityGlowFadeUntil
        ) {
            slot.classList.add('compatibility-match-glow-fading');
        }


        const animal =
            visibleAnimalsBySlot.get(slotIndex) || null;


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
            // empty combination slots are hints only. Hovering them
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


            const mobileTouch =
                event.pointerType === 'touch' &&
                window.matchMedia('(max-width: 700px)').matches;

            if (mobileTouch) {
                // On phones, an enclosure press is panning by default. Only a
                // stationary two-second hold promotes it to an enclosure drag.
                // The board's capture listener has already seen this pointer,
                // so ordinary touch movement continues to pan the zoo.
                event.preventDefault();
                // Suppress iOS/Android long-press text selection/callout while
                // the two-second enclosure-drag hold is being measured.
                document.getSelection?.()?.removeAllRanges?.();
                element.style.webkitUserSelect = 'none';
                element.style.userSelect = 'none';
                element.style.webkitTouchCallout = 'none';

                const pointerId = event.pointerId;
                const startX = event.clientX;
                const startY = event.clientY;
                let cancelled = false;

                const cleanup = () => {
                    clearTimeout(timer);
                    window.removeEventListener('pointermove', cancelOnMove, true);
                    window.removeEventListener('pointerup', cancelHold, true);
                    window.removeEventListener('pointercancel', cancelHold, true);
                };
                const cancelHold = () => {
                    cancelled = true;
                    cleanup();
                };
                const cancelOnMove = moveEvent => {
                    if (moveEvent.pointerId !== pointerId) return;
                    if (Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) > 8) {
                        cancelHold();
                    }
                };
                const timer = setTimeout(() => {
                    if (cancelled || state.drag) return cleanup();
                    cleanup();

                    // A successful hold switches ownership from zoo panning to
                    // enclosure dragging without requiring a second touch.
                    state.pan = null;
                    startEnclosureDrag(event, enclosure, element);
                    element.classList.add('mobile-longpress-dragging');
                    navigator.vibrate?.(18);
                }, 2000);

                window.addEventListener('pointermove', cancelOnMove, true);
                window.addEventListener('pointerup', cancelHold, true);
                window.addEventListener('pointercancel', cancelHold, true);
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


    element.addEventListener('contextmenu', event => {
        if (window.matchMedia('(max-width: 700px)').matches) event.preventDefault();
    });

    zooCanvas.appendChild(
        element
    );

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

    // keep the alternating yellow action hint synchronized with the
    // same eligibility calculation that produces the three yellow card glows.
    enqueueMicrotask(refreshYellowExchangeHintState);


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
    state.newEnclosureGlowStartedAt.clear();

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
        // Upgrade completion is committed only when the new animal has a legal
        // destination. Invalid drags leave the upgrade result untouched.
        return false;
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
    updateAutonomousOpponentOffer();
    renderAll();
    return true;
}

function levelOneDrawDropDestinationAtPoint(clientX, clientY) {
    // baseline-style Level 1 draw targeting.
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
        result drags use a floating image that follows the pointer.
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

    // clicking the upgrade card auto-places it in a random eligible
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
    // zoo, not a lifetime achievement record. Cards in the exchange area
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

function applyProgressionHighlightClasses() {
    document.querySelectorAll('.animal-card[data-animal-id]').forEach(card => {
        const animal = state.animals.find(item => item.id === Number(card.dataset.animalId));
        card.classList.add('progression-highlight-instant');
        card.classList.remove('progression-highlight', 'progression-highlight-pinned');
        if (!animal) return;

        const key = progressionKey(animal.category, animal.level);
        if (
            state.progressionGlowHoverKey === key ||
            state.progressionGlowPinnedKeys.has(key)
        ) {
            card.classList.add('progression-highlight');
            if (state.progressionGlowPinnedKeys.has(key)) {
                card.classList.add('progression-highlight-pinned');
            }
        }
    });
}

function renderProgressTracker() {
    let tracker = document.getElementById('progressTracker');
    if (!tracker) {
        const actionMenu = document.getElementById('actionMenu');
        if (!actionMenu) return;
        tracker = document.createElement('div');
        tracker.id = 'progressTracker';
        actionMenu.appendChild(tracker);
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
        c.dataset.category = category;
        // V220.63: no native title tooltip; click / 2-second hover opens the live zoo list.
        c.textContent = category;
        c.style.background = colour;
        bindProgressCategoryInteraction(c, category);
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
                    applyProgressionHighlightClasses();
                });
                box.addEventListener('mouseleave', () => {
                    if (state.progressionGlowHoverKey === key) state.progressionGlowHoverKey = null;
                    applyProgressionHighlightClasses();
                });
                box.addEventListener('click', event => {
                    event.preventDefault();
                    event.stopPropagation();
                    if (state.progressionGlowPinnedKeys.has(key)) state.progressionGlowPinnedKeys.delete(key);
                    else state.progressionGlowPinnedKeys.add(key);
                    renderProgressTracker();
                    applyProgressionHighlightClasses();
                });
                if (state.progressionGlowPinnedKeys.has(key)) box.classList.add('pinned');
            }

            cell.appendChild(box);
            table.appendChild(cell);
        }
    }

    tracker.appendChild(table);

    // V220.63: the tracker does not exist yet when the early UI bootstrap calls
    // ensureCollectionCategoryLinks(). Bind the delegated category handlers here,
    // after the tracker is guaranteed to exist. The dataset guard prevents duplicates.
    ensureCollectionCategoryLinks();

    // The tracker is rebuilt as progression changes, so re-check the live
    // desktop header after the browser has laid out the new table.
    enqueueMicrotask(() => {
        fitProgressTrackerAroundActions();
        positionOpponentTradeArea();
    });
}


// progression tracker highlight polish.
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
// V220.51 — ANIMAL GLOW PRECEDENCE / DE-CLUTTER
// ============================================================
// Animal cards can qualify for several visual hints at once. CSS filter and
// animation properties do not compose reliably, so make the precedence
// explicit instead of allowing whichever historical rule happens to win:
//
//   trade blue > compatibility blue > progression yellow >
//   contextual exchange yellow > new-placement yellow.
//
// Lower-priority classes remain in logical state where useful, but are muted
// while a higher-priority visual is active and return smoothly afterwards.
function refreshAnimalGlowPrecedence(root = document) {
    root.querySelectorAll?.('.animal-card[data-animal-id]').forEach(card => {
        const trade =
            card.classList.contains('trade-eligible-glow') &&
            !card.classList.contains('trade-eligible-glow-fading');
        const compatibility =
            card.classList.contains('compatibility-animal-match') ||
            card.classList.contains('compatibility-animal-match-fading');
        const progression =
            card.classList.contains('progression-highlight') ||
            card.classList.contains('progression-highlight-pinned');
        const exchange =
            card.classList.contains('exchange-eligible') ||
            card.classList.contains('exchange-drag-glow');
        const newPlacement = card.classList.contains('new-placement-glow');

        let winner = '';
        if (trade) winner = 'trade';
        else if (compatibility) winner = 'compatibility';
        else if (progression) winner = 'progression';
        else if (exchange) winner = 'exchange';
        else if (newPlacement) winner = 'new-placement';

        if (card.dataset.glowWinner !== winner) {
            card.dataset.glowWinner = winner;
        }
    });
}

function scheduleAnimalGlowPrecedenceRefresh() {
    requestAnimationFrame(() => refreshAnimalGlowPrecedence());
}

function ensureAnimalGlowPrecedenceStyles() {
    if (document.getElementById('animal-glow-precedence-v220-33')) return;
    const style = document.createElement('style');
    style.id = 'animal-glow-precedence-v220-33';
    style.textContent = `
        .animal-card {
            transition:
                filter .32s ease,
                box-shadow .32s ease,
                opacity .25s ease;
        }

        /* One animal-card glow at a time. Muted lower-priority effects keep
           their classes/state but contribute no competing shadow/filter. */
        .animal-card[data-glow-winner="trade"].compatibility-animal-match,
        .animal-card[data-glow-winner="trade"].compatibility-animal-match-fading,
        .animal-card[data-glow-winner="trade"].progression-highlight,
        .animal-card[data-glow-winner="trade"].progression-highlight-pinned,
        .animal-card[data-glow-winner="trade"].new-placement-glow {
            animation: none !important;
        }

        .animal-card[data-glow-winner="trade"].exchange-eligible,
        .animal-card[data-glow-winner="trade"].exchange-drag-glow,
        .animal-card[data-glow-winner="compatibility"].exchange-eligible,
        .animal-card[data-glow-winner="compatibility"].exchange-drag-glow,
        .animal-card[data-glow-winner="progression"].exchange-eligible,
        .animal-card[data-glow-winner="progression"].exchange-drag-glow {
            box-shadow: 0 3px 8px rgba(0,0,0,.22) !important;
        }

        /* Compatibility owns filter while active. */
        .animal-card[data-glow-winner="compatibility"].progression-highlight,
        .animal-card[data-glow-winner="compatibility"].progression-highlight-pinned,
        .animal-card[data-glow-winner="compatibility"].new-placement-glow {
            animation: none !important;
        }

        /* Progression owns filter over the transient new-card effect. */
        .animal-card[data-glow-winner="progression"].new-placement-glow {
            animation: none !important;
        }

        /* Exchange uses box-shadow; if it wins, suppress the new-card filter
           so yellow is represented by one clean halo rather than two layers. */
        .animal-card[data-glow-winner="exchange"].new-placement-glow {
            animation: none !important;
            filter: none !important;
        }

        /* Trade fading is deliberately allowed to finish its .32–1s CSS
           transition. Once the class is removed, the resolver exposes the
           next valid hint without a hard flash. */
    `;
    document.head.appendChild(style);
}
ensureAnimalGlowPrecedenceStyles();


// ============================================================
// SAVE / LOAD + READ-ONLY TURN HISTORY
// ============================================================

const SAVE_STORAGE_KEY = 'zooCuratorSavedGamesV1';
const SAVE_FORMAT_VERSION = 1;
const MAX_SAVE_SLOTS = 8;

// one silent browser-local resume snapshot, separate from named saves.
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
    'manualZooNameOverrideType',
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
    'realZooSessionHoldings',
    'realZooTradeDirtyZoos'
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
        importGameState(record.game, { deferRender: true });

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
        'progressionGlowPinnedKeys',
        'realZooTradeDirtyZoos'
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
    state.exchange = (state.exchange || [null, null])
        .map(animal => animal ? (byId.get(animal.id) || animal) : null);
    if (state.outgoingOffer) {
        state.outgoingOffer =
            byId.get(state.outgoingOffer.id) || state.outgoingOffer;
    }
}

function importGameState(saveData, { deferRender = false } = {}) {
    if (!saveData || !saveData.state) {
        throw new Error(uiText('This save file does not contain a valid Zoo Curator game.'));
    }

    exitHistoryView(false);
    state.suppressHistoryCapture = true;

    // V220.51 removes the old Hand subsystem. Older saves may still contain
    // one or more pending hand-card references; remember their ids solely for
    // one-time migration after the normal zoo state has been restored.
    const legacyHandIds = new Set(
        Array.isArray(saveData.state.hand)
            ? saveData.state.hand.map(animal => Number(animal?.id)).filter(Number.isFinite)
            : []
    );

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

    // repair collection types before any render/update function can call
    // .has(), .add(), spread syntax, .entries(), etc. This keeps older saves
    // compatible with newer state fields such as progressionGlowPinnedKeys.
    normaliseLoadedGameCollections();
    relinkLoadedPlayerReferences();

    // One-time compatibility migration for pre-V220.51 saves. Modern gameplay
    // never creates an unplaced owned animal: draw, upgrade and incoming-trade
    // actions commit only after a legal destination is known.
    for (const id of legacyHandIds) {
        const animal = state.animals.find(item => Number(item?.id) === id);
        if (!animal || animal.enclosureId != null) continue;
        const destination = randomEligibleDestinationForAnimal(animal);
        if (destination) {
            placeAnimal(animal, destination.enclosure, destination.slotIndex);
        } else {
            console.warn(`Legacy hand card ${id} could not be auto-placed; leaving save unchanged for that card.`);
        }
    }

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

    if (deferRender) {
        // Startup will perform the first render once, after restoration is
        // complete. Avoid rebuilding the entire zoo invisibly and scheduling a
        // second history capture before the loading screen is removed.
        state.suppressHistoryCapture = false;
        if (saveData.view) {
            state.pendingRestoredView = {
                scrollLeft: Number(saveData.view.scrollLeft) || 0,
                scrollTop: Number(saveData.view.scrollTop) || 0
            };
        }
        return;
    }

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
    enqueueMicrotask(localizeDocument);
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
                <span style="flex:1 1 auto;"></span>
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


function ensureMobileSettingsHub() {
    if (document.getElementById('mobileSettingsButton')) return;

    // This control is phone-only. Desktop keeps the full Save / Load,
    // New Game and Game Options buttons and must never show the cog.
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const headerLeft = document.getElementById('headerLeft');
    if (!headerLeft) return;

    const button = document.createElement('button');
    button.id = 'mobileSettingsButton';
    button.type = 'button';
    button.className = 'mobile-settings-button';
    button.innerHTML = `<svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M19.14 12.94a7.8 7.8 0 0 0 .05-.94 7.8 7.8 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.3 7.3 0 0 0-1.63-.95L14.87 3h-3.84l-.36 3.17c-.58.24-1.12.56-1.63.95l-2.39-.96-1.92 3.32 2.03 1.58a7.8 7.8 0 0 0-.05.94c0 .32.02.63.05.94l-2.03 1.58 1.92 3.32 2.39-.96c.5.39 1.05.71 1.63.95l.36 3.17h3.84l.36-3.17c.58-.24 1.12-.56 1.63-.95l2.39.96 1.92-3.32-2.03-1.58ZM12.95 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"/></svg>`;
    button.title = 'Settings';
    button.setAttribute('aria-label', 'Settings');
    headerLeft.appendChild(button);

    const overlay = document.createElement('div');
    overlay.id = 'mobileSettingsOverlay';
    overlay.className = 'mobile-settings-overlay';
    overlay.innerHTML = `
        <div class="mobile-settings-menu" role="dialog" aria-label="Settings">
            <button type="button" data-mobile-menu="save">Save / Load Game</button>
            <button type="button" data-mobile-menu="new">New Game</button>
            <button type="button" data-mobile-menu="options">Game Options</button>
            <button type="button" data-mobile-menu="history">Trade History</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove('visible');
    const open = () => {
        if (state.historyViewTurn !== null) return;
        pauseAllHintGlowsForMenu();
        overlay.classList.add('visible');
    };
    const closeAndResume = () => {
        close();
        resumeHintGlowsAfterMenu();
    };

    button.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        if (overlay.classList.contains('visible')) closeAndResume();
        else open();
    });

    overlay.addEventListener('pointerdown', event => {
        if (event.target === overlay) closeAndResume();
    });

    overlay.querySelector('[data-mobile-menu="save"]').addEventListener('click', () => {
        close();
        openSaveLoadMenu();
    });
    overlay.querySelector('[data-mobile-menu="new"]').addEventListener('click', () => {
        close();
        resumeHintGlowsAfterMenu();
        requestNewGame();
    });
    overlay.querySelector('[data-mobile-menu="options"]').addEventListener('click', () => {
        close();
        document.getElementById('gameOptionsButton')?.click();
    });
    overlay.querySelector('[data-mobile-menu="history"]').addEventListener('click', () => {
        close();
        openTradeHistoryMenu();
    });
}


const mobileSettingsMediaQuery = window.matchMedia('(max-width: 700px)');
mobileSettingsMediaQuery.addEventListener?.('change', event => {
    if (event.matches) ensureMobileSettingsHub();
});

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
    enqueueMicrotask(localizeDocument);
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
    const drawAlreadyCommitted =
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

    // A disabled action may never keep an already-running discovery glow.
    if (
        drawUnavailable &&
        actionHintOverlay?.dataset?.hintTarget === 'drawCard'
    ) {
        removeActionHintOverlay();
    }

    return !drawUnavailable;
}

function renderAll(persist = true) {

    // Collection identity is evaluated at render boundaries after ownership
    // changes. The 60%/45% hysteresis prevents names oscillating around a
    // threshold as individual animals enter or leave the zoo.
    updateZooIdentityFromLivingCollection();
    refreshDrawAvailabilityState();


    rotateOpponentTradeStocksIfNeeded();
    refreshExchangeGlowSuppression();
    renderZoo();
    // renderZoo() recreates card nodes. Repaint whenever the hint is active,
    // including incoming-box hints and cases where layout/rendering happened
    // without a fresh mouseenter event.
    if ((tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) && !state.outgoingOffer) {
        enqueueMicrotask(() => {
            if (tradeEligibleGlowActive || state.outgoingOfferTradeHoverActive) {
                applyTradeEligibleGlow();
            }
        });
    }
    renderExchange();
    renderTrade();
    renderProgressTracker();
    updateTurnDisplay();
    if (persist) {
        captureTurnSnapshot();
        writeAutoResumeSnapshot();
    }

    // render functions rebuild a number of menu/status nodes. Re-run
    // localisation after every full render so Dutch mode cannot leave freshly
    // rendered English labels behind, and English mode restores originals.
    enqueueMicrotask(localizeDocument);
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

    // in sandbox, an animal already snapped into an enclosure may be
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


    // the moment an exchange-eligible zoo card is picked up, focus the
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

    // Capture the exact verified NORMAL offers before the card leaves its zoo
    // slot. The blue glow is based on this same live state. Dropping the card
    // into Outgoing Offer must consume this snapshot rather than re-evaluating
    // after the drag has changed enclosure/slot state.
    let liveTradeOffersAtDragStart = [];
    if (location === 'enclosure' && !emergencyTradeAtDragStart) {
        const lockedAtDragStart = predictedPlayerTradeOffers(animal);
        liveTradeOffersAtDragStart = materializeLockedPlayerTradeOffers(
            animal,
            lockedAtDragStart
        );
    }

    const compatibilityGlowKeysAtDragStart =
        currentCompatibilityGlowKeys([animal]);

    // the drag owns compatibility guidance from this point onward.
    // Remove hover-derived blue hints before creating the drag state.
    clearCompatibilityHoverImmediately();
    cancelCompatibilityIntent();
    state.compatibilityIntentActiveAnimal = null;

    state.drag = {

        type:
            'animal',

        exchangeGlowIds: exchangeGlowIdsAtDragStart,
        emergencyTradeAtDragStart,
        liveTradeOffersAtDragStart,
        compatibilityGlowKeys: compatibilityGlowKeysAtDragStart,

        animal,

        location,

        originalEnclosureId:
            animal.enclosureId ?? animal.reservedEnclosureId ?? null,

        originalSlotIndex:
            animal.slotIndex ?? animal.reservedSlotIndex ?? null,


        originalExchangeIndex:
            state.exchange.findIndex(
                item =>
                    item?.id ===
                    animal.id
            ),

        originalWasOutgoing:
            state.outgoingOffer?.id === animal.id,

        // Preserve the exact active negotiation while an outgoing card is
        // being dragged. removeAnimalFromLocations() temporarily clears the
        // outgoing slot and its offers; dropping the same card back into the
        // slot must restore that negotiation rather than recalculating it from
        // the transient drag state.
        originalTradeOffers:
            state.outgoingOffer?.id === animal.id
                ? (state.tradeOffers || []).map(offer => ({ ...offer }))
                : null,

        originalSelectedTradeOpponent:
            state.outgoingOffer?.id === animal.id
                ? state.selectedTradeOpponent
                : null,

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


    // an animal dragged out of an enclosure is still considered to
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

    // Dropping the first card into Exchange is itself an explicit request for
    // exchange guidance. Keep the yellow glow active on the remaining eligible
    // cards in this exact category+level group, even if the drag prevented a
    // fresh mouseenter event on the exchange controls.
    state.exchangeEligibilityHoverActive =
        !state.sandboxMode &&
        state.gameOptions.showEligibilityGlows !== false;

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
    state.newEnclosureGlowStartedAt.set(enclosure.id, Date.now());

    // One second fully visible, then a short fade. Cleanup is direct DOM/state
    // work only; it must not rebuild the zoo just to remove a glow.
    setTimeout(() => {
        const started = Number(state.newEnclosureGlowStartedAt.get(enclosure.id) || 0);
        if (!started || Date.now() - started < 950) return;
        document.querySelector(`.enclosure[data-enclosure-id="${enclosure.id}"]`)
            ?.classList.add('new-enclosure-fading');
    }, 1000);

    setTimeout(() => {
        const started = Number(state.newEnclosureGlowStartedAt.get(enclosure.id) || 0);
        if (!started || Date.now() - started < 1400) return;
        state.glowingEnclosureIds.delete(enclosure.id);
        state.newEnclosureGlowStartedAt.delete(enclosure.id);
        const node = document.querySelector(`.enclosure[data-enclosure-id="${enclosure.id}"]`);
        node?.classList.remove('new-enclosure', 'new-enclosure-fading');
    }, 1500);


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
    for (const id of ids) { state.glowingEnclosureIds.delete(id); state.newEnclosureGlowStartedAt.delete(id); }
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
    // Its callers finish by running renderAll(), which rebuilds the progression
    // tracker. Rendering it here only built the same tracker twice per committed
    // exchange/trade.
    checkCurrentProgressionRewards();
}


// ============================================================
// REVEAL EXCHANGE RESULT
// ============================================================

function prepareExchangeGlowAfterAnimalDrag(drag) {
    const before = drag?.exchangeGlowIds || new Set();
    const nowEligible = new Set(
        state.animals
            .filter(animal => shouldGlowForExchange(animal))
            .map(animal => animal.id)
    );

    // 
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

function renderAfterTransientAnimalDrag() {
    // A cancelled drag/tap can temporarily remove a card from zoo/
    // exchange/trade DOM, so restore those visual components only. Do NOT
    // capture turn history or autosave: no gameplay action was committed.
    renderZoo();
    renderExchange();
    renderTrade();
    enqueueMicrotask(localizeDocument);
}

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
            ensureWikipediaBack();
            setHoverPreviewSuperZoom(true);
        } else if (isExchangeEligible(animal)) {
            // selecting an exchange-ready animal focuses the eligibility
            // glow on this exact category+level group. Other eligible groups
            // fade away until the exchange is completed or cancelled.
            state.exchangeGlowFocusKey = exchangeGroupKey(animal);
        }

        prepareExchangeGlowAfterAnimalDrag(drag);
        drag.image?.remove();
        state.drag = null;
        renderAfterTransientAnimalDrag();
        return;
    }

    let placed = tryDropOnOutgoingOffer(event, animal);
    if (!placed) placed = tryDropOnExchange(event, animal);
    if (!placed) placed = tryDropOnExactSlot(event, animal);
    if (!placed) placed = tryDropOnEnclosure(event, animal);
    if (!placed) {
        restoreDraggedAnimal();

        // A failed drop commits nothing. Restore the temporary drag visuals,
        // but skip enclosure unlock/progression work, history capture and
        // autosave that belong to real state changes.
        clearExchangeGlowFocusIfIdle();
        prepareExchangeGlowAfterAnimalDrag(drag);
        drag.image?.remove();
        state.drag = null;
        renderAfterTransientAnimalDrag();
        return;
    }

    beginCompatibilityGlowFade(drag.compatibilityGlowKeys);

    // A successful drop is a real state change and keeps the existing commit
    // path intact.
    clearExchangeGlowFocusIfIdle();
    prepareExchangeGlowAfterAnimalDrag(drag);
    drag.image?.remove();
    state.drag = null;
    checkEnclosure10Unlock();
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


    // The zoo canvas is dynamic (renderZoo/normalizeZooWorkspace), so do not
    // clamp enclosure dragging to the old fixed 6000x5000 workspace constants.
    // Those legacy limits created an invisible wall around y=4533, which could
    // sit roughly halfway down a large zoo. Use the currently rendered world
    // size instead. The large symmetric workspace margin gives plenty of room,
    // and the next render will normalize the zoo again if its outer edge moved.
    const renderedWorldWidth = Math.max(
        ENCLOSURE_W,
        parseFloat(zooCanvas.style.width) || (zooCanvas.scrollWidth / Math.max(state.zoom, 0.0001))
    );
    const renderedWorldHeight = Math.max(
        ENCLOSURE_H,
        parseFloat(zooCanvas.style.height) || (zooCanvas.scrollHeight / Math.max(state.zoom, 0.0001))
    );

    drag.enclosure.x =
        clamp(
            drag.startX + dx,
            0,
            renderedWorldWidth - ENCLOSURE_W
        );


    drag.enclosure.y =
        clamp(
            drag.startY + dy,
            0,
            renderedWorldHeight - ENCLOSURE_H
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

    // Do not validate against the obsolete fixed WORKSPACE_W/WORKSPACE_H.
    // Enclosures now live on the dynamically sized zoo canvas. Requiring only
    // non-negative coordinates here prevents a valid lower/right-hand drop
    // from snapping back merely because it crossed the former 6000x5000 edge.
    const valid = candidates.filter(pos =>
        pos.x >= 0 && pos.y >= 0 &&
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

// Native scrollbars belong to the browser, not to zoo panning. Because the
// scrollbar is part of #zooBoard itself, event.target cannot distinguish a
// click on the scrollbar from a click on empty board space. Detect the native
// scrollbar gutters geometrically and let the browser handle them untouched.
function pointerIsOnZooScrollbar(event) {
    if (event.pointerType === 'touch') return false;

    const rect = zooBoard.getBoundingClientRect();
    const verticalScrollbarWidth = Math.max(0, zooBoard.offsetWidth - zooBoard.clientWidth);
    const horizontalScrollbarHeight = Math.max(0, zooBoard.offsetHeight - zooBoard.clientHeight);

    const onVerticalScrollbar =
        verticalScrollbarWidth > 0 &&
        event.clientX >= rect.right - verticalScrollbarWidth &&
        event.clientX <= rect.right;

    const onHorizontalScrollbar =
        horizontalScrollbarHeight > 0 &&
        event.clientY >= rect.bottom - horizontalScrollbarHeight &&
        event.clientY <= rect.bottom;

    return onVerticalScrollbar || onHorizontalScrollbar;
}

zooBoard.addEventListener(
    'pointerdown',
    event => {

        if (
            event.button !== 0 &&
            event.button !== 1
        ) {
            return;
        }


        if (pointerIsOnZooScrollbar(event)) {
            // Do not preventDefault and do not start a pan. This gives native
            // scrollbar dragging/clicking absolute priority over zoo panning.
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

            renderAfterTransientAnimalDrag();

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
    const oldZoom = state.zoom;
    const nextZoom = clamp(
        Math.round(newZoom * 100) / 100,
        currentZoomMin(),
        ZOOM_MAX
    );
    if (nextZoom === oldZoom) return;

    const boardRect = zooBoard.getBoundingClientRect();
    const pointerX = clientX !== null ? clientX - boardRect.left : zooBoard.clientWidth / 2;
    const pointerY = clientY !== null ? clientY - boardRect.top : zooBoard.clientHeight / 2;

    // Capture the exact WORLD coordinate currently beneath the mouse.
    const anchorWorldX = (zooBoard.scrollLeft + pointerX) / oldZoom;
    const anchorWorldY = (zooBoard.scrollTop + pointerY) / oldZoom;

    state.zoom = nextZoom;
    document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

    const restoreMouseAnchor = () => {
        const maxLeft = Math.max(0, zooBoard.scrollWidth - zooBoard.clientWidth);
        const maxTop = Math.max(0, zooBoard.scrollHeight - zooBoard.clientHeight);

        zooBoard.scrollLeft = Math.max(
            0,
            Math.min(maxLeft, anchorWorldX * state.zoom - pointerX)
        );
        zooBoard.scrollTop = Math.max(
            0,
            Math.min(maxTop, anchorWorldY * state.zoom - pointerY)
        );
    };

    // CSS `zoom` can update the painted scale before Firefox has finalized its
    // scroll extents. Apply once immediately and once after layout/paint. The
    // second correction removes the low-zoom cursor drift.
    restoreMouseAnchor();
    requestAnimationFrame(restoreMouseAnchor);
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
    const cancelledDrag = state.drag;
    restoreDraggedAnimal();
    prepareExchangeGlowAfterAnimalDrag(cancelledDrag);
    state.drag.image?.remove();
    state.drag = null;
    renderAfterTransientAnimalDrag();
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
        currentZoomMin(),
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
// LEVEL 1 DRAW COMMIT — V220.51
// ============================================================
//
// The draw UI already called drawLevelOne()/createLevelOneForDraw(), but those
// commit functions had disappeared from the current lineage. That meant the
// drag image could be removed on pointer-up and then JavaScript stopped before
// the animal was committed. Keep the prepared card transactional: validate its
// exact destination first, consume it only when placement can succeed.

function isDrawSafeDestinationForAnimal(animal, enclosure, slotIndex) {
    if (!animal || !enclosure || slotIndex == null) return false;
    if (!state.sandboxMode && enclosure.number === 10 && !state.enclosure10Unlocked) return false;

    const group = enclosureGroupForSlot(enclosure, slotIndex);
    if (!group) return false;

    // Reservations are logical occupancy and may never become capacity for a
    // newly drawn animal.
    const hasReservation = state.animals.some(existing =>
        existing?.reservedEnclosureId === enclosure.id &&
        group.includes(existing.reservedSlotIndex)
    );
    if (hasReservation) return false;

    // Draws may use a single empty exhibit, or a completely empty large
    // exhibit. Existing mixed-exhibit occupants do not count as safe capacity
    // for an unknown/new Level 1 card.
    if (group.length > 1) {
        if (animalsInEnclosureGroup(enclosure, group, null, true).length > 0) return false;
    } else if (animalAtSlot(enclosure.id, slotIndex, null, true)) {
        return false;
    }

    return canPlace(animal, enclosure, slotIndex);
}

function drawSafeDestinationsForAnimal(animal) {
    const result = [];
    for (const enclosure of state.enclosures) {
        for (const slotIndex of getAllSlots(enclosure)) {
            if (isDrawSafeDestinationForAnimal(animal, enclosure, slotIndex)) {
                result.push({ enclosure, slotIndex });
            }
        }
    }
    return result;
}

async function createLevelOneForDraw(destination) {
    if (!destination?.enclosure || destination.slotIndex == null) return false;
    if (hasPendingPlayerAction()) return false;

    await prepareNextDrawAsset();
    const spec = state.nextDrawSpec;
    if (!spec) {
        refreshDrawAvailabilityState();
        return false;
    }

    // IMPORTANT: do not consume nextDrawSpec before this check. A failed drop
    // must leave the exact same card available rather than making it vanish.
    if (!isDrawSafeDestinationForAnimal(
        spec,
        destination.enclosure,
        destination.slotIndex
    )) {
        refreshDrawAvailabilityState();
        return false;
    }

    const committedSpec = await consumePreparedDrawSpec();
    if (!committedSpec) {
        refreshDrawAvailabilityState();
        return false;
    }

    const animal = createAnimal(
        committedSpec.category,
        1,
        committedSpec.filename
    );

    // The exact same destination was validated immediately above. If some
    // future code changes that assumption, fail loudly rather than silently
    // consuming a draw.
    if (!placeAnimal(animal, destination.enclosure, destination.slotIndex)) {
        console.error('Validated Level 1 draw destination unexpectedly rejected placement.', {
            animal, destination
        });
        // Restore the prepared card so the player never loses it.
        state.nextDrawSpec = committedSpec;
        state.nextDrawReadyPromise = preloadAnimalAsset(committedSpec);
        refreshDrawAvailabilityState();
        return false;
    }

    state.animals.push(animal);
    markPlayerLevelSeen(animal.level);
    // Level 1 draws no longer receive the generic new-animal yellow glow.
    checkEnclosureReward(animal);
    updateCollectionCohabitation();

    state.turn++;
    updateAutonomousOpponentOffer();
    renderAll();

    // Prepare the following card after the successful turn. This also makes
    // Draw immediately reflect "no cards left" / exact-card compatibility.
    prepareNextDrawAsset();
    return true;
}

async function drawLevelOne() {
    if (hasPendingPlayerAction()) return false;

    await prepareNextDrawAsset();
    const spec = state.nextDrawSpec;
    if (!spec) {
        refreshDrawAvailabilityState();
        return false;
    }

    const destinations = drawSafeDestinationsForAnimal(spec);
    if (!destinations.length) {
        refreshDrawAvailabilityState();
        return false;
    }

    return createLevelOneForDraw(randomItem(destinations));
}

// ============================================================
// DRAW LEVEL 1 — CLICK OR DRAG THE DECK CARD
// ============================================================

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

    // a simple click auto-places the prepared Level 1 card in a
    // random eligible enclosure. Dragging remains unchanged.
    if (distance < 6) {
        await drawLevelOne();
        return;
    }

    // resolve the EMPTY EXHIBIT first, exactly as the known-good 
    // architecture did. Do not make drag success depend on nextDrawSpec.
    const destination = levelOneDrawDropDestination(event, dragRect);

    if (!destination) {
        renderAll?.();
        return;
    }

    // Only after the drop target is locked do we consume/create the prepared
    // card. createLevelOneForDraw() then uses normal placeAnimal()/canPlace().
    const placed = await createLevelOneForDraw(destination);

    if (!placed) {
        renderAll?.();
    }
}

if (drawCard) drawCard.dataset.label = state.gameOptions.animalLanguage === 'nl' ? 'TREK KAART' : 'DRAW CARD';



// hint rings belong to the game layer, below every modal/menu layer.
const MENU_SAFE_HINT_Z = 9000;

// ============================================================
// TURN-AWARE HINT POLICY
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

// Hint rings are discovery aids. Hovering an action control means the player
// is already inspecting that action, so no discovery hint should appear on
// that control (or on the paired Exchange/Upgrade controls) at that time.
const hoveredHintControls = new Set();

function hintControlIsBeingInspected() {
    return hoveredHintControls.size > 0;
}

function cancelHintGlowsForInspectedControl() {
    actionHintGeneration++;
    if (actionHintTimer) clearTimeout(actionHintTimer);
    if (actionHintRepeatTimer) clearTimeout(actionHintRepeatTimer);
    actionHintTimer = null;
    actionHintRepeatTimer = null;
    removeActionHintOverlay();

    if (yellowExchangeHintTimer) clearTimeout(yellowExchangeHintTimer);
    yellowExchangeHintTimer = null;
    yellowExchangeHintPhase = 'waiting';
    clearYellowExchangeHintOverlays();
}

function resumeHintsAfterInspectedControl() {
    if (hintControlIsBeingInspected() || !state.loaded || state.historyViewTurn !== null) return;

    // Leaving a control starts a fresh quiet period. Do not immediately flash
    // a hint simply because an older timer happened to expire while hovered.
    armActionHint(blueHintInitialDelay());
    yellowExchangeHintWasPossible = yellowExchangePossible();
    if (yellowExchangeHintWasPossible) {
        scheduleYellowExchangeHint(yellowHintQuietDelay());
    }
}

function bindHintInspectionGuard(target) {
    if (!target) return;

    target.addEventListener('mouseenter', () => {
        hoveredHintControls.add(target);
        cancelHintGlowsForInspectedControl();
    });

    target.addEventListener('mouseleave', () => {
        hoveredHintControls.delete(target);
        resumeHintsAfterInspectedControl();
    });
}

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
// ALTERNATING YELLOW EXCHANGE HINT
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
        // this is an idle discovery hint, not guidance while the player
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

        if (hintControlIsBeingInspected()) {
            clearYellowExchangeHintOverlays();
            scheduleYellowExchangeHint(yellowHintQuietDelay());
            return;
        }

        // blue Draw/Outgoing and yellow Exchange hints are mutually
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

// TURN-ACTION BLUE HINT
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

function anyOutgoingTradeAvailableForHint() {
    if (
        state.sandboxMode ||
        state.historyViewTurn !== null ||
        state.outgoingOffer ||
        hasPendingPlayerAction()
    ) {
        return false;
    }

    // IMPORTANT: idle hints are display-only. Never run trade prediction,
    // eligibility ranking, zoo-stock scans or materialisation from here.
    //
    // A spontaneous/autonomous offer is already live trade-system state, so
    // checking whether one of our placed animals fits it is cheap and does not
    // generate/predict an offer.
    if (state.autonomousTradeOffer) {
        return state.animals.some(animal =>
            animal?.enclosureId != null &&
            outgoingFitsAutonomousOffer(animal)
        );
    }

    // Otherwise inspect ONLY results the normal trade system has already
    // calculated for this exact animal/current three-turn offer window.
    // cachedPlayerTradeOffers() is a Map lookup + clone; it does not calculate
    // candidates, inspect zoo inventories, roll percentages or create offers.
    for (const animal of state.animals) {
        if (animal?.enclosureId == null) continue;
        const cached = cachedPlayerTradeOffers(animal);
        if (lockedPlayerTradeOffersHaveLiveOffer(animal, cached)) return true;
    }

    return false;
}

function actionHintTarget() {
    if (!state.loaded) return null;

    // The blue hint is display-only. It must NEVER recalculate or alter
    // Draw Card availability. In particular, pointerdown can intentionally
    // grey the deck immediately before the draw state has finished committing;
    // a hint firing in that tiny window must not be able to re-enable it.
    const drawEnabled = drawCard &&
        drawCard.getAttribute('aria-disabled') !== 'true' &&
        !drawCard.classList.contains('draw-no-space');

    if (drawEnabled) return drawCard;
    return anyOutgoingTradeAvailableForHint() ? outgoingOfferBox : null;
}

function showActionHintNow() {
    if (hintControlIsBeingInspected()) {
        return false;
    }

    // never display the blue Draw/Outgoing hint at the same time as the
    // yellow Exchange/Upgrade hint. The blue scheduler will retry later.
    if (yellowExchangeHintPhase !== 'waiting' || yellowExchangeHintOverlays.length) {
        return false;
    }

    // do not call refreshDrawAvailabilityState() from the hint system.
    // Availability is owned by the normal game-state/render paths; hints only
    // read the already-rendered state. This prevents a blue hint from undoing
    // the deck's greyed/disabled state during a draw commit.
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
    ring.dataset.hintTarget = target.id || '';
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


// Inspecting these controls is itself evidence that the player knows where
// the action is. Suppress both blue and yellow discovery hints until the
// pointer leaves, then require a fresh quiet period.
for (const hintControl of [exchange1, exchange2, resultBox, outgoingOfferBox]) {
    bindHintInspectionGuard(hintControl);
}

// Exchange eligibility is a contextual inspection aid, not a persistent
// status indicator. Hovering either Exchange slot or Upgrade reveals every
// currently eligible matching zoo card; leaving all three hides the glow.
const exchangeEligibilityHoverTargets = [exchange1, exchange2, resultBox].filter(Boolean);
const EXCHANGE_HOVER_MARGIN = 10;

function pointInsideExpandedExchangeHoverArea(clientX, clientY) {
    return exchangeEligibilityHoverTargets.some(target => {
        const rect = target.getBoundingClientRect();
        return (
            clientX >= rect.left - EXCHANGE_HOVER_MARGIN &&
            clientX <= rect.right + EXCHANGE_HOVER_MARGIN &&
            clientY >= rect.top - EXCHANGE_HOVER_MARGIN &&
            clientY <= rect.bottom + EXCHANGE_HOVER_MARGIN
        );
    });
}

function refreshExchangeHoverFromPointer(event) {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    const inside = pointInsideExpandedExchangeHoverArea(event.clientX, event.clientY);
    setExchangeEligibilityHover(inside);
}

for (const target of exchangeEligibilityHoverTargets) {
    target.addEventListener('mouseenter', event => {
        if (window.matchMedia('(max-width: 700px)').matches) return;
        setExchangeEligibilityHover(true);
    });
}

// Track only while the contextual exchange glow is active. This bridges the
// 10px-expanded gaps between Exchange 1, Exchange 2 and Upgrade without placing
// an invisible overlay over the actual buttons.
document.addEventListener('mousemove', event => {
    if (!state.exchangeEligibilityHoverActive) return;
    refreshExchangeHoverFromPointer(event);
}, { passive: true });

drawCard?.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;

    // immediate visual feedback as soon as this draw is committed.
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
        renderAll?.();
        return;
    }

    if (!nextLevelOneHasEligibleDestination()) {
        event.preventDefault();
        event.stopPropagation();
        renderAll?.();
        return;
    }

    event.preventDefault();
    event.stopPropagation();
    startDrawDrag(event);
});


// ============================================================
// SECRET SANDBOX MODE
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
    state.newEnclosureGlowStartedAt.delete(id);
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
function clearTransientZooUIForSandbox() {
    // Sandbox replaces the active zoo, so no hover/zoom UI from the previous
    // zoo is allowed to survive the mode switch.
    cancelHoverPreviewIntent();
    cancelHoverPreviewHide();
    state.previewHoveredAnimalId = null;
    state.previewIntentAnimalId = null;
    hoverPreview?.classList.remove('visible', 'preview-fading');
    if (hoverPreview) {
        hoverPreview.style.setProperty('display', 'none', 'important');
        hoverPreview.style.setProperty('visibility', 'hidden', 'important');
        hoverPreview.setAttribute('aria-hidden', 'true');
    }
    setHoverPreviewSuperZoom(false);

    // Remove every visual remnant of the old trade before sandbox render.
    // State is cleared separately below; this handles DOM that renderTrade()
    // intentionally hides rather than destroys.
    const decline = document.getElementById('declineOpponentOffer');
    if (decline) {
        decline.style.display = 'none';
        decline.remove();
    }
    document.querySelectorAll('#opponentZoos .opponent-name').forEach(element => {
        element.classList.remove('wants-trade', 'selected-trade');
    });
    const opponentPopup = document.getElementById('opponentInfoPopup');
    const tradePopup = document.getElementById('zooTradePopup');
    if (opponentPopup) opponentPopup.style.display = 'none';
    if (tradePopup) tradePopup.style.display = 'none';
}

function startSandboxMode(options = {}) {
    const { skipConfirm = false, preserveIdentity = false } = options || {};
    if (!skipConfirm && !confirm('Start a new Sandbox game? Your current unsaved game will be replaced.')) return;
    clearAutoResumeSnapshot();
    exitHistoryView(false);
    clearTransientZooUIForSandbox();
    state.sandboxMode = true;
    state.sandboxLooseAnimals = [];
    state.enclosures = [];
    state.animals = [];
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
    if (!preserveIdentity) assignZooNames();
    closeSaveLoadMenu();
    document.getElementById('generateZooOverlay')?.classList.remove('visible');
    removeActionHintOverlay();
    clearYellowExchangeHintOverlays();
    renderAll();
    centerInitialView();
    writeAutoResumeSnapshot(true);
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
    const zoom = Math.max(0.01, Number(state.zoom) || 1);

    // Spawn into the centre of whatever part of the zoo the player is
    // currently looking at. The picker itself is an overlay, so its screen
    // position is deliberately irrelevant: closing/keeping it open never
    // changes the world-space target.
    const viewCenterX = (zooBoard.scrollLeft + zooBoard.clientWidth / 2) / zoom;
    const viewCenterY = (zooBoard.scrollTop + zooBoard.clientHeight / 2) / zoom;
    const centerX = viewCenterX - w / 2;
    const centerY = viewCenterY - h / 2;

    // Search outward from the visible centre for the nearest free position.
    const stepX = w + 20;
    const stepY = h + 20;
    for (let ring = 0; ring < 40; ring++) {
        for (let dx = -ring; dx <= ring; dx++) {
            for (const dy of ring === 0 ? [0] : [-ring, ring]) {
                const x = centerX + dx * stepX;
                const y = centerY + dy * stepY;
                const r = {x, y, w, h};
                if (x < 20 || y < 20) continue;
                if (!occupied.some(o => rectanglesOverlap(r, o, 20))) return {x, y};
            }
        }
        for (let dy = -ring + 1; dy < ring; dy++) {
            for (const dx of [-ring, ring]) {
                const x = centerX + dx * stepX;
                const y = centerY + dy * stepY;
                const r = {x, y, w, h};
                if (x < 20 || y < 20) continue;
                if (!occupied.some(o => rectanglesOverlap(r, o, 20))) return {x, y};
            }
        }
    }

    return {x: Math.max(20, centerX), y: Math.max(20, centerY)};
}

function sandboxSpawnAnimal(category, level, filename) {
    if (!state.sandboxMode) return;
    // Sandbox intentionally allows selecting any inventory card directly,
    // independent of normal deck ownership/progression rules.
    const pos = sandboxFindLoosePosition();
    const animal = {
        id: state.nextId++, category, level, filename: cleanFilename(filename),
        enclosureId:null, slotIndex:null, sandboxLoose:true,
        x:pos.x, y:pos.y
    };
    state.animals.push(animal);
    state.sandboxLooseAnimals.push(animal);
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
      <div id="sandboxPickerAnimalTools" class="sandbox-picker-animal-tools">
        <div id="sandboxPickerLevelTabs" class="sandbox-picker-level-tabs" role="tablist" aria-label="Animal card level"></div>
        <input id="sandboxPickerSearch" type="search" placeholder="Search animals..." style="width:100%;box-sizing:border-box;margin:10px 0;padding:9px">
      </div>
      <div id="sandboxPickerCards"></div></div>`;
    document.body.appendChild(sandboxPickerOverlay);
    sandboxPickerOverlay.querySelector('#sandboxPickerClose').onclick=()=>sandboxPickerOverlay.style.display='none';
    sandboxPickerOverlay.addEventListener('pointerdown',e=>{if(e.target===sandboxPickerOverlay)sandboxPickerOverlay.style.display='none';});
}

function openSandboxAnimalPicker(initialLevel = 1) {
    ensureSandboxPicker();
    const title = sandboxPickerOverlay.querySelector('#sandboxPickerTitle');
    const tabs = sandboxPickerOverlay.querySelector('#sandboxPickerLevelTabs');
    const search = sandboxPickerOverlay.querySelector('#sandboxPickerSearch');
    const body = sandboxPickerOverlay.querySelector('#sandboxPickerCards');
    let activeLevel = Math.max(1, Math.min(5, Number(initialLevel) || 1));

    title.textContent = 'Draw Animal Card';
    const tools = sandboxPickerOverlay.querySelector('#sandboxPickerAnimalTools');
    tools.style.display = 'block';
    tabs.style.display = 'flex';
    search.style.display = '';
    search.value = '';

    const syncTabs = () => {
        const searching = Boolean(search.value.trim());
        for (const item of tabs.querySelectorAll('.sandbox-picker-level-tab')) {
            const selected = Number(item.dataset.level) === activeLevel && !searching;
            item.classList.toggle('active', selected);
            item.setAttribute('aria-selected', selected ? 'true' : 'false');
        }
    };

    const draw = () => {
        const q = search.value.trim().toLowerCase();
        body.innerHTML = '';

        // Tabs filter browsing. As soon as there is a search query, search the
        // complete five-level inventory instead of hiding matches on other tabs.
        const levels = q ? [1, 2, 3, 4, 5] : [activeLevel];

        for (const level of levels) {
            const levelResults = [];

            for (const category of CATEGORY_PROGRESSION_ORDER) {
                const files = levelFiles(category, level).filter(filename => {
                    if (!q) return true;
                    const animalName = String(filename).replace(/\.png$/i, '').toLowerCase();
                    return animalName.includes(q) || String(category).toLowerCase().includes(q);
                });
                if (files.length) levelResults.push({ category, files });
            }

            if (!levelResults.length) continue;

            if (q) {
                const levelHeading = document.createElement('h2');
                levelHeading.className = 'sandbox-search-level-heading';
                levelHeading.textContent = `Level ${level}`;
                body.appendChild(levelHeading);
            }

            for (const { category, files } of levelResults) {
                const h = document.createElement('h3');
                h.textContent = category;
                body.appendChild(h);

                const grid = document.createElement('div');
                grid.style.cssText =
                    'display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));' +
                    'gap:10px;margin-bottom:18px;';

                for (const filename of files) {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.title = `${String(filename).replace(/\.png$/i, '')} — Level ${level}\nCtrl+click to keep this menu open`;
                    b.style.cssText =
                        'padding:5px;background:#fff;border:1px solid #999;border-radius:6px;cursor:pointer;';

                    const img = document.createElement('img');
                    img.src = animalPath(category, level, filename);
                    img.style.cssText = 'width:100%;height:auto;display:block;';
                    b.appendChild(img);

                    b.onclick = event => {
                        sandboxSpawnAnimal(category, level, filename);
                        // Ctrl+click is the rapid sandbox workflow: add the
                        // animal, keep the current tab/search/results untouched.
                        if (!event.ctrlKey) sandboxPickerOverlay.style.display = 'none';
                    };
                    grid.appendChild(b);
                }
                body.appendChild(grid);
            }
        }

        syncTabs();
    };

    tabs.innerHTML = '';
    for (let level = 1; level <= 5; level++) {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'sandbox-picker-level-tab';
        tab.textContent = `Level ${level}`;
        tab.setAttribute('role', 'tab');
        tab.dataset.level = String(level);
        tab.onclick = () => {
            activeLevel = level;
            // Clicking a tab deliberately returns to normal tab browsing.
            search.value = '';
            draw();
        };
        tabs.appendChild(tab);
    }

    search.oninput = draw;
    draw();
    sandboxPickerOverlay.style.display = 'flex';
}
function openSandboxEnclosurePicker() {
    ensureSandboxPicker();
    sandboxPickerOverlay.querySelector('#sandboxPickerTitle').textContent='Draw Enclosure Card';
    sandboxPickerOverlay.querySelector('#sandboxPickerAnimalTools').style.display='none';
    sandboxPickerOverlay.querySelector('#sandboxPickerLevelTabs').style.display='none';
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
            const animalButton=document.createElement('button');
            animalButton.type='button';
            animalButton.className='save-load-button sandbox-draw-button';
            animalButton.textContent='Draw Animal Card';
            animalButton.onclick=()=>openSandboxAnimalPicker(1);
            bar.appendChild(animalButton);

            const enclosureButton=document.createElement('button');
            enclosureButton.type='button';
            enclosureButton.className='save-load-button sandbox-draw-button';
            enclosureButton.textContent='Draw Enclosure Card';
            enclosureButton.onclick=openSandboxEnclosurePicker;
            bar.appendChild(enclosureButton);
            parent.insertBefore(bar,exchange1);
        }
        sandboxToolbarInstalled=true;
    }
    const bar=document.getElementById('sandboxToolbar');
    if(bar) bar.style.display='flex';
    exchange1.style.display='none'; exchange2.style.display='none'; resultBox.style.display='none';
    if(drawCard) drawCard.style.display='none';

    // Sandbox has no collection journal or meaningful turn counter.
    const collectionButton=document.getElementById('collectionButton');
    if(collectionButton) collectionButton.style.display='none';
    if(turnOrder) turnOrder.style.display='none';
    const prestige=document.getElementById('prestigeCounter');
    if(prestige) prestige.style.display='';
}

function restoreNormalActionBoxesIfNeeded() {
    const bar=document.getElementById('sandboxToolbar');
    if(bar) bar.style.display='none';
    exchange1.style.display=''; exchange2.style.display=''; resultBox.style.display='';
    if(drawCard) drawCard.style.display='';

    const collectionButton=document.getElementById('collectionButton');
    if(collectionButton) collectionButton.style.display='';
    if(turnOrder) turnOrder.style.display='';
    const prestige=document.getElementById('prestigeCounter');
    if(prestige) prestige.style.display='';
}

// ============================================================
// GAME OPTIONS — CATEGORY FILTERS
// ============================================================
// ============================================================
// GENERATE ZOO / NEW GAME SETUP
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


// Resolve a place written anywhere in a zoo name against the complete place
// database. Longest place-name wins; the current country only breaks exact
// ties. This lets a manual rename such as "Zoo Berlin" immediately move the
// zoo's trade geography to Berlin/Germany without requiring a separate edit.
function recognisedZooPlaceInName(zooName, preferredCountry = '') {
    const normalizePlaceText = value => String(value || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedName = normalizePlaceText(zooName);
    if (!normalizedName) return null;

    const paddedName = ` ${normalizedName} `;
    const matches = [];
    for (const country of zooSetupCountries()) {
        for (const location of zooSetupLocations(country)) {
            const normalizedLocation = normalizePlaceText(location);
            if (!normalizedLocation) continue;
            if (!paddedName.includes(` ${normalizedLocation} `)) continue;
            matches.push({
                country,
                location,
                province: zooSetupProvinceForLocation(country, location),
                matchLength: normalizedLocation.length,
                preferred: country === preferredCountry ? 1 : 0
            });
        }
    }
    matches.sort((a, b) =>
        b.matchLength - a.matchLength ||
        b.preferred - a.preferred ||
        a.country.localeCompare(b.country) ||
        a.location.localeCompare(b.location)
    );
    return matches[0] || null;
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

// ============================================================
// LIVING COLLECTION -> EVOLVING ZOO IDENTITY
// ============================================================
const ZOO_TYPE_ADOPT_THRESHOLD = 0.60;
const ZOO_TYPE_RELEASE_THRESHOLD = 0.45;
const ZOO_TYPE_RENAME_MIN_ANIMALS = 10;

function zooIdentitySpecialistTypes() {
    return Object.keys(SPECIALIST_STARTING_CATEGORIES);
}

function livingCollectionZooTypeShares() {
    // Ownership, rather than physical placement, defines the institution.
    // Cards temporarily sitting in Exchange/Outgoing Offer therefore still
    // count until an exchange/trade actually removes them from state.animals.
    const animals = (state.animals || []).filter(Boolean);
    const total = animals.length;
    const shares = new Map();
    if (!total) return { total, shares };

    for (const type of zooIdentitySpecialistTypes()) {
        const categories = SPECIALIST_STARTING_CATEGORIES[type] || [];
        const matching = animals.filter(animal => categories.includes(animal.category)).length;
        shares.set(type, matching / total);
    }
    return { total, shares };
}

function chooseZooPrefixForType(type) {
    const groups = zooSetupPrefixGroups(state.zooCountry, state.zooLocation)
        .filter(item => item.zooType === type && item.prefix);
    if (!groups.length) return type === 'general' ? 'Zoo' : null;
    return randomItem(groups)?.prefix || groups[0].prefix;
}

function applyAutomaticZooTypeName(type) {
    const prefix = chooseZooPrefixForType(type);
    if (!prefix) return false;
    const location = String(state.zooLocation || '').trim();
    if (!location) return false;
    const nextName = `${prefix} ${location}`.replace(/\s+/g, ' ').trim();
    const changed = nextName !== state.zooName || state.zooType !== type;
    state.zooType = type;
    if (!changed) return false;
    state.zooName = nextName;
    const nameText = document.querySelector('.zoo-name-text');
    if (nameText) renderPlayerZooNameText(nameText);
    return true;
}

function updateZooIdentityFromLivingCollection() {
    if (!state.loaded || state.sandboxMode) return false;
    const { total, shares } = livingCollectionZooTypeShares();
    if (total < ZOO_TYPE_RENAME_MIN_ANIMALS) return false;

    const current = normaliseZooTypes(state.zooType)[0] || 'general';
    const ranked = [...shares.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    const [leaderType, leaderShare] = ranked[0] || ['general', 0];
    const currentShare = shares.get(current) || 0;

    // Work out whether the collection has actually crossed an identity boundary.
    // A player-edited name is protected while it remains inside the SAME territory;
    // merely rendering another turn can never overwrite the manual name.
    let nextType = current;
    if (leaderType !== current && leaderShare >= ZOO_TYPE_ADOPT_THRESHOLD) {
        nextType = leaderType;
    } else if (current !== 'general' && currentShare < ZOO_TYPE_RELEASE_THRESHOLD) {
        nextType = 'general';
    }

    if (nextType === current) return false;

    // Crossing into a different territory re-arms automatic naming. This covers
    // specialist -> different specialist and specialist -> general; if the zoo
    // later crosses back, that later crossing may rename it again as normal.
    state.manualZooNameOverrideType = null;
    return applyAutomaticZooTypeName(nextType);
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
                        <span id="generateZooLocationKnown" class="new-zoo-location-known" title="This location is present in the game files" aria-label="Location found in game files">✓</span>
                    </span>
                </label>
                <input id="generateZooLocation" class="new-zoo-hidden-editor" type="text" autocomplete="off">
                <input id="generateZooName" class="new-zoo-hidden-editor" type="text" autocomplete="off">
                <label class="trade-frequency-option new-zoo-mode-option">
                    <span>Gamemode</span>
                    <select id="newZooGameMode">
                        <option value="classic">Classic</option>
                        <option value="sandbox">Sandbox</option>
                    </select>
                </label>
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

            <div id="newZooGenerationLoading" class="new-zoo-generation-loading" aria-live="polite" aria-hidden="true">
                <div class="new-zoo-generation-label">Generating zoo…</div>
                <div class="new-zoo-generation-track"><div class="new-zoo-generation-bar"></div></div>
            </div>
            <div class="options-actions new-zoo-actions" style="flex-wrap:wrap">
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
    const locationKnown = overlay.querySelector('#generateZooLocationKnown');
    const gameMode = overlay.querySelector('#newZooGameMode');
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

    function refreshLocationKnownIndicator() {
        const wanted = normaliseGeographyPart(location.value);
        const known = wanted && zooSetupLocations(country.value).some(
            item => normaliseGeographyPart(item) === wanted
        );
        locationKnown.classList.toggle('visible', Boolean(known));
        locationKnown.setAttribute('aria-hidden', known ? 'false' : 'true');
    }

    function applyIdentity(identity) {
        refreshCountries(identity.country);
        country.value = identity.country;
        location.value = identity.location;
        zooName.value = identity.zooName;
        locationDisplay.textContent = identity.location;
        zooNameDisplay.textContent = identity.zooName;
        refreshLocationKnownIndicator();
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

    function syncRecognisedPlaceFromName() {
        const match = recognisedZooPlaceInName(zooName.value, country.value);
        if (!match) return false;
        if (country.value !== match.country) {
            refreshCountries(match.country);
            country.value = match.country;
            countryTrigger.textContent = `${countryFlagEmoji(match.country)} ${match.country}`;
        }
        location.value = match.location;
        locationDisplay.textContent = match.location;
        overlay.dataset.generatedZooCountry = match.country;
        overlay.dataset.generatedZooLocation = match.location;
        overlay.dataset.generatedZooProvince = match.province || '';
        overlay.dataset.generatedZooRegion = match.province || '';
        refreshLocationKnownIndicator();
        return true;
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
        refreshLocationKnownIndicator();
    }

    countryTrigger.addEventListener('pointerdown', event => event.stopPropagation());
    countryTrigger.addEventListener('click', event => {
        event.stopPropagation();
        setCountryMenuOpen(!countryMenu.classList.contains('visible'));
    });

    // IMPORTANT: the outside-dismiss listener below runs on pointerdown.
    // Previously we stopped only the later `click` event, so pressing any
    // country option first bubbled to document, hid the menu, and removed the
    // button from hit-testing before its click handler could select it.
    // Stop the SAME event type inside the picker. This also fixes touch input.
    countryMenu.addEventListener('pointerdown', event => event.stopPropagation());
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
        refreshLocationKnownIndicator();
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
            syncRecognisedPlaceFromName();
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

    async function allowGenerationIndicatorToPaint() {
        // requestAnimationFrame can be throttled/suspended on mobile browsers.
        // Race it with a short timer so Open New Zoo can never be blocked
        // waiting for two animation frames that do not arrive.
        await Promise.race([
            new Promise(resolve => requestAnimationFrame(() => resolve())),
            new Promise(resolve => setTimeout(resolve, 60))
        ]);
    }

    overlay.querySelector('#generateZooStart').addEventListener('click', async () => {
        const startButton = overlay.querySelector('#generateZooStart');
        const loading = overlay.querySelector('#newZooGenerationLoading');
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

        // A recognised place embedded in the final zoo name is authoritative
        // for geography, even if the player never opened the Location editor.
        syncRecognisedPlaceFromName();
        const resolvedLocation = location.value.trim();
        const selectedGameMode = gameMode.value === 'sandbox' ? 'sandbox' : 'classic';
        const selectedZooSize = Math.max(0, Math.min(100, Math.round(Number(zooSize.value))));
        const startupRules = startingCollectionSizeRules(selectedZooSize);

        // 20% zoos normally open immediately, so do not flash a loading bar.
        // Larger collections get one painted frame before synchronous layout
        // generation begins, preventing the modal from looking frozen.
        const showGenerationLoading = startupRules.species >= 14;
        startButton.disabled = true;
        if (showGenerationLoading) {
            loading.classList.add('visible');
            loading.setAttribute('aria-hidden', 'false');
            await allowGenerationIndicatorToPaint();
        }

        try {
            clearAutoResumeSnapshot();

            // Install the identity before startup animals are selected so the
            // chosen zoo type can bias that collection.
            state.zooName = finalName;
            state.zooCountry = country.value;
            state.zooProvince = overlay.dataset.generatedZooProvince ||
                zooSetupProvinceForLocation(country.value, resolvedLocation);
            state.zooLocation = resolvedLocation;
            state.zooType = inferZooTypeFromGeneratedName(country.value, finalName);
            state.gameOptions.startingCollectionSize = selectedZooSize;
            state.gameOptions.startingZooSize = selectedZooSize;
            saveGameOptions();

            if (selectedGameMode === 'sandbox') {
                startSandboxMode({ skipConfirm: true, preserveIdentity: true });
            } else {
                state.sandboxMode = false;
                createStartingZoo();
                assignOpponentProfiles();
                createZooNameEditor();
                renderAll();
                centerInitialView();
                writeAutoResumeSnapshot(true);
            }

            overlay.classList.remove('visible');
            resumeHintGlowsAfterMenu();
        } catch (error) {
            console.error('New zoo generation failed:', error);
            alert(`Zoo generation failed: ${error?.message || error}`);
        } finally {
            loading.classList.remove('visible');
            loading.setAttribute('aria-hidden', 'true');
            startButton.disabled = false;
        }
    });

    overlay._applyZooIdentity = applyIdentity;
    overlay._refreshZooCountries = () => {
        const countries = zooSetupCountries();
        if (!countries.length) return;
        const preferred = countries.includes(country.value)
            ? country.value
            : (countries.includes('Netherlands') ? 'Netherlands' : countries[0]);
        applyIdentity(generateZooSetupIdentity(preferred, true));
    };
    overlay._syncZooSize = () => {
        // New Zoo always opens at the standard 20% preset. The user's previous
        // zoo size is deliberately not carried into the next New Zoo dialog.
        gameMode.value = 'classic';
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

function openNewZooSavePrompt() {
    let overlay = document.getElementById('newZooSavePromptOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'newZooSavePromptOverlay';
        overlay.className = 'save-load-overlay';
        overlay.innerHTML = `
            <div class="save-load-modal" style="max-width:460px;">
                <h2>Start a New Zoo?</h2>
                <p id="newZooSavePromptText"></p>
                <div class="save-load-footer">
                    <button type="button" id="newZooContinueWithoutSave">Continue Without Saving</button>
                    <span style="flex:1 1 auto;"></span>
                    <button type="button" id="newZooSaveFirst">Save Current Game</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    }
    const zooName = state.zooName || 'your current zoo';
    overlay.querySelector('#newZooSavePromptText').textContent =
        `Would you like to save ${zooName} before opening the New Zoo menu?`;
    const finish = saveFirst => {
        overlay.classList.remove('visible');
        if (saveFirst) saveCurrentGame();
        openGenerateZooMenu();
    };
    overlay.querySelector('#newZooSaveFirst').onclick = () => finish(true);
    overlay.querySelector('#newZooContinueWithoutSave').onclick = () => finish(false);
    overlay.classList.add('visible');
    localizeDocument();
}

function requestNewGame() {
    if (state.historyViewTurn !== null) exitHistoryView(true);
    if (Number(state.turn) > 1) {
        openNewZooSavePrompt();
        return;
    }
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
                <label>
                    <span>Gamemode</span>
                    <select id="optGameMode">
                        <option value="classic">Classic</option>
                        <option value="sandbox">Sandbox</option>
                    </select>
                </label>
                <div class="advanced-options-note">Classic uses the normal turn, draw, exchange and trade rules. Sandbox gives unrestricted building tools.</div>
                <label class="glow-option">
                    <span>Eligibility glows</span>
                    <input id="optEligibilityGlows" type="checkbox" checked>
                </label>
                <div class="advanced-options-note">Shows yellow upgrade-ready glows and blue trade-interest glows.</div>
                <label><span>Language</span><select id="optAnimalLanguage"><option value="en">English</option><option value="nl">Nederlands</option></select></label>
                <div class="advanced-options-note">Dutch translation covers all animal cards, card categories, menus and on-screen interface text.</div>
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
    const gameModeInput = overlay.querySelector('#optGameMode');
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
        gameModeInput.value = state.sandboxMode ? 'sandbox' : 'classic';
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
        gameModeInput.value = 'classic';
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

        const requestedGameMode = gameModeInput.value === 'sandbox' ? 'sandbox' : 'classic';
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
        const modeSame = requestedGameMode === (state.sandboxMode ? 'sandbox' : 'classic');
        const rulesSame =
            modeSame &&
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

        // Gamemode is a live property of the current zoo rather than a hidden
        // New Zoo shortcut. Switching into Sandbox deliberately starts a fresh
        // sandbox; switching back to Classic opens the normal New Zoo setup.
        if (!modeSame) {
            close();
            if (requestedGameMode === 'sandbox') {
                startSandboxMode();
            } else {
                openGenerateZooMenu();
            }
            return;
        }

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
const REAL_ZOO_ANIMAL_SPEC_CACHE = new Map();
const REAL_ZOO_PRESTIGE_CACHE = new WeakMap();
const REAL_ZOO_TRADE_SPEC_CACHE = new WeakMap();
let realZooAnimalSpecCacheReady = false;

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

// Trading gets a temporary early-game prestige head start so a new zoo has a
// useful pool of potential partners immediately. The boost starts at 150 and
// is gradually replaced by earned prestige, disappearing completely at 500.
// This value is ONLY for real-zoo trade matching; displayed/actual prestige
// and every other prestige-dependent system continue to use the real value.
function playerTradeAccessPrestige(actualPrestige = updateHighestZooPrestige()) {
    const actual = Math.max(0, Number(actualPrestige) || 0);
    const STARTING_TRADE_PRESTIGE = 150;
    const FULL_CONVERGENCE_PRESTIGE = 500;

    if (actual >= FULL_CONVERGENCE_PRESTIGE) return actual;

    const remainingStarterBoost = STARTING_TRADE_PRESTIGE *
        (1 - actual / FULL_CONVERGENCE_PRESTIGE);
    return actual + remainingStarterBoost;
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

// return only real zoos that can possibly participate in a trade for
// this outgoing card. The expensive holdings/category/level scan was done
// offline and embedded in real_zoo_opponents.json. Dynamic rules are still checked later.
function realZooRecordsAvailableForTrade(wantedAnimal) {
    const index = state.realZooTradeIndex;
    if (!wantedAnimal || !index || !state.realZooRecordByStaticId?.size) {
        return realZooRecordsAvailable();
    }

    // the embedded index contains only the Turn-0 shortlist for this outgoing
    // category/level. It never replaces current zoo holdings. Any zoo whose
    // holdings changed during this game is merged back into the shortlist and
    // is then checked against its live session holdings by realZooCanTradeFor()
    // and realZooTradeAnimals(). This keeps Trade History/current-collection
    // popups fully dynamic while preserving the fast static starting index.
    const key = `${wantedAnimal.category}|${Number(wantedAnimal.level) || 0}`;
    const ids = index.candidates_by_outgoing?.[key] || [];
    const records = ids
        .map(id => state.realZooRecordByStaticId.get(Number(id)))
        .filter(record => record && Array.isArray(record.animals) && record.animals.length);

    const seen = new Set(records.map(record => realZooHoldingKey(record)));
    for (const dirtyName of state.realZooTradeDirtyZoos || []) {
        if (seen.has(dirtyName)) continue;
        const record = (state.realZooData?.zoos || []).find(item =>
            realZooHoldingKey(item) === dirtyName
        );
        if (record) {
            records.push(record);
            seen.add(dirtyName);
        }
    }
    return records;
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
    if (!sameCountry) return 'Foreign';

    const playerProvince = resolveProvinceGraphKey(state.zooCountry, state.zooProvince);
    const zooProvince = resolveProvinceGraphKey(record.country, record.province);
    const sameProvince = playerProvince && zooProvince
        ? playerProvince === zooProvince
        : Boolean(record.province && state.zooProvince) &&
            normaliseGeographyPart(record.province) === normaliseGeographyPart(state.zooProvince);
    if (sameProvince) return 'Local';
    return 'National';
}

function realZooLocationLines(record, includeRelationship = false) {
    if (!record) return [];
    const relationship = includeRelationship
        ? realZooRelationshipLabel(record)
        : '';
    const lines = [
        `Country: ${record.country || 'Unknown'}`,
        `Province: ${record.province || 'Unknown'}${relationship ? ` (${relationship})` : ''}`
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

function ensureRealZooAnimalSpecCache() {
    if (realZooAnimalSpecCacheReady) return;
    REAL_ZOO_ANIMAL_SPEC_CACHE.clear();
    for (const category of Object.keys(FOLDERS)) {
        for (let level = 1; level <= 5; level++) {
            for (const filename of levelFiles(category, level)) {
                const key = String(filename || '')
                    .replace(/\.png$/i, '')
                    .trim()
                    .toLowerCase();
                if (!key || REAL_ZOO_ANIMAL_SPEC_CACHE.has(key)) continue;
                REAL_ZOO_ANIMAL_SPEC_CACHE.set(key, { category, level, filename });
            }
        }
    }
    realZooAnimalSpecCacheReady = true;
}

function realZooAnimalSpecByName(name) {
    ensureRealZooAnimalSpecCache();
    const wanted = String(name || '').replace(/\.png$/i, '').trim().toLowerCase();
    return wanted ? REAL_ZOO_ANIMAL_SPEC_CACHE.get(wanted) || null : null;
}

function realZooAnimalLevelByName(name) {
    return Number(realZooAnimalSpecByName(name)?.level) || 0;
}

function realZooPrestige(record) {
    if (!record || typeof record !== 'object') return 0;
    if (REAL_ZOO_PRESTIGE_CACHE.has(record)) {
        return REAL_ZOO_PRESTIGE_CACHE.get(record);
    }
    const prestige = realZooSessionAnimalNames(record).reduce((total, name) => {
        const level = realZooAnimalLevelByName(name);
        return total + (ZOO_PRESTIGE_BY_LEVEL[level] || 0);
    }, 0);
    // Real-zoo trades exchange animals at the same level, so the zoo's total
    // prestige cannot change during a session. Cache it for every hover pass.
    REAL_ZOO_PRESTIGE_CACHE.set(record, prestige);
    return prestige;
}

function realZooPrestigeWindow(
    actualPrestige = updateHighestZooPrestige(),
    accessPrestige = playerTradeAccessPrestige(actualPrestige)
) {
    const actual = Math.max(0, Number(actualPrestige) || 0);
    const access = Math.max(actual, Number(accessPrestige) || 0);

    // The early-game trade boost expands the TOP of the normal prestige range;
    // it must not shift the entire range upward. The lower edge therefore stays
    // anchored to the player's real prestige, while the upper edge benefits
    // from the temporary access boost. Once actual prestige reaches 500 the
    // boost is gone and this naturally becomes the old symmetric window again.
    const lowerRadius = Math.max(32, 20 + actual * 0.10);
    const upperRadius = Math.max(32, 20 + access * 0.10);

    return {
        centre: actual,
        accessPrestige: access,
        minimum: Math.max(0, actual - lowerRadius),
        maximum: access + upperRadius,
        lowerRadius,
        upperRadius
    };
}

function realZooPrestigeSimilarityWeight(record, window) {
    const difference = Math.abs(realZooPrestige(record) - window.centre);
    // V220.58 split the prestige window into lowerRadius/upperRadius but this
    // helper still read the removed `window.radius`, turning every similarity
    // weight into NaN. Use the appropriate side of the asymmetric window.
    const zooPrestige = realZooPrestige(record);
    const radius = zooPrestige < window.centre
        ? window.lowerRadius
        : Math.max(1, window.maximum - window.centre);
    return Math.max(0.10, 1 - difference / (radius + 1));
}

// Select without replacement. The prestige window is applied first. Geography
// chooses a band independently of how many zoos that band contains, and the
// chosen band is then weighted by prestige similarity. This keeps local zoos
// dominant without letting a province with many records overpower the stated
// geographical percentages.
function selectPrestigeLocationCandidates(candidates, count, seedText = '') {
    const selected = [];
    const actualPrestige = updateHighestZooPrestige();
    const prestige = playerTradeAccessPrestige(actualPrestige);
    const window = realZooPrestigeWindow(actualPrestige, prestige);
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
    const spec = realZooAnimalSpecByName(name);
    return spec ? {
        id: state.nextId++,
        category: spec.category,
        level: spec.level,
        filename: spec.filename,
        enclosureId: null,
        slotIndex: null,
    } : null;
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
    state.realZooTradeDirtyZoos = new Set();

    for (const record of state.realZooData?.zoos || []) {
        if (!record?.name) continue;
        REAL_ZOO_TRADE_SPEC_CACHE.delete(record);
        REAL_ZOO_PRESTIGE_CACHE.delete(record);
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

function realZooTradeSpecs(record) {
    if (!record || typeof record !== 'object') return [];
    if (REAL_ZOO_TRADE_SPEC_CACHE.has(record)) {
        return REAL_ZOO_TRADE_SPEC_CACHE.get(record);
    }

    const result = [];
    const seen = new Set();
    for (const name of realZooSessionAnimalNames(record)) {
        const spec = realZooAnimalSpecByName(name);
        if (!spec) continue;

        const key = animalCardKey(spec);
        if (seen.has(key)) continue;
        seen.add(key);
        result.push(spec);
    }

    REAL_ZOO_TRADE_SPEC_CACHE.set(record, result);
    return result;
}

function realZooTradeAnimals(record, excludePlayerOwned = false) {
    const playerKeys = excludePlayerOwned ? playerOwnedTradeKeys() : null;
    const result = [];

    for (const spec of realZooTradeSpecs(record)) {
        if (playerKeys?.has(animalCardKey(spec))) continue;
        result.push({
            id: state.nextId++,
            category: spec.category,
            level: spec.level,
            filename: spec.filename,
            enclosureId: null,
            slotIndex: null,
            });
    }

    return result;
}

function realZooHasAnimal(record, animal) {
    if (!record || !animal) return false;
    const wanted = animalCardKey(animal);
    return realZooTradeSpecs(record).some(spec => animalCardKey(spec) === wanted);
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
        const spec = realZooAnimalSpecByName(name);
        return !spec || animalCardKey(spec) !== incomingKey;
    });

    // The player's traded-away animal now belongs to that real zoo and may
    // appear in its future offers. Do not create duplicate holdings.
    const alreadyHasOutgoing = kept.some(name => {
        const spec = realZooAnimalSpecByName(name);
        return spec && animalCardKey(spec) === outgoingKey;
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
    state.realZooTradeDirtyZoos.add(realZooHoldingKey(record));
    REAL_ZOO_TRADE_SPEC_CACHE.delete(record);
    REAL_ZOO_PRESTIGE_CACHE.delete(record);
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

function cachedTradeAnimalPreview(item) {
    if (!item) return null;

    if (item.animalSpec?.category && item.animalSpec?.level && item.animalSpec?.filename) {
        return {
            category: item.animalSpec.category,
            level: Number(item.animalSpec.level),
            filename: cleanFilename(item.animalSpec.filename),
            enclosureId: null,
            slotIndex: null
        };
    }

    // Legacy cache compatibility without allocating a player animal id.
    if (item.animalName) {
        const spec = realZooAnimalSpecByName(item.animalName);
        return spec ? {
            category: spec.category,
            level: Number(spec.level),
            filename: cleanFilename(spec.filename),
            enclosureId: null,
            slotIndex: null
        } : null;
    }

    return null;
}

function lockedPlayerTradeOfferIsLive(outgoing, item) {
    if (!outgoing || !item) return false;

    if (isRealOpponentMode()) {
        const record = (state.realZooData?.zoos || [])
            .find(candidate => candidate.name === item.recordName);
        if (!record || realZooHasAnimal(record, outgoing)) return false;

        const animal = cachedTradeAnimalPreview(item);
        if (!animal || playerAlreadyHasAnimal(animal)) return false;
        if (!realZooHasAnimal(record, animal)) return false;
        return tradeIncomingHasDestinationAfterOutgoing(animal, outgoing);
    }

    if (!Number.isInteger(item.opponentIndex)) return false;
    if (item.opponentIndex < 0 || item.opponentIndex >= state.unlockedOpponentCount) return false;
    if (!state.opponentProfiles[item.opponentIndex]) return false;
    if (fictionalOpponentHasAnimal(item.opponentIndex, outgoing)) return false;

    const animal = cachedTradeAnimalPreview(item);
    if (!animal || playerAlreadyHasAnimal(animal)) return false;
    if (!tradeIncomingHasDestinationAfterOutgoing(animal, outgoing)) return false;

    return (state.opponentTradeStocks[item.opponentIndex] || [])
        .some(held => held && animalCardKey(held) === animalCardKey(animal));
}

function lockedPlayerTradeOffersHaveLiveOffer(outgoing, cached) {
    return Array.isArray(cached) && cached.some(item =>
        lockedPlayerTradeOfferIsLive(outgoing, item)
    );
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
            // the outgoing animal's old slot is deliberately reserved
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
        return;
    }

    // use the exact same prediction/materialisation path as the blue
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

    renderTrade();
    // Offer state is complete now. The rendered <img> elements load normally;
    // preloading is only a background cache warm-up and must never delay the UI.
    preloadAnimals(state.tradeOffers.map(offer => offer.animal));
}

function createRealAutonomousOpponentOffer() {
    if (state.outgoingOffer || state.autonomousTradeOffer) return false;

    // The same slider controls spontaneous real-zoo offers.
    if (Math.random() > tradeFrequencyFactor()) return false;

    const records = realZooRecordsAvailable();
    const orderedRecords = selectPrestigeLocationCandidates(
        records.map(record => ({ record })),
        records.length,
        `real-autonomous-record-order|${state.turn}`
    ).map(item => item.record);

    let selected = null;
    for (const record of orderedRecords) {
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
        if (!possible.length) continue;
        selected = { record, possible };
        break;
    }
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
        // hidden-button behaviour. Keep this looking exactly like the
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
                <div id="realZooDirectoryHint" style="font-size:12px;opacity:.72;margin-bottom:12px;">
                    Hover over a zoo to view its current collection and trade history. Press Ctrl or Shift to toggle the worldwide prestige ranking.
                </div>
                <div id="realZooDirectoryList"></div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('#closeRealZooDirectory')
            .addEventListener('click', closeRealZooDirectory);
        overlay.addEventListener('pointerdown', event => {
            if (event.target === overlay) closeRealZooDirectory();
        });

        // Ctrl or Shift is a simple view toggle while All Zoos is open.
        // Use keydown rather than modifier+wheel, so browser zoom/scroll
        // shortcuts remain untouched. Ignore key-repeat so holding a modifier
        // does not rapidly flip the directory back and forth.
        if (!document.documentElement.dataset.realZooDirectoryModifierToggleBound) {
            document.documentElement.dataset.realZooDirectoryModifierToggleBound = '1';
            document.addEventListener('keydown', event => {
                const liveOverlay = document.getElementById('realZooDirectoryOverlay');
                if (!liveOverlay || liveOverlay.style.display === 'none') return;
                if (event.repeat) return;
                if (event.key !== 'Control' && event.key !== 'Shift') return;

                liveOverlay.dataset.directoryMode =
                    liveOverlay.dataset.directoryMode === 'prestige' ? 'country' : 'prestige';
                renderRealZooDirectory();
            });
        }
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

        // the middle Trade History menu keeps its normal text colour.
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

function hideTradeAnimalLocationPopup() {
    const popup = document.getElementById('tradeAnimalLocationPopup');
    if (popup) popup.style.display = 'none';
}

function showTradeAnimalLocationPopup(node, name, level, animalId = null) {
    const popup = document.getElementById('tradeAnimalLocationPopup');
    if (!popup) return;

    popup.innerHTML = '';

    // current trade-history rows carry the exact physical animal ID.
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
        // an ID-bearing history entry represents one exact physical card.
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

function makeTradeAnimalSpan(name, level, allowLocation = false, inTradeHistoryMiddle = false, animalId = null, displayName = null) {
    const span = document.createElement('span');
    span.className = 'trade-animal-name' + (inTradeHistoryMiddle ? ' trade-history-animal-name' : '');
    span.textContent = displayName || name;
    // Keep the canonical English game name for provenance/location lookups.
    span.dataset.animalName = name;
    span.dataset.animalLevel = String(level ?? '');
    if (animalId != null) span.dataset.animalId = String(animalId);
    span.dataset.animalKey = animalId != null
        ? `id:${animalId}`
        : tradeAnimalKey(name, level);
    span.addEventListener('mouseenter', () => {
        if (inTradeHistoryMiddle) {
            // middle Trade History names may show transient hover/location
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

        // clicking the animal that is already locked toggles it off.
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
        const metadata = document.createElement('div');
        metadata.textContent =
            `PRESTIGE: ${realZooPrestige(recordOrName)}\n` +
            `COUNTRY: ${recordOrName.country || 'Unknown'}\n` +
            `PROVINCE: ${recordOrName.province || 'Unknown'}`;
        metadata.style.cssText = 'margin-top:4px;opacity:.82;white-space:pre-line;';
        popup.appendChild(metadata);
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

function appendZooPopupIdentity(popup, record, fallbackName = 'Zoo') {
    if (!popup) return;

    const title = document.createElement('strong');
    title.textContent = record?.name || fallbackName;
    popup.appendChild(title);

    const metadata = document.createElement('div');
    const prestige = record ? realZooPrestige(record) : 0;
    metadata.textContent =
        `PRESTIGE: ${prestige}\n` +
        `COUNTRY: ${record?.country || 'Unknown'}\n` +
        `PROVINCE: ${record?.province || 'Unknown'}`;
    metadata.style.cssText =
        'margin-top:4px;opacity:.82;white-space:pre-line;';
    popup.appendChild(metadata);
}

function fillZooCollectionPopup(record) {
    const popup = document.getElementById('opponentInfoPopup');
    if (!popup || !record) return;
    const currentAnimals = [...realZooSessionAnimalNames(record)]
        .map(name => animalFromRealZooName(name))
        .filter(Boolean);

    popup.innerHTML = '';
    appendZooPopupIdentity(popup, record);
    popup.appendChild(document.createElement('br'));
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
        catName.textContent = `${state.gameOptions.animalLanguage === 'nl' ? dutchCategoryName(category) : category}:`;
        cat.appendChild(catName);
        for (const animal of [...grouped.get(category)].sort((a,b)=>a.level-b.level || String(a.filename).localeCompare(String(b.filename)))) {
            const line = document.createElement('div');
            line.style.paddingLeft = '10px';
            const name = String(animal.filename || '').replace(/\.png$/i,'');
            line.append(makeTradeAnimalSpan(name, animal.level, false, false, null, dutchAnimalName(animal) || name), document.createTextNode(` (L${animal.level})`));
            cat.appendChild(line);
        }
        popup.appendChild(cat);
    }
    refreshTradeAnimalHighlights();
}

function fillPlayerZooCollectionPopup() {
    const popup = document.getElementById('opponentInfoPopup');
    if (!popup) return;

    const currentAnimals = (state.animals || []).filter(animal => animal && animal.enclosureId != null);
    popup.innerHTML = '';

    const title = document.createElement('strong');
    title.textContent = state.zooName || 'Your Zoo';
    popup.appendChild(title);

    const metadata = document.createElement('div');
    metadata.textContent =
        `PRESTIGE: ${updateHighestZooPrestige()}\n` +
        `COUNTRY: ${state.zooCountry || 'Unknown'}\n` +
        `PROVINCE: ${state.zooProvince || 'Unknown'}`;
    metadata.style.cssText = 'margin-top:4px;opacity:.82;white-space:pre-line;';
    popup.appendChild(metadata);

    popup.appendChild(document.createElement('br'));
    const label = document.createElement('strong');
    label.textContent = 'Animals by category:';
    popup.append(label, document.createElement('br'));

    const grouped = new Map();
    for (const animal of currentAnimals) {
        if (!grouped.has(animal.category)) grouped.set(animal.category, []);
        grouped.get(animal.category).push(animal);
    }
    const order = [
        ...CATEGORY_PROGRESSION_ORDER,
        ...[...grouped.keys()].filter(category => !CATEGORY_PROGRESSION_ORDER.includes(category)).sort()
    ];
    for (const category of order.filter(category => grouped.get(category)?.length)) {
        const cat = document.createElement('div');
        cat.style.marginTop = '8px';
        const catName = document.createElement('strong');
        catName.textContent = `${state.gameOptions.animalLanguage === 'nl' ? dutchCategoryName(category) : category}:`;
        cat.appendChild(catName);
        for (const animal of [...grouped.get(category)].sort((a, b) =>
            a.level - b.level || String(a.filename || '').localeCompare(String(b.filename || ''))
        )) {
            const line = document.createElement('div');
            line.style.paddingLeft = '10px';
            const animalName = String(animal.filename || '').replace(/\.png$/i, '');
            line.append(
                makeTradeAnimalSpan(animalName, animal.level, false, false, animal.id ?? null, dutchAnimalName(animal) || animalName),
                document.createTextNode(` (L${animal.level})`)
            );
            cat.appendChild(line);
        }
        popup.appendChild(cat);
    }

    if (!currentAnimals.length) {
        const empty = document.createElement('div');
        empty.textContent = 'none';
        empty.style.paddingLeft = '10px';
        popup.appendChild(empty);
    }
    refreshTradeAnimalHighlights();
}

function fillPlayerZooTradePopup() {
    const popup = document.getElementById('zooTradePopup');
    if (!popup) return;
    const trades = state.tradeHistory || [];

    popup.innerHTML = '';
    const title = document.createElement('strong');
    title.textContent = `${state.zooName || 'Your Zoo'} — Trade History`;
    popup.appendChild(title);

    const metadata = document.createElement('div');
    metadata.textContent =
        `PRESTIGE: ${updateHighestZooPrestige()}\n` +
        `COUNTRY: ${state.zooCountry || 'Unknown'}\n` +
        `PROVINCE: ${state.zooProvince || 'Unknown'}`;
    metadata.style.cssText = 'margin-top:4px;opacity:.82;white-space:pre-line;';
    popup.appendChild(metadata);

    if (!trades.length) {
        const empty = document.createElement('div');
        empty.textContent = 'No trades completed yet.';
        empty.style.marginTop = '10px';
        popup.appendChild(empty);
        return;
    }

    for (const trade of [...trades].reverse()) {
        const row = document.createElement('div');
        row.style.cssText = 'padding:9px 0;border-top:1px solid rgba(255,255,255,.18);';
        const turn = document.createElement('div');
        turn.innerHTML = `<strong>Turn ${trade.turn} — ${trade.zooName || 'Zoo'}</strong>`;
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

function showPlayerZooDualPopups(panel) {
    const collection = document.getElementById('opponentInfoPopup');
    const trades = document.getElementById('zooTradePopup');
    if (!collection || !trades) return;

    clearTimeout(opponentInfoHideTimer);
    clearTimeout(opponentInfoFadeTimer);
    clearTimeout(opponentInfoShowTimer);
    opponentInfoFadeStarted = false;
    activeZooMenuRecord = null;

    fillPlayerZooCollectionPopup();
    fillPlayerZooTradePopup();
    for (const popup of [collection, trades]) {
        popup.style.display = 'block';
        popup.style.opacity = '1';
    }
    pinnedZooPopupName = null;
    positionZooSidePopups(panel);
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

function realZooDirectoryRows() {
    const zoos = Array.isArray(state.realZooData?.zoos)
        ? [...state.realZooData.zoos]
        : [];

    const rows = zoos.map(record => ({
        record,
        country: String(record?.country || 'Unknown'),
        prestige: realZooPrestige(record),
        isPlayer: false,
        name: record?.name || 'Zoo'
    }));

    if (state.zooName) {
        rows.push({
            record: null,
            country: String(state.zooCountry || 'Unknown'),
            prestige: updateHighestZooPrestige(),
            isPlayer: true,
            name: state.zooName
        });
    }
    return rows;
}

function renderRealZooDirectory() {
    const overlay = document.getElementById('realZooDirectoryOverlay');
    const list = document.getElementById('realZooDirectoryList');
    const hint = document.getElementById('realZooDirectoryHint');
    if (!overlay || !list) return;

    list.innerHTML = '';
    const directoryRows = realZooDirectoryRows();
    const prestigeMode = overlay.dataset.directoryMode === 'prestige';

    if (hint) {
        hint.textContent = prestigeMode
            ? 'All zoos ranked together by prestige. Close and reopen this menu to return to country sections.'
            : 'Hover over a zoo to view its current collection and trade history. Press Ctrl or Shift to toggle the worldwide prestige ranking.';
    }

    if (prestigeMode) {
        // Global ranking: highest prestige first. Country headings disappear,
        // and explicit rank numbers make the player's relative position clear.
        directoryRows.sort((a, b) =>
            b.prestige - a.prestige ||
            String(a.name || '').localeCompare(String(b.name || ''))
        );
    } else {
        const playerCountry = normaliseGeographyPart(state.zooCountry || '');
        directoryRows.sort((a, b) => {
            const aHome = playerCountry && normaliseGeographyPart(a.country) === playerCountry;
            const bHome = playerCountry && normaliseGeographyPart(b.country) === playerCountry;
            if (aHome !== bHome) return aHome ? -1 : 1;
            const countryOrder = a.country.localeCompare(b.country);
            if (countryOrder) return countryOrder;
            return (
                b.prestige - a.prestige ||
                String(a.name || '').localeCompare(String(b.name || ''))
            );
        });
    }

    if (!directoryRows.length) {
        const empty = document.createElement('div');
        empty.textContent = 'Real zoo database is still loading.';
        empty.style.cssText = 'padding:10px 0;opacity:.72;';
        list.appendChild(empty);
        return;
    }

    let lastCountry = '';
    for (let index = 0; index < directoryRows.length; index += 1) {
        const item = directoryRows[index];
        const record = item.record;

        if (!prestigeMode && item.country !== lastCountry) {
            const heading = document.createElement('div');
            heading.textContent = item.country;
            heading.style.cssText =
                'margin:13px 0 4px;font-size:11px;font-weight:800;opacity:.55;' +
                'text-transform:uppercase;letter-spacing:.06em;';
            list.appendChild(heading);
            lastCountry = item.country;
        }

        const row = document.createElement('div');
        row.className = 'real-zoo-directory-row';
        row.style.cssText =
            'padding:5px 2px;border-top:1px solid rgba(0,0,0,.10);' +
            'font-size:13px;line-height:1.35;cursor:default;display:flex;' +
            'align-items:baseline;gap:10px;';

        if (prestigeMode) {
            const rank = document.createElement('span');
            rank.textContent = `#${index + 1}`;
            rank.style.cssText =
                `flex:0 0 34px;font-size:11px;opacity:.55;text-align:right;` +
                (item.isPlayer ? 'font-weight:800;opacity:.9;' : '');
            row.appendChild(rank);
        }

        const name = document.createElement('span');
        name.textContent = item.name || 'Zoo';
        name.style.cssText = `flex:1;min-width:0;${item.isPlayer ? 'font-weight:800;' : ''}`;
        row.appendChild(name);

        if (prestigeMode) {
            const country = document.createElement('span');
            country.textContent = item.country;
            country.style.cssText =
                'flex:0 1 120px;min-width:0;font-size:11px;opacity:.50;' +
                'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
            row.appendChild(country);
        }

        // Keep the ordinary country directory clean. Prestige values are
        // shown only in the worldwide ranking view (and in zoo info popups).
        if (prestigeMode) {
            const prestige = document.createElement('span');
            prestige.textContent = `Prestige ${Math.round(Number(item.prestige) || 0)}`;
            prestige.style.cssText =
                `flex:0 0 auto;font-size:11px;opacity:.58;white-space:nowrap;` +
                (item.isPlayer ? 'font-weight:800;' : '');
            row.appendChild(prestige);
        }

        if (item.isPlayer) {
            const rankText = prestigeMode ? `, rank ${index + 1}` : '';
            row.setAttribute('aria-label', `${item.name}, your zoo${rankText}, Prestige ${Math.round(Number(item.prestige) || 0)}`);
            row.addEventListener('mouseenter', () =>
                showPlayerZooDualPopups(document.getElementById('realZooDirectoryPanel'))
            );
            row.addEventListener('mouseleave', () => {
                if (!pinnedZooPopupName) scheduleOpponentInfoHide();
            });
            row.addEventListener('pointerdown', event => {
                if (event.pointerType === 'touch') {
                    event.preventDefault();
                    event.stopPropagation();
                    showPlayerZooDualPopups(document.getElementById('realZooDirectoryPanel'));
                }
            });
        } else {
            row.addEventListener('mouseenter', () =>
                showZooDualPopups(record, document.getElementById('realZooDirectoryPanel'), false)
            );
            row.addEventListener('mouseleave', () => {
                if (!pinnedZooPopupName) scheduleOpponentInfoHide();
            });
            row.addEventListener('pointerdown', event => {
                if (event.pointerType === 'touch') {
                    event.preventDefault();
                    event.stopPropagation();
                    showRealZooDirectoryCollection(record, row);
                }
            });
        }

        list.appendChild(row);
    }
}

function openRealZooDirectory() {
    pauseAllHintGlowsForMenu();
    ensureOtherZoosUI();
    const overlay = document.getElementById('realZooDirectoryOverlay');
    if (!overlay) return;

    // Every fresh opening starts in the familiar country-grouped view.
    overlay.dataset.directoryMode = 'country';
    renderRealZooDirectory();
    overlay.style.display = 'flex';
    enqueueMicrotask(localizeDocument);
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
        ? `Prestige: ${realZooPrestige(record)}\n` +
          `Country: ${record.country || 'Unknown'}\n` +
          `Province: ${record.province || 'Unknown'}${realZooRelationshipLabel(record) ? ` (${realZooRelationshipLabel(record)})` : ''}\n\n`
        : `Prestige: ${Number(profile.prestige) || 0}\n` +
          `Country: ${profile.country || 'Unknown'}\n` +
          `Province: ${profile.province || 'Unknown'}\n\n`;
    popup.textContent =
        `${profile.name || `Zoo ${index + 1}`}\n` +
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
    enqueueMicrotask(localizeDocument);
}

function closeTradeHistoryMenu(resumeHints = true) {
    resetTradeAnimalHighlightUI(true);
    const overlay = document.getElementById('tradeHistoryOverlay');
    if (overlay) overlay.style.display = 'none';
    // Trade History itself vanishes instantly, so its side popups do too.
    hideZooDualPopups(true);
    if (resumeHints) resumeHintGlowsAfterMenu();
}

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

// preserve the established desktop composition on laptop viewports.
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

    // Restore the established trade-card dimensions and positioning.
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

    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const exchangeControls = document.getElementById('exchangeControls');

    // Phone: the two offer cards are genuine header actions immediately after
    // Upgrade. Desktop keeps the established fixed overlay next to Other Zoos.
    const desiredParent = mobile && exchangeControls ? exchangeControls : document.body;
    if (area.parentElement !== desiredParent) desiredParent.appendChild(area);
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
        ? { id: state.nextId++, ...selected, enclosureId: null, slotIndex: null }
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
    // cached blue-glow predictions are promises about exact stock cards.
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
    // V220.69: incoming offers were averaging about one every 14 turns at the
    // default 50% setting when legal trades were available. A 1-3 turn retry
    // window brings that to about one every 7 turns while preserving the
    // frequency slider, offer lifetime and all trade-legality rules.
    return 1 + Math.floor(Math.random() * 3); // 1 through 3 turns, inclusive
}

function scheduleNextAutonomousOpponentOffer() {
    state.nextAutonomousOfferTurn = state.turn + randomAutonomousOfferDelay();
}

function clearAutonomousOpponentOffer(resetTimer = true) {
    state.autonomousTradeOffer = null;
    if (resetTimer) scheduleNextAutonomousOpponentOffer();
    renderTrade();
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
        return;
    }

    // materialise exactly the same locked offer set used by the blue
    // eligibility glow. This removes the old second calculation that could
    // make a non-glowing animal unexpectedly receive offers.
    const locked = predictedPlayerTradeOffers(outgoing);
    state.tradeOffers = materializeLockedPlayerTradeOffers(outgoing, locked);
    state.selectedTradeOpponent = state.tradeOffers.length
        ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
        : null;

    renderTrade();
    // Offer state is complete now. The rendered <img> elements load normally;
    // preloading is only a background cache warm-up and must never delay the UI.
    preloadAnimals(state.tradeOffers.map(offer => offer.animal));
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
        } animal.enclosureId = null; animal.slotIndex = null;
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
    animal.enclosureId = null;
    animal.slotIndex = null;

    noteNewCardAction();

    // If this card started this same drag in Outgoing Offer, putting it back
    // is not a new trade attempt. Restore the exact offers that were visible
    // before pickup. Re-running offer generation here can invalidate the
    // negotiation because the card is temporarily outside its original zoo
    // location during the drag.
    if (
        state.drag?.type === 'animal' &&
        state.drag.animal?.id === animal.id &&
        state.drag.originalWasOutgoing &&
        Array.isArray(state.drag.originalTradeOffers)
    ) {
        state.tradeOffers = state.drag.originalTradeOffers.map(offer => ({ ...offer }));
        state.selectedTradeOpponent = state.drag.originalSelectedTradeOpponent;
        renderTrade();
        preloadAnimals(state.tradeOffers.map(offer => offer.animal));
        return true;
    }

    // For an ordinary blue-glowing card, use the exact live offers captured
    // at pointer-down. This closes the old gap where the glow was valid while
    // the card was in its enclosure, but the offer disappeared because the
    // trade was recalculated after the card had been removed from that slot.
    const capturedLiveOffers =
        state.drag?.type === 'animal' &&
        state.drag.animal?.id === animal.id &&
        Array.isArray(state.drag.liveTradeOffersAtDragStart)
            ? state.drag.liveTradeOffersAtDragStart
            : [];

    if (!pendingEmergencyTrade && capturedLiveOffers.length) {
        if (isRealOpponentMode()) {
            state.opponentProfiles = capturedLiveOffers.map((item, index) =>
                realZooProfile(item.record, index)
            );
            state.opponentTradeStocks = capturedLiveOffers.map(item =>
                realZooTradeAnimals(item.record, true)
            );
            state.tradeOffers = capturedLiveOffers.map((item, index) => ({
                opponentIndex: index,
                animal: item.animal
            }));
            state.selectedTradeOpponent = state.tradeOffers.length ? 0 : null;
        } else {
            state.tradeOffers = capturedLiveOffers.map(item => ({
                opponentIndex: item.opponentIndex,
                animal: item.animal
            }));
            state.selectedTradeOpponent = state.tradeOffers.length
                ? state.tradeOffers.map(o => o.opponentIndex).sort((a, b) => a - b)[0]
                : null;
        }
        renderTrade();
        preloadAnimals(state.tradeOffers.map(offer => offer.animal));
        return true;
    }

    generateOpponentTradeOffers(animal, pendingEmergencyTrade);
    return true;
}

function autoSelectOutgoingOfferAnimal() {
    if (!state.loaded || state.drag || state.pan) return false;
    if (state.outgoingOffer || state.result || state.exchange.some(Boolean)) return false;

    // Only animals genuinely placed in the zoo are candidates.
    const candidates = state.animals.flatMap(animal => {
        if (animal.enclosureId === null || animal.enclosureId === undefined) return [];

        // "predicted" is not enough. The blue trade-interest glow only
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
    animal.enclosureId = null;
    animal.slotIndex = null;

    noteNewCardAction();
    refreshDrawAvailabilityState();
    renderZoo();

    // install the exact VERIFIED live offers captured above. Do not call
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
    // The existing <img> elements load their src asynchronously on their own.
    // Warm the same assets in the background, but do not rebuild the complete
    // trade UI merely because the preload promise finished.
    preloadAnimals(state.tradeOffers.map(offer => offer.animal));
    return true;
}

// Clicking/tapping the empty Outgoing Offer box is a shortcut for choosing a
// random zoo animal that is already known to have at least one valid offer.
outgoingOfferBox?.addEventListener('click', event => {
    if (state.drag || state.pan) return;
    if (state.outgoingOffer) return;

    event.preventDefault();
    event.stopPropagation();
    autoSelectOutgoingOfferAnimal();
});

// one authoritative Outgoing Offer hover path.
// Order matters: suppress yellow first WITHOUT rebuilding DOM, then calculate
// and paint the blue trade glow onto those same card nodes.
// entering either trade-offer box must hand the hover preview back to
// its normal hide lifecycle. The preview itself cancels its hide timer while
// hovered; without this reset, moving from the enlarged preview into the trade
// controls could leave the bottom-left card stuck on screen indefinitely.
function releaseHoverPreviewForTradeControls() {
    cancelHoverPreviewIntent();
    if (!hoverPreview.classList.contains('visible')) return;
    setHoverPreviewSuperZoom(false);
    scheduleHoverPreviewHide();
}

outgoingOfferBox?.addEventListener('mouseenter', () => {
    releaseHoverPreviewForTradeControls();

    if (state.sandboxMode) return;

    state.outgoingOfferTradeHoverActive = true;
    setOutgoingOfferExchangeGlowSuppression(true);

    if (!window.matchMedia('(max-width: 700px)').matches &&
        tradeGlowTarget(outgoingOfferBox)) {
        applyTradeEligibleGlow();
    }
});

outgoingOfferBox?.addEventListener('mouseleave', () => {
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
incomingOfferBox?.addEventListener('mouseenter', () => {
    releaseHoverPreviewForTradeControls();
});

function renderTrade() {
    if (!outgoingOfferBox || !incomingOfferBox) return;

    // A blue eligibility glow is meaningful only while the player is choosing
    // an outgoing card. Once trade state becomes occupied, kill any active
    // work/fade immediately so a stale blue card cannot survive a trade render.
    if (
        tradeEligibleGlowActive &&
        (
            state.outgoingOffer ||
            (selectedTradeOffer() && !state.autonomousTradeOffer)
        )
    ) {
        clearTradeEligibleGlow();
    }

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
        // never attach this button to whichever parent the incoming box
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

    // until the player actually picks up the incoming animal, the
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
    // No render here. Releasing the outgoing slot reservation is deliberately
    // temporary drag state and has no visible DOM effect. In particular, do
    // not let renderAll() snapshot/autosave this mid-drag state.
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
        // A trade is committed only when its incoming animal has a legal
        // destination. Invalid drags leave the offer untouched.
        return false;
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

    // update the exact physical cards' provenance before ownership moves.
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
        }
        return;
    }

    // validate the destination against the ACTUAL incoming trade card.
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
        // Invalid/cancelled drop changed no visible state, so no render/save.
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

        // opponent names on the main game screen no longer open
        // collection popups. All Zoos and Trade History retain their popups.
    }
}


// ============================================================
// ZOO NAME EDITING
// ============================================================

function ensurePlayerZooNameHoverUI() {
    if (!document.getElementById('player-zoo-name-hover-styles')) {
        const style = document.createElement('style');
        style.id = 'player-zoo-name-hover-styles';
        style.textContent = `
            /* The header previously used pointer-events:none in some layouts so
               the zoo title could not interfere with map/header controls. The
               type/location spans are deliberately interactive hover targets. */
            #playerZooName,
            #playerZooName .zoo-name-editor,
            #playerZooName .zoo-name-text,
            #playerZooName .zoo-name-hover-part {
                pointer-events: auto !important;
            }
            .zoo-name-hover-part { cursor: help; }
            #playerZooNameHoverPopup {
                position: fixed;
                z-index: 10050;
                pointer-events: none;
                display: none;
                max-width: min(320px, calc(100vw - 24px));
                padding: 8px 10px;
                border-radius: 7px;
                background: rgba(20, 24, 28, .96);
                color: #fff;
                box-shadow: 0 4px 18px rgba(0,0,0,.28);
                font-size: 13px;
                line-height: 1.35;
                white-space: normal;
            }
            #playerZooNameHoverPopup strong { font-weight: 700; }
        `;
        document.head.appendChild(style);
    }
    let popup = document.getElementById('playerZooNameHoverPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'playerZooNameHoverPopup';
        document.body.appendChild(popup);
    }
    return popup;
}

function readableZooType(type) {
    const labels = {
        general: 'General Zoo',
        aquarium: 'Aquarium',
        tropical: 'Tropical Zoo',
        safari: 'Safari Park',
        forest: 'Forest Zoo',
        farm: 'Farm Zoo',
        bird: 'Bird Park',
        raptor: 'Bird of Prey Park',
        reptile: 'Reptile Park',
        alpine: 'Alpine Zoo'
    };
    const key = normaliseZooTypes(type)[0] || 'general';
    return labels[key] || key.replace(/(^|[-_\\s])([a-z])/g, (_, gap, letter) => `${gap}${letter.toUpperCase()}`);
}

function positionPlayerZooNameHoverPopup(anchor, popup) {
    if (!anchor || !popup) return;
    const rect = anchor.getBoundingClientRect();
    popup.style.display = 'block';
    const popupRect = popup.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - popupRect.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - popupRect.width - 8));
    let top = rect.bottom + 7;
    if (top + popupRect.height > window.innerHeight - 8) {
        top = Math.max(8, rect.top - popupRect.height - 7);
    }
    popup.style.left = `${Math.round(left)}px`;
    popup.style.top = `${Math.round(top)}px`;
}

function escapePlayerZooNameHoverHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function bindPlayerZooNameHoverPart(node, htmlProvider) {
    if (!node) return;
    node.classList.add('zoo-name-hover-part');

    const show = () => {
        const popup = ensurePlayerZooNameHoverUI();
        popup.innerHTML = htmlProvider();
        positionPlayerZooNameHoverPopup(node, popup);
    };
    const hide = () => {
        const popup = document.getElementById('playerZooNameHoverPopup');
        if (popup) popup.style.display = 'none';
    };

    // Pointer events cover mouse and pen without double-firing duplicate mouse handlers.
    node.addEventListener('pointerenter', show);
    node.addEventListener('pointermove', () => {
        const popup = document.getElementById('playerZooNameHoverPopup');
        if (popup?.style.display === 'block') positionPlayerZooNameHoverPopup(node, popup);
    });
    node.addEventListener('pointerleave', hide);

    // Native tooltip fallback also makes the information discoverable if a
    // browser suppresses scripted hover events for any reason.
    node.title = String(htmlProvider())
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>');
}

function renderPlayerZooNameText(textNode) {
    if (!textNode) return;
    const fullName = String(state.zooName || '').trim();
    const location = String(state.zooLocation || '').trim();
    let prefix = fullName;
    let place = '';

    if (location) {
        const lowerName = fullName.toLocaleLowerCase();
        const lowerLocation = location.toLocaleLowerCase();
        const index = lowerName.lastIndexOf(lowerLocation);
        if (index >= 0) {
            prefix = fullName.slice(0, index).trim();
            place = fullName.slice(index).trim();
        }
    }
    if (!place) {
        const recognised = recognisedZooPlaceInName(fullName, state.zooCountry);
        if (recognised?.location) {
            const lowerName = fullName.toLocaleLowerCase();
            const lowerLocation = recognised.location.toLocaleLowerCase();
            const index = lowerName.lastIndexOf(lowerLocation);
            if (index >= 0) {
                prefix = fullName.slice(0, index).trim();
                place = fullName.slice(index).trim();
            }
        }
    }

    textNode.innerHTML = '';
    const prefixNode = document.createElement('span');
    prefixNode.className = 'zoo-name-prefix';
    prefixNode.textContent = prefix || fullName;
    bindPlayerZooNameHoverPart(prefixNode, () =>
        `<strong>Zoo type:</strong> ${escapePlayerZooNameHoverHtml(readableZooType(state.zooType))}`
    );
    textNode.appendChild(prefixNode);

    if (place) {
        textNode.appendChild(document.createTextNode(prefix ? ' ' : ''));
        const placeNode = document.createElement('span');
        placeNode.className = 'zoo-name-place';
        placeNode.textContent = place;
        bindPlayerZooNameHoverPart(placeNode, () => {
            const lines = [
                `<strong>Location:</strong> ${escapePlayerZooNameHoverHtml(state.zooLocation || place)}`,
                `<strong>Country:</strong> ${escapePlayerZooNameHoverHtml(state.zooCountry || 'Unknown')}`
            ];
            if (state.zooProvince) lines.push(`<strong>Province:</strong> ${escapePlayerZooNameHoverHtml(state.zooProvince)}`);
            return lines.join('<br>');
        });
        textNode.appendChild(placeNode);
    }
}

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


    renderPlayerZooNameText(text);


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

                    // A recognised place in the manually entered name changes
                    // the zoo's real geography immediately. Trade proximity and
                    // LOCAL/NATIONAL/FOREIGN behaviour therefore follow the name.
                    const recognisedPlace = recognisedZooPlaceInName(newName, state.zooCountry);
                    if (recognisedPlace) {
                        state.zooCountry = recognisedPlace.country;
                        state.zooProvince = recognisedPlace.province || '';
                        state.zooLocation = recognisedPlace.location;
                        state.tradeOfferCache.clear();
                        state.provinceDistanceCache.clear();
                    }

                    // Main-screen edits are authoritative until the living
                    // collection crosses a genuine zoo-type threshold.
                    state.manualZooNameOverrideType =
                        normaliseZooTypes(state.zooType)[0] || 'general';

                }


                renderPlayerZooNameText(text);


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
        state.zooNameWasStartupFallback = true;


        state.opponentNames = [
            'Riverside Zoo',
            'Forest Wildlife Park',
            'Lakeside Zoo'
        ];

    }
    else {

        state.zooNameWasStartupFallback = false;
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

        const padding = 70;
        const availableWidth = Math.max(200, zooBoard.clientWidth - padding * 2);
        const availableHeight = Math.max(200, zooBoard.clientHeight - padding * 2);
        const fitZoom = Math.min(1, availableWidth / zooWidth, availableHeight / zooHeight);
        state.zoom = clamp(fitZoom, currentZoomMin(), ZOOM_MAX);
        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Wait one more paint after changing zoom. This is important on mobile:
        // otherwise scroll extents may still describe the previous scale and the
        // starting zoo can land visibly off-centre.
        requestAnimationFrame(() => {
            zooBoard.scrollLeft = Math.max(
                0,
                Math.min(
                    zooBoard.scrollWidth - zooBoard.clientWidth,
                    centerX * state.zoom - zooBoard.clientWidth / 2
                )
            );
            zooBoard.scrollTop = Math.max(
                0,
                Math.min(
                    zooBoard.scrollHeight - zooBoard.clientHeight,
                    centerY * state.zoom - zooBoard.clientHeight / 2
                )
            );
        });
    });
}


hoverPreview?.addEventListener('mouseenter', () => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    cancelHoverPreviewHide();
    setHoverPreviewSuperZoom(true);
});

hoverPreview?.addEventListener('mouseleave', () => {
    if (window.matchMedia('(max-width: 700px)').matches) return;
    setHoverPreviewSuperZoom(false);
    scheduleHoverPreviewHide();
});

hoverPreview?.addEventListener('click', event => {
    if (event.target.closest('#wikiPreviewLink, #ztlPreviewLink, #animalInformationZtlLink, .animal-info-tab, .ztl-record')) return;

    // normal click still flips the card, but a click-drag text selection
    // inside the information face must remain a normal browser selection.
    const selection = window.getSelection?.();
    if (selection && !selection.isCollapsed && String(selection).trim()) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    const mobileLayout = window.matchMedia('(max-width: 700px)').matches;

    // Mobile animal taps already open the full-size centred card. A tap
    // anywhere on the card face therefore flips directly to Information.
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
    hoverPreview.style.setProperty('display', 'none', 'important');
    hoverPreview.style.setProperty('visibility', 'hidden', 'important');
    hoverPreview.setAttribute('aria-hidden', 'true');
}

document.addEventListener('pointerdown', event => {
    if (!window.matchMedia('(max-width: 700px)').matches) return;

    const evidencePopup = document.getElementById('combinationSourceTooltip');
    if (
        evidencePopup?.dataset.mobilePinned === '1' &&
        !event.target.closest('.animal-combination-row') &&
        event.target !== evidencePopup
    ) {
        evidencePopup.style.display = 'none';
        evidencePopup.style.pointerEvents = 'none';
        delete evidencePopup.dataset.mobilePinned;
    }

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

function wakeMobileTradeArea() {
    // Offer cards are permanent header controls on mobile. They never fade.
    document.getElementById('opponentTradeArea')?.classList.remove('trade-hud-idle');
}

function refreshMobileTradeAreaVisibility() {
    // Deliberately no transparency/idle state for the offer buttons.
    document.getElementById('opponentTradeArea')?.classList.remove('trade-hud-idle');
}

document.addEventListener('pointerdown', event => {
    if (!window.matchMedia('(max-width: 700px)').matches) return;
    if (event.target.closest('#opponentTradeArea, #opponentZoos')) {
        wakeMobileTradeArea();
    }
}, true);

// renderTrade/renderOpponentTradeState change these nodes whenever a player
// places/removes a trade card or an opponent creates/cancels an offer.
let mobileTradeMutationFrame = 0;
const mobileTradeObserver =
    typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            if (mobileTradeMutationFrame) return;
            mobileTradeMutationFrame = requestAnimationFrame(() => {
                mobileTradeMutationFrame = 0;
                refreshMobileTradeAreaVisibility();
            });
        })
        : null;

if (outgoingOfferBox && mobileTradeObserver) {
    mobileTradeObserver.observe(outgoingOfferBox, { childList: true, subtree: true });
}
if (incomingOfferBox && mobileTradeObserver) {
    mobileTradeObserver.observe(incomingOfferBox, { childList: true, subtree: true });
}
const mobileOpponentZoos = document.getElementById('opponentZoos');
if (mobileOpponentZoos && mobileTradeObserver) {
    mobileTradeObserver.observe(mobileOpponentZoos, {
        childList: true,
        subtree: true
    });
}

// Resize/orientation changes can fire in bursts on iOS Safari. Coalesce them
// into one visibility check per animation frame.
let mobileTradeResizeFrame = 0;
function refreshResponsiveTradeLayout() {
    if (mobileTradeResizeFrame) return;
    mobileTradeResizeFrame = requestAnimationFrame(() => {
        mobileTradeResizeFrame = 0;
        positionOpponentTradeArea();
        refreshMobileTradeAreaVisibility();
    });
}

window.addEventListener('resize', refreshResponsiveTradeLayout);

// iOS Safari can resize the visual viewport (address bar / keyboard) without
// producing a useful layout-viewport resize every time. Reuse the SAME
// coalesced callback so this never doubles the work in one animation frame.
window.visualViewport?.addEventListener('resize', refreshResponsiveTradeLayout);

setTimeout(refreshMobileTradeAreaVisibility, 0);


// ============================================================
// SAMPLE CATEGORY COLOURS FROM THE ACTUAL CARD ART
//
// One random Level 1 card per category is loaded. The game averages
// the top-right 20 x 20 source-image pixels and uses that colour for
// the progression tracker. This means the tracker follows the assets
// themselves instead of relying on guessed CSS colours.
// ============================================================

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
            // Compatibility is consulted live by placement/hover code.
            // Rebuilding the entire zoo here was redundant and could cause a
            // visible hitch just after startup on mobile Safari.
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

            const repairFreshFallback = Boolean(state.zooNameWasStartupFallback);
            if (repairFreshFallback) {
                const pool = buildZooNamePool(state.zooNamesData);
                if (pool.length) {
                    state.zooName = randomItem(pool);
                    state.zooNameWasStartupFallback = false;
                    createZooNameEditor();
                    writeAutoResumeSnapshot(true);
                }
            } else if (repairLoadedZooName()) {
                createZooNameEditor();
                writeAutoResumeSnapshot(true);
            }

            // If New Zoo was opened before this background file arrived, its
            // country picker was built from the Netherlands-only fallback.
            // Refresh it immediately from the now-complete country database.
            const newZooOverlay = document.getElementById('generateZooOverlay');
            if (newZooOverlay?._refreshZooCountries) {
                newZooOverlay._refreshZooCountries();
            }
        })
        .catch(error => console.warn('Zoo names unavailable; using built-in fallbacks:', error));

    state.realZooData = { zoos: [] };
    state.realZooTradeIndex = null;
    state.realZooRecordByStaticId = new Map();
    state.realZooSessionHoldings = new Map();
    state.realZooTradeDirtyZoos = new Set();
    
    loadRealZooDataInBackground();
    loadProvinceConnectionsInBackground();
}

function auditCriticalRuntimeFunctions() {
    const requiredNames = [
        'drawLevelOne',
        'createLevelOneForDraw',
        'prepareNextDrawAsset',
        'consumePreparedDrawSpec',
        'renderAll',
        'renderZoo',
        'renderExchange',
        'renderTrade',
        'refreshDrawAvailabilityState',
        'startEnclosureDrag',
        'startAnimalDrag',
        'placeAnimal',
        'canPlace',
        'importGameState',
        'openSaveLoadMenu',
        'openTradeHistoryMenu',
        'requestNewGame'
    ];

    const missing = requiredNames.filter(name => typeof globalThis[name] !== 'function');

    if (missing.length) {
        throw new Error(`Zoo Curator startup audit: missing runtime function(s): ${missing.join(', ')}`);
    }
}


async function startGame() {
    if (incomingOfferBox) incomingOfferBox.innerHTML =
        state.gameOptions.animalLanguage === 'nl'
            ? '<span>INKOMEND<br>AANBOD</span>'
            : '<span>INCOMING<br>OFFER</span>';

    try {
        auditCriticalRuntimeFunctions();

        // Validate the critical DOM inside the guarded startup path. If Safari
        // executes this build against stale/incomplete HTML, report the actual
        // missing element instead of aborting JavaScript at top level.
        requireElement(gameApp, 'gameApp');
        requireElement(drawCard, 'drawCard');
        requireElement(zooBoard, 'zooBoard');
        requireElement(zooCanvas, 'zooCanvas');
        requireElement(turnOrder, 'turnOrder');
        requireElement(exchange1, 'exchange1');
        requireElement(exchange2, 'exchange2');
        requireElement(resultBox, 'result');
        requireElement(outgoingOfferBox, 'outgoingOffer');
        requireElement(incomingOfferBox, 'ingoingOffer');
        requireElement(hoverPreview, 'hoverPreview');
        requireElement(hoverPreviewImage, 'hoverPreviewImage');
        requireElement(playerZooName, 'playerZooName');
        requireElement(document.getElementById('actionMenu'), 'actionMenu');

        // asset-inventory.json is the one external data file required to build
        // an actual playable zoo. Everything else starts in the background.
        updateBootLoadingStatus('Loading Zoo Curator...', 'Loading animal inventory...');

        state.inventory = await loadJson(
            `asset-inventory.json?v=${encodeURIComponent(ZOO_CURATOR_VERSION)}`,
            'Loading animal inventory...',
            12000
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
        ensureMobileSettingsHub();
        ensureMobilePhoneLayout();

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

        // Animal images are an optimisation, not a startup dependency.
        // Render the playable zoo immediately; individual cards already have
        // their Back.png/loading fallback while their real image arrives.
        // This removes up to several seconds from cold-start time on mobile
        // Safari and prevents one slow image from holding the whole app open.
        document.documentElement.style.setProperty('--zoo-zoom', state.zoom);
        renderAll(false);
        state.loaded = true;

        // the game is now genuinely playable. The old hint code waited
        // for state.setupComplete, a legacy property that is no longer set in
        // the current auto-generated-starting-zoo flow, so its timer never
        // armed. Start the decision hint from the real ready-state instead.
        idleGuideSetupWasComplete = true;
        armActionHint(blueHintInitialDelay());

        // Expose the ready state for lightweight deployment diagnostics.
        window.__zooGameReady = true;

        if (!resumedPreviousZoo) {
            writeAutoResumeSnapshot(true);
        }

        gameApp.classList.add('visible');

        if (resumedPreviousZoo && state.pendingRestoredView) {
            const restoredView = state.pendingRestoredView;
            state.pendingRestoredView = null;
            requestAnimationFrame(() => {
                zooBoard.scrollLeft = restoredView.scrollLeft;
                zooBoard.scrollTop = restoredView.scrollTop;
            });
        } else {
            centerInitialView();
        }

        // once the playable zoo is visible, remove the loading overlay
        // immediately. Do not paint a transient "Zoo Curator ready!" frame on
        // reload; that produced an unnecessary ZOO CURATOR / READY flash.
        if (bootScreen) {
            bootScreen.classList.add('hidden');
            bootScreen.style.display = 'none';
        }

        // Nothing below this line is allowed to delay the visible/playable zoo.
        // Warm the starting animal images only after first paint. The cards'
        // normal image loader remains authoritative, so this is safe to skip
        // or time out and does not alter game state.
        setTimeout(() => {
            // Persist only after the first playable frame. localStorage writes
            // and snapshot cloning are synchronous and can be noticeable on
            // mobile Safari with a developed zoo.
            captureTurnSnapshot();
            writeAutoResumeSnapshot();

            preloadAnimals(state.animals).catch(error => {
                console.warn('Background starting-image preload failed:', error);
            });
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



