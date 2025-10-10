import { IPlot } from "./plot.interface";

export interface IField {
  id: string;
  name: string;
  plots: IPlot[];
  createdAt: Date;
  updatedAt: Date;
}
