const express = require('express');
const router = express.Router();
const fs = require('fs');


/* GET home page. */
router.post('/', function(req, res, next) {
  console.log(req.body.pose);

});


module.exports = router;
