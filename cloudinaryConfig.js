const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: 'dkg3bl6rj', 
   api_key: '914721548221752',
  api_secret: 'A_53XDKNX9n-HXNLyBT06uGT0Bw'
});

module.exports = cloudinary;
