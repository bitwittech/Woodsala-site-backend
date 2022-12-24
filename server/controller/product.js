const { raw } = require('body-parser');
const product = require('../../database/models/product');
const review = require('../../database/models/review')


// for getting the list of the product
exports.getProducts = async (req, res) => {

    console.log(req.query)
    let filter = {};
    
    if (req.query.filter !== 'undefined') {
        filter = JSON.parse(req.query.filter)
    }
    console.log(filter)
 
    let query = {}
    if (req.query.product_title === 'undefined' && req.query.category_name === 'undefined' && req.query.filter === 'undefined') {
        query = {};
    }
    else if (req.query.filter !== 'undefined') {
        let filterArray = [{ 'category_name': { '$regex': req.query.category_name, '$options': 'i' } }]
        
        if(filter.price)
            filterArray.push({ '$and': [{ 'selling_price' : {'$gt': filter.price[0]}}, {'selling_price' :{'$lt': filter.price[1]}}]})
        
        if(filter.length)
            filterArray.push({ '$and': [{ 'length_main' : {'$gt': filter.length[0]}}, {'length_main' :{'$lt': filter.length[1]}}]})
        
        if(filter.breadth)
            filterArray.push({ '$and': [{ 'breadth' : {'$gt': filter.breadth[0]}}, {'breadth' :{'$lt': filter.breadth[1]}}]})
        
        if(filter.height)
            filterArray.push({ '$and': [{ 'height' : {'$gt': filter.height[0]}}, {'height' :{'$lt': filter.height[1]}}]})
            
        if(filter.material.length > 0)
            {
                filterArray.push({ '$or': filter.material.map((val)=>{return { 'primary_material' : { '$regex': val, '$options' : 'i' }}})})
            }
        
        query = {'$and': filterArray}
    console.log(JSON.stringify(query))

    }
    else {
        query = {
            '$or': [{ 'category_name': { '$regex': req.query.category_name, '$options': 'i' } },
            { 'product_title': { '$regex': req.query.product_title, '$options': 'i' } }]
        }
    }


    // final aggregation computing
    product.aggregate([
        { '$match': query },
        {
            '$group': {
                '_id': '$_id',
                'product_title': { '$first': '$product_title' },
                'product_image': { '$first': '$product_image' },
                'featured_image': { '$first': '$featured_image' },
                'product_description': { '$first': '$product_description' },
                'MRP': { '$first': '$selling_price' },
                'selling_price': { '$first': '$selling_price' },
                'discount_limit': { '$first': '$discount_limit' },
                'SKU': { '$first': '$SKU' },
                'category_name': { '$first': '$category_name' },
            }
        },
        { '$sort': { 'selling_price': 1 } },
        { '$skip': req.query.pageNumber > 0 ? (req.query.pageNumber - 1) * 10 : 0 },
        { '$limit': 10 }
    ]).then((data) => {
        // data.map((row)=>console.log(row.SKU))
        console.log(data.length)
        return res.status(200).send(data);
    })
        .catch((err) => {
            console.log(err)
            return res.status(500).send({ message: 'Something went wrong !!!' })
        })

}

// for getting related product
exports.getRelatedProduct = async (req, res) => {
    //console.log(req.query)
    let filter = undefined;

    //    console.log(filter)

    // for proceeding the filter if there is wrong json formate
    if (req.query.filter !== '{}' && req.query.filter) {
        try {
            filter = JSON.parse(req.query.filter)
        }
        catch { filter = undefined }
    }

    //console.log(filter)

    //    return res.send('all okay')

    product.aggregate(
        [{ '$match': filter ? { '$or': [{ 'category_name': { '$regex': filter.category_name } }, { 'product_title': { '$regex': filter.product_title } }] } : {} },
        {
            '$group': {
                '_id': '$_id',
                'product_title': { '$first': '$product_title' },
                'product_image': { '$first': '$product_image' },
                'featured_image': { '$first': '$featured_image' },
                'product_description': { '$first': '$product_description' },
                'MRP': { '$first': '$selling_price' },
                'selling_price': { '$first': '$selling_price' },
                'discount_limit': { '$first': '$discount_limit' },
                'SKU': { '$first': '$SKU' },
                'category_name': { '$first': '$category_name' },
            }
        },
        { '$limit': 10 }]
    )
        .then((response) => {
            // console.log(response)
            return res.send(response)
        })
        .catch((err) => {
            console.log(err)
            return res.status(500).send(err)
        })
}

exports.getSearchList = async (req, res) => {

    if (req.query.filter === undefined) return res.send({ message: 'No params are there !!!' })

    product.aggregate(
        [{
            '$match': {
                '$or': [{ 'category_name': { '$regex': req.query.filter, '$options': 'i' } },
                { 'product_title': { '$regex': req.query.filter, '$options': 'i' } }]
            }
        },
        {
            '$group': {
                '_id': '$_id',
                'product_title': { '$first': '$product_title' },
            }
        },
        { '$limit': 10 }]
    )
        .then((response) => {
            // console.log(response)
            return res.send(response)
        })
        .catch((err) => {
            console.log(err)
            return res.status(500).send({ message: 'Something went wrong !!!' })
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


// for adding a review
exports.addReview = async (req, res) => {
    try {
        const data = review(req.body);
        if (req.body.review === undefined) return res.sendStatus(203).send("Review Box doesn't be empty.")
        const response = await data.save()
        if (response) return res.send({ message: 'Review Added Successfully !!!' });
    } catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
}


// for listing  reviews
exports.listReview = async (req, res) => {
    try {
        if (!req.query.product_id) return res.sendStatus(404).send({ message: 'Please provide a valid Product ID.' })
        review.aggregate([
            { $match: { product_id: req.query.product_id } },
            {
                $lookup:
                {
                    from: "customers",
                    localField: "CID",
                    foreignField: "CID",
                    as: "customer"
                }
            }
        ])
            .then((data) => {
                console.log(data)
                res.send(data);
            })
    } catch (error) {
        console.log(error)
        res.sendStatus(500);
    }
}

