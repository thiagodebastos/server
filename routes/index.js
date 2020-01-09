const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  const sessionExpireTime = req.session.cookie.originalMaxAge / 1000;
  console.log("Inside the homepage callback function");
  res.render("index", {
    sessionID: req.sessionID,
    sessionExpireTime,
    views: req.session.views,
    error: null,
    isAuthenticated: req.isAuthenticated(),
    username: req.isAuthenticated() ? req.user.username : null
  });
});

router.post("/", (req, res, next) => {
  if (req.session.views) {
    req.session.views++;
  } else {
    req.session.views = 1;
  }
  const expireTime = req.session.cookie.maxAge / 1000;
  res.render("index", {
    sessionID: req.sessionID,
    sessionExpireTime: expireTime,
    views: req.session.views,
    username: null,
    error: null
  });
});

module.exports = router;
