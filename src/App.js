import React, { useRef, useEffect, useState } from "react";
import Astro from "./Astro";
import ChatMock from "./ChatMock";

export default function App() {
  const astroRef = useRef(null);
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  // ========== LIFECYCLE HANDLERS ==========
  
  // Simulate chat opening
  const handleChatOpen = () => {
    astroRef.current?.onChatOpen();
  };

  // Simulate first input focus
  const handleFirstInputFocus = () => {
    // Using left side of where input would be positioned
    // In production, this would be the actual input field position
    const x = window.innerWidth / 2 - 300; // Left side of centered chat
    const y = window.innerHeight - 150; // Near bottom for chat input
    astroRef.current?.onFirstInputFocus(x, y);
  };

  // Simulate user sending message
  const handleUserSendsMessage = () => {
    // Example AI message position (left side of chat)
    const x = 300;
    const y = window.innerHeight / 2;
    astroRef.current?.onUserSendsMessage(x, y);
  };

  // Simulate AI ready signal
  const handleAIReady = () => {
    astroRef.current?.onAIMessageReady();
  };

  // Simulate AI message shown
  const handleAIMessageShown = () => {
    // Return to chat box position (top-left of input)
    const x = window.innerWidth / 2 - 300; // Left side of centered chat
    const y = window.innerHeight - 150;
    astroRef.current?.onAIMessageShown(x, y);
  };

  // Simulate complete flow
  const handleCompleteFlow = async () => {
    console.log("[Demo] Starting complete chat flow simulation");
    
    // 1. Open chat
    handleChatOpen();
    await new Promise(r => setTimeout(r, 2000));
    
    // 2. First focus
    handleFirstInputFocus();
    await new Promise(r => setTimeout(r, 1500));
    
    // 3. Send message
    handleUserSendsMessage();
    await new Promise(r => setTimeout(r, 2000));
    
    // 4. AI ready
    handleAIReady();
    await new Promise(r => setTimeout(r, 1500));
    
    // 5. Show message and return
    handleAIMessageShown();
    
    console.log("[Demo] Complete flow finished");
  };

  // ========== CHAT INTEGRATION ==========
  
  // Handle first focus from real chat input
  const handleChatInputFocus = (rect) => {
    if (isFirstFocus && rect) {
      const x = rect.left;  // Left edge of input field
      const y = rect.top;   // Top edge of input field
      astroRef.current?.onFirstInputFocus(x, y);
      setIsFirstFocus(false);
    }
  };

  // Handle message send from chat
  const handleChatMessageSent = (aiMessageRect) => {
    if (aiMessageRect) {
      const x = aiMessageRect.left;
      const y = aiMessageRect.top + aiMessageRect.height / 2;
      astroRef.current?.onUserSendsMessage(x, y);
    }
  };

  // Handle AI ready (simulate delay)
  const handleChatAIReady = () => {
    astroRef.current?.onAIMessageReady();
  };

  // Handle AI message shown
  const handleChatAIShown = (chatBoxRect) => {
    if (chatBoxRect) {
      const x = chatBoxRect.left;  // Left edge of input field
      const y = chatBoxRect.top;   // Top edge of input field
      astroRef.current?.onAIMessageShown(x, y);
    }
  };

  // Handle typing tracking
  const handleChatTyping = (caretX, caretY) => {
    if (typeof caretX === 'number' && typeof caretY === 'number') {
      astroRef.current?.onUserTyping(caretX, caretY);
    }
  };

  // Auto-trigger chat open on mount
  useEffect(() => {
    // Wait a moment for everything to load
    setTimeout(() => {
      handleChatOpen();
    }, 500);
  }, []);

  return (
    <div className="app">
      {/* Astro floats above UI, never intercepts clicks */}
      <Astro ref={astroRef} />

      <div className="ui-root" data-ui-root>
        <header className="app-header">
          <div className="brand">
            <span className="dot" /> Astro Demo - Complete Integration Example
          </div>
        </header>

        <div className="main-layout">
          {/* Chat Interface */}
          <main className="chat-layout">
            <ChatMock
              onInputFocus={handleChatInputFocus}
              onUserSendsMessage={handleChatMessageSent}
              onAIReady={handleChatAIReady}
              onAIMessageShown={handleChatAIShown}
              onTyping={handleChatTyping}
              astroRef={astroRef}
            />
          </main>

          {/* Control Panel - Right Side */}
          <aside className="control-panel">
            {/* Rive State Controls Section */}
            <div className="control-section">
              <h3>✨ Rive States</h3>
              <div className="button-stack">
                <button onClick={() => astroRef.current?.triggerIdle()}>Idle</button>
                <button onClick={() => astroRef.current?.triggerPulse()}>Pulse</button>
                <button onClick={() => astroRef.current?.triggerBlink()}>Blink</button>
                <button onClick={() => astroRef.current?.triggerBigLoader()}>Big Loader</button>
                <button onClick={() => astroRef.current?.triggerSmallLoader()}>Small Loader</button>
                <button onClick={() => astroRef.current?.triggerPublish()}>Publish</button>
                <button onClick={() => astroRef.current?.triggerUndo()}>Undo</button>
                <button onClick={() => astroRef.current?.triggerIdeaSpark()}>Idea Spark</button>
                <button onClick={() => astroRef.current?.triggerBoredom()}>Boredom</button>
                <button onClick={() => astroRef.current?.triggerShrink()}>Shrink</button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}