import './Session-Section.css';
import axiosInstance from '../../api/axios';
import React, { useState, useEffect } from 'react';
import { useAlertContext } from '../../context/AlertContext';
import { getSessionStartMessage } from '../../Backend/Session.js'
import { useUserProfile } from '../../context/UserProfileProvider.jsx';
import { useUserSessions } from '../../context/UserSessionsProvider.jsx';


const Session = React.memo(({ session, onJoinedSession, setSessionToUpdate, setShowUpdateSessionForm, openCommentSection, openPostShareModel, showOptions, setOptionsPostId}) => {
  const { userInfo } = useUserProfile();
  const { showAlert } = useAlertContext();
  const { startSession, attendSession, joinSession, closeSession, reopenSession, bookmarkSession, removeSessionFromBookmark, deleteSession } = useUserSessions();

  const [canStartSession, setCanStartSession] = useState(new Date() > new Date(session?.startTime));
  
  const [isJoined, setIsJoined] = useState(false);
  const [likedByUser, setLikedByUser] = useState(false);
  const [bookmarkedByUser, setBookmarkedByUser] = useState(false);
  const [liveSinceMinutes, setLiveSinceMinutes] = useState(null);
  const [likesCount, setLikesCount] = useState(session.likes.length);
  const [commentsCount, setCommentsCount] = useState(session.comments.length);
  const [shareCount, setShareCount] = useState(session?.sharedBy?.length || 0);

  useEffect(() => {
    if (userInfo) {
      setLikesCount(session?.likes?.length);
      setLikedByUser(session?.likes?.includes(userInfo?._id));
    }
  }, [userInfo?._id, session?.likes]);

  useEffect(() => {
    if (!session.actualStartTime) {
      setLiveSinceMinutes(null);
      return;
    }
  
    const updateLiveDuration = () => {
      const now = new Date();
      const startedAt = new Date(session.actualStartTime);
      if (now > startedAt) {
        const diffInMinutes = Math.floor((now - startedAt) / (1000 * 60));
        setLiveSinceMinutes(diffInMinutes);
      } else {
        setLiveSinceMinutes(null);
      }
    };
  
    updateLiveDuration(); // initial call
    const interval = setInterval(updateLiveDuration, 60000); // update every minute
  
    return () => clearInterval(interval);
  }, [session.actualStartTime]);  

  useEffect(() => {
    setCommentsCount(session?.comments?.length);
  }, [session?.comments]);

  useEffect(() => {
    setShareCount(session?.sharedBy?.length || 0);
  }, [session?.sharedBy]);

  useEffect(() => {
    if (userInfo?.bookmarkedSessions)
      setBookmarkedByUser(userInfo?.bookmarkedSessions?.includes(session._id));
  }, [userInfo?.bookmarkedSessions]);

  const handlePostLike = async () => {
    try {
      await axiosInstance.put(`api/session/like-session/${session?._id}`);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const toggleSessionBookmark = async (postId) => {
    if (bookmarkedByUser)
      removeSessionFromBookmark(postId);
    else
      bookmarkSession(postId);

    setBookmarkedByUser(prev => !prev);
  }
  
  const handleJoinSession = async (sessionId) => {
    const isJoined = session.interestedUsers.some(viewer => viewer.user._id === userInfo._id);
    if (!isJoined) {
      const session = await joinSession(sessionId);
      onJoinedSession(session);
    }
  }

  useEffect(() => {
    if (userInfo)
      setIsJoined(session.interestedUsers.some(viewer => viewer.user._id === userInfo?._id));
  }, [userInfo?._id, session.interestedUsers]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCanStartSession(new Date() > new Date(session?.startTime));
    }, 60000);
  
    return () => clearInterval(interval);
  }, [session?.startTime]);

  const handleEditSession = (session) => {
    setSessionToUpdate(session);
    setShowUpdateSessionForm(true);
    setOptionsPostId(null);
  }

  return (
      <article className='post'>
          <header className="post-header">
              <img 
                  src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${session?.host?.profilePicture}`} 
                  alt={`${session?.host?.username}'s profile`} 
                  className="profile-picture" 
              />
              <div>
                  <h3 className="username">{session?.host?.username}</h3>
                  <p className="post-date">{new Date(session.createdAt).toLocaleString()}</p>
              </div>
              {
                userInfo?._id === session.host._id && (
                  <button className='post-action-btn' onClick={() => setOptionsPostId(session._id)}>
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                )
              }
          </header>
          <div className="session-content">

            <h3 className='session-title'>{session.title}</h3>

            <div className='session-title-heading'>
              <span className='material-symbols-outlined heading-icon'>info</span>
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
                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/post-media/${session.recordingUrl}`} 
                    controls className="post-video">
                  </video>
                )
              }
            </div>
          </div>

          {
            session.recordingUrl === null && !session.isSessionClosed && 
            <div className='session-actions-buttons'>
              { userInfo?._id !== session.host._id &&
                <button 
                  type='button' 
                  className="attend-btn" 
                  // disabled={session.actualStartTime === null}
                  onClick={() => attendSession(session?._id)}
                  style={{backgroundColor: session.actualStartTime ? '' : 'var(--shadow-color)'}}
                >
                  Attend Session
                </button>
              }

              { userInfo?._id === session.host._id && !session?.isSessionClosed && 
                <button 
                  className="join-btn" type="button" 
                  onClick={() => startSession(session)}
                  disabled={new Date() < new Date(session?.startTime)}
                  style={{ backgroundColor: canStartSession ? '' : 'var(--shadow-color)' }}
                >
                  Start Session
                </button>
              }

              { userInfo?._id !== session?.host._id && session?.actualStartTime === null &&
                <button 
                  className="join-btn" type='button'
                  disabled={isJoined}
                  onClick={() => handleJoinSession(session?._id)}
                  style={{ backgroundColor: false === isJoined ? '' : 'var(--shadow-color)' }}
                >
                  { isJoined ? 'Already Joined' : 'Join Session'}
                </button>
              }
            </div>
          }

          {
            session.interestedUsers.some(viewer => viewer.user._id === userInfo?._id) && !session.actualStartTime && (
              <p className="notification-message">
                { session?.isSessionClosed ? "The session has been closed by the host." : "You have joined this session. We will notify you when it starts."}
              </p>
            )
          }

          <div className="post-footer"> 
              <div className="post-actions">
                  <button className='post-interaction-btn' type='button' onClick={handlePostLike} style={{color: true === likedByUser? "var(--main-color)" : "var(--text-color)"}}>
                      {
                          true == likedByUser?
                          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" className="bi bi-suit-heart-fill" viewBox="0 0 16 16">
                              <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1"/>
                          </svg>
                          :
                          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" className="bi bi-suit-heart" viewBox="0 0 16 16">
                              <path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.6 7.6 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/>
                          </svg>
                      }
                      <span className="interaction-btn-count">{likesCount}</span>
                  </button>
                  <button className='post-interaction-btn' type='button' onClick={() => openCommentSection(session._id, session.host._id, session.comments)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="currentColor" className="bi bi-chat-dots" viewBox="0 0 16 16">
                          <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                          <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/>
                      </svg>
                      <span className='interaction-btn-count'>{commentsCount}</span>
                  </button>
                  <button className='post-interaction-btn' type='button' onClick={() => openPostShareModel(session)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                          <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                      </svg>
                      <span className="interaction-btn-count">{shareCount}</span>
                  </button>

                  <button className='post-interaction-btn' type='button' onClick={() => toggleSessionBookmark(session._id)}
                    style={{color: true === bookmarkedByUser? "var(--main-color)" : "var(--text-color)", marginLeft: 'auto'}}
                  >
                    {
                      true !== bookmarkedByUser?
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" className="bi bi-bookmark" viewBox="0 0 16 16">
                          <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
                        </svg>
                      :
                        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="currentColor" className="bi bi-bookmark-check-fill" viewBox="0 0 16 16">
                          <path fillRule="evenodd" d="M2 15.5V2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.74.439L8 13.069l-5.26 2.87A.5.5 0 0 1 2 15.5m8.854-9.646a.5.5 0 0 0-.708-.708L7.5 7.793 6.354 6.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0z"/>
                        </svg>
                    }
                  </button>
              </div>
          </div>

          {showOptions && (
            <div className='options-backdrop' onClick={() => setOptionsPostId(null)}>
              <div className='pop-up-options' onClick={(e) => e.stopPropagation()}>
                <button onClick={() => handleEditSession(session)}>
                  <span className='btn-text'>Edit Session</span>
                  <span className='material-symbols-outlined btn-icon'>edit</span>
                </button>

                {
                  !session?.isSessionClosed && (
                    <button className='close-session-btn' onClick={() => closeSession(session._id)}>
                      <span className='btn-text'>Close Session</span>
                      <span className='material-symbols-outlined btn-icon'>block</span>
                    </button>
                  )
                }

                {
                  session?.isSessionClosed && (
                    <button onClick={() => reopenSession(session._id)}>
                      <span className='btn-text'>Reopen Session</span>
                      <span className='material-symbols-outlined btn-icon'>lock_reset</span>
                    </button>
                  )
                }
                
                <button className='delete-chat-btn' onClick={() => deleteSession(session._id)}>
                  <span className='btn-text'>Delete session</span>
                  <span className='material-symbols-outlined btn-icon'>delete</span>
                </button>
              </div>
            </div>
          )}
      </article>
  );
})

export default Session;