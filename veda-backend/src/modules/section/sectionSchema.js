const mongoose = require('mongoose');
const {Schema} = mongoose;

const sectionSchema = new Schema({
    // Tenant ownership. The authoritative value is assigned server-side from the
    // authenticated user; it is never accepted from the client.
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "School",
        required: true,
        index: true
    },
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
