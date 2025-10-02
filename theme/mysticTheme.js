// Merkezi mistik tema ve stil sabitleri
export const colors = {
  bgDark: '#0B0A10',
  bgGradientStart: '#120C1F',
  bgGradientEnd: '#26123A',
  primary: '#8B5CF6',
  primaryGlow: '#A78BFA',
  accent: '#FFD700',
  accentSoft: '#FFECB3',
  accentAlt: '#E0A82E',
  surface: 'rgba(255,255,255,0.04)',
  surfaceAlt: 'rgba(255,255,255,0.08)',
  surfaceStrong: 'rgba(255,255,255,0.14)',
  textPrimary: '#F5F3FF',
  textSecondary: '#D1CFE6',
  textMuted: '#9CA3AF',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6'
};

export const radius = {
  xs: 4,
  sm: 8,
  md: 14,
  lg: 22,
  xl: 30,
  pill: 999
};

export const spacing = (n) => n * 4;

export const shadows = {
  glowPrimary: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  glowAccent: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 9,
  }
};

export const gradients = {
  appBackground: ['#0B0A10', '#120C1F', '#26123A'],
  card: ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
  buttonPrimary: ['#9F67FF', '#6434C7'],
  buttonGold: ['#FFE27A', '#E0A82E'],
};

export const typography = {
  heading: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.accent
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary
  },
  small: {
    fontSize: 12,
    color: colors.textMuted
  }
};

export const mysticEffects = {
  cardBorder: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  blurBackdrop: { backgroundColor: 'rgba(255,255,255,0.06)' },
};
