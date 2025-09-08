import peer from "../services/Peer.js";
import axiosInstance from "../api/axios";
import { useSocket } from "./SocketProvider";
import { useNavigate } from "react-router-dom";
import { useAlertContext } from "./AlertContext.jsx";
import { useUserProfile } from "./UserProfileProvider";
import React, { createContext, useCallback, useRef, useContext, useEffect, useState } from "react";

export const RTCRoomContext = createContext();

const RTCRoomProvider = ({ children }) => {
    const navigate = useNavigate();
    const { socket } = useSocket();
    const { userInfo } = useUserProfile();
    const { showAlert } = useAlertContext();

    const localStream = useRef(null);
    const recordingStreamRef = useRef(null);
    const [isLocalStreamReady, setIsLocalStreamReady] = useState(false);

    const [peers, setPeers] = useState({});
    const [streams, setStreams] = useState({});
    const [myInfo, setMyInfo] = useState(null);
    const [requestsToJoin, setRequestsToJoin] = useState(null);
    const [remoteSocketIds, setRemoteSocketIds] = useState({});

    const [mediaStatus, setMediaStatus] = useState({isMicOn: false, isCameraOn: false, isScreenSharingOn: false});
      
    
    const [room, setRoom] = useState(() => {
        try {
            const savedRoom = localStorage.getItem('room');
            return savedRoom ? JSON.parse(savedRoom) : null;
        } catch (error) {
            return null;
        }
    });
    
    const [session, setSession] = useState(() => {
        try {
            const savedSession = localStorage.getItem('session');
            return savedSession ? JSON.parse(savedSession) : null;
        } catch (error) {
            return null;
        }
    });

    const getInitialStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true,
            });
            
            localStream.current = stream;
            setIsLocalStreamReady(true);
        } catch (error) {
            console.error("Failed to get media:", error);
        }
    };

    const getRecordingStream = async () => {
        try {
            if (recordingStreamRef.current !== null) return;
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
            const combinedStream = new MediaStream([ // Combine screen + audio tracks
                ...screenStream.getVideoTracks(),
                ...audioStream.getAudioTracks()
            ]);
    
            return combinedStream;
        } catch (error) {
            console.error("Failed to get recording stream:", error);
        }
    };

    useEffect(() => {
        if (room?._id)
            getInitialStream();
    }, [room?._id]);
    
    useEffect(() => {
        if (userInfo === null) closeRTCRoom();
    }, [userInfo]);
    
    useEffect(() => {
        if (room)
            localStorage.setItem('room', JSON.stringify(room));
    }, [room]);

    useEffect(() => {
        if (session)
            localStorage.setItem('session', JSON.stringify(session));
    }, [session]);

    useEffect(() => {
        if (userInfo?._id && room?._id)
            socket.emit('join-socket-room', { roomId: room?._id, userId: userInfo?._id });
    }, [userInfo?._id, room?._id]);

    useEffect(() => {
        if (localStream.current) {
            const audioTracks = localStream.current.getAudioTracks?.()[0];
            const videoTracks = localStream.current.getVideoTracks?.()[0];

            if (audioTracks)
                audioTracks.enabled = mediaStatus?.isMicOn;

            if (videoTracks)
                videoTracks.enabled = mediaStatus?.isCameraOn;
        }
    }, [localStream.current, mediaStatus?.isMicOn, mediaStatus?.isCameraOn]);
    
    // useEffect(() => {
    //     if (localStream.current) {
    //         const videoTracks = localStream.current.getTracks()[1];

    //     }
    // }, [localStream.current, myInfo?.isPresenting]);

    const updateAttendingSession = (attendee) => {
        console.log("Compare previous and updated Attendee", myInfo, attendee);
    
        setMyInfo(prevInfo => {
            const needsUpdate = !prevInfo || prevInfo.isMicOn !== attendee.isMicOn ||
                prevInfo.isCameraOn !== attendee.isCameraOn ||  prevInfo.isPresenting !== attendee.isPresenting;
    
            if (needsUpdate) {
                setMediaStatus(prev => ({
                    ...prev,
                    isMicOn: attendee.isMicOn,
                    isCameraOn: attendee.isCameraOn,
                    isPresenting: attendee.isPresenting
                }));
            }
    
            return attendee;
        });
    
        setSession(prev => {
            const updatedAttendees = prev?.attendees?.map(user => user._id === attendee._id ? attendee : user);
            console.log("Compare previous and new session", prev?.attendees, updatedAttendees);
            return { ...prev, attendees: updatedAttendees };
        });
    };    

    const leaveRoom = async () => {
        try {
            const response = await axiosInstance.patch(`api/session/leave-session/${room._id}/${room.session}`);

            if (200 === response.status) {
                closeRTCRoom();
                navigate(`/dashboard`);
            }
        } catch (error) {
            console.log(error)
        }
    }
    
    const endRoom = async (recordingUrl) => {
        try {
            const response = await axiosInstance.patch(
                `api/session/end-live-session/${room._id}/${room.session}`, { recordingUrl }
            );
        } catch (error) {}
        closeRTCRoom();
        navigate(`/dashboard`);
    }

    const closeRTCRoom = () => {
        setPeers({});
        setRoom(null);
        setStreams({});
        setMyInfo(null);
        setSession(null);
        setRemoteSocketIds({});
        setRequestsToJoin(null);

        if (localStream.current)
                localStream.current.getTracks().forEach(track => track.stop());

        if (recordingStreamRef.current)
            recordingStreamRef.current.getTracks().forEach(track => track.stop());

        localStream.current = null;
        recordingStreamRef.current = null;
        localStorage.removeItem('room');
        localStorage.removeItem('session');
    }

    const handleLeaveSession = useCallback(async ({ roomId, sessionId }) => {
        if (room._id === roomId && session._id === sessionId) closeRTCRoom();
      }, [room, session]);

    const startRoom = async (room) => {
        localStorage.removeItem('room');
        localStorage.removeItem('session');
        setRoom(room);
    }

    useEffect(() => {
        const controller = new AbortController();
    
        const fetchUpdatedRoom = async () => {
            if (!room) return;

            try {
                const response = await axiosInstance.get(`api/room/${room?._id}`, { signal: controller.signal });

                const { room } = response.data;
                startRoom(room);
            } catch (error) {
                if (error.name === 'CanceledError') {
                    console.log('Request canceled');
                } else {
                    const { type, message } = error.response?.data || {};
                    showAlert(type || 'error', message || 'Something went wrong');
                }
            }
        };
    
        fetchUpdatedRoom();
        return () => controller.abort();
    }, [session?._id]);

    useEffect(() => {
        const controller = new AbortController();
    
        const fetchHostedSession = async () => {
            if (!room) return;

            try {
                const response = await axiosInstance.get(`api/session/${room?.session}`, { signal: controller.signal });

                const { session: newSession } = response.data;
                const attendee = newSession?.attendees.find(a => a.user._id === userInfo?._id);
                await updateAttendingSession(attendee);

                if (JSON.stringify(session) !== JSON.stringify(newSession))
                    setSession(newSession);
            } catch (error) {
                if (error.name === 'CanceledError') {
                    console.log('Request canceled');
                } else {
                    const { type, message } = error.response?.data || {};
                    showAlert(type || 'error', message || 'Something went wrong');
                }
            }
        };
    
        fetchHostedSession();
        return () => controller.abort();
    }, [room?._id]);

    useEffect(() => {
        if (0 !== session?.attendees?.length) {
            const requestedToJoin = session?.attendees?.filter(user => !user.approvedByHost)
            setRequestsToJoin(requestedToJoin);
        }
    }, [session?.attendees]);
  
    const acceptJoinRequest = async (attendeeId) => {
        try {
            const sessionId = session._id;
            const response = await axiosInstance.patch(`api/session/accept-join-request/${sessionId}/${attendeeId}`);
            if (response.status === 200) {
                const updatedAttendees = session.attendees.map(attendee => {
                return attendee.user._id === attendeeId ? { ...attendee, approvedByHost: true } : attendee;
                });
                const updatedSession = {...session, attendees: updatedAttendees};
                setSession(updatedSession);

                socket.emit('send-updates-to-room', { session: updatedSession, room });
                socket.emit('user-joining-request-accepted', { to: attendeeId, room: room._id });
            }
        } catch (error) {
        
        }
    }

    const handleAddParticipant = useCallback(async ({ room, session }) => {
        if (room && session) {
            setRoom(room);
            setSession(session);
        }
    }, []);

    const handleMapRemoteSocketId = useCallback(({ userId, socketId }) => {
        if (room && session) {
            if (userId) {
                const userPrevousSocketId = remoteSocketIds[userId];
                if (userPrevousSocketId) {
                    const pc = peers[userPrevousSocketId];
                    if (pc) {
                        setPeers(prev => {
                            const updatedPeers = { ...prev };
                            delete updatedPeers[userPrevousSocketId];
                            updatedPeers[socketId] = pc;
                            return updatedPeers;
                        });                        
                    }
                }
                setRemoteSocketIds((prevState) => ({ ...prevState, [userId]: socketId }));
                socket.emit('update-joined-attendee-socket-id-map', { to: socketId, userId: userInfo?._id });
            }
        }
    }, [socket, room, session, peers, userInfo, remoteSocketIds]);
    
    const handleUpdateMapRemoteSocketId = useCallback(({ userId, socketId }) => {
        if (room && session) {
            if (userId)
                setRemoteSocketIds((prevState) => ({ ...prevState, [userId]: socketId }));
        }
    }, [room, session]);

    const handleUpdateAttendee = async ({ attendee }) => {
        if (!room || !session || attendee?.user?._id === userInfo?._id) return;
        console.log(room, session, attendee);
        setSession(prev => {
          if (!prev) return prev;
          
          // Deep equality check to prevent unnecessary updates
          const existing = prev.attendees.find(a => a._id === attendee._id);
          if (JSON.stringify(existing) === JSON.stringify(attendee)) return prev;
          
          const updatedAttendees = prev.attendees.map(user => 
            user._id === attendee._id ? { ...user, ...attendee } : user
          );
          
          return { ...prev, attendees: updatedAttendees };
        });
    }

    const handleUpdateAttendeeByHost = async ({ attendee }) => {
        if (room && session) {
            const updatedAttendees = session?.attendees?.map(user => user._id === attendee._id ? attendee : user);
            setSession(prev => ({ ...prev, attendees: updatedAttendees }));
        }
    };
    
    const handleNavigateToLiveSession = useCallback(async ({ roomId }) => {
        navigate(`/dashboard/live-session/${roomId}`);
    }, [navigate]);

    const handleUpdateRecordingStatus = useCallback(({ updatedAttendees }) => {
        if (room && session) {
            setSession(prev => ({ ...prev, attendees: updatedAttendees }));
        }
    }, [room, session]);

    useEffect(() => {
        socket.on('joined-user', handleAddParticipant);
        socket.on('update-attendee', handleUpdateAttendee);
        socket.on('update-attendee-by-host', handleUpdateAttendeeByHost);
        socket.on('update-attendee-socket-id-map', handleUpdateMapRemoteSocketId);
        socket.on('update-attendees-socket-id-map', handleMapRemoteSocketId);
        socket.on('navigate-attendee-to-live-session', handleNavigateToLiveSession);
        socket.on("ask-attendees-to-update-recording-status", handleUpdateRecordingStatus);
        
        return () => {
            socket.off('joined-user', handleAddParticipant);
            socket.off('update-attendee', handleUpdateAttendee);
            socket.off('update-attendee-by-host', handleUpdateAttendeeByHost);
            socket.off('update-attendee-socket-id-map', handleUpdateMapRemoteSocketId);
            socket.off('update-attendees-socket-id-map', handleMapRemoteSocketId);
            socket.off('navigate-attendee-to-live-session', handleNavigateToLiveSession);
            socket.off("ask-attendees-to-update-recording-status", handleUpdateRecordingStatus);
        }
    }, [socket, handleAddParticipant, handleUpdateAttendee, handleUpdateAttendeeByHost, handleUpdateMapRemoteSocketId, handleMapRemoteSocketId, handleUpdateRecordingStatus]);

    // Create peer connections when someone joins.

    const handleNegotiation = async (socketId) => {
        const offer = await peer.getOffer(socketId);
        socket.emit('peer-nego-needed', { to: socketId, offer });
    };
      
    const handleTrackEvent = (event, userId) => {
        setStreams(prev => {
            const newStream = new MediaStream();
            newStream.addTrack(event.track);
    
            return { ...prev, [userId]: newStream };
        });
    };    
    
    function handleICECandidateEvent(e, socketId) {
        if (e.candidate)
            socket.emit("ice-candidate", { to: socketId, candidate: e.candidate});
    }

    useEffect(() => {
        if (!session || !isLocalStreamReady) return;
        
        const callAttendees = async () => {
            for(const attendee of session?.attendees) {
                const userId = attendee.user._id;
                const socketId = remoteSocketIds[userId];
    
                if (userId == userInfo?._id || !attendee.approvedByHost || !socketId || peer.isAlreadyConnected(socketId)) continue;
    
                const pc = peer.createPeerConnection(socketId, userId, handleTrackEvent, handleNegotiation, handleICECandidateEvent);
                localStream.current.getTracks().forEach(track => pc.addTrack(track, localStream.current));
                const offer = await peer.getOffer(socketId);
                socket.emit('call-user', { to: socketId, offer, userId });
    
                setPeers({ ...peer.peers });
            };
        }

        if (myInfo?.isHost) {
            callAttendees();
        } else if (!myInfo?.isHost && myInfo?.approvedByHost) {
            setTimeout(() => {
                callAttendees();
            }, 4000);
        }
      }, [session?.attendees, isLocalStreamReady, remoteSocketIds]);

    const handleIncommingCall = useCallback(async ({ from, offer, userId }) => {
        const isAlreadyConnected = peer.isAlreadyConnected(from);
        if (!isAlreadyConnected) {
            const pc = peer.createPeerConnection(from, userId, handleTrackEvent, handleNegotiation, handleICECandidateEvent);
            
            let stream = localStream.current;
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                localStream.current = stream;
            }
        
            stream.getTracks().forEach(track => pc.addTrack(track, localStream.current));
            
            const answer = await peer.getAnswer(from, offer);
            await socket.emit('call-accepted', { to: from, answer });

            setPeers({ ...peer.peers });
        }
    }, [socket, localStream.current, peer]);  
    
    const handleCallAccepted = useCallback(({ from, answer }) => {
        peer.setLocalDescription(from, answer);
    }, [peer]);
    
    const handleIncommingNegoNeeded = useCallback(async ({ from, offer }) => {
        const answer = await peer.getAnswer(from, offer);
        socket.emit('peer-nego-done', { to: from, answer });
    }, [socket, peer]);
    
    const handleFinalPeerNegotiation = useCallback(async ({ from, answer }) => {
        await peer.setLocalDescription(from, answer);
    }, [socket, peer]);
    
    const handleNewIceCandidateMsg = useCallback(async ({ from, candidate }) => {
        const peerConnection = peer.peers[from];
        if (peerConnection) {
            try {
                const cand = new RTCIceCandidate(candidate);
                await peerConnection.addIceCandidate(cand);
            } catch (err) {
                console.error("[ICE ERROR] Failed to add ICE Candidate", err);
            }
        } else {
            console.warn(`[ICE WARNING] Peer connection not found for ${from}`);
        }
    }, [peer]);
      
    
    useEffect(() => {
        socket.on('incomming-call', handleIncommingCall);
        socket.on('call-accepted', handleCallAccepted);
        socket.on('peer-nego-needed', handleIncommingNegoNeeded);
        socket.on('peer-negotiation-final', handleFinalPeerNegotiation);
        socket.on('ice-candidate', handleNewIceCandidateMsg);
    
        return () => {
            socket.off('incomming-call', handleIncommingCall);
            socket.off('call-accepted', handleCallAccepted);
            socket.off('peer-nego-needed', handleIncommingNegoNeeded);
            socket.off('peer-negotiation-final', handleFinalPeerNegotiation);
            socket.off('ice-candidate', handleNewIceCandidateMsg);
        }
    }, [socket, handleIncommingCall, handleCallAccepted, handleIncommingNegoNeeded, handleFinalPeerNegotiation, handleNewIceCandidateMsg]);

    const handleUpdateSessionLikes = useCallback(async ({ sessionId, likes }) => {
        setSession(prev => prev?._id === sessionId ? { ...prev, likes } : prev);
    }, [setSession]);
    
      const handleUpdateSessionComments = useCallback(async ({ sessionId, comments }) => {
        setSession(prev => prev?._id === sessionId ? { ...prev, comments } : prev);
      }, [setSession]);
      
      const handleUpdateSessionShare = useCallback(async ({ sessionId, sharedBy }) => {
        setSession(prev => prev?._id === sessionId ? { ...prev, sharedBy } : prev);
      }, [setSession]);
    
      const handleUpdateSessionStatus = useCallback(async ({ sessionId, isSessionClosed }) => {
        setSession(prev => prev?._id === sessionId ? { ...prev, isSessionClosed } : prev);
      }, [setSession]);
    
      const handleUpdateSessionRecordingStatus = useCallback(async ({ sessionId, isBeingRecorded }) => {
        setSession(prev => prev?._id === sessionId ? { ...prev, isBeingRecorded } : prev);
      }, [setSession]);
    
      useEffect(() => {
        socket.on('end-session', handleLeaveSession);
        socket.on('update-session-share', handleUpdateSessionShare);
        socket.on('update-session-likes', handleUpdateSessionLikes);
        socket.on('update-session-status', handleUpdateSessionStatus);
        socket.on('update-session-comments', handleUpdateSessionComments);
        socket.on('update-session-recording-status', handleUpdateSessionRecordingStatus);
        
        return () => {
            socket.off('end-session', handleLeaveSession);
            socket.off('update-session-share', handleUpdateSessionShare);
            socket.off('update-session-likes', handleUpdateSessionLikes);
            socket.off('update-session-status', handleUpdateSessionStatus);
            socket.off('update-session-comments', handleUpdateSessionComments);
            socket.off('update-session-recording-status', handleUpdateSessionRecordingStatus);
        }
      }, [socket, handleLeaveSession, handleUpdateSessionLikes, handleUpdateSessionComments, handleUpdateSessionShare, handleUpdateSessionStatus, handleUpdateSessionRecordingStatus]);

    return (
        <RTCRoomContext.Provider value={{ 
            myInfo, setMyInfo, room, setRoom, session, setSession, localStream, recordingStreamRef, 
            mediaStatus, peers, streams, requestsToJoin, acceptJoinRequest, remoteSocketIds, 
            startRoom, endRoom, leaveRoom, updateAttendingSession, getInitialStream, getRecordingStream
        }}>
            {children}
        </RTCRoomContext.Provider>
    );
};

export const useRTCRoom = () => useContext(RTCRoomContext);

export default RTCRoomProvider;