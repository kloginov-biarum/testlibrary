# Bug Reports — `problem_user`

**Application:** TestLibrary
**Frontend:** https://kloginov-biarum.github.io/testlibrary/
**Credentials:** username `problem_user`, password `secret_sauce`

---

## BUG-001: All book covers display the same color

**Severity:** Minor
**Priority:** Low
**Component:** Book Catalog — Book Card

**Requirement:** REQ-2.3 — Each book card shall display its own unique cover color distinct from other cards.

**Preconditions:**
1. Open https://kloginov-biarum.github.io/testlibrary/
2. Log in as `problem_user` / `secret_sauce`

**Steps to reproduce:**
1. Navigate to the Catalog page
2. Observe the cover color of multiple book cards

**Expected result:**
Each book card displays a unique cover color corresponding to that book.

**Actual result:**
All book cards display the same red color (#E74C3C) regardless of the book.

---

## BUG-002: Sort dropdown has no effect on book order

**Severity:** Major
**Priority:** High
**Component:** Book Catalog — Sort

**Requirement:** REQ-2.7 — Selecting a sort option from the sort dropdown shall reorder the book list accordingly.

**Preconditions:**
1. Open https://kloginov-biarum.github.io/testlibrary/
2. Log in as `problem_user` / `secret_sauce`

**Steps to reproduce:**
1. Navigate to the Catalog page
2. Note the current order of books
3. Select "Title Z→A" from the sort dropdown
4. Observe the book list order
5. Select "Author A→Z" from the sort dropdown
6. Observe the book list order

**Expected result:**
The book list reorders according to the selected sort option on each change.

**Actual result:**
The book list order does not change regardless of the selected sort option.

---

## BUG-003: Borrow button borrows wrong book

**Severity:** Critical
**Priority:** Critical
**Component:** Book Catalog — Borrow

**Requirement:** REQ-3.1 — Clicking Borrow on a book card shall borrow that exact book. The book that appears in My Books shall match the title of the clicked card.

**Preconditions:**
1. Open https://kloginov-biarum.github.io/testlibrary/
2. Log in as `problem_user` / `secret_sauce`

**Steps to reproduce:**
1. Navigate to the Catalog page
2. Note the title of the first book in the list
3. Click "Borrow" on any book that is **not** the first one
4. Navigate to the My Books page
5. Observe which book was borrowed

**Expected result:**
The book displayed in My Books matches the title of the book whose Borrow button was clicked.

**Actual result:**
The first book in the catalog list is borrowed instead of the selected one.

---

## BUG-004: Return button is not displayed on My Books page

**Severity:** Critical
**Priority:** Critical
**Component:** My Books — Return

**Requirement:** REQ-4.3 — Each borrowed book entry shall have a visible Return button.

**Preconditions:**
1. Open https://kloginov-biarum.github.io/testlibrary/
2. Log in as `problem_user` / `secret_sauce`
3. Borrow at least one book from the Catalog

**Steps to reproduce:**
1. Navigate to the My Books page
2. Observe the borrowed book entries

**Expected result:**
Each borrowed book entry displays a Return button that allows the user to return the book.

**Actual result:**
No Return button is displayed for any borrowed book. The user has no way to return books through the UI.
