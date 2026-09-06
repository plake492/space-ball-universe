(() => {
    const START_BALLS = 75;
    const START_GOAL = 75;
    const GOAL_MIN = 5;
    const GOAL_STEP = 5;
    const BALLS_MIN = 25;
    const BALLS_MAX = 250;
    const START_WORLD = 20000;
    const WORLD_SIZES = [5000, 10000, 15000, 20000];
    const TRIAL_MS = [60000, 300000, 600000];
    const DIFFICULTIES = {
        easy: { world: 5000, ballCount: 40, goal: 25 },
        medium: { world: 10000, ballCount: 60, goal: 45 },
        hard: { world: 15000, ballCount: 90, goal: 75 },
        extra: { world: 20000, ballCount: 120, goal: 110 },
        extreme: { world: 20000, ballCount: 150, goal: 150 },
    };
    const DIFF_ORDER = ["easy", "medium", "hard", "extra", "extreme"];
    const SETTINGS_KEY = "harlie-space-settings";
    const NAME_MAX = 20;
    const PLAY_KEY = "harlie-space-play";
    const BOARD_KEY = "harlie-space-board";
    const BOARD_MAX = 25;
    const MINIMAP_SIZE = 240;
    const MINIMAP_SCALE = 0.1;
    const COMPACT_UI = "(max-width: 1440px)";
    const COMPACT_STICK = 140 / 220;
    const CONTROL_GROW = 0.6;
    const SCALE_VMIN_START = 320;
    const SCALE_VMIN_FULL = 768;
    const STICK_PIP = 96;
    const BALL_TYPES = [
        { size: 32, points: 500 },
        { size: 56, points: 400 },
        { size: 80, points: 300 },
        { size: 110, points: 200 },
        { size: 150, points: 100 },
    ];
    const MAX_BALL = BALL_TYPES[BALL_TYPES.length - 1].size;
    const SPIKE_TYPES = BALL_TYPES.slice(-2);
    const SPIKE_RATE = 0.15;
    const SPIKE_REACH = 1.4;
    const SPIKE_TRIAL_MS = 10000;
    const DROP_RATE = 0.05;
    const SHIELD_DROP_R = 36;
    const SHIELD_SHIP_R = 38;
    const SHIP_RADIUS = 22;
    const SHIP_SPEED = 840;
    const SHIP_ACCEL = 2000;
    const SHIP_DECEL = 1500;
    const BOOST_DRAIN = 5;
    const BOOST_REFILL = 7.5;
    const SPAWN_CLEARANCE = 15;
    const BALL_GAP = 12;
    const NEUTRON_R = 11;
    const NEUTRON_ORBIT = 34;
    const NEUTRON_ORBIT_MAX = NEUTRON_ORBIT * 2.5;
    const NEUTRON_SPEED = 8.6;
    const NEUTRON_SWEEP = Math.round(250 * 2.66);
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 5;
    const ZOOM_STEP = 0.5;
    const ENGINE_SRC = "public/audio/ship/freesound_community-spacecraft-engine-loop-01-58205.mp3";
    const ENGINE_LOOP_START = 0.5;
    const ENGINE_LOOP_END = 15;
    const ENGINE_FADE = 0.3;
    const ENGINE_FADE_IN = 0.15;
    const ENGINE_GAIN = 0.38;
    const ENGINE_BOOST_RATE = 1.25;
    const HIT_SRC = "public/audio/balls/audio_319c456817.mp3";
    const COLLIDE_SRC = "public/audio/balls/collide.mp3";
    const ATMO_SRC = "public/audio/atmosphere/drone-outerspace-hum-danijel-zambo-1-02-27.mp3";
    const ATMO_GAIN = 0.14;
    const ATMO_FADE = 1.4;
    const PALETTES = {
        rainbow: [
            "#ff3b30",
            "#ff9500",
            "#ffcc00",
            "#34c759",
            "#007aff",
            "#5856d6",
            "#af52de",
        ],
        space: [
            "#6a0dad",
            "#9b4dff",
            "#c1121f",
            "#ff4d6d",
            "#ff7b00",
            "#ff9f43",
            "#00e5ff",
            "#4cc9f0",
            "#b5179e",
        ],
        dark: [
            "#141414",
            "#1f1f1f",
            "#2a2a2a",
            "#383838",
            "#4a4a4a",
            "#5c5c5c",
            "#6e6e6e",
            "#808080",
            "#969696",
        ],
    };
    const PALETTE_NAMES = Object.keys(PALETTES);
    const SKY_NAMES = ["stars", "galaxies"];
    const SHIP_IDS = ["classic", "ship-1", "cat", "wolf", "cube", "hello-kitty", "ufo", "harlie", "selah", "guitar", "selah-harlie", "harlie-ship-1"];
    const SHIP_SRC = {
        "ship-1": "public/images/ships/ship-1.png",
        cat: "public/images/ships/cat.png",
        wolf: "public/images/ships/wolf.png",
        cube: "public/images/ships/cube.png",
        "hello-kitty": "public/images/ships/hello-kitty.png",
        ufo: "public/images/ships/ufo.png",
        harlie: "public/images/ships/harlie.png",
        selah: "public/images/ships/selah.png",
        guitar: "public/images/ships/guitar.png",
        "selah-harlie": "public/images/ships/selah-harlie.png",
        "harlie-ship-1": "public/images/ships/harlie-ship-1.png",
    };
    const SHIP_PIXEL = new Set(["cat", "wolf", "ufo"]);
    const SHIP_COST_START = 5000;
    const SHIP_COST_GROW = 1.5;
    const shipImages = {};

    const PLAYGROUND = document.body.classList.contains("playground");
    const canvas = document.getElementById("game");
    // The sky gradient repaints every pixel each frame, so the canvas never needs
    // an alpha channel. Opaque canvases skip per-pixel blending when compositing.
    const ctx = canvas.getContext("2d", { alpha: false });
    const minimap = document.getElementById("minimap");
    const miniCtx = minimap.getContext("2d");
    const minimapStage = document.getElementById("minimap-stage");
    const minimapClose = document.getElementById("minimap-close");
    const foundEl = document.getElementById("found-count");
    const goalEl = document.getElementById("goal-count");
    const scoreEl = document.getElementById("play-score");
    const coordsEl = document.getElementById("coords");
    const timerEl = document.getElementById("play-timer");
    const lifetimeEl = document.getElementById("lifetime-points");
    const nameInput = document.getElementById("username-input");
    const ballsSlider = document.getElementById("balls-slider");
    const ballsSliderValue = document.getElementById("balls-slider-value");
    const goalSlider = document.getElementById("goal-slider");
    const goalSliderValue = document.getElementById("goal-slider-value");
    const volumeSlider = document.getElementById("volume-slider");
    const volumeSliderValue = document.getElementById("volume-slider-value");
    const zoomSlider = document.getElementById("zoom-slider");
    const zoomSliderValue = document.getElementById("zoom-slider-value");
    const settingsMenu = document.getElementById("settings-menu");
    const winOverlay = document.getElementById("win-overlay");
    const winMessage = document.getElementById("win-message");
    const winScoreEl = document.getElementById("win-score");
    const resumeOverlay = document.getElementById("resume-overlay");
    const resumeMessage = document.getElementById("resume-message");
    const boardOverlay = document.getElementById("board-overlay");
    const boardTable = document.getElementById("board-table");
    const boardList = document.getElementById("board-list");
    const boardEmpty = document.getElementById("board-empty");
    const timer = { elapsed: 0, runningSince: performance.now() };
    let shownSecond = -1;

    const keys = new Set();
    const stick = { vx: 0, vy: 0, dir: "", speed: 0, ring: "" };
    const STICK_DEAD = 20;
    const SPEED_RINGS = [
        { name: "slow", radius: 34, scale: 1 / 3 },
        { name: "medium", radius: 55, scale: 2 / 3 },
        { name: "fast", radius: 76, scale: 1 },
    ];
    const DIR_COUNT = 16;
    const DIRS = Array.from({ length: DIR_COUNT }, (_, i) => {
        const angle = (i * Math.PI * 2) / DIR_COUNT;
        return {
            name: `dir-${i}`,
            vx: Math.cos(angle),
            vy: Math.sin(angle),
            angle,
        };
    });

    function snapStep(value, min, max, step) {
        const snapped = Math.round(value / step) * step;
        return Math.min(max, Math.max(min, snapped));
    }

    function normalizeName(value) {
        return String(value || "").replace(/\s+/g, " ").trim().slice(0, NAME_MAX);
    }

    function shipUnlockAt(id) {
        const index = SHIP_IDS.indexOf(id);
        if (index <= 0) return 0;
        const raw = SHIP_COST_START * (SHIP_COST_GROW ** (index - 1));
        return Math.ceil(raw / 10) * 10;
    }

    function shipUnlocked(id, lifetime, reqShips) {
        if (PLAYGROUND) return true;
        if ((reqShips ?? state.reqShips) === false) return true;
        return (lifetime ?? state.lifetime) >= shipUnlockAt(id);
    }

    function clampVolume(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100;
    }

    function clampZoom(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return 1;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n / ZOOM_STEP) * ZOOM_STEP));
    }

    function loadSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
            const world = WORLD_SIZES.includes(Number(data.world)) ? Number(data.world) : START_WORLD;
            const ballCount = snapStep(Number(data.ballCount) || START_BALLS, BALLS_MIN, BALLS_MAX, GOAL_STEP);
            const goal = snapStep(Number(data.goal) || START_GOAL, GOAL_MIN, ballCount, GOAL_STEP);
            const palette = PALETTE_NAMES.includes(data.palette) ? data.palette : "space";
            const pulse = data.pulse === true;
            const nebula = data.nebula !== false;
            const starDrift = data.starDrift !== false;
            const sky = SKY_NAMES.includes(data.sky) ? data.sky : "stars";
            const lifetime = Math.max(0, Math.round(Number(data.lifetime) || 0));
            const reqShips = data.reqShips !== false;
            const wanted = SHIP_IDS.includes(data.ship) ? data.ship : "classic";
            const ship = shipUnlocked(wanted, lifetime, reqShips) ? wanted : "classic";
            const name = normalizeName(data.name);
            const difficulty = data.difficulty === "custom" || DIFFICULTIES[data.difficulty] ? data.difficulty : "";
            const trial = data.trial === true;
            const trialMs = TRIAL_MS.includes(Number(data.trialMs)) ? Number(data.trialMs) : 300000;
            const audio = data.audio !== false;
            const volume = data.volume == null ? 100 : clampVolume(data.volume);
            const spikes = data.spikes !== false;
            const meteorOn = data.meteorOn !== false;
            const infiniteFuel = data.infiniteFuel === true;
            const zoom = clampZoom(data.zoom == null ? 1 : data.zoom);
            if (difficulty && difficulty !== "custom") {
                const preset = DIFFICULTIES[difficulty];
                return {
                    world: preset.world,
                    ballCount: preset.ballCount,
                    goal: preset.goal,
                    palette,
                    pulse,
                    nebula,
                    starDrift,
                    sky,
                    ship,
                    name,
                    lifetime,
                    reqShips,
                    difficulty,
                    trial,
                    trialMs,
                    audio,
                    volume,
                    spikes,
                    meteorOn,
                    infiniteFuel,
                    zoom,
                };
            }
            return { world, ballCount, goal, palette, pulse, nebula, starDrift, sky, ship, name, lifetime, reqShips, difficulty, trial, trialMs, audio, volume, spikes, meteorOn, infiniteFuel, zoom };
        } catch {
            return { world: START_WORLD, ballCount: START_BALLS, goal: START_GOAL, palette: "space", pulse: false, nebula: true, starDrift: true, sky: "stars", ship: "classic", name: "", lifetime: 0, reqShips: true, difficulty: "", trial: false, trialMs: 300000, audio: true, volume: 100, spikes: true, meteorOn: true, infiniteFuel: false, zoom: 1 };
        }
    }

    function writeSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                world: state.world,
                ballCount: state.ballCount,
                goal: state.goal,
                palette: state.palette,
                pulse: state.pulse,
                nebula: state.nebula,
                starDrift: state.starDrift,
                sky: state.sky,
                ship: state.ship,
                name: state.name,
                lifetime: state.lifetime,
                reqShips: state.reqShips,
                difficulty: state.difficulty || "",
                trial: state.trial,
                trialMs: state.trialMs,
                audio: state.audio,
                volume: state.volume,
                spikes: state.spikes,
                meteorOn: state.meteorOn,
                infiniteFuel: state.infiniteFuel,
                zoom: state.zoom,
            }));
        } catch {
            // Ignore quota or private-mode failures.
        }
    }

    function ballTypeFor(ball) {
        const byPoints = BALL_TYPES.find((type) => type.points === Number(ball.points));
        if (byPoints) return byPoints;
        const r = Number(ball.r);
        if (!Number.isFinite(r)) return BALL_TYPES[2];
        let best = BALL_TYPES[0];
        let bestDist = Infinity;
        for (const type of BALL_TYPES) {
            const dist = Math.abs(type.size / 2 - r);
            if (dist < bestDist) {
                best = type;
                bestDist = dist;
            }
        }
        return best;
    }

    function normalizeBall(ball) {
        if (!ball || !Number.isFinite(Number(ball.x)) || !Number.isFinite(Number(ball.y))) return null;
        const type = ballTypeFor(ball);
        const r = type ? type.size / 2 : Number(ball.r);
        if (!Number.isFinite(r) || r <= 0) return null;
        return ensurePlanetLook({
            x: Number(ball.x),
            y: Number(ball.y),
            r,
            points: type ? type.points : Math.max(100, Number(ball.points) || 100),
            color: typeof ball.color === "string" ? ball.color : "#007aff",
            paints: sanitizePaints(ball.paints),
            litX: Number.isFinite(Number(ball.litX)) ? Math.max(-0.6, Math.min(0.6, Number(ball.litX))) : undefined,
            litY: Number.isFinite(Number(ball.litY)) ? Math.max(-0.6, Math.min(0.6, Number(ball.litY))) : undefined,
            pulseMs: Number(ball.pulseMs) || rand(1000, 5000),
            pulseOffset: Number(ball.pulseOffset) || rand(0, Math.PI * 2),
            hasRings: Boolean(ball.hasRings) && !ball.hasSpikes,
            ringTilt: Number.isFinite(Number(ball.ringTilt)) ? Number(ball.ringTilt) : 0,
            hasSpikes: Boolean(ball.hasSpikes),
            spikeCount: Math.max(8, Math.min(16, Math.round(Number(ball.spikeCount) || 12))),
            spikeSpin: Number.isFinite(Number(ball.spikeSpin)) ? Number(ball.spikeSpin) : 0,
        });
    }

    // localStorage writes are synchronous, and the play snapshot serialises every
    // ball in the world (~37KB at default settings, ~124KB at 250 balls). Collecting
    // a ball used to trigger one mid-frame, so writes are coalesced onto the tick
    // the loop already runs and flushed wherever losing a second would matter.
    let playDirty = false;
    let settingsDirty = false;

    function savePlay() {
        playDirty = true;
    }

    function saveSettings() {
        settingsDirty = true;
    }

    function flushSettings() {
        if (!settingsDirty) return;
        settingsDirty = false;
        writeSettings();
    }

    function flushPlay() {
        if (!playDirty) return;
        playDirty = false;
        writePlay();
    }

    function flushSaves() {
        flushSettings();
        flushPlay();
    }

    function writePlay() {
        if (state.wiped || PLAYGROUND) return;
        try {
            localStorage.setItem(PLAY_KEY, JSON.stringify({
                world: state.world,
                ballCount: state.ballCount,
                shipX: state.shipX,
                shipY: state.shipY,
                heading: state.heading,
                balls: state.balls.map((ball) => ({
                    x: ball.x,
                    y: ball.y,
                    r: ball.r,
                    points: ball.points,
                    color: ball.color,
                    paints: sanitizePaints(ball.paints),
                    litX: ball.litX,
                    litY: ball.litY,
                    pulseMs: ball.pulseMs,
                    pulseOffset: ball.pulseOffset,
                    hasRings: ball.hasRings,
                    ringTilt: ball.ringTilt,
                    hasSpikes: ball.hasSpikes,
                    spikeCount: ball.spikeCount,
                    spikeSpin: ball.spikeSpin,
                })),
                found: state.found,
                score: state.score,
                elapsed: playTime(performance.now()),
                won: state.won,
                boardLogged: state.boardLogged,
                cometSpawns: state.cometSpawns,
                drops: state.drops.map((drop) => ({
                    type: drop.type,
                    x: drop.x,
                    y: drop.y,
                    r: drop.r,
                })),
                shield: state.shield,
                taken: state.taken.map((ball) => ({
                    x: ball.x,
                    y: ball.y,
                    r: ball.r,
                    points: ball.points,
                    color: ball.color,
                    paints: sanitizePaints(ball.paints),
                    litX: ball.litX,
                    litY: ball.litY,
                    pulseMs: ball.pulseMs,
                    pulseOffset: ball.pulseOffset,
                    hasRings: ball.hasRings,
                    ringTilt: ball.ringTilt,
                    hasSpikes: false,
                    spikeCount: ball.spikeCount,
                    spikeSpin: ball.spikeSpin,
                })),
                trial: state.trial,
                trialMs: state.trialMs,
                spikes: state.spikes,
                meteorOn: state.meteorOn,
                infiniteFuel: state.infiniteFuel,
                neutrons: state.neutrons.map((pair) => ({
                    x: pair.x,
                    y: pair.y,
                    orbit: pair.orbit,
                    spin: pair.spin,
                    tilt: pair.tilt,
                    alive: pair.alive ? [pair.alive[0] !== false, pair.alive[1] !== false] : [true, true],
                })),
            }));
        } catch {
            // Ignore quota or private-mode failures.
        }
    }

    function loadPlay() {
        try {
            const data = JSON.parse(localStorage.getItem(PLAY_KEY) || "");
            if (!data || Number(data.world) !== state.world || Number(data.ballCount) !== state.ballCount) {
                return null;
            }
            if (Boolean(data.trial) !== state.trial) return null;
            if (state.trial && Number(data.trialMs) !== state.trialMs) return null;
            if ((data.spikes !== false) !== state.spikes) return null;
            if ((data.meteorOn !== false) !== state.meteorOn) return null;
            if (Boolean(data.infiniteFuel) !== state.infiniteFuel) return null;
            if (!Array.isArray(data.balls)) return null;
            const balls = [];
            for (const ball of data.balls) {
                const next = normalizeBall(ball);
                if (!next) return null;
                balls.push(next);
            }
            const drops = [];
            if (Array.isArray(data.drops)) {
                for (const drop of data.drops) {
                    const next = normalizeDrop(drop);
                    if (next) drops.push(next);
                }
            }
            const taken = [];
            if (Array.isArray(data.taken)) {
                for (const ball of data.taken) {
                    const next = normalizeBall(ball);
                    if (next && !next.hasSpikes) taken.push(next);
                }
            }
            const neutrons = [];
            if (Array.isArray(data.neutrons)) {
                for (const pair of data.neutrons) {
                    const next = normalizeNeutron(pair);
                    if (next) neutrons.push(next);
                }
            }
            const found = Math.max(0, Math.round(Number(data.found) || 0));
            const score = Math.max(0, Math.round(Number(data.score) || 0));
            const shipX = Number(data.shipX);
            const shipY = Number(data.shipY);
            const heading = Number(data.heading);
            if (!Number.isFinite(shipX) || !Number.isFinite(shipY) || !Number.isFinite(heading)) return null;
            return {
                shipX,
                shipY,
                heading,
                balls,
                found,
                score,
                elapsed: Math.max(0, Number(data.elapsed) || 0),
                won: Boolean(data.won),
                boardLogged: Boolean(data.boardLogged),
                cometSpawns: Math.max(0, Math.min(COMET_LIMIT, Math.round(Number(data.cometSpawns) || 0))),
                drops,
                hasDrops: Array.isArray(data.drops),
                shield: data.shield === true,
                taken,
                neutrons,
                hasNeutrons: Array.isArray(data.neutrons),
            };
        } catch {
            return null;
        }
    }

    function loadBoard() {
        try {
            const data = JSON.parse(localStorage.getItem(BOARD_KEY) || "[]");
            if (!Array.isArray(data)) return [];
            const rows = [];
            for (const row of data) {
                const name = normalizeName(row && row.name) || "Pilot";
                const score = Math.max(0, Math.round(Number(row && row.score) || 0));
                const elapsed = Math.max(0, Number(row && row.elapsed) || 0);
                if (!Number.isFinite(elapsed)) continue;
                rows.push({
                    name,
                    score,
                    elapsed,
                    at: Number(row && row.at) || 0,
                });
            }
            rows.sort((a, b) => b.score - a.score || a.elapsed - b.elapsed || b.at - a.at);
            return rows.slice(0, BOARD_MAX);
        } catch {
            return [];
        }
    }

    function saveBoard(rows) {
        try {
            localStorage.setItem(BOARD_KEY, JSON.stringify(rows.slice(0, BOARD_MAX)));
        } catch {
            // Ignore quota or private-mode failures.
        }
    }

    function recordWinScore() {
        if (PLAYGROUND || state.boardLogged) return;
        const rows = loadBoard();
        rows.push({
            name: state.name || "Pilot",
            score: state.score,
            elapsed: timer.elapsed,
            at: Date.now(),
        });
        rows.sort((a, b) => b.score - a.score || a.elapsed - b.elapsed || b.at - a.at);
        saveBoard(rows);
        state.boardLogged = true;
    }

    const saved = loadSettings();
    const state = {
        world: saved.world,
        shipX: saved.world / 2,
        shipY: saved.world / 2,
        heading: -Math.PI / 2,
        balls: [],
        holes: [],
        neutrons: [],
        nebulae: [],
        galaxies: [],
        comets: [],
        cometSpawns: 0,
        meteors: [],
        drops: [],
        shield: false,
        shieldRings: [],
        taken: [],
        pops: [],
        floaters: [],
        found: 0,
        score: 0,
        ballCount: saved.ballCount,
        goal: saved.goal,
        palette: saved.palette,
        pulse: saved.pulse,
        nebula: saved.nebula !== false,
        starDrift: saved.starDrift !== false,
        sky: SKY_NAMES.includes(saved.sky) ? saved.sky : "stars",
        ship: saved.ship,
        name: saved.name,
        lifetime: saved.lifetime,
        reqShips: saved.reqShips,
        difficulty: saved.difficulty || "",
        trial: Boolean(saved.trial),
        trialMs: TRIAL_MS.includes(Number(saved.trialMs)) ? Number(saved.trialMs) : 300000,
        audio: saved.audio !== false,
        volume: saved.volume == null ? 100 : clampVolume(saved.volume),
        spikes: saved.spikes !== false,
        meteorOn: saved.meteorOn !== false,
        infiniteFuel: saved.infiniteFuel === true,
        zoom: clampZoom(saved.zoom == null ? 1 : saved.zoom),
        speed: 0,
        boost: false,
        boostFuel: 1,
        won: false,
        menuOpen: false,
        settingsLite: false,
        resumeOpen: false,
        boardOpen: false,
        boardFrom: "settings",
        boardLogged: false,
        settingsPanel: "",
        wiped: false,
        minimapLarge: false,
        width: 0,
        height: 0,
        dpr: 1,
    };

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function hash2(x, y) {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return n - Math.floor(n);
    }

    // Held rather than re-queried: window.matchMedia() builds a new MediaQueryList
    // on every call, and this sits in the per-frame minimap path. `.matches` is
    // live, so the cached list still tracks resizes.
    const compactQuery = window.matchMedia(COMPACT_UI);

    function isCompactUi() {
        return compactQuery.matches;
    }

    function viewportSize() {
        const view = window.visualViewport;
        if (view) {
            return {
                width: Math.max(1, Math.round(view.width)),
                height: Math.max(1, Math.round(view.height)),
            };
        }
        return {
            width: Math.max(1, window.innerWidth),
            height: Math.max(1, window.innerHeight),
        };
    }

    function controlT() {
        const view = viewportSize();
        const vmin = Math.min(view.width, view.height);
        return Math.min(1, Math.max(0, (vmin - SCALE_VMIN_START) / (SCALE_VMIN_FULL - SCALE_VMIN_START)));
    }

    function applyControlLayout() {
        const t = controlT();
        const view = viewportSize();
        const grow = 1 + CONTROL_GROW * t;
        const root = document.documentElement;
        root.style.setProperty("--control-grow", String(grow));
        root.style.setProperty("--control-inset-x", `${Math.max(0, (view.width / 6) * t - 100)}px`);
        root.style.setProperty("--control-inset-y", `${Math.max(0, (view.height / 6) * t - 50)}px`);
    }

    function stickScale() {
        const base = isCompactUi() ? COMPACT_STICK : 1;
        return base * (1 + CONTROL_GROW * controlT());
    }

    function minimapBaseSize() {
        return isCompactUi() ? MINIMAP_SIZE * 0.5 * 0.9 : MINIMAP_SIZE;
    }

    function minimapSize() {
        if (!state.minimapLarge) return minimapBaseSize();
        const view = viewportSize();
        return Math.max(180, Math.floor(Math.min(view.width, view.height) * 0.86 - 24));
    }

    function setMinimapOpen(open) {
        state.minimapLarge = open;
        document.documentElement.classList.toggle("minimap-open", open);
        document.body.classList.toggle("minimap-open", open);
        if (minimapClose) minimapClose.classList.toggle("hidden", !open);
        minimap.setAttribute("aria-pressed", open ? "true" : "false");
        minimap.setAttribute("aria-label", open ? "Minimap" : "Minimap, tap to expand");
        resize();
    }

    function minimapWorldScale() {
        return MINIMAP_SCALE * (minimapBaseSize() / MINIMAP_SIZE);
    }

    function scaledRings() {
        const scale = stickScale();
        return SPEED_RINGS.map((ring) => ({
            ...ring,
            radius: ring.radius * scale,
        }));
    }

    let uiCompact = isCompactUi();
    let lastStickScale = stickScale();

    let resizeFrame = 0;

    function scheduleResize() {
        if (resizeFrame) return;
        resizeFrame = requestAnimationFrame(() => {
            resizeFrame = 0;
            resize();
        });
    }

    function resize() {
        applyControlLayout();
        const view = viewportSize();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.width = view.width;
        state.height = view.height;
        state.dpr = dpr;
        const offsetLeft = window.visualViewport ? Math.round(window.visualViewport.offsetLeft) : 0;
        const offsetTop = window.visualViewport ? Math.round(window.visualViewport.offsetTop) : 0;
        canvas.style.left = `${offsetLeft}px`;
        canvas.style.top = `${offsetTop}px`;
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        canvas.width = Math.floor(state.width * dpr);
        canvas.height = Math.floor(state.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const size = minimapSize();
        if (minimapStage) {
            minimapStage.style.width = `${size}px`;
            minimapStage.style.height = `${size}px`;
        }
        minimap.width = Math.floor(size * dpr);
        minimap.height = Math.floor(size * dpr);
        minimap.style.width = `${size}px`;
        minimap.style.height = `${size}px`;
        miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const compact = isCompactUi();
        const nextScale = stickScale();
        if (compact !== uiCompact || Math.abs(nextScale - lastStickScale) > 0.02) {
            uiCompact = compact;
            lastStickScale = nextScale;
            buildPips();
            resetStick();
        }
    }

    function tooCloseToBalls(x, y, r) {
        for (const ball of state.balls) {
            if (Math.hypot(x - ball.x, y - ball.y) < r + ball.r + BALL_GAP) return true;
        }
        return false;
    }

    function tooCloseToHoles(x, y, r) {
        for (const hole of state.holes) {
            if (Math.hypot(x - hole.x, y - hole.y) < r + hole.r + 80) return true;
        }
        return false;
    }

    function neutronReach(pair) {
        return (pair.orbit || NEUTRON_ORBIT) + (pair.r || NEUTRON_R) + 48;
    }

    function tooCloseToNeutrons(x, y, r) {
        for (const pair of state.neutrons) {
            if (Math.hypot(x - pair.x, y - pair.y) < r + neutronReach(pair)) return true;
        }
        return false;
    }

    function tooCloseToDrops(x, y, r, gap) {
        const pad = gap == null ? state.world * 0.22 : gap;
        for (const drop of state.drops) {
            if (Math.hypot(x - drop.x, y - drop.y) < r + drop.r + pad) return true;
        }
        return false;
    }

    function holeCount() {
        if (state.world >= 20000) return 6;
        if (state.world >= 15000) return 4;
        if (state.world >= 10000) return 3;
        return 2;
    }

    function spawnHoles() {
        state.holes = [];
        const count = holeCount();
        const sizes = [160, 220, 300, 380];
        const pad = 520;
        for (let i = 0; i < count; i += 1) {
            const r = pick(sizes);
            const minShip = r + 720;
            let x = 0;
            let y = 0;
            let attempts = 0;
            do {
                x = rand(pad, state.world - pad);
                y = rand(pad, state.world - pad);
                attempts += 1;
            } while (
                (Math.hypot(x - state.shipX, y - state.shipY) < minShip || tooCloseToHoles(x, y, r * 1.6)) &&
                attempts < 240
            );
            state.holes.push({
                x,
                y,
                r,
                angle: rand(-0.4, 0.4),
                spin: rand(0, Math.PI * 2),
                near: 0.22 + 0.78 * (Math.random() ** 0.85),
            });
        }
        // Draw order depends only on `near`, which is fixed here, so sort once
        // rather than copying and re-sorting the list on every frame.
        state.holes.sort((a, b) => holeNear(a) - holeNear(b));
    }

    function neutronCount() {
        if (state.world >= 20000) return 5;
        if (state.world >= 15000) return 4;
        if (state.world >= 10000) return 3;
        return 2;
    }

    function spawnNeutrons() {
        state.neutrons = [];
        const pad = 520;
        const count = neutronCount();
        for (let i = 0; i < count; i += 1) {
            const orbit = rand(NEUTRON_ORBIT, NEUTRON_ORBIT_MAX);
            const reach = orbit + NEUTRON_R;
            const minShip = reach + 720;
            let x = 0;
            let y = 0;
            let attempts = 0;
            do {
                x = rand(pad, state.world - pad);
                y = rand(pad, state.world - pad);
                attempts += 1;
            } while (
                (
                    Math.hypot(x - state.shipX, y - state.shipY) < minShip
                    || tooCloseToHoles(x, y, reach * 1.4)
                    || tooCloseToNeutrons(x, y, reach * 1.6)
                ) && attempts < 240
            );
            state.neutrons.push({
                x,
                y,
                r: NEUTRON_R,
                orbit,
                speed: NEUTRON_SPEED,
                spin: rand(0, Math.PI * 2),
                tilt: rand(0.32, 0.48),
                alive: [true, true],
            });
        }
    }

    const NEBULA_TINTS = [
        { r: 148, g: 72, b: 210 },
        { r: 46, g: 118, b: 196 },
        { r: 210, g: 78, b: 148 },
        { r: 48, g: 168, b: 176 },
        { r: 90, g: 60, b: 180 },
    ];

    function nebulaCount() {
        if (state.world >= 20000) return 8;
        if (state.world >= 15000) return 6;
        if (state.world >= 10000) return 5;
        return 3;
    }

    function spawnNebulae() {
        state.nebulae = [];
        if (!state.nebula) return;
        const count = nebulaCount();
        const sizes = [900, 1200, 1600, 2100];
        const pad = 480;
        for (let i = 0; i < count; i += 1) {
            const r = pick(sizes);
            let x = 0;
            let y = 0;
            let attempts = 0;
            do {
                x = rand(pad, state.world - pad);
                y = rand(pad, state.world - pad);
                attempts += 1;
            } while (attempts < 80 && state.nebulae.some((cloud) => Math.hypot(x - cloud.x, y - cloud.y) < r + cloud.r * 0.45));
            const tint = pick(NEBULA_TINTS);
            state.nebulae.push({
                x,
                y,
                r,
                angle: rand(0, Math.PI * 2),
                stretch: rand(1.2, 1.85),
                tint,
                lobes: [
                    { dx: 0, dy: 0, scale: 1, alpha: 0.11 },
                    { dx: rand(-0.38, 0.38), dy: rand(-0.28, 0.28), scale: rand(0.48, 0.78), alpha: 0.07 },
                    { dx: rand(-0.42, 0.42), dy: rand(-0.32, 0.32), scale: rand(0.32, 0.58), alpha: 0.055 },
                ],
            });
        }
    }

    const GALAXY_TINTS = [
        { r: 210, g: 176, b: 255 },
        { r: 110, g: 168, b: 255 },
        { r: 255, g: 168, b: 132 },
        { r: 150, g: 220, b: 255 },
        { r: 255, g: 206, b: 140 },
        { r: 200, g: 130, b: 220 },
    ];

    const GALAXY_CELL = 3800;
    const GALAXY_PAIR_GAP = 500;
    const GALAXY_PAIR_CHANCE = 0.2;
    const GALAXY_R_MIN = 220;
    const GALAXY_R_MAX = Math.round(2400 * 0.8);

    function varyGalaxyTint(base) {
        return {
            r: Math.max(70, Math.min(255, Math.round(base.r + rand(-32, 32)))),
            g: Math.max(70, Math.min(255, Math.round(base.g + rand(-32, 32)))),
            b: Math.max(70, Math.min(255, Math.round(base.b + rand(-32, 32)))),
        };
    }

    function galaxyMute(r) {
        const t = (r - GALAXY_R_MIN) / (GALAXY_R_MAX - GALAXY_R_MIN);
        const small = 1 - Math.max(0, Math.min(1, t));
        return 0.3 + 0.36 * small;
    }

    function muteRgb(rgb, mute) {
        const gray = (rgb.r + rgb.g + rgb.b) / 3;
        const fog = gray * 0.32 + 68;
        return {
            r: Math.round(rgb.r * (1 - mute) + fog * mute),
            g: Math.round(rgb.g * (1 - mute) + fog * mute),
            b: Math.round(rgb.b * (1 - mute) + fog * mute),
        };
    }

    function galaxyTooClose(x, y, gap) {
        return state.galaxies.some((galaxy) => Math.hypot(x - galaxy.x, y - galaxy.y) < gap);
    }

    function placeGalaxyInCell(left, top, width, height, minGap) {
        const inset = 90;
        const xMin = left + inset;
        const xMax = left + width - inset;
        const yMin = top + inset;
        const yMax = top + height - inset;
        if (xMax <= xMin || yMax <= yMin) return null;
        let x = 0;
        let y = 0;
        let attempts = 0;
        do {
            x = rand(xMin, xMax);
            y = rand(yMin, yMax);
            attempts += 1;
        } while (attempts < 80 && galaxyTooClose(x, y, minGap));
        if (attempts >= 80 && galaxyTooClose(x, y, minGap)) return null;
        const r = rand(GALAXY_R_MIN, GALAXY_R_MAX);
        const kind = Math.random() < 0.5 ? "classic" : (Math.random() < 0.5 ? "andromeda" : "milky");
        const mute = galaxyMute(r);
        state.galaxies.push({
            x,
            y,
            r,
            kind,
            mute,
            tilt: rand(0, Math.PI * 2),
            flat: kind === "classic" ? rand(0.22, 0.86) : rand(0.16, 0.46),
            spin: rand(0.032, 0.085) * (Math.random() < 0.5 ? -1 : 1),
            phase: rand(0, Math.PI * 2),
            arms: kind === "classic" ? 2 + Math.floor(Math.random() * 2) : 2,
            wind: kind === "classic" ? rand(3.1, 5.4) : rand(4.4, 6.2),
            tint: muteRgb(varyGalaxyTint(pick(GALAXY_TINTS)), mute),
            sprite: null,
        });
        return { x, y };
    }

    function spawnGalaxies() {
        state.galaxies = [];
        if (state.sky !== "galaxies") return;
        for (let top = 0; top < state.world; top += GALAXY_CELL) {
            for (let left = 0; left < state.world; left += GALAXY_CELL) {
                const width = Math.min(GALAXY_CELL, state.world - left);
                const height = Math.min(GALAXY_CELL, state.world - top);
                if (width < 280 || height < 280) continue;
                placeGalaxyInCell(left, top, width, height, 0);
                if (Math.random() < GALAXY_PAIR_CHANCE) {
                    placeGalaxyInCell(left, top, width, height, GALAXY_PAIR_GAP);
                }
            }
        }
    }

    const COMET_CHECK = 15000;
    const COMET_AFTER = 30000;
    const COMET_CHANCE = 0.1;
    const COMET_LIMIT = 3;
    const COMET_SPEED_MIN = 99;
    const COMET_SPEED_MAX = 288;
    const COMET_POINTS = 60000;
    const COMET_TINTS = [
        { r: 220, g: 236, b: 255 },
        { r: 170, g: 214, b: 255 },
        { r: 255, g: 224, b: 176 },
        { r: 196, g: 255, b: 236 },
    ];
    const METEOR_MIN = 5000;
    const METEOR_MAX = 10000;
    const METEOR_TINTS = [
        { r: 168, g: 128, b: 92 },
        { r: 118, g: 108, b: 98 },
        { r: 186, g: 108, b: 64 },
        { r: 96, g: 88, b: 80 },
    ];
    let nextCometAt = 0;
    let nextMeteorAt = 0;

    function flyerWait(min, max) {
        return rand(min, max);
    }

    function difficultyRank() {
        const named = state.difficulty === "custom" ? matchingDifficulty() : state.difficulty;
        const index = DIFF_ORDER.indexOf(named);
        if (index >= 0) return index;
        if (state.world >= 20000 && state.ballCount >= 150) return 4;
        if (state.world >= 20000) return 3;
        if (state.world >= 15000) return 2;
        if (state.world >= 10000) return 1;
        return 0;
    }

    function difficultyT() {
        return difficultyRank() / (DIFF_ORDER.length - 1);
    }

    function cometSpeedMul() {
        return 1 + 0.5 * difficultyT();
    }

    function meteorSpeedMul() {
        return 1 + 0.5 * difficultyT();
    }

    function meteorWait() {
        const scale = 1 / (1 + 2 * difficultyT());
        return flyerWait(METEOR_MIN * scale, METEOR_MAX * scale);
    }

    function spawnFromEdge(margin) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) {
            return { x: -margin, y: rand(0, state.world), angle: rand(-0.65, 0.65) };
        }
        if (side === 1) {
            return { x: state.world + margin, y: rand(0, state.world), angle: Math.PI + rand(-0.65, 0.65) };
        }
        if (side === 2) {
            return { x: rand(0, state.world), y: -margin, angle: Math.PI / 2 + rand(-0.65, 0.65) };
        }
        return { x: rand(0, state.world), y: state.world + margin, angle: -Math.PI / 2 + rand(-0.65, 0.65) };
    }

    function makeComet() {
        const { x, y, angle } = spawnFromEdge(90);
        const near = 0.28 + 0.72 * Math.random();
        const speed = rand(COMET_SPEED_MIN, COMET_SPEED_MAX) * (0.7 + 0.5 * near) * cometSpeedMul();
        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle,
            r: 9 + 18 * near,
            tail: 120 + 260 * near,
            near,
            tint: pick(COMET_TINTS),
        };
    }

    function makeMeteor() {
        const { x, y, angle } = spawnFromEdge(90);
        const near = 0.28 + 0.72 * Math.random();
        const size = rand(0.55, 2.35);
        const r = 76 * size;
        const speed = rand(COMET_SPEED_MIN * 0.2, COMET_SPEED_MAX * 1.4) * meteorSpeedMul();
        const lumps = [];
        const count = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i += 1) lumps.push(0.86 + Math.random() * 0.28);
        return {
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            angle,
            spin: rand(0, Math.PI * 2),
            spinRate: rand(-2.4, 2.4),
            r,
            tail: r * 6.5,
            near,
            lumps,
            tint: pick(METEOR_TINTS),
        };
    }

    function spawnComets() {
        state.comets = [];
        nextCometAt = performance.now() + COMET_CHECK;
    }

    function spawnMeteors() {
        state.meteors = [];
        if (!state.meteorOn) return;
        nextMeteorAt = performance.now() + meteorWait();
        state.meteors.push(makeMeteor());
    }

    function moveFlyers(list, dt) {
        for (let i = list.length - 1; i >= 0; i -= 1) {
            const flyer = list[i];
            flyer.x += flyer.vx * dt;
            flyer.y += flyer.vy * dt;
            if (flyer.spinRate) flyer.spin += flyer.spinRate * dt;
            const pad = flyer.tail + 280;
            if (flyer.x < -pad || flyer.y < -pad || flyer.x > state.world + pad || flyer.y > state.world + pad) {
                list.splice(i, 1);
            }
        }
    }

    function updateComets(dt, now, paused) {
        if (paused) return;
        moveFlyers(state.comets, dt);
        if (state.cometSpawns >= COMET_LIMIT || now < nextCometAt) return;
        if (Math.random() < COMET_CHANCE) {
            state.comets.push(makeComet());
            state.cometSpawns += 1;
            nextCometAt = now + COMET_AFTER;
        } else {
            nextCometAt = now + COMET_CHECK;
        }
    }

    function updateMeteors(dt, now, paused) {
        if (paused || !state.meteorOn) return;
        moveFlyers(state.meteors, dt);
        if (now >= nextMeteorAt) {
            nextMeteorAt = now + meteorWait();
            state.meteors.push(makeMeteor());
        }
    }

    function spawnDecor() {
        spawnHoles();
        spawnNeutrons();
        spawnNebulae();
        spawnGalaxies();
        spawnComets();
        spawnMeteors();
    }

    function placeBall(spiked) {
        const type = spiked ? pick(SPIKE_TYPES) : pick(BALL_TYPES);
        const size = type.size;
        const r = size / 2;
        const minDist = SHIP_RADIUS + r + SPAWN_CLEARANCE;
        let x = 0;
        let y = 0;
        let attempts = 0;
        do {
            x = rand(MAX_BALL, state.world - MAX_BALL);
            y = rand(MAX_BALL, state.world - MAX_BALL);
            attempts += 1;
        } while (
            (Math.hypot(x - state.shipX, y - state.shipY) < minDist || tooCloseToBalls(x, y, r) || tooCloseToHoles(x, y, r) || tooCloseToNeutrons(x, y, r)) &&
            attempts < 200
        );

        state.balls.push({
            x,
            y,
            r,
            points: type.points,
            ...planetLook(),
            pulseMs: rand(1000, 5000),
            pulseOffset: rand(0, Math.PI * 2),
            hasRings: !spiked && Math.random() < 0.28,
            ringTilt: rand(-0.75, 0.75),
            hasSpikes: spiked,
            spikeCount: 10 + Math.floor(Math.random() * 5),
            spikeSpin: rand(0, Math.PI * 2),
        });
    }

    function spawnBalls(count) {
        for (let i = 0; i < count; i += 1) placeBall(false);
        if (state.spikes) {
            const spikes = Math.round(count * SPIKE_RATE);
            for (let i = 0; i < spikes; i += 1) placeBall(true);
        }
        spawnDrops();
    }

    function placeShieldDrop() {
        const r = SHIELD_DROP_R;
        const minShip = SHIP_RADIUS + r + SPAWN_CLEARANCE + 80;
        const far = state.world * 0.22;
        const near = state.world * 0.12;
        let x = 0;
        let y = 0;
        let attempts = 0;
        do {
            x = rand(r + 80, state.world - r - 80);
            y = rand(r + 80, state.world - r - 80);
            attempts += 1;
        } while (
            (
                Math.hypot(x - state.shipX, y - state.shipY) < minShip
                || tooCloseToBalls(x, y, r)
                || tooCloseToHoles(x, y, r)
                || tooCloseToNeutrons(x, y, r)
                || tooCloseToDrops(x, y, r, attempts < 160 ? far : near)
            ) && attempts < 280
        );
        state.drops.push({ type: "shield", x, y, r });
    }

    function spawnDrops() {
        state.drops = [];
        const count = Math.max(1, Math.round(state.ballCount * DROP_RATE));
        for (let i = 0; i < count; i += 1) placeShieldDrop();
    }

    function normalizeDrop(drop) {
        if (!drop || drop.type !== "shield") return null;
        const x = Number(drop.x);
        const y = Number(drop.y);
        const r = Number(drop.r) || SHIELD_DROP_R;
        if (!Number.isFinite(x) || !Number.isFinite(y) || r <= 0) return null;
        return { type: "shield", x, y, r };
    }

    function normalizeNeutron(pair) {
        const x = Number(pair && pair.x);
        const y = Number(pair && pair.y);
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const alive = Array.isArray(pair.alive)
            ? [pair.alive[0] !== false, pair.alive[1] !== false]
            : [true, true];
        if (!alive[0] && !alive[1]) return null;
        const tilt = Number(pair.tilt);
        const orbit = Number(pair.orbit);
        return {
            x,
            y,
            r: NEUTRON_R,
            orbit: Number.isFinite(orbit)
                ? Math.max(NEUTRON_ORBIT, Math.min(NEUTRON_ORBIT_MAX, orbit))
                : NEUTRON_ORBIT,
            speed: NEUTRON_SPEED,
            spin: Number.isFinite(Number(pair.spin)) ? Number(pair.spin) : 0,
            tilt: Number.isFinite(tilt) ? Math.max(0.2, Math.min(0.7, tilt)) : 0.4,
            alive,
        };
    }

    function formatBoardDate(at) {
        const date = new Date(Number(at) || 0);
        if (!Number.isFinite(date.getTime()) || date.getTime() <= 0) return "—";
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
    }

    function formatPlayTime(ms) {
        const total = Math.floor(ms / 1000);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;
        const sec = String(seconds).padStart(2, "0");
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, "0")}:${sec}`;
        }
        return `${minutes}:${sec}`;
    }

    function playTime(now) {
        if (timer.runningSince == null) return timer.elapsed;
        return timer.elapsed + (now - timer.runningSince);
    }

    function pauseTimer(now) {
        if (timer.runningSince == null) return;
        timer.elapsed += now - timer.runningSince;
        timer.runningSince = null;
    }

    function resumeTimer(now) {
        if (timer.runningSince != null) return;
        timer.runningSince = now;
    }

    function remainingTime(now) {
        return Math.max(0, state.trialMs - playTime(now));
    }

    function timerDisplayMs(now) {
        if (!state.trial) return playTime(now);
        return Math.ceil(remainingTime(now) / 1000) * 1000;
    }

    function trialLabel() {
        if (state.trialMs === 60000) return "1 min";
        if (state.trialMs === 600000) return "10 min";
        return "5 min";
    }

    function resetTimer(now, running) {
        timer.elapsed = 0;
        timer.runningSince = running ? now : null;
        shownSecond = -1;
        timerEl.textContent = formatPlayTime(state.trial ? state.trialMs : 0);
    }

    function updateTimer(now) {
        if (state.trial && !state.won && remainingTime(now) <= 0) {
            finishTrial();
            return;
        }
        const ms = timerDisplayMs(now);
        const sec = Math.floor(ms / 1000);
        if (sec === shownSecond) return;
        shownSecond = sec;
        timerEl.textContent = formatPlayTime(ms);
    }

    function clampGoal(value) {
        return snapStep(value, GOAL_MIN, Math.max(GOAL_MIN, state.ballCount), GOAL_STEP);
    }

    function matchingDifficulty() {
        for (const [id, preset] of Object.entries(DIFFICULTIES)) {
            if (preset.world === state.world && preset.ballCount === state.ballCount && preset.goal === state.goal) {
                return id;
            }
        }
        return "";
    }

    function applyDifficulty(id) {
        if (id === "custom") {
            state.difficulty = "custom";
            saveSettings();
            updateHud();
            if (!PLAYGROUND) {
                showSettingsPanel("game");
                if (!state.menuOpen) openMenu();
            }
            return;
        }
        const preset = DIFFICULTIES[id];
        if (!preset) return;
        const restart = preset.world !== state.world || preset.ballCount !== state.ballCount;
        state.difficulty = id;
        state.world = preset.world;
        state.ballCount = preset.ballCount;
        state.goal = preset.goal;
        saveSettings();
        if (restart) restartGame();
        else updateHud();
    }

    function syncGoalSlider() {
        goalSlider.min = String(GOAL_MIN);
        goalSlider.max = String(state.ballCount);
        goalSlider.step = String(GOAL_STEP);
        goalSlider.value = String(state.goal);
        goalSliderValue.textContent = String(state.goal);
    }

    let lastCoordX = NaN;
    let lastCoordY = NaN;

    // Writing textContent dirties layout, so only touch the node when the
    // rounded position actually changes.
    function setCoords() {
        const cx = Math.round(state.shipX);
        const cy = Math.round(state.shipY);
        if (cx === lastCoordX && cy === lastCoordY) return;
        lastCoordX = cx;
        lastCoordY = cy;
        coordsEl.textContent = `${cx}, ${cy}`;
    }

    // The live counters are the only part of the HUD that moves while flying.
    // updateHud() below also sweeps the whole settings UI with a dozen
    // querySelectorAll calls, which is wasted work on a ball pickup.
    function updateScoreHud() {
        if (lifetimeEl) lifetimeEl.textContent = state.lifetime.toLocaleString();
        foundEl.textContent = String(state.found);
        if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
        goalEl.textContent = String(state.goal);
    }

    function updateHud() {
        updateScoreHud();
        if (nameInput && document.activeElement !== nameInput) nameInput.value = state.name;
        ballsSlider.value = String(state.ballCount);
        ballsSliderValue.textContent = String(state.ballCount);
        syncGoalSlider();
        setCoords();
        for (const button of document.querySelectorAll(".world-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.world) === state.world);
        }
        for (const button of document.querySelectorAll(".diff-btn")) {
            button.classList.toggle("is-on", button.dataset.diff === state.difficulty);
        }
        for (const button of document.querySelectorAll(".palette-btn")) {
            button.classList.toggle("is-on", button.dataset.palette === state.palette);
        }
        for (const button of document.querySelectorAll(".pulse-btn")) {
            button.classList.toggle("is-on", (button.dataset.pulse === "on") === state.pulse);
        }
        for (const button of document.querySelectorAll(".nebula-btn")) {
            button.classList.toggle("is-on", (button.dataset.nebula === "on") === state.nebula);
        }
        for (const button of document.querySelectorAll(".star-btn")) {
            button.classList.toggle("is-on", (button.dataset.stars === "on") === state.starDrift);
        }
        for (const button of document.querySelectorAll(".sky-btn")) {
            button.classList.toggle("is-on", button.dataset.sky === state.sky);
        }
        for (const button of document.querySelectorAll(".req-btn")) {
            button.classList.toggle("is-on", (button.dataset.req === "on") === state.reqShips);
        }
        for (const button of document.querySelectorAll(".ship-btn")) {
            const id = button.dataset.ship;
            const locked = !shipUnlocked(id);
            button.classList.toggle("is-on", id === state.ship);
            button.classList.toggle("is-locked", locked);
            button.setAttribute("aria-disabled", locked ? "true" : "false");
            const need = button.querySelector(".ship-lock");
            if (need) need.textContent = shipUnlockAt(id).toLocaleString();
        }
        const fullscreenOn = isFullscreen();
        for (const button of document.querySelectorAll(".fullscreen-btn")) {
            button.classList.toggle("is-on", (button.dataset.fullscreen === "on") === fullscreenOn);
        }
        for (const button of document.querySelectorAll(".audio-btn")) {
            button.classList.toggle("is-on", (button.dataset.audio === "on") === state.audio);
        }
        for (const button of document.querySelectorAll(".spike-btn")) {
            button.classList.toggle("is-on", (button.dataset.spikes === "on") === state.spikes);
        }
        for (const button of document.querySelectorAll(".meteor-btn")) {
            button.classList.toggle("is-on", (button.dataset.meteor === "on") === state.meteorOn);
        }
        for (const button of document.querySelectorAll(".fuel-btn")) {
            button.classList.toggle("is-on", (button.dataset.fuel === "on") === state.infiniteFuel);
        }
        if (volumeSlider) volumeSlider.value = String(state.volume);
        if (volumeSliderValue) volumeSliderValue.textContent = String(state.volume);
        if (zoomSlider) zoomSlider.value = String(state.zoom);
        if (zoomSliderValue) zoomSliderValue.textContent = `${state.zoom}×`;
        const trialToggle = document.getElementById("trial-toggle");
        if (trialToggle) {
            trialToggle.classList.toggle("is-on", state.trial);
            trialToggle.setAttribute("aria-pressed", state.trial ? "true" : "false");
        }
        const trialTimes = document.getElementById("trial-times");
        if (trialTimes) trialTimes.classList.toggle("hidden", !state.trial);
        for (const button of document.querySelectorAll(".trial-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.trial) === state.trialMs);
        }
        syncPlaygroundRanges();
    }

    function syncPlaygroundRanges() {
        for (const el of document.querySelectorAll("[data-pg-range]")) {
            const key = el.dataset.pgRange;
            if (key === "balls") el.value = String(state.ballCount);
            else if (key === "goal") {
                el.max = String(state.ballCount);
                el.value = String(state.goal);
            } else if (key === "zoom") el.value = String(state.zoom);
            else if (key === "volume") el.value = String(state.volume);
            const label = document.querySelector(`[data-pg-value="${key}"]`);
            if (!label) continue;
            if (key === "zoom") label.textContent = `${state.zoom}×`;
            else if (key === "volume") label.textContent = String(state.volume);
            else if (key === "balls") label.textContent = String(state.ballCount);
            else if (key === "goal") label.textContent = String(state.goal);
        }
    }

    function fullscreenElement() {
        return document.fullscreenElement || document.webkitFullscreenElement || null;
    }

    function isFullscreen() {
        return Boolean(fullscreenElement());
    }

    function requestPageFullscreen() {
        const root = document.documentElement;
        if (root.requestFullscreen) return root.requestFullscreen();
        if (root.webkitRequestFullscreen) return root.webkitRequestFullscreen();
        return Promise.reject(new Error("Fullscreen is not available"));
    }

    function exitPageFullscreen() {
        if (document.exitFullscreen) return document.exitFullscreen();
        if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
        return Promise.resolve();
    }

    function setFullscreen(on) {
        const action = on && !isFullscreen()
            ? requestPageFullscreen()
            : !on && isFullscreen()
                ? exitPageFullscreen()
                : Promise.resolve();
        Promise.resolve(action).catch(() => {}).finally(updateHud);
    }

    function showWinOverlay(kind, elapsed) {
        const title = document.getElementById("win-title");
        if (title) title.textContent = kind === "trial" ? "TIME'S UP" : "YOU WON";
        if (winScoreEl) winScoreEl.textContent = state.score.toLocaleString();
        const time = elapsed != null ? elapsed : playTime(performance.now());
        winMessage.textContent = kind === "trial"
            ? `Time trial · ${trialLabel()}`
            : `Goal ${state.goal} · ${formatPlayTime(time)}`;
        winOverlay.classList.remove("hidden");
    }

    function finishTrial() {
        if (state.won || !state.trial) return;
        state.won = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        if (state.menuOpen) closeMenu();
        if (state.boardOpen) closeBoard();
        recordWinScore();
        shownSecond = 0;
        timerEl.textContent = formatPlayTime(0);
        showWinOverlay("trial");
        savePlay();
    }

    function maybeWin() {
        if (state.trial || state.won || state.found < state.goal) return;
        state.won = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        if (state.menuOpen) closeMenu();
        if (state.boardOpen) closeBoard();
        recordWinScore();
        showWinOverlay("hunt");
        savePlay();
    }

    function flashSpikeBorder() {
        const flash = document.getElementById("spike-flash");
        if (!flash) return;
        flash.classList.remove("is-on");
        void flash.offsetWidth;
        flash.classList.add("is-on");
    }

    function shipHitRadius() {
        return state.shield ? SHIELD_SHIP_R : SHIP_RADIUS;
    }

    function burstShield() {
        state.shield = false;
        state.shieldRings.push({ life: 1 });
        playCollide();
        savePlay();
        return true;
    }

    function returnTakenPlanets() {
        for (const planet of state.taken) {
            const next = normalizeBall(planet);
            if (next) state.balls.push(next);
        }
        state.taken = [];
    }

    function applyHazardHit() {
        state.found = 0;
        state.score = 0;
        flashSpikeBorder();
        playCollide();
        const now = performance.now();
        if (state.trial) {
            timer.elapsed += SPIKE_TRIAL_MS;
            shownSecond = -1;
            if (!state.won && remainingTime(now) <= 0) {
                finishTrial();
                return;
            }
        } else {
            resetTimer(now, !state.menuOpen && !state.won && !state.resumeOpen);
        }
        updateHud();
        savePlay();
    }

    function hitSpikes(index) {
        const ball = state.balls[index];
        if (ball) {
            state.pops.push({
                x: ball.x,
                y: ball.y,
                r: ball.r,
                color: ball.color,
                life: 1,
            });
            state.balls.splice(index, 1);
        }
        if (state.shield) {
            burstShield();
            return;
        }
        returnTakenPlanets();
        applyHazardHit();
    }

    function hitMeteor(index) {
        const meteor = state.meteors[index];
        if (meteor) {
            state.pops.push({
                x: meteor.x,
                y: meteor.y,
                r: meteorBody(meteor),
                color: meteorColor(meteor),
                life: 1,
            });
            state.meteors.splice(index, 1);
        }
        if (state.shield) {
            burstShield();
            return;
        }
        applyHazardHit();
    }

    function cometBody(comet) {
        return comet.r * 1.35;
    }

    function cometColor(comet) {
        const { r, g, b } = comet.tint;
        return `rgb(${r}, ${g}, ${b})`;
    }

    function collectComets() {
        for (let i = state.comets.length - 1; i >= 0; i -= 1) {
            const comet = state.comets[i];
            if (Math.hypot(comet.x - state.shipX, comet.y - state.shipY) > cometBody(comet) + SHIP_RADIUS) continue;
            state.comets.splice(i, 1);
            state.score += COMET_POINTS;
            if (!PLAYGROUND) {
                state.lifetime += COMET_POINTS;
                saveSettings();
            }
            state.pops.push({
                x: comet.x,
                y: comet.y,
                r: cometBody(comet),
                color: cometColor(comet),
                life: 1,
            });
            state.floaters.push({
                x: comet.x,
                y: comet.y,
                points: COMET_POINTS,
                life: 1,
            });
            playHit();
            updateScoreHud();
            savePlay();
        }
    }

    function meteorBody(meteor) {
        return meteor.r * 1.15;
    }

    function meteorColor(meteor) {
        const { r, g, b } = meteor.tint;
        return `rgb(${r}, ${g}, ${b})`;
    }

    function collectMeteors() {
        if (!state.meteorOn) return;
        for (let i = state.meteors.length - 1; i >= 0; i -= 1) {
            const meteor = state.meteors[i];
            if (Math.hypot(meteor.x - state.shipX, meteor.y - state.shipY) > meteorBody(meteor) + shipHitRadius()) continue;
            hitMeteor(i);
            return;
        }
    }

    function collectDrops() {
        for (let i = state.drops.length - 1; i >= 0; i -= 1) {
            const drop = state.drops[i];
            if (Math.hypot(drop.x - state.shipX, drop.y - state.shipY) > drop.r + SHIP_RADIUS) continue;
            state.drops.splice(i, 1);
            if (drop.type === "shield" && !state.shield) {
                state.shield = true;
                playHit();
            }
            savePlay();
        }
    }

    function planetSnapshot(ball) {
        return {
            x: ball.x,
            y: ball.y,
            r: ball.r,
            points: ball.points,
            color: ball.color,
            paints: sanitizePaints(ball.paints),
            litX: ball.litX,
            litY: ball.litY,
            pulseMs: ball.pulseMs,
            pulseOffset: ball.pulseOffset,
            hasRings: ball.hasRings,
            ringTilt: ball.ringTilt,
            hasSpikes: false,
            spikeCount: ball.spikeCount,
            spikeSpin: ball.spikeSpin,
        };
    }

    function collectPlanet(ball, extras) {
        state.taken.push(planetSnapshot(ball));
        state.found += 1;
        const points = ball.points || ballTypeFor(ball).points;
        state.score += points;
        if (!PLAYGROUND) state.lifetime += points;
        if (!extras || extras.pop !== false) {
            state.pops.push({
                x: ball.x,
                y: ball.y,
                r: ball.r,
                color: ball.color,
                life: 1,
            });
        }
        if (!extras || extras.floater !== false) {
            state.floaters.push({
                x: ball.x,
                y: ball.y,
                points,
                life: 1,
            });
        }
        return points;
    }

    function neutronAlive(pair, index) {
        return !pair.alive || pair.alive[index] !== false;
    }

    function hitNeutronPair(pair, now) {
        const stars = [];
        for (let i = 0; i < 2; i += 1) {
            if (neutronAlive(pair, i)) stars.push(neutronStarAt(pair, now, i));
        }
        for (const star of stars) {
            state.pops.push({
                x: star.x,
                y: star.y,
                r: 72,
                grow: NEUTRON_SWEEP,
                width: 16,
                color: "#ffffff",
                burst: true,
                life: 1,
            });
        }
        const sweep = NEUTRON_SWEEP * NEUTRON_SWEEP;
        for (let i = state.balls.length - 1; i >= 0; i -= 1) {
            const ball = state.balls[i];
            if (ball.hasSpikes) continue;
            let inBlast = false;
            for (const star of stars) {
                const dx = ball.x - star.x;
                const dy = ball.y - star.y;
                if (dx * dx + dy * dy <= sweep) {
                    inBlast = true;
                    break;
                }
            }
            if (!inBlast) continue;
            collectPlanet(ball);
            state.balls.splice(i, 1);
        }
        const at = state.neutrons.indexOf(pair);
        if (at >= 0) state.neutrons.splice(at, 1);
        playHit();
        saveSettings();
        updateScoreHud();
        savePlay();
        maybeWin();
    }

    function collectNeutrons(now) {
        const hitR = SHIP_RADIUS + NEUTRON_R * 1.7;
        const hitR2 = hitR * hitR;
        for (const pair of state.neutrons) {
            for (let i = 0; i < 2; i += 1) {
                if (!neutronAlive(pair, i)) continue;
                const star = neutronStarAt(pair, now, i);
                const dx = star.x - state.shipX;
                const dy = star.y - state.shipY;
                if (dx * dx + dy * dy <= hitR2) {
                    hitNeutronPair(pair, now);
                    return;
                }
            }
        }
    }

    function collectIfHit(now) {
        collectDrops();
        collectNeutrons(now);
        // Runs against every ball in the world each frame, so compare squared
        // distances and hoist the ship radius out of the loop.
        const spikeReach = shipHitRadius();
        for (let i = state.balls.length - 1; i >= 0; i -= 1) {
            const ball = state.balls[i];
            const body = ball.hasSpikes ? ball.r * SPIKE_REACH : ball.r;
            const reach = body + (ball.hasSpikes ? spikeReach : SHIP_RADIUS);
            const dx = ball.x - state.shipX;
            const dy = ball.y - state.shipY;
            if (dx * dx + dy * dy <= reach * reach) {
                if (ball.hasSpikes) {
                    hitSpikes(i);
                    collectComets();
                    return;
                }
                collectPlanet(ball);
                state.balls.splice(i, 1);
                saveSettings();
                playHit();
                updateScoreHud();
                savePlay();
                maybeWin();
            }
        }
        collectComets();
        collectMeteors();
    }

    function moveShip(dt) {
        if (state.menuOpen || state.won || state.resumeOpen || state.boardOpen) return false;
        let vx = 0;
        let vy = 0;
        if (keys.has("arrowleft") || keys.has("a")) vx -= 1;
        if (keys.has("arrowright") || keys.has("d")) vx += 1;
        if (keys.has("arrowup") || keys.has("w")) vy -= 1;
        if (keys.has("arrowdown") || keys.has("s")) vy += 1;
        if (stick.vx !== 0 || stick.vy !== 0) {
            vx = stick.vx;
            vy = stick.vy;
        }

        const steering = vx !== 0 || vy !== 0;
        let target = 0;
        if (steering) {
            const length = Math.hypot(vx, vy);
            vx /= length;
            vy /= length;
            state.heading = Math.atan2(vy, vx);
            const usingStick = stick.vx !== 0 || stick.vy !== 0;
            target = SHIP_SPEED * (usingStick ? stick.speed : 1) * (state.boost ? 2 : 1);
        }

        if (target > state.speed) {
            state.speed = Math.min(target, state.speed + SHIP_ACCEL * dt);
        } else {
            state.speed = Math.max(target, state.speed - SHIP_DECEL * dt);
        }

        if (state.speed > 0) {
            state.shipX += Math.cos(state.heading) * state.speed * dt;
            state.shipY += Math.sin(state.heading) * state.speed * dt;
        }

        const min = SHIP_RADIUS + 8;
        const max = state.world - SHIP_RADIUS - 8;
        state.shipX = Math.min(max, Math.max(min, state.shipX));
        state.shipY = Math.min(max, Math.max(min, state.shipY));
        return state.speed > 12;
    }

    const engine = {
        ctx: null,
        buffer: null,
        source: null,
        gain: null,
        loading: null,
        wanted: false,
        hit: null,
        collide: null,
        atmo: null,
        atmoSource: null,
        atmoGain: null,
    };

    function masterGain() {
        if (!state.audio) return 0;
        return Math.min(1, Math.max(0, state.volume / 100));
    }

    function engineLevel() {
        return ENGINE_GAIN * masterGain();
    }

    function atmoLevel() {
        return ATMO_GAIN * masterGain();
    }

    function applyAudioLevels() {
        if (!engine.ctx) return;
        const now = engine.ctx.currentTime;
        if (engine.gain) {
            const target = engine.wanted ? engineLevel() : 0;
            engine.gain.gain.cancelScheduledValues(now);
            engine.gain.gain.setValueAtTime(engine.gain.gain.value, now);
            engine.gain.gain.linearRampToValueAtTime(target, now + 0.06);
        }
        if (engine.atmoGain) {
            engine.atmoGain.gain.cancelScheduledValues(now);
            engine.atmoGain.gain.setValueAtTime(engine.atmoGain.gain.value, now);
            engine.atmoGain.gain.linearRampToValueAtTime(atmoLevel(), now + 0.06);
        }
    }

    function engineContext() {
        if (!engine.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            engine.ctx = new AudioCtx();
        }
        return engine.ctx;
    }

    function pageIsVisible() {
        return document.visibilityState === "visible";
    }

    function pauseAudio() {
        if (!engine.ctx || engine.ctx.state !== "running") return;
        engine.ctx.suspend().catch(() => {});
    }

    function resumeAudio() {
        if (!pageIsVisible() || !engine.ctx) return;
        const start = () => {
            if (!pageIsVisible()) return;
            startAtmosphere();
            if (engine.wanted && engine.buffer && !engine.source) startEngine(true);
        };
        if (engine.ctx.state === "suspended") {
            engine.ctx.resume().then(start).catch(() => {});
            return;
        }
        start();
    }

    function unlockEngine() {
        if (!pageIsVisible()) return;
        const ctx = engineContext();
        if (ctx.state === "suspended") ctx.resume();
        if (!engine.loading) engine.loading = loadEngine();
        startAtmosphere();
    }

    async function loadEngine() {
        try {
            const ctx = engineContext();
            const [engineBytes, hitBytes, collideBytes] = await Promise.all([
                fetch(ENGINE_SRC).then((res) => res.arrayBuffer()),
                fetch(HIT_SRC).then((res) => res.arrayBuffer()),
                fetch(COLLIDE_SRC).then((res) => res.arrayBuffer()).catch(() => null),
            ]);
            engine.buffer = await ctx.decodeAudioData(engineBytes.slice(0));
            engine.hit = await ctx.decodeAudioData(hitBytes.slice(0));
            if (collideBytes) engine.collide = await ctx.decodeAudioData(collideBytes.slice(0));
            if (engine.wanted && pageIsVisible()) startEngine(true);
            loadAtmosphere();
        } catch {
            engine.loading = null;
        }
    }

    async function loadAtmosphere() {
        try {
            const ctx = engineContext();
            const bytes = await fetch(ATMO_SRC).then((res) => res.arrayBuffer());
            engine.atmo = await ctx.decodeAudioData(bytes.slice(0));
            startAtmosphere();
        } catch {
            // Atmosphere is optional; engine and hits still play.
        }
    }

    function startAtmosphere() {
        if (!pageIsVisible() || !engine.atmo || engine.atmoSource) return;
        const ctx = engineContext();
        if (ctx.state === "suspended") return;
        const source = ctx.createBufferSource();
        source.buffer = engine.atmo;
        source.loop = true;
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(atmoLevel(), now + ATMO_FADE);
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0);
        engine.atmoSource = source;
        engine.atmoGain = gain;
    }

    function playCue(buffer, rate) {
        if (!pageIsVisible() || !buffer || masterGain() <= 0) return;
        const ctx = engineContext();
        if (ctx.state === "suspended") ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = rate || 1;
        const gain = ctx.createGain();
        gain.gain.value = masterGain();
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start();
    }

    function playHit() {
        playCue(engine.hit);
    }

    function playCollide() {
        playCue(engine.collide || engine.hit, 1.33);
    }

    function engineRate() {
        return state.boost ? ENGINE_BOOST_RATE : 1;
    }

    function startEngine(fadeIn) {
        if (!pageIsVisible() || !engine.buffer || engine.source) return;
        const ctx = engineContext();
        const source = ctx.createBufferSource();
        source.buffer = engine.buffer;
        source.loop = true;
        source.loopStart = ENGINE_LOOP_START;
        source.loopEnd = Math.min(ENGINE_LOOP_END, engine.buffer.duration);
        source.playbackRate.value = 1;
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        if (fadeIn) {
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(engineLevel(), now + ENGINE_FADE_IN);
        } else {
            gain.gain.setValueAtTime(0, now);
        }
        source.connect(gain);
        gain.connect(ctx.destination);
        source.start(0, ENGINE_LOOP_START);
        engine.source = source;
        engine.gain = gain;
        if (state.boost) fadeEngineRate();
    }

    function fadeEngine(target) {
        if (!engine.gain) return;
        const ctx = engine.ctx;
        const param = engine.gain.gain;
        const now = ctx.currentTime;
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(target, now + (target > 0 ? ENGINE_FADE_IN : ENGINE_FADE));
    }

    function fadeEngineRate() {
        if (!engine.source) return;
        const param = engine.source.playbackRate;
        const now = engine.ctx.currentTime;
        param.cancelScheduledValues(now);
        param.setValueAtTime(param.value, now);
        param.linearRampToValueAtTime(engineRate(), now + ENGINE_FADE);
    }

    function updateEngine(moving) {
        if (moving === engine.wanted && engine.source) return;
        engine.wanted = moving;
        if (!engine.buffer) return;
        if (moving) {
            if (!engine.source) startEngine(true);
            else fadeEngine(engineLevel());
        } else if (engine.source) {
            fadeEngine(0);
        }
    }

    function camera() {
        const z = clampZoom(state.zoom);
        return {
            x: state.shipX - (state.width * z) / 2,
            y: state.shipY - (state.height * z) / 2,
            z,
            w: state.width * z,
            h: state.height * z,
        };
    }

    function beginWorld(cam) {
        ctx.save();
        ctx.translate(state.width / 2, state.height / 2);
        ctx.scale(1 / cam.z, 1 / cam.z);
        ctx.translate(-cam.w / 2, -cam.h / 2);
    }

    function endWorld() {
        ctx.restore();
    }

    function offView(x, y, reach, cam) {
        return x < -reach || y < -reach || x > cam.w + reach || y > cam.h + reach;
    }

    // A cell's stars are fixed the moment it first scrolls into view: only their
    // drift offset moves with time. Caching the cell spares six sin-based hashes,
    // two trig calls and a template-string allocation per star per frame, which at
    // high zoom runs to a couple of thousand stars.
    const STAR_CELL = 160;
    const STAR_CELL_WIDE = 380;
    const STAR_CELL_CACHE_MAX = 12000;
    const starCells = new Map();

    function starFieldCell() {
        return state.sky === "galaxies" ? STAR_CELL_WIDE : STAR_CELL;
    }

    function starCell(gx, gy, cell) {
        const key = cell * 1e13 + (gx + 1e6) * 4e6 + (gy + 1e6);
        const cached = starCells.get(key);
        if (cached) return cached;
        if (starCells.size >= STAR_CELL_CACHE_MAX) starCells.clear();
        const sparse = cell > STAR_CELL;
        const count = sparse ? (hash2(gx, gy) > 0.62 ? 1 : 0) : 1 + Math.floor(hash2(gx, gy) * 3);
        const stars = [];
        for (let i = 0; i < count; i += 1) {
            const depth = hash2(gx * 2.7, gy + i * 5.1);
            const speed = 4 + depth * 16;
            const turn = -0.35 + (hash2(i + gx, gy * 4.2) - 0.5) * 0.65;
            const twinkle = 0.45 + hash2(gx * 3.1, gy + i) * 0.55;
            stars.push({
                bx: hash2(gx + i * 19.1, gy + 7.3) * cell,
                by: hash2(gx + 4.8, gy + i * 13.7) * cell,
                vx: Math.cos(turn) * speed,
                vy: Math.sin(turn) * speed,
                size: 0.6 + hash2(i + gx, gy * 2.2) * 1.8,
                fill: `rgba(255, 255, 255, ${twinkle})`,
            });
        }
        starCells.set(key, stars);
        return stars;
    }

    function drawStars(cam, now) {
        const cell = starFieldCell();
        const left = Math.floor((cam.x - 40) / cell);
        const right = Math.ceil((cam.x + cam.w + 40) / cell);
        const top = Math.floor((cam.y - 40) / cell);
        const bottom = Math.ceil((cam.y + cam.h + 40) / cell);
        const driftOn = state.starDrift !== false;
        const t = driftOn ? now / 1000 : 0;

        for (let gy = top; gy <= bottom; gy += 1) {
            for (let gx = left; gx <= right; gx += 1) {
                const stars = starCell(gx, gy, cell);
                for (let i = 0; i < stars.length; i += 1) {
                    const star = stars[i];
                    let x;
                    let y;
                    if (driftOn) {
                        x = gx * cell + (((star.bx + star.vx * t) % cell) + cell) % cell;
                        y = gy * cell + (((star.by + star.vy * t) % cell) + cell) % cell;
                    } else {
                        x = gx * cell + star.bx;
                        y = gy * cell + star.by;
                    }
                    ctx.fillStyle = star.fill;
                    ctx.beginPath();
                    ctx.arc(x - cam.x, y - cam.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    function drawBorder(cam) {
        const x = -cam.x;
        const y = -cam.y;
        const w = state.world;
        const h = state.world;
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, cam.w, Math.max(0, y));
        ctx.fillRect(0, y + h, cam.w, Math.max(0, cam.h - (y + h)));
        ctx.fillRect(0, y, Math.max(0, x), h);
        ctx.fillRect(x + w, y, Math.max(0, cam.w - (x + w)), h);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 18;
        ctx.strokeRect(x, y, w, h);
        ctx.restore();
    }

    function holeDiskGradient(r, spin, alpha) {
        const shift = Math.sin(spin) * r * 0.18;
        const g = ctx.createLinearGradient(-r * 2.8 + shift, 0, r * 2.8 + shift, 0);
        g.addColorStop(0, `rgba(48, 16, 6, ${0.12 * alpha})`);
        g.addColorStop(0.2, `rgba(255, 78, 12, ${0.5 * alpha})`);
        g.addColorStop(0.4, `rgba(255, 196, 120, ${0.92 * alpha})`);
        g.addColorStop(0.5, `rgba(255, 248, 220, ${alpha})`);
        g.addColorStop(0.58, `rgba(168, 214, 255, ${0.88 * alpha})`);
        g.addColorStop(0.76, `rgba(255, 118, 32, ${0.48 * alpha})`);
        g.addColorStop(1, `rgba(32, 10, 4, ${0.1 * alpha})`);
        return g;
    }

    function holeNear(hole) {
        const near = Number(hole && hole.near);
        return Number.isFinite(near) ? Math.min(1, Math.max(0.18, near)) : 1;
    }

    function drawHole(hole, cam, now) {
        const near = holeNear(hole);
        const x = hole.x - cam.x;
        const y = hole.y - cam.y;
        const r = hole.r * (0.32 + 0.68 * near);
        const reach = r * 3.4;
        if (offView(x, y, reach, cam)) return;

        const spin = now * 0.0001 + hole.spin;
        const rx = r * 2.7;
        const ry = r * 0.34;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hole.angle);
        ctx.globalAlpha = 0.16 + 0.84 * near;

        if (!hole.warpFill) {
            const warp = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r * 3.2);
            warp.addColorStop(0, "rgba(0, 0, 0, 0.62)");
            warp.addColorStop(0.42, "rgba(10, 4, 18, 0.22)");
            warp.addColorStop(1, "rgba(0, 0, 0, 0)");
            hole.warpFill = warp;
        }
        ctx.fillStyle = hole.warpFill;
        ctx.beginPath();
        ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.rect(-rx - r, -r * 3, rx * 2 + r * 2, r * 3);
        ctx.clip();
        ctx.strokeStyle = holeDiskGradient(r, spin, 0.55);
        ctx.lineWidth = r * 0.62;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = holeDiskGradient(r, spin, 0.32);
        ctx.lineWidth = r * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 1.18, ry * 1.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = holeDiskGradient(r, spin, 0.78);
        ctx.lineWidth = r * 0.34;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.08, r * 1.02, 0, Math.PI * 1.08, Math.PI * 1.92);
        ctx.stroke();
        ctx.strokeStyle = holeDiskGradient(r, spin, 0.45);
        ctx.lineWidth = r * 0.16;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.22, r * 1.14, 0, Math.PI * 1.12, Math.PI * 1.88);
        ctx.stroke();

        if (!hole.photonFill) {
            const photon = ctx.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.2);
            photon.addColorStop(0, "#000000");
            photon.addColorStop(0.74, "#000000");
            photon.addColorStop(0.88, "rgba(255, 206, 140, 0.95)");
            photon.addColorStop(1, "rgba(255, 130, 40, 0)");
            hole.photonFill = photon;
        }
        ctx.fillStyle = hole.photonFill;
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.rect(-rx - r, 0, rx * 2 + r * 2, r * 3);
        ctx.clip();
        ctx.strokeStyle = holeDiskGradient(r, spin, 1);
        ctx.lineWidth = r * 0.7;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = holeDiskGradient(r, spin, 0.62);
        ctx.lineWidth = r * 0.22;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 1.18, ry * 1.22, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.strokeStyle = holeDiskGradient(r, spin, 0.38);
        ctx.lineWidth = r * 0.2;
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.1, r * 0.98, 0, Math.PI * 0.08, Math.PI * 0.92);
        ctx.stroke();

        ctx.restore();
    }

    function ballPulse(ball, now) {
        if (!state.pulse) return 1;
        if (!ball.pulseMs || ball.pulseMs < 1000 || ball.pulseMs > 5000) {
            ball.pulseMs = rand(1000, 5000);
            ball.pulseOffset = rand(0, Math.PI * 2);
        }
        const wave = 0.5 + 0.5 * Math.sin((now / ball.pulseMs) * Math.PI * 2 + ball.pulseOffset);
        return 0.06 + 0.94 * wave;
    }

    function isHex(value) {
        return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
    }

    function sanitizePaints(paints) {
        if (!Array.isArray(paints)) return [];
        return paints.filter(isHex).slice(0, 3);
    }

    function hexToRgb(hex) {
        const n = String(hex || "").replace("#", "");
        return {
            r: parseInt(n.slice(0, 2), 16) || 0,
            g: parseInt(n.slice(2, 4), 16) || 0,
            b: parseInt(n.slice(4, 6), 16) || 0,
        };
    }

    function rgbToHex(r, g, b) {
        const byte = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
        return `#${byte(r)}${byte(g)}${byte(b)}`;
    }

    function rgbToHsl(r, g, b) {
        const rr = r / 255;
        const gg = g / 255;
        const bb = b / 255;
        const max = Math.max(rr, gg, bb);
        const min = Math.min(rr, gg, bb);
        const l = (max + min) / 2;
        if (max === min) return { h: 0, s: 0, l: l * 100 };
        const d = max - min;
        const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        let h = 0;
        if (max === rr) h = (gg - bb) / d + (gg < bb ? 6 : 0);
        else if (max === gg) h = (bb - rr) / d + 2;
        else h = (rr - gg) / d + 4;
        return { h: h * 60, s: s * 100, l: l * 100 };
    }

    function hslToRgb(h, s, l) {
        const hh = ((h % 360) + 360) % 360 / 360;
        const ss = Math.max(0, Math.min(100, s)) / 100;
        const ll = Math.max(0, Math.min(100, l)) / 100;
        if (ss === 0) {
            const v = ll * 255;
            return { r: v, g: v, b: v };
        }
        const hue2rgb = (p, q, t) => {
            let tt = t;
            if (tt < 0) tt += 1;
            if (tt > 1) tt -= 1;
            if (tt < 1 / 6) return p + (q - p) * 6 * tt;
            if (tt < 1 / 2) return q;
            if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
            return p;
        };
        const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
        const p = 2 * ll - q;
        return {
            r: hue2rgb(p, q, hh + 1 / 3) * 255,
            g: hue2rgb(p, q, hh) * 255,
            b: hue2rgb(p, q, hh - 1 / 3) * 255,
        };
    }

    function driftHex(hex) {
        const { r, g, b } = hexToRgb(hex);
        let { h, s, l } = rgbToHsl(r, g, b);
        if (s < 10) {
            h = s < 4 ? rand(0, 360) : h + rand(-50, 50);
            s = Math.max(0, Math.min(22, s + rand(3, 14)));
        } else {
            h += rand(-18, 18);
            s = Math.max(14, Math.min(100, s + rand(-12, 12)));
        }
        l = Math.max(8, Math.min(90, l + rand(-11, 11)));
        const next = hslToRgb(h, s, l);
        return rgbToHex(next.r, next.g, next.b);
    }

    function nudgeLight(hex, delta) {
        const { r, g, b } = hexToRgb(hex);
        const hsl = rgbToHsl(r, g, b);
        const next = hslToRgb(hsl.h, hsl.s, Math.max(6, Math.min(94, hsl.l + delta)));
        return rgbToHex(next.r, next.g, next.b);
    }

    function planetLook(seedColor) {
        const palette = PALETTES[state.palette] || PALETTES.rainbow;
        const count = Math.random() < 0.3 ? 2 : 3;
        const bases = [];
        const used = new Set();
        if (isHex(seedColor)) {
            bases.push(seedColor);
            used.add(seedColor.toLowerCase());
        }
        const pool = palette.filter((hex) => !used.has(hex.toLowerCase()));
        while (bases.length < count && pool.length) {
            bases.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
        }
        while (bases.length < 2) bases.push(pick(palette));
        const paints = bases.map((hex, i) => {
            const drifted = driftHex(hex);
            if (i === 0) return nudgeLight(drifted, rand(8, 18));
            if (i === bases.length - 1) return nudgeLight(drifted, rand(-20, -8));
            return drifted;
        });
        return {
            color: paints[Math.min(1, paints.length - 1)],
            paints,
            litX: rand(-0.42, 0.14),
            litY: rand(-0.46, 0.1),
            // Cleared so a repaint (palette switch) discards cached gradients.
            bodyFill: null,
            spikeFills: null,
        };
    }

    function ensurePlanetLook(ball) {
        if (!ball) return ball;
        const paints = sanitizePaints(ball.paints);
        if (
            paints.length >= 2
            && Number.isFinite(ball.litX)
            && Number.isFinite(ball.litY)
            && isHex(ball.color)
        ) {
            ball.paints = paints;
            return ball;
        }
        Object.assign(ball, planetLook(isHex(ball.color) ? ball.color : null));
        return ball;
    }

    function shadeColor(hex, scale) {
        const c = hexToRgb(hex);
        return `rgb(${Math.max(0, Math.min(255, Math.round(c.r * scale)))}, ${Math.max(0, Math.min(255, Math.round(c.g * scale)))}, ${Math.max(0, Math.min(255, Math.round(c.b * scale)))})`;
    }

    function drawBallRings(x, y, ball, pulse) {
        const rx = ball.r * 1.85;
        const ry = ball.r * 0.36;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ball.ringTilt);
        ctx.strokeStyle = ball.paints?.[1] || shadeColor(ball.color, 0.82);
        ctx.globalAlpha = 0.45 + 0.4 * pulse;
        ctx.lineWidth = Math.max(2, ball.r * 0.14);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.2, ball.r * 0.07);
        ctx.globalAlpha = 0.28 + 0.3 * pulse;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 0.72, ry * 0.72, 0, Math.PI, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawBallSpikes(x, y, ball) {
        const count = ball.spikeCount || 12;
        const spin = ball.spikeSpin || 0;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(spin);
        for (let i = 0; i < count; i += 1) {
            const a = (i / count) * Math.PI * 2 + (i % 2) * 0.07;
            const tip = ball.r * (i % 2 ? 1.46 : 1.3);
            const half = ball.r * (i % 2 ? 0.15 : 0.18);
            const root = ball.r * 0.42;
            ctx.save();
            ctx.rotate(a);
            const slot = i % 2;
            if (!ball.spikeFills) ball.spikeFills = [];
            let g = ball.spikeFills[slot];
            if (!g) {
                g = ctx.createLinearGradient(root, 0, tip, 0);
                const paints = ball.paints || [ball.color];
                g.addColorStop(0, paints[0] || shadeColor(ball.color, 0.7));
                g.addColorStop(0.62, paints[1] || shadeColor(ball.color, 0.92));
                g.addColorStop(1, paints[2] || paints[1] || shadeColor(ball.color, 0.82));
                ball.spikeFills[slot] = g;
            }
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.moveTo(root, -half);
            ctx.lineTo(tip, 0);
            ctx.lineTo(root, half);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    function drawBallRingsFront(x, y, ball, pulse) {
        const rx = ball.r * 1.85;
        const ry = ball.r * 0.36;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ball.ringTilt);
        ctx.strokeStyle = ball.paints?.[0] || shadeColor(ball.color, 0.95);
        ctx.globalAlpha = 0.5 + 0.4 * pulse;
        ctx.lineWidth = Math.max(2, ball.r * 0.14);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
        ctx.stroke();
        ctx.lineWidth = Math.max(1.2, ball.r * 0.07);
        ctx.globalAlpha = 0.32 + 0.3 * pulse;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx * 0.72, ry * 0.72, 0, 0, Math.PI);
        ctx.stroke();
        ctx.restore();
    }

    function drawBall(ball, cam, now) {
        if (ball.hasRings == null) {
            ball.hasRings = !ball.hasSpikes && Math.random() < 0.28;
            ball.ringTilt = rand(-0.75, 0.75);
        }

        const x = ball.x - cam.x;
        const y = ball.y - cam.y;
        const reach = ball.hasRings || ball.hasSpikes ? ball.r * 2.1 : ball.r + 20;
        if (offView(x, y, reach, cam)) {
            return;
        }

        // A cached body gradient means the look was already validated, and paints
        // only change through planetLook(), which clears that cache.
        if (!ball.bodyFill) ensurePlanetLook(ball);
        const paints = ball.paints;
        const pulse = ball.hasSpikes ? 1 : ballPulse(ball, now);
        ctx.save();
        ctx.globalAlpha = pulse;
        if (!ball.hasSpikes) {
            ctx.shadowColor = ball.color;
            ctx.shadowBlur = 10 + 16 * pulse;
        }

        if (ball.hasRings) drawBallRings(x, y, ball, pulse);
        if (ball.hasSpikes) drawBallSpikes(x, y, ball);

        // Built once around the origin and reused; drawing translates to the ball
        // instead of rebuilding the gradient at new screen coordinates each frame.
        if (!ball.bodyFill) {
            const ox = ball.r * (Number.isFinite(ball.litX) ? ball.litX : -0.28);
            const oy = ball.r * (Number.isFinite(ball.litY) ? ball.litY : -0.32);
            const fill = ctx.createRadialGradient(ox, oy, ball.r * 0.06, 0, 0, ball.r);
            if (ball.hasSpikes) {
                fill.addColorStop(0, paints[0]);
                fill.addColorStop(0.48, paints[1] || ball.color);
                fill.addColorStop(1, paints[2] || nudgeLight(paints[1] || ball.color, -12));
            } else {
                fill.addColorStop(0, paints[0]);
                if (paints.length > 2) {
                    fill.addColorStop(0.36, paints[1]);
                    fill.addColorStop(0.74, paints[2]);
                } else {
                    fill.addColorStop(0.46, paints[1]);
                }
                fill.addColorStop(1, nudgeLight(paints[paints.length - 1], -18));
            }
            ball.bodyFill = fill;
        }
        ctx.save();
        ctx.translate(x, y);
        ctx.fillStyle = ball.bodyFill;
        ctx.beginPath();
        ctx.arc(0, 0, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (ball.hasRings) drawBallRingsFront(x, y, ball, pulse);
        ctx.restore();
    }

    function drawPops(cam, dt) {
        for (let i = state.pops.length - 1; i >= 0; i -= 1) {
            const pop = state.pops[i];
            pop.life -= dt * 1.8;
            if (pop.life <= 0) {
                state.pops.splice(i, 1);
                continue;
            }
            const x = pop.x - cam.x;
            const y = pop.y - cam.y;
            const grow = Number.isFinite(pop.grow) ? pop.grow : 40;
            const width = Number.isFinite(pop.width) ? pop.width : 6;
            const t = 1 - pop.life;
            ctx.strokeStyle = pop.color;
            ctx.globalAlpha = pop.life;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.arc(x, y, pop.r + t * grow, 0, Math.PI * 2);
            ctx.stroke();
            if (pop.burst) {
                ctx.lineWidth = Math.max(4, width * 0.4);
                ctx.globalAlpha = pop.life * 0.7;
                ctx.beginPath();
                ctx.arc(x, y, pop.r * 0.45 + t * grow * 0.62, 0, Math.PI * 2);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        }
    }

    function drawFloaters(cam, dt) {
        ctx.save();
        ctx.font = "600 15px 'Supreme Spike', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let i = state.floaters.length - 1; i >= 0; i -= 1) {
            const floater = state.floaters[i];
            floater.life -= dt / 1.15;
            if (floater.life <= 0) {
                state.floaters.splice(i, 1);
                continue;
            }
            const t = 1 - floater.life;
            const fade = floater.life * floater.life;
            ctx.globalAlpha = 0.72 * fade;
            ctx.fillStyle = "#c5d4f5";
            ctx.fillText(
                `+${floater.points}`,
                floater.x - cam.x,
                floater.y - cam.y - 8 - t * 42
            );
        }
        ctx.restore();
    }

    function loadShipImage(id) {
        const src = SHIP_SRC[id];
        if (!src) return null;
        if (shipImages[id]) return shipImages[id];
        const img = new Image();
        img.src = src;
        shipImages[id] = img;
        return img;
    }

    function drawClassicShip(moving) {
        ctx.rotate(state.heading + Math.PI / 2);
        if (moving) {
            const flicker = 0.7 + Math.random() * 0.3;
            ctx.fillStyle = `rgba(120, 200, 255, ${flicker})`;
            ctx.beginPath();
            ctx.moveTo(-7, 16);
            ctx.lineTo(0, 28 + Math.random() * 8);
            ctx.lineTo(7, 16);
            ctx.fill();
        }

        ctx.fillStyle = "#dce7ff";
        ctx.beginPath();
        ctx.moveTo(0, -24);
        ctx.lineTo(16, 16);
        ctx.lineTo(0, 8);
        ctx.lineTo(-16, 16);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#6aa2ff";
        ctx.beginPath();
        ctx.ellipse(0, -4, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawImageShip(img, moving) {
        ctx.rotate(state.heading);
        const pixel = SHIP_PIXEL.has(state.ship);
        const width = pixel ? 64 : 88;
        const height = width * (img.naturalHeight / img.naturalWidth);
        ctx.imageSmoothingEnabled = !pixel;
        if (moving && state.ship === "ship-1") {
            const flicker = 0.7 + Math.random() * 0.3;
            ctx.fillStyle = `rgba(120, 200, 255, ${flicker})`;
            ctx.beginPath();
            ctx.moveTo(-width / 2 + 10, -8);
            ctx.lineTo(-width / 2 - 16 - Math.random() * 8, 0);
            ctx.lineTo(-width / 2 + 10, 8);
            ctx.fill();
        }
        ctx.drawImage(img, -width / 2, -height / 2, width, height);
    }

    function drawShip(moving, cam) {
        ctx.save();
        ctx.translate(cam.w / 2, cam.h / 2);
        const img = state.ship !== "classic" ? loadShipImage(state.ship) : null;
        if (img && img.complete && img.naturalWidth) {
            drawImageShip(img, moving);
        } else {
            drawClassicShip(moving);
        }
        ctx.restore();
    }

    function shieldDropPath(target, x, y, r) {
        const px = (dx) => x + dx * r;
        const py = (dy) => y + dy * r;
        target.beginPath();
        target.moveTo(px(0), py(-1.04));
        target.quadraticCurveTo(px(0.38), py(-0.68), px(0.86), py(-0.64));
        target.lineTo(px(0.9), py(-0.1));
        target.quadraticCurveTo(px(0.78), py(0.46), px(0), py(1.1));
        target.quadraticCurveTo(px(-0.78), py(0.46), px(-0.9), py(-0.1));
        target.lineTo(px(-0.86), py(-0.64));
        target.quadraticCurveTo(px(-0.38), py(-0.68), px(0), py(-1.04));
        target.closePath();
    }

    function drawShieldDrop(x, y, r, now) {
        const glow = 0.88 + 0.12 * Math.sin((now || 0) / 520);
        ctx.save();
        const halo = ctx.createRadialGradient(x, y, r * 0.18, x, y, r * 2.2);
        halo.addColorStop(0, `rgba(255, 255, 255, ${0.2 * glow})`);
        halo.addColorStop(0.4, `rgba(236, 246, 255, ${0.14 * glow})`);
        halo.addColorStop(0.74, `rgba(210, 230, 255, ${0.06 * glow})`);
        halo.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
        ctx.fill();

        const fill = ctx.createLinearGradient(x, y - r, x, y + r);
        fill.addColorStop(0, `rgba(255, 255, 255, ${0.98 * glow})`);
        fill.addColorStop(0.38, `rgba(236, 244, 255, ${0.72 * glow})`);
        fill.addColorStop(0.78, `rgba(198, 220, 255, ${0.38 * glow})`);
        fill.addColorStop(1, `rgba(170, 200, 255, ${0.18 * glow})`);
        ctx.fillStyle = fill;
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = r * 0.55;
        shieldDropPath(ctx, x, y, r);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.strokeStyle = `rgba(255, 255, 255, ${0.92 * glow})`;
        ctx.lineJoin = "miter";
        ctx.miterLimit = 8;
        ctx.lineWidth = Math.max(2.4, r * 0.12);
        shieldDropPath(ctx, x, y, r);
        ctx.stroke();
        ctx.restore();
    }

    function drawDrops(cam, now) {
        for (const drop of state.drops) {
            const x = drop.x - cam.x;
            const y = drop.y - cam.y;
            const reach = drop.r * 2.3;
            if (offView(x, y, reach, cam)) continue;
            drawShieldDrop(x, y, drop.r, now);
        }
    }

    function drawShipShield(now, cam) {
        if (!state.shield) return;
        const x = cam.w / 2;
        const y = cam.h / 2;
        const r = SHIELD_SHIP_R;
        const glow = 0.88 + 0.12 * Math.sin(now / 520);
        ctx.save();
        const halo = ctx.createRadialGradient(x, y, r * 0.55, x, y, r * 1.85);
        halo.addColorStop(0, "rgba(255, 255, 255, 0)");
        halo.addColorStop(0.42, `rgba(255, 255, 255, ${0.08 * glow})`);
        halo.addColorStop(0.72, `rgba(236, 246, 255, ${0.2 * glow})`);
        halo.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(x, y, r * 1.85, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.78 * glow})`;
        ctx.lineWidth = 2.4;
        ctx.shadowColor = "rgba(255, 255, 255, 0.85)";
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawShieldRings(dt, cam) {
        for (let i = state.shieldRings.length - 1; i >= 0; i -= 1) {
            const ring = state.shieldRings[i];
            ring.life -= dt * 1.35;
            if (ring.life <= 0) {
                state.shieldRings.splice(i, 1);
                continue;
            }
            const t = 1 - ring.life;
            const r = SHIELD_SHIP_R + t * 170;
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${ring.life})`;
            ctx.shadowColor = "rgba(255, 255, 255, 0.9)";
            ctx.shadowBlur = 22;
            ctx.lineWidth = 3.5 + t * 5;
            ctx.beginPath();
            ctx.arc(cam.w / 2, cam.h / 2, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = ring.life * 0.35;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(cam.w / 2, cam.h / 2, r * 0.78, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }

    // The sky and wash gradients depend only on the viewport, so they are rebuilt
    // on resize rather than on every one of the ~60 frames drawn each second.
    const skyPaint = { w: 0, h: 0, sky: null, wash: null };

    function ensureSkyPaint() {
        if (skyPaint.w === state.width && skyPaint.h === state.height) return skyPaint;
        const sky = ctx.createLinearGradient(0, 0, 0, state.height);
        sky.addColorStop(0, "#050217");
        sky.addColorStop(0.55, "#0a0830");
        sky.addColorStop(1, "#07051c");
        const wash = ctx.createRadialGradient(
            state.width * 0.7,
            state.height * 0.25,
            20,
            state.width * 0.7,
            state.height * 0.25,
            Math.max(state.width, state.height) * 0.7
        );
        wash.addColorStop(0, "rgba(90, 40, 140, 0.18)");
        wash.addColorStop(1, "rgba(0, 0, 0, 0)");
        skyPaint.w = state.width;
        skyPaint.h = state.height;
        skyPaint.sky = sky;
        skyPaint.wash = wash;
        return skyPaint;
    }

    function drawSpace(cam, now) {
        const paint = ensureSkyPaint();
        ctx.fillStyle = paint.sky;
        ctx.fillRect(0, 0, cam.w, cam.h);

        if (state.nebula) {
            ctx.fillStyle = paint.wash;
            ctx.fillRect(0, 0, cam.w, cam.h);
            drawNebulae(cam);
        }
        drawGalaxies(cam, now);
        drawStars(cam, now);
        drawBorder(cam);
    }

    function paintGalaxySprite(galaxy) {
        if (galaxy.sprite) return galaxy.sprite;
        const dim = 320;
        const canvas = document.createElement("canvas");
        canvas.width = dim;
        canvas.height = dim;
        const g = canvas.getContext("2d");
        const mid = dim / 2;
        const r = dim * 0.46;
        g.translate(mid, mid);
        const kind = galaxy.kind || "classic";
        if (kind === "andromeda") paintAndromedaGalaxy(g, r, galaxy);
        else if (kind === "milky") paintMilkyGalaxy(g, r, galaxy);
        else paintClassicGalaxy(g, r, galaxy);
        const mute = galaxy.mute ?? galaxyMute(galaxy.r);
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = "source-atop";
        g.fillStyle = `rgba(10, 8, 20, ${0.16 + mute * 0.42})`;
        g.fillRect(0, 0, dim, dim);
        galaxy.sprite = canvas;
        return canvas;
    }

    function paintClassicGalaxy(g, r, galaxy) {
        const { r: cr, g: cg, b: cb } = galaxy.tint;
        g.globalCompositeOperation = "lighter";
        const halo = g.createRadialGradient(0, 0, 0, 0, 0, r);
        halo.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.14)`);
        halo.addColorStop(0.42, `rgba(${cr}, ${cg}, ${cb}, 0.055)`);
        halo.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        g.fillStyle = halo;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        for (let arm = 0; arm < galaxy.arms; arm += 1) {
            const base = (arm / galaxy.arms) * Math.PI * 2;
            for (let s = 0; s < 72; s += 1) {
                const t = s / 72;
                const a = base + t * galaxy.wind;
                const rad = t * r;
                const px = Math.cos(a) * rad;
                const py = Math.sin(a) * rad;
                const blob = 2.1 + (1 - t) * 4.6;
                const alpha = 0.12 * (1 - t * 0.5);
                const glow = g.createRadialGradient(px, py, 0, px, py, blob * 2.5);
                glow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha})`);
                glow.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
                g.fillStyle = glow;
                g.beginPath();
                g.arc(px, py, blob * 2.5, 0, Math.PI * 2);
                g.fill();
            }
        }
        const core = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.2);
        core.addColorStop(0, "rgba(255, 255, 255, 0.62)");
        core.addColorStop(0.32, `rgba(${cr}, ${cg}, ${cb}, 0.38)`);
        core.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        g.fillStyle = core;
        g.beginPath();
        g.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        g.fill();
    }

    function paintGalaxyArms(g, r, galaxy, inner, outer, samples) {
        const arms = galaxy.arms || 2;
        for (let arm = 0; arm < arms; arm += 1) {
            const base = (arm / arms) * Math.PI * 2;
            for (let s = 0; s < samples; s += 1) {
                const t = s / samples;
                const a = base + t * galaxy.wind;
                const rad = t * r;
                const px = Math.cos(a) * rad;
                const py = Math.sin(a) * rad;
                const blob = 1.8 + (1 - t) * 5.2;
                const mix = t * t;
                const cr = Math.round(inner.r + (outer.r - inner.r) * mix);
                const cg = Math.round(inner.g + (outer.g - inner.g) * mix);
                const cb = Math.round(inner.b + (outer.b - inner.b) * mix);
                const alpha = 0.13 * (1 - t * 0.42);
                const glow = g.createRadialGradient(px, py, 0, px, py, blob * 2.6);
                glow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha})`);
                glow.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
                g.fillStyle = glow;
                g.beginPath();
                g.arc(px, py, blob * 2.6, 0, Math.PI * 2);
                g.fill();
            }
        }
    }

    function paintGalaxyDust(g, r, tilt, width) {
        g.save();
        g.globalCompositeOperation = "source-over";
        g.rotate(tilt);
        const dust = g.createLinearGradient(0, -r * width, 0, r * width);
        dust.addColorStop(0, "rgba(6, 2, 10, 0)");
        dust.addColorStop(0.35, "rgba(10, 4, 14, 0.38)");
        dust.addColorStop(0.5, "rgba(18, 8, 16, 0.52)");
        dust.addColorStop(0.65, "rgba(10, 4, 14, 0.38)");
        dust.addColorStop(1, "rgba(6, 2, 10, 0)");
        g.fillStyle = dust;
        g.beginPath();
        g.ellipse(0, 0, r * 0.92, r * width, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
    }

    function paintAndromedaGalaxy(g, r, galaxy) {
        const mute = galaxy.mute ?? 0.3;
        const warm = muteRgb({ r: 255, g: 232, b: 196 }, mute);
        const blue = muteRgb({ r: 150, g: 186, b: 255 }, mute);
        g.globalCompositeOperation = "lighter";
        const halo = g.createRadialGradient(0, 0, 0, 0, 0, r);
        halo.addColorStop(0, `rgba(${warm.r}, ${warm.g}, ${warm.b}, 0.12)`);
        halo.addColorStop(0.38, `rgba(${blue.r}, ${blue.g}, ${blue.b}, 0.07)`);
        halo.addColorStop(1, "rgba(90, 140, 220, 0)");
        g.fillStyle = halo;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        paintGalaxyArms(g, r, galaxy, muteRgb({ r: 255, g: 214, b: 168 }, mute), muteRgb({ r: 120, g: 168, b: 255 }, mute), 96);
        const core = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.3);
        core.addColorStop(0, "rgba(255, 252, 240, 0.62)");
        core.addColorStop(0.28, "rgba(255, 220, 160, 0.42)");
        core.addColorStop(0.62, "rgba(210, 170, 120, 0.22)");
        core.addColorStop(1, "rgba(180, 140, 90, 0)");
        g.fillStyle = core;
        g.beginPath();
        g.arc(0, 0, r * 0.3, 0, Math.PI * 2);
        g.fill();
        paintGalaxyDust(g, r, 0.12, 0.055);
    }

    function paintMilkyGalaxy(g, r, galaxy) {
        const mute = galaxy.mute ?? 0.3;
        const gold = muteRgb({ r: 255, g: 214, b: 150 }, mute);
        const lilac = muteRgb({ r: 180, g: 160, b: 255 }, mute);
        g.globalCompositeOperation = "lighter";
        const halo = g.createRadialGradient(0, 0, 0, 0, 0, r);
        halo.addColorStop(0, `rgba(${gold.r}, ${gold.g}, ${gold.b}, 0.12)`);
        halo.addColorStop(0.4, `rgba(${lilac.r}, ${lilac.g}, ${lilac.b}, 0.055)`);
        halo.addColorStop(1, "rgba(80, 90, 160, 0)");
        g.fillStyle = halo;
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        g.save();
        g.rotate(0.18);
        const bar = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.42);
        bar.addColorStop(0, "rgba(255, 236, 190, 0.32)");
        bar.addColorStop(0.55, "rgba(255, 190, 120, 0.14)");
        bar.addColorStop(1, "rgba(255, 170, 90, 0)");
        g.fillStyle = bar;
        g.beginPath();
        g.ellipse(0, 0, r * 0.42, r * 0.11, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
        paintGalaxyArms(g, r, galaxy, muteRgb({ r: 255, g: 196, b: 130 }, mute), muteRgb({ r: 160, g: 190, b: 255 }, mute), 88);
        const core = g.createRadialGradient(0, 0, 0, 0, 0, r * 0.22);
        core.addColorStop(0, "rgba(255, 250, 230, 0.58)");
        core.addColorStop(0.4, "rgba(255, 200, 120, 0.34)");
        core.addColorStop(1, "rgba(220, 140, 70, 0)");
        g.fillStyle = core;
        g.beginPath();
        g.arc(0, 0, r * 0.22, 0, Math.PI * 2);
        g.fill();
        paintGalaxyDust(g, r, -0.08, 0.07);
    }

    function drawGalaxies(cam, now) {
        if (state.sky !== "galaxies") return;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const galaxy of state.galaxies) {
            const x = galaxy.x - cam.x;
            const y = galaxy.y - cam.y;
            if (offView(x, y, galaxy.r * 1.15, cam)) continue;
            const sprite = paintGalaxySprite(galaxy);
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(galaxy.tilt);
            ctx.scale(1, galaxy.flat);
            ctx.rotate(galaxy.phase + now * 0.001 * galaxy.spin);
            ctx.drawImage(sprite, -galaxy.r, -galaxy.r, galaxy.r * 2, galaxy.r * 2);
            ctx.restore();
        }
        ctx.restore();
    }

    function drawNebulae(cam) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const cloud of state.nebulae) {
            const x = cloud.x - cam.x;
            const y = cloud.y - cam.y;
            const reach = cloud.r * cloud.stretch;
            if (offView(x, y, reach, cam)) continue;

            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(cloud.angle);
            ctx.scale(cloud.stretch, 1);
            const { r, g, b } = cloud.tint;
            for (const lobe of cloud.lobes) {
                const cx = lobe.dx * cloud.r;
                const cy = lobe.dy * cloud.r;
                const lr = cloud.r * lobe.scale;
                // Lobes are drawn in the cloud's local space, so the gradient never
                // changes once built. Keep it on the lobe instead of rebuilding it.
                if (!lobe.glow) {
                    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, lr);
                    glow.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${lobe.alpha})`);
                    glow.addColorStop(0.42, `rgba(${r}, ${g}, ${b}, ${lobe.alpha * 0.42})`);
                    glow.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
                    lobe.glow = glow;
                }
                ctx.fillStyle = lobe.glow;
                ctx.beginPath();
                ctx.arc(cx, cy, lr, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        ctx.restore();
    }

    function drawHoles(cam, now) {
        for (const hole of state.holes) drawHole(hole, cam, now);
    }

    function neutronStarAt(pair, now, index) {
        const a = pair.spin + (now / 1000) * pair.speed + index * Math.PI;
        return {
            x: pair.x + Math.cos(a) * pair.orbit,
            y: pair.y + Math.sin(a) * pair.orbit * pair.tilt,
            depth: Math.sin(a),
        };
    }

    function drawNeutronStar(x, y, r, cam) {
        const sx = x - cam.x;
        const sy = y - cam.y;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4.6);
        glow.addColorStop(0, "rgba(255, 255, 255, 1)");
        glow.addColorStop(0.16, "rgba(255, 255, 255, 0.95)");
        glow.addColorStop(0.4, "rgba(200, 225, 255, 0.42)");
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#ffffff";
        ctx.shadowBlur = r * 2.4;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawNeutrons(cam, now) {
        for (const pair of state.neutrons) {
            const reach = pair.orbit + pair.r * 4.6;
            if (offView(pair.x - cam.x, pair.y - cam.y, reach, cam)) continue;
            const stars = [];
            for (let i = 0; i < 2; i += 1) {
                if (neutronAlive(pair, i)) stars.push(neutronStarAt(pair, now, i));
            }
            stars.sort((a, b) => a.depth - b.depth);
            for (const star of stars) drawNeutronStar(star.x, star.y, pair.r, cam);
        }
    }

    function drawComets(cam) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-cam.x, -cam.y, state.world, state.world);
        ctx.clip();
        for (const comet of state.comets) {
            const x = comet.x - cam.x;
            const y = comet.y - cam.y;
            const reach = comet.tail + comet.r * 6;
            if (offView(x, y, reach, cam)) continue;
            const { r, g, b } = comet.tint;
            const a = 0.4 + 0.6 * comet.near;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(comet.angle);
            ctx.globalCompositeOperation = "lighter";
            const streak = ctx.createLinearGradient(-comet.tail, 0, comet.r * 2, 0);
            streak.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`);
            streak.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${0.08 * a})`);
            streak.addColorStop(0.86, `rgba(${r}, ${g}, ${b}, ${0.28 * a})`);
            streak.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${0.55 * a})`);
            ctx.fillStyle = streak;
            ctx.beginPath();
            ctx.moveTo(-comet.tail, 0);
            ctx.lineTo(comet.r * 0.4, comet.r * 1.15);
            ctx.lineTo(comet.r * 0.4, -comet.r * 1.15);
            ctx.closePath();
            ctx.fill();
            const coma = ctx.createRadialGradient(0, 0, 0, 0, 0, comet.r * 4.2);
            coma.addColorStop(0, `rgba(255, 255, 255, ${0.55 * a})`);
            coma.addColorStop(0.28, `rgba(${r}, ${g}, ${b}, ${0.42 * a})`);
            coma.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
            ctx.fillStyle = coma;
            ctx.beginPath();
            ctx.arc(0, 0, comet.r * 4.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            const ball = comet.r * 1.35;
            const core = ctx.createRadialGradient(0, 0, 0, 0, 0, ball);
            core.addColorStop(0, "#ffffff");
            core.addColorStop(0.45, `rgb(${r}, ${g}, ${b})`);
            core.addColorStop(1, `rgb(${Math.round(r * 0.72)}, ${Math.round(g * 0.72)}, ${Math.round(b * 0.72)})`);
            ctx.fillStyle = core;
            ctx.beginPath();
            ctx.arc(0, 0, ball, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    function meteorPath(ctx, meteor, scale) {
        const lumps = meteor.lumps;
        ctx.beginPath();
        for (let i = 0; i < lumps.length; i += 1) {
            const a = (i / lumps.length) * Math.PI * 2;
            const rad = meteor.r * lumps[i] * scale;
            const px = Math.cos(a) * rad;
            const py = Math.sin(a) * rad;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }

    function drawMeteors(cam) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(-cam.x, -cam.y, state.world, state.world);
        ctx.clip();
        for (const meteor of state.meteors) {
            const x = meteor.x - cam.x;
            const y = meteor.y - cam.y;
            const reach = meteor.tail + meteor.r * 4;
            if (offView(x, y, reach, cam)) continue;
            const { r, g, b } = meteor.tint;
            const a = 0.45 + 0.55 * meteor.near;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(meteor.angle);
            ctx.globalCompositeOperation = "lighter";
            const streak = ctx.createLinearGradient(-meteor.tail, 0, 0, 0);
            streak.addColorStop(0, "rgba(255, 80, 20, 0)");
            streak.addColorStop(0.55, `rgba(255, 110, 32, ${0.12 * a})`);
            streak.addColorStop(0.86, `rgba(255, 176, 64, ${0.38 * a})`);
            streak.addColorStop(1, `rgba(255, 230, 160, ${0.55 * a})`);
            ctx.fillStyle = streak;
            ctx.beginPath();
            ctx.moveTo(-meteor.tail, 0);
            ctx.lineTo(-meteor.r * 0.35, meteor.r * 0.42);
            ctx.lineTo(-meteor.r * 0.08, 0);
            ctx.lineTo(-meteor.r * 0.35, -meteor.r * 0.42);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = "source-over";
            ctx.rotate(meteor.spin);
            meteorPath(ctx, meteor, 1);
            const shade = ctx.createRadialGradient(-meteor.r * 0.28, -meteor.r * 0.22, meteor.r * 0.12, 0, 0, meteor.r * 1.15);
            shade.addColorStop(0, `rgb(${Math.min(255, r + 38)}, ${Math.min(255, g + 28)}, ${Math.min(255, b + 18)})`);
            shade.addColorStop(0.55, `rgb(${r}, ${g}, ${b})`);
            shade.addColorStop(1, `rgb(${Math.round(r * 0.42)}, ${Math.round(g * 0.4)}, ${Math.round(b * 0.38)})`);
            ctx.fillStyle = shade;
            ctx.fill();
            ctx.restore();
        }
        ctx.restore();
    }

    // Called once per ball, comet, meteor and drop every frame. Returning a shared
    // point keeps that off the allocator; callers must read x/y before the next call.
    const minimapPoint = { x: 0, y: 0 };

    function toMinimap(worldX, worldY, size, scale) {
        minimapPoint.x = size / 2 + (worldX - state.shipX) * scale;
        minimapPoint.y = size / 2 + (worldY - state.shipY) * scale;
        return minimapPoint;
    }

    function drawMinimap(now) {
        const size = minimapSize();
        const scale = minimapWorldScale();
        const mark = size / MINIMAP_SIZE;
        miniCtx.clearRect(0, 0, size, size);
        miniCtx.save();
        miniCtx.beginPath();
        miniCtx.roundRect(0, 0, size, size, Math.min(28, size * 0.06));
        miniCtx.clip();

        miniCtx.fillStyle = "#000000";
        miniCtx.fillRect(0, 0, size, size);

        const origin = toMinimap(0, 0, size, scale);
        const originX = origin.x;
        const originY = origin.y;
        const worldPx = state.world * scale;
        miniCtx.fillStyle = "#0a0830";
        miniCtx.fillRect(originX, originY, worldPx, worldPx);

        miniCtx.strokeStyle = "#000000";
        miniCtx.lineWidth = Math.max(1, 2 * mark);
        miniCtx.strokeRect(originX, originY, worldPx, worldPx);

        for (const ball of state.balls) {
            const p = toMinimap(ball.x, ball.y, size, scale);
            const r = Math.max(ball.hasSpikes ? 3.4 * mark : 2.2 * mark, ball.r * scale) * (ball.hasSpikes ? 0.375 : 1);
            const reach = ball.hasSpikes ? r * 1.9 : r;
            if (p.x < -reach || p.y < -reach || p.x > size + reach || p.y > size + reach) continue;
            miniCtx.globalAlpha = ball.hasSpikes ? 1 : ballPulse(ball, now);
            miniCtx.fillStyle = ball.color;
            if (ball.hasSpikes) {
                const spikes = 7;
                const inner = r * 0.72;
                const outer = r * 1.85;
                miniCtx.beginPath();
                for (let i = 0; i < spikes; i += 1) {
                    const a = (i / spikes) * Math.PI * 2 - Math.PI / 2;
                    const b = a + Math.PI / spikes;
                    miniCtx.lineTo(p.x + Math.cos(a) * outer, p.y + Math.sin(a) * outer);
                    miniCtx.lineTo(p.x + Math.cos(b) * inner, p.y + Math.sin(b) * inner);
                }
                miniCtx.closePath();
                miniCtx.fill();
                miniCtx.strokeStyle = "#ff3b30";
                miniCtx.lineWidth = Math.max(1.2 * mark, r * 0.28);
                miniCtx.stroke();
            } else {
                miniCtx.beginPath();
                miniCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
                miniCtx.fill();
            }
            miniCtx.globalAlpha = 1;
        }

        for (const pair of state.neutrons) {
            for (let i = 0; i < 2; i += 1) {
                if (!neutronAlive(pair, i)) continue;
                const star = neutronStarAt(pair, now, i);
                const p = toMinimap(star.x, star.y, size, scale);
                const r = Math.max(3.6 * mark, 4.2);
                if (p.x < -r * 3 || p.y < -r * 3 || p.x > size + r * 3 || p.y > size + r * 3) continue;
                miniCtx.fillStyle = "rgba(255, 255, 255, 0.28)";
                miniCtx.beginPath();
                miniCtx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
                miniCtx.fill();
                miniCtx.fillStyle = "#ffffff";
                miniCtx.beginPath();
                miniCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
                miniCtx.fill();
            }
        }

        miniCtx.save();
        miniCtx.beginPath();
        miniCtx.rect(origin.x, origin.y, worldPx, worldPx);
        miniCtx.clip();
        for (const comet of state.comets) {
            const p = toMinimap(comet.x, comet.y, size, scale);
            const tail = Math.max(9 * mark, comet.tail * scale * 0.28);
            const r = Math.max(2.2 * mark, cometBody(comet) * scale);
            if (p.x < -tail || p.y < -tail || p.x > size + tail || p.y > size + tail) continue;
            const { r: cr, g, b } = comet.tint;
            miniCtx.save();
            miniCtx.translate(p.x, p.y);
            miniCtx.rotate(comet.angle);
            miniCtx.strokeStyle = `rgba(${cr}, ${g}, ${b}, 0.75)`;
            miniCtx.lineWidth = Math.max(1.2 * mark, r * 0.55);
            miniCtx.lineCap = "round";
            miniCtx.beginPath();
            miniCtx.moveTo(-tail, 0);
            miniCtx.lineTo(0, 0);
            miniCtx.stroke();
            miniCtx.fillStyle = `rgb(${cr}, ${g}, ${b})`;
            miniCtx.beginPath();
            miniCtx.arc(0, 0, r, 0, Math.PI * 2);
            miniCtx.fill();
            miniCtx.fillStyle = "#ffffff";
            miniCtx.beginPath();
            miniCtx.arc(0, 0, r * 0.42, 0, Math.PI * 2);
            miniCtx.fill();
            miniCtx.restore();
        }
        for (const meteor of state.meteors) {
            const p = toMinimap(meteor.x, meteor.y, size, scale);
            const tail = Math.max(7 * mark, meteor.tail * scale * 0.28);
            const r = Math.max(2.4 * mark, meteorBody(meteor) * scale);
            if (p.x < -tail || p.y < -tail || p.x > size + tail || p.y > size + tail) continue;
            const { r: mr, g, b } = meteor.tint;
            miniCtx.save();
            miniCtx.translate(p.x, p.y);
            miniCtx.rotate(meteor.angle);
            miniCtx.strokeStyle = "rgba(255, 140, 48, 0.8)";
            miniCtx.lineWidth = Math.max(1.2 * mark, r * 0.5);
            miniCtx.lineCap = "round";
            miniCtx.beginPath();
            miniCtx.moveTo(-tail, 0);
            miniCtx.lineTo(0, 0);
            miniCtx.stroke();
            miniCtx.rotate(meteor.spin);
            meteorPath(miniCtx, meteor, Math.max(0.18, r / meteor.r));
            miniCtx.fillStyle = `rgb(${mr}, ${g}, ${b})`;
            miniCtx.fill();
            miniCtx.restore();
        }
        miniCtx.restore();

        const cx = size / 2;
        const cy = size / 2;
        miniCtx.save();
        miniCtx.translate(cx, cy);
        miniCtx.rotate(state.heading + Math.PI / 2);
        miniCtx.fillStyle = "#ffffff";
        miniCtx.beginPath();
        miniCtx.moveTo(0, -8 * mark);
        miniCtx.lineTo(5 * mark, 6 * mark);
        miniCtx.lineTo(0, 3 * mark);
        miniCtx.lineTo(-5 * mark, 6 * mark);
        miniCtx.closePath();
        miniCtx.fill();
        miniCtx.restore();

        for (const drop of state.drops) {
            const p = toMinimap(drop.x, drop.y, size, scale);
            const r = Math.max(3.2 * mark, drop.r * scale);
            if (p.x < -r || p.y < -r || p.x > size + r || p.y > size + r) continue;
            miniCtx.fillStyle = "rgba(255, 255, 255, 0.95)";
            miniCtx.shadowColor = "#ffffff";
            miniCtx.shadowBlur = 6 * mark;
            shieldDropPath(miniCtx, p.x, p.y, r * 0.85);
            miniCtx.fill();
            miniCtx.shadowBlur = 0;
        }

        miniCtx.strokeStyle = state.shield ? "rgba(255, 255, 255, 0.85)" : "rgba(170, 200, 255, 0.4)";
        miniCtx.lineWidth = state.shield ? Math.max(1.4, 1.8 * mark) : 1;
        miniCtx.beginPath();
        miniCtx.arc(cx, cy, (state.shield ? 14 : 11) * mark, 0, Math.PI * 2);
        miniCtx.stroke();

        miniCtx.restore();
    }

    let last = performance.now();
    let lastPlaySave = 0;
    function frame(now) {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;

        const paused = state.menuOpen || state.won || state.resumeOpen || state.boardOpen;
        const moving = paused ? false : moveShip(dt);
        if (!paused) collectIfHit(now);
        updateEngine(moving);
        const cam = camera();

        updateBoostFuel(dt, paused);
        updateComets(dt, now, paused);
        updateMeteors(dt, now, paused);
        beginWorld(cam);
        drawSpace(cam, now);
        drawHoles(cam, now);
        drawNeutrons(cam, now);
        drawComets(cam);
        drawMeteors(cam);
        for (const ball of state.balls) drawBall(ball, cam, now);
        drawDrops(cam, now);
        drawPops(cam, dt);
        drawFloaters(cam, dt);
        drawShip(moving, cam);
        drawShipShield(now, cam);
        drawShieldRings(dt, cam);
        endWorld();
        drawMinimap(now);
        updateTimer(now);
        setCoords();
        if (now - lastPlaySave > 1000) {
            lastPlaySave = now;
            flushSettings();
            if (!state.menuOpen && !state.resumeOpen) flushPlay();
        }

        requestAnimationFrame(frame);
    }

    const boostHold = { pointer: false, space: false };

    function boostWanted() {
        return !state.menuOpen && !state.won && !state.resumeOpen && !state.boardOpen && (boostHold.pointer || boostHold.space);
    }

    function showBoostFuel() {
        const fill = document.getElementById("boost-fuel");
        const meter = fill && fill.parentElement;
        const pct = Math.round(state.boostFuel * 100);
        if (fill) fill.style.width = `${pct}%`;
        if (meter) meter.setAttribute("aria-valuenow", String(pct));
    }

    function applyBoost() {
        const on = boostWanted() && state.boostFuel > 0;
        const button = document.getElementById("boost-btn");
        if (state.boost !== on) {
            state.boost = on;
            fadeEngineRate();
        }
        button.classList.toggle("is-on", on);
        button.classList.toggle("is-empty", state.boostFuel <= 0);
        button.setAttribute("aria-pressed", on ? "true" : "false");
        showBoostFuel();
    }

    function updateBoostFuel(dt, paused) {
        if (paused) {
            if (state.boost) applyBoost();
            return;
        }
        const want = boostWanted();
        if (state.infiniteFuel) {
            state.boostFuel = 1;
        } else if (want && state.boostFuel > 0) {
            state.boostFuel = Math.max(0, state.boostFuel - dt / BOOST_DRAIN);
        } else if (!want && state.boostFuel < 1) {
            state.boostFuel = Math.min(1, state.boostFuel + dt / BOOST_REFILL);
        }
        applyBoost();
    }

    function syncBoost() {
        applyBoost();
    }

    function bindKeys() {
        window.addEventListener("keydown", (event) => {
            unlockEngine();
            if (state.menuOpen || state.won || state.resumeOpen || state.boardOpen) return;
            if (event.key === " " || event.code === "Space") {
                event.preventDefault();
                boostHold.space = true;
                syncBoost();
                return;
            }
            keys.add(event.key.toLowerCase());
            if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key.toLowerCase())) {
                event.preventDefault();
            }
        });
        window.addEventListener("keyup", (event) => {
            if (event.key === " " || event.code === "Space") {
                boostHold.space = false;
                syncBoost();
            }
            keys.delete(event.key.toLowerCase());
        });
        window.addEventListener("blur", () => {
            keys.clear();
            boostHold.space = false;
            boostHold.pointer = false;
            syncBoost();
        });
    }

    function pickSpeedRing(dist) {
        const rings = scaledRings();
        if (dist < (rings[0].radius + rings[1].radius) / 2) {
            return rings[0];
        }
        if (dist < (rings[1].radius + rings[2].radius) / 2) {
            return rings[1];
        }
        return rings[2];
    }

    function snapStick(dx, dy) {
        const dist = Math.hypot(dx, dy);
        if (dist < STICK_DEAD * stickScale()) {
            return { vx: 0, vy: 0, dir: "", knobX: 0, knobY: 0, speed: 0, ring: "" };
        }

        let best = DIRS[0];
        let bestDot = -Infinity;
        for (const dir of DIRS) {
            const length = Math.hypot(dir.vx, dir.vy);
            const nx = dir.vx / length;
            const ny = dir.vy / length;
            const dot = (dx / dist) * nx + (dy / dist) * ny;
            if (dot > bestDot) {
                bestDot = dot;
                best = dir;
            }
        }

        const length = Math.hypot(best.vx, best.vy);
        const vx = best.vx / length;
        const vy = best.vy / length;
        const ring = pickSpeedRing(dist);
        return {
            vx,
            vy,
            dir: best.name,
            knobX: vx * ring.radius,
            knobY: vy * ring.radius,
            speed: ring.scale,
            ring: ring.name,
        };
    }

    function setStick(next) {
        stick.vx = next.vx;
        stick.vy = next.vy;
        stick.dir = next.dir;
        stick.speed = next.speed;
        stick.ring = next.ring;
        const knob = document.getElementById("joystick-knob");
        knob.style.transform = `translate(${next.knobX}px, ${next.knobY}px)`;
        const joystick = document.getElementById("joystick");
        joystick.classList.toggle("is-active", next.dir !== "");
        joystick.dataset.speed = next.ring;
        for (const pip of document.querySelectorAll(".joystick-pip")) {
            pip.classList.toggle("is-on", pip.dataset.dir === next.dir);
        }
        for (const ring of document.querySelectorAll(".joystick-ring")) {
            ring.classList.toggle("is-on", ring.dataset.ring === next.ring);
        }
    }

    function resetStick() {
        setStick({ vx: 0, vy: 0, dir: "", knobX: 0, knobY: 0, speed: 0, ring: "" });
    }

    function buildPips() {
        const base = document.querySelector(".joystick-base");
        const knob = document.getElementById("joystick-knob");
        for (const pip of base.querySelectorAll(".joystick-pip")) {
            pip.remove();
        }
        const reach = STICK_PIP * stickScale();
        for (const dir of DIRS) {
            const pip = document.createElement("span");
            pip.className = "joystick-pip";
            pip.dataset.dir = dir.name;
            pip.style.transform = `rotate(${dir.angle}rad) translateX(${reach}px)`;
            base.insertBefore(pip, knob);
        }
    }

    function bindPad() {
        const joystick = document.getElementById("joystick");
        let pointerId = null;

        const aimFromEvent = (event) => {
            const rect = joystick.getBoundingClientRect();
            const dx = event.clientX - (rect.left + rect.width / 2);
            const dy = event.clientY - (rect.top + rect.height / 2);
            setStick(snapStick(dx, dy));
        };

        joystick.addEventListener("pointerdown", (event) => {
            unlockEngine();
            if (state.menuOpen || state.won || state.resumeOpen || state.boardOpen) return;
            event.preventDefault();
            pointerId = event.pointerId;
            joystick.setPointerCapture(event.pointerId);
            aimFromEvent(event);
        });

        joystick.addEventListener("pointermove", (event) => {
            if (pointerId !== event.pointerId) return;
            event.preventDefault();
            aimFromEvent(event);
        });

        const release = (event) => {
            if (pointerId !== event.pointerId) return;
            pointerId = null;
            resetStick();
        };

        joystick.addEventListener("pointerup", release);
        joystick.addEventListener("pointercancel", release);
    }

    function restartGame() {
        const center = state.world / 2;
        state.shipX = center;
        state.shipY = center;
        state.heading = -Math.PI / 2;
        state.speed = 0;
        state.boostFuel = 1;
        state.balls = [];
        state.holes = [];
        state.neutrons = [];
        state.nebulae = [];
        state.galaxies = [];
        state.comets = [];
        state.cometSpawns = 0;
        state.meteors = [];
        state.drops = [];
        state.shield = false;
        state.shieldRings = [];
        state.taken = [];
        state.pops = [];
        state.floaters = [];
        state.found = 0;
        state.score = 0;
        state.won = false;
        state.boardLogged = false;
        keys.clear();
        resetStick();
        const winTitle = document.getElementById("win-title");
        if (winTitle) winTitle.textContent = "YOU WON";
        winOverlay.classList.add("hidden");
        closeBoard();
        closeResume(false);
        spawnDecor();
        spawnBalls(state.ballCount);
        resetTimer(performance.now(), !state.menuOpen && !state.won && !state.resumeOpen);
        updateHud();
        savePlay();
    }

    function showSettingsPanel(id) {
        state.settingsPanel = id || "";
        const titles = { user: "User", game: "Game", audio: "Volume", visuals: "Visuals" };
        const nav = document.getElementById("settings-nav");
        const back = document.getElementById("settings-back");
        const title = document.getElementById("settings-title");
        if (nav) nav.classList.toggle("hidden", Boolean(id));
        if (back) back.classList.toggle("hidden", !id);
        if (title) title.textContent = titles[id] || "Settings";
        for (const panel of document.querySelectorAll(".settings-panel")) {
            panel.classList.toggle("hidden", panel.dataset.panel !== id);
        }
        const body = settingsMenu.querySelector(".settings-body");
        if (body) body.scrollTop = 0;
    }

    function openMenu(lite) {
        if (state.menuOpen) return;
        // The per-second flush skips play writes while a menu is open, so settle
        // any pending write before pausing.
        flushSaves();
        state.menuOpen = true;
        state.settingsLite = lite === true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        settingsMenu.classList.toggle("settings-lite", state.settingsLite);
        settingsMenu.classList.remove("hidden");
        document.documentElement.classList.add("settings-open");
        document.body.classList.add("settings-open");
        // Ship unlocks track lifetime points, which grow on every pickup. The full
        // sweep runs here, when the settings UI becomes visible, rather than on
        // every pickup as it used to.
        updateHud();
        showSettingsPanel("");
        syncBoost();
        savePlay();
    }

    function closeMenu() {
        if (!state.menuOpen) return;
        state.menuOpen = false;
        state.settingsLite = false;
        settingsMenu.classList.remove("settings-lite");
        settingsMenu.classList.add("hidden");
        document.documentElement.classList.remove("settings-open");
        document.body.classList.remove("settings-open");
        if (!state.won && !state.boardOpen) resumeTimer(performance.now());
        savePlay();
    }

    function renderBoard() {
        const rows = loadBoard();
        boardList.replaceChildren();
        const hasRows = rows.length > 0;
        boardTable.classList.toggle("hidden", !hasRows);
        boardEmpty.classList.toggle("hidden", hasRows);
        const kinds = ["rank", "name", "score", "time", "date"];
        for (const [index, row] of rows.entries()) {
            const el = document.createElement("div");
            el.className = "board-row";
            el.setAttribute("role", "row");
            if (state.won && row.name === (state.name || "Pilot") && row.score === state.score && Math.abs(row.elapsed - timer.elapsed) < 1) {
                el.classList.add("is-you");
            }
            const cells = [
                String(index + 1),
                row.name,
                row.score.toLocaleString(),
                formatPlayTime(row.elapsed),
                formatBoardDate(row.at),
            ];
            for (const [i, text] of cells.entries()) {
                const span = document.createElement("span");
                span.className = `board-${kinds[i]}`;
                span.textContent = text;
                el.append(span);
            }
            boardList.append(el);
        }
    }

    function openBoard(from) {
        state.boardFrom = from === "win" ? "win" : "settings";
        state.boardOpen = true;
        renderBoard();
        if (state.boardFrom === "settings") {
            settingsMenu.classList.add("hidden");
            document.documentElement.classList.remove("settings-open");
            document.body.classList.remove("settings-open");
        } else {
            winOverlay.classList.add("hidden");
        }
        boardOverlay.classList.remove("hidden");
        document.documentElement.classList.add("board-open");
        document.body.classList.add("board-open");
    }

    function closeBoard() {
        if (!state.boardOpen) return;
        const from = state.boardFrom;
        state.boardOpen = false;
        boardOverlay.classList.add("hidden");
        document.documentElement.classList.remove("board-open");
        document.body.classList.remove("board-open");
        if (from === "win") {
            winOverlay.classList.remove("hidden");
            return;
        }
        if (state.menuOpen) {
            settingsMenu.classList.remove("hidden");
            document.documentElement.classList.add("settings-open");
            document.body.classList.add("settings-open");
            return;
        }
        openMenu();
    }

    function bindPlayground() {
        if (!PLAYGROUND) return;
        const toggle = document.getElementById("playground-toggle");
        if (toggle) {
            toggle.addEventListener("click", () => {
                document.body.classList.toggle("playground-open");
                toggle.setAttribute("aria-expanded", document.body.classList.contains("playground-open") ? "true" : "false");
            });
        }
        const restart = document.getElementById("playground-restart");
        if (restart) {
            restart.addEventListener("click", () => restartGame());
        }
        const trialToggle = document.getElementById("trial-toggle");
        if (trialToggle) {
            trialToggle.addEventListener("click", () => {
                state.trial = !state.trial;
                saveSettings();
                resetTimer(performance.now(), !state.menuOpen && !state.won);
                updateHud();
            });
        }
        for (const button of document.querySelectorAll(".trial-btn")) {
            button.addEventListener("click", () => {
                const next = Number(button.dataset.trial);
                if (!TRIAL_MS.includes(next)) return;
                state.trial = true;
                state.trialMs = next;
                saveSettings();
                resetTimer(performance.now(), !state.menuOpen && !state.won);
                updateHud();
            });
        }
        for (const el of document.querySelectorAll("[data-pg-range]")) {
            el.addEventListener("input", () => {
                const key = el.dataset.pgRange;
                const label = document.querySelector(`[data-pg-value="${key}"]`);
                if (key === "balls" && label) label.textContent = el.value;
                if (key === "goal" && label) label.textContent = el.value;
                if (key === "zoom") {
                    state.zoom = clampZoom(el.value);
                    if (label) label.textContent = `${state.zoom}×`;
                }
                if (key === "volume") {
                    state.volume = clampVolume(el.value);
                    if (label) label.textContent = String(state.volume);
                    applyAudioLevels();
                }
            });
            el.addEventListener("change", () => {
                const key = el.dataset.pgRange;
                if (key === "balls") {
                    const next = Number(el.value);
                    if (next === state.ballCount) return;
                    state.ballCount = next;
                    state.goal = clampGoal(state.goal);
                    state.difficulty = "custom";
                    saveSettings();
                    restartGame();
                    return;
                }
                if (key === "goal") {
                    const next = clampGoal(Number(el.value));
                    if (next === state.goal) {
                        syncPlaygroundRanges();
                        return;
                    }
                    state.goal = next;
                    state.difficulty = "custom";
                    saveSettings();
                    updateHud();
                    maybeWin();
                    return;
                }
                if (key === "zoom") {
                    state.zoom = clampZoom(el.value);
                    saveSettings();
                    updateHud();
                    return;
                }
                if (key === "volume") {
                    state.volume = clampVolume(el.value);
                    saveSettings();
                    applyAudioLevels();
                    updateHud();
                }
            });
        }
    }

    function bindHud() {
        const bindHudTap = (el, fn) => {
            let last = 0;
            const run = () => {
                const now = performance.now();
                if (now - last < 400) return;
                last = now;
                fn();
            };
            el.addEventListener("pointerup", (event) => {
                if (event.pointerType !== "touch" && event.button !== 0) return;
                event.preventDefault();
                run();
            });
            el.addEventListener("click", (event) => {
                event.preventDefault();
                run();
            });
        };
        bindHudTap(document.getElementById("go-home"), () => {
            if (!PLAYGROUND) savePlay();
            saveSettings();
            flushSaves();
            location.href = "./index.html";
        });
        bindHudTap(document.getElementById("play-settings"), () => {
            if (state.won || state.resumeOpen || state.boardOpen) return;
            openMenu(true);
        });

        const commitName = () => {
            const next = normalizeName(nameInput.value);
            nameInput.value = next;
            if (next === state.name) return;
            state.name = next;
            saveSettings();
        };
        nameInput.value = state.name;
        nameInput.addEventListener("change", commitName);
        nameInput.addEventListener("blur", commitName);
        nameInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                nameInput.blur();
            }
        });

        minimap.addEventListener("click", () => {
            if (!state.minimapLarge) setMinimapOpen(true);
        });
        if (minimapClose) minimapClose.addEventListener("click", () => setMinimapOpen(false));

        const boostBtn = document.getElementById("boost-btn");
        boostBtn.addEventListener("pointerdown", (event) => {
            unlockEngine();
            if (state.menuOpen || state.won || state.resumeOpen || state.boardOpen) return;
            event.preventDefault();
            boostHold.pointer = true;
            boostBtn.setPointerCapture(event.pointerId);
            syncBoost();
        });
        const releaseBoost = (event) => {
            if (event.pointerId != null) {
                try { boostBtn.releasePointerCapture(event.pointerId); } catch { /* already released */ }
            }
            boostHold.pointer = false;
            syncBoost();
        };
        boostBtn.addEventListener("pointerup", releaseBoost);
        boostBtn.addEventListener("pointercancel", releaseBoost);

        ballsSlider.addEventListener("input", () => {
            ballsSliderValue.textContent = ballsSlider.value;
        });

        ballsSlider.addEventListener("change", () => {
            const next = Number(ballsSlider.value);
            if (next === state.ballCount) return;
            state.ballCount = next;
            state.goal = clampGoal(state.goal);
            state.difficulty = "custom";
            saveSettings();
            restartGame();
        });

        goalSlider.addEventListener("input", () => {
            goalSliderValue.textContent = goalSlider.value;
        });

        goalSlider.addEventListener("change", () => {
            const next = clampGoal(Number(goalSlider.value));
            if (next === state.goal) {
                syncGoalSlider();
                return;
            }
            state.goal = next;
            state.difficulty = "custom";
            saveSettings();
            updateHud();
            maybeWin();
        });

        for (const button of document.querySelectorAll(".diff-btn")) {
            button.addEventListener("click", () => applyDifficulty(button.dataset.diff));
        }

        for (const button of document.querySelectorAll(".world-btn")) {
            button.addEventListener("click", () => {
                const next = Number(button.dataset.world);
                if (next === state.world) return;
                state.world = next;
                state.difficulty = "custom";
                saveSettings();
                restartGame();
            });
        }

        for (const button of document.querySelectorAll(".pulse-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.pulse === "on";
                if (next === state.pulse) return;
                state.pulse = next;
                saveSettings();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".nebula-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.nebula === "on";
                if (next === state.nebula) return;
                state.nebula = next;
                if (state.nebula && !state.nebulae.length) spawnNebulae();
                saveSettings();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".star-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.stars === "on";
                if (next === state.starDrift) return;
                state.starDrift = next;
                saveSettings();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".sky-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.sky;
                if (!SKY_NAMES.includes(next) || next === state.sky) return;
                state.sky = next;
                if (state.sky === "galaxies" && !state.galaxies.length) spawnGalaxies();
                saveSettings();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".audio-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.audio === "on";
                if (next === state.audio) return;
                state.audio = next;
                saveSettings();
                applyAudioLevels();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".spike-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.spikes === "on";
                if (next === state.spikes) return;
                state.spikes = next;
                saveSettings();
                if (!state.spikes) {
                    state.balls = state.balls.filter((ball) => !ball.hasSpikes);
                    savePlay();
                }
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".meteor-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.meteor === "on";
                if (next === state.meteorOn) return;
                state.meteorOn = next;
                saveSettings();
                if (state.meteorOn) spawnMeteors();
                else state.meteors = [];
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".fuel-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.fuel === "on";
                if (next === state.infiniteFuel) return;
                state.infiniteFuel = next;
                if (state.infiniteFuel) state.boostFuel = 1;
                saveSettings();
                applyBoost();
                updateHud();
            });
        }

        if (zoomSlider) {
            zoomSlider.addEventListener("input", () => {
                state.zoom = clampZoom(zoomSlider.value);
                if (zoomSliderValue) zoomSliderValue.textContent = `${state.zoom}×`;
            });
            zoomSlider.addEventListener("change", () => {
                state.zoom = clampZoom(zoomSlider.value);
                saveSettings();
                updateHud();
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener("input", () => {
                state.volume = clampVolume(volumeSlider.value);
                if (volumeSliderValue) volumeSliderValue.textContent = String(state.volume);
                applyAudioLevels();
            });
            volumeSlider.addEventListener("change", () => {
                state.volume = clampVolume(volumeSlider.value);
                saveSettings();
                applyAudioLevels();
                updateHud();
            });
        }

        bindPlayground();

        for (const button of document.querySelectorAll(".req-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.req === "on";
                if (next === state.reqShips) return;
                state.reqShips = next;
                if (state.reqShips && !shipUnlocked(state.ship)) state.ship = "classic";
                saveSettings();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".fullscreen-btn")) {
            button.addEventListener("click", () => {
                setFullscreen(button.dataset.fullscreen === "on");
            });
        }

        const onFullscreenChange = () => {
            resize();
            updateHud();
        };
        document.addEventListener("fullscreenchange", onFullscreenChange);
        document.addEventListener("webkitfullscreenchange", onFullscreenChange);

        for (const button of document.querySelectorAll(".palette-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.palette;
                if (!PALETTES[next] || next === state.palette) return;
                state.palette = next;
                for (const ball of state.balls) Object.assign(ball, planetLook());
                for (const ball of state.taken) Object.assign(ball, planetLook());
                saveSettings();
                savePlay();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".ship-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.ship;
                if (!SHIP_IDS.includes(next) || next === state.ship || !shipUnlocked(next)) return;
                state.ship = next;
                loadShipImage(next);
                saveSettings();
                updateHud();
            });
        }

        document.getElementById("settings-board").addEventListener("click", () => {
            openBoard("settings");
        });
        document.getElementById("settings-back").addEventListener("click", () => showSettingsPanel(""));
        for (const button of document.querySelectorAll(".settings-cat")) {
            button.addEventListener("click", () => showSettingsPanel(button.dataset.panel));
        }
        const resetOverlay = document.getElementById("reset-overlay");
        if (resetOverlay) {
            document.getElementById("settings-reset").addEventListener("click", () => resetOverlay.classList.remove("hidden"));
            document.getElementById("reset-cancel").addEventListener("click", () => resetOverlay.classList.add("hidden"));
            document.getElementById("reset-confirm").addEventListener("click", () => {
                state.wiped = true;
                state.lifetime = 0;
                state.ship = "classic";
                try {
                    localStorage.removeItem(PLAY_KEY);
                    localStorage.removeItem(BOARD_KEY);
                } catch {
                    // Ignore private-mode failures.
                }
                saveSettings();
                flushSaves();
                location.href = "./index.html";
            });
        }

        const homeBtn = document.getElementById("settings-home");
        if (homeBtn) {
            homeBtn.addEventListener("click", () => {
                if (!PLAYGROUND) savePlay();
                saveSettings();
                flushSaves();
                location.href = "./index.html";
            });
        }

        document.getElementById("settings-restart").addEventListener("click", () => {
            restartGame();
            closeMenu();
        });

        document.getElementById("settings-close").addEventListener("click", closeMenu);
        document.getElementById("settings-continue").addEventListener("click", closeMenu);

        document.getElementById("win-board").addEventListener("click", () => {
            openBoard("win");
        });
        document.getElementById("win-home").addEventListener("click", () => {
            if (!PLAYGROUND) savePlay();
            saveSettings();
            flushSaves();
            location.href = "./index.html";
        });

        const leaveBoard = () => closeBoard();
        document.getElementById("board-back").addEventListener("click", leaveBoard);
        document.getElementById("board-close").addEventListener("click", leaveBoard);

        document.getElementById("resume-new").addEventListener("click", () => {
            restartGame();
        });
        document.getElementById("resume-continue").addEventListener("click", () => {
            closeResume(true);
        });
    }

    function playIsActive(play) {
        return Boolean(play && !play.won && (play.found > 0 || play.score > 0 || play.elapsed >= 2500));
    }

    function openResume() {
        state.resumeOpen = true;
        timer.runningSince = null;
        resumeMessage.textContent = `${state.found} / ${state.goal} · ${state.score.toLocaleString()} · ${formatPlayTime(timer.elapsed)}`;
        resumeOverlay.classList.remove("hidden");
    }

    function closeResume(resume) {
        if (!state.resumeOpen) return;
        state.resumeOpen = false;
        resumeOverlay.classList.add("hidden");
        if (resume && !state.won && !state.menuOpen) resumeTimer(performance.now());
    }

    function pageZoomed() {
        return Boolean(window.visualViewport && window.visualViewport.scale > 1.01);
    }

    function preventBrowserGestures() {
        const block = (event) => event.preventDefault();
        for (const type of ["gesturestart", "gesturechange", "gestureend"]) {
            document.addEventListener(type, block, { passive: false });
        }

        document.addEventListener("touchmove", (event) => {
            if (pageZoomed() && event.touches.length > 1) return;
            if (state.menuOpen || state.boardOpen || event.target.closest("#settings-menu") || event.target.closest("#board-overlay")) {
                if (event.touches.length > 1) event.preventDefault();
                return;
            }
            event.preventDefault();
        }, { passive: false });

        let lastTap = 0;
        document.addEventListener("touchend", (event) => {
            if (event.target.closest("input, textarea, #go-home, #play-settings")) return;
            const now = event.timeStamp;
            if (now - lastTap <= 350) event.preventDefault();
            lastTap = now;
        }, { passive: false });

        document.addEventListener("contextmenu", block);
    }

    function restorePlay() {
        if (PLAYGROUND) {
            restartGame();
            return;
        }
        const boot = new URLSearchParams(location.search).get("mode");
        if (boot) history.replaceState({}, "", location.pathname);

        if (boot !== "new" && boot !== "continue") {
            location.replace("./index.html");
            return;
        }

        if (boot === "new") {
            restartGame();
            return;
        }

        const play = loadPlay();
        if (!play) {
            spawnDecor();
            spawnBalls(state.ballCount);
            resetTimer(performance.now(), true);
            return;
        }
        const min = SHIP_RADIUS + 8;
        const max = state.world - SHIP_RADIUS - 8;
        state.shipX = Math.min(max, Math.max(min, play.shipX));
        state.shipY = Math.min(max, Math.max(min, play.shipY));
        state.heading = play.heading;
        state.balls = play.balls;
        state.found = play.found;
        state.score = play.score;
        state.won = play.won;
        state.boardLogged = play.boardLogged;
        state.cometSpawns = play.cometSpawns;
        state.shield = play.shield;
        state.taken = play.taken || [];
        if (play.hasDrops) state.drops = play.drops;
        else spawnDrops();
        timer.elapsed = play.elapsed;
        timer.runningSince = null;
        shownSecond = -1;
        spawnDecor();
        if (play.hasNeutrons) state.neutrons = play.neutrons;
        if (play.won) {
            recordWinScore();
            if (state.trial) timerEl.textContent = formatPlayTime(0);
            showWinOverlay(state.trial ? "trial" : "hunt", play.elapsed);
            return;
        }
        if (state.trial && play.elapsed >= state.trialMs) {
            finishTrial();
            return;
        }
        timer.runningSince = performance.now();
        shownSecond = -1;
        timerEl.textContent = formatPlayTime(timerDisplayMs(performance.now()));
    }

    loadShipImage(state.ship);
    resize();
    restorePlay();
    updateHud();
    bindKeys();
    buildPips();
    bindPad();
    bindHud();
    preventBrowserGestures();
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("orientationchange", scheduleResize);
    document.addEventListener("fullscreenchange", scheduleResize);
    document.addEventListener("webkitfullscreenchange", scheduleResize);
    window.matchMedia(COMPACT_UI).addEventListener("change", scheduleResize);
    if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", scheduleResize);
        window.visualViewport.addEventListener("scroll", scheduleResize);
    }
    window.addEventListener("pagehide", () => {
        savePlay();
        flushSaves();
        pauseAudio();
    });
    window.addEventListener("pageshow", () => {
        scheduleResize();
        resumeAudio();
    });
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
            savePlay();
            flushSaves();
            pauseAudio();
            return;
        }
        scheduleResize();
        resumeAudio();
    });
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }
    requestAnimationFrame(frame);
})();
