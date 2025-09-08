import './ChangeProfileForm.css';
import React, { useRef, useState } from 'react';
import defaultAvatar from '../../../assets/No-Profile.webp';
import { useUserProfile } from '../../../context/UserProfileProvider';
import axiosInstance from '../../../api/axios';
import { useAlertContext } from '../../../context/AlertContext';

const ChangeProfileForm = () => {
    const fileInputRef = useRef(null);
    const { showAlert } = useAlertContext();
    const [previewImage, setPreviewImage] = useState(null);
    const { userInfo, updateUserProfile } = useUserProfile();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleTriggerFileInput = () => {
        fileInputRef.current.click();
    };

    const handleUploadProfile = async () => {
        const selectedFile = fileInputRef.current.files[0];
    
        if (!selectedFile) return showAlert('info', 'Select a new profile first.'); // If no file selected, do nothing
    
        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
    
            const response = await axiosInstance.post(`api/post-single-media/user-media`, formData);
            const uploadedMediaId = response.data.fileId;
    
            updateUserProfile(uploadedMediaId);
    
            setPreviewImage(null); // Reset after successful upload
            fileInputRef.current.value = null;
        } catch (error) {
            console.error("Failed to upload profile picture:", error);
        }
    };

    const imageSrc = previewImage || `${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${userInfo?.profilePicture}`;

    return (
        <div className='change-profile-container'>
            <header>Change Profile Picture</header>
            <div className='image-preview-wrapper'>
                <img
                    src={imageSrc}
                    alt="user-profile"
                    onError={(e) => e.target.src = defaultAvatar}
                />
                <button type='button' className='change-profile-btn' onClick={handleTriggerFileInput}>+</button>
                <input
                    type='file'
                    accept='image/*'
                    ref={fileInputRef}
                    hidden
                    onChange={handleFileChange}
                />
            </div>
            <button type='button' className='change-profile' onClick={handleUploadProfile}>Update Profile</button>
        </div>
    );
};

export default ChangeProfileForm;