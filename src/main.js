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
  rideIndex: 0
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
    { x: 880, y: 705, w: 68, h: 32, color: '#f07d5d' },
    { x: 960, y: 1020, w: 68, h: 32, color: '#76d3ff' },
    { x: 1435, y: 520, w: 32, h: 66, color: '#9bff7a' },
    { x: 1090, y: 1085, w: 32, h: 66, color: '#ffd66c' }
  ],
  railSegments: [
    { x1: 700, y1: 620, x2: 1020, y2: 620 },
    { x1: 1550, y1: 1170, x2: 1900, y2: 1170 }
  ],
  ramps: [
    { x: 520, y: 500, w: 170, h: 130 },
    { x: 1310, y: 620, w: 220, h: 170 },
    { x: 1930, y: 1330, w: 260, h: 180 }
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
    duration: 34,
    target: 620,
    gravityAssist: 0,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 470,
    segments: [
      { yStart: 0, yEnd: 1500, centerX: canvas.width * 0.5 }
    ],
    gates: [],
    jumps: [380, 760, 1140]
  },
  downhill: {
    key: 'downhill',
    name: 'Downhill Competition',
    duration: 30,
    target: 700,
    gravityAssist: 220,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 380,
    segments: [
      { yStart: 0, yEnd: 420, centerX: 600 },
      { yStart: 420, yEnd: 870, centerX: 520 },
      { yStart: 870, yEnd: 1270, centerX: 660 },
      { yStart: 1270, yEnd: 1600, centerX: 540 }
    ],
    gates: [],
    jumps: [530, 960, 1360]
  },
  slalom: {
    key: 'slalom',
    name: 'Slalom Competition',
    duration: 32,
    target: 760,
    gravityAssist: 170,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 420,
    segments: [
      { yStart: 0, yEnd: 360, centerX: 560 },
      { yStart: 360, yEnd: 760, centerX: 640 },
      { yStart: 760, yEnd: 1140, centerX: 520 },
      { yStart: 1140, yEnd: 1600, centerX: 620 }
    ],
    gates: [
      { y: 260, x: 470, side: 'left' },
      { y: 420, x: 690, side: 'right' },
      { y: 590, x: 440, side: 'left' },
      { y: 760, x: 700, side: 'right' },
      { y: 930, x: 450, side: 'left' },
      { y: 1100, x: 700, side: 'right' },
      { y: 1270, x: 470, side: 'left' }
    ],
    jumps: [650, 1230]
  },
  jump: {
    key: 'jump',
    name: 'Jump Competition',
    duration: 30,
    target: 680,
    gravityAssist: 180,
    laneCenterX: canvas.width * 0.5,
    laneWidth: 390,
    segments: [
      { yStart: 0, yEnd: 380, centerX: 560 },
      { yStart: 380, yEnd: 740, centerX: 520 },
      { yStart: 740, yEnd: 1040, centerX: 620 },
      { yStart: 1040, yEnd: 1600, centerX: 580 }
    ],
    gates: [],
    jumps: [280, 520, 820, 1150, 1420]
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
  maxSpeed: 355,
  accel: 360,
  friction: 2.6,
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
  gatedPassed: new Set()
};

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
  const left = input.isDown('KeyA') || input.isDown('ArrowLeft');
  const right = input.isDown('KeyD') || input.isDown('ArrowRight');
  const up = input.isDown('KeyW') || input.isDown('ArrowUp');
  const down = input.isDown('KeyS') || input.isDown('ArrowDown');

  const mx = (right ? 1 : 0) - (left ? 1 : 0);
  const my = (down ? 1 : 0) - (up ? 1 : 0);

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

  if (input.consume('KeyK') && player.pushCooldown <= 0 && player.onGround) {
    const pushPower = 132 * ride.accelMult;
    player.vx += Math.cos(player.heading) * pushPower;
    player.vy += Math.sin(player.heading) * pushPower;
    player.pushCooldown = 0.18;
    setMessage('Push! Keep building speed.', 1.2);
  }

  if (move.length > 0 && player.onGround) {
    const accel = player.accel * ride.accelMult;
    player.vx += Math.cos(player.heading) * accel * dt * 0.45;
    player.vy += Math.sin(player.heading) * accel * dt * 0.45;
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

function applyMovementCompetition(dt) {
  const ride = getCurrentRide();
  const move = getMoveVector();
  const turnStrength = 310 * ride.turnMult;

  if (input.consume('KeyK') && player.pushCooldown <= 0 && player.onGround) {
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

  if (player.y > 1600) {
    player.y = 1600;
    player.vy = 220;
  }
}

function performTricks(dt) {
  const ride = getCurrentRide();
  if (input.consume('KeyJ') && player.onGround && player.trickCooldown <= 0) {
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

  if (input.consume('KeyL')) {
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

  game.competition.timeLeft -= dt;

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

  if (input.consume('KeyR')) {
    game.mode = 'hub';
    game.competition = null;
    player.x = 1040;
    player.y = 860;
    setMessage('Returned to city hub.', 1.5);
    return;
  }

  if (game.competition.timeLeft <= 0) {
    const reached = game.competition.points >= game.competition.target;
    if (reached) {
      game.tickets += 1;
      setMessage('Competition cleared! Bonus ticket +1', 3.2);
    } else {
      setMessage('Competition ended. Keep training in the hub.', 3.2);
    }
    game.mode = 'hub';
    game.competition = null;
    player.x = 1040;
    player.y = 860;
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
    timeLeft: map.duration,
    points: 0,
    target: map.target
  };

  resetPlayerStateForCompetition();
  player.x = map.laneCenterX;
  player.y = 80;
  player.heading = Math.PI / 2;
  player.vy = 170;
  game.competitionStartY = player.y;
  setMessage(`Entered ${zone.name}. Follow the course and hit ${map.target} points!`, 3);
}

function update(dt) {
  if (input.consume('KeyZ')) {
    switchRide(-1);
  }
  if (input.consume('KeyX')) {
    switchRide(1);
  }

  player.pushCooldown = Math.max(0, player.pushCooldown - dt);
  player.trickCooldown = Math.max(0, player.trickCooldown - dt);
  game.messageTimer = Math.max(0, game.messageTimer - dt);

  if (game.mode === 'hub') {
    applyMovementHub(dt);
  } else {
    applyMovementCompetition(dt);
  }

  player.speed = Math.hypot(player.vx, player.vy);

  performTricks(dt);
  updateVertical(dt);

  if (input.consume('KeyE') && game.mode === 'hub') {
    tryEnterCompetition();
  }

  if (game.mode === 'competition') {
    updateCompetition(dt);
  }

  if (game.messageTimer === 0 && ui.message.textContent !== HUB_MESSAGE) {
    ui.message.textContent = HUB_MESSAGE;
  }

  ui.score.textContent = Math.floor(game.score).toString();
  ui.tickets.textContent = game.tickets.toString();
  ui.ride.textContent = getCurrentRide().name;
  ui.state.textContent = game.mode === 'hub'
    ? 'Hub'
    : `${game.competition.name} (${Math.ceil(game.competition.timeLeft)}s)`;
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
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.w, car.h);
    ctx.fillStyle = '#111927';
    if (car.w > car.h) {
      ctx.fillRect(car.x + 10, car.y + 7, car.w - 20, car.h - 14);
    } else {
      ctx.fillRect(car.x + 7, car.y + 10, car.w - 14, car.h - 20);
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
    ctx.fillStyle = '#3f4f6a';
    ctx.beginPath();
    ctx.moveTo(ramp.x, ramp.y + ramp.h);
    ctx.lineTo(ramp.x + ramp.w, ramp.y + ramp.h);
    ctx.lineTo(ramp.x + ramp.w, ramp.y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawCompetitionCourse() {
  const map = game.competition.map;
  ctx.fillStyle = '#192231';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cameraCourseY = Math.max(0, Math.min(1600 - canvas.height, player.y - canvas.height * 0.34));
  game.cameraY = cameraCourseY;
  game.cameraX = 0;
  ctx.save();
  ctx.translate(0, -cameraCourseY);

  ctx.fillStyle = '#31455d';
  ctx.fillRect(0, 0, canvas.width, 1600);

  ctx.fillStyle = '#2f3137';
  for (let y = 0; y < 1600; y += 14) {
    const centerX = getCompetitionCenterXForY(y);
    ctx.fillRect(centerX - map.laneWidth / 2, y, map.laneWidth, 11);
  }

  ctx.strokeStyle = '#d6ecff66';
  ctx.lineWidth = 4;
  for (let y = 0; y < 1600; y += 24) {
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
  for (let y = 0; y < 1600; y += 48) {
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
    ctx.strokeStyle = '#9b74ff';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(map.laneCenterX, 1420, map.laneWidth / 2, Math.PI, 0);
    ctx.stroke();
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
  }

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

  const drawY = player.y - player.z;
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
    ctx.fillRect(canvas.width - 390, 16, 370, 86);
    ctx.fillStyle = '#f1f5ff';
    ctx.font = '18px sans-serif';
    ctx.fillText(game.competition.name, canvas.width - 370, 40);
    ctx.font = '15px sans-serif';
    ctx.fillText(`Score: ${Math.floor(game.competition.points)} / ${game.competition.target}`, canvas.width - 370, 62);
    ctx.fillText(`Time: ${Math.ceil(game.competition.timeLeft)}s`, canvas.width - 370, 82);
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
