// scraper.ts
import { promises as fs } from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

const url = 'https://www.niche.com/places-to-live/z/77020/';
const outputFilePath = '../niche.com/output.html';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  const $ = cheerio.load(data);

  // Remove <script> and <style> tags
  $('script, style').remove();

  // Replace <br>, <p>, <div>, and <li> tags with line breaks
  $('br, p, div, li').each((_, el) => {
    $(el).append('\n');
  });

  // Extract useful text from the HTML
  const text = $('body').text().trim();

  fs.writeFile(outputFilePath, text, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
      return;
    }
    console.log(`Successfully extracted useful text.`);
  });
});

fetchAndSaveHTML(url, outputFilePath);