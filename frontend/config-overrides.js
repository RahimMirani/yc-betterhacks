module.exports = function override(config) {
  // Fix for pdfjs-dist canvas module (not needed in browser)
  config.resolve.fallback = {
    ...config.resolve.fallback,
    canvas: false,
  };
  return config;
};
