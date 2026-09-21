/**
 * Creates a JSON response with appropriate headers.
 * All JSON responses are no-store to ensure fresh data on admin updates.
 * @param {object} data - The object to serialize as JSON.
 * @param {number} status - HTTP status code (default 200).
 * @returns {Response} A Response object ready to return to the client.
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
