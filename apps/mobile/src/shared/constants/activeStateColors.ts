export const ACTIVE_STATE_ACCENT = "#2FA8FF";
export const ACTIVE_STATE_DARK_SURFACE = "#0B1020";
export const ACTIVE_STATE_DARK_SELECTION = "#16294A";
export const ACTIVE_STATE_DARK_SOFT = "#13213D";
export const ACTIVE_STATE_DARK_BUTTON = "#1B3660";
export const ACTIVE_STATE_DARK_BUTTON_PRESSED = "#162D4F";
export const ACTIVE_STATE_LIGHT_SOFT = "#EAF6FF";
export const ACTIVE_STATE_LIGHT_BUTTON = ACTIVE_STATE_ACCENT;
export const ACTIVE_STATE_LIGHT_BUTTON_PRESSED = "#1B9BF5";
export const ACTIVE_STATE_LIGHT_TEXT = "#FFFFFF";
export const ACTIVE_STATE_DARK_TEXT = "#F8FAFC";

export function getActiveStateColors(isDark: boolean) {
  if (isDark) {
    return {
      border: ACTIVE_STATE_ACCENT,
      background: ACTIVE_STATE_DARK_SURFACE,
      selectionBackground: ACTIVE_STATE_DARK_SELECTION,
      softBackground: ACTIVE_STATE_DARK_SOFT,
      buttonBackground: ACTIVE_STATE_DARK_BUTTON,
      buttonPressedBackground: ACTIVE_STATE_DARK_BUTTON_PRESSED,
      text: ACTIVE_STATE_DARK_TEXT,
      tint: ACTIVE_STATE_ACCENT,
    };
  }

  return {
    border: ACTIVE_STATE_ACCENT,
    background: ACTIVE_STATE_ACCENT,
    selectionBackground: ACTIVE_STATE_ACCENT,
    softBackground: ACTIVE_STATE_LIGHT_SOFT,
    buttonBackground: ACTIVE_STATE_LIGHT_BUTTON,
    buttonPressedBackground: ACTIVE_STATE_LIGHT_BUTTON_PRESSED,
    text: ACTIVE_STATE_LIGHT_TEXT,
    tint: ACTIVE_STATE_ACCENT,
  };
}
