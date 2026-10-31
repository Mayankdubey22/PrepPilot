const test = require("node:test");
const assert = require("node:assert/strict");
const RateLimitCounter = require("../models/rateLimitCounter.model");
const { createRateLimiter } = require("./rateLimit.middleware");

const makeResponse = () => ({
  statusCode: 200,
  headers: {},
  body: null,
  set(name, value) {
    this.headers[name] = value;
    return this;
  },
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("rate limiter enforces a fixed-window request limit", async (t) => {
  const originalFindOneAndUpdate = RateLimitCounter.findOneAndUpdate;
  const counters = new Map();
  RateLimitCounter.findOneAndUpdate = async (filter) => {
    const hits = (counters.get(filter.key) || 0) + 1;
    counters.set(filter.key, hits);
    return { hits };
  };
  t.after(() => {
    RateLimitCounter.findOneAndUpdate = originalFindOneAndUpdate;
  });

  const limiter = createRateLimiter({
    scope: "unit-test",
    limit: 2,
    windowMs: 60_000,
  });

  for (let request = 1; request <= 2; request += 1) {
    const response = makeResponse();
    let calledNext = false;
    await limiter({ ip: "192.0.2.5" }, response, () => { calledNext = true; });
    assert.equal(response.statusCode, 200);
    assert.equal(calledNext, true);
  }

  const response = makeResponse();
  let calledNext = false;
  await limiter({ ip: "192.0.2.5" }, response, () => { calledNext = true; });

  assert.equal(response.statusCode, 429);
  assert.equal(calledNext, false);
  assert.ok(Number(response.headers["Retry-After"]) > 0);
});

test("rate limiter fails closed if its counter store is unavailable", async (t) => {
  const originalFindOneAndUpdate = RateLimitCounter.findOneAndUpdate;
  RateLimitCounter.findOneAndUpdate = async () => {
    throw new Error("database unavailable");
  };
  t.after(() => {
    RateLimitCounter.findOneAndUpdate = originalFindOneAndUpdate;
  });

  const limiter = createRateLimiter({
    scope: "unit-test-failure",
    limit: 2,
    windowMs: 60_000,
  });
  const response = makeResponse();
  let calledNext = false;

  await limiter({ ip: "192.0.2.6" }, response, () => { calledNext = true; });

  assert.equal(response.statusCode, 503);
  assert.equal(calledNext, false);
});
