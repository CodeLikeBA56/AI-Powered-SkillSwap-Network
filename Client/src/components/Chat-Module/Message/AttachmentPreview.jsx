import "./AttachmentPreview.css";
import React from 'react';
import {useNavigate} from "react-router-dom";

const AttachmentPreview = React.memo(({ attachments, isMine = false }) => {
    const navigate = useNavigate();
    const priority = { image: 1, video: 2, document: 3 };

    return (
        <div className="attachment-preview-container">
            {
                attachments?.sort((a, b) => {
                    return (priority[a.type] || 4) - (priority[b.type] || 4);
                }).map(attachment => (
                    "image" === attachment?.type ? 
                        <img 
                            src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${attachment._id}`}
                            alt={attachment.type}
                            onClick={() => window.open(`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${attachment._id}`)}
                        />
                    : "video" === attachment?.type ?
                        <video
                            src={`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${attachment._id}`}
                            onClick={() => window.open(`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${attachment._id}`)}
                        />
                    :
                        <div className="file-detail">
                            <span className="file-icon"
                                style={{
                                    color: isMine ? "#222" : "var(--white-color)",
                                    background:  isMine ? "var(--white-color)" : "var(--main-color)",
                                }}
                                onClick={() => window.open(`${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/group-chat-media/${attachment._id}`)}
                            >{attachment?.name.split(".").pop()}</span>
                            <span className="file-name">{attachment?.name}</span>
                        </div>
                ))
            }
        </div>
    );
});

export default AttachmentPreview;