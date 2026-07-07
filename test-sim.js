const core = require("./game-core");

function runGame(seed) {
  const state = core.createState(seed);
  state.width = 960;
  state.height = 640;
  core.startGame(state);

  let ticks = 0;
  let purchases = 0;

  while (state.status !== "gameOver" && state.level <= 14 && ticks < 90000) {
    core.update(state, 1 / 60);

    if (state.status === "playing") {
      const targets = state.drops
        .filter((drop) => !drop.purple && drop.y > 5)
        .sort((a, b) => b.y - a.y);
      const target = targets[0];
      if (target && (target.y > state.height * 0.18 || state.drops.length > 5)) {
        core.sliceAt(state, target.x, target.y);
      }
    }

    if (state.status === "levelComplete") {
      core.nextLevel(state);
    }

    if (state.status === "shop") {
      if (core.buyItem(state, "blade")) purchases += 1;
      if (core.buyItem(state, "fish")) purchases += 1;
      if (core.buyItem(state, "storm")) purchases += 1;
      core.nextLevel(state);
    }

    ticks += 1;
  }

  return {
    run: seed,
    score: state.score,
    level: state.level,
    coins: state.coins,
    purchases,
    result: state.status === "gameOver" ? "lost" : "completed"
  };
}

const results = Array.from({ length: 50 }, (_, index) => runGame(1000 + index));
const scores = results.map((result) => result.score);
const average = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
const min = Math.min(...scores);
const max = Math.max(...scores);

console.log(JSON.stringify({ results, summary: { average, min, max } }, null, 2));
