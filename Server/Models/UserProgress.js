const mongoose = require('../Configuration/Mongo-Config.js');

const progressSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    noOfPosts: { type: Number, default: 0 },
    noOfSessions: { type: Number, default: 0 },
    totalFollowers: { type: Number, default: 0 },
    totalFollowing: { type: Number, default: 0 },

    noOfPostsLiked: { type: Number, default: 0 },
    noOfPostsShared: { type: Number, default: 0 },
    noOfPostsCommented: { type: Number, default: 0 },
    commentsLikedByAuthor: { type: Number, default: 0 },
    
    noOfSessionsLiked: { type: Number, default: 0 },
    noOfSessionsShared: { type: Number, default: 0 },
    noOfSessionsCommented: { type: Number, default: 0 },
    commentsLikedByHost: { type: Number, default: 0 },

    noOfSessionsAttended: { type: Number, default: 0 },
    noOfSessionsHosted: { type: Number, default: 0 },
    noOfTimesBecameCoHost: { type: Number, default: 0 },

    noOfChats: { type: Number, default: 0 },
    noOfGroups: { type: Number, default: 0 },

    noOfGroupsJoined: { type: Number, default: 0 },
  }, 
  { timestamps: true }
);

module.exports = mongoose.model('UserProgress', progressSchema);