import './Sidebar.css';
import { Link } from 'react-router-dom';
import React, { useEffect } from 'react';
import { useSettingContext } from '../../context/SettingContext.jsx';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';
import { useNotifications } from '../../context/NotificationsProvider.jsx';

const Sidebar = ({isSidebarActive, toggleSidebar}) => {
  const { logout } = useUserProfile();
  const { noOfUnreadNotifications } = useNotifications();
  const { activeLink, changeActiveLink } = useSettingContext();

  useEffect(() => {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.getElementById('menu-icon');

    if (false == isSidebarActive)
      sidebar.classList.add('close')
    else
      sidebar.classList.remove('close')

    document.documentElement.style.setProperty(
      '--sidebar-width', true == isSidebarActive? '280px' : '80px'
    )
    
    const changeMenuIcon = () => {
      if (sidebar.classList.contains('open'))
      menuBtn.innerText = 'menu_open';
    else
    menuBtn.innerText = 'menu';
}
changeMenuIcon();
  }, [isSidebarActive])

  return (
    <div className='sidebar'>
      <div className='sidebar-actions'>
        <span className="material-symbols-outlined system-icon">polymer</span>
        <button onClick={toggleSidebar}>
          <span id='menu-icon' className="material-symbols-outlined">menu_open</span>
        </button>
      </div>
      <h3 className='system-name'>SkillSwap</h3>
      <ul className="nav-list">
        <li className={activeLink === "Dashboard" ? "active-link" : ""} onClick={() => changeActiveLink("Dashboard")}>
          <Link to="/Dashboard">
            <i className='bx bx-grid-alt link_icon'></i>
            <span className="link_name">Dashboard</span>
          </Link>
        </li>
        <li className={activeLink === "Search" ? "active-link" : ""} onClick={() => changeActiveLink("Search")}>
          <Link to="/Dashboard/Search">
            <i className='bx bx-search link_icon'></i>
            <span className="link_name">Search</span>
          </Link>
        </li>
        <li className={activeLink === "Chat" ? "active-link" : ""} onClick={() => changeActiveLink("Chat")}>
          <Link to="/Dashboard/Chat">
            <i className='bx bx-chat link_icon'></i>
            <span className="link_name">Chat</span>
          </Link>
        </li>
        <li className={activeLink === "Profile" ? "active-link" : ""} onClick={() => changeActiveLink("Profile")}>
          <Link to="/Dashboard/Profile">
            <i className='bx bx-user link_icon'></i>
            <span className="link_name">Profile</span>
          </Link>
        </li>
        <li className={activeLink === "Leaderboard" ? "active-link" : ""} onClick={() => changeActiveLink("Leaderboard")}>
          <Link to="/Dashboard/Leaderboard">
            <span className="material-symbols-outlined link_icon">social_leaderboard</span>
            <span className="link_name">Leaderboard</span>
          </Link>
        </li>
        <li className={activeLink === "Notifications" ? "active-link" : ""} onClick={() => changeActiveLink("Notifications")}>
          <Link to="/Dashboard/Notifications">
            <i className='bx bx-heart link_icon'></i>
            <span className="link_name">Notifications</span>
          </Link>

          { activeLink !== "Notifications" && 0 !== noOfUnreadNotifications && <span className='unread-count'>{ noOfUnreadNotifications }</span>}
        </li>
        <li className={activeLink === "Settings" ? "active-link" : ""} onClick={() => changeActiveLink("Settings")}>
          <Link to="/Dashboard/Settings">
            <i className='bx bx-cog link_icon'></i>
            <span className="link_name">Settings</span>
          </Link>
        </li>
      </ul>
      <button onClick={logout} type='button' id='logout-btn'>
        <i className='bx bx-log-out link_icon' id="logout-icon"></i>
        <span className='link_name'>Logout</span>
      </button>
    </div>
  );
};

export default Sidebar;