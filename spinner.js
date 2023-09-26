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
    start() {
      interval = setInterval(() => {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);
        process.stdout.write(frames[frame]);
        frame = (frame + 1) % frames.length;
      }, 100);
    },
    setLocaleStatus(locale, status) {
      localeStatus[locale] = status;
    },
    render() {
      process.stdout.clearLine();
      process.stdout.cursorTo(0);
      process.stdout.write("Translation status:\n");
      const statusLines = Object.entries(localeStatus)
        .map(([locale, status]) => `${locale}: ${status}`)
        .join(" | ");
      process.stdout.write(statusLines);
    },
    stopAndPersist() {
      clearInterval(interval);
      this.render();
      process.stdout.write("\n");
      process.exit();
    },
  };
}

module.exports = { createSpinner };
