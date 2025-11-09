const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    title : String,
    description: String,
    role : String,
    location: String,
});

module.exports = mongoose.model('jobs',userSchema);   