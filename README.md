# trip2g Tasks Template

A drop-in [trip2g](https://github.com/trip2g/trip2g) template for tasks kept as
notes. **Tasks live apart from boards.** A task is an ordinary note with a few
frontmatter fields. A board is a note with no cards in it: it shows the task
notes a [note query](https://trip2g.com/en/user/note-queries) picks for it.
One task can appear on several boards, and moving its card on any of them
changes one line in the task note.

- `layout: tasks` — a board: columns by `status`, cards with owner, due date
  (overdue in red), the reason it is blocked and a pause mark; a click opens
  the task note beside the board; dragging a card sets its `status`.
- `layout: boards` — every board on one page, with counts per status,
  overdue, without owner, without due date; boards that need a decision first.
- `skills/tasks-board/` — a skill for an AI agent that keeps the same notes:
  create a task, set a status, create a project board, and a lint for the
  nightly summary.

## Install (curl & mkdir)

In the root of your vault:

```bash
mkdir -p _layouts queries
base=https://github.com/trip2g/tasks_template/releases/latest/download
curl -L -o _layouts/tasks.html  $base/tasks.html
curl -L -o _layouts/boards.html $base/boards.html
curl -L -o queries/tasks_board.md  $base/tasks_board.md
curl -L -o queries/boards_index.md $base/boards_index.md
```

Sync the vault. The JS bundle loads from the release, so there is nothing
else to upload; `/releases/latest/download/` always serves the newest one.

The two query notes are `free: true`, so anyone who opens a board can run
them. That shows nothing extra: a query sees only the notes its visitor may
read, so a guest gets the cards of public tasks and an admin gets all.

## A task

Any note with `type: task`, in any folder (`tasks/` by convention):

```yaml
---
title: "Replace the hero photo"
type: task
project: "Website"
status: "Blocked"
owner: "Leo"
due: 2026-11-20
blocked: "waiting for the photographer's final files"
disposition: active
---
```

| Field | Meaning |
|---|---|
| `status` | the column the card is in, written exactly as the board names it |
| `owner` | who does it; empty or absent shows «No owner» |
| `due` | `YYYY-MM-DD`; any other text is shown as is and is never overdue |
| `project` | what the example boards filter by; any field can be filtered on |
| `blocked` | why the task cannot move; shown on the card in any column |
| `disposition` | `active` (default), `paused` (marked on the card), `cancelled` (hidden, counted), `completed` |
| `done` | `YYYY-MM-DD` the task was finished; decides when it folds away |

A card is overdue when `due` is a date before today, its status is not the
done column, and it is neither `completed` nor `cancelled`.

## A board

```yaml
---
title: Website board
layout: tasks
tasks_filter:
  project: Website
---
```

| Key | Default | Meaning |
|---|---|---|
| `tasks_filter` | `{}` (all tasks) | frontmatter key → value; a list of values means any of them: `owner: [Leo, Sam]` |
| `tasks_columns` | `[Inbox, Planned, In progress, Blocked, Done]` | the columns, left to right; **the last one is the done column** |
| `tasks_done_days` | `14` | done cards older than this many days (by `done`, else `due`; undated ones too) fold under «Done earlier» |
| `tasks_query` | `"[[tasks_board]]"` | the note query that picks the cards |

The filter is data: the board hands it to the query as `params.filter`, and
the same query serves every board.

A task whose status is not one of the board's columns is not hidden: it shows
in an extra column, «Not a column of this board», and cannot be dropped into.

### Your own columns

Write them in the board's frontmatter, in your language. The task notes
must use the same words:

```yaml
---
title: Сайт
layout: tasks
tasks_filter:
  project: Сайт
tasks_columns: ["Входящие", "Запланировано", "В работе", "Заблокировано", "Готово"]
---
```

To change the default for every board instead, edit `defaultColumns` in
`queries/tasks_board.md` and `queries/boards_index.md`.

### Your own query

A board with `tasks_query: "[[my_query]]"` shows whatever that note query
returns, as long as it has this shape:

```json
{
  "columns": ["Inbox", "Planned", "In progress", "Blocked", "Done"],
  "done_column": "Done",
  "tasks": [
    { "path": "tasks/a.md", "title": "…", "permalink": "/tasks/a", "status": "Planned",
      "owner": "", "project": "", "due": "", "due_date": false, "overdue": false,
      "blocked": "", "disposition": "active", "done": "" }
  ]
}
```

Start from a copy of `queries/tasks_board.md`; `example/queries/overdue_tasks.md`
is one: every overdue task, whatever its project. The board passes
`params.today` and its `tasks_filter`/`tasks_columns` to your query too.
`layout: boards` lists such a board as a row without counts, saying so: only
the default query's filter is something it can count.

### Today

A Jsonnet query has no clock, so the page passes the visitor's date as
`params.today`. trip2g is getting a server-side `now.date` for queries; when
your instance has it, replace the first line of both queries,

```jsonnet
local today = std.get(params, 'today', '');
```

with `local today = now.date;` and the date becomes the site's, in its time
zone.

## All boards

```yaml
---
title: All boards
layout: boards
---
```

One row per note with `layout: tasks`: counts per status, overdue, without
owner, without a due date (absent or not a date), and **needs a decision** —
open tasks that are blocked, overdue or have no owner. Boards with the most
of those come first. `boards_query: "[[my_index]]"` replaces the default
`[[boards_index]]`.

## Editing rights

Only a signed-in admin can move cards. Everyone else sees the board read-only
with «Sign in to move cards», and the sign-in button in the corner. The
server checks every save, so a page opened by mistake cannot write.

A move reads the task note, checks its status is still the one the card
showed, and saves a `patch` of the frontmatter with `expectedHash`. If the
note changed in the meantime — in Obsidian, by an agent, on another board —
nothing is written and the board reloads the cards. If the save is refused,
the card goes back and the board says why.

## The demo

`example/` is a small vault: ten tasks of two projects, a board per project,
a board with its own query and a page of all boards. Assemble it with the
layouts and queries and push it to a local trip2g:

```bash
scripts/demo_vault.sh /tmp/tasks-demo
node ../trip2g/obsidian-sync/dist/trip2g-sync.mjs --folder /tmp/tasks-demo --api-key "$API_KEY" --api-url http://localhost:8081/graphql
```

## The agent skill

`skills/tasks-board/` is a Hermes
skill. Its `scripts/tasks.py` works on the agent's local copy of the vault
and runs the vault sync before and after each write:

```bash
python3 tasks.py new --title "Pick a sending day" --project Newsletter
python3 tasks.py status "tasks/Newsletter/Pick a sending day.md" Planned
python3 tasks.py board --project Newsletter --columns "Inbox,Planned,In progress,Done"
python3 tasks.py lint --heading "Needs a decision"
```

It refuses an invented due date and refuses to close a task without
`--evidence`. See `skills/tasks-board/SKILL.md`.

## How it is built

The board is a [$mol](https://mol.hyoo.ru) application, built in a
[mam](https://github.com/hyoo-ru/mam) workspace with the
[airkit](https://github.com/alexesDev/airkit) theme.

trip2g's own sign-in corner is a $mol bundle too, and two $mol bundles cannot
share one page: each defines the same global `$mol_*` names and the second
takes over the first one's runtime. So the layout keeps the trip2g corner on
the page and runs the board in a same-origin `<iframe srcdoc>`, the way
trip2g's own editor pane runs. The board reads the note's data from the
page, and its GraphQL calls carry the visitor's session cookie like any
request from the site.

```
_layouts/       tasks.html, boards.html — the page, the data island, the frame
queries/        tasks_board.md, boards_index.md — the note queries
ui/             the $mol package `trip2gtasks`: board/, boards/, frontmatter/, gql/, env/, app/
codegen/        .graphql → typed wrappers, against trip2g's schema
skills/         the agent skill and its tests
example/        the demo vault
tests/queries/  query fixtures: notes + params → expected JSON
```

Build and test (needs a sibling `../mam` workspace and `../trip2g` checkout):

```bash
git clone --depth 1 https://github.com/hyoo-ru/mam.git ../mam
(cd ../mam && npm install && npm install jsdom)
npm install
npm run codegen   # after changing a .graphql file
npm run build     # → dist/tasks.js with its translations, dist/*.html
npm test          # queries, the frontmatter patch, the skill script
```

`dist/tasks.js` carries its translations inside: a release asset is served
without CORS, so the bundle could not fetch a `web.locale=*.json` beside it.

To try a local bundle, serve `dist/` and point the layouts at it:
`scripts/demo_vault.sh /tmp/tasks-demo http://127.0.0.1:8090/tasks.js`.

## Limitations

- **In Obsidian a board is not a board.** It is the note you wrote: a title
  and frontmatter. The cards exist only on the site.
- **No new task from the board** in this version: create the note (in
  Obsidian, by the agent or with `tasks.py new`).
- **A move writes only `status:`.** Moving a card into the done column does
  not set `done:`; such a card folds away after `tasks_done_days` counted
  from its `due`, or at once when it has neither. `tasks.py status` sets
  `done:`.
- **Touch screens cannot drag.** On a phone, open the card and pick the
  column above the note.
- The task note opened beside the board is the site's page for it, with the
  site's own theme.
- Air-gapped instances that cannot reach github.com have to serve
  `tasks.js` themselves and edit the URL in both layouts.
