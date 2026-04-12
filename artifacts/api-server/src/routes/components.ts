import { Router, type IRouter } from "express";
import {
  GetComponentParams,
  GetComponentResponse,
  ListComponentsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const COMPONENTS = [
  {
    id: "solar-panel-200w",
    name: "Monocrystalline Solar Panel",
    category: "Energy Harvesting",
    spec: "200W, 21.5% efficiency, 1640x992x35mm, VOC 45.2V",
    estimatedCost: 189.99,
    description: "High-efficiency monocrystalline silicon solar panel with anti-reflective coating. Ideal for off-grid power systems. Includes aluminum frame and junction box rated IP67.",
    unit: "panel",
    inStock: true,
    powerDraw: 0,
    weight: 11.5,
  },
  {
    id: "battery-lifepo4-100ah",
    name: "LiFePO4 Battery Module",
    category: "Energy Storage",
    spec: "100Ah, 48V, 4.8kWh, BMS integrated, 6000+ cycles",
    estimatedCost: 649.00,
    description: "Lithium Iron Phosphate battery module with integrated BMS for overcharge, overdischarge, and thermal protection. Deep cycle capable. 10-year design life in solar applications.",
    unit: "module",
    inStock: true,
    powerDraw: 0,
    weight: 28.0,
  },
  {
    id: "mppt-controller-40a",
    name: "MPPT Solar Charge Controller",
    category: "Power Management",
    spec: "40A, 12/24/48V auto, 150V PV input, ±0.5% tracking",
    estimatedCost: 89.99,
    description: "Maximum Power Point Tracking controller with advanced algorithms for optimal energy harvesting. Supports multiple battery types. LCD display with Bluetooth monitoring capability.",
    unit: "unit",
    inStock: true,
    powerDraw: 1.5,
    weight: 0.95,
  },
  {
    id: "led-module-50w",
    name: "High-Power LED Module",
    category: "Lighting",
    spec: "50W, 5000K, 6500lm, CRI >80, IP66, 50000hr lifespan",
    estimatedCost: 45.00,
    description: "Industrial-grade LED streetlight module with aluminum heat sink and PC lens. Passive thermal management design. Wide-angle beam pattern optimized for road illumination (120°x60°).",
    unit: "module",
    inStock: true,
    powerDraw: 50,
    weight: 1.2,
  },
  {
    id: "inverter-1000w",
    name: "Pure Sine Wave Inverter",
    category: "Power Conversion",
    spec: "1000W continuous, 2000W peak, 48VDC to 230VAC, 92% eff.",
    estimatedCost: 129.99,
    description: "True sine wave output inverter for sensitive electronics. Features over-temperature, overload, and short-circuit protection. USB charging port and remote monitoring capability.",
    unit: "unit",
    inStock: true,
    powerDraw: 12,
    weight: 2.1,
  },
  {
    id: "mcu-cortex-m4",
    name: "MCU Development Module",
    category: "Computing",
    spec: "ARM Cortex-M4, 168MHz, 256KB RAM, 1MB Flash, FPU",
    estimatedCost: 12.50,
    description: "Low-power microcontroller module with floating-point unit, multiple communication interfaces (UART, SPI, I2C, CAN), and extensive GPIO. Ultra-low standby current (2μA).",
    unit: "module",
    inStock: true,
    powerDraw: 0.08,
    weight: 0.01,
  },
  {
    id: "sensor-temp-humidity",
    name: "Environmental Sensor Suite",
    category: "Sensing",
    spec: "Temp ±0.2°C, RH ±2%, Pressure ±1hPa, I2C/SPI",
    estimatedCost: 8.99,
    description: "Calibrated environmental sensor module measuring temperature, relative humidity, barometric pressure, and ambient light intensity. Compact SMD form factor. NIST traceable calibration.",
    unit: "module",
    inStock: true,
    powerDraw: 0.003,
    weight: 0.002,
  },
  {
    id: "lora-module-868",
    name: "LoRaWAN Transceiver Module",
    category: "Communication",
    spec: "868/915MHz, 15km range, -148dBm sensitivity, 25mA TX",
    estimatedCost: 19.99,
    description: "Long-range wireless transceiver based on LoRa spread-spectrum modulation. Class A/B/C LoRaWAN compliant. Suitable for IoT networks with ultra-low power requirements. SMA antenna connector.",
    unit: "module",
    inStock: true,
    powerDraw: 0.025,
    weight: 0.004,
  },
  {
    id: "battery-agm-200ah",
    name: "AGM Deep Cycle Battery",
    category: "Energy Storage",
    spec: "200Ah, 12V, AGM, 500 cycles at 50% DoD",
    estimatedCost: 299.00,
    description: "Absorbent Glass Mat sealed lead-acid battery. Valve-regulated, maintenance-free design. Suitable for solar and UPS applications. Can be mounted in any orientation.",
    unit: "unit",
    inStock: false,
    powerDraw: 0,
    weight: 56.0,
  },
  {
    id: "steel-pole-6m",
    name: "Galvanized Steel Pole",
    category: "Structural",
    spec: "6m height, 76mm OD, 3mm wall, 200kg wind load, hot-dip galvanized",
    estimatedCost: 125.00,
    description: "Street lighting pole manufactured from structural steel with hot-dip galvanizing for corrosion resistance. Pre-drilled cable management channels. Conical taper design for aesthetic appeal and structural efficiency.",
    unit: "unit",
    inStock: true,
    powerDraw: 0,
    weight: 38.0,
  },
];

router.get("/components", (_req, res) => {
  const result = ListComponentsResponse.parse({ components: COMPONENTS });
  res.json(result);
});

router.get("/components/:id", (req, res) => {
  const { id } = GetComponentParams.parse(req.params);
  const component = COMPONENTS.find((c) => c.id === id);

  if (!component) {
    res.status(404).json({ error: "Component not found" });
    return;
  }

  const result = GetComponentResponse.parse(component);
  res.json(result);
});

export default router;
