import json
import requests
from bs4 import BeautifulSoup

# Load products
with open('products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

def fetch_description(url):
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')
        # Description
        description = ''
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            description = meta['content']
        else:
            og = soup.find('meta', attrs={'property': 'og:description'})
            if og and og.get('content'):
                description = og['content']
            else:
                p = soup.find('p')
                if p:
                    description = p.get_text(strip=True)
        # Price
        price = ''
        price_span = soup.find('span', class_='fw-black product-price')
        if price_span:
            price = price_span.get_text(strip=True)
        return description, price
    except Exception as e:
        return '', ''

# Load xml.json
with open('xml.json', 'r', encoding='utf-8') as f:
    xml = json.load(f)

url_list = xml['urlset']['url']

updated = 0
for product in products:
    # Find matching url by id in url
    match_url = None
    for url_obj in url_list:
        url = url_obj['loc']
        if product['id'] in url:
            match_url = url
            break
    if match_url:
        print(f"Product: {product['name']} | ID: {product['id']} | URL: {match_url}")
        desc, price = fetch_description(match_url)
        print(f"  -> Fetched price: {price}")
        if desc:
            product['description'] = desc
        if price:
            product['price'] = price
        if desc or price:
            updated += 1
    else:
        print(f"Product: {product['name']} | ID: {product['id']} | No matching URL found.")

with open('products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Updated {updated} product descriptions.")
