import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { MoviesResolver } from './movies.resolver'

@Module({
  imports: [CatalogModule],
  providers: [MoviesResolver],
})
export class MoviesModule {}
