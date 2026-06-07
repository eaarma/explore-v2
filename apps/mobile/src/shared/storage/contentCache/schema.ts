export const DATABASE_NAME = "explore-content.db";
export const CONTENT_CACHE_SCHEMA_VERSION = 8;

export function getCreateSyncMetadataTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} sync_metadata (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `;
}

export function getCreateLocationsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} locations (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      imageUrl TEXT,
      imageUrls TEXT,
      traits TEXT,
      experience INTEGER,
      difficulty INTEGER,
      notes TEXT,
      status INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;
}

export function getCreateJourneysTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journeys (
      id INTEGER PRIMARY KEY NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      experience INTEGER,
      distance REAL,
      difficulty INTEGER,
      polyline TEXT,
      traits TEXT,
      notes TEXT,
      status INTEGER,
      createdAt TEXT,
      updatedAt TEXT
    );
  `;
}

export function getCreateJourneyLocationsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journey_locations (
      id INTEGER PRIMARY KEY NOT NULL,
      journeyId INTEGER NOT NULL,
      locationId INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL,
      longitude REAL,
      county TEXT,
      category TEXT,
      imageUrl TEXT,
      experience INTEGER,
      difficulty INTEGER,
      notes TEXT,
      status INTEGER,
      sortOrder INTEGER,
      FOREIGN KEY (journeyId) REFERENCES journeys(id) ON DELETE CASCADE
    );
  `;
}

export function getCreateJourneyLocationsIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_journey_locations_journeyId_sortOrder
      ON journey_locations (journeyId, sortOrder);
  `;
}
