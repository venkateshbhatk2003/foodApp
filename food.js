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
  _id: mongoose.Schema.Types.ObjectId,
  email: String,
  password: String,
  googleId: String,
  role: { type: String, enum: ["user", "specialUser"], default: "user" },
});

const foodSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  description: String,
  price: Number,
  image: String,
  category: { type: String, enum: ["veg", "non-veg", "dessert"] },
});

const orderSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  foodId: mongoose.Schema.Types.ObjectId,
  orderId: String,
  createdAt: Date,
  updatedAt: Date,
  status: { type: String, enum: ["pending", "processing", "completed", "cancelled"] },
  address: String,
  paymentMethod: { type: String, enum: ["cash", "card", "UPI"] },
});

const User = mongoose.model("User", userSchema);
const Food = mongoose.model("Food", foodSchema);
const Order = mongoose.model("Order", orderSchema);

const app = express();

dotenv.config();

mongoose.connect("mongodb://0.0.0.0:27017/FoodApp");

// Rest of the code remains the same

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

// Similarly, you can define APIs for orders CRUD operations

// Rest of the code remains the same

