const mongoose = require('../Configuration/Mongo-Config.js');
const PostCollection = require('../Models/Post.js');
const { ChatCollection } = require('../Models/Chat.js');
const UserCollection = require('../Models/Users.js');
const SessionCollection = require('../Models/Session.js');
const { GroupChatCollection } = require('../Models/Group-Chat.js');
const UserProgressCollection = require('../Models/UserProgress.js');
const AchievementCollection = require('../Models/Achievements.js');

const initialiseUserProgress = async (req, res) => {
    try {
        const user = req.userId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

        const existedUserProgress = await UserProgressCollection.findOne({ user });
        if (existedUserProgress)
          return res.status(200).json({ type: 'info', message: 'User progress already exists.', userProgress: existedUserProgress });

        const userProgress = await UserProgressCollection.create({ user });

        return res.status(201).json({ type: "success", message: "Account created successfully!", userProgress });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server error. Please try again later." });
    }
};

const calculateUserProgress = async (req, res, next) => {
    try {
      const userId = req.userId;
  
      if (!mongoose.Types.ObjectId.isValid(userId))
        return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });
  
      const [
        noOfPosts, noOfSessions, totalFollowers, totalFollowing,
        noOfPostsLiked, noOfPostsShared, noOfPostsCommented,
        noOfSessionsLiked, noOfSessionsShared, noOfSessionsCommented,
        noOfSessionsAttended, noOfSessionsHosted, noOfTimesBecameCoHost, noOfChats,
        noOfGroups, noOfGroupsJoined
      ] = await Promise.all([
        PostCollection.countDocuments({ user: userId }),
        SessionCollection.countDocuments({ host: userId }),
        UserCollection.countDocuments({ following: userId }),
        UserCollection.countDocuments({ followers: userId }),
        PostCollection.countDocuments({ likes: userId }),
        PostCollection.countDocuments({ sharedBy: userId }),
        PostCollection.countDocuments({ 'comments.user': userId }),
  
        SessionCollection.countDocuments({ likes: userId }),
        SessionCollection.countDocuments({ sharedBy: userId }),
        SessionCollection.countDocuments({ 'comments.user': userId }),
  
        SessionCollection.countDocuments({ 'attendees.user': userId }),
        SessionCollection.countDocuments({ host: userId }),
        SessionCollection.countDocuments({ 'attendees.user': userId, 'attendees.isCoHost': true }),
  
        ChatCollection.countDocuments({ participants: userId }),
        GroupChatCollection.countDocuments({ admin: userId }),
        GroupChatCollection.countDocuments({ participants: userId }),
      ]);

      const uid = new mongoose.Types.ObjectId(userId);

      const commentsLikedByAuthor = await PostCollection.aggregate([
        { $match: { 'comments.user': uid } },
        { $unwind: '$comments' },
        { $match: {
            'comments.user': uid,
            $expr: { $in: ['$user', '$comments.likes'] }, // post.user ∈ comments.likes
            $expr: { $ne: ['$user', uid] }
          }
        },
        { $count: 'count' }
      ]);

      const commentsLikedByHost = await SessionCollection.aggregate([
        { $match: { 'comments.user': uid } },
        { $unwind: '$comments' },
        { $match: {
            'comments.user': uid,
            $expr: { $ne: ['$host', uid] },
            $expr: { $in: ['$host', '$comments.likes'] }, // post.user ∈ comments.likes
          }
        },
        { $count: 'count' }
      ]);
      
      const commentsLikedByHostCount = commentsLikedByHost[0]?.count || 0;
      const commentsLikedByAuthorCount = commentsLikedByAuthor[0]?.count || 0;
  
      const updatedProgress = await UserProgressCollection.findOneAndUpdate(
        { user: userId },
        {
          noOfPosts, noOfSessions, totalFollowers, totalFollowing, noOfPostsLiked, 
          noOfPostsShared, noOfPostsCommented, noOfSessionsLiked, noOfSessionsShared, 
          noOfSessionsCommented, noOfSessionsAttended, noOfSessionsHosted, 
          noOfTimesBecameCoHost, noOfChats, noOfGroups, noOfGroupsJoined,
          commentsLikedByHost: commentsLikedByHostCount,
          commentsLikedByAuthor: commentsLikedByAuthorCount,
        },
        { new: true, upsert: true }
      );
  
      next();
    } catch (error) {
      console.log(error)
      return res.status(500).json({ type: "error", message: "Internal Server error. Please try again later." });
    }
};

const fetchUserProgress = async (req, res) => {
  try {
    const user = req.userId;

    if (!mongoose.Types.ObjectId.isValid(user))
      return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

    let userProgress;
    userProgress = await UserProgressCollection.findOne({ user });
    if (!userProgress)
      userProgress = await UserProgressCollection.create({ user });

    return res.status(200).json({ userProgress })
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server error. Please try again later." });
  }
}

const fetchUserProgressById = async (req, res) => {
  try {
    const user = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(user))
      return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

    let userProgress;
    userProgress = await UserProgressCollection.findOne({ user });
    if (!userProgress)
      userProgress = await UserProgressCollection.create({ user });

    return res.status(200).json({ userProgress })
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server error. Please try again later." });
  }
}

module.exports = { initialiseUserProgress, calculateUserProgress, fetchUserProgress, fetchUserProgressById };