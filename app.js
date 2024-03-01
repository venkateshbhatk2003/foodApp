const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const app = express();

// MongoDB Connection
mongoose.connect('mongodb://0.0.0.0:27017/foodAppDB')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


// User Schema
const userSchema = new mongoose.Schema({
  googleId: String,
  role: { type: String, enum: ['admin', 'superuser', 'user'], default: 'user' }
});
const User = mongoose.model('User', userSchema);

// Passport Configuration
passport.use(new GoogleStrategy({
  clientID: '375832448871-1od6u1mhaslquq9ko72pa7q2oe2o83et.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: "/auth/google/callback"
},
function(accessToken, refreshToken, profile, cb) {
  // Check if a user with the Google ID already exists in the database
  User.findOne({ googleId: profile.id }, (err, existingUser) => {
    if (err) {
      return cb(err);
    }
    if (existingUser) {
      // User already exists, so return the user
      return cb(null, existingUser);
    } else {
      // User doesn't exist, so create a new user
      const newUser = new User({
        googleId: profile.id
        // You can optionally save other information from the profile, such as name or email
      });
      newUser.save((err, savedUser) => {
        if (err) {
          return cb(err);
        }
        // Return the newly created user
        return cb(null, savedUser);
      });
    }
  });
}

));




// Authentication routes for Google
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect home or to a specific route
    res.redirect('/');
  });

// Other middleware and routes...

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
