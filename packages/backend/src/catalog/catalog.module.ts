import { Module } from '@nestjs/common'
import { IngestionModule } from '../ingestion/ingestion.module'
import { CatalogService } from './catalog.service'

@Module({
  imports: [IngestionModule],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
