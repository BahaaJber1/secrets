/**
 * Main server file for the Secrets Project.
 * This application allows users to register, login (with local or Google OAuth2),
 * submit secrets, and view their own secret. User data is stored in a PostgreSQL database.
 */

// Import required modules
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt"; // For hashing passwords
import passport from "passport"; // Main Passport library
import { Strategy } from "passport-local"; // Local username/password strategy
import GoogleStrategy from "passport-google-oauth2"; // Google OAuth2 strategy
import session from "express-session"; // Session middleware
import env from "dotenv"; // For loading environment variables

// Initialize Express app and config
const app = express();
const port = 3000;
const saltRounds = 10; // bcrypt salt rounds for hashing
env.config(); // Load .env file

// Configure session middleware for persistent login
app.use(
  session({
    secret: process.env.SESSION_SECRET, // Used to sign session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: true, // Save new sessions
  })
);

// Middleware for parsing form data and serving static files
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Initialize Passport for authentication
app.use(passport.initialize()); // Sets up Passport
app.use(passport.session()); // Enables persistent login sessions

// Set up PostgreSQL client using environment variables
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect(); // Connect to the database

// Home page route
app.get("/", (req, res) => {
  res.render("home.ejs");
});

// Login page route
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

// Register page route
app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// Logout route - ends user session and logs out
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Protected secrets page - only accessible if logged in
app.get("/secrets", async (req, res) => {
  if (req.isAuthenticated()) { // Passport adds this method
    try {
      // Get the user's secret from the database using their email
      const result = await db.query("SELECT secret FROM users WHERE email = $1", [req.user.email]);
      const secret = result.rows[0].secret;
      // If no secret, show a default message
      if (secret === null) {
        return res.render("secrets.ejs", { secret: "Jack Bauer is my hero!" });
      }
      // Render the user's secret
      res.render("secrets.ejs", { secret });
      //TODO: Update this to pull in the user secret to render in secrets.ejs
    } catch (err) {
      console.log(err);
    }
  } else {
    // If not authenticated, redirect to login
    res.redirect("/login");
  }
});

// Submit secret page - only accessible if logged in
app.get("/submit",  (req, res) => {
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

// Handle secret submission and update user's secret in DB
app.post("/submit", async (req, res) => { 
  const secret = req.body.secret;
  try {
    // Update the user's secret in the database
    await db.query("UPDATE users SET secret = $1 WHERE email = $2", [
      secret,
      req.user.email,
    ]);
    res.redirect("/secrets");
  } catch (err) {
    console.log(err);
  }
});

// Google OAuth login route - redirects user to Google for authentication
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Request profile and email from Google
  })
);

// Google OAuth callback route - Google redirects here after login
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets", // On success, go to secrets page
    failureRedirect: "/login",   // On failure, go to login page
  })
);

// Local login route using Passport
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets", // On success, go to secrets page
    failureRedirect: "/login",   // On failure, go to login page
  })
);

// Register new user
app.post("/register", async (req, res) => {
  const email = req.body.username; // "username" field from form is actually email
  const password = req.body.password;

  try {
    // Check if user already exists
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      // If user exists, redirect to login
      req.redirect("/login");
    } else {
      // Hash password and save new user
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
        } else {
          // Insert new user into database
          const result = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *",
            [email, hash]
          );
          const user = result.rows[0];
          // Log in the user after registration (creates session)
          req.login(user, (err) => {
            console.log("success");
            res.redirect("/secrets");
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

// Passport local strategy for username/password login
passport.use(
  "local",
  new Strategy(async function verify(username, password, cb) {
    try {
      // Find user by email
      const result = await db.query("SELECT * FROM users WHERE email = $1 ", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;
        // Compare submitted password with hashed password
        bcrypt.compare(password, storedHashedPassword, (err, valid) => {
          if (err) {
            console.error("Error comparing passwords:", err);
            return cb(err);
          } else {
            if (valid) {
              // Passwords match, authenticate user
              return cb(null, user);
            } else {
              // Passwords don't match
              return cb(null, false);
            }
          }
        });
      } else {
        // No user found with that email
        return cb("User not found");
      }
    } catch (err) {
      console.log(err);
    }
  })
);

// Passport Google OAuth strategy
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // From Google Developer Console
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets", // Where Google redirects after login
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo", // Where to get user info
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        // Log the Google profile for debugging
        console.log(profile);
        // Find or create user by Google email
        const result = await db.query("SELECT * FROM users WHERE email = $1", [
          profile.email,
        ]);
        if (result.rows.length === 0) {
          // If user doesn't exist, create new user with Google email
          const newUser = await db.query(
            "INSERT INTO users (email, password) VALUES ($1, $2)",
            [profile.email, "google"] // Store "google" as password for social login
          );
          return cb(null, newUser.rows[0]);
        } else {
          // User exists, log them in
          return cb(null, result.rows[0]);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

// Serialize user to store in session (called when user logs in)
passport.serializeUser((user, cb) => {
  cb(null, user);
});

// Deserialize user from session (called on every request after login)
passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
