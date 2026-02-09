const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    tshirtName: String,
    size: String,
    mobile: { type: String, required: true },
    amount: { type: Number, default: 300 }, // Default price
    paymentStatus: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
