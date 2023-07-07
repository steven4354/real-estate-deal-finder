import { createReadStream } from "fs";
import csv from "csv-parser";
import pg from "pg";
import dotenv from "dotenv";
import { Readable } from "stream";
import { fetchNicheZipcode } from "./extract-niche-html";
import { cleanHtml } from "./clean-html";
import { Configuration, OpenAIApi } from "openai";
const path = require('path');
dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);


const csvFilePath = path.join(process.cwd(), "./dataset/sugar-land-outskirts-small.csv");
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
      // insert into zillow table
      await client.query(insertRowQuery, values);

      try {
        // check if zipcode already exists in the niche table
        const existsResponse = await client.query("SELECT COUNT(*) FROM niche WHERE zip=$1", [row["Zip"]])
        if (existsResponse.rows[0].count <= 0) {
          // it doesnt exist 
          console.log("zip code doesn't exists in niche table: ", row["Zip"])
          
          // extract niche data
          const filePath = await fetchNicheZipcode(`https://www.niche.com/places-to-live/z/${row["Zip"]}/`)
          const text = await cleanHtml(filePath)

          const residentsFilePath = await fetchNicheZipcode(`https://www.niche.com/places-to-live/z/${row["Zip"]}/residents`)
          const residentsText = await cleanHtml(residentsFilePath)


          // open ai request
          const openAiResponse = await openai.createChatCompletion({
            model: "gpt-4-0613",
            max_tokens: 2048,
            messages: [{ role: "user", content: `below is a website showing real estate data for a given zip code. what is the median household income for this zip code? what is the score? what is the unemployment rate? what is the poverty rate? what is the non-citizens percentage? : \n\n ${text} \n\n ${residentsText}` }],
            functions: [
              {
                name: "calculate_zipcode_popularity",
                description: "determine the popularity of a location based on the median household income for the given zip code and the score for the given zip code",
                parameters: {
                  type: "object",
                  properties: {
                    median_income: {
                      type: "number",
                      description: "the median household income for the given zipcode"
                    },
                    score: {
                      type: "string",
                      description: "the score for the given zipcode, i.e A+, A, B -, C, D+, etc"
                    },
                    unemployment_rate: {
                      type: "number",
                      description: "the unemployment rate as a number from 0 to 100 that represents the percentage"
                    },
                    poverty_rate: {
                      type: "number",
                      description: "the poverty rate as a number from 0 to 100 that represents the percentage"
                    },
                    non_citizens: {
                      type: "number",
                      description: "the Non-Citizens as a number from 0 to 100 that represents the percentage"
                    },
                    racial_diversities: {
                      type: "array",
                      description: "an array of json objects that represent the top 4 racial diversities for the given zipcode. i.e [{name: Hispanic, percentage: 20}, {name: White, percentage: 30},...]",
                      items: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                            description: "the name of the racial diversity"
                          },
                          percentage: {
                            type: "number",
                            description: "the percentage of the racial diversity"
                          }
                        }
                      }
                    }
                  },
                  required: ["median_income", "score","unemployment_rate","poverty_rate","non_citizens","racial_diversities"]
                }
              }
            ],
            function_call: { name: "calculate_zipcode_popularity" }
          });

          const link = `https://www.niche.com/places-to-live/z/${row["Zip"]}/`
          let openApiResponse = openAiResponse.data.choices[0].message?.function_call?.arguments as any

          console.log({ openApiResponse })
          openApiResponse = JSON.parse(openApiResponse)
          console.log({ openApiResponse })

          const medianIncome = openApiResponse.median_income
          const score = openApiResponse.score
          const unemployment_rate = openApiResponse.unemployment_rate
          const poverty_rate = openApiResponse.poverty_rate
          const non_citizens = openApiResponse.non_citizens
          const racial_diversities = openApiResponse.racial_diversities



          

          if (score && medianIncome) {
            const insertNicheQuery = "INSERT INTO niche(zip,link,score,median_income,non_citizen,unemployment_rate,poverty_rate,racial_diversity) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)"
            await client.query(insertNicheQuery,
               [row["Zip"],
                link,
                 score,
                  medianIncome,
                  non_citizens,
                  unemployment_rate,
                  poverty_rate,
                  racial_diversities
                ])
          }
        } else {
          console.log("zip code exits:", row["Zip"])
        }
      } catch (e) {
        console.log({ e })
      }
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