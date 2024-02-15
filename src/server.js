const express = require('express');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3001;

// Убедитесь, что директория 'uploads' существует
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });

app.get('/', (req, res) => {
  res.send('Welcome to the UniqueWebVerifier!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

app.post('/upload', upload.single('siteZip'), (req, res) => {
  if (req.file) {
    console.log('Uploaded: ', req.file.path);
    unpackAndAnalyzeArchive(req.file.path)
      .then(() =>
        res.send(`File uploaded successfully: ${req.file.originalname}`)
      )
      .catch(error => {
        console.error('Error processing the file', error);
        res.status(500).send('Error processing the file');
      });
  } else {
    res.status(400).send('No file uploaded.');
  }
});

async function unpackAndAnalyzeArchive(filePath) {
  const zip = new AdmZip(filePath);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    if (entry.entryName.endsWith('.html')) {
      const content = zip.readAsText(entry);
      const text = extractTextFromHtml(content);
      await analyzeAndCompareHash(entry.entryName, text); // Обеспечиваем асинхронную обработку
    }
  }
}

function analyzeAndCompareHash(entryName, text) {
  try {
    const hash = generateHash(text);
    const hashes = readHashes();

    if (hash in hashes) {
      console.log(
        `Содержимое ${entryName} не уникально. Найдено совпадение: ${hashes[hash]}`
      );
    } else {
      console.log(`Содержимое ${entryName} уникально и сохранено.`);
      hashes[hash] = entryName;
      saveHashes(hashes);
    }
  } catch (error) {
    console.error('Ошибка при анализе и сравнении хеша:', error);
    throw error; // Перебрасываем ошибку для последующей обработки
  }
}
