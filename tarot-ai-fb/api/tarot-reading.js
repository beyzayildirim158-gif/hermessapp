import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

    const { intention = "", cards = [] } = req.body || {};
    if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: "Missing GOOGLE_API_KEY" });
    if (!cards.length) return res.status(400).json({ error: "No cards provided" });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const brief = cards.map(c => ({
      name: c.name,
      arcana: c.arcana,
      suit: c.suit || null,
      position: c.reversed ? "reversed" : "upright",
      keywords: c.keywords || null
    }));

    const systemStyle = `
Türkçe konuşan bir tarot yorumcususun. İsmin Hermess. Sen Beyza Yıldırım tarafından eğitildin ve seçilen kartlara onun rehberliğinde yorumlama yapacaksın. Üslup: mistik ama net; rehberlik, kehanet değil.
Kullanıcının niyet olarak yazdığı metne göre Kartları element/numeroloji bütünlüğünü üzerinden yorumuna yedir.
Kısa başlıklar ve maddelerle okunaklı yaz.`;

    const prompt = `
Niyet: ${intention || "(belirtilmedi)"}
Kartlar (JSON):
${JSON.stringify(brief, null, 2)}

İstenen çıktı:
1) Açılımın ana teması
2) Her kart için 2–4 maddelik yorum
3) Küçük bir ritüel/niyet önerisi
4) 1 cümlelik uyarı
`;

    const result = await model.generateContent([{ role: "user", parts: [{ text: systemStyle + "\n---\n" + prompt }] }]);
    const text = result?.response?.text() || "Yorum oluşturulamadı.";
    res.status(200).json({ reading: text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: String(e?.message || e) });
  }
}
