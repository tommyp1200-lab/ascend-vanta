(() => {
  const root = document.documentElement;
  let emergencyTimer = 0;

  const unlock = (reason) => {
    if (root.dataset.ascendBoot === "complete") return;
    root.dataset.ascendBoot = "emergency";
    root.dataset.ascendBootReason = reason;
    const shell = document.querySelector("[data-ascend-app]");
    const loader = document.querySelector("[data-ascend-preloader]");
    shell?.setAttribute("aria-busy", "false");
    loader?.setAttribute("aria-hidden", "true");
    window.dispatchEvent(
      new CustomEvent("ascend:boot-emergency", {
        detail: { reason },
      }),
    );
  };

  const scheduleEmergencyRelease = () => {
    window.clearTimeout(emergencyTimer);
    emergencyTimer = window.setTimeout(() => unlock("bootstrap-timeout"), 4_250);
  };

  window.addEventListener("ascend:boot-complete", () => {
    window.clearTimeout(emergencyTimer);
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      window.clearTimeout(emergencyTimer);
      root.dataset.ascendBoot = "complete";
      root.dataset.ascendBootReason = "bfcache";
      document.querySelector("[data-ascend-app]")?.setAttribute("aria-busy", "false");
      document.querySelector("[data-ascend-preloader]")?.setAttribute("aria-hidden", "true");
      return;
    }
    scheduleEmergencyRelease();
  });

  scheduleEmergencyRelease();
})();
