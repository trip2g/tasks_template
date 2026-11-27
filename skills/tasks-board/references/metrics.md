# Metrics above the columns

A manager asks «how many are late?» and then picks his own name in the
owner filter. The numbers above the board answer both: they count only the
cards on screen, so the filter and the search drive them.

**Where they come from.** The board's query computes `flags` for every task
in Jsonnet: `active` (status not in `done`), `overdue` (a `due` date before
today, not done), `blocked` (a reason in `blocked`, not done). The page
counts, among the visible cards, those whose flag is true.

**Which ones show.** The board's frontmatter names them:

```yaml
metrics:
  - label: Open
    flag: active
  - label: Late
    flag: overdue
    risk: true
  - label: Blocked
    flag: blocked
    risk: true
```

Without `metrics` these three show. `risk: true` paints a non-zero count red.

## Example: count tasks without an owner

1. In the board query, `queries/tasks_board.md`, add one line to `flags(n)`:

   ```jsonnet
   no_owner: open && field(n, 'owner') == '',
   ```

2. In the board note, add one entry:

   ```yaml
     - label: No owner
       flag: no_owner
       risk: true
   ```

3. Add `no_owner` to `flags` in `validators/board.md`, so the validator
   knows the flag exists.

Do not make a query per metric: trip2g runs at most two note queries per
request, and the board already runs one.
