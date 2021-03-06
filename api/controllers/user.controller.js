const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model("User");
const Post = mongoose.model("Post");
const _ = require('underscore');
const upload = require('../helper/helper').upload;
const fs = require('fs');
// const { url } = require('inspector');


exports.create = async (req, res, next) => {
    if(!req.files || _.isEmpty(req.files)) {
        return res.status(400).json({ status: 400, message: "No file uploaded!"});
    }
    const files = req.files;
    try {
        let urls = [];
        let multiple = async (path) => await upload(path);
        for(const file of files) {
            const {path} = file;
            // console.log("path", file);

            const newPath = await multiple(path);
            urls.push(newPath);
            fs.unlinkSync(path);
        }

        if(urls) {
            let body = req.body;
            let bodyw = _.extend(body, {postedBy: req.user}, {photo: urls });
            let new_post = new Post(bodyw);
            await new_post.save()
                .then((saved) => {
                    return res.status(200).json({status: 200, message: "Success", data: saved});
                }).catch((err) => {
                    return res.status(500).json({status: 500, error: err});
                });
        }

        if(!urls) {
            return res.status(400).json({status: 400, message: "Urls Empty"});
        }
    } catch (error) {
        // console.log("err: " + error);
        return next(error);
    }
}

exports.editPost = async (req, res, next) => {
    if(!req.files || _.isEmpty(req.files)) {
        return res.status(400).json({ status: 400, message: "No file uploaded!"});
    }
    const files = req.files;
    try {
        let urls = [];
        let multiple = async (path) => await upload(path);
        for(const file of files) {
            const {path} = file;
            // console.log("path", file);

            const newPath = await multiple(path);
            urls.push(newPath);
            fs.unlinkSync(path);
        }
        if(urls) {
            const PostId = req.params.PostId;
            let body = req.body;
            let updates = _.extend(body, {postedBy: req.user}, {photo: urls });
            const options = {new: true};

            Post.findByIdAndUpdate(PostId, updates, options)
                .then((result) => {
                    res.status(200).json({status: 200, message: "Success", data: {result}});
                })
                .catch((err) => {
                    res.status(500).json({status: false, error: err});
                });
        }
        if(!urls) {
            return res.status(400).json({status: 400, message: "Urls Empty"});
        }
    } catch (error) {
        // console.log("err: " + error);
        return next(error);
    }


}