const pdfParse = require('pdf-parse');

const embedResume = async (req, res, next) => {
  if (!req.file) return res.status(400).send("No resume uploaded");

  try {
    const data = await pdfParse(req.file.buffer);
    req.resumeText = data.text;
    req.resumeEmbedding = Array.from({ length: 768 }, () => Math.random());
    next();
  } catch (err) {
    console.error("❌ PDF parse error:", err);
    res.status(500).send("Error processing PDF");
  }
};

module.exports = embedResume;
