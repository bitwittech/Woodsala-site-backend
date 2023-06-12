
const banner = require("../../database/models/banner")

exports.getBanner = async(req,res)=>{
    try {
        let response = await banner.find({web_banner_status : true},{web_banner : 1,sequence_no : 1});
        let bannerArr = response.sort((a,b)=>(a.sequence_no - b.sequence_no));

        if(response)
        return res.send({ status : 200,message : "Banner List fetched successfully", data : [...bannerArr]})
        else
        return res.send({ status : 203,message : "No banners found.", data : []})
    } catch (error) {
        console.log('Error>>',error)
        return res.status(500).send({message : 'Something went wrong !!!'})
    }
}