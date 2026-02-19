/**
 * Script untuk populate dummy sensor data ke Firestore
 * Data untuk grafik historis dan bar chart mingguan
 * 
 * Cara run: node populate_sensor_data.js
 */

import { initializeApp } from "firebase/app";
import { getFirestore, writeBatch, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBW4AK1rHCbr_N74_2pbDWqaVyjMKa7D9o",
  authDomain: "sparepart-foundry-33835.firebaseapp.com",
  projectId: "sparepart-foundry-33835",
  storageBucket: "sparepart-foundry-33835.firebasestorage.app",
  messagingSenderId: "954698431161",
  appId: "1:954698431161:web:a03287a6a75a27541f7968",
  measurementId: "G-8BCF8TDEPT",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate realistic sensor value with variation
 */
function generateSensorValue(baseMin, baseMax, isAbnormal = false) {
  if (isAbnormal) {
    // 50% chance sangat tinggi atau sangat rendah
    if (Math.random() > 0.5) {
      return baseMax + Math.random() * (baseMax * 0.3);
    } else {
      return baseMin - Math.random() * (baseMin * 0.3);
    }
  }
  // Normal distribution
  return baseMin + Math.random() * (baseMax - baseMin);
}

/**
 * Generate vibration dengan distribution Hz/kHz/MHz
 */
function generateVibration(isAbnormal = false) {
  if (isAbnormal) {
    // Abnormal: 500MHz - 900MHz (tinggi)
    return 500000000 + Math.random() * 400000000;
  }
  
  const range = Math.random();
  if (range < 0.3) {
    // 30% Hz range: 1kHz - 11kHz
    return 1000 + Math.random() * 10000;
  } else if (range < 0.6) {
    // 30% kHz range: 10kHz - 510kHz
    return 10000 + Math.random() * 500000;
  } else {
    // 40% MHz range: 1MHz - 200MHz (normal)
    return 1000000 + Math.random() * 199000000;
  }
}

/**
 * Generate one sensor reading
 */
function generateReading(timestamp, motorId, subMotorId, forceAbnormal = false) {
  const isAbnormal = forceAbnormal || Math.random() > 0.7; // 30% abnormal
  
  const vibration = generateVibration(isAbnormal);
  const temperature = generateSensorValue(60, 90, isAbnormal);
  const current = generateSensorValue(10, 15, isAbnormal);
  const power = generateSensorValue(2, 20, isAbnormal);
  const noise = generateSensorValue(70, 90, isAbnormal);
  
  // Simulate ML prediction scores
  const anomalyScore = isAbnormal ? 0.7 + Math.random() * 0.3 : Math.random() * 0.4;
  
  return {
    timestamp: timestamp.toISOString(),
    timestampMs: timestamp.getTime(),
    motorId: motorId,
    subMotorId: subMotorId,
    
    // Raw sensor values (setelah preprocessing)
    parameters: {
      vibration: parseFloat(vibration.toFixed(2)),
      temperature: parseFloat(temperature.toFixed(1)),
      current: parseFloat(current.toFixed(2)),
      power: parseFloat(power.toFixed(2)),
      noise: parseFloat(noise.toFixed(1)),
    },
    
    // ML prediction result
    mlPrediction: {
      anomalyScore: parseFloat(anomalyScore.toFixed(3)),
      autoencoderLoss: parseFloat((Math.random() * 0.5).toFixed(3)),
      lstmPredictionError: parseFloat((Math.random() * 0.3).toFixed(3)),
      isolationForestScore: parseFloat((anomalyScore * 1.2).toFixed(3)),
    },
    
    // Status determination
    status: isAbnormal ? "abnormal" : "normal",
    isWarning: isAbnormal,
    
    // Metadata
    createdAt: timestamp.toISOString(),
  };
}

/**
 * Populate hourly data for last 30 days
 */
async function populateHourlyData() {
  console.log("🚀 Starting to populate hourly sensor data...");
  
  const motorId = "Motor Mainshakeout";
  const subMotorId = "Shakeout Reguler";
  const now = new Date();
  const daysBack = 30;
  const hoursPerDay = 24;
  
  let totalDocs = 0;
  let batchCount = 0;
  let batch = writeBatch(db);
  
  // Generate data for last 30 days, every hour
  for (let day = 0; day < daysBack; day++) {
    for (let hour = 0; hour < hoursPerDay; hour++) {
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - day);
      timestamp.setHours(hour, 0, 0, 0);
      
      const reading = generateReading(timestamp, motorId, subMotorId);
      const docId = `${motorId}_${subMotorId}_${timestamp.getTime()}`;
      const docRef = doc(db, "sensorReadings", docId);
      
      batch.set(docRef, reading);
      totalDocs++;
      batchCount++;
      
      // Firestore batch limit is 500 operations
      if (batchCount >= 450) {
        await batch.commit();
        console.log(`✅ Committed batch: ${totalDocs} documents`);
        batch = writeBatch(db);
        batchCount = 0;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final batch: ${totalDocs} documents`);
  }
  
  console.log(`🎉 Successfully populated ${totalDocs} hourly sensor readings!`);
}

/**
 * Populate daily aggregated data (for bar charts)
 */
async function populateDailyAggregates() {
  console.log("🚀 Starting to populate daily aggregates...");
  
  const motorId = "Motor Mainshakeout";
  const subMotorId = "Shakeout Reguler";
  const now = new Date();
  const daysBack = 90; // 3 months of daily data
  
  let batch = writeBatch(db);
  let batchCount = 0;
  
  for (let day = 0; day < daysBack; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    
    // Generate 24 readings and calculate average
    const readings = [];
    for (let i = 0; i < 24; i++) {
      const timestamp = new Date(date);
      timestamp.setHours(i);
      readings.push(generateReading(timestamp, motorId, subMotorId));
    }
    
    // Calculate averages
    const avgVibration = readings.reduce((sum, r) => sum + r.parameters.vibration, 0) / readings.length;
    const avgTemperature = readings.reduce((sum, r) => sum + r.parameters.temperature, 0) / readings.length;
    const avgCurrent = readings.reduce((sum, r) => sum + r.parameters.current, 0) / readings.length;
    const avgPower = readings.reduce((sum, r) => sum + r.parameters.power, 0) / readings.length;
    const avgNoise = readings.reduce((sum, r) => sum + r.parameters.noise, 0) / readings.length;
    
    const abnormalCount = readings.filter(r => r.status === "abnormal").length;
    
    const aggregate = {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD
      timestamp: date.toISOString(),
      timestampMs: date.getTime(),
      motorId: motorId,
      subMotorId: subMotorId,
      
      averages: {
        vibration: parseFloat(avgVibration.toFixed(2)),
        temperature: parseFloat(avgTemperature.toFixed(1)),
        current: parseFloat(avgCurrent.toFixed(2)),
        power: parseFloat(avgPower.toFixed(2)),
        noise: parseFloat(avgNoise.toFixed(1)),
      },
      
      statistics: {
        totalReadings: readings.length,
        normalCount: readings.length - abnormalCount,
        abnormalCount: abnormalCount,
        abnormalPercentage: parseFloat(((abnormalCount / readings.length) * 100).toFixed(1)),
      },
      
      createdAt: date.toISOString(),
    };
    
    const docId = `${motorId}_${subMotorId}_${date.toISOString().split('T')[0]}`;
    const docRef = doc(db, "sensorDailyAggregates", docId);
    
    batch.set(docRef, aggregate);
    batchCount++;
    
    if (batchCount >= 450) {
      await batch.commit();
      console.log(`✅ Committed ${batchCount} daily aggregates`);
      batch = writeBatch(db);
      batchCount = 0;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    console.log(`✅ Committed final ${batchCount} daily aggregates`);
  }
  
  console.log(`🎉 Successfully populated ${daysBack} daily aggregates!`);
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log("📊 Populating Firestore with dummy sensor data...\n");
    
    // Populate hourly data (for line charts)
    await populateHourlyData();
    console.log("");
    
    // Populate daily aggregates (for bar charts)
    await populateDailyAggregates();
    console.log("");
    
    console.log("✨ All done! Check Firebase Console.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the script
main();
