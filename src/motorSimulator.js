// Dummy motor simulator untuk demo - update warnings setiap beberapa detik
import { updateGlobalWarning } from "./globalWarnings";

const motors = [
  "Motor Mainshakeout",
  "Motor Vibrating Screen",
  "Motor Bucket Elevator",
];

const thresholds = {
  vibration: { min: 0, max: 8 },
  temperature: { min: 30, max: 85 },
  current: { min: 8, max: 16 },
  power: { min: 800, max: 1800 },
  noise: { min: 60, max: 90 },
};

const generateData = () => {
  const isAbnormal = Math.random() > 0.6;

  return {
    vibration: parseFloat(
      (isAbnormal && Math.random() > 0.5
        ? Math.random() * 5 + 9
        : Math.random() * 6 + 2
      ).toFixed(2)
    ),
    temperature: parseFloat(
      (isAbnormal && Math.random() > 0.6
        ? Math.random() * 15 + 86
        : Math.random() * 30 + 50
      ).toFixed(1)
    ),
    current: parseFloat(
      (isAbnormal && Math.random() > 0.7
        ? Math.random() * 4 + 17
        : Math.random() * 5 + 10
      ).toFixed(2)
    ),
    power: parseInt(
      (isAbnormal && Math.random() > 0.6
        ? Math.random() * 400 + 1850
        : Math.random() * 700 + 1000
      ).toFixed(0)
    ),
    noise: parseFloat(
      (isAbnormal && Math.random() > 0.5
        ? Math.random() * 15 + 92
        : Math.random() * 20 + 70
      ).toFixed(1)
    ),
  };
};

let intervalId = null;

export const startMotorSimulation = () => {
  if (intervalId) return; // Already running

  console.log("Starting motor simulation for warnings...");

  // Update immediately
  updateMotorWarnings();

  // Then update every 3 seconds
  intervalId = setInterval(() => {
    updateMotorWarnings();
  }, 3000);
};

export const stopMotorSimulation = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("Stopped motor simulation");
  }
};

const updateMotorWarnings = () => {
  motors.forEach((motorName) => {
    const data = generateData();
    const abnormalParams = [];

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (value < thresholds[key].min || value > thresholds[key].max) {
        abnormalParams.push(key);
      }
    });

    updateGlobalWarning(motorName, abnormalParams);
  });
};
