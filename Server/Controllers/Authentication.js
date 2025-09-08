const admin = require('../Configuration/Firebase-Admin-Config.js');
const UserCollection = require('../Models/Users.js');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const authenticateUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ type: "warning", message: "All fields are required." });

        // let firebaseResponse;
        // try {
        //     firebaseResponse = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`, {
        //         email,
        //         password,
        //         returnSecureToken: true
        //     });
        // } catch (error) {
        //     return res.status(400).json({ type: "error", message: "The email or password is incorrect." });
        // }

        // const firebaseUser = await admin.auth().getUserByEmail(email);
        // if (!firebaseUser.emailVerified)
        //     return res.status(400).json({ type: "warning", message: "Email is not verified. Please verify your email." });

        const user = await UserCollection.findOne({ email })
            .populate("followers", "username profilePicture")
            .populate("following", "username profilePicture");

        if (!user)
            return res.status(404).json({ type: "error", message: "User not found in the database." });

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

        res.cookie('uid', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        });

        res.status(200).json({ type: "success", message: "Logged in successfully!", user });
    } catch (err) {
        return res.status(500).json({ type: "error", message: err.message || "Internal Server Error" });
    }
};

const verifyUserSession = async (req, res) => {
    try {
      const cookieUserId = req.userId;
      const { userId } = req.params;
      
      if (!cookieUserId || !userId || cookieUserId !== userId) {
        res.clearCookie("uid");
        return res.status(401).json({type: "error", message: "Unauthorized Request. Redirecting to sign-in."});
      }

      const user = await UserCollection.findOne(
        { _id: cookieUserId }, { __v: 0, isBanned: 0, bannedDuration: 0 }
      ).populate("followers", "username profilePicture")
       .populate("following", "username profilePicture");
  
      if (!user) return res.status(404).json({ type: "error", message: "User not found!" });
  
      return res.status(200).json({type: "success", message: "User data retrived successfully", user});
    } catch (error) {
      return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
};

const logoutUser = (req, res) => {
    try {
        res.clearCookie('uid', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });
        return res.status(200).json({ type: "success", message: "Logged out successfully!" });
    } catch (error) {
        return res.status(500).json({ type: "error", message: "Internal Server Error" });
    }
};

module.exports = { authenticateUser, verifyUserSession, logoutUser };