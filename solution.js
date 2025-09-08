const mongoose = require('mongoose');

const solutionSchemma = new mongoose.Schema({
    level:{
        type: Number,
        required: true
    },
    solution:{
        type:String,
        required: true
    }
});

module.exports = mongoose.model('sol', solutionSchemma, 'sol');
