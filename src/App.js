import React, { useRef } from "react";
import Astro from "./Astro";
import ChatMock from "./ChatMock";

export default function App() {
  const astroRef = useRef(null);
  const controlsRef = useRef({
    publish: () => {},
    undo: () => {},
    gettingSmall: () => {},
    loader: () => {},
    shrink: () => {},
  });

  // helpers: move Astro to top-left of a rect
  const moveAstroToRect = (rect) => {
    if (!rect) return;
    astroRef.current?.moveTo(rect.left, rect.top);
  };

  const moveAstroToComposer = (composerRect) => {
    if (!composerRect) return;
    astroRef.current?.moveTo(composerRect.left, composerRect.top);
  };

  return (
    <div className="app">
      {/* Astro floats above UI, never intercepts clicks */}
      <Astro
        ref={astroRef}
        initialX={260}
        initialY={260}
        zIndex={20000}
        onReady={(controls) => (controlsRef.current = controls)}
      />

      <div className="ui-root" data-ui-root>
        <header className="app-header">
          <div className="brand">
            <span className="dot" /> Astro Sandbox
          </div>
          <div className="controls">
            <button onClick={() => controlsRef.current.publish()}>Publish</button>
            <button onClick={() => controlsRef.current.undo()}>Undo</button>
            <button onClick={() => controlsRef.current.shrink()}>Small</button>
            <button onClick={() => controlsRef.current.loader()}>Loader</button>
            <button onClick={() => controlsRef.current.shrink()}>Toggle Scale</button>
          </div>
        </header>

        <main className="chat-layout">
          <ChatMock
            // when user sends → move to where assistant will type
            onAssistantSpot={moveAstroToRect}
            // after assistant renders → wait 1s then move back to composer
            onAssistantDone={(composerRect) => {
              setTimeout(() => moveAstroToComposer(composerRect), 1000);
            }}
            // (optional) keep your keyword triggers
            onSend={(msg) => {
              const t = msg.toLowerCase();
              if (t.includes("publish")) controlsRef.current.publish();
              else if (t.includes("undo")) controlsRef.current.undo();
              else if (t.includes("small")) controlsRef.current.gettingSmall();
              else if (t.includes("load")) controlsRef.current.loader();
              else controlsRef.current.shrink();
            }}
          />
        </main>
      </div>
    </div>
  );
}