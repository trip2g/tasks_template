# Data model

A team keeps a summary board and a board per project, and the same task
showed up on both with different statuses. Here that cannot happen.

- **A task is a note** with `type: task`. Its frontmatter holds its state:
  `status`, `owner`, `due`, `blocked`. Its body holds the rest: what is
  wanted, links, history.
- **A board is a note with no cards in it.** It has `tasks_columns` (its
  columns) and `tasks_filter` (which tasks it shows). The page runs a note
  query and draws the tasks it returns.
- **One task can be on many boards.** The summary board filters by a list of
  projects, a project board by one, a person's board by `owner`. All of them
  show the same note.
- **The status lives in the task note only.** Moving a card on any board
  changes the `status:` line of that note. Every other board shows the new
  status on its next load.

So: to change a task, change its note (or use the board, which does exactly
that). Never copy a task into a second note to put it on a second board;
widen the board's filter instead.
