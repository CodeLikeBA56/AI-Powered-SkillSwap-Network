import './Form.css';
import './CreateGroupForm.css';
import FormHeader from './FormHeader';
import { useState, useRef } from 'react';
import axiosInstance from '../../api/axios';
import image from '../../assets/No-Profile.webp';
import { useChat } from '../../context/ChatProvider';
import { useAlertContext } from '../../context/AlertContext';

const CreateGroupForm = ({ closeModal }) => {
    const fileInputRef = useRef(null);

    const { showAlert } = useAlertContext();
    const { selectedUsers, setSelectedUsers, handleCloseModal, initiateGroupChat, setShowCreateGroupChatForm } = useChat();

    const [name, setName] = useState('');
    const [hashtags, setHashtags] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [description, setDescription] = useState('');
    const [visibility, setVisibility] = useState('public');

    const handleAttachClick = () => fileInputRef.current.click();
    const handleFileChange = (e) => setMediaFile(e.target.files[0]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return showAlert("info", "Group name is required.");
        if (!selectedUsers.length) return showAlert("info", "Please select at least one participant");
    
        const formattedHashtags = hashtags.match(/#[A-Za-z0-9_]+/g) || [];
        setIsLoading(true);

        try {
            let profileImageId = null;

            if (mediaFile) {
                const formData = new FormData();
                formData.append("file", mediaFile);
            
                const uploadRes = await axiosInstance.post(`api/post-single-media/group-chat-media`, formData);
                profileImageId = uploadRes.data.fileId;
            }            

            const groupData = {
                name, profile: profileImageId, description,
                hashtags: formattedHashtags, visibility,
            };

            await initiateGroupChat(groupData);
            document.querySelector('.modal-overlay').classList.remove('show');
            setTimeout(() => handleCloseModal(), 300);
            setSelectedUsers([]);
        } catch (err) {
            console.error(err);
            showAlert("error", "Failed to create group. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container">
            <FormHeader header={"Create Group"} closeModal={closeModal} handleSubmit={handleSubmit} />
            <form onSubmit={handleSubmit}>
                <button type="button" className="change-group-profile-btn" onClick={handleAttachClick}>
                    <img
                        src={mediaFile ? URL.createObjectURL(mediaFile) : image}
                        className="group-profile"
                        alt="Group Profile"
                    />
                </button>

                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    hidden
                    onChange={handleFileChange}
                />

                <div className="input-box">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <label>Group Name</label>
                </div>

                <div className="input-box">
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    ></textarea>
                    <label>Group Description</label>
                </div>

                <div className="input-box">
                    <input
                        type="text"
                        value={hashtags}
                        onChange={(e) => setHashtags(e.target.value)}
                        placeholder="#SkillSwap, #Students"
                    />
                    <label>Hashtags</label>
                </div>

                <div className="button-group">
                    <button type="button" className="btn attach-btn" onClick={() => setShowCreateGroupChatForm(false)}>
                        <span className="material-symbols-outlined">group_add</span>
                    </button>
                    <select 
                        value={visibility}
                        className='post-visibility'
                        onChange={(e) => setVisibility(e.target.value)}
                    >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="followers-only">Followers-only</option>
                    </select>
                    <button type="submit" className="btn upload-btn">{isLoading ? "Creating..." : "Create Group"}</button>
                </div>
            </form>
        </div>
    );
};

export default CreateGroupForm;