'use strict';

const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';
const DEFAULT_TIMEOUT_MS = 30000;

let authClientPromise = null;

function normalizeLocation(location) {
  return String(location || 'global').trim().toLowerCase() || 'global';
}

function resolveAgentPlatformEndpoint(location) {
  const normalized = normalizeLocation(location);
  if (normalized === 'global') return 'https://aiplatform.googleapis.com';
  return `https://${normalized}-aiplatform.googleapis.com`;
}

function buildGenerateContentUrl({ projectId, location, model }) {
  const cleanProjectId = String(projectId || '').trim();
  const cleanModel = String(model || '').trim();
  const cleanLocation = normalizeLocation(location);

  if (!cleanProjectId) throw new Error('Missing Google Cloud project id for Agent Platform.');
  if (!cleanModel) throw new Error('Missing Gemini model id for Agent Platform.');

  const endpoint = resolveAgentPlatformEndpoint(cleanLocation);
  return `${endpoint}/v1/projects/${encodeURIComponent(cleanProjectId)}/locations/${encodeURIComponent(cleanLocation)}/publishers/google/models/${encodeURIComponent(cleanModel)}:generateContent`;
}

function buildGenerateContentPayload({
  prompt,
  systemInstruction,
  maxOutputTokens = 520,
  temperature = 0.25,
  topP = 0.9,
  responseMimeType,
  labels
}) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: String(prompt || '') }]
      }
    ],
    generationConfig: {
      maxOutputTokens,
      temperature,
      topP
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: String(systemInstruction) }]
    };
  }

  if (responseMimeType) {
    payload.generationConfig.responseMimeType = responseMimeType;
  }

  if (labels && typeof labels === 'object') {
    payload.labels = Object.fromEntries(
      Object.entries(labels)
        .map(([key, value]) => [
          String(key).toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 63),
          String(value).toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 63)
        ])
        .filter(([key, value]) => key && value)
    );
  }

  return payload;
}

function extractGeneratedText(data) {
  const candidate = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
  const parts = candidate && candidate.content && Array.isArray(candidate.content.parts)
    ? candidate.content.parts
    : [];
  return parts
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .filter(Boolean)
    .join('\n')
    .trim();
}

function createAgentPlatformError(error) {
  const status = error && error.response ? error.response.status : null;
  const data = error && error.response ? error.response.data : null;
  const apiMessage = data && data.error && typeof data.error.message === 'string'
    ? data.error.message
    : '';
  const fallbackMessage = error && error.message ? error.message : 'request failed';
  const message = apiMessage || fallbackMessage;
  const wrapped = new Error(`Agent Platform request failed${status ? ` (${status})` : ''}: ${message}`);
  if (status) wrapped.status = status;
  return wrapped;
}

async function getAuthClient() {
  if (!authClientPromise) {
    const auth = new GoogleAuth({ scopes: [CLOUD_PLATFORM_SCOPE] });
    authClientPromise = auth.getClient();
  }
  return authClientPromise;
}

async function getAccessToken() {
  const client = await getAuthClient();
  const accessToken = await client.getAccessToken();
  const token = typeof accessToken === 'string' ? accessToken : accessToken && accessToken.token;
  if (!token) throw new Error('Could not obtain a Google Cloud access token.');
  return token;
}

async function generateAgentPlatformText(options) {
  const url = buildGenerateContentUrl(options);
  const payload = buildGenerateContentPayload(options);
  const token = await getAccessToken();
  let response;
  try {
    response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: Number(options.timeoutMs || DEFAULT_TIMEOUT_MS)
    });
  } catch (error) {
    throw createAgentPlatformError(error);
  }

  const text = extractGeneratedText(response.data);
  if (!text) throw new Error('Agent Platform returned an empty response.');

  return {
    text,
    modelVersion: response.data && response.data.modelVersion ? response.data.modelVersion : '',
    usageMetadata: response.data && response.data.usageMetadata ? response.data.usageMetadata : null
  };
}

module.exports = {
  buildGenerateContentPayload,
  buildGenerateContentUrl,
  createAgentPlatformError,
  extractGeneratedText,
  generateAgentPlatformText,
  normalizeLocation,
  resolveAgentPlatformEndpoint
};
