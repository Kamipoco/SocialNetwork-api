const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../keys');
const requireLogin = require('../middleware/requireLogin');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

// const transporter = nodemailer.createTransport(sendgridTransport({
//     auth: {
//         api_key: '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'
//     }
// }));

router.post('/signup', (req, res) => {
    // console.log(req.body);
    const { name, email, password, pic } = req.body;
    // if(!name) {
    //     return res.status(422).json({errors: 'Please enter Name!' });
    // } else if(!email) {
    //     return res.status(422).json({errors: 'Please enter Email!' });
    // } else if(!password) {
    //     return res.status(422).json({errors: 'Please enter Password!' });
    // }
    if (!name || !email || !password) {
        return res.status(422).json({errors: 'Please enter all field!'});
    }
    User.findOne({emai: email})
        .then( (saveUser) => {
            if(saveUser) {
                return res.status(422).json({error: "user already exists with that email"})
            }
            bcrypt.hash(password, 12)
                .then(hashedpassword => {
                    const user = new User({
                        email,
                        password: hashedpassword,
                        name,
                        pic
                    })
        
                    user.save()
                        .then(user => {
                            // transporter.sendMail({ //bug
                            //         to:user.email,
                            //         from:"support-reply@insta.com",
                            //         subject:"SignUp success",
                            //         html:"<h1>Welcome to Instagram</h1>"
                            // })
                            res.json({ status: 200, message: "Saved successfully!"})
                        })
                        .catch(err => {
                            console.log(err);
                        })
                })
                .catch(err =>{
                    console.log(err);
                    })
                })
});

router.post('/signin', (req, res) => {
    const { email, password } = req.body;
    if(!email || !password && email !== null &password !== null) {
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
                        // res.json({message: "successfully signed in"});
                        const token = jwt.sign({_id: savedUser._id}, JWT_SECRET);
                        const {_id, name, email, followers, following, pic} = savedUser;
                        res.json({token, user: {_id, name, email, followers, following, pic}});
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
// router.post('/forgotPassword', (req, res) => {
    
// });

module.exports = router;