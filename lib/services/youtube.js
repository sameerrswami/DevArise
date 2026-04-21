export class YouTubeService {
  baseUrl = "https://www.googleapis.com/youtube/v3";

  constructor() {
    this.apiKeys = process.env.YOUTUBE_API_KEYS 
      ? process.env.YOUTUBE_API_KEYS.split(",").filter(Boolean) 
      : [];
  }

  getRandomApiKey() {
    return this.apiKeys[Math.floor(Math.random() * this.apiKeys.length)];
  }

  async searchVideos(query, maxResults = 20) {
    try {
      // Pick one random API key for the whole request
      const apiKey = this.getRandomApiKey();
      if (!apiKey) {
        console.error("Missing YouTube API keys in environment variables (.env)");
        return [];
      }

      const searchUrl = `${this.baseUrl}/search?part=snippet&type=video&q=${encodeURIComponent(
        query,
      )}&maxResults=${maxResults}&key=${apiKey}&order=relevance&videoDuration=medium`;

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      console.log("YouTube Search Response:", searchData); // Debug log

      if (!searchData.items || searchData.items.length === 0) {
        console.error("No items found or API error:", searchData); // Debug log
        return [];
      }

      // Get video IDs for duration fetching
      const videoIds = searchData.items
        .map((item) => item.id.videoId)
        .join(",");

      const detailsUrl = `${this.baseUrl}/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      console.log("YouTube Details Response:", detailsData); // Debug log

      // Combine search results with video details
      return searchData.items.map((item, index) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        publishedAt: item.snippet.publishedAt,
        duration: detailsData.items[index]?.contentDetails.duration || "PT0S",
      }));
    } catch (error) {
      console.error("YouTube API Error:", error);
      return [];
    }
  }

  formatDuration(isoDuration) {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  async generateSmartQuery(originalQuery, language) {
    const baseQueries = [
      `${originalQuery} tutorial`,
      `${originalQuery} complete course`,
      `${originalQuery} beginner guide`,
      `${originalQuery} fundamentals`,
      `${originalQuery} step by step`,
    ];

    if (language && language !== "en") {
      const languageMap = {
        hi: "hindi",
        es: "spanish",
        fr: "french",
        de: "german",
        pt: "portuguese",
        ar: "arabic",
      };
      const langName = languageMap[language] || language;
      return baseQueries.map((query) => `${query} in ${langName}`);
    }

    return baseQueries;
  }
}
