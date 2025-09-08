const mongoose = require("../Configuration/Mongo-Config.js");

const achievementSchema = new mongoose.Schema(
  {
    category: {
      type: String, required: true,
      enum: ['post', 'session', 'personal-information', 'chat', 'group'],
    },
    subCategory: {
      type: String, required: true,
      enum: [
        'make-post', 'like-post', 'comment-post', 'share-post',
        'make-session', 'like-session', 'comment-session', 'share-session',
        'attend-session', 'host-session', 'cohost-session', 'get-follower', 'follow-others',
        'comment-liked-by-post-author', 'comment-liked-by-session-host',
        'provide-social-links', 'set-profile-picture', 'set-personal-info',
        'create-group', 'join-group', 'chat-with-user'
      ],
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tier: { type: Number, required: true },
    target: { type: Number, required: true },
    reward: { type: Number, required: true },
    points: { type: Number, required: true },
  },
  { timestamps: true }
);

achievementSchema.index({ subCategory: 1, tier: 1 });

module.exports = mongoose.model("Achievements", achievementSchema);