# Astro Integration Guide for Production Chat

## Quick Start

This guide shows how to integrate the Astro animated character into your production chat application.

## 1. Installation

```jsx
import Astro from './Astro';  // Copy the Astro.js file to your project
```

## 2. Basic Integration Pattern

```jsx
function YourChatComponent() {
  const astroRef = useRef(null);
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  return (
    <>
      {/* Astro floats above everything */}
      <Astro ref={astroRef} />
      
      {/* Your chat UI here */}
    </>
  );
}
```

## 3. Key Integration Points

### 3.1 When Chat Opens
```javascript
// Call this when chat interface becomes visible
useEffect(() => {
  astroRef.current?.onChatOpen();
}, []);
```

### 3.2 First Input Focus
```javascript
// Track first time user focuses input field
const handleInputFocus = (event) => {
  if (isFirstFocus) {
    const rect = event.target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    astroRef.current?.onFirstInputFocus(x, y);
    setIsFirstFocus(false);
  }
};
```

### 3.3 Message Send Flow
```javascript
const handleSendMessage = async (message) => {
  // 1. Move Astro to where AI message will appear
  const aiMessageX = 300;  // Left side of chat
  const aiMessageY = getAIMessageY();  // Calculate based on your layout
  astroRef.current?.onUserSendsMessage(aiMessageX, aiMessageY);
  
  // 2. Send to your backend
  const response = await sendToBackend(message);
  
  // 3. When AI response is ready (before showing text)
  astroRef.current?.onAIMessageReady();
  
  // 4. Render the AI message
  renderAIMessage(response);
  
  // 5. Move Astro back to chat input
  const inputX = window.innerWidth / 2;
  const inputY = window.innerHeight - 150;
  astroRef.current?.onAIMessageShown(inputX, inputY);
};
```

### 3.4 Eye Tracking While Typing (Optional)
```javascript
const handleInputChange = (event) => {
  const input = event.target;
  const rect = input.getBoundingClientRect();
  const caretPosition = input.selectionStart / input.value.length;
  
  astroRef.current?.onUserTyping(
    rect.left,
    rect.top + rect.height / 2,
    rect.width,
    caretPosition  // 0 to 1 normalized
  );
};
```

## 4. Configuration Points

### Positions (in Astro.js)
```javascript
// TODO: Adjust these based on your layout
const POSITIONS = {
  OFF_SCREEN_RIGHT: () => ({
    x: window.innerWidth + 100,
    y: window.innerHeight / 2
  }),
  
  TOP_MIDDLE: () => ({
    x: window.innerWidth / 2,
    y: 100  // Adjust based on your header
  }),
  
  ABOVE_CHAT_BOX: (x, y) => ({
    x: x,
    y: y - 50  // Adjust offset from input
  }),
  
  NEAR_AI_MESSAGE: (x, y) => ({
    x: x - 30,  // Adjust offset from message
    y: y
  })
};
```

### Timing (in Astro.js)
```javascript
const TIMING = {
  SHRINK_DURATION: 450,      // Shrink animation time
  TRAVEL_DURATION: 1000,      // Movement time
  RETURN_TO_CHAT_DELAY: 500,  // Wait before returning
  // ... other timings
};
```

## 5. Available Methods

### Lifecycle Methods
- `onChatOpen()` - Initial entrance animation
- `onFirstInputFocus(x, y)` - First time user focuses input
- `onUserSendsMessage(x, y)` - User sends, Astro moves up
- `onAIMessageReady()` - AI ready, stop loader, start pulse
- `onAIMessageShown(x, y)` - Text shown, return to input
- `onUserTyping(x, y, width, caretPos)` - Track typing

### Rive State Triggers
- `triggerIdle()` - Default state
- `triggerPulse()` - Call-to-action bounce
- `triggerBigLoader()` - Loading animation
- `triggerPublish()` - Success animation
- `triggerUndo()` - Undo animation
- ... (see Astro.js for full list)

### Utility Methods
- `moveTo(x, y)` - Move to any position
- `cancelAnimations()` - Cancel all queued animations

## 6. Important Notes

1. **Z-Index**: Astro uses `z-index: 20000` by default. Adjust if needed.

2. **Pointer Events**: Astro has `pointer-events: none` so it doesn't block clicks.

3. **Animation Queue**: Movements are queued and can be cancelled. Rapid calls are automatically debounced.

4. **Console Logs**: Watch console for state changes: `[Astro] State: idle → loader`

5. **Required Files**:
   - `Astro.js` - Main component
   - `astro_master_(24).riv` - Rive animation file (place in public folder)
   - `@rive-app/react-canvas` - NPM package

## 7. Example: Complete Integration

```jsx
import React, { useRef, useState, useEffect } from 'react';
import Astro from './Astro';

function ProductionChat() {
  const astroRef = useRef(null);
  const [isFirstFocus, setIsFirstFocus] = useState(true);
  
  // Chat opens
  useEffect(() => {
    setTimeout(() => {
      astroRef.current?.onChatOpen();
    }, 500);
  }, []);
  
  // Input handlers
  const handleInputFocus = (e) => {
    if (isFirstFocus) {
      const rect = e.target.getBoundingClientRect();
      astroRef.current?.onFirstInputFocus(
        rect.left + rect.width / 2,
        rect.top
      );
      setIsFirstFocus(false);
    }
  };
  
  const handleInputChange = (e) => {
    const rect = e.target.getBoundingClientRect();
    const caretPos = e.target.selectionStart / e.target.value.length;
    astroRef.current?.onUserTyping(
      rect.left,
      rect.top + rect.height / 2,
      rect.width,
      caretPos
    );
  };
  
  const sendMessage = async (message) => {
    // Move to AI message position
    astroRef.current?.onUserSendsMessage(300, 400);
    
    // Send to backend
    const response = await api.sendMessage(message);
    
    // AI ready
    astroRef.current?.onAIMessageReady();
    
    // Render message
    addMessageToChat(response);
    
    // Return to input
    const inputRect = inputRef.current.getBoundingClientRect();
    astroRef.current?.onAIMessageShown(
      inputRect.left + inputRect.width / 2,
      inputRect.top
    );
  };
  
  return (
    <div className="chat-container">
      <Astro ref={astroRef} />
      
      <div className="messages">
        {/* Your messages */}
      </div>
      
      <input
        onFocus={handleInputFocus}
        onChange={handleInputChange}
        placeholder="Type a message..."
      />
    </div>
  );
}
```

## 8. Troubleshooting

**Astro not moving?**
- Check console for errors
- Verify Rive file is loaded
- Check x,y coordinates are valid

**Animation looks janky?**
- Adjust timing constants
- Check for conflicting CSS transitions
- Ensure 60fps by using Chrome DevTools Performance tab

**First focus not working?**
- Make sure `isFirstFocus` state is properly managed
- Verify input element has proper ref

**Eyes not tracking?**
- Rive file must have xAxis/yAxis inputs configured
- Check normalized values are 0-100

## 9. Testing the Demo

1. Run `npm start` in the demo project
2. Click "Complete Flow" button to see full animation sequence
3. Test individual states with control buttons
4. Type in chat to see eye tracking
5. Send messages to see complete loop

## Questions?

Refer to:
- `ASTRO_DESIGN_DOC.md` - Complete design specifications
- `Astro.js` - Well-commented source code
- Demo app - Working example implementation