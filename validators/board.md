Checks a board note: a note with `tasks_columns`. The patch `patches/tasks_validate.md` attaches it.

`flags` lists the flags the board query computes. Keep it in step with `flags(n)` in `queries/tasks_board.md`.

```jsonnet
local flags = ['active', 'overdue', 'blocked'];

local columns = std.get(meta, 'tasks_columns', []);
local done = std.get(meta, 'done', null);
local metrics = std.get(meta, 'metrics', null);
local isText(v) = std.isString(v) && v != '';

(
  if !std.isArray(columns) || std.length(columns) == 0 || !std.all([isText(c) for c in columns])
  then [{level: 'error', msg: 'tasks_columns must be a list of column names'}]
  else []
) + (
  if done == null then []
  else if !std.isArray(done) then [{level: 'error', msg: 'done must be a list of statuses, e.g. done: [Done]'}]
  else [
    {level: 'error', msg: 'done "' + d + '" is not one of tasks_columns'}
    for d in done
    if std.isArray(columns) && !std.member(columns, d)
  ]
) + (
  if std.objectHas(meta, 'tasks_filter') && !std.isObject(meta.tasks_filter)
  then [{level: 'error', msg: 'tasks_filter must be a map: field → value or list of values'}]
  else []
) + (
  if metrics == null then []
  else if !std.isArray(metrics) then [{level: 'error', msg: 'metrics must be a list of {label, flag}'}]
  else std.flattenArrays([
    (if !std.isObject(m) || !isText(std.get(m, 'label', null)) then [{level: 'error', msg: 'metrics[' + i + '] needs a label'}] else [])
    + (if !std.isObject(m) || !isText(std.get(m, 'flag', null)) then [{level: 'error', msg: 'metrics[' + i + '] needs a flag'}]
       else if !std.member(flags, m.flag) then [{level: 'error', msg: 'metrics[' + i + '] flag "' + m.flag + '" is not computed by the board query: ' + std.join(', ', flags)}]
       else [])
    for i in std.range(0, std.length(metrics) - 1)
    for m in [metrics[i]]
  ])
)
```
