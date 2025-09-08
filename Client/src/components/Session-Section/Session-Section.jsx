import './Session-Section.css';
import Session from './Session.jsx';
import Modal from '../Custom/Modal.jsx';
import { useSocket } from '../../context/SocketProvider.jsx';
import React, { useState, useEffect, useCallback } from 'react';
import PostShareModel from '../Post-Section/PostShareModel.jsx';
import CommentSection from '../Common/Comment-Section/Comment-Section.jsx';
import UpdateSessionForm from '../Forms/UpdateSessionForm.jsx';

const SessionSection = ({ sessions, setSessions }) => {
  const { socket } = useSocket();
  const [hostId, setHostId] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [sessionToUpdate, setSessionToUpdate] = useState(null);
  const [commentPostId, setCommentPostId] = useState(null);

  const [commentsToDisplay, setCommentsToDisplay] = useState([]);
  const [showPostOptionsId, setShowPostOptionsId] = useState(null);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showPostShareModel, setShowPostShareModel] = useState(false);
  const [showUpdateSessionForm, setShowUpdateSessionForm] = useState(false);
  

  const openCommentSection = (postId, hostId, comments) => {
    setCommentPostId(postId);
    setHostId(hostId);
    setCommentsToDisplay(comments);
    setShowCommentSection(true);
  }

  const closeCommentSection = () => {
    setCommentPostId(null);
    setHostId(null);
    setCommentsToDisplay([]);
    setShowCommentSection(false);
  }

  const openPostShareModel = (postId) => {
    setShowPostShareModel(true);
    setSharedPost(postId);
  }

  const closePostShareModel = () => {
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => {
      setShowPostShareModel(false)
      setSharedPost(null);
    }, 300);
  }

  const closeUpdateSessionForm = () => {
    document.querySelector('.modal-overlay').classList.remove('show');
    setTimeout(() => {
      setShowUpdateSessionForm(false);
      setSessionToUpdate(null);
    }, 300);
  }

  const handleCommentAdded = (updatedSession) => {
    const updatedSessions = sessions.map(session => session._id === updatedSession._id ? updatedSession : session);
    setCommentsToDisplay(updatedSession.comments);
    setSessions(updatedSessions);
  };

  const handleUpdatePostComments = useCallback(async ({ sessionId, comments }) => {
    if  (commentPostId == sessionId) {
      setCommentsToDisplay(comments);
    }
}, [commentPostId, setCommentsToDisplay]);

useEffect(() => {
    socket.on('update-session-comments', handleUpdatePostComments);
    
    return () => {
      socket.off('update-session-comments', handleUpdatePostComments);
    }
}, [socket, handleUpdatePostComments]);

  const onJoinedSession = (updatedSession) => {
    const updatedSessions = sessions.map(session => session._id === updatedSession._id ? updatedSession : session);
    setSessions(updatedSessions);
  }

  return (
    <div className='post-container'>
      {sessions?.length > 0 ? 
        (
          sessions?.map((session) => (
            <Session 
              key={session?._id}
              session={session}
              onJoinedSession={onJoinedSession}
              setSessionToUpdate={setSessionToUpdate}
              setOptionsPostId={setShowPostOptionsId}
              openCommentSection={openCommentSection}
              openPostShareModel={openPostShareModel}
              showOptions={showPostOptionsId === session?._id}
              setShowUpdateSessionForm={setShowUpdateSessionForm}
            />
          ))
        ) : ( 
          <p className="no-posts-message">No Sessions Hosted Yet</p> 
        )
      }

      <Modal isOpen={showCommentSection} onClose={closeCommentSection} modalType={"bottomHalf"}>
        <CommentSection 
          post_id={commentPostId}
          authorId={hostId}
          comments={commentsToDisplay} 
          onCommentAdded={handleCommentAdded}
          commentSectionType={"session"}
        />
      </Modal>

      <Modal isOpen={showPostShareModel} onClose={closePostShareModel} modalType={"bottomHalf"}>
          <PostShareModel postId={sharedPost?._id} session={sharedPost} propertyName={'session'} setPosts={setSessions} closePostShareModel={closePostShareModel} />
      </Modal>

      <Modal isOpen={showUpdateSessionForm} onClose={closeUpdateSessionForm} modalType={"center"}>
        <UpdateSessionForm session={sessionToUpdate} closeUpdateSessionForm={closeUpdateSessionForm} />
    </Modal>
    </div>
  );
};

export default SessionSection;