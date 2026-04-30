import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { DriveClient } from './drive.client'
import { IngestionService } from './ingestion.service'
import { QuarantineLog } from './quarantine-log'

@Module({
  imports: [AuthModule],
  providers: [DriveClient, IngestionService, QuarantineLog],
  exports: [IngestionService, QuarantineLog],
})
export class IngestionModule {}
