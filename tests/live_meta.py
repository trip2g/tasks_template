import json
import os
import sys
import urllib.request

URL = os.environ['T2G_URL'] + '/_system/graphql'
TOKEN = os.environ['T2G_TOKEN']
PATH = 'tests/live_meta_probe.md'
SAVE = 'mutation($input: UpdateNotesInput!){ updateNotes(input:$input){ __typename ... on ErrorPayload{message} } }'
READ = 'query($p:[String!]){ notePaths(filter:{paths:$p}){ content latestContentHash } }'
ORIGINAL = (
    '---\n# kept comment\ntitle: "A: b"\nstatus:   "Planned"   # kept\nowner: \'Leo\'\n'
    'tags: [x, y]\nnested:\n  status: kept\ndue: 2026-11-20\n---\n# Body\n\nstatus: "Planned" in the body\r\nend'
)


def gql(query, variables):
    body = json.dumps({'query': query, 'variables': variables}).encode()
    request = urllib.request.Request(URL, body, {'Content-Type': 'application/json', 'Authorization': 'Bearer ' + TOKEN, 'Cookie': 'trip2g_token=' + TOKEN})
    return json.load(urllib.request.urlopen(request))


def change(kind, **fields):
    result = gql(SAVE, {'input': {'changes': [{kind: {'path': PATH, **fields}}]}})['data']['updateNotes']
    assert result['__typename'] == 'UpdateNotesSuccessPayload', result


def read():
    return gql(READ, {'p': [PATH]})['data']['notePaths'][0]


def without(content, keys):
    return [line for line in content.split('\n') if not any(line.startswith(key + ':') for key in keys)]


change('upsert', content=ORIGINAL)
change('meta', set={'status': 'Done', 'done': '2026-11-23'}, unset=[], expectedHash=read()['latestContentHash'])
into_done = read()['content']
assert without(into_done, ['status', 'done']) == without(ORIGINAL, ['status', 'done']), into_done
assert '\ndone: ' in into_done and '\nstatus: Done' in into_done, into_done

change('meta', set={'status': 'In progress'}, unset=['done'], expectedHash=read()['latestContentHash'])
out_of_done = read()['content']
assert without(out_of_done, ['status']) == without(ORIGINAL, ['status']), out_of_done
assert 'done:' not in out_of_done.split('\n---\n')[0], out_of_done

print('ok   live meta: only the status and done lines change, every other byte stays')
