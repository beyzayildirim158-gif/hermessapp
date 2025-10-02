// data/tarotDeck.tr.js
// 78 kart — Türkçe kısa anlamlar + görsel anahtarları (imageKey)

const MAJORS = [
  { id: 0,  name: "Deli (The Fool)",        upright: "Yeni başlangıçlar, spontane hareket, güven ve akışa teslimiyet.", reversed: "Düşünmeden atılganlık, hazırlıksızlık, riskleri yanlış hesaplama.", imageKey: "major_00" },
  { id: 1,  name: "Büyücü (The Magician)",  upright: "Niyet, odak ve irade ile gerçekleştirme; kaynaklarını ustaca kullan.", reversed: "Dağınık enerji, kandırma/aldanma, kendini küçümseme.", imageKey: "major_01" },
  { id: 2,  name: "Azize (The High Priestess)", upright: "İç ses, sezgi, sırlar ve rüyalar; dinle ve bekle.", reversed: "Sezgiyi bastırma, belirsizliğe tahammülsüzlük, içe kapalı bilgi.", imageKey: "major_02" },
  { id: 3,  name: "İmparatoriçe (The Empress)", upright: "Bolluk, yaratıcılık, bereket ve şefkat; üret ve besle.", reversed: "Aşırı bağımlılık, yaratıcılık tıkanması, öz-bakım eksikliği.", imageKey: "major_03" },
  { id: 4,  name: "İmparator (The Emperor)", upright: "Düzen, yapı, liderlik ve sınır koyma; strateji ve otorite.", reversed: "Katılık, kontrol takıntısı, güvensiz otorite.", imageKey: "major_04" },
  { id: 5,  name: "Aziz (The Hierophant)", upright: "Gelenek, öğretmenlik, değerler ve ritüel; güvenilir yöntemler.", reversed: "Kalıpları sorgulama, farklı yolu seçme, eskiyen kurallar.", imageKey: "major_05" },
  { id: 6,  name: "Âşıklar (The Lovers)",    upright: "Uyum, seçim ve kalpten hizalanma; ilişkilerde denge.", reversed: "Uyumsuzluk, kararsızlık, sınırların bulanıklaşması.", imageKey: "major_06" },
  { id: 7,  name: "Savaş Arabası (The Chariot)", upright: "Kararlılık, irade, zafer; disiplinle ilerleme.", reversed: "Yön kaybı, dağınık odak, aşırı hırs/baskı.", imageKey: "major_07" },
  { id: 8,  name: "Güç (Strength)",          upright: "İç güç, şefkat, sabır ve kendine güven; zarafetle yönet.", reversed: "Özgüven düşüklüğü, sabırsızlık, kendine sertlik.", imageKey: "major_08" },
  { id: 9,  name: "Ermiş (The Hermit)",      upright: "İçe dönüş, bilgelik, yalnızlıkta berraklık; rehber ışık.", reversed: "Aşırı izolasyon, yalnızlıktan kaçış ya da rehber reddi.", imageKey: "major_09" },
  { id:10,  name: "Kader Çarkı (Wheel of Fortune)", upright: "Döngüler, talih, beklenmedik değişim; akışa güven.", reversed: "Değişime direnç, tekrar eden kalıplar, talihin geçici yüzü.", imageKey: "major_10" },
  { id:11,  name: "Adalet (Justice)",        upright: "Denge, dürüstlük, sonuçların görünmesi; hak yerini bulur.", reversed: "Haksızlık, eksik bilgi, sorumluluktan kaçışın bedeli.", imageKey: "major_11" },
  { id:12,  name: "Asılan Adam (The Hanged Man)", upright: "Teslimiyet, yeni bakış, beklerken olgunlaşma.", reversed: "Oyalama, aşırı fedakârlık, tıkanma.", imageKey: "major_12" },
  { id:13,  name: "Ölüm (Death)",            upright: "Bitiriş ve dönüşüm; eskiyi bırak, yenisi doğsun.", reversed: "Değişimden korku, tutunma, uzayan kapanış.", imageKey: "major_13" },
  { id:14,  name: "Denge (Temperance)",      upright: "Uyum, ölçü, sabır; parçaları uyumla birleştirme.", reversed: "Aşırılık, dağınıklık, ritmin bozulması.", imageKey: "major_14" },
  { id:15,  name: "Şeytan (The Devil)",      upright: "Bağımlılık, gölge, bağlanmalar; fark et ve yüzleş.", reversed: "Serbest kalma, gücü geri alma, zincirleri çözme.", imageKey: "major_15" },
  { id:16,  name: "Kule (The Tower)",        upright: "Ani sarsıntı, eski yapının çöküşü; gerçeklik açığa çıkar.", reversed: "Yıkımdan kaçınma, geciken çöküş, değişim korkusu.", imageKey: "major_16" },
  { id:17,  name: "Yıldız (The Star)",       upright: "Umut, iyileşme, ilham ve rehberlik; şifaya açık ol.", reversed: "Umutsuzluk, motivasyon düşüklüğü; ışığı hatırla.", imageKey: "major_17" },
  { id:18,  name: "Ay (The Moon)",           upright: "Sezgiler, rüyalar, belirsizlik; sis dağılacak.", reversed: "Korkuların çözülmesi, yavaş yavaş netleşme.", imageKey: "major_18" },
  { id:19,  name: "Güneş (The Sun)",         upright: "Başarı, canlılık, netlik ve neşe; kendine güven.", reversed: "Geçici gölgeler, geciken sevinç; öz-ışığı dengede tut.", imageKey: "major_19" },
  { id:20,  name: "Mahkeme (Judgement)",     upright: "Uyanış, hesaplaşma, çağrı; yenilenme vakti.", reversed: "Kendini fazla yargılama, şüphe, çağrıyı erteleme.", imageKey: "major_20" },
  { id:21,  name: "Dünya (The World)",       upright: "Tamamlanma, bütünleşme, döngünün kapanışı.", reversed: "Eksik kalan, döngüyü kapatamama, erteleme.", imageKey: "major_21" },
];

const SUITS = [
  { tr: "Değnek", key: "Wands",      element: "Ateş",  theme: "eylem, enerji, motivasyon ve yaratıcılık" },
  { tr: "Kupa",   key: "Cups",       element: "Su",    theme: "duygu, sezgi, ilişkiler ve şefkat" },
  { tr: "Kılıç",  key: "Swords",     element: "Hava",  theme: "zihin, iletişim, hakikat ve çatışma" },
  { tr: "Tılsım", key: "Pentacles",  element: "Toprak",theme: "madde, emek, beden ve bolluk" },
];

const NUM_MEAN = {
  1: { tr: "Ası",   gloss: "başlangıç, saf potansiyel" },
  2: { tr: "İkilisi",  gloss: "ikilik, denge/karar" },
  3: { tr: "Üçlüsü",   gloss: "büyüme, işbirliği" },
  4: { tr: "Dörtlüsü", gloss: "stabilite, yapı" },
  5: { tr: "Beşlisi",  gloss: "meydan okuma, değişim" },
  6: { tr: "Altılısı", gloss: "uyum, paylaşım" },
  7: { tr: "Yedilisi", gloss: "değerlendirme, içe bakış" },
  8: { tr: "Sekizlisi",gloss: "ustalık, hareket" },
  9: { tr: "Dokuzlusu",gloss: "tamamlamaya yakınlık, yük" },
  10:{ tr: "Onlusu",   gloss: "tamamlanma, döngü sonu" },
};

const COURTS = [
  { tr: "Prensi",    key: "page",   gloss: "öğrencilik, merak, haberci nitelik" },
  { tr: "Şövalyesi", key: "knight", gloss: "hareket, arayış, macera" },
  { tr: "Kraliçesi", key: "queen",  gloss: "olgun alıcılık, sezgisel ustalık" },
  { tr: "Kralı",    key: "king",   gloss: "olgun otorite, yön verme" },
];

function buildMinors() {
  const out = [];
  let id = 22;
  for (const s of SUITS) {
    // 1..10
    for (let n = 1; n <= 10; n++) {
      const nm = NUM_MEAN[n];
      out.push({
        id: id++,
        name: `${s.tr} ${nm.tr}`, // İSİM TAMALAMASI BURADA!
        arcana: "minor",
        suit: s.tr,
        rank: nm.tr,
        upright: `${s.element} elementi (${s.theme}) bağlamında ${nm.gloss}. Enerjiyi bilinçli yönlendir.`,
        reversed: `${nm.gloss} temasında blokaj/dağınıklık. ${s.element} enerjisini dengele; acele veya aşırılıktan kaçın.`,
        imageKey: `${s.key}_${String(n).padStart(2,'0')}`,
      });
    }
    // court
    for (const c of COURTS) {
      out.push({
        id: id++,
        name: `${s.tr} ${c.tr}`, // İSİM TAMALAMASI BURADA!
        arcana: "minor",
        suit: s.tr,
        rank: c.tr,
        upright: `${s.element} elementi (${s.theme}) alanında ${c.gloss}. Olgunlaşan bir ders ve bilinçli temsil.`,
        reversed: `${c.gloss} alanında aşırı/eksik ifade; içsel dengeyi kur ve niyetini berraklaştır.`,
        imageKey: `${s.key}_${c.key}`,
      });
    }
  }
  return out;
}

const TAROT_DECK = [...MAJORS, ...buildMinors()];
export default TAROT_DECK;