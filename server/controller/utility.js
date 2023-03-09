require("dotenv").config();

const banner = require('../../database/models/banner')

exports.getBanner = async(req,res)=>{
    try {
        let response = await banner.find({web_banner_status : true},{web_banner : 1,sequence_no : 1});
        let bannerArr = response.sort((a,b)=>(a.sequence_no - b.sequence_no));

        console.log(bannerArr);
        return res.send({data : [...bannerArr]})
    } catch (error) {
        console.log('Error>>',error)
        return res.status(500).send({message : 'Something went wrong !!!'})
    }
}