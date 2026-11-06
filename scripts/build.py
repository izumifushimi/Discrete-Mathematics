"""Build dist/content.js from source-transcripts/sections/<key>.{html,quiz.json,pages.json}.

Validates: every section present, every page 1..272 has a processing record inside its
section's range, quiz format (choice/fill only), no placeholder text.
Usage: python3 scripts/build.py            # strict, fails on any problem
       python3 scripts/build.py --partial  # build what exists, report the rest
"""
import json, re, sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
src = root / 'source-transcripts' / 'sections'
meta = json.loads((root / 'dist/sections.js').read_text()[15:-1])
partial = '--partial' in sys.argv
PLACEHOLDERS = ['正在逐页校订', '待补充', '暂未完成', 'TODO', 'lorem', '占位']
STATUSES = {'transcribed', 'duplicate', 'blank', 'partial'}

problems, content, covered = [], {}, {}
for s in meta:
    k = s['key']
    files = {ext: src / f'{k}.{ext}' for ext in ('html', 'quiz.json', 'pages.json')}
    if not all(f.exists() for f in files.values()):
        problems.append(f'{k}: missing ' + ', '.join(e for e, f in files.items() if not f.exists()))
        continue
    html = files['html'].read_text()
    try:
        quiz = json.loads(files['quiz.json'].read_text())
        pages = json.loads(files['pages.json'].read_text())
    except json.JSONDecodeError as e:
        problems.append(f'{k}: bad JSON {e}')
        continue
    text = re.sub(r'<[^>]+>', '', html)
    if len(text.strip()) < 300:
        problems.append(f'{k}: body too short ({len(text.strip())} chars)')
    for p in PLACEHOLDERS:
        if p in html:
            problems.append(f'{k}: placeholder text "{p}"')
    if '$' in re.sub(r'\\\$', '', text):
        problems.append(f'{k}: contains $ (use \\( \\) for TeX)')
    for i, q in enumerate(quiz):
        if q.get('type') == 'choice':
            ok = isinstance(q.get('options'), list) and isinstance(q.get('answer'), int) \
                and 0 <= q['answer'] < len(q['options'])
        elif q.get('type') == 'fill':
            ok = isinstance(q.get('answer'), list) and q['answer'] and all(isinstance(a, str) for a in q['answer'])
        else:
            ok = False
        if not ok or not q.get('q') or not q.get('why'):
            problems.append(f'{k}: quiz #{i} malformed')
    if len(quiz) < 4:
        problems.append(f'{k}: only {len(quiz)} quiz items')
    for rec in pages:
        n = rec.get('page')
        if rec.get('status') not in STATUSES:
            problems.append(f'{k}: page {n} bad status {rec.get("status")}')
        if not (s['start'] <= n <= s['end']):
            problems.append(f'{k}: page {n} outside range {s["start"]}-{s["end"]}')
        covered[n] = dict(rec, section=k)
    for n in range(s['start'], s['end'] + 1):
        if n not in {r.get('page') for r in pages}:
            problems.append(f'{k}: no record for page {n}')
    content[k] = {'html': html, 'quiz': quiz, 'pages': pages}

missing_pages = [n for n in range(1, 273) if n not in covered]
(root / 'dist/content.js').write_text('const CONTENT=' + json.dumps(content, ensure_ascii=False) + ';')
stats = {st: sum(1 for r in covered.values() if r['status'] == st) for st in STATUSES}
unclear = sum(c['html'].count('class="unclear"') for c in content.values())
fixes = sum(c['html'].count('class="fix"') for c in content.values())
print(f'sections {len(content)}/{len(meta)}; pages recorded {len(covered)}/272 {stats}; '
      f'quiz {sum(len(c["quiz"]) for c in content.values())}; fix blocks {fixes}; unclear blocks {unclear}; '
      f'text {sum(len(re.sub(r"<[^>]+>", "", c["html"])) for c in content.values()):,} chars')
if missing_pages:
    print('pages without record:', missing_pages[:40], '...' if len(missing_pages) > 40 else '')
for p in problems:
    print('PROBLEM', p)
if problems and not partial:
    sys.exit(1)
