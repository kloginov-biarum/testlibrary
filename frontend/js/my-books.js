/**
 * My Books page logic.
 *
 * problem_user bugs injected here:
 *   BUG-4: Return buttons are not rendered — user cannot return books via UI
 */

(async function () {
  if (!requireAuth()) return;
  renderNavUser();

  document.getElementById('logout-btn').addEventListener('click', logout);

  const isProblemUser = getUser().user_type === 'problem_user';

  const loansList    = document.getElementById('loans-list');
  const emptyState   = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const actionAlert  = document.getElementById('action-alert');

  function showAlert(msg, type = 'error') {
    actionAlert.className = `alert alert-${type} visible`;
    actionAlert.textContent = msg;
    setTimeout(() => actionAlert.classList.remove('visible'), 5000);
  }

  function categoryIcon(title) {
    // Simple heuristic based on keywords — in real app would use category field
    return '📖';
  }

  function formatDate(isoStr) {
    try {
      return new Date(isoStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
    } catch {
      return isoStr;
    }
  }

  function renderLoan(loan) {
    const overdueCls = loan.is_overdue ? ' overdue' : '';
    const overdueLabel = loan.is_overdue ? ' ⚠ Overdue' : '';

    // BUG-4: problem_user — return button is not rendered
    const returnBtn = isProblemUser
      ? ''
      : `<button
           class="btn btn-danger btn-sm return-btn"
           data-loan-id="${loan.loan_id}"
           data-testid="return-btn-${loan.loan_id}"
         >Return</button>`;

    return `
      <div class="loan-card" data-loan-id="${loan.loan_id}">
        <div class="loan-cover" style="background:#e8edff">
          <span>📖</span>
        </div>
        <div class="loan-info">
          <div class="loan-title">${escHtml(loan.book_title)}</div>
          <div class="loan-author">${escHtml(loan.book_author)}</div>
          <div class="loan-dates">
            <span>Borrowed: ${formatDate(loan.borrowed_at)}</span>
            <span class="due-date${overdueCls}">Due: ${formatDate(loan.due_date)}${overdueLabel}</span>
          </div>
        </div>
        <div class="loan-actions">
          ${returnBtn}
        </div>
      </div>
    `;
  }

  function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function loadLoans() {
    loadingState.style.display = '';
    loansList.style.display = 'none';
    emptyState.style.display = 'none';

    try {
      const loans = await apiFetch('/loans/me');

      loadingState.style.display = 'none';

      if (!loans || loans.length === 0) {
        emptyState.style.display = '';
        return;
      }

      loansList.innerHTML = loans.map(renderLoan).join('');
      loansList.style.display = '';

      // Attach return handlers
      loansList.querySelectorAll('.return-btn').forEach(btn => {
        btn.addEventListener('click', () => returnBook(btn.dataset.loanId, btn));
      });

    } catch (err) {
      loadingState.style.display = 'none';
      showAlert(err.message);
    }
  }

  async function returnBook(loanId, btnEl) {
    const originalLabel = btnEl.textContent;
    btnEl.disabled = true;
    btnEl.textContent = '…';

    try {
      await apiFetch(`/loans/${loanId}`, { method: 'DELETE' });
      showAlert('Book returned successfully!', 'success');
      await loadLoans();
    } catch (err) {
      showAlert(err.message);
      btnEl.disabled = false;
      btnEl.textContent = originalLabel;
    }
  }

  await loadLoans();
})();
