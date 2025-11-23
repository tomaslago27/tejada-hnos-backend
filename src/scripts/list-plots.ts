import "reflect-metadata";
import { DatabaseService } from "@services/database.service";
import { Plot } from "@entities/plot.entity";

const listPlots = async () => {
  try {
    const ds = await DatabaseService.initialize();
    const repo = ds.getRepository(Plot);
    const plots = await repo.find({ select: ["id", "name", "area"], take: 50 });
    console.log(`Found ${plots.length} plots:`);
    for (const p of plots) {
      console.log(`- id: ${p.id} | name: ${p.name} | area: ${p.area}`);
    }
    await DatabaseService.shutdown();
    process.exit(0);
  } catch (error) {
    console.error('Error listing plots:', error);
    try { await DatabaseService.shutdown(); } catch(e){}
    process.exit(1);
  }
};

listPlots();
