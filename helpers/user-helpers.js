var db = require('../config/connection')
var collections = require('../config/collections')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const Razorpay=require('razorpay')
const { resolve } = require('path')
const { rejects } = require('assert')
var instance = new Razorpay({ key_id:'rzp_test_0lu74rFyib3blw', key_secret:'XKgnqx4zCMxB4ZMEbFWBgJ4h'})

module.exports = {
    doSignup: (userdata) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collections.USER_COLLECTION).findOne({email:userdata.email}).then((response)=>{
                if(response){
                    resolve({err:"user already exist"})
                }
            })
            db.get().collection(collections.GOOGLE_COLLECTION).findOne({email:userdata.email}).then((response)=>{
                if(response){
                    resolve({err:"try using google login or signup"})
                }
            })
            userdata.password = await bcrypt.hash(userdata.password, 10)
            db.get().collection(collections.USER_COLLECTION).insertOne(userdata).then((data) => {
                console.log(data)
                db.get().collection(collections.USER_COLLECTION).findOne({ _id: new objectId(data.insertedId) }).then((response) => {
                    resolve(response)
                })


            })
        })


    },
    doLogin: (data) => {
        return new Promise(async (resolve, reject) => {
            let loginstatus = false
            let response = {}
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: data.email })
            if (user) {

                bcrypt.compare(data.password, user.password).then((status) => {
                    if (status) {
                        response.status = true
                        response.user = user
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }


                })

            } else {
                resolve({ status: false })
            }


        })
    },
    googleLogin:(profile)=>{
        return new Promise(async(resolve,reject)=>{
           var user=await db.get().collection(collections.GOOGLE_COLLECTION).findOne({id:profile.id})
           if(!user){
            db.get().collection(collections.GOOGLE_COLLECTION).insertOne(profile).then((response)=>{
                resolve(response)
            })

           }else{
            resolve(user)
           }
            
        })
    },
    cartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItemCount = 0
            let cartproducts = await db.get().collection(collections.CART_COLLECTION).findOne()
            if (cartproducts) {
                cartItemCount = cartproducts.products.length

            }

            resolve(cartItemCount)
        })
    },
    placeOrder: (order, products, total, user) => {
        return new Promise((resolve, reject) => {
            let stat = order.payementMethod === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    date: new Date().toLocaleString(),
                    name:order.name,
                    email:order.email,
                    number:order.number,
                    locality:order.locality,
                    pincode:order.pincode,
                    area_street:order['area-street'],
                    city_district:order['city-district'],
                    state:order.state
                },
                userId: new objectId(user),
                payementMethod: order.payementMethod,
                products: products,
                total: total,
                status: stat

            }
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                if(order.payementMethod=='COD'){
                    db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new objectId(user) })
                }
                
                    console.log(response)
                    resolve(response.insertedId)

                
            })

        })
    },
    getOrderDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new objectId(userId) }).toArray()
            orders.reverse()
            resolve(orders)
        })
    },
    getAllOrderDetails: () => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    getOrderProduct: (product) => {
        return new Promise(async (resolve, reject) => {
           var order=[]
           var id
            for(i of product){
                id=i.item
                console.log(id)
                let orderItems = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new objectId(id)})
                order.push(orderItems)
            }
            
            console.log(order)
            resolve(order)


        })
    },
    getProduct: (id) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: new objectId(id) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }

            ]).toArray()
            console.log(orderItems)
            resolve(orderItems)


        })
    },
    generateRazorpay:(orderId,total)=>{
        console.log('total amount.......'+total)
        return new Promise((resolve,reject)=>{
          var options={
                amount:total*100,
                currency: "INR",
                receipt:''+orderId
            

              }
              instance.orders.create(options,(err,order)=>{
                console.log(order)
                console.log(err)
                resolve(order)

              })
          
        })

    },
    verifyPayement:(payementDetails)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto')
            var hmac=crypto.createHmac('sha256','XKgnqx4zCMxB4ZMEbFWBgJ4h')
            hmac.update(payementDetails['payement[razorpay_order_id]']+'|'+payementDetails['payement[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            console.log(hmac)
            console.log(payementDetails['payement[razorpay_signature]'])
            if(hmac==payementDetails['payement[razorpay_signature]'])
            {
               
                resolve()

            }else{
                
                reject()
            }

        })
    },
    changeOrderStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new objectId(orderId)},{$set:{status:'placed'}}).then((response)=>{
                resolve()
            })

        })
    },
    checkAdminLogin:(admin)=>{
        return new Promise(async(resolve,reject)=>{
           adminData=await db.get().collection('admin').findOne({adminName:'thahir'})
           console.log(adminData)
           if(admin.adminName===adminData.adminName){
              if(admin.password==adminData.password){
                resolve(adminData)
              }else{
                reject()
              }
           }else{
            reject()
           }
           
        })
        
    },
    allUsers:()=>{
        return new Promise((resolve,reject)=>{
           var users=db.get().collection(collections.USER_COLLECTION).find().toArray()
           resolve(users)
        })
    },
    update_profile:(userdata,userId)=>{
       
        return new Promise(async (resolve,reject)=>{
            var user_details={
                userid:new objectId(userId),
                fname:userdata.fname,
                lname:userdata.lname,
                gender:userdata.gender,
                email:userdata.email,
                number:userdata.number,
                locality:userdata.locality,
                pincode:userdata.pincode,
                area_street:userdata['area-street'],
                city_district:userdata['city-district'],
                state:userdata.state
    
            }
            var user_profile=await db.get().collection(collections.USER_DATA).findOne({userid:new objectId(userId)})
            
            if(user_profile==null){
                db.get().collection(collections.USER_DATA).insertOne(user_details).then((response)=>{
                    resolve(response)
                })
               
            }
            else{
              
                db.get().collection(collections.USER_DATA).updateOne({userid:new objectId(userId)},{$set:{
                   
                    fname:userdata.fname,
                    lname:userdata.lname,
                    gender:userdata.gender,
                    email:userdata.email,
                    number:userdata.number,
                    locality:userdata.locality,
                    pincode:userdata.pincode,
                    area_street:userdata['area-street'],
                    city_district:userdata['city-district'],
                    state:userdata.state
                }}).then((response)=>{
                    resolve(response)
                })
            }     
           
        })
        

    },
    find_profile:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            var profile=await db.get().collection(collections.USER_DATA).findOne({userid:new objectId(userId)})
            resolve(profile)
        })

    },
    findById:(id,callback)=>{
        db.get().collection(collections.GOOGLE_COLLECTION).findOne({id:id}).then((data)=>{
           var err=undefined
            callback(err,data)
        })
    },
    filter_products:(category1,category2)=>{
        return new Promise(async (resolve, reject)=> {
           var product= await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
           {
                $match:{
                    $or:[
                        {subCategory:category1},
                        {subCategory:category2}]
                }
           }, {
              $lookup: {
                from: "rating",
                localField: "_id",
                foreignField: "proId",
                as: "ratings"
              }
            },
            {
              $unwind: {
                path: "$ratings",
                preserveNullAndEmptyArrays: true
              }
            },
            {
              $group: {
                _id: "$_id",
                name: { $first: "$name" },
                totalRating: { $sum: "$ratings.rating" },
                averageRating: {
                  $avg: "$ratings.rating"
                },
                productData: { $first: "$$ROOT" }
              }
            },
            {
              $project: {
                _id: 0,
                name: 1,
                totalRating: 1,
                averageRating: {
                  $divide: [
                    { $trunc: { $multiply: ["$averageRating", 10] } },
                    10
                  ]
                },
                productData: 1
              }
            }
          ]).toArray();
           resolve(product)
        })
    },
    getOrderProducts: (orders) => {
        var allValues=[]
        return new Promise(async (resolve, reject) => {
            for(i of orders){
                var id=i._id
                let orderItems = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                    {
                        $match: { _id: new objectId(id) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                            

                        }
                    },
                    {
                        $lookup: {
                            from: collections.PRODUCT_COLLECTION,
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1,
                            quantity: 1,
                            product: {
                                $arrayElemAt: ['$product', 0]
                            }
                        }
                    }
    
                ]).toArray()
                allValues.push(orderItems)
            }
            
            console.log(allValues)
            resolve(allValues)


        })
    },
    getOrderAddress:(cartId)=>{
        return new Promise(async (resolve,reject)=>{
            let orderItems = await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:new objectId(cartId)})
                console.log(orderItems)
                resolve(orderItems)
        })

    },
    deleteCartItem:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new objectId(userId) }).then((response)=>{
                resolve(response)
            })
        })
    },
    contact_us:(values)=>{
        return new Promise ((resolve , reject )=>{
            db.get().collection(collections.CONTACT_COLLECTION).insertOne(values).then((response)=>{
                resolve(response)
            })
        })
    }
    
}
