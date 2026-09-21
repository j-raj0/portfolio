# Jarif Raj — Graphic Design portfolio

This is the same site as the published artifact, split into normal files so
it's easy to edit in an editor:

```
portfolio-site/
├── index.html      the page skeleton — menu markup + project markup
├── styles.css       all styling, including the fan-out stack, the wipe
│                    transition, the project layout, and @font-face
├── script.js         all behaviour — the stack, the sweep, the pixel-resolve
│                    loader, the synthesised sound, the project content
└── fonts/
    └── The_Picnic_Club_Regular.woff2
```

## Viewing it

Just open `index.html` in a browser — everything uses relative paths, so it
works straight off disk. If you'd rather run it through a local server
(needed for some browser features, not needed here, but no harm either way),
VS Code's **Live Server** extension is the easiest route: right-click
`index.html` → "Open with Live Server".

Two fonts come from Google Fonts over the network (Instrument Serif and
Chakra Petch, used as fallbacks/body text) — those need an internet
connection. The Picnic Club is bundled in `fonts/`, so the display type
always renders even offline.

## Where to edit things

Almost everything content-related lives in one place: the `PROJECTS` array
near the top of `script.js`'s `<script>` logic (search for `const PROJECTS`).
Each entry is one sheet in the stack — its title, its images, its intro
text, and its `sections` (the STAGE 1 / STAGE 2 / etc. blocks). The comment
block directly above it explains the shape and how images can be a count
(placeholder art) or an array of real image sources.

A few other knobs, all commented in place in `script.js`:
- `PHASES` — the pixel-resolve steps for the loading effect; set to `[0]` to turn it off entirely
- `HOVER_SOUND` — set to `false` to drop the hover rustle and keep only the slide sound
- `ANGLE` — the tilt of the whole paper stack

Layout tuning (spacing, type size, the fan-out amounts) lives in
`styles.css` as CSS custom properties on `.stack` (`--gap`, `--out`,
`--push`, `--reveal`, `--title-lift`) and a handful of `clamp(...)` values
for type size and section spacing.

## Bringing changes back to Claude

If you want to hand edited files back to me — to republish as a Claude
artifact, or to keep working on it here — Claude artifacts have to be one
self-contained HTML file (styles and script inlined, fonts embedded as
base64). Just say so and paste or upload the changed file(s); reassembling
into one file is quick to do from this end.
