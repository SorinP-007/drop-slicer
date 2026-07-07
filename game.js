(function () {
  "use strict";

  const core = window.DropSlicerCore;
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const state = core.createState(Date.now());

  const ui = {
    level: document.getElementById("level"),
    score: document.getElementById("score"),
    coins: document.getElementById("coins"),
    misses: document.getElementById("misses"),
    progressFill: document.getElementById("progressFill"),
    startPanel: document.getElementById("startPanel"),
    levelPanel: document.getElementById("levelPanel"),
    levelTitle: document.getElementById("levelTitle"),
    levelReward: document.getElementById("levelReward"),
    shopPanel: document.getElementById("shopPanel"),
    shopReward: document.getElementById("shopReward"),
    gameOverPanel: document.getElementById("gameOverPanel"),
    finalStats: document.getElementById("finalStats")
  };

  function fitCanvas() {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.width = rect.width;
    state.height = rect.height;
  }

  function hidePanels() {
    ui.startPanel.classList.add("hidden");
    ui.levelPanel.classList.add("hidden");
    ui.shopPanel.classList.add("hidden");
    ui.gameOverPanel.classList.add("hidden");
  }

  function updatePanels() {
    ui.levelPanel.classList.toggle("hidden", state.status !== "levelComplete");
    ui.shopPanel.classList.toggle("hidden", state.status !== "shop");
    ui.gameOverPanel.classList.toggle("hidden", state.status !== "gameOver");
    if (state.status === "levelComplete") {
      ui.levelTitle.textContent = `Level ${state.level} Complete`;
      ui.levelReward.textContent = `You earned ${state.lastReward} coins.`;
    }
    if (state.status === "shop") {
      ui.shopReward.textContent = `You earned ${state.lastReward} coins. Buy sharper slices, a new look, or extra lives.`;
      refreshShopButtons();
    }
    if (state.status === "gameOver") {
      ui.finalStats.textContent = `The bowl overflowed on level ${state.level}. Final score: ${state.score}.`;
    }
  }

  function refreshHud() {
    ui.level.textContent = state.level;
    ui.score.textContent = state.score;
    ui.coins.textContent = state.coins;
    ui.misses.textContent = `${state.misses} / ${state.maxMisses}`;
    ui.progressFill.style.width = `${Math.min(100, (state.completedCuts / state.targetCuts) * 100)}%`;
  }

  function refreshShopButtons() {
    document.querySelectorAll(".shopItem").forEach((button) => {
      const key = button.dataset.item;
      const item = core.shopItems[key];
      const owned = (key === "fish" && state.inventory.fish) ||
        (key === "blade" && state.inventory.blade >= 2) ||
        (key === "storm" && state.inventory.storm);
      button.disabled = owned || state.coins < item.cost;
      button.querySelector("span").textContent = owned ? "Owned" : `${item.cost} coins`;
    });
  }

  function drawBackground() {
    const bg = state.background;
    const gradient = ctx.createLinearGradient(0, 0, 0, state.height);
    gradient.addColorStop(0, bg.top);
    gradient.addColorStop(0.52, bg.middle);
    gradient.addColorStop(1, bg.bottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.width, state.height);

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = bg.sun;
    ctx.beginPath();
    ctx.arc(state.width - 92, 118, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.42;
    ctx.fillStyle = bg.accent;
    if (bg.name === "Candy Forest") {
      for (let x = -40; x < state.width + 80; x += 95) {
        ctx.beginPath();
        ctx.moveTo(x, state.height - 64);
        ctx.lineTo(x + 42, state.height - 230);
        ctx.lineTo(x + 84, state.height - 64);
        ctx.fill();
      }
    } else if (bg.name === "Rainbow Desert") {
      for (let x = -80; x < state.width + 120; x += 220) {
        ctx.beginPath();
        ctx.ellipse(x + 90, state.height - 66, 120, 34, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (bg.name === "Coral Ocean") {
      for (let y = 170; y < state.height - 80; y += 58) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        for (let x = 0; x < state.width + 30; x += 30) ctx.lineTo(x, y + Math.sin(x * 0.04 + y) * 10);
        ctx.strokeStyle = bg.accent;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else if (bg.name === "Balloon Sky") {
      for (let x = 40; x < state.width; x += 190) {
        ctx.beginPath();
        ctx.ellipse(x, 190, 42, 56, 0, 0, Math.PI * 2);
        ctx.moveTo(x, 246);
        ctx.lineTo(x - 12, 270);
        ctx.lineTo(x + 12, 270);
        ctx.closePath();
        ctx.fill();
      }
    } else if (bg.name === "Festival Night") {
      for (let x = 30; x < state.width; x += 90) {
        ctx.beginPath();
        ctx.arc(x, 150 + Math.sin(x) * 18, 9, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      for (let x = -60; x < state.width + 90; x += 150) {
        ctx.beginPath();
        ctx.moveTo(x, state.height - 60);
        ctx.lineTo(x + 76, state.height - 260);
        ctx.lineTo(x + 148, state.height - 60);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBowl() {
    const bowlY = state.height - 58;
    const fill = Math.min(1, state.misses / 3);
    ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
    ctx.beginPath();
    ctx.ellipse(state.width / 2, bowlY, 142, 32, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(99, 207, 255, ${0.22 + fill * 0.55})`;
    ctx.fillRect(state.width / 2 - 124, bowlY - fill * 54, 248, fill * 54);
    ctx.strokeStyle = "#dff7ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(state.width / 2, bowlY, 142, 32, 0, 0, Math.PI);
    ctx.stroke();
  }

  function drawDrop(drop) {
    ctx.save();
    ctx.translate(drop.x, drop.y);
    if (drop.purple) {
      ctx.fillStyle = "#d000ff";
    } else if (state.inventory.fish) {
      ctx.fillStyle = drop.hp > 1 ? "#ff9f43" : "#48d597";
    } else {
      ctx.fillStyle = drop.hp > 1 ? "#58cfff" : "#9feaff";
    }
    ctx.strokeStyle = drop.purple ? "#fff45c" : "#eefcff";
    ctx.lineWidth = drop.purple ? 5 : 2;

    if (drop.purple) {
      ctx.shadowColor = "#ff4dff";
      ctx.shadowBlur = 18;
    }

    if (state.inventory.fish && !drop.purple) {
      ctx.beginPath();
      ctx.ellipse(0, 0, drop.radius * 1.08, drop.radius * 0.64, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-drop.radius * 0.9, 0);
      ctx.lineTo(-drop.radius * 1.45, -drop.radius * 0.5);
      ctx.lineTo(-drop.radius * 1.45, drop.radius * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#102033";
      ctx.beginPath();
      ctx.arc(drop.radius * 0.42, -drop.radius * 0.12, 2.8, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, -drop.radius * 1.25);
      ctx.bezierCurveTo(drop.radius, -drop.radius * 0.34, drop.radius * 0.92, drop.radius, 0, drop.radius);
      ctx.bezierCurveTo(-drop.radius * 0.92, drop.radius, -drop.radius, -drop.radius * 0.34, 0, -drop.radius * 1.25);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255, 255, 255, 0.72)";
      ctx.beginPath();
      ctx.ellipse(-drop.radius * 0.25, -drop.radius * 0.28, drop.radius * 0.18, drop.radius * 0.34, -0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!drop.purple && drop.maxHp > 1) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
      ctx.font = "800 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(String(drop.hp), 0, 5);
    }
    if (drop.purple) {
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fff45c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-drop.radius * 0.45, -drop.radius * 0.25);
      ctx.lineTo(drop.radius * 0.45, drop.radius * 0.45);
      ctx.moveTo(drop.radius * 0.45, -drop.radius * 0.25);
      ctx.lineTo(-drop.radius * 0.45, drop.radius * 0.45);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffects() {
    for (const splash of state.splashes) {
      const alpha = 1 - splash.age / 0.55;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = splash.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(splash.x, splash.y, 12 + splash.age * 80, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (state.slash.length > 1) {
      ctx.strokeStyle = state.inventory.storm ? "#ffe16f" : state.inventory.blade > 1 ? "#d7e5ff" : "#ffffff";
      ctx.lineWidth = state.inventory.storm ? 7 : state.inventory.blade > 1 ? 5 : 3;
      ctx.lineCap = "round";
      ctx.beginPath();
      state.slash.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }

  function draw() {
    drawBackground();
    drawBowl();
    for (const drop of state.drops) drawDrop(drop);
    drawEffects();
  }

  function pointerPosition(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  let pointerDown = false;
  canvas.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    canvas.setPointerCapture(event.pointerId);
    const pos = pointerPosition(event);
    core.sliceAt(state, pos.x, pos.y);
    updatePanels();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    const pos = pointerPosition(event);
    core.sliceAt(state, pos.x, pos.y);
    updatePanels();
  });

  canvas.addEventListener("pointerup", () => {
    pointerDown = false;
  });

  document.getElementById("startButton").addEventListener("click", () => {
    hidePanels();
    core.startGame(state);
  });

  document.getElementById("nextButton").addEventListener("click", () => {
    hidePanels();
    core.nextLevel(state);
  });

  document.getElementById("leaveShopButton").addEventListener("click", () => {
    hidePanels();
    core.nextLevel(state);
  });

  document.getElementById("restartButton").addEventListener("click", () => {
    hidePanels();
    core.startGame(state);
  });

  document.querySelectorAll(".shopItem").forEach((button) => {
    button.addEventListener("click", () => {
      core.buyItem(state, button.dataset.item);
      refreshShopButtons();
      refreshHud();
    });
  });

  window.addEventListener("resize", fitCanvas);
  fitCanvas();

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    core.update(state, dt);
    refreshHud();
    updatePanels();
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
