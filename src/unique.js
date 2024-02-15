const fs = require('fs');
const path = require('path');
const stopwords = require('stopword');

function preprocessText(text) {
  let words = text.toLowerCase().split(/\s+/);
  words = words.map(word => word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''));
  words = stopwords.removeStopwords(words); // Удаление стоп-слов
  return words;
}

function compareText(text1, text2) {
  const words1 = preprocessText(text1);
  const words2 = preprocessText(text2);

  const text1Words = new Set(words1);
  const text2Words = new Set(words2);

  const commonWords = new Set(
    [...text1Words].filter(word => text2Words.has(word))
  );
  const allUniqueWords = new Set([...text1Words, ...text2Words]);

  // Исправленный расчет уникального процента
  const uniquePercentage =
    ((allUniqueWords.size - commonWords.size) / allUniqueWords.size) * 100;

  return Math.floor(uniquePercentage.toFixed(2));
}

function jaccardIndex(setA, setB) {
  const intersection = new Set([...setA].filter(item => setB.has(item)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function compareWithJaccardIndex(text1, text2) {
  const words1 = new Set(preprocessText(text1));
  const words2 = new Set(preprocessText(text2));
  const jaccard = jaccardIndex(words1, words2);
  return Math.ceil((jaccard * 100).toFixed(2));
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
        const combinedText = Object.values(jsonContent.pages).join(' ');
        const uniquePercentage = compareText(newText, combinedText);
        const jaccardPercentage = compareWithJaccardIndex(
          newText,
          combinedText
        );
        results.push({
          name: jsonContent.name,
          uniquePercentage: uniquePercentage + '%',
          jaccardPercentage,
        });
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

module.exports = {
  compareText,
  compareWithCheckedArchive,
  compareWithJaccardIndex,
};
