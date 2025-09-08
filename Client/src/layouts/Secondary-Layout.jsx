import '../App.css';
import './Secondary-Layout.css';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Alert from '../components/Alert/Alert.jsx';
import Navbar from './Common-Components/Navbar.jsx';
import Sidebar from '../components/Sidebar/Sidebar.jsx';
import Breadcrumbs from './Common-Components/Breadcrumbs.jsx';
import { useAlertContext } from '../context/AlertContext.jsx';

const SecondaryLayout = () => {
  const {alert} = useAlertContext();
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
      <Navbar toggleSidebar={toggleSidebar} />
      <div className="secondary-layout-container">
        <aside className="left-sidebar">
          <Sidebar isSidebarActive={isSidebarActive} toggleSidebar={toggleSidebar} />
        </aside>
        <main className="secondary-main-content">
          <Breadcrumbs />
          <Outlet />
        </main>
        { alert != null && <Alert messageType={alert?.type} message={alert?.message}/> }
      </div>
    </>
  );
}

export default SecondaryLayout;