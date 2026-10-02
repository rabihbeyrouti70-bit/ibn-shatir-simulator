# المساهمة في محاكي ابن الشاطر الفلكي | Contributing to Ibn al-Shatir Simulator

شكراً لاهتمامك بالمساهمة في هذا المشروع! Thank you for your interest in contributing!

## 🌐 اللغات | Languages

نرحب بالمساهمات بالعربية والإنجليزية.
We welcome contributions in both Arabic and English.

---

## 🔬 كيف تساهم | How to Contribute

### الإبلاغ عن الأخطاء | Bug Reports

1. افتح [Issue جديد](https://github.com/rabihbeyrouti70-bit/ibn-shatir-simulator/issues/new)
2. صف الخطأ بوضوح مع:
   - المتصفح ونظام التشغيل
   - خطوات إعادة الإنتاج
   - النتيجة المتوقعة vs الفعلية
   - لقطة شاشة إن أمكن

### اقتراح ميزات | Feature Requests

- نرحب باقتراحات تحسين الدقة الفلكية
- إضافة نماذج فلكية تاريخية جديدة (مثل: الطوسي، القوشجي، ابن يونس)
- تحسينات الواجهة وإمكانية الوصول
- ترجمة إلى لغات جديدة

### المساهمات البرمجية | Code Contributions

1. **Fork** المستودع
2. أنشئ فرعاً: `git checkout -b feature/your-feature`
3. اعمل تغييراتك مع التزام بالأسلوب الحالي
4. اختبر في متصفحات متعددة (Chrome, Firefox, Safari)
5. تأكد من عمل المشهد ثلاثي الأبعاد
6. ارسل **Pull Request** مع وصف واضح

---

## 📐 إرشادات الكود | Code Guidelines

### المصطلحات الفلكية
- **التزم** بالمصطلحات العربية التراثية الأصلية في واجهة المستخدم
- أضف التعليقات بالعربية أو الإنجليزية (أو كلاهما)
- عند إضافة حسابات فلكية، اذكر المرجع (مثل: نهاية السول، فصل X)

### الأسلوب البرمجي
- تسمية المتغيرات بالإنجليزية: `sunLongitude`, `moonDeclination`
- تسمية عناصر الـ DOM بالإنجليزية: `id="sunLongBadge"`
- التعليقات يمكن أن تكون عربية أو إنجليزية
- استخدم `const` و `let` بدل `var`

### الدقة الفلكية
- تحقق من النتائج مقابل جداول مرجعية معروفة
- مدينة دمشق (33.51°N, 36.29°E) هي المرجع الأساسي للتحقق
- قارن مواقيت الصلاة مع الجداول الرسمية (±2 دقيقة مقبول)

---

## 📚 مراجع مفيدة | Useful References

- ابن الشاطر، *نهاية السول في تصحيح الأصول* — المخطوط الأصلي
- Kennedy, E.S. & Ghanem, I., *The Life and Work of Ibn al-Shāṭir* (1976)
- Saliba, George, *Islamic Science and the Making of the European Renaissance* (2007)
- Meeus, Jean, *Astronomical Algorithms* (1991)

---

## 📜 الترخيص | License

بالمساهمة في هذا المشروع، أنت توافق على نشر مساهمتك تحت [ترخيص MIT](LICENSE).
