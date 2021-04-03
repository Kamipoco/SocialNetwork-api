const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const postSchema = new mongoose.Schema({
    hashtag: { //hashtag
        type: String,
        required: true
    },
    content: { //content
        type: String,
        required: true
    },
    photo: {
        type: Array,
        required: true
    },
    likes: [{
        type: ObjectId, 
        ref: "User",
    }],
    comments: [{
        text: String,
        postedBy: {
            type: ObjectId,
            ref: "User"
        }
    }],
    postedBy: {
        type: ObjectId,
        ref: "User"
    }
},{timestamps: true});

mongoose.model("Post", postSchema);