/**
 * TV Bridge - WebView 與 Android Kotlin 的橋接層
 * 確保遙控器事件能正確傳遞
 */

declare global {
  interface Window {
    AndroidTV?: {
      dispatchKeyEvent: (keyCode: number, action: number) => boolean;
      getDeviceInfo: () => string;
      requestFocus: () => void;
    };
  }
}

// Android KeyCode 對應
export enum AndroidKeyCode {
  DPAD_UP = 19,
  DPAD_DOWN = 20,
  DPAD_LEFT = 21,
  DPAD_RIGHT = 22,
  DPAD_CENTER = 23,
  BACK = 4,
  HOME = 3,
  MENU = 82,
  VOLUME_UP = 24,
  VOLUME_DOWN = 25,
}

// Android KeyEvent Action
export enum KeyEventAction {
  DOWN = 0,
  UP = 1,
  MULTIPLE = 2,
}

// 設備資訊
export interface DeviceInfo {
  model: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  density: number;
}

/**
 * 檢測是否在 Android TV WebView 中
 */
export function isAndroidTV(): boolean {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent;
  return /Android TV|GoogleTV|WebView/.test(userAgent);
}

/**
 * 初始化 TV Bridge
 */
export function initTVBridge() {
  if (typeof window === 'undefined' || !window.AndroidTV) {
    return;
  }

  // 監聽鍵盤事件，傳遞給 Android 層
  document.addEventListener('keydown', (e) => {
    const keyCode = mapJavaScriptKeyToAndroid(e.code);
    if (keyCode !== null) {
      window.AndroidTV?.dispatchKeyEvent(keyCode, KeyEventAction.DOWN);
    }
  });

  document.addEventListener('keyup', (e) => {
    const keyCode = mapJavaScriptKeyToAndroid(e.code);
    if (keyCode !== null) {
      window.AndroidTV?.dispatchKeyEvent(keyCode, KeyEventAction.UP);
    }
  });
}

/**
 * JavaScript Key Code 映射到 Android KeyCode
 */
function mapJavaScriptKeyToAndroid(code: string): number | null {
  const mapping: Record<string, number> = {
    'ArrowUp': AndroidKeyCode.DPAD_UP,
    'ArrowDown': AndroidKeyCode.DPAD_DOWN,
    'ArrowLeft': AndroidKeyCode.DPAD_LEFT,
    'ArrowRight': AndroidKeyCode.DPAD_RIGHT,
    'Enter': AndroidKeyCode.DPAD_CENTER,
    ' ': AndroidKeyCode.DPAD_CENTER,
  };
  
  return mapping[code] || null;
}

/**
 * Android KeyCode 映射到 JavaScript Key Code
 */
export function mapAndroidKeyCodeToJS(keyCode: number): string | null {
  const mapping: Record<number, string> = {
    [AndroidKeyCode.DPAD_UP]: 'ArrowUp',
    [AndroidKeyCode.DPAD_DOWN]: 'ArrowDown',
    [AndroidKeyCode.DPAD_LEFT]: 'ArrowLeft',
    [AndroidKeyCode.DPAD_RIGHT]: 'ArrowRight',
    [AndroidKeyCode.DPAD_CENTER]: 'Enter',
  };
  
  return mapping[keyCode] || null;
}

/**
 * 獲取設備資訊
 */
export async function getDeviceInfo(): Promise<DeviceInfo | null> {
  if (!window.AndroidTV) return null;
  
  try {
    const deviceInfoStr = window.AndroidTV.getDeviceInfo();
    return JSON.parse(deviceInfoStr) as DeviceInfo;
  } catch (error) {
    console.error('Failed to get device info:', error);
    return null;
  }
}

/**
 * 請求 Focus
 */
export function requestFocus() {
  window.AndroidTV?.requestFocus();
}
