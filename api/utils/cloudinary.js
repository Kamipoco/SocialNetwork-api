const cloudinary = require('cloudinary').v2;
const {cloud_name} = require('../keys');
const {API_Key} = require('../keys');
const {api_secret} = require('../keys');

cloudinary.config({
    cloud_name: cloud_name,
    api_key: API_Key,
    api_secret: api_secret
});

module.exports = cloudinary;