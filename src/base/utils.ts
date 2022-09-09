import {RUITag} from "@iandx/reactui/tag";
import {ReactUIBase} from "@iandx/reactui/core";
import {useRef} from "react";
// @ts-ignore latexStyles.js has no @types package
import * as latex from 'latex.js'

const regexKeywords = ["*", "+", "[", "]", "/", "(", ")", "\\", "^", "?", ":", "$"]

export function correctRegExpKeywords(tag: string | RegExp) {
    if (tag instanceof RegExp) {
        return tag.source
    }
    let newTag = ""
    for (let c of tag) {
        let newC = c
        if (regexKeywords.includes(c)) newC = `\\${c}`;
        newTag += newC
    }
    return newTag
}

export function exactRegExp(regexString: string) {
    return new RegExp("^(" + regexString + ")$", "g")
}
// ---- split with regexTag
export function flattened(array: any[]) {
    return array.reduce((accumulator:any, value:any) => accumulator.concat(value), [])
}

export function objectMap(obj: Object, func: Function) {
    let newObj = {}
    Object.keys(obj).forEach((key, idx) => {
        (newObj as any)[key] = func(key, (obj as any)[key], idx)
    });

    return newObj
}


export function objectValid(obj: Object | undefined | null) {
    return !!obj && Object.keys(obj).length>0
}

export function capturingRegExp(regexString: string, flag: string="g") {
    return new RegExp("("+regexString+")", flag)
}

export function isInstanceOf(obj: any, ...types: any[]) {
    for (let type of types) {
        if (Object.getPrototypeOf(obj) instanceof type || obj instanceof type) {
            return true
        }
    }
    return false
}


export function TextArea(value: string="", disabled=true) {
    return RUITag("textarea", value)
        .setProps({value, disabled})
}

export function percentageToDecimal(percent: string) {
    return parseFloat(percent) / 100;
}

export function objectPop(object: any, propertyName: string) {
    let temp = object[propertyName];
    delete object[propertyName];
    return temp;
}

export function IsFirstRender() {
    const ref = useRef(true);
    const firstRender = ref.current;
    ref.current = false;
    return firstRender;
}


export function objectEquals(obj1: any, obj2: any) {
    const equals = (a:any, b:any) => JSON.stringify(a) === JSON.stringify(b);

    const obj1Key = Object.keys(obj1).sort()
    const obj2Key = Object.keys(obj2).sort()

    if (!equals(obj1Key, obj2Key)) {
        return false
    }
    const results = obj1Key.map((item) => obj1[item] === obj2[item])
    return !results.includes(false)
}


export function getLatexJSHtmlGenerator() {
    let baseUrls = [
        "https://raw.githubusercontent.com/Ian-Dx/markdowner/master/src/.supports/latexStyles",
        "https://latex.js.org"
    ]
    let styleFileNames = ["article", "base", "book", "katex"]
    let styles = []
    for (let baseUrl of baseUrls) {
        for (let styleFileName of styleFileNames) {
            styles.push(`${baseUrl}/css/${styleFileName}.css`)
        }
    }

    return new latex.HtmlGenerator({
        hyphenate: false,
        styles
    })
}