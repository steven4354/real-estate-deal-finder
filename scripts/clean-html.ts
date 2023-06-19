import { promises as fs } from 'fs';
import cheerio from 'cheerio';

const outputFilePath = 'niche.com/output.txt';

export const cleanHtml = async (filePath: string): Promise<string> => {
  try {
    // Read the file
    const data = await fs.readFile(filePath, 'utf8');

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

    // Write the result into the output file
    fs.writeFile(outputFilePath, text, 'utf8')
      .then(() => console.log('Successfully extracted useful text.'))
      .catch(err => console.error(`Error writing file: ${err}`));

    return text;
  } catch (err) {
    console.error(`Error reading file: ${err}`);
    throw err;
  }
};
