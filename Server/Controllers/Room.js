const mongoose = require("../Configuration/Mongo-Config.js");
const SessionCollection = require("../Models/Session.js");
const RoomCollection = require("../Models/Rooms.js");
const UserCollection = require("../Models/Users.js");
const { io } = require("../Configuration/Socket.js");

const createRoom = async (req, res) => {
    try {
        const host = req.userId;
        const sessionId = req.body.session;
        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The host id is invalid." });

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid." });

        const session = await SessionCollection.findById(sessionId);

        session.actualStartTime = Date.now();
        const newAttendee = { user: host, isHost: true, approvedByHost: true };
        const isExisted = session.attendees.some(a => a.user.toString() === host.toString());
        if (!isExisted) {
            session.attendees.push(newAttendee);
            await session.save();
        }

        const existingRoom = await RoomCollection.findOne({ host, session: sessionId });
        if (existingRoom) 
            return res.status(200).json({ type: "info", message: "Room is already created!", room: existingRoom, actualStartTime: session.actualStartTime });

        const room = new RoomCollection({ host, session: sessionId });
        if (!room.participants.includes(host)) {
            room.participants.push(host);
            await room.save();
        }

        return res.status(200).json({ type: "success", message: "Room created successfully!", room: room, actualStartTime: session.actualStartTime });;
    } catch (error) {
        console.log(error)
        return res.status(500).json({ type: "error", message: "Internal server error!" });
    }
};

const joinRoom = async (req, res) => {
    try {
        const userId = req.userId;
        const sessionId = req.params.sessionId;

        const user = await UserCollection.findById(userId);
        if (!user) return res.status(404).json({ type: "error", message: "User not found." });

        const userPreferences = user.preferences;

        const room = await RoomCollection.findOne({ session: sessionId });
        if (!room || !room.isActive) return { error: "Room not found or inactive." };

        if (!room.participants.includes(userId)) {
            room.participants.push(userId);
            await room.save();
        }

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const isCameraOn = session?.isBeingRecorded ? userPreferences.autoTurnOffCameraOnRecord ? false : !userPreferences.startWithCameraOff : !userPreferences.startWithCameraOff;
        const newAttendee = { user: userId, isCameraOn, isMicOn: !userPreferences.muteOnJoin, isLeft: false };
        const isExisted = session.attendees.some(a => a.user.toString() === userId.toString());
        if (!isExisted) {
            session.attendees.push(newAttendee);
            await session.save();
        } else {
            session.attendees = session.attendees.map(a => a.user.toString() === userId.toString() ? {...a, ...newAttendee} : a);
            await session.save();
        }

        const updatedSession = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        return res.status(200).json({ room, session: updatedSession });
    } catch (error) {
        return { error: "Internal Server Error." };
    }
};

const getRoomById = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) return res.status(400).json({ type: "error", message: "Room ID is required." });

        const room = await RoomCollection.findById(roomId);
        if (!room || !room.isActive) return { type: 'error', message: "Room not found or inactive." };

        return res.status(200).json({ room });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal server error!" });
    }
}

const endRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        if (!roomId) return res.status(400).json({ type: "error", message: "Room ID is required." });

        const room = await RoomCollection.findOneAndUpdate(
            { roomId },
            { isActive: false },
            { new: true }
        );

        if (!room)
            return res.status(404).json({ type: "error", message: "Room not found." });

        return res.status(200).json({ type: "success", message: "Room has been closed.", room });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error." });
    }
};

module.exports = { createRoom, getRoomById, joinRoom, endRoom };