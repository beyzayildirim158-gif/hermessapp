import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity,
    Image,
    LayoutAnimation,
    UIManager,
    Platform,
    Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';

// VERİ DOSYASI IMPORTU
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// 🖼️ GÖRSEL HARİTASI IMPORTU
import { STONE_IMAGE_MAP } from './imagemap'; 
import { analytics } from '../lib/analytics';

const { width } = Dimensions.get('window');

// Yeni mimaride (Fabric) setLayoutAnimationEnabledExperimental no-op uyarısı verdiği için koşullu devre dışı bırakma
if (
    Platform.OS === 'android' &&
    UIManager.setLayoutAnimationEnabledExperimental &&
    !(global?.nativeFabricUIManager) // Fabric aktifse atla
) {
    try {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    } catch (e) {
        // sessiz geç
    }
}

const CATEGORY = { DISEASE: 'hastalık', STONE: 'tas' };

// Tarot ekranı ile aynı mistik arka plan bileşeni
import { MysticBackground, GlassCard } from '../theme/MysticUI';

// Daha Fazla/Daha Az Gösterme İşlevini içerecek şekilde Card bileşenini ayırıyoruz.
const StoneCard = React.memo(({ item, getStoneImageSource, allStoneDiseaseMap }) => {
    // Açıklamayı gösterme/gizleme durumu
    const [isExpanded, setIsExpanded] = useState(false);
    
    // Açıklamayı yönetme fonksiyonu
    const toggleExpansion = () => {
        // LayoutAnimation ile yumuşak geçişi etkinleştiriyoruz
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const next = !isExpanded;
        setIsExpanded(next);
        if (next) analytics.stoneViewed(item.stoneName);
    };

    // Firestore'dan gelen imageUrl varsa onu kullan, yoksa local haritadan al
    const imageSource = item.imageUrl ? { uri: item.imageUrl } : getStoneImageSource(item.stoneName);
    
    // Taşa özel tüm hastalıkları birleştiriyoruz
    const associatedDiseases = allStoneDiseaseMap[item.stoneName] || [];
    const diseaseList = associatedDiseases.join(', ');
    
    // Görünen açıklama: Varsayılan olarak item'ın açıklamasını kullanıyoruz
    const description = item.stoneDescription;

    return (
        <View style={styles.premiumCard}>
            
            {/* Görsel Alanı - BÜYÜTÜLDÜ */}
            <View style={styles.cardImageContainer}>
                {imageSource ? (
                    <Image 
                        source={imageSource}
                        style={styles.cardImage} 
                        resizeMode="cover"
                    />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Ionicons name="sparkles" size={50} color="#D4AF37" />
                        <Text style={styles.placeholderText}>Taş Görseli</Text>
                    </View>
                )}
            </View>

            {/* İçerik Alanı */}
            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.stoneName}</Text>
                
                {/* İlgili Alanlar (Tekil taş seçildiğinde tüm hastalıkları listeler) */}
                <Text style={styles.cardSubtitle}>
                    <Text style={styles.cardSubtitleLabel}>İlgili Alanlar:</Text> {diseaseList}
                </Text>

                {!!description && (
                    <View>
                        <Text 
                            style={styles.cardDescription} 
                            numberOfLines={isExpanded ? undefined : 3} 
                        >
                            {description}
                        </Text>
                        
                        {/* Daha Fazla/Daha Az Oku Butonu */}
                        <TouchableOpacity style={styles.detailsButton} onPress={toggleExpansion}>
                            <Text style={styles.detailsButtonText}>
                                {isExpanded ? 'Daha Az Göster' : 'Daha Fazla Oku'}
                            </Text>
                            <Ionicons 
                                name={isExpanded ? "chevron-up" : "chevron-down"} 
                                size={16} 
                                color="#fff" 
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
});


export default function NaturalStoneGuide() {
    const [selectedCategory, setSelectedCategory] = useState(CATEGORY.DISEASE);
    const [selectedDisease, setSelectedDisease] = useState('');
    const [selectedStone, setSelectedStone] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isResultsVisible, setResultsVisible] = useState(true);
    const [displayResults, setDisplayResults] = useState([]);
    const [stoneRows, setStoneRows] = useState([]);
    const [allDiseases, setAllDiseases] = useState([]);
    const [allStones, setAllStones] = useState([]);
    const [allStoneDiseaseMap, setAllStoneDiseaseMap] = useState({});

    // Firestore'dan taşları çek
    useEffect(() => {
        async function fetchStones() {
            const querySnapshot = await getDocs(collection(db, 'naturalStones'));
            const stones = [];
            querySnapshot.forEach(doc => {
                stones.push(doc.data());
            });
            // rows oluştur
            const rows = stones.map((s, idx) => ({
                disease: s.disease || '',
                stoneName: s.name || '',
                stoneDescription: s.description || '',
                key: `${s.disease || ''}__${s.name || ''}__${idx}`,
            }));
            setStoneRows(rows);
            // Hastalıklar
            const diseasesSet = new Set();
            rows.forEach(r => r.disease && diseasesSet.add(r.disease));
            setAllDiseases(Array.from(diseasesSet).sort((a, b) => a.localeCompare(b, 'tr')));
            // Taşlar
            const stonesSet = new Set();
            rows.forEach(r => r.stoneName && stonesSet.add(r.stoneName));
            setAllStones(Array.from(stonesSet).sort((a, b) => a.localeCompare(b, 'tr')));
            // Taş-hastalık haritası
            const stoneDiseaseMap = {};
            rows.forEach(row => {
                if (!stoneDiseaseMap[row.stoneName]) stoneDiseaseMap[row.stoneName] = [];
                if (row.disease && !stoneDiseaseMap[row.stoneName].includes(row.disease)) {
                    stoneDiseaseMap[row.stoneName].push(row.disease);
                }
            });
            setAllStoneDiseaseMap(stoneDiseaseMap);
        }
        fetchStones();
    }, []);

    // Filtre mantığı
    const filteredRows = useMemo(() => {
        const q = (searchQuery || '').toLowerCase().trim();
        let out = stoneRows;

        if (selectedCategory === CATEGORY.DISEASE) {
            if (selectedDisease) out = out.filter(r => r.disease === selectedDisease);
        } else {
            if (selectedStone) out = out.filter(r => r.stoneName === selectedStone);
        }

        if (q) {
            out = out.filter(r =>
                r.disease.toLowerCase().includes(q) ||
                r.stoneName.toLowerCase().includes(q) ||
                r.stoneDescription.toLowerCase().includes(q)
            );
        }
        return out;
    }, [selectedCategory, selectedDisease, selectedStone, searchQuery, stoneRows]);
    
    // Sonuçları Tekil Hale Getirme
    useEffect(() => {
        const uniqueStones = new Map();
        
        filteredRows.forEach(row => {
            if (!uniqueStones.has(row.stoneName)) {
                uniqueStones.set(row.stoneName, {
                    stoneName: row.stoneName,
                    stoneDescription: row.stoneDescription,
                    key: row.stoneName,
                    disease: row.disease,
                });
            }
        });
        
        setDisplayResults(Array.from(uniqueStones.values()));
    }, [filteredRows]);

    // 💎 LOKAL GÖRSEL YOLU FONKSİYONU
    const getStoneImageSource = useCallback((stoneName) => {
        return STONE_IMAGE_MAP[stoneName] || STONE_IMAGE_MAP.default;
    }, []);

    // Tekil Taş Kartını Render Etme
    const renderItem = ({ item }) => (
        <StoneCard 
            item={item} 
            getStoneImageSource={getStoneImageSource} 
            allStoneDiseaseMap={allStoneDiseaseMap}
        />
    );

    return (
        <MysticBackground>
            <View style={styles.wrap}>
                {/* Premium Başlık */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>💎 Taşların Sırları</Text>
                    <Text style={styles.subtitle}>Kadim şifaların mistik dünyasını keşfedin</Text>
                </View>

                {/* Kategori seçimi */}
                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>✨ Kategori Seçin</Text>
                    <View style={styles.pickerBox}>
                        <Picker
                            selectedValue={selectedCategory}
                            onValueChange={(v) => {
                                setSelectedCategory(v);
                                setSelectedDisease('');
                                setSelectedStone('');
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Hastalığa Göre Ara" value={CATEGORY.DISEASE} />
                            <Picker.Item label="Şifalı Taşa Göre Ara" value={CATEGORY.STONE} />
                        </Picker>
                    </View>
                </View>

                {/* Arama kutusu */}
                <View style={styles.field}>
                    <Text style={styles.fieldLabel}>🔍 Anahtar Kelime Ara</Text>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#D4AF37" style={styles.searchIcon} />
                        <TextInput
                            placeholder="Taş adı, hastalık veya açıklama..."
                            placeholderTextColor="#d8b4fe"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.input}
                        />
                    </View>
                </View>

                {/* Hastalığa göre */}
                {selectedCategory === CATEGORY.DISEASE && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>🏥 Hastalık Seçin</Text>
                        <View style={styles.pickerBox}>
                            <Picker
                                selectedValue={selectedDisease}
                                onValueChange={setSelectedDisease}
                                style={styles.picker}
                            >
                                <Picker.Item label="Tüm Hastalıklar" value="" />
                                {allDiseases.map(d => (
                                    <Picker.Item key={d} label={d} value={d} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                )}

                {/* Taşa göre */}
                {selectedCategory === CATEGORY.STONE && (
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>💎 Şifalı Taş Seçin</Text>
                        <View style={styles.pickerBox}>
                            <Picker
                                selectedValue={selectedStone}
                                onValueChange={setSelectedStone}
                                style={styles.picker}
                            >
                                <Picker.Item label="Tüm Taşlar" value="" />
                                {allStones.map(s => (
                                    <Picker.Item key={s} label={s} value={s} />
                                ))}
                            </Picker>
                        </View>
                    </View>
                )}

                {/* Sonuçlar Toggle Butonu */}
                <TouchableOpacity 
                    onPress={() => setResultsVisible(!isResultsVisible)} 
                    style={styles.resultsToggleButton}
                >
                    <View style={styles.counterContainer}>
                        <Ionicons name="diamond" size={20} color="#D4AF37" />
                        <Text style={styles.counterText}>
                            Bulunan Taşlar ({displayResults.length})
                        </Text>
                    </View>
                    <Ionicons
                        name={isResultsVisible ? "chevron-up" : "chevron-down"}
                        size={24}
                        color="#D4AF37"
                    />
                </TouchableOpacity>

                {/* Sonuç listesi */}
                {isResultsVisible && (
                    <FlatList
                        data={displayResults}
                        keyExtractor={(it) => it.key}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
                        scrollEnabled={false}
                        nestedScrollEnabled
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <Ionicons name="search" size={48} color="#D4AF37" />
                                <Text style={styles.emptyText}>Arama kriterlerinize uygun taş bulunamadı.</Text>
                            </View>
                        }
                    />
                )}
            </View>
        </MysticBackground>
    );
}

const styles = StyleSheet.create({
    // Arka plan artık MysticBackground ile sağlanıyor
    wrap: { 
    flex: 1,
    padding: 10,
    paddingTop: 24,
    },
    headerContainer: {
        backgroundColor: 'rgba(20,15,30,0.65)',
        padding: 16,
        borderRadius: 18,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.55)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
        elevation: 10,
        backdropFilter: 'blur(6px)',
    },
    title: { 
    fontSize: 28, 
    fontWeight: '900', 
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
    fontFamily: 'LeJourSerif',
    },
    subtitle: { 
    color: '#FFFFFF', 
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    fontFamily: 'LeJourSerif',
    },
    field: { 
    marginBottom: 8,
    },
    fieldLabel: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#D4AF37', 
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'LeJourSerif',
    },
    pickerBox: { 
        borderWidth: 1, 
        borderColor: 'rgba(212,175,55,0.45)', 
        borderRadius: 12, 
        overflow: 'hidden',
        backgroundColor: 'rgba(30,22,44,0.65)',
    },
    picker: {
        color: '#FFFFFF',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        borderRadius: 12,
        backgroundColor: 'rgba(30,22,44,0.65)',
        paddingHorizontal: 10,
    },
    searchIcon: {
        marginRight: 8,
    },
    input: { 
    flex: 1,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'LeJourSerif',
    },
    resultsToggleButton: {
        backgroundColor: 'rgba(25,18,35,0.7)', 
        padding: 10,
        borderRadius: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.5)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    counterText: { 
    color: '#D4AF37', 
    fontWeight: '700',
    fontSize: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'LeJourSerif',
    },
    premiumCard: {
        backgroundColor: 'rgba(25,18,35,0.65)',
        borderRadius: 18,
        overflow: 'hidden',
        flexDirection: 'row', 
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        padding: 6,
    },
    cardImageContainer: {
    width: 70,
    height: 70,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 8,
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    placeholderText: {
    color: '#D4AF37',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 8,
    },
    cardContent: {
        flex: 1,
        padding: 12,
    },
    cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#D4AF37',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'LeJourSerif',
    },
    cardSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 18,
    fontFamily: 'LeJourSerif',
    },
    cardSubtitleLabel: {
    fontWeight: '700',
    color: '#D4AF37',
    fontFamily: 'LeJourSerif',
    },
    cardDescription: { 
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 12,
    fontWeight: '500',
    fontFamily: 'LeJourSerif',
    },
    detailsButton: {
    backgroundColor: '#D4AF37',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    detailsButtonText: {
    color: '#1F1233',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'LeJourSerif',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: 'rgba(30,22,44,0.7)',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(212,175,55,0.45)',
        padding: 24,
    },
    emptyText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: 'LeJourSerif',
    }
});