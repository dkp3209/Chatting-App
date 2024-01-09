const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./Utils/message');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./Utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//Set static floler
app.use(express.static(path.join(__dirname, 'public')));
const Admin = 'Chat-Bot';

//Run when clients connects
io.on('connection', socket => {
    // just to test either socket connects, type below lines
    // console.log('New ws connection.......');

    socket.on('joinRoom', ({ username, room }) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        //Welcome current user
        socket.emit('message', formatMessage(Admin, 'Welcome to Chatcord!'));

        //Broadcast when a user connects
        socket.broadcast.to(user.room).emit('message', formatMessage(Admin, `${user.username} has joined the chat`));

        //Send room and users info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        })
    })

    //Listen the chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
    
    //Run when a user disconnect
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user){
            io.to(user.room).emit('message', formatMessage(Admin, `${user.username} has left the chat`));

            //Send room and users info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            })
        }
    });
});

const port = 8000 || process.env.port;

server.listen(port, () => {
    console.log(`Servern is running on port ${port}`)
});

module.exports = app;