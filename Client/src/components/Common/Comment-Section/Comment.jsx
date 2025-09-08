import './Comment.css';
import Reply from './Reply.jsx';
import axiosInstance from '../../../api/axios';
import React, { useState, useEffect } from 'react';
import NoProfile from '../../../assets/No-Profile.webp';
import { useUserProfile } from '../../../context/UserProfileProvider.jsx';

const getFormattedTime = (date) => {
  const commentDate = new Date(date);
  const now = new Date();

  const diffInMs = now - commentDate;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInMonths / 12);
  
  if (now.toDateString() === commentDate.toDateString()) { // If comment is from today, return time with AM/PM format
      const hours = commentDate.getHours();
      const minutes = commentDate.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      return `${formattedHours}:${minutes} ${ampm}`;
  }

  if (diffInYears > 0) return `${diffInYears}y`; // Otherwise, return relative time
  if (diffInMonths > 0) return `${diffInMonths}m`;
  if (diffInDays > 0) return `${diffInDays}d`;
  if (diffInHours > 0) return `${diffInHours}h`;
  if (diffInMinutes > 0) return `${diffInMinutes}m`;
  
  return "Just now";
};

const Comment = ({post, authorId, comment, onUpdatedComment, commentSectionType, triggerReplyInput, commentIdToHighlight}) => {
  const { userInfo, getUserProfile } = useUserProfile();
  const profilePicture = getUserProfile(comment.user.username, comment.user.profilePicture);

  const [showReplies, setShowReplies] = useState(false);
  const [likedByUser, setLikedByUser] = useState(false);
  const [likedByAuthor, setLikedByAuthor] = useState(false);
  const [likesCount, setLikesCount] = useState(comment?.likes?.length || 0);

  useEffect(() => {
    if (userInfo) {
      setLikesCount(comment?.likes?.length);
      setLikedByUser(comment?.likes?.includes(userInfo?._id));
      setLikedByAuthor(comment?.likes?.some(id => id === authorId));
    }
  }, [userInfo?._id, comment?.likes]);

  const handleCommentLike = async () => {
    setLikedByUser(prevState => !prevState);
    try {
      const response = await axiosInstance.put(`api/${commentSectionType}/${post}/like-comment/${comment?._id}`);

      if (response.data.type === "success") {
        const { post, likedByUser, likesCount} = response.data;
        onUpdatedComment(post);
      }
    } catch (error) {
      console.log(error || "Something went wrong");
    }
  };

  const handleShowReplies = () => setShowReplies(prevState =>!prevState);

  return (
    <div className={`comment-container ${commentIdToHighlight === comment._id ? 'highlighted' : ''}`}>
      <img 
        src={profilePicture}
        alt="Icon"
        onError={(e) => (e.target.src = NoProfile)}
        className="comment-user-profile" 
      />

      <div className='comment-wrapper'>
        <div style={{display: 'flex', flex: 1}}>
          <div className="comment-content-wrapper">
            <div className="comment-user-info">
              <span className='comment-username'>{comment.user.username}</span>
              { likedByAuthor && <span className='author-signature'>Liked by author</span>}
            </div>
            <p>{comment.content}</p>
            <div className="comment-action">
              <button type='button' className='comment-reply-btn' onClick={() => triggerReplyInput(comment)}>Reply</button>
              <span className='comment-date'>{getFormattedTime(comment.createdAt)}</span>
            </div>
          </div>

          <div className='comment-actions'>
            <button type='button' className='delete-comment-btn'>
            <span className="material-symbols-outlined">more_horiz</span>
            </button>
            <button className='comment-like-btn' onClick={handleCommentLike} type='button' style={{color: true === likedByUser? "var(--main-color)" : "var(--text-color)"}}>
              {true === likedByUser?
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-suit-heart-fill" viewBox="0 0 16 16">
                    <path d="M4 1c2.21 0 4 1.755 4 3.92C8 2.755 9.79 1 12 1s4 1.755 4 3.92c0 3.263-3.234 4.414-7.608 9.608a.513.513 0 0 1-.784 0C3.234 9.334 0 8.183 0 4.92 0 2.755 1.79 1 4 1"/>
                </svg>
                :
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-suit-heart" viewBox="0 0 16 16">
                    <path d="m8 6.236-.894-1.789c-.222-.443-.607-1.08-1.152-1.595C5.418 2.345 4.776 2 4 2 2.324 2 1 3.326 1 4.92c0 1.211.554 2.066 1.868 3.37.337.334.721.695 1.146 1.093C5.122 10.423 6.5 11.717 8 13.447c1.5-1.73 2.878-3.024 3.986-4.064.425-.398.81-.76 1.146-1.093C14.446 6.986 15 6.131 15 4.92 15 3.326 13.676 2 12 2c-.777 0-1.418.345-1.954.852-.545.515-.93 1.152-1.152 1.595zm.392 8.292a.513.513 0 0 1-.784 0c-1.601-1.902-3.05-3.262-4.243-4.381C1.3 8.208 0 6.989 0 4.92 0 2.755 1.79 1 4 1c1.6 0 2.719 1.05 3.404 2.008.26.365.458.716.596.992a7.6 7.6 0 0 1 .596-.992C9.281 2.049 10.4 1 12 1c2.21 0 4 1.755 4 3.92 0 2.069-1.3 3.288-3.365 5.227-1.193 1.12-2.642 2.48-4.243 4.38z"/>
                </svg>
              }
              <span className="interaction-btn-count">{likesCount}</span>
            </button>
          </div>
        </div>

        { true === showReplies &&
          <div className="comment-replies">
            {
              comment.replies.map(reply => (
                <Reply 
                  key={reply._id} 
                  post={post} 
                  comment={comment._id} 
                  reply={reply}
                  onUpdatedReply={onUpdatedComment}
                  getFormattedTime={getFormattedTime} 
                  commentSectionType={commentSectionType}
                />))
            }
          </div>
        }
        <button type='button' className='show-comment-replies-btn' onClick={handleShowReplies}>
          { false === showReplies ? "View " + comment.replies.length + " more reply" : "Hide replies"}
        </button>
      </div>
    </div>
  );
};

export default Comment;