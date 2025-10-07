const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');


exports.signup = (req, res, next) => {
    let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!req?.body?.email || !req?.body?.password) {
        res.status(400).json({ message: 'Invalid form.'}); // CURL (no email or password)
        return ;    
    }
    if (!req.body.email.match(regex)) {
        res.status(400).json({ message: 'Invalid email address.'}); // CURL (wrong email)
        return ;
    }

    bcrypt.hash(req.body.password, 10)
        .then((hash) => {
            const user = new User({email: req.body.email, password: hash});
            user.save()
                .then(() => {
                    res.status(201).json({ message: 'string'}); // CURL (OK)
                }).catch((error) => { res.status(400).json({error}) }); // CURL (email exist)
        }).catch((error) => { res.status(500).json({error}) });
}

exports.login = (req, res, next) => {
    if (!req?.body?.email || !req?.body?.password) {
        res.status(400).json({ message: 'Invalid form.'}); // CURL (no email or password)
        return ;
    }

    User.findOne({email: req.body.email})
        .then((user) => {
            if (user === null) {
                res.status(401).json({message: 'Email or password is incorrect.'}); // CURL (wrong email)
                return ;
            } else {
                bcrypt.compare(req.body.password, user.password)
                    .then((valid) => {
                        if (!valid) {
                            res.status(401).json({message: 'Email or password is incorrect.'}); // CURL (wrong pass)
                            return ;
                        }
                        res.status(200).json({
                                userId: user._id,
                                token: jwt.sign(
                                    { userId: user._id },
                                    process.env.JWT_SECRET,
                                    { expiresIn: '24h'}
                                )
                        });   // CURL (OK)
                    }).catch((error) => { res.status(500).json({error}) })
            }
        }).catch((error) => { res.status(500).json({error}) });
}
