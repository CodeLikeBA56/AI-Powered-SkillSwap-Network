const bcrypt = require('bcrypt');
const PostCollection = require('../Models/Post.js');
const UserCollection = require('../Models/Users.js');

const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password)
            return res.status(400).json({ type: "warning", message: "All fields are required." });

        if (!email.endsWith('.edu.pk'))
            return res.status(400).json({ type: "error", message: "Email must end with '.edu.pk'." });

        if (password.length < 7)
            return res.status(400).json({ type: "error", message: "Password must be at least 7 characters long." });

        const existingUser = await UserCollection.findOne({ email });
        if (existingUser)
            return res.status(409).json({ type: "error", message: "A user with this email already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await UserCollection.create({
            email, username,
            password: hashedPassword,
        });

        return res.status(201).json({ type: "success", message: "Account created successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
};

const getEverything = async (req, res) => {
    try {
        const { userId } = req.body;

        const result = await PostCollection.aggregate([
            { $group: {_id: "$user", posts: { $push: "$$ROOT"}} }, 
            { $lookup: {from: "users", localField: "_id", foreignField: "_id", as: "userInfo"} },
            { $lookup: {from: "sessions", localField: "_id", foreignField: "host", as: "sessions"} },
            { $unwind: "$userInfo" },
            { $project: {
                "posts.content": 1,
                "sessions.title": 1,
                "userInfo.username": 1,
                "userInfo.gender": 1,
            }}
        ]);

        const result2 = await UserCollection.aggregate([
            { $match: { _id: userId} }
        ]);

        console.log(result2)

        if (!result.length) {
            return res.status(404).json({ type: "error", message: "User not found" });
        }

        const user = result.find(u => u._id == userId);

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
};

module.exports = { registerUser, getEverything };