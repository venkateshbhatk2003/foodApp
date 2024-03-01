import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: String,
  password: String,
  googleId: String,
  role: { type: String, enum: ["user", "specialUser"], default: "user" },
});

const foodSchema = new mongoose.Schema({
  id:String,
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

export { User, Food, Order };
