const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const User = require('./models/User');
const Settings = require('./models/Settings');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath);
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        if (file.fieldname === 'bgImage') {
            cb(null, 'custom_bg' + path.extname(file.originalname));
        } else {
            cb(null, 'custom_qr' + path.extname(file.originalname));
        }
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../frontend'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tshirt_store';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected');
        // Initialize Default UPI ID
        const upi = await Settings.findOne({ key: 'upi_id' });
        if (!upi) await Settings.create({ key: 'upi_id', value: 'mobile@upi' });

        // Initialize Default QR Status
        const qr = await Settings.findOne({ key: 'qr_image' });
        if (!qr) await Settings.create({ key: 'qr_image', value: '' });
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// API Routes

// Settings APIs
app.get('/api/settings', async (req, res) => {
    try {
        const upi = await Settings.findOne({ key: 'upi_id' });
        const qr = await Settings.findOne({ key: 'qr_image' });
        const bg = await Settings.findOne({ key: 'bg_image' });
        res.json({
            upiId: upi ? upi.value : '',
            qrImage: qr ? qr.value : '',
            bgImage: bg ? bg.value : ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/settings/upi', async (req, res) => {
    try {
        const setting = await Settings.findOne({ key: 'upi_id' });
        res.json({ upiId: setting ? setting.value : '' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/settings/upi', async (req, res) => {
    try {
        const { upiId } = req.body;
        await Settings.findOneAndUpdate({ key: 'upi_id' }, { value: upiId }, { upsert: true });
        res.json({ message: 'UPI ID updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/settings/qr', upload.single('qrImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const filePath = `/uploads/${req.file.filename}`;
        await Settings.findOneAndUpdate({ key: 'qr_image' }, { value: filePath }, { upsert: true });
        res.json({ message: 'QR Image uploaded', filePath });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/settings/qr', async (req, res) => {
    try {
        await Settings.findOneAndUpdate({ key: 'qr_image' }, { value: '' }, { upsert: true });
        // Optionally delete file, but keeping it is fine for now
        res.json({ message: 'QR Image removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Users (with filter)
app.get('/api/users', async (req, res) => {
    try {
        const { status } = req.query; // 'paid', 'unpaid', or undefined (all)
        let query = {};
        if (status === 'paid') query.paymentStatus = true;
        if (status === 'unpaid') query.paymentStatus = false;

        const users = await User.find(query);
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle Payment Status
app.put('/api/user/:id/payment', async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentStatus } = req.body;
        await User.findByIdAndUpdate(id, { paymentStatus });
        res.json({ message: 'Status updated' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user by mobile number
app.get('/api/user/:mobile', async (req, res) => {
    try {
        const mobile = req.params.mobile;

        // Find all orders for the mobile number
        const users = await User.find({
            mobile: { $regex: mobile.slice(-10) }
        });

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
