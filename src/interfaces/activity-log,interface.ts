import { ActivityType } from "@/enums";

export interface IActivityLog {
  id: string;
  plotId: string;
  activityType: ActivityType;
  description: string;
  executionDate: Date;
  createdByUserId: string;
}
