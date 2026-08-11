import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';


const ThemeContext = createContext(null);


/* =========================================================
   AVAILABLE COLOR THEMES
   ========================================================= */

export const COLOR_THEMES = [
  {
    id: 'indigo',
    name: 'Indigo',
    color: '#4F46E5',
    secondary: '#06B6D4',
  },

  {
    id: 'emerald',
    name: 'Emerald',
    color: '#10B981',
    secondary: '#14B8A6',
  },

  {
    id: 'purple',
    name: 'Royal Purple',
    color: '#7C3AED',
    secondary: '#C026D3',
  },

  {
    id: 'blue',
    name: 'Royal Blue',
    color: '#2563EB',
    secondary: '#0EA5E9',
  },

  {
    id: 'rose',
    name: 'Rose',
    color: '#E11D48',
    secondary: '#DB2777',
  },

  {
    id: 'gold',
    name: 'Gold',
    color: '#D97706',
    secondary: '#CA8A04',
  },

  {
    id: 'cyber',
    name: 'Cyber Neon',
    color: '#06B6D4',
    secondary: '#A855F7',
  },

  {
    id: 'midnight',
    name: 'Midnight',
    color: '#6366F1',
    secondary: '#8B5CF6',
  },

  {
    id: 'ocean',
    name: 'Ocean',
    color: '#0891B2',
    secondary: '#0D9488',
  },

  {
    id: 'finance',
    name: 'Finance',
    color: '#22C55E',
    secondary: '#14B8A6',
  },
];


/* =========================================================
   PROVIDER
   ========================================================= */

export const ThemeProvider = ({ children }) => {

  /* -------------------------------------------------------
     LIGHT / DARK
     ------------------------------------------------------- */

  const [theme, setThemeState] = useState(() => {
    return (
      localStorage.getItem('theme-mode') ||
      localStorage.getItem('theme') ||
      'light'
    );
  });


  /* -------------------------------------------------------
     COLOR THEME
     ------------------------------------------------------- */

  const [colorTheme, setColorThemeState] = useState(() => {
    return (
      localStorage.getItem('color-theme') ||
      'indigo'
    );
  });


  /* =======================================================
     APPLY LIGHT / DARK
     ======================================================= */

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      theme
    );

    localStorage.setItem(
      'theme-mode',
      theme
    );

    /*
     * Remove old localStorage key from
     * the previous implementation.
     */
    localStorage.removeItem('theme');

  }, [theme]);


  /* =======================================================
     APPLY COLOR THEME
     ======================================================= */

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-color-theme',
      colorTheme
    );

    localStorage.setItem(
      'color-theme',
      colorTheme
    );

  }, [colorTheme]);


  /* =======================================================
     LIGHT / DARK
     ======================================================= */

  const setTheme = (newTheme) => {

    if (
      newTheme !== 'light' &&
      newTheme !== 'dark'
    ) {
      return;
    }

    setThemeState(newTheme);
  };


  const toggleTheme = () => {

    setThemeState((current) =>
      current === 'light'
        ? 'dark'
        : 'light'
    );
  };


  /* =======================================================
     COLOR THEME
     ======================================================= */

  const changeColorTheme = (newColorTheme) => {

    const exists = COLOR_THEMES.some(
      (item) => item.id === newColorTheme
    );

    if (!exists) {
      console.warn(
        `Unknown color theme: ${newColorTheme}`
      );

      return;
    }

    setColorThemeState(newColorTheme);
  };


  /* =======================================================
     RESET
     ======================================================= */

  const resetTheme = () => {
    setThemeState('light');
    setColorThemeState('indigo');
  };


  /* =======================================================
     CONTEXT
     ======================================================= */

  const value = {
    theme,

    setTheme,

    toggleTheme,

    colorTheme,

    setColorTheme: changeColorTheme,

    changeColorTheme,

    colorThemes: COLOR_THEMES,

    resetTheme,
  };


  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};


/* =========================================================
   HOOK
   ========================================================= */

export const useTheme = () => {

  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      'useTheme must be used inside ThemeProvider'
    );
  }

  return context;
};