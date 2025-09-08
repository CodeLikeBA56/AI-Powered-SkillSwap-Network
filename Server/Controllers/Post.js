const NotificationCollection = require('../Models/Notifications.js');
const UserProgressCollection = require('../Models/UserProgress.js');
const mongoose = require("../Configuration/Mongo-Config.js");
const { getSocketId } = require('../Services/OnlineUsers');
const { ChatCollection, MessageCollection } = require("../Models/Chat.js");
const { handleGenerateNotification } = require("./Notification.js");
const { io } = require('../Configuration/Socket.js');
const UserCollection = require("../Models/Users.js");
const PostCollection = require("../Models/Post.js");
const { GridFSBucket } = require("mongodb");
const stream = require("stream");

let PostBucket;
const conn = mongoose.connection;

conn.once("open", () => {
  PostBucket = new GridFSBucket(conn.db, { bucketName: "post-media" });
});

const createPost = async (req, res) => {
    try {
        const user = req.userId;
        const { content, hashtags, visibility } = req.body;

        if (!content || !hashtags)
            return res.status(400).json({ type: "error", message: "Please fill in all fields." });

        let mediaFiles = [];

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                    const readStream = new stream.PassThrough();
                    readStream.end(file.buffer);

                    const uploadStream = PostBucket.openUploadStream(file.originalname, { contentType: file.mimetype });

                    readStream.pipe(uploadStream);
                    uploadStream.on("finish", () => {
                        const fileType = file.mimetype.startsWith("image") ? "image" : "video";
                        resolve({ _id: uploadStream.id, type: fileType });
                    });
                    uploadStream.on("error", err => reject(err));
                });
            });

            mediaFiles = await Promise.all(uploadPromises);
        }

        const newPost = await PostCollection.create({ user, content, media: mediaFiles, hashtags: JSON.parse(hashtags), visibility });

        const updatedPost = await PostCollection.findById(newPost._id).populate("user", "username profilePicture");

        return res.status(201).json({ type: "success", message: "Post uploaded successfully!", post: updatedPost });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!", error: error.message });
    }
};

const updatePost = async (req, res) => {
    try {
        const userId = req.userId;
        const postId = req.params.post_id;

        const { content, hashtags, visibility } = req.body;
        let tags, mediaFilesToDelete;
        try {
            tags = JSON.parse(hashtags);
            mediaFilesToDelete = JSON.parse(req.body.mediaFilesToDelete || "[]");
        } catch (e) {
            return res.status(400).json({ type: "error", message: "Invalid JSON data." });
        }

        if (!content || !hashtags)
            return res.status(400).json({ type: "error", message: "Please fill in all fields." });

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ type: "error", message: "The post id is invalid."});

        let mediaFiles = [];

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map((file) => {
                return new Promise((resolve, reject) => {
                    const readStream = new stream.PassThrough();
                    readStream.end(file.buffer);

                    const uploadStream = PostBucket.openUploadStream(file.originalname, { contentType: file.mimetype });

                    readStream.pipe(uploadStream);
                    uploadStream.on("finish", () => {
                        const fileType = file.mimetype.startsWith("image") ? "image" : "video";
                        resolve({ _id: uploadStream.id, type: fileType });
                    });
                    uploadStream.on("error", err => reject(err));
                });
            });

            mediaFiles = await Promise.all(uploadPromises);
        }

        const updatedPost = await PostCollection.updateOne(
            { _id: postId, user: userId }, 
            { 
                $set: { content, hashtags: tags, visibility },
                $pull: { media: { _id: { $in: mediaFilesToDelete } } },
            },
            { new: true }
        );

        if (mediaFiles.length > 0) {
            await PostCollection.updateOne(
                { _id: postId, user: userId },
                { $push: { media: { $each: mediaFiles } } }
            );
        }
        
        if (!updatedPost) return res.status(404)({ type: "error", message: "Post not found." });

        const post = await PostCollection.findById(postId)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-post', { post });
        return res.status(200).json({ type: "success", message: "Post updated successfully!", updatedPost: post});
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const deletePost = async (req, res) => {
    try {
        const userId = req.userId;
        const postId = req.params.post_id;

        if (!mongoose.Types.ObjectId.isValid(userId))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ type: "error", message: "The post id is invalid!"});
        
        const deletedPost = await PostCollection.findByIdAndDelete(postId);
        if (!deletedPost) return res.status(404).json({ type: "error", message: "Post not found." });

        await MessageCollection.deleteMany({ post: postId });
        await NotificationCollection.deleteMany({ post: postId });
        await UserCollection.updateMany({ bookmarkedPosts: postId }, { $pull: { bookmarkedPosts: postId }})

        io.emit('delete-post', { postId });
        return res.status(200).json({type: "success", message: "Post deleted successfully."});
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const getAllPosts = async (req, res) => {
    try {
        const posts = await PostCollection.find()
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture")
            .sort({ createdAt: -1 });

        return res.status(200).json({ type: "success", message: "All posts retrieved successfully!", posts });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const getPostById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "Invalid post id!"});

        const post = await PostCollection.findById(req.params.post_id)
        .populate("user", "username profilePicture")
        .populate("comments.user", "username profilePicture")
        .populate("comments.replies.user", "username profilePicture")
        .sort({ createdAt: -1 });
        
        if (!post) return res.status(404)({ type: "error", message: "Post not found." });

        return res.status(200).json({ type: "success", message: "Post retrived successfully!", post});
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const getPostByUser = async (req, res) => {
    try {
        const user = req.params.user_id;
        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        const posts = await PostCollection.find({ user })
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture")
            .sort({ createdAt: -1 });
        
        if (!posts) return res.status(404).json({ type: "error", message: "No Posts have been found." });

        return res.status(200).json({ type: "success", message: "Posts retrived successfully!", posts });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const togglePostLike = async (req, res) => {
    try {
        const user = req.userId;
        
        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});
    
        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!"});

        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        let userProgress;
        const isLiked = post.likes.includes(user);
        const userSocketId = getSocketId(post.user.toString());

        if (isLiked) {
            post.likes = post.likes.filter((id) => id.toString() !== user);
            const notification = await NotificationCollection.findOneAndDelete({
                user: post.user, sender: user, post: post._id, type: 'like-post'
            });
            
            userProgress = await UserProgressCollection.findOneAndUpdate({ user }, { $inc: { noOfPostsLiked: -1 } }, { new: true });
            if (notification && userSocketId) {
                io.to(userSocketId).emit('remove-notification', { notificationID: notification._id });
            }
        }
        else {
            post.likes.push(user);
            const notification = await handleGenerateNotification(post.user, user, 'like-post', post._id);

            userProgress = await UserProgressCollection.findOneAndUpdate({ user }, { $inc: { noOfPostsLiked: 1 } }, { new: true });

            if (userSocketId) {
                io.to(userSocketId).emit('new-notification', { notification });
            }
        }

        await post.save();

        if (userSocketId) {
            const payload = { userId: user, updatedProgress: { noOfPostsLiked: userProgress.noOfPostsLiked } };
            io.to(userSocketId).emit('update-user-progress', payload);
        }
        
        io.emit('update-post-likes', { postId: post._id, likes: post.likes });
        return res.status(200).json({ type: "success", message: "Like toggled successfully!" });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const fetchPostCommentsById = async (req, res) => {
    try {
        const postId = req.params.postId;

        const post = await PostCollection.findById(postId)
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        return res.status(200).json({ type: "success", message: "Comments fetched successfully.", comments: post.comments });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
}

const addComment = async (req, res) => {
    try {
        const user = req.userId;
        const { content } = req.body;
        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!"});

        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!"});

        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        const newComment = { user, content };

        post.comments.push(newComment);
        await post.save();
        
        const mySocketId = getSocketId(user.toString());
        const userSocketId = getSocketId(post.user.toString());
        const userProgress = await UserProgressCollection.findOneAndUpdate({ user }, { $inc: { noOfPostsCommented: 1 } }, { new: true });
        
        const updatedPost = await PostCollection.findById(req.params.post_id)
        .populate("user", "username profilePicture")
        .populate("comments.user", "username profilePicture")
        .populate("comments.replies.user", "username profilePicture");

        const recentComment = updatedPost.comments[updatedPost.comments.length - 1];
        
        if (mySocketId) {
            const payload = { userId: user, updatedProgress: { noOfPostsCommented: userProgress.noOfPostsCommented } };
            io.to(mySocketId).emit('update-user-progress', payload);
        }
        
        if (post.user.toString() !== user.toString()) {
            const notification = await handleGenerateNotification(updatedPost.user._id, user, "comment-on-post", updatedPost._id, undefined, recentComment._id);
    
            if (userSocketId)
                io.to(userSocketId).emit('new-notification', { notification });
        }

        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: 'success', message: 'Comment added successfully!', post: updatedPost})
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const toggleCommentLike = async (req, res) => {
    try {
        const user = req.userId;
        const postId = req.params.post_id;
        const commentId = req.params.comment_id;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(postId))
            return res.status(400).json({ type: "error", message: "The post id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(commentId))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });

        const post = await PostCollection.findById(postId);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        const comment = post.comments.find(c => c._id.toString() === commentId);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const isLiked = comment.likes.includes(user);

        if (isLiked)
            comment.likes = comment.likes.filter(id => id.toString() !== user);
        else
            comment.likes.push(user);

        await post.save();

        const updatedPost = await PostCollection.findById(req.params.post_id)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        if (comment.user.toString() !== user.toString()) {
            const notification = await handleGenerateNotification(comment.user, user, "like-post-comment", updatedPost._id, undefined, comment._id);
            const userSocketId = getSocketId(comment.user.toString());

            if (userSocketId)
                io.to(userSocketId).emit('new-notification', { notification });
        }
        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: "success", message: "Comment Like toggled successfully!", post: updatedPost, likedByUser: !isLiked, likesCount: comment.likes.length });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const replyToComment = async (req, res) => {
    try {
        const user = req.userId;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.comment_id))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });

        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const newReply = { user, content };

        comment.replies.push(newReply);
        await post.save();

        const updatedPost = await PostCollection.findById(req.params.post_id)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: "success", message: "Reply added successfully!", post: updatedPost });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const toggleReplyLike = async (req, res) => {
    try {
        const user = req.userId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.comment_id))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });
        
        if (!mongoose.Types.ObjectId.isValid(req.params.reply_id))
            return res.status(400).json({ type: "error", message: "The reply id is invalid!" });

        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        const reply = comment.replies.find(r => r._id.toString() === req.params.reply_id);
        if (!reply) return res.status(404).json({ type: "error", message: "Reply not found." });

        const isLiked = reply.likes.includes(user);

        if (isLiked)
            reply.likes = reply.likes.filter(id => id.toString() !== user);
        else
            reply.likes.push(user);

        await post.save();

        const updatedPost = await PostCollection.findById(req.params.post_id)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: "success", message: "Reply Like toggled successfully!", post: updatedPost, likedByUser: !isLiked, likesCount: reply.likes.length });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const deleteComment = async (req, res) => {
    try {
        const user = req.userId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.comment_id))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });
        
        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(400).json({ type: "error", message: "Post not found." });

        post.comments = post.comments.filter(c => c._id.toString() !== req.params.comment_id);
        await post.save();

        const updatedPost = await PostCollection.findById(req.params.post_id)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: 'success', message: 'Comment deleted successfully!', post: updatedPost });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!"});
    }
};

const deleteReply = async (req, res) => {
    try {
        const user = req.userId;

        if (!mongoose.Types.ObjectId.isValid(user))
            return res.status(400).json({ type: "error", message: "The user id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.post_id))
            return res.status(400).json({ type: "error", message: "The post id is invalid!" });

        if (!mongoose.Types.ObjectId.isValid(req.params.comment_id))
            return res.status(400).json({ type: "error", message: "The comment id is invalid!" });
        
        if (!mongoose.Types.ObjectId.isValid(req.params.reply_id))
            return res.status(400).json({ type: "error", message: "The reply id is invalid!" });

        const post = await PostCollection.findById(req.params.post_id);
        if (!post) return res.status(404).json({ type: "error", message: "Post not found." });

        const comment = post.comments.find(c => c._id.toString() === req.params.comment_id);
        if (!comment) return res.status(404).json({ type: "error", message: "Comment not found." });

        comment.replies = comment.replies.filter(r => r._id.toString() !== req.params.reply_id);
        await post.save();

        const updatedPost = await PostCollection.findById(req.params.post_id)
            .populate("user", "username profilePicture")
            .populate("comments.user", "username profilePicture")
            .populate("comments.replies.user", "username profilePicture");

        io.emit('update-post-comments', { postId: updatedPost._id, comments: updatedPost.comments });
        return res.status(200).json({ type: "success", message: "Reply Like toggled successfully!", post: updatedPost });
    } catch (error) {
        res.status(500).json({ type: "error", message: "Internal Server Error!" });
    }
};

const updatePostShareByCount = async (req, res) => {
  try {
    const userId = req.userId;
    const postId = req.params.post_id;

    if (!mongoose.Types.ObjectId.isValid(userId))
      return res.status(400).json({ type: "error", message: "The user ID is invalid!" });

    if (!mongoose.Types.ObjectId.isValid(postId))
      return res.status(400).json({ type: "error", message: "The post ID is invalid!" });

    const post = await PostCollection.findById(postId);
    if (!post)
      return res.status(404).json({ type: "error", message: "Post not found." });

    if (!Array.isArray(post.sharedBy)) // Initialize sharedBy if not present
        post.sharedBy = [];

    const userProgress = await UserProgressCollection.findOne({ user: userId });
    if (!post.sharedBy.includes(userId)) { // Only add if userId is not already in sharedBy
      post.sharedBy.push(userId);
      userProgress.noOfPostsShared = userProgress.noOfPostsShared + 1;
      await post.save();
      await userProgress.save();
    }

    const userSocketId = getSocketId(userId.toString());
    if (userSocketId) {
        const payload = { userId, updatedProgress: { noOfPostsShared: userProgress.noOfPostsShared } };
        io.to(userSocketId).emit('update-user-progress', payload);
    }

    io.emit('update-post-share', { postId: post._id, sharedBy: post.sharedBy });
    return res.status(200).json({ type: "success", message: "Post share count updated.", sharedBy: post.sharedBy });
  } catch (error) {
    return res.status(500).json({ type: "error", message: "Internal Server Error" });
  }
};

module.exports = {
  createPost, updatePost, deletePost, addComment, replyToComment, fetchPostCommentsById,
  getAllPosts, getPostById, getPostByUser, togglePostLike, toggleCommentLike, toggleReplyLike, 
  deleteComment, updatePostShareByCount, deleteReply
};
