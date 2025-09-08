import './SharedSession.css';
import { getSessionStartMessage } from '../../../Backend/Session.js'
import React, { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';
import { useUserSessions } from '../../../context/UserSessionsProvider.jsx';

const SharedSession = ({ session }) => {
  const { userInfo } = useUserProfile();
  const { redirectToSession } = useUserSessions();

  const [canStartSession, setCanStartSession] = useState(new Date() > new Date(session?.startTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setCanStartSession(new Date() > new Date(session?.startTime));
    }, 60000); // Check every minute
  
    return () => clearInterval(interval);
  }, [session?.startTime]);

  return (
    <article className='post' onClick={() => redirectToSession(session)}
        style={{background: 'var(--message-bg)', borderRadius: '10px 10px 0 10px', minWidth: '300px'}}
    >
      <header className="post-header">
          <img 
              src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${session.host.profilePicture}`} 
              alt={`${session.host.username}'s profile`} 
              className="profile-picture" 
          />
          <div>
              <h3 className="username">{session.host.username}</h3>
              <p className="post-date">{new Date(session.createdAt).toLocaleString()}</p>
          </div>
      </header>
      <div className="session-content">

        <h3 className='session-title'>{session.title}</h3>

        <div className='session-title-heading'>
          <span>{session.description}</span>
        </div>

        <div className="post-hashtags">
          {session.hashtags.map((tag, index) => (
            <span key={index} className="hashtag">{tag}</span>
          ))}
        </div>

        <h4 className='session-duration'>{session.duration} min</h4>
        <span className='session-note'>{getSessionStartMessage(session?.startTime, session?.actualStartTime)}</span>

        <div className='post-media'>
          {
            session.recordingUrl && (
              <video 
                src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/session-media/${session.recordingUrl}`} 
                controls className="post-video">
              </video>
            )
          }
        </div>
      </div>

      {session.interestedUsers.some(viewer => viewer.user._id === userInfo?._id) && !session.actualStartTime && (
        <p className="notification-message">
          You have joined this session. We will notify you when it starts.
        </p>
      )}
    </article>
  );
}

export default SharedSession;