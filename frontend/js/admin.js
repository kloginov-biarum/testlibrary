/**
 * Admin panel logic.
 * Only accessible to admin_user — others are redirected to catalog.
 */

(async function () {
  if (!requireAdmin()) return;
  renderNavUser();

  document.getElementById('logout-btn').addEventListener('click', logout);

  // ── Alert ─────────────────────────────────────────────────────────────────
  const actionAlert = document.getElementById('action-alert');

  function showAlert(msg, type = 'error') {
    actionAlert.className = `alert alert-${type} visible`;
    actionAlert.textContent = msg;
    setTimeout(() => actionAlert.classList.remove('visible'), 5000);
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  document.getElementById('tab-books').addEventListener('click', () => switchTab('books'));
  document.getElementById('tab-loans').addEventListener('click', () => switchTab('loans'));

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${name}`).classList.add('active');
    document.getElementById(`panel-${name}`).classList.add('active');
    if (name === 'loans') loadAllLoans();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(isoStr) {
    try {
      return new Date(isoStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch { return isoStr; }
  }

  // ── Book Form ─────────────────────────────────────────────────────────────
  const formContainer   = document.getElementById('book-form-container');
  const formTitle       = document.getElementById('book-form-title');
  const editBookId      = document.getElementById('edit-book-id');
  const fTitle          = document.getElementById('f-title');
  const fAuthor         = document.getElementById('f-author');
  const fCategory       = document.getElementById('f-category');
  const fIsbn           = document.getElementById('f-isbn');
  const fYear           = document.getElementById('f-year');
  const fCopies         = document.getElementById('f-copies');
  const fColor          = document.getElementById('f-color');
  const fDesc           = document.getElementById('f-desc');
  const addBookBtn      = document.getElementById('add-book-btn');
  const saveBookBtn     = document.getElementById('save-book-btn');
  const cancelBookBtn   = document.getElementById('cancel-book-btn');

  function openAddForm() {
    editBookId.value = '';
    formTitle.textContent = 'Add Book';
    fTitle.value = ''; fAuthor.value = ''; fCategory.value = '';
    fIsbn.value = ''; fYear.value = ''; fCopies.value = '3';
    fColor.value = '#4A90D9'; fDesc.value = '';
    formContainer.style.display = '';
    fTitle.focus();
  }

  function openEditForm(book) {
    editBookId.value = book.book_id;
    formTitle.textContent = 'Edit Book';
    fTitle.value = book.title;
    fAuthor.value = book.author;
    fCategory.value = book.category;
    fIsbn.value = book.isbn;
    fYear.value = book.year;
    fCopies.value = book.total_copies;
    fColor.value = book.cover_color;
    fDesc.value = book.description || '';
    formContainer.style.display = '';
    fTitle.focus();
  }

  function closeForm() {
    formContainer.style.display = 'none';
    editBookId.value = '';
  }

  addBookBtn.addEventListener('click', openAddForm);
  cancelBookBtn.addEventListener('click', closeForm);

  saveBookBtn.addEventListener('click', async () => {
    const title = fTitle.value.trim();
    const author = fAuthor.value.trim();
    const category = fCategory.value;
    const year = parseInt(fYear.value);
    const totalCopies = parseInt(fCopies.value);

    if (!title || !author || !category || !year || !totalCopies) {
      showAlert('Please fill in all required fields.');
      return;
    }

    const payload = {
      title, author, category,
      isbn: fIsbn.value.trim() || '000-0-000-00000-0',
      year,
      description: fDesc.value.trim(),
      cover_color: fColor.value,
      total_copies: totalCopies,
    };

    saveBookBtn.disabled = true;
    saveBookBtn.textContent = 'Saving…';

    try {
      const bookId = editBookId.value;
      if (bookId) {
        await apiFetch(`/books/${bookId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showAlert('Book updated successfully!', 'success');
      } else {
        await apiFetch('/books', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showAlert('Book added successfully!', 'success');
      }
      closeForm();
      await loadBooks();
    } catch (err) {
      showAlert(err.message);
    } finally {
      saveBookBtn.disabled = false;
      saveBookBtn.textContent = 'Save';
    }
  });

  // ── Books table ───────────────────────────────────────────────────────────
  const booksLoading   = document.getElementById('books-loading');
  const booksTableWrap = document.getElementById('books-table-wrap');
  const booksTbody     = document.getElementById('books-tbody');
  const booksEmpty     = document.getElementById('books-empty');

  async function loadBooks() {
    booksLoading.style.display = '';
    booksTableWrap.style.display = 'none';
    booksEmpty.style.display = 'none';

    try {
      const books = await apiFetch('/books');
      booksLoading.style.display = 'none';

      if (!books || books.length === 0) {
        booksEmpty.style.display = '';
        return;
      }

      booksTbody.innerHTML = books.map(b => `
        <tr data-book-id="${b.book_id}">
          <td>${escHtml(b.title)}</td>
          <td>${escHtml(b.author)}</td>
          <td><span class="badge badge-primary">${escHtml(b.category)}</span></td>
          <td>${b.year < 0 ? Math.abs(b.year) + ' BC' : b.year}</td>
          <td>${b.available_copies} / ${b.total_copies}</td>
          <td>
            <div class="actions">
              <button class="btn btn-outline btn-sm edit-btn" data-book-id="${b.book_id}" data-testid="edit-btn-${b.book_id}">Edit</button>
              <button class="btn btn-danger btn-sm delete-btn" data-book-id="${b.book_id}" data-book-title="${escHtml(b.title)}" data-testid="delete-btn-${b.book_id}">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');

      booksTableWrap.style.display = '';

      // Store books for edit form population
      const bookMap = {};
      books.forEach(b => bookMap[b.book_id] = b);

      booksTbody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => openEditForm(bookMap[btn.dataset.bookId]));
      });

      booksTbody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.dataset.bookId, btn.dataset.bookTitle));
      });

    } catch (err) {
      booksLoading.style.display = 'none';
      showAlert(err.message);
    }
  }

  // ── Delete modal ──────────────────────────────────────────────────────────
  const deleteModal     = document.getElementById('delete-modal');
  const deleteBookTitle = document.getElementById('delete-book-title');
  const deleteCancelBtn = document.getElementById('delete-cancel-btn');
  const deleteConfirmBtn= document.getElementById('delete-confirm-btn');
  const deleteModalClose= document.getElementById('delete-modal-close');

  let pendingDeleteId = null;

  function openDeleteModal(bookId, title) {
    pendingDeleteId = bookId;
    deleteBookTitle.textContent = title;
    deleteModal.classList.add('visible');
  }

  function closeDeleteModal() {
    deleteModal.classList.remove('visible');
    pendingDeleteId = null;
  }

  deleteCancelBtn.addEventListener('click', closeDeleteModal);
  deleteModalClose.addEventListener('click', closeDeleteModal);
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDeleteModal(); });

  deleteConfirmBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) return;
    deleteConfirmBtn.disabled = true;
    deleteConfirmBtn.textContent = 'Deleting…';

    try {
      await apiFetch(`/books/${pendingDeleteId}`, { method: 'DELETE' });
      showAlert('Book deleted.', 'success');
      closeDeleteModal();
      await loadBooks();
    } catch (err) {
      showAlert(err.message);
    } finally {
      deleteConfirmBtn.disabled = false;
      deleteConfirmBtn.textContent = 'Delete';
    }
  });

  // ── All Loans table ───────────────────────────────────────────────────────
  const loansLoading   = document.getElementById('loans-loading');
  const loansTableWrap = document.getElementById('loans-table-wrap');
  const loansTbody     = document.getElementById('loans-tbody');
  const loansEmpty     = document.getElementById('loans-empty');

  async function loadAllLoans() {
    loansLoading.style.display = '';
    loansTableWrap.style.display = 'none';
    loansEmpty.style.display = 'none';

    try {
      const loans = await apiFetch('/loans');
      loansLoading.style.display = 'none';

      if (!loans || loans.length === 0) {
        loansEmpty.style.display = '';
        return;
      }

      loansTbody.innerHTML = loans.map(l => {
        const overdueBadge = l.is_overdue
          ? '<span class="badge badge-danger">Overdue</span>'
          : '<span class="badge badge-success">Active</span>';

        return `
          <tr data-loan-id="${l.loan_id}">
            <td>${escHtml(l.username)}</td>
            <td>${escHtml(l.book_title)}</td>
            <td>${formatDate(l.borrowed_at)}</td>
            <td>${formatDate(l.due_date)}</td>
            <td>${overdueBadge}</td>
            <td>
              <button class="btn btn-danger btn-sm force-return-btn"
                data-loan-id="${l.loan_id}"
                data-testid="force-return-btn-${l.loan_id}"
              >Force Return</button>
            </td>
          </tr>
        `;
      }).join('');

      loansTableWrap.style.display = '';

      loansTbody.querySelectorAll('.force-return-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const original = btn.textContent;
          btn.disabled = true;
          btn.textContent = '…';
          try {
            await apiFetch(`/loans/${btn.dataset.loanId}`, { method: 'DELETE' });
            showAlert('Loan returned.', 'success');
            await loadAllLoans();
          } catch (err) {
            showAlert(err.message);
            btn.disabled = false;
            btn.textContent = original;
          }
        });
      });

    } catch (err) {
      loansLoading.style.display = 'none';
      showAlert(err.message);
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  await loadBooks();
})();
