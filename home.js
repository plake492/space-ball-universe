(() => {
    const START_BALLS = 75;
    const START_GOAL = 75;
    const GOAL_MIN = 5;
    const GOAL_STEP = 5;
    const BALLS_MIN = 25;
    const BALLS_MAX = 1000;
    const SPIKE_RATE = 0.15;
    const SPIKE_COUNT_MAX = 1000;
    const METEOR_COUNT_MAX = 20;
    const COMET_COUNT_MAX = 300;
    const NEUTRON_PAIR_MAX = 20;
    const START_WORLD = 20000;
    const WORLD_SIZES = [5000, 10000, 15000, 20000];
    const ZOOM_MIN = 1;
    const ZOOM_MAX = 5;
    const ZOOM_STEP = 0.5;
    const TRIAL_MS = [60000, 300000, 600000];
    const DIFFICULTIES = {
        easy: { world: 5000, ballCount: 40, goal: 25 },
        medium: { world: 10000, ballCount: 60, goal: 45 },
        hard: { world: 15000, ballCount: 90, goal: 75 },
        extra: { world: 20000, ballCount: 120, goal: 110 },
        extreme: { world: 20000, ballCount: 150, goal: 150 },
    };
    const SETTINGS_KEY = "harlie-space-settings";
    const PLAY_KEY = "harlie-space-play";
    const BOARD_KEY = "harlie-space-board";
    const BOARD_MAX = 25;
    const NAME_MAX = 20;
    const PALETTE_NAMES = ["rainbow", "space", "dark"];
    const SKY_NAMES = ["stars", "galaxies"];
    const GALAXY_TINTS = [
        { r: 210, g: 176, b: 255 },
        { r: 110, g: 168, b: 255 },
        { r: 255, g: 168, b: 132 },
        { r: 150, g: 220, b: 255 },
        { r: 255, g: 206, b: 140 },
        { r: 200, g: 130, b: 220 },
    ];
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
    const CLASSIC_SHIP_SVG = `<svg viewBox="0 0 32 40" aria-hidden="true"><path fill="#dce7ff" d="M16 2 30 34 16 26 2 34Z"/><ellipse fill="#6aa2ff" cx="16" cy="18" rx="4" ry="5.5"/></svg>`;
    const SHIP_COST_START = 5000;
    const SHIP_COST_GROW = 1.5;

    const settingsMenu = document.getElementById("settings-menu");
    const nameInput = document.getElementById("username-input");
    const lifetimeEl = document.getElementById("lifetime-points");
    const ballsSlider = document.getElementById("balls-slider");
    const ballsSliderValue = document.getElementById("balls-slider-value");
    const goalSlider = document.getElementById("goal-slider");
    const goalSliderValue = document.getElementById("goal-slider-value");
    const volumeSlider = document.getElementById("volume-slider");
    const volumeSliderValue = document.getElementById("volume-slider-value");
    const zoomSlider = document.getElementById("zoom-slider");
    const zoomSliderValue = document.getElementById("zoom-slider-value");
    const meteorSlider = document.getElementById("meteor-slider");
    const meteorSliderValue = document.getElementById("meteor-slider-value");
    const spikesSlider = document.getElementById("spikes-slider");
    const spikesSliderValue = document.getElementById("spikes-slider-value");
    const cometSlider = document.getElementById("comet-slider");
    const cometSliderValue = document.getElementById("comet-slider-value");
    const neutronSlider = document.getElementById("neutron-slider");
    const neutronSliderValue = document.getElementById("neutron-slider-value");
    const boardOverlay = document.getElementById("board-overlay");
    const boardTable = document.getElementById("board-table");
    const boardList = document.getElementById("board-list");
    const boardEmpty = document.getElementById("board-empty");
    const continueBtn = document.getElementById("home-continue");
    const homeSub = document.getElementById("home-sub");
    const homeUser = document.getElementById("home-user");
    const homeLifetime = document.getElementById("home-lifetime");
    const homeShips = document.getElementById("home-ships");
    const homeShipsIcon = document.getElementById("home-ships-icon");
    const shipsOverlay = document.getElementById("ships-overlay");
    const homeDiffBalls = document.getElementById("home-diff-balls");
    const homeDiffGoal = document.getElementById("home-diff-goal");
    const homeDiffWorld = document.getElementById("home-diff-world");

    const state = {
        world: START_WORLD,
        ballCount: START_BALLS,
        goal: START_GOAL,
        palette: "space",
        pulse: false,
        nebula: true,
        starDrift: true,
        sky: "stars",
        ship: "classic",
        name: "",
        lifetime: 0,
        reqShips: true,
        menuOpen: false,
        boardOpen: false,
        boardFrom: "home",
        settingsPanel: "",
        difficulty: "",
        trial: false,
        trialMs: 300000,
        audio: true,
        volume: 100,
        spikes: true,
        meteorOn: true,
        meteorCount: 1,
        spikeBalls: Math.round(START_BALLS * SPIKE_RATE),
        cometCount: 0,
        neutronPairs: 5,
        infiniteFuel: false,
        zoom: 1,
    };

    function snapStep(value, min, max, step) {
        const snapped = Math.round(value / step) * step;
        return Math.min(max, Math.max(min, snapped));
    }

    function clampVolume(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100;
    }

    function hash2(x, y) {
        const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
        return n - Math.floor(n);
    }

    const homeSky = {
        canvas: null,
        ctx: null,
        back: null,
        stars: [],
        galaxies: [],
        width: 0,
        height: 0,
        last: 0,
        frame: 0,
        running: false,
    };

    function buildHomeStars(width, height) {
        const stars = [];
        const sparse = state.sky === "galaxies";
        const cell = sparse ? 168 : 72;
        const cols = Math.ceil(width / cell) + 1;
        const rows = Math.ceil(height / cell) + 1;
        const heading = -0.35;
        for (let gy = 0; gy < rows; gy += 1) {
            for (let gx = 0; gx < cols; gx += 1) {
                const count = sparse
                    ? (hash2(gx + 3.1, gy + 8.4) > 0.58 ? 1 : 0)
                    : 1 + Math.floor(hash2(gx + 3.1, gy + 8.4) * 2);
                for (let i = 0; i < count; i += 1) {
                    const depth = hash2(gx * 2.7, gy + i * 5.1);
                    const speed = 3.5 + depth * 18;
                    const turn = heading + (hash2(i + gx, gy * 4.2) - 0.5) * 0.7;
                    stars.push({
                        x: gx * cell + hash2(gx + i * 19.1, gy + 7.3) * cell,
                        y: gy * cell + hash2(gx + 4.8, gy + i * 13.7) * cell,
                        vx: Math.cos(turn) * speed,
                        vy: Math.sin(turn) * speed,
                        size: 0.45 + depth * 2.1,
                        alpha: 0.28 + depth * 0.62,
                    });
                }
            }
        }
        return stars;
    }

    function paintGalaxySprite(galaxy) {
        if (galaxy.sprite) return galaxy.sprite;
        const dim = 280;
        const canvas = document.createElement("canvas");
        canvas.width = dim;
        canvas.height = dim;
        const g = canvas.getContext("2d");
        const mid = dim / 2;
        const r = dim * 0.46;
        const { r: cr, g: cg, b: cb } = galaxy.tint;
        g.translate(mid, mid);
        g.globalCompositeOperation = "lighter";
        const halo = g.createRadialGradient(0, 0, 0, 0, 0, r);
        halo.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.2)`);
        halo.addColorStop(0.42, `rgba(${cr}, ${cg}, ${cb}, 0.08)`);
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
                const alpha = 0.17 * (1 - t * 0.5);
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
        core.addColorStop(0, "rgba(255, 255, 255, 0.95)");
        core.addColorStop(0.32, `rgba(${cr}, ${cg}, ${cb}, 0.55)`);
        core.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        g.fillStyle = core;
        g.beginPath();
        g.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        g.fill();
        galaxy.sprite = canvas;
        return canvas;
    }

    function buildHomeGalaxies(width, height) {
        if (state.sky !== "galaxies") return [];
        const galaxies = [];
        const count = 3;
        const minR = Math.min(width, height) * 0.22;
        const maxR = Math.min(width, height) * 0.38;
        for (let i = 0; i < count; i += 1) {
            const r = minR + hash2(i + 2.2, 9.1) * (maxR - minR);
            let x = 0;
            let y = 0;
            let attempts = 0;
            do {
                x = r + hash2(i * 11.3 + attempts, 4.8) * (width - r * 2);
                y = r + hash2(i * 7.7 + attempts, 13.2) * (height - r * 2);
                attempts += 1;
            } while (
                attempts < 40
                && galaxies.some((galaxy) => Math.hypot(x - galaxy.x, y - galaxy.y) < r + galaxy.r * 1.35)
            );
            galaxies.push({
                x,
                y,
                r,
                tilt: hash2(i, 1.4) * Math.PI * 2,
                flat: 0.24 + hash2(i, 3.8) * 0.62,
                spin: (0.032 + hash2(i, 6.1) * 0.05) * (hash2(i, 8.9) < 0.5 ? -1 : 1),
                phase: hash2(i, 12.4) * Math.PI * 2,
                arms: 2 + Math.floor(hash2(i, 15.2) * 2),
                wind: 3.1 + hash2(i, 18.6) * 2.3,
                tint: GALAXY_TINTS[Math.floor(hash2(i, 21.7) * GALAXY_TINTS.length)],
                sprite: null,
            });
        }
        return galaxies;
    }

    function drawHomeGalaxies(now) {
        const ctx = homeSky.ctx;
        if (!ctx || state.sky !== "galaxies") return;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const galaxy of homeSky.galaxies) {
            const sprite = paintGalaxySprite(galaxy);
            ctx.save();
            ctx.translate(galaxy.x, galaxy.y);
            ctx.rotate(galaxy.tilt);
            ctx.scale(1, galaxy.flat);
            ctx.rotate(galaxy.phase + now * 0.001 * galaxy.spin);
            ctx.drawImage(sprite, -galaxy.r, -galaxy.r, galaxy.r * 2, galaxy.r * 2);
            ctx.restore();
        }
        ctx.restore();
    }

    function skyAnimating() {
        return state.starDrift || state.sky === "galaxies";
    }

    function paintHomeBackdrop(width, height) {
        const back = document.createElement("canvas");
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        back.width = Math.floor(width * dpr);
        back.height = Math.floor(height * dpr);
        const ctx = back.getContext("2d");
        if (!ctx) return null;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const sky = ctx.createLinearGradient(0, 0, 0, height);
        sky.addColorStop(0, "#050217");
        sky.addColorStop(0.55, "#0a0830");
        sky.addColorStop(1, "#07051c");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, width, height);
        if (state.nebula) {
            const washes = [
                { x: width * 0.18, y: height * 0.22, r: Math.max(width, height) * 0.55, color: "90, 40, 140", a: 0.22 },
                { x: width * 0.82, y: height * 0.7, r: Math.max(width, height) * 0.48, color: "20, 90, 170", a: 0.16 },
                { x: width * 0.62, y: height * 0.18, r: Math.max(width, height) * 0.32, color: "180, 60, 130", a: 0.1 },
            ];
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            for (const wash of washes) {
                const g = ctx.createRadialGradient(wash.x, wash.y, 0, wash.x, wash.y, wash.r);
                g.addColorStop(0, `rgba(${wash.color}, ${wash.a})`);
                g.addColorStop(0.45, `rgba(${wash.color}, ${wash.a * 0.35})`);
                g.addColorStop(1, `rgba(${wash.color}, 0)`);
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(wash.x, wash.y, wash.r, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
        return back;
    }

    function paintHomeSky() {
        const canvas = document.getElementById("home-sky");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const view = document.documentElement;
        const width = view.clientWidth || window.innerWidth;
        const height = view.clientHeight || window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        homeSky.canvas = canvas;
        homeSky.ctx = ctx;
        homeSky.width = width;
        homeSky.height = height;
        homeSky.back = paintHomeBackdrop(width, height);
        homeSky.stars = buildHomeStars(width, height);
        homeSky.galaxies = buildHomeGalaxies(width, height);
        homeSky.last = 0;
        if (!skyAnimating()) {
            homeSky.running = false;
            if (homeSky.frame) cancelAnimationFrame(homeSky.frame);
            homeSky.frame = 0;
            drawHomeStars(0, performance.now());
            return;
        }
        if (!homeSky.running) {
            homeSky.running = true;
            homeSky.frame = requestAnimationFrame(tickHomeSky);
        }
    }

    function drawHomeStars(dt, now) {
        const ctx = homeSky.ctx;
        if (!ctx) return;
        const width = homeSky.width;
        const height = homeSky.height;
        if (homeSky.back) ctx.drawImage(homeSky.back, 0, 0, width, height);
        else {
            ctx.fillStyle = "#050217";
            ctx.fillRect(0, 0, width, height);
        }
        drawHomeGalaxies(now || 0);
        for (const star of homeSky.stars) {
            if (dt && state.starDrift) {
                star.x += star.vx * dt;
                star.y += star.vy * dt;
                if (star.x < -4) star.x = width + 4;
                else if (star.x > width + 4) star.x = -4;
                if (star.y < -4) star.y = height + 4;
                else if (star.y > height + 4) star.y = -4;
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function tickHomeSky(now) {
        const ctx = homeSky.ctx;
        if (!ctx || !skyAnimating()) {
            homeSky.running = false;
            return;
        }
        homeSky.frame = requestAnimationFrame(tickHomeSky);
        if (document.hidden) {
            homeSky.last = 0;
            return;
        }
        const dt = homeSky.last ? Math.min(0.05, (now - homeSky.last) / 1000) : 0;
        homeSky.last = now;
        drawHomeStars(dt, now);
    }

    function clampZoom(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return 1;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(n / ZOOM_STEP) * ZOOM_STEP));
    }

    function clampMeteorCount(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(METEOR_COUNT_MAX, Math.max(0, n)) : 1;
    }

    function clampSpikeBalls(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(SPIKE_COUNT_MAX, Math.max(0, n)) : Math.round(START_BALLS * SPIKE_RATE);
    }

    function defaultNeutronPairs(world) {
        if (world >= 20000) return 5;
        if (world >= 15000) return 4;
        if (world >= 10000) return 3;
        return 2;
    }

    function clampCometCount(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(COMET_COUNT_MAX, Math.max(0, n)) : 0;
    }

    function clampNeutronPairs(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(NEUTRON_PAIR_MAX, Math.max(0, n)) : defaultNeutronPairs(START_WORLD);
    }

    function rangeValueFromClientX(el, clientX) {
        const min = Number(el.min);
        const max = Number(el.max);
        const step = Number(el.step);
        const lo = Number.isFinite(min) ? min : 0;
        const hi = Number.isFinite(max) ? max : 100;
        const inc = Number.isFinite(step) && step > 0 ? step : 1;
        const rect = el.getBoundingClientRect();
        const pad = Math.min(16, rect.width / 4);
        const usable = Math.max(1, rect.width - pad * 2);
        const t = (clientX - (rect.left + pad)) / usable;
        const raw = lo + Math.min(1, Math.max(0, t)) * (hi - lo);
        const snapped = lo + Math.round((raw - lo) / inc) * inc;
        const places = (String(inc).split(".")[1] || "").length;
        return Number(Math.min(hi, Math.max(lo, snapped)).toFixed(places));
    }

    function bindFineRangeInputs() {
        for (const el of document.querySelectorAll("input[type='range']")) {
            if (el.dataset.fineRange === "1") continue;
            el.dataset.fineRange = "1";
            let dragging = false;
            let pointerId = null;

            const pointX = (event) => {
                if (event.clientX != null) return event.clientX;
                const touch = event.changedTouches?.[0] || event.touches?.[0];
                return touch ? touch.clientX : null;
            };

            const apply = (event) => {
                const x = pointX(event);
                if (x == null) return;
                const next = String(rangeValueFromClientX(el, x));
                if (el.value === next) return;
                el.value = next;
                el.dispatchEvent(new Event("input", { bubbles: true }));
            };

            const finish = (event) => {
                if (!dragging) return;
                if (pointerId != null && event.pointerId != null && event.pointerId !== pointerId) return;
                dragging = false;
                pointerId = null;
                apply(event);
                el.dispatchEvent(new Event("change", { bubbles: true }));
            };

            el.addEventListener("pointerdown", (event) => {
                if (event.pointerType === "mouse" && event.button !== 0) return;
                dragging = true;
                pointerId = event.pointerId;
                try { el.setPointerCapture(event.pointerId); } catch (_) {}
                apply(event);
                event.preventDefault();
            });
            el.addEventListener("pointermove", (event) => {
                if (!dragging || event.pointerId !== pointerId) return;
                apply(event);
                event.preventDefault();
            });
            el.addEventListener("pointerup", finish);
            el.addEventListener("pointercancel", finish);
            el.addEventListener("touchstart", (event) => {
                dragging = true;
                apply(event);
                event.preventDefault();
            }, { passive: false });
            el.addEventListener("touchmove", (event) => {
                if (!dragging) return;
                apply(event);
                event.preventDefault();
            }, { passive: false });
            el.addEventListener("touchend", finish);
            el.addEventListener("touchcancel", finish);
        }
    }

    function isCustomGame() {
        return state.difficulty === "custom";
    }

    function syncHazardFlags() {
        if (!isCustomGame()) return;
        state.meteorOn = state.meteorCount > 0;
        state.spikes = state.spikeBalls > 0;
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

    function shipUnlocked(id) {
        if (!state.reqShips) return true;
        return state.lifetime >= shipUnlockAt(id);
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

    function worldLabel(world) {
        if (world >= 20000) return "xl";
        if (world >= 15000) return "lg";
        if (world >= 10000) return "md";
        return "sm";
    }

    function updateDiffRules() {
        const preset = DIFFICULTIES[state.difficulty] || {
            world: state.world,
            ballCount: state.ballCount,
            goal: state.goal,
        };
        if (homeDiffBalls) homeDiffBalls.textContent = String(preset.ballCount);
        if (homeDiffGoal) homeDiffGoal.textContent = String(preset.goal);
        if (homeDiffWorld) homeDiffWorld.textContent = worldLabel(preset.world);
    }

    function applyDifficulty(id) {
        if (id === "custom") {
            state.difficulty = "custom";
            saveSettings();
            updateHud();
            showSettingsPanel("game");
            setMenuOpen(true);
            return;
        }
        const preset = DIFFICULTIES[id];
        if (!preset) return;
        state.difficulty = id;
        state.world = preset.world;
        state.ballCount = preset.ballCount;
        state.goal = preset.goal;
        state.spikes = true;
        state.meteorOn = true;
        saveSettings();
        updateHud();
    }

    function formatPlayTime(ms) {
        const total = Math.floor(ms / 1000);
        const hours = Math.floor(total / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;
        const sec = String(seconds).padStart(2, "0");
        if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${sec}`;
        return `${minutes}:${sec}`;
    }

    function formatBoardDate(at) {
        const date = new Date(Number(at) || 0);
        if (!Number.isFinite(date.getTime()) || date.getTime() <= 0) return "—";
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
    }

    function loadSettings() {
        try {
            const data = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "");
            state.world = WORLD_SIZES.includes(Number(data.world)) ? Number(data.world) : START_WORLD;
            state.ballCount = snapStep(Number(data.ballCount) || START_BALLS, BALLS_MIN, BALLS_MAX, GOAL_STEP);
            state.goal = snapStep(Number(data.goal) || START_GOAL, GOAL_MIN, state.ballCount, GOAL_STEP);
            state.palette = PALETTE_NAMES.includes(data.palette) ? data.palette : "space";
            state.pulse = data.pulse === true;
            state.nebula = data.nebula !== false;
            state.starDrift = data.starDrift !== false;
            state.sky = SKY_NAMES.includes(data.sky) ? data.sky : "stars";
            state.lifetime = Math.max(0, Math.round(Number(data.lifetime) || 0));
            state.reqShips = data.reqShips !== false;
            const wanted = SHIP_IDS.includes(data.ship) ? data.ship : "classic";
            state.ship = shipUnlocked(wanted) ? wanted : "classic";
            state.name = normalizeName(data.name);
            if (data.difficulty === "custom") {
                state.difficulty = "custom";
            } else if (DIFFICULTIES[data.difficulty]) {
                const preset = DIFFICULTIES[data.difficulty];
                state.difficulty = data.difficulty;
                state.world = preset.world;
                state.ballCount = preset.ballCount;
                state.goal = preset.goal;
            } else {
                state.difficulty = matchingDifficulty();
            }
            state.trial = data.trial === true;
            state.trialMs = TRIAL_MS.includes(Number(data.trialMs)) ? Number(data.trialMs) : 300000;
            state.audio = data.audio !== false;
            state.volume = data.volume == null ? 100 : clampVolume(data.volume);
            state.spikes = data.spikes !== false;
            state.meteorOn = data.meteorOn !== false;
            state.meteorCount = data.meteorCount == null
                ? (state.meteorOn ? 1 : 0)
                : clampMeteorCount(data.meteorCount);
            state.spikeBalls = data.spikeBalls == null
                ? (state.spikes ? Math.round(state.ballCount * SPIKE_RATE) : 0)
                : clampSpikeBalls(data.spikeBalls);
            state.cometCount = data.cometCount == null ? 0 : clampCometCount(data.cometCount);
            state.neutronPairs = data.neutronPairs == null
                ? defaultNeutronPairs(state.world)
                : clampNeutronPairs(data.neutronPairs);
            if (state.difficulty === "custom") {
                state.meteorOn = state.meteorCount > 0;
                state.spikes = state.spikeBalls > 0;
            }
            state.infiniteFuel = data.infiniteFuel === true;
            state.zoom = clampZoom(data.zoom == null ? 1 : data.zoom);
        } catch {
            // Keep defaults.
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
                meteorCount: state.meteorCount,
                spikeBalls: state.spikeBalls,
                cometCount: state.cometCount,
                neutronPairs: state.neutronPairs,
                infiniteFuel: state.infiniteFuel,
                zoom: state.zoom,
            }));
        } catch {
            // Ignore quota or private-mode failures.
        }
    }

    function loadPlayPreview() {
        try {
            const data = JSON.parse(localStorage.getItem(PLAY_KEY) || "");
            if (!data) return null;
            return {
                world: Number(data.world),
                ballCount: Number(data.ballCount),
                found: Math.max(0, Math.round(Number(data.found) || 0)),
                score: Math.max(0, Math.round(Number(data.score) || 0)),
                elapsed: Math.max(0, Number(data.elapsed) || 0),
                won: Boolean(data.won),
                trial: Boolean(data.trial),
                trialMs: Number(data.trialMs) || 0,
                spikes: data.spikes !== false,
                meteorOn: data.meteorOn !== false,
                meteorCount: data.meteorCount == null ? null : Number(data.meteorCount),
                spikeBalls: data.spikeBalls == null ? null : Number(data.spikeBalls),
                cometCount: data.cometCount == null ? null : Number(data.cometCount),
                neutronPairs: data.neutronPairs == null ? null : Number(data.neutronPairs),
                infiniteFuel: data.infiniteFuel === true,
            };
        } catch {
            return null;
        }
    }

    function playIsActive(play) {
        return Boolean(play && !play.won && (play.found > 0 || play.score > 0 || play.elapsed >= 2500));
    }

    function canContinue() {
        const play = loadPlayPreview();
        return Boolean(
            play
            && play.world === state.world
            && play.ballCount === state.ballCount
            && play.trial === state.trial
            && (!state.trial || play.trialMs === state.trialMs)
            && play.spikes === state.spikes
            && play.meteorOn === state.meteorOn
            && (play.meteorCount == null || play.meteorCount === state.meteorCount)
            && (play.spikeBalls == null || play.spikeBalls === state.spikeBalls)
            && (play.cometCount == null || play.cometCount === state.cometCount)
            && (play.neutronPairs == null || play.neutronPairs === state.neutronPairs)
            && play.infiniteFuel === state.infiniteFuel
            && playIsActive(play)
        );
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
                rows.push({ name, score, elapsed, at: Number(row && row.at) || 0 });
            }
            rows.sort((a, b) => b.score - a.score || a.elapsed - b.elapsed || b.at - a.at);
            return rows.slice(0, BOARD_MAX);
        } catch {
            return [];
        }
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
        const body = settingsMenu && settingsMenu.querySelector(".settings-body");
        if (body) body.scrollTop = 0;
    }

    function setMenuOpen(open) {
        state.menuOpen = open;
        settingsMenu.classList.toggle("hidden", !open);
        document.documentElement.classList.toggle("settings-open", open);
        document.body.classList.toggle("settings-open", open);
        if (open) {
            const body = settingsMenu.querySelector(".settings-body");
            if (body) body.scrollTop = 0;
        }
    }

    function updateHome() {
        const play = canContinue() ? loadPlayPreview() : null;
        continueBtn.disabled = !play;
        continueBtn.setAttribute("aria-disabled", play ? "false" : "true");
        if (play) {
            const clock = state.trial
                ? formatPlayTime(Math.max(0, state.trialMs - play.elapsed))
                : formatPlayTime(play.elapsed);
            homeSub.textContent = `${play.found} / ${state.goal} · ${play.score.toLocaleString()} · ${clock}`;
        } else {
            homeSub.textContent = "Ready to fly.";
        }
    }

    function updateHud() {
        if (lifetimeEl) lifetimeEl.textContent = state.lifetime.toLocaleString();
        if (nameInput && document.activeElement !== nameInput) nameInput.value = state.name;
        if (homeUser) homeUser.textContent = state.name || "Pilot";
        if (homeLifetime) homeLifetime.textContent = state.lifetime.toLocaleString();
        if (homeShipsIcon) {
            const src = SHIP_SRC[state.ship];
            if (src) {
                let img = homeShipsIcon.querySelector("img");
                if (!img) {
                    homeShipsIcon.replaceChildren();
                    img = document.createElement("img");
                    img.alt = "";
                    homeShipsIcon.append(img);
                }
                if (img.getAttribute("src") !== src) img.src = src;
            } else if (!homeShipsIcon.querySelector("svg")) {
                homeShipsIcon.innerHTML = CLASSIC_SHIP_SVG;
            }
        }
        ballsSlider.value = String(state.ballCount);
        ballsSliderValue.textContent = String(state.ballCount);
        goalSlider.min = String(GOAL_MIN);
        goalSlider.max = String(state.ballCount);
        goalSlider.step = String(GOAL_STEP);
        goalSlider.value = String(state.goal);
        goalSliderValue.textContent = String(state.goal);
        for (const button of document.querySelectorAll(".world-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.world) === state.world);
        }
        for (const button of document.querySelectorAll(".diff-btn")) {
            button.classList.toggle("is-on", button.dataset.diff === state.difficulty);
        }
        const trialToggle = document.getElementById("trial-toggle");
        const trialTimes = document.getElementById("trial-times");
        if (trialToggle) {
            trialToggle.classList.toggle("is-on", state.trial);
            trialToggle.setAttribute("aria-pressed", state.trial ? "true" : "false");
        }
        if (trialTimes) trialTimes.classList.toggle("hidden", !state.trial);
        for (const button of document.querySelectorAll(".trial-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.trial) === state.trialMs);
        }
        updateDiffRules();
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
        const fullscreenOn = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
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
        const custom = isCustomGame();
        for (const el of document.querySelectorAll(".custom-only")) el.classList.toggle("hidden", !custom);
        for (const el of document.querySelectorAll(".preset-only")) el.classList.toggle("hidden", custom);
        if (meteorSlider) meteorSlider.value = String(state.meteorCount);
        if (meteorSliderValue) meteorSliderValue.textContent = String(state.meteorCount);
        if (spikesSlider) spikesSlider.value = String(state.spikeBalls);
        if (spikesSliderValue) spikesSliderValue.textContent = String(state.spikeBalls);
        if (cometSlider) cometSlider.value = String(state.cometCount);
        if (cometSliderValue) cometSliderValue.textContent = String(state.cometCount);
        if (neutronSlider) neutronSlider.value = String(state.neutronPairs);
        if (neutronSliderValue) neutronSliderValue.textContent = String(state.neutronPairs);
        for (const button of document.querySelectorAll(".fuel-btn")) {
            button.classList.toggle("is-on", (button.dataset.fuel === "on") === state.infiniteFuel);
        }
        if (volumeSlider) volumeSlider.value = String(state.volume);
        if (volumeSliderValue) volumeSliderValue.textContent = String(state.volume);
        if (zoomSlider) zoomSlider.value = String(state.zoom);
        if (zoomSliderValue) zoomSliderValue.textContent = `${state.zoom}×`;
        updateHome();
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
            const cells = [String(index + 1), row.name, row.score.toLocaleString(), formatPlayTime(row.elapsed), formatBoardDate(row.at)];
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
        state.boardFrom = from;
        state.boardOpen = true;
        renderBoard();
        if (from === "settings") setMenuOpen(false);
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
        if (from === "settings") {
            setMenuOpen(true);
            showSettingsPanel(state.settingsPanel || "user");
        }
    }

    function setFullscreen(on) {
        const root = document.documentElement;
        const full = document.fullscreenElement || document.webkitFullscreenElement;
        const action = on && !full
            ? (root.requestFullscreen ? root.requestFullscreen() : root.webkitRequestFullscreen())
            : !on && full
                ? (document.exitFullscreen ? document.exitFullscreen() : document.webkitExitFullscreen())
                : Promise.resolve();
        Promise.resolve(action).catch(() => {}).finally(updateHud);
    }

    function fillShipsModal() {
        const dest = document.getElementById("ships-choices");
        const source = document.querySelector("#settings-menu .ship-choices");
        if (!dest || !source || dest.childElementCount) return;
        dest.replaceChildren(...[...source.querySelectorAll(".ship-btn")].map((btn) => btn.cloneNode(true)));
    }

    function setShipsOpen(open) {
        if (shipsOverlay) shipsOverlay.classList.toggle("hidden", !open);
    }

    loadSettings();
    fillShipsModal();
    paintHomeSky();
    updateHud();
    window.addEventListener("resize", paintHomeSky);
    window.addEventListener("orientationchange", paintHomeSky);

    document.getElementById("home-continue").addEventListener("click", () => {
        if (!canContinue()) return;
        location.href = "./game.html?mode=continue";
    });
    document.getElementById("home-new").addEventListener("click", () => {
        location.href = "./game.html?mode=new";
    });
    document.getElementById("home-playground").addEventListener("click", () => {
        location.href = "./playground.html";
    });
    document.getElementById("home-settings").addEventListener("click", () => {
        showSettingsPanel("");
        setMenuOpen(true);
    });
    document.getElementById("home-board").addEventListener("click", () => openBoard("home"));
    document.getElementById("settings-close").addEventListener("click", () => setMenuOpen(false));
    document.getElementById("settings-continue").addEventListener("click", () => setMenuOpen(false));
    document.getElementById("settings-back").addEventListener("click", () => showSettingsPanel(""));
    for (const button of document.querySelectorAll(".settings-cat")) {
        button.addEventListener("click", () => showSettingsPanel(button.dataset.panel));
    }
    document.getElementById("settings-board").addEventListener("click", () => openBoard("settings"));
    const resetOverlay = document.getElementById("reset-overlay");
    const openReset = () => resetOverlay.classList.remove("hidden");
    if (homeShips) homeShips.addEventListener("click", () => setShipsOpen(true));
    const shipsClose = document.getElementById("ships-close");
    if (shipsClose) shipsClose.addEventListener("click", () => setShipsOpen(false));
    document.getElementById("settings-reset").addEventListener("click", openReset);
    document.getElementById("reset-cancel").addEventListener("click", () => resetOverlay.classList.add("hidden"));
    document.getElementById("reset-confirm").addEventListener("click", () => {
        state.lifetime = 0;
        state.ship = "classic";
        try {
            localStorage.removeItem(PLAY_KEY);
            localStorage.removeItem(BOARD_KEY);
        } catch {
            // Ignore private-mode failures.
        }
        saveSettings();
        resetOverlay.classList.add("hidden");
        updateHud();
    });
    document.getElementById("board-back").addEventListener("click", closeBoard);
    document.getElementById("board-close").addEventListener("click", closeBoard);

    const commitName = () => {
        const next = normalizeName(nameInput.value);
        nameInput.value = next;
        if (next === state.name) return;
        state.name = next;
        saveSettings();
    };
    nameInput.addEventListener("change", commitName);
    nameInput.addEventListener("blur", commitName);
    nameInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            nameInput.blur();
        }
    });

    ballsSlider.addEventListener("input", () => {
        ballsSliderValue.textContent = ballsSlider.value;
    });
    ballsSlider.addEventListener("change", () => {
        state.ballCount = Number(ballsSlider.value);
        state.goal = clampGoal(state.goal);
        state.difficulty = "custom";
        saveSettings();
        updateHud();
    });
    goalSlider.addEventListener("input", () => {
        goalSliderValue.textContent = goalSlider.value;
    });
    goalSlider.addEventListener("change", () => {
        state.goal = clampGoal(Number(goalSlider.value));
        state.difficulty = "custom";
        saveSettings();
        updateHud();
    });

    for (const button of document.querySelectorAll(".diff-btn")) {
        button.addEventListener("click", () => applyDifficulty(button.dataset.diff));
    }
    document.getElementById("trial-toggle").addEventListener("click", () => {
        state.trial = !state.trial;
        saveSettings();
        updateHud();
    });
    for (const button of document.querySelectorAll(".trial-btn")) {
        button.addEventListener("click", () => {
            const next = Number(button.dataset.trial);
            if (!TRIAL_MS.includes(next)) return;
            state.trial = true;
            state.trialMs = next;
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".world-btn")) {
        button.addEventListener("click", () => {
            const next = Number(button.dataset.world);
            if (!WORLD_SIZES.includes(next) || next === state.world) return;
            state.world = next;
            state.difficulty = "custom";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".palette-btn")) {
        button.addEventListener("click", () => {
            if (!PALETTE_NAMES.includes(button.dataset.palette)) return;
            state.palette = button.dataset.palette;
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".pulse-btn")) {
        button.addEventListener("click", () => {
            state.pulse = button.dataset.pulse === "on";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".nebula-btn")) {
        button.addEventListener("click", () => {
            state.nebula = button.dataset.nebula === "on";
            saveSettings();
            paintHomeSky();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".star-btn")) {
        button.addEventListener("click", () => {
            state.starDrift = button.dataset.stars === "on";
            saveSettings();
            paintHomeSky();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".sky-btn")) {
        button.addEventListener("click", () => {
            if (!SKY_NAMES.includes(button.dataset.sky)) return;
            state.sky = button.dataset.sky;
            saveSettings();
            paintHomeSky();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".audio-btn")) {
        button.addEventListener("click", () => {
            state.audio = button.dataset.audio === "on";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".spike-btn")) {
        button.addEventListener("click", () => {
            state.spikes = button.dataset.spikes === "on";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".meteor-btn")) {
        button.addEventListener("click", () => {
            state.meteorOn = button.dataset.meteor === "on";
            saveSettings();
            updateHud();
        });
    }
    if (meteorSlider) {
        meteorSlider.addEventListener("input", () => {
            if (meteorSliderValue) meteorSliderValue.textContent = meteorSlider.value;
        });
        meteorSlider.addEventListener("change", () => {
            state.meteorCount = clampMeteorCount(meteorSlider.value);
            state.difficulty = "custom";
            syncHazardFlags();
            saveSettings();
            updateHud();
        });
    }
    if (spikesSlider) {
        spikesSlider.addEventListener("input", () => {
            if (spikesSliderValue) spikesSliderValue.textContent = spikesSlider.value;
        });
        spikesSlider.addEventListener("change", () => {
            state.spikeBalls = clampSpikeBalls(spikesSlider.value);
            state.difficulty = "custom";
            syncHazardFlags();
            saveSettings();
            updateHud();
        });
    }
    if (cometSlider) {
        cometSlider.addEventListener("input", () => {
            if (cometSliderValue) cometSliderValue.textContent = cometSlider.value;
        });
        cometSlider.addEventListener("change", () => {
            state.cometCount = clampCometCount(cometSlider.value);
            state.difficulty = "custom";
            saveSettings();
            updateHud();
        });
    }
    if (neutronSlider) {
        neutronSlider.addEventListener("input", () => {
            if (neutronSliderValue) neutronSliderValue.textContent = neutronSlider.value;
        });
        neutronSlider.addEventListener("change", () => {
            state.neutronPairs = clampNeutronPairs(neutronSlider.value);
            state.difficulty = "custom";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".fuel-btn")) {
        button.addEventListener("click", () => {
            state.infiniteFuel = button.dataset.fuel === "on";
            saveSettings();
            updateHud();
        });
    }
    if (volumeSlider) {
        volumeSlider.addEventListener("input", () => {
            state.volume = clampVolume(volumeSlider.value);
            if (volumeSliderValue) volumeSliderValue.textContent = String(state.volume);
        });
        volumeSlider.addEventListener("change", () => {
            state.volume = clampVolume(volumeSlider.value);
            saveSettings();
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
    for (const button of document.querySelectorAll(".req-btn")) {
        button.addEventListener("click", () => {
            state.reqShips = button.dataset.req === "on";
            if (state.reqShips && !shipUnlocked(state.ship)) state.ship = "classic";
            saveSettings();
            updateHud();
        });
    }
    for (const button of document.querySelectorAll(".ship-btn")) {
        button.addEventListener("click", () => {
            const next = button.dataset.ship;
            if (!SHIP_IDS.includes(next) || next === state.ship || !shipUnlocked(next)) return;
            state.ship = next;
            saveSettings();
            updateHud();
            if (button.closest("#ships-overlay")) setShipsOpen(false);
        });
    }
    for (const button of document.querySelectorAll(".fullscreen-btn")) {
        button.addEventListener("click", () => setFullscreen(button.dataset.fullscreen === "on"));
    }
    document.addEventListener("fullscreenchange", updateHud);
    document.addEventListener("webkitfullscreenchange", updateHud);
    bindFineRangeInputs();

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }
})();
