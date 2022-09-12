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

export function flattened(array: any[]) {
    return array.reduce((accumulator:any, value:any) => accumulator.concat(value), [])
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

export function objectPop(object: any, propertyName: string) {
    let temp = object[propertyName];
    delete object[propertyName];
    return temp;
}


export function uid(length: number=6) {
    let result = '';
    let characters  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


export class Indexing {
    static letter(num: number) {
    let base = "abcdefghijklmnopqrstuvwxyz"
    let len = base.length
    let result = ""

    while (num !== 0) {
        result = base[num%len-1] + result
        num = Math.floor(num / len)
    }
    return result
}

    static romanNumeral(num: number) {
        let lookup: {[key:string]:number} = {M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1}
        let roman = ""
        for (let i in lookup) {
            while (num >= lookup[i]) {
                roman += i;
                num -= lookup[i];
            }
        }
        return roman
    }
}