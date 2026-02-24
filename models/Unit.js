const mongoose = require("mongoose");


const unitSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g. Nos, Each, Dozen
    status: { type: Boolean, default: false }, 
        old_id :{ type: String,default:""}, 

    
}, { timestamps: true });

module.exports = mongoose.model('Unit', unitSchema, 'units');
