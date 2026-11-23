import json
import pathlib
import sys

import yaml


def note(root, path, index):
    text = path.read_text()
    meta = {}
    if text.startswith('---\n'):
        meta = yaml.safe_load(text[4:text.index('\n---', 4)]) or {}
    meta = json.loads(json.dumps(meta, default=str))
    rel = path.relative_to(root).as_posix()
    return {
        'path': rel,
        'path_id': index,
        'version_id': index,
        'title': meta.get('title') or path.stem,
        'permalink': '/' + rel[:-3].lower().replace(' ', '_'),
        'meta': meta,
    }


root = pathlib.Path(sys.argv[1])
files = sorted(p for p in root.rglob('*.md') if not p.relative_to(root).as_posix().startswith('_'))
print(json.dumps([note(root, p, i + 1) for i, p in enumerate(files)], ensure_ascii=False, indent=1))
