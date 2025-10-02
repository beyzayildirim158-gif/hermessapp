import re
import sys
import json
import argparse
import unicodedata
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, firestore

SERVICE_ACCOUNT = 'hermessapp-5b6ec-firebase-adminsdk-fbsvc-bf04f7a56d.json'
COLLECTION = 'products'

CATEGORIES = [
    'Doğal Taşlar', 'Mühürler', 'Danışmanlıklar', 'Eğitimler', 'Tarot', 'Mağaza', 'Diğer'
]

# Precompile regex patterns per category (handles separators / parentheses)
CATEGORY_PATTERNS = {
    cat: re.compile(
        rf"(?:\s*(?:-|–|—|:|•)\s*)?(?:\(|\[)?\b{re.escape(cat)}\b(?:\)|\])?\s*$",
        re.IGNORECASE
    ) for cat in CATEGORIES
}

# Utility: normalize string for safer comparison

def normalize(s: str) -> str:
    s = unicodedata.normalize('NFKD', s)
    s = ''.join(ch for ch in s if not unicodedata.combining(ch))
    return s.lower().strip()


def needs_strip(name: str, category: str) -> bool:
    if not name or not category:
        return False
    pat = CATEGORY_PATTERNS.get(category)
    if not pat:
        return False
    return bool(pat.search(name))


def strip_category(name: str, category: str) -> str:
    pat = CATEGORY_PATTERNS.get(category)
    if not pat:
        return name
    new_name = pat.sub('', name).rstrip(' -–—:•')
    # Collapse double spaces
    new_name = re.sub(r'\s{2,}', ' ', new_name).strip()
    # Safety: ensure something meaningful remains
    if len(new_name) < 4:
        return name  # revert, too aggressive
    # Avoid leaving a trailing unmatched opening bracket
    if new_name.endswith('(') or new_name.endswith('['):
        return name
    return new_name


def connect():
    if not Path(SERVICE_ACCOUNT).exists():
        print(f"Hizmet hesabı JSON bulunamadı: {SERVICE_ACCOUNT}")
        sys.exit(1)
    cred = credentials.Certificate(SERVICE_ACCOUNT)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
    return firestore.client()


def process(dry_run: bool, limit: int | None):
    db = connect()
    col_ref = db.collection(COLLECTION)
    docs = col_ref.stream()

    updates = []
    total = 0
    changed = 0

    for doc in docs:
        total += 1
        data = doc.to_dict() or {}
        name = data.get('name')
        category = data.get('category') or ''
        if not isinstance(name, str):
            continue
        if not isinstance(category, str):
            category = ''
        if category not in CATEGORIES:
            # attempt inferred match if trailing category exists
            for cat in CATEGORIES:
                if needs_strip(name, cat):
                    category = cat
                    break
        if not category:
            continue
        if not needs_strip(name, category):
            continue
        new_name = strip_category(name, category)
        if new_name != name:
            changed += 1
            updates.append({
                'doc_id': doc.id,
                'old': name,
                'new': new_name,
                'category': category
            })
            if not dry_run:
                col_ref.document(doc.id).update({
                    'name': new_name,
                    'originalName': name  # keep trace
                })
            if limit and changed >= limit:
                break

    report = {
        'totalDocs': total,
        'candidates': changed,
        'applied': 0 if dry_run else changed,
        'dryRun': dry_run,
        'samples': updates[:25],
    }
    with open('product_title_cleanup_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(json.dumps(report, ensure_ascii=False, indent=2))
    if dry_run:
        print('\nDRY-RUN tamamlandı. Gerçek güncelleme için --apply parametresi ekleyin.')
    else:
        print('\nGüncellemeler uygulandı.')


def main():
    parser = argparse.ArgumentParser(description='Ürün başlıklarından sonda yinelenen kategori isimlerini temizler.')
    parser.add_argument('--apply', action='store_true', help='Gerçek güncelleme uygula (varsayılan dry-run).')
    parser.add_argument('--limit', type=int, help='İlk N değişiklikle sınırla (test amaçlı).')
    args = parser.parse_args()
    process(dry_run=not args.apply, limit=args.limit)

if __name__ == '__main__':
    main()
