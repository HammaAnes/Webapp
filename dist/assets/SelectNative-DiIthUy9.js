import{j as e}from"./form-vendor-CpHS4GVK.js";import{r as n}from"./react-vendor-DNnEzdvS.js";import{a0 as c}from"./ui-vendor-DeH81NTZ.js";const m=n.forwardRef(({label:r,error:a,icon:s,className:i="",required:l,children:o,...t},d)=>e.jsxs("div",{className:"w-full",children:[r&&e.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:[r,l&&e.jsx("span",{className:"text-red-500 ml-1",children:"*"})]}),e.jsxs("div",{className:"relative",children:[s&&e.jsx("div",{className:"absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",children:s}),e.jsx("select",{ref:d,className:`
              w-full px-4 py-3 ${s?"pl-11":""} pr-10
              bg-white border rounded-lg
              appearance-none cursor-pointer
              transition-all duration-200
              ${a?"border-red-500 focus:border-red-500 focus:ring-red-500":"border-gray-300 focus:border-accent focus:ring-accent"}
              focus:outline-none focus:ring-2 focus:ring-opacity-50
              disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
              ${i}
            `,"aria-invalid":a?"true":"false","aria-describedby":a?`${t.id}-error`:void 0,required:l,...t,children:o}),e.jsx(c,{className:"absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"})]}),a&&e.jsx("p",{id:`${t.id}-error`,className:"mt-2 text-sm text-red-600 flex items-center gap-1",children:a})]}));m.displayName="SelectNative";export{m as S};
