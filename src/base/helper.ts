import {MarkdownAST} from "./syntaxTree";
import {C} from "./index";
import {BlockMarkdownRules, DefaultBLockRule} from "../parser/rules";
import {BlockMarkdownTag, BlockMarkdownTagExtend} from "../parser/block/regex";
import {ReactUIBase} from "@iandx/reactui/core";
import {ReactElement} from "react";
import {DefaultInlineRule, InlineMarkdownRules} from "../parser/rules";
import {MarkdownerRuleMap, MarkdownerViewFunc} from "../render/ruleMap";
import {InlineMarkdownTag, InlineMarkdownTagExtend} from "../parser/inline/regex";

export class MarkdownerHelper {
    static warn(position: string, warning: string) {
        console.warn(`Markdowner-${position}: ${warning}`)
    }
}

export class ASTHelper {
    trees: MarkdownAST[] = []
    markdowner: C.Markdowner

    constructor(markdowner: C.Markdowner) {
        this.markdowner = markdowner
    }

    flatten() {
        return ASTHelper.flattenASTs(this.trees)
    }

    static flattenASTs(asts: MarkdownAST[]): MarkdownAST[] {
        let flatASTs: MarkdownAST[] = []
        for (let ast of asts) {
            flatASTs.push(ast)
            if (ast.content instanceof Array<MarkdownAST>) {
                flatASTs.push(...ASTHelper.flattenASTs(ast.content))
            }
        }
        return flatASTs
    }

    findInlineItems(typeName: string, condition: (inlineAST: MarkdownAST) => boolean=()=>true) {
        return this.flatten().filter(t=>t.type===typeName && condition(t))
    }

    findBlocks(typeName: string, condition: (blockAST: MarkdownAST) => boolean=()=>true) {
        return this.trees.filter(t=>t.type===typeName && condition(t))
    }

    incrementalParse(content: string): MarkdownAST[] {
        this.markdowner.init({...this.markdowner.markdownerProps, geneId:true})
        let preTrees = this.trees
        let currTrees = this.markdowner.parse(content)

        if (currTrees.length === 1 && currTrees[0].type === "error") return currTrees

        let preTreesNoId = ASTHelper.dropId(preTrees)
        let currTreesNoId = ASTHelper.dropId(currTrees)
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

    static dropId(trees: MarkdownAST[]) {
        let treesString = JSON.stringify(trees)
        treesString = treesString.replaceAll(
            /,"id":".+?"}/g,
            '}')
        return JSON.parse(treesString) as MarkdownAST[]
    }

}


export interface MarkdownerBlockRule {
    ruleName: string
    rule: BlockMarkdownTag | BlockMarkdownTagExtend
    view: (content: string|MarkdownAST[]|any, props: any)=>ReactUIBase|ReactElement
}


export class RuleDropper {
    private markdowner: C.Markdowner
    constructor(markdowner: C.Markdowner) {
        this.markdowner = markdowner
    }

    block(ruleNames: DefaultBLockRule[] | DefaultBLockRule) {
        if (!(ruleNames instanceof Array)) ruleNames = [ruleNames]
        for (let ruleName of ruleNames) {
            delete this.markdowner.blockRules[ruleName]
            delete this.markdowner.blockRuleMap[ruleName]
        }
        this.markdowner.init(this.markdowner.markdownerProps)
    }

    inline(ruleNames: DefaultInlineRule[] | DefaultInlineRule) {
        if (!(ruleNames instanceof Array)) ruleNames = [ruleNames]
        for (let ruleName of ruleNames) {
            delete this.markdowner.inlineRules[ruleName]
            delete this.markdowner.inlineRuleMap[ruleName]
        }
        this.markdowner.init(this.markdowner.markdownerProps)
    }
}


export class RuleAdder {
    private markdowner: C.Markdowner

    constructor(markdowner: C.Markdowner) {
        this.markdowner = markdowner
    }

    block({name,rule,view}:{name: string, rule: BlockMarkdownTag | BlockMarkdownTagExtend, view: MarkdownerViewFunc}) {
        this.markdowner.blockRules[name] = rule
        this.markdowner.blockRuleMap[name] = view
        this.markdowner.init(this.markdowner.markdownerProps)
    }

    inline({name,rule,view}:{name: string, rule: InlineMarkdownTag | InlineMarkdownTagExtend, view: MarkdownerViewFunc}) {
        this.markdowner.inlineRules[name] = rule
        this.markdowner.inlineRuleMap[name] = view
        this.markdowner.init(this.markdowner.markdownerProps)
    }
}