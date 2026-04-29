import { Args, Mutation, Query, Resolver, ID } from '@nestjs/graphql'
import { InternalServerErrorException } from '@nestjs/common'
import { Movie, MovieConnection, CatalogStats, QuarantineSummary } from '@movie-explorer/types'
import { CatalogService } from '../catalog/catalog.service'
import { MovieType } from './dto/movie.type'
import { MovieFilterInput } from './dto/movie-filter.input'
import { MovieSortInput } from './dto/movie-sort.input'
import { AddMovieInput } from './dto/add-movie.input'
import { MovieConnectionType } from './dto/movie-connection.type'
import { CatalogStatsType, QuarantineSummaryType } from './dto/catalog-stats.type'
import { PaginationInput } from './dto/pagination.input'

@Resolver(() => MovieType)
export class MoviesResolver {
  constructor(private readonly catalog: CatalogService) {}

  @Query(() => MovieConnectionType)
  movies(
    @Args('filter', { nullable: true }) filter?: MovieFilterInput,
    @Args('sort', { nullable: true }) sort?: MovieSortInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): MovieConnection {
    return this.catalog.query(filter, sort, pagination?.limit, pagination?.offset)
  }

  @Query(() => MovieType, { nullable: true })
  movie(@Args('id', { type: () => ID }) id: string): Movie | null {
    return this.catalog.getById(id)
  }

  @Query(() => [MovieType])
  topRated(
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Movie[] {
    return this.catalog.getTopRated(pagination?.limit)
  }

  @Query(() => CatalogStatsType)
  stats(): CatalogStats {
    return this.catalog.getStats()
  }

  @Query(() => QuarantineSummaryType)
  quarantineSummary(): QuarantineSummary {
    return this.catalog.getQuarantineSummary()
  }

  @Mutation(() => MovieType)
  addMovie(@Args('input') input: AddMovieInput): Movie {
    return this.catalog.add(input)
  }

  @Mutation(() => CatalogStatsType)
  async reloadCatalog(): Promise<CatalogStats> {
    try {
      return await this.catalog.reload()
    } catch (err) {
      throw new InternalServerErrorException('Catalog reload failed — Drive may be unavailable')
    }
  }
}
