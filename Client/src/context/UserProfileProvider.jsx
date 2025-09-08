import axiosInstance from '../api/axios';
import { useSocket } from './SocketProvider';
import { useNavigate } from 'react-router-dom';
import { useAlertContext } from './AlertContext';
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useBreadcrumbsContext } from './BreadcrumbsContext';

export const UserProfileContext = createContext();

const UserProfileProvider = ({ children }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { showAlert } = useAlertContext();
  const{ resetBreadcrumbs, addBreadcrumb } = useBreadcrumbsContext();

  const timeSpent = useRef(0);
  const intervalRef = useRef(null);

  const [userInfo, setUserInfo] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userInfo');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });

  const [userProgress, setUserProgress] = useState(() => {
    try {
      const savedUser = localStorage.getItem('userProgress');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (userInfo !== null)
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
  }, [userInfo]);
  
  useEffect(() => {
    if (userInfo !== null)
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
  }, [userInfo?._id, userProgress]);

  const updateUserProfile = async (newProfileId) => {
    if (!newProfileId) return;
    try {
        await axiosInstance.delete(`api/delete-media/user-media/${userInfo.profilePicture}`);
    } catch (error) {}

    try {
      const response = await axiosInstance.put(`api/user-profile/update-profile-picture/${newProfileId}`);
      if (200 === response.status) {
        const { type, message } = response.data;
        setUserInfo(prev => ({ ...prev, profilePicture: newProfileId }));
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const fetchUserProgress = async () => {
    try {
      const response = await axiosInstance.get('api/user-progress/');
      const { userProgress } = response.data;
      setUserProgress(userProgress);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  };

  useEffect(() => {
    if (userInfo) {
      fetchUserProgress();
    }
  }, [userInfo?._id])

  const fetchUserDetail = async () => {
    try {
      const response = await axiosInstance.get('api/user-profile/get-user-detail');
      const { user } = response.data;
      setUserInfo(user);
      socket.emit('map-user-with-socket-id', {userId: user._id});
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
      logout();
    }
  };

  const followUser = async (targetedUserId, newFollowedUser) => {
    try {
      if (!newFollowedUser._id || !newFollowedUser.username || !newFollowedUser.profilePicture) return;
      const response = await axiosInstance.patch(`api/user-profile/follow-user/${targetedUserId}`);
      const { type, message } = response.data;
      
      if (response.status === 200) {
        const newFollowing = [...userInfo.following, newFollowedUser];
        setUserInfo(user => ({ ...user, following: newFollowing }));
      }
      showAlert(type,  message);
      const followerInfo = { _id: userInfo._id, username: userInfo.username, profilePicture: userInfo.profilePicture };
      socket.emit('notify-new-follower', {to: targetedUserId, followerInfo});
      return followerInfo;
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
      return null;
    }
  };

  const unfollowUser = async (targetedUserId) => {
    try {
      const response = await axiosInstance.patch(`api/user-profile/unfollow-user/${targetedUserId}`);
      const { type, message } = response.data;
      
      if (response.status === 200) {
        const newFollowing = userInfo?.following?.filter(f => f._id !== targetedUserId);
        setUserInfo(user => ({ ...user, following: newFollowing }));
      }
      showAlert(type,  message);
      const unFollowedUserInfo = { _id: userInfo._id, username: userInfo.username };
      socket.emit('notify-someone-unfollowed', {to: targetedUserId, unFollowedUserInfo});
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  };

  const addChatToFavourites = async (chatId) => {
    try {
      const updatedFavouriteChats = [...userInfo?.favouriteChats, chatId];
      setUserInfo(preUserInfo => {
        return { ...preUserInfo, favouriteChats: updatedFavouriteChats };
      });
      
      const response = await axiosInstance.patch(`api/chat/add-chat-to-favourites/${chatId}`);

      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const removeChatFromFavourites = async (chatId) => {
    try {
      const updatedFavouriteChats = userInfo?.favouriteChats?.filter(c => c !== chatId);
      setUserInfo(preUserInfo => {
        return { ...preUserInfo, favouriteChats: updatedFavouriteChats };
      });
      
      const response = await axiosInstance.patch(`api/chat/remove-chat-from-favourites/${chatId}`);
  
      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const redirectToUserProfile = async (userId, backToScreen = "/dashboard", screenName = "Dashboard") => {
    try {
      if (userInfo?._id === userId) return navigate("/dashboard/profile")
      const response = await axiosInstance.get(`api/user-profile/fetch-user-info/${userId}`);
      if (response.status === 200) {
        const { user } = response.data;
        resetBreadcrumbs();
        addBreadcrumb({ href: backToScreen, label: screenName });
        navigate('/dashboard/user-profile', { state: { user } });
        addBreadcrumb({ href: "#", label: `${user.username}'s Profile` });
      }
    } catch (error) {
      showAlert("error", "An error occured while navigating to user profile.")
    }
};

  const handleNewFollower = useCallback(async ({ followerInfo }) => {
    showAlert("info", `${followerInfo.username} has started following you!`);
    setUserInfo(prev => ({ ...prev, followers: [...prev.followers, followerInfo] }));
  }, [socket]);

  const handleRemoveFollower = useCallback(async ({ unFollowedUserInfo }) => {
    showAlert("info", `${unFollowedUserInfo.username} just unfollowed you!`);
    setUserInfo(prev => ({ ...prev, followers: prev.followers.filter(f => f._id !== unFollowedUserInfo._id) }));
  }, [socket]);

  const handleUpdateUserProgress = useCallback(async ({ userId, updatedProgress }) => {
    if (userInfo._id === userId)
      setUserProgress(prev => ({ ...prev, ...updatedProgress }));
  }, [socket]);

  useEffect(() => {
    socket.on('update-user-progress', handleUpdateUserProgress);
    socket.on('new-follower-notification', handleNewFollower);
    socket.on('someone-unfollowed-notification', handleRemoveFollower);
    
    return () => {
      socket.off('update-user-progress', handleUpdateUserProgress);
      socket.off('new-follower-notification', handleNewFollower);
      socket.off('someone-unfollowed-notification', handleRemoveFollower);
    };
  }, [socket, handleNewFollower, handleUpdateUserProgress]);

  const getUserProfile = (username, profilePicture, bucketName = "user-media") => {
    if (profilePicture) {
      return `${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/${bucketName}/${profilePicture}`;
    }

    // Generate placeholder with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    // Background color
    ctx.fillStyle = '#333'; // Or use a hash of username for color variety
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw first letter
    ctx.fillStyle = '#fff';
    ctx.font = '50px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(username[0].toUpperCase(), 50, 50);

    return canvas.toDataURL();
  };

  useEffect(() => {
    if (!userInfo) return;
  
    intervalRef.current = setInterval(() => {
      timeSpent.current += 1;
      
      if (timeSpent.current % 60 === 0) { // ⏱️ Send to backend every 60 seconds
        axiosInstance.patch(`api/user-profile/update-time-spent`, { seconds: 60 });
        
        setUserInfo(prev => ({
          ...prev,
          timeSpentInSeconds: (prev.timeSpentInSeconds || 0) + 60
        }));
      
        timeSpent.current = 0;
      }
      
    }, 1000);
  
    const handleBeforeUnload = () => {
      if (timeSpent.current > 0) {
        navigator.sendBeacon(`${import.meta.env.VITE_SERVER_SIDE_API_URL}/api/user-profile/update-time-spent`);
      }
    };
  
    window.addEventListener("beforeunload", handleBeforeUnload);
  
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener("beforeunload", handleBeforeUnload);
  
      // Final update on unmount
      if (timeSpent.current > 0) {
        axiosInstance.patch(`api/user-profile/update-time-spent`, { seconds: timeSpent.current });
      }
    };
  }, [userInfo?._id]);

  useEffect(() => { // Verify user session
    const controller = new AbortController();
  
    const checkSession = async () => {
      if (!userInfo) return;
      try {
        const response = await axiosInstance.post(
          `api/verify-user-session/${userInfo._id}`,
          { signal: controller.signal }
        );

        const { user } = response.data;
        socket.emit('map-user-with-socket-id', { userId: user._id });
        setUserInfo(user);
      } catch (error) {
        if (error.name === 'CanceledError') {
          console.log('Request canceled');
        } else {
          const { type, message } = error.response?.data || {};
          showAlert(type || 'error', message || 'Something went wrong');
          logout();
        }
      }
    };
  
    checkSession();
    return () => controller.abort();
  }, [userInfo?._id]);

  const uploadMediaToDB = async (mediaFiles = [], bucketName = "group-chat-media") => {
    try {
      if (!mediaFiles.length) return;
      
      const mediaToUpload = new FormData();
      mediaFiles?.forEach(file => mediaToUpload.append('files', file));

      const response = await axiosInstance.post(`api/post-multiple-media/${bucketName}`, mediaToUpload);

      if (200 === response.status) {
        const { files } = response.data;
        return files;
      }
    } catch (error) {
      return [];
    }
  }

  const logout = async () => {
    navigate('/sign-in', { replace: true });
    localStorage.clear();
    setUserInfo(null);
    socket.emit('logout-user');
    await axiosInstance.post('api/logout');
  };

  return (
    <UserProfileContext.Provider value={{ 
      userInfo, setUserInfo, fetchUserDetail, updateUserProfile, 
      addChatToFavourites, removeChatFromFavourites, uploadMediaToDB,
      getUserProfile, userProgress, redirectToUserProfile,
      followUser, unfollowUser, logout 
    }}>
      {children}
    </UserProfileContext.Provider>
  );
};

export const useUserProfile = () => useContext(UserProfileContext);

export default UserProfileProvider;