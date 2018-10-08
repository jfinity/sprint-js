export {
  sprinter,
  kindof,
  move,
  assemble,
  tokenized,
  interpolation,
  maybeWrapBase2String,
  POJOMap
};

function kindof(ref) {
  return ref === null ? "null" : Array.isArray(ref) ? "array" : typeof ref;
}

function move(path, from, expressions, sentinel, dbg) {
  "use strict";

  return walk.call(this, path, from, expressions, sentinel, dbg);
}

function walk(path, from, xprs, sentinel, dbg) {
  "use strict";

  switch (kindof(path)) {
    default: {
      throw new Error("'" + kindof(path) + "' not currently supported");
    }
    case "array": {
      const limit = path.length;
      let to = from;
      for (let at = 0; at < limit; at += 1) {
        to = walk.call(this, path[at], to, xprs, sentinel, dbg);
      }
      return to;
    }
    case "number":
    case "string":
    case "symbol": {
      if (from === sentinel || from === undefined) return sentinel;
      else if (from !== null && from[path] !== undefined) return from[path];

      if (dbg) lurch.call(this, path, from, xprs, sentinel, dbg);
      return from ? sentinel : from[path];
    }
    case "function": {
      if (from === sentinel) return sentinel;
      else return tread.call(this, path, from, xprs, sentinel, dbg);
    }
    case "undefined":
    case "null": {
      return from;
    }
  }
}

function lurch(path, from, xprs, sentinel, dbg) {
  switch (kindof(dbg)) {
    default: {
      break;
    }
    case "boolean": {
      if (dbg) console.warn("Faulty walk to", "'" + path + "'", "from", from);
    }
  }
}

function tread(path, from, xprs, sentinel, dbg) {
  "use strict";

  const next = path.call(this, this, from === sentinel ? "" : kindof(from));

  switch (kindof(next)) {
    default: {
      throw new Error("'" + kindof(next) + "' support not found");
    }
    case "undefined":
    case "null": {
      return from;
    }
    case "number": {
      if (next !== (0 | next)) throw new Error("Unexpected non-integer");
      else if (next < 0) throw new Error("Unexpected negative");

      const route =
        Array.isArray(xprs) && xprs.length > next ? xprs[next] : undefined;
      return walk.call(this, route, from, null, sentinel, dbg); // no xprs
    }
    case "function": {
      return next.call(from, undefined, sentinel, dbg);
    }
  }
}

function POJOMap() {
  this._data = {};
}

POJOMap.prototype.set = function(pojo, value) {
  this._data[JSON.stringify(pojo)] = value;
  return this;
};

POJOMap.prototype.get = function(pojo) {
  return this._data[JSON.stringify(pojo)];
};

function configure(options) {
  const KVStore = typeof Map === "function" ? Map : POJOMap;
  return {
    cache: "cache" in options ? options.cache || null : new KVStore(),
    warn: "warn" in options ? options.warn || null : null,
    enhance: typeof options.enhance === "function" ? options.enhance : null
  };
}

function sprinter() {
  const cfg = configure(arguments.length ? arguments[0] || {} : {});
  const origin = descend.call(undefined, null, null);
  const guard = {};

  function jit(template) {
    const $$ = this;
    let built = cfg.cache ? cfg.cache.get(template) || null : null;

    if (!built) {
      built = tokenized(assemble(template).join(""));
      if (cfg.cache) cfg.cache.set(template, built);
    }

    if (arguments.length === 2) return descend(built, $$, [arguments[1]]);
    else return descend(built, $$, Array.call.apply(Array, arguments));
  }

  function descend() {
    "use strict";

    let idx = 0;

    const path =
      arguments.length > idx++ && Array.isArray(arguments[idx - 1])
        ? arguments[idx - 1] // slice() here if descend ever gets made "public"
        : null;
    const ancestor =
      arguments.length > idx++ && typeof arguments[idx - 1] === "function"
        ? arguments[idx - 1]
        : null;
    const xprs =
      arguments.length > idx++ && Array.isArray(arguments[idx - 1])
        ? arguments[idx - 1] // slice() here if descend ever gets made "public"
        : null;

    const ref = this;

    return function $$(model) {
      "use strict";

      switch (kindof(model)) {
        case "object":
        default: {
          throw new Error("'" + kindof(model) + "' currently unsupported");
        }
        case "array": {
          if (model.length) return jit.apply($$, arguments);
          else if (arguments.length === 1) throw new Error("[] is unsupported");
          else if (arguments.length === 2) return descend([arguments[1]], $$);
          else return descend(Array.call.apply(Array, arguments), $$);
        }
        case "number":
        case "string":
        case "symbol":
        case "function": {
          if (arguments.length === 1) return descend([arguments[0]], $$);
          else return descend(Array.apply(Array, arguments), $$);
        }
        case "undefined": {
          const nil = arguments.length > 1 ? arguments[1] : undefined;
          const dbg = arguments.length > 2 ? arguments[2] : cfg.warn;

          const value = ref === undefined ? this : ref;
          const current = value === guard ? undefined : value;
          const from = ancestor ? ancestor.apply(current, arguments) : current;
          const to = move.call(origin, path, from, xprs, nil, dbg);

          if (to !== nil) return to;
          else return typeof nil === "function" ? nil() : nil;
        }
        case "boolean": {
          const force = arguments.length > 1 ? !!arguments[1] : false;
          const use = force ? ancestor.call(undefined, false, true) : ancestor;
          const value = this === undefined ? guard : this;
          return descend.call(model ? value : undefined, path, use, xprs);
        }
        case "null": {
          return cfg.enhance
            ? cfg.enhance.apply({ $$: $$ }, arguments)
            : undefined;
        }
      }
    };
  }

  return origin;
}

function assemble(template) {
  const limit = template.length - 1;
  const buffer = template.concat(template.slice(1));

  if (/"0b[01]+"/.test(template.join(""))) {
    throw new Error(
      'Literals of template must not contain /"0b[01]+"/ (try ${"0b1"} instead)'
    );
  }

  for (let at = 0; at < limit; at += 1) {
    buffer[2 * at] = template[at];
    buffer[2 * at + 1] = '"0b' + at.toString(2) + '"';
  }

  buffer[2 * limit] = template[limit];

  return buffer;
}

function interpolation(index) {
  return function treaded(origin, kind) {
    return kind ? index : undefined;
  };
}

function maybeWrapBase2String(text) {
  return /^0b[01]+$/.test(text) ? interpolation(Number(text)) : text;
}

function eachKeyToPair(key) {
  return {
    key: maybeWrapBase2String(key),
    value: this[key]
  };
}

function revive(key, value) {
  switch (kindof(value)) {
    default: {
      return value;
    }
    case "string": {
      return maybeWrapBase2String(value);
    }
    case "object": {
      return !value || Array.isArray(value)
        ? value
        : {
            scheme: "native",
            pairs: Object.keys(value).map(eachKeyToPair, value)
          };
    }
  }
}

function tokenized(text) {
  const parts = text.split(".");
  const limit = parts.length;
  const result = [];
  let index = 0;

  while (index < limit) {
    let fragment = parts[index];

    if (/^\s*[[{"]/.test(fragment)) {
      do {
        fragment = "";
        do {
          if (index >= limit) {
            throw new Error("Malformed template");
          }
          fragment += parts[index];
          index += 1;
        } while (!/^\s*("[\S\s]*"|\[[\S\s]*\]|\{[\S\s]*\})\s*$/.test(fragment));

        try {
          result.push(JSON.parse(fragment, revive));
          break;
        } finally {
        }
      } while (true);
    } else {
      fragment = fragment.trim();
      result.push(maybeWrapBase2String(fragment));
      index += 1;
    }
  }

  return result;
}
