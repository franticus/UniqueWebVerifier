const fs = require('fs');
const path = require('path');

function compareText(text1, text2) {
  const words1 = text1.split(/\s+/);
  const words2 = text2.split(/\s+/);

  const text1Words = new Set(words1);
  const text2Words = new Set(words2);

  const commonWords = new Set(
    [...text1Words].filter(word => text2Words.has(word))
  );

  const allUniqueWords = new Set([...text1Words, ...text2Words]);

  const uniquePercentage =
    ((allUniqueWords.size - commonWords.size) /
      (text1Words.size + text2Words.size)) *
    100;

  return uniquePercentage.toFixed(2);
}

function compareWithCheckedArchive(newText) {
  const checkedArchiveDir = path.join(__dirname, 'checkedArchive');
  const files = fs.readdirSync(checkedArchiveDir);

  const results = [];

  files.forEach(file => {
    const filePath = path.join(checkedArchiveDir, file);
    try {
      const jsonContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (jsonContent && jsonContent.name && jsonContent.pages) {
        const uniquePercentage = compareText(
          newText,
          Object.values(jsonContent.pages).join('')
        );
        results.push({ name: jsonContent.name, uniquePercentage });
      } else {
        console.error(`Invalid JSON format in file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error reading JSON file ${filePath}:`, error);
    }
  });

  // Записываем результаты сравнения в JSON файл в корне проекта
  const outputFilePath = path.join(__dirname, 'comparisonResults.json');
  fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
  console.log(`Comparison results saved to ${outputFilePath}`);

  return results;
}

module.exports = { compareText, compareWithCheckedArchive };
