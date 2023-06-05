WITH location_data AS (
	SELECT
		address,
		city,
		state_or_province,
		zip_or_postal_code,
		CAST(latitude AS FLOAT) AS latitude,
		CAST(longitude AS FLOAT) AS longitude,
		CAST(NULLIF(price,
				'') AS INTEGER) AS price,
		CAST(NULLIF(square_feet,
				'') AS INTEGER) AS square_feet,
		(CAST(NULLIF(price,
					'') AS INTEGER) / CAST(NULLIF(square_feet,
					'') AS INTEGER)) AS price_per_sqft
	FROM
		redfin
),
distance_data AS (
	SELECT
		address,
		SQRT(POW(CAST(latitude AS FLOAT) - 29.716944,
				2) + POW(CAST(longitude AS FLOAT) - (- 122.4194),
				2)) AS distance
	FROM
		location_data
),
score_data AS (
	SELECT
		location_data.address,
		location_data.city,
		location_data.state_or_province,
		location_data.zip_or_postal_code,
		distance,
		ABS(CAST(price AS INTEGER) - 1) AS price_difference,
		ABS(COALESCE(price_per_sqft,
				0) - 1) AS price_per_sqft_difference
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
	(distance * 0.5) + (COALESCE(price_difference, 0) * 0.3) + (price_per_sqft_difference * 0.2) AS score
FROM
	score_data
ORDER BY
	score ASC
LIMIT 10;

/*
target_latitude, default value: 29.716944
target_longitude, default value: -95.402778
target_price, default value: 1000000 ($1,000,000)
target_price_per_sqft, default value: 1000 ($1,000 per square foot)
distance_weight, default value: 0.5 (weights add up to 1)
price_weight, default value: 0.3
price_per_sqft_weight, default value: 0.2

(put at 1 to indicate lower prices is better)
target_price_per_sqft, default value: 1
target_price, default value:  1
*/