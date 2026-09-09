# padremote.github.io

The landing page for [PadRemote](https://github.com/padremote/padremote) — a
wireless trackpad for your Mac that runs on the phone already in your pocket.

Published by GitHub Pages from `main` at <https://padremote.github.io>.

## Layout

```
index.html            the whole site: one page, anchored sections
src/input.css         the Tailwind entry - tokens, base defaults
assets/tailwind.css   built from it, and committed, so Pages serves static files
assets/img/           screenshots, captured from the running app
```

The palette is the app's own, copied from `docs/dev/design.md` in the PadRemote
repo. Keep it in step: the screenshots and the page around them should look like
one product.

## Editing

Tailwind only generates rules for class names it can find spelled out in full,
so rebuild the stylesheet after touching `index.html`:

```sh
npm install     # once
npm run build   # or `npm run watch` while editing
```

Then look at it — `python3 -m http.server 4173` — before pushing. A class that
generated nothing looks exactly like a class that is not there.

## The connect-page screenshot

`assets/img/connect.png` shows a QR code that is deliberately a fake: a real one
carries the 128-bit pairing secret for the computer that drew it, and posting one
publishes a key to that machine. If the shot is ever retaken, redraw the QR
around a dummy URL first.
