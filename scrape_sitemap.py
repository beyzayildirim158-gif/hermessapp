import requests
from bs4 import BeautifulSoup
import json
import os
import warnings
from bs4 import XMLParsedAsHTMLWarning

# XML'in HTML olarak ayrıştırılması uyarısını gizle
warnings.filterwarnings("ignore", category=XMLParsedAsHTMLWarning)

# İndirdiğiniz JSON formatındaki sitemap dosyasının yolu
SITEMAP_JSON_PATH = 'xml.json'
# Çekilen ürünlerin yazılacağı JSON dosyasının yolu
PRODUCTS_JSON_PATH = 'products.json'

# Gerekli kütüphanelerin yüklü olduğunu kontrol edin
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Hata: requests ve beautifulsoup4 kütüphaneleri yüklü değil.")
    print("Lütfen terminalde 'pip install requests beautifulsoup4' komutunu çalıştırın.")
    exit()

if not os.path.exists(SITEMAP_JSON_PATH):
    print(f"Hata: Sitemap dosyası bulunamadı: {SITEMAP_JSON_PATH}")
    print("Lütfen xml.json dosyasının bu betikle aynı klasörde olduğundan emin olun.")
    exit()

try:
    with open(SITEMAP_JSON_PATH, 'r', encoding='utf-8') as f:
        sitemap_data = json.load(f)

    # URL'leri içeren listeyi alın
    if 'urlset' in sitemap_data and 'url' in sitemap_data['urlset']:
        urls = [item['loc'] for item in sitemap_data['urlset']['url']]
    else:
        print("Hata: Sitemap JSON dosyasının yapısı beklenmiyor.")
        print("Dosya içinde 'urlset' ve 'url' anahtarlarının olduğundan emin olun.")
        exit()

    products = []
    product_count = 0
    
    print(f"{len(urls)} adet URL bulundu. Sayfalar taranıyor...")

    for url in urls:
        print(f"Sayfa taranıyor: {url}")
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')

            # Ürün adı ve resmi için meta etiketlerini kontrol edin
            product_name_element = soup.find('meta', property='og:title')
            product_image_element = soup.find('meta', property='og:image')

            # Eğer hem isim hem de resim meta etiketi varsa, bunu bir ürün sayfası olarak kabul edin.
            if product_name_element and product_image_element:
                product_name = product_name_element['content'].strip()
                product_image_url = product_image_element['content'].strip()

                # Ürün fiyatı: HTML kodunda bulunamadı. Dinamik olarak yükleniyor olabilir.
                product_price = 0  # Fiyat bulunamadığı için varsayılan değer

                # URL'nin son bölümünü ID olarak kullanıyoruz
                product_id = url.strip('/').split('/')[-1]
                
                products.append({
                    'id': product_id,
                    'name': product_name,
                    'price': product_price,
                    'imageUrl': product_image_url
                })
                product_count += 1
                print(f"-> Ürün bilgileri çekildi: {product_name}")
            else:
                # Ürün sayfası olmayan URL'leri atlayın
                print(f"-> Ürün adı veya resmi bulunamadığı için atlandı.")

        except requests.exceptions.RequestException as e:
            print(f"URL'ye erişilirken hata oluştu {url}: {e}")
        except Exception as e:
            print(f"URL'den veri çekilirken genel bir hata oluştu {url}: {e}")

    # products.json dosyasına yazma
    with open(PRODUCTS_JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
        print(f"\n{product_count} adet ürün '{PRODUCTS_JSON_PATH}' dosyasına başarıyla yazıldı!")

except Exception as e:
    print(f"Genel bir hata oluştu: {e}")
