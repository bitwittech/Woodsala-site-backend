const mongoose = require('mongoose')

const review = mongoose.Schema({
    CID : {type : String},
    product_id : {type : String},
    rating : {type : String},
    review : {type : String},
    date : {type : Date, default : Date.now()}
})

module.exports = mongoose.model('review',review);