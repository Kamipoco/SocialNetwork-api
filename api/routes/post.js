const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { route } = require('./auth');
const requireLogin = require('../middleware/requireLogin');
const Post = mongoose.model("Post");
const user_controller = require('../controllers/user.controller');
const multer = require('multer');
const upload  = require('../helper/helper').upload;

//Hiển thị tất cả bài đăng
router.get('/Test', requireLogin, (req, res) => {   

    Post.find()
        .populate('postedBy', '_id name username avatarUrl')    //populate đc hiểu là nếu postedBy(Post) = _id(User) thì posts có thể lấy dữ liệu của bên db users
        .populate("comments.postedBy", "_id name avatarUrl")
        .sort('-createdAt')
        .then((posts, users) => {
            res.status(200).json({ status: 200, message: "Success", data:  {posts, users}});
        })
        .catch((err) => {
            res.status(500).json({error: err});
        });
});

//Implement Infinite Scroll Post
router.get('/allPost', requireLogin, async (req, res) => {   
    const {pageNumber} = req.query;
    const number = Number(pageNumber);
    const size = 8;

    try {
        let posts;

        if(number === 1) {
            posts = await Post.find()
                .limit(size)
                .sort('-createdAt')
                .populate('postedBy', '_id name username avatarUrl')
                .populate("comments.postedBy", "_id name avatarUrl")
        } else {
            const skips = size*(number - 1);
            posts = await Post.find()
                .skip(skips)
                .limit(size)
                .sort('-createdAt')
                .populate('postedBy', '_id name username avatarUrl')
                .populate("comments.postedBy", "_id name avatarUrl")
        }

        return res.status(200).json({status: 200, message: "Success", data: {posts}});
    } catch (error) {
        return res.status(500).send("Server error");
    }
});

//Hiển thị những bài đăng mà mình đã yêu thích
// router.get('/likePost', requireLogin, (req, res) => {
//     Post.find()
//         .populate('postedBy', '_id name username avatarUrl')
//         .populate("likes")
//         .then( (posts, users) => {
//             res.status(200).json({ status: 200, message: "Success", data:  {posts, users}})
//         })
//         .catch( (err) => {
//             res.status(500).json({status: false, error: err});
//         });
// });


//Chi tiết bài viết
router.get('/post/:id', requireLogin, (req, res) => {  
    Post.findById({_id: req.params.id})
    .populate('postedBy', '_id name username avatarUrl') 
    .populate("comments.postedBy", "_id name avatarUrl")
    .then((posts) => {
        res.status(200).json({status: 200, message: "Success", data: {posts}});
    }).catch((err) => {
        res.status(404).json({error: err});
    });
        
});

//Hiển thị user đã like bài post
router.get('/getUserLikePost/:postId', requireLogin, (req, res) => {

    const id = req.params.postId;

    Post.findById({_id: id})
        .populate("likes", "_id username name avatarUrl")
        .select("-comments -photo -content -hashtag -postedBy -_id -createdAt -updatedAt")
        .then((result) => {
            res.status(200).json({status: 200, message: "Success", data: result});
        })
        .catch((err) => {
            res.status(500).json(err);
        });
});


//Hiển thị các bài đăng của người mình đã theo dõi
router.get('/getSubpost', requireLogin,(req,res) => {  
    Post.find({ postedBy: {$in: req.user.following}})
        .populate('postedBy', '_id name username avatarUrl')
        .populate("comments.postedBy", "_id name avatarUrl")
        .sort('-createdAt')
        .then((posts) => {
            res.status(200).json({status: 200, message: "Success", data: {posts}});
        }).catch((err) => {
            res.status(500).json({status: false, error: err});
        }); 
});

//Tạo bài đăng
let storage = multer.diskStorage({
    destination: function (req, file, callback) {
        console.log("file" + file);
        callback(null, "./Uploads/");
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
let maxSize = 1000000 * 1000;
let uploadMul = multer({
    storage: storage,
    limits: {
        fileSize: maxSize
    }
});

//Create Post
router.post("/create", requireLogin, uploadMul.array("photo",6), user_controller.create);

//Update Post
router.put("/editPost/:PostId", requireLogin, uploadMul.array("photo",6), user_controller.editPost);

//Profile
//Hiển thị bài đăng của chính mình(_id của ng đăng nhập(user))
router.get('/myPost', requireLogin, (req, res) => { 
    Post.find({postedBy: req.user._id})
        .populate('postedBy', '_id name username avatarUrl')
        .populate("comments.postedBy", "_id name avatarUrl")
        .then((mypost) => {
            res.status(200).json({status: 200, message: "Success", data: {mypost}});
        })
        .catch((err) => {
            res.status(500).json({status: false, error: err});
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
            res.status(200).json({status: 200, message: "Success", data: result});
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
            res.status(200).json({status: 200, message: "Success", data: result});
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
            res.status(200).json({status: 200, message: "Success", data: result});
        }
    })
});

//Xóa comment
//Sửa comment

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
                res.status(200).json({status: 200, message: "Successfully deleted the post!"});
            }).catch((err) => {
                res.status(500).json({error: err});
            })
        }
    })
});




//Delete A Post
// router.delete("deletePost/:postId", async (req, res) => {
//     try {
//       const post = await Post.findById(req.params.postId);
//       if (post.postedBy === req.user._id) {
//         await post.deleteOne();
//         res.status(200).json("the post has been deleted");
//       } else {
//         res.status(403).json("you can delete only your post");
//       }
//     } catch (err) {
//       res.status(500).json(err);
//     }
//   });

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