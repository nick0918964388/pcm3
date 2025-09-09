import '@testing-library/jest-dom'

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}

  disconnect() {
    return null
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}

  disconnect() {
    return null
  }

  observe() {
    return null
  }

  unobserve() {
    return null
  }
}