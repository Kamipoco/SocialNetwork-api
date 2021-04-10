const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const Chat = mongoose.model('Chat');

//Get all chat
router.get('/getAllChat', requireLogin, async (req, res) => {
 const chatId = req.body.chatId;

    Chat.find()
        .then(result => {
            res.status(200).json({status: 200, message: "Success", data: {result}});
        })
        .catch(err => {
            res.status(422).json({status: false, error: err});
        })
});