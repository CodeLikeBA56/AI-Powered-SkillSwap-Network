import '../App.css';
import './Layout.css';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Alert from '../components/Alert/Alert.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import { useRTCRoom } from '../context/RTCProvider.jsx';
import { useThemeContext } from '../context/ThemeContext.jsx';
import { useAlertContext } from '../context/AlertContext.jsx';
import { useSettingContext } from '../context/SettingContext.jsx';
import CurrentAttendingSession from '../components/Session-Section/AttendingSessionCard/CurrentAttendingSession.jsx';

function PrimaryLayout() {
  const { room, myInfo } = useRTCRoom();
  const { alert } = useAlertContext();
  const { theme } = useThemeContext();
  const { isDarkMode, toggleTheme } = useSettingContext();
  const [isSidebarActive, setIsSidebarActive] = useState(true);

  const toggleSidebar = () => {
    const sidebar = document.querySelector('.left-sidebar');
      if (window.innerWidth <= 800) {
        sidebar.classList.toggle('active');
      } else if (window.innerWidth >= 801 && window.innerWidth <= 1199) {
        setIsSidebarActive(!isSidebarActive)
      }
  }

  return (
    <>
      <header className="header" style={{ borderColor: "var(--shadow-color)" }}>
        <button
          className="sidebar-toggle-btn" onClick={toggleSidebar}
          style={{ color: "var(--main-color)" }}
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <h3 className="app-name" style={{ color: theme.secondary }}>
          SkillSwap
        </h3>
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          style={{ color: "var(--main-color)" }}
        >
          <span className="material-symbols-outlined">
            {isDarkMode ? 'dark_mode' : 'light_mode'}
          </span>
        </button>
      </header>
      <div className="container">
        <aside className="left-sidebar">
          <Sidebar isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />
        </aside>
        <main className="main-content">
          <Outlet /> {/* Render child routes here */}
        </main>
        { alert != null && <Alert messageType={alert?.type} message={alert?.message}/> }
      </div>

      { room && myInfo && <CurrentAttendingSession /> }
    </>
  );
};

export default PrimaryLayout;