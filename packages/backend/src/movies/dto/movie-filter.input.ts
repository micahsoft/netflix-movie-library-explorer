import { Field, Float, InputType, Int } from '@nestjs/graphql'
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

@InputType('MovieFilter')
export class MovieFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  q?: string

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  genre?: string

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(10)
  minRating?: number

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1888)
  @Max(new Date().getFullYear() + 5)
  year?: number
}
