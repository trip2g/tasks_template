import json
import pathlib
import shutil
import subprocess
import sys
import tempfile
import unittest

HERE = pathlib.Path(__file__).resolve().parent
SCRIPT = HERE.parent / 'scripts' / 'tasks.py'
EXAMPLE = HERE.parents[2] / 'example'

sys.path.insert(0, str(SCRIPT.parent))
import tasks


def run(vault, *args):
    cmd = [sys.executable, str(SCRIPT), '--vault', str(vault), '--no-sync', '--today', '2026-11-23', *args]
    return subprocess.run(cmd, capture_output=True, text=True)


class SetField(unittest.TestCase):

    def test_keeps_every_other_byte(self):
        before = '---\ntitle: "A: b"\nstatus: "Planned"\nowner: Anna\n---\n# A\n\nstatus: "Planned" in the body\n'
        after = '---\ntitle: "A: b"\nstatus: "В работе"\nowner: Anna\n---\n# A\n\nstatus: "Planned" in the body\n'
        self.assertEqual(tasks.set_field(before, 'status', 'В работе'), after)

    def test_plain_single_and_crlf(self):
        self.assertEqual(tasks.set_field('---\nstatus: Planned\n---\n', 'status', 'Done'), '---\nstatus: Done\n---\n')
        self.assertEqual(tasks.set_field("---\nstatus: 'x'\n---\n", 'status', "it's"), "---\nstatus: 'it''s'\n---\n")
        self.assertEqual(tasks.set_field('---\r\nstatus: "a"\r\n---\r\nB\r\n', 'status', 'b'), '---\r\nstatus: "b"\r\n---\r\nB\r\n')

    def test_adds_a_missing_field(self):
        self.assertEqual(tasks.set_field('---\ntitle: X\n---\nBody', 'done', '2026-11-23'), '---\ntitle: X\ndone: 2026-11-23\n---\nBody')


class Commands(unittest.TestCase):

    def setUp(self):
        self.dir = tempfile.TemporaryDirectory()
        self.vault = pathlib.Path(self.dir.name)
        shutil.copytree(EXAMPLE, self.vault, dirs_exist_ok=True)

    def tearDown(self):
        self.dir.cleanup()

    def test_lint_reports_what_needs_a_decision(self):
        out = run(self.vault, 'lint', '--json')
        self.assertEqual(out.returncode, 0, out.stderr)
        found = {item['title']: item['problems'] for item in json.loads(out.stdout)}
        self.assertEqual(found, {
            'Clean the subscriber list': ['status "In review" is not a column of boards/Newsletter.md'],
            'Pick a sending day': ['no owner', 'no due date'],
            'Collect testimonials': ['due "after the launch" is not a date'],
            'Fix the contact form on mobile': ['no owner', 'overdue since 2026-11-21'],
            'Replace the hero photo': ['overdue since 2026-11-20', "blocked: waiting for the photographer's final files"],
        })

    def test_lint_markdown_heading(self):
        out = run(self.vault, 'lint', '--heading', 'Нужно решение')
        self.assertTrue(out.stdout.startswith('## Нужно решение\n'))
        self.assertIn('- [[tasks/newsletter/Pick a sending day|Pick a sending day]] (no owner): no owner; no due date', out.stdout)

    def test_new_task_takes_no_invented_fields(self):
        out = run(self.vault, 'new', '--title', 'Order business cards', '--project', 'Website')
        self.assertEqual(out.returncode, 0, out.stderr)
        note = (self.vault / 'tasks' / 'Website' / 'Order business cards.md').read_text()
        self.assertNotIn('owner:', note)
        self.assertNotIn('due:', note)
        self.assertIn('status: "Inbox"\n', note)

    def test_new_task_refuses_a_due_that_is_not_a_date(self):
        out = run(self.vault, 'new', '--title', 'X', '--project', 'Website', '--due', 'next week')
        self.assertNotEqual(out.returncode, 0)

    def test_status_changes_one_line(self):
        path = 'tasks/website/Collect testimonials.md'
        before = (self.vault / path).read_text()
        out = run(self.vault, 'status', path, 'In progress')
        self.assertEqual(out.returncode, 0, out.stderr)
        after = (self.vault / path).read_text()
        self.assertEqual(after, before.replace('status: "Inbox"', 'status: "In progress"'))

    def test_closing_needs_evidence(self):
        path = 'tasks/website/Draft the pricing page.md'
        refused = run(self.vault, 'status', path, 'Done')
        self.assertNotEqual(refused.returncode, 0)
        self.assertIn('--evidence', refused.stderr)
        done = run(self.vault, 'status', path, 'Done', '--evidence', 'Maya: "published", [[pricing]]')
        self.assertEqual(done.returncode, 0, done.stderr)
        note = (self.vault / path).read_text()
        self.assertIn('status: "Done"\n', note)
        self.assertIn('done: 2026-11-23\n', note)
        self.assertTrue(note.endswith('- 2026-11-23: Done. Maya: "published", [[pricing]]\n'))

    def test_leaving_done_removes_done(self):
        path = 'tasks/website/Publish the accessibility statement.md'
        before = (self.vault / path).read_text()
        out = run(self.vault, 'status', path, 'In progress')
        self.assertEqual(out.returncode, 0, out.stderr)
        after = (self.vault / path).read_text()
        self.assertEqual(after, before.replace('status: "Done"', 'status: "In progress"').replace('done: 2026-11-19\n', ''))

    def test_clean_removes_placeholder_keys_only(self):
        path = self.vault / 'tasks' / 'website' / 'Placeholder.md'
        path.write_text('---\ntitle: "P"\ntype: task\nproject: "Website"\nstatus: "Inbox"\nowner: "не назначен"\ndue: "не задано"\nblocked: "real reason"\n---\n# P\n\nowner: не назначен\n')
        dry = run(self.vault, 'clean', '--placeholder', 'не назначен', '--placeholder', 'не задано', '--dry-run')
        self.assertIn('would remove 2 keys in 1 task notes', dry.stdout)
        self.assertIn('owner: не назначен', path.read_text())
        out = run(self.vault, 'clean', '--placeholder', 'не назначен', '--placeholder', 'не задано')
        self.assertEqual(out.returncode, 0, out.stderr)
        self.assertEqual(path.read_text(), '---\ntitle: "P"\ntype: task\nproject: "Website"\nstatus: "Inbox"\nblocked: "real reason"\n---\n# P\n\nowner: не назначен\n')

    def test_board_for_a_project(self):
        out = run(self.vault, 'board', '--project', 'Hiring', '--columns', 'Новые,В работе,Готово')
        self.assertEqual(out.returncode, 0, out.stderr)
        note = (self.vault / 'boards' / 'Hiring.md').read_text()
        self.assertEqual(note, '---\ntitle: "Hiring"\nlayout: tasks\ntasks_filter:\n  project: "Hiring"\ntasks_columns: ["Новые", "В работе", "Готово"]\n---\n# Hiring\n')

    def test_writes_refuse_to_run_without_the_sync_script(self):
        cmd = [sys.executable, str(SCRIPT), '--vault', str(self.vault), 'lint']
        out = subprocess.run(cmd, capture_output=True, text=True)
        self.assertNotEqual(out.returncode, 0)
        self.assertIn('--no-sync', out.stderr)


if __name__ == '__main__':
    unittest.main()
