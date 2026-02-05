// 🔑 OMDB API key
const API_KEY = "b1b93f1f";

// 🎯 Getting all required HTML elements
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

// 💾 LocalStorage key for favorites
const FAVORITES_KEY = "favoriteMovies";

// 📌 App state variables
let favorites = loadFavorites();
let currentQuery = "";
let currentPage = 1;
let totalResults = 0;
const PAGE_SIZE = 10;

// 🔄 Show loading spinner with message
function showSpinner(message) {
  if (message) {
    spinnerTextEl.textContent = message;
  }
  spinnerEl.classList.remove("is-hidden");
}

// ❌ Hide loading spinner
function hideSpinner() {
  spinnerEl.classList.add("is-hidden");
}

// 📥 Load favorite movies from localStorage
function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return [];
  }
}

// 💾 Save favorite movies to localStorage
function saveFavorites() {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ❤️ Check if movie is already in favorites
function isFavorite(id) {
  return favorites.some((movie) => movie.imdbID === id);
}

// 🧹 Keep only required movie data
function normalizeMovie(movie) {
  return {
    imdbID: movie.imdbID,
    Title: movie.Title,
    Year: movie.Year,
    Poster: movie.Poster,
  };
}

// ➕➖ Add or remove movie from favorites
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

// 🖼️ Display favorite movies list
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

    // ❌ Remove from favorites
    item.querySelector(".favorite-remove").addEventListener("click", () => {
      favorites = favorites.filter(
        (itemMovie) => itemMovie.imdbID !== movie.imdbID,
      );
      saveFavorites();
      renderFavorites();
      updateFavoriteButtons(movie.imdbID);
    });

    // 👀 View movie details
    item.querySelector(".favorite-view").addEventListener("click", () => {
      fetchMovieDetails(movie.imdbID);
    });
    favoritesListEl.appendChild(item);
  });
}

// 🔄 Update all favorite buttons UI
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

// 🧹 Clear all favorites
clearFavoritesButton.addEventListener("click", () => {
  favorites = [];
  saveFavorites();
  renderFavorites();
  document.querySelectorAll(".favorite-btn").forEach((button) => {
    button.classList.remove("is-saved");
    button.textContent = "Save to Favorites";
  });
});

// ⬅️ Pagination previous page
prevPageButton.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    fetchSearchResults();
  }
});

// ➡️ Pagination next page
nextPageButton.addEventListener("click", () => {
  const totalPages = Math.ceil(totalResults / PAGE_SIZE);
  if (currentPage < totalPages) {
    currentPage += 1;
    fetchSearchResults();
  }
});

// ❌ Close modal
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

// 🔎 Start search when Enter key is pressed
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    startSearch();
  }
});
// 🌐 Search movies from OMDB API
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

// ▶️ Start a new search
function startSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  currentQuery = query;
  currentPage = 1;
  searchInput.value = "";
  fetchSearchResults();
}

// 🌐 Fetch movies from OMDB API
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
// 🔢 Update pagination controls based on current page and total results
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

// 📃 Show movies on screen
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
// 🌐 Fetch detailed movie info from OMDB API
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
// 📃 Show detailed movie info in modal
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
// 🔍 Open modal to show movie details
function openModal() {
  modalOverlay.classList.remove("is-hidden");
}
// ❌ Close modal
function closeModal() {
  modalOverlay.classList.add("is-hidden");
}

// 🏁 Initial render of favorites on page load
renderFavorites();
