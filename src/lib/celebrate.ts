// Cheerful confetti / sparkle helpers (client-only). Used for joyful moments:
// finishing the sheet upload, and reaching good-standing / Dean's List GPA.
import confetti from "canvas-confetti";

const BRAND = ["#1E8378", "#2C6E91", "#6BA6CF", "#6BD3A8", "#102A40"];
const GOLD = ["#E6B94D", "#F2D17A", "#1E8378", "#6BD3A8", "#fff"];

export function burst() {
  const end = Date.now() + 700;
  const tick = () => {
    confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors: BRAND, scalar: 0.9 });
    confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors: BRAND, scalar: 0.9 });
    if (Date.now() < end) requestAnimationFrame(tick);
  };
  tick();
}

export function pop() {
  confetti({ particleCount: 90, spread: 80, startVelocity: 38, origin: { y: 0.55 }, colors: BRAND, scalar: 0.95 });
}

export function deansList() {
  // golden double-burst + a little shimmer
  confetti({ particleCount: 120, spread: 100, startVelocity: 45, origin: { y: 0.5 }, colors: GOLD, scalar: 1.05 });
  setTimeout(() => confetti({ particleCount: 60, spread: 120, startVelocity: 30, decay: 0.92, origin: { y: 0.45 }, colors: GOLD, shapes: ["star"], scalar: 1.2 }), 200);
}
