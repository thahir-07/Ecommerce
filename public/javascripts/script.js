if (window.innerWidth <= 768) {
    document.getElementById('search-lap').style.display='none'
} else{
    document.getElementById('search-smartphone').style.display='none'
}
window.addEventListener('resize',()=>{
    if (window.innerWidth <= 768) {
        document.getElementById('search-lap').style.display='none'
    } else{
        document.getElementById('search-smartphone').style.display='none'
    } 
})
window.addEventListener('pageshow',(event)=>{
    if(event.persisted){
        location.reload()
    }
})


function count(id){
    console.log("count function called")
   var count=document.getElementById(id).innerHTML
   document.getElementById(id).innerHTML=parseInt(count)+1



}

function formatIndianAmountInINR(amount) {
    const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
    const formattedAmount = formatter.format(amount);
    return formattedAmount;
  }
$("#checkout-form").submit((e) => {
    console.log('ajaxxxxxxxxxxxxxxxxxxxxxxx')
    e.preventDefault()
    console.log(e)
    $.ajax({
        url: '/place-order',
        method: 'post',
        data: $('#checkout-form').serialize(),
        success: (response) => {
            console.log(response)
            if (response.status === 'COD') {
                location.href = '/order-success'

            } else {
                console.log("from online response")
                console.log(response)
                razorpayPayement(response.payement,response.user)
            }

        }

    })
})
function razorpayPayement(order,user) {
    var options = {
        "key": "rzp_test_0lu74rFyib3blw", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Flashcart", //your business name
        "description": "Test Transaction",
        "image": '/project-images/flashcart.png',
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": (response) => {
            verifyPayement(response, order)

        },
        //"callback_url": "https://eneqd3r9zrjok.x.pipedream.net/",
        "prefill": {
            "name": user.name, //your customer's name
            "email": user.email,
            "contact": user.number
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    if(navigator.onLine){
        var rzp1 = new Razorpay(options);
        rzp1.open();
    }
    
}
function verifyPayement(payement, order) {
    console.log('verify Payement function called')
    $.ajax({
        url: '/verify-payement',
        data: {
            payement,
            order
        },
        method: 'post',
        success: (response) => {
            console.log('success called')
            console.log(response)
            if (response.status) {
                location.reload()
                location.href = '/order-success'
            } else {
                location.reload()
                alert('payement failed')
            }

        }
    })

}
function addToCart(proId,user,size){
    if(size){
        var selected_size=document.getElementsByClassName('size-border')
        if(!selected_size[0]){
            document.getElementById('cus-alert').style.display='block'
            setTimeout(()=>{
                document.getElementById('cus-alert').style.display='none'
            },1000)
            return
        }else{
            console.log(selected_size[0].innerHTML)
            var size=selected_size[0].innerHTML
    
        }
    }else{
       size=null
    }
       $.ajax({
            url: "/addtocart",
            method: 'post',
            data:{
                proId:proId,
                size:size
            },
            success: (response) => {
                    if(!response){
                        location.href='/login'
                    }
                    if (response.response != 'increment') {
                        let count = $('#cart-count').html()
                        count = parseInt(count) + 1
                        $('#cart-count').html(count)
                        document.getElementById('cus-alert2').style.display='block'
                            setTimeout(()=>{
                                document.getElementById('cus-alert2').style.display='none'
                            },1000)
                    }
                    else {
                        
                            document.getElementById('cus-alert2').style.display='block'
                            setTimeout(()=>{
                                document.getElementById('cus-alert2').style.display='none'
                            },1000)

                       
                    }
    
                
            }
        })

}

function changeQuantity(cartId, proId, count) {
    let quantity = parseInt(document.getElementById(proId).innerHTML)

    $.ajax({
        url: '/change-product-quantity',
        data: {
            cart: cartId,
            product: proId,
            count: count,
            quantity: quantity
        },
        method: 'post',
        success: (response) => {
            count = parseInt(count)
            console.log(response)
            if (response.response.productRemoved) {
                location.reload()

            } else {
                if (count == 1) {

                    document.getElementById(proId).innerHTML = quantity + 1

                }
                else {

                    quantity = quantity - 1
                    document.getElementById(proId).innerHTML = quantity
                }
            }

            $('#total').html(formatIndianAmountInINR(response.total))
        }
    })
}
function addToWhishlist(proId){
    var whish=document.getElementById('whishlist'+proId)
    var whishlist=document.getElementsByClassName('whishlist'+proId)
    if(whish.innerText=='🤍'){
        $.ajax({
            url:'/add_to_whishlist/'+proId, 
            method:'get',
            success:(response)=>{
                if(response.value){
                    for(var i=0;i<whishlist.length ;++i ){
                        whishlist[i].textContent='❤️'
                    }
                }else{
                    location.href='/login'
                }
            }
        })
    }else{
        $.ajax({
            url:'/remove_from_whishlist/'+proId,
            method:'get',
            success:(response)=>{
                if(response.value){
                    for(var i=0;i<whishlist.length ;++i ){
                        whishlist[i].textContent='🤍'
                    }
    
                }else{
                    location.href='/login'
                }
            }
        })
    }

   
}
function remove_From_Whishlist(proId){
    $.ajax({
        url:'/remove_from_whishlist/'+proId,
        method:'get',
        success:(response)=>{
           location.reload()
        }
    })
}

