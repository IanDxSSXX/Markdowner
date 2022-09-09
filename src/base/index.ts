import {inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {blockDefaultRules, BlockMarkdownRules} from "../block/rules";
import {MarkdownBlockParser, C as BC} from "../block/parser";
import { renderToString } from 'react-dom/server'
import {Block} from "../render/block";
import {
    generateBlockSyntaxTree,
    MarkdownAST,
} from "./syntaxTree";
import {objectPop, objectValid} from "./utils";
import {uid} from "@iandx/reactui";

export namespace C {
    interface MarkdownerProps {
        inlineRules?: InlineMarkdownRules
        blockRules?: BlockMarkdownRules
        tabSpaceNum?: number
        useDefault?: boolean
        listStrictIndent?: boolean
        softBreak?: boolean
        geneId?: boolean
    }
    export class Markdowner {
        blockParser?: BC.MarkdownBlockParser
        ASTHelper: SyntaxTreeHelper
        markdownerProps: MarkdownerProps = {}

        constructor() {
            this.ASTHelper = new SyntaxTreeHelper(this)
        }

        init({inlineRules, blockRules, tabSpaceNum, useDefault, listStrictIndent, softBreak, geneId}:MarkdownerProps={}) {
            this.markdownerProps = {inlineRules, blockRules, tabSpaceNum, useDefault, listStrictIndent, softBreak, geneId}
            this.blockParser = MarkdownBlockParser(blockRules, useDefault, inlineRules, tabSpaceNum, listStrictIndent, softBreak, geneId)
            return this
        }

        parseInline(content: string) {
            if (!this.blockParser) {
                console.warn("markdowner-you should initialize markdowner by [Markdowner.init()] first")
                return content
            }

            return this.blockParser!.inlineParser!.new().parse(content)
        }

        parse(content: string): MarkdownAST[] {
            if (!this.blockParser) {
                console.warn("markdowner-you should initialize markdowner by [Markdowner.init()] first")
                return [{id: uid(), type: "error", level: "block"}]
            }
            let trees = this.blockParser!.new().parse(content)
            this.ASTHelper.trees = trees

            return trees
        }

        new(props:MarkdownerProps={}) {
            return new Markdowner().init(props)
        }

        render(content: string) {
            let markdownASTs = this.parse(content)
            let htmlContent = renderToString(Block({markdownASTs}).asReactElement())
            return htmlContent
        }

    }

    class SyntaxTreeHelper {
        trees: MarkdownAST[] = []
        markdowner: Markdowner

        constructor(markdowner: Markdowner) {
            this.markdowner = markdowner
        }

        flatten(willParseContent=false) {
            let currTrees = this.trees!
            if (willParseContent) {
                currTrees = this.parseASTContents(currTrees)
            }
            let flatTrees: MarkdownAST[] = []
            let newASHelper = new SyntaxTreeHelper(this.markdowner)
            for (let tree of currTrees) {
                flatTrees.push(tree)
                if (!!tree.children) {
                    newASHelper.trees = tree.children
                    flatTrees.push(...newASHelper.flatten())
                }
                if (tree.level==="block" && tree.content instanceof Array<MarkdownAST>) {
                    newASHelper.trees = tree.content
                    flatTrees.push(...newASHelper.flatten())
                }
            }

            return flatTrees
        }

        incrementalParse(content: string): MarkdownAST[] {
            this.markdowner.init({...this.markdowner.markdownerProps, geneId:true})
            let preTrees = this.trees
            let currTrees = this.markdowner.parse(content)

            if (currTrees.length === 1 && currTrees[0].type === "error") return currTrees

            let preTreesNoId = this.dropId(preTrees)
            let currTreesNoId = this.dropId(currTrees)
            let preTreesNoIdString = preTreesNoId.map(tree=>JSON.stringify(tree))
            let currTreesNoIdString = currTreesNoId.map(tree=>JSON.stringify(tree))

            for (let [idx, currTreeNoIdString] of currTreesNoIdString.entries()) {
                let indexInPreTrees = preTreesNoIdString.indexOf(currTreeNoIdString)
                if (indexInPreTrees !== -1) {
                    // ---- pre tree contain the new tree, assign the pre id to it's
                    preTreesNoIdString[indexInPreTrees] = "used"
                    currTrees[idx].id = preTrees[indexInPreTrees].id
                }
            }

            return currTrees
        }

        dropId(trees: MarkdownAST[]) {
            let treesString = JSON.stringify(trees)
            treesString = treesString.replaceAll(
                /{"id":".+?","type":/g,
            '{"type":')
            return JSON.parse(treesString) as MarkdownAST[]
        }

        parseSingleASTContent(markdownAST: MarkdownAST): MarkdownAST[] {
            let text = markdownAST.content

            let parseContent: any
            let ruleHandler = this.markdowner.blockParser!.blockRuleHandlers.filter(h => h.ruleName === markdownAST.type.replaceAll("Container", ""))
            if (ruleHandler.length === 1) {
                if (markdownAST.type.endsWith("Container")) {
                    parseContent = (text: string) => ruleHandler[0].parseContainerContent(text)
                } else {
                    parseContent = (text: string) => ruleHandler[0].parseContent(text)
                }
            } else {
                parseContent = (text: string) => this.markdowner.blockParser!.inlineParser!.new().parse(text)
            }

            return parseContent(text)
        }
        
        parseASTContents(markdownASTs: MarkdownAST[]): MarkdownAST[] {
            let newASTs: MarkdownAST[] = []
            for (let ast of markdownASTs) {
                newASTs.push({...ast, content:this.parseSingleASTContent(ast)})
            }
           return newASTs
        }
    }

}
export const Markdowner = new C.Markdowner()

