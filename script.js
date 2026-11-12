const cat = document.querySelector("#cat");
const bubble = document.querySelector("#meow");
const canvas = cat.querySelector("canvas");
const pixels = canvas.getContext("2d");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const colors = { x: "#522b26", o: "#f49a41", p: "#ffe0a9", t: "#b9572e" };
const head = [
  "..........xx.....xx.....",
  "..........xox...xox.....",
  "..........xoox.xoox.....",
  "..........xoototoox.....",
  ".........xootopotoox....",
  ".........xtooxoxootx....",
  ".........xooopppooox...."
];
const sitting = [
  ".........xxooopooxx.....",
  "........xoooooooox......",
  ".......xootopotoox......",
  "..xx...xootopotoox......",
  ".xoox..xootopotoox......",
  "..xooxxooooooooooox.....",
  "...xxooottoooooooox.....",
  ".....xxxxxxxxxxxxxx....."
];
// Crouch, push off, extend in the air, then reach for the ground.
const runFrames = [
  { drop: 2, body: [
    "....xx...xxooopooxx",
    "...xooxxxoooooooox",
    "..xoooottoooooooox",
    "...xooottoooooooox",
    "....xxxxxxxxxxxxxx",
    "......xoox..xoox",
    ".......xx....xx"
  ] },
  { drop: 0, body: [
    ".........xxooopooxx",
    "....xxxxxoooooooox",
    "..xxoooottooooooox",
    ".xooooottoooooooox",
    "..xxxxxxxoxxxxxxxx",
    ".....xooxx....xoox",
    "...xxoxx.......xx",
    "..xxx"
  ] },
  { drop: 0, body: [
    ".........xxooopooxx",
    ".xxx...xxoooooooox",
    "....xxxoottoooooox",
    ".....xoottooooooox",
    "......xxxxxxxxxxxx",
    "....xoox.........xoox",
    "...xxx............xxx"
  ] },
  { drop: 1, body: [
    ".........xxooopooxx",
    ".....xxxxoooooooox",
    "..xxxoooottoooooox",
    "....xoooottoooooox",
    ".....xxxxxxxxxxxxx",
    "........xoox...xoox",
    ".........xx.....xoox",
    ".................xxx"
  ] }
];

let x = innerWidth / 2;
let y = innerHeight / 2 + 72;
let targetX = x;
let targetY = y;
let facing = 1;
let frame = 0;
let previousTime;
let phase = 0;
let hasTarget = false;
let fish = null;
let prey = null;
let heartUntil = 0;
let heartTimer;

function spawnFish() {
  const button = document.createElement("button");
  button.className = "fish";
  button.type = "button";
  button.setAttribute("aria-label", "Fish");
  const sprite = document.createElement("canvas");
  sprite.width = 12;
  sprite.height = 8;
  const brush = sprite.getContext("2d");
  const rows = [".....ssss...", "....sbbbbss.", "s..sbbbbkbs.", "ssssbbbbbbbs", "ssssbbbbbbbs", "s..sbbbbbs..", "....sssss...", "............"];
  const palette = { s: "#254f59", b: "#72bfc0", k: "#30283b" };
  rows.forEach((row, y) => [...row].forEach((pixel, x) => {
    if (!palette[pixel]) return;
    brush.fillStyle = palette[pixel];
    brush.fillRect(x, y, 1, 1);
  }));
  button.append(sprite);
  const fishX = innerWidth * (Math.random() < 0.5 ? 0.16 + Math.random() * 0.22 : 0.62 + Math.random() * 0.22);
  const fishY = innerHeight * (Math.random() < 0.5 ? 0.2 + Math.random() * 0.15 : 0.65 + Math.random() * 0.15);
  button.style.left = `${fishX}px`;
  button.style.top = `${fishY}px`;
  button.addEventListener("pointerenter", () => targetFish(button));
  button.addEventListener("click", () => targetFish(button));
  document.body.append(button);
  fish = button;
}

function targetFish(button) {
  const bounds = button.getBoundingClientRect();
  prey = button;
  setTarget(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2 + 12);
}

function draw(moving, lift = 0) {
  pixels.clearRect(0, 0, canvas.width, canvas.height);
  const pose = moving ? runFrames[Math.floor(phase * runFrames.length)] : null;
  const rows = [...head, ...(pose ? pose.body : sitting)];
  rows.forEach((row, rowIndex) => {
    [...row].forEach((pixel, column) => {
      if (pixel === ".") return;
      pixels.fillStyle = colors[pixel];
      pixels.fillRect(facing > 0 ? column : 23 - column, rowIndex + (pose ? 3 + pose.drop : 5), 1, 1);
    });
  });
  cat.style.transform = `translate(${Math.round(x - 24)}px, ${Math.round(y - 40 - lift)}px)`;
  cat.classList.toggle("below", y < 75);
  bubble.hidden = moving || !hasTarget;
  bubble.classList.toggle("heart", performance.now() < heartUntil);
}

function aim(clientX, clientY) {
  const edge = 30;
  targetX = Math.max(edge, Math.min(innerWidth - edge, clientX));
  targetY = Math.max(42, Math.min(innerHeight - 22, clientY));
}

function tick(time) {
  const elapsed = previousTime === undefined ? 0 : Math.min(time - previousTime, 32);
  previousTime = time;
  const dx = targetX - x;
  const dy = targetY - y;
  const distance = Math.hypot(dx, dy);
  if (Math.abs(dx) > 1) facing = Math.sign(dx);

  const step = reducedMotion.matches ? distance : elapsed * (0.09 + 0.15 * Math.sin(phase * Math.PI));
  if (distance <= Math.max(step, 1)) {
    x = targetX;
    y = targetY;
    if (prey && prey === fish) {
      fish.remove();
      fish = null;
      prey = null;
      heartUntil = performance.now() + 1000;
      clearTimeout(heartTimer);
      heartTimer = setTimeout(() => {
        if (!frame) draw(false);
      }, 1000);
      setTimeout(spawnFish, 1800 + Math.random() * 2200);
    }
    frame = 0;
    previousTime = undefined;
    phase = 0;
    draw(false);
    return;
  }

  x += dx / distance * step;
  y += dy / distance * step;
  phase = (phase + elapsed / 290) % 1;
  draw(true, Math.sin(phase * Math.PI) * 26);
  frame = requestAnimationFrame(tick);
}

function setTarget(clientX, clientY) {
  hasTarget = true;
  aim(clientX, clientY);
  if (Math.hypot(targetX - x, targetY - y) > 1) bubble.hidden = true;
  if (!frame) frame = requestAnimationFrame(tick);
}

function chase(event) {
  if (prey || event.target === fish) return;
  if (performance.now() < heartUntil) return;
  setTarget(event.clientX, event.clientY);
}

addEventListener("pointermove", event => {
  if (event.pointerType !== "touch") chase(event);
});
addEventListener("pointerdown", chase);
addEventListener("resize", () => {
  if (fish) {
    fish.remove();
    prey = null;
    spawnFish();
  }
  aim(hasTarget ? targetX : innerWidth / 2, hasTarget ? targetY : innerHeight / 2 + 72);
  x = targetX;
  y = targetY;
  draw(false);
});

aim(x, y);
x = targetX;
y = targetY;
draw(false);
setTimeout(spawnFish, 1500);
