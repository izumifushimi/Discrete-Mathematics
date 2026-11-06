"""Merge manually verified section transcriptions; refuse missing/duplicate sections."""
import json
from pathlib import Path
root=Path(__file__).resolve().parent.parent
sections=json.loads((root/'dist/sections.js').read_text()[15:-1])
expected={s['key'] for s in sections}
merged={}
for path in sorted((root/'source-transcripts').glob('chapter*.json')):
    data=json.loads(path.read_text())
    for key,value in data.items():
        if key in merged: raise ValueError(f'Duplicate section: {key}')
        if key not in expected: raise ValueError(f'Unknown section: {key}')
        if not isinstance(value,str) or len(value)<50: raise ValueError(f'Empty section: {key}')
        merged[key]=value
missing=expected-set(merged)
if missing: raise ValueError(f'Missing sections: {sorted(missing)}')
ordered={s['key']:merged[s['key']] for s in sections}
(root/'dist/transcripts.js').write_text('const transcripts='+json.dumps(ordered,ensure_ascii=False)+';')
print(f'Merged {len(ordered)} sections; {sum(map(len,ordered.values())):,} characters of HTML.')
