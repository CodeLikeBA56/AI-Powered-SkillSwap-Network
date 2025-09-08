const mongoose = require('../Configuration/Mongo-Config.js');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    type: {
        type: String,
        enum: [
            'follow', 'message', 
            'like-post', 'comment-on-post', 'like-post-comment', 'like-post-reply', 'reply-post-comment', 
            'like-session', 'comment-on-session', 'like-session-comment', 'like-session-reply', 'reply-session-comment', 'share-session', 
            'session-initiation'
        ],
        required: true
    },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Posts', default: undefined }, // Only for post-related actions
    comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: undefined }, // Only for comment-related actions
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Sessions', default: undefined }, // For session-related notifications
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notifications', NotificationSchema);