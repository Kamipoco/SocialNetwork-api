const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema.Types;

const tokenSchema = new mongoose.Schema({
    _userId: { 
        type: ObjectId, 
        required: true, 
        ref: "User" 
    },
    tokenVerify: { 
        type: String, 
        required: true 
    },
    expireAt: { 
        type: Date, 
        expires: 86400000,
        default: Date.now()
    }
    // index: { expires: 86400000 } 
});

mongoose.model('TokenVerify', tokenSchema);