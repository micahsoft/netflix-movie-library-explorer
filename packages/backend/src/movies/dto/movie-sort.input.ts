import { Field, InputType, registerEnumType } from '@nestjs/graphql'
import { MovieSortField, SortDirection, MovieSort } from '@movie-explorer/types'

export { MovieSortField, SortDirection }

registerEnumType(MovieSortField, { name: 'MovieSortField' })
registerEnumType(SortDirection, { name: 'SortDirection' })

@InputType()
export class MovieSortInput implements MovieSort {
  @Field(() => MovieSortField)
  field!: MovieSortField

  @Field(() => SortDirection)
  direction!: SortDirection
}
