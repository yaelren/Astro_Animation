import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

// ========================================
// ========== CONFIGURATION ==============
// ========================================

// Rive File and State Machine Configuration
const RIVE_FILE = "astro_master_(31_color).riv";
const STATE_MACHINE_NAME = "Astro State Machine";

// Rive State Names (these must match your Rive file exactly)
const RIVE_STATES = {
  IDLE: "Idle", //trigger
  UNDO: "Undo", //trigger
  IDEA_SPARK: "Idea_Spark", //trigger
  BOREDOM: "Boredom", //boolean
  BIG_LOADER: "Big_Loader", //trigger - not currently used
  SMALL_LOADER: "Small_Loader", //trigger
  SHRINK: "Shrink", //trigger
  PULSE: "Pulse", //trigger
  PUBLISH: "Publish", //trigger
  BLINK: "Blink", //trigger 
  RED_COLOR: "Red", //astro red amount (0-255),
  GREEN_COLOR: "Green", //astro green amount (0-255),
  BLUE_COLOR: "Blue", //astro blue amount (0-255),
};

// Rive Input Names for eye tracking
const RIVE_INPUTS = {
  MOUSE_X: "xAxis", //number input
  MOUSE_Y: "yAxis", //number input
};

// Eye tracking smoothing configuration
const EYE_TRACKING = {
  SMOOTHING_FACTOR: 0.2,        // Lower = smoother/slower, Higher = more responsive
  DELAY_MS: 3,                 // Delay before eyes start following target (in milliseconds)
  BOREDOM_EYE_PLACEMENT: { x: 10, y: 10 }, // Where eyes look when bored (0-100 range)
};

// Animation Timing Configuration (in milliseconds)
// TODO: Wire these to your production configuration
const TIMING = {
  SHRINK_DURATION: 450,        // Time for Astro to shrink before moving
  TRAVEL_DURATION: 1000,        // Time for Astro to travel between positions
  DELAY_BEFORE_MOVE: 400,       // Pause after shrinking before starting movement
  RETURN_TO_CHAT_DELAY: 500,   // Wait time before returning to chat box
  DEBOUNCE_DELAY: 100,          // Debounce for preventing rapid triggers
  ANIMATION_FRAME_DELAY: 16,    // Single frame delay (60fps)
  BOREDOM_TIMEOUT: 7000,    // Time of inactivity before triggering boredom (7 seconds for testing)
  DOT_FADE_DURATION: 500,      // Duration for the initial black-to-blue fade of the lead dot
  BLINK_INTERVAL: 3050,        // Base time between blinks (3.05 seconds)
  BLINK_VARIATION: 2950,        // Random variation in blink timing (+/- 2.95 seconds)
  BLINK_MIN_INTERVAL: 100,      // Minimum time between blinks (0.1 seconds for double blinks)
};

// Visual Animation Configuration
const ANIMATION_CONFIG = {
  // Trail effect configuration
  TRAIL_COUNT: 19,              // Number of dots in the trail
  TRAIL_STAGGER: 1.5,           // Milliseconds between each trail dot
  TRAIL_FADE: 0.25,             // Minimum opacity for trail dots
  TRAIL_MIN_SCALE: 0.9,         // Minimum scale for trail dots
  TRAIL_BLUR: 0.6,              // Blur amount for trail dots (in pixels)
  
  // Dot appearance
  DOT_SIZE: 12,                 // Size of the movement dots (in pixels)
  DOT_COLOR: "#3AA0FF",         // Color of the movement dots
  
  // Motion path configuration
  SWAY_AMOUNT: 100,              // How much the path curves
  CONTROL_POINT_1: 0.33,        // First bezier control point position (0-1)
  CONTROL_POINT_2: 0.66,        // Second bezier control point position (0-1)
  EASING: "cubic-bezier(0.22,1,0.36,1)", // CSS easing function
};

// Layout Position Configuration
// TODO: Replace these with your actual layout positions
const POSITIONS = {
  // Initial position off-screen right
  OFF_SCREEN_RIGHT: () => ({
    x: window.innerWidth + 100,  // Fully off-screen to the right
    y: window.innerHeight +100    // Vertically centered
  }),
  
  // Middle of the chat area (slightly above center)
  TOP_MIDDLE: () => ({
    x: window.innerWidth / 2 - 160,  // Center of chat area (accounting for sidebar)
    y: window.innerHeight / 2 - 120  // Positioned above greeting text
  }),
  
  // Position at top-left of chat input box
  ABOVE_CHAT_BOX: (x, y) => ({
    x: x +13 ,                    // TODO: Adjust left offset from input field
    y: y - 45                     // TODO: Adjust vertical offset above input
  }),
  
  // Position near AI message bubble
  NEAR_AI_MESSAGE: (x, y) => ({
    x:  x +13,                    // TODO: Adjust offset from message bubble
    y: y+20                          // Vertically aligned with message
  }),
};

// Component Dimensions
const ASTRO_SIZE = {
  WIDTH: 90,                     // Width of Astro character
  HEIGHT: 90,                    // Height of Astro character
  Z_INDEX: 20000,                // Z-index to ensure Astro appears on top
};

// Predefined color schemes for Astro
const ASTRO_COLORS = {
  green: { r: 125, g: 210, b: 128 },
  pink: { r: 245, g: 138, b: 144 },
  purple: { r: 168, g: 114, b: 246 },
  black: { r: 0, g: 0, b: 0 },
};

// ========================================
// ========== HELPER FUNCTIONS ===========
// ========================================

// Motion path helpers with Safari prefix support
function setMotionPath(el, d) {
  el.style.offsetPath = `path("${d}")`;
  el.style.webkitOffsetPath = `path("${d}")`;
}

function setOffsetDistance(el, v) {
  el.style.offsetDistance = v;
  el.style.webkitOffsetDistance = v;
}

function setOffsetRotate(el, v) {
  el.style.offsetRotate = v;
  el.style.webkitOffsetRotate = v;
}

function setOffsetAnchor(el, v) {
  el.style.offsetAnchor = v;
  el.style.webkitOffsetAnchor = v;
}

// Build a curved bezier path between two points
function buildPathD(start, end) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len;
  const ny = dx / len;
  
  // Add some randomness to make movements feel natural
  const sway = ANIMATION_CONFIG.SWAY_AMOUNT * (0.85 + Math.random() * 0.3);
  
  // Calculate control points for bezier curve
  const c1x = start.x + dx * ANIMATION_CONFIG.CONTROL_POINT_1 + nx * sway;
  const c1y = start.y + dy * ANIMATION_CONFIG.CONTROL_POINT_1 + ny * sway;
  const c2x = start.x + dx * ANIMATION_CONFIG.CONTROL_POINT_2 - nx * (sway * 0.65);
  const c2y = start.y + dy * ANIMATION_CONFIG.CONTROL_POINT_2 - ny * (sway * 0.65);
  
  return `M ${start.x},${start.y} C ${c1x},${c1y} ${c2x},${c2y} ${end.x},${end.y}`;
}

// ========================================
// ========== MAIN COMPONENT =============
// ========================================

const Astro = forwardRef(function Astro(props, ref) {
  const {
    width = ASTRO_SIZE.WIDTH,
    height = ASTRO_SIZE.HEIGHT,
    initialX = POSITIONS.OFF_SCREEN_RIGHT().x,
    initialY = POSITIONS.OFF_SCREEN_RIGHT().y,
    zIndex = ASTRO_SIZE.Z_INDEX,
    onReady,
  } = props;

  // ========== STATE MANAGEMENT ==========
  const [center, setCenter] = useState({ x: initialX, y: initialY });
  const [riveHidden, setRiveHidden] = useState(false);
  const [currentState, setCurrentState] = useState("idle");
  const [isTyping, setIsTyping] = useState(false);
  const [isBored, setIsBored] = useState(false);
  
  // Eye tracking smoothing state
  const [currentEyePos, setCurrentEyePos] = useState({ x: 50, y: 50 });
  const [targetEyePos, setTargetEyePos] = useState({ x: 50, y: 50 });
  
  // ========== REFS ==========
  const wrapperRef = useRef(null);
  const leadDotRef = useRef(null);
  const trailRefs = useRef([]);
  const isFirstFocus = useRef(true);
  const animationQueue = useRef([]);
  const isAnimating = useRef(false);
  const currentAnimation = useRef(null);
  const animationDebounce = useRef(null);
  const typingTimeout = useRef(null);
  const boredomTimeout = useRef(null);
  const eyeTrackingAnimationId = useRef(null);
  const eyeDelayTimeout = useRef(null);
  const blinkInterval = useRef(null);

  // ========== RIVE SETUP ==========
  const { rive, RiveComponent } = useRive({
    src: RIVE_FILE,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
    onLoad: () => {
      console.log("[Astro] Rive file loaded successfully:", RIVE_FILE);
    },
    onLoadError: (error) => {
      console.error("[Astro] Rive file failed to load:", RIVE_FILE, error);
    },
  });

  // Get all Rive state triggers
  const idleTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.IDLE);
  const undoTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.UNDO);
  const ideaTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.IDEA_SPARK);
  const boredTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.BOREDOM);
  const bigLoadTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.BIG_LOADER);
  const smallLoadTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.SMALL_LOADER);
  const shrinkTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.SHRINK);
  const pulseTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.PULSE);
  const publishTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.PUBLISH);
  const blinkTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.BLINK);
  
  // Get color inputs for Astro customization
  const redInput = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.RED_COLOR);
  const greenInput = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.GREEN_COLOR);
  const blueInput = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_STATES.BLUE_COLOR);

  // Get eye tracking inputs
  const xAxis = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_INPUTS.MOUSE_X);
  const yAxis = useStateMachineInput(rive, STATE_MACHINE_NAME, RIVE_INPUTS.MOUSE_Y);

  // Debug Rive state
  useEffect(() => {
    if (rive) {
      console.log("[Astro] Rive instance ready");
      console.log("[Astro] Available state machines:", rive.stateMachineNames);
    }
  }, [rive]);

  useEffect(() => {
    if (xAxis && yAxis) {
      console.log("[Astro] Eye tracking inputs ready");
    }
  }, [xAxis, yAxis]);

  // ========== UTILITY FUNCTIONS ==========
  
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  
  const setBoredomState = (enabled, restartTimer = true) => {
    // Only set the Rive trigger if it exists
    try {
      if (boredTrig) {
        boredTrig.value = enabled;
      }
    } catch (err) {
      // Silently handle if boredTrig isn't ready yet
    }
    
    setIsBored(enabled);
    if(enabled)
    {
      setTargetEyePos(EYE_TRACKING.BOREDOM_EYE_PLACEMENT);
    }    
    else {
      // Clear existing timeout when turning off
      if (boredomTimeout.current) {
        clearTimeout(boredomTimeout.current);
      }
      
      // Restart timer if requested (for user interactions)
      if (restartTimer) {
        boredomTimeout.current = setTimeout(() => {
          if (!isTyping) {
            setBoredomState(true, false);
          }
        }, TIMING.BOREDOM_TIMEOUT);
      }
    }
  };

  const logStateChange = (from, to) => {
    console.log(`[Astro] State: ${from} → ${to}`);
    setCurrentState(to);
  };

  // Calculate relative mouse position based on Astro's position on screen
  const calculateRelativeMousePosition = (mouseX, mouseY, astroX, astroY) => {
    // Calculate the relative position of mouse to Astro's center
    const relativeX = mouseX - astroX;
    const relativeY = mouseY - astroY;
    
    // Define the range Astro can look (in pixels from his center)
    const lookRange = 300; // Increased range for better responsiveness
    
    // Normalize to 0-100 range for Rive
    // For X: mouse left of Astro = higher values (looks left), mouse right = lower values (looks right)
    // For Y: mouse above Astro = higher values (looks up), mouse below = lower values (looks down)
    const normalizedX = Math.max(0, Math.min(100, 50 - (relativeX / lookRange) * 50));
    const normalizedY = Math.max(0, Math.min(100, 50 - (relativeY / lookRange) * 50));
    
    // Debug logging
    // console.log(`[Astro Eye Tracking] Mouse: (${mouseX}, ${mouseY}), Astro: (${astroX}, ${astroY}), Relative: (${relativeX}, ${relativeY}), Normalized: (${normalizedX.toFixed(1)}, ${normalizedY.toFixed(1)})`);
    
    return { x: normalizedX, y: normalizedY };
  };

  // Smoothly interpolate eye position with delay for natural movement
  const updateEyePosition = (targetX, targetY) => {
    // Clear any existing delay timeout
    if (eyeDelayTimeout.current) {
      clearTimeout(eyeDelayTimeout.current);
    }
    
    // Apply delay before updating target position
    eyeDelayTimeout.current = setTimeout(() => {
      setTargetEyePos({ x: targetX, y: targetY });
    }, EYE_TRACKING.DELAY_MS);
  };

  // Set eye position immediately (for specific cases where no smoothing is needed)
  const setEyePositionImmediate = (x, y) => {
    // Clear any pending delayed updates
    if (eyeDelayTimeout.current) {
      clearTimeout(eyeDelayTimeout.current);
    }
    
    setCurrentEyePos({ x, y });
    setTargetEyePos({ x, y });
    if (xAxis) xAxis.value = x;
    if (yAxis) yAxis.value = y;
  };

  // Wait for Rive to be ready
  async function waitForRive(timeoutMs = 5000) {
    const startT = performance.now();
    while (!rive && performance.now() - startT < timeoutMs) {
      await sleep(TIMING.ANIMATION_FRAME_DELAY);
    }
    return !!rive;
  }

  // ========== ANIMATION QUEUE MANAGEMENT ==========
  
  const cancelCurrentAnimation = () => {
    if (currentAnimation.current) {
      currentAnimation.current.cancelled = true;
      currentAnimation.current = null;
    }
  };

  const processAnimationQueue = async () => {
    if (isAnimating.current || animationQueue.current.length === 0) return;
    
    isAnimating.current = true;
    const nextAnim = animationQueue.current.shift();
    
    if (nextAnim) {
      currentAnimation.current = nextAnim;
      try {
        await nextAnim.fn();
      } catch (err) {
        console.error("[Astro] Animation error:", err);
      } finally {
        currentAnimation.current = null;
        isAnimating.current = false;
        processAnimationQueue();
      }
    } else {
      isAnimating.current = false;
    }
  };

  const queueAnimation = (fn, options = {}) => {
    if (options.cancelPrevious) {
      cancelCurrentAnimation();
      animationQueue.current = [];
    }
    
    if (options.debounce) {
      if (animationDebounce.current) {
        clearTimeout(animationDebounce.current);
      }
      animationDebounce.current = setTimeout(() => {
        animationQueue.current.push({ fn, cancelled: false });
        processAnimationQueue();
      }, options.debounce);
    } else {
      animationQueue.current.push({ fn, cancelled: false });
      processAnimationQueue();
    }
  };

  // ========== CORE MOVEMENT FUNCTION ==========
  
  async function moveToPosition(x, y, options = {}) {
    if (!x || !y) {
      console.log("[Astro] Invalid position, skipping animation");
      return;
    }

    await waitForRive();
    
    const lead = leadDotRef.current;
    if (!lead) return;

    const anim = currentAnimation.current;
    
    // Update eye position to look at target (relative to Astro's current position)
    try {
      const relativePos = calculateRelativeMousePosition(x, y, center.x, center.y);
      updateEyePosition(relativePos.x, relativePos.y);
    } catch {}

    if (anim?.cancelled) return;

    // Trigger shrink animation only if not explicitly skipped
    if (!options.skipShrink) {
      logStateChange(currentState, "shrinking");
      try { shrinkTrig?.fire(); } catch {}
      await sleep(TIMING.SHRINK_DURATION);
    }
    
    if (anim?.cancelled) return;

    // Hide Rive and show trail dots
    setRiveHidden(true);
    const start = { x: center.x, y: center.y };
    const end = { x, y };

    // Setup lead dot with initial black color for fade effect
    lead.style.opacity = "1";
    lead.style.background = "#000000"; // Start with black
    
    // Setup trail dots with gradient effect
    trailRefs.current.forEach((d, i) => {
      if (!d) return;
      const ratio = (i + 1) / ANIMATION_CONFIG.TRAIL_COUNT;
      const scale = ANIMATION_CONFIG.TRAIL_MIN_SCALE + (1 - ANIMATION_CONFIG.TRAIL_MIN_SCALE) * (1 - ratio);
      const opacity = ANIMATION_CONFIG.TRAIL_FADE + (1 - ANIMATION_CONFIG.TRAIL_FADE) * (1 - ratio);
      d.style.opacity = String(opacity);
      d.style.transform = `scale(${scale})`;
    });

    // Immediately start the black-to-blue fade for the lead dot
    lead.animate(
      [
        { background: "#000000" }, // Start black
        { background: ANIMATION_CONFIG.DOT_COLOR }  // Fade to blue
      ],
      { 
        duration: TIMING.DOT_FADE_DURATION,
        easing: "ease-out",
        fill: "forwards"
      }
    );

    await sleep(TIMING.DELAY_BEFORE_MOVE);
    
    if (anim?.cancelled) return;

    // Create curved path
    const pathD = buildPathD(start, end);

    // Prepare dots for animation
    const prepDot = (el) => {
      if (!el) return;
      setMotionPath(el, pathD);
      setOffsetDistance(el, "0%");
      setOffsetRotate(el, "0deg");
      setOffsetAnchor(el, "50% 50%");
    };
    
    prepDot(lead);
    trailRefs.current.forEach((td) => td && prepDot(td));

    // Animate lead dot
    const leadAnim = lead.animate(
      [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
      { duration: TIMING.TRAVEL_DURATION, easing: ANIMATION_CONFIG.EASING, fill: "forwards" }
    );

    // Animate trail dots with stagger
    trailRefs.current.forEach((td, i) => {
      if (!td) return;
      td.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
        duration: TIMING.TRAVEL_DURATION,
        delay: (i + 1) * ANIMATION_CONFIG.TRAIL_STAGGER,
        easing: ANIMATION_CONFIG.EASING,
        fill: "forwards",
      });
    });

    await leadAnim.finished;
    
    if (anim?.cancelled) return;

    // Hide dots and show Rive at new position
    lead.style.opacity = "0";
    trailRefs.current.forEach((td) => td && (td.style.opacity = "0"));
    setCenter({ x, y });
    setRiveHidden(false);

    // Update eye position after render (look straight ahead at new position)
    await new Promise((r) => requestAnimationFrame(() => r()));
    
    try {
      setEyePositionImmediate(50, 50); // Look straight ahead when at target
    } catch {}

    // Apply end state if specified
    if (options.endState) {
      logStateChange("moving", options.endState);
      switch (options.endState) {
        case 'pulse':
          try { pulseTrig?.fire(); } catch {}
          break;
        case 'idle':
          try { idleTrig?.fire(); } catch {}
          break;
        case 'small-loader':
          try { smallLoadTrig?.fire(); } catch {}
          break;
      }
    } else {
      // Default to idle if no end state specified
      logStateChange("moving", "idle");
      try { idleTrig?.fire(); } catch {}
    }
  }

  // ========================================
  // ========== LIFECYCLE METHODS ==========
  // ========================================

  const onChatOpen = () => {
    logStateChange(currentState, "entering");
    const startPos = POSITIONS.OFF_SCREEN_RIGHT();
    setCenter(startPos);
    
    queueAnimation(async () => {
      const endPos = POSITIONS.TOP_MIDDLE();
      await moveToPosition(endPos.x, endPos.y, { endState: 'idle' });
    }, { cancelPrevious: true });
  };

  const onFirstInputFocus = (x, y) => {
    if (!isFirstFocus.current) return;
    
    logStateChange(currentState, "first-focus");
    isFirstFocus.current = false;
    
    queueAnimation(async () => {
      const pos = POSITIONS.ABOVE_CHAT_BOX(x, y);
      await moveToPosition(pos.x, pos.y, { endState: 'idle' });
    }, { debounce: TIMING.DEBOUNCE_DELAY });
  };

  const onUserSendsMessage = (x, y) => {
    logStateChange(currentState, "user-sending");
    
    queueAnimation(async () => {
      const pos = POSITIONS.NEAR_AI_MESSAGE(x, y);
      await moveToPosition(pos.x, pos.y, { endState: 'small-loader' });
    }, { debounce: TIMING.DEBOUNCE_DELAY });
  };

  const onAIMessageReady = () => {
    logStateChange(currentState, "ai-ready");
    try { 
      pulseTrig?.fire();    // Trigger pulse
    } catch {}
  };

  const onAIMessageShown = (x, y) => {
    logStateChange(currentState, "returning");
    
    queueAnimation(async () => {
      // Trigger idle state before moving (no shrink needed)
   
      await sleep(TIMING.RETURN_TO_CHAT_DELAY);
      const pos = POSITIONS.ABOVE_CHAT_BOX(x, y);
      await moveToPosition(pos.x, pos.y, { endState: 'idle', skipShrink: true });
    }, { debounce: TIMING.DEBOUNCE_DELAY });
  };

  const onUserTyping = (caretX, caretY) => {
    if (!xAxis || !yAxis) return;
    
    try {
      // Set typing state to disable mouse tracking
      if (!isTyping) {
        console.log("[Astro] Started typing - disabled mouse tracking");
      }
      setIsTyping(true);
      
      // Reset boredom when user types
      setBoredomState(false, true);
      
      // Calculate eye position based on caret position relative to Astro's position
      // Use the same logic as mouse tracking - just with caret coordinates
      const relativePos = calculateRelativeMousePosition(caretX, caretY, center.x, center.y);
      
      // Use smooth eye tracking for typing cursor
      updateEyePosition(relativePos.x, relativePos.y);
      
      // Clear previous timeout
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      
      // Resume mouse tracking after user stops typing
      typingTimeout.current = setTimeout(() => {
        setIsTyping(false);
        console.log("[Astro] Resumed mouse tracking");
        
        // Start boredom timer after typing stops
        setBoredomState(false, true); // Reset and restart timer
      }, 1500); // 1.5 seconds after last keystroke
      
    } catch (err) {
      console.error("[Astro] Error tracking typing:", err);
    }
  };

  // ========================================
  // ========== RIVE STATE TRIGGERS ========
  // ========================================

  const triggerIdle = () => {
    logStateChange(currentState, "idle");
    try { idleTrig?.fire(); } catch {}
  };

  const triggerUndo = () => {
    logStateChange(currentState, "undo");
    try { undoTrig?.fire(); } catch {}
  };

  const triggerIdeaSpark = () => {
    logStateChange(currentState, "idea-spark");
    try { ideaTrig?.fire(); } catch {}
  };

  const triggerBoredom = () => {
    logStateChange(currentState, "boredom");
    // boredTrig.value = !boredTrig.value;
   setBoredomState(boredTrig ? !boredTrig.value : false, false);
  };

  const triggerBigLoader = () => {
    logStateChange(currentState, "big-loader");
    try { 
      bigLoadTrig?.fire();
    } catch {}
  };

  const triggerSmallLoader = () => {
    logStateChange(currentState, "small-loader");
    try { smallLoadTrig?.fire(); } catch {}
  };

  const triggerShrink = () => {
    logStateChange(currentState, "shrink");
    try { shrinkTrig?.fire(); } catch {}
  };

  const triggerPulse = () => {
    logStateChange(currentState, "pulse");
    try { pulseTrig?.fire(); } catch {}
  };

  const triggerPublish = () => {
    logStateChange(currentState, "publish");
    try { publishTrig?.fire(); } catch {}
  };

  const triggerBlink = () => {
    logStateChange(currentState, "blink");
    try { blinkTrig?.fire(); } catch {}
  };

  const changeAstroColor = (colorName) => {
    const color = ASTRO_COLORS[colorName];
    if (!color) {
      console.warn(`[Astro] Unknown color: ${colorName}. Available: ${Object.keys(ASTRO_COLORS).join(', ')}`);
      return;
    }
    
    console.log(`[Astro] Changing color to ${colorName}:`, color);
    
    try {
      if (redInput) redInput.value = color.r;
      if (greenInput) greenInput.value = color.g;
      if (blueInput) blueInput.value = color.b;
    } catch (err) {
      console.error(`[Astro] Error setting color:`, err);
    }
  };

  // ========================================
  // ========== EFFECTS & SETUP ============
  // ========================================

  // Blinking timer effect
  useEffect(() => {
    if (!blinkTrig) return;

    const scheduleNextBlink = () => {
      // Calculate random interval within configured range
      const variation = (Math.random() - 0.5) * TIMING.BLINK_VARIATION * 2;
      const interval = Math.max(TIMING.BLINK_MIN_INTERVAL, TIMING.BLINK_INTERVAL + variation);
      
      blinkInterval.current = setTimeout(() => {
        // Only blink if not in special states (moving, bored, etc.)
        if (!isAnimating.current && !riveHidden && !isBored) {
          triggerBlink();
        }
        scheduleNextBlink(); // Schedule the next blink
      }, interval);
    };

    // Start the blinking cycle
    scheduleNextBlink();

    // Cleanup on unmount
    return () => {
      if (blinkInterval.current) {
        clearTimeout(blinkInterval.current);
      }
    };
  }, [blinkTrig, isAnimating, riveHidden, isBored]);

  // Smooth eye tracking animation loop
  useEffect(() => {
    if (!xAxis || !yAxis) return;

    const animate = () => {
      const dx = targetEyePos.x - currentEyePos.x;
      const dy = targetEyePos.y - currentEyePos.y;
      
      // Only update if there's a meaningful difference
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        const newX = currentEyePos.x + (dx * EYE_TRACKING.SMOOTHING_FACTOR);
        const newY = currentEyePos.y + (dy * EYE_TRACKING.SMOOTHING_FACTOR);
        
        setCurrentEyePos({ x: newX, y: newY });
        
        // Update Rive inputs with smoothed values
        xAxis.value = newX;
        yAxis.value = newY;
      }
      
      eyeTrackingAnimationId.current = requestAnimationFrame(animate);
    };

    eyeTrackingAnimationId.current = requestAnimationFrame(animate);

    return () => {
      if (eyeTrackingAnimationId.current) {
        cancelAnimationFrame(eyeTrackingAnimationId.current);
      }
    };
  }, [xAxis, yAxis, currentEyePos, targetEyePos]);

  // Mouse tracking (only when not typing) and boredom detection
  useEffect(() => {
    if (!rive || !xAxis || !yAxis) return;

    const handleMouseMove = (e) => {
      // Don't follow mouse while user is typing
      if (isTyping) return;
      
      // Calculate mouse position relative to Astro's current position
      const relativePos = calculateRelativeMousePosition(e.clientX, e.clientY, center.x, center.y);
      
      // Use smooth eye tracking instead of direct assignment
      updateEyePosition(relativePos.x, relativePos.y);
      
      // Reset boredom on any mouse movement
      setBoredomState(false, true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    // Start initial boredom timer
    setBoredomState(false, true);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (boredomTimeout.current) {
        clearTimeout(boredomTimeout.current);
      }
      if (eyeDelayTimeout.current) {
        clearTimeout(eyeDelayTimeout.current);
      }
    };
  }, [rive, xAxis, yAxis, isTyping, center]);

  // Keep Rive container at correct position
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const left = center.x - width / 2;
    const top = center.y - height / 2;
    el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, [center, width, height]);

  // Expose API through ref
  useImperativeHandle(ref, () => ({
    // Lifecycle Methods
    onChatOpen,
    onFirstInputFocus,
    onUserSendsMessage,
    onAIMessageReady,
    onAIMessageShown,
    onUserTyping,
    
    // Rive State Triggers
    triggerIdle,
    triggerUndo,
    triggerIdeaSpark,
    triggerBoredom,
    triggerBigLoader,
    triggerSmallLoader,
    triggerShrink,
    triggerPulse,
    triggerPublish,
    triggerBlink,
    
    // Utility Methods
    cancelAnimations: () => {
      cancelCurrentAnimation();
      animationQueue.current = [];
    },
    moveTo: (x, y) => {
      queueAnimation(async () => {
        await moveToPosition(x, y, { endState: 'idle' });
      });
    },
    changeAstroColor,
  }));

  // ========================================
  // ========== RENDER =====================
  // ========================================

  return (
    <>
      {/* Lead dot for movement animation */}
      <div
        ref={leadDotRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: ANIMATION_CONFIG.DOT_SIZE,
          height: ANIMATION_CONFIG.DOT_SIZE,
          borderRadius: "50%",
          background: ANIMATION_CONFIG.DOT_COLOR,
          pointerEvents: "none",
          zIndex: zIndex,
          opacity: 0,
          transition: "opacity 120ms ease",
        }}
      />
      
      {/* Trail dots for movement effect */}
      {Array.from({ length: ANIMATION_CONFIG.TRAIL_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (trailRefs.current[i] = el)}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: ANIMATION_CONFIG.DOT_SIZE,
            height: ANIMATION_CONFIG.DOT_SIZE,
            borderRadius: "50%",
            background: ANIMATION_CONFIG.DOT_COLOR,
            pointerEvents: "none",
            zIndex: zIndex - 1,
            opacity: 0,
            transition: "opacity 120ms ease",
            filter: ANIMATION_CONFIG.TRAIL_BLUR ? `blur(${ANIMATION_CONFIG.TRAIL_BLUR}px)` : "none",
          }}
        />
      ))}

      {/* Rive character container */}
      <div
        ref={wrapperRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width,
          height,
          zIndex: zIndex - 2,
          pointerEvents: "auto", // Enable mouse interactions for hover states
          opacity: riveHidden ? 0 : 1,
          transition: "opacity 80ms linear",
          transform: "translate3d(0,0,0)",
        }}
      >
        <RiveComponent style={{ width: "100%", height: "100%" }} />
      </div>
    </>
  );
});

export default Astro;