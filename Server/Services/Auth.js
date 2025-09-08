const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.cookies.uid;
    // console.log(token)

    if (!token) return res.status(401).send({ type: "error", message: "Access denied. No token provided." });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).send({ type: "error", message: "Access denied. Invalid token." });

        req.userId = decoded.userId;
        next();
    });
};

module.exports = authenticateToken;