import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { CatalogService } from '../catalog/catalog.service'
import { MovieType } from './dto/movie.type'
import { MovieFilterInput } from './dto/movie-filter.input'
import { AddMovieInput } from './dto/add-movie.input'
import { MovieConnectionType } from './dto/movie-connection.type'
import { CatalogStatsType, QuarantineSummaryType } from './dto/catalog-stats.type'

@Resolver(() => MovieType)
export class MoviesResolver {
  constructor(private readonly catalog: CatalogService) {}

  @Query(() => MovieConnectionType)
  movies(
    @Args('filter', { nullable: true }) filter?: MovieFilterInput,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): MovieConnectionType {
    const all = filter ? this.catalog.filter(filter) : this.catalog.getAll()
    const start = offset ?? 0
    const end = limit != null ? start + limit : undefined
    return {
      items: all.slice(start, end) as MovieType[],
      total: all.length,
    }
  }

  @Query(() => MovieType, { nullable: true })
  movie(@Args('id', { type: () => ID }) id: string): MovieType | null {
    return this.catalog.getById(id) as MovieType | null
  }

  @Query(() => [MovieType])
  topRated(
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): MovieType[] {
    return this.catalog.getTopRated(limit ?? 10) as MovieType[]
  }

  @Query(() => CatalogStatsType)
  stats(): CatalogStatsType {
    return this.catalog.getStats() as unknown as CatalogStatsType
  }

  @Query(() => QuarantineSummaryType)
  quarantineSummary(): QuarantineSummaryType {
    return this.catalog.getQuarantineSummary()
  }

  @Mutation(() => MovieType)
  addMovie(@Args('input') input: AddMovieInput): MovieType {
    const movie = this.catalog.add({
      title: input.title,
      rating: input.rating,
      genres: input.genres ?? [],
      year: input.year ?? null,
      description: input.description ?? null,
    })
    return movie as MovieType
  }

  @Mutation(() => CatalogStatsType)
  async reloadCatalog(): Promise<CatalogStatsType> {
    return this.catalog.reload() as unknown as CatalogStatsType
  }
}
