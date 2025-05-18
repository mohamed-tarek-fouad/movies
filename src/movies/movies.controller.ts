import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { movieMarkAs, movieQueyFields } from 'src/utils/types/movie';
import { CreateMovieDto } from './dtos/createMovie.dto';

@Controller('movies')
export class MoviesController {
  constructor(private readonly movieService: MoviesService) {}

  @Post()
  async seedData() {
    return this.movieService.seedDatabase();
  }

  @Post('manual')
  async createMovie(@Body() body: CreateMovieDto) {
    return this.movieService.createMovie(body);
  }
  @Get('listMovies')
  async listMovies(@Query() query?: movieQueyFields) {
    return this.movieService.listMovies(query);
  }
  @Get('movieById/:id')
  async movieById(@Param('id') id: string) {
    return this.movieService.movieById(id);
  }
  @Post('markMovieAs/:id')
  async markMovieAs(@Param('id') id: string, @Body() body: movieMarkAs) {
    return this.movieService.markMovieAs(id, body);
  }
  @Get('recommendation')
  async recommendation() {
    return this.movieService.recommendation();
  }
}
