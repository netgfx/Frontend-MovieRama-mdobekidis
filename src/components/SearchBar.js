import { movieStore } from '../state/movieStore.js';

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        
        this.shadowRoot.innerHTML = `
            <link rel="stylesheet" href="/styles/searchbar.css">
            <div class="search-container">
                <input class="searchbar" type="search" placeholder="Search movies...">
                <div id="clear-search" class="clear-icon">&#215;</div>
            </div>
        `;

        this.clearSearch = (length) => {
            if(length === 0){
                this.shadowRoot.getElementById('clear-search').style.display = 'none';
            }
            movieStore.setSearchResults(movieStore.getMovies());
            movieStore.clearSearchResults();
        }

        this.shadowRoot.getElementById('clear-search').addEventListener("click", (e) => {
            this.shadowRoot.getElementById('clear-search').style.display = 'none';
            this.shadowRoot.querySelector('input').value = '';
            this.clearSearch(0);
        })

        this.shadowRoot.querySelector('input').addEventListener('input', (e) => {
            const query = e.target.value;
            if(query.length <= 2) {
                this.clearSearch(query.length);
                return;
            }

            this.shadowRoot.getElementById('clear-search').style.display = query ? 'block' : 'none';
            movieStore.searchMovies(query, 1);
            
            // Mock search implementation
            const results = movieStore.getMovies().filter(movie => 
                movie.title.toLowerCase().includes(query.toLowerCase())
            );
            movieStore.setSearchResults(results);
        });
    }
}

customElements.define('search-bar', SearchBar);