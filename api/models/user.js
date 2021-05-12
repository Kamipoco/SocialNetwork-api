const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const userSchema = new mongoose.Schema({
    name: { //có thể trùng nhau
        type: String,
        required: true
    },
    username: { //username làm slug hiện trên url(check trùng)
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: {
        type: String
    },
    expireToken: {
        type: Date
    },
    avatarUrl: {
        type: String,
        default: "https://res.cloudinary.com/aloapp/image/upload/v1617867174/images_tmzpno.png"
    },
    bio: {
        type: String,
        default: ""
    },
    followers: [{
        type: ObjectId,
        ref: "User"
    }],
    following: [{
        type: ObjectId,
        ref: "User"
    }]
});


mongoose.model('User', userSchema);