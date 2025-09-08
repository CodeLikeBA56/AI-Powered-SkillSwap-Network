const NotificationCollection = require('../Models/Notifications.js');
const mongoose = require("../Configuration/Mongo-Config.js");
const { getSocketId } = require('../Services/OnlineUsers');
const SessionCollection = require("../Models/Session.js");
const { io } = require('../Configuration/Socket.js');
const RoomCollection = require("../Models/Rooms.js");
const { GridFSBucket } = require("mongodb");
const stream = require("stream");

let SessionBucket;
const conn = mongoose.connection;

conn.once("open", () => {
  SessionBucket = new GridFSBucket(conn.db, { bucketName: "session-media" });
});

const closeSession = async (req, res) => {
    try {
        const host = req.userId;
        const { sessionId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const result = await SessionCollection.updateOne(
            { _id: sessionId, host }, { $set: { isSessionClosed: true } }, { new: true }
        );

        if (result.modifiedCount === 0)
            return res.status(404).json({ type: "error", message: "Session not found or already closed." });

        io.emit("update-session-status", { sessionId, isSessionClosed: true });
        return res.status(200).json({ type: "success", message: "Session has been successfully closed." });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const reopenSession = async (req, res) => {
    try {
        const host = req.userId;
        const { sessionId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const result = await SessionCollection.updateOne(
            { _id: sessionId, host }, { $set: { isSessionClosed: false } }, { new: true }
        );

        if (result.modifiedCount === 0)
            return res.status(404).json({ type: "error", message: "Session not found or already open." });

        io.emit("update-session-status", { sessionId, isSessionClosed: false });
        return res.status(200).json({ type: "success", message: "Session has been reopened succesfully." });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const endSessionRecording = async (req, res) => {
    try {
        const host = req.userId;
        const { sessionId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const result = await SessionCollection.updateOne(
            { _id: sessionId, host }, { $set: { isBeingRecorded: false } }, { new: true }
        );

        if (result.modifiedCount === 0)
            return res.status(404).json({ type: "error", message: "Session not found or already open." });

        io.emit("update-session-recording-status", { sessionId, isSessionClosed: flase });
        return res.status(200).json({ type: "success", message: "Session has been reopened succesfully." });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const allowHostToPostRecording = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const { roomId, sessionId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(roomId))
            return res.status(400).json({ type: "error", message: "The room id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(attendeeId))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), approvedRecording: true } : attendee;
        });
        session.attendees = updatedAttendees;
        await session.save();

        const populatedSession = await SessionCollection.findById(sessionId).populate("attendees.user", "username profilePicture");
        const hostSocketId = getSocketId(session.host.toString());
        if (hostSocketId) {
            io.to(hostSocketId).emit('update-session-attendees', { sessionId, updatedAttendees: populatedSession.attendees });
        }
        
        io.to(roomId.toString()).emit('update-attendees', { sessionId, updatedAttendees: populatedSession.attendees });
        io.emit('update-global-sessions', { sessionId, updatedAttendees: populatedSession.attendees });
        return res.status(200).json({ type: "success", message: "Attendee request to join session accepted successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const acceptAttendeeJoinRequest = async (req, res) => {
    try {
        const {attendeeId, sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), approvedByHost: true, kickedByHost: false, isLeft: false } : attendee;
        });
        session.attendees = updatedAttendees;
        await session.save();
        return res.status(200).json({ type: "success", message: "Attendee request to join session accepted successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const makeAttendeeCoHost = async (req, res) => {
    try {
        const {attendeeId, sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), isCoHost: true } : attendee;
        });
        session.attendees = updatedAttendees;
        await session.save();
        return res.status(200).json({ type: "success" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const removeAttendeeFromCoHost = async (req, res) => {
    try {
        const {attendeeId, sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), isCoHost: false } : attendee;
        });
        session.attendees = updatedAttendees;
        await session.save();
        return res.status(200).json({ type: "success", message: "Attendee request to join session accepted successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const kickAttendeeFromSession = async (req, res) => {
    try {
        const { roomId, attendeeId, sessionId } = req.params;

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isLeft: true, isCoHost: false, kickedByHost: true, approvedByHost: false } : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();

        await RoomCollection.updateOne({ _id: roomId }, { $pull: { participants: attendeeId } });
        return res.status(200).json({ type: "success", message: "Attendee request to join session accepted successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const onAttendeeMic = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), isMicOn: true } : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your mic is toggled.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const offAttendeeMic = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), isMicOn: false } : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your mic is toggled.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const onAttendeeCamera = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isCameraOn: true } 
            : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your camera is toggled.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}
const offAttendeeCamera = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isCameraOn: false } 
            : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your camera is toggled.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const shareAttendeeScreen = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isCameraOn: true, isPresenting: true }
            : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your screen is shared with members.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const closeAttendeeScreen = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const {sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });
        
        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isPresenting: false }
            : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();
        
        return res.status(200).json({ type: "success", message: `Your shared screen is turned off.` });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const leaveRoom = async (req, res) => {
    try {
        const attendeeId = req.userId;
        const { roomId, sessionId } = req.params;

        const room = await RoomCollection.findOneAndUpdate(
            { _id: roomId, session: sessionId, participants: attendeeId },
            { $pull: { participants: attendeeId } },
        );
        if (!room) return res.status(404).json({ type: "error", message: "Room not found." });

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
            { ...attendee.toObject(), isLeft: true, isCoHost: false, isMicOn: false, isCameraOn: false, isPresenting: false } : attendee;
        });

        session.attendees = updatedAttendees;
        await session.save();

        return res.status(200).json({ type: "success", message: "You have succesfully left the meeting."})
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const endRoom = async (req, res) => {
    try {
        const host = req.userId;
        const { recordingUrl } = req.body;
        const { roomId, sessionId } = req.params;

        const room = await RoomCollection.deleteOne({ _id: roomId, session: sessionId, host });
        if (!room) return res.status(404).json({ type: "error", message: "Room not found." });

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        session.recordingUrl = recordingUrl;
        await session.save();

        const hostSocketId = getSocketId(session.host.toString());
        if (hostSocketId)
            io.to(hostSocketId).emit('update-session-recording', { sessionId, recordingUrl });
        
        io.to(roomId.toString()).emit('end-session', { roomId, sessionId });
        io.emit('update-global-session-recording', { sessionId, recordingUrl });
        return res.status(200).json({ type: "success", message: "You have succesfully left the meeting."})
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

const hostStartsRecording = async (req, res) => {
    try {
        const { roomId, sessionId } = req.params;

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            if (attendee.isHost)
                return { ...attendee.toObject(), presentDuringRecording: true, approvedRecording: true }

            if (!attendee.isLeft && !attendee.kickedByHost && attendee.approvedByHost)
                return  { ...attendee.toObject(), presentDuringRecording: true };

            return attendee;
        });

        session.attendees = updatedAttendees;
        session.isBeingRecorded = true;
        await session.save();

        const populatedSession = await SessionCollection.findById(sessionId).populate("attendees.user", "username profilePicture");

        io.emit("update-session-recording-status", { sessionId, isBeingRecorded: true });
        io.to(roomId.toString()).emit("ask-attendees-to-update-recording-status", { updatedAttendees: populatedSession.attendees });
        return res.status(200).json({ type: "success", message: "Updated attendees status."})
    } catch (error) {
        console.log(error)
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

module.exports = { 
    makeAttendeeCoHost, removeAttendeeFromCoHost, acceptAttendeeJoinRequest, kickAttendeeFromSession,
    onAttendeeMic, offAttendeeMic, onAttendeeCamera, offAttendeeCamera, shareAttendeeScreen, allowHostToPostRecording,
    closeAttendeeScreen, leaveRoom, hostStartsRecording, endSessionRecording, closeSession, reopenSession, endRoom,
};