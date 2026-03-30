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
  theme-wood.css    warm amber color theme
js/
  audio.js          Web Audio API, crackle synthesis, fades
  render.js         canvas rendering, tonearm geometry
  player.js         playback state, controls, file loading
```

No build step. No framework. Open `index.html` directly in a browser.

## Theming

To create a new color theme, duplicate `css/theme-wood.css`, rename it, and change the colors. Then swap the `<link>` in `index.html`. The theme file controls all colors; `main.css` controls all layout.

## Dependencies

- [jsmediatags](https://github.com/nicktindall/jsmediatags) — reads embedded album art from audio file metadata (loaded from CDN)
