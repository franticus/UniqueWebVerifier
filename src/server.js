const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');
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

const upload = multer({ dest: uploadDir });

app.get('/', (req, res) => {
  res.send('Welcome to the UniqueWebVerifier!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/upload', upload.single('siteZip'), async (req, res) => {
  if (req.file) {
    console.log('Uploaded: ', req.file.path);
    await unpackAndSavePlainText(req.file.path);
    res.send(`File uploaded successfully: ${req.file.originalname}`);
  } else {
    res.status(400).send('No file uploaded.');
  }
});

async function unpackAndSavePlainText(filePath) {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    if (entry.entryName.endsWith('.html')) {
      const content = zip.readAsText(entry);
      const plainText = stripTags(content);
      const fileName = path.basename(entry.entryName, '.html') + '.txt';
      const outputPath = path.join(checkedArchiveDir, fileName);
      fs.writeFileSync(outputPath, plainText);
      console.log(`PlainText for ${entry.entryName} saved to ${outputPath}`);
    }
  }

  // Очистка папки uploads после обработки файла
  fs.unlinkSync(filePath);
}

function stripTags(html) {
  // Удаляем HTML теги
  let plainText = html.replace(/<[^>]*>?/gm, '');
  // Удаляем пустые строки и лишние пробелы
  plainText = plainText.replace(/\s+/g, ' ').trim(); // Удаляем лишние пробелы и обрезаем пробелы в начале и конце строки
  return plainText;
}
