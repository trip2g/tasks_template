# Troubleshooting

**A card is missing from a board.** Check, in this order: the note has
`type: task`; its filter key matches the board's `tasks_filter` exactly
(case and spaces count); it is not `disposition: cancelled`; the visitor may
read the note (a query sees only notes its visitor can open).

**A card sits in «Not a column of this board».**
Its `status` is not one of the board's columns, or it has `status_conflict`
from a migration. Set `status` to a column and remove `status_conflict`.

**A count above the board looks wrong.** The counts follow the owner filter
and the search: clear them first. Then check `done`: a status not listed
there counts as active. A text `due` is never overdue.

**An owner shows as a colour, or a colour as an owner.** On the old card
lines a colour tag was a segment like any other. The owner is now the
`owner` field; fix the note, not the board.

**One person shows twice in the filter** («Kim» and «Kim Lee»). They are two
spellings in `owner`. Pick one and fix the notes; the task validator's
people list then flags the other.

**A person's name does not open a board.** There is no board with
`tasks_filter: {owner: <that name>}`. Make one (see `boards.md`).

**The board says «The task changed elsewhere».** Someone saved the note in
between. The board reloaded it; make the change again.

**«The board query failed».** The query note is missing or broken: check
`queries/` is installed and synced.
