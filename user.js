const mongoose = require('mongoose');
const uuidv4 = require('uuid').v4;

const date = new Date();

const userSchemma = new mongoose.Schema({
    mid:{
        type: String,
        default: uuidv4()
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }, 
    log:{
        type: [String],
        required: true,
        default: []
    },
    team:{
        type:String,
        required:true
    },
    score:{
        type: Number,
        required: true,
        default: 0
    },
    timeStamp:{
        type:Date,
        required:true,
        default: date
    }
}, {_id: false});

module.exports = mongoose.model('user', userSchemma);