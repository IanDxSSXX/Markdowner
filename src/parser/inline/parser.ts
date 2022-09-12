import {generateMarkdownerAST as geneAST, MarkdownAST} from "../../base/syntaxTree";
import {InlineTagHandler} from "./regex";
import {inlineDefaultRules, InlineMarkdownRules} from "../rules";
import {capturingRegExp} from "../../base/utils";
import {uid} from "../../base/utils";
import {C as BC} from "../block/parser"


export namespace C {
    // ---- allow for 10^16 tokens
    const MAX_BASE = 16
    const uuid = uid()

    export class MarkdownInlineParser {
        inlineRuleHandlers: InlineTagHandler[] = []
        usedRuleHandlers: InlineTagHandler[] = []
        retriveRegex = new RegExp(`(<I[0-9]{${MAX_BASE}}-[0-9]{${MAX_BASE}}-${uuid}>)`, "g")
        inlineRules: InlineMarkdownRules = {}
        state: {[key:string]:any} = {}
        geneId = false

        constructor(inlineRules: InlineMarkdownRules = inlineDefaultRules, geneId=false, newInstance=false) {
            if (newInstance) return
            this.geneId = geneId
            this.inlineRules = inlineRules
            for (let ruleKey of Object.keys(inlineRules)) {
                this.inlineRuleHandlers.push(new InlineTagHandler(ruleKey, inlineRules[ruleKey], this))
            }
            this.inlineRuleHandlers = this.inlineRuleHandlers.sort((a, b)=>a.order-b.order)

        }

        private generateInlineAST(type: string, raw: string, content: MarkdownAST[] | string | any, props?: any): MarkdownAST {
            return geneAST(this.geneId, type, "inline", raw, content, props)
        }

        generateTextAST(text: string) {
            return this.generateInlineAST("Text", text, text)
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

        private retriveMatchedStore(replacedContent: string, matchedStore: string[][]): [string, MarkdownAST[]] {
            let isMatched = true
            let retrivedContent = ""
            let markdownASTs: MarkdownAST[] = []

            for (let subContent of replacedContent.split(this.retriveRegex)) {
                isMatched = !isMatched
                if (subContent === "") continue
                if (isMatched) {
                    let storeIdx = +subContent.slice(2, 2+MAX_BASE)
                    let matchedArrIdx = +subContent.slice(3+MAX_BASE, 3+2*MAX_BASE)
                    let storeContent: string = matchedStore[storeIdx][matchedArrIdx]
                    let rule = this.usedRuleHandlers[storeIdx]
                    let trimText =  rule.trimText(storeContent)

                    let content;

                    if (this.retriveRegex.test(storeContent)) {
                        if (rule.allowNesting) {
                            [trimText, content] = this.retriveMatchedStore(trimText, matchedStore)
                        } else {
                            trimText = this.retriveMatchedStore(trimText, matchedStore)[0]
                            content = trimText
                        }
                    } else if (rule.allowNesting && trimText !== storeContent) {
                        content = this.new().parse(trimText)
                    } else {
                        content = trimText
                    }


                    let rawContent = rule.trimedTextAddTag(trimText)

                    // ---- if not pass recheck, merge it to previous
                    if (rule.useRecheckMatch && !rule.recheckMatch(rawContent)) {
                        let preSyntaxTree = markdownASTs[markdownASTs.length-1]
                        if (!preSyntaxTree || preSyntaxTree.type !== "Text") {
                            markdownASTs.push(this.generateTextAST(rawContent))
                        } else {
                            preSyntaxTree.raw += rawContent
                            preSyntaxTree.content += rawContent
                        }
                    } else {
                        // ---- pass recheck add new tree
                        let props = rule.getProps(rawContent)
                        markdownASTs.push(this.generateInlineAST(
                            rule.ruleName, rawContent, content, props,
                        ))
                    }
                    retrivedContent += rawContent
                } else {
                    let preSyntaxTree = markdownASTs[markdownASTs.length-1]
                    if (!preSyntaxTree || preSyntaxTree.type !== "Text") {
                        markdownASTs.push(this.generateTextAST(subContent))
                    } else {
                        // ---- previous didn't pass recheck so merge current to last
                        preSyntaxTree.raw += subContent
                        preSyntaxTree.content += subContent
                    }
                    retrivedContent += subContent
                }
            }
            return [retrivedContent, markdownASTs]
        }


        parse(content: string): MarkdownAST[] {
            for (let rule of this.inlineRuleHandlers) {
                if (capturingRegExp(rule.regexString).test(content)) {
                    this.usedRuleHandlers.push(rule)
                }
            }

            if (this.usedRuleHandlers.length === 0) return [this.generateTextAST(content)]

            let [replacedContent, matchedStore] = this.split(content)
            let [_, markdownASTs] = this.retriveMatchedStore(replacedContent, matchedStore)

            return markdownASTs
        }

        new() {
            let newParser = new MarkdownInlineParser(undefined, undefined, true)
            newParser.geneId = this.geneId
            newParser.inlineRules = this.inlineRules
            newParser.inlineRuleHandlers = this.inlineRuleHandlers
            return newParser
        }
    }
}

export function MarkdownInlineParser(rules: InlineMarkdownRules={}, useDefault: boolean=true, geneId=false) {
    return new C.MarkdownInlineParser(rules, useDefault, geneId)
}