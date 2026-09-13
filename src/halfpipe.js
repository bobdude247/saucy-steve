// Simulation-only halfpipe geometry and traversal helpers.
// Coordinates are independent of rendering: x is across the pipe, y is along it,
// and z is height above the flat bottom.

const HALF_PI = Math.PI / 2;

export const HALFPIPE_WIDTH = 520;
export const HALFPIPE_TRANSITION_RADIUS = 180;
export const HALFPIPE_TRANSITION_HEIGHT = 180;
export const HALFPIPE_BOTTOM_LENGTH = 160;
export const HALFPIPE_GRAVITY = 980;
export const HALFPIPE_LIP_TOLERANCE = 6;

export const HALFPIPE_HALF_WIDTH = HALFPIPE_WIDTH / 2;
export const HALFPIPE_TRANSITION_RUN = HALFPIPE_HALF_WIDTH - HALFPIPE_BOTTOM_LENGTH / 2;
export const HALFPIPE_LENGTH = HALFPIPE_BOTTOM_LENGTH + (2 * HALFPIPE_TRANSITION_RUN);

export const HALFPIPE = Object.freeze({
  width: HALFPIPE_WIDTH,
  transitionRadius: HALFPIPE_TRANSITION_RADIUS,
  transitionHeight: HALFPIPE_TRANSITION_HEIGHT,
  bottomLength: HALFPIPE_BOTTOM_LENGTH,
  length: HALFPIPE_LENGTH,
  gravity: HALFPIPE_GRAVITY,
  lipTolerance: HALFPIPE_LIP_TOLERANCE
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function transitionSurface(x) {
  const side = Math.sign(x) || 1;
  const distanceFromTransition = Math.abs(x) - HALFPIPE_BOTTOM_LENGTH / 2;
  const radius = HALFPIPE_TRANSITION_RADIUS;
  const rise = Math.sqrt(Math.max(0, (radius * radius) - (distanceFromTransition ** 2)));
  return HALFPIPE_TRANSITION_HEIGHT - rise;
}

function transitionSlope(x) {
  const side = Math.sign(x) || 1;
  const distanceFromTransition = Math.abs(x) - HALFPIPE_BOTTOM_LENGTH / 2;
  if (distanceFromTransition <= 0) return 0;
  const radius = HALFPIPE_TRANSITION_RADIUS;
  if (distanceFromTransition >= radius) return side * Infinity;
  return side * distanceFromTransition / Math.sqrt(Math.max(0, (radius * radius) - (distanceFromTransition * distanceFromTransition)));
}

/** Return the surface height and slope at a lateral position. */
export function getSurfaceHeight(x) {
  const lateral = clamp(Number(x) || 0, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH);
  if (Math.abs(lateral) <= HALFPIPE_BOTTOM_LENGTH / 2) return 0;
  return transitionSurface(lateral);
}

/** Return a unit normal pointing up from the rideable surface. */
export function getSurfaceNormal(x) {
  const lateral = clamp(Number(x) || 0, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH);
  if (Math.abs(lateral) <= HALFPIPE_BOTTOM_LENGTH / 2) return { x: 0, z: 1 };

  const slope = transitionSlope(lateral);
  if (!Number.isFinite(slope)) return { x: -Math.sign(lateral), z: 0 };
  const length = Math.sqrt(1 + (slope * slope));
  return { x: -slope / length, z: 1 / length };
}

/** Map a simulation position onto the surface without changing its longitudinal coordinate. */
export function mapPositionToSurface(position, options = {}) {
  const lateral = clamp(Number(position?.x) || 0, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH);
  const heightOffset = Number(options.heightOffset) || 0;
  return {
    x: lateral,
    y: Number(position?.y) || 0,
    z: getSurfaceHeight(lateral) + heightOffset,
    normal: getSurfaceNormal(lateral)
  };
}

/** Advance signed lateral speed under gravity on the pipe slope. */
export function updateSpeedBySlope(speed, x, dt, options = {}) {
  const deltaTime = Math.max(0, Number(dt) || 0);
  const gravity = Number.isFinite(options.gravity) ? options.gravity : HALFPIPE_GRAVITY;
  const drag = Math.max(0, Number(options.drag) || 0);
  const slope = transitionSlope(clamp(Number(x) || 0, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH));
  const acceleration = Number.isFinite(slope) ? -gravity * slope : 0;
  const dampedSpeed = (Number(speed) || 0) * Math.max(0, 1 - drag * deltaTime);
  return dampedSpeed + acceleration * deltaTime;
}

/** Identify whether a lateral position is at either lip. */
export function detectLip(x, tolerance = HALFPIPE_LIP_TOLERANCE) {
  const lateral = Number(x) || 0;
  const margin = Math.max(0, Number(tolerance) || 0);
  const atLeft = Math.abs(lateral + HALFPIPE_HALF_WIDTH) <= margin;
  const atRight = Math.abs(lateral - HALFPIPE_HALF_WIDTH) <= margin;
  return {
    atLip: atLeft || atRight,
    side: atLeft ? 'left' : atRight ? 'right' : null,
    x: clamp(lateral, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH)
  };
}

export function createHalfpipeSession(initial = {}) {
  const x = clamp(Number(initial.x) || 0, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH);
  return {
    x,
    y: Number(initial.y) || 0,
    speed: Number(initial.speed) || 0,
    elapsed: 0,
    traversals: 0,
    lastLip: null,
    complete: false
  };
}

/** Advance a session and count each completed lip-to-lip traversal. */
export function stepHalfpipeSession(session, dt, options = {}) {
  const current = session || createHalfpipeSession();
  const deltaTime = Math.max(0, Number(dt) || 0);
  const speed = updateSpeedBySlope(current.speed, current.x, deltaTime, options);
  const nextX = current.x + speed * deltaTime;
  const clampedX = clamp(nextX, -HALFPIPE_HALF_WIDTH, HALFPIPE_HALF_WIDTH);
  const lip = detectLip(clampedX, options.lipTolerance);
  const crossed = lip.atLip && current.lastLip && lip.side !== current.lastLip;
  const next = {
    ...current,
    x: clampedX,
    speed: nextX === clampedX ? speed : -speed,
    elapsed: current.elapsed + deltaTime,
    traversals: current.traversals + (crossed ? 1 : 0),
    lastLip: lip.atLip ? lip.side : current.lastLip,
    complete: Boolean(options.targetTraversals && current.traversals + (crossed ? 1 : 0) >= options.targetTraversals)
  };
  return next;
}

export function resetHalfpipeSession(session = {}) {
  return createHalfpipeSession(session);
}

export function getTraversalProgress(session, targetTraversals = 1) {
  const target = Math.max(1, Number(targetTraversals) || 1);
  return {
    completed: Math.max(0, Number(session?.traversals) || 0),
    target,
    ratio: clamp((Number(session?.traversals) || 0) / target, 0, 1),
    complete: (Number(session?.traversals) || 0) >= target
  };
}

export const HALFPIPE_SURFACE = Object.freeze({
  bottomAngle: 0,
  transitionAngle: HALF_PI,
  getHeight: getSurfaceHeight,
  getNormal: getSurfaceNormal,
  mapPosition: mapPositionToSurface
});

// Short aliases keep the module convenient to wire into a competition update loop.
export const surfaceHeight = getSurfaceHeight;
export const surfaceNormal = getSurfaceNormal;
export const positionToSurface = mapPositionToSurface;
export const updateSpeed = updateSpeedBySlope;
export const isAtLip = detectLip;
