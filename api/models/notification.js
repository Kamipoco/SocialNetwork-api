const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema({
   user: {
       type: ObjectId,
       ref: "User"
   },
   notifications: [
       {
           type: {
                type: String,
                enum: ["newLike", "newComment", "newFollower"]
           },
           user: {
               type: ObjectId,
               ref: "User"
           },
           post: {
               type: ObjectId,
               ref: "Post"
           },
           commentId: {
               type: String
           },
           text: {
               type: String
           },
           date: {
               type: Date, 
               default: Date.now
           }
       }
   ]
});

mongoose.model("Notification", notificationSchema);