import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useState,
} from "react";
import { useRive, useStateMachineInput } from "@rive-app/react-canvas";

/** ===== Rive setup (your new names) ===== */
const STATE_MACHINE_NAME = "Astro State Machine";
const RIVE_FILE = "astro_master.riv";
const IDLE_STATE = "Idle";
const UNDO_STATE = "Undo";
const IDEA_SPARK_STATE = "Idea_Spark";
const BORDEOM_STATE = "Bordeom";
const BIG_LOAD_STATE = "Big_Loader";
const SMALL_LOADE_STATE = "Small_Loader";
const SHRINK_STATE = "Getting Small";
const PLUSE_STATE = "Call-to-Action";
const PUBLISH_STATE = "Publish";
const MOUSE_X = "xAxis";
const MOUSE_Y = "yAxis";

/** =================== Animation Tuning =================== */
const ANIM = {
  shrinkMs: 450,
  delayBeforeMoveMs: 400,
  travelMs: 1000,
  sway: 80,
  cp1: 0.33,
  cp2: 0.66,
  easing: "cubic-bezier(0.22,1,0.36,1)",
  dotSize: 15,
  dotColor: "#3AA0FF",
  trailCount: 19,
  trailStaggerMs: 1.5,
  trailFade: 0.25,
  trailMinScale: 0.9,
  trailBlurPx: 0.6,
};
/** ======================================================== */

/** Motion-path helpers (with Safari prefixes) */
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
function buildPathD(start, end, sway = ANIM.sway, t1 = ANIM.cp1, t2 = ANIM.cp2) {
  const dx = end.x - start.x, dy = end.y - start.y;
  const len = Math.max(1, Math.hypot(dx, dy));
  const nx = -dy / len, ny = dx / len;
  const c1x = start.x + dx * t1 + nx * sway;
  const c1y = start.y + dy * t1 + ny * sway;
  const c2x = start.x + dx * t2 - nx * (sway * 0.65);
  const c2y = start.y + dy * t2 - ny * (sway * 0.65);
  return `M ${start.x},${start.y} C ${c1x},${c1y} ${c2x},${c2y} ${end.x},${end.y}`;
}

const Astro = forwardRef(function Astro(props, ref) {
  const {
    width = 200,
    height = 200,
    initialX = 240,
    initialY = 240,
    zIndex = 20000,
    onReady,
  } = props;

  const wrapperRef = useRef(null);
  const leadDotRef = useRef(null);
  const trailRefs = useRef([]);
  const [center, setCenter] = useState({ x: initialX, y: initialY });
  const [riveHidden, setRiveHidden] = useState(false);

  // --- Rive instance ---
  const { rive, RiveComponent } = useRive({
    src: RIVE_FILE,
    stateMachines: STATE_MACHINE_NAME,
    autoplay: true,
  });

  // --- Inputs (triggers / numbers) ---
  const idleTrig      = useStateMachineInput(rive, STATE_MACHINE_NAME, IDLE_STATE);
  const undoTrig      = useStateMachineInput(rive, STATE_MACHINE_NAME, UNDO_STATE);
  const ideaTrig      = useStateMachineInput(rive, STATE_MACHINE_NAME, IDEA_SPARK_STATE);
  const boredTrig     = useStateMachineInput(rive, STATE_MACHINE_NAME, BORDEOM_STATE);
  const bigLoadTrig   = useStateMachineInput(rive, STATE_MACHINE_NAME, BIG_LOAD_STATE);
  const smallLoadTrig = useStateMachineInput(rive, STATE_MACHINE_NAME, SMALL_LOADE_STATE);
  const shrinkTrig    = useStateMachineInput(rive, STATE_MACHINE_NAME, SHRINK_STATE);
  const pulseTrig     = useStateMachineInput(rive, STATE_MACHINE_NAME, PLUSE_STATE);
  const publishTrig   = useStateMachineInput(rive, STATE_MACHINE_NAME, PUBLISH_STATE);

  const xAxis = useStateMachineInput(rive, STATE_MACHINE_NAME, MOUSE_X);
  const yAxis = useStateMachineInput(rive, STATE_MACHINE_NAME, MOUSE_Y);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Mouse tracking
  useEffect(() => {
    if (!rive || !xAxis || !yAxis) return;

    const handleMouseMove = (e) => {
      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight;
      
      // Convert mouse position to 0-100 range
      // xAxis: 0 (left) to 100 (right)
      // yAxis: 100 (top) to 0 (bottom) - inverted Y
      xAxis.value = (e.x / maxWidth) * 100;
      yAxis.value = 100 - (e.y / maxHeight) * 100;
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [rive, xAxis, yAxis]);

  // Be lenient: allow visual move even if some inputs aren’t ready yet
  async function waitForInputs(timeoutMs = 5000) {
    const startT = performance.now();
    while (!rive && performance.now() - startT < timeoutMs) {
      await sleep(16);
    }
    return true;
  }

  // Expose a control surface to parent
  useEffect(() => {
    if (!onReady || !rive) return;
    onReady({
      publish:     () => publishTrig?.fire(),
      undo:        () => undoTrig?.fire(),
      sparkIdea:   () => ideaTrig?.fire(),
      bored:       () => boredTrig?.fire(),
      bigLoader:   () => bigLoadTrig?.fire(),
      smallLoader: () => smallLoadTrig?.fire(),
      shrink:      () => shrinkTrig?.fire(),
      pulse:       () => pulseTrig?.fire(),
      idle:        () => idleTrig?.fire(),
      /** aim/head-look if your graph uses xAxis/yAxis (normalized 0-100) */
      lookAt:      (x, y) => {
        try {
          const maxWidth = window.innerWidth;
          const maxHeight = window.innerHeight;
          if (xAxis) xAxis.value = (x / maxWidth) * 100;
          if (yAxis) yAxis.value = 100 - (y / maxHeight) * 100;
        } catch {}
      },
    });
  }, [rive, onReady, publishTrig, undoTrig, ideaTrig, boredTrig, bigLoadTrig, smallLoadTrig, shrinkTrig, pulseTrig, idleTrig, xAxis, yAxis]);

  useImperativeHandle(ref, () => ({
    /** Smoothly move Astro to (x,y) with shrink→trail→grow, plus optional Rive triggers */
    async moveTo(x, y) {
      await waitForInputs();

      const lead = leadDotRef.current;
      if (!lead) return;

      // 0) hint Rive look-at (so the face/eyes can anticipate)
      try {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        if (xAxis) xAxis.value = (x / maxWidth) * 100;
        if (yAxis) yAxis.value = 100 - (y / maxHeight) * 100;
      } catch {}

      // 1) Shrink / “hide” via your SHRINK_STATE trigger
      try { shrinkTrig?.fire(); } catch {}
      await sleep(ANIM.shrinkMs);

      // 2) Hide Rive visual, show dots from current center
      setRiveHidden(true);
      const start = { x: center.x, y: center.y };
      const end   = { x, y };

      lead.style.opacity = "1";
      trailRefs.current.forEach((d, i) => {
        if (!d) return;
        const ratio = (i + 1) / ANIM.trailCount;
        const scale = ANIM.trailMinScale + (1 - ANIM.trailMinScale) * (1 - ratio);
        const opacity = ANIM.trailFade + (1 - ANIM.trailFade) * (1 - ratio);
        d.style.opacity = String(opacity);
        d.style.transform = `scale(${scale})`;
      });

      await sleep(ANIM.delayBeforeMoveMs);

      // 3) Animate along a bezier path
      const sway = ANIM.sway * (0.85 + Math.random() * 0.3);
      const d = buildPathD(start, end, sway);

      const prepDot = (el) => {
        if (!el) return;
        setMotionPath(el, d);
        setOffsetDistance(el, "0%");
        setOffsetRotate(el, "0deg");
        setOffsetAnchor(el, "50% 50%");
      };
      prepDot(lead);
      trailRefs.current.forEach((td) => td && prepDot(td));

      const leadAnim = lead.animate(
        [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
        { duration: ANIM.travelMs, easing: ANIM.easing, fill: "forwards" }
      );

      trailRefs.current.forEach((td, i) => {
        if (!td) return;
        td.animate([{ offsetDistance: "0%" }, { offsetDistance: "100%" }], {
          duration: ANIM.travelMs,
          delay: (i + 1) * ANIM.trailStaggerMs,
          easing: ANIM.easing,
          fill: "forwards",
        });
      });

      await leadAnim.finished;

      // 4) Teleport Rive to the end, hide dots, show Rive again
      lead.style.opacity = "0";
      trailRefs.current.forEach((td) => td && (td.style.opacity = "0"));
      setCenter({ x, y });
      setRiveHidden(false);

      // 5) After next paint: nudge look-at & return to idle/pulse
      await new Promise((r) => requestAnimationFrame(() => r()));
      try {
        const maxWidth = window.innerWidth;
        const maxHeight = window.innerHeight;
        if (xAxis) xAxis.value = (x / maxWidth) * 100;
        if (yAxis) yAxis.value = 100 - (y / maxHeight) * 100;
      } catch {}
      // Choose what you want to happen on arrival:
      // - idleTrig?.fire() to settle
      // - or pulseTrig?.fire() for CTA flourish
      try { idleTrig?.fire(); } catch {}
    },
  }));

  // Keep the Rive container centered at (center.x, center.y)
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const left = center.x - width / 2;
    const top  = center.y - height / 2;
    el.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  }, [center, width, height]);

  return (
    <>
      {/* Lead dot */}
      <div
        ref={leadDotRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: ANIM.dotSize,
          height: ANIM.dotSize,
          borderRadius: "50%",
          background: ANIM.dotColor,
          pointerEvents: "none",
          zIndex: zIndex,
          opacity: 0,
          transition: "opacity 120ms ease",
        }}
      />
      {/* Trail dots */}
      {Array.from({ length: ANIM.trailCount }).map((_, i) => (
        <div
          key={i}
          ref={(el) => (trailRefs.current[i] = el)}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: ANIM.dotSize,
            height: ANIM.dotSize,
            borderRadius: "50%",
            background: ANIM.dotColor,
            pointerEvents: "none",
            zIndex: zIndex - 1,
            opacity: 0,
            transition: "opacity 120ms ease",
            filter: ANIM.trailBlurPx ? `blur(${ANIM.trailBlurPx}px)` : "none",
          }}
        />
      ))}

      {/* Rive visual (non-interactive overlay) */}
      <div
        ref={wrapperRef}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width,
          height,
          zIndex: zIndex - 2,
          pointerEvents: "none", // keep chat inputs clickable
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