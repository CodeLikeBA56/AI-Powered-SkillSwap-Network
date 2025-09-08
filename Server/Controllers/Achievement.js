const AchievementCollection = require('../Models/Achievements');
const UserProgressCollection = require('../Models/UserProgress.js');
const UserCollection = require('../Models/Users');

const mongoose = require('../Configuration/Mongo-Config.js');

/**
 * Map every subCategory -> the field in User‑Progress (or User) that holds the
 * “current value” for that metric.
 */
const progressFieldBySubCat = {
  // ─── POST ───────────────────────────────────────────────
  'make-post'                  : 'noOfPosts',
  'like-post'                  : 'noOfPostsLiked',
  'comment-post'               : 'noOfPostsCommented',
  'share-post'                 : 'noOfPostsShared',

  // ─── SESSION ────────────────────────────────────────────
  'make-session'               : 'noOfSessionsHosted',   // ← hosts are creators
  'like-session'               : 'noOfSessionsLiked',
  'comment-session'            : 'noOfSessionsCommented',
  'share-session'              : 'noOfSessionsShared',

  'attend-session'             : 'noOfSessionsAttended',
  'host-session'               : 'noOfSessionsHosted',
  'cohost-session'             : 'noOfTimesBecameCoHost',

  // ─── SOCIAL GRAPH ──────────────────────────────────────
  'get-follower'               : 'totalFollowers',
  'follow-others'              : 'totalFollowing',

  // ─── COMMENT LIKES ─────────────────────────────────────
  'comment-liked-by-post-author'   : 'commentsLikedByAuthor',
  'comment-liked-by-session-host'  : 'commentsLikedByHost',

  // ─── GROUP / CHAT ──────────────────────────────────────
  'create-group'               : 'noOfGroups',
  'join-group'                 : 'noOfGroupsJoined',
  'chat-with-user'             : 'noOfChats',
};

/**
 * Special checks that don’t live in User‑Progress.
 * Each returns a boolean (true = completed).
**/

const specialChecks = {
  'provide-social-links': (user) => (user.socialLinks || []).length >= 5,
  'set-profile-picture' : (user) => !!user.profilePicture,
  'set-personal-info'   : (user) => !!user.bio && !!user.gender && !!user.dateOfBirth,
};

const updateUserAchievements = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

    const [user, progress] = await Promise.all([
      UserCollection.findById(userId).lean(),
      UserProgressCollection.findOne({ user: userId }).lean()
    ]);

    if (!user || !progress)
      return res.status(404).json({ type: 'error', message: 'User or progress not found.' });

    const allAchievements = await AchievementCollection.find().lean();

    // 3️⃣  Decide which are newly completed -------------------------------------
    const newlyCompleted = [];
    const completedMap   = new Map(Object.entries(user?.completedAchievements || {}));   // copy existing map
    let coinsToAdd     = 0;
    let achPointsToAdd = 0;

    for (const ach of allAchievements) {
      if (completedMap.has(ach._id.toString())) continue; // skip if already completed

      let currentValue = 0;

      // a) Special “profile” achievements
      if (specialChecks[ach.subCategory]) {
        if (!specialChecks[ach.subCategory](user)) continue;   // not completed
        currentValue = 1;                                      // treat as done
      }
      // b) Progress‑based achievements
      else {
        const field = progressFieldBySubCat[ach.subCategory];
        if (!field) continue;                                  // unknown mapping
        currentValue = progress[field] || 0;
        if (currentValue < ach.target) continue;               // not yet achieved
      }

      // achievement unlocked!
      newlyCompleted.push({
        _id        : ach._id,
        title      : ach.title,
        tier       : ach.tier,
        reward     : ach.reward,
        points     : ach.points,
        achievedAt : new Date()
      });

      completedMap.set(ach._id.toString(), new Date());
      coinsToAdd += ach.reward;
    }

    if (newlyCompleted.length === 0) {
      return res.status(200).json({ type: 'info', message: 'No new achievements' });
    }

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId,
      {
        $set : { completedAchievements: completedMap },
        $inc : { coins: coinsToAdd, totalAchievementPoints: achPointsToAdd }
      },
      { new: true }
    ).select('username coins completedAchievements');

    return res.status(200).json({
      type     : 'success',
      message  : `${newlyCompleted.length} achievement(s) unlocked!`,
      unlocked : newlyCompleted,
      user     : updatedUser
    });

  } catch (err) {
    console.log(err)
    res.status(500).json({ type: 'error', message: 'Server error while updating achievements.' });
  }
};

const calculateAllUsersAchievements = async (req, res, next) => {
  const allUsers = await UserCollection.find({}, '_id').lean();
  const allAchievements = await AchievementCollection.find().lean();

  for (const user of allUsers) {
    const userId = user._id;

    if (!mongoose.Types.ObjectId.isValid(userId)) continue;

    const [userData, progress] = await Promise.all([
      UserCollection.findById(userId).lean(),
      UserProgressCollection.findOne({ user: userId }).lean()
    ]);

    if (!userData || !progress) continue;

    const completedMap = new Map(Object.entries(userData?.completedAchievements || {}));
    let coinsToAdd = 0;
    let achPointsToAdd = 0;

    for (const ach of allAchievements) {
      if (completedMap.has(ach._id.toString())) continue;

      let currentValue = 0;

      // Special check
      if (specialChecks[ach.subCategory]) {
        if (!specialChecks[ach.subCategory](userData)) continue;
        currentValue = 1;
      } else {
        const field = progressFieldBySubCat[ach.subCategory];
        if (!field) continue;
        currentValue = progress[field] || 0;
        if (currentValue < ach.target) continue;
      }

      completedMap.set(ach._id.toString(), new Date());
      coinsToAdd += ach.reward;
      achPointsToAdd += ach.points;
    }

    if (coinsToAdd > 0 || achPointsToAdd > 0) {
      await UserCollection.findByIdAndUpdate(userId, {
        $set: { completedAchievements: completedMap },
        $inc: { coins: coinsToAdd, totalAchievementPoints: achPointsToAdd }
      });
    }
  }

  next();
};

const getLeaderboardStats = async (req, res) => {
  try {
    const users = await UserCollection.find({}, '_id username profilePicture timeSpentInSeconds coins totalAchievementPoints completedAchievements')
      .sort({ totalAchievementPoints: -1 }) // Sort by achievement points descending
      .lean();

    const leaderboard = users.map(user => ({
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      coins: user.coins,
      timeSpentInSeconds: user.timeSpentInSeconds,
      totalAchievementPoints: user.totalAchievementPoints,
      completedAchievements: user.completedAchievements || {},
      completedCount: Object.keys(user.completedAchievements || {}).length
    }));

    return res.status(200).json({ type: 'success', leaderboard });
  } catch (err) {
    console.error('Leaderboard error:', err);
    return res.status(500).json({ type: 'error', message: 'Failed to load leaderboard' });
  }
};

const updateCategoryAchievements = async (userId, category) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;

  try {
    const [user, progress] = await Promise.all([
      UserCollection.findById(userId).lean(),
      UserProgressCollection.findOne({ user: userId }).lean()
    ]);

    if (!user || !progress) return;

    const allAchievements = await AchievementCollection.find({ subCategory: category }).lean();
    const completedMap = new Map(user.completedAchievements);

    let newlyCompleted = [];
    let coinsToAdd = 0;
    let achPointsToAdd = 0;

    for (const ach of allAchievements) {
      if (completedMap.has(ach._id.toString())) continue;

      let currentValue = 0;

      // Special category
      if (specialChecks[category]) {
        if (!specialChecks[category](user)) continue;
        currentValue = 1;
      } else {
        const field = progressFieldBySubCat[category];
        if (!field) continue;
        currentValue = progress[field] || 0;
        if (currentValue < ach.target) continue;
      }

      // Unlock achievement
      newlyCompleted.push({
        _id: ach._id,
        title: ach.title,
        tier: ach.tier,
        reward: ach.reward,
        points: ach.points,
        achievedAt: new Date()
      });

      completedMap.set(ach._id.toString(), new Date());
      coinsToAdd += ach.reward;
      achPointsToAdd +=ach.points;
    }

    if (newlyCompleted.length > 0) {
      await UserCollection.findByIdAndUpdate(userId, {
        $set: { completedAchievements: completedMap },
        $inc: { coins: coinsToAdd, totalAchievementPoints: achPointsToAdd },
      });
    }

    return newlyCompleted;
  } catch (err) {
    console.error('Error updating category achievements:', err.message);
  }
};

const addAchievement = async (req, res) => {
  try {
    const { category, subCategory, title, description, tier, target, reward, points } = req.body;
    console.log(req.body)
    if (!category || !subCategory || !title || !description || !tier || !target || !reward || !points)
      return res.status(400).json({ type: 'error', message: 'All fields are required.' });

    const validCategories = ['post', 'session', 'personal-information', 'chat', 'group'];
    const validSubCategories = [
      'like-post', 'share-post', 'comment-post', 'make-post',
      'like-session', 'share-session', 'comment-session',
      'attend-session', 'host-session', 'cohost-session',
      'add-friend', 'get-follower', 'follow-others',
      'comment-liked-by-post-author', 'comment-liked-by-session-host',
      'provide-social-links', 'set-profile-picture', 'set-personal-info',
      'create-group', 'join-group', 'chat-with-user'
    ];

    if (!validCategories.includes(category) || !validSubCategories.includes(subCategory))
      return res.status(400).json({ type: 'error', message: 'Invalid category or subCategory.' });

    const achievement = await AchievementCollection.create({
      category, subCategory, title, description,
      tier, target, reward, points,
    });

    return res.status(201).json({ type: 'success', message: 'Achievement created successfully!', achievement });
  } catch (error) {
    return res.status(500).json({ type: 'error', message: 'Server error. Please try again later.' });
  }
};

const getAllAchievements = async (req, res) => {
  try {
    const achievements = await AchievementCollection.aggregate([
      { $sort: { subCategory: 1 } },
      { $group: { _id: "$subCategory", count: { $sum: 1 }, achievements: { $push: "$$ROOT" } } },
    ]);

    return res.status(200).json({ type: 'success', message: 'All achievements fetched successfully.', achievements });
  } catch (error) {
    return res.status(500).json({ type: 'error', message: 'Server error. Please try again later.' });
  }
}

module.exports = { 
  addAchievement, getAllAchievements, updateUserAchievements, 
  updateCategoryAchievements, calculateAllUsersAchievements, getLeaderboardStats
};