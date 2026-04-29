import { Field, Float, Int, ObjectType } from '@nestjs/graphql'
import { MovieType } from './movie.type'

@ObjectType('GenreCount')
export class GenreCountType {
  @Field()
  genre: string

  @Field(() => Int)
  count: number
}

@ObjectType('YearGroup')
export class YearGroupType {
  @Field(() => Int)
  year: number

  @Field(() => Int)
  count: number

  @Field(() => [MovieType])
  movies: MovieType[]
}

@ObjectType('CatalogStats')
export class CatalogStatsType {
  @Field(() => Int)
  totalCount: number

  @Field(() => Float)
  averageRating: number

  @Field(() => [GenreCountType])
  topGenres: GenreCountType[]

  @Field(() => [YearGroupType])
  byYear: YearGroupType[]
}

@ObjectType('QuarantineReasonCount')
export class QuarantineReasonCountType {
  @Field()
  reason: string

  @Field(() => Int)
  count: number
}

@ObjectType('QuarantineSummary')
export class QuarantineSummaryType {
  @Field(() => Int)
  total: number

  @Field(() => [QuarantineReasonCountType])
  byReason: QuarantineReasonCountType[]
}
