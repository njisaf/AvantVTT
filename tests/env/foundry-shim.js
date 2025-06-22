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

// Add TextEncoder/TextDecoder for jsdom compatibility
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Basic foundry namespace
global.foundry = {
  abstract: {
    DataModel: class MockDataModel {
      constructor() {}
      static defineSchema() {
        return {};
      }
    }
  },
  data: {
    fields: {
      NumberField: class MockNumberField {
        constructor(options = {}) {
          Object.assign(this, options);
        }
      },
      StringField: class MockStringField {
        constructor(options = {}) {
          Object.assign(this, options);
        }
      },
      BooleanField: class MockBooleanField {
        constructor(options = {}) {
          Object.assign(this, options);
        }
      },
      HTMLField: class MockHTMLField {
        constructor(options = {}) {
          Object.assign(this, options);
        }
      },
      SchemaField: class MockSchemaField {
        constructor(fields = {}) {
          this.fields = fields;
        }
      }
    }
  },
  // v13 namespaced APIs
  applications: {
    handlebars: {
      loadTemplates: async (templates) => {
        // Mock template loading
        return Promise.resolve(templates);
      }
    }
  },
  documents: {
    collections: {
      Actors: {
        unregisterSheet: () => {},
        registerSheet: () => {}
      },
      Items: {
        unregisterSheet: () => {},
        registerSheet: () => {}
      }
    }
  },
  appv1: {
    sheets: {
      ActorSheet: class MockActorSheetV13 {
        constructor(actor, options = {}) {
          this.actor = actor;
          this.options = options;
          this._isEditable = true;
        }
        
        static get defaultOptions() {
          return {
            classes: ["sheet", "actor"],
            template: "systems/test/templates/actor-sheet.html",
            width: 600,
            height: 600,
            tabs: []
          };
        }
        
        getData() {
          return {
            actor: this.actor,
            system: this.actor?.system || {},
            data: this.actor?.system || {},
            editable: true,
            owner: true,
            limited: false,
            options: this.options,
            cssClass: "editable"
          };
        }
        
        get isEditable() {
          return this._isEditable;
        }
        
        set isEditable(value) {
          this._isEditable = value;
        }
        
        activateListeners(html) {
          // Mock implementation for testing
        }
      },
      ItemSheet: class MockItemSheetV13 {
        constructor(item, options = {}) {
          this.item = item;
          this.options = options;
        }
        
        static get defaultOptions() {
          return {
            classes: ["sheet", "item"],
            template: "systems/test/templates/item-sheet.html",
            width: 520,
            height: 480,
            tabs: []
          };
        }
        
        getData() {
          return {
            item: this.item,
            system: this.item?.system || {},
            data: this.item?.system || {},
            editable: true,
            owner: true,
            limited: false,
            options: this.options,
            cssClass: "editable"
          };
        }
        
        get isEditable() {
          return true;
        }
        
        activateListeners(html) {
          // Mock implementation for testing
        }
        
        _updateObject(event, formData) {
          if (this.item && formData) {
            const expanded = {};
            for (const [key, value] of Object.entries(formData)) {
              if (key.includes('.')) {
                const keys = key.split('.');
                let current = expanded;
                for (let i = 0; i < keys.length - 1; i++) {
                  if (!current[keys[i]]) current[keys[i]] = {};
                  current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;
              } else {
                expanded[key] = value;
              }
            }
            
            if (expanded.system) {
              Object.assign(this.item.system, expanded.system);
            }
          }
          return Promise.resolve();
        }
      }
    }
  },
  utils: {
    mergeObject: (original, other = {}, options = {}) => ({ ...original, ...other }),
    getProperty: (object, key) => key.split('.').reduce((o, k) => o?.[k], object),
    setProperty: (object, key, value) => {
      const keys = key.split('.');
      const last = keys.pop();
      const target = keys.reduce((o, k) => o[k] = o[k] || {}, object);
      target[last] = value;
      return object;
    },
    isNewerVersion: (version1, version2) => {
      // Simple version comparison for testing
      const v1Parts = version1.split('.').map(Number);
      const v2Parts = version2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
        const v1Part = v1Parts[i] || 0;
        const v2Part = v2Parts[i] || 0;
        
        if (v1Part > v2Part) return true;
        if (v1Part < v2Part) return false;
      }
      return false;
    },
    expandObject: (obj) => {
      // Simple implementation for testing
      if (!obj || typeof obj !== 'object') {
        return {};
      }
      
      const result = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.includes('.')) {
          const keys = key.split('.');
          let current = result;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
        } else {
          result[key] = value;
        }
      }
      return result;
    },
    flattenObject: (obj) => {
      // Simple implementation for testing
      if (!obj || typeof obj !== 'object') {
        return {};
      }
      
      const result = {};
      function flatten(target, prefix = '') {
        for (const [key, value] of Object.entries(target)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            flatten(value, newKey);
          } else {
            result[newKey] = value;
          }
        }
      }
      flatten(obj);
      return result;
    },
    deepClone: (obj) => {
      // Simple deep clone implementation for testing
      if (obj === null || typeof obj !== 'object') {
        return obj;
      }
      
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => global.foundry.utils.deepClone(item));
      }
      
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = global.foundry.utils.deepClone(obj[key]);
        }
      }
      return cloned;
    },
    duplicate: (obj) => {
      // Alias for deepClone
      return global.foundry.utils.deepClone(obj);
    }
  }
};

// Basic CONFIG object
global.CONFIG = {
  AVANT: {
    systemName: 'avant',
    version: '0.1.2'
  },
  Actor: {
    documentClass: undefined,
    dataModels: {}
  },
  Item: {
    documentClass: undefined,
    dataModels: {}
  }
};

// Basic game object stub
global.game = {
  system: {
    id: 'avant',
    version: '0.1.2'
  },
  settings: {
    get: (module, setting) => {
      if (module === 'core' && setting === 'rollMode') {
        return 'publicroll';
      }
      return undefined;
    },
    set: () => undefined,
    register: function(module, key, options = {}) {
      // Mock settings registration - store in a simple registry for testing
      if (!this._registry) this._registry = new Map();
      this._registry.set(`${module}.${key}`, {
        module,
        key,
        ...options
      });
      return true;
    },
    registerMenu: function(module, key, options = {}) {
      // Mock menu registration - store in a simple registry for testing
      if (!this._menuRegistry) this._menuRegistry = new Map();
      this._menuRegistry.set(`${module}.${key}`, {
        module,
        key,
        ...options
      });
      return true;
    }
  },
  i18n: {
    localize: (key) => key // Simple passthrough for testing
  }
};

// UI notifications mock
global.ui = {
  notifications: {
    info: (message) => console.log(`INFO: ${message}`),
    warn: (message) => console.warn(`WARN: ${message}`),
    error: (message) => console.error(`ERROR: ${message}`),
    notify: (message) => console.log(`NOTIFY: ${message}`)
  }
};

// Basic document classes for future use
global.Actor = class MockActor {
  constructor(data = {}) {
    this.data = data;
    this.system = data?.system || {};
    this.name = data?.name || 'Test Actor';
    this.type = data?.type || 'character';
    this._id = data?._id || 'test-actor-id';
  }
  
  toObject(source = true) {
    return {
      _id: this._id,
      name: this.name,
      type: this.type,
      system: this.system,
      data: this.data
    };
  }
  
  update(updates) {
    foundry.utils.mergeObject(this.system, updates.system || {});
    return Promise.resolve(this);
  }
};

global.Item = class MockItem {
  constructor(data = {}) {
    this.data = data;
    this.system = data?.system || {};
    this.name = data?.name || 'Test Item';
    this.type = data?.type || 'item';
    this._id = data?._id || 'test-item-id';
    this.actor = data?.actor || null;
  }
  
  toObject(source = true) {
    return {
      _id: this._id,
      name: this.name,
      type: this.type,
      system: this.system,
      data: this.data
    };
  }
  
  update(updates) {
    foundry.utils.mergeObject(this.system, updates.system || {});
    return Promise.resolve(this);
  }
  
  getRollData() {
    return {
      item: this.system,
      actor: this.actor?.system || {}
    };
  }
};

// Basic sheet classes for future use  
global.ActorSheet = class MockActorSheet {
  constructor(actor, options = {}) {
    this.actor = actor;
    this.options = options;
    this._isEditable = true;
  }
  
  static get defaultOptions() {
    return {
      classes: ["sheet", "actor"],
      template: "systems/test/templates/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: []
    };
  }
  
  getData() {
    // Mock implementation that returns basic actor data structure
    return {
      actor: this.actor,
      system: this.actor?.system || {},
      data: this.actor?.system || {},
      editable: true,
      owner: true,
      limited: false,
      options: this.options,
      cssClass: "editable"
    };
  }
  
  get isEditable() {
    return this._isEditable;
  }
  
  set isEditable(value) {
    this._isEditable = value;
  }
  
  activateListeners(html) {
    // Mock implementation for testing
  }
};

global.ItemSheet = class MockItemSheet {
  constructor(item, options = {}) {
    this.item = item;
    this.options = options;
  }
  
  static get defaultOptions() {
    return {
      classes: ["sheet", "item"],
      template: "systems/test/templates/item-sheet.html",
      width: 520,
      height: 480,
      tabs: []
    };
  }
  
  getData() {
    // Mock implementation that returns basic item data structure
    return {
      item: this.item,
      system: this.item?.system || {},
      data: this.item?.system || {},
      editable: true,
      owner: true,
      limited: false,
      options: this.options,
      cssClass: "editable"
    };
  }
  
  get isEditable() {
    return true;
  }
  
  activateListeners(html) {
    // Mock implementation for testing
  }
  
  _updateObject(event, formData) {
    // Mock implementation for testing - update the item's system data
    if (this.item && formData) {
      // Simple merge without using foundry utils to avoid dependency issues
      const expanded = {};
      for (const [key, value] of Object.entries(formData)) {
        if (key.includes('.')) {
          const keys = key.split('.');
          let current = expanded;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
        } else {
          expanded[key] = value;
        }
      }
      
      if (expanded.system) {
        Object.assign(this.item.system, expanded.system);
      }
    }
    return Promise.resolve();
  }
};

// Roll class stub for future roll testing
global.Roll = class MockRoll {
  constructor(formula, data = {}) {
    this.formula = formula;
    this.data = data;
    this.total = 10; // Default mock result
    this._evaluated = false;
    
    // Basic validation for invalid formulas
    if (!formula || typeof formula !== 'string' || formula.trim() === '') {
      throw new Error('Invalid roll formula');
    }
  }
  
  async evaluate() {
    this._evaluated = true;
    return this;
  }
  
  async roll() {
    return this.evaluate();
  }
  
  async toMessage(messageData = {}) {
    return Promise.resolve({
      content: `Rolling ${this.formula}`,
      speaker: messageData.speaker || {},
      flavor: messageData.flavor || '',
      type: 5 // CHAT_MESSAGE_TYPES.ROLL
    });
  }
  
  getRollData() {
    return this.data;
  }
};

// ChatMessage stub for future chat testing
global.ChatMessage = class MockChatMessage {
  static getSpeaker() {
    return { alias: 'Test Actor' };
  }
};

// DOM Node constants for HTML normalization testing
global.Node = {
  ELEMENT_NODE: 1,
  ATTRIBUTE_NODE: 2,
  TEXT_NODE: 3,
  CDATA_SECTION_NODE: 4,
  ENTITY_REFERENCE_NODE: 5,
  ENTITY_NODE: 6,
  PROCESSING_INSTRUCTION_NODE: 7,
  COMMENT_NODE: 8,
  DOCUMENT_NODE: 9,
  DOCUMENT_TYPE_NODE: 10,
  DOCUMENT_FRAGMENT_NODE: 11,
  NOTATION_NODE: 12
};

// Mock jQuery for testing (v13 compatible)
global.jQuery = function(selector) {
  // If selector is already a jQuery object, return it
  if (selector && selector.constructor === global.jQuery) {
    return selector;
  }
  
  // If it's a DOM element, wrap it
  if (selector && selector.nodeType) {
    const jqObject = Object.create(global.jQuery.prototype);
    jqObject.length = 1;
    jqObject[0] = selector;
    jqObject.selector = selector.tagName || 'element';
    return jqObject;
  }
  
  // Otherwise create a mock jQuery object
  const jqObject = Object.create(global.jQuery.prototype);
  jqObject.length = 1;
  jqObject[0] = selector;
  jqObject.selector = selector;
  
  return jqObject;
};

// Add methods to jQuery prototype
global.jQuery.prototype = {
  length: 1,
  
  find: function(sel) {
    // Create a new jQuery object for the found elements
    const newObj = Object.create(global.jQuery.prototype);
    newObj.length = 1;
    newObj[0] = `${this.selector || this[0]} ${sel}`;
    newObj.selector = sel;
    return newObj;
  },
  
  click: function(handler) {
    // Mock click handler registration
    if (this[0] && this[0].addEventListener) {
      this[0].addEventListener('click', handler);
    }
    return this;
  },
  
  on: function(event, handler) {
    // Mock event handler registration
    if (this[0] && this[0].addEventListener) {
      this[0].addEventListener(event, handler);
    }
    return this;
  },
  
  change: function(handler) {
    // Mock change handler registration
    if (this[0] && this[0].addEventListener) {
      this[0].addEventListener('change', handler);
    }
    return this;
  },
  
  addClass: function(className) {
    if (this[0] && this[0].classList) {
      this[0].classList.add(className);
    }
    return this;
  },
  
  removeClass: function(className) {
    if (this[0] && this[0].classList) {
      this[0].classList.remove(className);
    }
    return this;
  },
  
  hasClass: function(className) {
    if (this[0] && this[0].classList) {
      return this[0].classList.contains(className);
    }
    return false;
  },
  
  attr: function(name, value) {
    if (value === undefined) {
      if (this[0] && this[0].getAttribute) {
        return this[0].getAttribute(name);
      }
      return '';
    }
    if (this[0] && this[0].setAttribute) {
      this[0].setAttribute(name, value);
    }
    return this;
  },
  
  prop: function(name, value) {
    if (value === undefined) {
      if (this[0]) {
        return this[0][name];
      }
      return false;
    }
    if (this[0]) {
      this[0][name] = value;
    }
    return this;
  },
  
  val: function(value) {
    if (value === undefined) {
      if (this[0]) {
        return this[0].value || '';
      }
      return '';
    }
    if (this[0]) {
      this[0].value = value;
    }
    return this;
  },
  
  text: function(value) {
    if (value === undefined) {
      if (this[0]) {
        return this[0].textContent || 'mock text';
      }
      return 'mock text';
    }
    if (this[0]) {
      this[0].textContent = value;
    }
    return this;
  },
  
  html: function(value) {
    if (value === undefined) {
      if (this[0]) {
        return this[0].innerHTML || '<div>mock html</div>';
      }
      return '<div>mock html</div>';
    }
    if (this[0]) {
      this[0].innerHTML = value;
    }
    return this;
  },
  
  css: function(prop, value) {
    if (value === undefined && typeof prop === 'string') {
      if (this[0] && this[0].style) {
        return this[0].style[prop] || '';
      }
      return '';
    }
    if (this[0] && this[0].style) {
      if (typeof prop === 'object') {
        Object.assign(this[0].style, prop);
      } else {
        this[0].style[prop] = value;
      }
    }
    return this;
  },
  
  show: function() {
    if (this[0] && this[0].style) {
      this[0].style.display = '';
    }
    return this;
  },
  
  hide: function() {
    if (this[0] && this[0].style) {
      this[0].style.display = 'none';
    }
    return this;
  },
  
  slideUp: function(duration, callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 10);
    }
    return this;
  },
  
  slideDown: function(duration, callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 10);
    }
    return this;
  },
  
  fadeIn: function(duration, callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 10);
    }
    return this;
  },
  
  fadeOut: function(duration, callback) {
    if (typeof callback === 'function') {
      setTimeout(callback, 10);
    }
    return this;
  },
  
  each: function(callback) {
    if (typeof callback === 'function') {
      callback.call(this[0], 0, this[0]);
    }
    return this;
  },
  
  get: function(index) {
    return this[index || 0];
  },
  
  eq: function(index) {
    const newObj = Object.create(global.jQuery.prototype);
    newObj.length = 1;
    newObj[0] = this[index || 0];
    return newObj;
  }
};

// Alias for jQuery
global.$ = global.jQuery;

// Basic Collections stub for v12 compatibility
global.Actors = {
  registerSheet: () => {},
  unregisterSheet: () => {}
};

global.Items = {
  registerSheet: () => {},
  unregisterSheet: () => {}
};

// Hooks system for FoundryVTT
global.Hooks = {
  _hooks: new Map(),
  _onceHooks: new Map(),
  
  once: function(event, callback) {
    if (!this._onceHooks.has(event)) {
      this._onceHooks.set(event, []);
    }
    this._onceHooks.get(event).push(callback);
  },
  
  on: function(event, callback) {
    if (!this._hooks.has(event)) {
      this._hooks.set(event, []);
    }
    this._hooks.get(event).push(callback);
  },
  
  call: function(event, ...args) {
    const results = [];
    
    // Call persistent hooks
    if (this._hooks.has(event)) {
      for (const callback of this._hooks.get(event)) {
        try {
          const result = callback(...args);
          results.push(result);
        } catch (error) {
          console.error(`Hook ${event} callback failed:`, error);
        }
      }
    }
    
    // Call once hooks and remove them
    if (this._onceHooks.has(event)) {
      const onceCallbacks = this._onceHooks.get(event);
      this._onceHooks.delete(event);
      for (const callback of onceCallbacks) {
        try {
          const result = callback(...args);
          results.push(result);
        } catch (error) {
          console.error(`Hook ${event} once callback failed:`, error);
        }
      }
    }
    
    return results;
  },
  
  callAll: function(event, ...args) {
    return this.call(event, ...args);
  }
};

// loadTemplates function stub
global.loadTemplates = () => Promise.resolve();

// Application class for dialogs
global.Application = class MockApplication {
  constructor(options = {}) {
    this.options = options;
  }
  
  static get defaultOptions() {
    return {
      width: 400,
      height: 300,
      resizable: true
    };
  }
  
  render() {
    return this;
  }
  
  close() {
    return Promise.resolve();
  }
};

// FormApplication class for forms
global.FormApplication = class MockFormApplication extends global.Application {
  constructor(object = {}, options = {}) {
    super(options);
    this.object = object;
  }
  
  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      template: "templates/form.html",
      submitOnChange: false,
      closeOnSubmit: true
    };
  }
  
  _updateObject(event, formData) {
    return Promise.resolve();
  }
};

// Mock jest functions for testing
global.jest = {
  fn: (implementation) => {
    const calls = [];
    const mockFn = function(...args) {
      calls.push(args);
      if (implementation) {
        return implementation.apply(this, args);
      }
    };
    
    mockFn.mock = { calls };
    mockFn.mockImplementation = (impl) => {
      implementation = impl;
      return mockFn;
    };
    mockFn.mockReturnValue = (value) => {
      implementation = () => value;
      return mockFn;
    };
    mockFn.toHaveBeenCalledWith = (...args) => {
      return calls.some(call => 
        call.length === args.length && 
        call.every((arg, i) => arg === args[i])
      );
    };
    
    return mockFn;
  },
  spyOn: (object, method) => {
    const original = object[method];
    const calls = [];
    
    const spy = function(...args) {
      calls.push(args);
      return original ? original.apply(object, args) : undefined;
    };
    
    spy.mock = { calls };
    spy.mockImplementation = (impl) => {
      object[method] = impl;
      return spy;
    };
    spy.mockRestore = () => {
      object[method] = original;
    };
    spy.toHaveBeenCalledWith = (...args) => {
      return calls.some(call => 
        call.length === args.length && 
        call.every((arg, i) => arg === args[i])
      );
    };
    
    object[method] = spy;
    return spy;
  }
};

// Add $ alias for jQuery
global.$ = global.jQuery;

// Make jQuery global for FoundryVTT v13 compatibility
if (typeof window !== 'undefined') {
  window.jQuery = global.jQuery;
  window.$ = global.jQuery;
} 