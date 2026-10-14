function logger(req, res, next) {
  const start = Date.now();

  // The status code is only known after the response is sent, so log on 'finish'.
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });

  next();
}

export default logger;
