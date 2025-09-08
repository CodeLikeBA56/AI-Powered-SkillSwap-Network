const mongoose = require("./Configuration/Mongo-Config.js");
const cookieParser = require("cookie-parser");
const { GridFSBucket } = require("mongodb");
const bodyParser = require("body-parser");
const express = require("express");
const logger = require("morgan");
const stream = require('stream');
const cors = require("cors");
require("dotenv").config();
const upload = require('./Services/upload.js');
const { app, server } = require("./Configuration/Socket.js");

// Import Routes
const auth = require("./Services/Auth");
const chat = require("./Routes/Chat.js");
const groupChat = require("./Routes/Group-Chat.js");
const chatMessage = require("./Routes/Chat-Messages.js");
const groupChatMessage = require("./Routes/Group-Chat-Messages.js");
const user = require("./Routes/User.js");
const room = require("./Routes/Room.js");
const post = require("./Routes/Post.js");
const session = require("./Routes/Session.js");
const userProgress = require("./Routes/UserProgress.js");
const verification = require("./Routes/Verification.js");
const notifications = require("./Routes/Notifications.js");
const authentication = require("./Routes/Authentication.js");
const recommendations = require("./Routes/Recommendations.js");
const achievementRoutes = require('./Routes/Achievement.js');

const { retrainModel } = require("./Controllers/K-Mean Clustering.js");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = process.env.PORT || 8080;
const conn = mongoose.connection;


app.use(logger("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, Range");
    res.setHeader("Accept-Ranges", "bytes");
    next();
});
app.use(cors({ origin: true, credentials: true }));

app.use("/api", authentication);
app.use("/api/post", auth, post);
app.use("/api/room", auth, room);
app.use("/api/chat", auth, chat);
app.use("/api/session", auth, session);
app.use("/api/group-chat", auth, groupChat);
app.use("/api/register", verification);
app.use("/api/user-profile", auth, user);
app.use("/api/chat-messages", auth, chatMessage);
app.use("/api/group-chat-messages", auth, groupChatMessage);
app.use("/api/logged-in-user-profile", auth, user);
app.use("/api/recommendations", auth, recommendations);
app.use("/api/notifications", auth, notifications);
app.use("/api/user-progress", auth, userProgress);
app.use('/api/achievements', auth, achievementRoutes);

app.put('/api/cluster-users/train-model', retrainModel);

const getFileType = (mimetype) => {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    return 'document';
};

app.post('/api/post-single-media/:bucket_name', auth, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ type: "error", message: 'No file is attached to upload' });
    
    const { bucket_name } = req.params;
    const bucket = new GridFSBucket(conn.db, { bucketName: bucket_name });
    
    const readStream = new stream.PassThrough();
    readStream.end(req.file.buffer);
    
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
        contentType: req.file.mimetype,
    });
    
    readStream.pipe(uploadStream);

    uploadStream.on('finish', () => {
        res.json({ type: "success", message: 'File uploaded successfully', fileId: uploadStream.id });
    });

    uploadStream.on('error', (err) => {
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    });
});

app.post('/api/post-multiple-media/:bucket_name', auth, upload.array('files', 4), async (req, res) => {
    const { bucket_name } = req.params;

    if (!req.files || req.files.length === 0)
        return res.status(400).json({ type: "error", message: 'Attach files to upload.' });

    try {
        const bucket = new GridFSBucket(conn.db, { bucketName: bucket_name });

        const uploadedFiles = await Promise.all(req.files.map(file => {
            return new Promise((resolve, reject) => {
                const readStream = new stream.PassThrough();
                readStream.end(file.buffer);

                const uploadStream = bucket.openUploadStream(file.originalname, {
                    contentType: file.mimetype,
                });

                readStream.pipe(uploadStream);

                uploadStream.on('finish', () => {
                    resolve({ _id: uploadStream.id, name: file.originalname, type: getFileType(file.mimetype) });
                });

                uploadStream.on('error', reject);
            });
        }));

        res.json({ type: 'success', message: 'Files uploaded successfully', files: uploadedFiles });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
});

app.get("/api/get-media/:bucket_name/:media_id", auth, async (req, res) => {
    try {
        const { bucket_name, media_id } = req.params;
        const bucket = new GridFSBucket(conn.db, { bucketName: bucket_name });
        
        const file = await bucket.find({ _id: new mongoose.Types.ObjectId(media_id) }).toArray();
        if (!file.length) return res.status(404).json({ error: "Media not found." });
        
        res.set("Content-Type", file[0].contentType || "video/mp4");
        res.setHeader("Accept-Ranges", "bytes");
        bucket.openDownloadStream(new mongoose.Types.ObjectId(media_id)).pipe(res);
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
});

app.delete('/api/delete-media/:bucketName/:fileId', async (req, res) => {
    try {
        const { bucketName, fileId } = req.params;
        const _id = new mongoose.Types.ObjectId(fileId);
        const bucket = new GridFSBucket(conn.db, { bucketName });

        const files = await bucket.find({ _id }).toArray();
        if (!files.length)
            return res.status(404).json({ error: 'File not found or already deleted' });

        await bucket.delete(_id); // Delete the file
        return res.status(200).json({ type: "success", message: 'File deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
});


server.listen(PORT, HOST, () => console.log(`🚀 Server running on http://${HOST}:${PORT}`));