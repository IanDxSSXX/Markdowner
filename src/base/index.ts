import {DefaultInlineRule, inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {blockDefaultRules, BlockMarkdownRules, DefaultBLockRule} from "../block/rules";
import {MarkdownBlockParser, C as BC} from "../block/parser";
import { renderToString } from 'react-dom/server'
import {
    MarkdownAST,
} from "./syntaxTree";
import {uid} from "./utils";
import {MarkdownDocument, MarkdownerViewBase} from "../render/view";
import {ASTHelper, MarkdownerHelper, RuleAdder, RuleDropper} from "./helper";
import {defaultBlockMap, defaultInlineMap, MarkdownerRuleMap, MarkdownerViewFunc} from "../render/ruleMap";
import {Div} from "@iandx/reactui/tag";

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

        render(content: string) {
            return renderToString(this.View({content}))
        }

        View({content, incrementalParse}: {content:string, incrementalParse?:boolean}) {
            let markdownASTs = incrementalParse??false ? this.parse(content) : this.ast.incrementalParse(content)
            MarkdownerViewBase.init(this.blockRuleMap, this.inlineRuleMap)
            console.log(markdownASTs)
            return  Div(
                MarkdownDocument({markdownASTs, isDocument: true})
            ).className("Markdowner-Document-root").asReactElement()
        }
    }

}
export const Markdowner = new C.Markdowner()
export const MarkdownerView = (props: {content:string, incrementalParse?:boolean}) => Markdowner.View(props)
