const fs = require('fs');
const path = require('path');

// --- YAPILANDIRMA AYARLARI ---
// 1. Görsel dosyalarının bulunduğu klasörün yolu (Bu betiğin bulunduğu dizine göre)
const IMAGE_DIR = path.join(__dirname, 'stoneImages');

// 2. Çıktı dosyasının yolu (React Native bileşeninizin import edeceği dosya)
const OUTPUT_FILE = path.join(__dirname, 'ImageMap.js');

// 3. Varsayılan görsel adı (Eşleşme bulunamazsa kullanılacak)
const DEFAULT_IMAGE_NAME = 'default_stone.png';

// 4. Bu betiğin okunması gereken veri kaynağı (Taşların tam listesini içeriyorsa)
// Eğer taş adlarınız veri dosyanızdan geliyorsa, bu dosyayı okuyup isimleri eşleştirebilirsiniz.
// Basit tutmak adına, sadece dosya isimlerinden anahtar oluşturacağız.

// ---------------------------

/**
 * Dosya adından PascalCase/TitleCase şeklinde taş adı oluşturur.
 * Örn: pembe_kuvars.png -> Pembe Kuvars
 *
 * NOT: Bu fonksiyonun çıktısı, veri dosyanızdaki (naturalStoneData) taş adlarıyla
 * BİREBİR AYNI olmalıdır.
 *
 * @param {string} filename - Görsel dosyasının adı
 * @returns {string} Eşleşme için kullanılacak taş adı
 */
function createStoneKey(filename) {
    const nameWithoutExt = path.parse(filename).name;
    
    // Alt çizgiyi boşlukla değiştir, her kelimenin baş harfini büyük yap
    const key = nameWithoutExt
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
        
    return key;
}

function generateImageMap() {
    console.log('--- React Native Görsel Haritası Oluşturuluyor ---');

    if (!fs.existsSync(IMAGE_DIR)) {
        console.error(`HATA: Görsel klasörü bulunamadı: ${IMAGE_DIR}`);
        console.log('Lütfen tüm taş görsellerinizi bu betiğin yanındaki "stoneImages" klasörüne yerleştirin.');
        return;
    }

    // Klasördeki tüm dosyaları oku
    const files = fs.readdirSync(IMAGE_DIR);
    
    let mapContent = '';
    let requiredFilesCount = 0;

    files.forEach(file => {
        const ext = path.extname(file).toLowerCase();
        // Sadece görsel dosyalarını (png, jpg, jpeg) dahil et
        if (['.png', '.jpg', '.jpeg'].includes(ext)) {
            const stoneKey = createStoneKey(file);
            
            // Eğer dosya varsayılan görsel değilse, require satırını ekle
            if (file !== DEFAULT_IMAGE_NAME) {
                // Not: require yolunda Windows/Linux uyumluluğu için path.join kullanılmaz.
                const requirePath = `./stoneImages/${file}`;
                
                // Taş adını key olarak, require satırını value olarak ekle
                mapContent += `    '${stoneKey}': require('${requirePath}'),\n`;
                requiredFilesCount++;
            }
        }
    });
    
    // Varsayılan görseli her zaman ekle
    const defaultRequirePath = `./stoneImages/${DEFAULT_IMAGE_NAME}`;
    mapContent += `    'default': require('${defaultRequirePath}')\n`;

    // Çıktı dosyasının üst ve alt kısımlarını oluştur
    const output = `// Bu dosya, generateImageMap.js betiği tarafından otomatik olarak oluşturulmuştur.
// Lütfen bu dosyada MANUEL değişiklik YAPMAYIN.

export const STONE_IMAGE_MAP = {
${mapContent}};

// Toplam yüklenen görsel sayısı: ${requiredFilesCount}
`;

    // Dosyaya yaz
    fs.writeFileSync(OUTPUT_FILE, output);
    console.log(`BAŞARILI: ${requiredFilesCount} taş görseli için require satırı oluşturuldu.`);
    console.log(`Çıktı dosyası: ${OUTPUT_FILE}`);
}

generateImageMap();
