import './Post.css';
import axiosInstance from '../../api/axios';
import React, { useEffect, useState } from 'react';
import { useAlertContext } from '../../context/AlertContext';
import { useUserPosts } from '../../context/UserPostsProvider.jsx';
import { useUserProfile } from '../../context/UserProfileProvider.jsx';

const Post = ({ post, setPostToUpdate, setShowUpdatePostForm, openCommentSection, openPostShareModel, showOptions, setOptionsPostId }) => {
    const { showAlert } = useAlertContext();
    const { userInfo, getUserProfile, redirectToUserProfile } = useUserProfile();
    const { bookmarkPost, removePostFromBookmark, deletePost } = useUserPosts();

    const profilePicture = getUserProfile(post.user.username, post.user.profilePicture);

    const [likedByUser, setLikedByUser] = useState(false);
    const [likesCount, setLikesCount] = useState(post?.likes?.length || 0);
    const [shareCount, setShareCount] = useState(post?.sharedBy?.length || 0);
    const [commentsCount, setCommentsCount] = useState(post?.comments?.length || 0);
    const [bookmarkedByUser, setBookmarkedByUser] = useState(false);

    useEffect(() => {
        if (userInfo) {
            setLikesCount(post?.likes?.length);
            setLikedByUser(post?.likes?.includes(userInfo?._id));
        }
    }, [userInfo?._id, post?.likes]);
    
    useEffect(() => {
        setCommentsCount(post?.comments?.length);
    }, [post?.comments]);

    useEffect(() => {
        setShareCount(post?.sharedBy?.length || 0);
    }, [post?.sharedBy]);
    
    useEffect(() => {
        if (userInfo?.bookmarkedPosts)
            setBookmarkedByUser(userInfo?.bookmarkedPosts.includes(post._id));
    }, [userInfo?.bookmarkedPosts]);

    const handlePostLike = async () => {
        setLikedByUser(preState => !preState);
        try {
            await axiosInstance.put(`api/post/like-post/${post._id}`);
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    }

    const togglePostBookmark = async (postId) => {
        if (bookmarkedByUser)
            removePostFromBookmark(postId);
        else
            bookmarkPost(postId);

        setBookmarkedByUser(prev => !prev);
    }

    const handleEditPost = (post) => {
        setPostToUpdate(post);
        setShowUpdatePostForm(true);
        setOptionsPostId(null);
    }

    return (
        <article key={post._id} className='post'>
            <header className="post-header">
                <button type='button' style={{background: "transparent"}} onClick={() => redirectToUserProfile(post.user._id)}>
                    <img 
                        src={profilePicture} 
                        alt={`${post.user.username}'s profile`} 
                        className="profile-picture" 
                    />
                </button>
                <div>
                    <h3 className="username">{post.user.username}</h3>
                    <p className="post-date">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                {
                    userInfo?._id === post.user._id && (
                        <button className='post-action-btn' onClick={() => setOptionsPostId(post._id)}>
                            <span className="material-symbols-outlined">more_horiz</span>
                        </button>
                    )
                }
            </header>
            <div className="post-content">
                <p>{post.content}</p>
                <div className="post-hashtags">
                    {post.hashtags.map((tag, index) => (
                        <span key={index} className="hashtag">{tag}</span>
                    ))}
                </div>
                <div className='post-media'>
                    {post.media?.map((media) =>
                        media.type === "image" ? (
                            <img
                                key={media._id}
                                src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/post-media/${media._id}`}
                                alt="Post media"
                                className="post-image"
                            />
                        ) : media.type === "video" ? (
                            <video key={media._id} src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/post-media/${media._id}`} controls className="post-video"></video>
                        ) : null
                    )}
                </div>
            </div>
            <div className="post-footer">
                <div className="post-actions">
                    <button className='post-interaction-btn' type='button' onClick={handlePostLike} style={{color: true === likedByUser? "var(--main-color)" : "var(--text-color)"}}>
                        {
                            true === likedByUser?
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
                    <button className='post-interaction-btn' type='button' onClick={() => openCommentSection(post._id, post.user._id, post.comments)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" fill="currentColor" className="bi bi-chat-dots" viewBox="0 0 16 16">
                            <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/>
                            <path d="m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2"/>
                        </svg>
                        <span className='interaction-btn-count'>{commentsCount}</span>
                    </button>
                    <button className='post-interaction-btn' type='button' onClick={() => openPostShareModel(post)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-send" viewBox="0 0 16 16">
                            <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576zm6.787-8.201L1.591 6.602l4.339 2.76z"/>
                        </svg>
                        <span className="interaction-btn-count">{shareCount}</span>
                    </button>
                    
                    <button className='post-interaction-btn' type='button' onClick={() => togglePostBookmark(post._id)}
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
                        <button onClick={() => handleEditPost(post)}>
                            <span className='btn-text'>Edit</span>
                            <span className='material-symbols-outlined btn-icon'>edit</span>
                        </button>
                        <button className='delete-chat-btn' onClick={() => deletePost(post)}>
                            <span className='btn-text'>Delete</span>
                            <span className='material-symbols-outlined btn-icon'>delete</span>
                        </button>
                    </div>
                </div>
            )}
        </article>
    );
}

export default Post;