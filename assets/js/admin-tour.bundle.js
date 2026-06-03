(() => {
  // src/admin-tour.js
  var TOUR_STORAGE_KEY = "luban_admin_tour_completed";
  var TOUR_STEPS = [
    {
      title: "Welcome to the Admin Dashboard \u{1F44B}",
      description: "This quick tour will walk you through every section of your admin panel. You can skip at any time or click Next to continue.",
      target: null
    },
    {
      title: "Menu Manager",
      description: "Toggle the visibility of individual dishes on the main website. Turn items on or off so customers only see what is available today.",
      target: "tab-btn-menu"
    },
    {
      title: "Reservations",
      description: "View all table reservation requests from customers. Approve or decline reservations and keep track of upcoming bookings.",
      target: "tab-btn-reservations"
    },
    {
      title: "Orders",
      description: "Monitor incoming online orders in real time. See order details, totals, and update order statuses as they are prepared.",
      target: "tab-btn-orders"
    },
    {
      title: "Promotions & Deals",
      description: "Add offers and toggle whether customers can see them on their profile page.",
      target: "tab-btn-promotions"
    },
    {
      title: "Admin Users",
      description: "Grant or revoke admin dashboard access for other staff members. Use this section to manage who can log into this panel.",
      target: "tab-btn-admin-users"
    },
    {
      title: "Messages & AI",
      description: "Review contact messages, assistant-drafted reports, and the original customer wording when a report was rewritten.",
      target: "tab-btn-messages"
    },
    {
      title: "Chatbot Facts",
      description: "Create, edit, and archive the Firestore facts used by the public chatbot.",
      target: "tab-btn-chatbot-knowledge"
    }
  ];
  var tourCurrentStep = 0;
  var tourPreviousFocus = null;
  function startTour() {
    if (localStorage.getItem(TOUR_STORAGE_KEY)) return;
    tourCurrentStep = 0;
    tourPreviousFocus = document.activeElement;
    renderTourStep();
    const overlay = document.getElementById("tour-overlay");
    overlay.classList.remove("hidden");
    document.getElementById("tour-next-btn").focus();
  }
  function renderTourStep() {
    const step = TOUR_STEPS[tourCurrentStep];
    const total = TOUR_STEPS.length;
    document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    if (step.target) {
      const targetEl = document.getElementById(step.target);
      if (targetEl) targetEl.classList.add("tour-highlight");
    }
    document.getElementById("tour-title").textContent = step.title;
    document.getElementById("tour-description").textContent = step.description;
    document.getElementById("tour-step-counter").textContent = tourCurrentStep + 1 + " of " + total;
    const dotsEl = document.getElementById("tour-dots");
    dotsEl.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const dot = document.createElement("span");
      dot.className = "inline-block w-2 h-2 rounded-full " + (i === tourCurrentStep ? "bg-red-700" : "bg-stone-300");
      dotsEl.appendChild(dot);
    }
    const nextBtn = document.getElementById("tour-next-btn");
    nextBtn.textContent = tourCurrentStep === total - 1 ? "Get Started" : "Next \u2192";
    nextBtn.focus();
  }
  function tourNext() {
    const current = TOUR_STEPS[tourCurrentStep];
    if (current.target) {
      const el = document.getElementById(current.target);
      if (el) el.classList.remove("tour-highlight");
    }
    if (tourCurrentStep < TOUR_STEPS.length - 1) {
      tourCurrentStep++;
      renderTourStep();
    } else {
      closeTour();
    }
  }
  function closeTour() {
    document.querySelectorAll(".tour-highlight").forEach((el) => el.classList.remove("tour-highlight"));
    document.getElementById("tour-overlay").classList.add("hidden");
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    if (tourPreviousFocus && tourPreviousFocus.focus) {
      tourPreviousFocus.focus();
    }
  }
  window.startTour = startTour;
  window.tourNext = tourNext;
  window.closeTour = closeTour;
})();
