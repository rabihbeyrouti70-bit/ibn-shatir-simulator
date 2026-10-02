var zodiacData = window.zodiacData = [
    { name: "برج الحمل", symbol: "♈", elem: "ناري", season: "أوائل الربيع (الاعتدال)" },
    { name: "برج الثور", symbol: "♉", elem: "ترابي", season: "منتصف فصل الربيع" },
    { name: "برج الجوزاء", symbol: "♊", elem: "هوائي", season: "أواخر فصل الربيع" },
    { name: "برج السرطان", symbol: "♋", elem: "مائي", season: "أوائل الصيف (الانقلاب)" },
    { name: "برج الأسد", symbol: "♌", elem: "ناري", season: "منتصف فصل الصيف" },
    { name: "برج السنبلة", symbol: "♍", elem: "ترابي", season: "أواخر فصل الصيف" },
    { name: "برج الميزان", symbol: "♎", elem: "هوائي", season: "أوائل الخريف (الاعتدال)" },
    { name: "برج العقرب", symbol: "♏", elem: "مائي", season: "منتصف فصل الخريف" },
    { name: "برج القوس", symbol: "♐", elem: "ناري", season: "أواخر فصل الخريف" },
    { name: "برج الجدي", symbol: "♑", elem: "ترابي", season: "أوائل الشتاء (الانقلاب)" },
    { name: "برج الدلو", symbol: "♒", elem: "هوائي", season: "منتصف فصل الشتاء" },
    { name: "برج الحوت", symbol: "♓", elem: "مائي", season: "أواخر فصل الشتاء" }
];

var lunarMansions = window.lunarMansions = [
    "الشرطان", "البطين", "الثريا", "الدبران", "الهقعة", "الهنعة", "الذراع",
    "النثرة", "الطرف", "الجبهة", "الزبرة", "الصرفة", "العواء", "السماك الأعزل",
    "الغفر", "الزبانا", "الإكليل", "القلب", "الشولة", "النعائم", "البلدة",
    "سعد الذابح", "سعد بلع", "سعد السعود", "سعد الأخبية", "فرغ الدلو المقدم", "فرغ الدلو المؤخر", "الرشاء (بطن الحوت)"
];

var planetData = window.planetData = {
    mars: {
        nameAr:"المريخ",symbol:"♂",color:"#F87171",
        // Ptolemy: eccentricity e=6, equant at 2e=12, epicycle r_ep=39.5
        e_ptol: 6.0, r_ep_ptol: 39.5,
        // Ibn al-Shatir: R=60, r1=9, r2=3, r3=39.5
        r1_ibs: 9.0, r2_ibs: 3.0, r3_ibs: 39.5,
        sidereal: 686.97, mean0: 355.433, ano0: 0
    },
    jupiter: {
        nameAr:"المشتري",symbol:"♃",color:"#FB923C",
        e_ptol: 2.75, r_ep_ptol: 11.5,
        r1_ibs: 4.125, r2_ibs: 1.375, r3_ibs: 11.5,
        sidereal: 4332.6, mean0: 34.351, ano0: 0
    },
    saturn: {
        nameAr:"زحل",symbol:"♄",color:"#FACC15",
        e_ptol: 3.417, r_ep_ptol: 6.5,
        r1_ibs: 5.125, r2_ibs: 1.708, r3_ibs: 6.5,
        sidereal: 10759, mean0: 50.077, ano0: 0
    },
    venus: {
        nameAr:"الزهرة",symbol:"♀",color:"#F472B6",
        e_ptol: 1.25, r_ep_ptol: 43.33,
        r1_ibs: 1.683, r2_ibs: 0.433, r3_ibs: 43.33,
        sidereal: 224.7, mean0: 212.0, ano0: 0
    },
    mercury: {
        nameAr:"عطارد",symbol:"☿",color:"#C084FC",
        e_ptol: 3.0, r_ep_ptol: 22.77,
        r1_ibs: 4.083, r2_ibs: 0.833, r3_ibs: 22.77,
        sidereal: 87.97, mean0: 174.794, ano0: 0
    }
};

        var PLANETS_CONFIG = window.PLANETS_CONFIG = [
            { key: 'mercury', name: 'عطارد ☿', r: 55, color: 0xC084FC, size: 3.5, periodDays: 87.97, inc: 0.122 },
            { key: 'venus', name: 'الزهرة ♀', r: 85, color: 0xF472B6, size: 4.8, periodDays: 224.70, inc: 0.059 },
            { key: 'mars', name: 'المريخ ♂', r: 165, color: 0xF87171, size: 4.5, periodDays: 686.97, inc: 0.032 },
            { key: 'jupiter', name: 'المشتري ♃', r: 198, color: 0xFB923C, size: 6.2, periodDays: 4332.6, inc: 0.023 },
            { key: 'saturn', name: 'زحل ♄', r: 236, color: 0xFACC15, size: 5.5, periodDays: 10759, inc: 0.043 }
        ];
