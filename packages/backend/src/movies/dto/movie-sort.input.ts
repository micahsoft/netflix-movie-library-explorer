import { Field, InputType, registerEnumType } from '@nestjs/graphql'

export enum MovieSortField {
  RATING = 'RATING',
  YEAR = 'YEAR',
  TITLE = 'TITLE',
}
registerEnumType(MovieSortField, { name: 'MovieSortField' })

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}
registerEnumType(SortDirection, { name: 'SortDirection' })

@InputType()
export class MovieSortInput {
  @Field(() => MovieSortField)
  field!: MovieSortField

  @Field(() => SortDirection)
  direction!: SortDirection
}
