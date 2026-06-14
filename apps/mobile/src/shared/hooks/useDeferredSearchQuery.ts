import { useDeferredValue, useRef, useState } from "react";
import { type TextInput } from "react-native";

export function useDeferredSearchQuery() {
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<TextInput | null>(null);
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const deferredSearchQuery = useDeferredValue(normalizedSearchQuery);
  const activeSearchQuery =
    normalizedSearchQuery.length === 0
      ? normalizedSearchQuery
      : deferredSearchQuery;

  function clearSearchQuery() {
    setSearchQuery("");

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  return {
    searchQuery,
    setSearchQuery,
    searchInputRef,
    activeSearchQuery,
    clearSearchQuery,
  };
}
