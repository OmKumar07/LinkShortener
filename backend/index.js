const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const shortid = require("shortid");
const dotenv = require("dotenv");
const passport = require("passport");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bodyParser = require("body-parser");
require("./config/passport"); // Import Passport config

dotenv.config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(bodyParser.json());


// Setup session
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Use the secret from .env
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes for Google OAuth
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3000"); // Redirect to your frontend after login
  }
);
app.get("/", (req, res) => {
  res.send("LoginAgain");
});
// Logout route
app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// Express server setup
app.get("/auth/status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Endpoint to get user profile data
app.get("/auth/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      name: req.user.displayName,
      profilePicture: req.user.profilePicture, // Ensure this field is set correctly
    });
  } else {
    res.status(401).json({ error: "User not authenticated" });
  }
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Connection error", err));

const LinkSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  clickCount: {
    type: Number,
    default: 0
  },
  password: String,
  isDisabled: {
    type: Boolean,
    default: false
  },
});
const Link = mongoose.model("Link", LinkSchema);

app.post('/links/toggle', async (req, res) => {
  const { linkId, isDisabled } = req.body;

  try {
    // Find the link by its ID and update the isDisabled field
    const updatedLink = await Link.findByIdAndUpdate(
      linkId,
      { isDisabled },
      { new: true } // Return the updated document
    );

    if (updatedLink) {
      res.json({ success: true, link: updatedLink });
    } else {
      res.status(404).json({ error: 'Link not found' });
    }
  } catch (error) {
    console.error('Error updating link status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/links/set-password', async (req, res) => {
  const { linkId, password } = req.body;
  try {
    await Link.findByIdAndUpdate(linkId, { password });
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: 'Error setting password' });
  }
});
app.get('/links/:id/password', async (req, res) => {
  const { id } = req.params;
  try {
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }
    if (!link.password) {
      return res.status(404).json({ error: 'No password set for this link' });
    }
    res.json({ password: link.password });
  } catch (error) {
    res.status(500).json({ error: 'Error retrieving password' });
  }
});

// Shorten URL endpoint
app.post("/shorten", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  const { originalUrl, customUrl } = req.body;
  try {
    let shortUrlKey;
    if (customUrl) {
      const existingLink = await Link.findOne({ shortUrl: customUrl });
      if (existingLink) {
        return res.status(400).json({ error: "Custom URL is already taken" });
      }
      shortUrlKey = customUrl;
    } else {
      shortUrlKey = shortid.generate();
    }
    const newLink = new Link({
      originalUrl,
      shortUrl: shortUrlKey, // Store only the key
      user: req.user.id, // Associate link with the authenticated user
    });
    await newLink.save();
    // Send back the full short URL to the client
    const fullShortUrl = `http://localhost:5000/${shortUrlKey}`;
    res.json({ shortUrl: fullShortUrl });
  } catch (error) {
    res.status(500).json({ error: "Error creating shortened URL" });
  }
});

app.get("/links", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "User not authenticated" });
  }

  try {
    const links = await Link.find({ user: req.user.id });
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: "Error fetching links" });
  }
});
app.use('/links/:shortUrl', async (req, res, next) => {
  const { shortUrl } = req.params;
  const link = await Link.findOne({ shortUrl });
  if (link && link.password) {
    // Here you would normally check for password from request
    return res.status(403).json({ error: 'Password required' });
  }
  next();
});
// Redirect to original URL endpoint
app.get("/:shortUrl", async (req, res) => {
  const { shortUrl } = req.params;
  const { password } = req.query; // Assume password is passed as a query parameter

  try {
    const link = await Link.findOne({ shortUrl });

    if (link) {
      if (link.isDisabled) {
        return res.status(403).send("Link closed by the admin");
      }

      if (link.password) {
        if (link.password !== password) {
          return res.send(`<html>
              <head><title>Enter Password</title></head>
              <body>
                <h2>Admin Has Password Protected This Link</h2>
                <form action="/${shortUrl}" method="get">
                  <input type="hidden" name="shortUrl" value="${shortUrl}">
                  <label for="password">Enter Password:</label>
                  <input type="password" id="password" name="password" required>
                  <button type="submit">Submit</button>
                </form>
              </body>
            </html>`);
        }
      }

      res.redirect(link.originalUrl);
      link.clickCount += 1;
      await link.save();
    } else {
      res.status(404).send("Link not found");
    }
  } catch (error) {
    res.status(500).send("Server error");
  }
});
app.delete('/links/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Check if the user is authenticated
    if (!req.isAuthenticated() || link.user.toString() !== req.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Link.findByIdAndDelete(id);
    res.json({ message: 'Link deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting link' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
