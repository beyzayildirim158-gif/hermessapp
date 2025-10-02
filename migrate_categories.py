import re
import sys
import time
from pathlib import Path
from typing import Dict, Any, Optional

import firebase_admin
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT = 'hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'
COLLECTION = 'products'
BATCH_SIZE = 400  # Firestore max 500; leave headroom
DRY_RUN = '--apply' not in sys.argv

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

CLASSIFICATION_VERSION = 1


def normalize_price(raw) -> Optional[float]:
    if raw in (None, ''):
        return None
    s = str(raw)
    s = re.sub(r"[^0-9.,]", "", s)
    s = re.sub(r"\.(?=\d{3})", "", s)  # remove thousands dot
    s = s.replace(',', '.')
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def infer_category(product: Dict[str, Any]) -> str:
    price_value = normalize_price(product.get('price'))
    zero_price = price_value == 0
    no_price = zero_price or price_value is None
    name = (product.get('name') or '').lower()
    desc = (product.get('description') or '').lower()

    if zero_price:
        return 'Blog'

    existing = product.get('category')
    if existing and existing not in ('Diğer', ''):
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
    cred_path = Path(SERVICE_ACCOUNT)
    if not cred_path.exists():
        print(f"Service account not found: {cred_path}")
        sys.exit(1)
    cred = credentials.Certificate(str(cred_path))
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def main():
    db = connect()
    docs = list(db.collection(COLLECTION).stream())
    print(f"Toplam doküman: {len(docs)}")

    updates = []
    for d in docs:
        data = d.to_dict() or {}
        inferred = infer_category(data)
        price_value = normalize_price(data.get('price'))

        # Determine type
        doc_type = 'blog' if inferred == 'Blog' else 'product'

        # Skip if already normalized with same version and no change
        existing_version = data.get('classificationVersion')
        existing_cat = data.get('category')
        existing_type = data.get('type')
        existing_price_value = data.get('priceValue')

        needs_update = False
        payload = {}

        if existing_cat != inferred:
            # backup original category once
            if 'originalCategoryBackup' not in data and existing_cat:
                payload['originalCategoryBackup'] = existing_cat
            payload['category'] = inferred
            needs_update = True

        if existing_type != doc_type:
            payload['type'] = doc_type
            needs_update = True

        if price_value is not None and price_value != existing_price_value:
            payload['priceValue'] = price_value
            needs_update = True

        if existing_version != CLASSIFICATION_VERSION:
            payload['classificationVersion'] = CLASSIFICATION_VERSION
            needs_update = True

        if needs_update:
            updates.append((d.id, payload))

    print(f"Güncellenecek doküman sayısı: {len(updates)}")
    if DRY_RUN:
        print("DRY RUN (öngörülen değişiklikler): ilk 20 örnek")
        for i, (doc_id, payload) in enumerate(updates[:20]):
            print(doc_id, payload)
        print("-- Uygulamak için scripti --apply parametresiyle çalıştırın.")
        return

    batch = db.batch()
    written = 0
    for idx, (doc_id, payload) in enumerate(updates, 1):
        ref = db.collection(COLLECTION).document(doc_id)
        batch.set(ref, payload, merge=True)
        if idx % BATCH_SIZE == 0:
            batch.commit()
            written += BATCH_SIZE
            print(f"{written} kayıt commitlendi...")
            time.sleep(0.5)
            batch = db.batch()
    if (len(updates) % BATCH_SIZE) != 0:
        batch.commit()
        written += len(updates) % BATCH_SIZE

    print(f"Tamamlandı. Yazılan: {written}")


if __name__ == '__main__':
    main()
