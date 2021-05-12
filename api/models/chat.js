const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema({
    IConversation: {        
    name: {          //TOPIC
        type: String,
        required: true
    },     
    users: {                    // Default = 2 (P2P)  LƯU ID USER VÀ TỪ ĐÓ LẤY RA CÁC THÔNG TIN CẦN THIẾT
        type: ObjectId,
        ref: "User"                //LƯU ID CỦA RECEIVER & SENDER             
    }, 
    messages: [{
        type: ObjectId,             //LƯU ID CỦA TỪNG IMessage 
        ref: "Messages"
    }],
    date: {
        type: Date,                                 //Danh sách conversation if chứa ID user hiện tại
        default: Date.now()                         // Get conversation từ ID conversation
    }
}
});

const messagesSchema = new mongoose.Schema({
    IMessage: {             //KHI CLICK VÀO 1 CONVERSATION CỤ THỂ THÌ SẼ CÓ ID CỦA MESSAGES ĐÓ VÀ TỪ ID LẤY HẾT INFOR MSG
        msg: {
            type: String,
            required: true
        },
        senderId: {
            type: ObjectId,
            ref: "User"
        },
        receiverId: {
            type: ObjectId,
            ref: "User"
        },
        message_status:{
            type: Boolean, 
            default: false
        },
        Date: {
            type: Date,
            default: Date.now()
        }
    }
});

module.exports = mongoose.model("Conversation", conversationSchema);
module.exports = mongoose.model("Messages", messagesSchema);




// userBy: {
//     type: ObjectId,
//     ref: "User"
// },
// chats: [
//     {
//         messagesWith: {
//             type: ObjectId,
//             ref: "User"
//         },
//         messages: [
//             {
//                 msg: {
//                     type:String, 
//                     required: true
//                 },
//                 sender: {
//                     type: ObjectId,
//                     ref: "User",
//                     required: true
//                 },
//                 receiver: {
//                     type: ObjectId,
//                     ref: "User",
//                     required: true
//                 },
//                 date: {
//                     type: Date,
//                     default: Date.now()
//                 }
//             }
//         ]
//     }
// ]