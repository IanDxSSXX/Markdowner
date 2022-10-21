import {Converter} from "@renest/renest";

export const {Div, Span, Em, Strong, A, Table, Tbody, Tr, Th, Td, Blockquote, Input, Img} =
    Converter({
        Div: "div",
        Span: "span",
        Em: "em",
        Strong: "strong",
        A: "a",
        Table: "table",
        Tbody: "tbody",
        Tr: "tr",
        Th: "th",
        Td: "td",
        Blockquote: "blockquote",
        Input: "input",
        Img: "img"
    })