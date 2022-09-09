import {RUI} from "@iandx/reactui";
import {MarkdownDocument} from "./block";
import {Div} from "@iandx/reactui/tag";

export const MarkdownerDocument = RUI(({markdownASTs}: any)=>
    Div(
        MarkdownDocument({markdownASTs, isDocument: true})
    ).className("Markdowner-Document-root")
)