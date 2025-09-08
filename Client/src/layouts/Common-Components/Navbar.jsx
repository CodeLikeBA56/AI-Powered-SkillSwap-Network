import './Navbar.css';
import React from 'react';
import { useThemeContext } from '../../context/ThemeContext';

const Navbar = ({toggleSidebar}) => {
    const { isDarkMode, toggleTheme } = useThemeContext();

    return (
        <nav className='navbar'>
            <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
                <span className="material-symbols-outlined">menu</span>
            </button>
            <h3 className="app-name">SkillSwap</h3>
            <button className="theme-toggle-btn" onClick={toggleTheme}>
                <span className="material-symbols-outlined">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
            </button>
        </nav>
    );
};

export default Navbar;