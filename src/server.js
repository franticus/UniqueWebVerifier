const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');
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
    unpackAndAnalyzeArchive(req.file.path);
    res.send(`File uploaded successfully: ${req.file.originalname}`);
  } else {
    res.status(400).send('No file uploaded.');
  }
});

// Функция для извлечения текста из HTML-файла
function extractTextFromHtml(htmlContent) {
  const dom = new JSDOM(htmlContent);
  const bodyText = dom.window.document.body.textContent || '';
  return bodyText.trim(); // Возвращаем текст, удалив пробелы в начале и конце
}

// Функция для генерации хеша текста
function generateHash(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

// Функция для распаковки архива и анализа его содержимого
function unpackAndAnalyzeArchive(filePath) {
  const zip = new AdmZip(filePath);
  zip.getEntries().forEach(entry => {
    if (entry.entryName.endsWith('.html')) {
      // Проверяем, является ли файл HTML-документом
      const content = zip.readAsText(entry); // Читаем содержимое HTML-файла
      const text = extractTextFromHtml(content); // Извлекаем текст
      console.log(text); // Выводим извлеченный текст (или здесь можете применить дальнейший анализ)
    }
  });
}
