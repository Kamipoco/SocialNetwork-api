const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model("Post");

router.get('/allPost', requireLogin,(req,res) => {  //Hiển thị tất cả bài đăng
    Post.find()
        .populate('postedBy', '_id name pic')    //populate đc hiểu là nếu postedBy(Post) = _id(User) thì posts có thể lấy dữ liệu của bên db users
        .populate("comments.postedBy", "_id name pic")
        .then((posts, users) => {
            res.status(200).json({posts, users});
        }).catch((err) => {
            res.status(404).json({error: err});
        });
});

// router.get('/postDetail/:id', requireLogin, (req, res) => { //DATA NULL
//     var _id = req.params._id;
//     Post.find({ _id: _id})
//         .populate('postedBy', '_id name')
//         .then((posts, users) => {
//             res.status(200).json({posts, users});
//         })
//         .catch((err) => {
//             res.status(404).json({error: err});
//         })
// });

router.get('/likePost', (req, res) => {
    Post.find()
        .populate('postedBy', '_id name pic')
        .populate("likes")
        .then( (posts, users) => {
            res.status(200).json({posts, users})
        })
        .catch( (err) => {
            console.log(err);
        });
})

router.get('/post/:id', requireLogin, (req, res) => {  //Chi tiết bài viết
    Post.findById({_id: req.params.id})
    .populate('postedBy', '_id name pic') 
    .populate("comments.postedBy", "_id name pic")
    .then((posts) => {
        res.status(200).json({posts});
    }).catch((err) => {
        res.status(404).json({error: err});
    });
        
})

router.get('/getSubpost', requireLogin,(req,res) => {  //Hiển thị các bài đăng của người mình đã theo dõi
    Post.find({ postedBy: {$in: req.user.following}})
        .populate('postedBy', '_id name pic')
        .populate("comments.postedBy", "_id name pic")
        .then((posts) => {
            res.status(200).json({posts});
        }).catch((err) => {
            console.log(err);
        });
});

router.post('/createPost', requireLogin, (req, res) => { //Tạo bài đăng
    const {title, body, pic} = req.body;
    if(!title || !body || !pic && pic != null) {
        return res.status(422).json({error: "Please add all the field"});
    }
    // console.log(req.user);
    // res.send('oke');
    // req.user.password = undefined;
    const post = new Post({
        title,
        body,
        photo: pic,
        postedBy: req.user
    });
    post.save()
        .then((result) => {
            res.status(200).json({ status: 200, message: 'Created Post Successfully!', post: result });
        }).catch((err) => {
            res.status(422).json({error: err});
        });
});

router.get('/myPost', requireLogin, (req, res) => { //Hiển thị bài đăng của chính mình
    Post.find({postedBy: req.user._id})
        .populate("PostedBy", "_id name")
        .then((mypost) => {
            res.status(200).json({mypost});
        })
        .catch((err) => {
            console.log(err);
        });
});

router.put('/like', requireLogin, (req, res) => { //Like bài đăng
    Post.findByIdAndUpdate(req.body.postId, {
        $push: {likes: req.user._id}
    }, {
        new: true
    })
    .populate("comments.postedBy", "_id name")
    .populate("postedBy", "_id name pic")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

router.put('/unlike', requireLogin, (req, res) => { //Bỏ like bài đăng
    Post.findByIdAndUpdate(req.body.postId, {
        $pull: {likes: req.user._id}
    }, {
        new: true
    })
    .populate("comments.postedBy", "_id name pic")
    .populate("postedBy", "_id name")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

router.put('/comment', requireLogin, (req, res) => { //Bình luận bài viết
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
    .populate("postedBy", "_id name pic")
    .exec((err, result) => {
        if(err) {
            return res.status(422).json({error: err});
        } else {
            res.status(200).json(result);
        }
    })
});

router.delete('/deletePost/:postId', requireLogin,(req, res) => { //Xóa bài viết của chính mình
    Post.findOne({_id: req.params.postId})
    .populate("postedBy", "_id")
    .exec((err, post) => {
        if(err || !post) {
            return res.status(422).json({error: err})
        }
        if(post.postedBy._id.toString() === req.user._id.toString()) {
            post.remove()
            .then(result => {
                res.status(200).json(result)
            }).catch(err => {
                console.log(err);
            })
        }
    })
})


module.exports = router;