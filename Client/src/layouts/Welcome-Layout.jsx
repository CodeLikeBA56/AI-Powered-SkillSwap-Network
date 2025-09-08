import './Layout.css';
import { Outlet, NavLink } from 'react-router-dom';
import Alert from '../components/Alert/Alert.jsx';
import ThreeDCube from '../Styled-Components/3D-Cube.jsx';
import { useAlertContext } from '../context/AlertContext.jsx';
import { useSettingContext } from '../context/SettingContext.jsx';

const WelcomeLayout = () => {
  const {alert} = useAlertContext();
  const { toggleTheme, isDarkMode } = useSettingContext();

  return (
    <section className="welcome-screen-layout">
      <nav>
        <span className='system-name'>SkillSwap</span>
        <div className='links'>
          <NavLink to="/" className={`link`}>Welcome</NavLink>
          <NavLink to="/sign-in" className="link">Sign-in</NavLink>
          <NavLink to="/sign-up" className="link">Sign-up</NavLink>
        </div>
        <button className="theme-toggle-btn" onClick={() => toggleTheme()}>
          <span className="material-symbols-outlined">{false == isDarkMode? 'dark_mode' : 'light_mode'}</span>
        </button>
      </nav>
      <Outlet />
      {/* <div className='three-d-cube'>
        <ThreeDCube />
      </div> */}
      { alert != null && <Alert messageType={alert?.type} message={alert?.message}/> }
    </section>
  );
};

export default WelcomeLayout;