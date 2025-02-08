import { IMAGE_BASE_URL } from "../constants/constants.js";
import { movieStore } from "../state/movieStore.js";

class MovieList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.innerHTML = `
            <style>
                @import '/styles/movielist.css';
            </style>
             <style>
                @import '/styles/moviedetails.css';
            </style>
            <div class="movie-grid"></div>
        `;
    this.currentPage = 1;
    this.imageCache = new Map();
    this.loading = false;
    this.movies = [];
    this.itemsPerPage = 10;
    this.observer = null;
    this.gridContainer = this.shadowRoot.querySelector(".movie-grid");
    this.loadingElement = null;
    //
    this.details = {
      videos: "",
      similar: [{ title: "movie1" }, { title: "movie2" }],
      reviews: "reviews",
    };

    // Listeners and pub sub

    movieStore.subscribe((state) => {
      if (state.type === "DETAILS") {
        this.details = { ...state };
      } else {
        this.movies = state.movies;
        this.loading = state.loading;
        this.currentPage = state.currentPage;
        this.loadMovies();
        this.addEventListeners();
      }

      this.render();
    });

    movieStore.loadMoreMovies();
  }

  addEventListeners() {
    this.shadowRoot.removeEventListener("click", this.onDetailsClick);
    this.shadowRoot.addEventListener("click", this.onDetailsClick);
  }

  connectedCallback() {
    this.loadMovies();
    this.render();
    this.setupIntersectionObserver();
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.loading) {
            if (this.loading) return;

            this.loading = true;
            this.showLoading();

            movieStore.loadMoreMovies();
          }
        });
      },
      {
        root: null,
        rootMargin: "100px",
        threshold: 0.1,
      }
    );
  }

  render() {
    const hasMoreMovies =
      this.currentPage * this.itemsPerPage <= this.movies.length;

    this.gridContainer.innerHTML = `
              
        ${this.movies.map((movie) => this.renderMovieCard(movie)).join("")}
        ${
          this.loading && hasMoreMovies
            ? '<div class="loading">Loading more movies...</div>'
            : ""
        }
            
        `;
    this.gridContainer = this.shadowRoot.querySelector(".movie-grid");
  }

  async loadMovies() {
    try {
      const startIndex = Math.max(this.currentPage - 1, 1) * this.itemsPerPage;
      const endIndex = startIndex + this.itemsPerPage;
      const newMovies = this.movies.slice(startIndex, endIndex);

      if (newMovies.length > 0) {
        this.currentPage++;

        setTimeout(() => {
          const movieCards = this.shadowRoot.querySelectorAll(".movie-card");
          if (movieCards.length > 0) {
            const lastCard = movieCards[movieCards.length - 1];
            this.observer.observe(lastCard);
          }
        }, 0);
      }
    } catch (error) {
      console.error("Error loading movies:", error);
    } finally {
      this.loading = false;
      this.hideLoading();
    }
  }

  showLoading() {
    if (!this.loadingElement) {
      this.loadingElement = document.createElement("div");
      this.loadingElement.className = "loading";
      this.loadingElement.textContent = "Loading more movies...";
      this.gridContainer.appendChild(this.loadingElement);
    }
  }

  hideLoading() {
    if (this.loadingElement) {
      this.loadingElement.remove();
      this.loadingElement = null;
    }
  }

  appendNewMovies(newMovies) {
    const fragment = document.createDocumentFragment();

    newMovies.forEach((movie) => {
      const movieElement = this.renderMovieCard(movie);

      //movieElement.className = "movie-card";
      //movieElement.innerHTML = ;
      const template = document.createElement("template");
      template.innerHTML = movieElement;
      while (template.content.firstChild) {
        fragment.appendChild(template.content.firstChild);
      }
    });

    this.gridContainer.appendChild(fragment);
  }

  onDetailsClick = async (e) => {
    const movieId = e.target.dataset.id;
    if (movieId) {

      const hostElement = document.querySelector("movie-list");
      const shadowRoot = hostElement.shadowRoot;
      const element = shadowRoot.querySelector(
        `.movie-card[data-id="${movieId}"]`
      );

      const data = await movieStore.getMovieDetails(movieId);

      const detailsNode = `
                    <h2>Trailer</h2>
                    <div class="trailer"><iframe width="560" height="315" src="https://www.youtube.com/embed/${
                      data.videos.key
                    }?si=Xc7AumOdrVPH1p4w" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>
                    <h2>Reviews</h2>
                    <div class="review-container">
                        ${data.reviews.map(
                          (item, index) =>
                            `<div class="review">${
                              item.content.length > 100
                                ? item.content.slice(0, 100) + "..."
                                : item.content
                            }</div><span>${item.author}</span>`
                        )}
                    </div>
                    <h2>Similar Movies</h2>
                    <div class="similar-container">${data.similar.map(
                      (item, index) => this.getSimilarMovies(item)
                    )}</div>
                    <div class="close-details clear-icon">&#215;</div>`;

      element.querySelector(".movie-details").innerHTML = detailsNode;

      const closeDetails = element.querySelector(".close-details");
      closeDetails.addEventListener("click", (e) => {
        element.querySelector(".movie-details").innerHTML = "";
        element.classList.remove("expanded");
      });
      if (element) {
        element.classList.add("expanded");
      }
    }
  };

  getSimilarMovies = (item) => {
    const imageUrl = `${IMAGE_BASE_URL}${item.poster_path}`;
    const year = new Date(item.release_date).getFullYear();
    return `<div class="similar">
     <img class="movie-poster" 
                        src="${imageUrl}"
                        alt="${item.title}"
                        crossorigin="anonymous"/>
                        <div class="similar-movie-info">
                        <h3 class="movie-title">${item.title}</h3>
                        <div class="movie-year">${year}</div>
                        
                    </div>
                        </div>`;
  };

  renderMovieCard(movie) {
    const year = new Date(movie.release_date).getFullYear();
    const imageUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;

    return `
            <div class="movie-card" data-id="${movie.id}">
                <div class="movie-card-inner">
                    <img class="movie-poster" 
                        src="${imageUrl}"
                        alt="${movie.title}"
                        crossorigin="anonymous"/>
                    <div class="movie-info">
                        <h2 class="movie-title">${movie.title}</h2>
                        <div class="movie-year">${year}</div>
                        <div class="movie-rating">★ ${movie.vote_average.toFixed(
                          1
                        )}</div>
                        <p class="movie-overview">${movie.overview}</p>
                        <p class="view-details" data-id="${
                          movie.id
                        }">View Details</p>
                    </div>
                </div>
               
                <div class="movie-details">
               
                </div>
            
            </div>`;
  }
}

customElements.define("movie-list", MovieList);
