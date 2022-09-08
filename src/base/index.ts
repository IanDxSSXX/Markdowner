import {inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {blockDefaultRules, BlockMarkdownRules} from "../block/rules";
import {MarkdownBlockParser, C as BC} from "../block/parser";
import { renderToString } from 'react-dom/server'
import {Block} from "../render/block";
import {
    generateBlockSyntaxTree,
    MarkdownSyntaxTree,
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
    }
    export class Markdowner {
        blockParser?: BC.MarkdownBlockParser
        ASTHelper: SyntaxTreeHelper

        constructor() {
            this.ASTHelper = new SyntaxTreeHelper(this)
        }

        init({inlineRules, blockRules, tabSpaceNum, useDefault, listStrictIndent, softBreak}:MarkdownerProps={}) {
            this.blockParser = MarkdownBlockParser(blockRules, useDefault, inlineRules, tabSpaceNum, listStrictIndent, softBreak)
        }

        parseInline(content: string) {
            if (!this.blockParser) {
                console.warn("markdowner-you should initialize markdowner by [Markdowner.init()] first")
                return content
            }

            return this.blockParser!.inlineParser!.new().parse(content)
        }

        parse(content: string): MarkdownSyntaxTree[] {
            if (!this.blockParser) {
                console.warn("markdowner-you should initialize markdowner by [Markdowner.init()] first")
                return [{id: uid(), type: "error", level: "block"}]
            }
            let trees = this.blockParser!.parse(content)
            this.ASTHelper.trees = trees

            return trees
        }

        render(content: string) {
            let syntaxTrees = this.parse(content)
            let htmlContent = renderToString(Block({syntaxTrees}).asReactElement())
            return htmlContent
        }

    }

    class SyntaxTreeHelper {
        trees: MarkdownSyntaxTree[] = []
        markdowner: Markdowner

        constructor(markdowner: Markdowner) {
            this.markdowner = markdowner
        }

        flatten() {
            let flatTrees: MarkdownSyntaxTree[] = []
            let newASHelper = new SyntaxTreeHelper(this.markdowner)
            for (let tree of this.trees!) {
                flatTrees.push(tree)
                if (!!tree.children) {
                    newASHelper.trees = tree.children
                    flatTrees.push(...newASHelper.flatten())
                }
                if (tree.level==="block" && tree.content instanceof Array<MarkdownSyntaxTree>) {
                    newASHelper.trees = tree.content
                    flatTrees.push(...newASHelper.flatten())
                }
            }

            return flatTrees
        }

        incrementalParse(content: string): MarkdownSyntaxTree[] {
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

        dropId(trees: MarkdownSyntaxTree[]) {
            let treesString = JSON.stringify(trees)
            treesString = treesString.replaceAll(
                /{"id":".+?","type":/g,
            '{"type":')
            return JSON.parse(treesString) as MarkdownSyntaxTree[]
        }

    }

}
export const Markdowner = new C.Markdowner()

