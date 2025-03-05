/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/builtin_and_spl_cpi.json`.
 */
export type BuiltinAndSplCpi = {
  "address": "J3kSr6FzQLxVzkNHaq2YTddaGPy23E2kBcLKBHGP6oD9",
  "metadata": {
    "name": "builtinAndSplCpi",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "callNoop",
      "discriminator": [
        177,
        43,
        195,
        187,
        70,
        203,
        173,
        13
      ],
      "accounts": [
        {
          "name": "noopProgram",
          "address": "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV"
        }
      ],
      "args": []
    },
    {
      "name": "createSplNameService",
      "discriminator": [
        179,
        225,
        128,
        218,
        48,
        183,
        239,
        113
      ],
      "accounts": [
        {
          "name": "nameAccount",
          "writable": true,
          "signer": true
        },
        {
          "name": "owner",
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "splNameServiceProgram",
          "address": "namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "bytes"
        },
        {
          "name": "space",
          "type": "u32"
        },
        {
          "name": "lamports",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createSplToken",
      "discriminator": [
        206,
        61,
        13,
        166,
        215,
        118,
        38,
        2
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "createSplToken2022",
      "discriminator": [
        49,
        45,
        212,
        106,
        232,
        79,
        14,
        35
      ],
      "accounts": [
        {
          "name": "mint",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  105,
                  110,
                  116,
                  95,
                  50,
                  48,
                  50,
                  50
                ]
              },
              {
                "kind": "account",
                "path": "payer"
              }
            ]
          }
        },
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "token2022Program",
          "address": "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
        },
        {
          "name": "rent",
          "address": "SysvarRent111111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "invokeSplCompression",
      "discriminator": [
        40,
        156,
        127,
        233,
        243,
        32,
        164,
        177
      ],
      "accounts": [
        {
          "name": "authority",
          "writable": true,
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "invokeSplMemo",
      "discriminator": [
        94,
        65,
        237,
        249,
        156,
        204,
        72,
        241
      ],
      "accounts": [
        {
          "name": "memoProgram",
          "address": "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo"
        }
      ],
      "args": []
    },
    {
      "name": "wrapSol",
      "discriminator": [
        47,
        62,
        155,
        172,
        131,
        205,
        37,
        201
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "payerWsolAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "payer"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "wsolMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "insufficientFunds",
      "msg": "Insufficient funds to wrap SOL."
    },
    {
      "code": 6001,
      "name": "wrongWsolMint",
      "msg": "Wrong wrapped sol mint"
    }
  ]
};
