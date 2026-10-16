// localStorage helpers; storage can be unavailable (private mode), so never throw

const read = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

export interface Settings {
  theme: 'system' | 'light' | 'dark'
  wrap: boolean
  fontSize: number
}

const SETTINGS_KEY = 'cedot:settings';

export const getSettings = (): Settings => ({
  theme: 'system',
  wrap: false,
  fontSize: 14,
  ...read<Partial<Settings>>(SETTINGS_KEY, {}),
});

export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);
