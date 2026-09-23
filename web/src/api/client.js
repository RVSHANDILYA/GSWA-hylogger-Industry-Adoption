import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


export async function fetchHoles() {
  const response = await api.get("/holes");
  return response.data;
}


export async function fetchHole(holeId) {
  const response = await api.get(`/holes/${holeId}`);
  return response.data;
}


export async function fetchIntervals(holeId, { minConfidence } = {}) {
  const params =
    minConfidence == null
      ? undefined
      : { min_confidence: minConfidence };

  const response = await api.get(
    `/holes/${holeId}/intervals`,
    { params }
  );

  return response.data;
}