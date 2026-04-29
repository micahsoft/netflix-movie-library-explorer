import { gql } from '@apollo/client'

const MOVIE_FIELDS = gql`
  fragment MovieFields on MovieType {
    id
    title
    rating
    genres
    year
    description
    source
  }
`

export const GET_STATS = gql`
  query GetStats {
    stats {
      totalCount
      averageRating
      topGenres {
        genre
        count
      }
      byYear {
        year
        count
        movies {
          ...MovieFields
        }
      }
    }
  }
  ${MOVIE_FIELDS}
`

export const GET_TOP_RATED = gql`
  query GetTopRated($limit: Int) {
    topRated(limit: $limit) {
      ...MovieFields
    }
  }
  ${MOVIE_FIELDS}
`

export const SEARCH_MOVIES = gql`
  query SearchMovies($filter: MovieFilterInput, $limit: Int, $offset: Int) {
    movies(filter: $filter, limit: $limit, offset: $offset) {
      items {
        ...MovieFields
      }
      total
    }
  }
  ${MOVIE_FIELDS}
`

export const ADD_MOVIE = gql`
  mutation AddMovie($input: AddMovieInput!) {
    addMovie(input: $input) {
      ...MovieFields
    }
  }
  ${MOVIE_FIELDS}
`

export const GET_QUARANTINE_SUMMARY = gql`
  query GetQuarantineSummary {
    quarantineSummary {
      total
      byReason {
        reason
        count
      }
    }
  }
`
