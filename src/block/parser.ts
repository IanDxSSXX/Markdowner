import {generateBlockSyntaxTree as geneTree, MarkdownAST} from "../base/syntaxTree";
import {
    BlockMarkdownTagExtend,
    BlockMarkdownTagType,
    BlockTagHandler,
    hardLineBreakRegex,
} from "./regex";
import {blockDefaultRules, BlockMarkdownRules} from "./rules";
import {capturingRegExp, correctRegExpKeywords, objectValid} from "../base/utils";
import {inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {uid} from "@iandx/reactui";
import {C as IC, MarkdownInlineParser} from "../inline/parser"
import {InlineTagHandler} from "../inline/regex";
import {Block} from "../render/block";

export let totalTime = 0
let t1, t2
let calTime = (t1:number, t2:number) => {
    totalTime += t2-t1
}
const now = ()=> performance.now()


export namespace C {

    interface BlockAST {
        type: string
        raw: string
        isContainerItem?: boolean
        rule?: BlockTagHandler
        containerLevel?: number
        children: BlockAST[]
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
                                     children?: MarkdownAST[], geneId?:boolean): MarkdownAST {
        return geneTree(type, "block", raw, content, props, children, geneId)
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
            return this.lastContainer.children![this.lastContainer.children!.length-1]
        }
        
        open(blockAST: BlockAST) {
            this.containers.push({
                type: blockAST.type + "Container",
                raw: blockAST.raw,
                rule: blockAST.rule,
                children: [blockAST]
            })
        }
        close(blockASTs: BlockAST[]): BlockAST {
            let poppedContainer = this.containers.pop()!
            if (!!this.lastContainer) {
                this.lastContainer.raw += poppedContainer.raw!
                this.lastChild.children!.push(poppedContainer)
            } else {
                blockASTs.push(poppedContainer)
            }

            return poppedContainer
        }
        addItem(blockAST: BlockAST) {
            this.lastContainer.raw! += blockAST.raw
            this.lastContainer.children!.push(blockAST)
        }

        addText(blockAST: BlockAST) {
            this.lastChild.raw += blockAST.raw
            this.lastContainer.raw += blockAST.raw
        }

        itemTypeOf(blockAST: BlockAST) {
            return blockAST.type === this.lastContainer.type.replace("Container", "")
        }

    }

    export class MarkdownBlockParser {
        blockRuleHandlers: BlockTagHandler[] = []
        usedRuleHandlerMap: {[key:string]: BlockTagHandler} = {}
        splitString = ""
        blockRules: BlockMarkdownRules = {}
        inlineRules: InlineMarkdownRules = {}
        tabSpaceNum: number = 2
        listStrictIndent: boolean = false
        softBreak: boolean = true
        inlineParser?: IC.MarkdownInlineParser
        willParseContent: boolean = true
        state: {[key:string]: any} = {}
        geneId: boolean = false

        constructor(blockRules: BlockMarkdownRules = {}, useDefault: boolean = true, inlineRules: InlineMarkdownRules = inlineDefaultRules,
                    tabSpaceNum=2, listStrictIndent=false, softBreak=true, willParseContent=true, geneId=false, newInstance=false) {
            if (newInstance) return
            this.willParseContent = willParseContent
            this.geneId = geneId
            this.tabSpaceNum = tabSpaceNum
            this.listStrictIndent = listStrictIndent
            this.softBreak = softBreak
            let allRules = blockRules
            if (useDefault) allRules = {...blockDefaultRules, ...allRules}
            this.blockRules = allRules
            this.inlineRules = inlineRules
            this.inlineParser = MarkdownInlineParser(inlineRules, false)

            for (let ruleKey of Object.keys(allRules)) {
                this.blockRuleHandlers.push(new BlockTagHandler(ruleKey, allRules[ruleKey], this.tabSpaceNum, this))
            }
            this.blockRuleHandlers = this.blockRuleHandlers.sort((a, b)=>a.order-b.order)
        }

        geneMarkdownAST(blockAST: BlockAST): MarkdownAST {
            let raw = trimNewLine(blockAST.raw)
            let [props, trimText] = BlockTagHandler.defaultGetProp(raw)
            trimText = blockAST.rule?.trimText(trimText) ?? trimText
            if (this.softBreak && (blockAST.isContainerItem === true || blockAST.type === "Paragraph")) {
                trimText = trimText.replaceAll(/\n */g, " ").trim().replaceAll(/\\$/g, "").trim()
            } else {
                trimText = trimText.replaceAll(/(?<=\n|^) +/g, " ").trim().replaceAll(/\\$/g, "").trim()
            }

            let content: any = trimText
            let children: MarkdownAST[] = []


            if (blockAST.type.endsWith("Container")) {
                props = {...props, ...blockAST.rule?.getContainerProps(raw) ?? {}}
                children = blockAST.children.map(child => this.geneMarkdownAST(child))

                if (this.willParseContent) {
                    content = blockAST.rule!.parseContainerContent(trimText)
                }
            } else {
                props = {...props, ...blockAST.rule?.getProps(raw) ?? {}}
                children = blockAST.children.map(child => this.geneMarkdownAST(child))

                if (this.willParseContent) {
                    if (!!blockAST.rule) {
                        content = blockAST.rule!.parseContent(trimText)
                    } else {
                        content = this.inlineParser!.new().parse(trimText)
                    }
                }
            }

            return generateBlockSyntaxTree(blockAST.type, raw, content, props, children, this.geneId)
        }

        split(content: string) {
            if (this.splitString === "") return [this.geneMarkdownAST({
                type: "Paragraph", raw: content, children: []
            })]
            let splitContent = content.split(capturingRegExp(this.splitString)).filter(l=>l!=="")

            let t = this.tabSpaceNum
            let blockASTs: BlockAST[] = []
            let container = new Container()

            let preBlockAST: BlockAST | undefined = undefined
            for (let block of splitContent) {
                let blockAST: BlockAST = {type: "Paragraph", raw: block, isContainerItem: false, children: []}
                for (let rule of Object.values(this.usedRuleHandlerMap)) {
                    if (rule.regex.test(block) && rule.recheckMatch(block)) {
                        blockAST.type = rule.ruleName
                        blockAST.isContainerItem = rule.blockType === "container"
                        blockAST.rule = rule
                        break
                    }
                }
                let newLevel = block.match(new RegExp(`(?<=^(?: {${t}})*) {${t}}(?=(?: {${t}})+|[^ ])`, "g"))?.length ?? 0
                if (newLevel > container.level + 1 || (block.startsWith(" ") && newLevel === 0)) {
                    blockAST.type = "Paragraph"
                    blockAST.isContainerItem = false
                }

                // console.log(blockAST,this.usedRuleHandlerMap)
                // console.log(blockAST)
                if (!!preBlockAST && preBlockAST.type !== "NewLine" && preBlockAST.isContainerItem && blockAST.type === "Paragraph") {
                    if (container.level > -1) {
                        container.addText(blockAST)
                    } else {
                        blockASTs[blockASTs.length-1].raw += blockAST.raw
                    }
                    continue
                }
                // console.log("--")
                if (blockAST.type === "NewLine") {
                    if (container.level !== -1) {
                        // ---- if new line, add a blank line to container for its raw's integrity
                        container.addText(blockAST)
                    }
                } else {
                    // ---- if new level is smaller than container level
                    // ---- close >= newLevel's container
                    while (newLevel < container.level) {
                        container.close(blockASTs)
                    }
                    if (newLevel === container.level) {
                        if (container.level===0) {
                            if (container.itemTypeOf(blockAST)) {
                                container.addItem(blockAST)
                            } else if (blockAST.isContainerItem) {
                                container.close(blockASTs)
                                container.open(blockAST)
                            } else {
                                container.close(blockASTs)
                                blockASTs.push(blockAST)
                            }
                       } else {
                            if (container.itemTypeOf(blockAST) || !blockAST.isContainerItem) {
                                container.addItem(blockAST)
                            } else {
                                container.close(blockASTs)
                                container.open(blockAST)
                            }
                       }
                    } else if (blockAST.isContainerItem && newLevel === container.level + 1) {
                        container.open(blockAST)
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
            this.splitString = Object.values(this.usedRuleHandlerMap).map(rule=>rule.regexString).join("|")

            content = content.replaceAll("\t", " ".repeat(this.tabSpaceNum))
            content = handleAsciiConflict(content)
            // ---- empty line
            content = content.replaceAll(/\r\n|\r/g, "\n")

            return this.split(content)
        }

        new() {
            let newParser = new MarkdownBlockParser(undefined, undefined, undefined, undefined, true)
            newParser.blockRuleHandlers = this.blockRuleHandlers
            newParser.blockRules = this.blockRules
            newParser.inlineRules = this.inlineRules
            newParser.listStrictIndent = this.listStrictIndent
            newParser.tabSpaceNum = this.tabSpaceNum
            newParser.softBreak = this.softBreak
            newParser.inlineParser = this.inlineParser?.new()
            newParser.willParseContent = this.willParseContent
            newParser.geneId = this.geneId
            return newParser

        }
    }
}

export function MarkdownBlockParser(rules: BlockMarkdownRules={}, useDefault: boolean=true, inlineRules: InlineMarkdownRules=inlineDefaultRules,
                                    tabSpaceNum: number=2, listStrictIndent=false, softBreak=true, willParseContent=true, geneId=false) {
    return new C.MarkdownBlockParser(rules, useDefault, inlineRules, tabSpaceNum, listStrictIndent, softBreak, willParseContent, geneId)
}
