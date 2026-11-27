---
name: tasks-board
description: "Tasks, board, kanban, status, PM: one note per task, boards as views."
version: 0.2.0
---

# Tasks and boards

Use this skill when someone asks about tasks, a board, a kanban, a status,
who does what, what is late, or wants a board for a project or a person.

A task is a note. A board shows task notes that a note query picks. One task
can be on many boards; its status lives in the task note only.

| Question | File |
|---|---|
| What is a task, what is a board, where does the status live? | `references/data-model.md` |
| Which fields does a task have, and what values may they take? | `references/fields.md` |
| How do I make a board, a person's board, the page of all boards? | `references/boards.md` |
| Where do the numbers above the columns come from; how do I add one? | `references/metrics.md` |
| A note shows a validator warning. What does it mean? | `references/validators.md` |
| What does a click, a drag or «Move» on a phone write into the note? | `references/editing.md` |
| The team has old kanban-plugin boards with card lines. How do they move over? | `references/migration.md` |
| A card is missing, a count is wrong, an owner shows as a colour | `references/troubleshooting.md` |
| Create a task, set a status, write the nightly list from a script | `references/script.md` |

The package also carries the app: `layouts/` goes into `_layouts/`, and
`projects/` (the queries, the validators and their patch) into the knowledge
base. Install them only after the owner says «да».
