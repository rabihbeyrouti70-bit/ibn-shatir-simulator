#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import math
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import arabic_reshaper

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass


def ar(text: str) -> str:
    try:
        reshaper = arabic_reshaper.ArabicReshaper({'delete_harakat': False})
        return reshaper.reshape(text)
    except Exception:
        return text


class ComprehensiveShatirDiagrams:
    def __init__(self, output_dir='مخططات_ابن_الشاطر_الهندسية'):
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'DejaVu Sans']
        plt.rcParams['axes.unicode_minus'] = False

    def build_solar_diagram(self, sample_angle_deg=50.0):
        R = 60.0
        r1 = 4.0 + 37.0 / 60.0
        r2 = 2.0 + 30.0 / 60.0

        alphas = np.linspace(0, 2 * np.pi, 600)
        alpha_rad = math.radians(sample_angle_deg)

        Ox, Oy = 0.0, 0.0
        P3x = R * math.cos(alpha_rad)
        P3y = R * math.sin(alpha_rad)
        P4x = P3x + r1
        P4y = P3y
        Px = P4x - r2 * math.cos(2 * alpha_rad)
        Py = P4y - r2 * math.sin(2 * alpha_rad)

        fig, ax = plt.subplots(figsize=(14, 14), dpi=300)
        ax.set_facecolor('#FAFAF7')
        fig.patch.set_facecolor('#F3EFE6')

        # 1. خط الأوج والحضيض
        ax.plot([-76, 76], [0, 0], color='#718096', lw=1.5, ls='--', zorder=1)
        ax.text(70, 1.5, ar('خط الأوج (Apogee Line)'), fontsize=11, fontweight='bold', color='#1A365D')
        ax.text(-75, 1.5, ar('خط الحضيض (Perigee Line)'), fontsize=11, fontweight='bold', color='#1A365D')

        # 2. المحور العمودي
        ax.plot([0, 0], [-72, 72], color='#A0AEC0', lw=1.0, ls=':', zorder=1)

        # 3. الفلك الحامل
        deferent = patches.Circle((Ox, Oy), R, color='#2B6CB0', fill=False, lw=2.2, ls='-', zorder=2, label=ar('الفلك الحامل المتفق المركز مع الأرض (R = 60;00)'))
        ax.add_patch(deferent)

        # 4. المدار الحقيقي للشمس
        orbit_x, orbit_y = [], []
        for a in alphas:
            p3_x = R * math.cos(a)
            p3_y = R * math.sin(a)
            p4_x = p3_x + r1
            p4_y = p3_y
            px = p4_x - r2 * math.cos(2 * a)
            py = p4_y - r2 * math.sin(2 * a)
            orbit_x.append(px)
            orbit_y.append(py)

        ax.plot(orbit_x, orbit_y, color='#C53030', lw=2.8, zorder=3, label=ar('مدار الشمس الحقيقي الناتج عن تركيب التدويرين (Ibn al-Shatir Orbit)'))

        # 5. أفلاك التدوير
        ep1 = patches.Circle((P3x, P3y), r1, color='#3182CE', fill=True, alpha=0.18, lw=1.6, ls='-', zorder=4)
        ax.add_patch(ep1)
        ax.plot([P3x, P4x], [P3y, P4y], color='#2B6CB0', lw=2.4, zorder=5)

        ep2 = patches.Circle((P4x, P4y), r2, color='#D69E2E', fill=True, alpha=0.28, lw=1.6, ls='-', zorder=4)
        ax.add_patch(ep2)
        ax.plot([P4x, Px], [P4y, Py], color='#B7791F', lw=2.4, zorder=5)

        # 6. المتجهات
        ax.plot([Ox, P3x], [Oy, P3y], color='#2B6CB0', lw=2.0, zorder=5, label=ar('نصف قطر الفلك الحامل للمركز المتوسط P3'))
        ax.plot([Ox, Px], [Oy, Py], color='#9B2C2C', lw=2.5, ls='-.', zorder=5, label=ar('الشعاع البصري للشمس الحقيقية من مركز الأرض'))

        # 7. أقواس الزوايا
        arc_center = patches.Arc((0, 0), 22, 22, angle=0, theta1=0, theta2=sample_angle_deg, color='#2B6CB0', lw=1.8)
        ax.add_patch(arc_center)
        ax.text(12 * math.cos(math.radians(sample_angle_deg / 2)), 12 * math.sin(math.radians(sample_angle_deg / 2)), ar('زاوية المركز الوسطى'), fontsize=10, fontweight='bold', color='#2B6CB0')

        # 8. النقاط
        ax.plot(Ox, Oy, 'o', color='#1A202C', markersize=9, zorder=6)
        ax.plot(P3x, P3y, 'o', color='#2B6CB0', markersize=7, zorder=6)
        ax.plot(P4x, P4y, 'o', color='#D69E2E', markersize=7, zorder=6)
        ax.plot(Px, Py, '*', color='#E53E3E', markersize=16, zorder=7)

        ax.plot(R + r1 - r2, 0, 'D', color='#276749', markersize=8, zorder=6)
        ax.plot(-(R - (r1 + r2)), 0, 's', color='#7B341E', markersize=8, zorder=6)

        # 9. التسميات
        ax.text(Ox - 6, Oy - 5, ar('مركز الأرض والعالم (O)\n[الموضع الحقيقي للأرض]'), fontsize=11, fontweight='bold', color='#1A202C')
        ax.text(P3x + 2, P3y + 2, ar('مركز فلك التدوير الأول (P3)\n[موضع الشمس الوسطى]'), fontsize=9.5, fontweight='bold', color='#2B6CB0')
        ax.text(P4x + 2, P4y - 4, ar('مركز فلك التدوير الثاني (P4)\n[المحرك الثاني]'), fontsize=9.5, fontweight='bold', color='#B7791F')
        ax.text(Px + 2.5, Py + 2.5, ar('الشمس الحقيقية والمرئية (P)'), fontsize=12, fontweight='bold', color='#C53030')

        apogee_desc = ar('نقطة الأوج (Apogee)\n• أقصى بعد عن الأرض = 67;07 جزءاً\n• القطر الظاهري = 29 دقيقة و 5 ثوانٍ\n• السرعة أبطأ ما تكون')
        ax.text(R + r1 - r2 + 2, -10, apogee_desc, fontsize=9.5, fontweight='bold', color='#22543D', bbox=dict(boxstyle='round,pad=0.5', facecolor='#F0FFF4', edgecolor='#9AE6B4', alpha=0.9))

        perigee_desc = ar('نقطة الحضيض (Perigee)\n• أقرب بعد عن الأرض = 52;53 جزءاً\n• القطر الظاهري = 36 دقيقة و 55 ثانية\n• السرعة أسرع ما تكون')
        ax.text(-(R - (r1 + r2)) - 26, -10, perigee_desc, fontsize=9.5, fontweight='bold', color='#742A2A', bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFF5F5', edgecolor='#FEB2B2', alpha=0.9))

        mean_desc = ar('البعد المتوسط = 60;00\n• القطر الظاهري = 32 دقيقة و 32 ثانية')
        ax.text(2, 62, mean_desc, fontsize=9, fontweight='bold', color='#2C5282')

        rules_text = ar(
            'قواعد ومقادير ابن الشاطر في كتاب «نهاية السول»:\n'
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
            '1. الفلك الحامل: متفق المركز مع الأرض (R = 60;00) دون مركز خارج.\n'
            '2. فلك التدوير الأول (r1): نصف قطره = 4;37 (4.6167) موازٍ لخط الأوج.\n'
            '3. فلك التدوير الثاني (r2): نصف قطره = 2;30 (2.5000) يدور بزاوية 2ᾱ.\n'
            '4. أقصى تعديل لمركز الشمس: درجتان ودقيقتان وست ثوان (2° 02' 06").\n'
            '5. المدار الإهليلجي: ناتج طبيعي عن حركة دائرية منتظمة نقية 100%.'
        )
        ax.text(
            0.02, 0.03, rules_text,
            transform=ax.transAxes,
            fontsize=10,
            verticalalignment='bottom',
            bbox=dict(boxstyle='round,pad=0.9', facecolor='#EDF2F7', edgecolor='#4A5568', alpha=0.95)
        )

        title_full = 'النموذج الهندسي الفلكي الشامل للشمس وفق ابن الشاطر الدمشقي (ت 777هـ)\nمن كتاب «نهاية السول في تصحيح الأصول» مع كافة المقادير والزوايا التراثية'
        ax.set_title(ar(title_full), fontsize=14, fontweight='bold', pad=22, color='#1A365D')

        ax.set_xlim(-80, 80)
        ax.set_ylim(-80, 80)
        ax.set_aspect('equal')
        ax.grid(True, linestyle=':', alpha=0.45, color='#A0AEC0')
        ax.legend(loc='upper left', fontsize=9.5, framealpha=0.95)

        out_png = os.path.join(self.output_dir, '01_نموذج_الشمس_الشامل_المفصل.png')
        out_svg = os.path.join(self.output_dir, '01_نموذج_الشمس_الشامل_المفصل.svg')
        plt.savefig(out_png, bbox_inches='tight', dpi=300)
        plt.savefig(out_svg, bbox_inches='tight')
        plt.close()

        import shutil
        shutil.copyfile(out_png, 'sun_model_comprehensive_arabic.png')
        shutil.copyfile(out_svg, 'sun_model_comprehensive_arabic.svg')

        print('✓ تم بنجاح إنشاء مخطط الشمس الشامل في: sun_model_comprehensive_arabic.png')
        return out_png

    def build_lunar_diagram(self):
        R = 60.0
        r1 = 6.0 + 35.0 / 60.0
        r2 = 1.0 + 25.0 / 60.0

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(24, 12), dpi=300)
        fig.patch.set_facecolor('#F3EFE6')

        ang = math.radians(55)

        # اللوحة الأولى: الاجتماع والاستقبال
        ax1.set_facecolor('#FAFAF7')
        ax1.set_title(ar('أ. القمر في حالتي الاجتماع والاستقبال (Syzygy)\n[المحاق والبدر: زاوية الاستطالة 2η̄ = 0°]'), fontsize=13, fontweight='bold', color='#1A365D', pad=15)

        ax1.plot([-75, 75], [0, 0], color='#A0AEC0', lw=1.2, ls=':')
        ax1.plot([0, 0], [-75, 75], color='#A0AEC0', lw=1.2, ls=':')

        ax1.add_patch(patches.Circle((0, 0), R, color='#2B6CB0', fill=False, lw=2.0, ls='--', label=ar('الفلك الحامل المائل (R = 60;00)')))

        p3_x = R * math.cos(ang)
        p3_y = R * math.sin(ang)
        p4_x = p3_x + r1 * math.cos(ang)
        p4_y = p3_y + r1 * math.sin(ang)
        mx = p4_x - r2 * math.cos(ang)
        my = p4_y - r2 * math.sin(ang)

        ax1.add_patch(patches.Circle((p3_x, p3_y), r1, color='#3182CE', fill=True, alpha=0.18, lw=1.5))
        ax1.add_patch(patches.Circle((p4_x, p4_y), r2, color='#D69E2E', fill=True, alpha=0.28, lw=1.5))

        ax1.plot([0, p3_x], [0, p3_y], color='#2B6CB0', lw=2.0)
        ax1.plot([p3_x, p4_x], [p3_y, p4_y], color='#3182CE', lw=2.2)
        ax1.plot([p4_x, mx], [p4_y, my], color='#D69E2E', lw=2.2)
        ax1.plot([0, mx], [0, my], color='#9B2C2C', lw=2.4, ls='-.')

        ax1.plot(0, 0, 'o', color='#1A202C', markersize=9)
        ax1.plot(p3_x, p3_y, 'o', color='#2B6CB0', markersize=6)
        ax1.plot(p4_x, p4_y, 'o', color='#D69E2E', markersize=6)
        ax1.plot(mx, my, 'o', color='#2D3748', markersize=14)

        ax1.text(-6, -6, ar('مركز الأرض (O)'), fontsize=11, fontweight='bold')
        ax1.text(p3_x + 2, p3_y - 2, ar('التدوير الأول (r1 = 6;35)'), fontsize=9.5, color='#2B6CB0')
        ax1.text(p4_x + 2, p4_y - 4, ar('التدوير الثاني (r2 = 1;25)'), fontsize=9.5, color='#B7791F')
        ax1.text(mx + 2.5, my + 2.5, ar('القمر الحقيقي (P)\n[المسافة = 65;10]'), fontsize=11.5, fontweight='bold', color='#1A202C')

        desc1 = ar(
            'خصائص الاستقبال والاجتماع عند ابن الشاطر:\n'
            '• المسافة الحقيقية عن الأرض: D = 65;10 جزءاً.\n'
            '• القطر الظاهري للقمر: 31 دقيقة و 20 ثانية (مطابق للرصد).\n'
            '• التدوير الثاني يطرح من التدوير الأول لحفظ المسافة الصحيحة.'
        )
        ax1.text(0.03, 0.04, desc1, transform=ax1.transAxes, fontsize=10, bbox=dict(boxstyle='round,pad=0.7', facecolor='#EDF2F7', edgecolor='#CBD5E0', alpha=0.95))

        ax1.set_xlim(-78, 78)
        ax1.set_ylim(-78, 78)
        ax1.set_aspect('equal')
        ax1.grid(True, linestyle=':', alpha=0.4)

        # اللوحة الثانية: التربيعان
        ax2.set_facecolor('#FAFAF7')
        ax2.set_title(ar('ب. القمر في حال التربيعين (Quadrature)\n[نصف القمر: زاوية الاستطالة 2η̄ = 180° ومقارنة بطلميوس]'), fontsize=13, fontweight='bold', color='#1A365D', pad=15)

        ax2.plot([-75, 75], [0, 0], color='#A0AEC0', lw=1.2, ls=':')
        ax2.plot([0, 0], [-75, 75], color='#A0AEC0', lw=1.2, ls=':')

        ax2.add_patch(patches.Circle((0, 0), R, color='#2B6CB0', fill=False, lw=2.0, ls='--', label=ar('الفلك الحامل (R = 60;00)')))

        p4_x_q = p3_x + r1 * math.cos(ang)
        p4_y_q = p3_y + r1 * math.sin(ang)
        mx_q = p4_x_q + r2 * math.cos(ang)
        my_q = p4_y_q + r2 * math.sin(ang)

        ax2.add_patch(patches.Circle((p3_x, p3_y), r1, color='#3182CE', fill=True, alpha=0.18, lw=1.5))
        ax2.add_patch(patches.Circle((p4_x_q, p4_y_q), r2, color='#D69E2E', fill=True, alpha=0.28, lw=1.5))

        ax2.plot([0, p3_x], [0, p3_y], color='#2B6CB0', lw=2.0)
        ax2.plot([p3_x, p4_x_q], [p3_y, p4_y_q], color='#3182CE', lw=2.2)
        ax2.plot([p4_x_q, mx_q], [p4_y_q, my_q], color='#D69E2E', lw=2.2)
        ax2.plot([0, mx_q], [0, my_q], color='#22543D', lw=2.5, ls='-.')

        ax2.plot(0, 0, 'o', color='#1A202C', markersize=9)
        ax2.plot(mx_q, my_q, 'o', color='#2D3748', markersize=14)

        ax2.text(-6, -6, ar('مركز الأرض (O)'), fontsize=11, fontweight='bold')
        ax2.text(mx_q + 2.5, my_q + 2.5, ar('قمر ابن الشاطر الصحيح ✓\n[المسافة = 68;00]'), fontsize=11.5, fontweight='bold', color='#22543D')

        # موقع بطلميوس الخاطئ
        ptolemy_dist = 34.0
        ptx = ptolemy_dist * math.cos(ang)
        pty = ptolemy_dist * math.sin(ang)
        ax2.plot(ptx, pty, 'X', color='#E53E3E', markersize=12, mew=2.5)
        ax2.text(ptx - 36, pty - 6, ar('موقع قمر بطلميوس الخاطئ ✕\n[المسافة = 34;00 فقط! يضاعف الحجم]'), fontsize=9.5, fontweight='bold', color='#9B2C2C', bbox=dict(boxstyle='round,pad=0.5', facecolor='#FFF5F5', edgecolor='#E53E3E', alpha=0.9))

        desc2 = ar(
            'معالجة معضلة بطلميوس التاريخية:\n'
            '• نموذج بطلميوس: كان يقرب القمر لمسافة 34;00 مما يجعل حجمه يتضاعف في التربيعين!\n'
            '• نموذج ابن الشاطر: حفظ مسافة القمر عند 68;00 وبقي قطره ثابتاً بين 29 و 36 دقيقة.\n'
            '• اعترف كوبرنيكوس بصحة هذا النموذج واقتبسه حرفياً بعد 150 عاماً.'
        )
        ax2.text(0.03, 0.04, desc2, transform=ax2.transAxes, fontsize=10, bbox=dict(boxstyle='round,pad=0.7', facecolor='#EDF2F7', edgecolor='#CBD5E0', alpha=0.95))

        ax2.set_xlim(-78, 78)
        ax2.set_ylim(-78, 78)
        ax2.set_aspect('equal')
        ax2.grid(True, linestyle=':', alpha=0.4)

        fig.suptitle(ar('النموذج الهندسي الثوري للقمر عند ابن الشاطر وحل معضلة الحجم الظاهري لبطلميوس'), fontsize=16, fontweight='bold', color='#1A365D', y=0.98)

        out_png = os.path.join(self.output_dir, '02_نموذج_القمر_الثوري_الشامل.png')
        out_svg = os.path.join(self.output_dir, '02_نموذج_القمر_الثوري_الشامل.svg')
        plt.savefig(out_png, bbox_inches='tight', dpi=300)
        plt.savefig(out_svg, bbox_inches='tight')
        plt.close()

        import shutil
        shutil.copyfile(out_png, 'moon_model_comprehensive_arabic.png')
        shutil.copyfile(out_svg, 'moon_model_comprehensive_arabic.svg')

        print('✓ تم بنجاح إنشاء مخطط القمر الشامل في: moon_model_comprehensive_arabic.png')
        return out_png


if __name__ == '__main__':
    gen = ComprehensiveShatirDiagrams()
    print('--- جاري توليد المخططات الهندسية الشاملة المفصلة بالعربية ---')
    gen.build_solar_diagram()
    gen.build_lunar_diagram()
    print('🎉 اكتمل توليد المخططات الهندسية الشاملة بنجاح!')