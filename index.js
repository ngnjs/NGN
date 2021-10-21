var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// src/index.js
__export(exports, {
  Class: () => Class,
  ERROR: () => ERROR2,
  ERROR_EVENT: () => ERROR_EVENT2,
  EventEmitter: () => EventEmitter2,
  Exception: () => Exception2,
  INFO: () => INFO2,
  INFO_EVENT: () => INFO_EVENT2,
  INTERNAL: () => INTERNAL2,
  INTERNAL_EVENT: () => INTERNAL_EVENT2,
  Middleware: () => Middleware2,
  NGN: () => NGN,
  OS: () => OS2,
  WARN: () => WARN2,
  WARN_EVENT: () => WARN_EVENT2,
  default: () => NGN,
  deprecate: () => deprecate,
  deprecateClass: () => deprecateClass,
  nodelike: () => nodelike,
  platform: () => platform,
  platformVersion: () => platformVersion,
  stack: () => stack2,
  wrap: () => wrap,
  wrapClass: () => wrapClass
});

// src/constants.js
var version = "<#REPLACE_VERSION#>";
var NODELIKE = globalThis.process !== void 0;
var RUNTIME = NODELIKE ? "node" : globalThis.hasOwnProperty("Deno") ? "deno" : "browser";
var OS = RUNTIME === "deno" ? globalThis.Deno.build.os : ((NODELIKE ? globalThis.process : globalThis.navigator).platform || "unknown").toLowerCase();
var PLATFORM = () => {
  if (OS.indexOf("ios") >= 0 || OS.indexOf("like mac")) {
    return "ios";
  } else if (OS.indexOf("mac") >= 0) {
    return "mac";
  } else if (OS.indexOf("darwin") >= 0) {
    return "mac";
  } else if (OS.indexOf("win") >= 0) {
    return "windows";
  } else if (OS.indexOf("android") >= 0) {
    return "android";
  } else if (OS.indexOf("linux") >= 0) {
    return "linux";
  }
  return "unrecognized";
};
var PLATFORM_RELEASE = async () => {
  return NODELIKE ? (await import("os")).release() : new Promise((resolve) => resolve(RUNTIME === "deno" ? "unknown" : /\((.*)\)/i.exec(globalThis.navigator.userAgent)[1].split(";")[0].split(/\s+/i).pop()));
};
var REFERENCE_ID = Symbol(`NGN ${version}`);
var WARN_EVENT = Symbol("NGN.WARN");
var INFO_EVENT = Symbol("NGN.INFO");
var ERROR_EVENT = Symbol("NGN.ERROR");
var INTERNAL_EVENT = Symbol("NGN.INTERNAL");

// src/base.js
var allFalse = [false, false, false];
var config = function(enumerable, writable, configurable, value) {
  return { enumerable, writable, configurable, value };
};
var warn = function() {
  if (globalThis[REFERENCE_ID] && globalThis[REFERENCE_ID].has("LEDGER")) {
    globalThis[REFERENCE_ID].get("LEDGER").emit(WARN_EVENT, ...arguments);
  }
};
var typeOf = (el) => {
  if (el === void 0) {
    return "undefined";
  }
  if (el === null) {
    return "null";
  }
  const value = Object.prototype.toString.call(el).split(" ")[1].replace(/[^A-Za-z]/gi, "").toLowerCase();
  if (value === "function" || typeof el === "function") {
    if (!el.name) {
      let name = el.toString().replace(/\n/gi, "").replace(/^function\s|\(.*$/mgi, "").toLowerCase();
      name = name.length === 0 || name.indexOf(" ") >= 0 ? "function" : name;
      return name.toLowerCase();
    }
    return (el.name || "function").toLowerCase();
  }
  return value.toLowerCase();
};
var typeContains = function() {
  const args = Array.from(arguments);
  const arg = args.shift();
  const types = new Set(args);
  for (const type of types) {
    if (typeof type === "function" && arg instanceof type || typeof type === "string" && type === typeOf(arg)) {
      return true;
    }
  }
  return false;
};
var base_default = {
  public: config(...allFalse, (value) => config(true, typeof value !== "function", false, value)),
  hidden: config(false, true, false, (value) => config(false, typeof value !== "function", false, value)),
  constant: config(...allFalse, (value) => config(true, false, false, value)),
  hiddenconstant: config(...allFalse, (value) => config(...allFalse, value)),
  get: config(...allFalse, (fn) => {
    return {
      enumerable: false,
      get: fn
    };
  }),
  set: config(...allFalse, (fn) => {
    return {
      enumerable: false,
      set: fn
    };
  }),
  getset: config(...allFalse, (getterFn, setterFn) => {
    return {
      enumerable: false,
      get: getterFn,
      set: setterFn
    };
  }),
  before: config(...allFalse, (preFn, fn) => {
    return function() {
      preFn(...arguments);
      return fn(...arguments);
    };
  }),
  after: config(...allFalse, (fn, postFn) => {
    return function() {
      setTimeout(() => postFn(...arguments), 0);
      return fn(...arguments);
    };
  }),
  wrap: config(...allFalse, (wrapper) => (fn) => wrapper(fn)),
  deprecate: config(...allFalse, (fn, message = "The method has been deprecated.", stdout = false) => {
    return function() {
      warn("DEPRECATED.FUNCTION", message);
      if (stdout) {
        console.warn(message);
      }
      return fn(...arguments);
    };
  }),
  wrapClass: config(...allFalse, (preFn, ClassFn) => {
    return function() {
      preFn(...arguments);
      return new ClassFn(...arguments);
    };
  }),
  deprecateClass: config(...allFalse, function(ClassFn, message = "The class has been deprecated.", stdout = false) {
    return function() {
      warn("DEPRECATED.CLASS", message);
      if (stdout) {
        console.warn(message);
      }
      return new ClassFn(...arguments);
    };
  }),
  typeof: config(...allFalse, typeOf),
  acceptableType: config(...allFalse, typeContains),
  unacceptableType: config(...allFalse, function() {
    return !typeContains(...arguments);
  })
};

// src/utility/configuration.js
var allFalse2 = [false, false, false];
function config2(enumerable, writable, configurable, value) {
  return { enumerable, writable, configurable, value };
}

// src/utility/type.js
var typeOf2 = (el) => {
  if (el === void 0) {
    return "undefined";
  }
  if (el === null) {
    return "null";
  }
  const value = Object.prototype.toString.call(el).split(" ")[1].replace(/[^A-Za-z]/gi, "").toLowerCase();
  if (value === "function" || typeof el === "function") {
    if (!el.name) {
      let name = el.toString().replace(/\n/gi, "").replace(/^function\s|\(.*$/mgi, "").toLowerCase();
      name = name.length === 0 || name.indexOf(" ") >= 0 ? "function" : name;
      return name.toLowerCase();
    }
    return (el.name || "function").toLowerCase();
  }
  return value.toLowerCase();
};
var typeContains2 = function() {
  const args = Array.from(arguments);
  const arg = args.shift();
  const types = new Set(args);
  for (const type of types) {
    if (typeof type === "function" && arg instanceof type || typeof type === "string" && type === typeOf2(arg)) {
      return true;
    }
  }
  return false;
};
var type_default = {
  typeof: config2(...allFalse2, typeOf2),
  acceptableType: config2(...allFalse2, typeContains2),
  unacceptableType: config2(...allFalse2, function() {
    return !typeContains2(...arguments);
  })
};

// src/relationships/relationship.js
var TYPES = new Set(["parent", "sibling"]);
var Relationship = class {
  #base;
  #related;
  #type = "parent";
  #name;
  #description;
  #oid;
  #destroyed = false;
  #update = (name, payload) => {
    if (!this.#destroyed) {
      setTimeout(() => {
        if (this.#base.emit && typeof this.#base.emit === "function") {
          this.#base.emit(name, payload);
        }
        if (this.#related && this.#related.emit && typeof this.#related.emit === "function") {
          this.#related.emit(name, payload);
        }
      }, 0);
    }
  };
  constructor(base, related, type = "parent") {
    this.#base = base;
    this.#related = related;
    this.type = type;
    this.#name = `${base.name || "Unknown" + base_default.typeof(base)}${related.name || "Unknown" + base_default.typeof(related)}Relationship`;
    this.#description = `${base.name || "Unknown " + base_default.typeof(base)} <-> ${related.name || "Unknown " + base_default.typeof(related)} ${this.type} relationship.`;
    this.#oid = Symbol(this.#name);
    Object.defineProperty(this, "destroy", {
      enumerable: false,
      configurable: false,
      writable: false,
      value: () => {
        this.#update("relationship.destroy", this);
        this.#destroyed = true;
      }
    });
    this.#update("relationship", this);
  }
  get OID() {
    return this.#oid;
  }
  get name() {
    return this.#name;
  }
  get description() {
    return this.#description;
  }
  get base() {
    return this.#base;
  }
  set base(value) {
    if (this.#base !== value) {
      this.#update("relationship.destroy", this);
      this.#base = value;
      this.#update("relationship", this);
    }
  }
  get related() {
    return this.#related;
  }
  set related(value) {
    if (this.#related !== value) {
      this.#update("relationship.destroy", this);
      this.#related = value;
      this.#update("relationship", this);
    }
  }
  get type() {
    return this.#type;
  }
  set type(value) {
    if (value !== this.#type) {
      const old = this.#type;
      value = (value || "parent").toLowerCase();
      if (!TYPES.has(value)) {
        throw new Error(`Invalid relationship type "${value}". Acceptable values are: ${Array.from(TYPES).join(", ")}`);
      }
      this.#type = value;
      this.#update("relationship.type.update", {
        old,
        new: value,
        relationship: this
      });
    }
  }
};

// src/relationships/manager.js
var Relationships = class {
  #related = new Set();
  #base;
  constructor(base) {
    this.#base = base;
    Object.defineProperties(this, {
      insert: base_default.hiddenconstant.value((rel) => this.#related.add(rel)),
      add: base_default.hiddenconstant.value((base2, related, type = "parent") => {
        const rel = new Relationship(base2, related, type);
        const other = base2 === this.#base ? related : base2;
        this.#related.add(rel);
        if (other.related && other.related instanceof Relationships) {
          other.related.insert(rel);
        }
      }),
      destroy: base_default.hiddenconstant.value((rel) => {
        if (this.#related.has(rel)) {
          const other = rel.base === this.#base ? rel.related : rel.base;
          rel.destroy();
          this.#related.delete(rel);
          if (other.related && other.related instanceof Relationships) {
            other.related.destroy(rel);
          }
        }
      })
    });
  }
  get size() {
    return this.#related.size;
  }
  get parent() {
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.related === this.#base) {
        return rel.base;
      }
    }
    return null;
  }
  set parent(value) {
    if (!value) {
      this.parents = null;
      return;
    }
    const p = this.parent;
    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === "parent" && rel.base === p) {
            rel.destroy();
            break;
          }
        }
      }
      if (value !== null) {
        this.add(value, this.#base);
      }
    }
  }
  addParent() {
    for (const parent of arguments) {
      this.add(parent, this.#base);
    }
  }
  get parents() {
    const result = new Set();
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.related === this.#base) {
        result.add(rel.base);
      }
    }
    return Array.from(result);
  }
  set parents(value) {
    value = new Set(Array.from(value || []));
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.related === this.#base) {
        if (!value.has(rel.base)) {
          this.destroy(rel);
        } else {
          value.delete(rel.base);
        }
      }
    }
    this.addParent(...value);
  }
  get child() {
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.base === this.#base) {
        return rel.related;
      }
    }
    return null;
  }
  set child(value) {
    if (!value) {
      this.children = null;
      return;
    }
    const p = this.child;
    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === "parent" && rel.related === p) {
            rel.destroy();
            break;
          }
        }
      }
      if (value !== null) {
        this.add(this.#base, value);
      }
    }
  }
  get children() {
    const result = new Set();
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.base === this.#base) {
        result.add(rel.related);
      }
    }
    return Array.from(result);
  }
  set children(value) {
    value = new Set(Array.from(value || []));
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.base === this.#base) {
        if (!value.has(rel.related)) {
          this.destroy(rel);
        } else {
          value.delete(rel.related);
        }
      }
    }
    this.addChild(...value);
  }
  addChild() {
    for (const child of arguments) {
      this.add(this.#base, child);
    }
  }
  get sibling() {
    for (const rel of this.#related) {
      if (rel.type === "sibling") {
        return rel.base === this.#base ? rel.related : rel.base;
      }
    }
    return null;
  }
  set sibling(value) {
    if (!value) {
      this.siblings = null;
      return;
    }
    const p = this.sibling;
    if (p !== value) {
      if (p !== null) {
        for (const rel of this.#related) {
          if (rel.type === "sibling" && rel.related === p) {
            rel.destroy();
            break;
          }
        }
      }
      if (value !== null) {
        this.add(this.#base, value, "sibling");
      }
    }
  }
  get siblings() {
    const result = new Set();
    for (const rel of this.#related) {
      if (rel.type === "sibling") {
        result.add(rel.base === this.#base ? rel.related : rel.base);
      }
    }
    return Array.from(result);
  }
  set siblings(value) {
    value = new Set(Array.from(value || []));
    for (const rel of this.#related) {
      if (rel.type === "sibling") {
        if (!value.has(rel.related) && !value.has(rel.base)) {
          this.destroy(rel);
        } else {
          value.delete(rel.related);
          value.delete(rel.base);
        }
      }
    }
    this.addSibling(...value);
  }
  addSibling() {
    for (const sibling of arguments) {
      this.add(this.#base, sibling, "sibling");
    }
  }
  clear() {
    for (const rel of this.#related) {
      rel.destroy();
    }
    this.#related = new Set();
  }
  clearParents() {
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.related === this.#base) {
        this.destroy(rel);
      }
    }
  }
  clearChildren() {
    for (const rel of this.#related) {
      if (rel.type === "parent" && rel.base === this.#base) {
        this.destroy(rel);
      }
    }
  }
  clearSiblings() {
    for (const rel of this.#related) {
      if (rel.type === "sibling") {
        this.destroy(rel);
      }
    }
  }
};

// src/class.js
var Core = class {
  #name;
  #description;
  #oid;
  #relationships;
  constructor(cfg = {}) {
    if (cfg.name && typeof cfg.name === "string") {
      this.#name = cfg.name;
    }
    this.#relationships = new Relationships(this);
    if (cfg.description && typeof cfg.description === "string") {
      this.#description = cfg.description;
    }
    if (cfg.parent) {
      this.#relationships.parent = cfg.parent;
    }
    if (cfg.parents) {
      this.#relationships.parents = cfg.parents;
    }
    if (cfg.child) {
      this.#relationships.child = cfg.child;
    }
    if (cfg.children) {
      this.#relationships.children = cfg.children;
    }
    if (cfg.sibling) {
      this.#relationships.sibling = cfg.sibling;
    }
    if (cfg.siblings) {
      this.#relationships.siblings = cfg.siblings;
    }
    Object.defineProperties(this, {
      alias: base_default.hidden.value((name, value) => {
        Object.defineProperty(this, name, base_default.get.value(() => value));
      }),
      rename: base_default.hidden.value((old, name, fn = null) => {
        if (!fn) {
          const me = this;
          fn = function() {
            return typeof me[name] === "function" ? me[name](...arguments) : me[name];
          };
        }
        Object.defineProperty(this, old, base_default.hidden.value(base_default.deprecate.value(fn, `${this.name} ${old} is now "${name}".`)));
      }),
      typeof: base_default.typeof,
      allowParameterType: base_default.acceptableType,
      disallowParameterType: base_default.unacceptableType,
      register: base_default.hiddenconstant.value((type) => register(type, this))
    });
  }
  get OID() {
    if (!this.#oid) {
      this.#oid = Symbol(this.#name || "NGN Class");
    }
    return this.#oid;
  }
  get name() {
    return this.#name || this.constructor.name || "Unknown";
  }
  set name(value) {
    this.#name = value;
  }
  get description() {
    return this.#description || "No description available.";
  }
  set description(value) {
    this.#description = value;
  }
  get related() {
    return this.#relationships;
  }
};

// src/emitter/listener.js
var EventListener = class extends Core {
  #event;
  #maxListeners;
  #handlers = new Map();
  #once = new Set();
  #dynamic = false;
  #flush;
  #expire;
  constructor(eventName, maxListeners = 25) {
    if (!eventName) {
      throw new TypeError("EventListener must be provided with an event name to listen for.");
    }
    super({
      name: eventName,
      description: "Event listener."
    });
    this.#event = eventName;
    this.#maxListeners = maxListeners;
    this.#dynamic = eventName instanceof RegExp || typeof eventName === "string" && eventName.indexOf("*") >= 0;
    this.register("EventHandler", this);
  }
  execute(event) {
    const scope = {
      event,
      get emitter() {
        return this.parent;
      }
    };
    const args = Array.from(arguments).slice(1);
    const me = this;
    this.#handlers.forEach((handler, oid) => {
      const fn = handler;
      if (me.#once.has(oid)) {
        me.#handlers.delete(oid);
        me.#once.delete(oid);
      }
      if (me.size === 0) {
        me.#flush();
      }
      scope.handler = fn;
      scope.remove = () => me.remove(oid);
      try {
        fn.apply(scope, args);
      } catch (e) {
        console.log(e.message);
        console.log(new Error().stack);
        console.log(fn.toString());
      }
    });
  }
  get dynamic() {
    return this.#dynamic;
  }
  get size() {
    return this.#handlers.size;
  }
  set maxListeners(value) {
    this.#maxListeners = value;
  }
  add(handler, prepend = false, ttl = null) {
    if (typeof handler !== "function") {
      console.log(arguments);
      throw new TypeError(`The ${typeof handler} argument (${handler.toString()}) provided as a "${this.name}" event handler must be a function.`);
    }
    const OID = Symbol(this.#event.toString());
    if (prepend) {
      this.#handlers = new Map([...[[OID, handler]], ...this.#handlers]);
    } else {
      this.#handlers.set(OID, handler);
    }
    if (this.#handlers.size > this.#maxListeners) {
      throw new RangeError(`Maximum call stack exceeeded (${this.parent.name} emitter limit ${this.#maxListeners}).`);
    }
    if (!isNaN(ttl) && ttl > 0) {
      setTimeout(() => this.remove(OID), ttl);
    }
    return OID;
  }
  remove(handler) {
    const type = typeof handler;
    if (type === "symbol") {
      this.#handlers.delete(handler);
    } else if (type === "function") {
      this.#handlers.forEach((value, id) => {
        if (value === handler) {
          this.#handlers.delete(id);
        }
      });
    } else {
      this.#handlers = new Map();
    }
    if (this.size === 0) {
      this.#flush();
    }
  }
  run() {
    this.execute(this.#event, ...arguments);
  }
  once(oid) {
    this.#once.add(oid);
  }
  set flush(fn) {
    this.#flush = fn;
  }
};

// src/emitter/core.js
var EventEmitter = class extends Core {
  #ttl = -1;
  #maxListeners = 25;
  #listeners = new Map();
  #dynamicListeners = new Set();
  #isDynamicEventName = (name = null) => name !== null ? name instanceof RegExp || typeof name === "string" && name.indexOf("*") : false;
  #getListenerRegex = (name) => name instanceof RegExp ? name : new RegExp("^" + name.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$");
  #forEachListener = (name, fn) => this.listeners(name).map((i) => this.#listeners.get(i)).forEach((i) => fn(i));
  constructor(cfg = {}) {
    super(...arguments);
    if (cfg.hasOwnProperty("defaultMaxListeners")) {
      this.#maxListeners = cfg.defaultMaxListeners;
    }
    if (cfg.TTL || cfg.ttl) {
      this.TTL = cfg.TTL || cfg.ttl;
    }
    this.alias("addListener", this.on);
    this.alias("addEventListener", this.on);
    this.alias("removeListener", this.off);
    this.alias("removeEventListener", this.off);
    this.alias("clear", this.removeAllListeners);
    this.register("EventEmitter");
  }
  get TTL() {
    return this.#ttl;
  }
  set TTL(value) {
    if (this.#ttl === value) {
      return;
    }
    if (isNaN(value)) {
      throw new TypeError(`The TTL value supplied to the ${this.name} event emitter must be an integer, not ${typeof value}.`);
    }
    if (value === 0) {
      value = -1;
    }
    this.#ttl = value;
  }
  get maxListeners() {
    return this.#maxListeners;
  }
  set maxListeners(value) {
    if (isNaN(value)) {
      if (value !== Infinity) {
        value = -1;
      } else {
        throw new TypeError("maxListeners must be a non-zero integer.");
      }
    }
    if (value === this.#maxListeners) {
      return;
    }
    this.#maxListeners = value;
    this.#forEachListener(null, (l) => {
      l.maxListeners = value;
    });
  }
  getMaxListeners() {
    return this.#maxListeners;
  }
  setMaxListeners(value) {
    this.maxListeners = value;
  }
  on(name, handler, ttl = null, prepend = false) {
    if (Array.isArray(name)) {
      name.forEach((eventName) => this.on(eventName, handler, ttl, prepend));
      return;
    }
    if (typeof name === "object") {
      return this.pool(name);
    }
    if (typeof name !== "string" && typeof name !== "symbol") {
      throw new TypeError(`The ${this.name} event emitter cannot listen for ${typeof name} events. Please provide a string or symbol.`);
    }
    let listener = this.#listeners.get(name);
    if (!listener) {
      listener = new EventListener(name, this.#maxListeners);
      listener.parent = this;
      listener.flush = () => {
        this.#listeners.delete(name);
        this.emit("removeListener", name);
      };
    }
    const id = listener.add(handler, prepend, ttl || this.#ttl);
    this.#listeners.set(name, listener);
    if (listener.dynamic) {
      this.#dynamicListeners.add(name);
    }
    this.emit("newListener", name, handler, id);
    return id;
  }
  prependListener(name, handler, ttl = null) {
    return this.on(name, handler, ttl, true);
  }
  once(name, handler, ttl = null, prepend = false) {
    const oid = this.on(...arguments);
    this.#forEachListener(name, (listener) => listener.once(oid));
  }
  prependOnceListener(name, handler, ttl = null) {
    this.once(name, handler, ttl, true);
  }
  off(name, handler) {
    if (arguments.length === 0) {
      return this.removeAllListeners();
    }
    if (Array.isArray(name)) {
      name.forEach((eventName) => this.off(eventName, handler));
      return;
    }
    const listeners = this.listeners(name);
    if (listeners.length === 0) {
      WARN(`Failed to remove event listener(s). The "${this.name}" event emitter has no listeners for the "${name.toString()}" event.`);
    } else {
      listeners.forEach((name2) => {
        const listener = this.#listeners.get(name2);
        listener.remove(handler);
        this.emit("removeListener", name2);
      });
    }
  }
  removeAllListeners(name = null) {
    if (arguments.length > 1) {
      new Set([...arguments]).forEach((arg) => this.removeAllListeners(arg));
      return;
    }
    if (name !== null) {
      this.off(name);
    } else {
      const events = this.listeners();
      this.#listeners = new Map();
      events.forEach((eventName) => this.emit("removeListener", eventName));
    }
  }
  listenerCount(name) {
    const listener = this.#listeners.get(name);
    return listener ? listener.size : 0;
  }
  listeners(filter = null) {
    const list = Array.from(new Set(Array.from(this.#listeners.keys())));
    return filter === null ? list : list.filter((name) => typeof name === "symbol" ? name === filter : this.#getListenerRegex(name).test(filter));
  }
  emit() {
    const args = Array.from(arguments);
    const name = args.shift();
    if (Array.isArray(name)) {
      name.forEach((eventName) => this.emit(eventName, ...args));
      return;
    }
    this.#forEachListener(name, (listener) => listener.execute(name, ...args));
  }
  eventNames() {
    return this.listeners();
  }
  pool(prefix, group) {
    if (typeof prefix !== "string") {
      group = prefix;
      prefix = null;
    }
    const me = this;
    const pool = {};
    for (const eventName in group) {
      const topic = `${prefix || ""}${eventName}`;
      if (typeof group[eventName] === "function") {
        this.maxListeners++;
        pool[eventName] = this.on(topic, group[eventName]);
      } else if (typeof group[eventName] === "object") {
        this.pool(`${topic}.`, group[eventName]);
      } else if (typeof group[eventName] === "string") {
        pool[eventName] = this.on(topic, function() {
          me.emit(group[eventName], ...arguments);
        });
      } else {
        WARN(`${topic} could not be pooled in the event emitter because its value is not a function.`);
      }
    }
  }
};

// src/emitter/emitter.js
var forceArray = (value) => value === null ? [] : Array.isArray(value) ? value : [value];
var EnhancedEventEmitter = class extends EventEmitter {
  #queued = new Map();
  #collections = new Map();
  #funnels = new Map();
  #after = new Map();
  #funnel = (key, name, trigger, args = [], once = false) => {
    const queue = this.#collections.get(key);
    if (!queue) {
      return;
    }
    queue.delete(name);
    this.maxListeners--;
    if (queue.size === 0) {
      if (once) {
        this.#collections.delete(key);
        this.#funnels.delete(key);
      } else {
        const collection = this.#funnels.get(key);
        this.#collections.set(key, collection);
        this.maxListeners += collection.size;
        collection.forEach((event) => this.once(event, () => this.#funnel(key, event, trigger, args)));
      }
      if (typeof trigger === "function") {
        trigger(...args);
      } else {
        this.emit(trigger, ...args);
      }
    } else {
      this.#collections.set(key, queue);
    }
  };
  #eventFunnel = function(once, collection, trigger, payload) {
    if (!Array.isArray(collection) && !(collection instanceof Set)) {
      throw new Error(`EventEmitter.reduce expected an array of events, but received a(n) ${typeof collection} instead.`);
    }
    const key = Symbol("reduce.event");
    collection = collection instanceof Set ? collection : new Set(collection);
    this.#collections.set(key, collection);
    this.maxListeners += collection.size;
    const handlers = new Set();
    collection.forEach((event) => handlers.add(this[once ? "once" : "on"](event, () => this.#funnel(key, event, trigger, Array.from(arguments).slice(3)))));
    this.#funnels.set(key, collection);
    return Object.defineProperty({}, "remove", base_default.constant.value(() => {
      this.#collections.delete(key);
      Array.from(collection).forEach((event, i) => this.off(event, handlers[i]));
    }));
  };
  #afterEvent = function(once, event, limit, target) {
    const oid = Symbol(`after.${limit}.${event}`);
    this.#after.set(oid, {
      remaining: limit,
      limit,
      once
    });
    const args = Array.from(arguments);
    const me = this;
    const OID = this.on(event, function() {
      const meta = me.#after.get(oid);
      if (!meta) {
        return;
      }
      meta.remaining--;
      if (meta.remaining === 0) {
        if (meta.once) {
          me.#after.delete(oid);
          me.off(event, OID);
        } else {
          meta.remaining = meta.limit;
          me.#after.set(oid, meta);
        }
        if (typeof target === "function") {
          target(...args.slice(4));
        } else {
          me.emit(target, ...arguments);
        }
      } else {
        me.#after.set(oid, meta);
      }
    });
    return Object.defineProperty({}, "remove", base_default.constant.value(() => {
      this.#after.delete(oid);
      this.off(event, oid);
    }));
  };
  constructor() {
    super(...arguments);
    this.rename("funnel", "reduce");
    this.rename("funnelOnce", "reduceOnce");
    this.rename("threshold", "after");
    this.rename("thresholdOnce", "afterOnce");
    Object.defineProperties(this, {
      increaseMaxListeners: base_default.hidden.value((count = 1) => {
        this.maxListeners += count;
      }),
      decreaseMaxListeners: base_default.hidden.value((count = 1) => {
        this.maxListeners = this.maxListeners - count;
      })
    });
  }
  emit(name) {
    if ((typeof name === "string" || typeof name === "symbol") && this.#queued.has(name)) {
      return;
    }
    super.emit(...arguments);
  }
  delayEmit(name, delay) {
    if (!this.#queued.has(name)) {
      const args = Array.from(arguments);
      args.splice(1, 1);
      this.#queued.set(name, setTimeout(() => {
        this.#queued.delete(name);
        this.emit(...args);
      }, delay));
    }
  }
  attach(eventName, preventDefaultAction) {
    preventDefaultAction = typeof preventDefaultAction === "boolean" ? preventDefaultAction : false;
    return (e) => {
      if (preventDefaultAction && !NODELIKE) {
        e.preventDefault();
      }
      this.emit(eventName, ...arguments);
    };
  }
  forward(eventName, triggers, payload) {
    if (Array.isArray(eventName)) {
      return eventName.forEach((name) => this.forward(...Array.from(arguments).slice(1)));
    }
    triggers = forceArray(triggers);
    const me = this;
    const handler = function() {
      const args = Array.from(arguments);
      if (payload) {
        args.push(payload);
      }
      me.emit(triggers, ...args);
    };
    this.maxListeners++;
    const oid = this.on(eventName, handler);
    return {
      id: oid,
      remove: () => {
        this.maxListeners--;
        this.off(eventName, oid);
      }
    };
  }
  reduce() {
    return this.#eventFunnel(false, ...arguments);
  }
  reduceOnce() {
    return this.#eventFunnel(true, ...arguments);
  }
  relay(name, target, prefix = null, postfix = null, once = false) {
    if (target === this || typeof target.emit !== "function") {
      throw new Error(`Cannot relay events from "${this.name}" event emitter to a non-event emitter.`);
    }
    name = forceArray(name);
    this.maxListeners += name.length;
    const me = this;
    name.forEach((event) => {
      this[once ? "once" : "on"](event, function() {
        if (typeof event === "string") {
          target.emit(`${prefix ? prefix + "." : ""}${this.event}${postfix ? "." + postfix : ""}`.replace(/\.{2,}/gi, "."), ...arguments);
          return;
        } else if (prefix !== null || postfix !== null) {
          INFO("RELAY", `Cannot relay a pre/postfixed "${this.event.toString()}" event (${typeof this.event}) from ${me.name} event emitter to ${target instanceof EventEmitter ? target.name : "target event emitter"}.`);
        }
        target.emit(this.event, ...arguments);
      });
    });
  }
  relayOnce() {
    this.relay(...arguments, true);
  }
  after() {
    return this.#afterEvent(false, ...arguments);
  }
  afterOnce() {
    return this.#afterEvent(true, ...arguments);
  }
  deprecate(event, replacementName) {
    const me = this;
    this.on(event, function() {
      WARN("DEPRECATED.EVENT", `${event} is deprecated. ` + (!replacementName ? "" : `Use ${replacementName} instead.`));
      if (replacementName) {
        const args = Array.from(arguments).slice(1);
        args.unshift(replacementName);
        me.emit(...args);
      }
    });
  }
};

// src/internal.js
var globalId = Symbol.for("NGN");
globalThis[REFERENCE_ID] = new Map();
globalThis[REFERENCE_ID].set("REFERENCE_ID", REFERENCE_ID);
globalThis[REFERENCE_ID].set("VERSION", version);
if (!globalThis[globalId]) {
  globalThis[globalId] = [];
}
globalThis[globalId].push(REFERENCE_ID);
var register = (key, value) => {
  if (key !== "REFERENCE_ID" && key !== "LEDGER" && key !== "version") {
    if (key === "INSTANCE") {
      if (!globalThis[REFERENCE_ID].has("INSTANCE")) {
        globalThis[REFERENCE_ID].set(key, value);
      }
      return;
    }
    const meta = globalThis[REFERENCE_ID].get(key) || new Map();
    meta.set(Symbol(key), value);
    globalThis[REFERENCE_ID].set(key, meta);
  }
};
var plugins = new Proxy(globalThis[REFERENCE_ID], {
  get(target, property) {
    return !target.has("PLUGINS") ? void 0 : target.get("PLUGINS").get(property);
  }
});
var LEDGER = new EnhancedEventEmitter({
  name: "NGN Ledger",
  description: "A ledger of events, outputs, and information produced by the system."
});
globalThis[REFERENCE_ID].set("LEDGER", LEDGER);
var LEDGER_EVENT = (EVENT) => function() {
  LEDGER.emit(EVENT, ...arguments);
};
var WARN = function() {
  LEDGER_EVENT(WARN_EVENT)(...arguments);
};
var INFO = function() {
  LEDGER_EVENT(INFO_EVENT)(...arguments);
};
var ERROR = function() {
  LEDGER_EVENT(ERROR_EVENT)(...arguments);
};
var INTERNAL = function() {
  LEDGER_EVENT(INTERNAL_EVENT)(...arguments);
};
if (RUNTIME === "node") {
  process.on("uncaughtException", (e) => {
    if (typeof e.OID === "symbol") {
      ERROR(e);
    }
  });
  process.on("unhandledRejection", ERROR);
  process.on("warning", WARN);
} else if (globalThis.window !== void 0) {
  globalThis.window.addEventListener("error", ERROR);
  globalThis.window.addEventListener("unhandledrejection", ERROR);
}

// src/middleware.js
var Middleware = class extends Core {
  constructor() {
    super(...arguments);
    Object.defineProperties(this, {
      _data: { enumerable: false, configurable: false, value: [] },
      go: { enumerable: false, configurable: false, writable: true, value: (...args) => {
        args.pop().apply(this, args);
      } }
    });
    this.register("Middleware");
  }
  get size() {
    return this._data.length;
  }
  get data() {
    return this._data;
  }
  use(method) {
    const methodBody = method.toString();
    if (methodBody.indexOf("[native code]") < 0) {
      this._data.push(methodBody);
    }
    this.go = ((stack3) => (...args) => {
      const next = args.pop();
      stack3(...args, () => {
        method.apply(this, [...args, next.bind(null, ...args)]);
      });
    })(this.go);
  }
  run() {
    const args = Array.from(arguments);
    if (args.length === 0 || typeof args[args.length - 1] !== "function") {
      args.push(() => {
      });
    }
    this.go(...args);
  }
};

// src/exception.js
var PARSER = new Map([
  ["PROTOCOL", /(\w+:\/\/?.*):([0-9]+):([0-9]+)(?!=[^0-9])/i],
  ["NO_PROTOCOL", /\((.+):([0-9]+):([0-9]+)\)/i],
  ["NO_PARENTHESIS", /\s(?!\()([^\s]+):([0-9]+):([0-9]+)(?!=[^0-9])(?!\))/i],
  ["OLD_STACK", /Line\s+([0-9]+).+\s(\w+:\/\/?[^\s|:]+):?/i]
]);
var Exception = class extends Error {
  #id;
  #custom;
  #oid;
  constructor(config3 = {}) {
    super();
    config3 = typeof config3 === "string" ? { message: config3 } : config3;
    this.name = config3.name || "NgnError";
    this.type = config3.type || "Error";
    this.severity = config3.severity || "minor";
    this.message = config3.message || "Unknown Error";
    this.category = config3.category || "programmer";
    this.description = this.message;
    this.parent = globalThis;
    this.name = this.name.replace(/[^a-zA-Z0-9_]/gi, "");
    this.#custom = config3.custom || {};
    this.#id = (config3.id ? config3.id : this.#custom.id) || this.name;
    this.#oid = Symbol(this.name);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, Exception);
    }
    if (!(typeof config3.DO_NOT_REGISTER === "boolean" && !config3.DO_NOT_REGISTER)) {
      register("Exception", this);
    }
    ERROR(this);
  }
  get OID() {
    return this.#oid;
  }
  get help() {
    return this.#custom.help ? "Tip: " + this.#custom.help : null;
  }
  get cause() {
    return this.#custom.cause ? this.#custom.cause : null;
  }
  get id() {
    return this.#id;
  }
  get trace() {
    return this.stack.split("\n").reduce((result, line) => {
      for (const [name, pattern] of PARSER) {
        const match = pattern.exec(line);
        if (match !== null) {
          if (name !== "OLD_STACK") {
            result.push({ path: match[1], line: match[2], column: match[3] });
          } else {
            result.push({ path: match[2], line: match[1], column: 0 });
          }
          break;
        }
      }
      return result;
    }, []);
  }
};
function defineException(config3 = {}) {
  globalThis[config3.name || "NGNError"] = function() {
    if (arguments.length > 0) {
      config3.message = arguments[0];
    }
    return new Exception(config3);
  };
}
var stack = () => new Exception({ DO_NOT_REGISTER: true }).trace;

// src/ngn.js
var NGN = Object.defineProperties({}, Object.assign({}, base_default, type_default));
Object.defineProperties(NGN, {
  version: NGN.constant(version),
  OS: NGN.constant(OS),
  nodelike: NGN.hiddenconstant(NODELIKE),
  runtime: NGN.hiddenconstant(RUNTIME),
  platform: NGN.get(PLATFORM),
  platformVersion: NGN.get(PLATFORM_RELEASE),
  WARN_EVENT: NGN.hiddenconstant(WARN_EVENT),
  INFO_EVENT: NGN.hiddenconstant(INFO_EVENT),
  ERROR_EVENT: NGN.hiddenconstant(ERROR_EVENT),
  INTERNAL_EVENT: NGN.hiddenconstant(INTERNAL_EVENT),
  WARN: NGN.hiddenconstant(WARN),
  INFO: NGN.hiddenconstant(INFO),
  ERROR: NGN.hiddenconstant(ERROR),
  INTERNAL: NGN.hiddenconstant(INTERNAL),
  stack: NGN.get(stack),
  defineException: NGN.constant(defineException),
  BUS: NGN.constant(new EnhancedEventEmitter({ name: "NGN.BUS", description: "Global event bus" })),
  LEDGER: NGN.get(() => LEDGER),
  Class: NGN.public(Core),
  Middleware: NGN.public(Middleware),
  EventEmitter: NGN.public(EnhancedEventEmitter),
  Relationships: NGN.public(Relationships),
  Relationship: NGN.public(Relationship),
  plugins: NGN.constant(plugins)
});
defineException({
  name: "MissingNgnDependencyError",
  type: "MissingNgnDependencyError",
  severity: "critical",
  message: "An NGN dependency is missing or could not be found.",
  category: "programmer",
  custom: {
    help: "Include the missing library.",
    cause: "A required dependency was not included (or was included in the wrong sequence)."
  }
});
defineException({
  name: "ReservedWordError",
  type: "ReservedWordError",
  severity: "critical",
  message: "An attempt to use a reserved word failed.",
  category: "programmer",
  custom: {
    help: "Use an alternative word.",
    cause: "A word was used to define an attribute, method, field, or other element that already exists."
  }
});
defineException({
  name: "InvalidConfigurationError",
  type: "InvalidConfigurationError",
  severity: "critical",
  message: "Invalid configuration.",
  category: "programmer",
  custom: {
    help: "See the documentation for the proper configuration.",
    cause: "The configuration specified was marked as invalid or caused an error during instantiation."
  }
});
defineException({
  name: "UnacceptableParameterTypeError",
  type: "UnacceptableParameterTypeError",
  severity: "critical",
  message: "The parameter/argument provided is unacceptable.",
  category: "programmer",
  custom: {
    help: "See the documentation for a list of accepted parameter types.",
    cause: 'This is commonly caused by a variable evaluating to an incorrect data type, such as "undefined" or "null". It is also commonly caused by providing arguments to a function in the incorrect order, or just an unawareness of the acceptable parameter types.'
  }
});

// src/index.js
var {
  EventEmitter: EventEmitter2,
  Middleware: Middleware2,
  Exception: Exception2,
  Class,
  OS: OS2,
  nodelike,
  platform,
  platformVersion,
  WARN_EVENT: WARN_EVENT2,
  INFO_EVENT: INFO_EVENT2,
  ERROR_EVENT: ERROR_EVENT2,
  INTERNAL_EVENT: INTERNAL_EVENT2,
  WARN: WARN2,
  INFO: INFO2,
  ERROR: ERROR2,
  INTERNAL: INTERNAL2,
  wrapClass,
  deprecateClass,
  wrap,
  deprecate,
  stack: stack2
} = NGN;
register("INSTANCE", NGN);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Class,
  ERROR,
  ERROR_EVENT,
  EventEmitter,
  Exception,
  INFO,
  INFO_EVENT,
  INTERNAL,
  INTERNAL_EVENT,
  Middleware,
  NGN,
  OS,
  WARN,
  WARN_EVENT,
  deprecate,
  deprecateClass,
  nodelike,
  platform,
  platformVersion,
  stack,
  wrap,
  wrapClass
});
