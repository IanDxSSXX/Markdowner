import {correctRegExpKeywords} from "../base/utils";
import {inlineDefaultRules, InlineMarkdownRules} from "../inline/rules";
import {MarkdownInlineParser} from "../inline/parser";
import {C} from "./parser";
import {MarkdownerHelper} from "../base/helper";

// ---- declaring
export type BlockMarkdownTagType = string | RegExp

export interface BlockMarkdownTag {
    round?: BlockMarkdownTagType[] | BlockMarkdownTagType
    wrap?: [BlockMarkdownTagType, BlockMarkdownTagType][] | [BlockMarkdownTagType, BlockMarkdownTagType]
    exact?: BlockMarkdownTagType[] | BlockMarkdownTagType
    leading?: BlockMarkdownTagType[] | BlockMarkdownTagType
}

export interface BlockMarkdownTagExtend {
    tags: BlockMarkdownTag
    getProps?: ((raw: string, state: {[key:string]: any}, handler: BlockTagHandler) => any | ((raw: string, state: {[key:string]: any}, handler: BlockTagHandler) => any)[])
    trimText?: (raw: string, ...args: any) => string
    recheckMatch?: ((raw: string) => boolean | ((raw: string) => boolean)[])
    order?: number
    parseContent?: (text: string, handler: BlockTagHandler) => any
    blockType?: "container" | "leaf"
}

export const hardLineBreakRegex = /(?:\n| {2} *|\\)\n/g
// ---- regexTag
export class BlockTagHandler {
    ruleName: string
    tags: BlockMarkdownTag
    regexString: string = ""
    useRecheckMatch: boolean = false
    order: number = 1
    inlineRules: InlineMarkdownRules = inlineDefaultRules
    blockType: "container" | "leaf" = "leaf"
    get regex(): RegExp {
        return new RegExp(this.regexString, "g")
    }

    tabSpaceNum: number

    parseContent: (text: string) => any = text => this.defaultParseContent(text)
    parseContainerContent: (text: string) => any = _ => undefined
    getProps: (raw: string) => any = () => {}
    getContainerProps: (raw: string) => any = () => {}
    trimText: (raw: string) => string = this.defaultTrimText
    recheckMatch: (raw: string) => boolean = () => true


    parser: C.MarkdownBlockParser

    constructor(ruleName:string, tags: BlockMarkdownTag | BlockMarkdownTagExtend, tabSpaceNum: number, parser: C.MarkdownBlockParser) {
        this.ruleName = ruleName
        this.tabSpaceNum = tabSpaceNum
        this.parser = parser
        if (Object.keys(tags).includes("tags")) {
            let tagExtend = tags as BlockMarkdownTagExtend
            this.tags = BlockTagHandler.getTags(tagExtend.tags)
            this.parseExtend(tagExtend)
        } else {
            this.tags = BlockTagHandler.getTags(tags as BlockMarkdownTag)
        }

        this.initRegex();
    }

    // ---- initialization
    private parseExtend(tagExtend: BlockMarkdownTagExtend) {
        // ---- first check block type, if it's container
        if ((tagExtend.blockType ?? "leaf") === "container") {
            this.blockType = "container"
            // ---- only support leading
            if (!tagExtend.tags.leading || !!tagExtend.tags.round || !!tagExtend.tags.wrap || !!tagExtend.tags.exact) {
                MarkdownerHelper.warn("Block-tag", `container block [${this.ruleName}] only support leading tags`)
            }
        }

        if (tagExtend.order !== undefined) this.order = tagExtend.order
        if (!!tagExtend.trimText) this.trimText = tagExtend.trimText!

        if (!!tagExtend.recheckMatch) {
            this.useRecheckMatch = true
            this.recheckMatch = (raw: string) => {
                let recheckMatchArr: any = tagExtend.recheckMatch
                if (!(tagExtend.recheckMatch! instanceof Array)) recheckMatchArr = [recheckMatchArr]
                for (let recheckMatch of recheckMatchArr) {
                    if (!recheckMatch(raw)) {
                        return false
                    }
                }
                return true
            }
        }
        if (!!tagExtend.parseContent) this.parseContent = (text: string) => tagExtend.parseContent!(text, this)
        if (!!tagExtend.getProps) this.getProps = (text: string) => {
            let getPropsArr: any = tagExtend.getProps
            if (!(tagExtend.getProps! instanceof Array)) getPropsArr = [getPropsArr]
            let props = {}
            for (let getPropsFunc of getPropsArr) {
                props = {...props, ...getPropsFunc(text, this.parser.state, this)}
            }
            // ---- block extend props using [blockProp={}]
            return props
        }
    }

    private static getTags(tags: BlockMarkdownTag): BlockMarkdownTag {
        let newTags: BlockMarkdownTag = {...tags}
        if (!!newTags.round && !(Array.isArray(newTags.round!))) newTags.round = [newTags.round! as any];
        if (!!newTags.leading && !(Array.isArray(newTags.leading!))) newTags.leading = [newTags.leading! as any];
        if (!!newTags.wrap && !Array.isArray(newTags.wrap[0])) newTags.wrap = [newTags.wrap! as any];
        if (!!newTags.exact && !(Array.isArray(newTags.exact!))) newTags.exact = [newTags.exact as any];

        return newTags as BlockMarkdownTag
    }

    protected initRegex() {
        let regexArray: string[] = []
        // ---* parse multiline [T]text[T]
        for (let tag of (this.tags.round! ?? []) as Array<BlockMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            regexArray.push(`(?:(?:\\n|^)${regexTag}(?:.|\\n)+?${regexTag}(?=\\n|$))`)
        }
        // // ---* parse multiline [T]text[/T]
        for (let [leftTag, rightTag] of (this.tags.wrap! ?? []) as Array<[BlockMarkdownTagType, BlockMarkdownTagType]>) {
            let regexLeftTag = correctRegExpKeywords(leftTag)
            let regexRightTag = correctRegExpKeywords(rightTag)
            regexArray.push(`(?:(?:\\n|^)${regexLeftTag}(?:.|\\n)+?${regexRightTag}(?=\\n|$))`)
        }
        // ---* parse single line [T]text
        //      special for leading, because it doesn't have an end symbol
        for (let tag of (this.tags.leading! ?? []) as Array<BlockMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            regexArray.push(`(?:(?:\\n|^)${regexTag}.+(?=\\n|$))`)
        }

        // ---* parse [T]
        for (let tag of (this.tags.exact ?? []) as Array<BlockMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            regexArray.push(`(?:${regexTag})`)
        }
        this.regexString = regexArray.join("|")
    }

    // ---- syntax tree default func
    private defaultTrimText(text: string) {
        let trimText = text
        // ---- trim round tag like *abc*
        for (let tag of (this.tags.round ?? []) as Array<BlockMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            trimText = trimText.replaceAll(new RegExp(`^${regexTag}|${regexTag}$`, "g"), "")
        }
        // ---- trim wrap tag like <span></span>
        for (let [leftTag, rightTag] of (this.tags.wrap ?? []) as Array<[BlockMarkdownTagType, BlockMarkdownTagType]>) {
            let regexLeftTag = correctRegExpKeywords(leftTag)
            let regexRightTag = correctRegExpKeywords(rightTag)
            trimText = trimText.replaceAll(new RegExp(`^${regexLeftTag}|${regexRightTag}$`, "g"), "")
        }

        // ---- trim leading tag like *abc
        for (let tag of (this.tags.leading ?? []) as Array<BlockMarkdownTagType>) {
            let regexTag = correctRegExpKeywords(tag)
            trimText =  trimText.replaceAll(new RegExp(`^${regexTag}`, "g"), "")
        }

        return trimText
    }

    defaultParseContent(text: string) {
        return this.parser.inlineParser!.new().parse(text)
    }

    static defaultGetProp(text: string): [any, string] {
        let blockPropMatch = text.match(/\[blockProp=.+?]/g)
        if (blockPropMatch) {
            let blockPropString = blockPropMatch[0].replace("[blockProp=", "").replace("]", "").trim()
            let trimedText = text.replace(blockPropMatch[0], "")
            try {
                let blockProp = JSON.parse(blockPropString)
                return [{blockProp}, trimedText]
            } catch (e) {
                MarkdownerHelper.warn("Block-getProp", `${blockPropString} is not valid as a json blockProp, treat is as a string`)
                return [{blockProp: blockPropString}, trimedText]
            }
        }
        return [{}, text]
    }

}