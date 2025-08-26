// ChatMock.js
import React, { useState, useRef, useEffect } from "react";

const STARTER = [
  { id: 1, role: "assistant", text: "Hey! I'm Astro. Try the complete flow button above! ✨" },
  { id: 2, role: "assistant", text: "Or type a message below to see the full animation sequence." },
];

export default function ChatMock({ 
  onInputFocus, 
  onUserSendsMessage, 
  onAIReady, 
  onAIMessageShown,
  onTyping,
  astroRef 
}) {
  const [messages, setMessages] = useState(STARTER);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [hasFirstFocus, setHasFirstFocus] = useState(false);

  const listRef = useRef(null);
  const composerRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    listRef.current?.scrollTo({ 
      top: listRef.current.scrollHeight, 
      behavior: "smooth" 
    });
  }, [messages, pending]);

  // Handle input focus (first focus only)
  const handleInputFocus = () => {
    if (!hasFirstFocus) {
      console.log("[ChatMock] First input focus detected");
      const rect = inputRef.current?.getBoundingClientRect();
      onInputFocus?.(rect);
      setHasFirstFocus(true);
    }
  };

  // Handle typing - track caret position
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Track typing for eye movement
    const rect = inputRef.current?.getBoundingClientRect();
    onTyping?.(rect, newValue);
  };

  // Send message flow
  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    console.log("[ChatMock] User sending message:", trimmed);

    // 1. Add user message
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    // 2. Show typing indicator
    setPending(true);

    // 3. Move Astro to where AI message will appear
    requestAnimationFrame(() => {
      const typing = listRef.current?.querySelector(".bubble.assistant:last-child");
      const rect = typing?.getBoundingClientRect?.();
      if (rect) {
        console.log("[ChatMock] Moving Astro to AI message position");
        onUserSendsMessage?.(rect);
      }
    });

    // 4. Simulate AI processing time (loader will be running)
    await new Promise((r) => setTimeout(r, 1500));

    // 5. AI is ready (trigger pulse)
    console.log("[ChatMock] AI ready - triggering pulse");
    onAIReady?.();

    // 6. Small delay for pulse animation
    await new Promise((r) => setTimeout(r, 500));

    // 7. Render AI message
    const reply = generateReply(trimmed);
    const newMsg = { id: Date.now() + 1, role: "assistant", text: reply };
    setMessages((m) => [...m, newMsg]);
    setPending(false);

    // 8. After message renders, move Astro back to chat box
    requestAnimationFrame(() => {
      const rect = composerRef.current?.getBoundingClientRect?.();
      if (rect) {
        console.log("[ChatMock] Moving Astro back to chat box");
        onAIMessageShown?.(rect);
      }
    });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="chat">
      <div className="chat-list" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role}`}>
            <div className="bubble-inner">{m.text}</div>
          </div>
        ))}
        {pending && (
          <div className="bubble assistant">
            <div className="bubble-inner typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="composer" ref={composerRef}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={onKeyDown}
          placeholder="Click here to trigger first focus, then type a message..."
          rows={1}
        />
        <button onClick={send} disabled={!input.trim() || pending}>
          {pending ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
}

// Generate contextual replies
function generateReply(text) {
  const t = text.toLowerCase();
  
  // Check for Rive state keywords
  if (t.includes("publish")) return "Great! The publish animation is triggered! 🚀";
  if (t.includes("undo")) return "Undo animation played! Going back... ↩️";
  if (t.includes("idea")) return "💡 Idea spark animation triggered!";
  if (t.includes("loader") || t.includes("loading")) return "The loader animation is spinning! ⏳";
  if (t.includes("pulse")) return "Pulsing with excitement! 💫";
  if (t.includes("idle")) return "Back to idle state, just chilling... 😌";
  if (t.includes("shrink") || t.includes("small")) return "Getting smaller... 🫧";
  if (t.includes("bored")) return "Yawn... triggering boredom animation... 😴";
  
  // Movement related
  if (t.includes("move")) return "I can move anywhere on the screen! Watch the trail effect! ✨";
  if (t.includes("animation")) return "All animations are working! Try the control buttons above.";
  if (t.includes("hello") || t.includes("hi")) return "Hello! I'm Astro, your animated assistant! 👋";
  if (t.includes("test")) return "Testing complete! All systems operational. ✅";
  
  // Default responses
  const responses = [
    "That's interesting! Tell me more. 🤔",
    "I see what you mean! Let me think about that... 💭",
    "Great point! Here's what I think... 🎯",
    "Thanks for sharing! Want to try the animations? ✨",
    "Got it! Try clicking the control buttons above! 🎮",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}