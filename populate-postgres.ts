import { createReadStream } from "fs";
import csv from "csv-parser";
import pg from "pg";
import dotenv from "dotenv";
import { Readable } from "stream";
dotenv.config();

const csvFilePath = "./dataset/redfin_2023-06-04-16-16-37.csv";
const insertedFolderPath = "./dataset/inserted";

const client = new pg.Pool({
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  host: process.env.DATABASE_HOST,
  port: 5432,
  database: process.env.DATABASE_NAME,
  // TODO: secure connection
  ssl: {
    rejectUnauthorized: false,
  },
});

client.connect();

const insertRowQuery = `
  INSERT INTO redfin (
    sale_type,
    property_type,
    address,
    city,
    state_or_province,
    zip_or_postal_code,
    price,
    beds,
    baths,
    location,
    square_feet,
    lot_size,
    year_built,
    days_on_market,
    price_per_square_feet,
    hoa_month,
    status,
    url,
    source,
    latitude,
    longitude
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
    $11, $12, $13, $14, $15, $16, $17, $18, $19,
    $20, $21
  )
  ON CONFLICT (address) DO NOTHING;
`;

const createTableQuery = `
CREATE TABLE IF NOT EXISTS redfin (
  sale_type VARCHAR(255),
  property_type VARCHAR(255),
  address VARCHAR(255) UNIQUE,
  city VARCHAR(255),
  state_or_province VARCHAR(255),
  zip_or_postal_code VARCHAR(255),
  price VARCHAR(255),
  beds VARCHAR(255),
  baths VARCHAR(255),
  location VARCHAR(255),
  square_feet VARCHAR(255),
  lot_size VARCHAR(255),
  year_built VARCHAR(255),
  days_on_market VARCHAR(255),
  price_per_square_feet VARCHAR(255),
  hoa_month VARCHAR(255),
  status VARCHAR(255),
  url VARCHAR(255),
  source VARCHAR(255),
  latitude VARCHAR(255),
  longitude VARCHAR(255)
);
`;

const createBlackListAddressQuery = `
CREATE TABLE IF NOT EXISTS blacklist_address (
  address VARCHAR(255)
)
`;

const createReviewsTableQuery = `
CREATE TABLE IF NOT EXISTS reviews_address (
  address VARCHAR(255),
  reviews_link VARCHAR(255)
)
`;

async function processCsvFile(filePath: string) {
  const fileStream = createReadStream(filePath).pipe(csv());

  for await (const row of Readable.from(fileStream)) {
    // log row
    console.log(row);

    const values = [
      row["SALE TYPE"],
      row["PROPERTY TYPE"],
      row["ADDRESS"],
      row["CITY"],
      row["STATE OR PROVINCE"],
      row["ZIP OR POSTAL CODE"],
      row["PRICE"],
      row["BEDS"],
      row["BATHS"],
      row["LOCATION"],
      row["SQUARE FEET"],
      row["LOT SIZE"],
      row["YEAR BUILT"],
      row["DAYS ON MARKET"],
      row["$/SQUARE FEET"],
      row["HOA/MONTH"],
      row["STATUS"],
      row[
        "URL (SEE https://www.redfin.com/buy-a-home/comparative-market-analysis FOR INFO ON PRICING)"
      ],
      row["SOURCE"],
      row["LATITUDE"],
      row["LONGITUDE"],
    ];

    try {
      await client.query(insertRowQuery, values);
    } catch (err) {
      throw err;
    }
  }

  console.log("CSV file successfully processed");
}

const run = async () => {
  await client.query(createTableQuery);
  await client.query(createBlackListAddressQuery);
  await client.query(createReviewsTableQuery);

  // inserts redfin csv into postgres
  await processCsvFile(csvFilePath);
};

run();
