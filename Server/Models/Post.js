const mongoose = require("../Configuration/Mongo-Config.js");
const commentSchema = require('./Comment.js');

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
    content: { type: String, required: true },
    media: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: "post-media" },
        type: { type: String, enum: ["image", "video"], required: true }
      }
    ],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", default: [] }],
    comments: [commentSchema],
    hashtags: [{ type: String, index: true, default: [] }],
    views: [{ user: mongoose.Schema.Types.ObjectId, viewedAt: Date }],
    sharedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    visibility: { type: String, enum: ["public", "private"], default: "public" },
  },
  { timestamps: true }
);

postSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Posts", postSchema);