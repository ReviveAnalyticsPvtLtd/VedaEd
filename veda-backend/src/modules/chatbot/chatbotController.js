const kb = require("./vedaKnowledgeBase");

// Romanized Hinglish to English synonyms expander
const SYNONYMS = {
  "kaha": ["where", "find", "locate"],
  "kaha-se": ["where", "find", "locate"],
  "dekhu": ["view", "check", "find", "show"],
  "dekhe": ["view", "check", "find", "show"],
  "dekhna": ["view", "check", "find", "show"],
  "kaise": ["how", "guide", "setup"],
  "kru": ["do", "mark", "submit", "apply"],
  "kare": ["do", "mark", "submit", "apply"],
  "krna": ["do", "mark", "submit", "apply"],
  "karna": ["do", "mark", "submit", "apply"],
  "lagaye": ["mark", "apply", "add"],
  "lagana": ["mark", "apply", "add"],
  "jama": ["collect", "pay", "submit"],
  "milegi": ["find", "receipt", "get", "download"],
  "milega": ["find", "receipt", "get", "download"],
  "bharna": ["pay", "submit"],
  "bhare": ["pay", "submit"],
  "dale": ["input", "enter", "add"],
  "dalna": ["input", "enter", "add"],
  "haziri": ["attendance"],
  "bacche": ["student", "child"],
  "baccha": ["student", "child"],
  "kahaa": ["where", "find", "locate"],
  "dikhaye": ["show", "view"]
};

// Helper to tokenize queries into lowercase word arrays
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ") // replace punctuation with space
    .split(/\s+/)
    .filter(word => word.length > 1); // filter out tiny words
}

// Expands token array with matched Romanized Hindi synonyms
function expandTokens(tokens) {
  const expanded = [...tokens];
  tokens.forEach(token => {
    if (SYNONYMS[token]) {
      expanded.push(...SYNONYMS[token]);
    }
  });
  return [...new Set(expanded)];
}

exports.askChatbot = async (req, res) => {
  try {
    const { message, role, userName, history, currentPage } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const queryLower = message.toLowerCase().trim();
    const userRole = (role || "guest").toLowerCase().replace(/[^a-z]/g, "");

    // 1. Handle Chatbot Initialization (e.g. widget opened or route changes)
    if (message === "__INIT__") {
      const suggestions = kb.roleSuggestions[userRole] || kb.roleSuggestions["guest"];
      
      let pageContext = null;
      let matchedPath = null;
      if (currentPage) {
        // Sort keys by descending length to match the most specific path first
        matchedPath = Object.keys(kb.pages)
          .sort((a, b) => b.length - a.length)
          .find(path => 
            currentPage.startsWith(path) || path.startsWith(currentPage)
          );
        if (matchedPath) {
          pageContext = kb.pages[matchedPath];
        }
      }

      let welcomeText = `Hello ${userName || 'User'}! I'm your VedaEd Assistant. How can I help you today?`;
      let finalSuggestions = suggestions;

      if (pageContext) {
        welcomeText = `Hello ${userName || 'User'}! I see you are viewing the **${pageContext.title}** page. How can I help you with this page?`;
        if (pageContext.suggestions) {
          finalSuggestions = pageContext.suggestions;
        }
      }

      return res.status(200).json({
        success: true,
        data: welcomeText,
        suggestions: finalSuggestions
      });
    }

    // 2. Identify if the query is a generic "help" or page description request
    const isHelpQuery = [
      "help", "guide", "what is this", "what can i do here", 
      "how does this page work", "how to use this page", "how to use this", 
      "what is this page", "info", "where am i", "help me with this page"
    ].some(phrase => queryLower.includes(phrase));

    if (isHelpQuery && currentPage) {
      // Sort keys by descending length to match the most specific path first
      const matchedPath = Object.keys(kb.pages)
        .sort((a, b) => b.length - a.length)
        .find(path => 
          currentPage.startsWith(path) || path.startsWith(currentPage)
        );

      if (matchedPath) {
        const pageContext = kb.pages[matchedPath];
        
        // Filter FAQs that match this page's associated topics
        const relatedFaqs = kb.faqs.filter(faq => 
          pageContext.faqs.includes(faq.id)
        );

        let responseText = `You are currently viewing the **${pageContext.title}** (route: \`${currentPage}\`).\n\n${pageContext.description}\n\n**Quick Tips:**\n`;
        pageContext.tips.forEach(tip => {
          responseText += `- ${tip}\n`;
        });

        // Filter and collect action buttons for this page context based on roles permissions
        const pageActions = [];
        relatedFaqs.forEach(faq => {
          if (faq.action) {
            let path = "";
            if (typeof faq.action.path === "string") {
              path = faq.action.path;
            } else if (typeof faq.action.path === "object") {
              path = faq.action.path[userRole];
            }
            if (path) {
              // Ensure we don't duplicate actions with the same label
              if (!pageActions.some(act => act.label === faq.action.label)) {
                pageActions.push({
                  label: faq.action.label,
                  path: path
                });
              }
            }
          }
        });

        return res.status(200).json({
          success: true,
          data: responseText,
          actions: pageActions
        });
      }
    }

    // 3. Track previous matching context from conversation history (if any)
    let lastMatchedCategory = null;
    if (Array.isArray(history) && history.length > 0) {
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i];
        if (msg.role === "model" && msg.parts && msg.parts[0]?.text) {
          const text = msg.parts[0].text;
          const matchedFaq = kb.faqs.find(f => {
            const normModelText = text.toLowerCase().replace(/\s+/g, " ");
            const normFaqAns = f.answer.toLowerCase().replace(/\s+/g, " ");
            const normFaqQuest = f.question.toLowerCase().replace(/\s+/g, " ");
            return normModelText.includes(normFaqAns.substring(0, 30)) || 
                   normModelText.includes(normFaqQuest);
          });
          if (matchedFaq) {
            lastMatchedCategory = matchedFaq.category;
            break;
          }
        }
      }
    }

    // 4. Filter FAQs to which this user's role has permission
    const allowedFaqs = kb.faqs.filter(faq => {
      if (!faq.roles) return true;
      const rolesNormalized = faq.roles.map(r => r.toLowerCase());
      
      if (userRole === "superadmin") return true;
      if (userRole === "admin") {
        return rolesNormalized.includes("admin") || 
               rolesNormalized.includes("cashier") || 
               rolesNormalized.includes("receptionist");
      }
      return rolesNormalized.includes(userRole);
    });

    // 5. Score allowed FAQs based on token overlaps and Hinglish synonym mappings
    let bestMatch = null;
    let bestScore = 0;
    const rawTokens = tokenize(message);
    const queryTokens = expandTokens(rawTokens); // Expand input tokens using Hinglish lookup

    allowedFaqs.forEach(faq => {
      let score = 0;

      // Exact substring matches on keywords/phrases
      faq.keywords.forEach(keyword => {
        const kwLower = keyword.toLowerCase();
        if (queryLower.includes(kwLower)) {
          score += 15; // High weight for exact phrase match
        }
      });

      // Token overlap between expanded input words and keyword words
      const faqTokens = [];
      faq.keywords.forEach(kw => {
        faqTokens.push(...tokenize(kw));
      });
      const uniqueFaqTokens = [...new Set(faqTokens)];

      const intersection = queryTokens.filter(token => uniqueFaqTokens.includes(token));
      score += intersection.length * 2.5; // Token overlap points

      // Boost matching score if this FAQ belongs to the category previously discussed
      if (lastMatchedCategory && faq.category === lastMatchedCategory) {
        const actionKeywords = ["how", "add", "create", "delete", "edit", "setup", "register", "collect", "pay", "show", "view", "do", "mark", "kaise", "kru", "steps", "it", "details"];
        const hasAction = rawTokens.some(t => actionKeywords.includes(t));
        if (hasAction) {
          score += 10; // Boost to ensure it matches the follow-up threshold
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = faq;
      }
    });

    // 6. Output match if score passes similarity threshold, otherwise output fallback suggestions
    if (bestScore >= 4.5 && bestMatch) {
      let actions = [];
      if (bestMatch.action) {
        let path = "";
        if (typeof bestMatch.action.path === "string") {
          path = bestMatch.action.path;
        } else if (typeof bestMatch.action.path === "object") {
          path = bestMatch.action.path[userRole] || "";
        }
        if (path) {
          actions.push({
            label: bestMatch.action.label,
            path: path
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: bestMatch.answer,
        actions: actions
      });
    }

    // Fallback: suggest relevant topics matching the user's role and page context
    let matchedPath = null;
    let pageContext = null;
    if (currentPage) {
      matchedPath = Object.keys(kb.pages).find(path => 
        currentPage.startsWith(path) || path.startsWith(currentPage)
      );
      if (matchedPath) {
        pageContext = kb.pages[matchedPath];
      }
    }

    const suggestions = (pageContext && pageContext.suggestions) || 
                        kb.roleSuggestions[userRole] || 
                        kb.roleSuggestions["guest"];

    let fallbackText = `I couldn't find an exact answer to your question: *"${message}"*.\n\nHere are some relevant actions you can take based on your role (**${role || 'user'}**):`;
    
    return res.status(200).json({
      success: true,
      data: fallbackText,
      suggestions: suggestions
    });

  } catch (error) {
    console.error("Chatbot Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "I'm having trouble retrieving knowledge right now. Please try again in a moment.",
    });
  }
};



