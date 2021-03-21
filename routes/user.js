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
            res.status(200).json(users);
        }
    });
}

router.get('/getAllUser', requireLogin, (req, res) => {  //Lấy tất cả user
    getUsers(res);
})

router.get('/user/:id', requireLogin, (req, res) => {  //Chi tiết user
    User.findOne({_id: req.params.id})
    .select("-password")
    .then(user => {
        Post.find({postedBy: req.params.id})
        .populate("postedBy", "_id name")
        .exec((err, posts) => {
            if(err) {
                return res.status(422).json({error: err})
            }
            res.status(200).json({user, posts})
        })
    })
    .catch(err => {
        return res.status(404).json({error: "User not found"});
    })
})

router.put('/follow', requireLogin, (req, res) => { //Theo dõi user
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
            res.json(result)
        }).catch(err => {
            return res.status(422).json({error: err})
        })

    })
})

router.put('/unfollow', requireLogin, (req, res) => { //Bỏ theo dõi
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
})

router.put('/updatepic', requireLogin, (req, res) => { //Cập nhật avatar và lưu vào DB
    User.findByIdAndUpdate(req.user._id, {$set: {pic: req.body.pic}}, {new: true},
        (err, result) => {
            if(err) {
                return res.status(422).json({error: "Pic can not post"});
            }
            res.status(200).json(result);
    })
})

router.patch('/changePassword/:id', requireLogin, async (req, res, next) => {  //Đổi mật khẩu user
    //Kiểm tra user nhập vào pass cũ có đúng ko
    //Nếu đúng thì mới cho nhập mật khẩu mới

    try {
        var _id = req.params.id;
        // var password = req.body.password;

        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash(req.body.password, salt);
        const userPassword = await User.findByIdAndUpdate({ _id: _id }, { password: password }, { new: true });

        return res.status(200).json({status: true, data: userPassword});

    } catch (error) {
        return res.status(400).json({status: false, error: error});
    }
});

//Search user(Done)
router.get('/search-users', requireLogin, (req, res) => {
    const fieldSearch = req.query.name;

    User.find({name: {$regex: fieldSearch, $options: '$i'}})
        .then((users) => {
            res.status(200).json({users});
        })
        .catch((err) => {
            res.status(404).json({status: false, error: err});
        })
});

//Update infor of user
router.put('/editProfile/:id', requireLogin, (req, res) => {
    if(!req.body) {
        return res.status(400).send({
            message: "Data to update can not be empty!"
        });
    }
    const id = req.params.id;

    User.findByIdAndUpdate(id, {
        name: req.body.name,
        email: req.body.email,
        pic: req.body.pic,
        description: req.body.description
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