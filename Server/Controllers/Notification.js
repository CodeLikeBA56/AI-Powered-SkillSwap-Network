const NotificationCollection = require('../Models/Notifications');
const { getSocketId } = require('../Services/OnlineUsers');
const mongoose = require('../Configuration/Mongo-Config');
const SessionCollection = require('../Models/Session');
const UserCollection = require('../Models/Users');
const { io } = require('../Configuration/Socket');

const getNotificationsByUserId = async (req, res) => {
    try {
        const user = req.userId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

            const notifications = await NotificationCollection.find({ user })
            .populate('sender', 'username profilePicture')
            .populate({
                path: 'post',
                select: '-__v',
                populate: { path: 'user', select: 'username profilePicture' }
            })
            .populate({
                path: 'session',
                select: '-__v',
                populate: { path: 'host', select: 'username profilePicture' }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ type: 'info', message: 'All notifications fetched successfully!', notifications });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
}

const sendSessionInitiationNotifications = async (req, res) => {
    try {
        const sender = req.userId;
        const { sessionId } = req.body;

        const session = await SessionCollection.findById(sessionId);
        if (!session) return res.status(404).json({ type: 'error', message: 'Session not found!' });

        session.interestedUsers.forEach(async interestedUser => {
            const isNotificationExists = await NotificationCollection.findOne({ sender, user: interestedUser.user, session: sessionId })
                .populate('sender', 'username profilePicture')    
                .populate('session');

            if (!isNotificationExists) {
                const notification = await NotificationCollection.create({
                    sender, user: interestedUser.user, session: sessionId, type: 'session-initiation',
                });

                const populatedNotification = await NotificationCollection.findById(notification._id)
                    .populate('sender', 'username profilePicture').populate('session');

                const userSocketID = getSocketId(interestedUser.user.toString());
                if (userSocketID) {
                    io.to(userSocketID).emit('new-notification', { notification: populatedNotification });
                }
            }
        });

        return res.status(200).json({ type: 'info', message: 'Session initiation notifications' });
    } catch (err) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await NotificationCollection.findByIdAndUpdate(notificationId, { $set: { isRead: true } });
        if (!notification) return res.status(404).json({ type: 'error', message: 'Notification not found!' });

        return res.status(200).json({ type: 'success', message: 'Notification marked as read.' })
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
}

const handleGenerateNotification = async (user, sender, type, post = undefined, session = undefined, comment = undefined) => {
    try {
        const notification = await NotificationCollection.create({ user, sender, post, type, session, comment });

        const populatedNotification = await NotificationCollection.findById(notification._id)
            .populate('sender', 'username profilePicture')
            .populate({
                path: 'post',
                select: '-__v',
                populate: { path: 'user', select: 'username profilePicture' }
            })
            .populate({
                path: 'session',
                select: '-__v',
                populate: { path: 'host', select: 'username profilePicture' }
            })

        return populatedNotification;
    } catch (error) {
        return null;
    }
}

module.exports = { getNotificationsByUserId, sendSessionInitiationNotifications, markNotificationAsRead, handleGenerateNotification };