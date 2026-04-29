import { Field, Int, ObjectType } from '@nestjs/graphql'
import { MovieType } from './movie.type'

@ObjectType('MovieConnection')
export class MovieConnectionType {
  @Field(() => [MovieType])
  items: MovieType[]

  @Field(() => Int)
  total: number
}
