const mongoose = require("mongoose");
const {Schema} =  mongoose;

const parentSchema = new Schema({
    fatherName: {
        type: String,
        default: ""
    },
    motherName: {
        type: String,
        default: ""
    },
    contactDetails: {
        phone: {
            type: String,
            default: ""
        },
        email: {
            type: String,
            default: ""
        }
    },
    name:{
        type:String,
        required: true
    },
    parentId:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required: true
    },
    phone:{
        type:String,
        required: true
    },
    role: {
        type: String,
        enum: ["Primary Guardian", "Secondary Guardian", "Father", "Mother", "Guardian"],
        default: "Primary Guardian"
    },
    occupation:{
        type:String,
        default: "Parent"
    },
    relation:{
        type:String,
        default: "Parent"
    },
    address:{
        type:String
    },
    /** Admin/parent-uploaded profile image path, e.g. /uploads/file.jpg (takes priority over documents). */
    profilePhoto: {
        type: String,
        default: "",
    },
    status:{
        type:String,
        enum:["Active", "Inactive"],
        default: "Active"
    },
    children:[{
        type: mongoose.Schema.Types.ObjectId,
        ref:'Student'
    }],
    password:{
        type:String,
        required: true
    },
    documents: [{
        name: String,
        path: String,
        size: Number,
        /** Set when uploaded from parent profile so lists can exclude other sources if needed */
        parentProfileUpload: { type: Boolean, default: false },
        uploadedAt: { type: Date, default: Date.now }
    }]
}, {timestamps: true});

const Parent = mongoose.model('Parent', parentSchema);
module.exports = Parent;