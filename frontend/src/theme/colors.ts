// Premium MedBook Color Palette
export const colors = {
  // Primary - Medical Blue (Trust & Professionalism)
  primary: '#0066FF',
  primaryDark: '#0052CC',
  primaryLight: '#E6F0FF',
  primaryGradientStart: '#0066FF',
  primaryGradientEnd: '#00D4FF',

  // Secondary - Teal (Health & Wellness)
  secondary: '#00C9A7',
  secondaryDark: '#00A88A',
  secondaryLight: '#E0FFF9',

  // Accent - Warm Orange (Energy & Action)
  accent: '#FF6B35',
  accentDark: '#E55A2B',
  accentLight: '#FFF0EB',

  // Status Colors
  error: '#FF4757',
  errorDark: '#E53E4E',
  errorLight: '#FFE8EA',

  warning: '#FFB800',
  warningLight: '#FFF8E0',

  success: '#00D68F',
  successLight: '#E0FFF4',

  info: '#0095FF',
  infoLight: '#E6F5FF',

  // Backgrounds - Clean & Modern
  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',

  // Text - Clear Hierarchy
  text: '#1A1D26',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#F0F1F3',

  // Glassmorphism effects
  glass: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Role specific colors
  userPrimary: '#0066FF',
  hospitalPrimary: '#8B5CF6',
  doctorPrimary: '#00C9A7',

  // Feature card colors
  featureBlue: '#EEF6FF',
  featureGreen: '#E0FFF4',
  featurePurple: '#F3E8FF',
  featureOrange: '#FFF7ED',
  featurePink: '#FDF2F8',
  featureCyan: '#ECFEFF',
};

// Shadows for elevation
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

// Gradients
export const gradients = {
  primary: ['#0066FF', '#00D4FF'],
  secondary: ['#00C9A7', '#00E5C3'],
  accent: ['#FF6B35', '#FF9F6B'],
  purple: ['#8B5CF6', '#A78BFA'],
  sunset: ['#FF6B35', '#FF4757'],
  ocean: ['#0066FF', '#00C9A7'],
  dark: ['#1A1D26', '#374151'],
};
