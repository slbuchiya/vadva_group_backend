const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, // e.g., 'upi_id'
    value: { type: String, default: '' }
});

module.exports = mongoose.model('Settings', settingsSchema);
