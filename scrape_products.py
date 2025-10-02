import requests
from bs4 import BeautifulSoup
import json

# Ürünlerin listelendiği sayfanın URL'sini buraya girin
URL = 'https://www.hermesshealing.com/dogal-taslar'

try:
    response = requests.get(URL)
    response.raise_for_status() # Hata oluşursa istisna fırlatır
    soup = BeautifulSoup(response.text, 'html.parser')

    products = []
    # Ürün kartlarını veya listeleme öğelerini bulmak için sitenizin HTML yapısına bakın
    for item in soup.find_all('div', class_='product-card'):
        product_name = item.find('h2', class_='product-name').text.strip()
        product_price_text = item.find('span', class_='product-price').text.strip()
        product_price = float(product_price_text.replace('TL', '').replace(',', '.').strip())

        product = {
            'name': product_name,
            'price': product_price,
            'imageUrl': item.find('img')['src'],
            'id': product_name.lower().replace(' ', '-')
        }
        products.append(product)

    # products.json dosyasına yazma
    with open('products.json', 'w', encoding='utf-8') as f:
        json.dump(products, f, ensure_ascii=False, indent=4)
        print(f"{len(products)} adet ürün products.json dosyasına başarıyla yazıldı!")

except Exception as e:
    print(f"Hata oluştu: {e}")