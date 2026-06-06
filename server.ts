import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware, increasing limit for base64 images
  app.use(express.json({ limit: "10mb" }));

  // API endpoints
  app.post("/api/recognize-digit", async (req, res) => {
    try {
      const { imageBase64 } = req.body;
      
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body" });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured on the server." });
      }

      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Strip the prefix if present (data:image/png;base64,...)
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

      const imagePart = {
        inlineData: {
          mimeType: "image/png",
          data: base64Data,
        },
      };

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        config: {
          maxOutputTokens: 5,
          temperature: 0.0,
        },
        contents: {
          parts: [
            imagePart,
            { text: "Return the integer number written in this image. Only output digits. If unclear, output -1." }
          ]
        },
      });

      let numberValue = -1;
      if (response && response.text) {
        let text = response.text.trim();
        // Extract all digits from the text just in case it answers with a sentence
        const match = text.match(/-?\d+/);
        if (match) {
           const parsed = parseInt(match[0], 10);
           if (!isNaN(parsed)) {
             numberValue = parsed;
           }
        }
      }

      res.json({ number: numberValue });
    } catch (error) {
      console.error("Error recognizing digit:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // For Express 4
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
