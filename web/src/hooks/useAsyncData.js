import { useCallback, useEffect, useMemo, useState } from "react";

/*
  Load something asynchronous and expose the three states a page has to show:
  loading, ready, and could not load.

  Both the Hole Explorer and the Classification page need exactly this, so it
  lives here once rather than twice. Task 9 keeps the hook and changes only
  the loader it is handed:

    const holes = useAsyncData(fetchHoles);              // placeholder module
    const holes = useAsyncData(() => api.getHoles());    // Axios client

  `deps` is the list of values the loader depends on. Change one, for example
  the selected hole, and the hook re-runs and reports loading again rather
  than leaving the previous hole's rows on screen pretending they are current.

  Pass `skip: true` to hold off entirely, for the case where there is nothing
  selected yet and so nothing to load.
*/

function messageFor(problem) {
  /* Axios puts the useful part in different places depending on whether the
     request failed outright or came back with an error status. */
  if (problem?.response?.data?.detail) return String(problem.response.data.detail);
  if (problem?.message) return problem.message;
  return "Could not reach the backend. Confirm the API is running.";
}

export default function useAsyncData(loader, deps = [], { skip = false } = {}) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ key: null, data: null, error: null });

  /* One string that changes whenever the request should be re-issued. Keeping
     the run identity in the result is what lets the hook report "loading"
     for a new request without setting state from inside the effect. */
  const runKey = useMemo(
    () => `${attempt}:${JSON.stringify(deps)}`,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [attempt, JSON.stringify(deps)]
  );

  useEffect(() => {
    if (skip) return undefined;
    let cancelled = false;

    loader()
      .then((data) => {
        if (!cancelled) setResult({ key: runKey, data, error: null });
      })
      .catch((problem) => {
        if (!cancelled) setResult({ key: runKey, data: null, error: messageFor(problem) });
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, skip]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const settled = result.key === runKey;

  return {
    data: settled ? result.data : null,
    error: settled ? result.error : null,
    loading: !skip && !settled,
    retry,
  };
}
