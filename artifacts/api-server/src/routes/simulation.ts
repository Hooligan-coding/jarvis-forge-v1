import { Router, type IRouter } from "express";
import {
  RunSimulationBody,
  RunSimulationResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const COMPONENT_POWER: Record<string, number> = {
  "solar-panel-200w": 200,
  "battery-lifepo4-100ah": 4800,
  "mppt-controller-40a": -1.5,
  "led-module-50w": -50,
  "inverter-1000w": -12,
  "mcu-cortex-m4": -0.08,
  "sensor-temp-humidity": -0.003,
  "lora-module-868": -0.025,
  "battery-agm-200ah": 2400,
  "steel-pole-6m": 0,
};

router.post("/simulation/run", (req, res) => {
  const body = RunSimulationBody.parse(req.body);
  const componentIds = body.componentIds;

  let solarInput = 0;
  let storageCapacity = 0;
  let loadWatts = 0;

  for (const id of componentIds) {
    const power = COMPONENT_POWER[id] ?? 0;
    if (id.startsWith("solar")) {
      solarInput += power;
    } else if (id.startsWith("battery")) {
      storageCapacity += power;
    } else if (power < 0) {
      loadWatts += Math.abs(power);
    }
  }

  const dailySolarGeneration = solarInput * 5.5;
  const dailyConsumption = loadWatts * (body.durationHours || 12);
  const efficiency = solarInput > 0 ? Math.min(94, 78 + Math.random() * 12) : 65 + Math.random() * 10;
  const batteryLifeHours = storageCapacity > 0 && loadWatts > 0 ? (storageCapacity * 0.8) / Math.max(loadWatts, 1) : 48;

  const thermalRiskRaw = loadWatts > 500 ? "critical" : loadWatts > 200 ? "high" : loadWatts > 50 ? "medium" : "low";

  const warnings: string[] = [];
  if (dailySolarGeneration < dailyConsumption) {
    warnings.push("Solar generation insufficient for daily load — consider adding more panels or reducing consumption");
  }
  if (batteryLifeHours < 24) {
    warnings.push("Battery capacity may not sustain overnight operation — consider upgrading storage");
  }
  if (thermalRiskRaw === "high" || thermalRiskRaw === "critical") {
    warnings.push("High thermal load detected — ensure adequate heatsinking and ventilation");
  }
  if (componentIds.length < 3) {
    warnings.push("System may be incomplete — consider adding missing subsystems");
  }

  const result = RunSimulationResponse.parse({
    projectId: body.projectId,
    powerOutput: Math.round(solarInput * efficiency / 100 * 10) / 10,
    batteryLifeHours: Math.round(batteryLifeHours * 10) / 10,
    efficiency: Math.round(efficiency * 10) / 10,
    thermalRisk: thermalRiskRaw,
    peakLoad: Math.round(loadWatts * 1.3 * 10) / 10,
    avgLoad: Math.round(loadWatts * 0.75 * 10) / 10,
    uptime: Math.round(Math.min(99.8, 95 + Math.random() * 4.8) * 10) / 10,
    warnings,
    timestamp: new Date().toISOString(),
  });

  res.json(result);
});

export default router;
