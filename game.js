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
    const MINIMAP_SIZE = 240;
    const MINIMAP_SCALE = 0.1;
    const MIN_BALL = 25;
    const MAX_BALL = 150;
    const SHIP_RADIUS = 22;
    const SHIP_SPEED = 840;
    const SPAWN_CLEARANCE = 15;
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

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const minimap = document.getElementById("minimap");
    const miniCtx = minimap.getContext("2d");
    const foundEl = document.getElementById("found-count");
    const goalEl = document.getElementById("goal-count");
    const ballsLeftEl = document.getElementById("balls-left");
    const coordsEl = document.getElementById("coords");
    const timerEl = document.getElementById("play-timer");
    const ballsSlider = document.getElementById("balls-slider");
    const ballsSliderValue = document.getElementById("balls-slider-value");
    const goalSlider = document.getElementById("goal-slider");
    const goalSliderValue = document.getElementById("goal-slider-value");
    const settingsMenu = document.getElementById("settings-menu");
    const winOverlay = document.getElementById("win-overlay");
    const winMessage = document.getElementById("win-message");
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
            return { world, ballCount, goal, palette };
        } catch {
            return { world: START_WORLD, ballCount: START_BALLS, goal: START_GOAL, palette: "rainbow" };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify({
                world: state.world,
                ballCount: state.ballCount,
                goal: state.goal,
                palette: state.palette,
            }));
        } catch {
            // Ignore quota or private-mode failures.
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
        found: 0,
        ballCount: saved.ballCount,
        goal: saved.goal,
        palette: saved.palette,
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

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        state.width = window.innerWidth;
        state.height = window.innerHeight;
        state.dpr = dpr;
        canvas.width = Math.floor(state.width * dpr);
        canvas.height = Math.floor(state.height * dpr);
        canvas.style.width = `${state.width}px`;
        canvas.style.height = `${state.height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        minimap.width = Math.floor(MINIMAP_SIZE * dpr);
        minimap.height = Math.floor(MINIMAP_SIZE * dpr);
        minimap.style.width = `${MINIMAP_SIZE}px`;
        minimap.style.height = `${MINIMAP_SIZE}px`;
        miniCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnBalls(count) {
        for (let i = 0; i < count; i += 1) {
            const size = rand(MIN_BALL, MAX_BALL);
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
                color: pick(PALETTES[state.palette] || PALETTES.rainbow),
                pulseMs: rand(1000, 5000),
                pulseOffset: rand(0, Math.PI * 2),
            });
        }
    }

    function remaining() {
        return state.balls.length;
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
        goalEl.textContent = String(state.goal);
        ballsSlider.value = String(state.ballCount);
        ballsSliderValue.textContent = String(state.ballCount);
        syncGoalSlider();
        const n = remaining();
        ballsLeftEl.textContent = `${n} ball${n === 1 ? "" : "s"} in space`;
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;
        for (const button of document.querySelectorAll(".world-btn")) {
            button.classList.toggle("is-on", Number(button.dataset.world) === state.world);
        }
        for (const button of document.querySelectorAll(".palette-btn")) {
            button.classList.toggle("is-on", button.dataset.palette === state.palette);
        }
    }

    function maybeWin() {
        if (state.won || state.found < state.goal) return;
        state.won = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        if (state.menuOpen) {
            state.menuOpen = false;
            settingsMenu.classList.add("hidden");
        }
        winMessage.textContent = `Goal ${state.goal} · ${formatPlayTime(playTime(performance.now()))}`;
        winOverlay.classList.remove("hidden");
    }

    function collectIfHit() {
        for (let i = state.balls.length - 1; i >= 0; i -= 1) {
            const ball = state.balls[i];
            const reach = ball.r + SHIP_RADIUS;
            if (Math.hypot(ball.x - state.shipX, ball.y - state.shipY) <= reach) {
                state.balls.splice(i, 1);
                state.found += 1;
                state.pops.push({
                    x: ball.x,
                    y: ball.y,
                    r: ball.r,
                    color: ball.color,
                    life: 1,
                });
                updateHud();
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

        const moving = vx !== 0 || vy !== 0;
        if (moving) {
            const length = Math.hypot(vx, vy);
            vx /= length;
            vy /= length;
            state.heading = Math.atan2(vy, vx);
            const usingStick = stick.vx !== 0 || stick.vy !== 0;
            const speed = SHIP_SPEED * (usingStick ? stick.speed : 1);
            state.shipX += vx * speed * dt;
            state.shipY += vy * speed * dt;
        }

        const min = SHIP_RADIUS + 8;
        const max = state.world - SHIP_RADIUS - 8;
        state.shipX = Math.min(max, Math.max(min, state.shipX));
        state.shipY = Math.min(max, Math.max(min, state.shipY));
        return moving;
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
                    const hasRings = hash2(gx * 8.4, gy + i * 21) > 0.88;

                    if (hasRings) {
                        const body = 1.6 + hash2(i, gx) * 2.4;
                        const tilt = hash2(gx, i * 3.3) * Math.PI;
                        const rx = body * (2.3 + hash2(gy, i) * 1.6);
                        const ry = rx * (0.2 + hash2(i * 2.1, gx) * 0.14);
                        ctx.strokeStyle = `rgba(220, 186, 120, ${0.28 + twinkle * 0.4})`;
                        ctx.lineWidth = 1.1 + hash2(gx + i, gy) * 1.3;
                        ctx.beginPath();
                        ctx.ellipse(x, y, rx, ry, tilt, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.strokeStyle = `rgba(170, 140, 80, ${0.18 + twinkle * 0.22})`;
                        ctx.lineWidth = 0.7;
                        ctx.beginPath();
                        ctx.ellipse(x, y, rx * 0.7, ry * 0.7, tilt, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.fillStyle = `rgba(255, 228, 186, ${twinkle})`;
                        ctx.beginPath();
                        ctx.arc(x, y, body, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
                        ctx.beginPath();
                        ctx.arc(x, y, size, 0, Math.PI * 2);
                        ctx.fill();
                    }
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
        if (!ball.pulseMs || ball.pulseMs < 1000 || ball.pulseMs > 5000) {
            ball.pulseMs = rand(1000, 5000);
            ball.pulseOffset = rand(0, Math.PI * 2);
        }
        const wave = 0.5 + 0.5 * Math.sin((now / ball.pulseMs) * Math.PI * 2 + ball.pulseOffset);
        return 0.06 + 0.94 * wave;
    }

    function drawBall(ball, cam, now) {
        const x = ball.x - cam.x;
        const y = ball.y - cam.y;
        if (
            x < -ball.r - 20 ||
            y < -ball.r - 20 ||
            x > state.width + ball.r + 20 ||
            y > state.height + ball.r + 20
        ) {
            return;
        }

        const pulse = ballPulse(ball, now);
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 14 + 22 * pulse;
        const glow = ctx.createRadialGradient(
            x - ball.r * 0.28,
            y - ball.r * 0.3,
            ball.r * 0.08,
            x,
            y,
            ball.r
        );
        glow.addColorStop(0, "#fff8");
        glow.addColorStop(0.18, "#fff6");
        glow.addColorStop(0.45, ball.color);
        glow.addColorStop(1, "#0006");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(x, y, ball.r, 0, Math.PI * 2);
        ctx.fill();
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

    function drawShip(moving) {
        const x = state.width / 2;
        const y = state.height / 2;
        ctx.save();
        ctx.translate(x, y);
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

    function toMinimap(worldX, worldY) {
        return {
            x: MINIMAP_SIZE / 2 + (worldX - state.shipX) * MINIMAP_SCALE,
            y: MINIMAP_SIZE / 2 + (worldY - state.shipY) * MINIMAP_SCALE,
        };
    }

    function drawMinimap(now) {
        const size = MINIMAP_SIZE;
        miniCtx.clearRect(0, 0, size, size);
        miniCtx.save();
        miniCtx.beginPath();
        miniCtx.roundRect(0, 0, size, size, 20);
        miniCtx.clip();

        miniCtx.fillStyle = "#000000";
        miniCtx.fillRect(0, 0, size, size);

        const origin = toMinimap(0, 0);
        const worldPx = state.world * MINIMAP_SCALE;
        miniCtx.fillStyle = "#0a0830";
        miniCtx.fillRect(origin.x, origin.y, worldPx, worldPx);

        miniCtx.strokeStyle = "#000000";
        miniCtx.lineWidth = 2;
        miniCtx.strokeRect(origin.x, origin.y, worldPx, worldPx);

        for (const ball of state.balls) {
            const p = toMinimap(ball.x, ball.y);
            const r = Math.max(2.2, ball.r * MINIMAP_SCALE);
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
        miniCtx.moveTo(0, -8);
        miniCtx.lineTo(5, 6);
        miniCtx.lineTo(0, 3);
        miniCtx.lineTo(-5, 6);
        miniCtx.closePath();
        miniCtx.fill();
        miniCtx.restore();

        miniCtx.strokeStyle = "rgba(170, 200, 255, 0.4)";
        miniCtx.lineWidth = 1;
        miniCtx.beginPath();
        miniCtx.arc(cx, cy, 11, 0, Math.PI * 2);
        miniCtx.stroke();

        miniCtx.restore();
    }

    let last = performance.now();
    function frame(now) {
        const dt = Math.min(0.033, (now - last) / 1000);
        last = now;

        const moving = state.menuOpen || state.won ? false : moveShip(dt);
        if (!state.menuOpen && !state.won) collectIfHit();
        const cam = camera();

        drawSpace(cam);
        for (const ball of state.balls) drawBall(ball, cam, now);
        drawPops(cam, dt);
        drawShip(moving);
        drawMinimap(now);
        updateTimer(now);
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;

        requestAnimationFrame(frame);
    }

    function bindKeys() {
        window.addEventListener("keydown", (event) => {
            if (state.menuOpen || state.won) return;
            keys.add(event.key.toLowerCase());
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(event.key.toLowerCase())) {
                event.preventDefault();
            }
        });
        window.addEventListener("keyup", (event) => {
            keys.delete(event.key.toLowerCase());
        });
        window.addEventListener("blur", () => keys.clear());
    }

    function pickSpeedRing(dist) {
        if (dist < (SPEED_RINGS[0].radius + SPEED_RINGS[1].radius) / 2) {
            return SPEED_RINGS[0];
        }
        if (dist < (SPEED_RINGS[1].radius + SPEED_RINGS[2].radius) / 2) {
            return SPEED_RINGS[1];
        }
        return SPEED_RINGS[2];
    }

    function snapStick(dx, dy) {
        const dist = Math.hypot(dx, dy);
        if (dist < STICK_DEAD) {
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
        for (const dir of DIRS) {
            const pip = document.createElement("span");
            pip.className = "joystick-pip";
            pip.dataset.dir = dir.name;
            pip.style.transform = `rotate(${dir.angle}rad) translateX(96px)`;
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
        state.balls = [];
        state.pops = [];
        state.found = 0;
        state.won = false;
        keys.clear();
        resetStick();
        winOverlay.classList.add("hidden");
        spawnBalls(state.ballCount);
        resetTimer(performance.now(), !state.menuOpen && !state.won);
        updateHud();
    }

    function openMenu() {
        if (state.menuOpen) return;
        state.menuOpen = true;
        pauseTimer(performance.now());
        keys.clear();
        resetStick();
        settingsMenu.classList.remove("hidden");
    }

    function closeMenu() {
        if (!state.menuOpen) return;
        state.menuOpen = false;
        settingsMenu.classList.add("hidden");
        if (!state.won) resumeTimer(performance.now());
    }

    function bindHud() {
        document.getElementById("open-settings").addEventListener("click", openMenu);

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

        for (const button of document.querySelectorAll(".palette-btn")) {
            button.addEventListener("click", () => {
                const next = button.dataset.palette;
                if (!PALETTES[next] || next === state.palette) return;
                state.palette = next;
                const colors = PALETTES[next];
                for (const ball of state.balls) ball.color = pick(colors);
                saveSettings();
                updateHud();
            });
        }

        document.getElementById("settings-restart").addEventListener("click", () => {
            restartGame();
            closeMenu();
        });

        document.getElementById("settings-continue").addEventListener("click", closeMenu);

        document.getElementById("win-restart").addEventListener("click", () => {
            restartGame();
        });
    }

    function preventBrowserGestures() {
        document.addEventListener("touchmove", (event) => {
            if (state.menuOpen) return;
            event.preventDefault();
        }, { passive: false });
        document.addEventListener("gesturestart", (event) => event.preventDefault());
        document.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    resize();
    spawnBalls(state.ballCount);
    updateHud();
    bindKeys();
    buildPips();
    bindPad();
    bindHud();
    preventBrowserGestures();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
})();
