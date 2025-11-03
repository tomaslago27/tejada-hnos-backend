import { DataSource, Repository } from 'typeorm';
import { Input } from '@entities/input.entity';
import { CreateInputDto } from '@dtos/input.dto';

export class InputService {
  private readonly inputRepository: Repository<Input>;

  constructor(private readonly dataSource: DataSource) {
    this.inputRepository = this.dataSource.getRepository(Input);
  }

  public async create(data: CreateInputDto): Promise<Input> {
    const input = this.inputRepository.create({
      name: data.name,
      unit: data.unit,
    });

    return this.inputRepository.save(input);
  }

  public async findAll(): Promise<Input[]> {
    return this.inputRepository.find();
  }
}
