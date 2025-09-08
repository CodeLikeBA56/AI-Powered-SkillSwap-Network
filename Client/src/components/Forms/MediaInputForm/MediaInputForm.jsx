import "./MediaInputForm.css";
import React, { useRef } from 'react';
import { useAlertContext } from '../../../context/AlertContext';

const MediaInputForm = React.memo(({ attachedMedia = [], setAttachedMedia, mediaType = 'all', maxMediaLimit = 4 }) => {
    const media = useRef(null);
    const { showAlert } = useAlertContext();
    
    const supportedExtensions = {
        image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        video: ['mp4', 'webm', 'ogg', 'mov'],
        document: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']
    };

    const getValidExtensions = () => {
        if (mediaType === 'image/*') return supportedExtensions.image;
        if (mediaType === 'video/*') return supportedExtensions.video;
        if (mediaType === 'document/*') return supportedExtensions.document;
        return [...supportedExtensions.image, ...supportedExtensions.video, ...supportedExtensions.document]; // for 'all'
    };

    const isValidExtension = (fileName) => {
        const extension = fileName.split('.').pop().toLowerCase();
        return getValidExtensions().includes(extension);
    };

    const handleTriggerMediaInput = () => media.current?.click();

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length + attachedMedia.length > maxMediaLimit) {
            showAlert("warning", `You can only attach up to ${maxMediaLimit} media files.`);
            e.target.value = '';
            return;
        }

        const validFiles = [];

        for (const file of files) {
            if (!isValidExtension(file.name)) {
                showAlert("warning", `The file "${file.name}" has an unsupported extension.`);
                continue;
            }
            validFiles.push(file);
        }

        const newFiles = validFiles.filter(file => !attachedMedia.some(att => att.name === file.name && att.size === file.size));
        setAttachedMedia(prev => [...prev, ...newFiles]);
        e.target.value = '';
    };

    const resolveAcceptString = () => {
        const extensions = getValidExtensions();
        return extensions.map(ext => `.${ext}`).join(',');
    };    

    return (
        <>
            <button type='button' className="attachment-btn" onClick={handleTriggerMediaInput}>
                <span className="material-symbols-outlined">attachment</span>
            </button>

            <input
                type='file'
                ref={media}
                multiple
                onChange={handleFileChange}
                hidden
                accept={resolveAcceptString()}
            />
        </>
    );
});

export default MediaInputForm;