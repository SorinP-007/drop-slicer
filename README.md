# Drop Slicer

A browser game where you slice falling water drops before they overflow the bowl.

## Play

Open `index.html` in a browser.

## Rules

- Slice blue water drops before they hit the bowl.
- Big drops need multiple cuts and shrink after every slice.
- Purple drops are dangerous. Do not touch them.
- Three missed or wrong drops overflow the bowl and end the game, unless you buy extra lives.
- Higher levels spawn faster drops, more big drops, and more hazards.
- Every completed level awards coins based on score and accuracy.
- Every 2nd level opens the shop for upgrades.

## Shop

- Fish Drops: 30 coins
- Silver Sword: 20 coins
- Storm Sword: 45 coins
- Extra Life: 15 coins

## Automated test

Run:

```bash
node test-sim.js
```
