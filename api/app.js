const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    }
});

var bodyParser = require('body-parser'); //Chuyển dữ liệu về dạng json để có thể đọc được
const mongoose = require('mongoose');
const morgan = require('morgan');
const helmet = require('helmet');
const PORT = 5000;
const { MongoUrl } = require('./keys');
const { remove } = require('./models/message');

//Test socket
const Conversation = require('./models/conversation');
const Messages = require('./models/message');


mongoose.set('useFindAndModify', false);

mongoose.connect(MongoUrl,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
    });
mongoose.connection.on('connected', () => {
    console.log('Connect Success Mongodb !');
});
mongoose.connection.on('error', (err) => {
    console.log('Error connecting!');
});

app.use(bodyParser.json());//Kiểu dữ liệu muốn đọc từ người dùng gửi lên đc chuyển sang json
app.use(bodyParser.urlencoded({ extended: true })); //chấp nhận mọi kiểu gửi về server

//=> ĐÃ ĐƯỢC THAY THẾ BẰNG
app.use(cors()); //Tương tác qua lại giữa client và server (như upload ảnh), bảo mật dự án
app.use(express.json());//Kiểu dữ liệu muốn đọc từ người dùng gửi lên đc chuyển sang json
app.use(express.urlencoded({extended: true}))


//===============================ACTION===================================
let users = [];

//AddUser
const addUser = async (userId, socketId) => {

    !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
    
};

//removeUser
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);
};

//FindConnectedUser
const getUser = (userId) => {
    return users.find(user => user.userId === userId);
};


//=====================  SOCKET  ============================================
io.on('connection', (socket) => {

    //Connect
    console.log('A user connected.');
    
    //Lấy userId và socketId từ user
    socket.on('addUser', userId => {
        addUser(userId, socket.id);
        io.emit('getUsers', users);
    });

    //Gửi và nhận message
    //receiverID lọc trong members có id khác với userId
    socket.on('sendMessage', ({senderId, receiverId, msg}) => {      
        const user = getUser(receiverId);
        // console.log(user);

        //Chia 2 trường hợp:
        if(!user) { //TH1: nếu receiver đang không online thì chúng ta sẽ gửi cái thông tin đó đi và lưu vào Db xử lý thông qua server
                    //Khi nào user đó online thì sẽ nhận socket và getMsg

            console.log("Đối phương đã Offline");
        } else { //TH2: Nếu receiver online thì gửi trực tiếp tới socketId đó cái thông tin cuộc hội thoại
            io.to(user.socketId).emit('getMessage', {
                senderId,
                msg
            });
        }

        // io.to(user.socketId).emit('getMessage', {
        //     senderId,
        //     msg
        // });
    }); 


    // //Chat message
    // socket.on('sendMessage', ({senderId, receiverId, msg}) => {
    //     console.log("message: " + msg);

    // let  chatMessage  =  new Messages({
    //     senderId: senderId,
    //     msg: msg,
    //     Date: Date.now()
    // });

    // chatMessage.save();
    // });

    
    //Offline
    socket.on('disconnect', (res) => {
        console.log('A User disconnect!');
        removeUser(socket.id);
        io.emit("getUsers", users);
    });

    // Listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {
            username: socket.username
        })
    });
});


require('./models/user'); //Tạo các schema để có thể làm việc 
require('./models/post');
require('./models/conversation');
require('./models/message');
require('./models/notification');
require('./models/tokenVerify');

app.use(morgan('dev')); //log ra các trạng thái của API và thời gian phản hồi
app.use(helmet()); //Lọc các dữ liệu người dùng gửi lên server tránh DDOS, XSS,...
app.use(require('./routes/auth')); //định tuyến đường đi cho các API 
app.use(require('./routes/post'));
app.use(require('./routes/user'));
app.use(require('./routes/chat'));


server.listen(PORT, () => { 
    console.log('Server is running on', PORT);
});


// io.onlineUsers = {};

// io.on('connection', (socket) => {
//     var currentUserId;

//     socket.on('join', (userId) => {
//         socket.join(userId);
//         currentUserId = userId;
//     });

//     //Online & Offline
//     socket.on('goOnline', (id) => {
//         io.onlineUsers[id] = true;

//         socket.on('userDisconnected', (userCurrentId) => {
//             io.onlineUsers[userCurrentId] = false;
//         });

//         socket.on('disconnect', (userId) => {
//             console.log(io.onlineUsers);

//             io.onlineUsers[currentUserId] = false;
//             io.emit('onlineFriends', io.onlineUsers);
//         });
//     });

//     //getOnlineFriends
//     socket.on('getOnlineFriends', (userInfor) => {
//         io.emit('onlineFriends', io.onlineUsers);
//     });

//     //Gửi và nhận msg
//     socket.on('sendMessage', (data) => {
//         io.to(data.socketId).emit('newMessage', data);

//         io.to(data.receiverId).emit('newChat', data);
//     });

// });