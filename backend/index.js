const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
require('./config/passport'); // Import Passport config

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(bodyParser.json());

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET,  // Use the secret from .env
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes for Google OAuth
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:3000'); // Redirect to your frontend after login
  }
);
app.get('/',(req,res)=>{
  res.send('LoginAgain')
})
// Logout route
app.get('/logout', (req, res) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

// Express server setup
app.get('/auth/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Endpoint to get user profile data
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      name: req.user.displayName,
      profilePicture: req.user.profilePicture // Ensure this field is set correctly
    });
  } else {
    res.status(401).json({ error: 'User not authenticated' });
  }
});



// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {

})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Connection error', err));

const LinkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true
  },
  shortUrl: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Link = mongoose.model('Link', LinkSchema);

// Shorten URL endpoint
app.post('/shorten', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { originalUrl } = req.body;
  try {
    // Generate a unique key
    const shortUrlKey = shortid.generate();
    // Store only the key in the database
    const newLink = new Link({
      originalUrl,
      shortUrl: shortUrlKey, // Store only the key
      user: req.user.id // Associate link with the authenticated user
    });
    await newLink.save();
    // Send back the full short URL to the client
    const fullShortUrl = `http://localhost:5000/${shortUrlKey}`;
    res.json({ shortUrl: fullShortUrl });
  } catch (error) {
    res.status(500).json({ error: 'Error creating shortened URL' });
  }
});

app.get('/links', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const links = await Link.find({ user: req.user.id });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching links' });
  }
});


// Redirect to original URL endpoint
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  try {
    const link = await Link.findOne({ shortUrl });    
    if (link) {
      res.redirect(link.originalUrl);
    } else {
      res.status(404).send('Link not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
