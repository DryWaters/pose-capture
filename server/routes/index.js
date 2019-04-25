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
        console.log(err);
        return res.json({
          status: "error",
          message: `Unable to save ${req.body.timestamp} as a ${req.body.tag}`
        });
      }
    }
  );

  var base64Data = req.body.screenshot.replace(/^data:image\/png;base64,/, "");
  fs.writeFile(
    `screenshots/${req.body.tag}/${req.body.timeStamp}.png`,
    base64Data,
    "base64",
    err => {
      if (err) {
        console.log(err);
        return res.json({
          status: "error",
          message: `Unable to save ${req.body.timestamp}.png`
        });
      }
      return res.json({
        status: "ok",
        message: `Saved ${req.body.timestamp}.png`
      });
    }
  );
});

router.post("/delete", (req, res) => {
  fs.unlink(`poses/${req.body.tag}/${req.body.timeStamp}.json`, err => {
    if (err) {
      return res.json({
        status: "error",
        message: `Unable to delete ${req.body.timestamp}`
      });
    }
  });

  fs.unlink(`screenshots/${req.body.tag}/${req.body.timeStamp}.png`, err => {
    if (err) {
      return res.json({
        status: "error",
        message: `Unable to delete ${req.body.timestamp}`
      });
    }
    return res.json({
      status: "ok",
      message: `Deleted ${req.body.timestamp}`
    });
  });
});

module.exports = router;
