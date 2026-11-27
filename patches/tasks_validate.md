---
type: frontmatter-patch
include: ["**/*.md"]
---

Every task note is checked by `validators/task.md`, every board by `validators/board.md`. A note's own `validate` stays.

```jsonnet
local own = std.get(meta, 'validate', []);
local list = if own == null then [] else if std.isString(own) then [own] else own;
if std.get(meta, 'type', '') == 'task' then { validate: list + ['[[validators/task]]'] }
else if std.isArray(std.get(meta, 'tasks_columns', null)) then { validate: list + ['[[validators/board]]'] }
else {}
```
