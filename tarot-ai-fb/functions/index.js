// functions/index.js
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();

// Firebase Secrets:  firebase functions:secrets:set GEMINI_API_KEY
const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");

// ---------- yardımcılar ----------
function corsPrep(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method Not Allowed" });
    return true;
  }
  return false;
}
function getModel() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

function buildTarotPrompt(intention = "", cards = []) {
  const cardList = cards
    .map((c) => `${c.name} (${c.position === "reversed" ? "ters" : "düz"})`)
    .join(", ");
  return `
Kullanıcının niyeti: "${String(intention || "").trim()}".
Açılan kartlar: ${cardList}.

Bir tarot uzmanı gibi Türkçe, mistik ama net bir okuma yap:Paragraf başlığı asla kullanma
- Kartların kadim anlamları üzerinden niyete göre genel yorum yaz.
- Sonda 1 cümlelik mini ritüel/niyet önerisi ver. 
- Detaylı açılım için yönlendirme mesajı yaz.
`.trim();
}

function buildNumerologyPrompt(firstName, lastName, birthDate) {
  return `
Türkçe konuşan bir numeroloji uzmanısın. Üslup: mistik ama net; rehberlik edici. Paragraf başlığı asla kullanma 

Veriler:
- İsim: ${firstName}
- Soyisim: ${lastName}
- Doğum Tarihi: ${birthDate}

İstenen çıktı:
- Yaşam Yolu Numarası ve anlamı
- Genel yorum
- Detaylı numeroloji alması için yönlendirme mesajı
`.trim();
}

// ---------- TEK FONKSİYON: tarot + numeroloji ----------
exports.tarotreading = onRequest(
  { region: "europe-central2", secrets: [GEMINI_API_KEY] },
  async (req, res) => {
    try {
      if (corsPrep(req, res)) return;

      const body = req.body || {};

      // 1) TAROT akışı (cards varsa)
      if (Array.isArray(body.cards) && body.cards.length > 0) {
        const intention = body.intention || "";
        const cards = body.cards.map((c) => ({
          name: c.name,
          position: c.position === "reversed" ? "reversed" : "upright",
          arcana: c.arcana || (c.suit ? "minor" : "major"),
          suit: c.suit ?? null,
        }));

        const prompt = buildTarotPrompt(intention, cards);
        const model = getModel();
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();

        return res.json({ ok: true, kind: "tarot", reading: text || "" });
      }

      // 2) NUMEROLOGY akışı (isim + soyisim + doğum tarihi varsa)
      if (body.firstName && body.lastName && body.birthDate) {
        const prompt = buildNumerologyPrompt(
          String(body.firstName),
          String(body.lastName),
          String(body.birthDate)
        );
        const model = getModel();
        const result = await model.generateContent(prompt);
        const text = (await result.response).text();

        return res.json({ ok: true, kind: "numerology", reading: text || "" });
      }

      // 3) Geçersiz gövde
      return res.status(400).json({
        ok: false,
        error:
          "Geçersiz istek gövdesi. Tarot için {intention, cards:[{name,position}]} veya Numeroloji için {firstName,lastName,birthDate} gönderin.",
        examples: {
          tarot: {
            intention: "İşimde ilerleme",
            cards: [{ name: "As - Değnekler", position: "upright" }],
          },
          numerology: {
            firstName: "Beyza",
            lastName: "Yıldırım",
            birthDate: "01.01.1990",
          },
        },
      });
    } catch (err) {
      console.error("tarotreading error:", err);
      return res.status(500).json({
        ok: false,
        error: `İşlem sırasında hata: ${err.message || String(err)}`,
      });
    }
  }
);
