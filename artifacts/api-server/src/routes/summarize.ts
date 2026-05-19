import { Router, type IRouter } from "express";
import { Groq } from "groq-sdk";

const router: IRouter = Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/summarize-bodily-recording", async (req, res): Promise<void> => {
  try {
    const { bodyPart, transcript } = req.body;

    if (!bodyPart || !transcript) {
      res.status(400).json({ summary: "Missing bodyPart or transcript" });
      return;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful medical assistant summarizing a user's spoken bodily symptoms for a specific body part. Summarize the symptoms succinctly.`
        },
        {
          role: "user",
          content: `Body Part: ${bodyPart}\nSymptoms transcript: ${transcript}`
        }
      ],
      model: "llama3-8b-8192",
    });

    const summary = completion.choices[0]?.message?.content || "No summary available.";

    res.json({ summary });
  } catch (error) {
    console.error("Error summarizing with Groq:", error);
    res.status(500).json({ summary: "Error generating summary" });
  }
});

export default router;
