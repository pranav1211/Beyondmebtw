# mynyl

A browser-based vinyl record player. Drop an audio file, drag the tonearm onto the record, and listen.

**Demo:** [mynyl.beyondembtw.com](https://mynyl.beyondembtw.com)

---

## Usage

1. Click **Drop file or browse** (or drag a file onto the window) to load a track
2. Drag the tonearm onto the edge of the record — it snaps into place and the record spins up
3. Two seconds of vinyl crackle, then the music starts
4. The arm travels across the record in real time as the song plays
5. When the song ends, crackle plays for two seconds, then the arm parks itself

### Controls

| Control | Action |
|---|---|
| Click arm → drag to record | Start playback |
| Play/Pause button | Play or pause |
| Stop button | Stop and reset to beginning |
| Prev button | Restart from beginning |
| Fwd button | Skip forward 10 seconds |
| Volume slider | Adjust volume |
| `Space` | Play / Pause |
| `←` / `→` | Seek back / forward 5 seconds |
| `↑` / `↓` | Volume up / down |

### Supported formats

MP3, FLAC, M4A, AAC, OGG, OPUS, WAV, WMA

### Album art

If the audio file has embedded cover art, it appears in the spinning label at the center of the record and in the OS media overlay.

### OS media integration

On Windows, the track appears in the system volume overlay and lock screen with title, artist, and album art. Play/pause/previous controls work from there too.

---

## Files

```
index.html
css/
  main.css          layout and structure
themes/
  _template/        base theme handoff package for new themes
  wood/             warm amber theme
  minimal-light/    bright minimal theme
js/
  audio.js          Web Audio API, crackle synthesis, fades
  render.js         canvas rendering, theme contract, tonearm geometry
  player.js         playback state, controls, file loading
```

No build step. No framework. Open `index.html` directly in a browser.

## Theming

Themes are now full visual packs, not just color swaps.

To create a new theme:

1. Duplicate `themes/_template/` or an existing theme folder like `themes/wood/`
2. Rename it, for example `themes/brushed-steel/`
3. Edit `theme.css`, the component CSS files, and `theme.js` if needed
4. Add the new theme to the switcher mapping in `js/player.js`

Theme structure:

- theme entrypoint: `themes/wood/theme.css`
- theme behavior: `themes/wood/theme.js`
- background/layout tokens: `themes/wood/background.css`
- vinyl/label tokens: `themes/wood/vinyl.css`
- tonearm tokens: `themes/wood/arm.css`
- UI shell styles: `themes/wood/ui.css`

Included themes:

- `wood` — warm amber / mahogany
- `minimal-light` — bright white deck with a slim modern arm and splatter-style vinyl
- `_template` — starter package with geometry notes and JS hook stubs for AI handoff

The theme file can control:

- background glow and drift
- record scale and arm pivot placement
- vinyl renderer style (`classic`, `etched`, `minimal`)
- groove density, sheen, rim lighting, label sizing
- tonearm renderer style (`classic`, `straight`, `chunky`)
- headshell bend/length, counterweight size, pivot size, needle styling
- all UI colors and panel treatments

Theme JS can optionally override canvas drawing, so a theme is not limited to the built-in arm/record shapes. The starter handoff doc lives in `themes/_template/README.md`.

`main.css` still owns structure. Each `themes/<name>/` folder owns that theme’s palette, canvas appearance, and optional drawing behavior.

If you swap the theme dynamically in the browser, `render.js` exposes `window.refreshMynylTheme()` and `window.setMynylTheme({ cssHref, scriptHref, themeName })`.

## Dependencies

- [jsmediatags](https://github.com/nicktindall/jsmediatags) — reads embedded album art from audio file metadata (loaded from CDN)
