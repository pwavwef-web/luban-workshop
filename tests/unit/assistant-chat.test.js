'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

function cloudFunctionStub(_options, handler) {
  return handler || _options;
}

function defineStringStub(_name, options = {}) {
  return {
    value() {
      return options.default || '';
    }
  };
}

function defineSecretStub(name) {
  return {
    value() {
      return process.env[name] || '';
    }
  };
}

function createFirebaseAdminStub() {
  const app = { options: { projectId: 'unit-project' } };
  return {
    apps: [app],
    initializeApp() {
      return app;
    },
    app() {
      return app;
    },
    firestore() {
      return {
        FieldValue: {
          serverTimestamp: () => new Date('2026-07-08T00:00:00.000Z'),
          delete: () => ({ delete: true }),
          increment: (value) => ({ increment: value })
        }
      };
    },
    auth() {
      return {};
    }
  };
}

function loadSecureApiInternals({ agentPlatform, logger = { info() {}, warn() {}, error() {} } } = {}) {
  const filePath = path.join(ROOT, 'functions', 'secure-api.js');
  const source = fs.readFileSync(filePath, 'utf8');
  const firebaseAdmin = createFirebaseAdminStub();
  const module = { exports: {} };
  const sandbox = {
    Buffer,
    console,
    exports: module.exports,
    module,
    process,
    require(request) {
      if (request === 'firebase-admin') return firebaseAdmin;
      if (request === 'firebase-functions/v2/firestore') {
        return {
          onDocumentCreated: cloudFunctionStub,
          onDocumentUpdated: cloudFunctionStub
        };
      }
      if (request === 'firebase-functions/v2/https') {
        return { onRequest: cloudFunctionStub };
      }
      if (request === 'firebase-functions/params') {
        return { defineString: defineStringStub, defineSecret: defineSecretStub };
      }
      if (request === 'firebase-functions/logger') return logger;
      if (request === 'axios') return {};
      if (request === 'nodemailer') {
        return { createTransport: () => ({ sendMail: async () => {} }) };
      }
      if (request === './agent-platform') {
        return {
          generateAgentPlatformText: agentPlatform || (async () => ({ text: 'ok' }))
        };
      }
      if (request === './business-hours') {
        return require(path.join(ROOT, 'functions', 'business-hours.js'));
      }
      if (request === './menu-catalog') {
        return require(path.join(ROOT, 'functions', 'menu-catalog.js'));
      }
      if (request === './order-pricing') {
        return require(path.join(ROOT, 'functions', 'order-pricing.js'));
      }
      return require(request);
    },
    URL
  };
  const exportSource = '\nmodule.exports.__test__ = { generateAssistantText };\n';
  vm.runInNewContext(source + exportSource, sandbox, { filename: filePath });
  return module.exports.__test__;
}

test('assistant generation calls Agent Platform through the server helper', async () => {
  let capturedOptions = null;
  const { generateAssistantText } = loadSecureApiInternals({
    agentPlatform: async (options) => {
      capturedOptions = options;
      return {
        text: 'GHS 40\n\n\nReady.',
        modelVersion: 'test-model',
        usageMetadata: { totalTokenCount: 12 }
      };
    }
  });

  const result = await generateAssistantText({
    prompt: 'How much is soup?',
    mode: 'guest',
    maxOutputTokens: 600,
    temperature: 0.2,
    responseMimeType: 'application/json'
  });

  assert.equal(capturedOptions.projectId, 'unit-project');
  assert.equal(capturedOptions.location, 'global');
  assert.equal(capturedOptions.model, 'gemini-3.1-flash-lite');
  assert.equal(capturedOptions.labels.app, 'luban_assistant');
  assert.equal(capturedOptions.labels.mode, 'guest');
  assert.equal(capturedOptions.responseMimeType, 'application/json');
  assert.equal(result.answer, '\u20b540\n\nReady.');
  assert.equal(result.modelVersion, 'test-model');
  assert.deepEqual(result.usageMetadata, { totalTokenCount: 12 });
});

test('assistant generation hides Agent Platform failure details from clients', async () => {
  const logged = [];
  const { generateAssistantText } = loadSecureApiInternals({
    logger: {
      info() {},
      warn() {},
      error(message, details) {
        logged.push({ message, details });
      }
    },
    agentPlatform: async () => {
      const error = new Error('Agent Platform request failed (403): Permission denied');
      error.status = 403;
      throw error;
    }
  });

  await assert.rejects(
    () => generateAssistantText({ prompt: 'Hello', mode: 'guest' }),
    (error) => {
      assert.equal(error.status, 502);
      assert.equal(error.message, 'Bao could not answer right now. Please try again shortly.');
      return true;
    }
  );

  assert.equal(logged.length, 1);
  assert.equal(logged[0].message, 'Assistant model generation failed');
  assert.equal(logged[0].details.status, 403);
});
