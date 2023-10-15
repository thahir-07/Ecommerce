
if (window.innerWidth <= 768) {
    document.getElementById('search-lap').style.display = 'none'
} else {
    document.getElementById('smartphone').style.display = 'none'
}
window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
        document.getElementById('search-lap').style.display = 'none'
    } else {
        document.getElementById('smartphone').style.display = 'none'
    }
})
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        location.reload()
    }
})


function count(id) {
    console.log("count function called")
    var count = document.getElementById(id).innerHTML
    document.getElementById(id).innerHTML = parseInt(count) + 1



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
                razorpayPayement(response.payement, response.user)
            }

        }

    })
})
function razorpayPayement(order, user) {
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
    if (navigator.onLine) {
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
function addToCart(proId, user, size) {
    if (size) {
        var selected_size = document.getElementsByClassName('size-border')
        if (!selected_size[0]) {
            document.getElementById('cus-alert').style.display = 'block'
            setTimeout(() => {
                document.getElementById('cus-alert').style.display = 'none'
            }, 1000)
            return
        } else {
            console.log(selected_size[0].innerHTML)
            var size = selected_size[0].innerHTML

        }
    } else {
        size = null
    }
    $.ajax({
        url: "/addtocart",
        method: 'post',
        data: {
            proId: proId,
            size: size
        },
        success: (response) => {
            if (!response) {
                location.href = '/login'
            }
            if (response.response != 'increment') {
                let count = $('#cart-count').html()
                count = parseInt(count) + 1
                $('#cart-count').html(count)
                document.getElementById('cus-alert2').style.display = 'block'
                setTimeout(() => {
                    document.getElementById('cus-alert2').style.display = 'none'
                }, 1000)
            }
            else {

                document.getElementById('cus-alert2').style.display = 'block'
                setTimeout(() => {
                    document.getElementById('cus-alert2').style.display = 'none'
                }, 1000)


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
function addToWhishlist(proId) {
    var whish = document.getElementById('whishlist' + proId)
    var whishlist = document.getElementsByClassName('whishlist' + proId)
    if (whish.innerText == '🤍') {
        $.ajax({
            url: '/add_to_whishlist/' + proId,
            method: 'get',
            success: (response) => {
                if (response.value) {
                    for (var i = 0; i < whishlist.length; ++i) {
                        whishlist[i].textContent = '❤️'
                    }
                } else {
                    location.href = '/login'
                }
            }
        })
    } else {
        $.ajax({
            url: '/remove_from_whishlist/' + proId,
            method: 'get',
            success: (response) => {
                if (response.value) {
                    for (var i = 0; i < whishlist.length; ++i) {
                        whishlist[i].textContent = '🤍'
                    }

                } else {
                    location.href = '/login'
                }
            }
        })
    }


}
function remove_From_Whishlist(proId) {
    $.ajax({
        url: '/remove_from_whishlist/' + proId,
        method: 'get',
        success: (response) => {
            location.reload()
        }
    })
}

$('#verify-email').submit((e) => {
    e.preventDefault()
    console.log('workinggggggggggggg')
    var pas = document.getElementById('pas').value
    var c_pas = document.getElementById('c-pas').value
    if (pas != c_pas) {
        document.getElementById('err').innerText = 'Mismatch confirmation password'
        return
    }

    
    console.log($('#verify-email').serialize().email)
    $.ajax({
        url: '/verify-email',
        data: $('#verify-email').serialize(),
        method: 'get',
        success: (response) => {
            if (response.err) {
                document.getElementById('err').innerText = response.err
            } else {
                document.getElementById('otp-cont').style.display = 'block'
                var time = 30
                var timer = document.getElementById('timer')
                function countdown(){
                    time -= 1
                    timer.textContent = time
                    if(time===0){
                        clearInterval(interval)
                        timer.textContent=""
                        document.getElementById("res").textContent=""
                        document.getElementById("resend").textContent="Resend"
                    }
                        
                }

                var interval=setInterval(countdown, 1000)
                

            }
        }
    })
})

$('#otp-form').submit((e) => {
    e.preventDefault()
    $.ajax({

        url: '/verify-otp',
        data: $('#otp-form').serialize(),
        method: 'get',
        success: (response) => {
            if (response) {
                $.ajax({
                    url: '/signup',
                    data: $('#verify-email').serialize(),
                    method: 'post',
                    success: (response) => {
                        if (response) {
                           location.href='/'
                        }
                    }
                })

            } else {    
                    document.getElementById('err-otp').textContent='Incorrect Otp entere'

            }
        }
    })
})
function resend_otp(){
    document.getElementById('err-otp').textContent=""
    $.ajax({
        url:'/sendOtp',
        method:"GET",
        success:(response)=>{
            var time = 30
            var timer = document.getElementById('timer')
            function countdown(){
                time -= 1
                timer.textContent = time
                if(time===0){
                    clearInterval(interval)
                    timer.textContent=""
                    document.getElementById("res").textContent=""
                    document.getElementById("resend").textContent="Resend"
                }else{
                    document.getElementById("res").textContent="Resend otp in: 00:"
                    document.getElementById("resend").textContent=""
                }
                    
            }
            var interval=setInterval(countdown, 1000)
        }

    })
}
function forgot_password(){
   var log_inp= document.getElementById('log_email_inp').value
   if(log_inp==''){
    alert('Please enter your email to reset password!')
   }else if(!log_inp.includes('@')){
    alert("Enter correct email")
   }else{
    $.ajax({
        url:'/check-email',
        data:{email:log_inp},
        method:'get',
        success:(response)=>{
            console.log(response);
            if(response){
                $.ajax({
                    url:'/sendOtp',
                    method:'get',
                    success:(response)=>{
                        document.getElementById('otp-cont_login').style.display = 'block'
                        var time = 30
                        var timer = document.getElementById('timer_login')
                        function countdown(){
                            time -= 1
                            timer.textContent = time
                            if(time===0){
                                clearInterval(interval)
                                timer.textContent=""
                                document.getElementById("res_login").textContent=""
                                document.getElementById("resend_login").textContent="Resend"
                            }
                                
                        }
        
                        var interval=setInterval(countdown, 1000)
                    }
                })
            }else{
                alert("user doesn't exist")
            }
        }
    })
   }
   
}



$('#otp-form_login').submit((e) => {
    e.preventDefault()
    $.ajax({
        url:'/verify-otp',
        data: $('#otp-form_login').serialize(),
        method: 'get',
        success: (response) => {
            if(response) { 
                document.getElementById('err-otp_login').textContent=''
                document.getElementById('otp-cont_login').style.display='none'
                document.getElementById('change_password').style.display='block'

            }else {    
                    document.getElementById('err-otp_login').textContent='Incorrect Otp entered'

            }
        }
    })
})
$('#reset_password').submit((e)=>{
    e.preventDefault();
    var pass=document.getElementById('password_change').value
    var c_pass=document.getElementById('c_password_change').value
    if(pass==c_pass){
        $.ajax({
            url:'/change_password',
            data:$('#reset_password').serialize(),
            method:'post',
            success:(response)=>{
                alert("password changed successfully")
                location.href='/'
            }
        })
    }else{
        document.getElementById('err-password').textContent='Mismatch confirmation password'
    }
})