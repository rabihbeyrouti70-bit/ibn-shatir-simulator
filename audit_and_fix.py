# -*- coding: utf-8 -*-
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

VOLUMES = [
    "فتح الجواد (١)",
    "فتح الجواد (٢)",
    "فتح الجواد (٣)",
    "بغية الطالب لمعرفة العلم الديني الواجب"
]

def audit_volume(vol_name: str) -> Dict[str, Any]:
    cache_dir = Path(".ocr_cache") / vol_name
    if not cache_dir.exists():
        return {"error": "Not found"}

    files = sorted(
        cache_dir.glob("page_*.json"),
        key=lambda x: int(x.stem.split("_")[1])
    )

    report = {
        "volume": vol_name,
        "total_pages": len(files),
        "unclosed_bold": [],
        "unmatched_quran": [],
        "unmatched_hadith": [],
        "english_punct": [],
        "space_before_punct": [],
        "double_spaces": [],
        "floating_harakat": [],
        "broken_la": [],
        "corrupted_honorifics": []
    }

    for f in files:
        page_num = int(f.stem.split("_")[1])
        try:
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                txt = data.get("text", "")
        except Exception:
            continue

        if txt.count("**") % 2 != 0:
            report["unclosed_bold"].append(page_num)
        if txt.count("﴿") != txt.count("﴾"):
            report["unmatched_quran"].append((page_num, txt.count("﴿"), txt.count("﴾")))
        if txt.count("«") != txt.count("»"):
            report["unmatched_hadith"].append((page_num, txt.count("«"), txt.count("»")))
        if re.search(r'[\u0600-\u06FF][,?;]', txt):
            report["english_punct"].append(page_num)
        if re.search(r'[\u0600-\u06FF]\s+[،؛؟\.:!]', txt):
            report["space_before_punct"].append(page_num)
        if "  " in txt:
            report["double_spaces"].append(page_num)
        if re.search(r'[\u0600-\u06FF]\s+[\u064B-\u0652]', txt):
            report["floating_harakat"].append(page_num)
        if re.search(r'\bل\s+ا\b', txt):
            report["broken_la"].append(page_num)
        if re.search(r'\(صلعم\)|\(ص\)|\(رض\)|\(رح\)|\bصلي الله عليه\b', txt):
            report["corrupted_honorifics"].append(page_num)

    return report

def main():
    print("================================================================")
    print("   فحص وتدقيق الأخطاء المطبعية وتنسيقات النص في كافة المجلدات   ")
    print("================================================================")

    for vol in VOLUMES:
        res = audit_volume(vol)
        if "error" in res:
            continue
        print(f"\n📁 المجلد: {vol} ({res['total_pages']} صفحة)")
        print(f"  • وسوم الخط العريض غير المغلقة (**): {len(res['unclosed_bold'])} صفحة -> {res['unclosed_bold'][:10]}")
        print(f"  • أقواس الآيات القرآنية غير المتطابقة (﴿ ﴾): {len(res['unmatched_quran'])} صفحة -> {[x[0] for x in res['unmatched_quran'][:10]]}")
        print(f"  • علامات التنصيص غير المتطابقة (« »): {len(res['unmatched_hadith'])} صفحة -> {[x[0] for x in res['unmatched_hadith'][:10]]}")
        print(f"  • علامات ترقيم إنجليزية في سياق عربي (, ; ?): {len(res['english_punct'])} صفحة")
        print(f"  • مسافات زائدة قبل علامات الترقيم: {len(res['space_before_punct'])} صفحة")
        print(f"  • مسافات متتالية مكررة (Double Spaces): {len(res['double_spaces'])} صفحة")
        print(f"  • حركات تشكيل مفصولة بمسافة عن الحرف: {len(res['floating_harakat'])} صفحة")
        print(f"  • حروف مقطوعة (ل ا): {len(res['broken_la'])} صفحة -> {res['broken_la'][:10]}")
        print(f"  • رموز واختصارات بحاجة لتوحيد وضبط: {len(res['corrupted_honorifics'])} صفحة -> {res['corrupted_honorifics'][:10]}")

if __name__ == "__main__":
    main()
