const express = require('express');
const router = express.Router();
const multer = require("multer");
const embedResume = require("../middleware/embedResume");
const Job = require('../models/jobs');

// Multer setup (store uploaded file in memory)
const upload = multer({ storage: multer.memoryStorage() });

// -------------------------------
// Stopword list and cleaner
// -------------------------------
const STOPWORDS = new Set([
  'the', 'and', 'for', 'you', 'are', 'with', 'that', 'this', 'have', 'from',
  'your', 'our', 'was', 'were', 'will', 'can', 'job', 'role', 'position',
  'looking', 'candidate', 'should', 'able', 'skills', 'knowledge', 'experience'
]);

function cleanText(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));
}

// -------------------------------
// Text similarity (Sørensen–Dice coefficient)
// -------------------------------
function textSimilarity(a, b) {
  const wordsA = new Set(cleanText(a));
  const wordsB = new Set(cleanText(b));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  const intersection = [...wordsA].filter(x => wordsB.has(x)).length;
  return (2 * intersection) / (wordsA.size + wordsB.size);
}

// -------------------------------
// GET /find → Show upload form
// -------------------------------
router.get('/find', (req, res) => {
  res.render('index');
});

// -------------------------------
// POST /resume → Upload + match jobs
// -------------------------------
router.post(
  "/resume",
  upload.single("resumeFile"),
  embedResume,
  async (req, res) => {
    try {
      const resumeText = req.resumeText || "";
      const jobs = await Job.find();

      if (!jobs.length) {
        return res.render('results', { jobs: [], message: "No jobs found in database." });
      }

      // Compute similarity
      const results = jobs.map(job => {
        const similarity = textSimilarity(resumeText, job.description || "");
        return { ...job.toObject(), similarity };
      });

      // Filter & sort
      const filtered = results
        .filter(j => j.similarity >= 0.01) // lower threshold for better recall
        .sort((a, b) => b.similarity - a.similarity);

      console.log(`🧠 Resume matched ${filtered.length} jobs`);

      // Render EJS page
      res.render('results', {
        jobs: filtered,
        message:
          filtered.length > 0
            ? `Found ${filtered.length} matching jobs`
            : "No strong matches found. Try a different resume or add more job details."
      });
    } catch (err) {
      console.error("❌ Error processing resume:", err);
      res.status(500).send("Error matching jobs");
    }
  }
);

module.exports = router;
