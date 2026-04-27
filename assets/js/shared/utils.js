export function showError(title, message) {
  document.getElementById("drawer").classList.add("hidden");
  document.getElementById("drawer-toggle").classList.add("hidden");

  let main = document.getElementById("main-content");

  main.innerHTML = `
    <div class="error-screen">
      <svg class="error-icon" width="56" height="56">
        <use href="/assets/images/symbol-defs.svg#error"></use>
      </svg>
      <h2 class="error-title">${title}</h2>
      <p class="error-message">
        ${message}
      </p>
      <button class="button -primary" data-retry>Try again</button>
    </div>
  `;

  main.querySelector("[data-retry]").addEventListener("click", () => {
    location.reload();
  });
}
