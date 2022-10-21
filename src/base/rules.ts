import {blockDefaultRules, DefaultBlockRules, DefaultInlineRules, inlineDefaultRules} from "../parser/rules";
import {BlockMarkdownTag, BlockMarkdownTagExtend} from "../parser/block/regex";
import {InlineMarkdownTag, InlineMarkdownTagExtend} from "../parser/inline/regex";
import {MarkdownerLogger} from "./logger";
import {defaultInlineMap} from "../renderer/defaultRuleMaps/inline";
import {MarkdownerReactViewFunc, MarkdownerRTViewFunc, MarkdownerViewFunc} from "../renderer/utils";
import {defaultBlockMap} from "../renderer/defaultRuleMaps/block";
import {InlineElements, InlineRTElements} from "../renderer/InlineView";
import {MarkdownerClass} from "./markdowner";


export interface MarkdownerBlockRuleInterface {
    name: string
    rule: BlockMarkdownTag | BlockMarkdownTagExtend | "default"
    view?: MarkdownerReactViewFunc | "default"
    RTView?: MarkdownerRTViewFunc | "default"
}

export interface MarkdownerInlineRuleInterface {
    name: string
    rule: InlineMarkdownTag | InlineMarkdownTagExtend | "default"
    view?: MarkdownerReactViewFunc | "default"
    RTView?: MarkdownerRTViewFunc | "default"
}


export class RuleDropper {
    private markdowner: MarkdownerClass
    constructor(markdowner: MarkdownerClass) {
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
    private markdowner: MarkdownerClass

    constructor(markdowner: MarkdownerClass) {
        this.markdowner = markdowner
    }

    block({name,rule,view,RTView}:MarkdownerBlockRuleInterface) {
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
        if (!!RTView) {
            // ---- RTView
            let newRTView: any = RTView
            if (RTView === "default") {
                newRTView = defaultInlineMap[name]
                if (newRTView === undefined) {
                    MarkdownerLogger.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                    return
                }
            }
            this.markdowner.inlineRuleMap[name] = newRTView
        }

        this.markdowner.init(this.markdowner.markdownerProps)
    }

    blocks(addedBlocks:MarkdownerBlockRuleInterface[]) {
        for (let block of addedBlocks) {
            this.block(block)
        }
    }

    inline({name,rule,view,RTView}:MarkdownerInlineRuleInterface) {
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
        if (!!RTView) {
            // ---- RTView
            let newRTView: any
            if (RTView === "default") {
                newRTView = defaultInlineMap[name]
                if (newRTView === undefined) {
                    MarkdownerLogger.warn("Add inline view", `No default inline view of ruleName ${name}, skipping...`)
                    return
                }
            } else {
                newRTView = (content: any, props: any) => {
                    if (content instanceof Array && content.length>0 && content[0].level==="inline") {
                        content = InlineRTElements(content)
                    }
                    return (RTView as MarkdownerViewFunc)(content, props)
                }
            }
            this.markdowner.inlineRuleMap[name] = newRTView
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