const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const todoController = require('../controllers/todoController');

const router = express.Router();

// Multer config for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Routes mapping
router.get('/', todoController.getAllTodos);
router.post('/', todoController.createTodo);
router.put('/:id', todoController.updateTodo);
router.delete('/:id', todoController.deleteTodo);

// File attachment routes
router.post('/:id/upload', upload.single('file'), todoController.uploadFile);
router.delete('/:id/attachments/:attachmentId', todoController.removeAttachment);

// Import/Export routes
router.get('/export/json', todoController.exportTodos);
router.post('/import/json', upload.single('file'), todoController.importTodos);

module.exports = router;
