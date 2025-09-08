const userToSocketMap = new Map();
const socketToUserMap = new Map();

function addUser(userId, socketId) {
    userToSocketMap.set(userId, socketId);
    socketToUserMap.set(socketId, userId);
}

function removeUserBySocket(socketId) {
    const userId = socketToUserMap.get(socketId);
    if (userId) {
        userToSocketMap.delete(userId);
        socketToUserMap.delete(socketId);
    }
}

function getSocketId(userId) {
    return userToSocketMap.get(userId);
}

function getUserId(socketId) {
    return socketToUserMap.get(socketId);
}

module.exports = {
    addUser,
    removeUserBySocket,
    getSocketId,
    getUserId
};
