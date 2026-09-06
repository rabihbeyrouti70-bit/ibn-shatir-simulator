#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
واجهة رسومية حديثة ومتقدمة لتحويل كتب ومستندات ومخطوطات PDF العربية إلى Word بالذكاء الاصطناعي
"""

import warnings
warnings.filterwarnings("ignore")
warnings.filterwarnings("ignore", category=UserWarning)
warnings.filterwarnings("ignore", module="google.genai")

import os
import sys
import threading
import subprocess
from pathlib import Path
import tkinter as tk
from tkinter import filedialog, messagebox
import customtkinter as ctk

from ai_pdf_to_word import (
    PDFToWordConverter,
    ArabicWordDocumentBuilder,
    rebuild_docx_from_cache,
    docx_to_markdown,
    load_env_file
)

# إعداد مظهر الواجهة
ctk.set_appearance_mode("Dark")
ctk.set_default_color_theme("blue")

GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
    "gemini-1.5-pro",
    "gemini-1.5-flash"
]
OPENAI_MODELS = ["gpt-4o", "gpt-4o-mini"]


class App(ctk.CTk):
    def __init__(self):
        super().__init__()

        self.title("محول كتب ومخطوطات PDF إلى Word بالذكاء الاصطناعي البصري (AI OCR)")
        self.geometry("900x780")
        self.minsize(840, 700)

        # تحميل مفتاح API إن وجد في البيئة
        load_env_file()
        default_api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY") or ""
        
        # البحث عن أول ملف PDF تلقائياً
        default_pdf = ""
        import glob
        pdfs = glob.glob("*.pdf")
        if pdfs:
            default_pdf = os.path.abspath(pdfs[0])

        self._create_widgets(default_pdf, default_api_key)
        self._update_cache_status()

    def _create_widgets(self, default_pdf: str, default_api_key: str):
        # 1. ترويسة العنوان الرئيسي
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(fill="x", padx=20, pady=(12, 6))

        title_label = ctk.CTkLabel(
            header_frame,
            text="📖 محول PDF والمخطوطات العربية إلى مستند Word فائق الدقة (AI Vision OCR)",
            font=ctk.CTkFont(size=18, weight="bold")
        )
        title_label.pack(anchor="center")

        subtitle = ctk.CTkLabel(
            header_frame,
            text="يدعم قراءة التشكيل، المتن والشرح، الحواشي السفلية، وتحقيق المخطوطات والطرر اليدوية بدقة 100%",
            font=ctk.CTkFont(size=12),
            text_color="gray"
        )
        subtitle.pack(anchor="center", pady=(2, 0))

        # 2. إطار الإعدادات والمدخلات
        form_frame = ctk.CTkFrame(self)
        form_frame.pack(fill="x", padx=20, pady=6)

        # أ. اختيار ملف PDF
        lbl_pdf = ctk.CTkLabel(form_frame, text="ملف PDF المراد تحويله:", font=ctk.CTkFont(weight="bold"))
        lbl_pdf.grid(row=0, column=0, padx=12, pady=(10, 4), sticky="w")

        pdf_subframe = ctk.CTkFrame(form_frame, fg_color="transparent")
        pdf_subframe.grid(row=1, column=0, columnspan=2, padx=12, pady=(0, 8), sticky="ew")

        self.pdf_entry = ctk.CTkEntry(pdf_subframe, placeholder_text="اختر مسار ملف PDF...")
        self.pdf_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))
        if default_pdf:
            self.pdf_entry.insert(0, default_pdf)

        btn_browse = ctk.CTkButton(pdf_subframe, text="استعراض...", width=100, command=self._browse_pdf)
        btn_browse.pack(side="right")

        # ب. نمط المعالجة والمجال التراثي
        mode_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        mode_frame.grid(row=2, column=0, columnspan=2, padx=12, pady=(0, 8), sticky="ew")

        lbl_mode = ctk.CTkLabel(mode_frame, text="نوع الوثيقة:", font=ctk.CTkFont(weight="bold"))
        lbl_mode.pack(side="left", padx=(0, 6))

        self.mode_var = ctk.StringVar(value="printed")
        self.rb_printed = ctk.CTkRadioButton(
            mode_frame,
            text="📖 مطبوعات",
            variable=self.mode_var,
            value="printed",
            command=self._on_mode_change
        )
        self.rb_printed.pack(side="left", padx=(0, 10))

        self.rb_manuscript = ctk.CTkRadioButton(
            mode_frame,
            text="📜 مخطوطات قديمة",
            variable=self.mode_var,
            value="manuscript",
            command=self._on_mode_change
        )
        self.rb_manuscript.pack(side="left", padx=(0, 15))

        lbl_domain = ctk.CTkLabel(mode_frame, text="المجال التراثي:", font=ctk.CTkFont(weight="bold"))
        lbl_domain.pack(side="left", padx=(0, 6))

        self.domain_var = ctk.StringVar(value="auto (كشف تلقائي)")
        self.domain_combo = ctk.CTkComboBox(
            mode_frame,
            values=[
                "auto (كشف تلقائي)",
                "medicine (طب وصيدلة)",
                "astronomy (فلك ورياضيات)",
                "islamic_studies (فقه وحديث)",
                "language (لغة ومعاجم)",
                "general (عام)"
            ],
            variable=self.domain_var,
            width=180
        )
        self.domain_combo.pack(side="left")

        # ج. مزود الذكاء الاصطناعي واختيار النموذج
        ai_cfg_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        ai_cfg_frame.grid(row=3, column=0, columnspan=2, padx=12, pady=(0, 6), sticky="ew")

        lbl_prov = ctk.CTkLabel(ai_cfg_frame, text="المزود:", font=ctk.CTkFont(weight="bold"))
        lbl_prov.pack(side="left", padx=(0, 6))

        self.provider_var = ctk.StringVar(value="gemini")
        self.provider_combo = ctk.CTkComboBox(
            ai_cfg_frame,
            values=["gemini", "openai"],
            variable=self.provider_var,
            width=110,
            command=self._on_provider_change
        )
        self.provider_combo.pack(side="left", padx=(0, 15))

        lbl_model = ctk.CTkLabel(ai_cfg_frame, text="النموذج:", font=ctk.CTkFont(weight="bold"))
        lbl_model.pack(side="left", padx=(0, 6))

        self.model_var = ctk.StringVar(value="gemini-3.6-flash")
        self.model_combo = ctk.CTkComboBox(
            ai_cfg_frame,
            values=GEMINI_MODELS,
            variable=self.model_var,
            width=190
        )
        self.model_combo.pack(side="left", padx=(0, 15))

        # د. إدخال مفتاح API مع أزرار اللصق والإظهار والحفظ
        key_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        key_frame.grid(row=4, column=0, columnspan=2, padx=12, pady=(0, 8), sticky="ew")

        lbl_key = ctk.CTkLabel(key_frame, text="مفتاح API:", font=ctk.CTkFont(weight="bold"))
        lbl_key.pack(side="left", padx=(0, 8))

        self.key_entry = ctk.CTkEntry(key_frame, placeholder_text="أدخل أو الصق مفتاح API هنا (مثل AIzaSy...)", show="•")
        self.key_entry.pack(side="left", fill="x", expand=True, padx=(0, 6))
        if default_api_key:
            self.key_entry.insert(0, default_api_key)

        self.btn_paste_key = ctk.CTkButton(
            key_frame,
            text="📋 لصق",
            width=65,
            fg_color="#37474F",
            hover_color="#263238",
            command=self._paste_api_key
        )
        self.btn_paste_key.pack(side="left", padx=(0, 5))

        self.key_visible = False
        self.btn_toggle_key = ctk.CTkButton(
            key_frame,
            text="👁️ إظهار",
            width=65,
            fg_color="#37474F",
            hover_color="#263238",
            command=self._toggle_key_visibility
        )
        self.btn_toggle_key.pack(side="left", padx=(0, 5))

        self.btn_save_key = ctk.CTkButton(
            key_frame,
            text="💾 حفظ المفتاح",
            width=90,
            fg_color="#00695C",
            hover_color="#004D40",
            command=self._save_api_key_to_env
        )
        self.btn_save_key.pack(side="left")

        # هـ. خيارات النطاق والخط والمعالجة الصورية (OpenCV)
        opts_frame = ctk.CTkFrame(form_frame, fg_color="transparent")
        opts_frame.grid(row=5, column=0, columnspan=2, padx=12, pady=(0, 10), sticky="ew")

        lbl_start = ctk.CTkLabel(opts_frame, text="من صفحة:")
        lbl_start.pack(side="left", padx=(0, 4))
        self.start_entry = ctk.CTkEntry(opts_frame, width=65)
        self.start_entry.insert(0, "1")
        self.start_entry.pack(side="left", padx=(0, 10))

        lbl_end = ctk.CTkLabel(opts_frame, text="إلى:")
        lbl_end.pack(side="left", padx=(0, 4))
        self.end_entry = ctk.CTkEntry(opts_frame, width=65, placeholder_text="النهاية")
        self.end_entry.pack(side="left", padx=(0, 15))

        lbl_font = ctk.CTkLabel(opts_frame, text="الخط:")
        lbl_font.pack(side="left", padx=(0, 4))
        self.font_var = ctk.StringVar(value="Traditional Arabic")
        self.font_combo = ctk.CTkComboBox(
            opts_frame,
            values=["Traditional Arabic", "Amiri", "Sakkal Majalla", "Simplified Arabic", "Arial"],
            variable=self.font_var,
            width=150
        )
        self.font_combo.pack(side="left", padx=(0, 15))

        self.deskew_var = ctk.BooleanVar(value=True)
        self.chk_deskew = ctk.CTkCheckBox(opts_frame, text="📐 تعديل الميلان", variable=self.deskew_var)
        self.chk_deskew.pack(side="left", padx=(0, 10))

        self.contrast_var = ctk.BooleanVar(value=True)
        self.chk_contrast = ctk.CTkCheckBox(opts_frame, text="✨ تحسين التباين (CLAHE)", variable=self.contrast_var)
        self.chk_contrast.pack(side="left")

        form_frame.columnconfigure(0, weight=1)

        # 3. شريط أزرار العمليات والتجميع الفوري
        action_frame = ctk.CTkFrame(self, fg_color="transparent")
        action_frame.pack(fill="x", padx=20, pady=4)

        self.btn_start = ctk.CTkButton(
            action_frame,
            text="🚀 بدء التحويل بالذكاء الاصطناعي",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=40,
            fg_color="#2E7D32",
            hover_color="#1B5E20",
            command=self._start_conversion_thread
        )
        self.btn_start.pack(side="left", fill="x", expand=True, padx=(0, 6))

        self.btn_rebuild = ctk.CTkButton(
            action_frame,
            text="⚡ تجميع Word و MD من الكاش",
            font=ctk.CTkFont(size=12, weight="bold"),
            height=40,
            fg_color="#1565C0",
            hover_color="#0D47A1",
            command=self._rebuild_from_cache
        )
        self.btn_rebuild.pack(side="left", padx=(0, 6))

        self.btn_to_md = ctk.CTkButton(
            action_frame,
            text="📝 تحويل Word إلى MD",
            font=ctk.CTkFont(size=12, weight="bold"),
            height=40,
            fg_color="#6A1B9A",
            hover_color="#4A148C",
            command=self._convert_word_to_md
        )
        self.btn_to_md.pack(side="left", padx=(0, 6))

        self.btn_open_folder = ctk.CTkButton(
            action_frame,
            text="📂 فتح المجلد",
            height=40,
            width=95,
            command=self._open_output_folder
        )
        self.btn_open_folder.pack(side="right")

        # 4. شريط التقدم وحالة الكاش
        status_bar_frame = ctk.CTkFrame(self, fg_color="transparent")
        status_bar_frame.pack(fill="x", padx=20, pady=(6, 2))

        self.progress_bar = ctk.CTkProgressBar(status_bar_frame)
        self.progress_bar.pack(side="left", fill="x", expand=True, padx=(0, 10))
        self.progress_bar.set(0)

        self.lbl_cache_info = ctk.CTkLabel(status_bar_frame, text="حالة الكاش: 0 صفحة", font=ctk.CTkFont(size=11), text_color="#A0A0A0")
        self.lbl_cache_info.pack(side="right")

        # 5. صندوق السجلات
        log_frame = ctk.CTkFrame(self)
        log_frame.pack(fill="both", expand=True, padx=20, pady=(4, 12))

        lbl_logs = ctk.CTkLabel(log_frame, text="سجل العمليات والمخرجات:", font=ctk.CTkFont(weight="bold"))
        lbl_logs.pack(anchor="w", padx=10, pady=(4, 2))

        self.log_text = ctk.CTkTextbox(log_frame, font=ctk.CTkFont(family="Consolas", size=12))
        self.log_text.pack(fill="both", expand=True, padx=10, pady=(0, 8))

        # ربط قوائم الزر الأيمن واختصارات اللصق والتحديد على جميع حقول الإدخال
        for w in [self.pdf_entry, self.key_entry, self.start_entry, self.end_entry, self.log_text]:
            self._attach_context_menu(w)

    def _attach_context_menu(self, widget):
        """إضافة قائمة زر الفأرة الأيمن (قص، نسخ، لصق، تحديد الكل) ودعم لوحة المفاتيح العربية والإنجليزية."""
        menu = tk.Menu(self, tearoff=0)
        
        def do_cut():
            try:
                if hasattr(widget, "selection_get") and widget.selection_get():
                    self.clipboard_clear()
                    self.clipboard_append(widget.selection_get())
                    widget.delete("sel.first", "sel.last")
            except Exception:
                pass
            return "break"
                
        def do_copy():
            try:
                if hasattr(widget, "selection_get") and widget.selection_get():
                    self.clipboard_clear()
                    self.clipboard_append(widget.selection_get())
            except Exception:
                pass
            return "break"
                
        def do_paste():
            try:
                clip = self.clipboard_get()
                if isinstance(widget, ctk.CTkEntry):
                    widget.insert("insert", clip)
                elif isinstance(widget, ctk.CTkTextbox):
                    widget.insert("insert", clip)
            except Exception:
                pass
            return "break"
                
        def do_select_all():
            try:
                if isinstance(widget, ctk.CTkEntry):
                    widget.select_range(0, "end")
                    widget.icursor("end")
                elif isinstance(widget, ctk.CTkTextbox):
                    widget.tag_add("sel", "1.0", "end")
            except Exception:
                pass
            return "break"

        menu.add_command(label="قص (Cut)", command=do_cut)
        menu.add_command(label="نسخ (Copy)", command=do_copy)
        menu.add_command(label="لصق (Paste)", command=do_paste)
        menu.add_separator()
        menu.add_command(label="تحديد الكل (Select All)", command=do_select_all)

        def popup(event):
            try:
                menu.tk_popup(event.x_root, event.y_root)
            finally:
                menu.grab_release()

        widget.bind("<Button-3>", popup)
        
        # ربط مباشر على الـ widget الداخلي (Tkinter Entry أو Text)
        target_internal = getattr(widget, "_entry", None) or getattr(widget, "_textbox", None) or widget
        target_internal.bind("<Button-3>", popup)
        
        def on_ctrl_key(event):
            # keycode مستقل تماماً عن لغة لوحة المفاتيح في ويندوز:
            # 86 = V (لصق), 67 = C (نسخ), 88 = X (قص), 65 = A (تحديد الكل)
            if event.keycode == 86:
                return do_paste()
            elif event.keycode == 67:
                return do_copy()
            elif event.keycode == 88:
                return do_cut()
            elif event.keycode == 65:
                return do_select_all()
                
        target_internal.bind("<Control-KeyPress>", on_ctrl_key)

    def _paste_api_key(self):
        """لصق مفتاح API مباشرة من الحافظة في خانة الإدخال."""
        try:
            clip = self.clipboard_get().strip()
            if clip:
                self.key_entry.delete(0, "end")
                self.key_entry.insert(0, clip)
                self._log("✓ تم لصق مفتاح API من الحافظة بنجاح.")
            else:
                messagebox.showwarning("الحافظة فارغة", "لا يوجد نص في الحافظة للصقه.")
        except Exception as e:
            messagebox.showerror("خطأ في اللصق", f"تعذر قراءة الحافظة: {e}")

    def _toggle_key_visibility(self):
        """إظهار أو إخفاء نص مفتاح API."""
        if self.key_visible:
            self.key_entry.configure(show="•")
            self.btn_toggle_key.configure(text="👁️ إظهار")
            self.key_visible = False
        else:
            self.key_entry.configure(show="")
            self.btn_toggle_key.configure(text="🔒 إخفاء")
            self.key_visible = True

    def _save_api_key_to_env(self):
        """حفظ مفتاح API في ملف .env ليتم تذكره واستخدامه تلقائياً دائماً."""
        key = self.key_entry.get().strip()
        if not key:
            messagebox.showwarning("تنبيه", "يرجى إدخال أو لصق مفتاح API أولاً قبل الحفظ.")
            return
        
        provider = self.provider_var.get()
        var_name = "GEMINI_API_KEY" if provider == "gemini" else "OPENAI_API_KEY"
        
        env_file = Path(".env")
        lines = []
        if env_file.exists():
            with open(env_file, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.startswith(f"{var_name}=") and not line.startswith("GOOGLE_API_KEY="):
                        lines.append(line)
                        
        lines.append(f"{var_name}={key}\n")
        with open(env_file, "w", encoding="utf-8") as f:
            f.writelines(lines)
            
        os.environ[var_name] = key
        self._log(f"💾 تم حفظ مفتاح {provider.upper()} بنجاح في ملف .env وسيتم تذكره دائماً.")
        messagebox.showinfo("تم الحفظ", f"تم حفظ المفتاح بنجاح في ملف .env!\nلن تحتاج لإدخاله مرة أخرى عند فتح البرنامج.")

    def _on_mode_change(self):
        mode = self.mode_var.get()
        if mode == "manuscript":
            self.model_var.set("gemini-3.6-flash")
            self._log("[تغيير النمط]: تم اختيار نمط المخطوطات التراثية (gemini-3.6-flash أو gemini-2.5-pro).")
        else:
            self.model_var.set("gemini-3.6-flash")
            self._log("[تغيير النمط]: تم اختيار نمط الكتب والمطبوعات المحققة.")

    def _on_provider_change(self, choice: str):
        if choice == "gemini":
            self.model_combo.configure(values=GEMINI_MODELS)
            self.model_var.set("gemini-3.6-flash")
        else:
            self.model_combo.configure(values=OPENAI_MODELS)
            self.model_var.set("gpt-4o")

    def _browse_pdf(self):
        filename = filedialog.askopenfilename(
            title="اختر ملف PDF",
            filetypes=[("PDF files", "*.pdf"), ("All files", "*.*")]
        )
        if filename:
            self.pdf_entry.delete(0, "end")
            self.pdf_entry.insert(0, filename)
            self._update_cache_status()

    def _update_cache_status(self):
        pdf_path = self.pdf_entry.get().strip()
        if pdf_path and os.path.exists(pdf_path):
            import glob
            p = Path(pdf_path)
            cache_dir = p.parent / ".ocr_cache" / p.stem
            cached_files = glob.glob(str(cache_dir / "page_*.json"))
            count = len(cached_files)
            self.lbl_cache_info.configure(text=f"حالة الكاش: {count} صفحة محفوظة جاهزة")
        else:
            self.lbl_cache_info.configure(text="حالة الكاش: 0 صفحة")

    def _log(self, message: str):
        self.log_text.insert("end", message + "\n")
        self.log_text.see("end")

    def _open_output_folder(self):
        pdf_path = self.pdf_entry.get().strip()
        if pdf_path and os.path.exists(pdf_path):
            folder = os.path.dirname(os.path.abspath(pdf_path))
            subprocess.Popen(f'explorer "{folder}"')
        else:
            folder = os.path.abspath(".")
            subprocess.Popen(f'explorer "{folder}"')

    def _rebuild_from_cache(self):
        pdf_path = self.pdf_entry.get().strip()
        if not pdf_path or not os.path.exists(pdf_path):
            messagebox.showerror("خطأ", "يرجى تحديد مسار ملف PDF أولاً لمعرفة مجلد الكاش.")
            return

        p = Path(pdf_path)
        cache_dir = str(p.parent / ".ocr_cache" / p.stem)
        output_docx = str(p.with_suffix(".docx"))
        font_name = self.font_var.get()
        domain = self.domain_var.get().split()[0]

        try:
            self._log(f"\n--- بدء إعادة بناء مستند Word و Markdown من الكاش ({cache_dir}) [مجال: {domain}] ---")
            count = rebuild_docx_from_cache(cache_dir, output_docx, font_name=font_name, export_md=True, domain=domain)
            out_md = str(Path(output_docx).with_suffix(".md"))
            self._log(f"🎉 تم بنجاح بناء وتنسيق {count} صفحة وحفظ الملفات في:\n- Word: {output_docx}\n- Markdown: {out_md}")
            self.progress_bar.set(1.0)
            self._update_cache_status()
            messagebox.showinfo("تم التجميع بنجاح", f"تم إنشاء مستندي Word و Markdown فوراً من الكاش لعدد {count} صفحة!\nالمسار: {output_docx}")
        except Exception as e:
            self._log(f"✗ خطأ أثناء التجميع: {e}")
            messagebox.showerror("خطأ", str(e))

    def _convert_word_to_md(self):
        """تحويل مستند Word (.docx) إلى ملف Markdown (.md)."""
        pdf_path = self.pdf_entry.get().strip()
        docx_path = ""
        
        if pdf_path:
            p_docx = Path(pdf_path).with_suffix(".docx")
            if p_docx.exists():
                docx_path = str(p_docx)
                
        if not docx_path or not os.path.exists(docx_path):
            docx_path = filedialog.askopenfilename(
                title="اختر مستند Word (.docx) المراد تحويله إلى Markdown",
                filetypes=[("Word documents", "*.docx"), ("All files", "*.*")]
            )
            
        if not docx_path:
            return
            
        try:
            self._log(f"\n--- جاري تحويل مستند Word إلى Markdown: {docx_path} ---")
            out_md = str(Path(docx_path).with_suffix(".md"))
            docx_to_markdown(docx_path, out_md)
            self._log(f"🎉 تم تحويل المستند بنجاح إلى Markdown:\n{out_md}")
            messagebox.showinfo("تم التحويل إلى Markdown", f"تم إنشاء ملف Markdown بنجاح!\nالمسار: {out_md}")
        except Exception as e:
            self._log(f"✗ خطأ أثناء التحويل إلى Markdown: {e}")
            messagebox.showerror("خطأ", str(e))

    def _start_conversion_thread(self):
        pdf_path = self.pdf_entry.get().strip()
        api_key = self.key_entry.get().strip()
        provider = self.provider_var.get()
        model_name = self.model_var.get()
        font_name = self.font_var.get()
        mode = self.mode_var.get()
        domain = self.domain_var.get().split()[0]
        deskew = self.deskew_var.get()
        contrast = self.contrast_var.get()

        if not pdf_path or not os.path.exists(pdf_path):
            messagebox.showerror("خطأ", "يرجى تحديد مسار ملف PDF صالح.")
            return

        if not api_key:
            messagebox.showerror(
                "مفتاح API مطلوب",
                "يرجى إدخال مفتاح Gemini API المجاني أو OpenAI API للبدء في المعالجة."
            )
            return

        start_page = int(self.start_entry.get().strip() or "1")
        end_page_str = self.end_entry.get().strip()
        end_page = int(end_page_str) if end_page_str else None

        self.btn_start.configure(state="disabled", text="⏳ جاري التحويل بالذكاء الاصطناعي...")
        self.progress_bar.set(0)

        thread = threading.Thread(
            target=self._run_conversion,
            args=(pdf_path, api_key, provider, model_name, font_name, mode, domain, deskew, contrast, start_page, end_page),
            daemon=True
        )
        thread.start()

    def _run_conversion(self, pdf_path, api_key, provider, model_name, font_name, mode, domain, deskew, contrast, start_page, end_page):
        try:
            mode_desc = "المخطوطات التراثية" if mode == "manuscript" else "الكتب المطبوعة"
            self._log(f"--- بدء التحويل بالذكاء الاصطناعي [{mode_desc}] ({provider.upper()} - {model_name}) ---")
            self._log(f"الملف: {pdf_path}")
            self._log(f"المجال التراثي: {domain} | خيارات OpenCV: تعديل الميلان={deskew} | تحسين التباين={contrast}")
            
            output_docx = str(Path(pdf_path).with_suffix(".docx"))
            converter = PDFToWordConverter(
                pdf_path=pdf_path,
                output_docx_path=output_docx,
                provider=provider,
                api_key=api_key,
                model_name=model_name,
                mode=mode,
                domain=domain,
                font_name=font_name,
                enhance_contrast=contrast,
                deskew=deskew
            )

            total_pages = converter.total_pages
            actual_end = min(end_page or total_pages, total_pages)
            total_to_process = actual_end - start_page + 1

            self._log(f"إجمالي الصفحات المحددة: {total_to_process} صفحة (من {start_page} إلى {actual_end})")

            results = {}
            for idx, p_idx in enumerate(range(start_page - 1, actual_end)):
                page_num = p_idx + 1
                self._log(f"معالجة صفحة {page_num} من {actual_end}...")
                try:
                    text = converter.process_page(p_idx)
                    results[page_num] = text
                    self._log(f"✓ تم استخراج صفحة {page_num} بنجاح ({len(text)} حرف).")
                except Exception as e:
                    self._log(f"✗ خطأ في صفحة {page_num}: {e}")
                    results[page_num] = f"[تعذرت معالجة الصفحة {page_num} بسبب خطأ: {e}]"

                progress = (idx + 1) / total_to_process
                self.progress_bar.set(progress)

            self._log("جاري إنشاء وتنسيق مستندي Word و Markdown...")
            builder = ArabicWordDocumentBuilder(font_name=font_name)
            for page_num in sorted(results.keys()):
                builder.add_page_separator(page_num)
                builder.add_formatted_content(results[page_num], page_num)
                
            saved_docx = builder.save(output_docx)
            out_md = str(Path(saved_docx).with_suffix(".md"))
            docx_to_markdown(saved_docx, out_md)

            if saved_docx != output_docx:
                self._log(f"\n⚠️ تنبيه: الملف الأصلي مفتوح حالياً في Word. تم الحفظ باسم جديد:\n- Word: {saved_docx}\n- Markdown: {out_md}")
                messagebox.showinfo("تم الحفظ باسم بديل", f"نظراً لأن ملف Word الأصلي مفتوح حالياً في برنامج آخر، تم حفظ النسخة الجديدة باسم:\n{saved_docx}")
            else:
                self._log(f"\n🎉 تم التحويل بنجاح تام وتم حفظ الملفات في:\n- {saved_docx}\n- {out_md}")
                messagebox.showinfo("اكتمل التحويل", f"تم تحويل الصفحات بنجاح إلى Word و Markdown!\nالمسار: {saved_docx}")

            self.progress_bar.set(1.0)
            self._update_cache_status()

        except Exception as e:
            self._log(f"\n[خطأ عام]: {e}")
            messagebox.showerror("خطأ أثناء التحويل", str(e))
        finally:
            self.btn_start.configure(state="normal", text="🚀 بدء التحويل بالذكاء الاصطناعي")


if __name__ == "__main__":
    app = App()
    app.mainloop()

