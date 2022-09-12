import {inlineDefaultRules, InlineMarkdownRules, blockDefaultRules, BlockMarkdownRules} from "../parser/rules";
import {MarkdownBlockParser, C as BC} from "../parser/block/parser";
import {MarkdownAST} from "./syntaxTree";
import {uid} from "./utils";
import {MarkdownDocument, MarkdownerViewBase, InlineElements, InlineRUIElements} from "../renderer/view";
import {ASTHelper, MarkdownerHelper} from "./helper";
import {defaultBlockMap, defaultInlineMap, MarkdownerRuleMap, MarkdownerViewFunc} from "../renderer/ruleMap";
import {Div} from "@iandx/reactui/tag";
import {RUI} from "@iandx/reactui";
import {RuleAdder, RuleDropper} from "./rules";

export namespace C {
    interface MarkdownerProps {
        tabSpaceNum?: number
        softBreak?: boolean
        geneId?: boolean
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
                MarkdownerHelper.warn("ParseInline", "You should initialize markdowner by (Markdowner.init()) first")
                return content
            }

            return this.blockParser!.inlineParser!.new().parse(content)
        }

        parse(content: string): MarkdownAST[] {
            if (!this.blockParser) {
                MarkdownerHelper.warn("Parse", "You should initialize markdowner by (Markdowner.init()) first")
                return [{id: uid(), type: "Paragraph", level: "block", raw: "Error", content: "you should initialize markdowner by [Markdowner.init()] first"}]
            }
            let trees = this.blockParser!.new().parse(content)
            this.ast.trees = trees

            return trees
        }

        new(props:MarkdownerProps={}) {
            return new Markdowner().init(props)
        }

        view = RUI(({content, incrementalParse, children}: any) => {
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
            let markdownASTs = incrementalParse??false ? this.parse(newContent) : this.ast.incrementalParse(newContent)

            MarkdownerViewBase.init(this.blockRuleMap, this.inlineRuleMap)
            return  Div(
                MarkdownDocument({markdownASTs, isDocument: true})
            ).className("Markdowner-Document-root")
        })
    }

}
export const Markdowner = new C.Markdowner()
export const MarkdownerView = (props: {children?: string, content?:string, incrementalParse?:boolean}) => Markdowner.view(props).asReactElement()
export {InlineElements, InlineRUIElements}