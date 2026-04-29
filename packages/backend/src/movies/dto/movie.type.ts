import { Field, Float, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql'

export enum MovieSource {
  DRIVE = 'drive',
  MANUAL = 'manual',
}
registerEnumType(MovieSource, { name: 'MovieSource' })

@ObjectType('Movie')
export class MovieType {
  @Field(() => ID)
  id: string

  @Field()
  title: string

  @Field(() => Float)
  rating: number

  @Field(() => [String])
  genres: string[]

  @Field(() => Int, { nullable: true })
  year: number | null

  @Field(() => String, { nullable: true })
  description: string | null

  @Field(() => MovieSource)
  source: MovieSource
}
