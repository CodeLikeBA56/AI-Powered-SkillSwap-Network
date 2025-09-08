const mongoose = require("../Configuration/Mongo-Config.js");
const { GridFSBucket } = require("mongodb");

const deleteMediaFromGridFS = async ({ bucketName, fileId }) => {
  try {
    const conn = mongoose.connection;
    const _id = new mongoose.Types.ObjectId(fileId);
    const bucket = new GridFSBucket(conn.db, { bucketName });

    const files = await bucket.find({ _id }).toArray();
    if (!files.length)
      return { type: "error", status: 404, message: "File not found or already deleted" };

    await bucket.delete(_id);
    return { type: "success", status: 200, message: "File deleted successfully." };
  } catch (err) {
    console.error(err);
    return { type: "error", status: 500, message: "Server error. Please try again later." };
  }
};

const deleteMultipleMedia = async (filesArray = [], bucketName) => {
    return await Promise.all(
      filesArray.map(id => deleteMediaFromGridFS({ bucketName, fileId: id }))
    );
};

module.exports = { deleteMediaFromGridFS, deleteMultipleMedia };