const API_KEY = "b1b93f1f";
const searchButton = document.getElementById("searchButton");
const searchInput = document.getElementById("searchInput");
const resultsDiv = document.getElementById("results");
const movieDetailsDiv = document.getElementById("movieDetails");
const spinnerEl = document.getElementById("spinner");
const spinnerTextEl = spinnerEl.querySelector(".spinner-text");
const favoritesListEl = document.getElementById("favoritesList");
const favoritesEmptyEl = document.getElementById("favoritesEmpty");
const clearFavoritesButton = document.getElementById("clearFavoritesButton");
const paginationEl = document.getElementById("pagination");
const prevPageButton = document.getElementById("prevPage");
const nextPageButton = document.getElementById("nextPage");
const pageInfoEl = document.getElementById("pageInfo");
const modalOverlay = document.getElementById("modalOverlay");
const modalCloseButton = document.getElementById("modalClose");
const modalContentEl = document.getElementById("modalContent");

const FAVORITES_KEY = "favoriteMovies";
let favorites = loadFavorites();
let currentQuery = "";
let currentPage = 1;
let totalResults = 0;
const PAGE_SIZE = 10;

function showSpinner(message) {
  if (message) {
    spinnerTextEl.textContent = message;
  }
  spinnerEl.classList.remove("is-hidden");
}

function hideSpinner() {
  spinnerEl.classList.add("is-hidden");
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorite(id) {
  return favorites.some((movie) => movie.imdbID === id);
}

function normalizeMovie(movie) {
  return {
    imdbID: movie.imdbID,
    Title: movie.Title,
    Year: movie.Year,
    Poster: movie.Poster,
  };
}

function toggleFavorite(movie) {
  const exists = isFavorite(movie.imdbID);
  if (exists) {
    favorites = favorites.filter((item) => item.imdbID !== movie.imdbID);
  } else {
    favorites.unshift(normalizeMovie(movie));
  }
  saveFavorites();
  renderFavorites();
}

function renderFavorites() {
  favoritesListEl.innerHTML = "";
  favoritesEmptyEl.style.display = favorites.length ? "none" : "block";

  favorites.forEach((movie) => {
    const item = document.createElement("div");
    item.classList.add("favorite-item");
    item.innerHTML = `
      <img src="${movie.Poster !== "N/A" ? movie.Poster : "placeholder.jpg"}" alt="${movie.Title}">
      <div>
        <h4>${movie.Title}</h4>
        <p>${movie.Year}</p>
        <button class="favorite-remove" data-id="${movie.imdbID}">Remove</button>
        <button class="favorite-view" data-id="${movie.imdbID}">View</button>
      </div>
    `;
    item.querySelector(".favorite-remove").addEventListener("click", () => {
      favorites = favorites.filter(
        (itemMovie) => itemMovie.imdbID !== movie.imdbID,
      );
      saveFavorites();
      renderFavorites();
      updateFavoriteButtons(movie.imdbID);
    });
    item.querySelector(".favorite-view").addEventListener("click", () => {
      fetchMovieDetails(movie.imdbID);
    });
    favoritesListEl.appendChild(item);
  });
}

function updateFavoriteButtons(id) {
  const buttons = document.querySelectorAll(`[data-favorite-id="${id}"]`);
  buttons.forEach((button) => {
    if (isFavorite(id)) {
      button.classList.add("is-saved");
      button.textContent = "Saved";
    } else {
      button.classList.remove("is-saved");
      button.textContent = "Save to Favorites";
    }
  });
}

// Search movie
searchButton.addEventListener("click", startSearch);
clearFavoritesButton.addEventListener("click", () => {
  favorites = [];
  saveFavorites();
  renderFavorites();
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.classList.remove("is-saved");
    button.textContent = "Save to Favorites";
  });
});
prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    fetchSearchResults();
  }
});
nextPageButton.addEventListener("click", () => {
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  if (currentPage < totalPages) {
    currentPage += 1;
    fetchSearchResults();
  }
});
modalCloseButton.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    closeModal();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
  }
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    startSearch();
  }
});

async function searchMovies() {
  const query = searchInput.value.trim();
  if (!query) return;
  try {
    searchInput.value = "";
    showSpinner("Searching…");
    const response = await fetch(
      `https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`,
    );

    const data = await response.json();
    if (data.Response === "True") {
      displayMovies(data.Search);
    } else {
      hideSpinner();
      resultsDiv.innerHTML = `<p>No movies found. Please try again.</p>`;
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
    hideSpinner();
    resultsDiv.innerHTML = `<p>Something went wrong. Please try again later.</p>`;
  }
}

function startSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  currentQuery = query;
  currentPage = 1;
  searchInput.value = "";
  fetchSearchResults();
}

async function fetchSearchResults() {
  if (!currentQuery) return;
  try {
    showSpinner("Searching...");
    const response = await fetch(
      `https://www.omdbapi.com/?s=${currentQuery}&page=${currentPage}&apikey=${API_KEY}`,
    );

    const data = await response.json();
    if (data.Response === "True") {
      totalResults = Number.parseInt(data.totalResults, 10) || 0;
      displayMovies(data.Search);
      updatePagination();
    } else {
      totalResults = 0;
      updatePagination();
      hideSpinner();
      resultsDiv.innerHTML = `<p>No movies found. Please try again.</p>`;
    }
  } catch (error) {
    console.error("Error fetching movies:", error);
    hideSpinner();
    resultsDiv.innerHTML = `<p>Something went wrong. Please try again later.</p>`;
  }
}

function updatePagination() {
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  if (totalPages > 1) {
    paginationEl.classList.remove("is-hidden");
    pageInfoEl.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage === 1;
    nextPageButton.disabled = currentPage === totalPages;
  } else {
    paginationEl.classList.add("is-hidden");
  }
}

function displayMovies(movies) {
  hideSpinner();
  resultsDiv.innerHTML = "";
  movies.forEach((movie) => {
    const movieItem = document.createElement("div");
    movieItem.classList.add("movie-item");
    movieItem.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : "placeholder.jpg"}" alt="${movie.Title}">
            <h3>${movie.Title}</h3>
            <p>Year: ${movie.Year}</p>
            <button class="favorite-btn" data-favorite-id="${movie.imdbID}">Save to Favorites</button>
        `;
    movieItem.addEventListener("click", () => fetchMovieDetails(movie.imdbID));
    const favoriteButton = movieItem.querySelector(".favorite-btn");
    if (isFavorite(movie.imdbID)) {
      favoriteButton.classList.add("is-saved");
      favoriteButton.textContent = "Saved";
    }
    favoriteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavorite(movie);
      updateFavoriteButtons(movie.imdbID);
    });
    resultsDiv.appendChild(movieItem);
  });
}

async function fetchMovieDetails(id) {
  try {
    showSpinner("Loading details…");
    const response = await fetch(
      `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`,
    );
    const movie = await response.json();
    displayMovieDetails(movie);
    hideSpinner();
  } catch (error) {
    console.error("Error fetching movie details:", error);
    hideSpinner();
    modalContentEl.innerHTML = `<p>Could not load movie details.</p>`;
    openModal();
  }
}

function displayMovieDetails(movie) {
  const saved = isFavorite(movie.imdbID);
  modalContentEl.innerHTML = `
        <h2 id="modalTitle">${movie.Title}</h2>
        <p><strong>Genre:</strong> ${movie.Genre}</p>
        <p><strong>Director:</strong> ${movie.Director}</p>
        <p><strong>Plot:</strong> ${movie.Plot}</p>
        <p><strong>Cast:</strong> ${movie.Actors}</p>
        <button class="favorite-btn details-favorite-btn" data-favorite-id="${movie.imdbID}">
          ${saved ? "Saved" : "Save to Favorites"}
        </button>
    `;
  const detailsButton = modalContentEl.querySelector(".details-favorite-btn");
  if (saved) {
    detailsButton.classList.add("is-saved");
  }
  detailsButton.addEventListener("click", () => {
    toggleFavorite(movie);
    updateFavoriteButtons(movie.imdbID);
  });
  openModal();
}

function openModal() {
  modalOverlay.classList.remove("is-hidden");
}

function closeModal() {
  modalOverlay.classList.add("is-hidden");
}

renderFavorites();
