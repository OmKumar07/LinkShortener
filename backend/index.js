const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const shortid = require('shortid');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('Connection error', err));

const linkSchema = new mongoose.Schema({
  originalUrl: { type: String, required: true },
  shortUrl: { type: String, required: true, default: shortid.generate },
  createdAt: { type: Date, default: Date.now },
});

const Link = mongoose.model('Link', linkSchema);

// Shorten URL endpoint
app.post('/shorten', async (req, res) => {
  const { originalUrl } = req.body;
  const link = new Link({ originalUrl });
  await link.save();
  res.json({ shortUrl: link.shortUrl });
});

// Redirect to original URL endpoint
app.get('/:shortUrl', async (req, res) => {
  const { shortUrl } = req.params;
  const link = await Link.findOne({ shortUrl });
  if (link) {
    res.redirect(link.originalUrl);
  } else {
    res.status(404).send('Link not found');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
