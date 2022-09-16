import {C as BC, MarkdownBlockParser} from "../parser/block/parser";
import {ASTHelper} from "./astHelper";
import {IncrementalParse} from "./incrementalParse"
import {RuleAdder, RuleDropper} from "./rules";
import {blockDefaultRules, BlockMarkdownRules, inlineDefaultRules, InlineMarkdownRules} from "../parser/rules";
import {defaultBlockMap, defaultInlineMap, MarkdownerRuleMap} from "../renderer/ruleMap";
import {MarkdownAST} from "./ast";
import {MarkdownerLogger} from "./logger";
import {RUI} from "@iandx/reactui";
import {Div} from "@iandx/reactui/tag";
import {MarkdownerDocument, MarkdownerViewBase} from "../renderer/view";

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

        incrementalParse(content: string) {
            this.init({...this.markdownerProps, geneId:true})
            return IncrementalParse.parse(this.ast.trees, this.parse(content))
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

        debug(level: number=0) {
            MarkdownerLogger.setDebugLevel(level)
        }

        view = RUI(({content, children}: MarkdownerViewProps) => {
            let newContent: string
            if (content === undefined) {
                if (children === undefined) {
                    MarkdownerLogger.warn("Render", "must supply a content prop or set MarkdownerView's children as a single string")
                    return Div()
                } else {
                    newContent = children
                }
            } else {
                newContent = content
            }
            let markdownASTs = this.incrementalParse(newContent)
            MarkdownerLogger.debug("generatedAST", markdownASTs, 0)

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
