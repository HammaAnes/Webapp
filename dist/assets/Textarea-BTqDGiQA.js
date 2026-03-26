import{j as a}from"./form-vendor-CpHS4GVK.js";import{r as c}from"./react-vendor-DNnEzdvS.js";const n=c.forwardRef(({label:r,error:e,helperText:t,className:i="",required:d,...s},l)=>a.jsxs("div",{className:"w-full",children:[r&&a.jsxs("label",{className:"block text-sm font-medium text-gray-700 mb-2",children:[r,d&&a.jsx("span",{className:"text-red-500 ml-1",children:"*"})]}),a.jsx("textarea",{ref:l,className:`
            w-full px-4 py-3
            bg-white border rounded-lg
            transition-all duration-200
            resize-y min-h-[100px]
            ${e?"border-red-500 focus:border-red-500 focus:ring-red-500":"border-gray-300 focus:border-accent focus:ring-accent"}
            focus:outline-none focus:ring-2 focus:ring-opacity-50
            disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500
            ${i}
          `,"aria-invalid":e?"true":"false","aria-describedby":e?`${s.id}-error`:t?`${s.id}-helper`:void 0,required:d,...s}),t&&!e&&a.jsx("p",{id:`${s.id}-helper`,className:"mt-2 text-sm text-gray-600",children:t}),e&&a.jsx("p",{id:`${s.id}-error`,className:"mt-2 text-sm text-red-600 flex items-center gap-1",children:e})]}));n.displayName="Textarea";export{n as T};
