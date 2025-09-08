import './WaitingRoom.css';
import axiosInstance from '../../api/axios';
import React, { useEffect, useState } from 'react';
import { useRTCRoom } from '../../context/RTCProvider';
import { useSocket } from '../../context/SocketProvider';
import { useAlertContext } from '../../context/AlertContext';

const WaitingRoom = () => {
    const { socket } = useSocket();
    const { showAlert } = useAlertContext();
    const { myInfo, room, session, leaveRoom, localStream } = useRTCRoom();

    const [isMicOn, setIsMicOn] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(false);

    useEffect(() => {
        if (myInfo) {
            setIsMicOn(myInfo?.isMicOn || false)
            setIsCameraOn(myInfo?.isCameraOn || false);
        }
    }, [myInfo]);

    const handleTurnOnMic = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/on-attendee-mic/${sessionId}`);
            
            if (response.status === 200) {
                let attendee = { ...myInfo, isMicOn: true };
                setIsMicOn(true);
                socket.emit('notify-attendee-about-update', { roomId, attendee });
            }
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    }

    const handleTurnOffMic = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/off-attendee-mic/${sessionId}`);
            
            if (response.status === 200) {
                let attendee = { ...myInfo, isMicOn: false };
                setIsMicOn(false);
                socket.emit('notify-attendee-about-update', { roomId, attendee });
            }
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    }

    const handleTurnOnCamera = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/on-attendee-camera/${sessionId}`);
            
            if (response.status === 200) {
                let attendee = { ...myInfo, isCameraOn: true };
                setIsCameraOn(true);
                socket.emit('notify-attendee-about-update', { roomId, attendee });
            }
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    }

    const handleTurnOffCamera = async () => {
        try {
            const roomId = room._id;
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/off-attendee-camera/${sessionId}`);
        
            if (response.status === 200) {
                let attendee = { ...myInfo, isCameraOn: false };
                setIsCameraOn(false);
                socket.emit('notify-attendee-about-update', { roomId, attendee });
            }
        } catch (error) {
            const { type, message } = error.response.data;
            showAlert(type, message);
        }
    }

    return (
        <div className="waiting-room-container">
            <h1 className='attending-session-title'>{`Session Topic: ${session?.title}`}</h1>
            <div className="video-preview">
                {isCameraOn ? (
                <div className="video-on">🎥 Camera Preview (on)</div>
                ) : (
                <div className="video-off">
                    
                    <p>Camera is Off</p>
                </div>
                )}
            </div>

            <div className="controls">
                {
                    isMicOn && 
                    <button type="button" onClick={handleTurnOffMic} className={`control-btn active-btn}`}>
                        <span className="material-symbols-outlined">mic</span>
                    </button>
                }
                {
                    !isMicOn && 
                    <button type="button" onClick={handleTurnOnMic} className={`control-btn inactive-btn`}>
                        <span className="material-symbols-outlined">mic_off</span>
                    </button>
                }
                {
                    isCameraOn &&
                    <button type="button" onClick={handleTurnOffCamera} className={`control-btn active-btn`}>
                        <span className="material-symbols-outlined">videocam</span>
                    </button>
                }
                {
                    !isCameraOn &&
                    <button type="button" onClick={handleTurnOnCamera} className={`control-btn inactive-btn`}>
                        <span className="material-symbols-outlined">videocam_off</span>
                    </button>
                }
            </div>

            <div className="status">
                <span className='material-symbols-outlined'>info</span>
                <p>Waiting for host</p>
                <p className='host-name'>{session?.host.username}</p>
                <p>to admit you...</p>
            </div>

            <button className="leave-btn" onClick={leaveRoom}>
                <span>Leave Meeting</span>
                <span className='material-symbols-outlined btn-icon'>cancel</span>
            </button>
        </div>
    );
};

export default WaitingRoom;