import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { collection, addDoc } from "firebase/firestore";
import { db } from '../lib/firebase';
import * as FileSystem from 'expo-file-system';

// CSV dosyasından beklenen başlıklar (headers).
const expectedHeaders = ['name', 'price', 'description', 'imageUrl', 'categoryId'];

function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('CSV dosyası boş.');
  }

  const headers = lines[0].split(',').map(header => header.trim());
  
  // Validate headers
  const missingHeaders = expectedHeaders.filter(header => !headers.includes(header));
  if (missingHeaders.length > 0) {
    throw new Error(`CSV dosyasında şu başlıklar eksik: ${missingHeaders.join(', ')}`);
  }
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) {
      continue; // Skip malformed lines
    }
    const row = {};
    headers.forEach((header, index) => {
      let value = values[index].trim();
      if (header === 'price') {
        value = parseFloat(value);
      }
      row[header] = value;
    });
    data.push(row);
  }
  return data;
}

const CSVUploader = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  // Bu fonksiyon, dosya seçme işlemini ve veriyi Firestore'a yükleme mantığını içerir.
  // Bu örnek için sabit bir veri kullanılıyor. Kendi dosya seçme mantığınızı buraya eklemelisiniz.
  const handleUpload = async () => {
    // Gerçek bir uygulamada, burada DocumentPicker.getDocumentAsync() kullanmalısınız.
    // Örnek amaçlı statik bir CSV metni kullanılmıştır.
    const sampleCSV = `name,price,description,imageUrl,categoryId
    Ametist Taşı,250.50,Mor renkli bir kuvars türüdür.,https://example.com/images/ametist.jpg,kategori_1
    Pembe Kuvars,180.00,Aşk taşı olarak bilinir.,https://example.com/images/pembe_kuvars.jpg,kategori_1
    Obsidyen Taşı,120.75,Volkanik camdan oluşan güçlü bir taştır.,https://example.com/images/obsidyen.jpg,kategori_2
    Kaplan Gözü,95.00,Cesaret ve güç taşıdır.,https://example.com/images/kaplan_gozu.jpg,kategori_2
    `;

    setLoading(true);
    setMessage('');
    setError(false);

    try {
      const products = parseCSV(sampleCSV);

      if (products.length === 0) {
        setMessage('CSV dosyasında yüklenecek ürün bulunmuyor.');
        setLoading(false);
        return;
      }

      for (const product of products) {
        await addDoc(collection(db, 'products'), product);
      }

      setMessage(`Başarıyla ${products.length} ürün yüklendi!`);
    } catch (e) {
      console.error("Ürün yüklenirken bir hata oluştu: ", e);
      setMessage(`Yükleme sırasında bir hata oluştu: ${e.message}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>CSV ile Ürün Yükle</Text>
      <Text style={styles.subHeader}>
        Dosyanızın "name", "price", "description", "imageUrl" ve "categoryId" 
        başlıklarını içerdiğinden emin olun.
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={handleUpload}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Yüklemeyi Başlat</Text>
        )}
      </TouchableOpacity>
      {message ? (
        <Text style={[styles.message, error ? styles.errorMessage : styles.successMessage]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#343a40',
  },
  subHeader: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6C47FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    marginTop: 15,
    padding: 10,
    borderRadius: 8,
    width: '100%',
    textAlign: 'center',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
  },
});

export default CSVUploader;
