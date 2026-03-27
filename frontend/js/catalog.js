/**
 * Catalog page logic.
 *
 * problem_user bugs injected here:
 *   BUG-1: All book covers render the same color (#E74C3C)
 *   BUG-2: Sort dropdown has no effect (always title asc)
 *   BUG-3: Borrow button always borrows the FIRST book in the list
 */

(async function () {
  if (!requireAuth()) return;
  renderNavUser();

  document.getElementById('logout-btn').addEventListener('click', logout);

  const isProblemUser = getUser().user_type === 'problem_user';

  // Track the first book id for BUG-3
  let firstBookId = null;

  // ── Elements ──────────────────────────────────────────────────────────────
  const searchInput     = document.getElementById('search-input');
  const searchBtn       = document.getElementById('search-btn');
  const clearBtn        = document.getElementById('clear-search-btn');
  const categoryFilter  = document.getElementById('category-filter');
  const sortSelect      = document.getElementById('sort-select');
  const booksGrid       = document.getElementById('books-grid');
  const booksCount      = document.getElementById('books-count');
  const loadingState    = document.getElementById('loading-state');
  const emptyState      = document.getElementById('empty-state');
  const toolbarAlert    = document.getElementById('toolbar-alert');

  // ── State ─────────────────────────────────────────────────────────────────
  let userLoanCount = 0;
  const MAX_LOANS = 3;

  // ── Helpers ───────────────────────────────────────────────────────────────
  function showAlert(msg) {
    toolbarAlert.textContent = msg;
    toolbarAlert.classList.add('visible');
    setTimeout(() => toolbarAlert.classList.remove('visible'), 4000);
  }

  function setLoading(yes) {
    loadingState.style.display = yes ? '' : 'none';
    booksGrid.style.display = yes ? 'none' : '';
  }

  function categoryIcon(cat) {
    const icons = {
      Fiction: '📖', Science: '🔬', History: '🏛️',
      Technology: '💻', Biography: '👤', Fantasy: '🧙',
    };
    return icons[cat] || '📚';
  }

  // ── Build query params ────────────────────────────────────────────────────
  function buildParams() {
    const params = new URLSearchParams();
    const q = searchInput.value.trim();
    if (q) params.set('search', q);

    const cat = categoryFilter.value;
    if (cat) params.set('category', cat);

    // BUG-2: problem_user — sort param is always ignored (default title asc)
    if (!isProblemUser) {
      const [sortBy, sortOrder] = sortSelect.value.split('_');
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
    }

    return params.toString() ? '?' + params.toString() : '';
  }

  // ── Render a single book card ─────────────────────────────────────────────
  function renderCard(book, index) {
    // BUG-1: problem_user sees all covers the same color
    const coverColor = isProblemUser ? '#E74C3C' : book.cover_color;

    const available = book.available_copies > 0;
    const atLimit = userLoanCount >= MAX_LOANS;

    let btnLabel, btnDisabled, btnClass;
    if (!available) {
      btnLabel = 'Unavailable';
      btnDisabled = true;
      btnClass = 'btn-outline';
    } else if (atLimit) {
      btnLabel = 'Limit Reached';
      btnDisabled = true;
      btnClass = 'btn-outline';
    } else {
      btnLabel = 'Borrow';
      btnDisabled = false;
      btnClass = 'btn-success';
    }

    const disabledAttr = btnDisabled ? 'disabled' : '';
    const copies = book.available_copies === 0
      ? `<span class="book-copies none">0 / ${book.total_copies} available</span>`
      : `<span class="book-copies">${book.available_copies} / ${book.total_copies} available</span>`;

    const coverHtml = isProblemUser
      ? `<div class="book-cover" style="background:${coverColor}"><span class="book-cover-icon">${categoryIcon(book.category)}</span></div>`
      : `<div class="book-cover book-cover-img" style="background:${coverColor}">
           <img
             src="https://covers.openlibrary.org/b/isbn/${encodeURIComponent(book.isbn)}-M.jpg"
             alt="${escHtml(book.title)}"
             loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display=''"
           />
           <span class="book-cover-icon" style="display:none">${categoryIcon(book.category)}</span>
         </div>`;

    return `
      <article class="book-card" data-book-id="${book.book_id}" data-index="${index}">
        ${coverHtml}
        <div class="book-body">
          <div class="book-title">${escHtml(book.title)}</div>
          <div class="book-author">${escHtml(book.author)}</div>
          <div class="book-meta">
            <span class="badge badge-primary">${escHtml(book.category)}</span>
            ${copies}
          </div>
        </div>
        <div class="book-footer">
          <button
            class="btn ${btnClass} btn-sm btn-full borrow-btn"
            data-book-id="${book.book_id}"
            data-testid="borrow-btn-${book.book_id}"
            ${disabledAttr}
          >${btnLabel}</button>
        </div>
      </article>
    `;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── Load & render books ───────────────────────────────────────────────────
  async function loadBooks() {
    setLoading(true);
    emptyState.style.display = 'none';
    booksCount.textContent = '';

    try {
      // Also refresh loan count
      const loans = await apiFetch('/loans/me');
      userLoanCount = loans ? loans.length : 0;

      const books = await apiFetch('/books' + buildParams());

      if (!books || books.length === 0) {
        booksGrid.innerHTML = '';
        booksGrid.style.display = 'none';
        emptyState.style.display = '';
        booksCount.textContent = 'No books found';
        return;
      }

      firstBookId = books[0].book_id;
      booksGrid.innerHTML = books.map((b, i) => renderCard(b, i)).join('');
      booksGrid.style.display = '';
      booksCount.textContent = `Showing ${books.length} book${books.length !== 1 ? 's' : ''}`;

      // Attach borrow handlers
      booksGrid.querySelectorAll('.borrow-btn:not([disabled])').forEach(btn => {
        btn.addEventListener('click', () => {
          // BUG-3: problem_user always borrows the first book
          const bookId = isProblemUser ? firstBookId : btn.dataset.bookId;
          borrowBook(bookId, btn);
        });
      });

    } catch (err) {
      booksGrid.innerHTML = '';
      booksGrid.style.display = '';
      booksCount.textContent = '';
      showAlert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // ── Borrow action ─────────────────────────────────────────────────────────
  async function borrowBook(bookId, btnEl) {
    const originalLabel = btnEl.textContent;
    btnEl.disabled = true;
    btnEl.textContent = '…';

    try {
      await apiFetch('/loans', {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId }),
      });
      // Reload to reflect updated counts
      await loadBooks();
    } catch (err) {
      showAlert(err.message);
      btnEl.disabled = false;
      btnEl.textContent = originalLabel;
    }
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  searchBtn.addEventListener('click', loadBooks);
  searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadBooks(); });
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    loadBooks();
  });
  categoryFilter.addEventListener('change', loadBooks);
  sortSelect.addEventListener('change', loadBooks);

  // ── Init ──────────────────────────────────────────────────────────────────
  await loadBooks();
})();
