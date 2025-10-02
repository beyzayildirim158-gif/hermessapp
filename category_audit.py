import re
import json
import sys
from pathlib import Path
from typing import Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT = 'hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'
COLLECTION = 'products'
REPORT_PATH = 'products_category_audit.json'

STONE_PATTERN = re.compile(r"taş|tas|kuvars|agate|akik|kristal|opal|sitrin|ametist|obsidyen|hematit|selenit", re.IGNORECASE)
JEWELRY_PATTERN = re.compile(r"bileklik|kolye|yüzük|yuzuk|kupe|küpe|tesbih|tütsü|tutsu|pendant|bracelet|necklace|ring", re.IGNORECASE)
BLOG_SIGNALS = [
    re.compile(p, re.IGNORECASE) for p in [
        r"astroloji", r"hafta(lık|lik)", r"burç", r"enerji", r"ritüel|rituel", r"rehber",
        r"açılım|acilim", r"yılın|yilin", r"öngörü|ongoru", r"yeni ay", r"dolunay"
    ]
]
DATE_LIKE = re.compile(r"(\b\d{1,2}\s*[-–]\s*\d{1,2}\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\b)|(\b\d{1,2}\s*(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)\b)|(20\d{2})", re.IGNORECASE)

PRODUCT_KEYWORDS = {
    'Mühürler': re.compile(r"mühür|muhur", re.IGNORECASE),
    'Danışmanlıklar': re.compile(r"danışman|danisman", re.IGNORECASE),
    'Eğitimler': re.compile(r"eğitim|egitim", re.IGNORECASE),
    'Tarot': re.compile(r"tarot", re.IGNORECASE)
}


def infer_category(product: Dict[str, Any]) -> str:
    raw_price = product.get('price')
    numeric_price = None
    if raw_price not in (None, ''):
        cleaned = str(raw_price)
        cleaned = re.sub(r"[^0-9.,]", "", cleaned)
        cleaned = re.sub(r"\.(?=\d{3})", "", cleaned)
        cleaned = cleaned.replace(',', '.')
        try:
            numeric_price = float(cleaned)
        except ValueError:
            numeric_price = None
    zero_price = numeric_price == 0
    no_price = zero_price or numeric_price is None

    name = (product.get('name') or '').lower()
    desc = (product.get('description') or '').lower()

    if zero_price:
        return 'Blog'

    existing = product.get('category')
    if existing and existing not in ('Diğer', ''):
        # Reclass only if Mağaza but clearly stone/jewelry
        if existing == 'Mağaza' and (STONE_PATTERN.search(name) or JEWELRY_PATTERN.search(name)):
            return 'Doğal Taşlar'
        if existing.lower() == 'blog':
            return 'Blog'
        return existing

    is_blog_semantic = any(r.search(name) or r.search(desc) for r in BLOG_SIGNALS)
    date_like = bool(DATE_LIKE.search(name))
    if no_price and (is_blog_semantic or date_like):
        return 'Blog'

    for cat, pat in PRODUCT_KEYWORDS.items():
        if pat.search(name):
            return cat

    if STONE_PATTERN.search(name) or JEWELRY_PATTERN.search(name):
        if no_price and (is_blog_semantic or date_like):
            return 'Blog'
        return 'Doğal Taşlar'

    if no_price:
        return 'Blog'
    return 'Mağaza'


def connect():
    if not Path(SERVICE_ACCOUNT).exists():
        print(f"Service account not found: {SERVICE_ACCOUNT}")
        sys.exit(1)
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def audit():
    db = connect()
    docs = list(db.collection(COLLECTION).stream())
    total = len(docs)
    result = []
    counts_original = {}
    counts_inferred = {}
    mismatches = []
    store_misfits = []
    zero_price_not_blog = []
    blog_with_price = []
    missing_images = []

    for d in docs:
        data = d.to_dict() or {}
        orig_cat = data.get('category') or ''
        inferred = infer_category(data)
        price = data.get('price')
        name = data.get('name') or ''

        counts_original[orig_cat] = counts_original.get(orig_cat, 0) + 1
        counts_inferred[inferred] = counts_inferred.get(inferred, 0) + 1

        mismatch = (orig_cat != '' and orig_cat != inferred)
        if mismatch:
            mismatches.append({'id': d.id, 'name': name, 'original': orig_cat, 'inferred': inferred})

        # Store misfits: original or inferred store but name indicates stone/jewelry
        if inferred == 'Mağaza' and (STONE_PATTERN.search(name.lower()) or JEWELRY_PATTERN.search(name.lower())):
            store_misfits.append({'id': d.id, 'name': name, 'price': price})

        # Normalize numeric price
        numeric_price = None
        if price not in (None, ''):
            cleaned = re.sub(r"[^0-9.,]", "", str(price))
            cleaned = re.sub(r"\.(?=\d{3})", "", cleaned).replace(',', '.')
            try:
                numeric_price = float(cleaned)
            except ValueError:
                pass

        if (numeric_price == 0) and inferred != 'Blog':
            zero_price_not_blog.append({'id': d.id, 'name': name, 'price': price, 'inferred': inferred})
        if inferred == 'Blog' and (numeric_price and numeric_price > 0):
            blog_with_price.append({'id': d.id, 'name': name, 'price': price})

        if not data.get('imageUrl'):
            missing_images.append({'id': d.id, 'name': name, 'inferred': inferred})

        result.append({
            'id': d.id,
            'name': name,
            'originalCategory': orig_cat,
            'inferredCategory': inferred,
            'price': price
        })

    report = {
        'totalDocuments': total,
        'originalCategoryCounts': counts_original,
        'inferredCategoryCounts': counts_inferred,
        'mismatchCount': len(mismatches),
        'mismatches': mismatches[:50],  # limit
        'storeMisfits': store_misfits[:50],
        'zeroPriceNotBlog': zero_price_not_blog[:50],
        'blogWithPrice': blog_with_price[:50],
        'missingImagesCount': len(missing_images),
        'missingImagesSamples': missing_images[:25]
    }

    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    print(f"\nRapor yazıldı: {REPORT_PATH}")


if __name__ == '__main__':
    audit()
