import json
import pathlib
import subprocess
import sys
import tempfile
import unittest

import yaml

TOOL = pathlib.Path(__file__).resolve().parents[2] / 'scripts' / 'migrate-kanban-board'

SUMMARY = '''---
subgraphs: team
kanban-plugin: basic
layout: kanban
---
## Входящие

- [ ] [[inbox/Импорт — Сайт#Wekan W1|Сверстать шапку]] · **SITE** · 🟥 `red` · источник: Этап 1 · `wekan:W1` · `batch:b1`
- [ ] [[projects/Сайт — Купить домен|Купить домен]] · **SITE / Закупка** · Лена (`@lena`) · 📅 01.12.2026 10:00 МСК

## В работе

- [ ] [[projects/Сайт — Написать тексты|Написать тексты]] · **SITE / Тексты** · Лена (`@lena`) и Олег (`@oleg`) · срок не задан

## Готово

**Complete**

- [x] [[projects/Сайт — Выбрать хостинг|Выбрать хостинг]] · **SITE / Закупка** · Олег · ориентир: до пятницы

%% kanban:settings
```
{"kanban-plugin":"board"}
```
%%
'''

DIRECTION = '''---
subgraphs: team
kanban-plugin: basic
layout: kanban
---
## Входящие

- [ ] [[inbox/Импорт — Сайт#Wekan W1|Сверстать шапку]] · 🟥 `red` · источник: Этап 1 · `wekan:W1` · `batch:b1`
- [ ] `QA-1` Проверка · **Исполнитель: Команда QA** · 🟦 `qa`

## В работе

- [ ] [[projects/Сайт — Купить домен|Купить домен]] · **Закупка** · Лена (`@lena`) · 📅 01.12.2026

## Готово

**Complete**

- [x] [[projects/Сайт — Выбрать хостинг|Выбрать хостинг]] · **Закупка** · Олег · ориентир: до пятницы
'''


class MigrationTest(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.vault = pathlib.Path(self.tmp.name) / 'vault'
        (self.vault / 'projects').mkdir(parents=True)
        self.summary = self.vault / 'projects' / 'Команда — сводная доска.md'
        self.direction = self.vault / 'projects' / 'Команда — Сайт — доска.md'
        self.summary.write_text(SUMMARY)
        self.direction.write_text(DIRECTION)
        (self.vault / 'projects' / 'Сайт — Выбрать хостинг.md').write_text('---\ntype: task\nstatus: Готово\npriority: не задан\n---\n\n# Выбрать хостинг\n\nТекст заметки.\n')
        self.out = pathlib.Path(self.tmp.name) / 'out'

    def tearDown(self):
        self.tmp.cleanup()

    def run_tool(self, *extra):
        report = pathlib.Path(self.tmp.name) / 'report.json'
        args = [sys.executable, str(TOOL), '--vault', str(self.vault), '--summary', str(self.summary),
                '--field', 'workstream', '--today', '2026-11-27', '--json', str(report), *extra,
                str(self.summary), str(self.direction)]
        done = subprocess.run(args, capture_output=True, text=True, check=True)
        return json.loads(report.read_text()), done.stdout

    def note(self, rel):
        text = (self.out / rel).read_text()
        return yaml.safe_load(text[4:text.index('\n---', 4)]), text

    def test_dry_run_writes_nothing_and_reports(self):
        report, stdout = self.run_tool('--dry-run')
        self.assertFalse(self.out.exists())
        self.assertEqual(report['cards_read'], 8)
        self.assertEqual(report['tasks'], 5)
        self.assertEqual(report['duplicates_merged'], 3)
        self.assertIn('Пробный прогон', stdout)

    def test_a_status_the_boards_disagree_on_is_listed_not_guessed(self):
        report, _ = self.run_tool('--out', str(self.out))
        self.assertEqual([c['task'] for c in report['status_conflicts']], ['Купить домен'])
        meta, _ = self.note('projects/Сайт — Купить домен.md')
        self.assertNotIn('status', meta)
        self.assertEqual(meta['status_conflict'], ['Входящие', 'В работе'])

    def test_owner_comes_from_the_name_segment_never_from_a_colour(self):
        self.run_tool('--out', str(self.out))
        meta, _ = self.note('projects/Сайт — Написать тексты.md')
        self.assertEqual(meta['owner'], ['Лена', 'Олег'])
        self.assertEqual(meta['owner_telegram'], ['@lena', '@oleg'])
        wekan, _ = self.note('tasks/SITE/Сверстать шапку.md')
        self.assertNotIn('owner', wekan)
        self.assertEqual(wekan['color'], 'red')
        qa, _ = self.note('tasks/SITE/Проверка.md')
        self.assertEqual(qa['owner'], 'Команда QA')

    def test_a_wekan_card_keeps_its_anchor_as_source(self):
        self.run_tool('--out', str(self.out))
        meta, _ = self.note('tasks/SITE/Сверстать шапку.md')
        self.assertEqual(meta['source'], '[[inbox/Импорт — Сайт#Wekan W1]]')
        self.assertEqual(meta['wekan'], 'W1')
        self.assertEqual(meta['subgraphs'], 'team')

    def test_due_and_time_and_a_note_already_there(self):
        self.run_tool('--out', str(self.out))
        domain, _ = self.note('projects/Сайт — Купить домен.md')
        self.assertEqual((domain['due'], domain['due_time']), ('2026-12-01', '10:00'))
        hosting, text = self.note('projects/Сайт — Выбрать хостинг.md')
        self.assertEqual(hosting['status'], 'Готово')
        self.assertEqual(hosting['due'], 'ориентир: до пятницы')
        self.assertNotIn('priority', hosting)
        self.assertIn('Текст заметки.', text)

    def test_each_old_board_becomes_a_query_board_and_is_archived(self):
        self.run_tool('--out', str(self.out), '--layout', 'kanban')
        summary, _ = self.note('projects/Команда — сводная доска.md')
        self.assertEqual(summary['tasks_filter'], {'workstream': ['SITE']})
        self.assertEqual(summary['tasks_columns'], ['Входящие', 'В работе', 'Готово'])
        self.assertEqual(summary['done'], ['Готово'])
        site, _ = self.note('projects/Команда — Сайт — доска.md')
        self.assertEqual(site['tasks_filter'], {'workstream': 'SITE'})
        old, _ = self.note('archive/kanban/Команда — Сайт — доска.md')
        self.assertNotIn('layout', old)
        self.assertEqual(old['kanban-plugin'], 'basic')

    def test_metrics_are_written_to_every_board(self):
        self.run_tool('--out', str(self.out), '--metric', 'Открытые=active', '--metric', 'Просрочено=overdue!')
        site, _ = self.note('projects/Команда — Сайт — доска.md')
        self.assertEqual(site['metrics'], [{'label': 'Открытые', 'flag': 'active'}, {'label': 'Просрочено', 'flag': 'overdue', 'risk': True}])

    def test_two_spellings_of_one_person_become_one_and_doubts_are_listed(self):
        extra = self.vault / 'projects' / 'Команда — Почта — доска.md'
        extra.write_text('''---
kanban-plugin: basic
---
## Входящие

- [ ] [[projects/Почта — Собрать список|Собрать список]] · **Сбор** · Лена Смирнова (`@lena`) · срок не задан
- [ ] [[projects/Почта — Разослать|Разослать]] · **Рассылка** · Ершов О.С. · срок не задан
''')
        args = [sys.executable, str(TOOL), '--vault', str(self.vault), '--summary', str(self.summary),
                '--today', '2026-11-27', '--out', str(self.out),
                '--json', str(pathlib.Path(self.tmp.name) / 'r.json'), str(self.summary), str(self.direction), str(extra)]
        subprocess.run(args, capture_output=True, text=True, check=True)
        report = json.loads((pathlib.Path(self.tmp.name) / 'r.json').read_text())
        self.assertEqual([(a['from'], a['to']) for a in report['aliases']], [('Лена', 'Лена Смирнова')])
        self.assertEqual([(d['a'], d['b']) for d in report['alias_doubts']], [('Ершов О.С.', 'Олег')])
        domain, _ = self.note('projects/Сайт — Купить домен.md')
        self.assertEqual(domain['owner'], 'Лена Смирнова')
        texts, _ = self.note('projects/Сайт — Написать тексты.md')
        self.assertEqual(texts['owner'], ['Лена Смирнова', 'Олег'])
        self.assertEqual(texts['owner_telegram'], ['@lena', '@oleg'])


if __name__ == '__main__':
    unittest.main()
