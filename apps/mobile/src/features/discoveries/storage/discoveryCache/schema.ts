export function getCreateLocationDiscoveriesTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} location_discoveries (
      userId TEXT NOT NULL,
      locationId INTEGER NOT NULL,
      title TEXT,
      discoveredAt TEXT NOT NULL,
      distanceMeters REAL,
      PRIMARY KEY (userId, locationId)
    );
  `;
}

export function getCreateJourneyCompletionsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} journey_completions (
      userId TEXT NOT NULL,
      journeyId INTEGER NOT NULL,
      title TEXT,
      totalLocations INTEGER,
      completedAt TEXT NOT NULL,
      PRIMARY KEY (userId, journeyId)
    );
  `;
}

export function getCreatePendingOfflineDiscoveriesTableSql(
  ifNotExists = "",
) {
  return `
    CREATE TABLE ${ifNotExists} pending_location_discoveries (
      userId TEXT NOT NULL,
      locationId INTEGER NOT NULL,
      discoveredAt TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracyMeters REAL NOT NULL,
      PRIMARY KEY (userId, locationId)
    );
  `;
}

export function getCreateActiveItemsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} active_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK (item_type IN ('LOCATION', 'JOURNEY')),
      item_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, item_type, item_id)
    );
  `;
}

export function getCreateTripsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;
}

export function getCreateTripLocationsTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} trip_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (trip_id, location_id)
    );
  `;
}

export function getCreateTripJourneysTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} trip_journeys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      journey_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (trip_id, journey_id)
    );
  `;
}

export function getCreateActiveTripSelectionTableSql(ifNotExists = "") {
  return `
    CREATE TABLE ${ifNotExists} active_trip_selection (
      user_id TEXT PRIMARY KEY NOT NULL,
      trip_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `;
}

export function getCreateLocationDiscoveriesIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_location_discoveries_user_discoveredAt
      ON location_discoveries (userId, discoveredAt DESC);
  `;
}

export function getCreateJourneyCompletionsIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_journey_completions_user_completedAt
      ON journey_completions (userId, completedAt DESC);
  `;
}

export function getCreatePendingOfflineDiscoveriesIndexSql(
  ifNotExists = "",
) {
  return `
    CREATE INDEX ${ifNotExists} idx_pending_location_discoveries_user_discoveredAt
      ON pending_location_discoveries (userId, discoveredAt ASC);
  `;
}

export function getCreateActiveItemsCreatedAtIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_active_items_user_created_at
      ON active_items (user_id, created_at DESC);
  `;
}

export function getCreateTripsUpdatedAtIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_trips_user_updated_at
      ON trips (user_id, updated_at DESC);
  `;
}

export function getCreateTripLocationsSortOrderIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_trip_locations_trip_sort_order
      ON trip_locations (trip_id, sort_order ASC);
  `;
}

export function getCreateTripJourneysSortOrderIndexSql(ifNotExists = "") {
  return `
    CREATE INDEX ${ifNotExists} idx_trip_journeys_trip_sort_order
      ON trip_journeys (trip_id, sort_order ASC);
  `;
}
