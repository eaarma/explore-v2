UPDATE locations
SET category = 'Urbex'
WHERE category IS NOT NULL
  AND LOWER(BTRIM(category)) = 'abandoned';

UPDATE journeys
SET category = 'Urbex'
WHERE category IS NOT NULL
  AND LOWER(BTRIM(category)) = 'abandoned';
