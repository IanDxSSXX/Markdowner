import {inlineDefaultRules, InlineMarkdownRules, blockDefaultRules, BlockMarkdownRules} from "../parser/rules";
import {MarkdownBlockParser, C as BC} from "../parser/block/parser";
import {MarkdownAST} from "./syntaxTree";

import {
    BlockRUIElements,
    MarkdownerViewBase,
    InlineRUIElements,
    InlineElements,
    BlockElements,
    MarkdownerDocument
} from "../renderer/view";
import {ASTHelper, MarkdownerHelper} from "./helper";
import {defaultBlockMap, defaultInlineMap, MarkdownerRuleMap} from "../renderer/ruleMap";
import {Div} from "@iandx/reactui/tag";
import {RUI} from "@iandx/reactui";
import {MarkdownerBlockRuleInterface, MarkdownerInlineRuleInterface, RuleAdder, RuleDropper} from "./rules";

export namespace C {
    interface MarkdownerProps {
        tabSpaceNum?: number
        softBreak?: boolean
        geneId?: boolean
    }

    export interface MarkdownerViewProps{
        content?: string
        children?: string
    }

    export class Markdowner {
        blockParser?: BC.MarkdownBlockParser
        ast: ASTHelper
        dropRule: RuleDropper
        addRule: RuleAdder
        markdownerProps: MarkdownerProps = {}
        inlineRules: InlineMarkdownRules = inlineDefaultRules
        inlineRuleMap: MarkdownerRuleMap = defaultInlineMap
        blockRules: BlockMarkdownRules = blockDefaultRules
        blockRuleMap: MarkdownerRuleMap = defaultBlockMap

        constructor() {
            this.ast = new ASTHelper(this)
            this.dropRule = new RuleDropper(this)
            this.addRule = new RuleAdder(this)
        }

        init(props:MarkdownerProps={}) {
            this.markdownerProps = props
            let {tabSpaceNum, softBreak, geneId} = props
            this.blockParser = MarkdownBlockParser(this.blockRules, this.inlineRules, tabSpaceNum, softBreak, geneId)
            return this
        }


        parseInline(content: string) {
            if (!this.blockParser) {
                this.init()
            }

            return this.blockParser!.inlineParser!.new().parse(content)
        }

        parse(content: string): MarkdownAST[] {
            if (!this.blockParser) {
                this.init()
            }
            let trees = this.blockParser!.new().parse(content)
            this.ast.trees = trees

            return trees
        }

        new(props?:MarkdownerProps) {
            return new Markdowner().init(props??this.markdownerProps)
        }

        view = RUI(({content, children}: MarkdownerViewProps) => {
            let newContent: string
            if (content === undefined) {
                if (children === undefined) {
                    MarkdownerHelper.warn("Render", "must supply a content prop or set MarkdownerView's children as a single string")
                    return Div()
                } else {
                    newContent = children
                }
            } else {
                newContent = content
            }
            let markdownASTs = this.ast.incrementalParse(newContent)

            MarkdownerViewBase.init(this.blockRuleMap, this.inlineRuleMap)
            return  Div(
                MarkdownerDocument(markdownASTs)
            ).className("Markdowner-Document-root")
        })
    }
}

export const Markdowner = new C.Markdowner()
export function RUIMarkdowner(props: C.MarkdownerViewProps) {
    return Markdowner.view(props)
}
export function ReactMarkdowner(props: C.MarkdownerViewProps) {
    return Markdowner.view(props).asReactElement()
}

export {InlineRUIElements, InlineElements, BlockRUIElements, BlockElements}
export type {MarkdownerBlockRuleInterface, MarkdownerInlineRuleInterface}
