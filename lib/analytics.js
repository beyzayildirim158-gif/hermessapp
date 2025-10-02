import { auth, db } from './firebase';
import { collection, addDoc, serverTimestamp, increment, doc, setDoc, updateDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Generic event logger. Each event is a document for flexibility.
// eventName: string (e.g., 'tarot_intention_submitted')
// data: object payload with small, serializable fields
// opts: { sessionId?: string }
let currentSessionId = null;
const QUEUE_KEY = 'analytics_offline_queue_v1';
let flushing = false;

export function setSession(id) {
  currentSessionId = id;
}

export function getSession() {
  return currentSessionId;
}

async function persistQueue(queue) {
  try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
}

async function loadQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch { return []; }
}

async function enqueue(ev) {
  const q = await loadQueue();
  q.push(ev);
  if (q.length > 200) q.shift();
  await persistQueue(q);
}

export async function flushQueue() {
  if (flushing) return;
  flushing = true;
  try {
    const q = await loadQueue();
    if (!q.length) return;
    const remain = [];
    for (const ev of q) {
      try { await addDoc(collection(db, 'app_events'), ev); } catch { remain.push(ev); }
    }
    await persistQueue(remain);
  } finally {
    flushing = false;
  }
}

export async function logEvent(eventName, data = {}, opts = {}) {
  try {
    const uid = auth.currentUser ? auth.currentUser.uid : null;
    const doc = {
      event: eventName,
      uid,
      ts: serverTimestamp(),
      sessionId: opts.sessionId || currentSessionId,
      ...sanitize(data),
    };
    await addDoc(collection(db, 'app_events'), doc);
    // Aggregate for top stones if stone_viewed
    if (eventName === 'stone_viewed' && data?.stone) {
      const aggRef = docRefForStone(data.stone);
      try { await updateDoc(aggRef, { count: increment(1) }); }
      catch { await setDoc(aggRef, { count: 1 }); }
    }
  } catch (e) {
    // Network or permission issues -> enqueue
    enqueue({ event: eventName, ...sanitize(data), uid: auth.currentUser?.uid || null, ts: Date.now(), sessionId: opts.sessionId || currentSessionId });
    if (__DEV__) console.warn('logEvent queued', eventName, e.message);
  }
}

function docRefForStone(stone) {
  return doc(db, 'stone_aggregate', stone.replace(/\//g,'_'));
}

// Limit payload fields depth & size quickly (simple shallow sanitizer)
function sanitize(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v == null) return;
    if (typeof v === 'string') {
      out[k] = v.length > 500 ? v.slice(0, 500) + '…' : v; // cap
    } else if (typeof v === 'number' || typeof v === 'boolean') {
      out[k] = v;
    } else if (Array.isArray(v)) {
      out[k] = v.slice(0, 25); // avoid huge arrays
    }
  });
  return out;
}

// Convenience wrappers
export const analytics = {
  tarotIntention(intentionText, cardCount) {
    return logEvent('tarot_intention_submitted', { intention_len: intentionText?.length || 0, cardCount });
  },
  tarotReadingCompleted(intentionText, cardCount) {
    return logEvent('tarot_reading_completed', { intention_len: intentionText?.length || 0, cardCount });
  },
  stoneViewed(stoneName) {
    return logEvent('stone_viewed', { stone: stoneName });
  },
  numerologyRequested(firstName, lastName) {
    return logEvent('numerology_requested', { fn_len: firstName?.length || 0, ln_len: lastName?.length || 0 });
  },
  numerologyResultDelivered(firstName, lastName) {
    return logEvent('numerology_result', { fn_len: firstName?.length || 0, ln_len: lastName?.length || 0 });
  },
  setSession,
  getSession,
  flushQueue,
};
