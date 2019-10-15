const express = require('express');
const router = express.Router();
const User = require('../models/user');
const passport = require('passport');

router.post('/register', (req, res) => {
    console.log('user from req.body >>>', req.body);
    const newUser = new User(req.body);
    // sauvegarde avec mongoose le user avec son username et son mdp
    newUser.save((err, user) => {
        if(err) {
            return res.status(500).json(err);
        }
        // on logue directement l'utilisateur avec la méthode login qui existe sur la request uniquement parcequ'on utilise passport avec la Local strategy
        req.login(req.body, (err) => {
            if(err) {
                console.log('error in register | req.logIn()', err);
            }
            res.status(201).json(user);
        })
    })
}); // POST http://localhost:3000/auth/register

router.post('/login', passport.authenticate('local', {
    successRedirect: '/auth/success',
    failureRedirect: '/auth/failure'
})); // POST http://localhost:3000/auth/login

router.get('/success', (req, res) => {
    res.status(200).json({ msg: 'logged in !', user: req.user })
}); // GET http://localhost:3000/auth/success

router.get('/failure', (req, res) => {
    res.status(401).json({ msg: 'NOT logged in' });
}); // GET http://localhost:3000/auth/failure

router.get('/logout', (req, res) => {
    req.logOut();
    res.status(200).json({ msg: 'logged out successfully' });
});

module.exports = router;