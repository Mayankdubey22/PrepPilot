const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const protect = require("./auth.middleware");
const { SESSION_COOKIE } = protect;

const makeResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const makeRequest = ({ method = "GET", cookie = "", origin = "", requestedWith = "" } = {}) => ({
  method,
  headers: cookie ? { cookie } : {},
  get(name) {
    if (name.toLowerCase() === "origin") return origin;
    if (name.toLowerCase() === "x-requested-with") return requestedWith;
    return undefined;
  },
});

test("cookie session authentication and CSRF checks", async (t) => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret";
  t.after(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  await t.test("rejects requests with no session cookie", () => {
    const response = makeResponse();
    let calledNext = false;

    protect(makeRequest(), response, () => { calledNext = true; });

    assert.equal(response.statusCode, 401);
    assert.equal(calledNext, false);
  });

  await t.test("rejects cookie-authenticated mutations without trusted origin", () => {
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET);
    const response = makeResponse();
    let calledNext = false;

    protect(
      makeRequest({
        method: "PATCH",
        cookie: `${SESSION_COOKIE}=${token}`,
        origin: "https://untrusted.example",
        requestedWith: "XMLHttpRequest",
      }),
      response,
      () => { calledNext = true; }
    );

    assert.equal(response.statusCode, 403);
    assert.equal(calledNext, false);
  });

  await t.test("accepts a session cookie with trusted origin and CSRF header", () => {
    const token = jwt.sign({ userId: "user-123" }, process.env.JWT_SECRET);
    const response = makeResponse();
    let calledNext = false;

    protect(
      makeRequest({
        method: "PATCH",
        cookie: `${SESSION_COOKIE}=${token}`,
        origin: "http://localhost:5173",
        requestedWith: "XMLHttpRequest",
      }),
      response,
      () => { calledNext = true; }
    );

    assert.equal(response.statusCode, 200);
    assert.equal(calledNext, true);
  });
});
