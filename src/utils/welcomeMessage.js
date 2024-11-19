/**
 * Displays a welcome message to the user in the console.
 * The message includes an ASCII art logo for Localizer AI and
 * a link to the npm package documentation.
 *
 * @function displayWelcomeMessage
 * @returns {void}
 *
 * @example
 * displayWelcomeMessage();
 */
function displayWelcomeMessage() {
  console.log(
    "\n--------------------------------------------------------------------"
  );
  console.log(
    [
      "  _                         _  _                             _____",
      " | |                       | |(_)                     /\\    |_   _|",
      " | |      ___    ___  __ _ | | _  ____ ___  _ __     /  \\     | |",
      " | |     / _ \\  / __|/ _` || || ||_  // _ \\| '__|   / /\\ \\    | |",
      " | |____| (_) || (__| (_| || || | / /|  __/| |     / ____ \\  _| |_",
      " |______|\\___/  \\___|\\__,_||_||_|/___|\\___/|_|    /_/    \\_\\|_____|",
    ].join("\n")
  );
  console.log(
    "\n--------------------------------------------------------------------"
  );
  console.log("\n\nWelcome to Localizer AI!\n");
  console.log("Explore more at https://www.npmjs.com/package/localizer-ai\n");
}

module.exports = { displayWelcomeMessage };
