
const banner = require("../../database/models/banner")
const introBanner = require("../../database/models/introBanner")
const order = require("../../database/models/order")

exports.getBanner = async(req,res)=>{
    try {
        let response = await banner.find({web_banner_status : true},{web_banner : 1});
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
exports.listMobileIntro = async (req, res) => {
    try {
  
      let data = await introBanner.find({status : true},{
        title : 0,
        status : 0,
        __v : 0
      }).limit(10);
  
      if(data)
        return res.send({
          status :200,
          message : "Intro banner for mobile fetched successfully.",
          data
        })
      else
        return res.status(203).send({
          status :203,
          message : "No banners found for mobile .",
          data
        })
  
    } catch (err) {
      // console.log("error>>>", err);
      return res.status(500).send({ message: "Something went wrang !!!" });
    }
  };
exports.calculate = async (req, res) => {
    try {

      let {O} = req.query


      if(!O) return res.status(203).send({
        status : 203,
        message : "Missing Order ID."
      })


      let orderDetails = await order.findOne({O},{product_price : 1,discount_per_product : 1,quantity : 1})

      console.log(orderDetails)
  
      if(data)
        return res.send({
          status :200,
          message : "Intro banner for mobile fetched successfully.",
          data
        })
      else
        return res.status(203).send({
          status :203,
          message : "No banners found for mobile .",
          data
        })
  
    } catch (err) {
      // console.log("error>>>", err);
      return res.status(500).send({ message: "Something went wrang !!!" });
    }
  };