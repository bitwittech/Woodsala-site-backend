const product = require('../../database/models/product');


// for getting the list of the product
exports.getProducts = (req,res)=>{

    product.find({},{
        product_title : 1,
        featured_image : 1,
        MRP : 1})
    .then((data)=>{
        return res.send(data);
    })
    .catch((err)=>{
        return res.status(500).send({message : 'Something went wrong !!!'})
    })

}

