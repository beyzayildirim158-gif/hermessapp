import firebase_admin
from firebase_admin import credentials, firestore
import json
import os

# Firebase Admin SDK JSON dosyanızın yolu. Bu dosyayı hermessapp klasörünüze indirdiğinizden emin olun!
SERVICE_ACCOUNT_PATH = 'hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'

# Ürün verilerini içeren JSON dosyanızın yolu
PRODUCTS_JSON_PATH = 'products.json'

if not os.path.exists(SERVICE_ACCOUNT_PATH):
    print(f"Hata: Hizmet hesabı dosyası bulunamadı: {SERVICE_ACCOUNT_PATH}")
    print("Lütfen Firebase konsolundan indirin ve dosya adını doğru bir şekilde girin.")
    exit()

# Ürünler JSON dosyasının varlığını kontrol edin
if not os.path.exists(PRODUCTS_JSON_PATH):
    print(f"Hata: Ürün dosyası bulunamadı: {PRODUCTS_JSON_PATH}")
    print("Lütfen products.json dosyasının bulk_upload.py ile aynı klasörde olduğundan emin olun.")
    exit()

try:
    cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase bağlantısı başarılı!")

    with open(PRODUCTS_JSON_PATH, 'r', encoding='utf-8') as f:
        products = json.load(f)
    print(f"{len(products)} adet ürün bulundu.")

    # Kategoriye göre filtreleme fonksiyonu
    def get_category(product):
        name = product.get('name', '').lower()
        if 'mühür' in name:
            return 'Mühürler'
        elif 'danışmanlık' in name:
            return 'Danışmanlıklar'
        elif 'eğitim' in name:
            return 'Eğitimler'
        elif 'mağaza' in name:
            return 'Mağaza'
        elif 'doğal taş' in name:
            return 'Doğal Taşlar'
        elif 'tarot' in name:
            return 'Tarot'
        else:
            return 'Diğer'

    filtered = {}
    for product in products:
        cat = get_category(product)
        filtered.setdefault(cat, []).append(product)

    # Sonuçları ekrana yazdır
    for cat, items in filtered.items():
        print(f"\nKategori: {cat} ({len(items)} ürün)")
        for p in items:
            print(f"- {p['name']}")

    # Firestore'a yükleme (eski kod)
    for product in products:
        try:
            # Kategori ekle
            product_with_category = product.copy()
            product_with_category['category'] = get_category(product)
            doc_ref = db.collection('products').document(product['id'])
            doc_ref.set(product_with_category)
            print(f"'{product['name']}' ürünü Firestore'a yüklendi. (Kategori: {product_with_category['category']})")
        except Exception as e:
            print(f"'{product['name']}' ürünü yüklenirken bir hata oluştu: {e}")

    print("Tüm ürünler başarıyla yüklendi!")

except Exception as e:
    print(f"Genel bir hata oluştu: {e}")
