import {generateBlockSyntaxTree as geneTree, MarkdownAST} from "../../base/syntaxTree";
import {
    BlockMarkdownTagExtend,
    BlockMarkdownTagType,
    BlockTagHandler,
    hardLineBreakRegex,
} from "./regex";
import {blockDefaultRules, BlockMarkdownRules} from "./rules";
import {capturingRegExp, correctRegExpKeywords} from "../../base/utils";
import {inlineDefaultRules, InlineMarkdownRules} from "../../inline/rules";
import {uid} from "@iandx/reactui";
import {C as IC, MarkdownInlineParser} from "../../inline/parser"

export let totalTime = 0
let t1, t2
let calTime = (t1:number, t2:number) => {
    totalTime += t2-t1
}
const now = ()=> performance.now()
export namespace C {
    function handleContainerRuleEnd(rules: BlockMarkdownRules, filterRuleName?: string, newLineAllowSpace?: boolean) {
        if (filterRuleName !== undefined) {
            rules = Object
                .keys(rules).filter(k=>k!==filterRuleName)
                .reduce((obj, key) => {
                    return Object.assign(obj, {
                        [key]: rules[key]
                    });
                }, {});
        }

        let blockRuleTagExtends = Object.values(rules).filter(rule=>Object.keys(rule as any).includes("tags"))
        // ---- break new line
        let tags: string[]
        if (newLineAllowSpace??false) {
            tags = [`(?:\\n(?!\\n))`]
        } else {
            tags = [`(?:\\n(?! |\\n))`]
        }
        for (let tagExtend of blockRuleTagExtends as BlockMarkdownTagExtend[]) {
            let leadingTags = tagExtend.tags.leading
            if (!!leadingTags) {
                if (!(leadingTags instanceof Array)) leadingTags = [leadingTags]
                for (let t of leadingTags) {
                    tags.push(correctRegExpKeywords(t))
                }
            }
            let roundTags = tagExtend.tags.round
            if (!!roundTags) {
                if (!(roundTags instanceof Array)) roundTags = [roundTags]
                for (let t of roundTags) {
                    tags.push(correctRegExpKeywords(t))
                }
            }
            let exactTags = tagExtend.tags.exact
            if (!!exactTags) {
                if (!(exactTags instanceof Array)) exactTags = [exactTags]
                for (let t of exactTags) {
                    tags.push(correctRegExpKeywords(t))
                }
            }
            let wrapTags = tagExtend.tags.wrap
            if (!!wrapTags) {
                if (!(wrapTags[0] instanceof Array)) wrapTags = [wrapTags] as [BlockMarkdownTagType, BlockMarkdownTagType][]
                for (let t of wrapTags as [BlockMarkdownTagType, BlockMarkdownTagType][]) {
                    tags.push(correctRegExpKeywords((t)[0]))
                }
            }
        }

        return "(?:" + tags.join(")|(?:") + ")"
    }

    function trimNewLine(content: string) {
        return content.replace(new RegExp(`(^\\n)|(\\n$)`), "").trimEnd()
    }

    function handleAsciiConflict(content: string) {
        let newContent = content
        // ---- non-break line
        newContent = newContent.replaceAll('\xa0', " ")
        // ---- space
        newContent = newContent.replaceAll('\u00A0', " ")

        return newContent
    }

    function generateBlockSyntaxTree(type: string, raw?: string, content?: any, props?: any,
                                     children?: MarkdownAST[]): MarkdownAST {
        return geneTree(type, "block", raw, content, props, children)
    }

    export class MarkdownBlockParser {
        blockRuleHandlers: BlockTagHandler[] = []
        containerRuleHandlers: BlockTagHandler[] = []
        leafRuleHandlers: BlockTagHandler[] = []
        containerSplitString = ""
        leafSplitString = ""
        blockRules: BlockMarkdownRules = {}
        inlineRules: InlineMarkdownRules = {}
        tabSpaceNum: number = 2
        listStrictIndent: boolean = false
        softBreak: boolean = true
        inlineParser?: IC.MarkdownInlineParser

        willParseContent: boolean = true

        constructor(blockRules: BlockMarkdownRules = {}, useDefault: boolean = true, inlineRules: InlineMarkdownRules = inlineDefaultRules,
                    tabSpaceNum=2, listStrictIndent=false, softBreak=true, willParseContent=true,newInstance=false) {
            if (newInstance) return
            this.willParseContent = willParseContent
            this.tabSpaceNum = tabSpaceNum
            this.listStrictIndent = listStrictIndent
            this.softBreak = softBreak
            let allRules = blockRules
            if (useDefault) allRules = {...blockDefaultRules, ...allRules}
            this.blockRules = allRules
            this.inlineRules = inlineRules
            this.inlineParser = MarkdownInlineParser(inlineRules, false)

            for (let ruleKey of Object.keys(allRules)) {
                this.blockRuleHandlers.push(new BlockTagHandler(ruleKey, allRules[ruleKey], this.tabSpaceNum, handleContainerRuleEnd(allRules, ruleKey), this))
            }
            this.blockRuleHandlers = this.blockRuleHandlers.sort((a, b)=>a.order-b.order)
        }

        private eliminateRedundantIndents(content: string) {
            if (this.listStrictIndent) return content
            // ---1 "* you have 0 space \n"
            //      " * I have 1, allowed, eliminate it \n"
            // ---2 "* you have 0 space \n"
            //      " * I have 1, allowed, eliminate it \n"
            //      "  * he has 2, allowed because I have 1, and you have 0, eliminate it too"
            //      "    * she has 4, not allowed because he has 2, don't eliminate it"
            // ---3 " * you have 1 space \n"
            //      "   * I have 3, so I'm a child \n"
            //      "  * he has 2, allowed because you have 0, and you have 0, eliminate it too"
            //      " * she has 1, allowed because he has 2, don't eliminate it"
            let lines = content.split("\n")
            let spaceCounts: number[] = []
            for (let line of lines) {
                let spaceCount = line.search(/(?<=^ *)[^ ]/g)
                if (!spaceCounts.includes(spaceCount)) {
                    spaceCounts.push(spaceCount)
                }
            }
            spaceCounts = spaceCounts.sort()
            if (spaceCounts.length === 0) {
                return content
            }
            let maxSpaceCount: number = 0
            for (let [idx, spaceCount] of spaceCounts.entries()) {
                if ((spaceCount-spaceCounts[idx-1]??maxSpaceCount) < this.tabSpaceNum) {
                    maxSpaceCount = spaceCount
                }
            }

            return content.replaceAll(new RegExp(`(?<=\\n|^) {0,${maxSpaceCount}}`, "g"), "")
        }



        private parseContainerItem(containerItem: string, containerRule: BlockTagHandler): MarkdownAST {
            // -**- do it again, a bit different
            //      this is for
            //      * abc
            //          1. edf
            //          * ghi
            //      => [* abc, 1. edf\n* ghi]

            let containerRuleEnd = handleContainerRuleEnd(this.blockRules, undefined, true)
            let regexArray = []
            for (let tag of (containerRule.tags.leading! ?? []) as Array<BlockMarkdownTagType>) {
                let regexTag = correctRegExpKeywords(tag)
                regexArray.push(
                    `(?:(?<=\\n|^)${regexTag}(?:.|\\n)+?(?=(?:\\n {${this.tabSpaceNum}}(?:${containerRuleEnd}))|$))`)
            }
            let containerInnerSplitString = regexArray.join("|")
            let containerItemArr = containerItem.split(capturingRegExp(containerInnerSplitString)).filter(i=>i!=="")

            // ---- replace \n with space
            let [props, currentContent] = BlockTagHandler.defaultGetProp(containerItemArr[0])
            currentContent = containerRule.trimText(currentContent).trim()
            if (this.softBreak) {
                currentContent = currentContent.replaceAll(/(?<! {2}|\n|\\)\n/g, " ").replaceAll(hardLineBreakRegex, "\n")
            }

            props = {...props, ...containerRule.getProps(containerItem)};

            // ---- children
            let childrenContent = trimNewLine(containerItemArr.slice(1).join("")).replaceAll(new RegExp(`(?<=\\n|^) {${this.tabSpaceNum}}`, "g"), "")
            let children: MarkdownAST[] | undefined
            if (childrenContent !== "" && !containerRule.dropContainer) {
                children = this.new().parse(childrenContent)
            }

            return generateBlockSyntaxTree(
                containerRule.ruleName, containerItem,
                this.willParseContent ? containerRule.parseContent(currentContent) : currentContent,
                props, children
            )
        }

        private parseContainerBlock(containerBlock: string): MarkdownAST[] {
            for (let containerRule of this.containerRuleHandlers) {
                // ---- it will certainly match a rule
                if (capturingRegExp(containerRule.regexString).test(containerBlock)) {
                    // ---- inner split to get items
                    // -**- do it again, a bit different
                    //      this is for
                    //      * abc
                    //          * edf
                    //      * ghi
                    //      => [* abc\n* edf, * ghi]
                    let containerRuleEnd = handleContainerRuleEnd({
                        [containerRule.ruleName]: this.blockRules[containerRule.ruleName]
                    })
                    let regexArray = []
                    for (let tag of (containerRule.tags.leading! ?? []) as Array<BlockMarkdownTagType>) {
                        let regexTag = correctRegExpKeywords(tag)
                        regexArray.push(
                            `(?:(?<=\\n|^)${regexTag}(?:.|\\n)+?(?=\\n(?:${containerRuleEnd}|$)))`)
                    }
                    let containerInnerSplitString = regexArray.join("|")
                    let containerItemString = containerBlock.split(capturingRegExp(containerInnerSplitString)).map(i=>trimNewLine(i)).filter(i=>i!=="")

                    if (containerRule.dropContainer) {
                        return [generateBlockSyntaxTree(
                            containerRule.ruleName, containerBlock,
                            this.willParseContent ? containerRule.parseContent(containerBlock) : containerBlock,
                            containerRule.getProps(containerBlock)
                        )]
                    } else {
                        let items: MarkdownAST[] = []
                        for (let item of containerItemString) {
                            items.push(this.parseContainerItem(item, containerRule))
                        }

                        return [generateBlockSyntaxTree(
                            containerRule.ruleName+"Container", containerBlock,
                            this.willParseContent ? containerRule.parseContainerContent(containerBlock) : containerBlock,
                            containerRule.getContainerProps(containerBlock), items
                        )]
                    }
                }
            }
            return []
        }

        private splitNewLine(content: string): MarkdownAST[] {
            // ---- '\n\n' | '\\\n' | '  \n' hard split
            // ---- space < tab regarded as 0
            // ---- regex be like /(?<=\n)\n/g
            let markdownASTs: MarkdownAST[] = []
            let blocks = content.split(hardLineBreakRegex).map(b=>trimNewLine(b).trimEnd()).filter(b=>b!=="")
            for (let block of blocks) {
                let [props, trimedText] = BlockTagHandler.defaultGetProp(block)
                if (this.softBreak) {
                    trimedText = trimedText.replaceAll("\n", " ")
                }
                let subContent = this.willParseContent ? this.inlineParser!.new().parse(trimedText) : trimedText
                markdownASTs.push(generateBlockSyntaxTree("Paragraph", block, subContent, props))
            }
            return markdownASTs
        }

        private splitLeaf(content: string) {
            if (this.leafSplitString === "") return this.splitNewLine(content)
            let markdownASTs: MarkdownAST[] = []

            let subBlocks = content.split(capturingRegExp(this.leafSplitString)).map(b=>trimNewLine(b).trimEnd())

            let currNonLeafBlockContent = ""
            let lastRecheckFailed = false
            let isLeafBlock = true

            for (let block of subBlocks) {
                isLeafBlock = !isLeafBlock
                if (block === "") continue
                if (isLeafBlock) {
                    for (let leafRule of this.leafRuleHandlers) {
                        if (capturingRegExp(leafRule.regexString).test(block)) {
                            if (leafRule.useRecheckMatch && !leafRule.recheckMatch(block)) {
                                // ---- if not pass recheck, merge it to previous
                                currNonLeafBlockContent += "\n" + block
                                lastRecheckFailed = true
                            } else {

                                // ---- get last non leaf block syntax tree
                                if (currNonLeafBlockContent !== "") {
                                    markdownASTs.push(...this.splitNewLine(currNonLeafBlockContent))
                                    currNonLeafBlockContent = ""
                                }
                                // ---- get current leaf block syntax tree
                                let [props, trimText] = BlockTagHandler.defaultGetProp(block)
                                trimText = leafRule.trimText(trimText)
                                props = leafRule.getProps(block) ?? {}
                                markdownASTs.push(generateBlockSyntaxTree(
                                    leafRule.ruleName, block,
                                    this.willParseContent ? leafRule.parseContent(trimText) : trimText,
                                    props,
                                ))

                            }

                            break
                        }
                    }
                } else {
                    if (lastRecheckFailed) {
                        lastRecheckFailed = false
                        currNonLeafBlockContent += "\n" + block
                    } else {
                        currNonLeafBlockContent = block
                    }
                }
            }


            // ---- need appendix because didn't enter line 220
            if (currNonLeafBlockContent !== "") {
                markdownASTs.push(...this.splitNewLine(currNonLeafBlockContent))
            }

            return markdownASTs
        }


        private splitContainer(block: string): MarkdownAST[] {
            if (this.containerSplitString === "") return this.splitLeaf(block)
            // ---- eliminate redundant incident spaces
            let headmostContainerBlock = this.eliminateRedundantIndents(block)
            // ---- split leafBlocks and containerBlock
            let markdownASTs: MarkdownAST[] = []

            // t1 = now()
            let allSubBlocks = headmostContainerBlock.split(capturingRegExp(this.containerSplitString)).map(b => trimNewLine(b))
            let isContainerBlock = true

            for (let block of allSubBlocks) {
                isContainerBlock = !isContainerBlock
                if (block === "") continue
                if (isContainerBlock) {
                    markdownASTs.push(...this.parseContainerBlock(block))
                } else {
                    markdownASTs.push(...this.splitLeaf(block))
                }
            }
            // t2 = now()
            // calTime(t1,t2)

            return markdownASTs
        }

        parse(content: string): MarkdownAST[] {
            this.containerRuleHandlers = []
            this.leafRuleHandlers = []
            for (let rule of this.blockRuleHandlers) {
                if (capturingRegExp(rule.regexString).test(content)) {
                    if (rule.blockType === "container") {
                        this.containerRuleHandlers.push(rule)
                    } else {
                        this.leafRuleHandlers.push(rule)
                    }
                }
            }
            this.containerSplitString = this.containerRuleHandlers.map(rule=>rule.regexString).join("|")
            this.leafSplitString = this.leafRuleHandlers.map(rule=>rule.regexString).join("|")

            content = content.replaceAll("\t", " ".repeat(this.tabSpaceNum))
            content = handleAsciiConflict(content)
            // ---- empty line
            content = content.replaceAll(/\r\n|\r/g, "\n")
            content = content.replaceAll(/(?<=\n) +\n/g, "\n")

            return this.splitContainer(content)
        }

        new() {
            let newParser = new MarkdownBlockParser(undefined, undefined, undefined, undefined, true)
            newParser.willParseContent = this.willParseContent
            newParser.tabSpaceNum = this.tabSpaceNum
            newParser.softBreak = this.softBreak
            newParser.listStrictIndent = this.listStrictIndent
            newParser.blockRules = this.blockRules
            newParser.inlineRules = this.inlineRules
            newParser.inlineParser = this.inlineParser
            return newParser
        }
    }
}

export function MarkdownBlockParser(rules: BlockMarkdownRules={}, useDefault: boolean=true, inlineRules: InlineMarkdownRules=inlineDefaultRules,
                                    tabSpaceNum: number=2, listStrictIndent=false, softBreak=true) {
    return new C.MarkdownBlockParser(rules, useDefault, inlineRules, tabSpaceNum, listStrictIndent, softBreak)
}
