import "./CurrentAttendingSession.css";
import { useNavigate } from "react-router-dom";
import NoProfile from "../../../assets/No-Profile.webp"
import React, { useState, useEffect, useRef } from 'react';
import { useRTCRoom } from "../../../context/RTCProvider.jsx";
import { useUserProfile } from "../../../context/UserProfileProvider.jsx";

const CurrentAttendingSession = () => {
    const navigate = useNavigate();
    const { getUserProfile } = useUserProfile();
    const { room, mediaStatus, localStream, myInfo } = useRTCRoom();

    const videoRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    const profilePicURL = getUserProfile(myInfo?.user?.username, myInfo?.user?.profilePicture) || NoProfile;

    useEffect(() => {
        if (videoRef.current && localStream.current)
            videoRef.current.srcObject = localStream.current;
    }, [localStream.current, mediaStatus?.isCameraOn]);

    useEffect(() => {
        if (videoRef.current)
            videoRef.current.muted = !mediaStatus?.isMicOn;
    }, [mediaStatus?.isMicOn]);

    const handleNavigateToSession = () => {
        navigate(`/dashboard/live-session/${room._id}`);
    }

    return (
        <div className={`attending-session-card ${isOpen === true ? 'show-card' : ''} `}>
            <header>Live Session</header>
            {
                myInfo?.approvedByHost && (
                    <button className="redirect-to-session-btn" onClick={handleNavigateToSession}>
                        <span className="material-symbols-outlined">open_in_new</span>
                    </button>
                )
            }
            {
                !mediaStatus?.isCameraOn &&
                <img
                    src={profilePicURL}
                    className='attendee-profile'
                    onError={(e) => e.src = profilePicURL}
                    alt={myInfo?.user?.username}
                />
            }
            {
                mediaStatus?.isCameraOn && 
                <video
                    ref={videoRef}
                    src={localStream.current} 
                    autoPlay 
                    muted={!mediaStatus?.isMicOn} 
                    className="my-stream"
                />
            }

            <span className='attendee-name'>{myInfo?.user?.username}</span>
             
            { 
                myInfo?.approvedByHost && (
                    <button className="end-call-btn">
                        <span className="material-symbols-outlined">call_end</span>
                    </button>
                )
            }

            { 
                !myInfo?.approvedByHost && (
                    <p className="msg">Waiting for host to accept your request.</p>
                )
            }

            <button className="hide-card-btn" onClick={() => setIsOpen(prev => !prev)}>
                <span className="material-symbols-outlined">{isOpen === true ? "keyboard_double_arrow_right" : "keyboard_double_arrow_left"}</span>
            </button>
        </div>
    );
}

export default CurrentAttendingSession;