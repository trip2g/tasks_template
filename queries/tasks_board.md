---
type: note-query
free: true
---

The cards of one board: every note with `type: task` that matches the board's `tasks_filter`, with the fields the board shows.

Today is the site's date, `now.date`; a page may pass `today` (`YYYY-MM-DD`) for a trip2g that has no `now` yet.

Params: `filter` (frontmatter key → value or list of values), `columns` (status names, left to right; the last one is the done column).

```jsonnet
local today = if std.objectHas(params, 'today') then params.today else std.parseJson(std.extVar('now')).date;
local filter = std.get(params, 'filter', {});
local defaultColumns = ['Inbox', 'Planned', 'In progress', 'Blocked', 'Done'];
local given = std.get(params, 'columns', []);
local columns = if std.isArray(given) && std.length(given) > 0 then given else defaultColumns;
local doneColumn = columns[std.length(columns) - 1];

local text(v) = if v == null then '' else if std.isString(v) then v else std.toString(v);
local field(n, k) = text(std.get(n.meta, k, null));
local isDate(s) = std.length(s) == 10 && std.substr(s, 4, 1) == '-' && std.substr(s, 7, 1) == '-';
local closed(n) = std.member(['completed', 'cancelled'], field(n, 'disposition'));

local matches(n) = std.all([
  local want = filter[k];
  local have = field(n, k);
  if std.isArray(want) then std.member([text(w) for w in want], have) else have == text(want)
  for k in std.objectFields(filter)
]);

local card(n) =
  local status = field(n, 'status');
  local due = field(n, 'due');
  {
    path: n.path,
    title: n.title,
    permalink: n.permalink,
    status: status,
    owner: field(n, 'owner'),
    project: field(n, 'project'),
    due: due,
    due_date: isDate(due),
    overdue: isDate(due) && today != '' && due < today && status != doneColumn && !closed(n),
    blocked: field(n, 'blocked'),
    disposition: if field(n, 'disposition') == '' then 'active' else field(n, 'disposition'),
    done: field(n, 'done'),
  };

{
  today: today,
  columns: columns,
  done_column: doneColumn,
  tasks: [card(n) for n in notes if field(n, 'type') == 'task' && matches(n)],
}
```
