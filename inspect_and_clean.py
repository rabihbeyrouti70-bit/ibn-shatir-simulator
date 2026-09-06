# -*- coding: utf-8 -*-
"""
Inspection and Typography Cleaning Module for Classical Arabic OCR
"""

import sys
import os
import glob
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple, Any

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def clean_arabic_typography(text: str) -> Tuple[str, List[str]]:
    """
    Applies comprehensive typographical corrections for Arabic classical texts:
    1. Spacing around punctuation: no spaces before [،؛؟:.!], exactly one space after if followed by word.
    2. Spacing inside brackets: no space inside ( ), [ ], { }, « », ﴿ ﴾.
    3. Normalization of repeated punctuation (،، -> ،, .. -> . unless ..., etc.).
    4. Diacritics cleanup: remove space before harakat, normalize duplicate shaddah/haraka.
    5. Footnote numbers format: ensure [1] format without internal spaces like [ 1 ].
    6. Ensure clean footnote separator '---'.
    7. Clean broken double spaces and trailing spaces on lines.
    8. Fix broken letter ligatures (e.g. 'ل ا' -> 'لا').
    """
    changes = []
    original = text
    
    # 1. Normalize line endings and trailing whitespaces per line
    lines = [l.rstrip() for l in text.splitlines()]
    text = "\n".join(lines)
    
    # 2. Fix broken 'ل ا' -> 'لا'
    if re.search(r'\bل\s+ا\b', text):
        text = re.sub(r'\bل\s+ا\b', 'لا', text)
        changes.append("إصلاح لـا المقطوعة")
        
    # 3. Clean floating harakat (space before diacritics)
    # Arabic diacritics range: \u064B to \u0652
    if re.search(r'([\u0600-\u06FF])\s+([\u064B-\u0652])', text):
        text = re.sub(r'([\u0600-\u06FF])\s+([\u064B-\u0652])', r'\1\2', text)
        changes.append("إزالة المسافة الفاصلة بين الحرف وحركة التشكيل")
        
    # Duplicate harakat / shaddah normalization (e.g. َّّ -> َّ)
    text = re.sub(r'([\u064B-\u0652])\1+', r'\1', text)
    
    # 4. Remove space before punctuation: [ ، ; ؟ . ! : ) ] » ﴾ ]
    # Be careful not to affect markdown markers or URLs
    text = re.sub(r'([^\s\(\[«﴿\n])\s+([،؛؟:\.!\)\]»﴾])', r'\1\2', text)
    
    # 5. Ensure space after punctuation if followed immediately by an Arabic letter or number
    text = re.sub(r'([،؛؟:\.!])([^\s\d\)\],؛؟:\.!«»﴿﴾\n_])', r'\1 \2', text)
    
    # 6. Remove space immediately inside brackets: ( كلمة ) -> (كلمة)
    text = re.sub(r'([\(\[«﴿])\s+', r'\1', text)
    text = re.sub(r'\s+([\Defaults\)\]»﴾])', r'\1', text)
    
    # 7. Normalize footnote brackets: [ 1 ] -> [1], [ 12 ] -> [12]
    text = re.sub(r'\[\s*(\d+|[\u0660-\u0669]+)\s*\]', r'[\1]', text)
    text = re.sub(r'\(\s*(\d+|[\u0660-\u0669]+)\s*\)', r'(\1)', text)
    
    # In footnotes: ensure space between [1] and footnote text: [1]أخرجه -> [1] أخرجه
    text = re.sub(r'(^|\n)(\[\d+\]|\[[\u0660-\u0669]+\])([^\s\d])', r'\1\2 \3', text)
    
    # 8. Normalize repeated punctuation: ،، -> ،, ؟؟ -> ؟, !! -> !
    text = re.sub(r'([،,]){2,}', '،', text)
    text = re.sub(r'([؛;]){2,}', '؛', text)
    text = re.sub(r'([؟?]){2,}', '؟', text)
    text = re.sub(r'(!){2,}', '!', text)
    
    # Replace English commas/semicolons/question marks in Arabic context
    text = re.sub(r'([\u0600-\u06FF]),', r'\1،', text)
    text = re.sub(r'([\u0600-\u06FF]);', r'\1؛', text)
    text = re.sub(r'([\u0600-\u06FF])\?', r'\1؟', text)
    
    # 9. Clean multiple consecutive spaces inside lines (not leading indentation)
    lines_cleaned = []
    for line in text.splitlines():
        # collapse 2+ spaces to 1 space inside line, preserving leading spaces if any
        leading = len(line) - len(line.lstrip(' '))
        cleaned_line = (' ' * leading) + re.sub(r'[ ]{2,}', ' ', line.lstrip(' '))
        lines_cleaned.append(cleaned_line)
    text = "\n".join(lines_cleaned)
    
    # 10. Check and fix unclosed bold markers ** on single lines
    lines_bold_fixed = []
    for line in text.splitlines():
        if line.count("**") % 2 != 0:
            # If odd number of ** in line, close it at the end of the line
            line = line + "**"
            changes.append("إغلاق وسم المتن العريض (**) غير المقفل")
        lines_bold_fixed.append(line)
    text = "\n".join(lines_bold_fixed)
    
    if text != original:
        changes.append("ضبط علامات الترقيم والمسافات المعيارية")
        
    return text, list(set(changes))

if __name__ == "__main__":
    print("Testing clean_arabic_typography...")
    sample = "قال المصنف رحمه الله : هذا كتاب فقهي ، لا خلاف فيه . [ 1 ] أخرجه البيهقي ."
    cleaned, ch = clean_arabic_typography(sample)
    print("Original:", sample)
    print("Cleaned :", cleaned)
    print("Changes :", ch)
