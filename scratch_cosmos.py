# -*- coding: utf-8 -*-
import os, sys, math
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

def ar(text):
    try:
        reshaper = arabic_reshaper.ArabicReshaper({'delete_harakat': False})
        return reshaper.reshape(text)
    except Exception:
        return text

def build_full_cosmos():
    output_dir = 'مخططات_ابن_الشاطر_الهندسية'
    os.makedirs(output_dir, exist_ok=True)
    plt.rcParams['font.sans-serif'] = ['Segoe UI', 'Arial', 'Tahoma', 'DejaVu Sans']
    plt.rcParams['axes.unicode_minus'] = False

    fig, ax = plt.subplots(figsize=(18, 18), dpi=300)
    ax.set_facecolor('#080D1A')
    fig.patch.set_facecolor('#040711')

    # الأفلاك التسعة
    spheres = [
        {'name': '1. فلك القمر (Moon)', 'r': 18, 'color': '#94A3B8', 'period': '27.3 يوماً'},
        {'name': '2. فلك عطارد (Mercury)', 'r': 28, 'color': '#A78BFA', 'period': '88 يوماً'},
        {'name': '3. فلك الزهرة (Venus)', 'r': 38, 'color': '#F472B6', 'period': '224.7 يوماً'},
        {'name': '4. فلك الشمس [قلب العالم] (Sun)', 'r': 48, 'color': '#FBBF24', 'period': '365.25 يوماً'},
        {'name': '5. فلك المريخ (Mars)', 'r': 60, 'color': '#F87171', 'period': '1.88 سنة'},
        {'name': '6. فلك المشتري (Jupiter)', 'r': 72, 'color': '#FB923C', 'period': '11.86 سنة'},
        {'name': '7. فلك زحل (Saturn)', 'r': 84, 'color': '#FACC15', 'period': '29.46 سنة'},
        {'name': '8. فلك الثوابت والبروج (Fixed Stars)', 'r': 98, 'color': '#38BDF8', 'period': 'حركة الإقبال'},
        {'name': '9. الفلك الأطلس الأعظم [فلك الأفلاك] (Atlas Sphere)', 'r': 114, 'color': '#C084FC', 'period': '24 ساعة'}
    ]

    zodiac_signs = [
        'الحمل ♈', 'الثور ♉', 'الجوزاء ♊', 'السرطان ♋',
        'الأسد ♌', 'السنبلة ♍', 'الميزان ♎', 'العقرب ♏',
        'القوس ♐', 'الجدي ♑', 'الدلو ♒', 'الحوت ♓'
    ]

    # 1. هالة الفلك الأطلس الخارجي
    atlas_r = 114
    for dr in np.linspace(0, 10, 18):
        alpha_val = 0.02 + (10 - dr) * 0.018
        c = patches.Circle((0, 0), atlas_r + dr, color='#A855F7', fill=False, lw=1.5, alpha=alpha_val)
        ax.add_patch(c)

    # 2. دوائر الأفلاك
    for sph in spheres:
        r = sph['r']
        is_atlas = 'الأطلس' in sph['name']
        is_fixed = 'الثوابت' in sph['name']
        is_sun = 'الشمس' in sph['name']

        if is_atlas:
            circ = patches.Circle((0, 0), r, color=sph['color'], fill=False, lw=3.2, ls='-', zorder=3)
            circ_bg = patches.Circle((0, 0), r, color=sph['color'], fill=True, alpha=0.04, zorder=1)
            ax.add_patch(circ_bg)
        elif is_fixed:
            circ = patches.Circle((0, 0), r, color=sph['color'], fill=False, lw=2.4, ls='--', zorder=3)
        elif is_sun:
            circ = patches.Circle((0, 0), r, color=sph['color'], fill=False, lw=2.2, ls='-', zorder=3)
        else:
            circ = patches.Circle((0, 0), r, color=sph['color'], fill=False, lw=1.4, ls=':', alpha=0.75, zorder=2)

        ax.add_patch(circ)

    # 3. البروج الاثني عشر
    r_zodiac = 98
    for i, sign in enumerate(zodiac_signs):
        angle_deg = i * 30 + 15
        angle_rad = math.radians(angle_deg)
        zx = r_zodiac * math.cos(angle_rad)
        zy = r_zodiac * math.sin(angle_rad)

        div_rad = math.radians(i * 30)
        ax.plot([90 * math.cos(div_rad), 106 * math.cos(div_rad)], [90 * math.sin(div_rad), 106 * math.sin(div_rad)], color='#38BDF8', lw=0.8, alpha=0.6)

        ax.text(zx, zy, ar(sign), fontsize=9, fontweight='bold', color='#7DD3FC', ha='center', va='center', zorder=5, bbox=dict(boxstyle='round,pad=0.25', facecolor='#0B1E3B', edgecolor='#38BDF8', alpha=0.85))

    # 4. الكواكب وأفلاك تدويرها
    sample_angles = [40, 110, 200, 310, 150, 260, 20]
    for i, (sph, ang_deg) in enumerate(zip(spheres[:7], sample_angles)):
        r = sph['r']
        rad = math.radians(ang_deg)
        bx = r * math.cos(rad)
        by = r * math.sin(rad)

        ep_r = r * 0.08 if 'الشمس' not in sph['name'] else r * 0.09
        ep = patches.Circle((bx, by), ep_r, color=sph['color'], fill=True, alpha=0.25, lw=1.2, zorder=4)
        ax.add_patch(ep)

        px = bx + ep_r * math.cos(rad * 2)
        py = by + ep_r * math.sin(rad * 2)

        ax.plot([bx, px], [by, py], color=sph['color'], lw=1.5, zorder=5)
        ax.plot(bx, by, 'o', color=sph['color'], markersize=4, zorder=5)
        ax.plot(px, py, 'o', color='#FFFFFF', markersize=7 if 'الشمس' not in sph['name'] else 11, zorder=6)

        lbl = sph['name'].split(' ')[1]
        ax.text(px + 2.5, py + 1.5, ar(lbl), fontsize=9.5, fontweight='bold', color=sph['color'], zorder=7)

    # 5. مركز الأرض
    earth_core = patches.Circle((0, 0), 7, color='#1E3A8A', fill=True, alpha=0.85, zorder=9)
    ax.add_patch(earth_core)
    ax.plot(0, 0, 'o', color='#38BDF8', markersize=14, zorder=10)
    ax.text(0, 0, ar('الأرض O
[مركز العالم]'), fontsize=8, fontweight='bold', color='#FFFFFF', ha='center', va='center', zorder=11)

    # 6. أسهم الحركة الكبرى للفلك الأطلس
    arc_atlas_top = patches.Arc((0, 0), 242, 242, angle=0, theta1=20, theta2=160, color='#C084FC', lw=2.8, ls='-', zorder=8)
    ax.add_patch(arc_atlas_top)
    ax.annotate('', xy=(-119, 20), xytext=(-117, 40), arrowprops=dict(arrowstyle='->', color='#C084FC', lw=3.0))
    ax.text(0, 126, ar('الحركة اليومية العامة للفلك الأطلس (من الشرق إلى الغرب دورة كل 24 ساعة) ⟲'), fontsize=11, fontweight='bold', color='#E9D5FF', ha='center', va='center', bbox=dict(boxstyle='round,pad=0.5', facecolor='#3B0764', edgecolor='#A855F7', alpha=0.9))

    # سهم الحركة الخاصة للأفلاك
    arc_special = patches.Arc((0, 0), 108, 108, angle=0, theta1=200, theta2=340, color='#FBBF24', lw=2.0, ls='--', zorder=8)
    ax.add_patch(arc_special)
    ax.annotate('', xy=(54, -10), xytext=(52, -22), arrowprops=dict(arrowstyle='->', color='#FBBF24', lw=2.5))
    ax.text(0, -58, ar('الحركات الخاصة للأفلاك السيارة (من الغرب إلى الشرق) ⟳'), fontsize=9.5, fontweight='bold', color='#FDE68A', ha='center', va='center', bbox=dict(boxstyle='round,pad=0.4', facecolor='#451A03', edgecolor='#D97706', alpha=0.85))

    # 7. لوحة الشرح التراثية
    info_lines = [
        'ترتيب الأفلاك وهندسة العالم عند ابن الشاطر الدمشقي (ت 777هـ):',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '• الفلك التاسع (الأطلس المحيط): أملس لا كواكب فيه، محرك الكون الأعظم اليومي.',
        '• الفلك الثامن (المكوكب / البروج): يحمل الثوابت والبروج الـ 12 ومنازل القمر.',
        '• الأفلاك السبعة السيارة: مرتبة من الأعلى للأسفل بحسب سرعة الحركة وأبعادها:',
        '   زحل ♄ ← المشتري ♃ ← المريخ ♂ ← الشمس ☉ ← الزهرة ♀ ← عطارد ☿ ← القمر ☽',
        '• المبدأ الهندسي الثوري لابن الشاطر:',
        '   جميع الأفلاك متفقة المركز مع الأرض O تماماً، ونظام التداوير الثنائية',
        '   يستغني كلياً عن المراكز الخارجة وعن نقطة معدل المسير لبطلميوس!'
    ]
    info_text = ar('
'.join(info_lines))
    ax.text(
        0.02, 0.02, info_text,
        transform=ax.transAxes,
        fontsize=9.5,
        verticalalignment='bottom',
        color='#F8FAFC',
        bbox=dict(boxstyle='round,pad=0.8', facecolor='#0F172A', edgecolor='#38BDF8', alpha=0.95)
    )

    title_main = ar('هيأة الأفلاك الكلية التسعة ومساراتها مع الفلك الأطلس الأعظم المحيط
وفق التصور الكوني والرياضي لابن الشاطر الدمشقي في «نهاية السول»')
    ax.set_title(title_main, fontsize=15, fontweight='bold', pad=25, color='#FBBF24')

    ax.set_xlim(-135, 135)
    ax.set_ylim(-135, 135)
    ax.set_aspect('equal')
    ax.axis('off')

    out_png = os.path.join(output_dir, '03_هيئة_الافلاك_التسعة_والفلك_الاطلس.png')
    out_svg = os.path.join(output_dir, '03_هيئة_الافلاك_التسعة_والفلك_الاطلس.svg')
    plt.savefig(out_png, bbox_inches='tight', dpi=300)
    plt.savefig(out_svg, bbox_inches='tight')
    plt.close()

    import shutil
    shutil.copyfile(out_png, 'full_cosmos_atlas_sphere.png')
    shutil.copyfile(out_svg, 'full_cosmos_atlas_sphere.svg')

    print('✓ تم بنجاح إنشاء المخطط الكوني الشامل في: full_cosmos_atlas_sphere.png')
    return out_png

if __name__ == '__main__':
    build_full_cosmos()
