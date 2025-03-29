require("dotenv").config();

const express = require("express");
const axios = require("axios");
const app = express();

const NodeCache = require("node-cache");
const cache = new NodeCache({ stdTTL: 600 }); // 10분 캐시

const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;
const port = process.env.PORT || 3000;

app.get("/books/:query", async (req, res) => {
  if (!req.params.query) {
    return res.status(400).json({ error: "Query is required" });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Client ID and Secret are required" });
  }

  const key = `books_${req.params.query}`;
  const cached = cache.get(key);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/book.json",
      {
        params: {
          query: req.params.query,
          display: 10, // Number of results (max 100)
          start: 1, // Start position
        },
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );
    cache.set(key, response.data);
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch book data" });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
