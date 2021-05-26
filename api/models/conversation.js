const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const conversationSchema = new mongoose.Schema({     
    members: [{               // Default = 2 (P2P)
        type: ObjectId,    //=> TỪ ID LẤY HẾT INFOR CỦA RECEIVER & SENDER  
        ref: "User"         //LƯU ID CỦA RECEIVER & SENDER   
    }],
    date: {
        type: Date,                 //Danh sách conversation if chứa ID user hiện tại
        default: Date.now()         // Get conversation từ ID conversation
    }
});

module.exports = mongoose.model("Conversation", conversationSchema);