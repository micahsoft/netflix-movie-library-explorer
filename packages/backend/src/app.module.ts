import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'
import { AuthModule } from './auth/auth.module'
import { IngestionModule } from './ingestion/ingestion.module'
import { CatalogModule } from './catalog/catalog.module'
import { MoviesModule } from './movies/movies.module'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
      playground: true,
      introspection: true,
    }),
    AuthModule,
    IngestionModule,
    CatalogModule,
    MoviesModule,
  ],
})
export class AppModule {}
