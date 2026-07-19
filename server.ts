import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());

  // We lazily retrieve the API key when needed
  const apiKey = process.env.GEMINI_API_KEY;

  // API endpoint for AI component generation
  app.post('/api/generate-component', async (req, res) => {
    try {
      const { prompt, componentType, style } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      if (!apiKey) {
        return res.status(400).json({ 
          error: 'GEMINI_API_KEY environment variable is not set. Please configure it in the Secrets panel in AI Studio.' 
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const systemInstruction = `
You are an expert, award-winning frontend developer and UI/UX designer.
Generate a modern, highly polished, fully responsive, and visually stunning UI component based on the user's description.
Use only clean, standard Tailwind CSS utility classes.
Use standard Lucide-style or clean SVG inline icons (styled with Tailwind) for any graphics/visuals to make it look premium and native.
Ensure beautiful typography, generous padding, and eye-catching layout details.
Apply the requested visual style: "${style || 'modern slate'}".
IMPORTANT: Do NOT use markdown code blocks, backticks, or any explanation. Return ONLY the raw HTML string starting with a <div> and ending with </div>.
Do not include any markdown syntax, comments, explanations, or text outside the HTML.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Create a component for: ${prompt}. Type: ${componentType || 'widget'}`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const html = response.text || '';
      // Clean any accidental markdown block formatting if present
      let cleanedHtml = html.trim();
      if (cleanedHtml.startsWith('```html')) {
        cleanedHtml = cleanedHtml.substring(7);
      } else if (cleanedHtml.startsWith('```')) {
        cleanedHtml = cleanedHtml.substring(3);
      }
      if (cleanedHtml.endsWith('```')) {
        cleanedHtml = cleanedHtml.substring(0, cleanedHtml.length - 3);
      }
      cleanedHtml = cleanedHtml.trim();

      res.json({ html: cleanedHtml });
    } catch (error: any) {
      console.error('Error generating component:', error);
      res.status(500).json({ error: error.message || 'Failed to generate component' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
