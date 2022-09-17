import {C} from "./markdowner";
import {blockDefaultRules, DefaultBlockRules, DefaultInlineRules, inlineDefaultRules} from "../parser/rules";
import {BlockMarkdownTag, BlockMarkdownTagExtend} from "../parser/block/regex";
import {
    defaultBlockMap,
    defaultInlineMap,
    MarkdownerReactViewFunc,
    MarkdownerRUIViewFunc,
    MarkdownerViewFunc
} from "../renderer/ruleMap";
import {InlineMarkdownTag, InlineMarkdownTagExtend} from "../parser/inline/regex";
import {MarkdownerLogger} from "./logger";
import {InlineElements, InlineRUIElements} from "../renderer/view";


export interface MarkdownerBlockRuleInterface {
    name: string
    rule: BlockMarkdownTag | BlockMarkdownTagExtend | "default"
    view?: MarkdownerReactViewFunc | "default"
    ruiView?: MarkdownerRUIViewFunc | "default"
}

export interface MarkdownerInlineRuleInterface {
    name: string
    rule: InlineMarkdownTag | InlineMarkdownTagExtend | "default"
    view?: MarkdownerReactViewFunc | "default"
    ruiView?: MarkdownerRUIViewFunc | "default"
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

    block({name,rule,view,ruiView}:MarkdownerBlockRuleInterface) {
        if (rule === "default") {
            rule = blockDefaultRules[name]
            if (rule === undefined) {
                MarkdownerLogger.warn("Add block rule", `No default block rule of ruleName ${name}, skipping...`)
                return
            }
        }

        this.markdowner.blockRules[name] = rule
        if (!!view) {
            let newView: any = view
            if (view === "default") {
                newView = defaultBlockMap[name]
                if (view === undefined) {
                    MarkdownerLogger.warn("Add block view", `No default block view of ruleName ${name}, skipping...`)
                    return
                }
            }
            this.markdowner.blockRuleMap[name] = newView
        }
        if (!!ruiView) {
            // ---- ruiView
            let newRuiView: any = ruiView
            if (ruiView === "default") {
                newRuiView = defaultInlineMap[name]
                if (newRuiView === undefined) {
                    MarkdownerLogger.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                    return
                }
            }
            this.markdowner.inlineRuleMap[name] = newRuiView
        }

        this.markdowner.init(this.markdowner.markdownerProps)
    }

    blocks(addedBlocks:MarkdownerBlockRuleInterface[]) {
        for (let block of addedBlocks) {
            this.block(block)
        }
    }

    inline({name,rule,view,ruiView}:MarkdownerInlineRuleInterface) {
        // ---- rule
        if (rule === "default") {
            rule = inlineDefaultRules[name]
            if (rule === undefined) {
                MarkdownerLogger.warn("Add inline rule", `No default inline rule of ruleName ${name}, skipping...`)
                return
            }
        }
        this.markdowner.inlineRules[name] = rule

        if (!!view) {
            // ---- react view
            let newView: any
            if (view === "default") {
                newView = defaultInlineMap[name]
                if (newView === undefined) {
                    MarkdownerLogger.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                    return
                }
            } else {
                newView = (content: any, props: any) => {
                    if (content instanceof Array && content.length>0 && content[0].level==="inline") {
                        content = InlineElements(content)
                    }
                    return (view as MarkdownerViewFunc)(content, props)
                }
            }
            this.markdowner.inlineRuleMap[name] = newView
        }
        if (!!ruiView) {
            // ---- ruiView
            let newRuiView: any
            if (ruiView === "default") {
                newRuiView = defaultInlineMap[name]
                if (newRuiView === undefined) {
                    MarkdownerLogger.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                    return
                }
            } else {
                newRuiView = (content: any, props: any) => {
                    if (content instanceof Array && content.length>0 && content[0].level==="inline") {
                        content = InlineRUIElements(content)
                    }
                    return (ruiView as MarkdownerViewFunc)(content, props)
                }
            }
            this.markdowner.inlineRuleMap[name] = newRuiView
        }

        // ---- reinit
        this.markdowner.init(this.markdowner.markdownerProps)
    }

    inlines(addedInlines:MarkdownerInlineRuleInterface[]) {
        for (let inline of addedInlines) {
            this.inline(inline)
        }
    }
}