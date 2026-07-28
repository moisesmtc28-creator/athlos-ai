import { Training } from "@/app/types/training";

export const mockTrainings: Training[] = [
  {
    id: "1",
    title: "Endurance Z2",
    description: "Pedal contínuo em Zona 2",
    date: "2026-07-27",
    duration: 90,
    zone: "Z2",
    status: "planned",
  },
  {
    id: "2",
    title: "Sweet Spot",
    description: "4x10 minutos em ritmo forte e controlado",
    date: "2026-07-29",
    duration: 75,
    zone: "Z3",
    status: "planned",
  },
  {
    id: "3",
    title: "Treino de subidas",
    description: "6x5 minutos em subida",
    date: "2026-07-31",
    duration: 100,
    zone: "Z4",
    status: "planned",
  },
];