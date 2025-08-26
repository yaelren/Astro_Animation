# Animation Improvements TODO

## Issues to Fix

### 1. Fix Animation Dot Appearance
- [ ] Investigate why movement dots don't appear or are not visible during transitions
- [ ] Check dot opacity, z-index, and positioning during animation sequences
- [ ] Ensure dots are properly styled and visible against background
- [ ] Test dot visibility across different screen sizes and positions
- [ ] Make sure animation dot is right size (currently 15px, may need adjustment)

### 2. Fix Animation Speeds
- [ ] Review and optimize timing constants in `TIMING` configuration
- [ ] Adjust `SHRINK_DURATION`, `TRAVEL_DURATION`, and `DELAY_BEFORE_MOVE`
- [ ] Test animation flow feels natural and not too fast/slow
- [ ] Synchronize animation speeds with Rive state transitions

### 3. Fix Size of Astro
- [ ] Review `ASTRO_SIZE.WIDTH` and `ASTRO_SIZE.HEIGHT` constants
- [ ] Test Astro appears at appropriate scale for different screen sizes
- [ ] Ensure Astro doesn't appear too large/small relative to UI elements
- [ ] Consider responsive sizing based on viewport

### 4. Fix Look in Relation to Astro Position
- [ ] Verify eye tracking (xAxis/yAxis) properly follows mouse and typing
- [ ] Ensure eye direction matches Astro's current screen position
- [ ] Test eye tracking during movement animations
- [ ] Fix any offset issues between Astro position and look direction

### 5. Add Getting Small to Idle Transition
- [ ] Implement automatic transition from "Getting_Small" state back to "Idle"
- [ ] Add timing logic to trigger idle state after shrink animation completes
- [ ] Ensure smooth state transition without visual glitches
- [ ] Test transition timing works well with movement animations

### 6. Implement Small Loader Animation
- [ ] Add small loader animation state to complement big loader
- [ ] Determine when to use small vs big loader (context-based)
- [ ] Test small loader visibility and animation timing
- [ ] Integrate small loader into movement sequences where appropriate

### 7. Add Delay to Mouse Tracking
- [ ] Implement delay/smoothing for mouse tracking eye movement
- [ ] Add configurable delay timing for more natural eye movement
- [ ] Prevent jittery eye movements from rapid mouse motion
- [ ] Test optimal delay timing for smooth but responsive tracking

### 8. Make Chat Background Wider
- [ ] Increase chat container width to accommodate Astro character
- [ ] Ensure Astro appears within chat area boundaries 
- [ ] Adjust chat layout to provide more space for character movement
- [ ] Test responsive behavior with wider chat area

### 9. Keep Only Rive States in UI Buttons
- [ ] Remove movement function buttons (Chat Open, First Focus, User Sends, etc.)
- [ ] Keep only Rive state trigger buttons (Idle, Pulse, Loader, etc.)
- [ ] Clean up control panel to focus on animation states only
- [ ] Reorganize button layout for better usability

### 10. Add Glow Effect (WebGL)
- [ ] Implement WebGL-based glow effect around Astro character
- [ ] Add subtle ambient glow that pulses with animations
- [ ] Ensure glow effect doesn't impact performance
- [ ] Make glow intensity configurable
- [ ] Test glow effect works across different browsers/devices

## Configuration Areas to Review

### Animation Timing (`TIMING` object)
```javascript
const TIMING = {
  SHRINK_DURATION: 450,        // Currently 450ms
  TRAVEL_DURATION: 1000,       // Currently 1000ms  
  DELAY_BEFORE_MOVE: 400,      // Currently 400ms
  RETURN_TO_CHAT_DELAY: 500,   // Currently 500ms
  DEBOUNCE_DELAY: 100,         // Currently 100ms
};
```

### Size Configuration (`ASTRO_SIZE` object)
```javascript
const ASTRO_SIZE = {
  WIDTH: 200,                  // Currently 200px
  HEIGHT: 200,                 // Currently 200px
  Z_INDEX: 20000,              // Currently 20000
};
```

### Animation Dots (`ANIMATION_CONFIG` object)
```javascript
const ANIMATION_CONFIG = {
  DOT_SIZE: 15,                // Currently 15px
  DOT_COLOR: "#3AA0FF",        // Currently blue
  TRAIL_COUNT: 19,             // Currently 19 dots
  TRAIL_FADE: 0.25,            // Currently 0.25 opacity
};
```

## Testing Checklist
- [ ] Test on different screen sizes (mobile, tablet, desktop)
- [ ] Verify animations work smoothly in different browsers
- [ ] Check performance impact of WebGL glow effect
- [ ] Test with various chat interface layouts
- [ ] Ensure accessibility is maintained

## Priority
1. **High**: Fix animation dot appearance - critical for visual feedback
2. **High**: Fix animation speeds - affects user experience
3. **Medium**: Fix Astro size - important for visual balance
4. **Medium**: Fix eye tracking accuracy
5. **Low**: Add WebGL glow - nice-to-have enhancement