# Validators

A note shows a warning in the sync output, in the admin dashboard
(«Предупреждения в заметках») or in `trip2g lint`. These come from two
validators that `patches/tasks_validate.md` attaches to every task and every
board.

`validators/task.md` keeps four lists at its top: known statuses, known
people, required keys, statuses that need a reason. An empty list switches
its check off. Fill them with `scripts/task-validator-lists`.

| Message | What to do |
|---|---|
| `missing field: status` | set `status` to one of the board's columns |
| `status "X" is not a column of any board` | fix the spelling, or add the column to the boards and to the list |
| `due "X" is not a date` | write `YYYY-MM-DD`, or move the text to the body; a text due is never overdue (warning) |
| `owner "X" is not in the list of people` | a typo, or a new person: add them to the list (warning) |
| `status "Blocked" needs a reason in blocked` | write what the task waits for in `blocked` |
| `blocked must be text` | write the reason as text |
| `the boards disagreed on the status: A / B` | ask the owner which is true, set `status`, remove `status_conflict` |
| `done must be a list of statuses` (board) | `done: [Done]`, not `done: Done` |
| `done "X" is not one of tasks_columns` (board) | the name must match a column exactly |
| `metrics[i] needs a label / a flag` (board) | each entry is `{label, flag}` |
| `metrics[i] flag "X" is not computed by the board query` (board) | add the flag to the query and to `flags` in the validator, or fix the name |

A note with an error still saves and publishes, and the message stays until
the note is fixed. But an error makes the sync CLI exit with code 1, and a
script that syncs may stop on that. So errors are kept for notes that are
broken; a pending decision, such as a status the boards disagreed on, is a
warning. `trip2g lint` fails on both.
