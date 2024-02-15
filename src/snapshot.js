const puppeteer = require('puppeteer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

async function takeSnapshot(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(url);

  // Получаем HTML-код страницы
  const htmlContent = await page.content();

  // Получаем стили страницы
  const styles = await page.evaluate(() => {
    const styleSheets = Array.from(document.styleSheets);
    const cssRules = styleSheets.flatMap(sheet => Array.from(sheet.cssRules));
    const styles = cssRules.map(rule => rule.cssText).join('');
    return styles;
  });

  // Получаем хэши для HTML-кода и стилей
  const htmlHash = calculateHash(htmlContent);
  const stylesHash = calculateHash(styles);

  await browser.close();

  return { htmlHash, stylesHash };
}

function calculateHash(data) {
  return crypto.createHash('md5').update(data).digest('hex');
}

async function compareSnapshots(url1, url2) {
  // Создаем снимки для каждой страницы
  const snapshot1 = await takeSnapshot(url1);
  const snapshot2 = await takeSnapshot(url2);

  // Вычисляем процент уникальности структуры DOM и CSS стилей
  const domSimilarity = calculateSimilarity(
    snapshot1.htmlHash,
    snapshot2.htmlHash
  );
  const stylesSimilarity = calculateSimilarity(
    snapshot1.stylesHash,
    snapshot2.stylesHash
  );

  console.log(`Процент уникальности структуры DOM: ${domSimilarity}%`);
  console.log(`Процент уникальности CSS стилей: ${stylesSimilarity}%`);
}

function calculateSimilarity(hash1, hash2) {
  const commonChars = hash1.split('').filter(char => hash2.includes(char));
  const similarity = (commonChars.length / hash1.length) * 100;
  return similarity.toFixed(2);
}

module.exports = {
  compareSnapshots,
};
