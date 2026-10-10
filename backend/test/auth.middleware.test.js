
import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/auth/auth.middleware.js';

function createResponse() {
  return {
    statusCode: 200,
    body: null,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      return this;
    }
  };
}

test('returns 401 when no user is attached', () => {
  const req = {};
  const res = createResponse();
  let nextCalled = false;

  requireRole('creator')(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('returns 403 when a student tries a creator-only action', () => {
  const req = { user: { id: 1, role: 'student' } };
  const res = createResponse();
  let nextCalled = false;

  requireRole('creator')(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test('allows a creator to perform a creator-only action', () => {
  const req = { user: { id: 2, role: 'creator' } };
  const res = createResponse();
  let nextCalled = false;

  requireRole('creator')(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, 200);
});