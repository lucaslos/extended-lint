import { RuleTester } from '@typescript-eslint/rule-tester'
import { TSESLint } from '@typescript-eslint/utils'
import { fileURLToPath } from 'node:url'

const ruleTester = new RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: fileURLToPath(new URL('../fixture', import.meta.url)),
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
})

export function createOldTester<
  T extends TSESLint.RuleModule<string, any[]>,
  O extends any[],
>(
  rule: {
    name: string
    rule: T
  },
  {
    defaultErrorId,
    ignoreError,
  }: {
    defaultErrorId?: string
    optionsType?: O
    ignoreError: TSESLint.InvalidTestCase<string, any[]>
  },
) {
  return {
    valid(code: string, options?: O) {
      ruleTester.run(rule.name, rule.rule, {
        valid: [
          {
            code,
            options: options || [],
          },
        ],
        invalid: [ignoreError],
      })
    },
    invalid(
      code: string,
      errors?:
        | {
            messageId?: string
            data?: Record<string, string>
          }[]
        | number,
      options?: O,
    ) {
      ruleTester.run(rule.name, rule.rule, {
        valid: [
          {
            code: 'const a = 1',
            name: 'ignore',
            options: options || [],
          },
        ],
        invalid: [
          {
            name: 'test',
            code,
            options: options || [],
            errors:
              typeof errors === 'number'
                ? Array.from({ length: errors }, () => ({
                    messageId: defaultErrorId || '?',
                  }))
                : errors
                ? errors.map((error) => ({
                    messageId: error.messageId || defaultErrorId || '?',
                    data: error.data,
                  })) || []
                : [{ messageId: defaultErrorId || '?' }],
          },
        ],
      })
    },
  }
}

export function createTester<
  T extends TSESLint.RuleModule<string, any[]>,
  O extends any[],
>(
  rule: {
    name: string
    rule: T
  },
  {
    defaultErrorId,
  }: {
    defaultErrorId?: string
    optionsType?: O
  } = {},
) {
  const valid: TSESLint.ValidTestCase<any[]>[] = []
  const invalid: TSESLint.InvalidTestCase<string, any[]>[] = []

  function run() {
    ruleTester.run(rule.name, rule.rule, {
      valid: valid,
      invalid: invalid,
    })
  }

  function addValid(testName: string, code: string, options?: O) {
    valid.push({
      name: testName,
      code,
      options: options || [],
    })
  }

  function addInvalid(
    testName: string,
    code: string,
    errors?:
      | {
          messageId?: string
          data?: Record<string, string>
        }[]
      | number,
    options?: O,
  ) {
    invalid.push({
      name: testName,
      code,
      options: options || [],
      errors:
        typeof errors === 'number'
          ? Array.from({ length: errors }, () => ({
              messageId: defaultErrorId || '?',
            }))
          : errors
          ? errors.map((error) => ({
              messageId: error.messageId || defaultErrorId || '?',
              data: error.data,
            })) || []
          : [{ messageId: defaultErrorId || '?' }],
    })
  }

  return {
    run,
    addValid,
    addInvalid,
  }
}
