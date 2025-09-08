import './Form.css';
import axiosInstance from '../../api/axios';
import { useState, useRef, useEffect } from 'react';
import { useAlertContext } from '../../context/AlertContext';
import { useUserPosts } from '../../context/UserPostsProvider';
import { useRecommendation } from '../../context/RecommendationProvider';

const UpdatePostForm = ({ post, closeUpdatePostForm }) => {
    const fileInputRef = useRef(null);
    
    const { updatePost } = useUserPosts();
    const { showAlert } = useAlertContext();
    const { setRecommendedPosts } = useRecommendation();

    const [content, setContent] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [mediaFiles, setMediaFiles] = useState([]);
    const [newMediaFiles, setNewMediaFiles] = useState([]);
    const [mediaFilesToDelete, setMediaFilesToDelete] = useState([]);
    const [postVisibility, setPostVisibility] = useState('public');

    useEffect(() => {
        if (post) {
            setContent(post.content);
            setHashtags(post.hashtags.join(', '));
            setMediaFiles(post.media);
            setPostVisibility(post.visibility);
        }
    }, [post]);

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if ((files.length + mediaFiles.length > 4) || (mediaFiles.length + newMediaFiles.length + files.length > 4)) {
            showAlert("info", "You can only upload up to 4 files.");
            return;
        }
        setNewMediaFiles(prev => [...prev, ...files]);
    };

    const handleAttachClick = () => {
        fileInputRef.current.click();
    };

    const handleRemoveMedia = (fileId, index) => {
        setMediaFilesToDelete(prev => [...prev, fileId]);
        setMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const handleRemoveNewMedia = (index) => {
        setNewMediaFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
    };

    const resetMedia = () => {
        setMediaFiles(post.media);
        setMediaFilesToDelete([]);
        setNewMediaFiles([]);
    }

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
        postData.append('mediaFilesToDelete', JSON.stringify(mediaFilesToDelete));
        newMediaFiles?.forEach((file) => postData.append('media', file));
    
        mediaFilesToDelete.forEach(async fileId => {
            const response = await axiosInstance.delete(`api/delete-media/post-media/${fileId}`);
        });

        try {
            const response = await axiosInstance.put(`api/post/${post._id}`, postData);
            const { type, message, updatedPost } = response.data;
            showAlert(type, message);
            updatePost(updatedPost);

            setContent('');
            setHashtags('');
            setPostVisibility('public');
            setMediaFiles([]);
            setNewMediaFiles([]);

            closeUpdatePostForm();
        } catch (error) {
            showAlert('error', 'An error occured while updating post.')
            console.error('Error uploading post:', error);
        }
    };    

    return (
        <div className="form-container">
            <header className='form-header'>
                <button className="modal-close-btn" onClick={() => {
                    document.querySelector('.modal-overlay').classList.remove('show');
                    setTimeout(() => closeModal(), 300);
                }}>
                    <span className='material-symbols-outlined'>close</span>
                </button>
                <h2 className="form-title">Create Post</h2>
                <button type='button' onClick={handleSubmit}>Create</button>
            </header>
            <h2 className='form-title'>Edit Post</h2>
            <form onSubmit={handleSubmit}>
                <div className="input-container">
                    <label className='input-label'>Post Content</label>
                    <textarea
                        value={content}
                        className='textarea-field'
                        onChange={(e) => setContent(e.target.value)}
                        rows={6}
                        style={{ whiteSpace: 'pre-wrap' }} // Optional if displayed inside textarea as preview
                        required
                    ></textarea>
                </div>

                <div className="input-container">
                    <label className='input-label'>Hashtags</label>
                    <input
                        type="text"
                        value={hashtags}
                        className='input-field'
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="#SkillSwap, #Students"
                    />
                    <p className="input-message">
                        Enter related hashtags separated by commas (e.g., #SkillSwap, #Students, #Coding, #ReactNative).
                    </p>
                </div>

                <div className="media-preview">
                    { 0 !== mediaFiles.length && mediaFiles.map((file, index) => (
                        <div key={index} className="media-item">
                            {file.type.startsWith('image') ? (
                                <img 
                                    src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/post-media/${file._id}`} 
                                    alt="Preview" 
                                    
                                />
                            ) : (
                                <video src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/post-media/${file._id}`} controls />
                            )}
                            <button type="button"  className='remove-media-btn' onClick={() => handleRemoveMedia(file._id, index)}>
                                <span className='material-symbols-outlined'>close</span>
                            </button>
                        </div>
                    ))}
                    
                    { 0 !== newMediaFiles.length && newMediaFiles.map((file, index) => (
                        <div key={index} className="media-item">
                            {file.type.startsWith('image') ? (
                                <img 
                                    src={URL.createObjectURL(file)} 
                                    alt="Preview" 
                                    
                                />
                            ) : (
                                <video src={URL.createObjectURL(file)} controls />
                            )}
                            <button type="button"  className='remove-media-btn' onClick={() => handleRemoveNewMedia(index)}>
                                <span className='material-symbols-outlined'>close</span>
                            </button>
                        </div>
                    ))}

                    <button type='button' className='reset-images-btn' onClick={resetMedia}>
                        <span className="material-symbols-outlined">refresh</span>
                    </button>
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
                    <button type="submit" className="btn upload-btn">Update Post</button>
                </div>
            </form>
        </div>
    );
};

export default UpdatePostForm;