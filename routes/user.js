var express = require('express');
var router = express.Router();
var db = require('../config/connection')
var collections = require('../config/collections')
var producthelper = require('../helpers/product-helpers')
var userhelpers = require('../helpers/user-helpers');
var productHelpers = require('../helpers/product-helpers');
const { handlebars } = require('hbs');
const userHelpers = require('../helpers/user-helpers');
const passport = require('passport');
const { Exception } = require('handlebars');
const { ObjectId } = require('mongodb');
const randomstring = require('randomstring');
const nodemailer = require('nodemailer');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//email code..
const transporter = nodemailer.createTransport({
  service: 'Gmail', // e.g., 'Gmail', 'Outlook'
  auth: {
    user: 'flashcartcart@gmail.com',
    pass: 'tmzp umbj ihxo afig',
  },
});

function sendOTPByEmail(email, otp) {
  const mailOptions = {
    from: 'flashcartcart@gmail.com',
    to: email,
    subject: 'OTP Verification',
    text: `Your OTP is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
      return false
    } else {
      console.log('Email sent: ' + info.response);
      return info
    }
  });
}

passport.use(new GoogleStrategy({
  clientID: '504408032003-jajn2rr5v0ahivm5rj2t649uk8t1prop.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/auth/google/callback' // Customize the callback URL as needed
}, (accessToken, refreshToken, profile, done) => {


  // Here, you can handle the user profile received from Google.
  // You can save it to the database or perform any other actions.
  // The user's Google profile information is available in the 'profile' object.
  // 'accessToken' and 'refreshToken' are also provided if you need them.
  // You can call the 'done' function to proceed with authentication.
  done(null, profile);
}));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  userHelpers.findById(id, (err, user) => {
    done(err, user);
  })
});

function generateOTP() {
  return randomstring.generate({
    length: 4,
    charset: 'numeric',
  });
}

router.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    console.log(req.user)
    userHelpers.googleLogin(req.user).then((response) => {
      req.session.userLoggedIn = true
      console.log("response")
      console.log(response)
    var  user = {
        _id: response._id,
        id: req.user.id,
        name: req.user.displayName,
        login_mode: 'google',
        image: req.user.photos[0].value
      }
      req.session.user = user
      res.redirect('/');

    })

  }
);

/* GET home page. */
router.get('/', async function (req, res, next) {
  if (req.session.userLoggedIn) {
    cartItems = await productHelpers.getCartProducts(req.session.user._id)
  req.session.cartItemCount = cartItems.length
   
  }
  productHelpers.getAllProduct(req.session.user).then((product) => {
    var nav = "product"
    res.render('user/view-products', { product, admin: false, user:req.session.user, cartItemCount:req.session.cartItemCount, nav })
  })
})

router.get('/login', function (req, res) {
  if (req.session.user) {
    res.redirect('/')

  } else {

    res.render('user/user-login', { logerr: req.session.userLoginErr })
    req.session.userLoginErr = false


  }
})
router.get('/signup', function (req, res) {
  res.render('user/user-signup')
})
router.post('/signup', function (req, res) {
  console.log(req.session.signup)
 console.log(req.body) 
  userhelpers.doSignup(req.body).then((response) => {
      req.session.userLoggedIn = true
      req.session.user = response
      res.json(response)
    

  })
})
router.post('/login', function (req, res) {
  console.log(req.body)
  userhelpers.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.userLoggedIn = true
      req.session.user = response.user
      res.redirect('/')
    } else {
      req.session.userLoginErr = "Invalid Email or Password"

      res.redirect('/login')
    }

  })
})
router.get('/logout', function (req, res) {

  if (req.session.user.login_mode) {
    req.logout((data) => {
      console.log(data)
    })
  }
  req.session.user = null
  req.session.userLoggedIn = false
  req.session.cartItemCount = 0
  res.redirect('/')

})
router.get('/cart', async function (req, res) {
  if (req.session.userLoggedIn) {
   var cartItems = await productHelpers.getCartProducts(req.session.user._id)
    req.session.cartItemCount = cartItems.length
    producthelper.getCartProducts(req.session.user._id).then((products) => {
      productHelpers.totalAmount(req.session.user._id).then(async (response) => {
        let total = await productHelpers.totalAmount(req.session.user._id)
        var nav = 'cart'
        res.render('user/user-cart', { products,  user:req.session.user, cartItemCount:req.session.cartItemCount, total, nav })

      })


    })

  } else {
    res.redirect('/login')

  }
}
)

function verifyLogin(req, res, next) {
  if (req.session.userLoggedIn)
    res.render('user/user-cart', { user:req.session.user })

  else
    res.render('user/user-login')
  next()
}

router.post('/addtocart', (req, res) => {
  var proId = req.body.proId
  var size = req.body.size
  if (req.session.user) {

    producthelper.addToCart(proId, req.session.user._id, size).then((response) => {
      res.json(response)
    })

  } else {

    res.json(false)
  }


}

)
router.get('/remove/:id', (req, res) => {
  console.log(req.session.user._id, req.params.id)
  producthelper.deleteFromCart(req.session.user._id, req.params.id)
  res.redirect('/cart')

})
router.post('/change-product-quantity', (req, res) => {

  producthelper.change_product_quantity(req.body.cart, req.body.product, req.body.count, req.body.quantity,req.session.user._id).then(async (response) => {
    let total = await productHelpers.totalAmount(req.session.user._id)
    res.json({ response, total })
  })
})
router.get('/place-order', async (req, res) => {
  if (req.session.userLoggedIn) {
    let total = await productHelpers.totalAmount(req.session.user._id)
    var profile = await userHelpers.find_profile(req.session.user._id)
    res.render('user/place-order', { total,  user:req.session.user, profile })
  } else {
    res.redirect('user/user-login')
  }


})
router.post('/place-order', async (req, res) => {
  if (req.session.userLoggedIn) {
    console.log("above the products")
    console.log(req.session.user._id)
    let products = await productHelpers.getCartProductsList(req.session.user._id)
    console.log('below the products')
    let total = await productHelpers.totalAmount(req.session.user._id)
    console.log(req.body)
    userHelpers.placeOrder(req.body, products, total, req.session.user._id).then((orderId) => {
      console.log(req.body)
      if (req.body.payementMethod === 'COD') {
        res.json({ status: "COD", user: req.body })

      } else {

        userHelpers.generateRazorpay(orderId, total).then((response) => {

          res.json({ payement: response, user: req.body })
        }).catch((err) => {

        })
      }


    })
  } else {
    res.redirect('user/user-login')
  }

})
router.get('/order-success', (req, res) => {

  res.render('user/order-success', {  user:req.session.user })

})
router.get('/show-orders', async (req, res) => {
  if (req.session.userLoggedIn) {
    let orders = await userHelpers.getOrderDetails(req.session.user._id)
    let products = await userHelpers.getOrderProducts(orders)
    var nav = 'orders'
    res.render('user/order-history', { orders,  user:req.session.user, products, cartItemCount:req.session.cartItemCount, nav })
  }
  else {
    res.redirect('user/user-login')
  }
})
router.get('/view-order-products/:id', async (req, res) => {

  let orders = await userHelpers.getOrderAddress(req.params.id)
  let products = await userHelpers.getOrderProduct(orders.products)
  console.log(products)
  res.render('user/order-product-view', { orders, products, cartItemCount:req.session.cartItemCount, user:req.session.user })
})
router.post('/verify-payement', (req, res) => {
  console.log(req.body)
  userHelpers.verifyPayement(req.body).then((response) => {
    userhelpers.changeOrderStatus(req.body['order[receipt]']).then((response) => {
      console.log('payement success')
      userHelpers.deleteCartItem(req.session.user._id).then((response) => {
        console.log(response)
      })
      res.json({ status: true })

    }).catch((err) => {
      console.log('payement rejected')
      res.json({ status: false, err })

    })

  })

})
router.get('/user-account', async (req, res) => {
  if (req.session.userLoggedIn) {
    if (req.session.user.login_mode) {
      var gProfile = {
        name: req.user.displayName,
        photo: req.user.photos[0].value
      }
      var profile = await userHelpers.find_profile(req.session.user._id)
      if (profile) {
        if (profile.gender == 'Male') {
          res.render('user/user-account', {cartItemCount:req.session.cartItemCount, user:req.session.user, profile, gProfile, male: true, google: true })
        }
        else {
          res.render('user/user-account', { user:req.session.user, cartItemCount:req.session.cartItemCount, profile, gProfile, female: true, google: true })

        }

      } else {
        res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, gProfile, profile, google: true })
      }

    } else {
      var profile = await userHelpers.find_profile(req.session.user._id)
      if (profile) {
        if (profile.gender == 'Male') {
          res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, profile, male: true })
        }
        else {
          res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, profile, female: true })

        }

      } else {
        res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, profile })
      }


    }


  } else {
    res.render('user/user-login')
  }



})
router.post('/update-profile', (req, res) => {


  if (req.session.userLoggedIn) {
    console.log(req.body)
    userHelpers.update_profile(req.body, req.session.user._id).then(async (response) => {
      var profile = await userHelpers.find_profile( req.session.user._id)
      console.log("inside the update profile")
      console.log(req.files)
      if (req.session.user.login_mode) {
        var gProfile = {
          name: req.user.displayName,
          photo: req.user.photos[0].value
        }
        if (profile.gender) { }
        if (profile.gender == 'Male')
          res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, profile, gProfile, google: true, male: true })
        else
          res.render('user/user-account', {  user:req.session.user, cartItemCount:req.session.cartItemCount, profile, gProfile, google: true, female: true })

      } else {
        if (req.files) {
          console.log("inside req.files")
          let image = req.files.image
          image.mv('./public/user-image/' + profile.userid + ".jpg")

        }
        console.log(profile)
        if (profile) {
          if (profile.gender == 'Male')
            res.render('user/user-account', { response,  user:req.session.user, profile, male: true })
          else
            res.render('user/user-account', { response,  user:req.session.user, profile, female: true })

        }
        else {
          res.render('user/user-account', { response, user:req.session.user, profile })
        }

      }


    })
  }
  else {

    res.render('user/user-login')
  }

})
router.get('/offer', (req, res) => {
  res.render('user/offer-page',{user:req.session.user, cartItemCount:req.session.cartItemCount})
})
router.post('/search', async (req, res) => {
  console.log(req.body.search)
  let matchedProducts = null
  let product = await producthelper.getAllProduct( req.session.user)
  var searchQuery = req.body.search.toLowerCase();
  matchedProducts = product.filter(product => {
    console.log(product)

    if (product.name.toLowerCase().includes(searchQuery) ||
      product.productData.description.toLowerCase().includes(searchQuery) || product.productData.subCategory.toLowerCase().includes(searchQuery) || product.productData.productCategory.toLowerCase().includes(searchQuery))
      return true;


  }

  )

  res.render('user/search-result', { matchedProducts, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})


router.get('/mobiles-tablets', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user, 'Smartphones', 'Smartphones')
  res.render('user/mobiles-tablets', { product, admin: false, user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/electronics', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user, 'Electronics', 'Electronics')
  res.render('user/electronics', { product, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/tv-appliances', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user, 'Electrical', 'appliances')
  res.render('user/tv-appliances', { product, admin: false, user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/fashion', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user ,'Fashion', 'cloths')
  res.render('user/fashion', { product, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/beuty', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user,'Beauty and Personal Care', '')
  res.render('user/beuty', { product, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/home-appliances', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user,'home', 'home-appliances')
  res.render('user/home-appliances', { product, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})
router.get('/furniture', async (req, res) => {
  var product = await userHelpers.filter_products(req.session.user,'furniture', 'furniture')
  res.render('user/furniture', { product, admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })
})

router.get('/description/:id', (req, res) => {
  console.log(req.params.id)
})

router.get('/detailed-view/:id', async (req, res) => {
  var id = req.params.id.toString()
  var product = await producthelper.getProduct(id)
  console.log(product)
  var proRating = await producthelper.getProductRating(id)
  proRating.reverse()
  var uid
  if (req.session.userLoggedIn)
    uid = req.session.user._id
  else
    uid = false

  var same = await producthelper.getSimilarProduct(product.subCategory, uid,id)
  res.render('user/detailed-view', { admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount, id: req.params.id, product, same, proRating })
})
router.get('/cancel-order/:id', (req, res) => {
  producthelper.deleteOrder(req.params.id).then((response) => {
    res.redirect('/login')
  })
})
router.get('/rate', (req, res) => {
  res.render('user/product-rating', { product: req.query, user:req.session.user })
})
router.post('/rate', (req, res) => {
  console.log(req.body)
  console.log(req.files)
  var images = []
  producthelper.addProductRaing(req.body).then((response) => {
    console.log(response)
    var i = 1
    if (req.files) {
      for (file of req.files.images) {
        file.mv('./public/rating-images/' + response.insertedId + i + '.jpg')
        images.push(response.insertedId + i)
        i++
      }
    }
    producthelper.updateRatingImage(response.insertedId, images)
    res.redirect('/')
  })
})
router.get('/privacy-policy', (req, res) => {
  res.render('user/privacy-policy', { admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })

})
router.get('/terms-of-use', (req, res) => {
  res.render('user/terms-of-use', { admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })

})
router.get('/contact-us', (req, res) => {
  res.render('user/contact-us', { admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })

})
router.post('/contact-us', (req, res) => {
  console.log(req.body);
  userHelpers.contact_us(req.body)

  res.redirect('/contact-us')

})
router.get('/cookie-policy', (req, res) => {
  res.render('user/cookie-policy', { admin: false,  user:req.session.user, cartItemCount:req.session.cartItemCount })

})
router.get('/add_to_whishlist/:id', (req, res) => {
  var id = req.params.id
  if (req.session.userLoggedIn) {
    userHelpers.addToWishList(id, req.session.user._id).then((response) => {
      res.json({ value: response })
    })
  } else {
    res.json({ value: false })
  }


})
router.get("/show-whishlist", async (req, res) => {
  if (req.session.userLoggedIn) {
    var products = await productHelpers.findWhishlists(req.session.user._id)
    console.log(products)
    var nav = 'whish'
    res.render('user/whishlist', {products, user:req.session.user, cartItemCount:req.session.cartItemCount, nav })
  }
  else {
    res.redirect('/login')
  }

})
router.get('/remove_from_whishlist/:proId', (req, res) => {
  var proId = req.params.proId
  if (req.session.userLoggedIn) {
    userHelpers.delete_from_whishlist(req.session.user._id, proId).then((response) => {
      res.json({ value: true })
    })

  } else {
    res.json({ value: false })
  }
})

router.get('/verify-email', async (req, res) => {
  console.log(req.query.email)
  req.session.signup=req.query
  userHelpers.check_user(req.query).then((response) => {
    if (response) {
      res.json(response)
    } else {
      var otp = generateOTP()
      req.session.otp = otp
      req.session.email=req.query.email
      console.log(otp)
      var email = sendOTPByEmail(req.query.email, otp);
      res.json({ email })
    }
  })


})
router.get('/verify-otp',(req,res)=>{
  console.log(req.query)
  var otp=req.query.otp1+req.query.otp2+req.query.otp3+req.query.otp4
  console.log(otp)
  if(req.session.otp==otp){
    console.log("otp matching")
    res.json(true)
  }else{
    res.json(false)
  }
})
router.get('/sendOtp',(req,res)=>{
  console.log("sed otp")
  var otp = generateOTP()
  req.session.otp = otp
  console.log(otp)
  var email = sendOTPByEmail(req.session.email, otp);
  res.json({email})
})
router.get('/check-email',(req,res)=>{
 console.log( req.query.email)
 userHelpers.check_email(req.query.email).then((response)=>{
  console.log(response)
  if(response){
    req.session.email=req.query.email
  }
  res.json(response)
 
 })
})
router.post('/change_password',(req,res)=>{
  console.log(req.body)
  userHelpers.update_password(req.session.email,req.body.password).then((user)=>{
    req.session.userLoggedIn = true
    req.session.user = user
    res.json(user)
  })
})
module.exports = router




