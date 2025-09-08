const router = require("express").Router();
const { createPost, updatePost, deletePost, getAllPosts, getPostById, getPostByUser, 
    fetchPostCommentsById, togglePostLike, addComment, toggleCommentLike, replyToComment, 
    toggleReplyLike, updatePostShareByCount, deleteComment } = require("../Controllers/Post.js");
const upload = require('../Services/upload.js');

router.route("/").post(upload.array('media', 4), createPost).get(getAllPosts);
router.route("/:post_id").get(getPostById).put(upload.array('media', 4), updatePost).delete(deletePost);

router.get("/get-user-posts/:user_id", getPostByUser);
router.put("/like-post/:post_id", togglePostLike);

router.get("/fetch-post-comments/:postId", fetchPostCommentsById);

router.post("/add-comment-on-post/:post_id", addComment);
router.put("/:post_id/like-comment/:comment_id", toggleCommentLike);

router.post("/:post_id/add-reply-to-comment/:comment_id", replyToComment);
router.put("/:post_id/comment/:comment_id/like-reply/:reply_id", toggleReplyLike);

router.patch("/update-shared-by/:post_id", updatePostShareByCount);

router.delete("/:post_id/like-reply/:comment_id", deleteComment);

module.exports = router;