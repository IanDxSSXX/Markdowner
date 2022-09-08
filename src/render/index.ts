import {RUI} from "@iandx/reactui";
import {Block} from "./block";

export const MarkdownerDocument = RUI(({syntaxTrees}: any)=>
    Block({syntaxTrees, isDocument: true})
)