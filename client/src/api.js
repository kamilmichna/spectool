async function handleResponse(response, fallbackMessage) {
  if (!response.ok) {
    const message = `${fallbackMessage} (${response.status})`;
    throw new Error(message);
  }
  return response.json();
}

export async function fetchSpecs() {
  const response = await fetch("/api/specs");
  return handleResponse(response, "Failed to fetch specs");
}

export async function fetchFile(filePath) {
  const response = await fetch(
    `/api/file?path=${encodeURIComponent(filePath)}`,
  );
  return handleResponse(response, "Failed to fetch file");
}

export async function fetchSearch(query) {
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  return handleResponse(response, "Failed to search");
}
