const port = 4000;
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const { type } = require('os');

app.use(express.json());
app.use(cors());

//Database connection with mogodb
mongoose.connect('mongodb+srv://igerahmon:Eggrahmon+1@cluster0.hwewgmo.mongodb.net/ecommance')

//Api creation 

app.get('/', (req,res) =>{
    res.send('Express App is Running')
})

// //Image Storage Engine
// const storage = multer.diskStorage({
//     destination: './upload/images',
//     filename: (req,file,cb)=>{
//         return cb(null,`${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
//     }
// })
// // const upload = multer({storage:storage})
// const upload = require('./multerConfig'); // path to the multer config file
// //Creating upload Endpoint for images
// app.use('/images',express.static('upload/images') )
// app.post('/upload', upload.single('product'), (req, res) => {
//   if (!req.file) {
//     return res.status(400).json({
//       success: 0,
//       message: "No file uploaded",
//     });
//   }
//   res.json({
//     success: 1,
//     // image_url: `http://localhost:${port}/images/${req.file.filename}`,
//     image_url: `https://auraholic-backend.onrender.com/images/${req.file.filename}`,
//   });
// });
// const express = require('express');
const upload = require('./multerConfig'); // using Cloudinary now

// Upload endpoint
app.post('/upload', upload.single('product'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: 0,
      message: "No file uploaded",
    });
  }

  res.json({
    success: 1,
    image_url: req.file.path, // 🔥 Cloudinary gives back a full URL
  });
});





//Schema for creating products
const Product = mongoose.model("product", {
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  des: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  avilable: {
    type: Boolean,
    default: true,
  },
});

app.post("/addproduct", async (req, res) => {
  let products = await Product.find({});
  let id;
  if(products.length>0)
  {
    let last_product_array = products.slice(-1);
    let last_product = last_product_array[0];
    id = last_product.id+1;
  }
  else{
    id=1;
  }
  const product = new Product({
    id:id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    des: req.body.des,
  });

  console.log(product);
  await product.save();
  console.log("Saved");

  res.json({
    success: true,
    name: req.body.name,
  });
});


//creating api for deleting product
app.post('/removeproduct', async (req, res)=>{
  await Product.findOneAndDelete({id:req.body.id});
  console.log('Removed');
  res.json({
    success: true,
    name: req.body.name,
  })
})



//Createing api fro getting all product
app.get('/allproducts', async(req, res)=>{
  let products = await Product.find({});
  console.log('All Products Fetched');
  res.send(products);
})


// //Schema Creating for user mordel
const User = mongoose.model('Users', {
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  }
});

// Creating Endpoint for registering the users
app.post('/signup', async (req, res) => {
  let check = await User.findOne({ email: req.body.email });
  if (check) {
    return res.status(400).json({ success: false, error: 'Existing User Found With Same Email Address 🕶️' });
  }

  let cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }

  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });

  await user.save();

  const data = {
    user: {
      id: user.id
    }
  };

  const token = jwt.sign(data, 'secret_ecom');
  res.json({ success: true, token });
});


//creating endpoint for login
app.post('/login', async (req, res) => {
  let user = await User.findOne({ email: req.body.email }); // ✅ Correct model name

  if (user) { // ✅ Check the actual user object
    const passCompare = req.body.password === user.password;

    if (passCompare) {
      const data = {
        user: {
          id: user.id
        }
      };

      const token = jwt.sign(data, 'secret_ecom'); // ✅ Correct spelling
      res.json({ success: true, token });
    } else {
      res.json({ success: false, error: 'Wrong Password ❌❌' });
    }
  } else {
    res.json({ success: false, error: 'Wrong Email ❌❌' });
  }
});

//Creating endpoint for newcollection  data
app.get('/newcollections', async (req,res)=>{
  let products = await Product.find({});
  let newcollection = products.slice(1).slice(-8);
  console.log('NewCollection Fetched');
  res.send(newcollection);
})


//Creating endpoint for popular in prefumes
app.get('/popularperfumes',async (req,res)=>{
  let products = await Product.find({category:'perfume'});
  let popular_perfume = products.slice(0,6);
  console.log('Popular Perfumes Fetched');
  res.send(popular_perfume);
}) 

//Creating middleware to fetch user
const fetchUser = async (req,res,next)=> {
  const token = req.header('auth-token');
  if(!token){
    res.status(401).send({errors: 'Please authenticate using valid token'})
  }
  else{
    try{
      const data = jwt.verify(token,'secret_ecom');
      req.user = data.user;
      next();
    } catch (error){
      res.status(401).send({errors: "Please authenticate using valid token"})
    }
  }
}

//Creating Endpoint for adding products in cart data
app.post('/addtocart',fetchUser, async (req,res)=>{
 console.log('Added', req.body.itemId);
  let userData = await User.findOne({_id:req.user.id});
  userData.cartData[req.body.itemId] += 1;
  await User.findOneAndUpdate({_id:req.user.id}, {cartData:userData.cartData});
  res.send('Added')
})


//Creating endpoint to remove product from cartdata
app.post('/removefromcart', fetchUser, async (req, res) => {
  const itemId = req.body.itemId;
  console.log('Removing from cart:', itemId);

  try {
    let userData = await User.findOne({ _id: req.user.id });

    // Check if item exists and is greater than 0
    if (userData.cartData[itemId] && userData.cartData[itemId] > 0) {
      userData.cartData[itemId] -= 1;
    } else {
      console.log('Item not found or already zero');
      return res.status(400).json({ error: 'Item not in cart or quantity already 0' });
    }

    // Save the updated cart
    await User.findByIdAndUpdate(
      req.user.id,
      { cartData: userData.cartData },
      { new: true }
    );

    res.json({ message: 'Item removed from cart', cartData: userData.cartData });
  } catch (err) {
    console.error('Error removing item from cart:', err);
    res.status(500).json({ error: 'Server error' });
  }
});






// // creating endpoint to get cart
// app.post('/getcart', fetchUser,async(req,res)=>{
//   console.log('Get Cart');
//   let userData = await User.findOne({_id:req.user.id});
//   res.json(userData.cartData);
// })
app.post('/getcart', fetchUser, async (req, res) => {
  console.log('Get Cart for user:', req.user.id); // log this
  let userData = await User.findOne({ _id: req.user.id });
  console.log('User data:', userData); // and this
  res.json(userData.cartData);
});







app.listen(port, (error)=>{
    if(!error){
        console.log('Server Running on Port' +port)
    }
    else{
        console.log('Error : '+error)
    }

})




