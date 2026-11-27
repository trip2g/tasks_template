---
type: note-query
free: true
---

The cards of one board: every note with `type: task` that matches the board's `tasks_filter`, with the fields the board shows.

Today is the site's date, `now.date`; a page may pass `today` (`YYYY-MM-DD`) for a trip2g that has no `now` yet.

Params: `filter` (frontmatter key → value or list of values; a list in the task matches when any of its values does), `columns` (status names, left to right; the last one is the done column), `done` (the statuses that count as finished; the last column when absent).

Each card carries `flags`, which the board header counts over the cards on screen. A new flag is one more line in `flags(n)`; a board shows it by naming it in its `metrics`.

```jsonnet
local today = if std.objectHas(params, 'today') then params.today else std.parseJson(std.extVar('now')).date;
local filter = std.get(params, 'filter', {});
local defaultColumns = ['Inbox', 'Planned', 'In progress', 'Blocked', 'Done'];
local given = std.get(params, 'columns', []);
local columns = if std.isArray(given) && std.length(given) > 0 then given else defaultColumns;
local doneColumn = columns[std.length(columns) - 1];
local givenDone = std.get(params, 'done', []);
local done = if std.isArray(givenDone) && std.length(givenDone) > 0 then givenDone else [doneColumn];

local text(v) = if v == null then '' else if std.isString(v) then v else std.toString(v);
local field(n, k) = text(std.get(n.meta, k, null));
local isDate(s) = std.length(s) == 10 && std.substr(s, 4, 1) == '-' && std.substr(s, 7, 1) == '-';
local closed(n) = std.member(['completed', 'cancelled'], field(n, 'disposition'));

local values(v) = if std.isArray(v) then [text(x) for x in v] else [text(v)];
local matches(n) = std.all([
  local want = values(filter[k]);
  local have = values(std.get(n.meta, k, null));
  std.length([h for h in have if std.member(want, h)]) > 0
  for k in std.objectFields(filter)
]);

local flags(n) =
  local status = field(n, 'status');
  local due = field(n, 'due');
  local open = !std.member(done, status) && !closed(n);
  {
    active: open,
    overdue: open && isDate(due) && today != '' && due < today,
    blocked: open && field(n, 'blocked') != '',
  };

local card(n) =
  local status = field(n, 'status');
  local due = field(n, 'due');
  {
    path: n.path,
    title: n.title,
    permalink: n.permalink,
    status: status,
    owner: std.join(', ', [o for o in values(std.get(n.meta, 'owner', null)) if o != '']),
    project: field(n, 'project'),
    due: due,
    due_date: isDate(due),
    overdue: flags(n).overdue,
    blocked: field(n, 'blocked'),
    disposition: if field(n, 'disposition') == '' then 'active' else field(n, 'disposition'),
    done: field(n, 'done'),
    flags: flags(n),
  };

{
  today: today,
  columns: columns,
  done_column: doneColumn,
  tasks: [card(n) for n in notes if field(n, 'type') == 'task' && matches(n)],
}
```
