const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const TokenVerify = mongoose.model('TokenVerify');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../keys');
// const { api_key } = require('../keys'); //api_key mailgun
// const { DOMAIN } =  require('../keys'); //domain mailgun
const {sendgrid_apikey} = require('../keys'); //api_key sendgrid
// const sendGridTransport = require('nodemailer-sendgrid-transport');
// const mailgun = require("mailgun-js");
// const mg = mailgun({domain: DOMAIN, apiKey: api_key});
// const nodemailer = require('nodemailer');


//test @sendgrid
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(sendgrid_apikey);

//SignUp
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
                        //generate token
                        var token = new TokenVerify({ _userId: user._id, tokenVerify: crypto.randomBytes(16).toString('hex') });
                        token.save()
                            .then(res => console.log(res))
                            .catch(err => console.log(err));
            
                            //send mail
                            sgMail
                            .send({
                                to: user.email,
                                from: {
                                    name: 'no-reply@insta.com',
                                    email: '1751120025@sv.ut.edu.vn'
                                },
                                subject: 'SignUp Success',
                                text: 'From sendgrid',
                                html: 'Hello,\n\n <br> Please verify your account by clicking the link: \n <br> <strong><a href = http://localhost:4200/profile/verify/' + token.tokenVerify + '>http:\/\/ Click here to verify the given Link </a></strong>.\n .<br>Thanks<br>'
                            })
                            .then((res) => console.log('Email sent, Please check your email'))
                            .catch((err) => console.log(err));
                                
                            console.log(user.email);
                            return res.status(200).json({status: 200, message: "Saved successfully, Please check your email"});
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

//Verify Account
router.get('/verifyAccount/:tokenVerify', (req, res) => {
    TokenVerify.findOne({ tokenVerify: req.params.tokenVerify }, function (err, tokenVerify) {
        // m?? th??ng b??o kh??ng ???????c t??m th???y trong c?? s??? d??? li???u t???c l?? m?? th??ng b??o c?? th??? ???? h???t h???n
        if (!tokenVerify){
            return res.status(400).send({msg:'Your verification link may have expired. Please click on resend for verify your Email.'});
        }
        // n???u m?? th??ng b??o ???????c t??m th???y th?? h??y ki???m tra ng?????i d??ng h???p l???
        else{
            User.findOne({ _id: tokenVerify._userId}, function (err, user) {
                // ng?????i d??ng kh??ng h???p l???
                if (!user){
                    return res.status(401).send({msg:'We were unable to find a user for this verification. Please SignUp!'});
                } 
                // ng?????i d??ng ???? ???????c x??c minh
                else if (user.isVerified){
                    return res.status(200).send('User has been already verified. Please Login');
                }
                // x??c minh ng?????i d??ng
                else{
                    // thay ?????i isVerified = true
                    user.isVerified = true;
                    user.save(function (err) {
                        // x???y ra l???i
                        if(err){
                            return res.status(500).send({msg: err.message});
                        }
                        // t??i kho???n ???????c x??c minh th??nh c??ng
                        else{
                          return res.status(200).json({status: 200, message: 'Your account has been successfully verified'});
                        }
                    });
                }
            });
        }
        
    });
});

//ResendLink Verify Account
router.post('/resendLink', (req, res) => {

    User.findOne({email: req.body.email}, function (err, user) {
        //User ko t??m th???y trong db
        if(!user) {
            return res.status(404).json({status: false, message: 'Not found!'});
        }

        //Ng?????c l???i n???u user ???? ???????c x??c th???c
        else if(user.isVerified) {
            return res.status(200).json({status: 200, message: 'User isVerified'});
        }

        //g???i link ???????c x??c th???c
        else {
            // generate token and save
            var token =  TokenVerify({_userId: user._id, tokenVerify: crypto.randomBytes(16).toString('hex')});
            token.save(function (err) {
                if(err) {
                    return res.status(500).json({status: false, error: err});
                }

                // Send email
                sgMail
                .send({
                    to: user.email,
                    from: {
                        name: 'no-reply@insta.com',
                        email: '1751120025@sv.ut.edu.vn'
                    },
                    subject: 'SignUp Success',
                    text: 'From sendgrid',
                    html: 'Hello,\n\n <br> Please verify your account by clicking the link: \n <br> <strong><a href = http://localhost:4200/profile/verify/' + token.tokenVerify + '>http:\/\/ Click here to verify the given Link </a></strong>.\n .<br>Thanks<br>'
                })
                .then((res) => console.log('Email sent, Please check your email'))
                .catch((err) => console.log(err));
                    
                return res.status(200).json({status: 200, message: "Please check your email"});

            })
        }
    });
});

//LOGIN
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

//Forgot Password (G???i email verify -> check r???i nh???p m???t kh???u m???i)
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
                      
                        sgMail
                        .send({
                            to: result.email,
                            from: {
                                name: 'no-reply@insta.com',
                                email: '1751120025@sv.ut.edu.vn'
                            },
                            subject: 'Reset password',
                            text: 'From sendgrid',
                            html: `
                                <h3>You requested for password reset</h3>
                                <h3>Click in this <a href="http://localhost:4200/auth/new-password/${token}">Link</a>to reset password</h3>
                                `
                        })

                        return res.json({status: 200, message: "Check your email"});

                        // .then((body) => {
                        //     return res.json({status: 200, message: "Check your email", body: body});
                        // })
                        // .catch((err) => {
                        //     console.log(err);
                        //     return res.status(500).json({error: err});
                        // });
                        
                    })
            })
    })
});

//Create New Password
router.post('/new-password', (req, res) => {
    const {token, password} = req.body;

    if(!token) {
        return res.status(401).send('Unauthorized');
    }

    User.findOne({resetToken: token, expireToken: {$gt: Date.now()}})
        .then(user => {
            if(!user) {
                console.log(Date.now());
                return res.status(422).json({error: "Try again session expired"}); //h???t h???n token
            }
            bcrypt.hash(password, 12)
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
});

module.exports = router;