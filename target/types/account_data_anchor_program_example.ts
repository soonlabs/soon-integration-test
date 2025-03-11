/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/account_data_anchor_program_example.json`.
 */
export type AccountDataAnchorProgramExample = {
  "address": "EjVpuq1j4F8vXequaJEGYH8WMpKytdcv24i39say94uA",
  "metadata": {
    "name": "accountDataAnchorProgramExample",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createAddressInfo",
      "discriminator": [
        14,
        194,
        156,
        25,
        142,
        29,
        96,
        112
      ],
      "accounts": [
        {
          "name": "payer",
          "writable": true,
          "signer": true
        },
        {
          "name": "addressInfo",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "houseNumber",
          "type": "u8"
        },
        {
          "name": "street",
          "type": "string"
        },
        {
          "name": "city",
          "type": "string"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "addressInfo",
      "discriminator": [
        212,
        104,
        35,
        195,
        240,
        21,
        199,
        243
      ]
    }
  ],
  "types": [
    {
      "name": "addressInfo",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "houseNumber",
            "type": "u8"
          },
          {
            "name": "street",
            "type": "string"
          },
          {
            "name": "city",
            "type": "string"
          }
        ]
      }
    }
  ]
};
