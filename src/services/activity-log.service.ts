import { ActivityLog } from '@/entities/activity-log.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateActivityLogDto, UpdateActivityLogDto } from '@/dtos/activity-log.dto';

export class ActivityLogService {
    private activityLogRepository: Repository<ActivityLog>;

    constructor(dataSource: DataSource) {
        this.activityLogRepository = dataSource.getRepository(ActivityLog);
    }

    async findAll(): Promise<ActivityLog[]> {
        const activityLogs = await this.activityLogRepository.find();
        return activityLogs;
    }

    async findById(id: string): Promise<ActivityLog | null> {
        const activityLog = await this.activityLogRepository.findOneBy({ id });
        return activityLog;
    }

    async create(activityData: CreateActivityLogDto): Promise<ActivityLog> {
        const newActivityLog = this.activityLogRepository.create(activityData);
        await this.activityLogRepository.save(newActivityLog);
        return newActivityLog;
    }

    async update(id: string, activityData: UpdateActivityLogDto): Promise<ActivityLog | null> {
        await this.activityLogRepository.update(id, activityData);
        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.activityLogRepository.delete(id);
    }
}