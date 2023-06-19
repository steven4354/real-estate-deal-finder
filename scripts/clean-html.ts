// 77020 ZIP Code, Texas - Niche

// removeScriptsAndStyles.ts
import fs from 'fs';
import { JSDOM } from 'jsdom';

const inputFilePath = '77020 ZIP Code, Texas - Niche.html';
const outputFilePath = 'output.html';

fs.readFile(inputFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error(`Error reading file: ${err}`);
    return;
  }

  const dom = new JSDOM(data);
  const { document } = dom.window;

  const scriptTags = document.getElementsByTagName('script');
  const styleTags = document.getElementsByTagName('style');

  for (let i = scriptTags.length - 1; i >= 0; i--) {
    scriptTags[i].parentNode?.removeChild(scriptTags[i]);
  }

  for (let i = styleTags.length - 1; i >= 0; i--) {
    styleTags[i].parentNode?.removeChild(styleTags[i]);
  }

  const output = dom.serialize();

  fs.writeFile(outputFilePath, output, 'utf8', (err) => {
    if (err) {
      console.error(`Error writing file: ${err}`);
      return;
    }
    console.log(`Successfully removed <script> and <style> tags.`);
  });
});