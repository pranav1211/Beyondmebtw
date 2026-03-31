# Theme Template

Use this folder as the handoff package for a new theme.

## Files

- `theme.css` — the entrypoint the app loads
- `theme.js` — optional JS overrides for custom arm/record rendering
- `background.css` — layout geometry, background, drag/drop hint
- `vinyl.css` — record, grooves, sheen, label
- `arm.css` — built-in arm styling tokens
- `ui.css` — panel/buttons/theme switcher colors

## Geometry notes

- `--player-record-scale` controls record size relative to the viewport
- `--arm-pivot-offset-x` / `--arm-pivot-offset-y` place the pivot relative to the record center in record radii
- `--arm-outer-radius` is the playback start groove radius
- `--arm-inner-radius` is the playback end groove radius
- `--arm-outer-offset-x` / `--arm-outer-offset-y` define the point on the outer groove where the arm snaps when dropped
- `--arm-park-offset-x` / `--arm-park-offset-y` define the idle parked target

## When CSS is enough

Use only CSS when you want:

- a new palette
- groove, sheen, label, or drop-shadow changes
- built-in arm variations using `classic`, `straight`, or `chunky`
- geometry tweaks like pivot placement or record size

## When to use theme.js

Use `theme.js` when you want:

- a fully custom arm silhouette
- a record draw style that is not covered by the built-in renderer
- custom accents or composed shapes that are easier to express in canvas code

Available hooks:

- `drawArm({ angle, theme, geo, pivot, viewport, ctx, canvas, defaults, helpers })`
- `drawRecord({ angle, theme, geo, record, ctx, canvas, state, defaults, helpers })`

Useful values:

- `geo.ARM_LEN`, `geo.aOuter`, `geo.aInner`, `geo.aParked`
- `pivot.x`, `pivot.y`
- `record.radius`, `record.cx`, `record.cy`
- `helpers.toRad(angle)`
- `defaults.drawArm(angle)` / `defaults.drawRecord(angle)` if you want to wrap the built-in renderer instead of replacing it entirely
