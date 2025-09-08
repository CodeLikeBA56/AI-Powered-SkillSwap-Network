import axiosInstance from "../api/axios.js";
import { useAlertContext } from "./AlertContext.jsx";
import { useSocket } from "./SocketProvider.jsx";
import { useUserProfile } from "./UserProfileProvider.jsx";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const RecommendationRecommendation = createContext();

const RecommendationProvider = ({ children }) => {
    const { socket } = useSocket();
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();

    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [suggestedGroups, setSuggestedGroups] = useState([]);
    const [recommendedPosts, setRecommendedPosts] = useState([]);
    const [suggestedSessions, setSuggestedSessions] = useState([]);
    const [searchedUserByName, setSearchedUserByName] = useState([]);
    
    const fetchUsersBySearch = async (searchQuery, controller) => {
      if (searchQuery.trim() === "") return [];
    
      try {
        const response = await axiosInstance.get(`/api/recommendations/fetch-users-by-name-or-email/${searchQuery}`, { signal: controller.signal });
        setSearchedUserByName(response.data?.users || []);
      } catch (error) {
        if (error.name !== 'CanceledError')
          console.error('Search failed:', error.message);

        return [];
      }
    };

    const fetchSuggestedUsers = async () => {
      try {
          const response = await axiosInstance.get('api/recommendations/suggested-users');
          if(response.status === 200)
            setSuggestedUsers(response.data.suggestedUsers);
      } catch (error) {
        const { type, message } = error.response.data;
        showAlert(type, message);
      }
    }
    
    const fetchSuggestedGroups = async () => {
      try {
        const response = await axiosInstance.get('api/recommendations/fetch-recommended-groups');
        if(response.status === 200)
          setSuggestedGroups(response.data.groups);
      } catch (error) {
        const { type, message } = error.response.data;
        showAlert(type, message);
      }
    }
    
    const fetchRecommendedSessions = async () => {
      try {
        const response = await axiosInstance.get('api/recommendations/fetch-recommended-sessions');
        if(response.status === 200)
          setSuggestedSessions(response.data.recommendedSessions.filter(s => s.host));
      } catch (error) {
        const { type, message } = error.response.data;
        showAlert(type, message);
      }
    }
    
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(`api/recommendations/get-recommended-posts`);
        if(response.status === 200)
          setRecommendedPosts(response.data.posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      }
    };
    
    useEffect(() => {
      if (userInfo === null) {
        setSuggestedUsers([]);
        setSuggestedGroups([]);
        setRecommendedPosts([]);
        setSuggestedSessions([]);
      }
    }, [userInfo?._id]);

    useEffect(() => {
      if (userInfo?.recommendedSessions?.length)
        fetchRecommendedSessions();
    }, [userInfo?.recommendedSessions]);

    useEffect(() => {
      if (userInfo?.desiredSkills?.length) {
        fetchPosts();
        fetchSuggestedUsers();
        fetchSuggestedGroups();
      }
    }, [userInfo?.desiredSkills]);

    const handleUpdatePostLikes = useCallback(async ({ postId, likes }) => {
        setRecommendedPosts(prevPosts => {
          return prevPosts.map(post => post._id == postId ? { ...post, likes } : post);
        });
    }, [setRecommendedPosts]);
    
    const handleUpdatePostComments = useCallback(async ({ postId, comments }) => {
        setRecommendedPosts(prevPosts => {
          return prevPosts.map(post => post._id == postId ? { ...post, comments } : post);
        });
    }, [setRecommendedPosts]);
      
    const handleUpdatePostShare = useCallback(async ({ postId, sharedBy }) => {
        setRecommendedPosts(prevPosts => {
          return prevPosts.map(post => post._id == postId ? { ...post, sharedBy } : post);
        });
    }, [setRecommendedPosts]);
      
    const handleUpdateRecommendedPosts = useCallback(async ({ post }) => {
      setRecommendedPosts(prevPosts => [post, ...prevPosts]);
    }, [setRecommendedPosts]);

    const handleUpdatePost = useCallback(async ({ post }) => {
      setRecommendedPosts(prevPosts => prevPosts.map(p => {
        return p._id == post._id ? post : p;
      }));
    }, [setRecommendedPosts]);

    const handleUpdateRecommendedSessions = useCallback(async ({ session }) => {
      setSuggestedSessions(prevSessions => [session, prevSessions]);
    }, [setSuggestedSessions]);

    const handleDeleteRecommendedPost = async (postId) => {
      setRecommendedPosts(prev => prev.filter(post => post._id != postId));
    }

    const handleUpdateSessionAttendees = useCallback(async ({ sessionId, updatedAttendees }) => {
      setSuggestedSessions(prevSessions => {
      return prevSessions.map(session => session._id === sessionId ? { ...session, attendees: updatedAttendees } : session);
    });
  }, [setSuggestedSessions]);

    const handleUpdateSessionRecording = useCallback(async ({ sessionId, recordingUrl }) => {
      setSuggestedSessions(prevSessions => {
      return prevSessions.map(session => session._id === sessionId ? { ...session, recordingUrl } : session);
    });
  }, [setSuggestedSessions]);

    useEffect(() => {
      socket.on('update-post', handleUpdatePost);
      socket.on('delete-post', handleDeleteRecommendedPost);
      socket.on('update-post-likes', handleUpdatePostLikes);
      socket.on('update-post-share', handleUpdatePostShare);
      socket.on('update-post-comments', handleUpdatePostComments);
      socket.on('update-global-sessions', handleUpdateSessionAttendees);
      socket.on('update-global-session-recording', handleUpdateSessionRecording);
      socket.on('update-followers-recommended-post', handleUpdateRecommendedPosts);
      socket.on('update-recommended-session-list', handleUpdateRecommendedSessions);
      
      return () => {
        socket.off('update-post', handleUpdatePost);
        socket.off('delete-post', handleDeleteRecommendedPost);
        socket.off('update-post-likes', handleUpdatePostLikes);
        socket.off('update-post-share', handleUpdatePostShare);
        socket.off('update-post-comments', handleUpdatePostComments);
        socket.off('update-global-sessions', handleUpdateSessionAttendees);
        socket.on('update-global-session-recording', handleUpdateSessionRecording);
        socket.off('update-followers-recommended-post', handleUpdateRecommendedPosts);
        socket.off('update-recommended-session-list', handleUpdateRecommendedSessions);
      }
    }, [socket, handleUpdatePost, handleDeleteRecommendedPost, handleUpdatePostLikes, handleUpdatePostComments, handleUpdatePostShare, handleUpdateSessionAttendees, handleUpdateRecommendedPosts, handleUpdateRecommendedSessions, handleUpdateSessionRecording]);

  return (
    <RecommendationRecommendation.Provider value={{ searchedUserByName, suggestedSessions, suggestedUsers, setSuggestedUsers, recommendedPosts, setRecommendedPosts, suggestedGroups, setSuggestedGroups, fetchUsersBySearch }}>
      {children}
    </RecommendationRecommendation.Provider>
  );
};

export const useRecommendation = () => useContext(RecommendationRecommendation);

export default RecommendationProvider;