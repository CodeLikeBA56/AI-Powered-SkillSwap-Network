import './index.css';
import React from 'react';
import App from './App.jsx';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import ChatProvider from './context/ChatProvider.jsx';
import ThemeProvider from './context/ThemeContext.jsx';
import AlertProvider from './context/AlertContext.jsx';
import SocketProvider from './context/SocketProvider.jsx';
import SettingProvider from './context/SettingContext.jsx';
import UserPostsProvider from './context/UserPostsProvider.jsx';
import BreadcrumbsProvider from './context/BreadcrumbsContext.jsx';
import UserProfileProvider from './context/UserProfileProvider.jsx';
import AchievementProvider from './context/AchievementsProvider.jsx';
import UserSessionsProvider from './context/UserSessionsProvider.jsx';
import NotificationProvider from './context/NotificationsProvider.jsx';
import RecommendationProvider from './context/RecommendationProvider.jsx';

import RTCRoomProvider from './context/RTCProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
          <BreadcrumbsProvider>
            <SocketProvider>
              <AlertProvider>
                <UserProfileProvider>
                  <AchievementProvider>
                    <NotificationProvider>
                      <UserPostsProvider>
                          <RTCRoomProvider>
                            <UserSessionsProvider>
                              <RecommendationProvider>
                                <SettingProvider>
                                  <ChatProvider>
                                    <App />
                                  </ChatProvider>
                                </SettingProvider>
                              </RecommendationProvider>
                            </UserSessionsProvider>
                          </RTCRoomProvider>
                      </UserPostsProvider>
                    </NotificationProvider>
                </AchievementProvider>
                </UserProfileProvider>
              </AlertProvider>
            </SocketProvider>
          </BreadcrumbsProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);