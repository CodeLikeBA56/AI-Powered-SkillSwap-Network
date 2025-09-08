import axiosInstance from '../api/axios';
import { useSocket } from './SocketProvider';
import { useNavigate } from 'react-router-dom';
import { useAlertContext } from './AlertContext';
import { useUserProfile } from './UserProfileProvider';
import { togglePostBookmark } from '../Backend/Post';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useBreadcrumbsContext } from './BreadcrumbsContext';

export const UserPostsContext = createContext();

const UserPostsProvider = ({ children }) => {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const { addBreadcrumb, resetBreadcrumbs } = useBreadcrumbsContext();
  const { userInfo, setUserInfo } = useUserProfile();
  const { showAlert } = useAlertContext();

  const [userPosts, setUserPosts] = useState(() => {
    try {
      const savedPosts = localStorage.getItem('userPosts');
      return savedPosts ? JSON.parse(savedPosts) : null;
    } catch (error) {
      return null;
    }
  });

  useEffect(() => {
    if (userInfo !== null) {
      fetchUserPosts();
    }
  }, [userInfo?.username, userInfo?.profilePicture]);

  useEffect(() => {
    if (userInfo === null) {
        setUserPosts(null);
    }
  }, [userInfo]);

  useEffect(() => {
    if (userPosts)
      localStorage.setItem('userPosts', JSON.stringify(userPosts));
  }, [userPosts]);

  const fetchUserPosts = async () => {
    try {
      const response = await axiosInstance.get(`api/post/get-user-posts/${userInfo?._id}`);
      const { posts } = response.data;
      setUserPosts(posts);
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const pushCreatedPost = (newPost) => setUserPosts(prev => [newPost, ...prev]);

  const updatePost = async (updatedPost) => {
    try {
      setUserPosts(prev => prev.map(post =>  post._id === updatedPost._id ? updatedPost : post));
    } catch {
      showAlert('error', 'Failed to update post.');
    }
  }

  const deletePost = async (post) => {
    try {
      const postId = post._id;
      const response = await axiosInstance.delete(`api/post/${postId}`);
      if (200 === response.status) {
        post?.media?.forEach(media => axiosInstance.delete(`api/delete-media/post-media/${media?._id}`));
        const { type, message } = response.data;
        setUserPosts(prev => prev.filter(post => post._id !== postId));
        showAlert(type, message);
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const bookmarkPost = async (postId) => {
    try {
      const response = await axiosInstance.put(`api/user-profile/bookmark-post/${postId}`);
      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type,  message);
        setUserInfo(prev => togglePostBookmark(prev, postId));
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const removePostFromBookmark = async (postId) => {
    try {
      const response = await axiosInstance.delete(`api/user-profile/remove-bookmarked-post/${postId}`);
      if (response.status === 200) {
        const { type, message } = response.data;
        showAlert(type,  message);
        setUserInfo(prev => togglePostBookmark(prev, postId));
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type,  message);
    }
  }

  const redirectToPost = (post, backToScreen = "/dashboard/chat", screenName = "Chat", commentIdToHighlight) => {
    resetBreadcrumbs();
    addBreadcrumb({ href: backToScreen, label: screenName });
    navigate('/dashboard/chat/post', { state: { post, commentIdToHighlight } });
    addBreadcrumb({ href: "#", label: `${post.user.username}'s Post` });
  };

  const handleUpdatePostLikes = useCallback(async ({ postId, likes }) => {
    setUserPosts(prevPosts => {
      return prevPosts.map(post => post._id === postId ? { ...post, likes } : post);
    });
  }, [setUserPosts]);

  const handleUpdatePostComments = useCallback(async ({ postId, comments }) => {
    setUserPosts(prevPosts => {
      return prevPosts.map(post => post._id === postId ? { ...post, comments } : post);
    });
  }, [setUserPosts]);
  
  const handleUpdatePostShare = useCallback(async ({ postId, sharedBy }) => {
    setUserPosts(prevPosts => {
      return prevPosts.map(post => post._id === postId ? { ...post, sharedBy } : post);
    });
  }, [setUserPosts]);
  
  useEffect(() => {
    socket.on('update-post-share', handleUpdatePostShare);
    socket.on('update-post-likes', handleUpdatePostLikes);
    socket.on('update-post-comments', handleUpdatePostComments);
    
    return () => {
      socket.off('update-post-share', handleUpdatePostShare);
      socket.off('update-post-likes', handleUpdatePostLikes);
      socket.off('update-post-comments', handleUpdatePostComments);
    }
  }, [socket, handleUpdatePostLikes, handleUpdatePostComments, handleUpdatePostShare]);

  return (
    <UserPostsContext.Provider value={{ 
      userPosts, setUserPosts, fetchUserPosts, pushCreatedPost, updatePost, deletePost, 
      bookmarkPost, removePostFromBookmark, redirectToPost
    }}>
      {children}
    </UserPostsContext.Provider>
  );
};

export const useUserPosts = () => useContext(UserPostsContext);

export default UserPostsProvider;