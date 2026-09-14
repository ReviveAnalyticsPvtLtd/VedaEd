const mongoose = require('mongoose');
const {Schema} = mongoose;

const sectionSchema = new Schema({
    name:{
        type: String,
        required:true
    },
    capacity:{
        type: Number,
        default: 40
    }
}, {timestamps:true});

const Section = mongoose.model('Section', sectionSchema);
module.exports = Section;
