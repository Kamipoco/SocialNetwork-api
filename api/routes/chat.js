const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route, get } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const { populate } = require('../models/message');
const { response } = require('express');
const { result } = require('underscore');
const User = mongoose.model("User");
const Conversation = mongoose.model("Conversation");
const Messages = mongoose.model("Messages");

//Add new conversation (Tạo cuộc hội thoại cần có id của người đang đang nhập và id của người nhận)
router.post('/addNewConversation', requireLogin, (req, res) => {

const idSender = req.user._id;
const idReceiver = req.body._id; 
console.log(req.body);

    Conversation.findOne({ members: { $all: [ idSender, idReceiver] } })
        .then((data) => {
            if(data !== null) {
                return res.status(422).json({status: false, message: `Create failed, Id ${idReceiver} already exists in the conversation with you`, data: data});
            } else {

                const result = new Conversation({
                    members: [idSender, idReceiver],
                    date: Date.now()
                
                });

                result.save()
                    .then((newConversation) => {
                        res.status(200).json({ status: 200, message: 'Add New Conversation Successfully!', data: {newConversation} });
                    }).catch((err) => {
                        res.status(422).json({error: err});
                    });
            }
        })
        .catch((err) => {
            console.log('Query failed or input is invalid');
            return res.status(500).json({status: false, error: err});
        });

}); 

//Delete Conversation(Theo id conversation)
router.delete('/deleteAConversation/:id', requireLogin, (req, res) => {
    const idConversation = req.params.id;

    Conversation.findOne({_id: idConversation})
        .exec((err, conversation) => {
            if(err || !conversation) {
                return res.status(422).json({error: err})
            }
            conversation.remove()
                .then((result) => {
                    res.status(200).json({status: 200, message: "Successfully deleted a Conversation!"})
                }).catch((err) => {
                    res.status(500).json({error: err});
                })
        })
});

//Get all conversation (Hiển thị hết tất cả cuộc hội thoại hiện có trong collection)
router.get('/getAllConversation', requireLogin, (req, res) => {

    Conversation.find()
        .populate("members", "_id name username avatarUrl")
        .then((GetAllConversation) => {
            res.status(200).json({ status: 200, message: "Get All Conversation Success", data:  {GetAllConversation}});
        })
        .catch((err) => {
            res.status(500).json({error: err});
        })
}); 

//getConversationOfUser (hiển thị các cuội hội thoại theo id người đang đăng đang nhập)
router.get('/getConversationOfUser', requireLogin, (req, res) => {

    Conversation.find({members: {$in: req.user._id}})       //findOne trả về obj còn find trả về [], findOne tìm thấy cái nào gần nhất sẽ ngưng rồi return về kq
        .populate("members", "_id name username avatarUrl")
        .sort('-date')  //sắp xếp conversation nào trên cùng theo thời gian tạo coversation nào gần nhất
        .then((GetConversationOfUser) => {
            res.status(200).json({ status: 200, message: "Get Conversation Of User Success", data:  {GetConversationOfUser}});
        })
        .catch((err) => {
            res.status(500).json({error: err});
        })
});

//get detail a Conversation (Lấy tin nhắn từ collection theo id của cuộc hội thoại)
router.get('/getMessages/:conversationId', requireLogin, (req, res) => {

    Conversation.findById({_id: req.params.conversationId})
        .populate("members", "_id username name avatarUrl")
        .select('-date -_id')
        .then((conversation) => {
            Messages.find({conversationId: req.params.conversationId})
                .sort('Date')
                .exec((err, messages) => {
                    if(err) {
                        return res.status(422).json({error: err});
                    }

                    res.status(200).json({status: 200, messages: "Success", data: {conversation, messages}});
                })
        })
        .catch((err) => {
            return res.status(500).json({error: "Server Error"});
        })

});

//Create new message bởi conversationId (Nhắn tin cho ai đó bất kì theo conversationId)
router.post('/newMessage/:idOfConversation', requireLogin, (req, res) => {
    try {

        const idOfConversation = req.params.idOfConversation;
        const userId = req.user._id;
        const msg = req.body.msg;

        const newMsg = new Messages({      //receiver socket
            conversationId: idOfConversation,
            msg: msg,
            senderId: userId,
            Date: Date.now()
        });

        newMsg.save()
            .then((newMessage) => {
                res.status(200).json({ status: 200, message: 'Add New Message Successfully!', data: {newMessage} });
            }).catch((err) => {
                res.status(422).json({error: err});
            });
        
    } catch (error) {
        console.log(error);
        return {error};
    }
});

//Delete message theo id
router.delete('/deleteAMessage/:idMsg', requireLogin, (req, res) => {
    const idMsg = req.params.idMsg;

    Messages.findOne({_id: idMsg})
        .exec((err, message) => {
            if(err || !message) {
                return res.status(422).json({error: err});
            }

            if(message.senderId.toString() === req.user._id.toString()) {
                message.remove()
                    .then((result) => {
                        res.status(200).json({status: 200, message: "Successfully deleted a Message!"})
                    })
                    .catch((err) => {
                        res.status(500).json({error: err});
                    })
            }
        });

});

module.exports = router;
