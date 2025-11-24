# XY Shader Cookbook

Interactive gallery of XY-based fragment shaders rendered in WebGL, with a live control panel and instant preview. Switch between the original arcade game and shader mode.

## Try It
- Local: `python3 -m http.server 8765` then open `http://localhost:8765/`
- GitHub Pages: enable in repo Settings → Pages, deploy from `main` (root)

## Modes
- Game: original neon-dodger canvas game (arrows/WASD to move, `Space`/`J` to shoot)
- Shaders: full-screen preview with controls for shader selection and parameters

## Shader Controls
- Shader: choose `Rings`, `Checkerboard`, `Plasma`, `Waves`
- Param A: uniform `u_a`
- Param B: uniform `u_b`
- Time: `u_time` animates automatically
- Resolution: `u_res` set per frame

## Add Your Shader
Edit `shaderSrc(name)` in `script.js` and return a fragment body that sets `col` using `uv` (`0..1`) and `p` (`-1..1`):

```
// example: stripes
return `float v = step(0.5, fract(uv.x*u_a)); col = mix(vec3(0.1,0.1,0.3), vec3(0.9,0.8,0.2), v);`;
```

Available uniforms: `u_time`, `u_res`, `u_a`, `u_b`

## Files
- `index.html` — UI, game canvas, shader canvas
- `style.css` — HUD, mode buttons, shader control panel
- `script.js` — game loop and WebGL shader rendering

## License
MIT