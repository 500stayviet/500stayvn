export const ADD_PROPERTY_COLORS = {
  primary: "#E63946",
  primaryLight: "#FF6B6B",
  secondary: "#FF6B35",
  accent: "#FFB627",
  success: "#10B981",
  error: "#DC2626",
  white: "#FFFFFF",
  background: "#FFF8F0",
  surface: "#FFFFFF",
  border: "#FED7AA",
  borderFocus: "#E63946",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
} as const;

export type AddPropertyColors = typeof ADD_PROPERTY_COLORS;
