// Sample data for demonstration
const samplePapers = [
    {
        title: "Machine Learning Applications in Education",
        author: "Dr. Sarah Johnson",
        date: "2025-02-28",
        views: 1234,
        category: "Computer Science"
    },
    {
        title: "Climate Change Impact Analysis",
        author: "Prof. Michael Chen",
        date: "2025-02-25",
        views: 987,
        category: "Environmental Science"
    },
    // Add more sample papers as needed
];

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Student name is now set by PHP from session data
    // No need to override it with JavaScript

    // Initialize papers grid
    initializePapersGrid();

    // Initialize search functionality
    initializeSearch();

    // Initialize sorting
    initializeSorting();
});

function initializePapersGrid() {
    const papersGrid = document.querySelector('.papers-grid');
    
    samplePapers.forEach(paper => {
        const paperCard = createPaperCard(paper);
        papersGrid.appendChild(paperCard);
    });
}

function createPaperCard(paper) {
    const card = document.createElement('div');
    card.className = 'paper-card';
    card.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="color: var(--primary-color); margin-bottom: 10px;">${paper.title}</h3>
            <p style="color: #666; font-size: 0.9rem;">By ${paper.author}</p>
            <p style="color: #666; font-size: 0.9rem;">Published: ${formatDate(paper.date)}</p>
            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <span style="color: #666;"><i class="fas fa-eye"></i> ${paper.views}</span>
                <button onclick="bookmarkPaper(this)" style="background: none; border: none; cursor: pointer;">
                    <i class="far fa-bookmark"></i>
                </button>
            </div>
        </div>
    `;
    return card;
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

function initializeSearch() {
    const searchInput = document.querySelector('.search-container input');
    const searchButton = document.querySelector('.search-container button');

    searchButton.addEventListener('click', () => performSearch(searchInput.value));
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(searchInput.value);
        }
    });
}

function performSearch(query) {
    // Implement search functionality here
    console.log('Searching for:', query);
    // You would typically make an API call here to get search results
}

function initializeSorting() {
    const sortSelect = document.getElementById('sortFilter');
    sortSelect.addEventListener('change', (e) => {
        const sortValue = e.target.value;
        sortPapers(sortValue);
    });
}

function sortPapers(sortType) {
    // Implement sorting functionality here
    console.log('Sorting by:', sortType);
    // You would typically re-render the papers grid with sorted data
}

function bookmarkPaper(button) {
    button.querySelector('i').classList.toggle('fas');
    button.querySelector('i').classList.toggle('far');
    // You would typically make an API call here to save the bookmark
}

// Add responsive navigation for mobile
document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.parentElement.classList.remove('active'));
            // Add active class to clicked link
            e.currentTarget.parentElement.classList.add('active');
        });
    });
});
