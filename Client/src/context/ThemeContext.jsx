import { createContext, useContext, useState } from "react";

export const ThemeContext = createContext();

const ThemeProvider = ({ children }) => {
  const lightTheme = {
    background: '#f2f4f7',
    "message-bg": '#e8f2f9',
    primary: '#ffffff',
    secondary: '#08a4a7',
    textColor: '#1b1c1e',
    borderColor: '#ddd',
    btnTextColor: '#FFFFFF',
    greyColor: "grey"
  };

  const darkTheme = {
    background: 'black',
    primary: '#1b1c1e',
    secondary: '#08a4a7',
    textColor: '#FFFFFF',
    borderColor: '#444',
    btnTextColor: '#FFFFFF',
    greyColor: "grey"
  };

  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  return useContext(ThemeContext);
};

export default ThemeProvider;