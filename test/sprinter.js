import { sprinter } from "../index.js";

(function iife() {
  function testRun(description, job) {
    try {
      job();
      console.log("pass:", description);
    } catch (err) {
      console.warn("fail:", description);
      throw err;
    }
  }

  function expectEq(left, right) {
    if (left !== right) {
      throw new Error("not ===");
    }
  }

  function getPojo() {
    const pojo = {
      number: {
        123: 456
      },
      string: {
        abc: "xyz",
        "two words": "whitespace",
        "": { empty: "literal" },
        "  ": "double-space",
        " padded ": " text "
      },
      symbol: {
        [Symbol.for("iii")]: Symbol("three")
      },
      null: null,
      undefined: undefined,
      function: () => pojo
    };

    pojo.object = pojo;
    pojo.array = new Array(4).fill(pojo);

    return pojo;
  }

  testRun("literal only tags", () => {
    const pojo = getPojo();
    const size = pojo.array.length;
    const flex = sprinter({ warn: true });
    const fixed = flex.call(pojo, true);

    expectEq(456, pojo.number[123]);

    expectEq(456, fixed`number.123`());
    expectEq(456, fixed`number``123`());
    expectEq(456, fixed`number.[123]`());
    expectEq(456, fixed`number``[123]`());

    expectEq(456, flex`number.123`.call(pojo));
    expectEq(456, flex`number``123`.call(pojo));
    expectEq(456, flex`number.[123]`.call(pojo));
    expectEq(456, flex`number``[123]`.call(pojo));

    expectEq(456, flex`["number",123]`.call(pojo));
    expectEq(456, flex`["number", 123]`.call(pojo));
    expectEq(456, flex`["number",\t123]`.call(pojo));
    expectEq(456, flex`["number", \n123]`.call(pojo));
    expectEq(456, flex`["number"\t,\n123]`.call(pojo));

    expectEq(456, flex`  number\t .\n 123 `.call(pojo));
    expectEq(456, flex`  number\t ``\n 123 `.call(pojo));
    expectEq(456, flex`  number\t .\n [123] `.call(pojo));
    expectEq(456, flex`  number\t ``\n [123] `.call(pojo));

    expectEq("xyz", pojo.string.abc);

    expectEq("xyz", fixed`string.abc`());
    expectEq("xyz", fixed`string``abc`());
    expectEq("xyz", fixed`string."abc"`());
    expectEq("xyz", fixed`string``"abc"`());
    expectEq("xyz", fixed`string.["abc"]`());
    expectEq("xyz", fixed`string``["abc"]`());

    expectEq("xyz", flex`string.abc`.call(pojo));
    expectEq("xyz", flex`string``abc`.call(pojo));
    expectEq("xyz", flex`string."abc"`.call(pojo));
    expectEq("xyz", flex`string``"abc"`.call(pojo));
    expectEq("xyz", flex`string.["abc"]`.call(pojo));
    expectEq("xyz", flex`string``["abc"]`.call(pojo));

    expectEq("xyz", flex`["string","abc"]`.call(pojo));

    expectEq("xyz", flex`  string\t .\n abc `.call(pojo));
    expectEq("xyz", flex`  string\t ``\n abc `.call(pojo));
    expectEq("xyz", flex`  string\t .\n "abc" `.call(pojo));
    expectEq("xyz", flex`  string\t ``\n "abc" `.call(pojo));
    expectEq("xyz", flex`  string\t .\n ["abc"] `.call(pojo));
    expectEq("xyz", flex`  string\t ``\n ["abc"] `.call(pojo));

    expectEq("whitespace", pojo.string["two words"]);

    expectEq("whitespace", fixed`string.two words`());
    expectEq("whitespace", fixed`string``two words`());
    expectEq("whitespace", fixed`string."two words"`());
    expectEq("whitespace", fixed`string``"two words"`());
    expectEq("whitespace", fixed`string.["two words"]`());
    expectEq("whitespace", fixed`string``["two words"]`());

    expectEq("whitespace", flex`string.two words`.call(pojo));
    expectEq("whitespace", flex`string``two words`.call(pojo));
    expectEq("whitespace", flex`string."two words"`.call(pojo));
    expectEq("whitespace", flex`string``"two words"`.call(pojo));
    expectEq("whitespace", flex`string.["two words"]`.call(pojo));
    expectEq("whitespace", flex`string``["two words"]`.call(pojo));

    expectEq("whitespace", flex`["string" , "two words"]`.call(pojo));

    expectEq("whitespace", flex`  string\t .\n two words `.call(pojo));
    expectEq("whitespace", flex`  string\t ``\n two words `.call(pojo));
    expectEq("whitespace", flex`  string\t .\n "two words" `.call(pojo));
    expectEq("whitespace", flex`  string\t ``\n "two words" `.call(pojo));
    expectEq("whitespace", flex`  string\t .\n ["two words"] `.call(pojo));
    expectEq("whitespace", flex`  string\t ``\n ["two words"] `.call(pojo));

    expectEq("literal", pojo.string[""].empty);

    expectEq("literal", fixed`string..empty`());
    expectEq("literal", fixed`string.``empty`());
    expectEq("literal", fixed`string``.empty`());
    expectEq("literal", fixed`string."".empty`());
    expectEq("literal", fixed`string``"".empty`());
    expectEq("literal", fixed`string.[""].empty`());
    expectEq("literal", fixed`string``[""].empty`());
    expectEq("literal", fixed`string.["", "empty"]`());
    expectEq("literal", fixed`string``["", "empty"]`());

    expectEq("literal", flex`string..empty`.call(pojo));
    expectEq("literal", flex`string.``empty`.call(pojo));
    expectEq("literal", flex`string``.empty`.call(pojo));
    expectEq("literal", flex`string."".empty`.call(pojo));
    expectEq("literal", flex`string``"".empty`.call(pojo));
    expectEq("literal", flex`string.[""].empty`.call(pojo));
    expectEq("literal", flex`string``[""].empty`.call(pojo));
    expectEq("literal", flex`string.["", "empty"]`.call(pojo));
    expectEq("literal", flex`string``["", "empty"]`.call(pojo));

    expectEq("literal", flex`  string\t .\n . empty `.call(pojo));
    expectEq("literal", flex`  string\t ``\n . empty `.call(pojo));
    expectEq("literal", flex`  string\t .\n "" . empty `.call(pojo));
    expectEq("literal", flex`  string\t ``\n "" . empty`.call(pojo));
    expectEq("literal", flex`  string\t .\n [""] . empty `.call(pojo));
    expectEq("literal", flex`  string\t ``\n ["", "empty"] `.call(pojo));
    expectEq("literal", flex`  ["string" \t, \n ""] . empty `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""].\n empty `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""].\n "empty" `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""].\n ["empty"] `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""] ``\n empty `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""] ``\n "empty" `.call(pojo));
    expectEq("literal", flex`  ["string"\t, ""] ``\n ["empty"] `.call(pojo));

    expectEq("double-space", pojo.string["  "]);

    expectEq("double-space", fixed`string."  "`());
    expectEq("double-space", fixed`string``"  "`());
    expectEq("double-space", fixed`string.["  "]`());
    expectEq("double-space", fixed`string``["  "]`());

    expectEq("double-space", flex`string.   "  "`.call(pojo));
    expectEq("double-space", flex`string``   "  "`.call(pojo));
    expectEq("double-space", flex`string.   ["  "]`.call(pojo));
    expectEq("double-space", flex`string``   ["  "]`.call(pojo));

    expectEq(" text ", pojo.string[" padded "]);

    expectEq(" text ", fixed`string." padded "`());
    expectEq(" text ", fixed`string``" padded "`());
    expectEq(" text ", fixed`string.[" padded "]`());
    expectEq(" text ", fixed`string``[" padded "]`());

    expectEq(" text ", flex`string.   " padded "`.call(pojo));
    expectEq(" text ", flex`string``   " padded "`.call(pojo));
    expectEq(" text ", flex`string.   [" padded "]`.call(pojo));
    expectEq(" text ", flex`string``   [" padded "]`.call(pojo));

    expectEq(true, 2 < pojo.array.length);
    expectEq(pojo.symbol, pojo.array[2].symbol);

    expectEq(pojo.symbol, fixed`array.2.symbol`());
    expectEq(pojo.symbol, fixed`array``2.symbol`());
    expectEq(pojo.symbol, fixed`array.[2].symbol`());
    expectEq(pojo.symbol, fixed`array``[2].symbol`());

    expectEq(pojo.symbol, flex`array. 2 . symbol`.call(pojo));
    expectEq(pojo.symbol, flex`array`` 2 . "symbol"`.call(pojo));
    expectEq(pojo.symbol, flex`array. [ 2 ] . symbol`.call(pojo));
    expectEq(pojo.symbol, flex`array`` [ 2, "symbol" ] `.call(pojo));

    expectEq(pojo.array.length, fixed`array.length`());
    expectEq(false, 34 < pojo.array.length);
    expectEq(null, fixed`array.34.symbol`(undefined, null, false));

    expectEq(pojo.function, pojo.object.function);

    expectEq(pojo.function, fixed`object.function`());
    expectEq(pojo.function, fixed`object``array.[2].function`());
    expectEq(pojo.function, fixed`object.array.[2].object.function`());
    expectEq(pojo.function, fixed`object``object.function`());
  });
})();
