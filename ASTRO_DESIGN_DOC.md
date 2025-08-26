# Astro Character Interaction System - Design Document

## Overview
Astro is an interactive chat assistant character that responds to user interactions with sophisticated animations combining React-based movement and Rive state machine animations.

## Architecture

### 1. Animation Layers

#### React Animation Layer (Movement & Positioning)
- **Position Control**: Absolute positioning using CSS transforms
- **Motion Path**: Bezier curve animations with blue dot trail effect
- **Size Transitions**: Shrinking/growing during relocation
- **Responsibility**: All spatial movement across the screen

#### Rive Animation Layer (Character States)
- **State Machine**: Controls character expressions and internal animations
- **Eye Tracking**: Follows mouse cursor (xAxis/yAxis inputs)
- **State Triggers**: Various animation states (idle, pulse, loader, etc.)
- **Responsibility**: Character personality and expression

### 2. Interaction Flow States

#### State 1: Initial Load
- **Position**: Off-screen right
- **Rive State**: Hidden/Idle
- **React State**: Position stored but not visible

#### State 2: Chat Open (onChatOpen)
- **Trigger**: Chat interface becomes visible
- **Movement**: Slide from right off-screen to top-middle of screen
- **Animation Sequence**:
  1. Set initial position (off-screen right)
  2. Trigger movement to center-top position
  3. Use React animation with trail effect
  4. End in Idle state

#### State 3: First Input Focus (onFirstInputFocus)
- **Trigger**: User clicks/focuses input field for the FIRST time only
- **Movement**: Move from top-middle to top of chat input box
- **Animation Sequence**:
  1. Trigger shrink animation
  2. Move with blue trail to chat box position
  3. Expand back to normal size
  4. Set to Idle state

#### State 4: Message Send Loop

##### 4a: User Sends Message (onUserSendsMessage)
- **Trigger**: User submits a message
- **Movement**: Move from chat box to where AI response will appear
- **Animation Sequence**:
  1. Shrink at current position
  2. Move with trail to AI message position
  3. Expand at destination
  4. Automatically trigger Loader state (spinning eyes)

##### 4b: AI Message Ready (onAIMessageReady)
- **Trigger**: External system signals AI response is ready
- **Rive State**: Stop Loader, trigger Pulse/Call-to-Action
- **Position**: Stays at AI message location
- **Animation**: Bouncing/pulsing to show message incoming

##### 4c: AI Message Shown (onAIMessageShown)
- **Trigger**: AI message fully rendered
- **Movement**: Return to chat input box
- **Animation Sequence**:
  1. Wait brief moment (show message)
  2. Shrink at current position
  3. Move with trail back to chat box
  4. Expand and return to Idle

### 3. Function Architecture (Ref-Based Direct Control)

```javascript
// Usage: const astroRef = useRef()
// Call methods directly: astroRef.current.onChatOpen()

class AstroController {
  // === LIFECYCLE METHODS (Main Integration Points) ===
  onChatOpen()           // Initial entrance from off-screen
  onFirstInputFocus()    // First-time input field focus
  onUserSendsMessage()   // User sends → Move up + Start loader
  onAIMessageReady()     // AI ready → Stop loader + Start pulse
  onAIMessageShown()     // Text shown → Move back to chat box
  onUserTyping(caretPos) // Track caret position with eyes
  
  // === RIVE STATE TRIGGERS (All Available States) ===
  triggerIdle()          // Default resting state
  triggerUndo()          // Undo animation
  triggerIdeaSpark()     // Light bulb moment
  triggerBoredom()       // Idle too long
  triggerBigLoader()     // Large loading spinner
  triggerSmallLoader()   // Small loading spinner
  triggerShrink()        // Shrinking animation
  triggerPulse()         // Call-to-action bounce
  triggerPublish()       // Success celebration
  
  // === UTILITY METHODS ===
  moveTo(x, y)           // Direct movement control
  cancelAnimations()     // Cancel all queued animations
  
  // === STATE MANAGEMENT ===
  isFirstFocus: boolean
  currentPosition: {x, y}
  animationQueue: []
}
```

### 4. Implementation Details

#### Position Calculations
```javascript
// Top Middle Position
{
  x: window.innerWidth / 2,
  y: 100 // Fixed offset from top
}

// Chat Box Position (relative to input element)
{
  x: chatBoxRect.left + 20,
  y: chatBoxRect.top - 40 // Above input
}

// AI Message Position (relative to message bubble)
{
  x: messageRect.left - 20,
  y: messageRect.top + messageRect.height / 2
}
```

#### Animation Timing
- Chat Open: 1000ms total (shrink: 450ms, travel: 550ms)
- First Message: 800ms total
- Message Send: 600ms (quick response)
- Pulse Duration: Until AI response ready
- Return to Box: 800ms

#### State Flags
- `isChatOpen`: Track if chat interface is active
- `isFirstMessage`: One-time flag for first interaction
- `isAnimating`: Prevent overlapping animations
- `currentState`: Track current animation state

### 5. Component Integration

#### Astro.js Modifications
- Add lifecycle methods (onChatOpen, onFirstMessage, etc.)
- Separate React animations from Rive triggers
- Implement position calculation helpers
- Add state management for first message tracking

#### ChatMock.js Integration
- Track first input focus event
- Call appropriate Astro lifecycle methods
- Provide position rectangles for animations
- Handle timing between state transitions

#### App.js Orchestration
- Initialize Astro with proper refs
- Connect ChatMock events to Astro methods
- Manage overall application state
- Handle edge cases and interruptions

### 6. Edge Cases & Considerations

1. **Rapid Message Sending**: Queue animations or cancel previous
2. **Window Resize**: Recalculate positions dynamically
3. **Animation Interruption**: Gracefully handle state changes
4. **Performance**: Use requestAnimationFrame for smooth animations
5. **Mobile Responsiveness**: Adjust positions for smaller screens

### 7. Integration Example for Production

```javascript
// In your production chat component:
import Astro from './Astro';

function ChatInterface() {
  const astroRef = useRef();
  const [isFirstFocus, setIsFirstFocus] = useState(true);

  // When chat opens
  useEffect(() => {
    astroRef.current?.onChatOpen();
  }, []);

  // Input field handlers
  const handleInputFocus = (e) => {
    if (isFirstFocus) {
      const rect = e.target.getBoundingClientRect();
      astroRef.current?.onFirstInputFocus(rect);
      setIsFirstFocus(false);
    }
  };

  const handleInputChange = (e) => {
    const caretPosition = e.target.selectionStart / e.target.value.length;
    const rect = e.target.getBoundingClientRect();
    astroRef.current?.onUserTyping(rect, caretPosition);
  };

  const handleSendMessage = async (message) => {
    // Get position where AI message will appear
    const aiMessageRect = getAIMessagePosition();
    astroRef.current?.onUserSendsMessage(aiMessageRect);
    
    // Send to backend
    const response = await sendToAI(message);
    
    // When AI is ready but before showing text
    astroRef.current?.onAIMessageReady();
    
    // Render the AI message
    renderAIMessage(response);
    
    // After message is visible
    const chatBoxRect = getChatBoxRect();
    astroRef.current?.onAIMessageShown(chatBoxRect);
  };

  return (
    <>
      <Astro ref={astroRef} />
      {/* Your chat UI */}
    </>
  );
}
```

### 8. Testing Checklist

- [ ] Chat open animation works smoothly
- [ ] First input focus trigger only fires once
- [ ] Message loop animations are consistent
- [ ] Loader state activates after movement
- [ ] Pulse animation timing is correct
- [ ] Eyes track typing caret position
- [ ] Animation cancellation works properly
- [ ] Positions adjust to window resize
- [ ] No animation conflicts or glitches
- [ ] Rive states transition properly
- [ ] Trail effect renders correctly
- [ ] Performance is smooth (60fps)

## Next Steps

1. Refactor Astro.js to implement new lifecycle methods
2. Update ChatMock to track first message state
3. Implement position calculation utilities
4. Add animation queueing system
5. Test complete interaction flow
6. Optimize for performance
7. Add error handling and edge cases