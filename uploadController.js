
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');


const certStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/certificates/'; 
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); 
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadCert = multer({
    storage: certStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed for certificates!'), false);
        }
    }
}).array('certificates', 5);

exports.uploadCertificates = (req, res, next) => {
    uploadCert(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error (Certificates):', err);
            return res.status(400).json({ message: err.message });
        } else if (err) {
            console.error('Unknown upload error (Certificates):', err);
            return res.status(400).json({ message: err.message });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No files selected for upload.' });
        }

        try {
            const userId = req.user._id;
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const newCertificates = req.files.map(file => ({
                name: file.originalname,
                url: `/uploads/certificates/${file.filename}`,
                uploadedAt: new Date(),
            }));

            user.certificates.push(...newCertificates);
            await user.save();

            res.status(200).json({
                message: 'Certificates uploaded and profile updated successfully!',
                uploadedFiles: newCertificates,
                userCertificates: user.certificates
            });

        } catch (dbError) {
            console.error('Database update error after certificate upload:', dbError);
            req.files.forEach(file => {
                const filePath = path.join(__dirname, '..', 'uploads', 'certificates', file.filename);
                if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
            });
            return res.status(500).json({ message: 'Failed to update user profile with certificate data.' });
        }
    });
};


const profileImageStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'uploads/profile_images/'; 
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const userId = req.user._id;
        const extension = path.extname(file.originalname);
        cb(null, `profileImage-${userId}${extension}`);
    }
});

const uploadProfilePic = multer({
    storage: profileImageStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const mimeType = allowedTypes.test(file.mimetype);
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

        if (mimeType && extname) {
            cb(null, true);
        } else {
            cb(new Error('Only images (JPEG, PNG, GIF) are allowed for profile picture!'), false);
        }
    }
}).single('profileImage');

exports.uploadProfileImage = (req, res, next) => {
    uploadProfilePic(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer error (Profile Image):', err);
            return res.status(400).json({ message: err.message });
        } else if (err) {
            console.error('Unknown upload error (Profile Image):', err);
            return res.status(400).json({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No profile image file selected.' });
        }

        try {
            const userId = req.user._id;
            const user = await User.findById(userId);

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const imageUrl = `/uploads/profile_images/${req.file.filename}`;

            user.profileImageUrl = imageUrl;
            await user.save();

            res.status(200).json({
                message: 'Profile image uploaded successfully!',
                profileImageUrl: imageUrl,
            });

        } catch (dbError) {
            console.error('Database update error after profile image upload:', dbError);
            const filePath = path.join(__dirname, '..', 'uploads', 'profile_images', req.file.filename);
            if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }
            return res.status(500).json({ message: 'Failed to update user profile with image URL.' });
        }
    });
};
