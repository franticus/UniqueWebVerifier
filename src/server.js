const express = require('express');
const multer = require('multer');
const app = express();
const port = 3001;

// Настройка Multer для обработки загружаемых файлов
// Файлы будут временно сохраняться в папке 'uploads'
const upload = multer({ dest: 'uploads/' });

app.get('/', (req, res) => {
  res.send('Welcome to the UniqueWebVerifier!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Маршрут для загрузки файла
app.post('/upload', upload.single('siteZip'), (req, res) => {
  if (req.file) {
    console.log('Uploaded: ', req.file.path);
    res.send(`File uploaded successfully: ${req.file.originalname}`);
  } else {
    res.status(400).send('No file uploaded.');
  }
});
