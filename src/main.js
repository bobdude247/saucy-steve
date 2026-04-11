const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = {
  score: document.getElementById('scoreValue'),
  tickets: document.getElementById('ticketValue'),
  state: document.getElementById('stateValue'),
  ride: document.getElementById('rideValue'),
  combo: document.getElementById('comboValue'),
  message: document.getElementById('messageBox')
};

const HUB_MESSAGE = 'Skate the city and rack up points to earn tickets.';

const game = {
  mode: 'hub',
  score: 0,
  tickets: 0,
  currentCombo: 'None',
  ticketThreshold: 300,
  lastTicketAt: 0,
  competition: null,
  messageTimer: 0,
  cameraX: 0,
  cameraY: 0,
  competitionStartY: 0,
  rideIndex: 0,
  competitionResult: null,
  resultsTimer: 0
};

const rides = [
  {
    key: 'skateboard',
    name: 'Skateboard',
    accelMult: 1,
    maxSpeedMult: 1,
    jumpMult: 1,
    trickMult: 1,
    turnMult: 1
  },
  {
    key: 'scooter',
    name: 'Razor Scooter',
    accelMult: 1.06,
    maxSpeedMult: 0.96,
    jumpMult: 0.9,
    trickMult: 0.9,
    turnMult: 1.04
  },
  {
    key: 'inline',
    name: 'Roller Blades',
    accelMult: 1.12,
    maxSpeedMult: 1.08,
    jumpMult: 0.88,
    trickMult: 0.94,
    turnMult: 1.08
  },
  {
    key: 'quad',
    name: 'Quad Rollerskates',
    accelMult: 0.95,
    maxSpeedMult: 0.9,
    jumpMult: 0.82,
    trickMult: 0.98,
    turnMult: 1.12
  },
  {
    key: 'bmx',
    name: 'BMX Bike',
    accelMult: 0.88,
    maxSpeedMult: 1.18,
    jumpMult: 1.16,
    trickMult: 1.12,
    turnMult: 0.9
  }
];

const input = {
  pressed: new Set(),
  justPressed: new Set(),
  isDown(code) {
    return this.pressed.has(code);
  },
  consume(code) {
    if (!this.justPressed.has(code)) return false;
    this.justPressed.delete(code);
    return true;
  }
};

const gamepad = {
  connected: false,
  lastConnected: false,
  index: 0,
  axes: { lx: 0, ly: 0 },
  buttonPressed: new Set(),
  deadzone: 0.2
};

const padBindings = {
  jump: { button: 0, code: 'PadJump' },
  spin: { button: 2, code: 'PadSpin' },
  enter: { button: 3, code: 'PadEnter' },
  push: { button: 7, code: 'PadPush' },
  returnHub: { button: 9, code: 'PadReturn' },
  ridePrev: { button: 4, code: 'PadRidePrev' },
  rideNext: { button: 5, code: 'PadRideNext' },
  dLeft: { button: 14, code: 'PadDLeft' },
  dRight: { button: 15, code: 'PadDRight' },
  dUp: { button: 12, code: 'PadDUp' },
  dDown: { button: 13, code: 'PadDDown' }
};

const world = {
  width: 2800,
  height: 1800,
  roads: [
    { x: 0, y: 760, w: 2800, h: 230, lane: true },
    { x: 1150, y: 0, w: 270, h: 1800, lane: true },
    { x: 300, y: 300, w: 2200, h: 150, lane: false },
    { x: 260, y: 1300, w: 2200, h: 150, lane: false }
  ],
  buildings: [
    { x: 100, y: 90, w: 300, h: 220, color: '#3d4a63' },
    { x: 470, y: 120, w: 350, h: 190, color: '#45546f' },
    { x: 1550, y: 80, w: 420, h: 230, color: '#3b4d67' },
    { x: 2080, y: 120, w: 520, h: 180, color: '#4a5f7a' },
    { x: 90, y: 1510, w: 370, h: 210, color: '#405371' },
    { x: 520, y: 1500, w: 330, h: 230, color: '#364966' },
    { x: 1650, y: 1510, w: 370, h: 200, color: '#3c5170' },
    { x: 2060, y: 1480, w: 560, h: 250, color: '#4b627f' }
  ],
  parkedCars: [
    { x: 860, y: 688, w: 112, h: 48, color: '#f07d5d', orientation: 'horizontal', platformHeight: 11 },
    { x: 940, y: 995, w: 112, h: 48, color: '#76d3ff', orientation: 'horizontal', platformHeight: 11 },
    { x: 1420, y: 500, w: 50, h: 112, color: '#9bff7a', orientation: 'vertical', platformHeight: 11 },
    { x: 1072, y: 1062, w: 50, h: 112, color: '#ffd66c', orientation: 'vertical', platformHeight: 11 }
  ],
  railSegments: [
    { x1: 700, y1: 620, x2: 1020, y2: 620 },
    { x1: 1550, y1: 1170, x2: 1900, y2: 1170 }
  ],
  ramps: [
    { x: 470, y: 470, w: 220, h: 120, dir: 'right', height: 22 },
    { x: 1230, y: 590, w: 290, h: 140, dir: 'right', height: 26 },
    { x: 1830, y: 1270, w: 320, h: 170, dir: 'left', height: 30 },
    { x: 890, y: 1190, w: 250, h: 130, dir: 'up', height: 24 }
  ],
  zones: [
    { key: 'halfpipe', name: 'Halfpipe Competition', x: 250, y: 340, w: 320, h: 210, color: '#9b74ff', ticketCost: 1 },
    { key: 'downhill', name: 'Downhill Competition', x: 2160, y: 330, w: 360, h: 230, color: '#64dc8f', ticketCost: 1 },
    { key: 'slalom', name: 'Slalom Competition', x: 260, y: 1150, w: 360, h: 270, color: '#ffad5f', ticketCost: 1 },
    { key: 'jump', name: 'Jump Competition', x: 2140, y: 1140, w: 350, h: 260, color: '#63b6ff', ticketCost: 1 }
  ]
};

const competitionMaps = {
  halfpipe: {
    key: 'halfpipe',
    name: 'Halfpipe Competition',
    length: 2400,
    gravityAssist: 0,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 520,
    medals: { bronze: 620, silver: 880, gold: 1140 },
    segments: [
      { yStart: 0, yEnd: 500, centerX: canvas.width * 0.5 - 36 },
      { yStart: 500, yEnd: 1000, centerX: canvas.width * 0.5 + 36 },
      { yStart: 1000, yEnd: 1500, centerX: canvas.width * 0.5 - 28 },
      { yStart: 1500, yEnd: 2000, centerX: canvas.width * 0.5 + 30 },
      { yStart: 2000, yEnd: 2400, centerX: canvas.width * 0.5 }
    ],
    gates: [],
    jumps: [280, 620, 960, 1300, 1670, 2050]
  },
  downhill: {
    key: 'downhill',
    name: 'Downhill Competition',
    length: 2500,
    gravityAssist: 220,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 390,
    medals: { bronze: 760, silver: 1020, gold: 1320 },
    segments: [
      { yStart: 0, yEnd: 360, centerX: 560 },
      { yStart: 360, yEnd: 740, centerX: 650 },
      { yStart: 740, yEnd: 1120, centerX: 510 },
      { yStart: 1120, yEnd: 1500, centerX: 690 },
      { yStart: 1500, yEnd: 1900, centerX: 520 },
      { yStart: 1900, yEnd: 2260, centerX: 640 },
      { yStart: 2260, yEnd: 2500, centerX: 580 }
    ],
    gates: [],
    jumps: [420, 860, 1260, 1740, 2160]
  },
  slalom: {
    key: 'slalom',
    name: 'Slalom Competition',
    length: 2500,
    gravityAssist: 170,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 420,
    medals: { bronze: 820, silver: 1100, gold: 1400 },
    segments: [
      { yStart: 0, yEnd: 320, centerX: 540 },
      { yStart: 320, yEnd: 640, centerX: 680 },
      { yStart: 640, yEnd: 960, centerX: 500 },
      { yStart: 960, yEnd: 1280, centerX: 700 },
      { yStart: 1280, yEnd: 1600, centerX: 500 },
      { yStart: 1600, yEnd: 1920, centerX: 690 },
      { yStart: 1920, yEnd: 2240, centerX: 530 },
      { yStart: 2240, yEnd: 2500, centerX: 620 }
    ],
    gates: [
      { y: 220, x: 440, side: 'left' },
      { y: 360, x: 720, side: 'right' },
      { y: 510, x: 420, side: 'left' },
      { y: 670, x: 730, side: 'right' },
      { y: 830, x: 405, side: 'left' },
      { y: 980, x: 745, side: 'right' },
      { y: 1130, x: 415, side: 'left' },
      { y: 1290, x: 740, side: 'right' },
      { y: 1450, x: 410, side: 'left' },
      { y: 1600, x: 750, side: 'right' },
      { y: 1760, x: 420, side: 'left' },
      { y: 1910, x: 745, side: 'right' },
      { y: 2070, x: 430, side: 'left' },
      { y: 2230, x: 735, side: 'right' }
    ],
    jumps: [760, 1540, 2140]
  },
  jump: {
    key: 'jump',
    name: 'Jump Competition',
    length: 2500,
    gravityAssist: 180,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 410,
    medals: { bronze: 860, silver: 1140, gold: 1450 },
    segments: [
      { yStart: 0, yEnd: 340, centerX: 560 },
      { yStart: 340, yEnd: 680, centerX: 520 },
      { yStart: 680, yEnd: 1020, centerX: 650 },
      { yStart: 1020, yEnd: 1360, centerX: 540 },
      { yStart: 1360, yEnd: 1700, centerX: 670 },
      { yStart: 1700, yEnd: 2060, centerX: 520 },
      { yStart: 2060, yEnd: 2500, centerX: 600 }
    ],
    gates: [],
    jumps: [220, 460, 720, 980, 1240, 1500, 1780, 2060, 2320]
  }
};

const player = {
  x: 1040,
  y: 860,
  vx: 0,
  vy: 0,
  radius: 15,
  heading: 0,
  speed: 0,
  maxSpeed: 460,
  accel: 360,
  friction: 1.7,
  turnRate: 7,
  onGround: true,
  z: 0,
  vz: 0,
  gravity: 980,
  pushCooldown: 0,
  trickCooldown: 0,
  spinWindow: 0,
  spinValue: 0,
  grinding: false,
  gatedPassed: new Set(),
  surfaceLift: 0,
  lastRampLaunch: -1
};

const HUB_SPAWN = { x: 1040, y: 860 };

let lastTime = performance.now();

window.addEventListener('keydown', (event) => {
  const code = event.code;
  if (!input.pressed.has(code)) {
    input.justPressed.add(code);
  }
  input.pressed.add(code);
});

window.addEventListener('keyup', (event) => {
  input.pressed.delete(event.code);
});

function applyDeadzone(value, deadzone = gamepad.deadzone) {
  if (Math.abs(value) < deadzone) return 0;
  const normalized = (Math.abs(value) - deadzone) / (1 - deadzone);
  return Math.sign(value) * Math.min(1, normalized);
}

function syncPadButtonState(code, isDown) {
  if (isDown) {
    if (!input.pressed.has(code)) {
      input.justPressed.add(code);
    }
    input.pressed.add(code);
  } else {
    input.pressed.delete(code);
  }
}

function updateGamepadInput() {
  if (!navigator.getGamepads) return;
  const pads = navigator.getGamepads();
  const activePad = pads[gamepad.index] || [...pads].find((pad) => pad);

  if (!activePad) {
    gamepad.connected = false;
    gamepad.axes.lx = 0;
    gamepad.axes.ly = 0;
    for (const binding of Object.values(padBindings)) {
      syncPadButtonState(binding.code, false);
    }
    gamepad.buttonPressed.clear();
  } else {
    gamepad.connected = true;
    gamepad.index = activePad.index;
    gamepad.axes.lx = applyDeadzone(activePad.axes[0] ?? 0);
    gamepad.axes.ly = applyDeadzone(activePad.axes[1] ?? 0);

    for (const binding of Object.values(padBindings)) {
      const btn = activePad.buttons[binding.button];
      const isDown = Boolean(btn?.pressed || (btn?.value ?? 0) > 0.55);
      syncPadButtonState(binding.code, isDown);
      if (isDown) {
        gamepad.buttonPressed.add(binding.button);
      } else {
        gamepad.buttonPressed.delete(binding.button);
      }
    }
  }

  if (gamepad.connected !== gamepad.lastConnected) {
    if (gamepad.connected) {
      setMessage('Controller connected: Left stick steer, R2 push, X jump, Square spin.', 2.4);
    } else {
      setMessage('Controller disconnected. Keyboard controls still active.', 2.2);
    }
    gamepad.lastConnected = gamepad.connected;
  }
}

function consumeAny(codes) {
  for (const code of codes) {
    if (input.consume(code)) return true;
  }
  return false;
}

function isDownAny(codes) {
  return codes.some((code) => input.isDown(code));
}

function setMessage(text, duration = 2.5) {
  ui.message.textContent = text;
  game.messageTimer = duration;
}

function getComboLabel(base, points) {
  return `${base} +${Math.round(points)}`;
}

function getCurrentRide() {
  return rides[game.rideIndex];
}

function switchRide(direction) {
  game.rideIndex = (game.rideIndex + direction + rides.length) % rides.length;
  const ride = getCurrentRide();
  setMessage(`Ride switched to ${ride.name}`, 1.2);
}

function addScore(points, comboName) {
  game.score += points;
  game.currentCombo = comboName;

  if (game.mode === 'competition' && game.competition) {
    game.competition.points += points;
  }

  const gained = Math.floor(game.score / game.ticketThreshold) - game.lastTicketAt;
  if (gained > 0) {
    game.tickets += gained;
    game.lastTicketAt += gained;
    setMessage(`Ticket earned x${gained}. Total tickets: ${game.tickets}`, 2.2);
  }
}

function getMoveVector() {
  const left = isDownAny(['KeyA', 'ArrowLeft', 'PadDLeft']);
  const right = isDownAny(['KeyD', 'ArrowRight', 'PadDRight']);
  const up = isDownAny(['KeyW', 'ArrowUp', 'PadDUp']);
  const down = isDownAny(['KeyS', 'ArrowDown', 'PadDDown']);

  let mx = (right ? 1 : 0) - (left ? 1 : 0);
  let my = (down ? 1 : 0) - (up ? 1 : 0);

  mx += gamepad.axes.lx;
  my += gamepad.axes.ly;
  mx = Math.max(-1, Math.min(1, mx));
  my = Math.max(-1, Math.min(1, my));

  if (mx === 0 && my === 0) {
    return { x: 0, y: 0, length: 0 };
  }

  const length = Math.hypot(mx, my);
  return { x: mx / length, y: my / length, length: 1 };
}

function angleLerp(current, target, speed, dt) {
  const diff = ((target - current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  const step = speed * dt;
  if (Math.abs(diff) < step) return target;
  return current + Math.sign(diff) * step;
}

function resetPlayerStateForCompetition() {
  player.vx = 0;
  player.vy = 0;
  player.vz = 0;
  player.z = 0;
  player.onGround = true;
  player.spinWindow = 0;
  player.spinValue = 0;
  player.gatedPassed.clear();
}

function getCompetitionCenterXForY(y) {
  if (!game.competition) return canvas.width * 0.5;
  const map = game.competition.map;
  const seg = map.segments.find((s) => y >= s.yStart && y < s.yEnd);
  return seg ? seg.centerX : map.segments[map.segments.length - 1].centerX;
}

function applyMovementHub(dt) {
  const ride = getCurrentRide();
  const move = getMoveVector();

  if (move.length > 0) {
    const targetHeading = Math.atan2(move.y, move.x);
    player.heading = angleLerp(player.heading, targetHeading, player.turnRate * ride.turnMult, dt);
  }

  if (consumeAny(['KeyK', 'PadPush']) && player.pushCooldown <= 0 && player.onGround) {
    const pushPower = 192 * ride.accelMult;
    player.vx += Math.cos(player.heading) * pushPower;
    player.vy += Math.sin(player.heading) * pushPower;
    player.pushCooldown = 0.12;
    setMessage('Push! Keep building speed.', 1.2);
  }

  const rideMaxSpeed = player.maxSpeed * ride.maxSpeedMult;
  const horizontalSpeed = Math.hypot(player.vx, player.vy);
  if (horizontalSpeed > rideMaxSpeed) {
    const scale = rideMaxSpeed / horizontalSpeed;
    player.vx *= scale;
    player.vy *= scale;
  }

  const drag = Math.max(0, 1 - player.friction * dt);
  player.vx *= drag;
  player.vy *= drag;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = Math.max(player.radius, Math.min(world.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(world.height - player.radius, player.y));
}

function getRampProgress(ramp) {
  if (ramp.dir === 'right') return (player.x - ramp.x) / ramp.w;
  if (ramp.dir === 'left') return (ramp.x + ramp.w - player.x) / ramp.w;
  if (ramp.dir === 'up') return (ramp.y + ramp.h - player.y) / ramp.h;
  return (player.y - ramp.y) / ramp.h;
}

function updateHubSurfaceFeatures() {
  if (!player.onGround) {
    player.surfaceLift = 0;
    return;
  }

  let lift = 0;
  let touchingRamp = false;
  for (let i = 0; i < world.ramps.length; i += 1) {
    const ramp = world.ramps[i];
    const inside = player.x >= ramp.x && player.x <= ramp.x + ramp.w && player.y >= ramp.y && player.y <= ramp.y + ramp.h;
    if (!inside) continue;

    touchingRamp = true;
    const progress = Math.max(0, Math.min(1, getRampProgress(ramp)));
    const rampLift = Math.sin(progress * Math.PI * 0.5) * ramp.height;
    lift = Math.max(lift, rampLift);

    if (progress > 0.92 && player.speed > 180 && player.lastRampLaunch !== i) {
      const ride = getCurrentRide();
      player.vz = 250 * ride.jumpMult;
      player.onGround = false;
      player.lastRampLaunch = i;
      addScore(24 * ride.trickMult, 'Ramp launch +24');
      setMessage('Launch! Hit L in the air for extra points.', 1.1);
    }
  }

  if (!touchingRamp) {
    player.lastRampLaunch = -1;
  }

  for (const car of world.parkedCars) {
    const platformInset = 10;
    const onTop = player.x >= car.x + platformInset &&
      player.x <= car.x + car.w - platformInset &&
      player.y >= car.y + platformInset &&
      player.y <= car.y + car.h - platformInset;
    if (onTop) {
      lift = Math.max(lift, car.platformHeight);
    }
  }

  player.surfaceLift = lift;
}

function applyMovementCompetition(dt) {
  const ride = getCurrentRide();
  const move = getMoveVector();
  const turnStrength = 310 * ride.turnMult;

  if (consumeAny(['KeyK', 'PadPush']) && player.pushCooldown <= 0 && player.onGround) {
    player.vy += 90 * ride.accelMult;
    player.pushCooldown = 0.2;
    setMessage('Pushing into the line!', 0.8);
  }

  player.vy += game.competition.map.gravityAssist * dt;

  if (move.x !== 0) {
    player.vx += move.x * turnStrength * dt;
  }

  const laneCenter = getCompetitionCenterXForY(player.y);
  const pull = (laneCenter - player.x) * 0.8;
  player.vx += pull * dt;

  player.vx *= Math.max(0, 1 - 2.2 * dt);
  player.vy *= Math.max(0, 1 - 0.7 * dt);
  player.vy = Math.max(130, Math.min(510 * ride.maxSpeedMult, player.vy));

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  const laneHalf = game.competition.map.laneWidth / 2;
  const laneMin = laneCenter - laneHalf;
  const laneMax = laneCenter + laneHalf;
  if (player.x < laneMin + player.radius) {
    player.x = laneMin + player.radius;
    player.vx *= -0.25;
  }
  if (player.x > laneMax - player.radius) {
    player.x = laneMax - player.radius;
    player.vx *= -0.25;
  }

  if (player.y > game.competition.map.length) {
    player.y = game.competition.map.length;
    player.vy = 220;
  }
}

function performTricks(dt) {
  const ride = getCurrentRide();
  if (consumeAny(['KeyJ', 'PadJump']) && player.onGround && player.trickCooldown <= 0) {
    const basePop = game.mode === 'competition' ? 340 : 380;
    player.vz = basePop * ride.jumpMult;
    player.onGround = false;
    player.trickCooldown = 0.25;
    player.spinWindow = 0.65;
    player.spinValue = 0;
    const olliePoints = 30 * ride.trickMult;
    addScore(olliePoints, `Ollie +${Math.round(olliePoints)}`);
    setMessage('Ollie! Press L in the air to spin.', 1.1);
  }

  if (consumeAny(['KeyL', 'PadSpin'])) {
    if (!player.onGround && player.spinWindow > 0) {
      player.spinValue += 180;
      const basePoints = game.mode === 'competition' ? 52 : 45;
      const points = basePoints * ride.trickMult;
      addScore(points, `Air Spin ${player.spinValue}° +${points}`);
      setMessage(`Spin landed: ${player.spinValue}°`, 1.0);
    } else if (player.onGround && player.speed > 190) {
      const pivotPoints = 20 * ride.trickMult;
      addScore(pivotPoints, `Quick pivot +${Math.round(pivotPoints)}`);
      setMessage('Ground spin pivot +20', 1.0);
    }
  }

  if (game.mode === 'hub') {
    player.grinding = false;
    for (const rail of world.railSegments) {
      const cx = (rail.x1 + rail.x2) / 2;
      const cy = (rail.y1 + rail.y2) / 2;
      const nearRail = Math.hypot(player.x - cx, player.y - cy) < 130;
      if (nearRail && player.onGround && player.speed > 210) {
        player.grinding = true;
        const grindScore = 8 * dt * ride.trickMult;
        addScore(grindScore, getComboLabel('Grind', grindScore));
        break;
      }
    }
  } else {
    player.grinding = false;
  }
}

function updateVertical(dt) {
  if (!player.onGround) {
    player.vz -= player.gravity * dt;
    player.z += player.vz * dt;
    player.spinWindow -= dt;
    if (player.z <= 0) {
      player.z = 0;
      player.vz = 0;
      player.onGround = true;
      player.spinWindow = 0;
    }
  }
}

function getCurrentZone() {
  return world.zones.find((zone) => (
    player.x >= zone.x &&
    player.x <= zone.x + zone.w &&
    player.y >= zone.y &&
    player.y <= zone.y + zone.h
  ));
}

function updateCompetition(dt) {
  if (!game.competition) return;
  const map = game.competition.map;
  game.competition.runTime += dt;

  for (let i = 0; i < map.gates.length; i += 1) {
    const gate = map.gates[i];
    if (player.gatedPassed.has(i)) continue;
    const passWindow = 16;
    if (Math.abs(player.y - gate.y) <= passWindow) {
      const near = Math.abs(player.x - gate.x) < 90;
      if (near) {
        player.gatedPassed.add(i);
        addScore(40, 'Slalom Gate +40');
      }
    }
  }

  for (let i = 0; i < map.jumps.length; i += 1) {
    const jumpY = map.jumps[i];
    if (game.competition.jumpedPads.has(i)) continue;
    if (Math.abs(player.y - jumpY) <= 18 && player.onGround) {
      const ride = getCurrentRide();
      player.vz = Math.max(player.vz, 320 * ride.jumpMult);
      player.onGround = false;
      game.competition.jumpedPads.add(i);
      addScore(35 * ride.trickMult, 'Course jump +35');
    }
  }

  if (consumeAny(['KeyR', 'PadReturn'])) {
    game.mode = 'hub';
    game.competition = null;
    game.competitionResult = null;
    player.x = HUB_SPAWN.x;
    player.y = HUB_SPAWN.y;
    setMessage('Returned to city hub.', 1.5);
    return;
  }

  if (player.y >= map.length - 70) {
    let finalPoints = game.competition.points;
    let timeBonus = 0;
    if (map.key === 'downhill') {
      timeBonus = Math.max(120, Math.round(900 - game.competition.runTime * 22));
      addScore(timeBonus, `Speed bonus +${timeBonus}`);
      finalPoints = game.competition.points;
    }

    const medalCuts = map.medals;
    let placement = 4;
    let medal = 'No Medal';
    if (finalPoints >= medalCuts.gold) {
      placement = 1;
      medal = 'Gold';
    } else if (finalPoints >= medalCuts.silver) {
      placement = 2;
      medal = 'Silver';
    } else if (finalPoints >= medalCuts.bronze) {
      placement = 3;
      medal = 'Bronze';
    }

    const earnedTicket = placement === 1 ? 1 : 0;
    game.tickets += earnedTicket;
    game.mode = 'results';
    game.resultsTimer = 4.8;
    game.competitionResult = {
      competitionName: game.competition.name,
      points: Math.floor(finalPoints),
      placement,
      medal,
      runTime: game.competition.runTime,
      timeBonus,
      earnedTicket
    };
    setMessage(
      placement === 1
        ? `1st Place! ${medal} medal and +1 ticket earned!`
        : `${medal} medal - ${placement === 4 ? 'keep pushing for podium.' : `placed #${placement}`}`,
      4.2
    );
  }
}

function tryEnterCompetition() {
  const zone = getCurrentZone();
  if (!zone) return;
  if (game.tickets < zone.ticketCost) {
    setMessage(`Need ${zone.ticketCost} ticket to enter ${zone.name}.`, 2.3);
    return;
  }

  const map = competitionMaps[zone.key];
  game.tickets -= zone.ticketCost;
  game.mode = 'competition';
  game.competition = {
    key: zone.key,
    name: zone.name,
    map,
    runTime: 0,
    points: 0,
    jumpedPads: new Set()
  };

  resetPlayerStateForCompetition();
  player.x = map.laneCenterX;
  player.y = 80;
  player.heading = Math.PI / 2;
  player.vy = 170;
  game.competitionStartY = player.y;
  setMessage(`Entered ${zone.name}. Finish strong for a medal. Gold = 1st place +1 ticket!`, 3.2);
}

function update(dt) {
  updateGamepadInput();

  if (consumeAny(['KeyZ', 'PadRidePrev'])) {
    switchRide(-1);
  }
  if (consumeAny(['KeyX', 'PadRideNext'])) {
    switchRide(1);
  }

  player.pushCooldown = Math.max(0, player.pushCooldown - dt);
  player.trickCooldown = Math.max(0, player.trickCooldown - dt);
  game.messageTimer = Math.max(0, game.messageTimer - dt);

  if (game.mode === 'hub') {
    applyMovementHub(dt);
    updateHubSurfaceFeatures();
  } else if (game.mode === 'competition') {
    applyMovementCompetition(dt);
    player.surfaceLift = 0;
  } else {
    player.vx *= Math.max(0, 1 - 4.2 * dt);
    player.vy *= Math.max(0, 1 - 4.2 * dt);
    player.surfaceLift = 0;
  }

  player.speed = Math.hypot(player.vx, player.vy);

  if (game.mode !== 'results') {
    performTricks(dt);
  }
  updateVertical(dt);

  if (consumeAny(['KeyE', 'PadEnter']) && game.mode === 'hub') {
    tryEnterCompetition();
  }

  if (game.mode === 'competition') {
    updateCompetition(dt);
  } else if (game.mode === 'results') {
    game.resultsTimer = Math.max(0, game.resultsTimer - dt);
    if (game.resultsTimer <= 0) {
      game.mode = 'hub';
      game.competition = null;
      game.competitionResult = null;
      player.x = HUB_SPAWN.x;
      player.y = HUB_SPAWN.y;
      player.surfaceLift = 0;
      setMessage('Back in the city. Enter another event to win more tickets.', 2.8);
    }
  }

  if (game.messageTimer === 0 && ui.message.textContent !== HUB_MESSAGE) {
    ui.message.textContent = HUB_MESSAGE;
  }

  ui.score.textContent = Math.floor(game.score).toString();
  ui.tickets.textContent = game.tickets.toString();
  ui.ride.textContent = getCurrentRide().name;
  ui.state.textContent = game.mode === 'hub'
    ? 'Hub'
    : game.mode === 'competition'
      ? `${game.competition.name}`
      : `Results: ${game.competitionResult?.medal ?? 'Done'}`;
  ui.combo.textContent = player.grinding ? 'Grinding +8/s' : game.currentCombo;
}

function drawRoad(road) {
  ctx.fillStyle = '#2d3037';
  ctx.fillRect(road.x, road.y, road.w, road.h);
  if (road.lane) {
    ctx.strokeStyle = '#f7e892';
    ctx.lineWidth = 4;
    if (road.w > road.h) {
      const y = road.y + road.h / 2;
      for (let x = road.x + 18; x < road.x + road.w - 24; x += 38) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 22, y);
        ctx.stroke();
      }
    } else {
      const x = road.x + road.w / 2;
      for (let y = road.y + 18; y < road.y + road.h - 24; y += 38) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + 22);
        ctx.stroke();
      }
    }
  }
}

function drawCityBackground() {
  ctx.fillStyle = '#5d82ad';
  ctx.fillRect(0, 0, world.width, world.height);

  for (const road of world.roads) {
    drawRoad(road);
  }

  ctx.fillStyle = '#8aa5b1';
  ctx.fillRect(80, 580, 2640, 80);
  ctx.fillRect(80, 1070, 2640, 80);
  ctx.fillRect(1060, 70, 80, 1660);
  ctx.fillRect(1430, 70, 80, 1660);

  for (const building of world.buildings) {
    ctx.fillStyle = building.color;
    ctx.fillRect(building.x, building.y, building.w, building.h);
    ctx.fillStyle = '#d4e2ff22';
    for (let y = building.y + 18; y < building.y + building.h - 12; y += 28) {
      for (let x = building.x + 12; x < building.x + building.w - 10; x += 22) {
        ctx.fillRect(x, y, 12, 13);
      }
    }
  }

  for (const car of world.parkedCars) {
    const roofInset = 10;
    ctx.fillStyle = '#202836';
    ctx.fillRect(car.x + 4, car.y + 6, car.w - 8, car.h - 8);
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.w, car.h - 6);
    ctx.fillStyle = '#ffffff22';
    ctx.fillRect(car.x + roofInset, car.y + 8, car.w - roofInset * 2, car.h - 24);
    ctx.fillStyle = '#111927';
    if (car.orientation === 'horizontal') {
      ctx.fillRect(car.x + 12, car.y + car.h - 10, 18, 8);
      ctx.fillRect(car.x + car.w - 30, car.y + car.h - 10, 18, 8);
    } else {
      ctx.fillRect(car.x + 4, car.y + 12, 8, 18);
      ctx.fillRect(car.x + 4, car.y + car.h - 30, 8, 18);
      ctx.fillRect(car.x + car.w - 12, car.y + 12, 8, 18);
      ctx.fillRect(car.x + car.w - 12, car.y + car.h - 30, 8, 18);
    }
  }
}

function drawHubWorld() {
  drawCityBackground();

  for (const zone of world.zones) {
    ctx.fillStyle = `${zone.color}3a`;
    ctx.strokeStyle = zone.color;
    ctx.lineWidth = 3;
    ctx.fillRect(zone.x, zone.y, zone.w, zone.h);
    ctx.strokeRect(zone.x, zone.y, zone.w, zone.h);
    ctx.fillStyle = '#f5f7ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(zone.name, zone.x + 12, zone.y + 30);
    ctx.font = '14px sans-serif';
    ctx.fillText(`Entry: ${zone.ticketCost} ticket`, zone.x + 12, zone.y + 52);
  }

  ctx.strokeStyle = '#8de3ff';
  ctx.lineWidth = 8;
  for (const rail of world.railSegments) {
    ctx.beginPath();
    ctx.moveTo(rail.x1, rail.y1);
    ctx.lineTo(rail.x2, rail.y2);
    ctx.stroke();
  }

  for (const ramp of world.ramps) {
    const risingRight = ramp.dir === 'right';
    const risingLeft = ramp.dir === 'left';
    const risingUp = ramp.dir === 'up';
    ctx.fillStyle = '#2b374a';
    ctx.fillRect(ramp.x, ramp.y, ramp.w, ramp.h);
    ctx.fillStyle = '#546883';
    ctx.beginPath();
    if (risingRight) {
      ctx.moveTo(ramp.x, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + ramp.w, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + ramp.w, ramp.y + 12);
    } else if (risingLeft) {
      ctx.moveTo(ramp.x, ramp.y + 12);
      ctx.lineTo(ramp.x, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + ramp.w, ramp.y + ramp.h);
    } else if (risingUp) {
      ctx.moveTo(ramp.x, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + ramp.w, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + ramp.w - 12, ramp.y);
      ctx.lineTo(ramp.x + 12, ramp.y);
    } else {
      ctx.moveTo(ramp.x, ramp.y);
      ctx.lineTo(ramp.x + ramp.w, ramp.y);
      ctx.lineTo(ramp.x + ramp.w - 12, ramp.y + ramp.h);
      ctx.lineTo(ramp.x + 12, ramp.y + ramp.h);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8fb8ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(ramp.x + 2, ramp.y + 2, ramp.w - 4, ramp.h - 4);
  }
}

function drawCompetitionCourse() {
  const map = game.competition.map;
  const courseLength = map.length;
  ctx.fillStyle = '#192231';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cameraCourseY = Math.max(0, Math.min(courseLength - canvas.height, player.y - canvas.height * 0.34));
  game.cameraY = cameraCourseY;
  game.cameraX = 0;
  ctx.save();
  ctx.translate(0, -cameraCourseY);

  ctx.fillStyle = '#31455d';
  ctx.fillRect(0, 0, canvas.width, courseLength);

  ctx.fillStyle = '#2f3137';
  for (let y = 0; y < courseLength; y += 14) {
    const centerX = getCompetitionCenterXForY(y);
    ctx.fillRect(centerX - map.laneWidth / 2, y, map.laneWidth, 11);
  }

  ctx.strokeStyle = '#d6ecff66';
  ctx.lineWidth = 4;
  for (let y = 0; y < courseLength; y += 24) {
    const centerX = getCompetitionCenterXForY(y);
    ctx.beginPath();
    ctx.moveTo(centerX - map.laneWidth / 2, y);
    ctx.lineTo(centerX - map.laneWidth / 2, y + 12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + map.laneWidth / 2, y);
    ctx.lineTo(centerX + map.laneWidth / 2, y + 12);
    ctx.stroke();
  }

  ctx.strokeStyle = '#f4ec8a';
  ctx.lineWidth = 4;
  for (let y = 0; y < courseLength; y += 48) {
    const centerX = getCompetitionCenterXForY(y);
    ctx.beginPath();
    ctx.moveTo(centerX, y);
    ctx.lineTo(centerX, y + 20);
    ctx.stroke();
  }

  for (const y of map.jumps) {
    const centerX = getCompetitionCenterXForY(y);
    ctx.fillStyle = '#5f738e';
    ctx.beginPath();
    ctx.moveTo(centerX - 72, y + 35);
    ctx.lineTo(centerX + 72, y + 35);
    ctx.lineTo(centerX + 60, y);
    ctx.lineTo(centerX - 60, y);
    ctx.closePath();
    ctx.fill();
  }

  if (map.key === 'halfpipe') {
    for (let y = 40; y < courseLength; y += 110) {
      const centerX = getCompetitionCenterXForY(y);
      const half = map.laneWidth / 2;
      ctx.strokeStyle = '#8558ff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(centerX - half + 52, y + 38, 52, Math.PI * 1.03, Math.PI * 1.95);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerX + half - 52, y + 38, 52, Math.PI * 1.05, Math.PI * -0.05, true);
      ctx.stroke();
      ctx.strokeStyle = '#c6b2ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX - half + 4, y + 6);
      ctx.lineTo(centerX + half - 4, y + 6);
      ctx.stroke();
    }
  }

  for (const gate of map.gates) {
    const passed = [...player.gatedPassed].some((idx) => map.gates[idx] === gate);
    ctx.strokeStyle = passed ? '#9bff7a' : '#ff6c6c';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(gate.x, gate.y - 24);
    ctx.lineTo(gate.x, gate.y + 24);
    ctx.stroke();
    ctx.fillStyle = '#f1f5ff';
    ctx.fillRect(gate.x - 14, gate.y - 26, 28, 8);
    ctx.fillStyle = '#ff945f';
    ctx.beginPath();
    ctx.moveTo(gate.x - 30, gate.y + 24);
    ctx.lineTo(gate.x - 20, gate.y + 4);
    ctx.lineTo(gate.x - 10, gate.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(gate.x + 30, gate.y + 24);
    ctx.lineTo(gate.x + 20, gate.y + 4);
    ctx.lineTo(gate.x + 10, gate.y + 24);
    ctx.closePath();
    ctx.fill();
  }

  const finishY = courseLength - 70;
  ctx.fillStyle = '#ffffff22';
  for (let x = 0; x < canvas.width; x += 32) {
    ctx.fillRect(x, finishY, 16, 12);
    ctx.fillRect(x + 16, finishY + 12, 16, 12);
  }
  ctx.fillStyle = '#f7f8ff';
  ctx.font = '18px sans-serif';
  ctx.fillText('FINISH', 24, finishY - 8);

  drawPlayer();
  ctx.restore();
}

function drawSlothSprite() {
  const ride = getCurrentRide();
  const shadowScale = Math.max(0.5, 1 - player.z / 260);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 8, player.radius * 1.25 * shadowScale, player.radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawY = player.y - (player.z + player.surfaceLift);
  ctx.save();
  ctx.translate(player.x, drawY);
  ctx.rotate(player.heading);

  if (ride.key === 'bmx') {
    ctx.strokeStyle = '#7fd5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(-13, 4, 7, 0, Math.PI * 2);
    ctx.arc(13, 4, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-13, 4);
    ctx.lineTo(1, -6);
    ctx.lineTo(13, 4);
    ctx.moveTo(1, -6);
    ctx.lineTo(8, -13);
    ctx.moveTo(3, -9);
    ctx.lineTo(12, -9);
    ctx.moveTo(-2, -8);
    ctx.lineTo(-8, -13);
    ctx.stroke();
  } else if (ride.key === 'scooter') {
    ctx.fillStyle = '#8ed6ff';
    ctx.fillRect(-14, -1, 28, 8);
    ctx.strokeStyle = '#2d333f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(7, -1);
    ctx.lineTo(7, -19);
    ctx.moveTo(1, -18);
    ctx.lineTo(13, -18);
    ctx.stroke();
    ctx.fillStyle = '#20252f';
    ctx.beginPath();
    ctx.arc(-9, 8, 4, 0, Math.PI * 2);
    ctx.arc(9, 8, 4, 0, Math.PI * 2);
    ctx.fill();
  } else if (ride.key === 'inline') {
    ctx.fillStyle = '#2d333f';
    ctx.fillRect(-13, -2, 26, 7);
    ctx.fillStyle = '#7dd7ff';
    for (let i = -9; i <= 9; i += 6) {
      ctx.beginPath();
      ctx.arc(i, 7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ride.key === 'quad') {
    ctx.fillStyle = '#2d333f';
    ctx.fillRect(-13, -2, 26, 8);
    ctx.fillStyle = '#ffd66c';
    ctx.beginPath();
    ctx.arc(-9, 7, 3, 0, Math.PI * 2);
    ctx.arc(-3, 7, 3, 0, Math.PI * 2);
    ctx.arc(3, 7, 3, 0, Math.PI * 2);
    ctx.arc(9, 7, 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#2d333f';
    ctx.fillRect(-20, -6, 40, 12);
    ctx.fillStyle = '#8ed6ff';
    ctx.fillRect(-17, -4, 34, 8);
  }

  ctx.fillStyle = '#7b5a43';
  ctx.beginPath();
  ctx.ellipse(0, -15, 13, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b98e6b';
  ctx.beginPath();
  ctx.ellipse(0, -13, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#cda078';
  ctx.beginPath();
  ctx.arc(-6, -24, 4.2, 0, Math.PI * 2);
  ctx.arc(6, -24, 4.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e2027';
  ctx.beginPath();
  ctx.arc(-3, -14, 1.2, 0, Math.PI * 2);
  ctx.arc(3, -14, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2f3d52';
  ctx.fillRect(-10, -9, 6, 10);
  ctx.fillRect(4, -9, 6, 10);
  ctx.restore();
}

function drawPlayer() {
  drawSlothSprite();
}

function drawOverlay() {
  if (game.mode === 'hub') {
    const nearZone = getCurrentZone();
    if (nearZone) {
      ctx.fillStyle = 'rgba(5, 9, 15, 0.8)';
      ctx.fillRect(18, 16, 470, 52);
      ctx.fillStyle = '#f1f5ff';
      ctx.font = '20px sans-serif';
      ctx.fillText(`Press E to enter ${nearZone.name}`, 30, 48);
    }
  }

  if (game.mode === 'competition' && game.competition) {
    ctx.fillStyle = 'rgba(5, 9, 15, 0.8)';
    ctx.fillRect(canvas.width - 430, 16, 410, 104);
    ctx.fillStyle = '#f1f5ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(game.competition.name, canvas.width - 410, 40);
    ctx.font = '15px sans-serif';
    const progress = Math.min(100, Math.round((player.y / game.competition.map.length) * 100));
    ctx.fillText(`Score: ${Math.floor(game.competition.points)}`, canvas.width - 410, 62);
    ctx.fillText(`Run Time: ${game.competition.runTime.toFixed(1)}s`, canvas.width - 410, 82);
    ctx.fillText(`Course: ${progress}%`, canvas.width - 410, 102);
  }

  if (game.mode === 'results' && game.competitionResult) {
    const result = game.competitionResult;
    ctx.fillStyle = 'rgba(7, 12, 19, 0.82)';
    ctx.fillRect(canvas.width * 0.5 - 240, 120, 480, 260);
    ctx.strokeStyle = result.placement === 1 ? '#ffd66c' : '#9ec2ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(canvas.width * 0.5 - 240, 120, 480, 260);
    ctx.fillStyle = '#f8fbff';
    ctx.font = '30px sans-serif';
    ctx.fillText(result.placement === 1 ? '🏆 1st Place!' : `${result.medal}`, canvas.width * 0.5 - 140, 170);
    ctx.font = '20px sans-serif';
    ctx.fillText(`${result.competitionName}`, canvas.width * 0.5 - 185, 208);
    ctx.fillText(`Points: ${result.points}`, canvas.width * 0.5 - 185, 236);
    ctx.fillText(`Run Time: ${result.runTime.toFixed(2)}s`, canvas.width * 0.5 - 185, 262);
    if (result.timeBonus > 0) {
      ctx.fillText(`Speed Bonus: +${result.timeBonus}`, canvas.width * 0.5 - 185, 288);
    }
    ctx.fillStyle = result.earnedTicket > 0 ? '#9bff7a' : '#f3d3a6';
    ctx.fillText(
      result.earnedTicket > 0 ? '+1 Ticket for another park run!' : 'No ticket this run - go for Gold!',
      canvas.width * 0.5 - 185,
      322
    );
  }
}

function renderHub() {
  const cameraX = Math.max(0, Math.min(world.width - canvas.width, player.x - canvas.width / 2));
  const cameraY = Math.max(0, Math.min(world.height - canvas.height, player.y - canvas.height / 2));
  game.cameraX = cameraX;
  game.cameraY = cameraY;

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  drawHubWorld();
  drawPlayer();
  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (game.mode === 'hub') {
    renderHub();
  } else {
    drawCompetitionCourse();
  }
  drawOverlay();
}

function frame(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.033);
  lastTime = now;
  update(dt);
  render();
  input.justPressed.clear();
  requestAnimationFrame(frame);
}

setMessage('Welcome to Saucy Steve. Hit K to push and start rolling!', 4);
requestAnimationFrame(frame);
