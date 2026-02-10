require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const User = require('./models/User');
const Settings = require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
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

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tshirt_store';

mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected Successfully');
        try {
            // Default Settings Init
            const upi = await Settings.findOne({ key: 'upi_id' });
            if (!upi) await Settings.create({ key: 'upi_id', value: 'mobile@upi' });

            const qr = await Settings.findOne({ key: 'qr_image' });
            if (!qr) await Settings.create({ key: 'qr_image', value: '' });

            const bg = await Settings.findOne({ key: 'bg_image' });
            if (!bg) await Settings.create({ key: 'bg_image', value: '' });

            // --- NEW: Global Price Setting ---
            const price = await Settings.findOne({ key: 'tshirt_price' });
            if (!price) await Settings.create({ key: 'tshirt_price', value: '0' });

        } catch (e) { console.log(e); }
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- API Routes ---

// Get All Settings (Price સાથે)
app.get('/api/settings', async (req, res) => {
    try {
        const upi = await Settings.findOne({ key: 'upi_id' });
        const qr = await Settings.findOne({ key: 'qr_image' });
        const bg = await Settings.findOne({ key: 'bg_image' });
        const price = await Settings.findOne({ key: 'tshirt_price' }); // New

        res.json({
            upiId: upi ? upi.value : '',
            qrImage: qr ? qr.value : '',
            bgImage: bg ? bg.value : '',
            tshirtPrice: price ? price.value : '0' // New
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Price API
app.post('/api/settings/price', async (req, res) => {
    try {
        const { price } = req.body;
        await Settings.findOneAndUpdate({ key: 'tshirt_price' }, { value: price }, { upsert: true });
        res.json({ message: 'Price updated' });
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

app.post('/api/settings/bg', upload.single('bgImage'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const filePath = `/uploads/${req.file.filename}`;
        await Settings.findOneAndUpdate({ key: 'bg_image' }, { value: filePath }, { upsert: true });
        res.json({ message: 'Background Image uploaded', filePath });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/settings/qr', async (req, res) => {
    try {
        await Settings.findOneAndUpdate({ key: 'qr_image' }, { value: '' }, { upsert: true });
        res.json({ message: 'QR Image removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

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

app.get('/api/user/:mobile', async (req, res) => {
    try {
        const mobile = req.params.mobile;
        const users = await User.find({
            mobile: { $regex: mobile.slice(-10) }
        });
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.get('/', (req, res) => res.send('Vadva Group Backend Running'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});