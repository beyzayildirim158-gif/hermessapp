// lib/storageProducts.js
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { parse } from 'papaparse';

/**
 * Firebase Storage'dan bir CSV indirir ve ürün listesi döndürür.
 * Varsayılan yol: 'products/products.csv'
 * CSV başlıkları: name,description,price,imageUrl,categoryId
 */
export async function fetchProductsFromStorage(csvPath = 'products/products.csv') {
  try {
    const storage = getStorage();
    const fileRef = ref(storage, csvPath);
    const url = await getDownloadURL(fileRef);

    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const text = await resp.text();

    // PapaParse ile ayrıştır
    const { data, errors } = parse(text, { header: true, skipEmptyLines: true });
    if (errors?.length) {
      console.log('CSV parse uyarıları:', errors);
    }

    // Tip/boşluk temizliği
    const products = data
      .map((row) => ({
        name: (row.name || '').trim(),
        description: (row.description || '').trim(),
        price: row.price ? Number(String(row.price).replace(',', '.')) : 0,
        imageUrl: (row.imageUrl || '').trim(),
        categoryId: (row.categoryId || '').trim(),
      }))
      .filter(p => p.name); // adı boş olanları at

    return products;
  } catch (err) {
    console.error('Storage CSV okuma hatası:', err);
    return [];
  }
}
