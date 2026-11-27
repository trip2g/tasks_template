# Editing from the board

Only a signed-in admin can change cards; everyone else sees the board read
only, with «Sign in to move cards». Every change reads the task note first
and is refused if the note changed meanwhile; the board then reloads.

| Action | What it writes into the task note |
|---|---|
| Drag a card to another column | `status`; entering the done column sets `done: <today>`, leaving it removes `done` |
| Click a card | nothing: the task note opens beside the board |
| Pick a column above the opened note (the way to move on a phone) | the same as a drag |
| Edit the note itself, in Obsidian or by the agent | whatever you change; the board shows it on its next load |

trip2g rewrites only those frontmatter lines; every other byte of the note
stays.

A board drawn by a layout of your own writes the same keys when it follows
this data model: `status` and `done` for a move, `order` for a position in
a column, `disposition: cancelled` instead of deleting the note, and only
the changed keys from an edit form.
