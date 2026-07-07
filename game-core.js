(function (root) {
  "use strict";

  const backgrounds = [
    { name: "Forest", top: "#163c2a", bottom: "#07151c", accent: "#69d38f" },
    { name: "Desert", top: "#b8742c", bottom: "#27170e", accent: "#ffd37a" },
    { name: "Ocean", top: "#0a6c8d", bottom: "#061827", accent: "#54e2ff" },
    { name: "Sky", top: "#528fd4", bottom: "#10223d", accent: "#fff0a6" },
    { name: "Glacier", top: "#8ed8ed", bottom: "#16304a", accent: "#e8fbff" }
  ];

  const shopItems = {
    fish: { cost: 30, label: "Fish Drops" },
    blade: { cost: 20, label: "Silver Sword" },
    storm: { cost: 45, label: "Storm Sword" }
  };

  function mulberry32(seed) {
    let value = seed >>> 0;
    return function random() {
      value += 0x6D2B79F5;
      let next = value;
      next = Math.imul(next ^ (next >>> 15), next | 1);
      next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
      return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createState(seed) {
    return {
      rng: mulberry32(seed || Date.now()),
      width: 960,
      height: 640,
      status: "ready",
      level: 1,
      score: 0,
      coins: 0,
      misses: 0,
      targetCuts: 16,
      completedCuts: 0,
      drops: [],
      splashes: [],
      slash: [],
      spawnTimer: 0,
      levelTime: 0,
      shopOpen: false,
      inventory: {
        fish: false,
        blade: 1,
        storm: false
      },
      lastReward: 0,
      background: backgrounds[0]
    };
  }

  function levelConfig(level) {
    const stage = Math.min(10, level);
    return {
      targetCuts: 13 + level * 3,
      gravity: 18 + stage * 5.4,
      baseSpeed: 72 + stage * 13,
      spawnEvery: Math.max(0.34, 1.12 - level * 0.045),
      bigChance: Math.min(0.52, 0.14 + level * 0.025),
      purpleChance: Math.min(0.2, 0.06 + level * 0.008),
      rewardBase: level < 4 ? 5 : level < 8 ? 10 : 15
    };
  }

  function resetLevel(state) {
    const config = levelConfig(state.level);
    state.status = "playing";
    state.misses = 0;
    state.completedCuts = 0;
    state.targetCuts = config.targetCuts;
    state.drops.length = 0;
    state.splashes.length = 0;
    state.slash.length = 0;
    state.spawnTimer = 0.25;
    state.levelTime = 0;
    state.shopOpen = false;
    state.background = backgrounds[Math.floor((state.level - 1) / 3) % backgrounds.length];
  }

  function startGame(state) {
    state.level = 1;
    state.score = 0;
    state.coins = 0;
    state.inventory.fish = false;
    state.inventory.blade = 1;
    state.inventory.storm = false;
    resetLevel(state);
  }

  function spawnDrop(state) {
    const config = levelConfig(state.level);
    const roll = state.rng();
    const purple = roll < config.purpleChance;
    const big = !purple && state.rng() < config.bigChance;
    const hp = purple ? 1 : big ? (state.rng() < 0.35 ? 3 : 2) : 1;
    const radius = purple ? 22 : 15 + hp * 9;
    state.drops.push({
      id: Math.floor(state.rng() * 1000000000),
      x: 28 + state.rng() * Math.max(1, state.width - 56),
      y: -radius - state.rng() * 90,
      vy: config.baseSpeed + state.rng() * 76 + hp * 12,
      radius,
      hp,
      maxHp: hp,
      purple,
      wobble: state.rng() * Math.PI * 2
    });
  }

  function addSplash(state, x, y, color) {
    state.splashes.push({ x, y, age: 0, color });
  }

  function completeLevel(state) {
    const config = levelConfig(state.level);
    const accuracyBonus = state.misses === 0 ? 5 : state.misses === 1 ? 2 : 0;
    const scoreBonus = state.completedCuts >= state.targetCuts + 6 ? 5 : 0;
    state.lastReward = config.rewardBase + accuracyBonus + scoreBonus;
    state.coins += state.lastReward;
    state.status = state.level % 10 === 0 ? "shop" : "levelComplete";
    state.shopOpen = state.status === "shop";
    state.drops.length = 0;
  }

  function loseGame(state) {
    state.status = "gameOver";
    state.drops.length = 0;
  }

  function update(state, dt) {
    if (state.status !== "playing") return;
    const config = levelConfig(state.level);
    state.levelTime += dt;
    state.spawnTimer -= dt;
    while (state.spawnTimer <= 0) {
      spawnDrop(state);
      state.spawnTimer += config.spawnEvery * (0.78 + state.rng() * 0.44);
    }

    for (const drop of state.drops) {
      drop.vy += config.gravity * dt;
      drop.y += drop.vy * dt;
      drop.wobble += dt * 4;
      drop.x += Math.sin(drop.wobble) * dt * 13;
    }

    for (let i = state.drops.length - 1; i >= 0; i -= 1) {
      const drop = state.drops[i];
      if (drop.y - drop.radius > state.height - 64) {
        state.drops.splice(i, 1);
        if (!drop.purple) {
          state.misses += 1;
          addSplash(state, drop.x, state.height - 58, "#bcecff");
          if (state.misses >= 3) loseGame(state);
        }
      }
    }

    for (const splash of state.splashes) splash.age += dt;
    state.splashes = state.splashes.filter((splash) => splash.age < 0.55);
    state.slash = state.slash.filter((point) => state.levelTime - point.t < 0.18);
  }

  function sliceAt(state, x, y) {
    if (state.status !== "playing") return { hit: false };
    state.slash.push({ x, y, t: state.levelTime });
    let result = { hit: false };

    for (let i = state.drops.length - 1; i >= 0; i -= 1) {
      const drop = state.drops[i];
      const dx = drop.x - x;
      const dy = drop.y - y;
      if (Math.hypot(dx, dy) <= drop.radius + 12) {
        result = { hit: true, purple: drop.purple };
        if (drop.purple) {
          state.score = Math.max(0, state.score - 40);
          state.misses += 1;
          state.drops.splice(i, 1);
          addSplash(state, drop.x, drop.y, "#b36bff");
          if (state.misses >= 3) loseGame(state);
          break;
        }

        const power = state.inventory.storm ? 2 : state.inventory.blade;
        drop.hp -= power;
        state.score += 10 * power + state.level;
        state.completedCuts += power;
        addSplash(state, drop.x, drop.y, "#82dcff");

        if (drop.hp <= 0) {
          state.drops.splice(i, 1);
          state.score += 12 + drop.maxHp * 5;
        } else {
          drop.radius = Math.max(16, drop.radius - 9 * power);
          drop.vy *= 0.92;
        }

        if (state.completedCuts >= state.targetCuts) completeLevel(state);
        break;
      }
    }

    return result;
  }

  function nextLevel(state) {
    state.level += 1;
    resetLevel(state);
  }

  function buyItem(state, key) {
    const item = shopItems[key];
    if (!item || state.coins < item.cost) return false;
    if (key === "fish" && state.inventory.fish) return false;
    if (key === "blade" && state.inventory.blade >= 2) return false;
    if (key === "storm" && state.inventory.storm) return false;
    state.coins -= item.cost;
    if (key === "fish") state.inventory.fish = true;
    if (key === "blade") state.inventory.blade = 2;
    if (key === "storm") state.inventory.storm = true;
    return true;
  }

  const api = {
    backgrounds,
    shopItems,
    createState,
    startGame,
    resetLevel,
    update,
    sliceAt,
    nextLevel,
    buyItem,
    levelConfig
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.DropSlicerCore = api;
})(typeof window !== "undefined" ? window : globalThis);
