const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
const { compareWithCheckedArchive } = require('./unique.js');

const app = express();
const port = 3001;

const uploadDir = path.join(__dirname, 'uploads');
const checkedArchiveDir = path.join(__dirname, 'checkedArchive');

// Убедимся, что директории существуют
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(checkedArchiveDir)) {
  fs.mkdirSync(checkedArchiveDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Welcome to the UniqueWebVerifier!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/upload', upload.single('siteZip'), async (req, res) => {
  if (req.file) {
    console.log('Uploaded: ', req.file.path);
    const newText = await unpackAndSavePlainText(
      req.file.path,
      req.file.originalname
    );
    const comparisonResults = compareWithCheckedArchive(newText);
    comparisonResults.sort((a, b) => a.uniquePercentage - b.uniquePercentage);
    const jsonFilePath = path.join(__dirname, 'comparisonResults.json');
    fs.writeFileSync(jsonFilePath, JSON.stringify(comparisonResults, null, 2));
    console.log(`Comparison results saved to ${jsonFilePath}`);
    res.json(comparisonResults);
  } else {
    res.status(400).send('No file uploaded.');
  }
});

async function unpackAndSavePlainText(filePath, originalFileName) {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();

  // Получаем имя архива без расширения
  const archiveName = path.basename(
    originalFileName,
    path.extname(originalFileName)
  );

  // Создаем объект для хранения информации о каждой странице
  const siteData = {
    name: archiveName, // Используем имя архива без расширения
    pages: {},
  };

  for (const entry of zipEntries) {
    if (entry.entryName.endsWith('.html')) {
      const content = zip.readAsText(entry);
      const plainText = stripTags(content);
      const pageName = path.basename(entry.entryName, '.html');
      siteData.pages[pageName] = plainText; // Сохраняем текст страницы в объект
    }
  }

  // Создаем JSON файл и записываем в него данные
  const jsonFileName = archiveName + '.json'; // Используем имя архива без расширения для JSON файла
  const jsonFilePath = path.join(checkedArchiveDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify(siteData, null, 2));
  console.log(`JSON file for ${siteData.name} saved to ${jsonFilePath}`);

  // Очистка папки uploads после обработки файла
  fs.unlinkSync(filePath);

  // Возвращаем новый текст для сравнения
  return Object.values(siteData.pages).join('');
}

function stripTags(html) {
  // Удаляем HTML теги
  let plainText = html.replace(/<[^>]*>?/gm, '');
  // Удаляем пустые строки и лишние пробелы
  plainText = plainText.replace(/\s+/g, ' ').trim(); // Удаляем лишние пробелы и обрезаем пробелы в начале и конце строки
  return plainText;
}
