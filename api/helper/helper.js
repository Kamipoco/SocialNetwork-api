const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cloudnary = require('cloudinary');
const _ = require('underscore');
const {cloud_name} = require('../keys');
const {API_Key} = require('../keys');
const {api_secret} = require('../keys');

const Q = require("q");

function upload(file) {
    cloudnary.config({
        cloud_name: cloud_name,
        api_key: API_Key,
        api_secret: api_secret
    });

    return new Q.Promise((resolve, reject) => {
        cloudnary.v2.uploader.upload(file, {width: 350, height: 350}, (err, res) => {
            if(err) {
                console.log('cloudnary err:' + err);
                reject(err);
            } else {
                console.log('cloudnary res: ' + res);
                return resolve(res.url);
            }
        });
    });
}

module.exports.upload = upload;