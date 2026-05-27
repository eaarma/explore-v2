import { getDatabase } from "@/src/features/discoveries/storage/discoveryCache/db";

export type ActiveItemType = "LOCATION" | "JOURNEY";

export type ActiveItem = {
  id: number;
  userId: string;
  itemType: ActiveItemType;
  itemId: number;
  createdAt: string;
};

type ActiveItemRow = ActiveItem;

export async function getActiveItems(userId: string) {
  if (!userId) {
    return [];
  }

  const database = await getDatabase();

  return database.getAllAsync<ActiveItemRow>(
    `
      SELECT
        id,
        user_id AS userId,
        item_type AS itemType,
        item_id AS itemId,
        created_at AS createdAt
      FROM active_items
      WHERE user_id = ?
      ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );
}

export async function getActiveItem(
  userId: string,
  itemType: ActiveItemType,
  itemId: number,
) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();

  return database.getFirstAsync<ActiveItemRow>(
    `
      SELECT
        id,
        user_id AS userId,
        item_type AS itemType,
        item_id AS itemId,
        created_at AS createdAt
      FROM active_items
      WHERE user_id = ?
        AND item_type = ?
        AND item_id = ?
    `,
    [userId, itemType, itemId],
  );
}

export async function markActiveItem({
  userId,
  itemType,
  itemId,
  createdAt = new Date().toISOString(),
}: {
  userId: string;
  itemType: ActiveItemType;
  itemId: number;
  createdAt?: string;
}) {
  if (!userId) {
    return null;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      INSERT INTO active_items (
        user_id,
        item_type,
        item_id,
        created_at
      ) VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, item_type, item_id)
      DO UPDATE SET created_at = excluded.created_at
    `,
    [userId, itemType, itemId, createdAt],
  );

  return getActiveItem(userId, itemType, itemId);
}

export async function clearActiveItem(
  userId: string,
  itemType: ActiveItemType,
  itemId: number,
) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM active_items
      WHERE user_id = ?
        AND item_type = ?
        AND item_id = ?
    `,
    [userId, itemType, itemId],
  );
}

export async function clearActiveItems(userId: string) {
  if (!userId) {
    return;
  }

  const database = await getDatabase();

  await database.runAsync(
    `
      DELETE FROM active_items
      WHERE user_id = ?
    `,
    [userId],
  );
}
