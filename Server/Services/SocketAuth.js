const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const verifySocketUser = (socket) => {
    try {
        const token = socket.handshake.query.token;

        if (!token) {
            console.log("No token found in cookies!");
            return null;
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded.userId)
        return decoded.userId; // Return the extracted userId
    } catch (error) {
        console.error("Socket authentication error:", error.message);
        return null;
    }
};

module.exports = verifySocketUser;
