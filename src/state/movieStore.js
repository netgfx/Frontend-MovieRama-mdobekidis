import {
  MOVIE_DETAILS_URL,
  MOVIE_SIMILAR_URL,
  MOVIE_REVIEWS_URL,
  MOVIE_VIDEOS_URL,
  NOW_PLAYING_URL,
  SEARCH_URL,
} from "../constants/constants.js";
import { fetcher } from "../service/fetcher.js";

class MovieStore {
  constructor() {
    if (MovieStore.instance) {
      return MovieStore.instance;
    }
    MovieStore.instance = this;

    this.state = {
      movies: [],
      searchResults: [],
      currentPage: 1,
      itemsPerPage: 10,
      loading: false,
      searchQuery: "",
    };

    this.detailState = {
      details: {},
      videos: "",
      similar: [],
      reviews: [],
    };

    this.observers = new Set();
  }

  subscribe(observer) {
    this.observers.add(observer);
  }

  unsubscribe(observer) {
    this.observers.delete(observer);
  }

  notify() {
    this.observers.forEach((observer) => observer(this.state));
  }

  notifyDetails() {
    this.observers.forEach((observer) => observer(this.detailState));
  }

  setState(newState) {
    if (newState.type === "MOVIES") {
      this.state = { ...this.state, ...newState };
      this.notify();
    } else {
      this.detailState = { ...this.detailState, ...newState };
      this.notifyDetails();
    }
  }

  setSearchResults(results, query) {
    this.setState({ type: "MOVIES", searchResults: results, movies: results, searchQuery: query, currentPage: 1 });
  }

  clearSearchResults() {

    this.setState({ type: "MOVIES",searchResults: [], movies: [], searchQuery: null, currentPage: 1 });
    this.loadMoreMovies()
  }

  async getMovieDetails(movieId) {
    const movieDetails = fetcher(
      MOVIE_DETAILS_URL.replace("{movie_id}", movieId),
      "GET",
      {}
    );
    const movieVideos = fetcher(
      MOVIE_VIDEOS_URL.replace("{movie_id}", movieId),
      "GET",
      {}
    );
    const movieSimilar = fetcher(
      MOVIE_SIMILAR_URL.replace("{movie_id}", movieId),
      "GET",
      {}
    );
    const movieReviews = fetcher(
      MOVIE_REVIEWS_URL.replace("{movie_id}", movieId),
      "GET",
      {}
    );

    const data = await Promise.all([
      movieDetails,
      movieVideos,
      movieSimilar,
      movieReviews,
    ]);
    if (data) {
      return {
        details: data[0],
        videos:
          data[1].results.find(
            (video) => video.type.toLowerCase() === "trailer"
          ) || data[1].results[0],
        similar: data[2].results.slice(0, 3),
        reviews: data[3].results.slice(0, 2),
      };
    }
  }

  async loadMoreMovies() {
    const start =
      Math.max(this.state.currentPage - 1, 1) * this.state.itemsPerPage;
    let newMovies = [];
    if (this.state.searchQuery !== null && this.state.searchQuery !== "" && this.state.searchQuery !== undefined) {
      newMovies = await this.getSearchResults();
    } else {
      newMovies = await fetcher(NOW_PLAYING_URL, "GET", {
        page: this.state.currentPage,
      });
      newMovies = newMovies.results;
    }

    this.setState({
      type: "MOVIES",
      movies: [...this.state.movies, ...newMovies],
      currentPage: this.state.currentPage + 1,
    });
  }

  async getSearchResults() {
    const results = await fetcher(SEARCH_URL, "GET", {
      query: this.state.searchQuery,
      page: this.state.currentPage,
    });

    return results.results;
  }

  async searchMovies(query, page) {
    this.currentPage = 1;
    const results = await fetcher(SEARCH_URL, "GET", {
      query: query,
      page: this.currentPage,
    });
    this.setSearchResults(results.results, query);
  }

  getMovies() {
    return this.state.movies;
  }
}

export const movieStore = new MovieStore();
