# The agent's script

You are asked to create a task, move one, make a board, or write the nightly «needs a decision» list. Do it with `scripts/tasks.py`, not by rewriting notes.

The script works on the local copy of the knowledge base,
`$TRIP2G_VAULT_DIR` (default `/opt/data/secondbrain`). Every command first
pulls with `/opt/hermes/docker/secondbrain-sync.sh`, then edits, then pushes,
so a card moved on the website a minute ago is not overwritten.

```bash
S=/opt/hermes/skills/tasks-board/scripts/tasks.py

python3 $S new --title "Fix the contact form" --project Website --source "[[chats/2026-11-23]]"
python3 $S new --title "Write the December issue" --project Newsletter --owner Sam --due 2026-12-01
python3 $S status "tasks/Website/Fix the contact form.md" "In progress"
python3 $S status "tasks/Website/Fix the contact form.md" Done --evidence 'Maya: "fixed and deployed"'
python3 $S board --project Website --columns "Inbox,Planned,In progress,Blocked,Done"
python3 $S lint --heading "Нужно решение"
python3 $S clean --placeholder "не назначен" --placeholder "не задано" --dry-run
```

`clean` removes the keys `owner`, `due`, `blocked`, `priority` and `project`
of task notes whose value is one of the placeholders. Run it with `--dry-run`
first and show the counts to the owner before running it for real.

Any other field (owner, due, blocked, disposition) is one frontmatter key:
set it with the `upsert_frontmatter_field` tool of the knowledge base, which
leaves the body as it was. Never rewrite a task note whole to change one
field.


## The nightly summary

`lint` prints a Markdown section of open tasks that need someone's decision:
no owner, no due date, a due that is not a date, overdue, blocked, a status
that is not a column of its board, or a task no board shows. Paste it as is
under the summary's «Нужно решение» heading; `--json` gives the same list as
data. An empty section says `Nothing.`


## Stop conditions

- **Never invent an owner or a due date.** Write the owner only when a person
  named them, the due date only when someone named a date. Otherwise leave
  the key out: `lint` will put the task in front of a person, which is the
  point.
- **Close a task only on the owner's word or a link to the result.** The
  script refuses the done column without `--evidence`, and writes the
  evidence and the date into the note.
- **Status is a fact, not a forecast.** Move a task to the in-progress
  column when work has started, not when it is planned; to the blocked
  column with a `blocked` reason that names what it waits for.
- **Use the board's column names exactly.** A status the board does not have
  takes the card off its columns; `lint` reports it.
- **One task, one note.** Before `new`, search the base for the same task;
  update the existing note instead of creating a second one.
