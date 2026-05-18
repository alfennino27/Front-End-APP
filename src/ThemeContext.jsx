// ThemeContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [globalTheme, setGlobalTheme] = useState('dark');

  // Check localStorage for theme on initial load
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setGlobalTheme(savedTheme);
    } else {
        setGlobalTheme('dark');
    }
  }, []);

  // Function to toggle theme
  const toggleTheme = (newTheme) => {
    setGlobalTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ globalTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the ThemeContext
export const useTheme = () => {
  return useContext(ThemeContext);
};
