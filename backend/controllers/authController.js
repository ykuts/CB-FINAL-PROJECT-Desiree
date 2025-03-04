const bcrypt = require('bcrypt');
const passport = require('passport');
const { validationResult } = require('express-validator');
const User = require('../models/user');

exports.getSignup = (req, res) => {
  res.status(200).json({ message: 'Welcome to Signup page'});
};

exports.postSignup = async (req, res) => {
  const {first_name, last_name, email, password, confirmPassword} = req.body;

  const user = User({
    first_name,
    last_name,
    email,
    password,
    confirmPassword // added this
  });

  try {
    // validations
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(error => error.msg);
      return res.status(400).json({ message: errorMessages });
    }

    if(!first_name || !last_name || !email || !password) {
      return res.status(400).json({ message: 'All fields required'});
    }
    if(password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match'});
    }
    
    // check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already in use' });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;

    await user.save();
    res.setHeader('Content-Type', 'application/json'); // for json formatting
    res.status(200).json({ message: 'User successfully registered' });
  } catch (error) {
    res.setHeader('Content-Type', 'application/json'); // for json formatting
    res.status(500).json({ message: 'SERVER ERROR' });
  }

};

exports.getLogin = async (req, res) => {
  res.status(200).json({ message: 'Welcome to Login page'});

};

exports.postLogin = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err || !user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: 'Login failed' });

      // Сохраняем в сессию
      req.session.user = {
        id: user._id,
        email: user.email
      };

      // Сохраняем сессию
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Session save error' });
        }

        console.log('Login successful:', {
          sessionID: req.sessionID,
          session: req.session,
          isAuth: req.isAuthenticated()
        });

        return res.status(200).json({
          success: true,
          user: {
            id: user._id,
            email: user.email
          }
        });
      });
    });
  })(req, res, next);
};

exports.logout = (req, res) => {
 req.logout((err) => {
  if (err) {
    return res.status(500).json({ message: 'SERVER ERROR DURING LOGOUT' });
  }
  res.setHeader('Content-Type', 'application/json'); // for json formatting
  res.status(200).json({ message: 'User successfully logged out' });
  });
};

exports.getUser = async (req, res) => {
  console.log('GET /user - Session:', req.session);
  console.log('GET /user - Is Authenticated:', req.isAuthenticated());
  console.log('GET /user - User:', req.user);
  
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ firstName: user.first_name });
  } catch (error) {
    return res.status(500).json({ message: 'SERVER ERROR' });
  }
};
