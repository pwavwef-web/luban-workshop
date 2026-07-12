'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const {
  buildGenerateContentPayload,
  buildGenerateContentUrl,
  createAgentPlatformError,
  extractGeneratedText,
  resolveAgentPlatformEndpoint
} = require(path.join(ROOT, 'functions', 'agent-platform.js'));

test('Agent Platform helper uses the global endpoint for global location', () => {
  assert.equal(resolveAgentPlatformEndpoint('global'), 'https://aiplatform.googleapis.com');
  assert.equal(
    buildGenerateContentUrl({
      projectId: 'luban-workshop-restaurant',
      location: 'global',
      model: 'gemini-3.1-flash-lite'
    }),
    'https://aiplatform.googleapis.com/v1/projects/luban-workshop-restaurant/locations/global/publishers/google/models/gemini-3.1-flash-lite:generateContent'
  );
});

test('Agent Platform helper uses regional endpoints outside global location', () => {
  assert.equal(
    resolveAgentPlatformEndpoint('us-central1'),
    'https://us-central1-aiplatform.googleapis.com'
  );
});

test('Agent Platform payload includes prompt, system instruction, generation config, and labels', () => {
  const payload = buildGenerateContentPayload({
    prompt: 'Where are you located?',
    systemInstruction: 'Answer as Bao.',
    maxOutputTokens: 300,
    temperature: 0.1,
    responseMimeType: 'application/json',
    labels: {
      App: 'Luban Assistant',
      mode: 'report-draft'
    }
  });

  assert.deepEqual(payload.contents, [
    {
      role: 'user',
      parts: [{ text: 'Where are you located?' }]
    }
  ]);
  assert.deepEqual(payload.systemInstruction, {
    parts: [{ text: 'Answer as Bao.' }]
  });
  assert.equal(payload.generationConfig.maxOutputTokens, 300);
  assert.equal(payload.generationConfig.temperature, 0.1);
  assert.equal(payload.generationConfig.responseMimeType, 'application/json');
  assert.deepEqual(payload.labels, {
    app: 'luban_assistant',
    mode: 'report-draft'
  });
});

test('Agent Platform helper extracts text parts from the first candidate', () => {
  const text = extractGeneratedText({
    candidates: [
      {
        content: {
          parts: [
            { text: 'First line.' },
            { text: 'Second line.' }
          ]
        }
      }
    ]
  });

  assert.equal(text, 'First line.\nSecond line.');
});

test('Agent Platform helper wraps API errors with status and message', () => {
  const error = createAgentPlatformError({
    response: {
      status: 403,
      data: {
        error: {
          message: 'Permission denied'
        }
      }
    }
  });

  assert.equal(error.message, 'Agent Platform request failed (403): Permission denied');
  assert.equal(error.status, 403);
});
