/**
 * FoundryVTT Environment Shim for Testing
 * 
 * Provides minimal stubs of FoundryVTT global objects and APIs required for unit testing.
 * This will be expanded in later stages as more sophisticated testing is implemented.
 * 
 * Note: This is designed for Stage 1 bootstrap only. More comprehensive mocking
 * will be added as the test suite grows to cover sheet classes, rolls, etc.
 * 
 * @author Avant VTT Team
 * @version 1.0.0
 * @since 0.1.2
 */

// Basic foundry namespace
global.foundry = {
  utils: {
    mergeObject: (original, other = {}, options = {}) => ({ ...original, ...other }),
    getProperty: (object, key) => key.split('.').reduce((o, k) => o?.[k], object),
    setProperty: (object, key, value) => {
      const keys = key.split('.');
      const last = keys.pop();
      const target = keys.reduce((o, k) => o[k] = o[k] || {}, object);
      target[last] = value;
      return object;
    }
  }
};

// Basic CONFIG object
global.CONFIG = {
  AVANT: {
    systemName: 'avant-native',
    version: '0.1.2'
  }
};

// Basic game object stub
global.game = {
  system: {
    id: 'avant-native',
    version: '0.1.2'
  },
  settings: {
    get: () => undefined,
    set: () => undefined
  }
};

// Basic document classes for future use
global.Actor = class MockActor {
  constructor(data) {
    this.data = data;
    this.system = data?.system || {};
  }
};

global.Item = class MockItem {
  constructor(data) {
    this.data = data;
    this.system = data?.system || {};
  }
};

// Basic sheet classes for future use  
global.ActorSheet = class MockActorSheet {
  constructor() {}
  static get defaultOptions() {
    return {};
  }
};

global.ItemSheet = class MockItemSheet {
  constructor() {}
  static get defaultOptions() {
    return {};
  }
};

// Roll class stub for future roll testing
global.Roll = class MockRoll {
  constructor(formula, data = {}) {
    this.formula = formula;
    this.data = data;
    this.total = 10; // Default mock result
  }
  
  async roll() {
    return this;
  }
  
  toMessage() {
    return Promise.resolve({});
  }
};

// ChatMessage stub for future chat testing
global.ChatMessage = class MockChatMessage {
  static getSpeaker() {
    return { alias: 'Test Actor' };
  }
}; 