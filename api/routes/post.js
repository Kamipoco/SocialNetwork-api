const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model("Post");

//Hiển thị tất cả bài đăng
router.get('/allPost', requireLogin,(req,res) => {   
    Post.find()
        .populate('postedBy', '_id name username avatarUrl')    //populate đc hiểu là nếu postedBy(Post) = _id(User) thì posts có thể lấy dữ liệu của bên db users
        .populate("comments.postedBy", "_id name avatarUrl")
        .sort('-createdAt')
        .then((posts, users) => {
            res.status(200).json({posts, users});
        }).catch((err) => {
            res.status(404).json({error: err});
        });
});

router.get('/likePost', (req, res) => {
    Post.find()
        .populate('postedBy', '_id name username avatarUrl')
        .populate("likes")
        .then( (posts, users) => {
            res.status(200).json({posts, users})
        })
        .catch( (err) => {
            console.log(err);
        });
});

//Chi tiết bài viết
router.get('/post/:id', requireLogin, (req, res) => {  
    Post.findById({_id: req.params.id})
    .populate('postedBy', '_id name username avatarUrl') 
    .populate("comments.postedBy", "_id name avatarUrl")
    .then((posts) => {
        res.status(200).json({posts});
    }).catch((err) => {
        res.status(404).json({error: err});
    });
        
});

//Hiển thị các bài đăng của người mình đã theo dõi
router.get('/getSubpost', requireLogin,(req,res) => {  
    Post.find({ postedBy: {$in: req.user.following}})
        .populate('postedBy', '_id name username avatarUrl')
        .populate("comments.postedBy", "_id name avatarUrl")
        .sort('-createdAt')
        .then((posts) => {
            res.status(200).json({posts});
        }).catch((err) => {
            console.log(err);
        });
});

//Tạo bài đăng
router.post('/createPost', requireLogin, (req, res) => { 
    const {hashtag, content, photo} = req.body;
    if(!hashtag || !content || !photo) {
        return res.status(422).json({errors: "Please add all the field"});
    }
    console.log(req.user);

    const post = new Post({
        hashtag,
        content,
        // photo: avatarUrl,
        photo,
        postedBy: req.user
    });
    post.save()
        .then((result) => {
            res.status(200).json({ status: 200, message: 'Created Post Successfully!', post: result });
        }).catch((err) => {
            res.status(422).json({error: err});
        });
});

//Profile
//Hiển thị bài đăng của chính mình(_id của ng đăng nhập(user))
router.get('/myPost', requireLogin, (req, res) => { 
    Post.find({postedBy: req.user._id})
        .populate("PostedBy", "_id name username avatarUrl")
        .then((mypost) => {
            res.status(200).json({mypost});
        })
        .catch((err) => {
            console.log(err);
        });
});

//Like bài đăng
router.put('/like', requireLogin, (req, res) => { 
    Post.findByIdAndUpdate(req.body.postId, {
        $push: {likes: req.user._id}
    }, {
        new: true
    })
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name username avatarUrl")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

//Bỏ like bài đăng
router.put('/unlike', requireLogin, (req, res) => { 
    Post.findByIdAndUpdate(req.body.postId, {
        $pull: {likes: req.user._id}
    }, {
        new: true
    })
    .populate("comments.postedBy", "_id name avatarUrl")
    .populate("postedBy", "_id name username avatarUrl")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

//Bình luận bài viết
router.put('/comment', requireLogin, (req, res) => { 
    const comment = { 
        text: req.body.text,
        postedBy: req.user._id
    }

    Post.findByIdAndUpdate(req.body.postId, {
        $push: {comments: comment}
    }, {
        new: true
    })
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name username avatarUrl")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

//Xóa 1 bài viết của chính mình
router.delete('/deletePost/:postId', requireLogin,(req, res) => { 
    Post.findOne({_id: req.params.postId})
    .populate("postedBy", "_id")
    .exec((err, post) => {
        if(err || !post) {
            return res.status(422).json({error: err})
        }
        if(post.postedBy._id.toString() === req.user._id.toString()) {
            post.remove()
            .then((result) => {
                res.status(200).json({status: 200, message: "Successfully deleted the post!"})
            }).catch((err) => {
                console.log(err);
            })
        }
    })
});

//Xóa tất cả bài đăng của chính mình
// router.delete('/deleteAllMyPost/:id', requireLogin, (req, res) => { 
//     const userid = req.params.id;
//     Post.find({_id: userid})
//         .remove()
//         .then((mypost) => {
//             res.status(200).json({status: 200, message: "Delete Successfully!"});
//         })
//         .catch((err) => {
//             console.log(err);
//         });
// });


module.exports = router;