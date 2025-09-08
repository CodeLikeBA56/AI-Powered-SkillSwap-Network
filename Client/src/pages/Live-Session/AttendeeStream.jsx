import './AttendeeStream.css';
import React, { useEffect, useRef, memo } from 'react';
import { useUserProfile } from '../../context/UserProfileProvider';

const AttendeeStream = memo(({ user = {}, isMicOn = false, isCameraOn = false, myStream = null }) => {
    const videoRef = useRef(null);
    const { getUserProfile } = useUserProfile();
    const profilePicURL = getUserProfile(user?.username, user?.profilePicture);

    useEffect(() => {
        if (videoRef.current && myStream) {
            videoRef.current.srcObject = myStream;
        }
    }, [myStream, isCameraOn]);

    return (
        <div className="attendee-stream-container" style={{ width: isCameraOn ? 'max-content' : '293px'}}>
            {
                !isCameraOn &&
                <img
                    id={`stream-${user._id}`}
                    src={profilePicURL}
                    alt={user?.username}
                    style={{ borderColor: isMicOn ? 'var(--main-color)' : 'var(--text-color)'}}
                    className='attendee-profile'
                    onError={(e) => e.src = profilePicURL}
                />
            }

            <video
                autoPlay
                ref={videoRef}
                className="attendee-video"
                style={{ display: isCameraOn === false ? 'none' : 'initial'}}
            />

            <div className='attendee-stream-and-info'>
                <img
                    src={profilePicURL}
                    alt={user?.username}
                    className='attendee-avatar'
                    onError={(e) => e.src = profilePicURL}
                />
                <span className='attendee-name'>{user?.username}</span>
            </div>
        </div>
    );
});

export default AttendeeStream;