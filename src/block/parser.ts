import {ContainerItem, generateMarkdownerAST as geneAST, MarkdownAST} from "../base/syntaxTree";
import {
    BlockMarkdownTagExtend,
    BlockMarkdownTagType,
    BlockTagHandler,
    hardLineBreakRegex,
} from "./regex";
import {blockDefaultRules, BlockMarkdownRules} from "./rules";
import {capturingRegExp, correctRegExpKeywords, objectValid} from "../base/utils";
import {inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {C as IC, MarkdownInlineParser} from "../inline/parser"
import {InlineTagHandler} from "../inline/regex";


export namespace C {
    interface BlockAST {
        type: string
        raw: string
        isContainer: boolean
        rule?: BlockTagHandler
        containerLevel?: number
        containerItems?: { item:BlockAST, content:BlockAST[] }[]
        level?: number
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



    class Container {
        containers: BlockAST[] = []

        get level() {
            return this.containers.length - 1
        }
        get isEmpty() {
            return this.containers.length === 0
        }
        get lastContainer() {
            return this.containers[this.containers.length-1]
        }
        get lastChild() {
            return this.lastContainer.containerItems![this.lastContainer.containerItems!.length-1]
        }

        open(blockAST: BlockAST) {
            this.containers.push({
                type: blockAST.type,
                raw: blockAST.raw,
                rule: blockAST.rule,
                isContainer: true,
                level: blockAST.level,
                containerItems: [{
                    item: blockAST,
                    content: []
                }]
            })
        }
        close(blockASTs: BlockAST[]) {
            if (this.level === -1) return
            let poppedContainer = this.containers.pop()!
            if (!!this.lastContainer) {
                for (let container of this.containers) {
                    container.raw += poppedContainer.raw
                }
                this.addContent(poppedContainer)
            } else {
                blockASTs.push(poppedContainer)
            }
        }
        addItem(blockAST: BlockAST) {
            this.lastContainer.raw! += blockAST.raw
            this.lastContainer.containerItems!.push({
                item: blockAST,
                content: []
            })
        }
        addContent(blockAST: BlockAST) {
            this.lastChild.content.push(blockAST)
        }

        addText(blockAST: BlockAST) {
            for (let container of this.containers) {
                container.raw += " " + blockAST.raw
            }
            this.lastChild.item.raw += " " + blockAST.raw
        }

        itemTypeOf(blockAST: BlockAST) {
            return blockAST.type === this.lastContainer.type
        }

    }

    export class MarkdownBlockParser {
        blockRuleHandlers: BlockTagHandler[] = []
        usedRuleHandlerMap: {[key:string]: BlockTagHandler} = {}
        splitString = ""
        blockRules: BlockMarkdownRules = {}
        inlineRules: InlineMarkdownRules = {}
        tabSpaceNum: number = 2
        softBreak: boolean = true
        inlineParser: IC.MarkdownInlineParser = new IC.MarkdownInlineParser({})
        state: {[key:string]: any} = {}
        geneId: boolean = false

        newLineRegexString = /(?:(?:\n|^)| {2} *|\\ *) */.source

        constructor(blockRules: BlockMarkdownRules = blockDefaultRules, inlineRules: InlineMarkdownRules = inlineDefaultRules,
                    tabSpaceNum=2, softBreak=true, geneId=false, newInstance=false) {
            if (newInstance) return
            this.geneId = geneId
            this.tabSpaceNum = tabSpaceNum
            this.softBreak = softBreak
            this.blockRules = blockRules
            this.inlineRules = inlineRules
            this.inlineParser = MarkdownInlineParser(inlineRules, geneId)

            for (let ruleKey of Object.keys(blockRules)) {
                this.blockRuleHandlers.push(new BlockTagHandler(ruleKey, blockRules[ruleKey], this.tabSpaceNum, this))
            }
            this.blockRuleHandlers = this.blockRuleHandlers.sort((a, b)=>a.order-b.order)
        }

        private generateMarkdownerAST(type: string, raw: string, content: MarkdownAST[] | ContainerItem[] | any, props?: any): MarkdownAST {
            return geneAST(this.geneId, type, "block", raw, content, props)
        }
        private geneMarkdownAST(blockAST: BlockAST): MarkdownAST {
            let parse = (blockAST: BlockAST): {raw: string, trimedText: string, props: any} => {
                let raw = trimNewLine(blockAST.raw)

                let [props, trimedText] = BlockTagHandler.defaultGetProp(raw)
                trimedText = trimedText = blockAST.rule?.trimText(trimedText) ?? trimedText
                if (this.softBreak && (blockAST.isContainer || blockAST.type === "Paragraph")) {
                    trimedText = trimedText.replaceAll(/\n */g, " ").trim().replaceAll(/\\$/g, "").trim()
                } else {
                    trimedText = trimedText.trim()
                }

                return {raw, trimedText, props}
            }
            let {raw, trimedText, props} = parse(blockAST)

            let content: any
            props = {...props, ...blockAST.rule?.getProps(raw) ?? {}}

            if (blockAST.isContainer) {
                content = blockAST.containerItems!.map(({item, content}): ContainerItem => {
                    let {trimedText} = parse(item)
                    return {
                        item: item.rule?.parseContent(trimedText) ?? [this.inlineParser!.generateTextAST(trimedText)],
                        content: content.map(c=>this.geneMarkdownAST(c))
                    }
                } )
                props = {...props, level: blockAST.level}
            } else {
                if (!!blockAST.rule) {
                    content = blockAST.rule!.parseContent(trimedText)
                } else {
                    content = this.inlineParser!.new().parse(trimedText)
                }
            }

            return this.generateMarkdownerAST(blockAST.type, raw, content, props)
        }

        split(content: string) {
            if (this.splitString === "") return [this.geneMarkdownAST({
                type: "Paragraph", raw: content, isContainer: false, containerItems: []
            })]
            let splitContent = content.split(capturingRegExp(this.splitString))

            let t = this.tabSpaceNum
            let splitBlockASTs: BlockAST[] = []
            let isMatched = true

            for (let block of splitContent) {
                isMatched = !isMatched
                if (block === "") continue
                let blockAST: BlockAST
                if (new RegExp(`${this.newLineRegexString}(?=$)`, "g").test(block)) {
                    blockAST = {type: "NewLine", raw: block, isContainer: false}
                } else {
                    blockAST = {type: "Paragraph", raw: block, isContainer: false}

                    if (isMatched) {
                        for (let rule of Object.values(this.usedRuleHandlerMap)) {
                            if (rule.regex.test(block) && rule.recheckMatch(block)) {
                                blockAST.type = rule.ruleName
                                blockAST.isContainer = rule.blockType === "container"
                                blockAST.rule = rule
                                if (blockAST.isContainer) blockAST.containerItems = []
                                break
                            }
                        }
                    }
                }
                splitBlockASTs.push(blockAST)
            }

            let blockASTs: BlockAST[] = []
            let container = new Container()
            let preBlockAST: BlockAST | undefined = undefined
            for (let blockAST of splitBlockASTs) {
                if (blockAST.type === "NewLine") {
                    preBlockAST = blockAST
                    continue
                }
                blockAST.level = Math.floor((blockAST.raw.match(new RegExp(`^\\n?( {${t}})*(?=[^ ])`, "g")) ?? [""])[0].length / 2)

                if (blockAST.level > container.level + 1 || (blockAST.raw.startsWith(" ") && blockAST.level === 0)) {
                    blockAST.type = "Paragraph"
                    blockAST.isContainer = false
                    blockAST.rule = undefined
                    blockAST.level = 0
                }

                if (blockAST.type === "Paragraph" && !!preBlockAST && preBlockAST.type !== "NewLine") {
                    blockAST.type = "AppendText"
                }

                if (blockAST.type === "AppendText") {
                    if (container.level !== -1) {
                        container.addText(blockAST)
                    } else {
                        blockASTs[blockASTs.length-1].raw += blockAST.raw
                    }

                    preBlockAST = blockAST
                    continue
                }

                // ---- if new level is smaller than container level
                // ---- close >= blockAST.level's container
                while (blockAST.level < container.level) {
                    container.close(blockASTs)
                }

                if (blockAST.level === container.level) {
                    if (container.itemTypeOf(blockAST) && preBlockAST?.type !== "NewLine") {
                        container.addItem(blockAST)
                    } else {
                        container.close(blockASTs)
                    }
                }
                // ---- if blockAST.level === container.level, already closed a container, so now blockAST.level === container.level + 1
                if (blockAST.level === container.level + 1) {
                    if (blockAST.isContainer) {
                        container.open(blockAST)
                    } else if (container.level > -1) {
                        container.addContent(blockAST)
                    } else {
                        blockASTs.push(blockAST)
                    }
                }

                preBlockAST = blockAST
            }

            while (container.level !== -1) {
                container.close(blockASTs)
            }

            let markdownASTs: MarkdownAST[] = []
            for (let blockAST of blockASTs) {
                markdownASTs.push(this.geneMarkdownAST(blockAST))
            }

            return markdownASTs

        }
        parse(content: string) {
            for (let rule of this.blockRuleHandlers) {
                if (capturingRegExp(rule.regexString).test(content)) {
                    this.usedRuleHandlerMap[rule.ruleName] = rule
                }
            }
            let splitStrings = Object.values(this.usedRuleHandlerMap).map(rule=>rule.regexString)
            splitStrings.unshift(`(?:${this.newLineRegexString}(?=\\n|$))`)
            this.splitString = splitStrings.join("|")

            content = content.replaceAll("\t", " ".repeat(this.tabSpaceNum))
            content = handleAsciiConflict(content)
            // ---- empty line
            content = content.replaceAll(/\r\n|\r/g, "\n")

            return this.split(content)
        }

        new() {
            let newParser = new MarkdownBlockParser(undefined, undefined, undefined, undefined, undefined, true)
            newParser.blockRuleHandlers = this.blockRuleHandlers
            newParser.blockRules = this.blockRules
            newParser.inlineRules = this.inlineRules
            newParser.tabSpaceNum = this.tabSpaceNum
            newParser.softBreak = this.softBreak
            newParser.inlineParser = this.inlineParser.new()
            newParser.geneId = this.geneId
            return newParser

        }
    }
}

export function MarkdownBlockParser(rules: BlockMarkdownRules={}, inlineRules: InlineMarkdownRules=inlineDefaultRules,
                                    tabSpaceNum: number=2, softBreak=true, geneId=false) {
    return new C.MarkdownBlockParser(rules, inlineRules, tabSpaceNum, softBreak, geneId)
}
