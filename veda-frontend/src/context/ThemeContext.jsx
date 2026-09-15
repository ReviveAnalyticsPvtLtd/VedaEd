import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { userSettingsAPI } from "../services/userSettingsAPI";

const ThemeContext = createContext();

export const THEME_MODES = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
        return savedTheme;
      }
    } catch (e) {
      console.error("Failed to read theme from localStorage", e);
    }
    return THEME_MODES.LIGHT;
  });

  const getSystemTheme = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }, []);

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    const initialTheme = localStorage.getItem("theme") || THEME_MODES.LIGHT;
    if (initialTheme === THEME_MODES.SYSTEM) {
      if (typeof window !== "undefined" && window.matchMedia) {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      }
      return "light";
    }
    return initialTheme === THEME_MODES.DARK ? "dark" : "light";
  });

  // Apply class and color-scheme to document.documentElement
  const applyThemeToDOM = useCallback((currentTheme) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    let effective = "light";

    if (currentTheme === THEME_MODES.DARK) {
      effective = "dark";
    } else if (currentTheme === THEME_MODES.SYSTEM) {
      effective = getSystemTheme();
    } else {
      effective = "light";
    }

    if (effective === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
    }

    setResolvedTheme(effective);
  }, [getSystemTheme]);

  // Set and persist theme
  const setTheme = useCallback((newTheme) => {
    if (!["light", "dark", "system"].includes(newTheme)) return;

    setThemeState(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
      
      // Also sync into preferences object in localStorage if present
      const savedPrefs = localStorage.getItem("preferences");
      if (savedPrefs) {
        try {
          const parsed = JSON.parse(savedPrefs);
          parsed.theme = newTheme;
          localStorage.setItem("preferences", JSON.stringify(parsed));
        } catch (err) {}
      }
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }

    applyThemeToDOM(newTheme);
  }, [applyThemeToDOM]);

  // Apply theme on mount and when theme state changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  // Listen for OS system theme changes
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = (e) => {
      if (theme === THEME_MODES.SYSTEM) {
        const effective = e.matches ? "dark" : "light";
        const root = document.documentElement;
        if (effective === "dark") {
          root.classList.add("dark");
          root.style.colorScheme = "dark";
          root.setAttribute("data-theme", "dark");
        } else {
          root.classList.remove("dark");
          root.style.colorScheme = "light";
          root.setAttribute("data-theme", "light");
        }
        setResolvedTheme(effective);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [theme]);

  // Sync with user settings on initial load if logged in
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let isMounted = true;
    userSettingsAPI
      .getSettings()
      .then((settings) => {
        if (!isMounted) return;
        if (settings?.preferences?.theme) {
          const apiTheme = settings.preferences.theme;
          if (["light", "dark", "system"].includes(apiTheme)) {
            setThemeState(apiTheme);
            localStorage.setItem("theme", apiTheme);
            applyThemeToDOM(apiTheme);
          }
        }
      })
      .catch(() => {
        // Silently catch to not disrupt unauthenticated or offline states
      });

    return () => {
      isMounted = false;
    };
  }, [applyThemeToDOM]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        applyTheme: applyThemeToDOM,
        isDark: resolvedTheme === "dark",
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export default ThemeContext;
