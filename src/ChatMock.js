// ChatMock.js
import React, { useState, useRef, useEffect } from "react";

const STARTER = [
  { id: 1, role: "greeting", text: "Hey There John\nHow Can I Help You Today" },
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
      // Remove greeting message on first focus
      setMessages([]);
      const rect = inputRef.current?.getBoundingClientRect();
      onInputFocus?.(rect);
      setHasFirstFocus(true);
    }
  };

  // Handle typing - track caret position
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInput(newValue);
    
    // Auto-resize textarea based on content
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Track typing for eye movement with actual caret position
    const rect = inputRef.current?.getBoundingClientRect();
    const caretPosition = e.target.selectionStart; // Actual caret position
    const textLength = newValue.length;
    
    onTyping?.(rect, newValue, caretPosition, textLength);
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

    // 2. Move Astro to where AI message will appear (without typing indicator yet)
    // Wait a frame for the user message to render first
    await new Promise(r => requestAnimationFrame(r));
    
    // Calculate position for typing bubble (same as before)
    const typing = listRef.current?.querySelector(".bubble.assistant:last-child") || 
                   listRef.current?.lastElementChild;
    const rect = typing?.getBoundingClientRect?.() || {
      left: 300,
      top: window.innerHeight / 2,
      width: 400,
      height: 50
    };
    
    console.log("[ChatMock] Moving Astro to AI message position");
    onUserSendsMessage?.(rect);

    // 3. Wait for Astro to arrive at position (movement + loader animation)
    await new Promise((r) => setTimeout(r, 2000));

    // 4. Now show typing indicator (Astro is already there with loader)
    console.log("[ChatMock] Showing typing indicator");
    setPending(true);

    // 5. Simulate AI processing time (typing animation + loader running)
    await new Promise((r) => setTimeout(r, 2000));

    // 6. AI is ready (trigger pulse while typing continues)
    console.log("[ChatMock] AI ready - triggering pulse");
    onAIReady?.();

    // 7. Continue typing with pulse for a bit longer
    await new Promise((r) => setTimeout(r, 1000));

    // 8. Render AI message (hide typing, show response)
    const reply = generateReply(trimmed);
    const newMsg = { id: Date.now() + 1, role: "assistant", text: reply };
    setMessages((m) => [...m, newMsg]);
    setPending(false);

    // 9. After message renders, move Astro back to chat box
    requestAnimationFrame(() => {
      const rect = inputRef.current?.getBoundingClientRect?.();
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
          style={{ minHeight: '20px', height: '20px' }}
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