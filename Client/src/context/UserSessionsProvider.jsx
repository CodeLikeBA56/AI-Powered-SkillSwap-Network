import axiosInstance from '../api/axios';
import { useSocket } from './SocketProvider';
import { useRTCRoom } from './RTCProvider.jsx';
import { useNavigate } from 'react-router-dom';
import { useAlertContext } from './AlertContext';
import { useUserProfile } from './UserProfileProvider';
import { toggleSessionBookmark } from '../Backend/Session.js';
import { useBreadcrumbsContext } from './BreadcrumbsContext.jsx';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const UserSessionsContext = createContext();

const UserSessionsProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { startRoom } = useRTCRoom();
  const { showAlert } = useAlertContext();
  const { userInfo, setUserInfo } = useUserProfile();
  const { addBreadcrumb, resetBreadcrumbs } = useBreadcrumbsContext();

  const [userSessions, setUserSessions] = useState(() => {
    try {
      const savedSessions = localStorage.getItem('userSessions');
      return savedSessions ? JSON.parse(savedSessions) : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (userInfo !== null) {
      fetchUserSessions();
    }
  }, [userInfo?.username, userInfo?.profilePicture]);

  useEffect(() => {
    if (userInfo === null) {
        setUserSessions(null);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userSessions)
      localStorage.setItem('userSessions', JSON.stringify(userSessions));
  }, [userSessions]);

  const fetchUserSessions = async () => {
    try {
      const response = await axiosInstance.get(`api/session/get-user-sessions/${userInfo?._id}`);
      const { sessions } = response.data;
      setUserSessions(sessions);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const pushCreatedSession = (newSession) => setUserSessions(prev => [newSession, ...prev]);

  const updateSession = async (updatedSession) => {
    try {
      setUserSessions(prev => prev.map(session =>  session._id === updatedSession._id ? updatedSession : session));
    } catch {
      showAlert('error', 'Failed to update session.');
    }
  }

  const deleteSession = async (sessionId) => {
    try {
      const response = await axiosInstance.delete(`api/session/${sessionId}`);
      if (200 === response.status) {
        const { type, message } = response.data;
        setUserSessions(prev => prev.filter(session => session._id !== sessionId));
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const bookmarkSession = async (sessionId) => {
    try {
      const response = await axiosInstance.put(`api/user-profile/bookmark-session/${sessionId}`);
      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type,  message);
        setUserInfo(prev => toggleSessionBookmark(prev, sessionId));
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const removeSessionFromBookmark = async (sessionId) => {
    try {
      const response = await axiosInstance.delete(`api/user-profile/remove-bookmarked-session/${sessionId}`);
      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type,  message);
        setUserInfo(prev => toggleSessionBookmark(prev, sessionId));
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const redirectToSession = (session, backToScreen = "/dashboard/chat", screenName = "Chat", commentIdToHighlight) => {
    resetBreadcrumbs();
    addBreadcrumb({ href: backToScreen, label: screenName });
    navigate('/dashboard/chat/session', { state: { session, commentIdToHighlight } });
    addBreadcrumb({ href: "#", label: `Session Host: ${session.host.username}` });
  };

  const joinSession = async (session_id) => {
    try {
      const response = await axiosInstance.put(`api/session/join-session/${session_id}`);
      const { type, message, session } = response.data;
      if (response.data.type === "success") {
        showAlert(type, message);
      }

      return session;
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
      return null;
    }
  }

  const closeSession = (sessionId) => {
    try {
      const response = axiosInstance.patch(`api/session/close-session/${sessionId}`);
      if (200 === response.status) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const reopenSession = (sessionId) => {
    try {
      const response = axiosInstance.patch(`api/session/reopen-session/${sessionId}`);
      if (200 === response.status) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const handleCreateRoom = useCallback(async (sessionId) => {
    try {
      const response = await axiosInstance.post('api/room/create-room', { session: sessionId });
      const { room, actualStartTime } = response.data;
      if (response.status === 200) {
        setUserSessions(prev => prev.map(session => {
          return session.id === sessionId ? { ...session, actualStartTime } : session;
        }));
      }
      return room;
    } catch (error) {
      const {type, message} = error.response.data;
      showAlert(type, message);
    }
  }, [socket]);
  
  const sendSessionInitiationNotification = async (sessionId) => {
    try {
      const response = await axiosInstance.post('api/notifications//notify-interested-users-for-session', { sessionId });
    } catch (error) {
      const {type, message} = error.response.data;
      showAlert(type, message);
    }
  }

  const startSession = async (session) => {
    try {
      const room = await handleCreateRoom(session?._id);
      startRoom(room);

      await sendSessionInitiationNotification(session?._id);
      socket.emit('join-socket-room', { roomId: room._id, userId: userInfo?._id });
      navigate(`/dashboard/live-session/${room._id}`);
    } catch (error) {
      const {type, message} = error.response.data;
      showAlert(type, message);
    }
  }

  const attendSession = async (sessionId) => {
    try {
      console.log(sessionId)
      const response = await axiosInstance.put(`api/room/join-room/${sessionId}`);
      if (response.status === 200) {
        const { room, session } = response.data;
        await startRoom(room);
        socket.emit('send-updates-to-room', { room, session });
        const isAlreadyJoined = session.attendees.find(a => a.user._id === userInfo?._id)
        if (isAlreadyJoined.approvedByHost) {
          navigate(`/dashboard/live-session/${room?._id}`);
        } else 
          navigate(`/dashboard/waiting-screen`);
      }
    } catch (error) {
      const {type, message} = error.response.data;
      showAlert(type, message);
    }
  }

  const allowHostToPostRecording = async (roomId, sessionId) => {
    try {
      const attendeeId = userInfo?._id;
      await axiosInstance.patch(`api/session/allow-host-to-post-recording`, { attendeeId, sessionId, roomId });
    } catch (error) {
      const {type, message} = error.response.data;
      showAlert(type, message);
    }
  }

  const handleUpdatePostLikes = useCallback(async ({ sessionId, likes }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, likes } : session);
    });
  }, [setUserSessions]);

  const handleUpdatePostComments = useCallback(async ({ sessionId, comments }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, comments } : session);
    });
  }, [setUserSessions]);
  
  const handleUpdatePostShare = useCallback(async ({ sessionId, sharedBy }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, sharedBy } : session);
    });
  }, [setUserSessions]);

  const handleUpdateSessionStatus = useCallback(async ({ sessionId, isSessionClosed }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, isSessionClosed } : session);
    });
  }, [setUserSessions]);

  const handleUpdateSessionRecordingStatus = useCallback(async ({ sessionId, isBeingRecorded }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, isBeingRecorded } : session);
    });
  }, [setUserSessions]);

  const handleAllowHostToPostRecording = useCallback(async ({ sessionId, updatedAttendees }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, attendees: updatedAttendees } : session);
    });
  }, [setUserSessions]);

  const handleUpdateSessionRecording = useCallback(async ({ sessionId, recordingUrl }) => {
    setUserSessions(prevPosts => {
      return prevPosts.map(session => session._id === sessionId ? { ...session, recordingUrl } : session);
    });
  }, [setUserSessions]);

  useEffect(() => {
    socket.on('update-session-share', handleUpdatePostShare);
    socket.on('update-session-likes', handleUpdatePostLikes);
    socket.on('update-session-status', handleUpdateSessionStatus);
    socket.on('update-session-comments', handleUpdatePostComments);
    socket.on('update-session-recording', handleUpdateSessionRecording);
    socket.on('update-session-attendees', handleAllowHostToPostRecording);
    socket.on('update-session-recording-status', handleUpdateSessionRecordingStatus);
    
    return () => {
      socket.off('update-session-share', handleUpdatePostShare);
      socket.off('update-session-likes', handleUpdatePostLikes);
      socket.off('update-session-status', handleUpdateSessionStatus);
      socket.off('update-session-comments', handleUpdatePostComments);
      socket.off('update-session-recording', handleUpdateSessionRecording);
      socket.off('update-session-attendees', handleAllowHostToPostRecording);
      socket.off('update-session-recording-status', handleUpdateSessionRecordingStatus);
    }
  }, [socket, handleUpdatePostLikes, handleUpdatePostComments, handleUpdatePostShare, handleUpdateSessionStatus, handleUpdateSessionRecording, handleAllowHostToPostRecording, handleUpdateSessionRecordingStatus]);

  return (
    <UserSessionsContext.Provider value={{ 
      userSessions, setUserSessions, fetchUserSessions, pushCreatedSession, updateSession, 
      deleteSession, joinSession, startSession, bookmarkSession, removeSessionFromBookmark,
      redirectToSession, attendSession, closeSession, reopenSession, allowHostToPostRecording
    }}>
      {children}
    </UserSessionsContext.Provider>
  );
};

export const useUserSessions = () => useContext(UserSessionsContext);

export default UserSessionsProvider;