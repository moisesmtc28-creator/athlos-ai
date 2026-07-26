export interface Athlete {
  id: string;

  name: string;

  age: number;

  height: number;

  weight: number;

  goalWeight: number;

  maxHeartRate: number;

  ftp?: number;

  goal:
    | "Emagrecer"
    | "Performance"
    | "Competição"
    | "Lazer";
}