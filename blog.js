import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import passport from "passport";
import { Strategy } from "passport-local";
import GoogleStrategy from "passport-google-oauth20";
import session from "express-session";
import NodeCache from "node-cache";
import dotenv from "dotenv";

const cache = new NodeCache();

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  role: { type: String, enum: ["user", "specialUser"], default: "user" },
});

const foodSchema = new mongoose.Schema({
  name: { type: String, index: true },
  description: String,
  price: Number,
  image: String,
  category: { type: String, enum: ["veg", "non-veg", "dessert"] },
});

const orderSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  orderId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled'] },
  addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  paymentMode: { type: String, enum: ['cash', 'card', 'UPI'] }
});





const User = mongoose.model("User", userSchema);
const Food = mongoose.model("Food", foodSchema);
const Order = mongoose.model("Order", orderSchema);

const app = express();

dotenv.config();

mongoose.connect("mongodb://0.0.0.0:27017/foodAppDB");


const db=mongoose.connection;

db.on('error',console.error.bind(console,'MongoDB connection error'))

db.once('open',()=>{
  console.log('MongoDB connected');
})




app.use(
  session({
    secret: "gghg",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.render("home.ejs");
});

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/secrets", async function (req, res) {
  let foundUsers = await User.find({ secret: { $ne: null } });
  if (foundUsers) {
    console.log(foundUsers);
    res.render("secrets.ejs", { usersWithSecrets: foundUsers });
  }
});

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/secrets",
    failureRedirect: "/login",
  })
);

// API endpoint to fetch food items
app.get("/api/foods", async (req, res) => {
  try {
    let query = {};
    // Check if category filter is present in query params
    if (req.query.category) {
      query.category = req.query.category;
    }
    const foods = await Food.find(query);
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/register", async (req, res) => {
  const email = req.body.username;
  const password = req.body.password;
  const role = req.body.role;

  try {
    const user = await User.findOne({ email });
    if (user) {
      res.redirect("/login");
    } else {
      const hash = bcrypt.hash(password, process.env.SALTROUNDS);
      const newUser = new User({
        _id: new mongoose.Types.ObjectId(),
        email,
        password: hash,
        role,
      });
      await newUser.save();
      req.login(newUser, (err) => {
        if (err) {
          console.error("Error during login:", err);
        } else {
          res.redirect("/secrets");
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
});

app.get("/submit", function (req, res) {
  console.log(req.user, "submitUser");
  if (req.isAuthenticated()) {
    res.render("submit.ejs");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", async function (req, res) {
  if (req.isAuthenticated()) {
    console.log(req.body);
    console.log(req.user, "user");
    console.log(req.body.secret, "secret");

    try {
      if (req.body && req.body.secret) {
        let updatedUser = await User.findOneAndUpdate(
          { googleId: req.user.googleId },
          { $set: { feedback: req.body.secret } },
          { new: true }
        );
        console.log(updatedUser, "updatedUser");
        res.send("feedback updated");
      } else {
        res
          .status(400)
          .json({ error: "Bad Request. Missing secret in request body." });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
});

app.post("/api/foods/insert", async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    if (req.body) {
      const newFood = new Food({
        _id: new mongoose.Types.ObjectId(),
        name,
        description,
        price,
        image,
        category,
      });
      await newFood.save();
      res.send("Food item added successfully");
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/foods", async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

passport.use(
  "local",
  new Strategy(async function verify(email, password, cb) {
    try {
      const user = await User.findOne({ email: email });

      if (user) {
        const storedHashedPassword = user.password;
        const valid = bcrypt.compare(password, storedHashedPassword);

        if (valid) {
          return cb(null, user);
        } else {
          return cb(null, false);
        }
      } else {
        return cb("User not found");
      }
    } catch (err) {
      console.log(err, "local error");
    }
  })
);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        console.log(accessToken);
        console.log(profile);
        const user = await User.findOne({ email: profile.email });

        if (!user) {
          const newUser = new User({
            email: profile.email,
            googleId: profile.id,
          });
          await newUser.save();
          return cb(null, newUser);
        } else {
          return cb(null, user);
        }
      } catch (err) {
        return cb(err);
      }
    }
  )
);

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser(async (id, cb) => {
  try {
    const user = await User.findById(id);
    cb(null, user);
  } catch (err) {
    cb(err);
  }
});

app.post("/api/foods/insert", async (req, res) => {
  try {
    const { name, description, price, image, category } = req.body;
    if (req.body) {
      const newFood = new Food({
        _id: new mongoose.Types.ObjectId(),
        name,
        description,
        price,
        image,
        category,
      });
      await newFood.save();
      res.send("Food item added successfully");
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/api/foods", async (req, res) => {
  try {
    const foods = await Food.find();
    res.json(foods);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/getBlogs/:authorId", async (req, res) => {
  try {
    const authorId = req.params.authorId;
    const cachedData = cache.get(authorId);

    if (cachedData) {
      console.log("Retriving data from cache itself", cachedData);
      return res.json(cachedData);
    }
    const aggregationPipeline = [
      {
        $match: {
          activeSubscriber: true,
        },
      },
      {
        $group: {
          _id: "$authorId",
          totalBlogs: { $sum: 1 },
          blogTitle: { $first: "$blogTitle" },
          avgBlogLength: { $avg: { $strLenCP: "$blogContent" } },
        },
      },
      {
        $sort: {
          totalBlogs: -1,
        },
      },
      {
        $project: {
          _id: 0,
          authorId: "$_id",
          totalBlogs: 1,
          blogTitle: 1,
          avgBlogLength: 1,
        },
      },
    ];
    const aggregateData = await Blog.aggregate(aggregationPipeline).exec();
    cache.set(authorId, aggregateData, 60);
    res.json(aggregateData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/blogs/deleteOne", async (req, res) => {
  try {
    if (req.body) {
      await Blog.deleteOne(req.body);
    }
    res.json("deleted");
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/blogs/updateOne/:id", async (req, res) => {
  try {
    if (req.body) {
      await Blog.findOneAndUpdate({ authorId: req.params.id }, req.body);
    }
    res.json("updated");
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3000, () => {
  console.log(`Server running on port ${3000}`);
});
