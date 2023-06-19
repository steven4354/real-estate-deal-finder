// removeScriptsAndStyles.ts
import fs from 'fs';
import cheerio from 'cheerio';

const inputFilePath = 'niche.com/77020 ZIP Code, Texas - Niche.html';
const outputFilePath = 'niche.com/output.txt';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  const $ = cheerio.load(data);

  // Remove <script> and <style> tags
  $('script, style, header, footer').remove();

  // Replace <br>, <p>, <div>, and <li> tags with line breaks
  $('br, p, div, li').each((_, el) => {
    $(el).append('\n');
  });

  // Extract useful text from the HTML
  let text = $('body').text().trim();

  // Replace multiple consecutive line breaks with a single line break
  text = text.replace(/\n{2,}/g, '\n');

  fs.writeFile(outputFilePath, text, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
      return;
    }
    console.log(`Successfully extracted useful text.`);
  });
});