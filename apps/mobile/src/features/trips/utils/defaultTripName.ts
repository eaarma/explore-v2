type NamedTrip = {
  name: string;
};

const CUSTOM_TRIP_NAME_REGEX = /^custom trip(?:\s+(\d+))?$/i;

export function getDefaultTripName(trips: NamedTrip[]) {
  const matchingTripNumbers = trips
    .map((trip) => {
      const match = CUSTOM_TRIP_NAME_REGEX.exec(trip.name.trim());

      if (!match) {
        return null;
      }

      return Number(match[1] ?? 1);
    })
    .filter((value): value is number => value !== null && Number.isFinite(value));

  if (matchingTripNumbers.length === 0) {
    return "Custom trip";
  }

  const nextTripNumber = Math.max(...matchingTripNumbers) + 1;

  return `Custom trip ${nextTripNumber}`;
}
