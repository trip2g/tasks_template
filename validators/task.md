Checks a task note. The patch `patches/tasks_validate.md` attaches it to every note with `type: task`.

Edit the four lists at the top for your vault. An empty list switches its check off.

```jsonnet
local statuses = [];
local people = [];
local required = ['status'];
local blockedStatuses = [];

local text(v) = if v == null then '' else if std.isString(v) then v else std.toString(v);
local values(v) = if v == null then [] else if std.isArray(v) then [text(x) for x in v] else [text(v)];
local has(k) = std.objectHas(meta, k) && text(meta[k]) != '';
local status = text(std.get(meta, 'status', null));
local due = text(std.get(meta, 'due', null));
local conflict = values(std.get(meta, 'status_conflict', null));

[
  {level: 'error', msg: 'missing field: ' + k}
  for k in required
  if !has(k) && !(k == 'status' && std.length(conflict) > 0)
] + (
  if std.length(conflict) > 0
  then [{level: 'error', msg: 'the boards disagreed on the status: ' + std.join(' / ', conflict) + '; set status and remove status_conflict'}]
  else []
) + (
  if status != '' && std.length(statuses) > 0 && !std.member(statuses, status)
  then [{level: 'error', msg: 'status "' + status + '" is not a column of any board: ' + std.join(', ', statuses)}]
  else []
) + (
  if due != '' && !std.native('regexMatch')('^[0-9]{4}-[0-9]{2}-[0-9]{2}$', due)
  then [{level: 'warning', msg: 'due "' + due + '" is not a date (YYYY-MM-DD), so it is never overdue'}]
  else []
) + [
  {level: 'warning', msg: 'owner "' + p + '" is not in the list of people'}
  for p in values(std.get(meta, 'owner', null))
  if std.length(people) > 0 && !std.member(people, p)
] + (
  if std.member(blockedStatuses, status) && !has('blocked')
  then [{level: 'error', msg: 'status "' + status + '" needs a reason in blocked'}]
  else []
) + (
  if std.objectHas(meta, 'blocked') && meta.blocked != null && !std.isString(meta.blocked)
  then [{level: 'error', msg: 'blocked must be text: the reason the task cannot move'}]
  else []
)
```
