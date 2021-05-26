const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
var bodyParser = require('body-parser'); //Chuyển dữ liệu về dạng json để có thể đọc được
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const PORT = 5000;
const { MongoUrl } = require('./keys');
const { remove } = require('./models/message');
// const {addUser, removeUser, findConnectedUser} = require('./utilsServer/roomAction');
// const {loadMessages, sendMsg, setMsgToUnread, deleteMsg} = require('./utilsServer/messageAction');

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

app.use(cors()); //Tương tác qua lại giữa client và server (như upload ảnh), bảo mật dự án
app.use(bodyParser.json());//Kiểu dữ liệu muốn đọc từ người dùng gửi lên đc chuyển sang json
app.use(bodyParser.urlencoded({ extended: true })); //chấp nhận mọi kiểu gửi về server

//=> ĐÃ ĐƯỢC THAY THẾ BẰNG
app.use(express.json());//Kiểu dữ liệu muốn đọc từ người dùng gửi lên đc chuyển sang json
app.use(express.urlencoded({extended: true}))


//===============================ACTION===================================
const users = [];

//AddUser
const addUser = async (userId, socketId) => {
    const user = users.find(user => user.userId === userId);

    if(user && user.socketId === socketId) {
        return users
    } else {
        if(user && user.socketId !== socketId) {
            await removeUser(user.socketId);
        }

        const newUser = { userId, socketId };
        users.push(newUser);
        return users;
    }
};

//removeUser
const removeUser = (socketId) => {
    users = users.filter((user) => user.socketId !== socketId);

    // const indexOf = users.map(user => user.socketId).indexOf(socketId);
    // await users.splice(indexOf, 1);
    // return;
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
    socket.on('sendMessage', ({userId, receiverId, msg}) => {
        const user = getUser(receiverId);

        io.to(user.socketId).emit('getMessage', {
            senderId,
            msg
        });
    }); 
    
    //Offline
    socket.on('disconnect', (res) => {
        console.log('A User disconnect!');
        removeUser(socket.id);
        io.emit('getUsers', users);
    });

    // Listen on typing
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', {
            username: socket.username
        })
    });
});


//SOCKET
// io.on("Connection", socket => {

//     //join
//     socket.on("join", async ({userId}) => {
//         const users = await addUser(userId, socket.id);      KHI USER JOIN VÀO ROOM THÌ TỰ ĐỘNG CHO NÓ MỘT userId và một socketid
//         console.log(users);

//         setInterval(() => {
//MẢNG users[] LÀ NHỮNG USER ĐÃ KẾT NỐI CHỈ LƯU NGƯỜI CÓ ID KHÁC VỚI ID HIỆN TẠI CÁI NGƯỜI ĐANG ĐĂNG NHẬP(CÁI NÀY LẤY NHỮNG NGƯỜI HIỆN TẠI ĐANG ONLINE)
//             socket.emit("connectedUser", {
//                 users: users.filter(user => user.userId !== userId)     
//             }); 
//         }, 10000);
//     });

//     //load Messages
//     socket.on("loadMessages", async ({userId, messagesWith}) => {                 THAY messagesWith = senderId
//         const {chat, error} = await loadMessages(userId, messagesWith);           THAY messagesWith = senderId

//         if(!error) {
//             socket.emit("messageLoaded", {chat});
//         } else {
//             socket.emit('noChatFound');
//         }
//     });

//     //send new message
//     socket.on("sendNewMsg", async ({userId, msgSendToUserId, msg}) => {         GỬI TIN NHẮN MỚI ĐẾN CHO AI ĐÓ THÌ CÓ userId và msg và (msgSendToUserId)id cái user sẽ được nhận tin nhắn 
//         const {newMsg, error} =  await sendMsg(userId, msgSendToUserId, msg);
//         const receiverSocket = await findConnectedUser(msgSendToUserId);

//         if(receiverSocket) {
//             //khi bạn muốn gửi tin nhắn đến một socket cụ thể
//             io.to(receiverSocket.socketId).emit('newMsgReceiver', {newMsg});
//         } else {
//             await setMsgToUnread(msgSendToUserId);
//         }

//         !error && socket.emit('msgSent', {newMsg});
//     });

//     //delete message
// XÓA MSG THÌ CẦN TRUYỀN VÀO 
//     socket.on('deleteMsg', async ({userId, messagesWith, messageId}) => { 
//         const {success} = await deleteMsg(userId, messagesWith, messageId);

//         if(success) {
//             socket.emit('msgDeleted');
//         }
//     });

//     //send msg from notification (hiện tin nhắn ở trên popup)
//     socket.on('sendMsgFromNotification', async ({userId, msgSendToUserId, msg}) => {
//         const {newMsg, error} =  await sendMsg(userId, msgSendToUserId, msg);
//         const receiverSocket = await findConnectedUser(msgSendToUserId);

//         if(receiverSocket) {
//             //khi bạn muốn gửi tin nhắn đến một socket cụ thể
//             io.to(receiverSocket.socketId).emit('newMsgReceiver', {newMsg});
//         } else {
//             await setMsgToUnread(msgSendToUserId);
//         }

//         !error && socket.emit('msgSent', {newMsg});
//     });

//     //disconnect
//     socket.on("disconnect", () => {
//         removeUser(socket.id);
//         console.log('User disconnected');
//     });
// });


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


app.listen(PORT, () => { 
    console.log('Server is running on', PORT);
});
