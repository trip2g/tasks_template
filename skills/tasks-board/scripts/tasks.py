#!/usr/bin/env python3
import argparse
import datetime
import json
import os
import pathlib
import re
import subprocess
import sys

import yaml

DEFAULT_COLUMNS = ['Inbox', 'Planned', 'In progress', 'Blocked', 'Done']
DEFAULT_QUERY = '[[tasks_board]]'
SYNC = '/opt/hermes/docker/secondbrain-sync.sh'
DATE = re.compile(r'^\d{4}-\d{2}-\d{2}$')
OPENING = re.compile(r'^---\r?\n')
CLOSING = re.compile(r'^(---|\.\.\.)[ \t]*(\r?\n|$)', re.M)


def block_end(content):
    start = OPENING.match(content)
    if not start:
        return -1
    found = CLOSING.search(content, start.end())
    if not found:
        return -1
    return found.end()


def line_pattern(key):
    return re.compile(r'^' + re.escape(key) + r':([ \t]*)(.*?)(\r?)$', re.M)


def plain_safe(value):
    if DATE.match(value):
        return True
    if value == '' or value.strip() != value:
        return False
    if re.match(r'^[-?:,\[\]{}#&*!|>\'"%@`]', value):
        return False
    if re.search(r': |\s#', value):
        return False
    if re.match(r'^(true|false|yes|no|on|off|null|~|[-+.\d][\d._:eE+-]*)$', value, re.I):
        return False
    return True


def encode(value, previous):
    if previous and previous.startswith('"'):
        return json.dumps(value, ensure_ascii=False)
    if previous and previous.startswith("'"):
        return "'" + value.replace("'", "''") + "'"
    return value if plain_safe(value) else json.dumps(value, ensure_ascii=False)


def set_field(content, key, value):
    end = block_end(content)
    if end < 0:
        raise SystemExit('the note has no frontmatter')
    block = content[:end]
    found = line_pattern(key).search(block)
    if found:
        line = key + ':' + (found.group(1) or ' ') + encode(value, found.group(2).strip() or None) + found.group(3)
        return block[:found.start()] + line + block[found.end():] + content[end:]
    newline = '\r\n' if '\r\n' in block else '\n'
    closing = re.search(r'(---|\.\.\.)[ \t]*(\r?\n)?$', block)
    return block[:closing.start()] + key + ': ' + encode(value, None) + newline + block[closing.start():] + content[end:]


def meta_of(content):
    end = block_end(content)
    if end < 0:
        return {}
    start = OPENING.match(content).end()
    closing = CLOSING.search(content, start)
    data = yaml.safe_load(content[start:closing.start()]) or {}
    return data if isinstance(data, dict) else {}


def text(value):
    if value is None:
        return ''
    if isinstance(value, (datetime.date, datetime.datetime)):
        return value.isoformat()[:10]
    return str(value)


def vault_notes(vault):
    for path in sorted(vault.rglob('*.md')):
        rel = path.relative_to(vault).as_posix()
        if rel.startswith('_') or '/.' in '/' + rel:
            continue
        content = path.read_text()
        yield rel, content, meta_of(content)


def matches(meta, flt):
    for key, want in flt.items():
        have = text(meta.get(key))
        if isinstance(want, list):
            if have not in [text(w) for w in want]:
                return False
        elif have != text(want):
            return False
    return True


def columns_of(meta):
    given = meta.get('tasks_columns')
    return [text(c) for c in given] if isinstance(given, list) and given else DEFAULT_COLUMNS


def sync(args):
    if args.no_sync:
        return
    if not os.path.exists(SYNC):
        raise SystemExit(f'no sync script at {SYNC}; pass --no-sync to edit the local copy only')
    subprocess.run([SYNC], check=True, env={**os.environ, 'TRIP2G_VAULT_DIR': str(args.vault)})


def safe_name(name):
    cleaned = re.sub(r'[\\/:*?"<>|#^\[\]]', ' ', name)
    return re.sub(r'\s+', ' ', cleaned).strip()


def today(args):
    return args.today or datetime.date.today().isoformat()


def cmd_new(args):
    sync(args)
    folder = args.vault / 'tasks' / safe_name(args.project)
    note = folder / (safe_name(args.title) + '.md')
    if note.exists():
        raise SystemExit(f'{note.relative_to(args.vault)} already exists')
    if args.due and not DATE.match(args.due):
        raise SystemExit('--due takes YYYY-MM-DD; leave it out when nobody named a date')
    lines = [
        '---',
        'title: ' + json.dumps(args.title, ensure_ascii=False),
        'type: task',
        'project: ' + json.dumps(args.project, ensure_ascii=False),
        'status: ' + json.dumps(args.status, ensure_ascii=False),
        'owner: ' + json.dumps(args.owner or '', ensure_ascii=False),
    ]
    if args.due:
        lines.append('due: ' + args.due)
    lines += ['disposition: active', '---', '# ' + args.title, '']
    if args.source:
        lines += ['Source: ' + args.source, '']
    folder.mkdir(parents=True, exist_ok=True)
    note.write_text('\n'.join(lines))
    sync(args)
    print(note.relative_to(args.vault).as_posix())


def cmd_status(args):
    sync(args)
    note = args.vault / args.path
    content = note.read_text()
    meta = meta_of(content)
    boards = [m for _, _, m in vault_notes(args.vault) if text(m.get('layout')) == 'tasks' and isinstance(m.get('tasks_filter', {}), dict) and matches(meta, m.get('tasks_filter', {}))]
    done = {columns_of(b)[-1] for b in boards} or {DEFAULT_COLUMNS[-1]}
    if args.status in done and not args.evidence:
        raise SystemExit('closing a task needs --evidence: the owner\'s words or a link to the result')
    content = set_field(content, 'status', args.status)
    if args.status in done:
        content = set_field(content, 'done', today(args))
        content = content.rstrip('\n') + f'\n\n- {today(args)}: {args.status}. {args.evidence}\n'
    note.write_text(content)
    sync(args)
    print(f'{args.path}: {text(meta.get("status"))} -> {args.status}')


def cmd_board(args):
    sync(args)
    note = args.vault / 'boards' / (safe_name(args.project) + '.md')
    if note.exists():
        raise SystemExit(f'{note.relative_to(args.vault)} already exists')
    lines = [
        '---',
        'title: ' + json.dumps(args.title or args.project, ensure_ascii=False),
        'layout: tasks',
        'tasks_filter:',
        '  project: ' + json.dumps(args.project, ensure_ascii=False),
    ]
    if args.columns:
        lines.append('tasks_columns: ' + json.dumps([c.strip() for c in args.columns.split(',')], ensure_ascii=False))
    lines += ['---', '# ' + (args.title or args.project), '']
    note.parent.mkdir(parents=True, exist_ok=True)
    note.write_text('\n'.join(lines))
    sync(args)
    print(note.relative_to(args.vault).as_posix())


def lint(vault, day):
    notes = list(vault_notes(vault))
    boards = [(p, m) for p, _, m in notes if text(m.get('layout')) == 'tasks' and text(m.get('tasks_query')) in ('', DEFAULT_QUERY)]
    findings = []
    for path, _, meta in notes:
        if text(meta.get('type')) != 'task':
            continue
        if text(meta.get('disposition')) in ('completed', 'cancelled'):
            continue
        status = text(meta.get('status'))
        mine = [(p, m) for p, m in boards if isinstance(m.get('tasks_filter', {}), dict) and matches(meta, m.get('tasks_filter', {}))]
        done = {columns_of(m)[-1] for _, m in mine} or {DEFAULT_COLUMNS[-1]}
        problems = []
        if not mine:
            problems.append('not on any board')
        for board, m in mine:
            if status not in columns_of(m):
                problems.append(f'status "{status}" is not a column of {board}')
        if status not in done:
            owner = text(meta.get('owner'))
            due = text(meta.get('due'))
            if not owner:
                problems.append('no owner')
            if not due:
                problems.append('no due date')
            elif not DATE.match(due):
                problems.append(f'due "{due}" is not a date')
            elif due < day:
                problems.append(f'overdue since {due}')
            if text(meta.get('blocked')):
                problems.append('blocked: ' + text(meta.get('blocked')))
        if problems:
            findings.append({'path': path, 'title': text(meta.get('title')) or pathlib.Path(path).stem, 'owner': text(meta.get('owner')), 'problems': problems})
    return findings


def cmd_lint(args):
    if not args.no_sync:
        sync(args)
    findings = lint(args.vault, today(args))
    if args.json:
        print(json.dumps(findings, ensure_ascii=False, indent=1))
        return
    print(f'## {args.heading}')
    print()
    if not findings:
        print('Nothing.')
        return
    for item in findings:
        owner = item['owner'] or 'no owner'
        print(f'- [[{item["path"][:-3]}|{item["title"]}]] ({owner}): ' + '; '.join(item['problems']))


def main():
    parser = argparse.ArgumentParser(description='Task notes and the boards that show them.')
    parser.add_argument('--vault', type=pathlib.Path, default=pathlib.Path(os.environ.get('TRIP2G_VAULT_DIR', '/opt/data/secondbrain')))
    parser.add_argument('--no-sync', action='store_true', help='edit the local copy without pulling or pushing')
    parser.add_argument('--today', help='YYYY-MM-DD, defaults to the system date')
    sub = parser.add_subparsers(dest='command', required=True)

    new = sub.add_parser('new', help='create a task note')
    new.add_argument('--title', required=True)
    new.add_argument('--project', required=True)
    new.add_argument('--status', default=DEFAULT_COLUMNS[0])
    new.add_argument('--owner', help='only a person someone named')
    new.add_argument('--due', help='YYYY-MM-DD, only a date someone named')
    new.add_argument('--source', help='a [[link]] to where the task came from')
    new.set_defaults(run=cmd_new)

    status = sub.add_parser('status', help='set the status line of a task note')
    status.add_argument('path', help='vault path, e.g. tasks/Website/Fix the form.md')
    status.add_argument('status')
    status.add_argument('--evidence', help='the owner\'s words or a [[link]] to the result; required for the done column')
    status.set_defaults(run=cmd_status)

    board = sub.add_parser('board', help='create a board for a project')
    board.add_argument('--project', required=True)
    board.add_argument('--title')
    board.add_argument('--columns', help='comma-separated statuses, the last one is done')
    board.set_defaults(run=cmd_board)

    check = sub.add_parser('lint', help='tasks that need a decision')
    check.add_argument('--json', action='store_true')
    check.add_argument('--heading', default='Needs a decision')
    check.set_defaults(run=cmd_lint)

    args = parser.parse_args()
    args.run(args)


if __name__ == '__main__':
    main()
