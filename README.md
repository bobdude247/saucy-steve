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
- Keyboard and standard gamepad controls

### Controls (Milestone 1)

Use **8-direction movement** for better feel and trick approach lines.

- `WASD` or Arrow keys: movement/steering (8-direction with key combinations)
- `K`: push/kick for speed
- `J`: ollie/jump
- `L`: queue 180-degree spin increments while airborne, or pivot on the ground at speed
- `Space`: brake while grounded in the city hub; `S` / Down Arrow remain southward steering
- `Z` / `X`: switch ride type (previous/next)
- `E`: enter a competition when inside its hub zone (costs 1 ticket)
- `R`: return to the city hub during a competition

Gamepad support is implemented for standard browser gamepads:

- Left stick or D-pad: movement/steering
- R2: push/kick for speed
- X (Cross): ollie/jump
- Square: spin
- Circle/B: enter a competition zone
- Options: return to the hub during a competition
- L1 / R1: switch ride type (previous/next)

Why 8-direction over 4-direction:

- Better navigation and line setup in an open city
- More natural approach to rails/ramps
- Better long-term path to advanced trick systems

### Trick Set (Milestone 1)

- Ollie
- Spin (queue 180-degree increments during the 0.65-second airborne window; it scores only on a clean landing)
- Rails are visual landmarks in Milestone 1; contact-based grinding is deferred
- Basic boardslide (planned; not implemented)
- (Optional stretch) kickflip (not implemented)

Boardslides and kickflips remain planned work for a later milestone.

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

Gamepad support is implemented through the browser Gamepad API and shares the
same movement, push, ollie, spin, ride-switching, and event actions as the
keyboard controls. Keyboard controls remain active if a controller is
disconnected.

## Milestones

### Milestone 1: Playable Prototype

- 8-direction character movement with momentum and world-boundary collision
- Camera-following open city hub with ramps, rails, solid buildings, and solid parked cars
- Ramps provide launch triggers; rails do not award proximity-based grind points
- Ollie and timed airborne spin, with spin points awarded only after a clean landing
- Ground braking with `S`, Down Arrow, or `Space`
- Basic score and ticket gain from tricks (1 ticket per 300 total score)
- Five selectable ride types with different movement, jump, and scoring tuning
- Standard gamepad input alongside keyboard controls

The hub displays a practice line objective: complete an ollie, queue a spin,
and land it cleanly. The HUD also tracks progress toward the 300-point ticket
threshold; the practice objective does not replace the normal score-based
ticket rule.

Landing on a solid obstacle or outside the spin alignment tolerance causes a
bail with no trick score. A bail reduces momentum and briefly prevents another
ollie while Steve recovers.

The current prototype also includes the planned hub entrances and four
course-style competitions. Each event costs 1 ticket; finishing produces a
medal based on score, and first place awards 1 ticket. Competition-specific
features include downhill speed bonuses, slalom gates, jump pads, and
halfpipe jump opportunities.

### Milestone 2: Hub + Competitions (partially implemented)

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

- 8-direction keyboard and gamepad movement in the city hub
- Push (`K`), ollie (`J`), spin (`L`)
- Competition entry (`E`) and return (`R`)
- Ride switching (`Z`/`X`) between:
  - Skateboard
  - Razor Scooter
  - Roller Blades
  - Quad Rollerskates
  - BMX Bike
- Score and ticket progression
- Open urban hub art pass (streets, sidewalks, buildings, parked cars, rails, ramps, and a marked practice line)
- Sloth-styled Saucy Steve sprite (head/body/limbs on board)
- Four competition zones in the hub (Halfpipe, Downhill, Slalom, Jump)
- Full-screen competition scenes that replace the city view
- Course-style competition behavior:
  - **Downhill**: gravity-assisted one-path run with turns
  - **Slalom**: downhill run with gate hits for bonus score
  - **Jump**: downhill run with frequent jump features
  - **Halfpipe**: timed wall-to-wall session on a curved surface; `A`/`D` steer across the pipe, `K` pushes, `J` ollies, and `L` spins at the lips
- Rails remain visual landmarks; contact-based grinding is deferred

Ride-specific tuning currently included:

- Unique acceleration, max speed, turn response, jump height, and trick scoring multipliers per ride type
- Ride-aware rendering in the player sprite so vehicle silhouettes differ in gameplay

Future direction, not implemented here:

- Multiple characters with specialties without permanent vehicle restrictions
- Vehicle shops, moving traffic, and other riders
- Optional obstacle/challenge configurations selected by vehicle on entry
- Permanent park identity and layout kept separate from optional configurations

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

## Publish to GitHub Pages

This repo is configured to deploy automatically with GitHub Actions when you push to `main`.

### 1) Push this repository to GitHub

Make sure your default branch is `main`, then push your project.

### 2) Enable GitHub Pages to use Actions

In your GitHub repository:

1. Open **Settings → Pages**
2. Under **Build and deployment**, set **Source** to **GitHub Actions**

The workflow at [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml:1) also includes automatic enablement (`enablement: true`) to help first-time setup.

### 3) Trigger deployment

Deployment runs automatically on every push to `main`.

You can also run it manually from **Actions → Deploy Saucy Steve to GitHub Pages → Run workflow**.

### 4) Open your live game URL

After the workflow finishes, your game will be live at:

```text
https://<your-github-username>.github.io/<your-repo-name>/
```

This project uses relative paths in [`index.html`](index.html), so no additional base-path configuration is required for GitHub Pages.
