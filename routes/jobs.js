const express = require('express');
const router = express.Router();
const Jobs = require('../models/jobs');

router.get('/post-jobs', (req,res)=>{
    res.render('jobs');

})

router.post('/submit-jobs', async (req,res)=>{
    const {title, description, role,location} = req.body;
    const jobs = await Jobs.create({
        title,
        description,
        role,
        location
    });

    res.send('done');


})

module.exports = router;