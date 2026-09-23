import axios from "axios";

export async function searchScholarXIV(query: string) {
  const apiKey = process.env.SCHOLARXIV_API_KEY;

  if (!apiKey) {
    throw new Error("SCHOLARXIV_API_KEY is not configured");
  }

  const response = await axios.get(
    "https://www.scholarxiv.com/api/v1/papers/search",
    {
      params: {
        q: query,
        limit: 5,
      },
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );

  return response.data;
}
