import { Router, type IRouter } from "express";
import {
  JarvisChatBody,
  JarvisChatResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MOCK_RESPONSES: Record<string, {
  message: string;
  productDescription: string;
  systemComponents: string[];
  architecture: string;
}> = {
  default: {
    message: "JARVIS online. How can I assist with your hardware design today?",
    productDescription: "I'm ready to help you design your hardware system. Please describe what you want to build.",
    systemComponents: [],
    architecture: "",
  },
};

function generateJarvisResponse(message: string): {
  message: string;
  productDescription?: string;
  systemComponents?: string[];
  architecture?: string;
  suggestedComponentIds?: string[];
} {
  const lower = message.toLowerCase();

  if (lower.includes("solar") || lower.includes("streetlight") || lower.includes("street light")) {
    return {
      message: `Acknowledged. Initiating design protocol for off-grid solar streetlight system. Here is my engineering analysis:`,
      productDescription: "An autonomous off-grid solar-powered LED streetlight system capable of operating independently from utility power. The system captures solar energy during daylight hours, stores it in a deep-cycle battery bank, and delivers consistent illumination via high-efficiency LED modules throughout the night. Designed for remote locations, rural infrastructure, and smart city deployments.",
      systemComponents: [
        "Monocrystalline Solar Panel (200W)",
        "Lithium Iron Phosphate Battery (100Ah, 48V)",
        "MPPT Solar Charge Controller (40A)",
        "High-Efficiency LED Module (50W, 5000K)",
        "Galvanized Steel Pole (6m)",
        "Aluminum Mounting Bracket",
        "Junction Box with IP67 Rating",
      ],
      architecture: "Solar Panel → MPPT Controller → Battery Bank → LED Driver → LED Module. The MPPT controller optimizes power harvesting with ±0.5% tracking efficiency. A microcontroller manages dawn/dusk detection via photosensor, dims LEDs during low-traffic hours (2AM–5AM) to extend battery life by 30%. System runtime: 4 consecutive cloudy days.",
      suggestedComponentIds: ["solar-panel-200w", "battery-lifepo4-100ah", "mppt-controller-40a", "led-module-50w"],
    };
  }

  if (lower.includes("wind") || lower.includes("turbine")) {
    return {
      message: "Initiating wind energy system design protocol. Analysis complete:",
      productDescription: "A small-scale wind turbine system designed for distributed energy generation. Suitable for remote off-grid installations or hybrid solar-wind configurations. The system uses a permanent magnet alternator coupled with a MPPT charge controller and battery storage.",
      systemComponents: [
        "3-Blade Wind Turbine (500W, 12/24V)",
        "Permanent Magnet Alternator",
        "Wind Charge Controller (60A)",
        "AGM Battery Bank (200Ah)",
        "Grid-Tie or Off-Grid Inverter (1000W)",
        "Tower Mounting System (10m)",
      ],
      architecture: "Wind Turbine → Rectifier → Wind Charge Controller → Battery Bank → Inverter → Load. Automatic furling at wind speeds >50km/h for protection. Integrated dump load prevents overcharging.",
      suggestedComponentIds: ["battery-agm-200ah", "mppt-controller-40a"],
    };
  }

  if (lower.includes("iot") || lower.includes("sensor") || lower.includes("monitor")) {
    return {
      message: "IoT sensor deployment architecture initiated. Design brief follows:",
      productDescription: "A low-power IoT sensor node designed for environmental monitoring. Features wireless connectivity (LoRaWAN/MQTT), ultra-low power consumption for multi-year battery operation, and ruggedized enclosures for outdoor deployment. Suitable for smart agriculture, industrial monitoring, and infrastructure sensing.",
      systemComponents: [
        "Microcontroller (ARM Cortex-M4, 64MHz)",
        "LoRa Transceiver Module (868/915MHz)",
        "Environmental Sensor Suite (T/H/P/Light)",
        "LiPo Battery (3.7V, 5000mAh)",
        "Solar Harvester IC (50mA max)",
        "IP67 Enclosure",
        "Omnidirectional Antenna",
      ],
      architecture: "Sensor Array → MCU (ADC/I2C/SPI) → LoRa Radio → Gateway → Cloud. Sleep current <10μA. 15-minute data transmission intervals. End-to-end encryption with AES-128. Expected lifespan: 5+ years on battery alone.",
      suggestedComponentIds: ["mcu-cortex-m4", "sensor-temp-humidity"],
    };
  }

  if (lower.includes("drone") || lower.includes("uav") || lower.includes("quadcopter")) {
    return {
      message: "UAV platform design protocol engaged. Engineering specifications:",
      productDescription: "A modular quadcopter UAV platform designed for aerial inspection and survey operations. Payload capacity up to 2kg. Fly-by-wire flight controller with redundant IMU sensors, GPS/GLONASS positioning, and fail-safe return-to-home functionality.",
      systemComponents: [
        "Carbon Fiber Frame (450mm wheelbase)",
        "Brushless Motors (2306, 2400KV) x4",
        "30A ESC with BLHeli_32 x4",
        "Flight Controller (F7, dual IMU)",
        "4S LiPo Battery (5200mAh, 75C)",
        "GPS/GLONASS Module",
        "FPV Camera + OSD",
        "RC Receiver (2.4GHz)",
      ],
      architecture: "RC Receiver → Flight Controller → ESC Array → Motors. Sensor fusion: Accelerometer + Gyroscope + Barometer + GPS → EKF algorithm → PID control loops. Telemetry via MAVLink protocol.",
      suggestedComponentIds: ["battery-lipo-5200", "led-module-50w"],
    };
  }

  if (lower.includes("help") || lower.includes("what") || lower.includes("can you")) {
    return {
      message: "JARVIS systems fully operational. I can assist you with:\n\n• Hardware product ideation and concept generation\n• System architecture design\n• Component selection and BOM generation\n• Power budget analysis and simulation\n• Technical documentation generation\n\nSimply describe what you want to build. Examples:\n— \"Design an off-grid solar streetlight\"\n— \"Create an IoT environmental monitoring node\"\n— \"Design a wind energy system for remote cabin\"\n— \"Build a quadcopter inspection drone\"",
      productDescription: "",
      systemComponents: [],
      architecture: "",
    };
  }

  return {
    message: `Analyzing your request: "${message}". Processing design parameters...\n\nI've logged your requirements into the system. To generate a full engineering concept, please provide more specifics about:\n• Target environment (indoor/outdoor/industrial)\n• Power source (grid/battery/solar/hybrid)\n• Required output or functionality\n• Environmental constraints\n\nI'm ready to generate a complete system architecture and component list once I have these parameters.`,
    productDescription: `Custom hardware system based on: "${message}"`,
    systemComponents: ["To be determined based on requirements"],
    architecture: "Architecture will be generated after requirements clarification.",
  };
}

router.post("/jarvis/chat", (req, res) => {
  const body = JarvisChatBody.parse(req.body);
  const response = generateJarvisResponse(body.message);

  const result = JarvisChatResponse.parse({
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    message: response.message,
    productDescription: response.productDescription,
    systemComponents: response.systemComponents || [],
    architecture: response.architecture,
    suggestedComponentIds: response.suggestedComponentIds || [],
    timestamp: new Date().toISOString(),
  });

  res.json(result);
});

export default router;
