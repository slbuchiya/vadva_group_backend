require('dotenv').config(); // 1. આ લાઈન સૌથી ઉપર ઉમેરો

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // Multer import કરવાનું ભૂલતા નહીં

// Models
const User = require('./models/User');
const Settings = require('./models/Settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Configure Multer Storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, 'uploads');
        // જો ફોલ્ડર ન હોય તો બનાવશે (recursive: true થી નેસ્ટેડ ફોલ્ડર પણ બને)
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

// Middleware
app.use(cors());
app.use(express.json());

// 2. Frontend Files Serve કરવા માટેનો સુધારેલો કોડ
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3. MongoDB Connection - સુરક્ષિત રીતે
// અહી તમારો હાર્ડકોડ કરેલો પાસવર્ડ કાઢી નાખ્યો છે. Render ના Environment Variables માં જ આખી લિંક નાખવી.
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://sbuchiya:sbuchiya@govindsuragroup.ghhvytp.mongodb.net/tshirt_store?retryWrites=true&w=majority&appName=GovindSuraGroup';
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log('MongoDB Connected Successfully');

        try {
            // Initialize Default UPI ID
            const upi = await Settings.findOne({ key: 'upi_id' });
            if (!upi) await Settings.create({ key: 'upi_id', value: 'mobile@upi' });

            // Initialize Default QR Status
            const qr = await Settings.findOne({ key: 'qr_image' });
            if (!qr) await Settings.create({ key: 'qr_image', value: '' });

            // Initialize Default BG Image
            const bg = await Settings.findOne({ key: 'bg_image' });
            if (!bg) await Settings.create({ key: 'bg_image', value: '' });

        } catch (err) {
            console.log("Error inside DB init:", err);
        }
    })
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- API Routes ---

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

// BG Image Upload API ઉમેરી (તમારા કોડમાં આ ખૂટતી હતી)
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

// Get All Users (with filter)
app.get('/api/users', async (req, res) => {
    try {
        const { status } = req.query;
        let query = {};
        if (status === 'paid') query.paymentStatus = true;
        if (status === 'unpaid') query.paymentStatus = false;

        const users = await User.find(query).sort({ createdAt: -1 }); // નવા ઓર્ડર પહેલા બતાવશે
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

// 4. Catch-All Route (Regex વાપરો જેથી એરર ન આવે)
app.get(/.*/, (req, res) => {
    if (req.url.startsWith('/api')) {
        return res.status(404).json({ message: 'API Route Not Found' });
    }
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});