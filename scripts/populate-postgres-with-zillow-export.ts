import { createReadStream } from "fs";
import csv from "csv-parser";
import pg from "pg";
import dotenv from "dotenv";
import { Readable } from "stream";
dotenv.config();

const csvFilePath = "../dataset/sugar-land-outskirts-small.csv";
const insertedFolderPath = "../dataset/inserted";

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
  INSERT INTO zillow (
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

async function processCsvFile(filePath: string) {
  const fileStream = createReadStream(filePath).pipe(csv());

  for await (const row of Readable.from(fileStream)) {
    // if row property type is not Single Family, skip
    if (row["Property type"] !== "Single Family") {
      continue;
    }

    // if property address contains UNIT, skip
    if (row["Street address"].includes("UNIT")) {
      continue;
    }

    // log row
    console.log(row);

    const values = [
      null, // sale_type
      row["Property type"],
      row["Street address"],
      row["City"],
      row["State"],
      row["Zip"],
      row["Property price (USD)"],
      row["Bedrooms"],
      row["Bathrooms"],
      null, // location
      row["Living area"],
      row["Lot/land area"],
      null, // year_built
      row["Number of days on Zillow"],
      row["Price per living area unit (USD)"],
      null, // hoa_month
      null, // status
      row["Property URL"],
      "Zillow", // source
      null, // latitude
      null, // longitude
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
  // inserts CSV data into the zillow table
  await processCsvFile(csvFilePath);
};

run();