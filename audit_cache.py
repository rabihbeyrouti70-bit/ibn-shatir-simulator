import sys
import glob
import json
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

cache_dir = '.ocr_cache/بغية الطالب لمعرفة العلم الديني الواجب'
files = glob.glob(f'{cache_dir}/page_*.json')

print(f'Total pages to analyze: {len(files)}')

stats = {
    'total_chars': 0,
    'total_words': 0,
    'empty_pages': [],
    'short_pages': [],
    'unclosed_bold': [],
    'unclosed_quotes': [],
}

for f in sorted(files, key=lambda x: int(os.path.basename(x).split('_')[1].split('.')[0])):
    p_num = int(os.path.basename(f).split('_')[1].split('.')[0])
    with open(f, 'r', encoding='utf-8') as jf:
        try:
            d = json.load(jf)
            txt = d.get('text', '')
        except Exception as e:
            print(f'Error parsing page {p_num}: {e}')
            continue
            
    stats['total_chars'] += len(txt)
    words = txt.split()
    stats['total_words'] += len(words)
    
    if len(txt.strip()) == 0:
        stats['empty_pages'].append(p_num)
    elif len(txt.strip()) < 100:
        stats['short_pages'].append((p_num, len(txt.strip()), txt.strip()))
        
    if txt.count('**') % 2 != 0:
        stats['unclosed_bold'].append(p_num)
        
    if txt.count('«') != txt.count('»'):
        stats['unclosed_quotes'].append((p_num, txt.count('«'), txt.count('»')))

print('--- AUDIT SUMMARY ---')
print(f"Total Words Extracted: {stats['total_words']:,}")
print(f"Total Characters: {stats['total_chars']:,}")
print(f"Empty Pages: {len(stats['empty_pages'])} -> {stats['empty_pages']}")
print(f"Short Pages (<100 chars): {len(stats['short_pages'])}")
for sp in stats['short_pages']:
    print(f"  - Page {sp[0]} ({sp[1]} chars): {repr(sp[2])}")
print(f"Unclosed Bold tags (**): {len(stats['unclosed_bold'])} -> {stats['unclosed_bold']}")
print(f"Unbalanced Quotes (« »): {len(stats['unclosed_quotes'])} -> {stats['unclosed_quotes'][:10]}")
