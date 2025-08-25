// ChatMock.js
import React, { useState, useRef, useEffect } from "react";

const STARTER = [
  { id: 1, role: "assistant", text: "Hey! I’m Astro. Ask me anything ✨" },
  { id: 2, role: "assistant", text: "Tip: say 'publish', 'undo', 'small', or 'loader'." },
];

export default function ChatMock({ onSend, onAssistantSpot, onAssistantDone }) {
  const [messages, setMessages] = useState(STARTER);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const listRef = useRef(null);
  const composerRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || pending) return;

    // push user message
    const userMsg = { id: Date.now(), role: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    onSend?.(trimmed);

    // show typing
    setPending(true);

    // next frame: measure the typing placeholder (assistant spot)
    requestAnimationFrame(() => {
      const typing = listRef.current?.querySelector(".bubble.assistant .typing");
      const rect = typing?.getBoundingClientRect?.();
      onAssistantSpot?.(rect);
    });

    // fake assistant wait
    await new Promise((r) => setTimeout(r, 550));

    // render assistant message
    const reply = mockReply(trimmed);
    const newMsg = { id: Date.now() + 1, role: "assistant", text: reply };
    setMessages((m) => [...m, newMsg]);
    setPending(false);

    // after it paints, return Astro to composer
    requestAnimationFrame(() => {
      const rect = composerRef.current?.getBoundingClientRect?.();
      onAssistantDone?.(rect);
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
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          </div>
        )}
      </div>

      <div className="composer" ref={composerRef}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Message Astro…"
          rows={1}
        />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}

function mockReply(text) {
  const t = text.toLowerCase();
  if (t.includes("publish")) return "Published! 🚀";
  if (t.includes("undo")) return "Rolled back. ↩️";
  if (t.includes("small")) return "Going small… 🫧";
  if (t.includes("load")) return "Loading sequence… ⏳";
  return "Toggled scale. What next?";
}