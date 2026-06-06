const js = require('@eslint/js');
const globals = require('globals');

const browserGlobals = {
  ...globals.browser,
  ...globals.serviceworker,
  firebase: 'readonly',
  escapeHtml: 'readonly',
  fetchAdminApi: 'readonly',
  formatCurrency: 'readonly',
  getFirestoreDate: 'readonly',
  html2canvas: 'readonly',
  initLubanFirebase: 'readonly',
  lucide: 'readonly',
  lubanClient: 'readonly',
  QRCode: 'readonly',
  setMetricText: 'readonly',
  setMetricValue: 'readonly',
  showAdminNotification: 'readonly',
  truncateText: 'readonly'
};

module.exports = [
  {
    ignores: [
      '.firebase/**',
      'node_modules/**',
      'tmp/**',
      'coverage/**',
      'dist/**',
      'build/**',
      'assets/js/*.bundle.js',
      'admin-inline.js',
      'tailwind.css'
    ]
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: browserGlobals
    },
    rules: {
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-prototype-builtins': 'warn',
      'no-undef': 'warn',
      'no-useless-assignment': 'warn',
      'no-useless-escape': 'warn',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
          varsIgnorePattern: '^_'
        }
      ]
    }
  },
  {
    files: ['src/**/*.js', 'assets/js/firebase-ai-chatbot.js'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  {
    files: [
      'eslint.config.js',
      'playwright.config.js',
      'tailwind.config.js',
      'functions/**/*.js',
      'luabn/**/*.js',
      'tests/**/*.js',
      'tools/**/*.js'
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...browserGlobals,
        ...globals.node
      }
    }
  }
];
