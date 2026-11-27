---
type: note-query
free: true
---

Every board (`layout: tasks`, or any note with `tasks_columns`, whatever its layout) with its counts and the people who own its tasks, boards that need a decision first. A board with its own `tasks_query` is listed without counts: its cards are whatever that query returns.

Today is the site's date, `now.date`; a page may pass `today` (`YYYY-MM-DD`) for a trip2g that has no `now` yet.

```jsonnet
local today = if std.objectHas(params, 'today') then params.today else std.parseJson(std.extVar('now')).date;
local defaultQuery = '[[tasks_board]]';
local defaultColumns = ['Inbox', 'Planned', 'In progress', 'Blocked', 'Done'];

local text(v) = if v == null then '' else if std.isString(v) then v else std.toString(v);
local field(n, k) = text(std.get(n.meta, k, null));
local isDate(s) = std.length(s) == 10 && std.substr(s, 4, 1) == '-' && std.substr(s, 7, 1) == '-';

local tasks = [n for n in notes if field(n, 'type') == 'task'];

local values(v) = if std.isArray(v) then [text(x) for x in v] else [text(v)];
local matches(filter, n) = std.all([
  local want = values(filter[k]);
  local have = values(std.get(n.meta, k, null));
  std.length([h for h in have if std.member(want, h)]) > 0
  for k in std.objectFields(filter)
]);

local summary(b) =
  local given = std.get(b.meta, 'tasks_columns', []);
  local columns = if std.isArray(given) && std.length(given) > 0 then given else defaultColumns;
  local doneColumn = columns[std.length(columns) - 1];
  local filter = std.get(b.meta, 'tasks_filter', {});
  local mine = [n for n in tasks if matches(if std.isObject(filter) then filter else {}, n)];
  local open = [
    n for n in mine
    if field(n, 'status') != doneColumn
    && !std.member(['completed', 'cancelled'], field(n, 'disposition'))
  ];
  local overdue(n) = isDate(field(n, 'due')) && today != '' && field(n, 'due') < today;
  local decision(n) = field(n, 'blocked') != '' || overdue(n) || field(n, 'owner') == '';
  {
    path: b.path,
    title: b.title,
    permalink: b.permalink,
    custom: false,
    columns: [{ status: s, count: std.length([n for n in mine if field(n, 'status') == s]) } for s in columns],
    outside: std.length([n for n in mine if !std.member(columns, field(n, 'status'))]),
    total: std.length(mine),
    overdue: std.length([n for n in open if overdue(n)]),
    no_owner: std.length([n for n in open if field(n, 'owner') == '']),
    no_due: std.length([n for n in open if !isDate(field(n, 'due'))]),
    blocked: std.length([n for n in open if field(n, 'blocked') != '']),
    needs_decision: std.length([n for n in open if decision(n)]),
    owners: std.set(std.flattenArrays([[o for o in values(std.get(n.meta, 'owner', null)) if o != ''] for n in mine])),
  };

local custom(b) = {
  path: b.path,
  title: b.title,
  permalink: b.permalink,
  custom: true,
  needs_decision: -1,
};

local boards = [n for n in notes if field(n, 'layout') == 'tasks' || std.isArray(std.get(n.meta, 'tasks_columns', null))];
local rows = [
  if std.member(['', defaultQuery], field(b, 'tasks_query')) then summary(b) else custom(b)
  for b in boards
];

std.sort(rows, function(r) [-r.needs_decision, r.title])
```
