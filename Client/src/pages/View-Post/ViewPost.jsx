import './ViewPost.css';
import axiosInstance from '../../api/axios';
import { useLocation } from 'react-router-dom';
import Modal from '../../components/Custom/Modal';
import Post from '../../components/Post-Section/Post';
import { useSocket } from '../../context/SocketProvider';
import React, { useEffect, useState, useCallback } from 'react';
import UpdatePostForm from '../../components/Forms/UpdatePostForm';
import PostShareModel from '../../components/Post-Section/PostShareModel';
import CommentSection from '../../components/Common/Comment-Section/Comment-Section';

const ViewPost = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const [post, setPost] = useState(location?.state?.post);
  const commentIdToHighlight = location?.state?.commentIdToHighlight;

  const [postId, setPostId] = useState(null);
  const [sharedPost, setSharedPost] = useState(null);
  const [postToUpdate, setPostToUpdate] = useState(null);

  const [commentsToDisplay, setCommentsToDisplay] = useState([]);
  const [showPostOptionsId, setShowPostOptionsId] = useState(null);
  const [showPostShareModel, setShowPostShareModel] = useState(false);
  const [showCommentSection, setShowCommentSection] = useState(false);
  const [showUpdatePostForm, setShowUpdatePostForm] = useState(false);

    const openCommentSection = (postId, _, comments) => {
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
        setShowPostShareModel(false)
        setSharedPost(null);
      }, 300);
    }

    const closeUpdatePostForm = () => {
      document.querySelector('.modal-overlay').classList.remove('show');
      setTimeout(() => {
        setShowUpdatePostForm(false);
        setPostToUpdate(null);
      }, 300);
    }

    const handleCommentAdded = (updatedPost) => {
      setPost(updatedPost);
      setCommentsToDisplay(updatedPost.comments);
    };

  useEffect(() => {
    const fetchUpdatedPost = async () => {
      try {
        const response = await axiosInstance.get(`api/post/${post._id}`);
        
        if (response.status === 200)
          setPost(response.data.post);
      } catch (error) {}
    }

    fetchUpdatedPost();
  }, [post?._id]);

  const handleUpdateSessionComments = useCallback(async ({ postId, comments }) => {
    if (post?._id === postId) {
      setCommentsToDisplay(comments);
      setPost(prev => ({ ...prev, comments }));
    }
  }, [post, setCommentsToDisplay]);

  const handleUpdateSessionLikes = useCallback(async ({ postId, likes }) => {
    if (post?._id === postId) setPost(prev => ({ ...prev, likes }));
  }, [post, setPost]);

  const handleUpdateSessionShare = useCallback(async ({ postId, sharedBy }) => {
    if (post?._id === postId) setPost(prev => ({ ...prev, sharedBy }));
  }, [post, setPost]);

  useEffect(() => {
    socket.on('update-post-share', handleUpdateSessionShare);
    socket.on('update-post-likes', handleUpdateSessionLikes);
    socket.on('update-post-comments', handleUpdateSessionComments);
    
    return () => {
      socket.off('update-post-comments', handleUpdateSessionComments);
      socket.off('update-post-likes', handleUpdateSessionLikes);
      socket.off('update-post-share', handleUpdateSessionShare);
    }
  }, [socket, handleUpdateSessionShare, handleUpdateSessionLikes, handleUpdateSessionComments]);

  return (
    <div className='post-view-container'>
      <div className='post-adjustment'>
        <Post 
          post={post}
          setPostToUpdate={setPostToUpdate}
          setOptionsPostId={setShowPostOptionsId}
          openCommentSection={openCommentSection}
          openPostShareModel={openPostShareModel}
          showOptions={showPostOptionsId === post?._id}
          setShowUpdatePostForm={setShowUpdatePostForm}
        />
      </div>

      <Modal isOpen={showCommentSection} onClose={closeCommentSection} modalType={"bottomHalf"}>
        <CommentSection 
          post_id={postId}
          authorId={post?.user?._id}
          commentSectionType={"post"}
          comments={commentsToDisplay} 
          onCommentAdded={handleCommentAdded}
          commentIdToHighlight={commentIdToHighlight}
        />
      </Modal>

      <Modal isOpen={showPostShareModel} onClose={closePostShareModel} modalType={"bottomHalf"}>
        <PostShareModel postId={sharedPost?._id} post={sharedPost} closePostShareModel={closePostShareModel} />
      </Modal>

      <Modal isOpen={showUpdatePostForm} onClose={closeUpdatePostForm} modalType={"center"}>
        <UpdatePostForm post={postToUpdate} closeUpdatePostForm={closeUpdatePostForm} />
      </Modal>
    </div>
  )
};

export default ViewPost;