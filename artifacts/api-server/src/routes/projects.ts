import { Router, type IRouter } from "express";
import {
  CreateProjectBody,
  GetProjectParams,
  GetProjectResponse,
  ListProjectsResponse,
  GetProjectStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

interface ChatMessage {
  id: string;
  role: "user" | "jarvis";
  content: string;
  timestamp: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  status: "concept" | "design" | "simulation" | "complete";
  componentIds: string[];
  createdAt: string;
  updatedAt: string;
  simulationRun: boolean;
  chatHistory: ChatMessage[];
}

const PROJECTS: Project[] = [
  {
    id: "proj_demo_solar",
    name: "Solar Streetlight MK-1",
    description: "Off-grid solar-powered LED streetlight for rural electrification. 6m pole, 200W panel, 100Ah LiFePO4 storage.",
    status: "simulation",
    componentIds: [
      "solar-panel-200w",
      "battery-lifepo4-100ah",
      "mppt-controller-40a",
      "led-module-50w",
      "steel-pole-6m",
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    simulationRun: true,
    chatHistory: [
      {
        id: "msg_001",
        role: "jarvis",
        content: "JARVIS online. How can I assist with your hardware design today?",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "msg_002",
        role: "user",
        content: "Design an off-grid solar streetlight for rural areas",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 60000).toISOString(),
      },
      {
        id: "msg_003",
        role: "jarvis",
        content: "Acknowledged. Initiating design protocol for off-grid solar streetlight system. System architecture complete. Components selected: Monocrystalline Solar Panel (200W), LiFePO4 Battery (100Ah), MPPT Controller (40A), LED Module (50W). Estimated ROI: 4.2 years vs grid extension.",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 90000).toISOString(),
      },
    ],
  },
  {
    id: "proj_demo_iot",
    name: "Environmental Monitor Node",
    description: "Low-power IoT sensor node for agricultural monitoring. LoRaWAN connectivity, solar charged, 5-year deployment target.",
    status: "design",
    componentIds: [
      "mcu-cortex-m4",
      "sensor-temp-humidity",
      "lora-module-868",
      "battery-lifepo4-100ah",
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    simulationRun: false,
    chatHistory: [
      {
        id: "msg_101",
        role: "jarvis",
        content: "JARVIS online. How can I assist with your hardware design today?",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  },
];

router.get("/projects/stats/summary", (_req, res) => {
  const stats = GetProjectStatsResponse.parse({
    totalProjects: PROJECTS.length,
    activeProjects: PROJECTS.filter((p) => p.status !== "complete").length,
    completedProjects: PROJECTS.filter((p) => p.status === "complete").length,
    totalComponents: 10,
    simulationsRun: PROJECTS.filter((p) => p.simulationRun).length,
    recentProjects: PROJECTS.slice(0, 3),
  });
  res.json(stats);
});

router.get("/projects", (_req, res) => {
  const result = ListProjectsResponse.parse({ projects: PROJECTS });
  res.json(result);
});

router.post("/projects", (req, res) => {
  const body = CreateProjectBody.parse(req.body);
  const newProject: Project = {
    id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: body.name,
    description: body.description,
    status: "concept",
    componentIds: body.componentIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    simulationRun: false,
    chatHistory: [
      {
        id: `msg_${Date.now()}`,
        role: "jarvis",
        content: "JARVIS online. How can I assist with your hardware design today?",
        timestamp: new Date().toISOString(),
      },
    ],
  };
  PROJECTS.push(newProject);
  const result = GetProjectResponse.parse(newProject);
  res.status(201).json(result);
});

router.get("/projects/:id", (req, res) => {
  const { id } = GetProjectParams.parse(req.params);
  const project = PROJECTS.find((p) => p.id === id);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const result = GetProjectResponse.parse(project);
  res.json(result);
});

export default router;
