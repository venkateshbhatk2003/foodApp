const express = require('express');
const passport = require('passport');
const router = express.Router();

// Authentication routes for Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home or to a specific route
    res.redirect('/');
  });

// Authentication routes for Facebook
router.get('/facebook',
  passport.authenticate('facebook'));

router.get('/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home or to a specific route
    res.redirect('/');
  });

module.exports = router;
