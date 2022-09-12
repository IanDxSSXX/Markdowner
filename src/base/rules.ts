import {C} from "./index";
import {blockDefaultRules, DefaultBlockRules, DefaultInlineRules, inlineDefaultRules} from "../parser/rules";
import {BlockMarkdownTag, BlockMarkdownTagExtend} from "../parser/block/regex";
import {defaultBlockMap, defaultInlineMap, MarkdownerViewFunc} from "../renderer/ruleMap";
import {InlineMarkdownTag, InlineMarkdownTagExtend} from "../parser/inline/regex";
import {MarkdownerHelper} from "./helper";

export interface MarkdownerBlockRule {
    ruleName: string
    rule: BlockMarkdownTag | BlockMarkdownTagExtend
    view: MarkdownerViewFunc
}

export class RuleDropper {
    private markdowner: C.Markdowner
    constructor(markdowner: C.Markdowner) {
        this.markdowner = markdowner
    }

    block(ruleNames: DefaultBlockRules[] | DefaultBlockRules) {
        if (!(ruleNames instanceof Array)) ruleNames = [ruleNames]
        for (let ruleName of ruleNames) {
            delete this.markdowner.blockRules[ruleName]
            delete this.markdowner.blockRuleMap[ruleName]
        }
        this.markdowner.init(this.markdowner.markdownerProps)
    }

    inline(ruleNames: DefaultInlineRules[] | DefaultInlineRules) {
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

    block({name,rule,view}:{name: string, rule: BlockMarkdownTag | BlockMarkdownTagExtend | "default", view: MarkdownerViewFunc | "default"}) {
        if (rule === "default") {
            rule = blockDefaultRules[name]
            if (rule === undefined) {
                MarkdownerHelper.warn("Add block rule", `No default block rule of ruleName ${name}, skipping...`)
                return
            }
        }
        if (view === "default") {
            view = defaultBlockMap[name]
            if (view === undefined) {
                MarkdownerHelper.warn("Add block view", `No default block view of ruleName ${name}, skipping...`)
                return
            }
        }
        this.markdowner.blockRules[name] = rule
        this.markdowner.blockRuleMap[name] = view
        this.markdowner.init(this.markdowner.markdownerProps)
    }

    inline({name,rule,view}:{name: string, rule: InlineMarkdownTag | InlineMarkdownTagExtend | "default", view: MarkdownerViewFunc | "default"}) {
        if (rule === "default") {
            rule = inlineDefaultRules[name]
            if (rule === undefined) {
                MarkdownerHelper.warn("Add inline rule", `No default inline rule of ruleName ${name}, skipping...`)
                return
            }
        }
        if (view === "default") {
            view = defaultInlineMap[name]
            if (view === undefined) {
                MarkdownerHelper.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                return
            }
        }
        this.markdowner.inlineRules[name] = rule
        this.markdowner.inlineRuleMap[name] = view
        this.markdowner.init(this.markdowner.markdownerProps)
    }
}