const express = require("express");
const uuid = require("uuid/v4");
const morgan = require("morgan");
const session = require("express-session");
const redis = require("redis");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const LocalStrategy = require("passport-local").Strategy;

const db = require("./db");

const indexRouter = require("./routes/index");
const loginRouter = require("./routes/login");
const logoutRouter = require("./routes/logout");

// initialise express
const app = express();
const PORT = process.env.PORT || 3000;

// use redis to store sessions
const RedisStore = require("connect-redis")(session);
const redisClient = redis.createClient();
redisClient.on("error", err => console.log(`Redis error: ${err}`));

// set up passport for authentication
passport.use(
  new LocalStrategy((username, password, done) => {
    db.query(
      "SELECT id, username, password, type FROM users WHERE username=$1",
      [username],
      (err, result) => {
        if (err) {
          console.log("Error when selecting user on login", err);
          done(err);
        }

        if (result.rows.length > 0) {
          const first = result.rows[0];
          console.log("all rows", result.rows);
          bcrypt.compare(password, first.password, function(err, res) {
            if (res) {
              // found user
              console.log("found user", res);
              done(null, {
                id: first.id,
                username: first.username,
                type: first.type
              });
            } else {
              // no user found among existing users
              console.log("no users found");
              done(null, false);
            }
          });
        } else {
          // no users exist at all
          console.log("no users found");
          done(null, false);
        }
      }
    );
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.query("SELECT * FROM users WHERE id = $1", [parseInt(id, 10)]);
  if (err) {
    console.log("Error when selecting user on session deserialise", err);
    return done(err);
  }
  done(null, result.rows[0]);
});

// set up views location and template renderer
app.set("views", "./views");
app.set("view engine", "pug");

// middleware
// add & configure middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(`${__dirname}/static`));
app.use(passport.initialize());
app.use(passport.session());
app.use(morgan("combined"));
app.use([
  require("helmet")(),
  session({
    // called when server can't find session id
    genid: req => {
      console.log("Inside the session middleware");
      // req.sessionID will be undefined here until it is instantiated in the homepage callback function
      console.log(req.sessionID);
      return uuid();
    },
    store: new RedisStore({
      host: "localhost",
      port: 6379,
      client: redisClient
    }),
    // name of the cookie containing the session ID
    name: "_redisDemo",
    cookie: {
      secure: process.env.NODE_ENV === "production" || false,
      maxAge: 60000
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
  })
]);

// homepage
app.use("/", indexRouter);

// login GET and POST routes
app.use("/login", loginRouter);
app.use("/logout", logoutRouter);

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
