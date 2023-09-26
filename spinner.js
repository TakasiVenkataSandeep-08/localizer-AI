/**
 * Creates a custom text-based spinner.
 * @returns {Object} A spinner object with start(), setLocaleStatus(), render(), and stopAndPersist() methods.
 */
function createSpinner() {
  let interval;
  let frame = 0;
  const frames = ["-", "\\", "|", "/"];
  const localeStatus = {};

  return {
    start: function () {
      interval = setInterval(() => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(frames[frame]);
        frame = (frame + 1) % frames.length;
      }, 100);
    },
    setLocaleStatus: function (locale, status) {
      localeStatus[locale] = status;
    },
    render: function () {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      const statusLines = Object.entries(localeStatus)
        .map(([locale, status]) => `${locale}: ${status}`)
        .join(" | ");
      process.stdout.write(statusLines);
    },
    stopAndPersist: function () {
      clearInterval(interval);
      this.render();
      process.stdout.write("\n");
    },
  };
}

module.exports = { createSpinner };
