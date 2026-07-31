import { handleVercelRequest } from "../server/index.js";

export default async function handler(request, response) {
  return handleVercelRequest(request, response);
}
