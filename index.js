require("dotenv").config();
const express = require("express");
const axios = require("axios");
const NodeCache = require("node-cache");

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10분 캐시

const clientId = process.env.NAVER_CLIENT_ID;
const clientSecret = process.env.NAVER_CLIENT_SECRET;

app.get("/", (req, res) => {
  res.json({
    message:
      "Welcome to the Book Server! Use /books/:query to search for books.",
  });
});

app.get("/books/:query", async (req, res) => {
  const query = req.params.query.trim();
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Client ID and Secret are required" });
  }

  const cacheKey = `books_${query.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get(
      "https://openapi.naver.com/v1/search/book.json",
      {
        params: {
          query,
          display: 10,
          start: 1,
        },
        headers: {
          "X-Naver-Client-Id": clientId,
          "X-Naver-Client-Secret": clientSecret,
        },
      }
    );
    cache.set(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    console.error(`Error fetching data for query "${query}":`, error.message);
    res.status(500).json({ error: "Failed to fetch book data" });
  }
});

module.exports = app;
