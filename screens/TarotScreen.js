import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  Image, Animated, Easing, Dimensions, StatusBar
} from 'react-native';
// Mistik Tema
import { colors as MColors } from '../theme/mysticTheme';
import { MysticBackground, GlassCard, GradientButton } from '../theme/MysticUI';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import deck from '../data/tarotDeck.tr';
import { analytics } from '../lib/analytics';
import images from '../data/Tarotimages.map';

const { width, height } = Dimensions.get('window');

const AI_ENDPOINT = 'https://europe-central2-hermessapp-5b6ec.cloudfunctions.net/tarotreading';

const imgMap = images || {};
const CARD_BACK = require('../assets/tarot/back.png');
// Daha canlı mor arkaplan
const MYSTICAL_PURPLE_BG = 'https://images.unsplash.com/photo-1614854262318-831574f15f1f?q=80&w=2070&auto=format&fit=crop';

async function fetchGeminiReading({ intention, cards }) {
  const payload = {
    intention,
    cards: cards.map(c => ({
      name: c.name,
      arcana: c.arcana || (c.suit ? 'minor' : 'major'),
      suit: c.suit ?? null,
      position: 'upright', // Sadece düz pozisyon
      keywords: c.keywords ?? null,
    })),
  };

  try {
    const r = await fetch(AI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });

    let j = {};
    try { j = await r.json(); } catch {}
    
    if (!r.ok) {
      const errorMsg = j?.error || `AI HTTP ${r.status}`;
      throw new Error(`Servis hatası: ${errorMsg}`);
    }
    return (j.reading || '').replace(/\*\*/g, '');
  } catch (e) {
    throw new Error('Yorum servisi şu anda çalışmıyor. Lütfen daha sonra tekrar deneyin.');
  }
}

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function labelForThree(i) {
  return ['Geçmiş', 'Şimdi', 'Gelecek'][i] || `Kart ${i + 1}`;
}

// Gerçekçi karıştırma animasyonu bileşeni
const RealisticShuffleAnimation = ({ isShuffling, children }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const liftAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isShuffling) {
      // İskambil destesi gibi karıştırma animasyonu
      Animated.sequence([
        // Hafif kaldırma
        Animated.timing(liftAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        // Sallama serisi (gerçek karıştırma hissi)
        Animated.timing(shakeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0.5,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -0.5,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 60,
          useNativeDriver: true,
        }),
        // Yere indirme
        Animated.timing(liftAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      shakeAnim.setValue(0);
      liftAnim.setValue(0);
    }
  }, [isShuffling]);

  const shakeTranslate = shakeAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: [-15, 0, 15],
  });

  const liftTranslate = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const shadowOpacity = liftAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View style={{
      transform: [
        { translateX: shakeTranslate },
        { translateY: liftTranslate }
      ],
      shadowOpacity: shadowOpacity,
      shadowRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      elevation: 8,
    }}>
      {children}
    </Animated.View>
  );
};

// Kart yelpazesi bileşeni - daha gerçekçi
const CardFan = ({ cardCount, isShuffling }) => {
  const FAN_SIZE = Math.min(6, cardCount);
  const fanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isShuffling) {
      // Karıştırma sırasında kartların hafifçe dağılması
      Animated.sequence([
        Animated.timing(fanAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fanAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isShuffling]);

  const fanSpread = fanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 60], // Yelpaze genişliği
  });

  return (
    <View style={{ height: 160, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={{
        flexDirection: 'row',
        transform: [{ translateX: fanAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -10]
        }) }]
      }}>
        {[...Array(FAN_SIZE)].map((_, i) => {
          const t = i / (FAN_SIZE - 1 || 1);
          const rot = (t - 0.5) * 8; // Daha az dönüş
          const off = (t - 0.5) * 25; // Daha az kayma
          
          return (
            <Animated.Image
              key={i}
              source={CARD_BACK}
              style={[
                styles.deckCard,
                {
                  transform: [
                    { rotate: `${rot}deg` },
                    { translateX: off },
                    { 
                      translateY: fanAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, i % 2 === 0 ? -5 : 5]
                      })
                    }
                  ],
                  zIndex: FAN_SIZE - i,
                  opacity: cardCount > 0 ? 1 - (i * 0.15) : 0.4,
                  marginLeft: i === 0 ? 0 : -40, // Kartların üst üste binmesi
                },
              ]}
              resizeMode="cover"
            />
          );
        })}
      </Animated.View>
      
      {cardCount === 0 && (
        <Text style={styles.emptyDeckText}>Deste boş</Text>
      )}
      
      {/* Kart sayısı göstergesi */}
      <View style={styles.cardCountBadge}>
        <Text style={styles.cardCountText}>{cardCount} kart</Text>
      </View>
    </View>
  );
};
export default function TarotScreen() {
  const [intention, setIntention] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiError, setAiError] = useState('');

  const [targetCount, setTargetCount] = useState(0);
  const [pool, setPool] = useState([]);
  const [picked, setPicked] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [isShuffling, setIsShuffling] = useState(false);

  const flipAnimsRef = useRef([]);
  const scaleAnimsRef = useRef([]);
  const auraPulseRefs = useRef([]); // Seçili kart için aura/pulse animasyonu
  const smokeAnim = useRef(new Animated.Value(0)).current;

  const smokeOpacity = smokeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.8] });
  const showSmoke = aiLoading;

  const startSelection = (count) => {
    setTargetCount(count);
    setAiText('');
    setAiError('');
    setSelectedIdx(-1);
    setPicked([]);
    setRevealed([]);
    setPool(shuffle(deck));
    flipAnimsRef.current = [];
    scaleAnimsRef.current = [];
  };

  const onShuffleDeck = () => {
    if (pool.length === 0) {
      setPool(shuffle(deck));
      return;
    }

    setIsShuffling(true);
    
    // Karıştırma animasyonu tamamlandıktan sonra deste yenilenir
    setTimeout(() => {
      setPool(shuffle(pool));
      setIsShuffling(false);
    }, 1200); // Animasyon süresiyle eşleşmeli
  };

  const onDrawFromDeck = () => {
    if (!targetCount || picked.length >= targetCount || pool.length === 0) return;
    
    const [top, ...rest] = pool;
    setPool(rest);
    
    const card = { 
      ...top, 
      isReversed: false, // Sadece düz pozisyon
      id: `${top.id}_${Date.now()}`
    };
    
    const newIdx = picked.length;
    flipAnimsRef.current[newIdx] = new Animated.Value(0);
    scaleAnimsRef.current[newIdx] = new Animated.Value(1);

    setPicked((prev) => [...prev, card]);
    setRevealed((prev) => [...prev, false]);
  };

  const onReveal = (idx) => {
    if (!picked[idx] || revealed[idx]) return;
    
    setSelectedIdx(idx);

    if (!flipAnimsRef.current[idx]) {
      flipAnimsRef.current[idx] = new Animated.Value(0);
    }
    if (!scaleAnimsRef.current[idx]) {
      scaleAnimsRef.current[idx] = new Animated.Value(1);
    }
    if (!auraPulseRefs.current[idx]) {
      auraPulseRefs.current[idx] = new Animated.Value(0);
    }

    const flip = flipAnimsRef.current[idx];
    const scale = scaleAnimsRef.current[idx];
    const aura = auraPulseRefs.current[idx];

    Animated.parallel([
      Animated.timing(flip, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Aura için sürekli nabız animasyonu
    Animated.loop(
      Animated.sequence([
        Animated.timing(aura, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(aura, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    setRevealed((prev) => {
      const newRevealed = [...prev];
      newRevealed[idx] = true;
      return newRevealed;
    });
  };

  const revealedCards = useMemo(
    () => picked.filter((_, i) => revealed[i]),
    [picked, revealed]
  );

  const finalReading = aiText.trim();
  const selectedText = (() => {
    const c = picked[selectedIdx] || {};
    return c.upright || c.meaningUpright || c.descUpright || '';
  })();

  useEffect(() => {
    if (aiLoading) {
      Animated.timing(smokeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    } else if (aiText) {
      Animated.timing(smokeAnim, {
        toValue: 0,
        duration: 2000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [aiLoading, aiText]);

  return (
    <MysticBackground>
      <StatusBar backgroundColor={MColors.bgDark} barStyle="light-content" />
  <ScrollView style={styles.wrap} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>

        <GlassCard padding={5} style={{ marginBottom:16 }}>
          <Text style={styles.titlePremium}>🔮 Hermess Tarot Rehberi</Text>
          <Text style={[styles.captionPremium,{color:MColors.textSecondary}]}>Niyetini belirle, kartları seç ve kadim sembollerin fısıldadıklarını dinle.</Text>
        </GlassCard>

        {/* Niyet Alanı */}
        <GlassCard padding={5} style={{ marginBottom:24 }}>
          <Text style={styles.labelPremium}>✨ Niyetin</Text>
          <TextInput
            placeholder="Kalbinin en derin niyetini yaz... Hermess'e ne sormak istiyorsun?"
            placeholderTextColor={MColors.textMuted}
            value={intention}
            onChangeText={setIntention}
            multiline
            style={[styles.inputPremium,{borderColor:MColors.accent, color:MColors.textPrimary}]}
          />
        </GlassCard>

        {/* Kart sayısı seçimi */}
  <View style={styles.rowPremium}>
          <TouchableOpacity
            style={[styles.btnPremium, { backgroundColor: targetCount === 1 ? '#D4AF37' : '#B8860B' }]}
            onPress={() => startSelection(1)}
          >
            <Ionicons name="sparkles-outline" size={18} color={targetCount === 1 ? '#1F1233' : '#2d1a40'} />
            <Text style={styles.btnTextPremium}>Tek Kart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPremium, { backgroundColor: targetCount === 3 ? '#D4AF37' : '#B8860B' }]}
            onPress={() => startSelection(3)}
          >
            <Ionicons name="layers-outline" size={18} color={targetCount === 3 ? '#1F1233' : '#2d1a40'} />
            <Text style={styles.btnTextPremium}>3 Kart (G/Ş/G)</Text>
          </TouchableOpacity>
        </View>

        {/* Deste Alanı */}
        {targetCount > 0 && (
          <GlassCard padding={5} style={{ marginTop:24 }}>
            <Text style={styles.subTitlePremium}>Kartlar</Text>
            <View style={{ alignItems:'center' }}>
              <RealisticShuffleAnimation isShuffling={isShuffling}>
                <CardFan cardCount={pool.length} isShuffling={isShuffling} />
              </RealisticShuffleAnimation>

              {/* Aksiyon Butonları */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { 
                    backgroundColor: isShuffling ? '#FFD700' : '#FFD700' 
                  }]} 
                  onPress={onShuffleDeck}
                  disabled={isShuffling}
                >
                  <Ionicons 
                    name={isShuffling ? "sync" : "shuffle-outline"} 
                    size={18} 
                    color="#6C47FF" 
                  />
                  <Text style={styles.actionBtnText}>
                    {isShuffling ? 'Karıştırılıyor...' : 'Desteyi Karıştır'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { 
                    backgroundColor: picked.length < targetCount && pool.length > 0 ? '#D4AF37' : '#B8860B' 
                  }]}
                  onPress={onDrawFromDeck}
                  disabled={picked.length >= targetCount || pool.length === 0}
                >
                  <Ionicons name="card-outline" size={18} color="#6C47FF" />
                  <Text style={styles.actionBtnText}>
                    {picked.length < targetCount ? 'Kart Çek' : 'Seçim Tamam'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.selectionInfoPremium,{color:MColors.accent}] }>
                {picked.length}/{targetCount} kart seçildi • {pool.length} kart kaldı
              </Text>
            </View>
          </GlassCard>
        )}

        {/* Seçilen Kartlar */}
        {picked.length > 0 && (
          <View style={{ marginTop: 32 }}>
            <Text style={styles.subTitlePremium}>
              {targetCount === 3 ? 'Geçmiş - Şimdi - Gelecek' : 'Seçilen Kart'}
            </Text>

            <View style={styles.cardsRowPremium}>
              {picked.map((c, i) => {
                const flip = flipAnimsRef.current[i] || new Animated.Value(0);
                const scale = scaleAnimsRef.current[i] || new Animated.Value(1);
                const aura = auraPulseRefs.current[i] || new Animated.Value(0);
                
                const rotateY = flip.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: ['0deg', '180deg'] 
                });
                
                const frontOpacity = flip.interpolate({ 
                  inputRange: [0, 0.5, 1], 
                  outputRange: [0, 0, 1] 
                });
                
                const backOpacity = flip.interpolate({ 
                  inputRange: [0, 0.5, 1], 
                  outputRange: [1, 1, 0] 
                });

                const isSelected = selectedIdx === i && revealed[i];
                const auraOpacity = aura.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.85] });
                const auraScale = aura.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });

                return (
                  <View key={c.id} style={styles.cardColPremium}>
                    {targetCount === 3 && (
                      <Text style={styles.posLabel}>{labelForThree(i)}</Text>
                    )}
                    <View style={styles.cardAuraContainer}>
                      {isSelected && (
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.auraWrapper,
                            {
                              opacity: auraOpacity,
                              transform: [{ scale: auraScale }],
                            },
                          ]}
                        >
                          <LinearGradient
                            colors={[
                              'rgba(255,215,0,0)',
                              'rgba(255,215,0,0.25)',
                              'rgba(108,71,255,0.35)',
                              'rgba(108,71,255,0.0)'
                            ]}
                            style={styles.auraGradient}
                            locations={[0, 0.35, 0.7, 1]}
                          />
                        </Animated.View>
                      )}
                      <TouchableOpacity
                        activeOpacity={0.95}
                        onPress={() => onReveal(i)}
                        disabled={revealed[i]}
                      >
                        <Animated.View
                          style={[
                            styles.cardShellPremium,
                            isSelected && styles.cardShellSelected,
                            {
                              transform: [
                                { perspective: 1000 },
                                { rotateY },
                                { scale },
                              ],
                            },
                          ]}
                        >
                          {/* Kart Arka Yüzü */}
                          <Animated.View
                            style={[styles.face, styles.absoluteFill, { opacity: backOpacity }]}
                          >
                            <Image
                              source={CARD_BACK}
                              style={styles.cardImgPremium}
                              resizeMode="cover"
                            />
                          </Animated.View>

                          {/* Kart Ön Yüzü - SADECE DÜZ POZİSYON */}
                          <Animated.View
                            style={[styles.face, styles.absoluteFill, { opacity: frontOpacity }]}
                          >
                            {imgMap[c.imageKey] ? (
                              <Image
                                source={imgMap[c.imageKey]}
                                style={styles.cardImgPremium}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.cardImgPremium, styles.placeholderPremium]}>
                                <Ionicons name="card-outline" size={32} color="#FFD700" />
                                <Text style={styles.placeholderTextPremium}>{c.name}</Text>
                              </View>
                            )}
                          </Animated.View>
                        </Animated.View>
                      </TouchableOpacity>
                    </View>
                    
                    {!revealed[i] && (
                      <Text style={styles.tapToRevealPremium}>👆 Açmak için dokun</Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Seçili kart detayları - TERS/DÜZ GÖSTERGESİ KALDIRILDI */}
            {selectedIdx >= 0 && revealed[selectedIdx] && (
              <GlassCard padding={5} style={{ marginBottom:8 }}>
                <Text style={styles.detailTitlePremium}>{picked[selectedIdx].name}</Text>

                {selectedText ? (
                  <Text style={styles.detailTextPremium}>{selectedText}</Text>
                ) : (
                  <Text style={styles.noDescriptionPremium}>Bu kart için açıklama bulunmuyor</Text>
                )}

                {/* AI butonu */}
                {revealedCards.length > 0 && (
                  <View style={{ marginTop: 20 }}>
                    <GradientButton
                      title={aiLoading ? 'Yorum hazırlanıyor…' : 'Hermess Yorumu Al'}
                      onPress={async () => {
                        try {
                          setAiLoading(true);
                          setAiError('');
                          // Log reading start (intention submitted)
                          analytics.tarotIntention(intention, revealedCards.length);
                          const txt = await fetchGeminiReading({ intention, cards: revealedCards });
                          // Log reading completed
                          analytics.tarotReadingCompleted(intention, revealedCards.length);
                          setAiText(txt);
                        } catch (e) {
                          setAiError(String(e?.message || e));
                          setAiText('');
                        } finally {
                          setAiLoading(false);
                        }
                      }}
                      disabled={aiLoading}
                      icon={<Ionicons name={aiLoading ? 'hourglass-outline' : 'sparkles-outline'} size={20} color={MColors.accent} />}
                      colorsOverride={['#2E2152','#4A2F85']}
                      style={{ borderRadius:30, borderWidth:1, borderColor:'rgba(255,255,255,0.2)' }}
                    />
                    {aiError && (
                      <Text style={styles.errorTextPremium}>{aiError}</Text>
                    )}
                  </View>
                )}
              </GlassCard>
            )}
          </View>
        )}

        {/* AI Yorum Kutusu */}
        {aiText && (
          <GlassCard padding={5} style={{ marginTop:28 }}>
            <View style={styles.readingHeaderPremium}>
              <Ionicons name="sparkles" size={22} color={MColors.accent} />
              <Text style={styles.readingTitlePremium}>Hermess Yorumu</Text>
            </View>
            <Text style={styles.readingPremium}>{finalReading}</Text>
          </GlassCard>
        )}
        <Text style={styles.footnotePremium}>
          * Bu açılım kısa ve hızlı bir rehberlik aracıdır. Profesyonel danışmanlığın yerini tutmaz.
        </Text>
      </ScrollView>

      {/* Yükleniyor efekti */}
      {showSmoke && (
        <Animated.View style={[styles.smokeOverlayPremium, { opacity: smokeOpacity }]}> 
          <View style={styles.smokeContentPremium}>
            <Ionicons name="infinite" size={54} color={MColors.accent} />
            <Text style={styles.smokeTextPremium}>Kartların sırları çözülüyor...</Text>
          </View>
        </Animated.View>
      )}
    </MysticBackground>
  );
}

const styles = StyleSheet.create({
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
    marginBottom: 10,
    marginTop: 10,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderWidth: 2,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  premiumText: {
  color: '#D4AF37',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
    fontFamily: 'le jour serif',
    textShadowColor: '#6C47FF',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
  },
  headerContainerPremium: {
    backgroundColor: 'rgba(108, 71, 255, 0.95)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 3,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 10,
  },
  titlePremium: {
    fontSize: 22,
    fontWeight: '900',
  color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'le jour serif',
    letterSpacing: 3,
  },
  captionPremium: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '700',
    fontFamily: 'le jour serif',
    letterSpacing: 1.5,
  },
  intentionContainerPremium: {
    backgroundColor: 'rgba(108, 71, 255, 0.92)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 3,
  borderColor: '#D4AF37',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 12,
  },
  labelPremium: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 14,
    fontFamily: 'le jour serif',
    letterSpacing: 2,
  },
  inputPremium: {
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 18,
    padding: 18,
    minHeight: 110,
    textAlignVertical: 'top',
    backgroundColor: 'rgba(255, 255, 255, 0.13)',
    fontSize: 17,
    lineHeight: 24,
    color: '#FFFFFF',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  rowPremium: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  btnPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 2,
  borderColor: '#D4AF37',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnTextPremium: {
    fontWeight: '900',
    fontSize: 12,
    fontFamily: 'le jour serif',
    letterSpacing: 1,
    color: '#6C47FF',
    textAlign: 'center',
    width: '100%',
  },
  deckWrapPremium: {
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 24,
    backgroundColor: 'rgba(108, 71, 255, 0.92)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 18,
  },
  selectionInfoPremium: {
    marginTop: 14,
  color: '#D4AF37',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '700',
  },
  subTitlePremium: {
    fontSize: 22,
    fontWeight: '900',
  color: '#D4AF37',
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: 'le jour serif',
    letterSpacing: 2,
  },
  cardsRowPremium: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 20,
    marginBottom: 28,
  },
  cardColPremium: {
    alignItems: 'center',
    flex: 1,
  },
  cardShellPremium: {
    width: 165,
    height: 265,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 3,
  borderColor: '#D4AF37',
    backgroundColor: 'rgba(108, 71, 255, 0.97)',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
  },
  cardShellSelected: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.95,
    shadowRadius: 28,
    borderColor: '#FFFFFF',
  },
  cardAuraContainer: {
    width: 185, // aura payı
    height: 285,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  auraGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    transform: [{ scale: 1 }],
  },
  cardImgPremium: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 2,
  borderColor: '#D4AF37',
  },
  placeholderPremium: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(108, 71, 255, 0.8)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  placeholderTextPremium: {
    color: '#FFD700',
    fontWeight: '700',
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center',
  },
  tapToRevealPremium: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
    fontWeight: '700',
  },
  detailBoxPremium: {
    marginTop: 24,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 20,
    padding: 24,
  backgroundColor: 'rgba(108, 71, 255, 0.97)',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
  },
  detailTitlePremium: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    marginBottom: 14,
    fontFamily: 'le jour serif',
    letterSpacing: 2,
  },
  detailTextPremium: {
    color: '#FFFFFF',
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'le jour serif',
    letterSpacing: 1,
  },
  noDescriptionPremium: {
    color: '#FFD700',
    fontStyle: 'italic',
    fontSize: 14,
    fontFamily: 'le jour serif',
    letterSpacing: 1,
  },
  aiButtonPremium: {
    backgroundColor: '#FFD700',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  aiButtonTextPremium: {
    color: '#1A1A37',
    fontWeight: '700',
    fontSize: 18,
    fontFamily: 'Cinzel',
    letterSpacing: 1,
  },
  errorTextPremium: {
    color: '#ff6b6b',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'le jour serif',
    letterSpacing: 1,
  },
  readingBoxPremium: {
    marginTop: 28,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderRadius: 20,
    padding: 24,
    backgroundColor: 'rgba(108, 71, 255, 0.97)',
  shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
  },
  readingHeaderPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  readingTitlePremium: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFD700',
    fontFamily: 'le jour serif',
    letterSpacing: 2,
  },
  readingPremium: {
    color: '#FFFFFF',
    lineHeight: 22,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'le jour serif',
    letterSpacing: 1,
  },
  footnotePremium: {
    color: '#FFD700',
    fontSize: 12,
    marginTop: 28,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
    fontWeight: '700',
    fontFamily: 'le jour serif',
    letterSpacing: 1,
  },
  smokeOverlayPremium: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(108, 71, 255, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 18,
    elevation: 18,
  },
  smokeContentPremium: {
    alignItems: 'center',
    padding: 36,
  },
  smokeTextPremium: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
    textAlign: 'center',
    fontFamily: 'le jour serif',
    letterSpacing: 2,
  },
  wrap: { 
    flex: 1,
  },
  contentContainer: { 
    padding: 16, 
    paddingBottom: 140, // Tab bar overlap önlemek için artırıldı
    paddingTop: StatusBar.currentHeight + 20,
  },
  headerContainer: {
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ffe600e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  title: { 
    fontSize: 32, 
    fontWeight: '900', 
    color: '#ffe600e5',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  caption: { 
    color: '#FFFFFF', 
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
  },
  intentionContainer: {
    backgroundColor: 'rgba(108, 71, 255, 0.85)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffe600e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#ffe600e5', 
    marginBottom: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  input: { 
    borderWidth: 2, 
    borderColor: '#ffe600e5', 
    borderRadius: 16, 
    padding: 16, 
    minHeight: 100, 
    textAlignVertical: 'top', 
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    fontSize: 16,
    lineHeight: 22,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  row: { 
    flexDirection: 'row', 
    gap: 12, 
    marginTop: 20 
  },
  btn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    borderRadius: 12,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffe600e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  btnText: { 
    fontWeight: '700',
    fontSize: 14
  },
  subTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#ffe600e5', 
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  deckWrap: {
    borderWidth: 2,
    borderColor: '#ffe600e5',
    borderRadius: 20,
    backgroundColor: 'rgba(108, 71, 255, 0.85)',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  deckCard: {
    width: 80,
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ffe600e5',
  },
  emptyDeckText: {
    color: '#FFFFFF',
    fontStyle: 'italic',
    marginTop: 10,
    fontWeight: '500',
  },
  cardCountBadge: {
    backgroundColor: '#ffe600e5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  cardCountText: {
    color: '#6C47FF',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 10,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffe600e5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  actionBtnText: { 
    color: '#6C47FF', 
    fontWeight: '700',
    fontSize: 12
  },
  selectionInfo: {
    marginTop: 12,
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  cardsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    gap: 16,
    marginBottom: 24
  },
  cardCol: { 
    alignItems: 'center',
    flex: 1
  },
  posLabel: { 
    color: '#ffe600e5', 
    marginBottom: 8, 
    fontWeight: '700',
    fontSize: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  cardShell: { 
    width: 155, 
    height: 255, 
    borderRadius: 8, 
    overflow: 'hidden', 
    borderWidth: 2, 
    borderColor: '#ffe600e5', 
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  face: { 
    backfaceVisibility: 'hidden' 
  },
  absoluteFill: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0 
  },
  cardImg: { 
    width: '100%', 
    height: '100%' 
  },
  placeholder: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: 'rgba(108, 71, 255, 0.7)'
  },
  placeholderText: {
    color: '#ffe600e5', 
    fontWeight: '600', 
    marginTop: 8,
    fontSize: 10,
    textAlign: 'center'
  },
  tapToReveal: {
    color: '#ffe600e5',
    fontSize: 10,
    marginTop: 6,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  detailBox: { 
    marginTop: 20, 
    borderWidth: 2, 
    borderColor: '#ffe600e5', 
    borderRadius: 16, 
    padding: 20, 
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  detailTitle: { 
    fontSize: 20, 
    fontWeight: '800', 
    color: '#ffe600e5',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 12,
  },
  detailText: { 
    color: '#FFFFFF', 
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '500',
  },
  noDescription: {
    color: '#e9d8ff',
    fontStyle: 'italic',
    fontSize: 14
  },
  aiButton: {
    backgroundColor: '#ffe600e5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#ffe600e5',
  },
  aiButtonText: { 
    color: '#6C47FF', 
    fontWeight: '700',
    fontSize: 16
  },
  errorText: {
    color: '#ff6b6b',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  readingBox: { 
    marginTop: 24, 
    borderWidth: 2, 
    borderColor: '#ffe600e5', 
    borderRadius: 16, 
    padding: 20, 
    backgroundColor: 'rgba(108, 71, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  readingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  readingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffe600e5',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  reading: { 
    color: '#FFFFFF',
    lineHeight: 24,
    fontSize: 15,
    fontWeight: '500',
  },
  footnote: { 
    color: '#ffd900ff', 
    fontSize: 12, 
    marginTop: 24,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 16,
    fontWeight: '600',
  },
  smokeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(108, 71, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokeContent: {
    alignItems: 'center',
    padding: 30,
  },
  smokeText: { 
    color: '#ffe600e5', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginTop: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    backgroundColor: 'linear-gradient(135deg, #1A1A37 0%, #3B1F5C 100%)',
  },
  backgroundImageStyle: {
    opacity: 0.85,
    blurRadius: 18,
  },
  centerGlow: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(108,71,255,0.18)',
    transform: [{ translateX: -160 }, { translateY: -160 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.18,
    shadowRadius: 60,
  },
  cardShell: {
    width: 220,
    height: 340,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(26,26,55,0.65)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 16,
    alignSelf: 'center',
    marginVertical: 24,
  },
  cardSymbol: {
    position: 'absolute',
    top: 24,
    left: '50%',
    transform: [{ translateX: -32 }],
    width: 64,
    height: 64,
    opacity: 0.8,
  },
  cardTitle: {
    fontSize: 28,
    fontFamily: 'Cinzel',
    color: '#FFD700',
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 12,
    textShadowColor: '#3B1F5C',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  detailBox: {
    marginTop: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 22,
    padding: 24,
    backgroundColor: 'rgba(26,26,55,0.55)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
    alignSelf: 'center',
    width: '90%',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFD700',
    fontFamily: 'Cinzel',
    textAlign: 'center',
    marginBottom: 12,
  },
  detailText: {
    color: '#F5F5DC',
    lineHeight: 24,
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Poppins',
    textAlign: 'center',
  },
  // --- Deste karıştırma animasyonu ---
  shuffleDeckAnimation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  animatedCard: {
    width: 60,
    height: 90,
    position: 'absolute',
    top: 30,
    opacity: 1,
  },
});