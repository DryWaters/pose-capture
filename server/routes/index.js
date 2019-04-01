const express = require("express");
const router = express.Router();
const fs = require("fs");

/* GET home page. */
router.post("/save", (req, res, next) => {
  fs.writeFile(
    `poses/${req.body.tag}/${req.body.timeStamp}.json`,
    JSON.stringify(req.body.poseData),
    err => {
      if (err) {
        res.json({
          status: "error",
          message: `Unable to save ${req.body.timestamp} as a ${req.body.tag}`
        });
      }
      res.json({
        status: "ok",
        message: `Saved ${req.body.timestamp} as a ${req.body.tag}`
      });
    }
  );
});

router.post("/delete", (req, res) => {
  fs.unlink(`poses/${req.body.tag}/${req.body.timeStamp}.json`, err => {
    if (err) {
      res.json({
        status: "error",
        message: `Unable to delete ${req.body.timestamp}`
      });
    }
    res.json({
      status: "ok",
      message: `Deleted ${req.body.timestamp}`
    });
  });
});

module.exports = router;
