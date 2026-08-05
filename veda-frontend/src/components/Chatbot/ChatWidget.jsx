import React, { useState, useEffect, useRef } from "react";
import { FiMessageSquare, FiSend, FiX, FiMinimize2 } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import chatbotAPI from "../../services/chatbotAPI";
import VedaMascot from "./VedaMascot";

const formatMessageText = (text) => {
  if (!text) return "";
  
  const lines = text.split("\n");
  let inList = false;
  let listItems = [];
  const elements = [];

  const parseInlineStyles = (lineText, keyPrefix) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const parts = [];
    let match;
    let lastIndex = 0;
    
    while ((match = boldRegex.exec(lineText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(lineText.substring(lastIndex, match.index));
      }
      parts.push(<strong key={`${keyPrefix}-bold-${match.index}`} className="font-semibold text-gray-900">{match[1]}</strong>);
      lastIndex = boldRegex.lastIndex;
    }
    
    if (lastIndex < lineText.length) {
      parts.push(lineText.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : lineText;
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ");
    const isNumbered = /^\d+\.\s+/.test(trimmed);

    if (isBullet || isNumbered) {
      if (!inList) {
        inList = true;
        listItems = [];
      }
      
      let content = trimmed;
      if (isBullet) {
        content = trimmed.substring(2);
      } else {
        content = trimmed.replace(/^\d+\.\s+/, "");
      }
      
      listItems.push(
        <li key={`li-${index}`} className="list-disc ml-4 my-1">
          {parseInlineStyles(content, `li-${index}`)}
        </li>
      );
    } else {
      if (inList) {
        elements.push(
          <ul key={`ul-${index}`} className="my-1 pl-2 list-inside list-disc">
            {listItems}
          </ul>
        );
        inList = false;
        listItems = [];
      }
      
      if (trimmed === "") {
        elements.push(<div key={`empty-${index}`} className="h-2" />);
      } else {
        elements.push(
          <p key={`p-${index}`} className="my-1 leading-relaxed">
            {parseInlineStyles(trimmed, `p-${index}`)}
          </p>
        );
      }
    }
  });

  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-end" className="my-1 pl-2 list-inside list-disc">
        {listItems}
      </ul>
    );
  }

  return elements;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your VedaEd Assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const [mascotState, setMascotState] = useState("idle");
  const [hoverMascot, setHoverMascot] = useState(false);
  
  const [position, setPosition] = useState(null);
  const widgetRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialLeft: 0,
    initialTop: 0,
    hasMoved: false,
  });

  const messagesEndRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const startDrag = (clientX, clientY) => {
    if (!widgetRef.current) return;
    const rect = widgetRef.current.getBoundingClientRect();
    dragRef.current = {
      isDragging: true,
      startX: clientX,
      startY: clientY,
      initialLeft: rect.left,
      initialTop: rect.top,
      hasMoved: false,
    };
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    
    const button = e.target.closest("button");
    const a = e.target.closest("a");
    const input = e.target.closest("input");
    
    if (a || input) return;
    if (button && !button.classList.contains("mascot-trigger")) return;
    
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    const button = e.target.closest("button");
    const a = e.target.closest("a");
    const input = e.target.closest("input");
    
    if (a || input) return;
    if (button && !button.classList.contains("mascot-trigger")) return;
    
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const dragInfo = dragRef.current;
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;

      if (!dragInfo.hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
        dragInfo.hasMoved = true;
      }

      if (dragInfo.hasMoved) {
        let newX = dragInfo.initialLeft + dx;
        let newY = dragInfo.initialTop + dy;

        if (widgetRef.current) {
          const rect = widgetRef.current.getBoundingClientRect();
          newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newX));
          newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newY));
        }

        setPosition({ x: newX, y: newY });
      }
    };

    const handleTouchMove = (e) => {
      if (!dragRef.current.isDragging) return;
      const dragInfo = dragRef.current;
      if (e.touches.length > 0) {
        const dx = e.touches[0].clientX - dragInfo.startX;
        const dy = e.touches[0].clientY - dragInfo.startY;

        if (!dragInfo.hasMoved && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
          dragInfo.hasMoved = true;
        }

        if (dragInfo.hasMoved) {
          let newX = dragInfo.initialLeft + dx;
          let newY = dragInfo.initialTop + dy;

          if (widgetRef.current) {
            const rect = widgetRef.current.getBoundingClientRect();
            newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newX));
            newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newY));
          }

          setPosition({ x: newX, y: newY });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current.isDragging) {
        dragRef.current.isDragging = false;
        // Keep hasMoved true briefly so any click event triggers after mouseup can check it
        setTimeout(() => {
          dragRef.current.hasMoved = false;
        }, 50);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, []);

  // Enforce bounds on open/close transition
  useEffect(() => {
    if (position && widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      const newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, position.x));
      const newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, position.y));
      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });
      }
    }
  }, [isOpen]);

  // Enforce bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      if (position && widgetRef.current) {
        const rect = widgetRef.current.getBoundingClientRect();
        setPosition((prev) => {
          if (!prev) return null;
          const newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, prev.x));
          const newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, prev.y));
          return { x: newX, y: newY };
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [position]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Request page-aware welcome message and suggestion pills
  useEffect(() => {
    if (isOpen) {
      const initChat = async () => {
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const role = localStorage.getItem("role") || "guest";
          const userName = user?.personalInfo?.name || user?.name || "User";

          const response = await chatbotAPI.ask(
            "__INIT__",
            role,
            userName,
            [],
            location.pathname
          );
          if (response && response.success) {
            if (messages.length <= 1) {
              setMessages([
                {
                  id: 1,
                  text: response.data,
                  sender: "bot",
                  timestamp: new Date(),
                },
              ]);
            }
            if (response.suggestions) {
              setQuickSuggestions(response.suggestions);
            }
          }
        } catch (error) {
          console.error("Chatbot Init Error:", error);
        }
      };
      initChat();
    }
  }, [isOpen, location.pathname]);

  const handleOpen = () => {
    if (dragRef.current.hasMoved) return;
    // Play wave animation and then expand window
    setMascotState("wave");
    setTimeout(() => {
      setIsOpen(true);
      setMascotState("idle");
    }, 450);
  };

  const handleActionClick = (path) => {
    if (path) {
      navigate(path);
      setIsOpen(false); // Close chatbot on navigation for better user flow
    }
  };

  const handleSend = async (e, textToSend = null) => {
    if (e) e.preventDefault();
    const queryText = textToSend || input;
    if (!queryText.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: queryText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setQuickSuggestions([]); 
    setIsTyping(true);
    setMascotState("thinking");

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const role = localStorage.getItem("role") || "guest";
      const userName = user?.personalInfo?.name || user?.name || "User";

      // Map conversation history
      const historyToSend = messages
        .filter((msg) => !msg.isError)
        .map((msg) => ({
          role: msg.sender === "user" ? "user" : "model",
          parts: [{ text: msg.text }],
        }));

      const response = await chatbotAPI.ask(
        queryText,
        role,
        userName,
        historyToSend,
        location.pathname
      );
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.data,
        sender: "bot",
        timestamp: new Date(),
        actions: response.actions || [],
      };
      setMessages((prev) => [...prev, botMessage]);

      if (response.suggestions) {
        setQuickSuggestions(response.suggestions);
      }

      // Play happy reaction on successful response
      setMascotState("happy");
      setTimeout(() => {
        setMascotState("idle");
      }, 1800);

    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        sender: "bot",
        isError: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setMascotState("idle");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      ref={widgetRef}
      style={
        position
          ? {
              position: "fixed",
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: "auto",
              right: "auto",
            }
          : {}
      }
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] font-sans flex items-end justify-end"
    >
      {/* Animated Veda Mascot Trigger Button (Visible when closed) */}
      <div className={`transition-all duration-300 transform origin-bottom-right ${isOpen ? "absolute scale-0 opacity-0 pointer-events-none" : "relative scale-100 opacity-100"}`}>
        {/* Tooltip on hover */}
        {hoverMascot && (
          <div className="absolute right-2 bottom-18 bg-indigo-950 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200 border border-indigo-900/40 select-none">
            ✦ Ask Veda
          </div>
        )}
        <button
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={handleOpen}
          onMouseEnter={() => setHoverMascot(true)}
          onMouseLeave={() => setHoverMascot(false)}
          className="mascot-trigger relative focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer select-none"
          title="Open Veda Assistant"
        >
          <VedaMascot state={mascotState} size={66} />
        </button>
      </div>

      {/* Upgraded Floating Assistant Panel (Expands smoothly from trigger location) */}
      <div 
        className={`w-[calc(100vw-2rem)] sm:w-96 h-[510px] sm:h-[540px] max-h-[calc(100vh-6rem)] bg-white rounded-3xl shadow-[0_20px_50px_rgba(49,46,129,0.22)] flex flex-col overflow-hidden border border-indigo-50/60 transition-all duration-300 transform origin-bottom-right ${
          isOpen ? "relative scale-100 opacity-100" : "absolute scale-0 opacity-0 pointer-events-none"
        }`}
      >
        {/* Header (Gradient Brand bar) - Draggable */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-4 flex items-center justify-between text-white shadow-md cursor-grab active:cursor-grabbing select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-950/20 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-sm">
              <VedaMascot state={isTyping ? "thinking" : mascotState} size={36} showGlow={false} />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                Veda ✦
              </h3>
              <p className="text-[10px] text-indigo-200/90 font-medium italic">
                Your smart VedaEd guide
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-indigo-100 hover:text-white"
              title="Minimize"
            >
              <FiMinimize2 className="text-sm" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-indigo-100 hover:text-white"
              title="Close"
            >
              <FiX className="text-base" />
            </button>
          </div>
        </div>

        {/* Messages Dialogue Pane */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-indigo-50/20 to-white">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start ${
                msg.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {/* Render small Veda mascot avatar for bot replies */}
              {msg.sender === "bot" && (
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <VedaMascot state={msg.isError ? "idle" : "idle"} size={22} showGlow={false} />
                </div>
              )}
              
              <div
                className={`max-w-[78%] p-3.5 rounded-2xl text-[13px] shadow-sm ${
                  msg.sender === "user"
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-white text-gray-700 border border-indigo-100/40 rounded-tl-none line-height-relaxed"
                }`}
              >
                {msg.sender === "user" ? msg.text : formatMessageText(msg.text)}
                
                {/* Render Dynamic Clickable Navigation Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {msg.actions.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleActionClick(act.path)}
                        className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 text-indigo-700 border border-indigo-100 px-3.5 py-2.5 rounded-xl font-bold transition-all text-[11px] flex items-center justify-between shadow-sm cursor-pointer group"
                      >
                        <span>{act.label} →</span>
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className={`text-[9px] mt-1.5 opacity-65 ${
                    msg.sender === "user" ? "text-right text-indigo-100" : "text-gray-400"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Upgraded Thinking Status Loader */}
          {isTyping && (
            <div className="flex gap-2.5 items-start justify-start">
              <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100/60 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <VedaMascot state="thinking" size={22} showGlow={false} />
              </div>
              <div className="bg-white border border-indigo-100/30 p-3 rounded-2xl rounded-tl-none flex gap-1.5 items-center shadow-sm">
                <span className="text-[11px] text-gray-400 font-medium italic mr-1">Veda is thinking</span>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Pills (Shown inline directly above input) */}
        {quickSuggestions && quickSuggestions.length > 0 && (
          <div className="px-3 py-2.5 bg-gray-50/50 border-t border-indigo-50/30 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {quickSuggestions.map((sug, index) => (
              <button
                key={index}
                onClick={() => handleSend(null, sug.query)}
                className="bg-white border border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/30 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
              >
                {sug.label}
              </button>
            ))}
          </div>
        )}

        {/* Compact tech-styled Input Area */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t border-indigo-50/40 bg-white flex items-center gap-2"
        >
          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:bg-white transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Veda anything..."
              className="flex-1 bg-transparent border-none text-[13px] outline-none text-gray-700 placeholder-gray-400 font-medium"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="text-indigo-600 disabled:text-gray-300 hover:text-indigo-700 transition-colors p-0.5 cursor-pointer disabled:cursor-not-allowed"
              title="Send to Veda"
            >
              <FiSend className="text-base" strokeWidth="2.5" />
            </button>
          </div>
        </form>
        <div className="text-[9px] text-center pb-2 text-gray-400 font-medium bg-white">
          Powered by VedaEd Smart Assistant
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
