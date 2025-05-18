import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as csvParser from 'csv-parser';
import { PrismaService } from 'src/db/prisma.service';
import { genres } from 'src/utils/genersInIMDB';
// import { CACHE_MANAGER } from '@nestjs/cache-manager';
// import { Cache } from 'cache-manager';
import axios from 'axios';
import { movieMarkAs, movieQueyFields } from 'src/utils/types/movie';
import { CreateMovieDto } from './dtos/createMovie.dto';
@Injectable()
export class MoviesService {
  constructor(
    private prisma: PrismaService,
    // @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async seedDatabase() {
    const movies = [];

    // Parse the CSV file and populate the movies array
    fs.createReadStream('./src/utils/movies.csv')
      .pipe(csvParser())
      .on('data', (row) => {
        movies.push(row);
      })
      .on('end', async () => {
        try {
          // Extract unique genres
          let genresNames = movies.map((movie) => {
            return { name: movie.Genre };
          });

          genresNames = [...genres, ...genresNames];

          // Insert unique genres in a separate transaction
          await this.prisma.$transaction(async (t) => {
            await t.genre.createMany({
              data: genresNames,
              skipDuplicates: true, // Skip duplicates to avoid unique constraint errors
            });
          });

          // Insert movies and their genres in another transaction
          await this.prisma.$transaction(
            async (t) => {
              for (const m of movies) {
                console.log(m);

                const relatedGenre = await t.genre.findFirst({
                  where: { name: m.Genre },
                });

                if (!relatedGenre) {
                  throw new Error(`Genre not found: ${m.Genre}`);
                }

                const movie = await t.movie.create({
                  data: {
                    title: m.Title.toLowerCase(),
                    year: m.Year,
                    country: m.Country,
                    length: parseInt(m.Length),
                  },
                });

                await t.movieGenre.create({
                  data: {
                    genreId: relatedGenre.id,
                    movieId: movie.id,
                  },
                });
              }
            },
            { timeout: 6000000 },
          );

          console.log('Database seeded successfully!');
        } catch (error) {
          console.error('Error seeding database:', error);
        }
      });
  }
  async listMovies(query: movieQueyFields) {
    try {
      const {
        page = 1,
        pageSize = 10,
        country,
        length,
        title,
        tmdbId,
        year,
        genreName,
      } = query;
      // const isCached: object = await this.cacheManager.get(
      //   `${page}${pageSize}${country}${length}${title}${tmdbId}${year}${genreName}`,
      // );
      // if (isCached) {
      //   return {
      //     data: isCached,
      //     message: 'retrieved all books successfully',
      //   };
      // }
      const skip = (+page - 1) * +pageSize;
      const take = +pageSize;
      const genre = genreName
        ? await this.prisma.genre.findUnique({
            where: { name: genreName },
          })
        : undefined;

      let movies = await this.prisma.movie.findMany({
        skip,
        take,
        where: {
          country,
          length: length ? parseInt(length) : undefined,
          title: { contains: title },
          tmdbId: tmdbId ? parseInt(tmdbId) : undefined,
          year,
          MovieGenre: genreName
            ? {
                every: { genreId: genre ? genre.id : 0 },
              }
            : undefined,
        },
        include: {
          MovieGenre: { include: { genre: true } },
        },
      });

      if (movies.length === 0) {
        movies = await this.requestMovieSearch(title, year);
        return { data: movies, message: 'success' };
      }
      // await this.cacheManager.set(
      //   `${page}${pageSize}${country}${length}${title}${tmdbId}${year}${genreName}`,
      //   movies,
      //   60000,
      // );
      return { data: movies, message: 'success' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async movieById(movieId: string) {
    try {
      const movie = await this.prisma.movie.findUnique({
        where: { id: +movieId },
        include: {
          MovieGenre: { include: { genre: true } },
        },
      });
      if (!movie) {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
      }
      return { data: movie, message: 'success' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async markMovieAs(movieId: string, body: movieMarkAs) {
    try {
      const { isFavourite, isWatchlisted } = body;
      const validateMovieExist = await this.prisma.movie.findUnique({
        where: { id: +movieId },
      });
      if (!validateMovieExist) {
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
      }
      const movie = await this.prisma.movie.update({
        where: { id: +movieId },
        data: {
          isFavourite,
          isWatchlisted,
        },
      });

      return { data: movie, message: 'success' };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
  async pushIMDBData(movies) {
    for (const movie of movies) {
      await this.prisma.$transaction(async (t) => {
        const createdMovie = await t.movie.upsert({
          create: {
            title: movie.title.toLowerCase(),
            year: movie.year,
            tmdbId: movie.id,
          },
          where: { tmdbId: movie.id },
          update: {
            title: movie.title.toLowerCase(),
            year: movie.year,
            tmdbId: movie.id,
          },
        });
        for (const genreId of movie.genreIds) {
          await t.movieGenre.create({
            data: {
              genreId,
              movieId: createdMovie.id,
            },
          });
        }
      });
    }
    return;
  }
  async requestMovieSearch(title: string, year: string) {
    const url = `https://api.themoviedb.org/3/search/movie?query=${title}&include_adult=false&language=en-US&page=1&year=${year}`;
    const options = {
      headers: {
        accept: 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMjMwOGZlYWQzZmRkMWEwNDdmNDY3N2Q4MzQ2MmFhMyIsIm5iZiI6MTcxOTQ0NDM2Ny45OTQ4NzQsInN1YiI6IjY0ZjM0NDE4ZTBjYTdmMDEyZWIzOGQyYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.FyIzdQTFaUIh1A1DNcA1Y6JlX3YTB8lzIW12qSAY3lA',
      },
    };
    const response = await axios.get(url, options);
    const data = await response.data;

    const mapedData = data.results.map((document) => {
      return {
        title: document.title.toLowerCase(),
        year: document.release_date,
        id: document.id,
        genreIds: document.genre_ids,
      };
    });
    await this.pushIMDBData(mapedData);
    return mapedData;
  }
  async recommendation() {
    // const isCached: object = await this.cacheManager.get(`recommendation`);
    // if (isCached) {
    //   return {
    //     data: isCached,
    //     message: 'retrieved all books successfully',
    //   };
    // }
    try {
      const favouritedMovies = await this.prisma.movie.findMany({
        where: { isFavourite: true },
        take: 3,
      });

      let recommendationResult = [];
      for (const movie of favouritedMovies) {
        if (movie.tmdbId) {
          console.log(movie.tmdbId);

          const url = `https://api.themoviedb.org/3/movie/${movie.tmdbId}/recommendations?language=en-US&page=1`;
          const options = {
            headers: {
              accept: 'application/json',
              Authorization:
                'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMjMwOGZlYWQzZmRkMWEwNDdmNDY3N2Q4MzQ2MmFhMyIsIm5iZiI6MTcxOTQ0NDM2Ny45OTQ4NzQsInN1YiI6IjY0ZjM0NDE4ZTBjYTdmMDEyZWIzOGQyYSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.FyIzdQTFaUIh1A1DNcA1Y6JlX3YTB8lzIW12qSAY3lA',
            },
          };
          const response = await axios.get(url, options);
          const data = await response.data;

          const mapedData = data.results.map((document) => {
            return {
              title: document.title.toLowerCase(),
              year: document.release_date,
              tmdbId: document.id,
              genreIds: document.genre_ids,
            };
          });
          recommendationResult = [...recommendationResult, ...mapedData];
        }
      }
      // await this.cacheManager.set(
      //   `recommendation`,
      //   recommendationResult,
      //   60000,
      // );
      return { data: recommendationResult, message: 'success' };
    } catch (error) {
      throw error;
    }
  }
  async createMovie(data: CreateMovieDto) {
    const result = await this.prisma.movie.create({
      data,
    });
    return result;
  }
}
