const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../keys');
const { api_key } = require('../keys');
const { DOMAIN } =  require('../keys');
const mailgun = require("mailgun-js");
const mg = mailgun({apiKey: api_key, domain: DOMAIN});


// const nodemailer = require('nodemailer');
// const nodemailMailgun = require('nodemailer-mailgun-transport');


// const auth = {
//     auth: {
//         api_key: api_key,
//         domain: DOMAIN
//     }
// };

// const transporter = nodemailer.createTransport(nodemailMailgun({auth}));

router.post('/signup', (req, res) => {
    const { name, username, email, password, avatarUrl } = req.body;

    if (!name || !username || !email || !password) {
        return res.status(422).json({errors: 'Please enter all field!'});
    }

    User.findOne({email: email})
        .then((saveUser) => {
            if(saveUser) {
                return res.status(422).json({ status: false, errors: "User already exists with that email or username!"})
            }
            bcrypt.hash(password, 12)
                .then(hashedpassword => {
                    const user = new User({
                        email,
                        password: hashedpassword,
                        name,
                        username,
                        avatarUrl
                    })        
                    user.save()
                    .then(user => {
                            mg.messages().send({
                                from: 'no-reply@insta.com',
                                to: user.email,
                                subject: 'SignUp Success',
                                html:`<h1>Welcome to Instagram</h1>`
                            }, function (error, body) {
                                if(error) {
                                    console.log(error);
                                }
                                console.log(body);
                            });
                            res.status(200).json({status: 200, message: "Saved successfully, Please check your email"})

                    })
                    .catch((err) => {                        
                        return res.status(422).json({ error: err, message: "Send Email Failed!"});
                    })
                }) 
        })
        .catch(err => {
            console.log(err);
        })
});

router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if(!email || !password && email !== null && password !== null) {
        res.status(422).json({error: "Please add email or password"});
    }
    User.findOne({email: email})
        .then(savedUser => {
            if(!savedUser) {
                res.status(422).json({error: "Invalid Email or Password"});
            }
            bcrypt.compare(password, savedUser.password)
                .then(doMatch => {
                    if(doMatch) {
                        const token = jwt.sign({_id: savedUser._id}, JWT_SECRET);
                        const {_id, name, username, email, followers, following, avatarUrl, bio, isVerified} = savedUser;
                        res.json({token, status: 200, message: "Login Successfully!", user: {_id, name, username, email, followers, following, avatarUrl, bio, isVerified}});
                    } else {
                        return res.status(422).json({error: "Invalid Email or Password"});
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        });
});

//Forgot Password (Gửi email veryfy -> check rồi nhập mật khẩu mới)
router.post('/reset-password', (req, res) => {
    crypto.randomBytes(32, (err, buffer) => {
        if(err) {
            console.log(err);
        }

        const token = buffer.toString("hex")
        User.findOne({email: req.body.email})
            .then(user => {
                if(!user) {
                    return res.status(422).json({error: "User dont exists with that email"})
                }
                user.resetToken = token
                user.expireToken = Date.now() + 3600000
                user.save()
                    .then(result => {
                        //Success
                        mg.messages().send({
                            to:result.email,
                            from: "no-reply@insta.com",
                            subject: "Reset password",
                            html: `
                            <p>You requested for password reset</p>
                            <h5>Click in this <a href="http://localhost:3000/reset/${token}">Link</a>to reset password</h5>
                            `
                        })
                        .then((body) => {
                            return res.json({status: 200, message: "Check your email", body: body})
                        })
                        .catch((err) => {
                            console.log(err);
                            return res.status(500).json({error: err});
                        });
                        
                    })
            })
    })
});

//Reset password => Click vao lick email de nhan token sau do no se mo ra mot trang de nhap vao new password
//Create New Password and Save it in db
router.post('/new-password', (req, res) => {
    const newPasword = req.body.password;
    const sentToken = req.body.token;

    User.findOne({resetToken: sentToken, expireToken: {$gt: Date.now()}})
        .then(user => {
            if(!user) {
                return res.status(422).json({error: "Try again session expired"}); //hết hạn token
            }
            bcrypt.hash(newPasword, 12)
                .then(hashedpassword => {
                    user.password = hashedpassword
                    user.resetToken = undefined
                    user.expireToken = undefined
                    user.save()
                        .then((savedUser) => {
                            return res.status(200).json({status: 200, message: "Password updated success"});
                        })
                })
        }).catch(err => {
            return res.status(500).json({status: false, error: err});
        })
})

module.exports = router;