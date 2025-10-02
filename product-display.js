import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getStorage, ref, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Modül kapsamında kalacak Firebase örnekleri ve durumu
let storageInstance = null;
let isInitialized = false;

/**
 * Firebase hizmetlerini ve kullanıcı oturumunu (Authentication) başlatır.
 * Canvas ortamı tarafından sağlanan global değişkenleri kullanır.
 * @returns {Promise<void>}
 */
const initializeFirebase = async () => {
    if (isInitialized) return;

    try {
        // Global değişkenlerden güvenli bir şekilde Firebase yapılandırmasını alın.
        const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
        const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

        if (Object.keys(firebaseConfig).length === 0) {
            throw new Error("Firebase yapılandırması global değişkenden alınamadı.");
        }

        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        storageInstance = getStorage(app);

        // Otomatik Yetkilendirme (Authentication)
        // Storage'dan dosya çekmek için genellikle yetkili bir oturum gereklidir.
        if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
        } else {
            await signInAnonymously(auth);
        }

        isInitialized = true;
        console.log("Firebase ve Kullanıcı Oturumu (Auth) başarıyla başlatıldı.");

    } catch (error) {
        console.error("KRİTİK HATA: Firebase başlatılırken veya oturum açılırken sorun oluştu:", error);
        isInitialized = false;
        // Hatanın çağırana yayılmasını sağlayın
        throw error; 
    }
};

/**
 * Firebase Storage'dan belirtilen CSV dosyasını çeker, ayrıştırır ve ürün verilerini döndürür.
 * Bu fonksiyon, çağrıldığında Firebase başlatma işlemini (initializeFirebase) otomatik olarak yapar.
 * * @param {string} filePath Storage'daki CSV dosyasının yolu (Varsayılan: 'product.csv').
 * @returns {Promise<Array<object>>} Başarılı olursa ürün nesnelerinden oluşan bir dizi; hata olursa boş dizi.
 */
export const fetchProductsFromStorage = async (filePath = 'product.csv') => {
    try {
        // Firebase başlatılmamışsa başlatın
        if (!isInitialized) {
            await initializeFirebase();
        }
        
        if (!storageInstance) {
             throw new Error("Storage servisi başlatılamadı.");
        }

        const productRef = ref(storageInstance, filePath);
        
        // 1. İndirme URL'sini al
        const url = await getDownloadURL(productRef);
        console.log(`[Storage Util] CSV indirme URL'si alındı. Dosya: ${filePath}`);
        
        // 2. Dosyayı indir ve metin olarak oku
        const response = await fetch(url);
        if (!response.ok) {
            // Erişim reddedilmişse veya dosya yoksa hata fırlat
            throw new Error(`HTTP hatası! Durum: ${response.status}. Storage Güvenlik Kurallarını kontrol edin.`);
        }
        const csvText = await response.text();

        // 3. CSV verisini ayrıştır (Sizin orijinal mantığınız korundu)
        const rows = csvText.split('\n').filter(row => row.trim() !== '');
        
        if (rows.length <= 1) {
            console.warn(`[Storage Util] ${filePath} dosyası veri içermiyor.`);
            return [];
        }

        // İlk satırı (başlık) atla
        const products = rows.slice(1).map((row, index) => {
            // Varsayım: Sütunlar virgül (,) ile ayrılmıştır.
            const columns = row.split(','); 
            return {
                id: `prod-${index + 1}`,
                name: columns[0] ? columns[0].trim() : `Ürün ${index + 1}`,
                description: columns[1] ? columns[1].trim() : 'Açıklama yok.',
                price: columns[2] ? parseFloat(columns[2].trim()) : 0,
                imageUrl: columns[3] ? columns[3].trim() : '',
            };
        });
        
        console.log(`[Storage Util] ${products.length} adet ürün başarıyla ayrıştırıldı.`);
        return products;

    } catch (error) {
        console.error('[Storage Util HATA] Ürün verisi çekilemedi:', error.message);
        // Hata durumunda ana uygulamayı bozmamak için boş bir dizi döndürün.
        return [];
    }
};

// Bu fonksiyonu başka bir JS dosyasında aşağıdaki gibi kullanabilirsiniz:
/*
import { fetchProductsFromStorage } from './firebaseStorageUtil.js';

async function loadProducts() {
    const products = await fetchProductsFromStorage('product.csv');
    console.log(products);
    // Ürünleri DOM'a render etme veya state yönetimi (React/Angular) mantığı buraya gelir.
}

loadProducts();
*/
