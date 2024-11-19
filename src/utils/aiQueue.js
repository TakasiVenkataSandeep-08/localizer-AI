/**
 * Queue implementation for rate-limited AI requests
 */
class AIRequestQueue {
  constructor(delayMs = 2500) {
    this.queue = [];
    this.isProcessing = false;
    this.delayMs = delayMs;
    this.lastExecutionTime = 0;
    this.lastExecutionStartTime = 0;
  }

  /**
   * Add a request to the queue
   * @param {Function} askAIFn - The AI service function to call
   * @param {Object} params - Parameters for the AI request
   * @returns {Promise} Promise that resolves with the AI response
   */
  enqueue(askAIFn, params) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        task: () => askAIFn(params),
        resolve,
        reject,
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue with rate limiting
   */
  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const { task, resolve, reject } = this.queue.shift();

    try {
      // Calculate delay needed since last request
      const previousExecutionTime = this.lastExecutionTime;
      this.lastExecutionTime = Date.now() - this.lastExecutionStartTime;
      this.lastExecutionStartTime = Date.now();
      const getBuffer = () => {
        if (this.lastExecutionTime > this.delayMs) {
          const remainder = this.lastExecutionTime % this.delayMs;
          return this.delayMs - remainder;
        } else {
          const difference = this.delayMs - this.lastExecutionTime;
          return difference;
        }
      };

      const delayNeeded = previousExecutionTime ? Math.max(0, getBuffer()) : 0;

      if (delayNeeded > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayNeeded));
      }
      const result = await task();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    // Process next item after delay
    setTimeout(() => this.processQueue(), this.delayMs);
  }

  /**
   * Get current queue length
   * @returns {number} Number of pending requests
   */
  get length() {
    return this.queue.length;
  }

  /**
   * Clear the queue
   */
  clear() {
    this.queue = [];
    this.isProcessing = false;
  }
}

// Create singleton instance
const aiQueue = new AIRequestQueue();

/**
 * Wrapper function for rate-limited AI requests
 * @param {Function} askAIFn - The AI service function to call
 * @param {Object} params - Request parameters
 * @returns {Promise} Promise that resolves with the AI response
 */
const queuedAskAI = (askAIFn, params) => {
  return aiQueue.enqueue(askAIFn, params);
};

module.exports = { queuedAskAI };
