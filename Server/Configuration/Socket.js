const { addUser, removeUserBySocket, getSocketId } = require("../Services/OnlineUsers");
const { Server } = require("socket.io");
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {  cors: true });

io.on("connection", socket => {
    socket.on('map-user-with-socket-id', ({ userId }) => {
        addUser(userId, socket.id);
    });

    socket.on('notify-participant', ({ to, chatId, message, lastMessage }) => {
        const userSocketId = getSocketId(to);
        if (userSocketId)
            io.to(userSocketId).emit('chat-message-received', { chatId, message, lastMessage });
    });
    
    socket.on('notify-chat-message-deleted', ({ to, chatId, date, messageId, lastMessage }) => {
        const userSocketId = getSocketId(to);
        if (userSocketId)
        io.to(userSocketId).emit('chat-message-deleted-for-everyone', { chatId, date, messageId, lastMessage });
    });

    socket.on('notify-group-participants', ({ to, chatId, message, lastMessage, seenBy }) => {
        to.forEach(participant => {
            const userSocketId = getSocketId(participant);
            if (userSocketId)
                io.to(userSocketId).emit('group-chat-message-received', { chatId, message, lastMessage, seenBy });
        });
    });

    socket.on('notify-new-follower', ({to, followerInfo}) => {
        const userSocketId = getSocketId(to);
        if (userSocketId)
            io.to(userSocketId).emit('new-follower-notification', { followerInfo });
    });

    socket.on('notify-someone-unfollowed', ({to, unFollowedUserInfo}) => {
        const userSocketId = getSocketId(to);
        if (userSocketId)
            io.to(userSocketId).emit('someone-unfollowed-notification', { unFollowedUserInfo });
    });

    socket.on("logout-user", () => {
        removeUserBySocket(socket.id);
    });

    socket.on("disconnect", () => {
        removeUserBySocket(socket.id);
    });

    // Session socket

    socket.on('join-socket-room', async ({ roomId, userId }) => {
        socket.join(roomId.toString()); // Join socket room.
        socket.to(roomId.toString()).emit('update-attendees-socket-id-map', { userId, socketId: socket.id })
    });
    
    socket.on('update-joined-attendee-socket-id-map', async ({ to, userId }) => {
        io.to(to).emit('update-attendee-socket-id-map', { userId, socketId: socket.id })
    });

    socket.on('send-updates-to-room', async ({ room, session }) => {
        socket.to(room._id.toString()).emit('joined-user', { room, session });
    });

    socket.on('user-joining-request-accepted', async ({ to, room }) => {
        const userSocketId = getSocketId(to);
        if (userSocketId) {
            io.to(userSocketId).emit('navigate-attendee-to-live-session', { roomId: room })
        }
    });

    socket.on('notify-followers', async ({ post, followers }) => {
        followers.forEach(user => {
            const userSocketId = getSocketId(user._id);
            if (userSocketId)
                socket.to(userSocketId).emit('update-followers-recommended-post', { post })
        })
    });

    socket.on('notify-attendee-about-update', async ({ roomId, attendee }) => {
        if (!socket.rooms.has(roomId.toString())) return;
        socket.to(roomId.toString()).emit('update-attendee', { attendee });
    });

    socket.on('update-attendee-by-host', async ({ roomId, attendee }) => {
        if (!socket.rooms.has(roomId.toString())) return;
        socket.to(roomId.toString()).emit('update-attendee-by-host', { attendee });
    });

    socket.on('call-user', async ({to, offer, userId}) => {
        if (!to || !offer || !userId) return;
        io.to(to).emit('incomming-call', { from: socket.id, offer, userId});
    });

    socket.on('call-accepted', ({ to, answer }) => {
        if (!to || !answer) return;
        io.to(to).emit('call-accepted', { from: socket.id, answer });
    });
    
    socket.on('peer-nego-needed', ({ to, offer }) => {
        if (!to || !offer) return;
        io.to(to).emit('peer-nego-needed', { from: socket.id, offer});
    });
    
    socket.on('peer-nego-done', ({ to, answer }) => {
        if (!to || !answer) return;
        io.to(to).emit('peer-negotiation-final', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
        if (!to || !candidate) return;
        io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });
});

module.exports = { app, io, server };