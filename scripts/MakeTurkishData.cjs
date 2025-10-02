// scripts/makeTurkishData.cjs  (CommonJS)
// Node 16+ önerilir.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  // ESM modülleri CJS'ten dinamik import ile içeri al
  const dataUrl = pathToFileURL(path.join(process.cwd(), 'data', 'NaturalStoneData.js')).href;
  const trUrl   = pathToFileURL(path.join(process.cwd(), 'data', 'trMaps.js')).href;

  const dataMod = await import(dataUrl);  // ESM default export
  const trMod   = await import(trUrl);    // ESM named exportlar

  const data = dataMod.default || dataMod;
  const { diseaseTR, stoneTR, descReplace } = trMod;

  // Çeviri
  const out = {};
  for (const [disease, stones] of Object.entries(data)) {
    const dTR = diseaseTR[disease] || disease;
    out[dTR] = stones.map(s => {
      let desc = String(s.description || '');
      for (const [en, tr] of descReplace) {
        // bütün kelime eşleşmesi
        desc = desc.replace(new RegExp(`\\b${en}\\b`, 'gi'), tr);
      }
      return {
        name: stoneTR[s.name] || s.name,
        description: desc
      };
    });
  }

  // ÇIKTI dosyası: ESM formatında yazıyoruz ki uygulama direkt import edebilsin
  const target = path.join(process.cwd(), 'data', 'NaturalStoneData.tr.js');
  fs.writeFileSync(
    target,
    `// AUTO-GENERATED — do not edit manually\nexport default ${JSON.stringify(out, null, 2)};\n`,
    'utf8'
  );
  console.log('✔ Türkçe veri üretildi →', target);
})().catch(err => {
  console.error('makeTurkishData failed:', err);
  process.exit(1);
});
