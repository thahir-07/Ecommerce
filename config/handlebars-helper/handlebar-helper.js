module.exports = {
    product_check: (product, item, options) => {
        if (product.productData.subCategory == item || product.productData.productCategory == item)
            return options.fn(product)
        else
            return options.inverse(product)
    },

    product_check_electronics: (product, item, options) => {
        if (product.productData.subCategory !== 'Smartphones' && product.productData.productCategory == 'Electronics')
            return options.fn(product)
        else
            return options.inverse(product)
    },
    check: (orders, status, options) => {
        if (orders.status != status) {
            return options.fn(orders)
        } else {
            return options.inverse(orders)
        }
    },
    repeat: (times, options) => {
        let result = '';
        for (let i = 0; i < times; i++) {
            result += options.fn({ value: i + 1 });
        }
        return result;
    },

    total_rating: (rating) => {
        
            var n=rating.length
            var r=0
             rating.forEach(element => {
                 r+=element.rating
             });
             n=r/n
             return n.toFixed(1)
       
      
    },
    compare:(id,product)=>{
        console.log("........................")
        console.log(product)
        for(i in product){
            if(i.item==id){
                return i.quantity
            }
        }
    }


}