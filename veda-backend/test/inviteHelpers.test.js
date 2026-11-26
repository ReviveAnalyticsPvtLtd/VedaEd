const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildAcceptUrl,
  resolveFrontendBaseUrl,
  isProductionContext,
  isLocalhostUrl,
} = require("../src/modules/superadminIdentity/inviteHelpers");

const ENV_KEYS = [
  "FRONTEND_URL",
  "PRODUCTION_FRONTEND_URL",
  "NODE_ENV",
  "VERCEL",
  "VERCEL_ENV",
  "RENDER",
  "RAILWAY_ENVIRONMENT",
  "RAILWAY_ENVIRONMENT_NAME",
  "RAILWAY_PROJECT_ID",
  "RAILWAY_PUBLIC_DOMAIN",
];

const withEnv = (overrides, fn) => {
  const snapshot = {};
  for (const key of ENV_KEYS) {
    snapshot[key] = process.env[key];
    delete process.env[key];
  }
  Object.assign(process.env, overrides);
  try {
    return fn();
  } finally {
    for (const key of ENV_KEYS) {
      if (snapshot[key] === undefined) delete process.env[key];
      else process.env[key] = snapshot[key];
    }
  }
};

test("local development keeps http://localhost:3000 when FRONTEND_URL is localhost", () => {
  withEnv({ FRONTEND_URL: "http://localhost:3000", NODE_ENV: "development" }, () => {
    const req = { headers: { host: "localhost:5000", origin: "http://localhost:3000" } };
    assert.equal(isProductionContext(req), false);
    assert.equal(
      buildAcceptUrl("abc123", req),
      "http://localhost:3000/accept-invitation?token=abc123"
    );
  });
});

test("local development falls back to http://localhost:3000 when FRONTEND_URL is unset", () => {
  withEnv({}, () => {
    const req = { headers: { host: "localhost:5000" } };
    assert.equal(resolveFrontendBaseUrl(req), "http://localhost:3000");
    assert.equal(
      buildAcceptUrl("tok_local", req),
      "http://localhost:3000/accept-invitation?token=tok_local"
    );
  });
});

test("production uses FRONTEND_URL when configured to https://veda-ed.vercel.app", () => {
  withEnv({ FRONTEND_URL: "https://veda-ed.vercel.app/", NODE_ENV: "production" }, () => {
    assert.equal(
      buildAcceptUrl("2708712f0bb4371fd42672379b5762e66ac75fd623c66fd19201e0f27c612f79"),
      "https://veda-ed.vercel.app/accept-invitation?token=2708712f0bb4371fd42672379b5762e66ac75fd623c66fd19201e0f27c612f79"
    );
  });
});

test("production never falls back to localhost when FRONTEND_URL is missing", () => {
  withEnv({ NODE_ENV: "production" }, () => {
    assert.equal(isProductionContext(), true);
    assert.equal(
      buildAcceptUrl("prod_token_1"),
      "https://veda-ed.vercel.app/accept-invitation?token=prod_token_1"
    );
  });
});

test("production ignores accidental localhost FRONTEND_URL and uses production domain", () => {
  withEnv({ FRONTEND_URL: "http://localhost:3000", RAILWAY_ENVIRONMENT: "production" }, () => {
    assert.equal(isLocalhostUrl(process.env.FRONTEND_URL), true);
    assert.equal(
      buildAcceptUrl("prod_token_2"),
      "https://veda-ed.vercel.app/accept-invitation?token=prod_token_2"
    );
  });
});

test("non-localhost request origin or host resolves to production URL even without NODE_ENV", () => {
  withEnv({ FRONTEND_URL: "http://localhost:3000" }, () => {
    const reqFromVercel = {
      headers: {
        origin: "https://veda-ed.vercel.app",
        host: "vedaed-production.up.railway.app",
      },
    };
    assert.equal(isProductionContext(reqFromVercel), true);
    assert.equal(
      buildAcceptUrl("dyn_token", reqFromVercel),
      "https://veda-ed.vercel.app/accept-invitation?token=dyn_token"
    );
  });
});

test("invite token is properly URL-encoded and dynamic", () => {
  withEnv({ NODE_ENV: "production" }, () => {
    assert.equal(
      buildAcceptUrl("a+b/c=d"),
      "https://veda-ed.vercel.app/accept-invitation?token=a%2Bb%2Fc%3Dd"
    );
  });
});
