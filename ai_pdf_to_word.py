#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
 محول كتب وملفات PDF والمخطوطات العربية إلى Word بالذكاء الاصطناعي البصري (AI Vision OCR)
 يدعم: Google Gemini (gemini-3.6-flash / gemini-2.5-flash / gemini-2.5-pro / gemini-1.5-pro)
       و OpenAI (gpt-4o / gpt-4o-mini)
 الميزات:
  - معالجة صور ذكية مسبقة عبر OpenCV (تعديل الميلان، تنقية بقع الورق، تعزيز تباين التشكيل)
  - نمطان للعمل: نمط الكتب المطبوعة ونمط المخطوطات والوثائق التراثية اليدوية
  - دقة فائقة في قراءة التشكيل، المتن والشرح، والطرر والحواشي الجانبية
  - نظام حفظ التقدم والاستئناف التلقائي وإعادة البناء الفوري دون إنترنت
  - توليد مستند Word (.docx) احترافي مع دعم كامل للاتجاه من اليمين لليسار (RTL)
=============================================================================
"""

import os
import sys
import json
import time
import argparse
import io
import re
import glob
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np
import pymupdf  # PyMuPDF
from PIL import Image
from tqdm import tqdm
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

import warnings
warnings.filterwarnings("ignore")
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", module="google.genai")

# إعداد الترميز للطباعة على الطرفية
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def load_env_file():
    """قراءة متغيرات البيئة من ملف .env تلقائياً إن وجد."""
    for env_path in [Path(".env"), Path(__file__).parent / ".env"]:
        if env_path.exists():
            try:
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            os.environ.setdefault(k.strip(), v.strip().strip("\"'"))
            except Exception:
                pass


load_env_file()

# =====================================================================
# استيراد محرك المعاجم والتصحيح التراثي
# =====================================================================
try:
    from manuscript_lexicon import ManuscriptDomainDictionary
except ImportError:
    ManuscriptDomainDictionary = None

# =====================================================================
# برومبتات الذكاء الاصطناعي المتخصصة (كتب مطبوعة ومخطوطات تراثية)
# =====================================================================

SYSTEM_PROMPT_PRINTED = """أنت محقق وخبير لغوي محترف متخصص في قراءة وتفريغ الكتب العربية والتراثية والإسلامية المطبوعة والمشكولة بدقة متناهية.
مهمتك تفريغ محتوى صفحة الكتاب بدقة 100% ودون أي تحريف أو إسقاط أو اختصار.

القواعد الصارمة للتفريغ:
1. **الدقة التامة والتشكيل:** انقل الكلمات بالحركات والتشكيل الدقيق كما في الأصل (الفتحة، الضمة، الكسرة، الشدة، التنوين، السكون).
2. **التمييز البصري بين المتن والشرح:**
   - النصوص الملونة بلون مغاير (أحمر/فوشي/غامق) والتي تمثل "المتن" أو عبارات مثل "قال المؤلف رحمه الله"، أحطها بنجمتين لتكون بخط عريض ومميز مثل: **قال المؤلف رحمه الله: كذا وكذا**.
   - ميز عناوين الأقسام مثل **الشرح** أو **المتن** أو **فصل** بوضعها بخط عريض ومستقل.
3. **الرموز والصلوات:** اكتب الرموز كاملة بدقة (مثل: ﷺ، ﷻ، رضي الله عنه، رحمه الله، عليه السلام).
4. **الآيات والأحاديث:** اكتب الآيات القرآنية بين قوسي المصحف ﴿ ﴾ والأحاديث النبوية بين « ».
5. **الهوامش والحواشي السفلية:** إذا كانت الصفحة تحتوي على خط فاصل وحواشٍ في الأسفل:
   - ضع سطراً فاصلاً يحتوي على: `---`
   - اكتب الحواشي مرقمة كما هي في الصفحة (مثال: `[1] أخرجه البيهقي في شعب الإيمان...`).
6. **الشعر والأبيات المنظومة:** إذا كان في الصفحة شعر، افصل بين الصدر والعجز بـ ` *** ` (مثال: صدر البيت *** عجز البيت).
7. **الترويسة وأرقام الصفحات:** لا تكرر ترويسة أعلى الصفحة العامة أو رقم الصفحة أسفلها، فقط فرغ المحتوى الفعلي.

أخرج النص فقط مقسماً إلى فقرات واضحة دون أي مقدمات أو شروحات منك."""

SYSTEM_PROMPT_MANUSCRIPT = """أنت عالم محقق باللغة العربية وعالم بالخطوط التراثية وعلم المخطوطات (Paleography & Codicology).
مهمتك قراءة وتفريغ لوحة المخطوطة اليدوية بدقة تحقيقية علمية متناهية مع استخراج بنيتها الكاملة.

القواعد الصارمة لتحقيق وتفريغ المخطوطة:
1. **هيكل اللوحة والصفحات المزدوجة:**
   - إذا كانت الصورة تحتوي على صفحتين متقابلتين (عارضة / Spread)، فرغ **الصفحة اليمنى أولاً** تحت عنوان `# [الصفحة اليمنى]`، ثم ضع فاصلاً `---` ثم **الصفحة اليسرى** تحت عنوان `# [الصفحة اليسرى]`.
2. **المداد الأحمر والعناوين:**
   - كل ما كُتب بالمداد الأحمر (مثل: أسماء الفصول، رؤوس الأبواب، أو كلمات مثل: الصداع، علاجه، علامته، قوله، مسألة، فصل، فرع) ميزه بوضعه بين نجمتين: **الكلمة المميزة**.
3. **المصطلحات التراثية والعلمية:**
   - اعتنِ بالرسم الصحيح للمصطلحات الطبية والأعراق (مثل: عرق القيفال بالقاف، عرق الباسليق، الأكحل، السكنجبين، الإيارج، الفلونيا، الأطريفل، السرسام، النطول، السعوط).
   - اعتنِ بالمصطلحات الفلكية (الخارج المركز، معدل المسير، فلك التدوير، الإقبال والإدبار، المنقلبين).
4. **الكلمات المشتبه بها والمطموسة:**
   - الكلمة التي بها طمس أو تشويه، ضع القراءة الأرجح سياقياً بين معقوفين مع علامة استفهام: `[الكلمة?]`، أو `[طمس بالأصل]`.
5. **الطرر والحواشي الجانبية والإلحاقات:**
   - استخرج جميع الحواشي والتعليقات المكتوبة في الهوامش أو بشكل قطري (مائل) وضعها بعد متن الصفحة مسبوقة بـ `[هامش: ...]` أو `[طرة: ...]`.
   - ما أُلحق فوق السطر من تصحيحات، أدرجه في موضعه مع وسمه بـ `[إلحاق: ...]`.
6. **الآيات والأحاديث والأشعار:**
   - الآيات بين ﴿ ﴾ والأحاديث بين « »، وفصل شطري الشعر بـ ` *** `.
7. **أرقام اللوحات (Foliation):**
   - أرقام اللوحات في المخطوطات المحققة ضعها بصيغتها: `[و ١ أ]` أو `[ظ ١ ب]`.

أخرج النص المحقق مباشرة مقسماً بدقة دون أي مقدمات أو اعتذارات منك."""

USER_PROMPT_PRINTED = "استخرج النص الكامل من هذه الصفحة بدقة فائقة وبجميع تفاصيل التشكيل وعلامات الترقيم والحواشي كما هو موضح في التعليمات."
USER_PROMPT_MANUSCRIPT = "حقق وفرغ النص المخطوط في هذه اللوحة بدقة علمية متناهية مع استخراج المتن والشروح والطرر وفق تعليمات التحقيق."

CANDIDATE_GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]


# =====================================================================
# وحدة المعالجة الصورية الذكية عبر OpenCV (Image Preprocessor)
# =====================================================================

class ImagePreprocessor:
    """معالجة مسبقة ذكية لصفحات الكتب والمخطوطات لتحسين دقة استخراج الذكاء الاصطناعي."""

    @staticmethod
    def deskew_image(image: np.ndarray) -> np.ndarray:
        """كشف وتصحيح زاوية ميلان الصفحة الممسوحة ضوئياً تلقائياً."""
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
            # تنقية مبدئية وحساب التدرج لاكتشاف سطور النص
            thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)[1]
            
            # تجميع الحروف لتكوين خطوط أفقية
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (30, 3))
            dilated = cv2.dilate(thresh, kernel, iterations=2)
            
            # العثور على جميع الكونتورات
            contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            angles = []
            
            for c in contours:
                if cv2.contourArea(c) < 500:
                    continue
                rect = cv2.minAreaRect(c)
                angle = rect[-1]
                if angle < -45:
                    angle = 90 + angle
                elif angle > 45:
                    angle = angle - 90
                # استبعاد الزوايا الشاذة
                if abs(angle) < 15:
                    angles.append(angle)
            
            if not angles:
                return image
                
            median_angle = float(np.median(angles))
            if abs(median_angle) < 0.3:  # إذا كان الميلان طفيفاً جداً لا داعي للتدوير
                return image
                
            h, w = image.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, median_angle, 1.0)
            rotated = cv2.warpAffine(
                image, M, (w, h),
                flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_CONSTANT,
                borderValue=(255, 255, 255)
            )
            return rotated
        except Exception:
            return image

    @staticmethod
    def enhance_printed(image: np.ndarray) -> np.ndarray:
        """تعزيز التباين وإبراز الحركات التشكيلية للكتب المطبوعة باستخدام CLAHE."""
        try:
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
                cl = clahe.apply(l)
                limg = cv2.merge((cl, a, b))
                enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)
                return enhanced
            else:
                clahe = cv2.createCLAHE(clipLimit=1.8, tileGridSize=(8, 8))
                return clahe.apply(image)
        except Exception:
            return image

    @staticmethod
    def enhance_manuscript(image: np.ndarray) -> np.ndarray:
        """معالجة خاصة للمخطوطات التراثية: تسوية الخلفية، عزل بقع الرطوبة، وزيادة حدة حبر الخط اليدوي."""
        try:
            if len(image.shape) == 3:
                lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                
                # تسوية الإضاءة بإزالة الخلفية غير المتجانسة
                kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35))
                background = cv2.morphologyEx(l, cv2.MORPH_DILATE, kernel)
                diff = cv2.absdiff(l, background)
                norm_l = cv2.normalize(255 - diff, None, 0, 255, cv2.NORM_MINMAX)
                
                clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
                enhanced_l = clahe.apply(norm_l)
                
                merged = cv2.merge((enhanced_l, a, b))
                result = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
                result = cv2.bilateralFilter(result, d=5, sigmaColor=35, sigmaSpace=35)
                return result
            else:
                clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
                return clahe.apply(image)
        except Exception:
            return image

    @classmethod
    def process_bytes(
        cls,
        image_bytes: bytes,
        mode: str = "printed",
        enhance_contrast: bool = True,
        deskew: bool = True
    ) -> bytes:
        """تنفيذ خط المعالجة الصورية الكامل على مصفوفة البايتات وإرجاع صورة PNG محسنة."""
        if not enhance_contrast and not deskew:
            return image_bytes

        try:
            np_arr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
            if img is None:
                return image_bytes

            if deskew:
                img = cls.deskew_image(img)

            if enhance_contrast:
                if mode == "manuscript":
                    img = cls.enhance_manuscript(img)
                else:
                    img = cls.enhance_printed(img)

            success, encoded_img = cv2.imencode(".png", img)
            if success:
                return encoded_img.tobytes()
        except Exception:
            pass

        return image_bytes


# =====================================================================
# فئة إدارة واستدعاء الذكاء الاصطناعي (AI OCR Engine)
# =====================================================================

class VisionOCREngine:
    def __init__(
        self,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        mode: str = "printed"
    ):
        self.provider = provider.lower()
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or os.environ.get("OPENAI_API_KEY")
        self.mode = mode.lower()  # 'printed' أو 'manuscript'
        
        if not self.api_key:
            raise ValueError(
                "لم يتم العثور على مفتاح API!\n"
                "يرجى إدخال مفتاح API في الواجهة أو في ملف .env"
            )
            
        self.system_prompt = SYSTEM_PROMPT_MANUSCRIPT if self.mode == "manuscript" else SYSTEM_PROMPT_PRINTED
        self.user_prompt = USER_PROMPT_MANUSCRIPT if self.mode == "manuscript" else USER_PROMPT_PRINTED

        if self.provider == "gemini":
            self.model_name = model_name or ("gemini-2.5-pro" if self.mode == "manuscript" else "gemini-3.8-flash")
            self.client = None
            self.legacy_genai = None
            
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception:
                try:
                    import google.generativeai as genai_legacy
                    genai_legacy.configure(api_key=self.api_key)
                    self.legacy_genai = genai_legacy
                except Exception as e:
                    raise RuntimeError(f"تعذر تهيئة مكتبة Gemini: {e}")

        elif self.provider == "openai":
            from openai import OpenAI
            self.client = OpenAI(api_key=self.api_key)
            self.model_name = model_name or "gpt-4o"
        else:
            raise ValueError(f"المزود غير مدعوم: {self.provider}")

    def _call_gemini_modern(self, image_bytes: bytes, model: str) -> str:
        from google.genai import types
        part = types.Part.from_bytes(data=image_bytes, mime_type="image/png")
        config = types.GenerateContentConfig(
            system_instruction=self.system_prompt,
            temperature=0.1 if self.mode == "printed" else 0.2,
        )
        response = self.client.models.generate_content(
            model=model,
            contents=[part, self.user_prompt],
            config=config
        )
        if response:
            if response.text and response.text.strip():
                return response.text.strip()
            if response.candidates and response.candidates[0].content:
                parts = response.candidates[0].content.parts
                if parts and parts[0].text and parts[0].text.strip():
                    return parts[0].text.strip()
            return "[صفحة خالية في الأصل]"
        raise RuntimeError("استجابة فارغة من النموذج")

    def _call_gemini_legacy(self, image_bytes: bytes, model: str) -> str:
        model_inst = self.legacy_genai.GenerativeModel(
            model_name=model,
            system_instruction=self.system_prompt,
            generation_config={"temperature": 0.1 if self.mode == "printed" else 0.2}
        )
        image = Image.open(io.BytesIO(image_bytes))
        response = model_inst.generate_content([image, self.user_prompt])
        if response and response.text:
            return response.text.strip()
        raise RuntimeError("استجابة فارغة من النموذج")

    def _call_openai(self, image_bytes: bytes, model: str) -> str:
        import base64
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        response = self.client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": self.user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{b64_img}"}
                        }
                    ]
                }
            ],
            temperature=0.1 if self.mode == "printed" else 0.2
        )
        return response.choices[0].message.content.strip()

    def process_image(self, image_bytes: bytes, max_retries: int = 4, retry_delay: float = 3.0) -> str:
        """إرسال الصورة إلى النموذج مع دعم التراجع التلقائي للنماذج وإعادة المحاولة الذكية."""
        active_model = self.model_name
        models_to_try = [active_model]
        if self.provider == "gemini":
            for m in CANDIDATE_GEMINI_MODELS:
                if m not in models_to_try:
                    models_to_try.append(m)

        for current_model in models_to_try:
            for attempt in range(1, max_retries + 1):
                try:
                    if self.provider == "gemini":
                        if self.client is not None:
                            res = self._call_gemini_modern(image_bytes, current_model)
                        else:
                            res = self._call_gemini_legacy(image_bytes, current_model)
                        self.model_name = current_model
                        return res

                    elif self.provider == "openai":
                        return self._call_openai(image_bytes, current_model)

                except Exception as e:
                    err_str = str(e)
                    if "404" in err_str or "not found" in err_str.lower() or "no longer available" in err_str.lower():
                        print(f"\n[ملاحظة] النموذج {current_model} غير متاح، جاري تجربة النموذج البديل...")
                        break

                    if "429" in err_str or "quota" in err_str.lower() or "resource exhausted" in err_str.lower():
                        wait_time = retry_delay * (2 ** (attempt - 1))
                        print(f"\n[تنبيه] تم بلوغ حد الطلبات، انتظار {wait_time:.1f} ثانية ({attempt}/{max_retries})...")
                        time.sleep(wait_time)
                    else:
                        if attempt == max_retries:
                            raise RuntimeError(f"فشلت معالجة الصفحة بالنموذج {current_model}: {e}")
                        time.sleep(retry_delay)

        raise RuntimeError(f"تعذرت معالجة الصفحة بجميع النماذج المتاحة.")


def normalize_arabic_brackets(text: str) -> str:
    """تصحيح وتطبيع اتجاه الأقواس وعلامات التنصيص العربية والقرآنية."""
    text = re.sub(r'﴾([^﴿﴾\n]+)﴿', r'﴿\1﴾', text)
    text = re.sub(r'»([^«»\n]+)«', r'«\1»', text)
    return text


# =====================================================================
# فئة بناء وتنسيق مستندات Word باحترافية (Advanced DOCX Builder)
# =====================================================================

class ArabicWordDocumentBuilder:
    def __init__(self, font_name: str = "Traditional Arabic", font_size: int = 16):
        self.doc = docx.Document()
        self.font_name = font_name
        self.font_size = font_size
        self._setup_document_styling()

    def _setup_document_styling(self):
        """تهيئة هوامش الصفحة واتجاه المستند لليمين لليسار (RTL)."""
        for section in self.doc.sections:
            section.top_margin = Inches(1.0)
            section.bottom_margin = Inches(1.0)
            section.left_margin = Inches(1.0)
            section.right_margin = Inches(1.0)
            
            sectPr = section._sectPr
            bidi = parse_xml(f'<w:bidi {nsdecls("w")}/>')
            sectPr.append(bidi)

        normal_style = self.doc.styles['Normal']
        normal_style.font.name = self.font_name
        normal_style.font.size = Pt(self.font_size)
        normal_style.font.color.rgb = RGBColor(0x11, 0x11, 0x11)
        
        rPr = normal_style.element.get_or_add_rPr()
        rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{self.font_name}" w:hAnsi="{self.font_name}" w:cs="{self.font_name}"/>')
        rPr.append(rFonts)

    def _set_paragraph_rtl(self, paragraph, align=WD_ALIGN_PARAGRAPH.RIGHT):
        """تعيين اتجاه الفقرة إلى RTL ومحاذاة اليمين."""
        paragraph.alignment = align
        pPr = paragraph._p.get_or_add_pPr()
        bidi = parse_xml(f'<w:bidi {nsdecls("w")}/>')
        pPr.append(bidi)

    def _apply_run_rtl(self, run):
        """تطبيق خاصية RTL والخط العربي على مستوى الـ Run لمنع انعكاس الأقواس."""
        rPr = run._r.get_or_add_rPr()
        rPr.append(parse_xml(f'<w:rtl {nsdecls("w")}/>'))
        rPr.append(parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{self.font_name}" w:hAnsi="{self.font_name}" w:cs="{self.font_name}"/>'))

    def add_title(self, text: str):
        """إضافة عنوان رئيسي منسق باللون الغامق والخط الكبير."""
        p = self.doc.add_paragraph()
        self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.CENTER)
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(10)
        
        run = p.add_run(text)
        self._apply_run_rtl(run)
        run.font.name = self.font_name
        run.font.size = Pt(self.font_size + 6)
        run.font.bold = True
        run.font.color.rgb = RGBColor(0x8B, 0x00, 0x4B)

    def add_page_separator(self, page_number: int):
        """إضافة فاصل صفحات أو علامة رقم الصفحة/اللوحة."""
        p = self.doc.add_paragraph()
        self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.CENTER)
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(8)
        run = p.add_run(f" ـــــ [ صفحة {page_number} ] ـــــ ")
        self._apply_run_rtl(run)
        run.font.name = self.font_name
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
        run.font.italic = True
                
    def _tokenize_line(self, line_str: str, in_footnotes: bool = False):
        """تحليل السطر واستخراج أجزاء المتن، الحواشي المرتفعة (Superscript)، والنص العادي."""
        tokens = []
        bold_pattern = re.compile(r'(\*\*.*?\*\*)')
        for b_part in bold_pattern.split(line_str):
            if not b_part:
                continue
            is_bold_wrap = b_part.startswith('**') and b_part.endswith('**') and len(b_part) >= 4
            inner_b = b_part[2:-2] if is_bold_wrap else b_part
            
            num_match = re.fullmatch(r'[\(\[]?[\u0660-\u06690-9]+[\)\]]?', inner_b.strip())
            if is_bold_wrap and num_match and not in_footnotes:
                tokens.append(('sup', inner_b.strip()))
                continue
                
            sup_pattern = re.compile(r'(<sup>.*?</sup>)')
            for s_part in sup_pattern.split(inner_b):
                if not s_part:
                    continue
                if s_part.startswith('<sup>') and s_part.endswith('</sup>'):
                    tokens.append(('sup', s_part[5:-6]))
                else:
                    bracket_match = re.compile(r'(\[.*?\])')
                    for br_part in bracket_match.split(s_part):
                        if not br_part:
                            continue
                        if br_part.startswith('[') and br_part.endswith(']'):
                            tokens.append(('manuscript_bracket', br_part))
                        else:
                            tokens.append(('bold' if is_bold_wrap else 'normal', br_part))
        return tokens

    def add_formatted_content(self, text: str, page_number: int):
        """تحليل النص المنظم وإضافته إلى المستند مع تمييز المتن والحواشي والـ Superscript."""
        text = normalize_arabic_brackets(text)
        lines = text.strip().split("\n")
        in_footnotes = False

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue

            if line_str.startswith("---") or line_str.startswith("___") or "الحاشية" in line_str or "الهوامش" in line_str:
                in_footnotes = True
                p = self.doc.add_paragraph()
                self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
                p.paragraph_format.space_before = Pt(10)
                p.paragraph_format.space_after = Pt(4)
                run = p.add_run("_____________________________________")
                self._apply_run_rtl(run)
                run.font.size = Pt(10)
                run.font.color.rgb = RGBColor(0x77, 0x77, 0x77)
                continue

            if line_str.startswith("#"):
                clean_title = line_str.lstrip("#").strip()
                self.add_title(clean_title)
                continue

            if line_str.startswith("[طرة:") or line_str.startswith("[هامش:"):
                p = self.doc.add_paragraph()
                self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.RIGHT)
                p.paragraph_format.left_indent = Inches(0.4)
                p.paragraph_format.right_indent = Inches(0.4)
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                
                run = p.add_run(line_str)
                self._apply_run_rtl(run)
                run.font.name = self.font_name
                run.font.size = Pt(self.font_size - 2)
                run.font.italic = True
                run.font.color.rgb = RGBColor(0x8A, 0x4B, 0x08)  # لون بني/عسلي تراثي للطرر
                continue
                
            if " *** " in line_str:
                p = self.doc.add_paragraph()
                self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.CENTER)
                p.paragraph_format.space_before = Pt(4)
                p.paragraph_format.space_after = Pt(4)
                
                parts_poem = line_str.split(" *** ")
                shatr1 = parts_poem[0].replace("**", "").strip()
                shatr2 = parts_poem[1].replace("**", "").strip()
                
                run1 = p.add_run(shatr1)
                self._apply_run_rtl(run1)
                run1.font.name = self.font_name
                run1.font.size = Pt(self.font_size)
                run1.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
                
                sep_run = p.add_run("   ...   ")
                self._apply_run_rtl(sep_run)
                sep_run.font.name = self.font_name
                sep_run.font.size = Pt(self.font_size - 2)
                sep_run.font.color.rgb = RGBColor(0x88, 0x88, 0x88)
                
                run2 = p.add_run(shatr2)
                self._apply_run_rtl(run2)
                run2.font.name = self.font_name
                run2.font.size = Pt(self.font_size)
                run2.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
                continue

            p = self.doc.add_paragraph()
            self._set_paragraph_rtl(p, WD_ALIGN_PARAGRAPH.JUSTIFY if not in_footnotes else WD_ALIGN_PARAGRAPH.RIGHT)
            
            if in_footnotes:
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.15
            else:
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                p.paragraph_format.line_spacing = 1.3

            tokens = self._tokenize_line(line_str, in_footnotes=in_footnotes)
            
            for t_type, t_text in tokens:
                if not t_text:
                    continue
                    
                run = p.add_run(t_text)
                self._apply_run_rtl(run)
                run.font.name = self.font_name
                
                if in_footnotes:
                    run.font.size = Pt(self.font_size - 3)
                    if t_text.strip().startswith(('[', '(')) and any(c.isdigit() or '\u0660' <= c <= '\u0669' for c in t_text):
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(0xD8, 0x1B, 0x60)
                    else:
                        run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
                else:
                    if t_type == 'sup':
                        run.font.size = Pt(self.font_size - 4)
                        run.font.superscript = True
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(0xD8, 0x1B, 0x60)
                    elif t_type == 'bold':
                        run.font.size = Pt(self.font_size)
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(0x99, 0x00, 0x4D)
                    elif t_type == 'manuscript_bracket':
                        run.font.size = Pt(self.font_size)
                        run.font.color.rgb = RGBColor(0x00, 0x66, 0x99)
    def save(self, output_path: str) -> str:
        """حفظ ملف Word مع معالجة ذكية في حال كان الملف مفتوحاً في برنامج Microsoft Word."""
        try:
            self.doc.save(output_path)
            print(f"\n[نجاح] تم حفظ مستند Word بنجاح في: {output_path}")
            return output_path
        except PermissionError:
            p = Path(output_path)
            counter = 1
            while True:
                alt_path = str(p.parent / f"{p.stem}_{counter}{p.suffix}")
                try:
                    self.doc.save(alt_path)
                    print(f"\n[تنبيه]: الملف الأصلي مفتوح في Word. تم الحفظ باسم بديل تلقائياً: {alt_path}")
                    return alt_path
                except PermissionError:
                    counter += 1
                    if counter > 50:
                        raise


def docx_to_markdown(docx_path: str, md_path: Optional[str] = None) -> str:
    """تحويل مستند Word (.docx) إلى ملف Markdown (.md) منسق باحترافية."""
    doc = docx.Document(docx_path)
    md_blocks = []
    
    for p in doc.paragraphs:
        if not p.text.strip():
            continue
            
        runs_text = []
        for r in p.runs:
            t = r.text
            if not t:
                continue
            if r.font.superscript:
                t = f"<sup>{t}</sup>"
            elif r.font.bold:
                t = f"**{t}**"
            elif r.font.italic:
                t = f"*{t}*"
            runs_text.append(t)
            
        line = "".join(runs_text).strip()
        if not line:
            continue
            
        line = re.sub(r'\*\*\*\*', '', line)
        line = normalize_arabic_brackets(line)
        
        # كشف فواصل الصفحات
        page_sep_match = re.search(r'ـــــ\s*\[\s*(?:صفحة|لوحة)\s*(\d+)\s*\]\s*ـــــ', line)
        if page_sep_match:
            p_num = page_sep_match.group(1)
            md_blocks.append(f"---\n### [صفحة {p_num}]")
            continue
            
        # كشف فواصل الهوامش
        if set(line.replace(' ', '')) <= {'_', '-'}:
            md_blocks.append("---\n**الهوامش والحواشي:**")
            continue
            
        # كشف العناوين
        if p.style and p.style.name.startswith('Heading 1'):
            line = f"# {line.replace('**', '')}"
        elif p.style and p.style.name.startswith('Heading 2'):
            line = f"## {line.replace('**', '')}"
        elif p.style and p.style.name.startswith('Heading 3'):
            line = f"### {line.replace('**', '')}"
            
        md_blocks.append(line)
        
    # معالجة الجداول إن وجدت
    for table in doc.tables:
        t_rows = []
        for i, row in enumerate(table.rows):
            cells = [cell.text.strip().replace('\n', ' ') for cell in row.cells]
            t_rows.append('| ' + ' | '.join(cells) + ' |')
            if i == 0:
                t_rows.append('| ' + ' | '.join(['---'] * len(cells)) + ' |')
        if t_rows:
            md_blocks.append('\n' + '\n'.join(t_rows) + '\n')
            
    content = "\n\n".join(md_blocks)
    content = re.sub(r'\n{3,}', '\n\n', content).strip()
    
    if not md_path:
        md_path = str(Path(docx_path).with_suffix(".md"))
        
    try:
        with open(md_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[نجاح] تم تحويل مستند Word إلى Markdown في: {md_path}")
    except PermissionError:
        p = Path(md_path)
        alt_md = str(p.parent / f"{p.stem}_1{p.suffix}")
        with open(alt_md, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"[تنبيه]: تم حفظ Markdown باسم بديل: {alt_md}")
        
    return content


def rebuild_docx_from_cache(
    cache_dir: str,
    output_docx_path: str,
    font_name: str = "Traditional Arabic",
    export_md: bool = True,
    domain: str = "auto"
) -> int:
    """إعادة بناء وتنسيق ملف Word فورياً من ملفات الكاش مع إمكانية تصدير Markdown وتطبيق المعاجم التراثية."""
    cache_path = Path(cache_dir)
    files = glob.glob(str(cache_path / "page_*.json"))
    
    if not files:
        raise FileNotFoundError(f"لم يتم العثور على أي صفحات محفوظة في مجلد الكاش: {cache_dir}")
        
    results: Dict[int, str] = {}
    for f in files:
        try:
            p_num = int(Path(f).stem.split("_")[1])
            with open(f, "r", encoding="utf-8") as jf:
                data = json.load(jf)
                text = data.get("text", "")
                # تطبيق التصحيح المعجمي التراثي
                if ManuscriptDomainDictionary is not None and data.get("mode") == "manuscript":
                    text, _ = ManuscriptDomainDictionary.correct_text(text, domain=domain)
                results[p_num] = text
        except Exception:
            pass
            
    builder = ArabicWordDocumentBuilder(font_name=font_name)
    for page_num in sorted(results.keys()):
        text = results[page_num]
        builder.add_page_separator(page_num)
        builder.add_formatted_content(text, page_num)
        
    builder.save(output_docx_path)
    
    if export_md:
        md_path = str(Path(output_docx_path).with_suffix(".md"))
        docx_to_markdown(output_docx_path, md_path)
        
    return len(results)


# =====================================================================
# المنظومة الرئيسية للتحويل (PDF Converter Pipeline)
# =====================================================================

class PDFToWordConverter:
    def __init__(
        self,
        pdf_path: str,
        output_docx_path: Optional[str] = None,
        provider: str = "gemini",
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        mode: str = "printed",
        domain: str = "auto",
        cache_dir: Optional[str] = None,
        dpi: int = 300,
        font_name: str = "Traditional Arabic",
        enhance_contrast: bool = True,
        deskew: bool = True
    ):
        self.pdf_path = Path(pdf_path)
        if not self.pdf_path.exists():
            raise FileNotFoundError(f"ملف PDF غير موجود: {pdf_path}")

        self.mode = mode.lower()
        self.domain = domain.lower()
        self.output_docx_path = output_docx_path or str(self.pdf_path.with_suffix(".docx"))
        self.cache_dir = Path(cache_dir or self.pdf_path.parent / ".ocr_cache" / self.pdf_path.stem)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.dpi = dpi
        self.font_name = font_name
        self.enhance_contrast = enhance_contrast
        self.deskew = deskew

        self.ocr_engine = VisionOCREngine(
            provider=provider,
            api_key=api_key,
            model_name=model_name,
            mode=self.mode
        )
        self.doc_pdf = pymupdf.open(str(self.pdf_path))
        self.total_pages = len(self.doc_pdf)

    def render_page_image(self, page_num: int) -> bytes:
        """تحويل صفحة الـ PDF إلى صورة عالية الوضوح بدقة ذكية متكيفة تمنع بطء أو تضخم ملفات المخطوطات."""
        page = self.doc_pdf[page_num]
        
        # مقياس ذكي متكيف (Smart Adaptive Clamping):
        # يضمن دقة وضوح فائقة لقراءة أصغر الحركات والخطوط اليدوية مع منع تجاوز الحجم الأقصى للذاكرة أو الـ API
        max_dim = 2500
        w = float(page.rect.width)
        h = float(page.rect.height)
        longest_side = max(w, h)
        
        if longest_side > 0:
            scale = min(self.dpi / 72.0, max_dim / longest_side)
        else:
            scale = self.dpi / 72.0
            
        pix = page.get_pixmap(matrix=pymupdf.Matrix(scale, scale))
        raw_bytes = pix.tobytes("png")
        
        processed_bytes = ImagePreprocessor.process_bytes(
            raw_bytes,
            mode=self.mode,
            enhance_contrast=self.enhance_contrast,
            deskew=self.deskew
        )
        return processed_bytes

    def process_page(self, page_index: int) -> str:
        """معالجة صفحة واحدة مع فحص التخزين المؤقت وتطبيق المعاجم التراثية."""
        cache_file = self.cache_dir / f"page_{page_index + 1}.json"
        
        if cache_file.exists():
            try:
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if "text" in data and data["text"].strip():
                        txt = data["text"]
                        if ManuscriptDomainDictionary is not None and self.mode == "manuscript":
                            txt, _ = ManuscriptDomainDictionary.correct_text(txt, domain=self.domain)
                        return txt
            except Exception:
                pass

        img_bytes = self.render_page_image(page_index)
        text = self.ocr_engine.process_image(img_bytes)

        # تطبيق التصحيح المعجمي التراثي البعدي
        if ManuscriptDomainDictionary is not None and self.mode == "manuscript":
            text, fixes = ManuscriptDomainDictionary.correct_text(text, domain=self.domain)
            if fixes:
                print(f"  [تصحيح معجمي صفحة {page_index + 1}]: تم ضبط {len(fixes)} مصطلحاً تراثياً.")

        with open(cache_file, "w", encoding="utf-8") as f:
            json.dump({"page": page_index + 1, "text": text, "mode": self.mode}, f, ensure_ascii=False, indent=2)

        return text

    def convert(self, start_page: int = 1, end_page: Optional[int] = None, delay_between_requests: float = 1.0):
        """تنفيذ عملية التحويل الكاملة لجميع الصفحات المحددة."""
        end_page = min(end_page or self.total_pages, self.total_pages)
        start_index = max(start_page - 1, 0)
        end_index = end_page

        pages_to_process = list(range(start_index, end_index))
        mode_title = "نمط المخطوطات التراثية والوثائق القديمة" if self.mode == "manuscript" else "نمط الكتب والمطبوعات المحققة"
        print(f"\n=======================================================")
        print(f" بدء معالجة: {self.pdf_path.name}")
        print(f" النمط المختار: {mode_title}")
        print(f" المجال التراثي: {self.domain.upper()}")
        print(f" عدد الصفحات المطلوب تحويلها: {len(pages_to_process)} (من صفحة {start_page} إلى {end_page})")
        print(f" محرك الذكاء الاصطناعي: {self.ocr_engine.provider.upper()} ({self.ocr_engine.model_name})")
        print(f" معالجة OpenCV: تحسين التباين={self.enhance_contrast} | تعديل الميلان={self.deskew}")
        print(f" مجلد الحفظ المؤقت (Cache): {self.cache_dir}")
        print(f"=======================================================\n")

        results: Dict[int, str] = {}

        pbar = tqdm(pages_to_process, desc="جاري التحويل بالذكاء الاصطناعي", unit="صفحة")
        for p_idx in pbar:
            page_num = p_idx + 1
            pbar.set_postfix_str(f"صفحة {page_num}")
            
            try:
                text = self.process_page(p_idx)
                results[page_num] = text
            except Exception as e:
                print(f"\n[خطأ في صفحة {page_num}]: {e}")
                results[page_num] = f"[تعذرت معالجة الصفحة {page_num} بسبب خطأ: {e}]"

            if delay_between_requests > 0:
                time.sleep(delay_between_requests)

        print("\nجاري بناء وتنسيق مستند Word (.docx)...")
        builder = ArabicWordDocumentBuilder(font_name=self.font_name)

        for page_num in sorted(results.keys()):
            text = results[page_num]
            builder.add_page_separator(page_num)
            builder.add_formatted_content(text, page_num)

        builder.save(self.output_docx_path)
        
        # تصدير ملف Markdown (.md) تلقائياً بجانب ملف Word
        md_path = str(Path(self.output_docx_path).with_suffix(".md"))
        docx_to_markdown(self.output_docx_path, md_path)
        
        print(f"اكتملت العملية بنجاح! 🎉\n")
        return self.output_docx_path


def main():
    parser = argparse.ArgumentParser(
        description="تحويل ملفات PDF والمخطوطات العربية إلى مستند Word و Markdown عالي الجودة بالذكاء الاصطناعي"
    )
    parser.add_argument("pdf_file", nargs="?", default="بغية الطالب لمعرفة العلم الديني الواجب.pdf", help="مسار ملف PDF أو Word المراد تحويله")
    parser.add_argument("--output", "-o", help="مسار ملف Word الناتج (.docx) أو Markdown (.md)")
    parser.add_argument("--provider", default="gemini", choices=["gemini", "openai"], help="مزود خدمة الذكاء الاصطناعي")
    parser.add_argument("--model", default="gemini-3.8-flash", help="اسم النموذج (مثل gemini-3.8-flash أو gemini-2.5-pro أو gpt-4o)")
    parser.add_argument("--mode", default="printed", choices=["printed", "manuscript"], help="نمط المعالجة: printed (كتب مطبوعة) أو manuscript (مخطوطات)")
    parser.add_argument("--domain", default="auto", choices=["auto", "medicine", "astronomy", "islamic_studies", "language", "general"], help="المجال التراثي للمخطوطة للتصحيح المعجمي")
    parser.add_argument("--api-key", help="مفتاح API الخاص بالخدمة")
    parser.add_argument("--font", default="Traditional Arabic", help="اسم الخط العربي المراد استخدامه")
    parser.add_argument("--start-page", type=int, default=1, help="رقم صفحة البداية (يبدأ من 1)")
    parser.add_argument("--end-page", type=int, help="رقم صفحة النهاية")
    parser.add_argument("--dpi", type=int, default=300, help="دقة تصيير الصور (DPI)")
    parser.add_argument("--delay", type=float, default=1.0, help="فترة الانتظار بين الطلبات بالثواني")
    parser.add_argument("--no-deskew", action="store_true", help="تعطيل تصحيح ميلان الصفحات")
    parser.add_argument("--no-contrast", action="store_true", help="تعطيل تعزيز التباين")
    parser.add_argument("--rebuild-cache", action="store_true", help="إعادة بناء ملف Word فوراً من الكاش دون طلبات إنترنت")
    parser.add_argument("--docx-to-md", action="store_true", help="تحويل ملف Word محدد مباشرة إلى صيغة Markdown (.md)")

    args = parser.parse_args()

    input_path = args.pdf_file
    
    # تحويل مباشر من Word إلى Markdown
    if args.docx_to_md or input_path.endswith(".docx"):
        out_md = args.output or str(Path(input_path).with_suffix(".md"))
        print(f"جاري تحويل مستند Word إلى Markdown: {input_path} -> {out_md} ...")
        docx_to_markdown(input_path, out_md)
        return

    if not os.path.exists(input_path):
        pdfs = glob.glob("*.pdf")
        if pdfs:
            input_path = pdfs[0]
        else:
            print(f"خطأ: لم يتم العثور على ملف PDF باسم '{args.pdf_file}' في المجلد الحالي.")
            sys.exit(1)

    if args.rebuild_cache:
        cache_dir = str(Path(input_path).parent / ".ocr_cache" / Path(input_path).stem)
        out_docx = args.output or str(Path(input_path).with_suffix(".docx"))
        print(f"جاري إعادة بناء ملف Word و Markdown من الكاش: {cache_dir} ...")
        count = rebuild_docx_from_cache(cache_dir, out_docx, font_name=args.font, export_md=True, domain=args.domain)
        print(f"تم بناء {out_docx} والنسخة {Path(out_docx).with_suffix('.md').name} بنجاح لعدد {count} صفحة!")
        return

    try:
        converter = PDFToWordConverter(
            pdf_path=input_path,
            output_docx_path=args.output,
            provider=args.provider,
            api_key=args.api_key,
            model_name=args.model,
            mode=args.mode,
            domain=args.domain,
            dpi=args.dpi,
            font_name=args.font,
            enhance_contrast=not args.no_contrast,
            deskew=not args.no_deskew
        )
        converter.convert(
            start_page=args.start_page,
            end_page=args.end_page,
            delay_between_requests=args.delay
        )
    except Exception as e:
        print(f"\n[خطأ]: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
