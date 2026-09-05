(() => {
    const START_BALLS = 75;
    const START_GOAL = 75;
    const GOAL_MIN = 5;
    const GOAL_STEP = 5;
    const BALLS_MIN = 25;
    const BALLS_MAX = 250;
    const START_WORLD = 20000;
    const WORLD_SIZES = [5000, 10000, 15000, 20000];
    const SETTINGS_KEY = "harlie-space-settings";
    const PLAY_KEY = "harlie-space-play";
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
    const SHIP_RADIUS = 22;
    const SHIP_SPEED = 840;
    const SHIP_ACCEL = 2000;
    const SHIP_DECEL = 1500;
    const SPAWN_CLEARANCE = 15;
    const ENGINE_SRC = "public/audio/ship/freesound_community-spacecraft-engine-loop-01-58205.mp3";
    const ENGINE_LOOP_START = 0.5;
    const ENGINE_LOOP_END = 15;
    const ENGINE_FADE = 0.3;
    const ENGINE_FADE_IN = 0.15;
    const ENGINE_BOOST_RATE = 1.25;
    const HIT_SRC = "public/audio/balls/audio_319c456817.mp3";
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
    const SHIP_IDS = ["classic", "ship-1"];
    const SHIP_SRC = {
        "ship-1": "public/images/ships/ship-1.png",
    };
    const shipImages = {};

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const minimap = document.getElementById("minimap");
    const miniCtx = minimap.getContext("2d");
    const foundEl = document.getElementById("found-count");
    const goalEl = document.getElementById("goal-count");
    const scoreEl = document.getElementById("play-score");
    const coordsEl = document.getElementById("coords");
    const timerEl = document.getElementById("play-timer");
    const ballsSlider = document.getElementById("balls-slider");
    const ballsSliderValue = document.getElementById("balls-slider-value");
    const goalSlider = document.getElementById("goal-slider");
    const goalSliderValue = document.getElementById("goal-slider-value");
    const settingsMenu = document.getElementById("settings-menu");
    const winOverlay = document.getElementById("win-overlay");
    const winMessage = document.getElementById("win-message");
    const winScoreEl = document.getElementById("win-score");
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

    function loadSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
            const world = WORLD_SIZES.includes(Number(data.world)) ? Number(data.world) : START_WORLD;
            const ballCount = snapStep(Number(data.ballCount) || START_BALLS, BALLS_MIN, BALLS_MAX, GOAL_STEP);
            const goal = snapStep(Number(data.goal) || START_GOAL, GOAL_MIN, ballCount, GOAL_STEP);
            const palette = PALETTE_NAMES.includes(data.palette) ? data.palette : "rainbow";
            const pulse = data.pulse !== false;
            const ship = SHIP_IDS.includes(data.ship) ? data.ship : "classic";
            return { world, ballCount, goal, palette, pulse, ship };
        } catch {
            return { world: START_WORLD, ballCount: START_BALLS, goal: START_GOAL, palette: "rainbow", pulse: true, ship: "classic" };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                world: state.world,
                ballCount: state.ballCount,
                goal: state.goal,
                palette: state.palette,
                pulse: state.pulse,
                ship: state.ship,
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
        return {
            x: Number(ball.x),
            y: Number(ball.y),
            r,
            points: type ? type.points : Math.max(100, Number(ball.points) || 100),
            color: typeof ball.color === "string" ? ball.color : "#007aff",
            pulseMs: Number(ball.pulseMs) || rand(1000, 5000),
            pulseOffset: Number(ball.pulseOffset) || rand(0, Math.PI * 2),
            hasRings: Boolean(ball.hasRings),
            ringTilt: Number.isFinite(Number(ball.ringTilt)) ? Number(ball.ringTilt) : 0,
        };
    }

    function savePlay() {
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
                    pulseMs: ball.pulseMs,
                    pulseOffset: ball.pulseOffset,
                    hasRings: ball.hasRings,
                    ringTilt: ball.ringTilt,
                })),
                found: state.found,
                score: state.score,
                elapsed: playTime(performance.now()),
                won: state.won,
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
            if (!Array.isArray(data.balls)) return null;
            const balls = [];
            for (const ball of data.balls) {
                const next = normalizeBall(ball);
                if (!next) return null;
                balls.push(next);
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
            };
        } catch {
            return null;
        }
    }

    const saved = loadSettings();
    const state = {
        world: saved.world,
        shipX: saved.world / 2,
        shipY: saved.world / 2,
        heading: -Math.PI / 2,
        balls: [],
        pops: [],
        floaters: [],
        found: 0,
        score: 0,
        ballCount: saved.ballCount,
        goal: saved.goal,
        palette: saved.palette,
        pulse: saved.pulse,
        ship: saved.ship,
        speed: 0,
        boost: false,
        won: false,
        menuOpen: false,
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

    function isCompactUi() {
        return window.matchMedia(COMPACT_UI).matches;
    }

    function controlT() {
        const vmin = Math.min(window.innerWidth, window.innerHeight);
        return Math.min(1, Math.max(0, (vmin - SCALE_VMIN_START) / (SCALE_VMIN_FULL - SCALE_VMIN_START)));
    }

    function applyControlLayout() {
        const t = controlT();
        const grow = 1 + CONTROL_GROW * t;
        const root = document.documentElement;
        root.style.setProperty("--control-grow", String(grow));
        root.style.setProperty("--control-inset-x", `${Math.max(0, (window.innerWidth / 6) * t - 100)}px`);
        root.style.setProperty("--control-inset-y", `${Math.max(0, (window.innerHeight / 6) * t - 50)}px`);
    }

    function stickScale() {
        const base = isCompactUi() ? COMPACT_STICK : 1;
        return base * (1 + CONTROL_GROW * controlT());
    }

    function minimapSize() {
        return isCompactUi() ? MINIMAP_SIZE * 0.5 * 0.9 : MINIMAP_SIZE;
    }

    function minimapWorldScale() {
        return MINIMAP_SCALE * (minimapSize() / MINIMAP_SIZE);
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

    function resize() {
        applyControlLayout();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.dpr = dpr;
        canvas.width = Math.floor(state.width * dpr);
        canvas.height = Math.floor(state.height * dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const size = minimapSize();
        minimap.width = Math.floor(size * dpr);
        minimap.height = Math.floor(size * dpr);
        minimap.style.width = `${size}px`;
        minimap.style.height = `${size}px`;
        miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

        const compact = isCompactUi();
        const nextScale = stickScale();
        if (compact !== uiCompact || Math.abs(nextScale - lastStickScale) > 0.001) {
            uiCompact = compact;
            lastStickScale = nextScale;
            buildPips();
            resetStick();
        }
    }

    function spawnBalls(count) {
        for (let i = 0; i < count; i += 1) {
            const type = pick(BALL_TYPES);
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
                Math.hypot(x - state.shipX, y - state.shipY) < minDist &&
                attempts < 80
            );

            state.balls.push({
                x,
                y,
                r,
                points: type.points,
                color: pick(PALETTES[state.palette] || PALETTES.rainbow),
                pulseMs: rand(1000, 5000),
                pulseOffset: rand(0, Math.PI * 2),
                hasRings: Math.random() < 0.28,
                ringTilt: rand(-0.75, 0.75),
            });
        }
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

    function resetTimer(now, running) {
        timer.elapsed = 0;
        timer.runningSince = running ? now : null;
        shownSecond = -1;
        timerEl.textContent = formatPlayTime(0);
    }

    function updateTimer(now) {
        const ms = playTime(now);
        const sec = Math.floor(ms / 1000);
        if (sec === shownSecond) return;
        shownSecond = sec;
        timerEl.textContent = formatPlayTime(ms);
    }

    function clampGoal(value) {
        return snapStep(value, GOAL_MIN, Math.max(GOAL_MIN, state.ballCount), GOAL_STEP);
    }

    function syncGoalSlider() {
        goalSlider.min = String(GOAL_MIN);
        goalSlider.max = String(state.ballCount);
        goalSlider.step = String(GOAL_STEP);
        goalSlider.value = String(state.goal);
        goalSliderValue.textContent = String(state.goal);
    }

    function updateHud() {
        foundEl.textContent = String(state.found);
        if (scoreEl) scoreEl.textContent = state.score.toLocaleString();
        goalEl.textContent = String(state.goal);
        ballsSlider.value = String(state.ballCount);
        ballsSliderValue.textContent = String(state.ballCount);
        syncGoalSlider();
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;
        for (const button of document.querySelectorAll(".world-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.world) === state.world);
        }
        for (const button of document.querySelectorAll(".palette-btn")) {
            button.classList.toggle("is-on", button.dataset.palette === state.palette);
        }
        for (const button of document.querySelectorAll(".pulse-btn")) {
            button.classList.toggle("is-on", (button.dataset.pulse === "on") === state.pulse);
        }
        for (const button of document.querySelectorAll(".ship-btn")) {
            button.classList.toggle("is-on", button.dataset.ship === state.ship);
        }
        const fullscreenOn = isFullscreen();
        for (const button of document.querySelectorAll(".fullscreen-btn")) {
            button.classList.toggle("is-on", (button.dataset.fullscreen === "on") === fullscreenOn);
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

    function maybeWin() {
        if (state.won || state.found < state.goal) return;
        state.won = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        if (state.menuOpen) closeMenu();
        if (winScoreEl) winScoreEl.textContent = state.score.toLocaleString();
        winMessage.textContent = `Goal ${state.goal} · ${formatPlayTime(playTime(performance.now()))}`;
        winOverlay.classList.remove("hidden");
        savePlay();
    }

    function collectIfHit() {
        for (let i = state.balls.length - 1; i >= 0; i -= 1) {
            const ball = state.balls[i];
            const reach = ball.r + SHIP_RADIUS;
            if (Math.hypot(ball.x - state.shipX, ball.y - state.shipY) <= reach) {
                state.balls.splice(i, 1);
                state.found += 1;
                const points = ball.points || ballTypeFor(ball).points;
                state.score += points;
                state.pops.push({
                    x: ball.x,
                    y: ball.y,
                    r: ball.r,
                    color: ball.color,
                    life: 1,
                });
                state.floaters.push({
                    x: ball.x,
                    y: ball.y,
                    points,
                    life: 1,
                });
                playHit();
                updateHud();
                savePlay();
                maybeWin();
            }
        }
    }

    function moveShip(dt) {
        if (state.menuOpen || state.won) return false;
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
    };

    function engineContext() {
        if (!engine.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            engine.ctx = new AudioCtx();
        }
        return engine.ctx;
    }

    function unlockEngine() {
        const ctx = engineContext();
        if (ctx.state === "suspended") ctx.resume();
        if (!engine.loading) engine.loading = loadEngine();
    }

    async function loadEngine() {
        try {
            const ctx = engineContext();
            const [engineBytes, hitBytes] = await Promise.all([
                fetch(ENGINE_SRC).then((res) => res.arrayBuffer()),
                fetch(HIT_SRC).then((res) => res.arrayBuffer()),
            ]);
            engine.buffer = await ctx.decodeAudioData(engineBytes.slice(0));
            engine.hit = await ctx.decodeAudioData(hitBytes.slice(0));
            if (engine.wanted) startEngine(true);
        } catch {
            engine.loading = null;
        }
    }

    function playHit() {
        if (!engine.hit) return;
        const ctx = engineContext();
        if (ctx.state === "suspended") ctx.resume();
        const source = ctx.createBufferSource();
        source.buffer = engine.hit;
        source.connect(ctx.destination);
        source.start();
    }

    function engineRate() {
        return state.boost ? ENGINE_BOOST_RATE : 1;
    }

    function startEngine(fadeIn) {
        if (!engine.buffer || engine.source) return;
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
            gain.gain.linearRampToValueAtTime(1, now + ENGINE_FADE_IN);
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
            else fadeEngine(1);
        } else if (engine.source) {
            fadeEngine(0);
        }
    }

    function camera() {
        return {
            x: state.shipX - state.width / 2,
            y: state.shipY - state.height / 2,
        };
    }

    function drawStars(cam) {
        const cell = 160;
        const left = Math.floor((cam.x - 40) / cell);
        const right = Math.ceil((cam.x + state.width + 40) / cell);
        const top = Math.floor((cam.y - 40) / cell);
        const bottom = Math.ceil((cam.y + state.height + 40) / cell);

        for (let gy = top; gy <= bottom; gy += 1) {
            for (let gx = left; gx <= right; gx += 1) {
                const starsInCell = 1 + Math.floor(hash2(gx, gy) * 3);
                for (let i = 0; i < starsInCell; i += 1) {
                    const hx = hash2(gx + i * 19.1, gy + 7.3);
                    const hy = hash2(gx + 4.8, gy + i * 13.7);
                    const x = gx * cell + hx * cell - cam.x;
                    const y = gy * cell + hy * cell - cam.y;
                    const twinkle = 0.45 + hash2(gx * 3.1, gy + i) * 0.55;
                    const size = 0.6 + hash2(i + gx, gy * 2.2) * 1.8;
                    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
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
        ctx.fillRect(0, 0, state.width, Math.max(0, y));
        ctx.fillRect(0, y + h, state.width, Math.max(0, state.height - (y + h)));
        ctx.fillRect(0, y, Math.max(0, x), h);
        ctx.fillRect(x + w, y, Math.max(0, state.width - (x + w)), h);
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 18;
        ctx.strokeRect(x, y, w, h);
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

    function hexToRgb(hex) {
        const n = hex.replace("#", "");
        return {
            r: parseInt(n.slice(0, 2), 16),
            g: parseInt(n.slice(2, 4), 16),
            b: parseInt(n.slice(4, 6), 16),
        };
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
        ctx.strokeStyle = shadeColor(ball.color, 0.82);
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

    function drawBallRingsFront(x, y, ball, pulse) {
        const rx = ball.r * 1.85;
        const ry = ball.r * 0.36;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ball.ringTilt);
        ctx.strokeStyle = shadeColor(ball.color, 0.95);
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
            ball.hasRings = Math.random() < 0.28;
            ball.ringTilt = rand(-0.75, 0.75);
        }

        const x = ball.x - cam.x;
        const y = ball.y - cam.y;
        const reach = ball.hasRings ? ball.r * 2.1 : ball.r + 20;
        if (x < -reach || y < -reach || x > state.width + reach || y > state.height + reach) {
            return;
        }

        const pulse = ballPulse(ball, now);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 10 + 16 * pulse;

        if (ball.hasRings) drawBallRings(x, y, ball, pulse);

        const glow = ctx.createRadialGradient(x, y, 0, x, y, ball.r);
        glow.addColorStop(0, shadeColor(ball.color, 1.28));
        glow.addColorStop(0.4, ball.color);
        glow.addColorStop(0.78, shadeColor(ball.color, 0.55));
        glow.addColorStop(1, shadeColor(ball.color, 0.22));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, ball.r, 0, Math.PI * 2);
        ctx.fill();

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
            ctx.beginPath();
            ctx.strokeStyle = pop.color;
            ctx.globalAlpha = pop.life;
            ctx.lineWidth = 6;
            ctx.arc(x, y, pop.r + (1 - pop.life) * 40, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
    }

    function drawFloaters(cam, dt) {
        ctx.save();
        ctx.font = "600 15px 'Avenir Next', 'Segoe UI', sans-serif";
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
        const width = 88;
        const height = width * (img.naturalHeight / img.naturalWidth);
        if (moving) {
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

    function drawShip(moving) {
        ctx.save();
        ctx.translate(state.width / 2, state.height / 2);
        const img = state.ship !== "classic" ? loadShipImage(state.ship) : null;
        if (img && img.complete && img.naturalWidth) {
            drawImageShip(img, moving);
        } else {
            drawClassicShip(moving);
        }
        ctx.restore();
    }

    function drawSpace(cam) {
        const sky = ctx.createLinearGradient(0, 0, 0, state.height);
        sky.addColorStop(0, "#050217");
        sky.addColorStop(0.55, "#0a0830");
        sky.addColorStop(1, "#07051c");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, state.width, state.height);

        const nebula = ctx.createRadialGradient(
            state.width * 0.7,
            state.height * 0.25,
            20,
            state.width * 0.7,
            state.height * 0.25,
            Math.max(state.width, state.height) * 0.7
        );
        nebula.addColorStop(0, "rgba(90, 40, 140, 0.18)");
        nebula.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = nebula;
        ctx.fillRect(0, 0, state.width, state.height);

        drawStars(cam);
        drawBorder(cam);
    }

    function toMinimap(worldX, worldY, size, scale) {
        return {
            x: size / 2 + (worldX - state.shipX) * scale,
            y: size / 2 + (worldY - state.shipY) * scale,
        };
    }

    function drawMinimap(now) {
        const size = minimapSize();
        const scale = minimapWorldScale();
        const mark = size / MINIMAP_SIZE;
        miniCtx.clearRect(0, 0, size, size);
        miniCtx.save();
        miniCtx.beginPath();
        miniCtx.roundRect(0, 0, size, size, 20 * mark);
        miniCtx.clip();

        miniCtx.fillStyle = "#000000";
        miniCtx.fillRect(0, 0, size, size);

        const origin = toMinimap(0, 0, size, scale);
        const worldPx = state.world * scale;
        miniCtx.fillStyle = "#0a0830";
        miniCtx.fillRect(origin.x, origin.y, worldPx, worldPx);

        miniCtx.strokeStyle = "#000000";
        miniCtx.lineWidth = Math.max(1, 2 * mark);
        miniCtx.strokeRect(origin.x, origin.y, worldPx, worldPx);

        for (const ball of state.balls) {
            const p = toMinimap(ball.x, ball.y, size, scale);
            const r = Math.max(2.2 * mark, ball.r * scale);
            if (p.x < -r || p.y < -r || p.x > size + r || p.y > size + r) continue;
            miniCtx.globalAlpha = ballPulse(ball, now);
            miniCtx.fillStyle = ball.color;
            miniCtx.beginPath();
            miniCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
            miniCtx.fill();
            miniCtx.globalAlpha = 1;
        }

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

        miniCtx.strokeStyle = "rgba(170, 200, 255, 0.4)";
        miniCtx.lineWidth = 1;
        miniCtx.beginPath();
        miniCtx.arc(cx, cy, 11 * mark, 0, Math.PI * 2);
        miniCtx.stroke();

        miniCtx.restore();
    }

    let last = performance.now();
    let lastPlaySave = 0;
    function frame(now) {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;

        const moving = state.menuOpen || state.won ? false : moveShip(dt);
        if (!state.menuOpen && !state.won) collectIfHit();
        updateEngine(moving);
        const cam = camera();

        drawSpace(cam);
        for (const ball of state.balls) drawBall(ball, cam, now);
        drawPops(cam, dt);
        drawFloaters(cam, dt);
        drawShip(moving);
        drawMinimap(now);
        updateTimer(now);
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;
        if (!state.menuOpen && now - lastPlaySave > 1000) {
            lastPlaySave = now;
            savePlay();
        }

        requestAnimationFrame(frame);
    }

    const boostHold = { pointer: false, space: false };

    function syncBoost() {
        const on = !state.menuOpen && !state.won && (boostHold.pointer || boostHold.space);
        state.boost = on;
        const button = document.getElementById("boost-btn");
        button.classList.toggle("is-on", on);
        button.setAttribute("aria-pressed", on ? "true" : "false");
        fadeEngineRate();
    }

    function bindKeys() {
        window.addEventListener("keydown", (event) => {
            unlockEngine();
            if (state.menuOpen || state.won) return;
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
            if (state.menuOpen || state.won) return;
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
        state.balls = [];
        state.pops = [];
        state.floaters = [];
        state.found = 0;
        state.score = 0;
        state.won = false;
        keys.clear();
        resetStick();
        winOverlay.classList.add("hidden");
        spawnBalls(state.ballCount);
        resetTimer(performance.now(), !state.menuOpen && !state.won);
        updateHud();
        savePlay();
    }

    function openMenu() {
        if (state.menuOpen) return;
        state.menuOpen = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        settingsMenu.classList.remove("hidden");
        document.documentElement.classList.add("settings-open");
        document.body.classList.add("settings-open");
        settingsMenu.scrollTop = 0;
        syncBoost();
        savePlay();
    }

    function closeMenu() {
        if (!state.menuOpen) return;
        state.menuOpen = false;
        settingsMenu.classList.add("hidden");
        document.documentElement.classList.remove("settings-open");
        document.body.classList.remove("settings-open");
        if (!state.won) resumeTimer(performance.now());
        savePlay();
    }

    function bindHud() {
        document.getElementById("open-settings").addEventListener("click", openMenu);

        const boostBtn = document.getElementById("boost-btn");
        boostBtn.addEventListener("pointerdown", (event) => {
            unlockEngine();
            if (state.menuOpen || state.won) return;
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
            saveSettings();
            updateHud();
            maybeWin();
        });

        for (const button of document.querySelectorAll(".world-btn")) {
            button.addEventListener("click", () => {
                const next = Number(button.dataset.world);
                if (next === state.world) return;
                state.world = next;
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
                const colors = PALETTES[next];
                for (const ball of state.balls) ball.color = pick(colors);
                saveSettings();
                savePlay();
                updateHud();
            });
        }

        for (const button of document.querySelectorAll(".ship-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.ship;
                if (!SHIP_IDS.includes(next) || next === state.ship) return;
                state.ship = next;
                loadShipImage(next);
                saveSettings();
                updateHud();
            });
        }

        document.getElementById("settings-restart").addEventListener("click", () => {
            restartGame();
            closeMenu();
        });

        document.getElementById("settings-close").addEventListener("click", closeMenu);
        document.getElementById("settings-continue").addEventListener("click", closeMenu);

        document.getElementById("win-restart").addEventListener("click", () => {
            restartGame();
        });
    }

    function preventBrowserGestures() {
        document.addEventListener("touchmove", (event) => {
            if (state.menuOpen || event.target.closest("#settings-menu")) return;
            event.preventDefault();
        }, { passive: false });
        document.addEventListener("gesturestart", (event) => event.preventDefault());
        document.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    function restorePlay() {
        const play = loadPlay();
        if (!play) {
            spawnBalls(state.ballCount);
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
        timer.elapsed = play.elapsed;
        timer.runningSince = play.won ? null : performance.now();
        shownSecond = -1;
        if (play.won) {
            if (winScoreEl) winScoreEl.textContent = state.score.toLocaleString();
            winMessage.textContent = `Goal ${state.goal} · ${formatPlayTime(play.elapsed)}`;
            winOverlay.classList.remove("hidden");
        }
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
    window.addEventListener("resize", resize);
    window.addEventListener("pagehide", savePlay);
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") savePlay();
    });
    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }
    requestAnimationFrame(frame);
})();
