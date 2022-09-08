import {generateBlockSyntaxTree as geneTree, MarkdownSyntaxTree} from "../base/syntaxTree";
import {InlineTagHandler} from "./regex";
import {inlineDefaultRules, InlineMarkdownRules} from "./rules";
import {capturingRegExp} from "../base/utils";
import {uid} from "@iandx/reactui";



export namespace C {
    // ---- allow for 10^16 tokens
    const MAX_BASE = 16
    const uuid = uid()

    function generateInlineSyntaxTree(type: string, raw?: string, content?: any, props?: any,
                                     children?: MarkdownSyntaxTree[]): MarkdownSyntaxTree {
        return geneTree(type, "inline", raw, content, props, children)
    }

    export class MarkdownInlineParser {
        inlineRuleHandlers: InlineTagHandler[] = []
        usedRuleHandlers: InlineTagHandler[] = []
        retriveRegex = new RegExp(`(<I[0-9]{${MAX_BASE}}-[0-9]{${MAX_BASE}}-${uuid}>)`, "g")
        inlineRules: InlineMarkdownRules = {}

        constructor(rules: InlineMarkdownRules = {}, useDefault: boolean = true, newInstance=false) {
            if (newInstance) return
            let allRules = rules
            if (useDefault) allRules = {...inlineDefaultRules, ...allRules}
            this.inlineRules = allRules
            for (let ruleKey of Object.keys(allRules)) {
                this.inlineRuleHandlers.push(new InlineTagHandler(ruleKey, allRules[ruleKey]))
            }
            this.inlineRuleHandlers = this.inlineRuleHandlers.sort((a, b)=>a.order-b.order)

        }

        private split(content: string): [string, string[][]] {
            let matchedStore: string[][] = []
            let replacedContent: string = content
            for (let [storeIdx, rule] of this.usedRuleHandlers.entries()) {
                let matchedArr: string[] = [];
                replacedContent = replacedContent.replaceAll(capturingRegExp(rule.regexString), (str) => {
                    matchedArr.push(str)
                    return `<I${String(storeIdx).padStart(MAX_BASE,"0")}-${String(matchedArr.length-1).padStart(MAX_BASE,"0")}-${uuid}>`
                })

                matchedStore.push(matchedArr)
            }

            return [replacedContent, matchedStore]
        }

        private retriveMatchedStore(replacedContent: string, matchedStore: string[][]): [string, MarkdownSyntaxTree[]] {
            let isMatched = true
            let retrivedContent = ""
            let syntaxTrees: MarkdownSyntaxTree[] = []

            for (let subContent of replacedContent.split(this.retriveRegex)) {
                isMatched = !isMatched
                if (subContent === "") continue
                if (isMatched) {
                    let storeIdx = +subContent.slice(2, 2+MAX_BASE)
                    let matchedArrIdx = +subContent.slice(3+MAX_BASE, 3+2*MAX_BASE)
                    let content: string = matchedStore[storeIdx][matchedArrIdx]
                    let rule = this.usedRuleHandlers[storeIdx]
                    let trimText =  rule.trimText(content)

                    let childrenSyntaxTrees;
                    if (this.retriveRegex.test(content)) {
                        if (rule.allowNesting) {
                            [trimText, childrenSyntaxTrees] = this.retriveMatchedStore(trimText, matchedStore)
                        } else {
                            trimText = this.retriveMatchedStore(trimText, matchedStore)[0]
                        }
                    } else if (rule.allowNesting && trimText !== content) {
                        childrenSyntaxTrees = this.new().parse(trimText)
                    }

                    let rawContent = rule.trimedTextAddTag(trimText)

                    // ---- if not pass recheck, merge it to previous
                    if (rule.useRecheckMatch && !rule.recheckMatch(rawContent)) {
                        let preSyntaxTree = syntaxTrees[syntaxTrees.length-1]
                        if (!preSyntaxTree || preSyntaxTree.type !== "Text") {
                            syntaxTrees.push(generateInlineSyntaxTree("Text", rawContent, rawContent))
                        } else {
                            preSyntaxTree.raw += rawContent
                            preSyntaxTree.content += rawContent
                        }
                    } else {
                        // ---- pass recheck add new tree
                        let props = rule.getProps(rawContent)
                        syntaxTrees.push(generateInlineSyntaxTree(
                            rule.ruleName, rawContent, trimText, props,
                            childrenSyntaxTrees
                        ))
                    }
                    retrivedContent += rawContent
                } else {
                    let preSyntaxTree = syntaxTrees[syntaxTrees.length-1]
                    if (!preSyntaxTree || preSyntaxTree.type !== "Text") {
                        syntaxTrees.push(generateInlineSyntaxTree("Text", subContent, subContent))
                    } else {
                        // ---- previous didn't pass recheck so merge current to last
                        preSyntaxTree.raw += subContent
                        preSyntaxTree.content += subContent
                    }
                    retrivedContent += subContent
                }
            }
            return [retrivedContent, syntaxTrees]
        }


        parse(content: string): MarkdownSyntaxTree[] {
            for (let rule of this.inlineRuleHandlers) {
                if (capturingRegExp(rule.regexString).test(content)) {
                    this.usedRuleHandlers.push(rule)
                }
            }

            if (this.usedRuleHandlers.length === 0) return [generateInlineSyntaxTree("Text", content, content)]

            let [replacedContent, matchedStore] = this.split(content)
            let [_, syntaxTrees] = this.retriveMatchedStore(replacedContent, matchedStore)

            return syntaxTrees
        }

        new() {
            let newParser = new MarkdownInlineParser(undefined, undefined, true)
            newParser.inlineRules = this.inlineRules
            newParser.inlineRuleHandlers = this.inlineRuleHandlers

            return newParser
        }
    }
}

export function MarkdownInlineParser(rules: InlineMarkdownRules={}, useDefault: boolean=true) {
    return new C.MarkdownInlineParser(rules, useDefault)
}