import json
import re
import time
from pathlib import Path
from typing import Dict, Any, List, Tuple

import requests
from bs4 import BeautifulSoup

XML_PATH = Path('xml.json')
EXISTING_PRODUCTS_PATH = Path('products.json')
SCRAPED_OUTPUT = Path('products.scraped.json')
MERGED_OUTPUT = Path('products.merged.json')
AUDIT_OUTPUT = Path('products.audit.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; HermessAppBot/1.0; +https://hermesshealing.com)'
}

# --- Helpers ---
SYSTEM_KEYWORDS = [
    'anasayfa','arama','uye','giris','kayit','hakkimizda','iletisim','sik-sorulan','sss',
    'kampanya','kampanyalar','sepet','siparis','odeme','iade','garanti','gizlilik',
    'guvenlik','uyelik','hesap','video','foto','haber','blog','kategori','xml','404'
]

PRICE_PATTERN = re.compile(r'(\d{1,3}(?:\.\d{3})*,\d{2}|\d+[.,]?\d*)\s*TL', re.IGNORECASE)

CATEGORY_RULES = [
    (re.compile(r'muhur|mühür', re.IGNORECASE), 'Mühürler'),
    (re.compile(r'danisman|danışman', re.IGNORECASE), 'Danışmanlıklar'),
    (re.compile(r'egitim|eğitim', re.IGNORECASE), 'Eğitimler'),
    (re.compile(r'tarot', re.IGNORECASE), 'Tarot'),
    (re.compile(r'tas|taş', re.IGNORECASE), 'Doğal Taşlar'),
]

def is_candidate(url: str) -> bool:
    if not url.startswith('https://hermesshealing.com/'):
        return False
    last = url.strip('/').split('/')[-1]
    if any(k in url for k in SYSTEM_KEYWORDS):
        return False
    # heuristic: product pages often contain hyphen or specific domain words
    if '-' not in last and len(last) < 5:
        return False
    return True

def fetch(url: str) -> Tuple[str, int]:
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        return r.text, r.status_code
    except Exception:
        return '', 0


def extract_product(url: str, html: str) -> Dict[str, Any] | None:
    soup = BeautifulSoup(html, 'html.parser')

    # Name: prefer h1 then h2
    name_el = soup.find('h1') or soup.find('h2')
    if not name_el:
        return None
    name = name_el.get_text(strip=True)
    if len(name) < 3:
        return None

    # Price: search for pattern
    price_text = ''
    possible_texts: List[str] = []
    for tag in soup.find_all(text=PRICE_PATTERN):
        possible_texts.append(tag.strip())
    if possible_texts:
        # choose first sensible
        price_text = PRICE_PATTERN.search(possible_texts[0]).group(1) + ' TL'

    # Description: collect meaningful sections (h3 + following paragraphs)
    desc_parts: List[str] = []
    for h in soup.find_all(['h2','h3','h4']):
        h_text = h.get_text(' ', strip=True)
        if not h_text:
            continue
        # Skip repetitive titles like exact product name repeated many times
        if h_text.lower() == name.lower():
            continue
        # Gather next sibling paragraphs until another heading
        block: List[str] = [f"**{h_text}**"]
        for sib in h.find_all_next():
            if sib == h:
                continue
            if sib.name in ['h2','h3','h4']:
                break
            if sib.name == 'p':
                ptxt = sib.get_text(' ', strip=True)
                if ptxt and len(ptxt) > 20:
                    block.append(ptxt)
            # stop if block gets large
            if len(' '.join(block)) > 900:
                break
        if len(block) > 1:
            desc_parts.append('\n'.join(block))
        if len('\n\n'.join(desc_parts)) > 1800:  # cap description size
            break
    description = '\n\n'.join(desc_parts).strip()

    # Fallback meta description
    if not description:
        meta = soup.find('meta', attrs={'name': 'description'})
        if meta and meta.get('content'):
            description = meta['content'].strip()

    # Images: collect first suitable image
    image_url = ''
    for img in soup.find_all('img'):
        src = img.get('src') or ''
        if not src:
            continue
        if any(x in src.lower() for x in ['lazy_load', 'data:image']):
            continue
        if src.startswith('/'):
            src = 'https://hermesshealing.com' + src
        image_url = src
        break

    # Category inference
    lower_all = (name + ' ' + description).lower()
    category = 'Diğer'
    for pattern, cat in CATEGORY_RULES:
        if pattern.search(lower_all):
            category = cat
            break

    slug = url.strip('/').split('/')[-1]

    product = {
        'id': slug,
        'name': name,
        'price': price_text or None,
        'description': description or None,
        'imageUrl': image_url or None,
        'url': url,
        'category': category
    }
    return product


def load_existing() -> Dict[str, Dict[str, Any]]:
    if not EXISTING_PRODUCTS_PATH.exists():
        return {}
    try:
        with open(EXISTING_PRODUCTS_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
        if isinstance(data, list):
            return {p.get('id') or p.get('name','').lower().replace(' ','-'): p for p in data}
        return {}
    except Exception:
        return {}


def merge(existing: Dict[str, Dict[str, Any]], scraped: Dict[str, Dict[str, Any]]):
    merged: Dict[str, Dict[str, Any]] = {}
    for pid, prod in scraped.items():
        base = existing.get(pid, {})
        merged_prod = base.copy()
        for key, val in prod.items():
            if val in (None, '', []):
                continue
            # prefer scraped description if existing missing or placeholder
            if key == 'description':
                if not base.get('description') or base['description'].lower() in ['açıklama yok', 'aciklama yok', '']:
                    merged_prod[key] = val
                else:
                    # keep longer
                    merged_prod[key] = max([base['description'], val], key=len)
            else:
                merged_prod[key] = val
        merged[pid] = merged_prod
    # include untouched existing
    for pid, prod in existing.items():
        if pid not in merged:
            merged[pid] = prod
    return merged


def main():
    if not XML_PATH.exists():
        print('xml.json bulunamadı')
        return
    with open(XML_PATH, 'r', encoding='utf-8') as f:
        xml = json.load(f)

    urls = [u['loc'] for u in xml.get('urlset', {}).get('url', []) if 'loc' in u]
    candidates = [u for u in urls if is_candidate(u)]
    print(f"Toplam URL: {len(urls)} | Aday ürün URL: {len(candidates)}")

    scraped: Dict[str, Dict[str, Any]] = {}
    audit: List[Dict[str, Any]] = []

    for i, url in enumerate(candidates, start=1):
        html, status = fetch(url)
        status_ok = status == 200 and html
        record = {'url': url, 'status': status, 'ok': status_ok}
        if not status_ok:
            record['error'] = 'Status/HTML yok'
            audit.append(record)
            print(f"[{i}/{len(candidates)}] SKIP {url} status={status}")
            continue
        product = extract_product(url, html)
        if product:
            scraped[product['id']] = product
            record['productId'] = product['id']
            record['name'] = product['name']
            record['category'] = product['category']
            print(f"[{i}/{len(candidates)}] ✔ {product['id']} | {product['name']} | {product['category']}")
        else:
            record['error'] = 'Ürün ayıklanamadı'
            print(f"[{i}/{len(candidates)}] ✖ AYIKLANAMADI {url}")
        audit.append(record)
        time.sleep(0.8)  # politeness delay

    with open(SCRAPED_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(list(scraped.values()), f, ensure_ascii=False, indent=2)
    print(f"Scraped ürünler yazıldı: {SCRAPED_OUTPUT}")

    existing = load_existing()
    merged = merge(existing, scraped)
    with open(MERGED_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(list(merged.values()), f, ensure_ascii=False, indent=2)
    print(f"Birleştirilmiş ürünler yazıldı: {MERGED_OUTPUT} (Toplam: {len(merged)})")

    with open(AUDIT_OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(audit, f, ensure_ascii=False, indent=2)
    print(f"Audit kaydı: {AUDIT_OUTPUT}")

    # Özet
    cats: Dict[str, int] = {}
    for p in scraped.values():
        cats[p['category']] = cats.get(p['category'], 0) + 1
    print('Kategori dağılımı:')
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  - {c}: {n}")

if __name__ == '__main__':
    main()