# Task fields

You are creating a task or fixing one a validator flagged. These are the
frontmatter keys. **An empty field is an absent key**: leave `owner`, `due`
or `blocked` out rather than writing «not set».

| Key | Allowed values | What reads it |
|---|---|---|
| `type` | `task` | every query; without it the note is not a task |
| `title` | text | the card |
| `status` | exactly one of the board's `tasks_columns` | the column the card is in |
| `project` (or your own grouping key) | text, or a list when a task belongs to several | the boards' `tasks_filter` |
| `owner` | a name, or a list of names | the card, the owner filter, person boards |
| `due` | `YYYY-MM-DD` | the card; overdue is counted only for a date |
| `due_time` | `HH:MM` | shown beside the date |
| `blocked` | text: what the task waits for | the card, the `blocked` flag |
| `priority` | text, e.g. `High` | the card |
| `disposition` | `active` (default), `paused`, `cancelled`, `completed` | `cancelled` hides the card |
| `done` | `YYYY-MM-DD` the task reached a done status | folding of old done cards |
| `order` | a number | the position inside a column; written by drag |
| `status_conflict` | a list of statuses | left by the migration when boards disagreed; remove it once `status` is set |
| `source` | a wiki link | where the task came from, e.g. an import |

Any other key is kept as is and shown nowhere.
