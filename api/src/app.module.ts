import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { CoreModule } from './core/core.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [ConfigModule, CoreModule, HealthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
