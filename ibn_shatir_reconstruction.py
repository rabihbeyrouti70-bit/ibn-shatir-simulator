#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
=============================================================================
 محرك إعادة بناء النماذج الفلكية الهندسية لابن الشاطر الدمشقي (ت 777هـ)
 (Ibn al-Shatir Planetary Models Digital Geometric Reconstruction Engine)
=============================================================================
"""

import os
import sys
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import arabic_reshaper

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def ar_text(text: str) -> str:
    """إعداد النص العربي للعرض في Matplotlib."""
    try:
        reshaper = arabic_reshaper.ArabicReshaper({'delete_harakat': False})
        return reshaper.reshape(text)
    except Exception:
        return text


class IbnShatirAstronomicalEngine:
    """حساب ورسم النماذج الفلكية الدقيقة لابن الشاطر وفق قواعد نهاية السول."""

    def __init__(self, output_dir: str = "مخططات_ابن_الشاطر_الهندسية"):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False

    def generate_sun_model(self, sample_angle_deg: float = 45.0, filename: str = "01_نموذج_الشمس_ابن_الشاطر.png"):
        R = 60.0
        r1 = 4.0 + 37.0 / 60.0  # 4.6167
        r2 = 2.0 + 30.0 / 60.0  # 2.5

        alphas = np.linspace(0, 2 * np.pi, 500)
        alpha_rad = math.radians(sample_angle_deg)
        
        Ox, Oy = 0.0, 0.0
        P3x = R * math.cos(alpha_rad)
        P3y = R * math.sin(alpha_rad)
        P4x = P3x + r1
        P4y = P3y
        Px = P4x - r2 * math.cos(2 * alpha_rad)
        Py = P4y - r2 * math.sin(2 * alpha_rad)

        fig, ax = plt.subplots(figsize=(11, 11), dpi=300)
        ax.set_facecolor("#FCFCF9")
        fig.patch.set_facecolor("#F7F5F0")

        # 1. الفلك الحامل
        deferent = patches.Circle((Ox, Oy), R, color="#1A365D", fill=False, lw=1.8, ls="--", label=ar_text("الفلك الحامل المتفق المركز (R=60)"))
        ax.add_patch(deferent)

        # 2. خط الأوج والحضيض
        ax.plot([-72, 72], [0, 0], color="#718096", lw=1.2, ls=":", label=ar_text("خط الأوج والحضيض (Line of Apsides)"))

        # 3. مدار الشمس الحقيقي الناتج
        orbit_pts_x = []
        orbit_pts_y = []
        for a in alphas:
            p3_x = R * math.cos(a)
            p3_y = R * math.sin(a)
            p4_x = p3_x + r1
            p4_y = p3_y
            px = p4_x - r2 * math.cos(2 * a)
            py = p4_y - r2 * math.sin(2 * a)
            orbit_pts_x.append(px)
            orbit_pts_y.append(py)

        ax.plot(orbit_pts_x, orbit_pts_y, color="#C53030", lw=2.4, label=ar_text("المدار الفعلي للشمس الحقيقية (Ibn al-Shatir Solar Orbit)"))

        # 4. أفلاك التدوير
        epicycle1 = patches.Circle((P3x, P3y), r1, color="#2B6CB0", fill=True, alpha=0.15, lw=1.5)
        ax.add_patch(epicycle1)
        ax.plot([P3x, P4x], [P3y, P4y], color="#2B6CB0", lw=2.0)

        epicycle2 = patches.Circle((P4x, P4y), r2, color="#D69E2E", fill=True, alpha=0.25, lw=1.5)
        ax.add_patch(epicycle2)
        ax.plot([P4x, Px], [P4y, Py], color="#D69E2E", lw=2.0)

        # 5. المتجهات
        ax.plot([Ox, P3x], [Oy, P3y], color="#2C5282", lw=1.8, label=ar_text("نصف قطر الفلك الحامل (R=60)"))
        ax.plot([Ox, Px], [Oy, Py], color="#9B2C2C", lw=2.0, ls="-.", label=ar_text("الشعاع البصري للشمس الحقيقية (True Solar Ray)"))

        # 6. النقاط
        ax.plot(Ox, Oy, 'o', color="#1A202C", markersize=8)
        ax.plot(P3x, P3y, 'o', color="#2B6CB0", markersize=6)
        ax.plot(P4x, P4y, 'o', color="#D69E2E", markersize=6)
        ax.plot(Px, Py, '*', color="#E53E3E", markersize=14)

        # 7. التسميات
        ax.text(Ox - 4, Oy - 4, ar_text("مركز الأرض (O)\n[مركز العالم]"), fontsize=11, fontweight='bold', color="#1A202C")
        ax.text(P3x + 1.5, P3y + 1.5, ar_text("مركز التدوير الأول (P3)\n[r1 = 4;37]"), fontsize=9, color="#2B6CB0")
        ax.text(P4x + 1.5, P4y - 3.5, ar_text("مركز التدوير الثاني (P4)\n[r2 = 2;30]"), fontsize=9, color="#B7791F")
        ax.text(Px + 2, Py + 2, ar_text("الشمس الحقيقية (P)"), fontsize=12, fontweight='bold', color="#C53030")

        ax.text(R + r1 - r2 + 2, 0, ar_text("الأوج (Apogee)\n[أبعد مسافة: 67;7]"), fontsize=9, fontweight='bold', color="#2D3748")
        ax.text(-(R - (r1 + r2)) - 14, 0, ar_text("الحضيض (Perigee)\n[أقرب مسافة: 52;53]"), fontsize=9, fontweight='bold', color="#2D3748")

        title_text = "النموذج الهندسي الفلكي للشمس وفق قواعد ابن الشاطر الدمشقي (ت 777هـ)\nكتاب «نهاية السول في تصحيح الأصول»"
        ax.set_title(ar_text(title_text), fontsize=13, fontweight='bold', pad=20, color="#1A365D")

        explanation = (
            "المعايير الهندسية لابن الشاطر:\n"
            "• الفلك الحامل: متفق المركز مع الأرض تماماً (R = 60).\n"
            "• فلك التدوير الأول: نصف قطره r1 = 4;37 (4.6167).\n"
            "• فلك التدوير الثاني: نصف قطره r2 = 2;30 (2.5000).\n"
            "• زاوية التدوير الثاني = 2α (ضعف زاوية المركز).\n"
            "• أقصى تعديل للشمس (Max Equation) = 2° 2' 6''."
        )
        ax.text(
            0.03, 0.05, ar_text(explanation),
            transform=ax.transAxes,
            fontsize=9.5,
            verticalalignment='bottom',
            bbox=dict(boxstyle='round,pad=0.8', facecolor='#EDF2F7', edgecolor='#CBD5E0', alpha=0.95)
        )

        ax.set_xlim(-75, 75)
        ax.set_ylim(-75, 75)
        ax.set_aspect('equal')
        ax.grid(True, linestyle=":", alpha=0.4, color="#A0AEC0")
        ax.legend(loc="upper left", fontsize=8.5, framealpha=0.9)

        out_path = os.path.join(self.output_dir, filename)
        svg_path = out_path.replace(".png", ".svg")
        plt.savefig(out_path, bbox_inches='tight', dpi=300)
        plt.savefig(svg_path, bbox_inches='tight')
        plt.close()
        print(f"✓ تم حفظ نموذج الشمس في:\n  - PNG: {out_path}\n  - SVG: {svg_path}")
        return out_path

    def generate_moon_model(self, filename: str = "02_نموذج_القمر_الثوري_ابن_الشاطر.png"):
        R = 60.0
        r1 = 6.0 + 35.0 / 60.0  # 6.5833
        r2 = 1.0 + 25.0 / 60.0  # 1.4167

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(20, 10), dpi=300)
        fig.patch.set_facecolor("#F7F5F0")

        # أ. الاجتماع والاستقبال
        ax1.set_facecolor("#FCFCF9")
        ax1.set_title(ar_text("القمر في حال الاجتماع والاستقبال (Syzygy)\n[بدر أو محاق: 2η = 0°]"), fontsize=12, fontweight='bold', color="#1A365D")
        ax1.add_patch(patches.Circle((0, 0), R, color="#2B6CB0", fill=False, lw=1.5, ls="--"))
        
        ang = math.radians(60)
        p3_x, p3_y = R * math.cos(ang), R * math.sin(ang)
        p4_x = p3_x + r1 * math.cos(ang)
        p4_y = p3_y + r1 * math.sin(ang)
        moon_x = p4_x - r2 * math.cos(ang)
        moon_y = p4_y - r2 * math.sin(ang)

        ax1.add_patch(patches.Circle((p3_x, p3_y), r1, color="#3182CE", fill=True, alpha=0.15, lw=1.3))
        ax1.add_patch(patches.Circle((p4_x, p4_y), r2, color="#D69E2E", fill=True, alpha=0.25, lw=1.3))
        
        ax1.plot([0, p3_x], [0, p3_y], color="#2B6CB0", lw=1.5)
        ax1.plot([p3_x, p4_x], [p3_y, p4_y], color="#3182CE", lw=1.8)
        ax1.plot([p4_x, moon_x], [p4_y, moon_y], color="#D69E2E", lw=1.8)
        ax1.plot([0, moon_x], [0, moon_y], color="#C53030", lw=1.8, ls="-.")

        ax1.plot(0, 0, 'o', color="#1A202C", markersize=7)
        ax1.plot(moon_x, moon_y, 'o', color="#4A5568", markersize=12)
        ax1.text(0 - 5, -5, ar_text("الأرض (O)"), fontsize=10, fontweight='bold')
        ax1.text(moon_x + 2, moon_y + 2, ar_text("القمر (P)\n[المسافة: 65;10]"), fontsize=10, fontweight='bold', color="#2D3748")

        ax1.set_xlim(-75, 75)
        ax1.set_ylim(-75, 75)
        ax1.set_aspect('equal')
        ax1.grid(True, linestyle=":", alpha=0.4)

        # ب. التربيعان
        ax2.set_facecolor("#FCFCF9")
        ax2.set_title(ar_text("القمر في حال التربيعين (Quadrature)\n[نصف قمر: 2η = 180°]"), fontsize=12, fontweight='bold', color="#1A365D")
        ax2.add_patch(patches.Circle((0, 0), R, color="#2B6CB0", fill=False, lw=1.5, ls="--"))
        
        p4_x_q = p3_x + r1 * math.cos(ang)
        p4_y_q = p3_y + r1 * math.sin(ang)
        moon_x_q = p4_x_q + r2 * math.cos(ang)
        moon_y_q = p4_y_q + r2 * math.sin(ang)

        ax2.add_patch(patches.Circle((p3_x, p3_y), r1, color="#3182CE", fill=True, alpha=0.15, lw=1.3))
        ax2.add_patch(patches.Circle((p4_x_q, p4_y_q), r2, color="#D69E2E", fill=True, alpha=0.25, lw=1.3))
        
        ax2.plot([0, p3_x], [0, p3_y], color="#2B6CB0", lw=1.5)
        ax2.plot([p3_x, p4_x_q], [p3_y, p4_y_q], color="#3182CE", lw=1.8)
        ax2.plot([p4_x_q, moon_x_q], [p4_y_q, moon_y_q], color="#D69E2E", lw=1.8)
        ax2.plot([0, moon_x_q], [0, moon_y_q], color="#C53030", lw=1.8, ls="-.")

        ax2.plot(0, 0, 'o', color="#1A202C", markersize=7)
        ax2.plot(moon_x_q, moon_y_q, 'o', color="#4A5568", markersize=12)
        ax2.text(0 - 5, -5, ar_text("الأرض (O)"), fontsize=10, fontweight='bold')
        ax2.text(moon_x_q + 2, moon_y_q + 2, ar_text("القمر (P)\n[المسافة: 68;00]"), fontsize=10, fontweight='bold', color="#2D3748")

        ptolemy_dist_q = 34.0
        ptolemy_moon_x = ptolemy_dist_q * math.cos(ang)
        ptolemy_moon_y = ptolemy_dist_q * math.sin(ang)
        ax2.plot(ptolemy_moon_x, ptolemy_moon_y, 'x', color="#E53E3E", markersize=10, mew=2.5)
        ax2.text(ptolemy_moon_x - 24, ptolemy_moon_y - 6, ar_text("موقع قمر بطلميوس الخاطئ\n(المسافة = 34.0 فقط! - يضاعف الحجم)"), fontsize=8.5, color="#E53E3E", fontweight='bold')

        ax2.set_xlim(-75, 75)
        ax2.set_ylim(-75, 75)
        ax2.set_aspect('equal')
        ax2.grid(True, linestyle=":", alpha=0.4)

        fig.suptitle(
            ar_text("نموذج القمر الثوري لابن الشاطر الدمشقي: تصحيح مسافة القمر وحجمه الظاهري"),
            fontsize=15, fontweight='bold', color="#1A365D", y=0.98
        )

        out_path = os.path.join(self.output_dir, filename)
        svg_path = out_path.replace(".png", ".svg")
        plt.savefig(out_path, bbox_inches='tight', dpi=300)
        plt.savefig(svg_path, bbox_inches='tight')
        plt.close()
        print(f"✓ تم حفظ نموذج القمر في:\n  - PNG: {out_path}\n  - SVG: {svg_path}")
        return out_path


if __name__ == "__main__":
    engine = IbnShatirAstronomicalEngine()
    print("--- جاري بناء النماذج الهندسية الفلكية لابن الشاطر ---")
    engine.generate_sun_model()
    engine.generate_moon_model()
    print("\n🎉 تم إنشاء جميع المخططات الهندسية بنجاح!")