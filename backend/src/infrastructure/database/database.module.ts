import { Module, Global } from '@nestjs/common';
import { DatabaseProvider, DRIZZLE_PROVIDER } from './database.provider';

@Global()
@Module({
  providers: [DatabaseProvider],
  exports: [DRIZZLE_PROVIDER],
})
export class DatabaseModule {}
