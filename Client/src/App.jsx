import './App.css';
import { useEffect } from'react';
import { Routes, Route } from 'react-router-dom';
import useWindowSize from './services/useWindowSize.js';
import WelcomeLayout from './layouts/Welcome-Layout.jsx';
import PrimaryLayout from './layouts/Primary-Layout.jsx';
import SecondaryLayout from './layouts/Secondary-Layout.jsx';
import SkillSetForm from './components/Skill-Set-Form/SkillSetForm.jsx';
import { Welcome, Login, Registration, ForgotPassword, Dashboard, Search, MyProfile, Leaderboard, UserProfile, Chat, Session, ViewPost, ViewSession, Notification, Settings, Achievements, WaitingRoom } from './pages/index.js';

import { useSettingContext } from './context/SettingContext.jsx';

function App() {
  const width = useWindowSize();
  const isMobile = width < 800;
  const { isDarkMode } = useSettingContext();

  useEffect(() => {
    // alert(window.innerWidth)
    if (true === isDarkMode)
      document.documentElement.classList.add('dark-mode');
    else
      document.documentElement.classList.remove('dark-mode');
  }, [isDarkMode])

  return (
    <Routes>
      <Route path='/' element={<WelcomeLayout />}>
        <Route path='/' element={<Welcome />} />
        <Route path="/sign-in" element={<Login />} />
        <Route path="/sign-up" element={<Registration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<PrimaryLayout />}>
        <Route path="/skill-set-form" element={<SkillSetForm />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/profile" element={<MyProfile />} />
        { !isMobile && <Route path="/dashboard/chat" element={<Chat />} />}
        { isMobile && <Route path="/dashboard/chat" element={<Chat />} />}
        <Route path="/dashboard/search" element={<Search />} />
        <Route path="/dashboard/Leaderboard" element={<Leaderboard />} />
        <Route path="/dashboard/notifications" element={<Notification />} />
        <Route path="/dashboard/waiting-screen" element={<WaitingRoom />} />
        <Route path="/dashboard/settings" element={<Settings />} />
      </Route>

      <Route element={<SecondaryLayout />}>
        <Route path="/dashboard/user-profile" element={<UserProfile />} />
        <Route path="/dashboard/chat/post" element={<ViewPost />} />
        <Route path="/dashboard/chat/session" element={<ViewSession />} />
        <Route path="/dashboard/profile/achievements" element={<Achievements />} />
        {/* { isMobile && <Route path="/dashboard/chat" element={<Chat />} />} */}
      </Route>
      
      <Route path="/dashboard/live-session/:room_id" element={<Session />} />
      <Route path="*" element={<h1>404 Page Not Found</h1>} />
    </Routes>
  );
}

export default App;