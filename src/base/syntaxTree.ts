import {objectValid} from "./utils";
import {uid} from "@iandx/reactui";

export interface MarkdownSyntaxTree {
    id?: string
    type: string
    level: "block" | "inline"
    raw?: string
    content?: any
    children?: MarkdownSyntaxTree[]
    props?: any
}




export function generateBlockSyntaxTree(type: string, level: "block"|"inline", raw?: string, content?: any, props?: any,
                                 children?: MarkdownSyntaxTree[]): MarkdownSyntaxTree {
    let syntaxTree: MarkdownSyntaxTree = {id: uid(), type, level}
    if (raw !== undefined) syntaxTree.raw = raw
    if (content !== undefined) syntaxTree.content = content
    if (objectValid(props)) syntaxTree.props = props
    if (!!children) syntaxTree.children = children
    return syntaxTree
}

