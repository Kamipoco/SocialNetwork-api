const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const User = mongoose.model("User");


//GET ALL CHATS
// router.get('/getAllChat', requireLogin, async (req, res) => {
//  try {

//     const result = await Chat.findOne({userBy: req.user._id}).populate("chats.messagesWith");
//     console.log(result);

//     var chatsToBeSent = []; // Lấy ra từng block của list Conversation

//     if(result.chats.length > 0) {
//         chatsToBeSent = await result.chats.map(chat => ({
//             messagesWith: chat.messagesWith._id,
//             name: chat.messagesWith.name,
//             avatarUrl: chat.messagesWith.avatarUrl,
//             lastMessage: chat.messages[chat.messages.length - 1].msg,
//             date: chat.messages[chat.messages.length - 1].date
//         }));
//     }

//     console.log(chatsToBeSent);
//     return res.status(200).json({status: 200, messages: "Success", data: {chatsToBeSent}});

//  } catch (error) {
//      return res.status(500).json({error: error});
//  }
// });

// //GET USER INFOR
// router.get('/user/:userToFindId', requireLogin, async (req, res) => {
//     try {
//         const user = await User.findById(req.params.userToFindId);

//         if(!user) {
//             return res.status(400).json({status: 400, error: "No User Found"});
//         }
//         return res.json({name: user.name, avatarUrl: user.avatarUrl});
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({status: false, error: "Server Error"});
//     }
// });

// //DELETE A CHAT
// router.delete(`/:messagesWith`, requireLogin, async (req, res) => {
//     try {
//         const {userId} = req;
//         const {messagesWith} = req.params;

//         const user = await Chat.findOne({user: userId});
//         const chatToDelete = user.chats.find(chat => chat.messagesWith._id === messagesWith);

//         if(!chatToDelete) {
//             return res.status(400).json({status: 400, message: "Chat not found!"});
//         }

//         const indexOf = user.chats.map(chat => chat.messagesWith.toString()).indexOf(messagesWith);

//         user.chats.splice(indexOf, 1);
//         return res.status(200).json({status: 200, message: "Chat deleted!"});
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({status: false, error: "Server Error"});
//     }
// });

//Tọa dữ liệu ảo
// router.get('/createData', requireLogin, async (req, res) => {
//     try {
//         const chatAll = new Chat({
//             userBy: '60936e6adf01d51e70fef3e5',
//             chats: [{
//                 messagesWith: '609370bf254de71f1892719e',
//                 messages: [
//                     {
//                         msg: "Hi! Tuan Anh chat voi Start",
//                         sender: '60936e6adf01d51e70fef3e5',
//                         receiver: '609370bf254de71f1892719e',
//                         date: '2021-04-05T18:33:23.233Z'
//                     }
//                 ]
//             }]
//         });

//         chatAll.save();

//         const dataChat = await Chat.find();

//         return res.status(200).json({status: 200, messages: "Success", data: dataChat})
//     } catch (error) {
//         console.log(error);
//         return res.status(500).json({status: false, error: "Error Server!!!"});
//     }
// });

module.exports = router;
