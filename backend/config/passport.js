const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/user');

// configure local strat
passport.use(new LocalStrategy({ 
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: true
}, async (req, email, password, done) => {
  try {
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Session:', req.session);
    console.log('Attempting authentication for email:', email); // error logging

    const user = await User.findOne({ email });
    console.log('Database query completed');

    if (!user) {
      console.log('No user found with this email:', email);
      return done(null, false, { message: 'Incorrect email' });
    }

    console.log('User found, attempting password comparison');
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return done(null, false, { message: 'Incorrect password' });
    }

    console.log('User authenticated successfully:', user.email);
    return done(null, user);

  } catch (error) {
    console.error('Detailed authentication error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return done(error);
  }
}));

// serialization and deserialization for maintaining user sessions
passport.serializeUser((user, done) => {
  console.log('Serializing user ID:', user._id);
  done(null, user._id.toString());
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log('Deserializing user:', id);
    const user = await User.findById(id);
    if (!user) {
      console.log('No user found in deserialization');
      return done(null, false);
    }
    console.log('User found during deserialization:', user);
    done(null, user);
  } catch (err) {
    console.error('Deserialization error:', err);
    done(err);
  }
});
