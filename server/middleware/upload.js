const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuração do Cloudinary 
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dpjf1w7bw',
    api_key: process.env.CLOUDINARY_API_KEY || '168314576313623',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'EkCHl_OfyD9UphRZmAJpDD_SXb8'
});

// Configuração do armazenamento Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'ecovigia-denuncias',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 1000, crop: 'limit' }], // Otimização básica de imagem
        public_id: (req, file) => `denuncia_${Date.now()}_${path.parse(file.originalname).name}`
    }
});

// Configuração do armazenamento local para fallback 
const localStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// verificar se o arquivo é uma imagem
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Apenas imagens são permitidas!'), false);
    }
};

// Criação do middleware de upload usando Cloudinary
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Limite de 5MB
    }
});

module.exports = upload; 