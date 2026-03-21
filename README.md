# Saucy Steve the Skateboarding Sloth

An arcade-style skateboarding game inspired by classic 80s competition-driven gameplay, built around one core character first: **Saucy Steve**.

## Vision

Create a smooth, fun skate game loop in an open urban environment:

1. Skate around the city
2. Perform tricks to earn score/tickets
3. Use tickets to enter one of four competitions

Initial competitions (modeled after classic structure):

- Halfpipe
- Downhill
- Slalom
- Jump

## Scope for v0.1 (MVP)

### Core Gameplay

- One playable character (Saucy Steve)
- Open city hub with ramps/rails and trick opportunities
- Ticket earning loop from street tricks
- Enter 4 competition zones from hub
- Keyboard controls only

### Controls (recommended baseline)

Use **8-direction movement** for better feel and trick approach lines.

- `WASD` or Arrow keys: movement/steering (8-direction with key combinations)
- `K`: push/kick for speed
- `J`: ollie/jump
- `L`: spin modifier/action
- `Z` / `X`: switch ride type (previous/next)

Why 8-direction over 4-direction:

- Better navigation and line setup in an open city
- More natural approach to rails/ramps
- Better long-term path to advanced trick systems

### Trick Set (starter)

- Ollie
- Spin (with timing/airborne context)
- Basic grind
- Basic boardslide
- (Optional stretch) kickflip

## Technical Direction (starter)

Recommended approach for rapid iteration:

- **Engine**: JavaScript + HTML5 Canvas (or Phaser 3)
- **Architecture**: state-driven game loop
  - Hub state
  - Competition state
  - Results/reward state
- **Data-driven definitions** for:
  - Competitions
  - Trick scoring
  - Control mappings

## Controller Support

Yes—design for it now, implement later.

Plan:

1. Build an input abstraction layer now (`move`, `push`, `ollie`, `spin` actions)
2. Map keyboard first
3. Add Gamepad API mapping in a later milestone without rewriting gameplay code

## Milestones

### Milestone 1: Playable Prototype

- Character movement + momentum
- Camera and collision in small city slice
- Ollie and spin
- Basic score + ticket gain

### Milestone 2: Hub + Competitions

- Four competition entrances
- Entry cost in tickets
- Minimal rules per competition

### Milestone 3: Polish

- Better physics tuning
- Trick consistency and feedback
- UI/UX for score, ticket count, and objective prompts

## Naming Note

Project title for now:

**Saucy Steve the Skateboarding Sloth**

Avoid using "720" in title/branding to reduce trademark confusion risk while retaining inspiration in gameplay structure.

## Current Prototype Status

The repository now includes a playable browser prototype:

- [`index.html`](index.html) – game shell + HUD
- [`styles.css`](styles.css) – layout and visual styling
- [`src/main.js`](src/main.js) – game loop, movement, tricks, scoring, tickets, city hub art, and competition maps

Implemented in this prototype:

- 8-direction keyboard movement in the city hub
- Push (`K`), ollie (`J`), spin (`L`)
- Ride switching (`Z`/`X`) between:
  - Skateboard
  - Razor Scooter
  - Roller Blades
  - Quad Rollerskates
  - BMX Bike
- Score and ticket progression
- Open urban hub art pass (streets, sidewalks, buildings, parked cars, rails, ramps)
- Sloth-styled Saucy Steve sprite (head/body/limbs on board)
- Four competition zones in the hub (Halfpipe, Downhill, Slalom, Jump)
- Full-screen competition scenes that replace the city view
- Course-style competition behavior:
  - **Downhill**: gravity-assisted one-path run with turns
  - **Slalom**: downhill run with gate hits for bonus score
  - **Jump**: downhill run with frequent jump features
  - **Halfpipe**: dedicated arena with repeated jump opportunities
- Competition entry (`E`) and return (`R`)

Ride-specific tuning currently included:

- Unique acceleration, max speed, turn response, jump height, and trick scoring multipliers per ride type
- Ride-aware rendering in the player sprite so vehicle silhouettes differ in gameplay

## Run Locally

Because this project uses ES modules, serve the directory over HTTP (do not open `index.html` directly via `file://`).

Example using Python:

```bash
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```
