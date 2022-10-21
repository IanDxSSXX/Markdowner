import {ElementView, RTBase} from "@renest/renest";
import {ContainerItem, MarkdownAST} from "../base/ast";
import {ReactElement} from "react";

export function toRTElement(element: any) {
    if (element.IAmRT) {
        return element
    } else {
        return ElementView(element)
    }
}

export type MarkdownerViewFunc = (content: string|MarkdownAST[]|ContainerItem[]|any, props: any)=>any|ReactElement
export interface MarkdownerRuleMap {[key:string]: MarkdownerViewFunc}


export type MarkdownerReactViewFunc = (content: string|MarkdownAST[]|ContainerItem[]|any, props: any)=>ReactElement
export type MarkdownerRTViewFunc = (content: string|MarkdownAST[]|ContainerItem[]|any, props: any)=>RTBase

