exports.askChatbot = async (req, res) => {
  try {
    const { message, role, userName, history, currentPage } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const userRole = (role || "guest").toLowerCase().replace(/[^a-z]/g, "");

    if (message === "__INIT__") {
      let welcomeText = `Hello ${userName || 'User'}! I'm your VedaEd Assistant. How can I help you today?`;
      if (currentPage) {
        welcomeText = `Hello ${userName || 'User'}! You are viewing a page. How can I help you?`;
      }
      return res.status(200).json({
        success: true,
        data: welcomeText,
        suggestions: []
      });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;

      const systemPrompt =
        `You are the VedaEd smart assistant. Help the current user answer their question ` +
        `clearly and concisely.\n` +
        `User role: ${userRole || "guest"}\n` +
        `User name: ${userName || "User"}\n` +
        `Current page/route: ${currentPage || "/"}\n` +
        `Respond in plain text. Use **bold** for important terms and use "- " bullet points ` +
        `for lists so the frontend renders them correctly. Keep answers short and practical.`;

      const apiUrl =
        `https://generativelanguage.googleapis.com/v1beta/models/` +
        `gemini-3.6-flash:generateContent?key=${apiKey}`;

      const historyText = Array.isArray(history) && history.length > 0
        ? history
            .map((m) => `${m.role === "user" ? "User" : "Veda"}: ${m.parts?.[0]?.text || ""}`)
            .join("\n")
        : "";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            ...(historyText
              ? [{ role: "user", parts: [{ text: historyText }] }]
              : []),
            { role: "user", parts: [{ text: `User: ${message}` }] },
          ],
          generationConfig: { maxOutputTokens: 800 },
        }),
      });

      const data = await response.json();

      if (!response.ok || data?.error) {
        console.error(
          "Chatbot Gemini API error:",
          data?.error?.message || `HTTP ${response.status}`
        );
        return res.status(200).json({
          success: true,
          data:
            "The AI assistant is currently unavailable due to a configuration problem. " +
            "Please contact the system administrator.",
        });
      }

      const llmText =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Could you try rephrasing your question?";

      return res.status(200).json({
        success: true,
        data: llmText,
      });
    } catch (llmError) {
      console.error("Chatbot LLM Error:", llmError);
      return res.status(200).json({
        success: true,
        data:
          "The AI assistant is currently unavailable. " +
          "Please check that the Gemini API key is configured and try again later.",
      });
    }

  } catch (error) {
    console.error("Chatbot Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "I'm having trouble retrieving knowledge right now. Please try again in a moment.",
    });
  }
};
