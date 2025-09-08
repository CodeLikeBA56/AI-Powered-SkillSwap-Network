const mongoose = require("./Mongo-Config");
const { GridFSBucket } = require("mongodb");

const conn = mongoose.connection;

let PostBucket, ChatBucket, GroupChatBucket;

conn.once("open", () => {
  PostBucket = new GridFSBucket(conn.db, { bucketName: "post-media" });
  ChatBucket = new GridFSBucket(conn.db, { bucketName: "chat-media" });
  GroupChatBucket = new GridFSBucket(conn.db, { bucketName: "group-chat-media" });
});

module.exports = { PostBucket, ChatBucket, GroupChatBucket };