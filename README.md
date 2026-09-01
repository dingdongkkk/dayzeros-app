# Dayzeros

A calm focus app that lives on a single pixel-art meadow. One page to settle into,
one page to work in — a Pomodoro timer, a short task list, and synthesized ambience,
all sitting directly on the artwork with no chrome in the way.

![Dayzeros](assets/meadow.webp)

## The two screens

**Space** — the landing. Date and scene stamp, a live wall clock, streak and
daily-focus pills, and a serif hero, over a pill dock that drops you straight into work.

**Focus** — the workspace. A large serif countdown, the session caption, transport
controls, your task list, an ambience mixer, and the day's stats.

## What it actually does

- **Timer** — 25/5 Pomodoro that runs, pauses, resets, rolls into breaks on its own,
  advances the session counter, and banks focus minutes.
- **Tasks** — add, complete, delete. The first open task drives the `now` marker *and*
  the session caption on both screens, so checking one off re-labels the session.
- **Ambience** — rain, crickets and wind are generated live with the Web Audio API
  (filtered noise; crickets are LFO-gated bandpass chirps). The sliders are a real mixer.
- **Scenes** — cycles the meadow through dusk, night and dawn.
- **Stats** — focus minutes today and a day streak, computed from stored history.
- **Keyboard** — `space` start/pause, `R` reset, `S` scenes, `Esc` switch screens.

State lives in `localStorage`. A first visit seeds sample tasks and history so the
app looks like the design instead of an empty shell.

## Layout

```
index.html          the built, self-contained page — open it directly, no server needed
src/template.html   the source; identical but with a __MEADOW__ placeholder for the image
build.py            inlines assets/meadow.webp into the template to produce index.html
assets/             the background art
```

`index.html` is committed because the page is meant to be opened or hosted as one
file. After editing `src/template.html`, regenerate it:

```bash
python3 build.py
```

## Design

Built from a supplied design comp. Type is **Playfair Display** for display serif
(with old-style figures, so the countdown's `9` descends), **Space Mono** for every
label, pill and task line, and **Space Grotesk** for navigation. The background is
a dithered pixel-art meadow, kept at its native 3072×1536 so the dither grain stays
crisp; `assets/meadow-original.png` is the untouched source.
