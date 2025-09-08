import "./Live-Session.css";
import Attendee from "./Attendee.jsx";
import SessionInfo from "./SessionInfo.jsx";
import axiosInstance from "../../api/axios.js";
import { useNavigate } from "react-router-dom";
import AttendeeStream from "./AttendeeStream.jsx";
import React, { useEffect, useState } from "react";
import Modal from "../../components/Custom/Modal.jsx";
import Recorder from "../../services/SessionRecorder.js";
import { useSocket } from "../../context/SocketProvider";
import { useRTCRoom } from "../../context/RTCProvider.jsx";
import { useAlertContext } from "../../context/AlertContext.jsx";
import { useUserProfile } from '../../context/UserProfileProvider.jsx';
import { useUserSessions } from "../../context/UserSessionsProvider.jsx";
import CommentSection from "../../components/Common/Comment-Section/Comment-Section.jsx";

const LiveSession = ({ recentScreen = "/Dashboard" }) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { userInfo } = useUserProfile();
  const { allowHostToPostRecording } = useUserSessions();
  const { showAlert } = useAlertContext();
  
  const { 
    myInfo, room, session, setSession, localStream, recordingStreamRef,
    mediaStatus, getRecordingStream, endRoom, leaveRoom, peers, requestsToJoin, 
    streams, updateAttendingSession, getInitialStream
  } = useRTCRoom();

  const [isRecording, setIsRecording] = useState(false);
  const [previewRecording, setPreviewRecording] = useState(false);
  const [showPreviewContainer, setShowPreviewContainer] = useState(false);
  const [viewSessionInfo, setViewSessionInfo] = useState(false);
  const [openCommentSection, setOpenCommentSection] = useState(false);

  const [activeTab, setActiveTab] = useState(null);
  const [headerMsg, setHeaderMsg] = useState("Live Session");

  useEffect(() => {
    const checkRestoredSegments = async () => {
      await Recorder.ensureReady(); // wait for restored data
      if (Recorder.segments.length > 0 && previewRecording === false) {
        setPreviewRecording(true); // show preview button
      }
      console.log('[Restored Segments]', Recorder.segments);
    };
  
    checkRestoredSegments();
  }, []);  

  const handleOpenCommentSection = async () => {
    setOpenCommentSection(true);
    setActiveTab("discussion");
  }
  
  const handleCloseCommentSection = async () => {
    setOpenCommentSection(false);
    setActiveTab(null);
  }

  const handleCommentAdded = (updatedSession) => {
    setSession(prev => ({...prev, comments: updatedSession.comments}));
  };

  const handleViewSessionInfo = async () => {
    setActiveTab("info");
    setViewSessionInfo(true);
  }
  
  const handleCloseSessionInfo = async () => {
    setActiveTab(null);
    setViewSessionInfo(false);
  }

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStream.current?.getTracks()?.forEach(track => track.stop());
  
      Object.values(peers).forEach(pc => {
        pc.close();
      });
    };
  
    window.addEventListener('beforeunload', handleBeforeUnload);
  
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [peers, localStream.current]);  

  const handleTurnOnMic = async () => {
    try {
      const roomId = room._id;
      const sessionId = session._id;
      const response = await axiosInstance.patch(`api/session/on-attendee-mic/${sessionId}`);

      if (response.status === 200) {
        let attendee = { ...myInfo, isMicOn: true };
        console.log("Ready to send for updation", attendee);
        await updateAttendingSession(attendee);
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
        console.log("Ready to send for updation", attendee);
        await updateAttendingSession(attendee);
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
        await updateAttendingSession(attendee);
        socket.emit('notify-attendee-about-update', { roomId, attendee });
      }
    } catch (error) {
      console.log(error)
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
        await updateAttendingSession(attendee);
        socket.emit('notify-attendee-about-update', { roomId, attendee });
      }
    } catch (error) {
      console.log(error)
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }
  
  const handleShareScreen = async () => {
    try {
      const roomId = room._id;
      const sessionId = session._id;
      const response = await axiosInstance.patch(`api/session/share-attendee-screen/${sessionId}`);
      
      if (response.status === 200) {
        shareScreen();
        let attendee = { ...myInfo, isCameraOn: true, isPresenting: true };
        await updateAttendingSession(attendee);
        socket.emit('notify-attendee-about-update', { roomId, attendee });
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const handleTurnOffSharedScreen = async () => {
    try {
      const roomId = room._id;
      const sessionId = session._id;
      const response = await axiosInstance.patch(`api/session/turn-off-attendee-screen/${sessionId}`);
      
      if (response.status === 200) {
        let attendee = { ...myInfo, isPresenting: false };
        await updateAttendingSession(attendee);
        stopSharing();
        socket.emit('notify-attendee-about-update', { roomId, attendee });
      }
    } catch (error) {
      const { type, message } = error.response.data;
      showAlert(type, message);
    }
  }

  const shareScreen = () => {
    navigator.mediaDevices.getDisplayMedia({ cursor: true }).then((stream) => {
      const screenTrack = stream.getVideoTracks()[0];
      
      if (localStream.current) {
        const oldVideoTrack = localStream.current.getVideoTracks()[0];
        if (oldVideoTrack) localStream.current.removeTrack(oldVideoTrack);
        localStream.current.addTrack(screenTrack);
      }
  
      Object.values(peers).forEach(pc => {
        const sender = pc.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);
        else pc.addTrack(screenTrack, stream);
      });

      screenTrack.onended = () => stopSharing();
    });
  };

  const stopSharing = async () => {
    await getInitialStream();
    const cameraTrack = localStream.current.getVideoTracks()[0];
  
    Object.values(peers).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === 'video');
      if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
    });
  };
  

  const handleStartRecording = async () => {
    if (recordingStreamRef.current === null)
      recordingStreamRef.current = await getRecordingStream();

    const roomId = room._id;
    const sessionId = session._id;
    await axiosInstance.patch(`api/session/update-attendee-recording-status/${roomId}/${sessionId}`);
    await Recorder.ensureReady();
    setIsRecording(true);
    setPreviewRecording(true);
    Recorder.start(recordingStreamRef.current);
  }

  const handleStopRecording = async () => {
    setIsRecording(false);
    Recorder.stop();

    try {
      const sessionId = session._id;
      await axiosInstance.patch(`api/session/ended-session-recording/${sessionId}`);
    } catch (error) {}
  }

  const handlePreviewRecording = async () => {
    const previewBlob = await Recorder.getPreviewBlob();
    if (previewBlob) {
      const url = URL.createObjectURL(previewBlob); // Use the URL in a video tag
      document.getElementById('preview-video').src = url;
    } else {
      console.log('No preview available.');
    }
  };

  const handleShowRecordingPreviewContainer = () => {
    if (false === showPreviewContainer) { // if false then fetch and display recording.
      handlePreviewRecording();
      setShowPreviewContainer(true);
    } else { // if true just hide the container
      setShowPreviewContainer(false);
    }
  }


  const handleEndRoom = async () => {
    let recordingUrl = null;
    const videoBlob = await Recorder.finalize();

    if (videoBlob) {
      try {
        const mediaToUpload = new FormData();
        mediaToUpload.append('file', videoBlob, 'recording.webm');
        const response  = await axiosInstance.post('api/post-single-media/post-media', mediaToUpload, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        recordingUrl = response.data.fileId;
      } catch (error) {
        showAlert("error", "Failed to upload session recording.")
      }
    }

    endRoom(recordingUrl);
  }

  useEffect(() => {
    const overlay = document.getElementById('screen-shot-prevention');
  
    const handleFocus = () => {
      if (overlay) overlay.style.display = 'none';
    };
  
    const handleBlur = () => {
      if (overlay) overlay.style.display = 'initial';
    };

    const handleKeyDown = (e) => {
      if ((e.key === 'PrintScreen') || (e.ctrlKey && e.key === 'p')) { // Windows screenshot
        e.preventDefault();
        if (overlay) overlay.style.display = 'initial';
      }
    
      // Mac screenshot
      if (e.metaKey) {
        e.preventDefault();
        if (overlay) overlay.style.display = 'initial';
      }

      if (e.shiftKey) {
        e.preventDefault();
        if (overlay) overlay.style.display = 'initial';
      }

      if ((e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4'))) {
        e.preventDefault();
        if (overlay) overlay.style.display = 'initial';
      }
    };

    const handleKeyUp = (e) => {
      if ((e.key === 'PrintScreen') || (e.ctrlKey && e.key === 'p')) { // Windows screenshot
        e.preventDefault();
        if (overlay) overlay.style.display = 'none';
      }
    
      // Mac screenshot
      if (e.key === 'Meta') {
        e.preventDefault();
        if (overlay) overlay.style.display = 'none';
      }
      if (e.key === 'Shift') {
        e.preventDefault();
        if (overlay) overlay.style.display = 'none';
      }
      if ((e.key === 'Meta' && e.key === 'Shift' && (e.key === '3' || e.key === '4'))) {
        e.preventDefault();
        if (overlay) overlay.style.display = 'none';
      }
    };    

    window.addEventListener('blur', handleBlur);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('load', handleFocus);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('load', handleFocus);
    };
  }, []);

  if (!room || !session) {
    return (
      <div className="invalid-route">
        <h2>Unauthorized Access</h2>
        <p>You cannot access the live session directly.</p>
        <button onClick={() => navigate(recentScreen)} className="redirect-btn">
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div id="screen-shot-prevention"></div>
      <header className="session-header">
        <button className="back-btn" type="button" onClick={() => navigate(recentScreen)}>
          <span className="material-symbols-outlined back-btn-icon">keyboard_backspace</span>
        </button>
        <h2 className="header-msg">{headerMsg}</h2>

        {
          !isRecording && previewRecording && (
            <button type="button" id="preview-recording-btn" onClick={handleShowRecordingPreviewContainer}>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" fill="currentColor" className="bi bi-collection-play-fill" viewBox="0 0 16 16">
                <path d="M2.5 3.5a.5.5 0 0 1 0-1h11a.5.5 0 0 1 0 1zm2-2a.5.5 0 0 1 0-1h7a.5.5 0 0 1 0 1zM0 13a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 16 13V6a1.5 1.5 0 0 0-1.5-1.5h-13A1.5 1.5 0 0 0 0 6zm6.258-6.437a.5.5 0 0 1 .507.013l4 2.5a.5.5 0 0 1 0 .848l-4 2.5A.5.5 0 0 1 6 12V7a.5.5 0 0 1 .258-.437"/>
              </svg>
            </button>
          )
        }

        {
          myInfo?.isHost &&
          <button 
            type="button" className="recording-btn" 
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            style={{background: isRecording ? 'var(--main-color)' : 'var(--secondary-color)', marginLeft: (false === isRecording && previewRecording) ? '0px' : 'auto'}}
          >
            {
              isRecording ? 
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-stop-circle" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="M5 6.5A1.5 1.5 0 0 1 6.5 5h3A1.5 1.5 0 0 1 11 6.5v3A1.5 1.5 0 0 1 9.5 11h-3A1.5 1.5 0 0 1 5 9.5z"/>
                </svg>
              : 
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" className="bi bi-record-circle" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                  <path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                </svg>
            }
          </button>
        }
        <button type="button" 
        style={{ marginLeft: myInfo?.isHost ? '' : 'auto' }}
        className={`comment-session-btn ${activeTab === "discussion" ? "active-btn" : "inactive-btn"}`} onClick={handleOpenCommentSection}>
          <span className="material-symbols-outlined">chat</span>
        </button>
        <button type="button" className={`session-info-btn ${activeTab === "info" ? "active-btn" : "inactive-btn"}`} onClick={handleViewSessionInfo}>
          <span className="material-symbols-outlined">info</span>
        </button>
      </header>
      
      <main className="session-main">
        <div className="video-section">
          {
            0 !== session?.attendees?.length && session?.attendees
              ?.filter(attendee => attendee.approvedByHost && !attendee.isLeft)
              ?.map(attendee => {
                return (
                  <AttendeeStream 
                    key={attendee._id}
                    user={attendee.user} 
                    isMicOn={attendee.isMicOn}
                    isCameraOn={attendee.isCameraOn}
                    myStream={attendee.user._id === userInfo._id ? localStream.current : streams[attendee.user._id]}
                  />
                )
            })
          }

          <div className="control-bar">
            {
              mediaStatus?.isMicOn && 
              <button type="button" onClick={handleTurnOffMic} className={`control-btn active-btn}`}>
                <span className="material-symbols-outlined">mic</span>
              </button>
            }
            {
              !mediaStatus?.isMicOn && 
              <button type="button" onClick={handleTurnOnMic} className={`control-btn inactive-btn`}>
                <span className="material-symbols-outlined">mic_off</span>
              </button>
            }
            {
              mediaStatus?.isCameraOn &&
              <button type="button" onClick={handleTurnOffCamera} className={`control-btn active-btn`}>
                <span className="material-symbols-outlined">videocam</span>
              </button>
            }
            {
              !mediaStatus?.isCameraOn &&
              <button type="button" onClick={handleTurnOnCamera} className={`control-btn inactive-btn`}>
                <span className="material-symbols-outlined">videocam_off</span>
              </button>
            }
            {
              mediaStatus?.isPresenting &&
              <button type="button" onClick={handleTurnOffSharedScreen} className={`control-btn active-btn`}>
                <span className="material-symbols-outlined">screen_share</span>
              </button>
            }
            {
              !mediaStatus?.isPresenting &&
              <button type="button" onClick={handleShareScreen} className={`control-btn inactive-btn`}>
                <span className="material-symbols-outlined">screen_share</span>
              </button>
            }
            <button className="end-call-btn" onClick={userInfo?._id === session?.host?._id ? handleEndRoom : leaveRoom}>
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>

        <aside className="session-sidebar">

          <div className="recording-preview-container" id="recording-preview-container"
            style={{ right: showPreviewContainer ? 'calc(100% + 20px)' : '-100%', zIndex: showPreviewContainer ? '0' : '-1'}}
          >
            <header>
              <button className="hide-preview">
                <span className="material-symbols-outlined">close</span>
              </button>
              <span className="preview-title">Recording Preview</span>
            </header>
            <video
              id="preview-video"
              controls
              controlsList="nodownload"
              preload="metadata"
              width="100%"
              style={{ maxHeight: '300px', borderRadius: '8px' }}
            />
          </div>

          {
            !myInfo?.isHost && myInfo?.presentDuringRecording && (
              <div className="permission-container">
                <span>Allow host to post recording?</span>
                <button type='button' className='accept-join-req-btn' onClick={() => allowHostToPostRecording(room._id, session._id)}>Allow</button>
              </div>
            )
          }


          <h2 className="attendees-container">
            <span>Attendees</span>
            <span className="material-symbols-outlined">group</span>
          </h2>
          
          {
            0 !== session?.attendees?.length ?
              session?.attendees
                ?.filter(attendee => room?.participants.includes(attendee.user._id) && attendee.approvedByHost && !attendee.isLeft)
                ?.map(attendee => {
                  return <Attendee key={attendee?.user?._id} attendee={attendee} host={attendee.isHost} />
                })
            :
              <p>No one joined yet.</p>
          }

          {
            requestsToJoin && 
            <h3 className="request-to-join-container">
                <span>Requests to join</span>
                <span no-of-requests={requestsToJoin?.length || 0} className="material-symbols-outlined request-icon">notification_add</span>
            </h3>
          }
          
          { requestsToJoin && requestsToJoin?.map(user => <Attendee attendee={user} />) }
        </aside>
      </main>

      <Modal isOpen={openCommentSection} onClose={handleCloseCommentSection} modalType={"bottomHalf"}>
        <CommentSection 
          post_id={session?._id}
          authorId={session?.host?._id}
          comments={session?.comments}
          onCommentAdded={handleCommentAdded}
          commentSectionType={"session"}
        />
      </Modal>
      
      <Modal isOpen={viewSessionInfo} onClose={handleCloseSessionInfo} modalType={"center"}>
        <SessionInfo session={session} />
      </Modal>
    </div>
  );
};

export default LiveSession;