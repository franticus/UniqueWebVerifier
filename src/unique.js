const fs = require('fs');
const path = require('path');

function compareText(text1, text2) {
  const text1Set = new Set(text1.split(''));
  const text2Set = new Set(text2.split(''));

  const commonChars = new Set([...text1Set].filter(char => text2Set.has(char)));
  const uniqueChars = new Set(
    [...text1Set, ...text2Set].filter(char => !commonChars.has(char))
  );

  const uniquePercentage = (uniqueChars.size / text1Set.size) * 100;
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
