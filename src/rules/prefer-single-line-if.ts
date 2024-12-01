import {
  AST_NODE_TYPES,
  AST_TOKEN_TYPES,
  ESLintUtils,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/utils'
import * as t from 'tschema'

const createRule = ESLintUtils.RuleCreator(
  (name) => `https://github.com/lucasols/extended-lint#${name}`,
)

const name = 'prefer-single-line-if'

const optionsSchema = t.object({
  maxLineLength: t.optional(t.number()),
})

type Options = t.Infer<typeof optionsSchema>

const rule = createRule<[Options], 'noSingleLineCurly'>({
  name,
  meta: {
    type: 'suggestion',
    fixable: 'code',
    docs: {
      description:
        'Enforce single-line if return statements when the body contains only one statement',
    },
    messages: {
      noSingleLineCurly:
        'If return statement with single statement body should be written in a single line',
    },
    schema: [optionsSchema as any],
  },
  defaultOptions: [{ maxLineLength: undefined }],
  create(context) {
    const options = context.options[0]
    const sourceCode = context.sourceCode

    return {
      IfStatement(node) {
        if (node.consequent.type !== AST_NODE_TYPES.BlockStatement) return

        // Skip if there are comments inside the block
        const comments = sourceCode.getCommentsInside(node.consequent)

        if (comments.length > 0) return

        if (node.alternate) return

        // Only transform if there's exactly one statement
        if (node.consequent.body.length !== 1) return

        const statement = node.consequent.body[0]!

        if (statement.type !== AST_NODE_TYPES.ReturnStatement) return

        const statementArgCanBeInlined =
          !statement.argument ||
          statement.argument.type === AST_NODE_TYPES.Literal ||
          statement.argument.type === AST_NODE_TYPES.TemplateLiteral ||
          statement.argument.type === AST_NODE_TYPES.TaggedTemplateExpression ||
          statement.argument.type === AST_NODE_TYPES.Identifier

        if (!statementArgCanBeInlined) return

        const ifCondition = sourceCode.getText(node.test)
        const statementText = sourceCode.getText(statement)

        if (ifCondition.includes('\n')) return

        const nextToken = sourceCode.getTokenAfter(node)

        if (
          nextToken &&
          nextToken.type === AST_TOKEN_TYPES.Punctuator &&
          nextToken.value === '}'
        ) {
          return
        }

        const ifIndent = getTokenIndent(sourceCode, node)

        // Calculate the length of the single-line version
        const singleLine = `if (${ifCondition}) ${statementText}`

        // Skip if the line would be too long
        if (
          options.maxLineLength &&
          singleLine.length + ifIndent.length > options.maxLineLength
        ) {
          return
        }

        context.report({
          node,
          messageId: 'noSingleLineCurly',
          fix: (fixer) => {
            return fixer.replaceText(node, singleLine)
          },
        })
      },
    }
  },
})

function getTokenIndent(sourceCode: TSESLint.SourceCode, token: TSESTree.Node) {
  return sourceCode.text.slice(
    token.range[0] - token.loc.start.column,
    token.range[0],
  )
}

export const preferSingleLineIf = {
  name,
  rule,
}
