import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { colors as MColors } from '../theme/mysticTheme';
import { MysticBackground, GlassCard } from '../theme/MysticUI';
import { db } from '../lib/firebase';
import { collection, query, where, getCountFromServer, Timestamp, getDocs, orderBy, limit } from 'firebase/firestore';

const EVENT_KEYS = [
  { key: 'tarot_intention_submitted', label: 'Tarot Niyet' },
  { key: 'tarot_reading_completed', label: 'Tarot Tamamlandı' },
  { key: 'stone_viewed', label: 'Taş Görüntüleme' },
  { key: 'numerology_requested', label: 'Numeroloji İstek' },
  { key: 'numerology_result', label: 'Numeroloji Sonuç' },
];

const RANGES = [
  { id: '24h', label: '24 Saat', hours: 24 },
  { id: '7d', label: '7 Gün', hours: 24 * 7 },
  { id: '30d', label: '30 Gün', hours: 24 * 30 },
];

export default function AnalyticsScreen() {
  const [range, setRange] = useState(RANGES[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [topStones, setTopStones] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const out = {};
    try {
      const now = new Date();
      const from = new Date(now.getTime() - range.hours * 60 * 60 * 1000);
      const fromTs = Timestamp.fromDate(from);

      await Promise.all(
        EVENT_KEYS.map(async (ev) => {
          try {
            const q = query(
              collection(db, 'app_events'),
              where('event', '==', ev.key),
              where('ts', '>=', fromTs)
            );
            const snap = await getCountFromServer(q);
            out[ev.key] = snap.data().count || 0;
          } catch (e) {
            out[ev.key] = 0;
            if (__DEV__) console.warn('Count error', ev.key, e.message);
          }
        })
      );
      // Top 10 stones (independent of range for now)
      try {
        const stonesRef = collection(db, 'stone_aggregate');
        const qs = query(stonesRef, orderBy('count', 'desc'), limit(10));
        const snap = await getDocs(qs);
        setTopStones(snap.docs.map(d => ({ name: d.id, count: d.data().count || 0 })));
      } catch (e) {
        if (__DEV__) console.warn('Top stones error', e.message);
      }
      setData(out);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <MysticBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Analitik Özeti</Text>
        <View style={styles.rangeRow}>
          {RANGES.map(r => (
            <TouchableOpacity
              key={r.id}
              style={[styles.rangeBtn, r.id === range.id && styles.rangeBtnActive]}
              onPress={() => setRange(r)}
              disabled={loading}
            >
              <Text style={[styles.rangeText, r.id === range.id && styles.rangeTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.refreshBtn} onPress={load} disabled={loading}>
            <Text style={styles.refreshText}>{loading ? '...' : '↻'}</Text>
          </TouchableOpacity>
        </View>

        {error && (
          <Text style={styles.error}>{error}</Text>
        )}

        {EVENT_KEYS.map(ev => (
          <GlassCard key={ev.key} padding={8} style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>{ev.label}</Text>
              {loading ? (
                <ActivityIndicator size="small" color={MColors.accent} />
              ) : (
                <Text style={styles.cardValue}>{data[ev.key] ?? 0}</Text>
              )}
            </View>
          </GlassCard>
        ))}

        <GlassCard padding={10} style={styles.metaCard}>
          <Text style={styles.metaTitle}>En Çok Görüntülenen Taşlar</Text>
          {topStones.length === 0 && !loading && (
            <Text style={styles.metaLine}>Veri yok</Text>
          )}
          {loading && topStones.length === 0 && (
            <ActivityIndicator size="small" color={MColors.accent} />
          )}
          {topStones.map((s, idx) => (
            <View key={s.name} style={styles.cardRow}>
              <Text style={styles.cardLabel}>{idx + 1}. {s.name}</Text>
              <Text style={styles.cardValue}>{s.count}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard padding={10} style={styles.metaCard}>
          <Text style={styles.metaTitle}>Detaylar</Text>
          <Text style={styles.metaLine}>Aralık: Son {range.label}</Text>
          <Text style={styles.metaLine}>Güncellenme: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</Text>
          <Text style={styles.metaHint}>Daha gelişmiş segmentasyon için BigQuery export veya Cloud Function ekleyebiliriz.</Text>
        </GlassCard>
      </ScrollView>
    </MysticBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: MColors.accent,
    marginBottom: 20,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  rangeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)'
  },
  rangeBtnActive: {
    backgroundColor: MColors.accent,
    borderColor: MColors.accent,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '600',
    color: MColors.textSecondary
  },
  rangeTextActive: {
    color: '#1A1325'
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)'
  },
  refreshText: {
    color: MColors.accent,
    fontSize: 16,
    fontWeight: '700'
  },
  card: {
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MColors.textSecondary
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: MColors.accent
  },
  metaCard: {
    marginTop: 20
  },
  metaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: MColors.accent,
    marginBottom: 8
  },
  metaLine: {
    fontSize: 12,
    color: MColors.textSecondary,
    marginBottom: 4
  },
  metaHint: {
    fontSize: 11,
    color: MColors.textMuted,
    marginTop: 4
  },
  error: {
    color: '#ff6b6b',
    marginBottom: 12,
    fontSize: 13,
    fontWeight: '600'
  }
});
