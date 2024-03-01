const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: String,
  category: { type: String, enum: ['veg', 'non-veg', 'dessert'], required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Food = mongoose.model('Food', foodSchema);

module.exports = Food;
