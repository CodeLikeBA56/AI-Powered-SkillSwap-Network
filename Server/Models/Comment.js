const mongoose = require("../Configuration/Mongo-Config.js");

const replySchema = new mongoose.Schema(
  {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
      content: { type: String, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", default: [] }],
  },
  { timestamps: true }
);

const commentSchema = new mongoose.Schema(
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true, index: true },
      content: { type: String, required: true },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users", default: [] }],
      replies: [replySchema],
    },
    { timestamps: true }
);

module.exports = commentSchema;