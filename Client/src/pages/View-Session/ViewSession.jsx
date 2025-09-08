import '../View-Post/ViewPost.css';
import axiosInstance from '../../api/axios';
import { useLocation } from 'react-router-dom';
import Modal from '../../components/Custom/Modal';
import React, { useEffect, useState, useCallback } from 'react';
import Session from '../../components/Session-Section/Session';
import PostShareModel from '../../components/Post-Section/PostShareModel';
import CommentSection from '../../components/Common/Comment-Section/Comment-Section';
import { useSocket } from '../../context/SocketProvider';

const ViewSession = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const receivedSession = location?.state?.session;
  const commentIdToHighlight = location?.state?.commentIdToHighlight;

  const [postId, setPostId] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [commentsToDisplay, setCommentsToDisplay] = useState([]);
  const [showPostOptionsId, setShowPostOptionsId] = useState(null);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showPostShareModel, setShowPostShareModel] = useState(false);

  const openCommentSection = (postId, hostId, comments) => {
    setPostId(postId);
    setShowCommentSection(true);
    setCommentsToDisplay(comments);
  }

  const closeCommentSection = () => {
    setPostId(null);
    setCommentsToDisplay([]);
    setShowCommentSection(false);
  }

  const openPostShareModel = (post) => {
    setShowPostShareModel(true);
    setSharedPost(post);
  }
  
  const closePostShareModel = () => {
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => {
      setShowPostShareModel(false);
      setSharedPost(null);
    }, 300);
  }

  const handleCommentAdded = (updatedPost) => {
    setSession(updatedPost);
    setCommentsToDisplay(updatedPost.comments);
  };
  
  const [session, setSession] = useState(receivedSession);

  useEffect(() => {
    const fetchUpdatedSession = async () => {
      try {
        const response = await axiosInstance.get(`api/session/${session._id}`);
  
        if (response.status === 200)
          setSession(response.data.session);
      } catch (error) {}
    }

    fetchUpdatedSession();
  }, [session?._id]);

  const onJoinedSession = useCallback(async (updatedSession) => {
    if (session?._id === updatedSession._id) setSession(updatedSession);
  }, [session, setSession]);

  const handleUpdateSessionComments = useCallback(async ({ sessionId, comments }) => {
    if (session?._id === sessionId) {
      setSession(prev => ({ ...prev, comments }));
      setCommentsToDisplay(comments);
    }
  }, [session, setCommentsToDisplay]);

  const handleUpdateSessionLikes = useCallback(async ({ sessionId, likes }) => {
    if (session?._id === sessionId) setSession(prev => ({ ...prev, likes }));
  }, [session, setSession]);

  const handleUpdateSessionStatus = useCallback(async ({ sessionId, isSessionClosed }) => {
    if (session?._id === sessionId) setSession(prev => ({ ...prev, isSessionClosed }));
  }, [session, setSession]);

  const handleUpdateSessionShare = useCallback(async ({ sessionId, sharedBy }) => {
    if (session?._id === sessionId) setSession(prev => ({ ...prev, sharedBy }));
  }, [session, setSession]);

  const handleUpdateSessionRecordingStatus = useCallback(async ({ sessionId, recordingUrl }) => {
    if (session?._id === sessionId) setSession(prev => ({ ...prev, recordingUrl }));
  }, [session, setSession]);

  useEffect(() => {
    socket.on('update-session-share', handleUpdateSessionShare);
    socket.on('update-session-likes', handleUpdateSessionLikes);
    socket.on('update-session-status', handleUpdateSessionStatus);
    socket.on('update-session-comments', handleUpdateSessionComments);
    socket.on('update-session-recording-status', handleUpdateSessionRecordingStatus);
    
    return () => {
      socket.off('update-session-recording-status', handleUpdateSessionRecordingStatus);
      socket.off('update-session-comments', handleUpdateSessionComments);
      socket.off('update-session-status', handleUpdateSessionStatus);
      socket.off('update-session-likes', handleUpdateSessionLikes);
      socket.off('update-session-share', handleUpdateSessionShare);
    }
  }, [socket, handleUpdateSessionShare, handleUpdateSessionLikes, handleUpdateSessionStatus, handleUpdateSessionComments, handleUpdateSessionRecordingStatus]);

  return (
    <div className='post-view-container'>
      <div className='post-adjustment'>
        <Session 
          session={session}
          onJoinedSession={onJoinedSession}
          showOptions={showPostOptionsId === session?._id}
          setOptionsPostId={setShowPostOptionsId}
          openCommentSection={openCommentSection}
          openPostShareModel={openPostShareModel}
        />
      </div>

      <Modal isOpen={showCommentSection} onClose={closeCommentSection} modalType={"bottomHalf"}>
        <CommentSection 
          post_id={postId}
          authorId={session?.host?._id}
          comments={commentsToDisplay} 
          commentSectionType={"session"}
          onCommentAdded={handleCommentAdded}
          commentIdToHighlight={commentIdToHighlight}
        />
      </Modal>

      <Modal isOpen={showPostShareModel} onClose={closePostShareModel} modalType={"bottomHalf"}>
        <PostShareModel postId={sharedPost?._id} post={sharedPost} closePostShareModel={closePostShareModel} />
      </Modal>
    </div>
  )
};

export default ViewSession;