import { useEffect, useRef, useState } from "react";

// Checkpoints the counter passes through on the way up — only ones between
// the start and the final value apply, so bigger rolls cross more of them.
// Each segment after a checkpoint runs slower than the last, so it feels like it's grinding to a halt.
const CHECKPOINTS = [75, 125, 175, 225, 300, 400, 450, 500, 550, 600, 720, 740, 760, 780, 800,820,840,860,880, 900];
const BASE_CLIMB_MS = 1500;
const SLOWDOWN_FACTOR = 1.2;
const FINAL_MS = 3500;

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function buildSegments(startValue, value) {
  const passedCheckpoints = CHECKPOINTS.filter((cp) => cp > startValue && cp < value);
  const segments = [];
  let from = startValue;
  let duration = BASE_CLIMB_MS;

  for (const checkpoint of passedCheckpoints) {
    segments.push({ from, to: checkpoint, duration, ease: easeInOutQuad });
    from = checkpoint;
    duration *= SLOWDOWN_FACTOR;
  }

  segments.push({ from, to: value, duration: Math.max(duration, FINAL_MS), ease: easeOutCubic });
  return segments;
}

function getRangeTier(value, range) {
  if (!range) return null;
  const span = range.max - range.min;
  if (span <= 0) return "mid";
  const position = (value - range.min) / span;
  if (position < 1 / 3) return "low";
  if (position < 2 / 3) return "mid";
  return "high";
}

function AnimatedNumber({ value, onComplete, startFrom = 0, range }) {
  const [displayed, setDisplayed] = useState(startFrom);
  const [isRolling, setIsRolling] = useState(false);
  const previousValue = useRef(startFrom);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const segments = buildSegments(previousValue.current, value);
    let segmentIndex = 0;
    let segmentStart = performance.now();
    let frameId;

    setIsRolling(true);

    const tick = (now) => {
      const segment = segments[segmentIndex];
      const progress = Math.min((now - segmentStart) / segment.duration, 1);
      const eased = segment.ease(progress);
      setDisplayed(Math.round(segment.from + (segment.to - segment.from) * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      segmentIndex += 1;
      if (segmentIndex < segments.length) {
        segmentStart = now;
        frameId = requestAnimationFrame(tick);
      } else {
        previousValue.current = value;
        setIsRolling(false);
        onCompleteRef.current?.();
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [value]);

  const tier = getRangeTier(displayed, range);

  return (
    <span
      className={`animated-number${isRolling ? " is-rolling" : ""}${tier ? ` tier-${tier}` : ""}`}
    >
      {displayed}
    </span>
  );
}

export default AnimatedNumber;
