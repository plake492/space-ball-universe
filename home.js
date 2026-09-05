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
    const SETTINGS_KEY = "harlie-space-settings";
    const PLAY_KEY = "harlie-space-play";
    const BOARD_KEY = "harlie-space-board";
    const BOARD_MAX = 25;
    const NAME_MAX = 20;
    const PALETTE_NAMES = ["rainbow", "space", "dark"];
    const SHIP_IDS = ["classic", "ship-1", "cat", "wolf", "cube", "hello-kitty", "ufo", "harlie", "selah", "guitar", "selah-harlie"];
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
        palette: "rainbow",
        pulse: true,
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
    };

    function snapStep(value, min, max, step) {
        const snapped = Math.round(value / step) * step;
        return Math.min(max, Math.max(min, snapped));
    }

    function clampVolume(value) {
        const n = Math.round(Number(value));
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 100;
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
            state.palette = PALETTE_NAMES.includes(data.palette) ? data.palette : "rainbow";
            state.pulse = data.pulse !== false;
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
                ship: state.ship,
                name: state.name,
                lifetime: state.lifetime,
                reqShips: state.reqShips,
                difficulty: state.difficulty || "",
                trial: state.trial,
                trialMs: state.trialMs,
                audio: state.audio,
                volume: state.volume,
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
        if (volumeSlider) volumeSlider.value = String(state.volume);
        if (volumeSliderValue) volumeSliderValue.textContent = String(state.volume);
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
    updateHud();

    document.getElementById("home-continue").addEventListener("click", () => {
        if (!canContinue()) return;
        location.href = "./game.html?mode=continue";
    });
    document.getElementById("home-new").addEventListener("click", () => {
        location.href = "./game.html?mode=new";
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
    for (const button of document.querySelectorAll(".audio-btn")) {
        button.addEventListener("click", () => {
            state.audio = button.dataset.audio === "on";
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

    if ("serviceWorker" in navigator) {
        window.addEventListener("load", () => {
            navigator.serviceWorker.register("./sw.js").catch(() => {});
        });
    }
})();
