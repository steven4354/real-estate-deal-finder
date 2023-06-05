# real-estate-deal-finder

## why?

You have a list of redfin properties.

You spend hours scrolling through their list to find the property you want.

Wouldn't it be better if the properties were already "ranked" for you by the things you are interested in? - closeness to downtown, price, square feet, others

Using this you can import in redfin.csv properties and have it ranked for you.

You can also assign a "weight" to each property feature based on how important the feature is to you. For example if price is the #1 factor, put a larger weight for it.

## how it works

1. Put your redfin.csv export in `/dataset`

2. Get an empty postgres database and add the creds to a `.env` file. See `.env.example`.

3. Run "npm start"

## demo

You can see a working version of this at https://ebadecc052a86d67.dynaboard.app/
