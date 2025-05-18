import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateMovieDto {
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsString()
  @IsNotEmpty()
  year: string;
  @IsString()
  @IsNotEmpty()
  country: string;
  @IsInt()
  @IsNotEmpty()
  length: number;
}
