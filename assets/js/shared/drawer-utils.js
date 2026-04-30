export function initPersistentDrawer({ storageKey }) {
  let drawerEl = document.getElementById("drawer");
  let contentEl = document.getElementById("drawer-content");
  let navEl = document.getElementById("drawer-nav");
  let toggleEl = document.getElementById("drawer-toggle");
  let closeBtn = document.getElementById("drawer-close");

  function openDrawer() {
    drawerEl.classList.add("open");
    toggleEl.classList.add("drawer-open");
    localStorage.setItem(storageKey, "true");
    window.dispatchEvent(new CustomEvent("drawer:toggle", { detail: { open: true } }));
  }

  function closeDrawer() {
    drawerEl.classList.remove("open");
    toggleEl.classList.remove("drawer-open");
    localStorage.setItem(storageKey, "false");
    window.dispatchEvent(new CustomEvent("drawer:toggle", { detail: { open: false } }));
  }

  function toggleDrawer() {
    if (drawerEl.classList.contains("open")) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  let stored = localStorage.getItem(storageKey);

  if (stored === "false") {
    closeDrawer();
  } else {
    openDrawer();
  }

  closeBtn.addEventListener("click", closeDrawer);
  toggleEl.addEventListener("click", toggleDrawer);

  return {
    drawerEl,
    contentEl,
    navEl,
    toggleEl,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    isOpen() {
      return drawerEl.classList.contains("open");
    },
  };
}
