var db=require('../config/connection')
var collections=require('../config/collections')
const session = require('express-session')
const { response } = require('express')
var ObjectId=require('mongodb').ObjectId
module.exports={
     addProduct:(product,callback)=>{
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    
     },
       getAllProduct: ()=>{
        return new Promise(async(resolve,reject)=>{
            let product= await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray() 
            resolve(product)

        })
    
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
             db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:new ObjectId(proId)}).then((response)=>{
                console.log(response)
                resolve(response)

            })
        })
    },
    getProduct: (proId)=>{
        return new Promise(async(resolve,reject)=>{
            let product= await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(proId)})

            resolve(product)


        })
    
    },
    updateProduct:(data,proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:new ObjectId(proId)},{$set:
                {name:data.name,
                productCategory:data.productCategory,
                subCategory:data.subCategory,
                price:data.price,
                description:data.description,
                features:data.features
            }
                }).then((response)=>{
                resolve(response)
            })
        })

    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:new ObjectId(proId),
            quantity:1
         }
        return new Promise(async (resolve,reject)=>{
            let userCart=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            
            if(userCart){
                let proExist=userCart.products.findIndex(product=> product.item==proId)
                console.log(proExist)
                if(proExist!=-1){
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(userId),'products.item':new ObjectId(proId) }

                    ,{
                        $inc:{'products.$.quantity':1}
                    }).then((response)=>{
                        resolve({response:"increment"})
                    })

                }
                else{
                    db.get().collection(collections.CART_COLLECTION).updateOne(
                        {user:new ObjectId(userId)},
                        {
                            $push:{products:proObj}
                        }
                        ).then((response)=>{
                            console.log("cart updated")
                            resolve({response:"proAdded"})
    
                        })

                }
                
               
                

            }
            else{
                let cardObj={
                    user:new ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cardObj).then((response)=>{
                    console.log("new quantity............")
                   
                    resolve({response:'inserted'})
                })
            }
          
        })
        

        

    },/*getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
       let productsValues=await db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)},{_id:0})
       console.log("products are.......")
       console.log(productsValues.products[0])
       let productDetails=[]
       let length=productsValues.products.length
       for(i=0;i<length;i++){

         productDetails.push(await db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:new ObjectId(productsValues.products[i])}))
       }
       console.log("after array iteration")
       console.log(productDetails)
       resolve(productDetails)
       
    })
   
}*/
//above code is written without aggregate and code working properly
getCartProducts:((userId)=>{
    return new Promise(async(resolve,reject)=>{
      let cartItems=await db.get().collection(collections.CART_COLLECTION).aggregate([
            {
                $match:{user:new ObjectId(userId)}
            },
            {
                $unwind:'$products'
            },
            {
                $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collections.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,
                    quantity:1,
                    product:{$arrayElemAt:['$product',0]
                }
            }
        }

            
           /* {
                $lookup:{
                    from:collections.PRODUCT_COLLECTION,
                    let:{productList:'$products'},
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $in:['$_id','$$productList']
                                }
                            }
                        }
                    ],
                    as:'cartItems'

                }
            }*/
        ]).toArray()
        console.log(cartItems)
        
        resolve(cartItems)


    }
   
    )

}),
deleteFromCart:(userId,proId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(userId)},{$pull:{'products':{item:new ObjectId(proId)}}} ).then((response)=>{
            console.log(response)
        })

       
    })
},
change_product_quantity:(cartId,proId,count,quantity,user)=>{
    quantity=parseInt(quantity)
    count=parseInt(count)
    console.log(quantity)
    if(quantity==1 && count==-1){
       
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.CART_COLLECTION).updateOne({user:new ObjectId(user)},{$pull:{'products':{item:new ObjectId(proId)}}} ).then((response)=>{
                console.log(response)
                resolve({productRemoved:true})
            })
    
           
        })
    }
    else
    {
    return new Promise(async(resolve,reject)=>{
       productQuantity=await db.get().collection(collections.CART_COLLECTION).updateOne({_id:new ObjectId(cartId),'products.item':new ObjectId(proId)},{
            $inc:{'products.$.quantity':count}
        }).then((response)=>{
            console.log(user)
            module.exports.getCartProducts(user).then((response)=>{
                resolve(response)
            })
    })
   
    })}
},
totalAmount:(userId)=>{
    return new Promise(async(resolve,reject)=>{
        let total=await db.get().collection(collections.CART_COLLECTION).aggregate([
              {
                  $match:{user:new ObjectId(userId)}
              },
              {
                  $unwind:'$products'
              },
              {
                  $project:{
                      item:'$products.item',
                      quantity:'$products.quantity'
                  }
              },
              {
                  $lookup:{
                      from:collections.PRODUCT_COLLECTION,
                      localField:'item',
                      foreignField:'_id',
                      as:'product'
                  }
              },
              {
                  $project:{
                      item:1,
                      quantity:1,
                      product:{$arrayElemAt:['$product',0],
                     
                  }
              }
          },{
            $group:{
                _id:null,
             
                total:{
                    $sum:{
                        $multiply:['$quantity',{$toInt:'$product.price'}]
                    }
                }
            }
          }
          
        ]).toArray()
        if(total[0]){
            
           resolve(total[0].total)


        }else{
            resolve(0)
        }

    })
},
getCartProductsList:(userId)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.CART_COLLECTION).findOne({user:new ObjectId(userId)}).then((response)=>{
            console.log("get product list   "+response)
            if(response)
            resolve(response.products)
            else
             resolve(null)
        })
    })

},
getSimilarProduct: (subCategory)=>{
    return new Promise(async(resolve,reject)=>{
        let product= await db.get().collection(collections.PRODUCT_COLLECTION).find({subCategory:subCategory}).toArray() 
        resolve(product)

    })

},
getOrder:(proId)=>{
    return new Promise(async(resolve,reject)=>{
        console.log()
        let order=await db.get().collection(collections.ORDER_COLLECTION).findOne({_id:new ObjectId(proId)})
        resolve(order)
    })
},
updateStatus:(values)=>{
    return new Promise((resolve,reject)=>{
        var today=new Date().toLocaleString()
        db.get().collection(collections.ORDER_COLLECTION).updateOne(
            {_id:new ObjectId(values.id)},
            {$set:{status:values.status},
            $push:{reached:{reach:values.reached,date:today}}}).then((response)=>{
                resolve(response)
            })
    })
},
deleteOrder:(id)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.ORDER_COLLECTION).updateOne({_id:new ObjectId(id)},{$set:{status:'Order canceled'}}).then((response)=>{
            console.log(response)
            resolve(resolve)
        })
    })
},
addProductRaing:(data)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.RATE_COLLECTION).insertOne({userId:new ObjectId(data.user_id),proId:new ObjectId(data.product_id),rating:parseInt(data.rating),review:data.review}).then((response)=>{
            resolve(response)
        })
    })

},
getProductRating:(pId)=>{
    return new Promise(async(resolve,reject)=>{
      let rating=await db.get().collection(collections.RATE_COLLECTION).find({proId:new ObjectId(pId)}).toArray()
      resolve(rating)
    })
},
updateRatingImage:(id,image)=>{
    return new Promise((resolve,reject)=>{
        db.get().collection(collections.RATE_COLLECTION).updateOne({_id:new ObjectId(id)},{$set:{images:image}})
    })
}
}
