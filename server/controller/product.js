const product = require('../../database/models/product');


// for getting the list of the product
exports.getProducts = async (req, res) => {

            // final aggregation computing
    product.aggregate([
        {'$match' : {'$or': [{'category_name' : {'$regex' : req.query.category_name, '$options' : 'i' }},
        {'product_title' : {'$regex' : req.query.product_title  , '$options' : 'i'}}]}}, 
        {'$group' : {'_id' : '$_id',
                     'product_title': {'$first' : '$product_title'},
                     'product_image': {'$first' : '$product_image'},
                     'featured_image': {'$first' : '$featured_image'},
                     'MRP': {'$first' : '$selling_price'},
                     'selling_price': { '$first' :'$selling_price'},
                     'discount_limit': {'$first' : '$discount_limit'},
                     'SKU': {'$first' : '$SKU'},
                     'category_name': {'$first' : '$category_name'},
        }}, 
        {'$sort' : {'SKU' : 1}},
        {'$skip' : req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * 10 : 0},
        {'$limit' : 10}
    ]).then((data) => {
                // data.map((row)=>console.log(row.SKU))
                // console.log(data)
                return res.status(200).send(data);
            })
            .catch((err) => {
                console.log(err)
                return res.status(500).send({ message: 'Something went wrong !!!' })
            })  

}

// for getting related product
exports.getRelatedProduct = async (req,res) => {
       //console.log(req.query)
       let filter = undefined;

    //    console.log(filter)

       // for proceeding the filter if there is wrong json formate
       if(req.query.filter !== '{}' && req.query.filter )
       {
           try {
            filter = JSON.parse(req.query.filter)
           }
           catch {filter = undefined}
       }

       //console.log(filter)

    //    return res.send('all okay')
   
    product.aggregate(
    [{'$match' : filter ?  {'$or': [{'category_name' : {'$regex' : filter.category_name }},{'product_title' : {'$regex' : filter.product_title}}]} : {}}, 
    {'$group' : {'_id' : '$_id',
                 'product_title': {'$first' : '$product_title'},
                 'product_image': {'$first' : '$product_image'},
                 'featured_image': {'$first' : '$featured_image'},
                 'MRP': {'$first' : '$selling_price'},
                 'selling_price': { '$first' :'$selling_price'},
                 'discount_limit': {'$first' : '$discount_limit'},
                 'SKU': {'$first' : '$SKU'},
                 'category_name': {'$first' : '$category_name'},
    }}, 
    {'$limit' : 10}]
    )
    .then((response)=>{
        // console.log(response)
return res.send(response)
    })
    .catch((err)=>{
        console.log(err)
return res.status(500).send(err)
    })
}

exports.getSearchList = async (req,res) => {

    if(req.query.filter === undefined) return res.send({message : 'No params are there !!!'})

    product.aggregate(
        [{'$match' : {'$or': [{'category_name' : {'$regex' : req.query.filter, '$options' : 'i' }},
        {'product_title' : {'$regex' : req.query.filter, '$options' : 'i'}}]}}, 
        {'$group' : {'_id' : '$_id',
                     'product_title': {'$first' : '$product_title'},
        }}, 
        {'$limit' : 10}]
        )
        .then((response)=>{
            // console.log(response)
            return res.send(response)
        })
        .catch((err)=>{
            console.log(err)
            return res.status(500).send({message : 'Something went wrong !!!'})
        })
    
}

// for product detail to show 
exports.getProductDetails = async (req, res) => {

    if (req.query === {}) return res.status(404).send({ message: 'Please Provide the product id.' })
    await product.findOne(req.query)
        .then((data) => {

            return res.send(data)
        })
        .catch((err) => { return res.send({ message: 'Somthing went wrang !!!' }) })

}
