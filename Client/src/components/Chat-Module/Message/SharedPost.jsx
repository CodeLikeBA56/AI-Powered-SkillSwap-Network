import './SharedPost.css';
import React from 'react';
import { useUserPosts } from '../../../context/UserPostsProvider';

const SharedPost = ({ post }) => {
    const { redirectToPost } = useUserPosts();

    const noOfPhotos = post?.media?.reduce((sum, media) => {
        if (media.type === "image") return sum + 1;

        return sum;
    }, 0);

    const noOfVideos = post?.media?.reduce((sum, media) => {
        if (media.type === "video") return sum + 1;

        return sum;
    }, 0);
    return (
        <article key={post._id} className='post' onClick={() => redirectToPost(post)}
            style={{background: 'var(--message-bg)', borderRadius: '10px 10px 0 10px', minWidth: '300px'}}
        >
            <header className="post-header">
                <img 
                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${post?.user?.profilePicture}`} 
                    alt={`${post?.user?.username}'s profile`} 
                    className="profile-picture" 
                />
                <div>
                    <h3 className="username">{post.user.username}</h3>
                    <p className="post-date">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
            </header>
            <div className="post-content">
                <p>{post.content}</p>
                <div className="post-hashtags">
                    {post.hashtags.map((tag, index) => (
                        <span key={index} className="hashtag">{tag}</span>
                    ))}
                </div>
                <div className='post-media'>
                    <span>{`Photos x${noOfPhotos}`}</span>
                    <span>{`Videos x${noOfVideos}`}</span>
                </div>
            </div>
        </article>
    );
}

export default SharedPost;