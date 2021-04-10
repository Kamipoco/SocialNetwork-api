const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const ChatSchema = new mongoose.Schema({
    user: {
        type: ObjectId,
        ref: "User"
    },
    chats: [
        {
            messagesWith: {
                type: ObjectId,
                ref: "User"
            },
            messages: [
                {
                    msg: {
                        type:String, 
                        required: true
                    },
                    sender: {
                        type: ObjectId,
                        ref: "User"
                    },
                    receiver: {
                        type: ObjectId,
                        ref: "User"
                    },
                    date: {
                        type: Date
                    }
                }
            ]
        }
    ]
});

mongoose.model("Chat", ChatSchema);