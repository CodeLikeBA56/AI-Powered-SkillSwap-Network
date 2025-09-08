const mongoose = require('../Configuration/Mongo-Config');
const UserCollection = require('../Models/Users');
const { GridFSBucket } = require("mongodb");
const stream = require("stream");

let UserBucket;
const conn = mongoose.connection;

conn.once("open", () => {
  UserBucket = new GridFSBucket(conn.db, { bucketName: "user-media" });
});

const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ type: 'error', message: 'Unauthorized' });

    let { offeredSkills, desiredSkills } = req.body;

    if (typeof offeredSkills === 'string') offeredSkills = JSON.parse(offeredSkills);
    if (typeof desiredSkills === 'string') desiredSkills = JSON.parse(desiredSkills);

    const updateData = { offeredSkills, desiredSkills };

    if (req.file) {
      const readStream = new stream.PassThrough();
      readStream.end(req.file.buffer);

      const uploadStream = UserBucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
      });

      readStream.pipe(uploadStream);

      uploadStream.on("finish", async () => {
        updateData.profilePicture = uploadStream.id;
        const updatedUser = await UserCollection.findByIdAndUpdate(userId, updateData, { new: true })
          .populate("followers", "username profilePicture")
          .populate("following", "username profilePicture");
        return res.status(200).json({  type: "success", message: "Profile updated successfully", user: updatedUser });
      });

      uploadStream.on("error", (err) => res.status(500).json({ type: "error", message: "Error uploading file", error: err.message }));
      return;
    }

    const updatedUser = await UserCollection.findByIdAndUpdate(userId, updateData, { new: true });
    return res.status(200).json({ type: "success", message: "Profile updated successfully", user: updatedUser });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const updateProfilePicture = async (req, res) => {
  try {
    const userId = req.userId;
    const profilePicture = req.params.newProfileId;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid!" });
    
    if (!mongoose.Types.ObjectId.isValid(profilePicture))
      return res.status(400).json({ type: "error", message: "The profile picture id is invalid!" });

    const user = await UserCollection.findByIdAndUpdate(userId, { $set: { profilePicture } });
    if (!user) return res.status(404).json({ type : "error", message: "User not found." });

    return res.status(200).json({ type: "success", message: "Profile picture updated successfully!" });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const getUserById = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      res.clearCookie("uid");
      return res.status(401).json({type: "error", message: "Unauthorized Request. Redirecting to sign-in."});
    }

    const user = await UserCollection.findOne(
      { _id: userId }, { __v: 0, isBanned: 0, bannedDuration: 0 }
    ).populate("followers", "username profilePicture")
     .populate("following", "username profilePicture");

    if (!user) return res.status(404).json({ type: "error", message: "User not found!" });

    return res.status(200).json({type: "success", message: "User data retrived successfully", user});
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const fetchUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(userId)

    const user = await UserCollection.findById(userId)
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    if (!user) return res.status(404).json({ type: "error", message: "User not found!" });

    return res.status(200).json({ user });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const followUser = async (req, res) => {
  try {
    const userId = req.userId;
    const userToFollow = req.params.user_id_to_follow;

    if (!userId || !userToFollow)
      return res.status(400).json({ type: "error", message: "Missing required fields." });

    if (userId === userToFollow)
      return res.status(400).json({ type: "error", message: "You cannot follow yourself." });

    const user = await UserCollection.findById(userId);
    const targetUser = await UserCollection.findById(userToFollow);

    if (!user || !targetUser)
      return res.status(404).json({ type: "error", message: "User not found." });

    if (!user.following.includes(userToFollow))
      user.following.push(userToFollow);

    if (!targetUser.followers.includes(userId))
      targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    return res.status(200).json({ type: "info", message: `You are now following ${targetUser.username}.` });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const userId = req.userId;
    const userToUnfollow = req.params.user_id_to_unfollow;

    if (!userId || !userToUnfollow)
      return res.status(400).json({ type: "error", message: "Missing required fields." });

    if (userId === userToUnfollow)
      return res.status(400).json({ type: "error", message: "You cannot unfollow yourself." });

    const user = await UserCollection.findById(userId);
    const targetUser = await UserCollection.findById(userToUnfollow);

    if (!user || !targetUser)
      return res.status(404).json({ type: "error", message: "User not found." });

    if (user.following.includes(userToUnfollow))
      user.following = user.following.filter(id => id.toString() !== userToUnfollow);
    
    if (targetUser.followers.includes(userId))
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId);

    await user.save();
    await targetUser.save();

    return res.status(200).json({ type: "info", message: `You have unfollowed ${targetUser.username}.` });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const updatePersonalInformation = async (req, res) => {
  try {
    const userId = req.userId;
    const { username, gender, dateOfBirth } = req.body;

    if (!username || !gender || !dateOfBirth)
      return res.status(400).json({ type: "error", message: "Missing required fields." });

    const updatedUser = await UserCollection.findByIdAndUpdate(userId, { $set: req.body }, { new: true })
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");

    return res.status(200).json({ type: "success", message: "Profile updated successfully!", user: updatedUser });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const updateUserSocialLinks = async (req, res) => {
  try {
    const userId = req.userId;
    const { socialLinks } = req.body;

    if (!socialLinks)
      return res.status(400).json({ type: "warning", message: "Missing required fields." });

    const updatedUser = await UserCollection.findByIdAndUpdate(userId, { $set: req.body }, { new: true })
      .populate("followers", "username profilePicture")
      .populate("following", "username profilePicture");;

    return res.status(200).json({ type: "success", message: "Social links updated successfully!", user: updatedUser });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const updateUserCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    let certificateIds = [];
    const certificatesToDelete = JSON.parse(req.body.certificatesToDelete || "[]");

    await UserCollection.findByIdAndUpdate(userId, {
      $pull: { certificates: { $in: certificatesToDelete } }
    });

    const user = await UserCollection.findById(userId); // Fetch user to check existing certificates
    if (!user) return res.status(404).json({ type: "error", message: "User not found." });

    const existingCount = user.certificates?.length || 0;
    const newCertificatesCount = req.files ? req.files.length : 0;
    const totalCertificates = existingCount + newCertificatesCount;

    if (totalCertificates > 10) // Check if total certificates exceed the limit
      return res.status(400).json({ type: "error",  message: `You can only have up to 10 certificates (${existingCount}/10).`});

    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const readStream = new stream.PassThrough();
          readStream.end(file.buffer);

          const uploadStream = UserBucket.openUploadStream(file.originalname, { contentType: file.mimetype });

          readStream.pipe(uploadStream);
          uploadStream.on("finish", () => resolve(uploadStream.id));
          uploadStream.on("error", (err) => reject(err));
        });
      });

      certificateIds = await Promise.all(uploadPromises);
    }

    const updatedUser = await UserCollection.findByIdAndUpdate(
      userId, { $push: { certificates: { $each: certificateIds } } }, { new: true }
    ).populate("followers", "username profilePicture").populate("following", "username profilePicture");

    return res.status(200).json({type: "info", message: "Certificates updated successfully!", user: updatedUser });
  } catch (error) {
    res.status(500).json({ type: "error", message: "Internal Server Error!", error: error.message });
  }
};

const deleteCertificates = async (req, res) => {
  try {
    const userId = req.userId;
    const certificatesToDelete = JSON.parse(req.body.certificatesToDelete || "[]");

    const user = await UserCollection.findByIdAndUpdate(userId, {
      $pull: { certificates: { $in: certificatesToDelete } }
    });
    if (!user) return res.status(404).json({ type: "error", message: "User not found!" });
    
    return res.status(200).json({ type: 'info', message: 'Certificates updated successfull!'});
  } catch (error) {
    
  }
}

const bookmarkPost = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.params.postId;

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res.status(400).json({ type: "error", message: "The post id is invalid!" });

    const user = await UserCollection.findById(userId);
    if (!user) return res.status(404).json({ type: "error", message: "User not found." });

    if (!Array.isArray(user.bookmarkedPosts)) // Initialize bookmarkPosts if not present
      user.bookmarkedPosts = [];

    if (!user.bookmarkedPosts.includes(postId)) { // Only add if userId is not already in sharedBy
      user.bookmarkedPosts.push(postId);
      await user.save();
    }

    return res.status(200).json({ type: "success", message: "Post added to your bookmarks." });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const removePostFromBookmark = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.params.postId;

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res.status(400).json({ type: "error", message: "The post id is invalid!" });

    await UserCollection.updateOne({ _id: userId }, { $pull: { bookmarkedPosts: postId } });

    return res.status(200).json({ type: "success", message: "Post removed from your bookmarks." });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const bookmarkSession = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.params.sessionId;

    if (!mongoose.Types.ObjectId.isValid(sessionId))
      return res.status(400).json({ type: "error", message: "The session id is invalid!" });

    const user = await UserCollection.findById(userId);
    if (!user) return res.status(404).json({ type: "error", message: "User not found." });

    if (!Array.isArray(user.bookmarkedSessions)) // Initialize bookmarkPosts if not present
      user.bookmarkedSessions = [];

    if (!user.bookmarkedSessions.includes(sessionId)) { // Only add if userId is not already in sharedBy
      user.bookmarkedSessions.push(sessionId);
      await user.save();
    }

    return res.status(200).json({ type: "success", message: "Session added to your bookmarks." });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const removeSessionFromBookmark = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = req.params.sessionId;

    if (!mongoose.Types.ObjectId.isValid(sessionId))
      return res.status(400).json({ type: "error", message: "The session id is invalid!" });

    await UserCollection.updateOne({ _id: userId }, { $pull: { bookmarkedSessions: sessionId } });

    return res.status(200).json({ type: "success", message: "Session removed from your bookmarks." });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const handleUpdateUserPreferences = async (req, res) => {
  try {
    const userId = req.userId;
    const preferences = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid!" });

    const updateFields = {};
    for (const key in preferences)
      updateFields[`preferences.${key}`] = preferences[key];

    const user = await UserCollection.findByIdAndUpdate(userId, { $set: { ...updateFields }}, { new: true });
    if (!user) return res.status(404).json({ type: "error", message: "User not found." });

    return res.status(200).json({ type: "success", message: "User preferences updated successfully.", preferences: user.preferences });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
}

const updateTimeSpent = async (req, res) => {
  try {
    const userId = req.userId;
    const { seconds } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user id is invalid!" });

    const user = await UserCollection.findByIdAndUpdate(userId, { $inc: { timeSpentInSeconds: seconds } }, { new: true });
    if (!user) return res.status(404).json({ type: "error", message: "User not found!" });

    res.status(200).json({ timeSpentInSeconds: user.timeSpentInSeconds });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const handleUpdateOfferedSkills = async (req, res) => {
  const userId = req.userId;
  const { offeredSkills } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

  if (!Array.isArray(offeredSkills))
    return res.status(400).json({ type: 'error', message: 'The offered skills must be an array.' });

  try {
    const user = await UserCollection.findByIdAndUpdate(userId, { offeredSkills }, { new: true });
    if (!user) return res.status(404).json({ type: 'error', message: 'User not found' });

    return res.status(200).json({ type: 'success', message: 'The offered skills are updated successfully.' });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

const handleUpdateDesiredSkills = async (req, res) => {
  const userId = req.userId;
  const { desiredSkills } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId))
    return res.status(400).json({ type: 'error', message: 'The user id is invalid.' });

  if (!Array.isArray(desiredSkills))
    return res.status(400).json({ type: 'error', message: 'The desired skills must be an array.' });

  try {
    const user = await UserCollection.findByIdAndUpdate(userId, { desiredSkills }, { new: true });
    if (!user) return res.status(404).json({ type: 'error', message: 'User not found' });

    return res.status(200).json({ type: 'success', message: 'The desired skills are updated successfully.' });
  } catch (err) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

module.exports = {
  updateProfile, updatePersonalInformation, updateUserSocialLinks, updateUserCertificates,
  getUserById, followUser, unfollowUser, handleUpdateUserPreferences, updateProfilePicture, 
  bookmarkPost, removePostFromBookmark, bookmarkSession, removeSessionFromBookmark, updateTimeSpent,
  handleUpdateOfferedSkills, handleUpdateDesiredSkills, fetchUserById
};