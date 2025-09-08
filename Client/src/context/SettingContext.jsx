import axiosInstance from "../api/axios";
import { useUserProfile } from "./UserProfileProvider";
import { createContext, useContext, useEffect, useState } from "react";

export const SettingContext = createContext();

const SettingProvider = ({ children }) => {
  const { userInfo, setUserInfo } = useUserProfile();
  const preferences = userInfo?.preferences;

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeLink, setActiveLink] = useState('Dashboard');

  const toggleTheme = () => {
    if (userInfo === null)
      setIsDarkMode(prev => !prev);
    else {
      const payload = { isDarkMode: !isDarkMode };
      saveUserPreferences(payload);
    }
  }

  const changeActiveLink = (link) => {
    setActiveLink(link);
    if (window.innerWidth <= 700)
      document.querySelector('.left-sidebar').classList.toggle('active');
  }

  const saveUserPreferences = async (body) => {
    try {
      const response = await axiosInstance.patch(`api/user-profile/update-setting-preferences`, body);
      
      if (200 === response.status) {
        const { type, message } = response.data;
        const updatedUserPreferences = { ...preferences, ...body };
        setUserInfo(prev => ({ ...prev, preferences: updatedUserPreferences}));
      }
    } catch (error) {
      
    }
  }

  useEffect(() => {
    if (userInfo?.preferences) {
      setIsDarkMode(userInfo.preferences.isDarkMode);
    }
  }, [userInfo?.preferences?.isDarkMode]);

  return (
    <SettingContext.Provider
      value={{
        isDarkMode, toggleTheme, changeActiveLink, activeLink, saveUserPreferences
      }}
    >
      {children}
    </SettingContext.Provider>
  );
};

export const useSettingContext = () => useContext(SettingContext);

export default SettingProvider;