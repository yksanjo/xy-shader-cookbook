# Neon Dodger

![Neon Dodger Hero](assets/hero.svg)

Arcade canvas game with neon glow. Dodge obstacles, heal with pickups, and blast aliens for bonus points. Smooth controls, juicy particles, and a reactive health gauge.

## Play
- Local: `python3 -m http.server 8765` then open `http://localhost:8765/`
- GitHub Pages: enable in repo Settings → Pages, deploy from `main` (root)

## Controls
- Move: Arrow keys or `WASD`
- Shoot: `Space` or `J` while alive
- Restart: press `Space` after game over or click `Restart`

## Features
- Glow visuals: gradient background, starfield, trail, and shadows
- Obstacles to dodge plus shootable alien ships with HP
- Health gauge with dynamic color and invincibility frames on hit
- Green heal pickups restore HP with satisfying bursts
- Particle explosions and subtle camera shake on impacts
- Score with best record saved in `localStorage`

## Tech
- Plain HTML/CSS/JS with a single `canvas` render loop
- No external libraries; fast to load and easy to hack

## Folder Structure
- `index.html` — game shell and HUD
- `style.css` — minimal styling and HUD layout
- `script.js` — game loop, input, physics, rendering
- `assets/hero.svg` — cover image for README

## License
MIT