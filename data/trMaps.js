// data/trMaps.js
// Not: Buradakiler örnek ve sık geçen karşılıklar. Diledikçe genişlet.
export const diseaseTR = {
  'Headache': 'Baş ağrısı',
  'Migraine': 'Migren',
  'Insomnia': 'Uykusuzluk',
  'Acne': 'Akne',
  'Allergy': 'Alerji',
  'Stress and Anxiety': 'Stres ve kaygı',
  'Digestive Problems': 'Sindirim sorunları',
  'Joint Pain': 'Eklem ağrıları',
  'Fatigue / Low Energy': 'Enerji eksikliği',
  'Abscesses': 'Apse',
  'Abrasions': 'Sıyrık / abrazyon',
  'Acidification': 'Asitleşme',
  'Ametropia': 'Kırma kusuru (göz)',
  'Arm and Leg Pain': 'Kol / bacak ağrıları',
  'Arteriosclerosis': 'Damar sertliği',
  'Bronchial Asthma': 'Astım (bronşiyal)',
  // … kendi veri dosyandaki tüm İngilizce başlıkları ekleyebilirsin
};

export const stoneTR = {
  'Amethyst': 'Ametist',
  'Lapis Lazuli': 'Lapis Lazuli',
  'Amber': 'Kehribar',
  'Moonstone': 'Ay Taşı',
  'Lepidolite': 'Lepidolit',
  'Rose Quartz': 'Pembe Kuvars',
  'Sodalite': 'Sodalit',
  'Obsidian': 'Obsidyen',
  'Citrine': 'Sitrin',
  'Tiger’s Eye': 'Kaplan Gözü',
  'Jade': 'Yeşim',
  'Turquoise': 'Turkuaz',
  'Malachite': 'Malakit',
  'Calcite': 'Kalsit',
  'Red Agate': 'Kırmızı Akik',
  'Sunstone': 'Güneş Taşı',
  'Aquamarine': 'Akuamarin',
  'Chrysoprase': 'Krizopraz',
  'Blue Lace Agate': 'Mavi Dantelli Akik',
  'Ocean Jasper': 'Okyanus Jaspisi',
  'Bloodstone': 'Heliotrop (Kan Taşı)',
  'Rhodonite': 'Rhodonit',
  'Mookaite': 'Mookait',
  'Moss Agate': 'Yosun Akik',
  'Aventurine': 'Aventurin',
  'Rock Crystal': 'Dağ Kristali',
  'Diamond': 'Elmas',
  // … listeni büyütebilirsin
};

// Basit metin çeviri/ikame (opsiyonel, kısa kalıplar)
export const descReplace = [
  ['helps', 'destek olur'],
  ['supports', 'destekler'],
  ['relieves', 'hafifletir'],
  ['inflammation', 'iltihap'],
  ['pain', 'ağrı'],
  ['stress', 'stres'],
  ['anxiety', 'kaygı'],
  ['sleep', 'uyku'],
  ['digestive', 'sindirim'],
  // İstersen burayı da genişlet
];

// Yardımcılar
export const tDisease = (k) => diseaseTR[k] || k;
export const tStone = (k) => stoneTR[k] || k;
export const tDesc = (s) => {
  if (!s || typeof s !== 'string') return s;
  let out = s;
  for (const [en, tr] of descReplace) {
    out = out.replace(new RegExp(`\\b${en}\\b`, 'gi'), tr);
  }
  return out;
};
