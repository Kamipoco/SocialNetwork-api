const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const messagesSchema = new mongoose.Schema({
           //KHI CLICK VÀO 1 CONVERSATION CỤ THỂ THÌ SẼ CÓ ID CỦA MESSAGES ĐÓ VÀ TỪ ID LẤY HẾT INFOR MSG
        conversationId: {
            type: String
        },
        msg: {
            type: String,
            required: true
        },
        senderId: {
            type: String
        },
        Date: {
            type: Date,
            default: Date.now()
        }
        // receiverId: {
        //     type: ObjectId,
        //     ref: "User"
        // },
        // message_status:{
        //     type: Boolean, 
        //     default: false
        // },
});

module.exports = mongoose.model("Messages", messagesSchema);