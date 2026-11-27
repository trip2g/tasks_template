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
| `owner` | who does it; absent shows «No owner» |
| `due` | `YYYY-MM-DD`; any other text is shown as is and is never overdue |
| `project` | what the example boards filter by; any field can be filtered on |
| `blocked` | why the task cannot move; shown on the card in any column |
| `disposition` | `active` (default), `paused` (marked on the card), `cancelled` (hidden, counted), `completed` |
| `done` | `YYYY-MM-DD` the task was finished; decides when it folds away |

**An empty field is an absent key.** Leave `owner`, `due` or `blocked` out when
there is nothing to say; do not write a placeholder such as «not assigned».
The template reads an absent key, an empty string and `null` alike.
`tasks.py clean` removes placeholders a vault already has.

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
| `done` | the last column | statuses that count as finished, e.g. `[Done, Dropped]` |
| `metrics` | Active, Overdue, Blocked | the counts above the columns, see Metrics below |

The filter is data: the board hands it to the query as `params.filter`, and
the same query serves every board.

A task whose status is not one of the board's columns is not hidden: it shows
in an extra column, «Not a column of this board», and cannot be dropped into.

### Metrics

Above the columns the board counts the cards on screen: with an owner
picked or a search typed, the numbers follow. The board query marks each
task with `flags`, computed in Jsonnet: `active` (its status is not in
`done`), `overdue` (a date before today, not done), `blocked` (a reason in
`blocked`, not done). The board's `metrics` picks which flags to show and
names them:

```yaml
metrics:
  - label: Open
    flag: active
  - label: Late
    flag: overdue
    risk: true
```

`risk: true` paints a non-zero count red. A new count is two lines: one
flag in `flags(n)` in `queries/tasks_board.md`, for example
`no_owner: open && field(n, 'owner') == '',`, and one entry in the board's
`metrics`. One query serves the cards and the counts, because trip2g runs
at most two note queries per request.

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
its `tasks_filter` and `tasks_columns` to your query too, and `params.today`
on a trip2g without `now` (see Today below).
`layout: boards` lists such a board as a row without counts, saying so: only
the default query's filter is something it can count.

### Today

The queries take today from trip2g's `now.date`, the site's date in its time
zone (trip2g after `e7ae338c`). A trip2g without `now` answers
«Undefined external variable: now»; the page then asks again with
`params.today`, the visitor's date. A query given `params.today` uses it:

```jsonnet
local today = if std.objectHas(params, 'today') then params.today else std.parseJson(std.extVar('now')).date;
```

## All boards

```yaml
---
title: All boards
layout: boards
---
```

One row per note with `layout: tasks`, and per note of any layout that
sets `tasks_columns` (a board drawn by a layout of your own): counts per
status, overdue, without owner, without a due date (absent or not a date), and **needs a decision** —
open tasks that are blocked, overdue or have no owner. Boards with the most
of those come first. `boards_query: "[[my_index]]"` replaces the default
`[[boards_index]]`.

## Validators

`validators/task.md` checks a task note and `validators/board.md` a board;
`patches/tasks_validate.md` attaches them to every task and board, so no
note lists them itself. Copy the three notes into the vault and fill the
task validator's lists:

```bash
scripts/task-validator-lists validators/task.md \
  --status Inbox --status Planned --status "In progress" --status Blocked --status Done \
  --person Leo --person Maya --blocked-status Blocked
```

A task is flagged for a status no board has, a due date that is not
`YYYY-MM-DD`, an owner outside the list, a blocking status without a reason
in `blocked`, and a `status_conflict` left by a migration. A board is
flagged for `done` that is not a list of its columns and for a `metrics`
entry without a label or with a flag the board query does not compute.
The messages show in the sync output, in the admin dashboard and in
`trip2g lint`. An empty list switches its check off.

## Editing rights

Only a signed-in admin can move cards. Everyone else sees the board read-only
with «Sign in to move cards», and the sign-in button in the corner. The
server checks every save, so a page opened by mistake cannot write.

A move reads the task note, checks its status is still the one the card
showed, and saves a `meta` change with `expectedHash`: `status` is set, and
`done` is set to today when the card enters the done column and removed when
it leaves it. trip2g rewrites only those lines; every other byte of the note
stays (`tests/live_meta.py` checks this against a running instance). If the
note changed in the meantime — in Obsidian, by an agent, on another board —
nothing is written and the board reloads the cards. If the session has
ended, the card goes back, the page reloads signed out and says why.

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
python3 tasks.py clean --placeholder "not assigned" --placeholder "none" --dry-run
```

It refuses an invented due date and refuses to close a task without
`--evidence`. See `skills/tasks-board/SKILL.md`.

## From kanban-plugin boards

`scripts/migrate-kanban-board` turns obsidian-kanban board notes (a column
per heading, a card per line) into task notes and query boards: one task per
card, duplicates across boards merged by link target, a status two boards
disagree on listed instead of guessed. Run it with `--dry-run` first. See
`skills/tasks-board/references/migration.md`.

## The skill package

`scripts/pack-skill.sh` assembles `dist/skill/tasks-board/`: the skill
(`SKILL.md`, `references/`, `scripts/`) and the app it brings, `layouts/`
for `_layouts/` and `projects/` (queries, validators, their patch) for the
knowledge base. A box's skill-install installs it as a skill with an app.

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
npm test          # queries, the frontmatter reader, the status change, the skill script
T2G_URL=http://localhost:8081 T2G_TOKEN=… npm test   # plus the live meta check; it writes tests/live_meta_probe.md, so use a throwaway instance
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
- **Touch screens cannot drag.** On a phone, open the card and pick the
  column above the note.
- The board follows the site's theme rule — dark unless the visitor picked
  light in the corner menu — so it matches the task note opened beside it.
- `meta` writes the `status:` line in its own style: `status: "Planned"`
  becomes `status: In progress`.
- Air-gapped instances that cannot reach github.com have to serve
  `tasks.js` themselves and edit the URL in both layouts.
