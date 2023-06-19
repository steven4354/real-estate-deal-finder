To write a SQL query that gives you the optimal location closest to a coordinate, price, and sq ft/price, you'll need a table with columns for the location's coordinates (latitude and longitude), price, and square footage. Let's assume you have a table called `locations` with the following columns:

- id (integer)
- latitude (float)
- longitude (float)
- price (float)
- square_footage (float)

Here's a SQL query that calculates the distance to a given coordinate, price, and sq ft/price, and orders the results by the calculated score:

```sql
WITH location_data AS (
  SELECT
    id,
    latitude,
    longitude,
    price,
    square_footage,
    (price / square_footage) AS price_per_sqft
  FROM
    locations
),
distance_data AS (
  SELECT
    id,
    SQRT(
      POW(latitude - :target_latitude, 2) +
      POW(longitude - :target_longitude, 2)
    ) AS distance
  FROM
    location_data
),
score_data AS (
  SELECT
    id,
    distance,
    ABS(price - :target_price) AS price_difference,
    ABS(price_per_sqft - :target_price_per_sqft) AS price_per_sqft_difference
  FROM
    distance_data
    JOIN location_data USING (id)
)
SELECT
  id,
  distance,
  price_difference,
  price_per_sqft_difference,
  (distance * :distance_weight) +
  (price_difference * :price_weight) +
  (price_per_sqft_difference * :price_per_sqft_weight) AS score
FROM
  score_data
ORDER BY
  score ASC
LIMIT 1;
```

Replace `:target_latitude`, `:target_longitude`, `:target_price`, and `:target_price_per_sqft` with your desired target values. Adjust the weights `:distance_weight`, `:price_weight`, and `:price_per_sqft_weight` to control the importance of each factor in the final score. The query will return the location with the lowest score, which represents the optimal location based on the given criteria.
