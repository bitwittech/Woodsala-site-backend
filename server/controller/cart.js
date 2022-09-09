const cart = require('../../database/models/cart');
const product = require('../../database/models/product');


// for getting the list of the product`
// exports.getProducts = (req,res)=>{

//     product.find({},{
//         product_title : 1,
//         featured_image : 1,
//         MRP : 1,
//         selling_price : 1,
//         discount_limit : 1
//     }).sort({MRP: 1})
//     .then((data)=>{
//         return res.send(data);
//     })
//     .catch((err)=>{
//         return res.status(500).send({message : 'Something went wrong !!!'})
//     })

// }

exports.addCartItem = (req, res) => {

    // data
    const data = cart(req.body)

    data.save()
        .then((response) => {
            // console.log(response)
            return res.send({ message: 'Item added to the cart !!!' })
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).send({ message: 'Something went wrong !!!' })
        })

}

exports.removeCartItem = (req, res) => {

    // console.log(req.query)
    // data
    cart.deleteOne({$and : [{CID : req.query.CID},{product_id : req.query.product_id}]})
        .then((response) => {
            // console.log(response)
            if (response.deletedCount > 0)
            return res.send({ message: 'Item removed from the cart !!!' })
            else
            return res.status(404).send({ message: 'Something went wrong !!!' })
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).send({ message: 'Something went wrong !!!' })
        })

}

// get cart item
exports.getCartItem = (req, res) => {

    cart.find(req.query,{_id : 0}).then((response) => {
            // console.log(response)
            return res.send(response)
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).send({ message: 'Something went wrong !!!' })
        })

}

// get cart item
exports.getProductDetails = (req, res) => {

    console.log(JSON.parse(req.query.products))

    product.find({SKU : JSON.parse(req.query.products)},{SKU : 1,product_title:1,featured_image:1,MRP:1,selling_price:1}).then((response) => {
            // console.log(response)
            return res.send(response)
        })
        .catch((err) => {
            console.log(err)
            return res.status(404).send({ message: 'Something went wrong !!!' })
        })

}

// update quantity
exports.updateQuantity = (req,res) => {
    

    console.log(req.body)

    cart.findOneAndUpdate({$and : [{CID : req.body.CID, product_id : req.body.product_id }]},{quantity : req.body.quantity })
    .then((data)=>{
        console.log(data)
        return res.send('Updated Successfully !!!')
    })   
    .catch((err)=>{
        console.log(err)
    })
}