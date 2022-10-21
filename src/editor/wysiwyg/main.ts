// import {TagView, useRTState} from "@iandx/reactui";
// import {HStack} from "@iandx/reactui/component";
// import {Div} from "@iandx/reactui/tag";
// import {RTMarkdowner} from "../../base";
// import RichTextEditor from "./RichTextEditor";
//
// export function EditableMarkdowner() {
//     // benchmark()
//     let content = useRTState("")
//     return (
//         HStack(
//             TagView("textarea")()
//                 .onChange((e)=>{
//                     content.value = (e.target as any).value
//                 })
//                 .height("100%")
//                 .width("48%")
//                 .padding("20px")
//                 .outline("none")
//                 .border("1px solid gray"),
//
//             Div(
//                 // RichTextEditor()
//
//                 RTMarkdowner({content: content.value})
//                 // <ReactMarkdowner incrementalParse={true}>{content.value}</ReactMarkdowner>
//             )
//                 .height("100%")
//                 .width("48%")
//                 .padding("20px")
//                 .border("1px solid gray")
//                 .overflow("scroll")
//         )
//             .position("fixed")
//             .width("90%")
//             .height("90vh")
//             .padding("2vh 2%")
//
//     )
// }
export {}