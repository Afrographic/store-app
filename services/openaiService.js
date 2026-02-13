'use strict';

const OpenAI = require('openai');
const SettingsService = require('./settingsService');

// Cache for OpenAI clients per company (to avoid recreating clients)
const openaiClients = new Map();

/**
 * OpenAI Service
 * Provides reusable OpenAI client initialization and management
 * Can be used by any AI-powered feature (forecasting, reports, analytics, etc.)
 */

/**
 * Get or create OpenAI client for a specific company
 * @param {number} companyId - Company ID
 * @returns {Promise<OpenAI>} OpenAI client instance
 */
const getOpenAIClient = async (companyId) => {
  try {
    // Check cache first
    if (openaiClients.has(companyId)) {
      return openaiClients.get(companyId);
    }

    // Fetch API key from settings
    const setting = await SettingsService.getSetting(companyId, 'open_ai_api_key');

    if (!setting || !setting.setting_value) {
      throw new Error(`OpenAI API key not found in settings for company ${companyId}. Please configure the 'open_ai_api_key' setting.`);
    }

    const apiKey = setting.setting_value.trim();
    
    if (!apiKey) {
      throw new Error(`OpenAI API key is empty in settings for company ${companyId}. Please configure a valid API key.`);
    }

    // Create and cache OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey
    });

    openaiClients.set(companyId, openai);
    return openai;
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('empty')) {
      throw error;
    }
    throw new Error(`Failed to initialize OpenAI client: ${error.message}`);
  }
};

/**
 * Clear cached OpenAI client for a company (useful when API key is updated)
 * @param {number} companyId - Company ID (optional, if not provided clears all)
 */
const clearOpenAIClientCache = (companyId = null) => {
  if (companyId) {
    openaiClients.delete(companyId);
  } else {
    openaiClients.clear();
  }
};

/**
 * Make a chat completion request to OpenAI
 * @param {number} companyId - Company ID
 * @param {Object} params - OpenAI chat completion parameters
 * @param {string} params.model - Model to use (default: 'gpt-4o-mini')
 * @param {Array} params.messages - Array of message objects
 * @param {number} params.temperature - Temperature (default: 0.7)
 * @param {string} params.response_format - Response format ('json_object' or null)
 * @returns {Promise<Object>} OpenAI completion response
 */
const chatCompletion = async (companyId, params = {}) => {
  try {
    const openai = await getOpenAIClient(companyId);

    const {
      model = process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages = [],
      temperature = 0.7,
      response_format = null,
      ...otherParams
    } = params;

    const requestParams = {
      model,
      messages,
      temperature,
      ...otherParams
    };

    if (response_format) {
      requestParams.response_format = { type: response_format };
    }

    const completion = await openai.chat.completions.create(requestParams);

    return completion;
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('empty')) {
      throw error;
    }
    throw new Error(`OpenAI API request failed: ${error.message}`);
  }
};

/**
 * Get the default model for OpenAI requests
 * @returns {string} Default model name
 */
const getDefaultModel = () => {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
};

/**
 * Check if OpenAI is configured for a company
 * @param {number} companyId - Company ID
 * @returns {Promise<boolean>} True if API key is configured
 */
const isConfigured = async (companyId) => {
  try {
    const setting = await SettingsService.getSetting(companyId, 'open_ai_api_key');
    return !!(setting && setting.setting_value && setting.setting_value.trim());
  } catch (error) {
    return false;
  }
};

module.exports = {
  getOpenAIClient,
  clearOpenAIClientCache,
  chatCompletion,
  getDefaultModel,
  isConfigured
};
