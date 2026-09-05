(() => {
    const WORLD = 20000;
    const START_X = WORLD / 2;
    const START_Y = WORLD / 2;
    const START_BALLS = 75;
    const MINIMAP_SIZE = 240;
    const MINIMAP_SCALE = 0.1;
    const ADD_BALLS = 5;
    const MIN_BALL = 50;
    const MAX_BALL = 250;
    const SHIP_RADIUS = 22;
    const SHIP_SPEED = 840;
    const OFFSCREEN_PAD = 1400;
    const RAINBOW = [
        "#ff3b30",
        "#ff9500",
        "#ffcc00",
        "#34c759",
        "#007aff",
        "#5856d6",
        "#af52de",
    ];

    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const minimap = document.getElementById("minimap");
    const miniCtx = minimap.getContext("2d");
    const foundEl = document.getElementById("found-count");
    const goalEl = document.getElementById("goal-count");
    const goalStepperEl = document.getElementById("goal-stepper");
    const ballsLeftEl = document.getElementById("balls-left");
    const coordsEl = document.getElementById("coords");
    const winOverlay = document.getElementById("win-overlay");
    const winMessage = document.getElementById("win-message");

    const keys = new Set();
    const stick = { vx: 0, vy: 0, dir: "" };
    const DIRS = [
        { name: "right", vx: 1, vy: 0 },
        { name: "down-right", vx: 1, vy: 1 },
        { name: "down", vx: 0, vy: 1 },
        { name: "down-left", vx: -1, vy: 1 },
        { name: "left", vx: -1, vy: 0 },
        { name: "up-left", vx: -1, vy: -1 },
        { name: "up", vx: 0, vy: -1 },
        { name: "up-right", vx: 1, vy: -1 },
    ];

    const state = {
        shipX: START_X,
        shipY: START_Y,
        heading: -Math.PI / 2,
        balls: [],
        pops: [],
        found: 0,
        goal: START_BALLS,
        won: false,
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

    function spawnBalls(count, awayFromX, awayFromY) {
        for (let i = 0; i < count; i += 1) {
            let x = 0;
            let y = 0;
            let attempts = 0;
            do {
                x = rand(MAX_BALL, WORLD - MAX_BALL);
                y = rand(MAX_BALL, WORLD - MAX_BALL);
                attempts += 1;
            } while (
                Math.hypot(x - awayFromX, y - awayFromY) < OFFSCREEN_PAD &&
                attempts < 40
            );

            const size = rand(MIN_BALL, MAX_BALL);
            state.balls.push({
                x,
                y,
                r: size / 2,
                color: pick(RAINBOW),
            });
        }
    }

    function remaining() {
        return state.balls.length;
    }

    function updateHud() {
        foundEl.textContent = String(state.found);
        goalEl.textContent = String(state.goal);
        goalStepperEl.textContent = String(state.goal);
        const n = remaining();
        ballsLeftEl.textContent = `${n} ball${n === 1 ? "" : "s"} in space`;
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;
    }

    function maybeWin() {
        if (state.won || state.found < state.goal) return;
        state.won = true;
        winMessage.textContent = `You found ${state.found} rainbow balls.`;
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
            state.shipX += vx * SHIP_SPEED * dt;
            state.shipY += vy * SHIP_SPEED * dt;
        }

        const min = SHIP_RADIUS + 8;
        const max = WORLD - SHIP_RADIUS - 8;
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
                    ctx.fillStyle = `rgba(255, 255, 255, ${twinkle})`;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    function drawBorder(cam) {
        const thickness = 18;
        ctx.save();
        ctx.strokeStyle = "rgba(120, 170, 255, 0.55)";
        ctx.lineWidth = thickness;
        ctx.shadowColor = "rgba(90, 160, 255, 0.8)";
        ctx.shadowBlur = 24;
        ctx.strokeRect(-cam.x, -cam.y, WORLD, WORLD);
        ctx.restore();
    }

    function drawBall(ball, cam) {
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

        ctx.save();
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 28;
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

    function drawMinimap() {
        const size = MINIMAP_SIZE;
        miniCtx.clearRect(0, 0, size, size);
        miniCtx.save();
        miniCtx.beginPath();
        miniCtx.roundRect(0, 0, size, size, 20);
        miniCtx.clip();

        miniCtx.fillStyle = "#02010a";
        miniCtx.fillRect(0, 0, size, size);

        const origin = toMinimap(0, 0);
        const worldPx = WORLD * MINIMAP_SCALE;
        miniCtx.fillStyle = "#0a0830";
        miniCtx.fillRect(origin.x, origin.y, worldPx, worldPx);

        miniCtx.strokeStyle = "rgba(120, 170, 255, 0.85)";
        miniCtx.lineWidth = 2;
        miniCtx.shadowColor = "rgba(90, 160, 255, 0.7)";
        miniCtx.shadowBlur = 8;
        miniCtx.strokeRect(origin.x, origin.y, worldPx, worldPx);
        miniCtx.shadowBlur = 0;

        for (const ball of state.balls) {
            const p = toMinimap(ball.x, ball.y);
            const r = Math.max(2.2, ball.r * MINIMAP_SCALE);
            if (p.x < -r || p.y < -r || p.x > size + r || p.y > size + r) continue;
            miniCtx.fillStyle = ball.color;
            miniCtx.beginPath();
            miniCtx.arc(p.x, p.y, r, 0, Math.PI * 2);
            miniCtx.fill();
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

        const moving = moveShip(dt);
        collectIfHit();
        const cam = camera();

        drawSpace(cam);
        for (const ball of state.balls) drawBall(ball, cam);
        drawPops(cam, dt);
        drawShip(moving);
        drawMinimap();
        coordsEl.textContent = `${Math.round(state.shipX)}, ${Math.round(state.shipY)}`;

        requestAnimationFrame(frame);
    }

    function bindKeys() {
        window.addEventListener("keydown", (event) => {
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

    function snapStick(dx, dy) {
        const dist = Math.hypot(dx, dy);
        if (dist < 18) {
            return { vx: 0, vy: 0, dir: "", knobX: 0, knobY: 0 };
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
        const travel = Math.min(dist, 68);
        return { vx, vy, dir: best.name, knobX: vx * travel, knobY: vy * travel };
    }

    function setStick(next) {
        stick.vx = next.vx;
        stick.vy = next.vy;
        stick.dir = next.dir;
        const knob = document.getElementById("joystick-knob");
        knob.style.transform = `translate(${next.knobX}px, ${next.knobY}px)`;
        document.getElementById("joystick").classList.toggle("is-active", next.dir !== "");
        for (const pip of document.querySelectorAll(".joystick-pip")) {
            pip.classList.toggle("is-on", pip.dataset.dir === next.dir);
        }
    }

    function resetStick() {
        setStick({ vx: 0, vy: 0, dir: "", knobX: 0, knobY: 0 });
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

    function bindHud() {
        document.getElementById("add-balls").addEventListener("click", () => {
            spawnBalls(ADD_BALLS, state.shipX, state.shipY);
            updateHud();
        });

        document.getElementById("goal-minus").addEventListener("click", () => {
            state.goal = Math.max(1, state.goal - 1);
            state.won = state.found >= state.goal;
            updateHud();
            maybeWin();
        });

        document.getElementById("goal-plus").addEventListener("click", () => {
            state.goal += 1;
            if (state.found < state.goal) {
                state.won = false;
                winOverlay.classList.add("hidden");
            }
            updateHud();
        });

        document.getElementById("keep-flying").addEventListener("click", () => {
            winOverlay.classList.add("hidden");
        });
    }

    function preventBrowserGestures() {
        document.addEventListener("touchmove", (event) => event.preventDefault(), { passive: false });
        document.addEventListener("gesturestart", (event) => event.preventDefault());
        document.addEventListener("contextmenu", (event) => event.preventDefault());
    }

    resize();
    spawnBalls(START_BALLS, START_X, START_Y);
    updateHud();
    bindKeys();
    bindPad();
    bindHud();
    preventBrowserGestures();
    window.addEventListener("resize", resize);
    requestAnimationFrame(frame);
})();
