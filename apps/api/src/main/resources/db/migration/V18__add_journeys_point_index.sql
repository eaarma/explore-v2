ALTER TABLE journeys
    ADD COLUMN IF NOT EXISTS point geography(Point, 4326);

CREATE OR REPLACE FUNCTION sync_journey_coordinate_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    ELSIF NEW.point IS NOT NULL THEN
        NEW.latitude := ST_Y(NEW.point::geometry);
        NEW.longitude := ST_X(NEW.point::geometry);
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_journey_coordinate_columns ON journeys;

CREATE TRIGGER trg_sync_journey_coordinate_columns
BEFORE INSERT OR UPDATE ON journeys
FOR EACH ROW
EXECUTE FUNCTION sync_journey_coordinate_columns();

UPDATE journeys
SET latitude = ST_Y(point::geometry),
    longitude = ST_X(point::geometry)
WHERE point IS NOT NULL
  AND (latitude IS NULL OR longitude IS NULL);

UPDATE journeys
SET point = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE point IS NULL
  AND latitude IS NOT NULL
  AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_journeys_point ON journeys USING GIST (point);
