export const newId = (): string => Math.random().toString(36).slice(2, 8);

export const timeAgo = (t: number): string => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
};

// apply the theme setting to <html data-theme>, resolving 'system'
export const applyTheme = (theme: 'system' | 'light' | 'dark'): boolean => {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  return dark;
};
