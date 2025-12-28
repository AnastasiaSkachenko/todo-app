export class Modal {
  private overlay: HTMLElement;
  private modal: HTMLElement;
  private lastFocused: HTMLElement | null = null;

  constructor(overlay: HTMLElement) {
    this.overlay = overlay;
    this.modal = overlay.querySelector(".modal") as HTMLElement;

    this.handleKeydown = this.handleKeydown.bind(this);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });

    overlay.querySelectorAll("[data-close]").forEach(btn =>
      btn.addEventListener("click", () => this.close())
    );
  }

  open() {
    this.lastFocused = document.activeElement as HTMLElement;
    this.overlay.classList.remove("hidden");
    // Trigger reflow to enable animation
    void this.overlay.offsetHeight;

    const focusable = this.getFocusable();
    focusable[0]?.focus();

    document.addEventListener("keydown", this.handleKeydown);
    document.body.style.overflow = "hidden";
  }

  close() {
    this.overlay.classList.add("hidden");
    document.removeEventListener("keydown", this.handleKeydown);
    document.body.style.overflow = "";
    this.lastFocused?.focus();
  }

  isOpen(): boolean {
    return !this.overlay.classList.contains("hidden");
  }

  private handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") this.close();
    if (e.key === "Tab") this.trapFocus(e);
  }

  private getFocusable(): HTMLElement[] {
    return Array.from(
      this.modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  private trapFocus(e: KeyboardEvent) {
    const focusable = this.getFocusable();
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}
