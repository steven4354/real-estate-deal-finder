import { promises as fs } from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import cheerio from 'cheerio';
const path = require('path');

puppeteer.use(StealthPlugin());

const url = 'https://www.niche.com/places-to-live/z/77020/';
const outputFilePath = path.join(process.cwd(), './niche.com/output.html');

export async function fetchNicheZipcode(zipcode: string) {
  return await fetchAndSaveHTML(`https://www.niche.com/places-to-live/z/${zipcode}/`, outputFilePath)
}
async function fetchAndSaveHTML(url: string, outputFilePath: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);

  const html = await page.content();
  const $ = cheerio.load(html);

  // Remove <script> and <style> tags
  $('script, style').remove();

  // Replace <br>, <p>, <div>, and <li> tags with line breaks
  $('br, p, div, li').each((_, el) => {
    $(el).append('\n');
  });

  // Extract useful text from the HTML
  const text = $('body').text().trim();

  try {
    await fs.writeFile(outputFilePath, text, 'utf8');
    console.log(`Successfully extracted useful text.`);
  } catch (err) {
    console.error(`Error writing file: ${err}`);
  }

  await browser.close();
  return outputFilePath
}

fetchAndSaveHTML(url, outputFilePath);
