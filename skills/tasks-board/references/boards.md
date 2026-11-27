# Boards

Someone asks for «a board for the website project» or «Leo's tasks». A board
is a short note:

```yaml
---
title: Website
layout: tasks
tasks_filter:
  project: Website
tasks_columns: [Inbox, Planned, In progress, Blocked, Done]
done: [Done]
---
```

- **Columns are statuses.** A task with `status: Planned` sits in
  «Planned». Write the names exactly as the tasks use them.
- **`done`** lists the statuses that count as finished: their cards are
  ticked and they do not count as active. Without it, the last column.
- **`tasks_filter`** picks the tasks: `project: Website` one project,
  `project: [Website, Newsletter]` several, `{}` all.
- **One person's tasks** need no board of their own. On any board, a click
  on a name filters the board to that person in place and puts
  `?owner=<name>` in the address; a second click clears it. The numbers
  above the columns follow. A link with `?owner=` opens a board already
  filtered.
- **The page of all boards** is a note with `layout: boards`. It lists every
  note that has `tasks_columns`, with counts per status, overdue, without
  owner, and boards that need a decision first. Its «People» line links
  each owner to the biggest board that has their tasks, with `?owner=`.
