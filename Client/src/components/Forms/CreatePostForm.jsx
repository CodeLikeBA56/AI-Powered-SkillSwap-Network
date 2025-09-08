import './Form.css';
import { useState, useRef } from 'react';
import axiosInstance from '../../api/axios';
import { useSocket } from '../../context/SocketProvider';
import { useAlertContext } from '../../context/AlertContext';
import { useUserProfile } from '../../context/UserProfileProvider';
import { useRecommendation } from '../../context/RecommendationProvider';
import { useUserPosts } from '../../context/UserPostsProvider';

const CreatePostForm = ({ closeModal }) => {
    const fileInputRef = useRef(null);
    
    const { socket } = useSocket();
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();
    const { pushCreatedPost } = useUserPosts();
    const { setRecommendedPosts } = useRecommendation();

    const [content, setContent] = useState('');
    const [postVisibility, setPostVisibility] = useState('public');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [hashtags, setHashtags] = useState('');

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + mediaFiles.length > 4) {
            alert("You can only upload up to 4 files.");
            return;
        }
        setMediaFiles([...mediaFiles, ...files]);
    };

    const handleAttachClick = () => {
        fileInputRef.current.click();
    };

    const handleRemoveMedia = (index) => {
        setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim() && hashtags.length === 0) {
            alert("Post content or hashtags is required.");
            return;
        }
    
        const formattedHashtags = hashtags.match(/#[A-Za-z0-9_]+/g) || [];
    
        const postData = new FormData();
        postData.append('content', content);
        postData.append('visibility', postVisibility);
        postData.append('hashtags', JSON.stringify(formattedHashtags));
        mediaFiles.forEach((file) => postData.append('media', file));
    
        try {
            const response = await axiosInstance.post('api/post', postData);
            const { type, message, post } = response.data;
            showAlert(type, message);

            pushCreatedPost(post);
            if ("public" === post.visibility) {
                setRecommendedPosts(prev => [post, ...prev]); // Show post on top of dashboard.
                if (userInfo?.followers && 0 !== userInfo?.followers?.length) { // Send post to followers
                    socket.emit('notify-followers', { post, followers: userInfo.followers});
                }
            }
    
            setContent('');
            setPostVisibility('public');
            setMediaFiles([]);
            setHashtags('');
        } catch (error) {
            alert(error.response?.data?.message || "An error occurred while uploading the post.");
            console.error('Error uploading post:', error);
        }
    };    

    return (
        <div className="form-container">
            <header className='form-header'>
                <button className="modal-close-btn" onClick={() => {
                    document.querySelector('.modal-overlay').classList.remove('show');
                    // setTimeout(() => closeModal(), 300);
                }}>
                    <span className='material-symbols-outlined'>close</span>
                </button>
                <h2 className="form-title">Create Post</h2>
                <button type='button' onClick={handleSubmit}>Create</button>
            </header>
            <h2 className='form-title'>Create a new Post</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-box">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        style={{ whiteSpace: 'pre-wrap' }} // Optional if displayed inside textarea as preview
                        required
                    ></textarea>
                    <label>Post Content</label>
                </div>

                <div className="input-container">
                    <label className='input-label'>Hashtags</label>
                    <input
                        type="text"
                        value={hashtags}
                        className='input-field'
                        onChange={(e) => setHashtags(e.target.value)}
                    />
                    <p className="input-message">
                        Enter related hashtags separated by commas (e.g., #SkillSwap, #Students, #Coding, #ReactNative).
                    </p>
                </div>

                <div className="media-preview">
                    {mediaFiles.map((file, index) => (
                        <div key={index} className="media-item">
                            {file.type.startsWith('image') ? (
                                <img src={URL.createObjectURL(file)} alt="Preview" />
                            ) : (
                                <video src={URL.createObjectURL(file)} controls />
                            )}
                            <button type="button"  className='remove-media-btn' onClick={() => handleRemoveMedia(index)}>
                                <span className='material-symbols-outlined'>close</span>
                            </button>
                        </div>
                    ))}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                />

                <div className="button-group">
                    <button type="button" className="attach-btn" onClick={handleAttachClick}>
                        <span className="material-symbols-outlined">image</span>
                    </button>
                    <select 
                        className='post-visibility'
                        value={postVisibility}
                        onChange={(e) => setPostVisibility(e.target.value)}
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                    </select>
                    <button type="submit" className="btn upload-btn">Upload Post</button>
                </div>
            </form>
        </div>
    );
};

export default CreatePostForm;