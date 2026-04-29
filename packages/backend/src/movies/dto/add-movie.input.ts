import { Field, Float, InputType, Int } from '@nestjs/graphql'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator'

@InputType('AddMovieInput')
export class AddMovieInput {
  @Field()
  @IsNotEmpty()
  @IsString()
  title: string

  @Field(() => Float)
  @Min(0)
  @Max(10)
  rating: number

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @IsString({ each: true })
  genres?: string[]

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1888)
  @Max(new Date().getFullYear() + 5)
  year?: number

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string
}
