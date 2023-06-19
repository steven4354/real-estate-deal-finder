```
public	blacklist_address	address	character varying
public	redfin	sale_type	character varying
public	redfin	property_type	character varying
public	redfin	address	character varying
public	redfin	city	character varying
public	redfin	state_or_province	character varying
public	redfin	zip_or_postal_code	character varying
public	redfin	price	character varying
public	redfin	beds	character varying
public	redfin	baths	character varying
public	redfin	location	character varying
public	redfin	square_feet	character varying
public	redfin	lot_size	character varying
public	redfin	year_built	character varying
public	redfin	days_on_market	character varying
public	redfin	price_per_square_feet	character varying
public	redfin	hoa_month	character varying
public	redfin	status	character varying
public	redfin	url	character varying
public	redfin	source	character varying
public	redfin	latitude	character varying
public	redfin	longitude	character varying
public	reviews_address	address	character varying
public	reviews_address	reviews_link	character varying
```

above is the database

update the below query to also show the reviews link for the address, you can figure out which reviews to show by seeing if it matches the address, make sure to ignore cases (so that lower case and uppercase also works)

```sql
WITH location_data AS (
	SELECT
		address,
		city,
		state_or_province,
		zip_or_postal_code,
		CAST(latitude AS FLOAT) AS latitude,
		CAST(longitude AS FLOAT) AS longitude,
		CAST(NULLIF(price, '') AS INTEGER) AS price,
		CAST(NULLIF(square_feet, '') AS INTEGER) AS square_feet,
		(CAST(NULLIF(price, '') AS INTEGER) / CAST(NULLIF(square_feet, '') AS INTEGER)) AS price_per_sqft
	FROM
		redfin
),
distance_data AS (
	SELECT
		address,
		SQRT(POW(CAST(latitude AS FLOAT) - 29.716944, 2) + POW(CAST(longitude AS FLOAT) - (- 122.4194), 2)) AS distance
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
		ABS(CAST(location_data.price AS INTEGER) - 1) AS price_difference,
		ABS(COALESCE(location_data.price_per_sqft, 0) - 1) AS price_per_sqft_difference,
		redfin.url
	FROM
		distance_data
		JOIN location_data USING (address)
		JOIN redfin USING (address)
)
SELECT
	address,
	city,
	state_or_province,
	zip_or_postal_code,
	distance,
	price_difference,
	price_per_sqft_difference,
	(distance * 0.5) + (COALESCE(price_difference, 0) * 0.3) + (price_per_sqft_difference * 0.2) AS score,
	url
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
```