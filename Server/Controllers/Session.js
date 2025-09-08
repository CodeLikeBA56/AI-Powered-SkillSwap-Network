const NotificationCollection = require('../Models/Notifications.js');
const UserProgressCollection = require('../Models/UserProgress.js');
const { handleGenerateNotification } = require("./Notification.js");
const mongoose = require("../Configuration/Mongo-Config.js");
const { MessageCollection } = require("../Models/Chat.js");
const { getSocketId } = require('../Services/OnlineUsers');
const SessionCollection = require("../Models/Session.js");
const UserCollection = require("../Models/Users.js");
const { io } = require('../Configuration/Socket.js');
const RoomCollection = require("../Models/Rooms.js");
const { GridFSBucket } = require("mongodb");
const stream = require("stream");
const axios = require('axios')

let SessionBucket;
const conn = mongoose.connection;

conn.once("open", () => {
  SessionBucket = new GridFSBucket(conn.db, { bucketName: "session-media" });
});

const createSession = async (req, res) => {
    try {
        const host = req.userId;
        const { title, description, startTime, duration, hashtags, visibility } = req.body;

        if (!title || !hashtags || !startTime || !duration || !visibility || !Array.isArray(hashtags))
            return res.status(400).json({ type: "error", message: "Please fill in all fields." });

        const newSession = await SessionCollection.create({
            host, title, description, startTime, duration, hashtags, visibility 
        });

        const session = await SessionCollection.findById(newSession._id).populate("host", "username profilePicture");
        const users = await UserCollection.find({ _id: { $ne: host } }, { _id: 1, desiredSkills: 1 });

        const flaskResponse = await axios.post('http://localhost:5002/recommend-users', {
            title: session.title,
            description: session.description,
            hashtags: session.hashtags,
            users
        });

        const recommendedUserIds = flaskResponse?.data?.recommendedUserIds.map(id => new mongoose.Types.ObjectId(id));

        if (0 !== recommendedUserIds.length) {
            await UserCollection.updateMany(
                { _id: { $in: recommendedUserIds } },
                { $push: { recommendedSessions: newSession._id } }
            );
    
            flaskResponse?.data?.recommendedUserIds.forEach(userId => {
                const socketId = getSocketId(userId);
                if (socketId)
                    io.to(socketId).emit('update-recommended-session-list', { session });
            });
        }

        const formattedMessage = formatSessionMessage(startTime);
        return res.status(201).json({ type: "success", message: formattedMessage, session });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!", error: error.message });
    }
};

const updateSession = async (req, res) => {
    try {
        const host = req.userId;
        const { sessionId } = req.params;
        const { title, description, startTime, duration, hashtags, visibility } = req.body;

        if (!title || !hashtags || !startTime || !duration || !visibility || !Array.isArray(hashtags))
            return res.status(400).json({ type: "error", message: "Please fill in all fields." });

        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The host id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const updatedSession = await SessionCollection.updateOne(
            { _id: sessionId, host },
            { $set: { title, description, startTime, duration, hashtags, visibility } }
        );
        
        const session = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        return res.status(200).json({ type: "success", message: "Session updated successfully!", updatedSession: session});
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
}

const deleteSession = async (req, res) => {
    try {
        const userId = req.userId;
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});
        
        const deletedSession = await SessionCollection.findByIdAndDelete(sessionId);
        if (!deletedSession) return res.status(404).json({ type: "error", message: "Session not found." });

        await MessageCollection.deleteMany({ session: sessionId });
        await NotificationCollection.deleteMany({ session: sessionId });
        await UserCollection.updateMany(
            { $or: [{ bookmarkedSessions: sessionId }, { recommendedSessions: sessionId }] },
            { $pull: { bookmarkedSessions: sessionId, recommendedSessions: sessionId } }
        );          
        // await UserCollection.updateMany({ bookmarkedSessions: sessionId }, { $pull: { bookmarkedSessions: sessionId }});
        // await UserCollection.updateMany({ recommendedSessions: sessionId }, { $pull: { recommendedSessions: sessionId }});

        return res.status(200).json({type: "success", message: "Session deleted successfully."});
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const getAllSessions = async (req, res) => {
    try {
        const sessions = await SessionCollection.find()
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({ type: "success", message: "All sessions retrieved successfully!", sessions });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const getSessionById = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;
        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const session = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");
        
        if (!session) return res.status(404)({ type: "error", message: "Session not found." });

        session.attendees.sort((a, b) => {
            return (b.isHost === true) - (a.isHost === true); // `true` treated as 1, so it moves up
        });

        return res.status(200).json({ type: "success", message: "Post retrived successfully!", session});
    } catch (error) {
        console.log(error);
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const getSessionsByUser = async (req, res) => {
    try {
        const host = req.params.host_id;
        if (!mongoose.Types.ObjectId.isValid(host))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        const sessions = await SessionCollection.find({ host })
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture")
            .sort({ createdAt: -1 });
        
        if (!sessions) return res.status(404).json({ type: "error", message: "No Sessions have been found." });

        return res.status(200).json({ type: "success", message: "Sessions retrived successfully!", sessions});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const toggleSessionLike = async (req, res) => {
    try {
        const user = req.userId;
        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(req.params.session_id))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});
        
        const session = await SessionCollection.findById(req.params.session_id);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const isLiked = session.likes.includes(user);
        const userSocketId = getSocketId(session.host.toString());

        if (isLiked) {
            session.likes = session.likes.filter((id) => id.toString() !== user);
            if (session.host.toString() !== user.toString()) {
                const notification = await NotificationCollection.findOneAndDelete({
                    user: session.host, sender: user, session: session._id, type: 'like-session'
                });
  
                if (notification && userSocketId) {
                    io.to(userSocketId).emit('remove-notification', { notificationID: notification._id });
                }
            }
        } else {
            session.likes.push(user);
            if (session.host.toString() !== user.toString()) {
                const notification = await handleGenerateNotification(session.host, user, 'like-session', undefined, session._id);
        
                if (userSocketId) {
                    io.to(userSocketId).emit('new-notification', { notification });
                }
            }
        }

        await session.save();

        io.emit('update-session-likes', { sessionId: session._id, likes: session.likes });
        return res.status(200).json({ type: "success", message: "Like toggled successfully!" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const fetchSessionCommentsById = async (req, res) => {
    try {
        const sessionId = req.params.sessionId;

        const session = await SessionCollection.findById(sessionId)
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        return res.status(200).json({ type: "success", message: "Comments fetched successfully.", comments: session.comments });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
}

const addComment = async (req, res) => {
    try {
        const user = req.userId;
        const { content } = req.body;
        const sessionId = req.params.sessionId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!"});

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const newComment = { user, content };

        session.comments.push(newComment);
        await session.save();

        const mySocketId = getSocketId(user.toString());
        const userSocketId = getSocketId(session.host.toString());
        const userProgress = await UserProgressCollection.findOneAndUpdate({ user }, { $inc: { noOfSessionsCommented: 1 } }, { new: true });

        const updatedSession = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        const recentComment = updatedSession.comments[updatedSession.comments.length - 1];
        
        if (mySocketId) {
            const payload = { userId: user, updatedProgress: { noOfSessionsCommented: userProgress.noOfSessionsCommented } };
            io.to(mySocketId).emit('update-user-progress', payload);
        }

        if (session.host.toString() !== user.toString()) {
            const notification = await handleGenerateNotification(updatedSession.host._id, user, "comment-on-session", undefined, updatedSession._id, recentComment._id);
    
            if (userSocketId)
                io.to(userSocketId).emit('new-notification', { notification });
        }

        io.emit('update-session-comments', { sessionId: updatedSession._id, comments: updatedSession.comments });
        return res.status(200).json({ type: 'success', message: 'Comment added successfully!', post: updatedSession})
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const toggleCommentLike = async (req, res) => {
    try {
        const user = req.userId;
        const commentId = req.params.commentId;
        const sessionId = req.params.sessionId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(commentId))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Post not found." });

        const comment = session.comments.find(c => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const isLiked = comment.likes.includes(user);

        if (isLiked)
            comment.likes = comment.likes.filter(id => id.toString() !== user);
        else
            comment.likes.push(user);

        await session.save();

        const updatedSession = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        if (comment.user.toString() !== user.toString()) {
            const notification = await handleGenerateNotification(comment.user, user, "like-session-comment", undefined, updatedSession._id, comment._id);
            const userSocketId = getSocketId(comment.user.toString());

            if (userSocketId)
                io.to(userSocketId).emit('new-notification', { notification });
        }

        io.emit('update-session-comments', { sessionId: updatedSession._id, comments: updatedSession.comments });
        return res.status(200).json({ type: "success", message: "Comment Like toggled successfully!", post: updatedSession, likedByUser: !isLiked, likesCount: comment.likes.length });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const replyToComment = async (req, res) => {
    try {
        const user = req.userId;
        const { content } = req.body;
        const commentId = req.params.commentId;
        const sessionId = req.params.sessionId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(commentId))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const comment = session.comments.find(c => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const newReply = { user, content };

        comment.replies.push(newReply);
        await session.save();

        const updatedSession = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-session-comments', { sessionId: updatedSession._id, comments: updatedSession.comments });
        return res.status(200).json({ type: "success", message: "Reply added successfully!", post: updatedSession });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const toggleReplyLike = async (req, res) => {
    try {
        const user = req.userId;
        const replyId = req.params.replyId;
        const commentId = req.params.commentId;
        const sessionId = req.params.sessionId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(sessionId))
            return res.status(400).json({ type: "error", message: "The session id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(commentId))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });
        
        if (!mongoose.Types.ObjectId.isValid(replyId))
            return res.status(400).json({ type: "error", message: "The reply id is invalid!" });

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const comment = session.comments.find(c => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const reply = comment.replies.find(r => r._id.toString() === replyId);
        if (!reply) return res.status(404).json({ type: "error", message: "Reply not found." });

        const isLiked = reply.likes.includes(user);

        if (isLiked)
            reply.likes = reply.likes.filter(id => id.toString() !== user);
        else
            reply.likes.push(user);

        await session.save();

        const updatedSession = await SessionCollection.findById(sessionId)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-session-comments', { sessionId: updatedSession._id, comments: updatedSession.comments });
        return res.status(200).json({ type: "success", message: "Reply Like toggled successfully!", post: updatedSession, likedByUser: !isLiked, likesCount: reply.likes.length });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const joinSession = async (req, res) => {
    try {
        const userId = req.userId;
        const { session_id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(session_id))
            return res.status(400).json({ type: "error", message: "The session id is invalid." });

        const session = await SessionCollection.findById(session_id);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const alreadyJoined = session.interestedUsers.some(viewer => viewer.user.toString() === userId);
        if (alreadyJoined) return res.status(400).json({ type: "info", message: "You have already joined this session." });

        session.interestedUsers.push({ user: userId });
        await session.save();

        const updatedSession = await SessionCollection.findById(session_id)
            .populate("host", "username profilePicture")
            .populate("interestedUsers.user", "username profilePicture")
            .populate("attendees.user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        const latestViewer = updatedSession.interestedUsers[updatedSession.interestedUsers.length - 1].user;

        const now = new Date();
        const sessionStartTime = new Date(session.startTime);
        const sessionActualStartTime = session.actualStartTime ? new Date(session.actualStartTime) : null;

        let message;
        if (sessionActualStartTime && now >= sessionActualStartTime) {
            message = `The session is already running. Welcome, ${latestViewer?.username || "Guest"}!`;
        } else {
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            const timeString = sessionStartTime.toLocaleTimeString('en-US', options);
            message = `You have successfully joined. The session will start at ${timeString}.`;
        }

        res.status(200).json({ type: "success", message, session: updatedSession });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error." });
    }
};

const formatSessionMessage = (startTime) => {
    const sessionDate = new Date(startTime);
    const now = new Date();

    const options = { hour: '2-digit', minute: '2-digit', hour12: true };
    const timeString = sessionDate.toLocaleTimeString('en-US', options);
    
    let message;
    
    if (sessionDate.toDateString() === now.toDateString()) {
        message = `The session is scheduled today at ${timeString}.`;
    } else if (sessionDate.toDateString() === new Date(now.setDate(now.getDate() + 1)).toDateString()) {
        message = `The session is scheduled tomorrow at ${timeString}.`;
    } else {
        const dateString = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        message = `The session is scheduled on ${dateString} at ${timeString}.`;
    }

    return message;
};

const updateSessionShareByCount = async (req, res) => {
    try {
      const userId = req.userId;
      const sessionId = req.params.session_id;
  
      if (!mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ type: "error", message: "The user id is invalid!" });
  
      if (!mongoose.Types.ObjectId.isValid(sessionId))
        return res.status(400).json({ type: "error", message: "The session id is invalid!" });
  
      const session = await SessionCollection.findById(sessionId);
      if (!session)
        return res.status(404).json({ type: "error", message: "Session not found." });
  
      if (!Array.isArray(session.sharedBy)) // Initialize sharedBy if not present
          session.sharedBy = [];
  
      if (!session.sharedBy.includes(userId)) { // Only add if userId is not already in sharedBy
        session.sharedBy.push(userId);
        await session.save();
      }
  
      io.emit('update-session-share', { sessionId: session._id, sharedBy: session.sharedBy });
      return res.status(200).json({ type: "success", message: "Session share count updated." });
    } catch (error) {
      return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
};

const acceptAttendeeJoinRequest = async (req, res) => {
    try {
        const {attendeeId, sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? { ...attendee.toObject(), approvedByHost: true, kickedByHost: false } : attendee;
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
        const {roomId, attendeeId, sessionId} = req.params;
        
        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: "error", message: "Session not found." });

        const updatedAttendees = session.attendees.map(attendee => {
            return attendee.user.toString() === attendeeId ? 
                { ...attendee.toObject(), isCoHost: false, kickedByHost: true, approvedByHost: false } 
            : attendee;
        });
        session.attendees = updatedAttendees;
        await session.save();

        await RoomCollection.updateOne({ _id: roomId }, { $pull: { participants: attendeeId } });
        return res.status(200).json({ type: "success", message: "Attendee request to join session accepted successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
}

module.exports = { 
    createSession, updateSession, deleteSession, getAllSessions, getSessionById, getSessionsByUser, toggleSessionLike, 
    fetchSessionCommentsById, addComment, toggleCommentLike, replyToComment, toggleReplyLike, 
    updateSessionShareByCount, joinSession, makeAttendeeCoHost, removeAttendeeFromCoHost, 
    acceptAttendeeJoinRequest, kickAttendeeFromSession
};