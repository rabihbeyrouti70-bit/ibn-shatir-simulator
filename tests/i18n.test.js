import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

describe('منظومة التدويل واللغات (i18n & Locales Validation)', () => {
    it('ملف اللغة العربية ar.json صالح وسليم نحوياً وبنائياً', () => {
        const raw = fs.readFileSync('./locales/ar.json', 'utf8');
        const data = JSON.parse(raw);
        assert.ok(data['app.title'], 'app.title must exist');
        assert.ok(data['tab.3d'], 'tab.3d must exist');
        assert.ok(data['prayer.fajr'], 'prayer.fajr must exist');
    });

    it('ملف اللغة الإنجليزية en.json صالح وسليم نحوياً وبنائياً', () => {
        const raw = fs.readFileSync('./locales/en.json', 'utf8');
        const data = JSON.parse(raw);
        assert.ok(data['app.title'], 'app.title must exist');
        assert.ok(data['tab.3d'], 'tab.3d must exist');
        assert.ok(data['prayer.fajr'], 'prayer.fajr must exist');
    });

    it('تطابق جميع المفاتيح بين الملف العربي والإنجليزي (100% Key Parity)', () => {
        const ar = JSON.parse(fs.readFileSync('./locales/ar.json', 'utf8'));
        const en = JSON.parse(fs.readFileSync('./locales/en.json', 'utf8'));

        const arKeys = Object.keys(ar).sort();
        const enKeys = Object.keys(en).sort();

        const missingInEn = arKeys.filter(k => !en[k]);
        const missingInAr = enKeys.filter(k => !ar[k]);

        assert.deepStrictEqual(missingInEn, [], `Missing keys in en.json: ${missingInEn.join(', ')}`);
        assert.deepStrictEqual(missingInAr, [], `Missing keys in ar.json: ${missingInAr.join(', ')}`);
        assert.strictEqual(arKeys.length, enKeys.length, 'Key counts must be identical');
    });
});
