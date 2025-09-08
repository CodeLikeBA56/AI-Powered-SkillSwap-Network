import './Attendee.css';
import axiosInstance from '../../api/axios';
import { useRTCRoom } from '../../context/RTCProvider';
import { useSocket } from '../../context/SocketProvider';
import React, { useState, useRef, useEffect } from 'react';
import { useAlertContext } from '../../context/AlertContext';
import { useUserProfile } from '../../context/UserProfileProvider';

const Attendee = ({ attendee }) => {
    const { socket } = useSocket();
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();
    const { myInfo, room, session, acceptJoinRequest, updateAttendingSession } = useRTCRoom();

    const optionsRef = useRef(null);
    const [showOptions, setShowOptions] = useState(false);

    const profilePicture = `${import.meta.env.VITE_SERVER_SIDE_API_URL}api/get-media/user-media/${attendee?.user?.profilePicture}`;

    const handleToggleOptions = () => {
        setShowOptions(prev => !prev);
    };

    const handleClickOutside = (e) => {
        if (optionsRef.current && !optionsRef.current.contains(e.target)) {
            setShowOptions(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    const handleMakeCoHost = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/make-attendee-co-host/${sessionId}/${attendee.user._id}`);
            if (response.status === 200) {
                let updatedAttendee = { ...attendee, isCoHost: true };
                showAlert('info', `You have successfully made ${attendee.user.username} a co-host.`);
                socket.emit('update-attendee-by-host', { roomId, attendee: updatedAttendee });
            }
        } catch (error) {
            showAlert('error', `Failed to make ${attendee.user.username} a co-host.`);
        }
        setShowOptions(false);
    };

    const handleRemoveCoHost = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/remove-attendee-from-co-host/${sessionId}/${attendee.user._id}`);
            if (response.status === 200) {
                let updatedAttendee = { ...attendee, isCoHost: false };
                showAlert('info', `You have remove ${attendee.user.username} as a co-host.`);
                socket.emit('update-attendee-by-host', { roomId, attendee: updatedAttendee });
            }
        } catch (error) {
            showAlert('error', `Failed to remove ${attendee.user.username} as a co-host.`);
        }
        setShowOptions(false);
    };

    const handleKick = () => {
        console.log('Kick', attendee.user.username);
        setShowOptions(false);
    };

    return (
        <div className='attendee-detail'>
            <img
                alt="Profile"
                src={profilePicture}
                className="attendee-profile"
            />
            <div className='attendee-info'>
                <h2 className='username'>{attendee?.user?.username}</h2>
                {attendee?.isHost && <span className='attendee-role'>Host</span>}
                {!attendee?.isHost && attendee?.isCoHost && <span className='attendee-role'>Co-host</span>}
            </div>

            {
                userInfo?._id !== attendee?.user?._id && !attendee.isHost && attendee?.approvedByHost && (myInfo?.isHost || myInfo?.isCoHost) && 
                <div className="attendee-options" ref={optionsRef}>
                    <button type='button' className='attendee-options-popup-btn' onClick={handleToggleOptions}>
                        <span className="material-symbols-outlined">more_vert</span>
                    </button>

                    { showOptions && (
                        <div className="attendee-popup-menu">
                            { !attendee?.isCoHost ? (
                                <button type='button' onClick={handleMakeCoHost}>Make Co-host</button>
                            ) : (
                                <button onClick={handleRemoveCoHost}>Remove Co-host</button>
                            )}
                            <button type='button' className='kick-attendee-btn' onClick={handleKick}>Kick</button>
                        </div>
                    )}
                </div>
            }

            { 
                !attendee.isHost && !attendee?.approvedByHost && (
                    <button type='button' className='accept-join-req-btn' onClick={() => acceptJoinRequest(attendee?.user?._id)}>Accept</button>
                )
            }
        </div>
    );
};

export default Attendee;