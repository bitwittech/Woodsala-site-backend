const product = require('../../database/models/product');


// for getting the list of the product
exports.getProducts = async (req,res)=>{

    product.find({},{
        product_title : 1,
        featured_image : 1,
        MRP : 1,
        selling_price : 1,
        discount_limit : 1,
        SKU : 1,
    }).sort({MRP: 1})
    .then((data)=>{
        return res.send(data);
    })
    .catch((err)=>{
        return res.status(500).send({message : 'Something went wrong !!!'})
    })

}


// for product detail to show 
exports.getProductDetails = async (req,res)=>{
    
    if (req.query === {}) return res.status(404).send({message : 'Please Provide the product id.'})
    await product.findOne(req.query)
    .then((data)=>{
          
        return res.send(data)
    })
    .catch((err)=> {return res.send({message : 'Somthing went wrang !!!'})})

}
