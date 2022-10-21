import {Prop, View, ViewWrapper} from "@renest/renest";
import {MarkdownAST} from "../base/ast";
import {List} from "@renest/component";
import BlockView from "./BlockView";
import {defaultInlineMap} from "./defaultRuleMaps/inline";
import {defaultBlockMap} from "./defaultRuleMaps/block";

export const MarkdownerMapBlock: {value?: any} = {}
export const MarkdownerMapInline: {value?: any} = {}

class DocumentView extends View {
    @Prop markdownASTs: MarkdownAST[] | any
    @Prop isDocument = false

    newMarkdownASTs = () =>
        this.markdownASTs
            .filter((markdownAST: MarkdownAST) => markdownAST.props?.visible ?? true)
            .map((markdownAST: MarkdownAST) => ({
                ast: markdownAST,
                order: markdownAST.props?.elementOrder ?? 1
            }))
            .sort((a: any, b: any) => a.order - b.order)
            .map((t: any) => t.ast)

    Body = () =>
        List(this.newMarkdownASTs(), (markdownAST: MarkdownAST, idx) =>
            BlockView({markdownAST})
                .key(!!markdownAST.id ? markdownAST.id : idx)
        )
            .width("100%")
            .spacing(this.isDocument ? "10px" : "0px")
            .alignment("leading")

}

export function MarkdownerDocument(blockASTs: MarkdownAST[]){
    return ViewWrapper(DocumentView)({markdownASTs: blockASTs, isDocument:true})
}

export function BlockRTElements(blockASTs: MarkdownAST[]){
    return MarkdownerDocument(blockASTs)
}

export function BlockElements(blockASTs: MarkdownAST[]){
    return MarkdownerDocument(blockASTs).asReactElement()
}
