const STORAGE_KEY = "woodeye_last_repo";

export function getLastRepoPath(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveLastRepoPath(path: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, path);
  } catch {
    // Ignore storage errors
  }
}

export function clearLastRepoPath(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

// Theme persistence
const THEME_KEY = "woodeye_theme";

export type Theme = "system" | "light" | "dark";

export function getTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    return "system";
  } catch {
    return "system";
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore storage errors
  }
}
