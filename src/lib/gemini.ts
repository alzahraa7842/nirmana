export async function getEmotionalReflection(journalText: string, temperature: number = 0.7) {
  try {
    const response = await fetch("/api/gemini/reflection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: journalText, temperature })
    });
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Keheningan berbicara tentang hal-hal yang belum dipahami. Bernapaslah dan temukan kedamaian.";
  }
}

export async function analyzeSentimentAndThemes(journalText: string) {
  try {
    const response = await fetch("/api/gemini/sentiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: journalText })
    });
    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Gemini Sentiment Error:", error);
    return null;
  }
}

export async function analyzeCanvasDrawing(base64Image: string) {
  try {
    const response = await fetch("/api/analyze-canvas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });
    
    if (!response.ok) throw new Error("Failed to analyze canvas");
    
    return await response.json();
  } catch (error) {
    console.error("Canvas Analysis Error:", error);
    return null;
  }
}
