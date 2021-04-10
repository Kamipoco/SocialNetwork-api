const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model("Post");
const User = mongoose.model("User");
const bcrypt = require('bcryptjs');

function getUsers(res) {                             //Chú ý khi get tất cả thì dữ liệu trả về là 1 mảng or 1 mảng gồm các object
                                                    //Còn lấy chi tiết từng cái thì dữ liệu trả về là 1 object
    User.find( (err, users) => {
        if(err) {
            res.status(500).json(err);
        } else {
            res.status(200).json({status: 200, message: "Success", data: {users}});
        }
    });
}

//Lấy tất cả user
router.get('/getAllUser', requireLogin, (req, res) => {  
    getUsers(res);
});

//Chi tiết user theo id
router.get('/user/:id', requireLogin, (req, res) => {  
    User.findOne({_id: req.params.id})
    .select("-password")
    .then(user => {
        Post.find({postedBy: req.params.id})
        .populate("postedBy", "_id name")
        .exec((err, posts) => {
            if(err) {
                return res.status(422).json({error: err})
            }
            res.status(200).json({status: 200, message: "Success", data: {user, posts}});
        })
    })
    .catch(err => {
        return res.status(404).json({error: "User not found"});
    })
});

//B1:trước tiên từ username truyền lên ta phải tìm ra _id của người đó 
//B2: xong từ _id ta lấy bài viết thông qua (_id)
router.get('/users/:username', requireLogin, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        const idUsername = user._id; //lấy _id của username được truyền qua params sau đó từ _id lấy posts của ng đó
        // console.log(idUsername);
        // console.log(user);
        Post.findOne({postedBy: idUsername})
        .populate('postedBy', '_id name username avatarUrl') 
        .populate("comments.postedBy", "_id name avatarUrl")
        .then((posts) => {
            res.status(200).json({status: 200, message: "Success", data: {posts, user}});
        }).catch((err) => {
            res.status(404).json({error: err});
        });
       } catch (err) {
        res.json({ error: err.message || err.toString() });
       }
});

//Theo dõi user
router.put('/follow', requireLogin, (req, res) => { 
    User.findByIdAndUpdate(req.body.followId, {
        $push: {followers: req.user._id}
    }, {
        new: true
    },(err, result) => {
        if(err) {
            return res.status(422).json({error: err})
        }
        User.findByIdAndUpdate(req.user._id, {
            $push: {following: req.body.followId}
        }, {new: true}).select("-password").then(result => {
            res.json(result);
        }).catch(err => {
            return res.status(422).json({error: err})
        })

    })
});

//Bỏ theo dõi
router.put('/unfollow', requireLogin, (req, res) => { 
    User.findByIdAndUpdate(req.body.unfollowId, {
        $pull: {followers: req.user._id}
    }, {
        new: true
    },(err, result) => {
        if(err) {
            return res.status(422).json({error: err})
        }
        User.findByIdAndUpdate(req.user._id, {
            $pull: {following: req.body.unfollowId}
            
        }, {new: true}).select("-password").then(result => {
            res.status(200).json(result)
        }).catch(err => {
            return res.status(422).json({error: err})
        })
        
    })
});

//Cập nhật avatar và lưu vào DB
router.put('/updateAvatarUrl', requireLogin, (req, res) => { 
    const pic = req.body.avatarUrl;

    if(!pic || pic === null) { //Kiểm tra data đầu vào
        return res.status(422).json({ status: false, error: "Data can not null"});
    }
    User.findByIdAndUpdate(req.user._id, {$set: {avatarUrl: req.body.avatarUrl}}, {new: true},
        (err, result) => {
            if(err) {
                return res.status(422).json({error: "avatarUrl can not post"});
            }
            res.status(200).json({status: 200, message: "Update Success", data: {result}});
    })
});

//Đổi mật khẩu user
router.patch('/changePassword/:id', requireLogin, async (req, res, next) => {  
    //Kiểm tra user nhập vào pass cũ có đúng ko
    //Nếu đúng thì mới cho nhập mật khẩu mới

    try {
        var _id = req.params.id;
        // var password = req.body.password;
        if(!password || password === null) {
            return res.status(422).json({status: 422, error: "you must fill out the field completely"});
        }

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        const userPassword = await User.findByIdAndUpdate({ _id: _id }, { password: password }, { new: true });

        return res.status(200).json({status: 200, message: "Password changed successfully!"});

    } catch (error) {
        return res.status(400).json({status: false, error: error});
    }
});

//Search user
router.get('/search-users', requireLogin, (req, res) => {
    const fieldSearch = req.query.name;

    if(!fieldSearch || fieldSearch.length === 0) {
        return res.status(422).json({status: false, message: "Please fill in all fields"});
    }

    User.find({name: {$regex: fieldSearch, $options: '$i'}})
        .then((users) => {
            console.log(users);
            if(!users || users === null || users == "") {
                return res.status(404).json({status: 404, message: "Not Found!"});
            }
            res.status(200).json({status: 200, message: "Successful Search!", data: {users}});
        })
        .catch((err) => {
            res.status(404).json({status: false, error: err});
        })
});

//Update infor of user
router.put('/editProfile/:id', requireLogin, (req, res) => {

    const {name, username, email, avatarUrl, bio} = req.body;

    if(!name || !username || !email || !avatarUrl || !bio) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const id = req.params.id;

    User.findByIdAndUpdate(id, {
        name: req.body.name,
        username: req.body.username,
        email: req.body.email,
        avatarUrl: req.body.avatarUrl,
        bio: req.body.bio
    }, {new: true})
    .then(data => {
        if(!data) {
            res.status(404).send({
                message: `Cannot Edit User with id=${id}. Maybe User was not found!`
              });
            } else 
            res.send({ status: 200, message: "User was edited successfully." });
    })
    .catch((err) => {
        res.status(500).send({
            message: "Error Editing User with id=" + id
    });
});
});

module.exports = router;