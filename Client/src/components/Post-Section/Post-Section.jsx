import './Post-Section.css';
import Post from './Post.jsx';
import Modal from '../Custom/Modal.jsx';
import UpdatePostForm from '../Forms/UpdatePostForm.jsx';
import React, { useState, useEffect, useCallback } from 'react';
import PostShareModel from './PostShareModel.jsx';
import { useSocket } from '../../context/SocketProvider.jsx';
import CommentSection from '../Common/Comment-Section/Comment-Section.jsx';

const PostSection = ({ posts, setPosts }) => {
    const { socket } = useSocket();
    const [authorId, setAuthorId] = useState(null);
    const [sharedPost, setSharedPost] = useState(null);
    const [postToUpdate, setPostToUpdate] = useState(null);
    const [commentPostId, setCommentPostId] = useState(null);

    const [commentsToDisplay, setCommentsToDisplay] = useState([]);
    const [showPostOptionsId, setShowPostOptionsId] = useState(null);
    const [showPostShareModel, setShowPostShareModel] = useState(false);
    const [showCommentSection, setShowCommentSection] = useState(false);
    const [showUpdatePostForm, setShowUpdatePostForm] = useState(false);

    const openCommentSection = (postId, authorId, comments) => {
        setCommentPostId(postId);
        setAuthorId(authorId);
        setCommentsToDisplay(comments);
        setShowCommentSection(true);
    }

    const closeCommentSection = () => {
        setCommentPostId(null);
        setAuthorId(null);
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
        const updatedPosts = posts.map(post => post._id === updatedPost._id ? updatedPost : post);
        setPosts(updatedPosts);
        setCommentsToDisplay(updatedPost.comments);
    };

    const handleUpdatePostComments = useCallback(async ({ postId, comments }) => {
        if (commentPostId == postId) {
            setCommentsToDisplay(comments);
        }
    }, [commentPostId, setCommentsToDisplay]);

    useEffect(() => {
        socket.on('update-post-comments', handleUpdatePostComments);
        
        return () => {
            socket.off('update-post-comments', handleUpdatePostComments);
        }
    }, [socket, handleUpdatePostComments]);

    return (
        <div className='post-container'>
            {posts?.length > 0 ? (
                posts.map((post) => {
                    return (
                        <Post 
                            key={post?._id}
                            post={post}
                            setPostToUpdate={setPostToUpdate}
                            setOptionsPostId={setShowPostOptionsId}
                            openCommentSection={openCommentSection}
                            openPostShareModel={openPostShareModel}
                            showOptions={showPostOptionsId === post._id}
                            setShowUpdatePostForm={setShowUpdatePostForm}
                        />
                    )
                })
            ) : (
                <p className="no-posts-message">No Posts Yet</p>
            )}
            <Modal isOpen={showCommentSection} onClose={closeCommentSection} modalType={"bottomHalf"}>
                <CommentSection 
                    post_id={commentPostId}
                    authorId={authorId}
                    comments={commentsToDisplay} 
                    onCommentAdded={handleCommentAdded}
                    commentSectionType={"post"}
                />
            </Modal>

            <Modal isOpen={showPostShareModel} onClose={closePostShareModel} modalType={"bottomHalf"}>
                <PostShareModel postId={sharedPost?._id} post={sharedPost} closePostShareModel={closePostShareModel} />
            </Modal>

            <Modal isOpen={showUpdatePostForm} onClose={closeUpdatePostForm} modalType={"center"}>
                <UpdatePostForm post={postToUpdate} closeUpdatePostForm={closeUpdatePostForm} />
            </Modal>
        </div>
    );
};

export default PostSection;