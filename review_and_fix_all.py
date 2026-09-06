# -*- coding: utf-8 -*-
"""
=============================================================================
 سكربت المراجعة والتدقيق اللغوي والمطبعي الشامل لكافة المجلدات والكتب المحولة
=============================================================================
 يقوم بـ:
 1. فحص وتصحيح علامات الترقيم العربية (إزالة المسافات قبلها، ضبط المسافات بعدها).
 2. فحص وتصحيح الأقواس وعلامات التنصيص وأقواس الآيات (إزالة المسافات الزائدة بداخلها).
 3. ضبط حركات التشكيل المفصولة وتكرار الشدات والحركات.
 4. تصحيح الحروف والكلمات المقطوعة (مثل 'ل ا' -> 'لا').
 5. إصلاح وسوم الخط العريض (Bold Markdown **) غير المغلقة.
 6. توحيد تنسيق الحواشي والهوامش والفواصل.
 7. إعادة بناء وتوليد ملفات Word (.docx) و Markdown (.md) المنقحة فوراً.
=============================================================================
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

# استيراد محرك بناء الوورد من السكربت الرئيسي
from ai_pdf_to_word import ArabicWordDocumentBuilder, docx_to_markdown, normalize_arabic_brackets

VOLUMES = [
    {
        "name": "فتح الجواد (١)",
        "docx": "فتح الجواد (١).docx",
        "md": "فتح الجواد (١).md",
        "total_pages": 566
    },
    {
        "name": "فتح الجواد (٢)",
        "docx": "فتح الجواد (٢).docx",
        "md": "فتح الجواد (٢).md",
        "total_pages": 496
    },
    {
        "name": "فتح الجواد (٣)",
        "docx": "فتح الجواد (٣).docx",
        "md": "فتح الجواد (٣).md",
        "total_pages": 584
    },
    {
        "name": "بغية الطالب لمعرفة العلم الديني الواجب",
        "docx": "بغية الطالب لمعرفة العلم الديني الواجب.docx",
        "md": "بغية الطالب لمعرفة العلم الديني الواجب.md",
        "total_pages": 894
    }
]

def clean_arabic_typography(text: str) -> Tuple[str, Dict[str, int]]:
    """تطبيق القواعد المطبعية واللغوية المعيارية للطباعة والتحقيق العربي."""
    stats = {
        "broken_la": 0,
        "floating_harakat": 0,
        "space_before_punct": 0,
        "space_inside_brackets": 0,
        "space_after_punct": 0,
        "english_punct": 0,
        "double_spaces": 0,
        "unclosed_bold": 0,
        "footnote_format": 0
    }
    
    original = text
    
    # 1. إصلاح 'ل ا' المقطوعة
    la_matches = len(re.findall(r'\bل\s+ا\b', text))
    if la_matches > 0:
        text = re.sub(r'\bل\s+ا\b', 'لا', text)
        stats["broken_la"] += la_matches
        
    # 2. إزالة المسافة بين الحرف وحركة التشكيل
    fl_matches = len(re.findall(r'([\u0600-\u06FF])\s+([\u064B-\u0652])', text))
    if fl_matches > 0:
        text = re.sub(r'([\u0600-\u06FF])\s+([\u064B-\u0652])', r'\1\2', text)
        stats["floating_harakat"] += fl_matches
        
    # إزالة الحركات المكررة على الحرف نفسه
    text = re.sub(r'([\u064B-\u0652])\1+', r'\1', text)
    
    # 3. إزالة المسافات الزائدة داخل الأقواس: ( كلمة ) -> (كلمة)
    sp_in_open = len(re.findall(r'([\(\[\{«﴿])\s+', text))
    if sp_in_open > 0:
        text = re.sub(r'([\(\[\{«﴿])\s+', r'\1', text)
        stats["space_inside_brackets"] += sp_in_open
        
    sp_in_close = len(re.findall(r'\s+([\)\]\}»﴾])', text))
    if sp_in_close > 0:
        text = re.sub(r'\s+([\)\]\}»﴾])', r'\1', text)
        stats["space_inside_brackets"] += sp_in_close
        
    # 4. إزالة المسافة قبل علامات الترقيم: ، ؛ ؟ : . !
    sp_before = len(re.findall(r'(\S)\s+([،؛؟:\.!])', text))
    if sp_before > 0:
        text = re.sub(r'(\S)\s+([،؛؟:\.!])', r'\1\2', text)
        stats["space_before_punct"] += sp_before
        
    # 5. ضمان وجود مسافة بعد علامة الترقيم إذا تبعها حرف عربي أو رقم
    sp_after = len(re.findall(r'([،؛؟:\.!])([^\s\d\)\],؛؟:\.!«»﴾\n_])', text))
    if sp_after > 0:
        text = re.sub(r'([،؛؟:\.!])([^\s\d\)\],؛؟:\.!«»﴾\n_])', r'\1 \2', text)
        stats["space_after_punct"] += sp_after
        
    # 6. استبدال علامات الترقيم الإنجليزية بأصولها العربية في السياق العربي
    eng_matches = len(re.findall(r'([\u0600-\u06FF])[,?;]', text))
    if eng_matches > 0:
        text = re.sub(r'([\u0600-\u06FF]),', r'\1،', text)
        text = re.sub(r'([\u0600-\u06FF]);', r'\1؛', text)
        text = re.sub(r'([\u0600-\u06FF])\?', r'\1؟', text)
        stats["english_punct"] += eng_matches
        
    # 7. توحيد وضبط أرقام الحواشي: [ 1 ] -> [1]
    fn_matches = len(re.findall(r'\[\s*(\d+|[\u0660-\u0669]+)\s*\]', text))
    if fn_matches > 0:
        text = re.sub(r'\[\s*(\d+|[\u0660-\u0669]+)\s*\]', r'[\1]', text)
        text = re.sub(r'\(\s*(\d+|[\u0660-\u0669]+)\s*\)', r'(\1)', text)
        stats["footnote_format"] += fn_matches
        
    # مسافة بعد رقم الحاشية في بداية السطر: [1]أخرجه -> [1] أخرجه
    text = re.sub(r'(^|\n)(\[\d+\]|\[[\u0660-\u0669]+\])([^\s\d])', r'\1\2 \3', text)
    
    # 8. تقليص المسافات المتتالية داخل السطر الواحد
    lines_cleaned = []
    for line in text.splitlines():
        if "  " in line:
            stats["double_spaces"] += 1
            leading = len(line) - len(line.lstrip(' '))
            line = (' ' * leading) + re.sub(r'[ ]{2,}', ' ', line.lstrip(' '))
        lines_cleaned.append(line)
    text = "\n".join(lines_cleaned)
    
    # 9. إصلاح وسوم الخط العريض (Bold **) غير المتوازنة في أسطر الفقرات العادية (مع استثناء أبيات الشعر ***)
    lines_bold = []
    for line in text.splitlines():
        if " *** " not in line and line.count("**") % 2 != 0:
            line = line + "**"
            stats["unclosed_bold"] += 1
        lines_bold.append(line)
    text = "\n".join(lines_bold)
    
    return text, stats

def process_volume(vol_info: Dict[str, Any]):
    vol_name = vol_info["name"]
    docx_path = vol_info["docx"]
    md_path = vol_info["md"]
    
    cache_dir = Path(".ocr_cache") / vol_name
    if not cache_dir.exists():
        print(f"[تخطي] مجلد الكاش غير موجود: {cache_dir}")
        return
        
    files = sorted(
        cache_dir.glob("page_*.json"),
        key=lambda x: int(x.stem.split("_")[1])
    )
    
    print(f"\n=======================================================")
    print(f" 🔍 بدء المراجعة والتدقيق الشامل: {vol_name} ({len(files)} صفحة)")
    print(f"=======================================================")
    
    total_stats = {
        "pages_modified": 0,
        "broken_la": 0,
        "floating_harakat": 0,
        "space_before_punct": 0,
        "space_inside_brackets": 0,
        "space_after_punct": 0,
        "english_punct": 0,
        "double_spaces": 0,
        "unclosed_bold": 0,
        "footnote_format": 0
    }
    
    pages_text: Dict[int, str] = {}
    
    for f in files:
        p_num = int(f.stem.split("_")[1])
        try:
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                txt = data.get("text", "")
        except Exception as e:
            print(f"  [خطأ قراءة صفحة {p_num}]: {e}")
            continue
            
        cleaned_txt, stats = clean_arabic_typography(txt)
        pages_text[p_num] = cleaned_txt
        
        changed = False
        for k, v in stats.items():
            if v > 0:
                total_stats[k] += v
                changed = True
                
        if changed or cleaned_txt != txt:
            total_stats["pages_modified"] += 1
            data["text"] = cleaned_txt
            with open(f, "w", encoding="utf-8") as jf:
                json.dump(data, jf, ensure_ascii=False, indent=2)
                
    print(f"  ✅ تم تدقيق جميع الصفحات.")
    print(f"  • الصفحات التي تم تنقيحها: {total_stats['pages_modified']} من {len(files)} صفحة.")
    print(f"  • تصحيح مسافات علامات الترقيم (قبلها وبعدها): {total_stats['space_before_punct'] + total_stats['space_after_punct']} موضع.")
    print(f"  • إزالة المسافات الزائدة داخل الأقواس وعلامات التنصيص: {total_stats['space_inside_brackets']} موضع.")
    print(f"  • تصحيح علامات الترقيم الإنجليزية إلى عربية: {total_stats['english_punct']} موضع.")
    print(f"  • إزالة المسافات المزدوجة والمكررة: {total_stats['double_spaces']} موضع.")
    print(f"  • إصلاح حركات التشكيل وحروف 'لا': {total_stats['floating_harakat'] + total_stats['broken_la']} موضع.")
    print(f"  • إصلاح وسوم الخط العريض (Bold): {total_stats['unclosed_bold']} موضع.")
    
    print(f"\n  🔨 جاري إعادة بناء وتصدير مستند Word النهائي المنقح...")
    builder = ArabicWordDocumentBuilder(font_name="Traditional Arabic")
    
    for p_num in sorted(pages_text.keys()):
        builder.add_page_separator(p_num)
        builder.add_formatted_content(pages_text[p_num], p_num)
        
    builder.save(docx_path)
    
    print(f"  📝 جاري تحديث ملف Markdown...")
    docx_to_markdown(docx_path, md_path)
    print(f"  🎉 تم الانتهاء بنجاح من {vol_name}!\n")

def main():
    print("================================================================")
    print("   بدء عملية المراجعة الشاملة وتصحيح الأخطاء المطبعية والتنسيقية   ")
    print("================================================================")
    
    for vol in VOLUMES:
        process_volume(vol)
        
    print("================================================================")
    print("   🏆 اكتملت المراجعة والتنقيح وإعادة بناء كافة المستندات بنجاح!   ")
    print("================================================================")

if __name__ == "__main__":
    main()
