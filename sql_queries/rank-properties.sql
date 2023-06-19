WITH location_data AS (
  SELECT
    address,
    city,
    state_or_province,
    zip_or_postal_code,
    CAST(latitude AS FLOAT) AS latitude,
    CAST(longitude AS FLOAT) AS longitude,
    CAST(price AS INTEGER) AS price,
    CAST(square_feet AS INTEGER) AS square_feet,
    (CAST(price AS INTEGER) / CAST(square_feet AS INTEGER)) AS price_per_sqft
  FROM
    redfin
),
distance_data AS (
  SELECT
    address,
    SQRT(
      POW(CAST(latitude AS FLOAT) - :target_latitude, 2) +
      POW(CAST(longitude AS FLOAT) - :target_longitude, 2)
    ) AS distance
  FROM
    location_data
),
score_data AS (
  SELECT
    address,
    distance,
    ABS(CAST(price AS INTEGER) - :target_price) AS price_difference,
    ABS(price_per_sqft - :target_price_per_sqft) AS price_per_sqft_difference
  FROM
    distance_data
    JOIN location_data USING (address)
)
SELECT
  address,
  city,
  state_or_province,
  zip_or_postal_code,
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