export type movie = {
  title: string;
  country: string;
  year: string;
  length: number;
  tmdbId?: string;
};
export type movieQueyFields = {
  page: string;
  pageSize: string;
  title?: string;
  country?: string;
  year?: string;
  length?: string;
  tmdbId?: string;
  genreName?: string;
};
export type movieMarkAs = {
  isWatchlisted?: boolean;
  isFavourite?: boolean;
};
