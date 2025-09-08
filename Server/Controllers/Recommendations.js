const { GroupChatCollection } = require("../Models/Group-Chat");
const mongoose = require('../Configuration/Mongo-Config');
const UserCollection = require('../Models/Users');
const PostCollection = require('../Models/Post');
const allSkills = require("../Data/SkillsData");

const getSuggestedUsers = async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserCollection.findById(userId);
        if (!user) return res.status(404).json({ type: 'error', message: 'User not found!' });

        const suggestedUsers = await UserCollection.find({
            _id: { $ne: userId, $nin: user.following },
            clusterId: user.clusterId,
            $or: [
                { offeredSkills: { $in: user.desiredSkills } },
                { desiredSkills: { $in: user.offeredSkills } },
            ],
        }).populate("followers", "profilePicture username")
          .populate("following", "profilePicture username")
          .select("-__v -bannedDuration -password").limit(10);

        return res.json({ type: "success", suggestedUsers, message: "Suggested users retrieved successfully." });
    } catch (err) {
        return res.status(500).json({ type: 'error', message: err.message });
    }
};

const fetchRecommendedSessions = async (req, res) => {
    try {
        const userId = req.userId;

        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(404).json({ type: 'error', message: 'The user id is invalid.' });

        const user = await UserCollection.findById(userId).populate({
                path: 'recommendedSessions',
                select: '-__v',
                populate: { path: 'host', select: 'username profilePicture' }
            });

        if (!user) return res.status(404).json({ type: 'error', message: "User not found!" });

        return res.status(200).json({ recommendedSessions: user.recommendedSessions });
    } catch (err) {
        return res.status(500).json({ type: 'error', message: err.message });
    }
};

const getUsersByNameOrEmail = async (req, res) => {
    try {
        const userId = req.userId;
        const { searchQuery } = req.params;

        const searchRegex = new RegExp(searchQuery, 'i'); // 'i' = case-insensitive

        const users = await UserCollection.find({
            _id: { $ne: userId }, // exclude self
            $or: [
                { username: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
            ],
        }).select("_id username profilePicture").limit(10);

        return res.json({ type: "success", users, message: "Users matching search query retrieved successfully." });
    } catch (err) {
        return res.status(500).json({ type: 'error', message: err.message });
    }
};

const getUsersByNameOrEmailOrSkills = async (req, res) => {
    try {
        const userId = req.userId;
        const { searchQuery } = req.params;
        const offeredSkills = req.body.offeredSkills;

        const searchRegex = new RegExp(searchQuery, 'i'); // 'i' = case-insensitive
        const skillRegexes = offeredSkills.map(skill => new RegExp(skill, 'i'));

        const users = await UserCollection.find({
            _id: { $ne: userId }, // exclude self
            $or: [
                { username: { $regex: searchRegex } },
                { email: { $regex: searchRegex } },
                { offeredSkills: { $elemMatch: { $in: skillRegexes } } },
            ],
        }).select("_id username profilePicture offeredSkills desiredSkills").limit(10);

        return res.json({ type: "success", users, message: "Users matching search query retrieved successfully." });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ type: 'error', message: err.message });
    }
};

const fetchRecommendedGroups = async (req, res) => {
    try {
        const userId = req.userId;
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(404).json({ type: 'error', message: 'The user id is invalid.' });

        const user = await UserCollection.findById(userId).select("desiredSkills");
        if (!user) return res.status(404).json({ type: 'error', message: 'User not found!' });

        const skills = user.desiredSkills || [];
        const skillRegexes = skills.map(skill => new RegExp(`#${skill}`, 'i'));
        const regexQueries = skills.map(skill => ({ description: { $regex: new RegExp(skill, "i") } }));

        const suggestedGroups = await GroupChatCollection.find({
            admin: { $ne: userId },
            participants: { $nin: [userId] },
            $or: [ { hashtags: { $in: skillRegexes } }, ...regexQueries ]
        }).populate("admin", "username profilePicture").populate("participants", "username profilePicture");

        return res.status(200).json({ type: "success", message: "Recommended groups fetched successfully.", groups: suggestedGroups });
    } catch (error) {
        return res.status(500).json({ type: 'error', message: "Internal server error." });
    }
}

const fetchRecommendedPosts = async (req, res) => {
    try {
        const userId = req.userId;
        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(404).json({ type: 'error', message: 'The user id is invalid.' });
            
        const user = await UserCollection.findById(userId).select("desiredSkills");
        if (!user) return res.status(404).json({ type: 'error', message: 'User not found!' });

        const allPosts = await PostCollection.find({ user: { $ne: userId } })
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture")
            .sort({ createdAt: -1 });

        const userVector = vectorize(user.desiredSkills || []);

        const similarities = allPosts.map(post => {
            const postVector = vectorize(post.hashtags || []);
            return { post, similarity: cosineSimilarity(userVector, postVector) };
        });

        const sortedPosts = similarities.filter(post => post.similarity >= 0.2).map(post => ({...post.post._doc}));

        return res.status(200).json({ type: "success", message: "Recommended posts fetched successfully.", posts: sortedPosts });
    } catch (error) {
        return res.status(500).json({ type: 'error', message: "Internal server error." });
    }
}

const getRecommendedPosts = async (req, res) => {
    try {
        const userId = req.userId;

        // Step 1: Get current user's clusterId
        const user = await UserCollection.findById(userId);
        if (!user || user.clusterId === null) return res.status(404).json({ message: "User or cluster not found!" });

        const clusterId = user.clusterId;

        // Step 3: Fetch all posts which are liked, comment, and shared by clustered users.
        const userPostInteractions = await PostCollection.aggregate([
            { // Match only relevant posts: not by current user, liked by cluster members
                $match: { user: { $ne: user._id }, likes: { $not: { $elemMatch: { $eq: user._id } } }, }
            },
            { // Lookup similar users (same cluster)
            $lookup: {
                from: "users",
                let: {},
                pipeline: [{ $match: { clusterId } }, { $project: { _id: 1 } }],
                as: "similarUsers"
            }
            },
            { $unwind: "$similarUsers" }, // Flatten users
            {
            $addFields: {
                userId: "$similarUsers._id",
                liked: { $cond: [{ $in: ["$similarUsers._id", "$likes"] }, 1, 0] },
                shared: { $cond: [{ $in: ["$similarUsers._id", "$sharedBy"] }, 1, 0] },
                commented: {
                $cond: [{
                    $gt: [{
                        $size: {
                            $filter: {
                            input: "$comments",
                            as: "comment",
                            cond: { $eq: ["$$comment.user", "$similarUsers._id"] }
                            }
                        }
                    }, 0]
                }, 1, 0]
                }
            }
            },
        
            {
                $project: { _id: 0, userId: 1, postId: "$_id", liked: 1, commented: 1, shared: 1 }
            },
            /*
            { // Optional: group by user if you want matrix per user
            $group: {
                _id: "$userId",
                posts: {$push: { postId: "$postId", liked: "$liked", commented: "$commented", shared: "$shared"}
                }
            }
            }
            */
        ]);

        const allUserIds = [...new Set(userPostInteractions.map(u => u.userId))];
        const allPostIds = [...new Set(userPostInteractions.map(p => p.postId))];

        const interactionMap = {}; // Create map for quick lookup
        userPostInteractions.forEach(({ userId, postId, liked, commented, shared }) => {
            if (!interactionMap[userId]) interactionMap[userId] = {};
                interactionMap[userId][postId] = (liked + commented + shared);
        });

        // Construct 2D matrix
        const userPostInteractionScore = allUserIds.map(userId => {
            const row = { userId };
            allPostIds.forEach(postId => {
                row[postId] = (interactionMap[userId]?.[postId] / 3) ?? 0;
            });
            return row;
        });

        const clusterSize = allUserIds.length;
        const postConfidenceScore = Array.from(allPostIds).map(postId => {
            let totalScore = 0;
            userPostInteractionScore.forEach(row => totalScore += row[postId]);
            
            return { postId, score: totalScore / clusterSize };
        });
    
        const recommendedPostIds = postConfidenceScore.filter(post => post.score > 0.1).map(post => post.postId);

        const posts = await PostCollection.find({ _id: { $in: recommendedPostIds } })
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture"); 

        return res.status(200).json({ posts });
    } catch (err) {
        return res.status(500).json({ type: 'error', message: "Internal server error." });
    }
};

const getGroupsByNameOrHashtags = async (req, res) => {
    try {
        const { searchQuery } = req.params;
        const hashtags = req.body.hashtags || [];

        const searchRegex = new RegExp(searchQuery, 'i'); // Case-insensitive match
        const skillRegexes = hashtags.map(skill => new RegExp(skill, 'i'));

        const groups = await GroupChatCollection.find({
            $or: [
                { name: { $regex: searchRegex } },
                { description: { $regex: searchRegex } },
                { hashtags: { $elemMatch: { $in: skillRegexes } } },
            ]
        })
        .populate("admin", "username profilePicture")
        .populate("participants", "username profilePicture")
        .limit(10);

        return res.status(200).json({ type: "success", groups, message: "Groups matching search query retrieved successfully." });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ type: 'error', message: "Internal server error." });
    }
};

const cosineSimilarity = (vec1, vec2) => {
    const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
};

const vectorize = (items) => {
    return allSkills.map(skill => items.includes(skill) ? 1 : 0);
};

module.exports = { 
    getSuggestedUsers, getUsersByNameOrEmail, getUsersByNameOrEmailOrSkills, 
    fetchRecommendedSessions, fetchRecommendedGroups, fetchRecommendedPosts, 
    getRecommendedPosts, getGroupsByNameOrHashtags
};