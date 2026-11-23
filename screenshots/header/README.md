# Header alignment, before and after

Measured on a local trip2g (main `e7ae338c`): the trip2g corner sits at top 8 px, 40 px tall, 160 px wide when signed in (120 px for a guest). The layout's `:root` holds these numbers and the left gutter (24 px) once and hands them to the board's frame.

- `before-board-dark-desktop.png` — before: title at 24 px but columns at 36 px; header 64 px tall, so the title and search sit lower than the corner's icons; the corner's menu button is a light square.
- `before-board-light-mobile.png` — before, 390 px: title at 24 px, hint and columns at 36 px.
- `before-boards-light-desktop.png` — before: «All boards» title at 24 px, rows at 36 px, title lower than the corner.
- `after-board-dark-desktop.png` — task: header on the corner's line, one left edge, no light square — title, owner filter, search and the corner's icons share one 40 px row 8 px from the top; title and columns start at 24 px; the menu button has no square, dark.
- `after-board-light-desktop.png` — task: the same in the light theme.
- `after-board-light-mobile.png` — task: 390 px, light — the title on the corner's row; the second row holds the owner filter (from 24 px) and the search right after it; the hint and columns start at 24 px.
- `after-board-dark-mobile.png` — task: 390 px, dark — the same.
- `after-boards-light-desktop.png` — task: page of all boards — title on the corner's row; title and rows start at 24 px.
- `after-boards-light-mobile.png` — task: page of all boards at 390 px — the same.
- `after-guest-light-desktop.png` — task: signed-out visitor — the narrower corner (sign-in, search, menu) on the same row, no light square; title, hint and columns at 24 px.
