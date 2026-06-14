export function toggleValueInArray<T>(current: readonly T[], value: T) {
  return current.includes(value)
    ? current.filter((item) => item !== value)
    : [...current, value];
}
