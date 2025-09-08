const mongoose = require('../Configuration/Mongo-Config.js');

const userSchema = new mongoose.Schema({
    username: { type: String },
    email: { type: String, required: true, unique: true },
    profilePicture: { type: mongoose.Schema.Types.ObjectId, default: null },
    bio: { type: String },
    gender: { type: String, enum: ['male', 'female'], default: null},
    dateOfBirth: { type: Date, default: null },
    isBanned: { type: Boolean, default: false },
    bannedDuration: { type: Number, default: null },
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    offeredSkills: [{ type: String }],
    desiredSkills: [{ type: String }],
    socialLinks: [{
      platform: {
        type: String, required: true,
        enum: ['Github', 'LinkedIn', 'Facebook', 'Instagram', 'Twitter'],
      },
      url: { type: String, required: true }
    }],
    certificates: [{ type: mongoose.Schema.Types.ObjectId, default: [] }],
    favouriteChats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chats', default: [] }],
    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Posts" }],
    bookmarkedSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sessions" }],
    completedAchievements: { type: Map, of: Date, default: {} },
    coins: { type: Number, default: 0 },
    clusterId: { type: Number, default: null },
    timeSpentInSeconds: { type: Number, default: 0 },
    totalAchievementPoints: { type: Number, default: 0 },
    preferences: {
      isDarkMode: { type: Boolean, default: true },
      muteOnJoin: { type: Boolean, default: false },
      activeLink: { type: String, default: 'Dashboard' },
      exitConfirmation: { type: Boolean, default: false },
      chatNotifications: { type: Boolean, default: false },
      startWithCameraOff: { type: Boolean, default: false },
      autoTurnOffCameraOnRecord: { type: Boolean, default: true }
    },
    recommendedSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Sessions" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Users', userSchema);