# Moving from kanban-plugin boards

The team has boards in the obsidian-kanban format: one note per board, a
`## Column` per status, a `- [ ]` line per card. The same task sits as a
line on the summary board and on a project board, and the two drift apart.
`scripts/migrate-kanban-board` turns them into task notes and query boards.

1. **Dry run.** Nothing is written; you get the numbers:

   ```bash
   scripts/migrate-kanban-board --vault <kb> --summary "<kb>/projects/Team — summary board.md" \
     --field project --dry-run "<kb>/projects/"*board*.md
   ```

   It prints the cards read, the tasks they make, the duplicates merged
   (one task per link target across boards), the **status conflicts** (a
   task in different columns on different boards) and the open tasks
   without an owner. Show them to the owner.

2. **Settle the conflicts with the owner, one by one.** The tool never
   guesses: a conflicting task gets `status_conflict: [A, B]` and no
   `status`, and waits in a column of its own until someone sets it.

3. **The real run** writes into `--out`: a task note per card (an existing
   linked note gets its frontmatter filled; a card linking to an anchor
   keeps it as `source`), each old board rewritten as a query board at the
   same path (links to it keep working), the old card text under
   `archive/kanban/`, a board per person with `--people-dir people`, the
   page of all boards with `--index`.

How a card line is read: the first wiki link is the task (its alias the
title); a `` `CODE` `` before it is `code`; segments split by ` · `; a
`**Group / Kind**` segment is the project and the task type; the segment
right after it is the owner (`Name (@handle)`, `A и B` for two); `📅
dd.mm.yyyy hh:mm` is the due date; `блокер: …` is `blocked`; a colour tag
`🟥 \`red\`` is `color`, never an owner. A board's project comes from its
title (`--direction-pattern`).

Options: `--layout` (the layout of the rewritten boards), `--metric
"Label=flag"` (add `!` for a risk), `--menu "Board title=Menu title|Hint"`.
