import './Comment-Section.css';
import Comment from './Comment';
import React, { useState } from 'react';
import axiosInstance from '../../../api/axios';
import { useAlertContext } from '../../../context/AlertContext';
import { useUserProfile } from '../../../context/UserProfileProvider';

const CommentSection = ({ post_id, authorId, comments, onCommentAdded, commentSectionType, commentIdToHighlight }) => {
  const { userInfo } = useUserProfile();
  const { showAlert } = useAlertContext();
  const [comment, setComment] = useState('');
  const [commentReply, setCommentReply] = useState('');
  const [commentToReply, setCommentToReply] = useState(null);
  const [replyInputVisibility, setReplyInputVisibility] = useState(false);
  
  const handleAddComment = async () => {
    try {
      if (comment.trim() === '') return;
      const response = await axiosInstance.post(`api/${commentSectionType}/add-comment-on-${commentSectionType}/${post_id}`, { content: comment });
      const { type, message, post } = response.data;

      if (response.data.type === "success") {
        onCommentAdded(post);
        showAlert(type, message);
        setComment('');
      }
    } catch (error) {
      console.log(error)
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  };

  const handleAddReplyToComment = async () => {
    try {
      if (commentReply.trim() === '') return;
      const response = await axiosInstance.post(
        `api/${commentSectionType}/${post_id}/add-reply-to-comment/${commentToReply._id}`,
        { content: commentReply }
      );
      const { type, message, post } = response.data;

      if (response.data.type === "success") {
        onCommentAdded(post);
        showAlert(type, message);
        setReplyInputVisibility(false);
        setCommentReply('');
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const triggerReplyInput = (comment) => {
    setCommentToReply(comment);
    setReplyInputVisibility(true);
  }

  const hideReplyInput = () => {
    setReplyInputVisibility(false);
    setCommentToReply(null);
  }

  return (
    <div className="comment-section-container">
      <div className="comments-list">
        {comments.length > 0 ? (
          comments?.map(comment => (
            <Comment
              key={comment._id}
              post={post_id}
              comment={comment}
              authorId={authorId}
              onUpdatedComment={onCommentAdded}
              triggerReplyInput={triggerReplyInput}
              commentSectionType={commentSectionType}
              commentIdToHighlight={commentIdToHighlight}
            /> 
          ))
        ) : (
          <p className="no-comments-message">No comments available.</p>
        )}
      </div>

      { false === replyInputVisibility && 
        <div className="comment-input-wrapper">
          <input 
            type="text" 
            className="comment-input-field" 
            placeholder="write a comment."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="button" className="submit-comment-button" onClick={handleAddComment}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-send" id='send-icon' viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
          </button>
        </div>
      }

      { true === replyInputVisibility &&
        <div className="reply-input-wrapper">
          <div className='reply-input-container'>
            <div className='reply-action'>
              <span className='reply-to'>Replying to { userInfo?._id === commentToReply?.user?._id ? 'yourself' : commentToReply?.user.username}</span>
              <button type="button" className="close-reply-input-btn" onClick={hideReplyInput}>
                <span className='material-symbols-outlined'>close</span>
              </button>
            </div>
            <input 
              type="text" 
              className="reply-input-field" 
              placeholder="write a reply..."
              value={commentReply}
              autoFocus
              onChange={(e) => setCommentReply(e.target.value)}
            />
          </div>
          <button type="button" className="submit-comment-button" onClick={handleAddReplyToComment}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-send" id='send-icon' viewBox="0 0 16 16">
              <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
            </svg>
          </button>
        </div>
      }
    </div>
  );
};

export default CommentSection;