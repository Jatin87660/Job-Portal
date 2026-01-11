
const express = require('express');
const router = express.Router();
const multer = require("multer");
const natural = require('natural');
const embedResume = require("../middleware/embedResume");
const Job = require('../models/jobs');


const upload = multer({ storage: multer.memoryStorage() });

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
// Cosine similarity using TF-IDF
// -------------------------------
function cosineSimilarityTFIDF(textA, textB) {
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Clean and add both documents
  tfidf.addDocument(cleanText(textA).join(" "));
  tfidf.addDocument(cleanText(textB).join(" "));

  const vecA = [];
  const vecB = [];

  // Collect all unique terms
  const allTerms = new Set();
  tfidf.listTerms(0).forEach(t => allTerms.add(t.term));
  tfidf.listTerms(1).forEach(t => allTerms.add(t.term));

  // Build numerical vectors
  allTerms.forEach(term => {
    vecA.push(tfidf.tfidf(term, 0));
    vecB.push(tfidf.tfidf(term, 1));
  });

  // Compute cosine similarity
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

  if (magA === 0 || magB === 0) return 0;

  return dot / (magA * magB);
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

      // Compute cosine similarity between resume and job descriptions
      const results = jobs.map(job => {
        const similarity = cosineSimilarityTFIDF(resumeText, job.description || "");
        return { ...job.toObject(), similarity };
      });

      // Filter and sort by similarity score
      const filtered = results
        .filter(j => j.similarity >= 0.01)
        .sort((a, b) => b.similarity - a.similarity);

      console.log(`🧠 Resume matched ${filtered.length} jobs`);

      // Render results page
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

