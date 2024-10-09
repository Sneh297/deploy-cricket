import express from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import jsdom from 'jsdom';

dotenv.config();
const app = express();

const { JSDOM } = jsdom;

const extractCricketStats = async () => {
  try {
    const response = await fetch(
      'https://www.espncricinfo.com/records/tournament/batting-most-runs-career/icc-cricket-world-cup-2023-24-15338'
    );
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    const htmlContent = await response.text();
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    const tableRows = document.querySelectorAll('tr');

    if (tableRows.length > 0) {
      const statsData = [];

      tableRows.forEach((row) => {
        const cells = row.querySelectorAll('th, td');
        if (cells.length >= 6) {
          const playerName = cells[0].textContent.trim().replace(/\s+/g, ' ');
          const runs = cells[5].textContent.trim().replace(/\s+/g, ' ');
          statsData.push({ player: playerName, runs: runs });
        }
      });
      statsData.shift();
      const jsonData = {
        statsData,
      };

      // fs.writeFileSync('cricket_stats.json', JSON.stringify(jsonData, null, 2));
      console.log(
        `Successfully extracted stats for ${statsData.length} players and saved to cricket_stats.json`
      );

      return jsonData; // Return the data instead of logging it
    } else {
      throw new Error('No table rows were found in the HTML content');
    }
  } catch (error) {
    console.error('There was an error:', error);
    throw error; // Rethrow the error to be caught by the API route
  }
};

app.use(express.static('dist'));

app.get('/api', async (req, res) => {
  try {
    const stats = await extractCricketStats();
    res.json(stats);
  } catch (error) {
    res
      .status(500)
      .json({ error: 'An error occurred while fetching cricket stats' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server Started on PORT:${process.env.PORT}`);
});
